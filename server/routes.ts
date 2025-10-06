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
import { authenticateUser, validateUserId, requireAdmin, type AuthRequest } from "./auth-middleware";
import { apiLimiter } from "./rate-limit";
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
      
      // Check if user is a participant
      if (!battle.participants.includes(userId)) {
        return res.status(403).json({ error: "Not a participant in this battle" });
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
      
      // Check if user is a participant
      if (!battle.participants.includes(userId)) {
        return res.status(403).json({ error: "Not a participant in this battle" });
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

  // Register admin routes
  const { registerAdminRoutes } = await import("./admin-routes");
  registerAdminRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
