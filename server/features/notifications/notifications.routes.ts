import type { Express } from "express";
import { storage } from "../../storage";
import { 
  insertPushSubscriptionSchema,
  insertScheduledNotificationSchema,
  type Notification
} from "@shared/schema";
import { authenticateUser, validateUserId, type AuthRequest } from "../../shared/middleware/auth-middleware";
import admin from "firebase-admin";

// Simple input sanitization (trim whitespace)
function sanitizeInput(input: string): string {
  return input.trim();
}

export function registerNotificationRoutes(app: Express) {
  // ============ PUSH NOTIFICATIONS ============
  
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

  // ============ IN-APP NOTIFICATIONS ============

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
}
