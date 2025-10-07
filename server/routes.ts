import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertPushSubscriptionSchema,
  insertScheduledNotificationSchema,
  insertUserPreferencesSchema,
  insertSupportTicketSchema,
  insertBattleSchema,
  insertUserBadgeSchema,
  insertNotificationSchema,
  type InsertTask,
  type UserPreferences,
  type Battle,
  type Badge,
  type UserBadge,
  type Notification
} from "@shared/schema";
import { authenticateUser, validateUserId, requireAdmin, type AuthRequest } from "./shared/middleware/auth-middleware";
import { apiLimiter } from "./shared/middleware/rate-limit";
import admin from "firebase-admin";

// Simple input sanitization (trim whitespace)
function sanitizeInput(input: string): string {
  return input.trim();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply rate limiting to all API routes
  app.use("/api", apiLimiter);
  
  // ============ FEATURE 3: WEB PUSH NOTIFICATIONS ============
  
  // Subscribe to push notifications
  app.post("/api/push/subscribe", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertPushSubscriptionSchema.parse(req.body);
      
      if (validatedData.userId !== req.user!.uid) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      const subscription = await storage.addPushSubscription(validatedData);
      res.json(subscription);
    } catch (error) {
      console.error("Push subscription error:", error);
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Unsubscribe from push notifications
  app.delete("/api/push/subscribe", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const endpoint = req.query.endpoint as string;
      if (!endpoint) {
        return res.status(400).json({ error: "endpoint is required" });
      }
      await storage.removePushSubscription(userId, endpoint);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // Schedule a notification
  app.post("/api/notifications/schedule", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertScheduledNotificationSchema.parse(req.body);
      
      if (validatedData.userId !== req.user!.uid) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      if (validatedData.title) {
        validatedData.title = sanitizeInput(validatedData.title);
      }
      if (validatedData.body) {
        validatedData.body = sanitizeInput(validatedData.body);
      }
      
      const notification = await storage.addScheduledNotification(validatedData);
      res.json(notification);
    } catch (error) {
      console.error("Schedule notification error:", error);
      res.status(500).json({ error: "Failed to schedule notification" });
    }
  });

  // Get user's scheduled notifications
  app.get("/api/notifications/scheduled", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const notifications = await storage.getScheduledNotifications(userId);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Delete scheduled notification
  app.delete("/api/notifications/scheduled/:id", authenticateUser, async (req: AuthRequest, res) => {
    try {
      await storage.deleteScheduledNotification(req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  // ============ PRIVATE MESSAGING ROUTES ============
  
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

  // Support ticket endpoint
  app.post("/api/support/ticket", async (req, res) => {
    try {
      const validatedData = insertSupportTicketSchema.parse(req.body);
      
      // Sanitize inputs
      const sanitizedTicket = {
        ...validatedData,
        name: sanitizeInput(validatedData.name),
        subject: sanitizeInput(validatedData.subject),
        message: sanitizeInput(validatedData.message),
      };
      
      // Store ticket in Firebase
      const db = admin.database();
      const ticketRef = db.ref('supportTickets').push();
      const ticketId = ticketRef.key!;
      
      const ticket = {
        id: ticketId,
        ...sanitizedTicket,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      
      await ticketRef.set(ticket);
      
      res.status(201).json({ success: true, ticketId });
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(400).json({ error: "Failed to create support ticket" });
    }
  });

  // ============ NOTIFICATION SYSTEM ROUTES ============

  // Get all notifications for current user
  app.get("/api/notifications", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const db = admin.database();
      
      const snapshot = await db.ref('notifications')
        .orderByChild('userId')
        .equalTo(userId)
        .once('value');
      
      if (!snapshot.exists()) {
        return res.json([]);
      }
      
      const notifications = Object.values(snapshot.val())
        .map((notification: any) => ({
          ...notification,
          createdAt: new Date(notification.createdAt),
          readAt: notification.readAt ? new Date(notification.readAt) : undefined,
        }))
        .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
      
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { id } = req.params;
      const db = admin.database();
      
      const notificationRef = db.ref(`notifications/${id}`);
      const snapshot = await notificationRef.once('value');
      
      if (!snapshot.exists()) {
        return res.status(404).json({ error: "Notification not found" });
      }
      
      const notification = snapshot.val();
      
      // Verify ownership
      if (notification.userId !== userId) {
        return res.status(403).json({ error: "Unauthorized" });
      }
      
      await notificationRef.update({
        read: true,
        readAt: new Date().toISOString(),
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  // ============ BATTLE SYSTEM ROUTES ============

  // Create a new battle
  app.post("/api/battles", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const validatedData = insertBattleSchema.parse(req.body);
      
      // Validate custom challenge is provided when challenge type is custom
      if (validatedData.challengeType === 'custom' && (!validatedData.customChallenge || !validatedData.customChallenge.trim())) {
        return res.status(400).json({ error: "Custom challenge description is required for custom challenge type" });
      }
      
      // Sanitize custom challenge text
      if (validatedData.customChallenge) {
        validatedData.customChallenge = sanitizeInput(validatedData.customChallenge);
      }
      
      const db = admin.database();
      const battleRef = db.ref('battles').push();
      const battleId = battleRef.key!;
      
      const battle: Battle = {
        id: battleId,
        ...validatedData,
        scores: {},
        createdAt: new Date(),
      };
      
      // Initialize scores for all participants
      validatedData.participants.forEach(participantId => {
        battle.scores[participantId] = 0;
      });
      
      await battleRef.set({
        ...battle,
        createdAt: battle.createdAt.toISOString(),
      });
      
      // Create notifications for invited users (excluding creator)
      const invitedUsers = validatedData.participants.filter(id => id !== userId);
      const notificationPromises = invitedUsers.map(async (invitedUserId) => {
        const notificationRef = db.ref('notifications').push();
        const notification: Notification = {
          id: notificationRef.key!,
          userId: invitedUserId,
          type: 'battle_invite',
          title: 'Battle Challenge!',
          message: `${validatedData.participantNames[userId]} challenged you to a ${battle.challengeType.replace('_', ' ')} battle!`,
          relatedId: battleId,
          relatedData: {
            battleId,
            battleType: battle.type,
            challengeType: battle.challengeType,
            creatorId: userId,
            creatorName: validatedData.participantNames[userId],
          },
          read: false,
          actionUrl: `/battles`,
          createdAt: new Date(),
        };
        
        await notificationRef.set({
          ...notification,
          createdAt: notification.createdAt.toISOString(),
        });
      });
      
      await Promise.all(notificationPromises);
      
      res.status(201).json(battle);
    } catch (error) {
      console.error("Error creating battle:", error);
      res.status(400).json({ error: "Failed to create battle" });
    }
  });

  // Get all battles (user's battles)
  app.get("/api/battles", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const db = admin.database();
      
      const snapshot = await db.ref('battles').once('value');
      
      if (!snapshot.exists()) {
        return res.json([]);
      }
      
      const allBattles = snapshot.val();
      
      // Filter battles where user is a participant
      const userBattles = Object.values(allBattles)
        .filter((battle: any) => battle.participants.includes(userId))
        .map((battle: any) => ({
          ...battle,
          createdAt: new Date(battle.createdAt),
          completedAt: battle.completedAt ? new Date(battle.completedAt) : undefined,
        }))
        .sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
      
      res.json(userBattles);
    } catch (error) {
      console.error("Error fetching battles:", error);
      res.status(500).json({ error: "Failed to fetch battles" });
    }
  });

  // Get all active/public battles (for discovery)
  app.get("/api/battles/discover", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const db = admin.database();
      
      const snapshot = await db.ref('battles')
        .orderByChild('status')
        .equalTo('active')
        .once('value');
      
      if (!snapshot.exists()) {
        return res.json([]);
      }
      
      const allBattles = snapshot.val();
      
      // Filter out user's own battles and format data
      const discoverBattles = Object.values(allBattles)
        .filter((battle: any) => !battle.participants.includes(userId))
        .map((battle: any) => ({
          ...battle,
          createdAt: new Date(battle.createdAt),
        }))
        .slice(0, 20); // Limit to 20 battles
      
      res.json(discoverBattles);
    } catch (error) {
      console.error("Error fetching discover battles:", error);
      res.status(500).json({ error: "Failed to fetch battles" });
    }
  });

  // Get specific battle
  app.get("/api/battles/:battleId", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const { battleId } = req.params;
      const db = admin.database();
      
      const snapshot = await db.ref(`battles/${battleId}`).once('value');
      
      if (!snapshot.exists()) {
        return res.status(404).json({ error: "Battle not found" });
      }
      
      const battle = snapshot.val();
      
      res.json({
        ...battle,
        createdAt: new Date(battle.createdAt),
        completedAt: battle.completedAt ? new Date(battle.completedAt) : undefined,
      });
    } catch (error) {
      console.error("Error fetching battle:", error);
      res.status(500).json({ error: "Failed to fetch battle" });
    }
  });

  // Update battle score
  app.post("/api/battles/:battleId/score", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { battleId } = req.params;
      const { score } = req.body;
      
      if (typeof score !== 'number' || score < 0) {
        return res.status(400).json({ error: "Invalid score" });
      }
      
      const db = admin.database();
      const battleRef = db.ref(`battles/${battleId}`);
      
      const snapshot = await battleRef.once('value');
      
      if (!snapshot.exists()) {
        return res.status(404).json({ error: "Battle not found" });
      }
      
      const battle = snapshot.val();
      
      // Check if user is a participant
      if (!battle.participants.includes(userId)) {
        return res.status(403).json({ error: "Not a participant in this battle" });
      }
      
      // Update score
      await battleRef.child(`scores/${userId}`).set(score);
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating battle score:", error);
      res.status(500).json({ error: "Failed to update score" });
    }
  });

  // Complete a battle and determine winner
  app.post("/api/battles/:battleId/complete", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const { battleId } = req.params;
      const db = admin.database();
      const battleRef = db.ref(`battles/${battleId}`);
      
      const snapshot = await battleRef.once('value');
      
      if (!snapshot.exists()) {
        return res.status(404).json({ error: "Battle not found" });
      }
      
      const battle = snapshot.val();
      
      if (battle.status === 'completed') {
        return res.status(400).json({ error: "Battle already completed" });
      }
      
      // Determine winner (highest score)
      let winnerId = '';
      let highestScore = -1;
      
      Object.entries(battle.scores).forEach(([participantId, score]: [string, any]) => {
        if (score > highestScore) {
          highestScore = score;
          winnerId = participantId;
        }
      });
      
      // Update battle status
      await battleRef.update({
        status: 'completed',
        winnerId: winnerId,
        completedAt: new Date().toISOString(),
      });
      
      // Award first win badge if this is their first win
      if (winnerId) {
        const userBattlesSnapshot = await db.ref('battles')
          .orderByChild('winnerId')
          .equalTo(winnerId)
          .once('value');
        
        const wins = userBattlesSnapshot.numChildren();
        
        if (wins === 1) {
          // Award "First Victory" badge
          const badgeId = 'first_victory';
          const userBadgeRef = db.ref(`userBadges/${winnerId}_${badgeId}`);
          const badgeExists = (await userBadgeRef.once('value')).exists();
          
          if (!badgeExists) {
            await userBadgeRef.set({
              id: `${winnerId}_${badgeId}`,
              userId: winnerId,
              badgeId: badgeId,
              battleId: battleId,
              earnedAt: new Date().toISOString(),
            });
          }
        }
      }
      
      res.json({ success: true, winnerId });
    } catch (error) {
      console.error("Error completing battle:", error);
      res.status(500).json({ error: "Failed to complete battle" });
    }
  });

  // Accept battle invitation
  app.patch("/api/battles/:battleId/accept", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { battleId } = req.params;
      const db = admin.database();
      
      const battleRef = db.ref(`battles/${battleId}`);
      const snapshot = await battleRef.once('value');
      
      if (!snapshot.exists()) {
        return res.status(404).json({ error: "Battle not found" });
      }
      
      const battle = snapshot.val();
      
      // Security checks:
      // 1. Check if user is a participant
      if (!battle.participants.includes(userId)) {
        return res.status(403).json({ error: "Not a participant in this battle" });
      }
      
      // 2. Check if battle is in pending status
      if (battle.status !== 'pending') {
        return res.status(400).json({ error: "Battle is not pending" });
      }
      
      // 3. Check if user is NOT the creator (can't accept your own battle)
      if (battle.createdBy === userId) {
        return res.status(403).json({ error: "Cannot accept your own battle invitation" });
      }
      
      // Update battle status to active
      await battleRef.update({
        status: 'active',
      });
      
      // Create notification for battle creator
      const creatorId = battle.createdBy;
      if (creatorId !== userId) {
        const notificationRef = db.ref('notifications').push();
        const notification: Notification = {
          id: notificationRef.key!,
          userId: creatorId,
          type: 'battle_accepted',
          title: 'Battle Accepted!',
          message: `${battle.participantNames[userId]} accepted your battle challenge!`,
          relatedId: battleId,
          relatedData: {
            battleId,
            battleType: battle.type,
            challengeType: battle.challengeType,
            acceptedBy: userId,
            acceptedByName: battle.participantNames[userId],
          },
          read: false,
          actionUrl: `/battles`,
          createdAt: new Date(),
        };
        
        await notificationRef.set({
          ...notification,
          createdAt: notification.createdAt.toISOString(),
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error accepting battle:", error);
      res.status(500).json({ error: "Failed to accept battle" });
    }
  });

  // Decline battle invitation
  app.patch("/api/battles/:battleId/decline", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { battleId } = req.params;
      const db = admin.database();
      
      const battleRef = db.ref(`battles/${battleId}`);
      const snapshot = await battleRef.once('value');
      
      if (!snapshot.exists()) {
        return res.status(404).json({ error: "Battle not found" });
      }
      
      const battle = snapshot.val();
      
      // Security checks:
      // 1. Check if user is a participant
      if (!battle.participants.includes(userId)) {
        return res.status(403).json({ error: "Not a participant in this battle" });
      }
      
      // 2. Check if battle is in pending status
      if (battle.status !== 'pending') {
        return res.status(400).json({ error: "Battle is not pending" });
      }
      
      // 3. Check if user is NOT the creator (can't decline your own battle)
      if (battle.createdBy === userId) {
        return res.status(403).json({ error: "Cannot decline your own battle invitation" });
      }
      
      // Update battle status to cancelled
      await battleRef.update({
        status: 'cancelled',
      });
      
      // Create notification for battle creator
      const creatorId = battle.createdBy;
      if (creatorId !== userId) {
        const notificationRef = db.ref('notifications').push();
        const notification: Notification = {
          id: notificationRef.key!,
          userId: creatorId,
          type: 'battle_declined',
          title: 'Battle Declined',
          message: `${battle.participantNames[userId]} declined your battle challenge.`,
          relatedId: battleId,
          relatedData: {
            battleId,
            battleType: battle.type,
            challengeType: battle.challengeType,
            declinedBy: userId,
            declinedByName: battle.participantNames[userId],
          },
          read: false,
          actionUrl: `/battles`,
          createdAt: new Date(),
        };
        
        await notificationRef.set({
          ...notification,
          createdAt: notification.createdAt.toISOString(),
        });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error declining battle:", error);
      res.status(500).json({ error: "Failed to decline battle" });
    }
  });

  // Matchmaking - suggest opponents based on similar stats
  app.post("/api/battles/matchmaking", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { battleType } = req.body; // "1v1" or "group"
      
      const db = admin.database();
      
      // Get current user's stats
      const userSnapshot = await db.ref(`users/${userId}`).once('value');
      const userData = userSnapshot.val();
      
      // Get all users
      const allUsersSnapshot = await db.ref('users').once('value');
      const allUsers = allUsersSnapshot.val();
      
      // Get user's battle history
      const battlesSnapshot = await db.ref('battles').once('value');
      const allBattles = battlesSnapshot.exists() ? Object.values(battlesSnapshot.val()) : [];
      
      const userBattles = allBattles.filter((b: any) => 
        b.participants.includes(userId)
      );
      
      const userWins = allBattles.filter((b: any) => b.winnerId === userId).length;
      
      const userStats = {
        streak: userData?.streak || 0,
        totalDays: userData?.totalDays || 0,
        wins: userWins,
        totalBattles: userBattles.length,
        winRate: userBattles.length > 0 ? (userWins / userBattles.length * 100) : 0,
      };
      
      // Filter potential opponents (exclude current user)
      const potentialOpponents = Object.entries(allUsers)
        .filter(([uid]) => uid !== userId)
        .map(([uid, data]: [string, any]) => {
          const opponentBattles = allBattles.filter((b: any) => 
            b.participants.includes(uid)
          );
          const opponentWins = allBattles.filter((b: any) => b.winnerId === uid).length;
          
          return {
            id: uid,
            email: data.email,
            streak: data.streak || 0,
            totalDays: data.totalDays || 0,
            wins: opponentWins,
            totalBattles: opponentBattles.length,
            winRate: opponentBattles.length > 0 ? (opponentWins / opponentBattles.length * 100) : 0,
          };
        });
      
      // Simple matchmaking: find opponents with similar stats
      const suggestions = potentialOpponents
        .sort((a, b) => {
          // Calculate similarity score (lower is better)
          const aStreakDiff = Math.abs(a.streak - userStats.streak);
          const bStreakDiff = Math.abs(b.streak - userStats.streak);
          const aWinRateDiff = Math.abs(a.winRate - userStats.winRate);
          const bWinRateDiff = Math.abs(b.winRate - userStats.winRate);
          const aTotalDaysDiff = Math.abs(a.totalDays - userStats.totalDays);
          const bTotalDaysDiff = Math.abs(b.totalDays - userStats.totalDays);
          
          const aScore = aStreakDiff + (aWinRateDiff / 10) + (aTotalDaysDiff / 5);
          const bScore = bStreakDiff + (bWinRateDiff / 10) + (bTotalDaysDiff / 5);
          
          return aScore - bScore;
        })
        .slice(0, 5); // Top 5 matches
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error in matchmaking:", error);
      res.status(500).json({ error: "Failed to generate matchmaking suggestions" });
    }
  });

  // Get user's badges
  app.get("/api/badges/user", authenticateUser, validateUserId, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const db = admin.database();
      
      const snapshot = await db.ref('userBadges')
        .orderByChild('userId')
        .equalTo(userId)
        .once('value');
      
      if (!snapshot.exists()) {
        return res.json([]);
      }
      
      const userBadges = Object.values(snapshot.val()).map((badge: any) => ({
        ...badge,
        earnedAt: new Date(badge.earnedAt),
      }));
      
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // Get all available badges
  app.get("/api/badges", async (req, res) => {
    try {
      const db = admin.database();
      
      const snapshot = await db.ref('badges').once('value');
      
      if (!snapshot.exists()) {
        // Initialize default badges if none exist
        const defaultBadges: Partial<Badge>[] = [
          { id: 'first_victory', name: 'First Victory', description: 'Won your first battle', icon: '🏆', rarity: 'common', category: 'battle', requirementType: 'first_win', requirementValue: 1 },
          { id: 'battle_novice', name: 'Battle Novice', description: 'Participated in 5 battles', icon: '⚔️', rarity: 'common', category: 'battle', requirementType: 'total_battles', requirementValue: 5 },
          { id: 'battle_veteran', name: 'Battle Veteran', description: 'Participated in 25 battles', icon: '🛡️', rarity: 'rare', category: 'battle', requirementType: 'total_battles', requirementValue: 25 },
          { id: 'win_streak_5', name: 'Winning Streak', description: 'Won 5 battles in a row', icon: '🔥', rarity: 'rare', category: 'battle', requirementType: 'win_streak', requirementValue: 5 },
          { id: 'champion', name: 'Champion', description: 'Won 10 battles', icon: '👑', rarity: 'epic', category: 'battle', requirementType: 'total_wins', requirementValue: 10 },
          { id: 'legend', name: 'Legend', description: 'Won 50 battles', icon: '💎', rarity: 'legendary', category: 'battle', requirementType: 'total_wins', requirementValue: 50 },
          { id: 'focus_master', name: 'Focus Master', description: 'Won a focus time battle', icon: '🎯', rarity: 'rare', category: 'focus', requirementType: 'focus_battle_win', requirementValue: 1 },
          { id: 'habit_warrior', name: 'Habit Warrior', description: 'Won a habit streak battle', icon: '💪', rarity: 'rare', category: 'habit', requirementType: 'habit_battle_win', requirementValue: 1 },
        ];
        
        // Store default badges
        const badgesRef = db.ref('badges');
        for (const badge of defaultBadges) {
          await badgesRef.child(badge.id!).set({
            ...badge,
            createdAt: new Date().toISOString(),
          });
        }
        
        return res.json(defaultBadges);
      }
      
      const badges = Object.values(snapshot.val());
      res.json(badges);
    } catch (error) {
      console.error("Error fetching badges:", error);
      res.status(500).json({ error: "Failed to fetch badges" });
    }
  });

  // ============ AI ASSISTANT ROUTES ============
  
  // Send message to AI assistant
  app.post("/api/ai/chat", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { message } = req.body;
      
      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }
      
      // Get user context (recent tasks, habits, streaks)
      const db = admin.database();
      const [userSnapshot, tasksSnapshot, habitsSnapshot, aiSettingsSnapshot] = await Promise.all([
        db.ref(`users/${userId}`).once('value'),
        db.ref('tasks').orderByChild('userId').equalTo(userId).limitToLast(10).once('value'),
        db.ref('habits').orderByChild('userId').equalTo(userId).once('value'),
        db.ref(`aiSettings/${userId}`).once('value'),
      ]);
      
      const user = userSnapshot.val();
      const tasks = tasksSnapshot.val() ? Object.values(tasksSnapshot.val()) : [];
      const habits = habitsSnapshot.val() ? Object.values(habitsSnapshot.val()) : [];
      const aiSettings = aiSettingsSnapshot.val() || { personality: 'friendly', enableTaskSuggestions: true };
      
      // Build personality-based system prompt
      const personalityPrompts: Record<string, string> = {
        professional: "You are a professional productivity assistant. Be clear, concise, and focus on efficiency and results.",
        friendly: "You are a friendly productivity assistant. Be warm, encouraging, and conversational while helping users achieve their goals.",
        motivating: "You are an enthusiastic motivational coach. Be energetic, positive, and inspire users to push beyond their limits.",
        coach: "You are a personal coach. Ask insightful questions, provide guidance, and help users discover their own solutions."
      };
      
      const systemPrompt = aiSettings.customSystemPrompt || `${personalityPrompts[aiSettings.personality] || personalityPrompts['friendly']}

You are The Circle's AI productivity assistant powered by DeepSeek. You help users:
- Plan their day and create tasks
- Track and improve their productivity habits
- Stay motivated with their goals
- Manage their focus and time effectively
- Provide accountability and encouragement

User Context:
- Current streak: ${user?.streak || 0} days
- Total productive days: ${user?.totalDays || 0}
- Recent tasks: ${tasks.length} tasks tracked
- Active habits: ${habits.filter((h: any) => h.isActive).length}

Smart Command Recognition - Detect these user intents:
1. "Discuss the day" / "Plan my day" → Ask about their priorities, energy levels, available time, then suggest tasks
2. "Check my productivity" / "How am I doing" → Review their streak, tasks completed, and provide insights
3. "Create tasks for [topic]" → Generate relevant tasks for that topic
4. "I need motivation" → Provide personalized encouragement based on their progress
5. "What should I focus on" → Help prioritize based on their current situation

When Discussing the Day:
- Ask about their main goal for the day
- Inquire about their energy level and available time
- Understand their priorities (work, personal, health, learning)
- Ask if they have any deadlines or time-sensitive items
- Create 3-5 specific, actionable tasks based on their responses
- Suggest time estimates for each task

Productivity Check-ins:
- Review their current streak: ${user?.streak || 0} days
- Acknowledge their total productive days: ${user?.totalDays || 0}
- Ask how they're feeling about their progress
- Identify patterns in their productivity
- Suggest areas for improvement
- Celebrate wins, no matter how small

Task Creation Guidelines:
1. When suggesting tasks, ALWAYS ask for confirmation before creating them
2. Format task suggestions using this special format for the system to detect:
   [TASK_SUGGESTIONS]
   {"tasks": [{"title": "Task name", "timeEstimate": "30 minutes", "category": "work", "priority": "high", "description": "Optional details"}]}
   [/TASK_SUGGESTIONS]
   Then continue with your conversational message asking for confirmation
3. Make tasks specific and actionable (not vague like "work on project")
4. Include realistic time estimates
5. Categories: work, personal, health, learning, other
6. Priorities: low, medium, high

Proactive Behavior:
- Every 3-4 exchanges, ask about their progress or how they're feeling
- If they mention feeling stuck, offer specific strategies
- If they have a good streak, encourage them to keep it going
- If their streak broke, help them restart without judgment
- Suggest taking breaks when appropriate
- Ask about obstacles they're facing

Be conversational, empathetic, and provide actionable advice. Remember previous context in the conversation.`;

      // Get recent chat history
      const chatHistorySnapshot = await db.ref('aiChatMessages')
        .orderByChild('userId')
        .equalTo(userId)
        .limitToLast(20)
        .once('value');
      
      const chatHistory = chatHistorySnapshot.val() 
        ? Object.values(chatHistorySnapshot.val()).map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }))
        : [];
      
      // Call DeepSeek API
      if (!process.env.DEEPSEEK_API_KEY) {
        console.error("DEEPSEEK_API_KEY is not set");
        return res.status(500).json({ 
          error: "DeepSeek API is not configured",
          details: "API key is missing"
        });
      }

      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: 'https://api.deepseek.com'
      });
      
      const completion = await openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          ...chatHistory,
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      const aiResponse = completion.choices[0].message.content || "";
      
      // Parse task suggestions if present
      let taskSuggestions = null;
      let cleanedResponse = aiResponse;
      
      const taskSuggestionsMatch = aiResponse.match(/\[TASK_SUGGESTIONS\]([\s\S]*?)\[\/TASK_SUGGESTIONS\]/);
      if (taskSuggestionsMatch) {
        try {
          taskSuggestions = JSON.parse(taskSuggestionsMatch[1].trim());
          // Remove the task suggestions block from the displayed message
          cleanedResponse = aiResponse.replace(/\[TASK_SUGGESTIONS\][\s\S]*?\[\/TASK_SUGGESTIONS\]/, '').trim();
        } catch (e) {
          console.error("Failed to parse task suggestions:", e);
        }
      }
      
      // Save both messages to Firebase
      const userMessageRef = db.ref('aiChatMessages').push();
      await userMessageRef.set({
        id: userMessageRef.key,
        userId,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString()
      });
      
      const assistantMessageRef = db.ref('aiChatMessages').push();
      await assistantMessageRef.set({
        id: assistantMessageRef.key,
        userId,
        role: 'assistant',
        content: cleanedResponse,
        taskSuggestions: taskSuggestions || null,
        createdAt: new Date().toISOString()
      });
      
      res.json({ 
        message: cleanedResponse,
        taskSuggestions: taskSuggestions
      });
    } catch (error: any) {
      console.error("AI chat error:", error);
      console.error("Error details:", {
        message: error.message,
        name: error.name,
        stack: error.stack,
        response: error.response?.data
      });
      res.status(500).json({ 
        error: "Failed to get AI response",
        details: error.message || "Unknown error"
      });
    }
  });
  
  // Get AI chat history
  app.get("/api/ai/messages", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const db = admin.database();
      
      const snapshot = await db.ref('aiChatMessages')
        .orderByChild('userId')
        .equalTo(userId)
        .once('value');
      
      if (!snapshot.exists()) {
        return res.json([]);
      }
      
      const messages = Object.values(snapshot.val())
        .map((msg: any) => ({
          ...msg,
          createdAt: new Date(msg.createdAt)
        }))
        .sort((a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime());
      
      res.json(messages);
    } catch (error) {
      console.error("Error fetching AI messages:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  
  // Get AI settings
  app.get("/api/ai/settings", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const db = admin.database();
      
      const snapshot = await db.ref(`aiSettings/${userId}`).once('value');
      
      if (!snapshot.exists()) {
        // Return default settings
        const defaultSettings = {
          id: userId,
          userId,
          personality: 'friendly',
          enableTaskSuggestions: true,
          enableProductivityCheckins: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        return res.json(defaultSettings);
      }
      
      const settings = {
        ...snapshot.val(),
        createdAt: new Date(snapshot.val().createdAt),
        updatedAt: new Date(snapshot.val().updatedAt)
      };
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching AI settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });
  
  // Update AI settings
  app.put("/api/ai/settings", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      const { personality, customSystemPrompt, enableTaskSuggestions, enableProductivityCheckins } = req.body;
      
      const db = admin.database();
      const settingsRef = db.ref(`aiSettings/${userId}`);
      
      const settings = {
        id: userId,
        userId,
        personality: personality || 'friendly',
        customSystemPrompt: customSystemPrompt || null,
        enableTaskSuggestions: enableTaskSuggestions !== undefined ? enableTaskSuggestions : true,
        enableProductivityCheckins: enableProductivityCheckins !== undefined ? enableProductivityCheckins : true,
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      await settingsRef.set(settings);
      
      res.json({
        ...settings,
        createdAt: new Date(settings.createdAt),
        updatedAt: new Date(settings.updatedAt)
      });
    } catch (error) {
      console.error("Error updating AI settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });
  
  // Create tasks from AI suggestions (after user confirmation)
  app.post("/api/ai/create-tasks", authenticateUser, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.uid;
      
      // Validate request body
      const { aiTaskSuggestionsArraySchema } = await import("@shared/schema");
      const validation = aiTaskSuggestionsArraySchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Invalid task data", 
          details: validation.error.errors 
        });
      }
      
      const { tasks } = validation.data;
      const db = admin.database();
      const createdTasks = [];
      
      // Create each task
      for (const task of tasks) {
        const taskRef = db.ref('tasks').push();
        const taskData = {
          id: taskRef.key,
          userId,
          title: task.title,
          description: task.description || '',
          status: 'pending',
          category: task.category || 'other',
          priority: task.priority || 'medium',
          timeEstimate: task.timeEstimate || null,
          dueDate: task.dueDate || null,
          createdAt: new Date().toISOString(),
          completedAt: null,
          source: 'ai_assistant'
        };
        
        await taskRef.set(taskData);
        createdTasks.push(taskData);
      }
      
      res.json({ tasks: createdTasks });
    } catch (error) {
      console.error("Error creating tasks:", error);
      res.status(500).json({ error: "Failed to create tasks" });
    }
  });

  // Register admin routes
  const { registerAdminRoutes } = await import("./admin-routes");
  registerAdminRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
