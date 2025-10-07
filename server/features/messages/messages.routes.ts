import type { Express } from "express";
import { storage } from "../../storage";
import { authenticateUser, type AuthRequest } from "../../shared/middleware/auth-middleware";
import admin from "firebase-admin";

// Simple input sanitization (trim whitespace)
function sanitizeInput(input: string): string {
  return input.trim();
}

export function registerMessageRoutes(app: Express) {
  // Get recent conversations
  app.get("/api/private-messages/conversations", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const conversations = await storage.getRecentConversations(userId);
      
      // Get user data from Firebase Admin for each conversation
      const db = admin.database();
      
      const conversationsWithUsers = await Promise.all(conversations.map(async (conv) => {
        try {
          const snapshot = await db.ref(`users/${conv.otherUserId}`).once('value');
          const userData = snapshot.val();
          
          return {
            ...conv,
            otherUser: userData ? {
              id: conv.otherUserId,
              email: userData.email || '',
            } : { id: conv.otherUserId, email: 'Unknown User' }
          };
        } catch (err) {
          console.error("Error fetching user data:", err);
          return {
            ...conv,
            otherUser: { id: conv.otherUserId, email: 'Unknown User' }
          };
        }
      }));
      
      res.json(conversationsWithUsers);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });
  
  // Get conversation with a specific user
  app.get("/api/private-messages/:otherUserId", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { otherUserId } = req.params;
      
      const messages = await storage.getConversation(userId, otherUserId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ error: "Failed to fetch conversation" });
    }
  });
  
  // Send a private message
  app.post("/api/private-messages", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { receiverId, content } = req.body;
      
      if (!receiverId || !content) {
        return res.status(400).json({ error: "receiverId and content are required" });
      }
      
      // Sanitize content
      const sanitizedContent = sanitizeInput(content);
      
      const message = await storage.sendPrivateMessage({
        senderId: userId,
        receiverId,
        content: sanitizedContent
      });
      
      res.json(message);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  
  // Mark message as read
  app.put("/api/private-messages/:messageId/read", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { messageId } = req.params;
      
      // Get all user's conversations to verify message ownership
      const conversations = await storage.getRecentConversations(userId);
      const allMessages = await Promise.all(
        conversations.map(c => storage.getConversation(userId, c.otherUserId))
      ).then(results => results.flat());
      
      const message = allMessages.find(m => m.id === messageId);
      if (!message || message.receiverId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      await storage.markMessageAsRead(messageId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ error: "Failed to mark message as read" });
    }
  });
  
  // Search for users
  app.get("/api/users/search", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const { query } = req.query;
      const currentUserId = req.user!.uid;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      // Use Firebase Admin SDK
      const db = admin.database();
      
      // Get all users from Firebase
      const snapshot = await db.ref('users').once('value');
      
      if (!snapshot.exists()) {
        return res.json([]);
      }
      
      const allUsers = snapshot.val();
      const searchQuery = (query as string).toLowerCase();
      
      // Filter users by email
      const matchingUsers = Object.entries(allUsers)
        .filter(([userId, userData]: [string, any]) => {
          return userId !== currentUserId && 
                 userData.email && 
                 userData.email.toLowerCase().includes(searchQuery);
        })
        .map(([userId, userData]: [string, any]) => ({
          id: userId,
          email: userData.email
        }))
        .slice(0, 10); // Limit to 10 results
      
      res.json(matchingUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Failed to search users" });
    }
  });
}
