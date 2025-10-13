import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import passport from "passport";
import { insertUserSchema, insertCircleSchema, insertMessageSchema } from "@shared/schema";
import { WebSocketServer, WebSocket } from "ws";
import type { Store } from "express-session";
import OpenAI from "openai";
import { z } from "zod";

export async function registerRoutes(app: Express, sessionStore: Store): Promise<Server> {
  setupAuth(app);

  app.post("/api/auth/signup", async (req, res, next) => {
    try {
      const result = insertUserSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error });
      }

      const existingEmail = await storage.getUserByEmail(result.data.email);
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      const existingUsername = await storage.getUserByUsername(result.data.username);
      if (existingUsername) {
        return res.status(400).json({ error: "Username already taken" });
      }

      const user = await storage.createUser(result.data);
      
      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: Express.User, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info?.message || "Login failed" });

      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const { password, ...userWithoutPassword } = user as any;
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  app.get("/api/circles", requireAuth, async (req, res) => {
    try {
      const circles = await storage.getCircles();
      res.json(circles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/circles/my", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const circles = await storage.getUserCircles(userId);
      res.json(circles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/circles", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const result = insertCircleSchema.safeParse({ ...req.body, createdBy: userId });
      
      if (!result.success) {
        return res.status(400).json({ error: "Invalid input", details: result.error });
      }

      const circle = await storage.createCircle(result.data);
      res.json(circle);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/circles/:id/join", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const circleId = req.params.id;

      const circle = await storage.getCircle(circleId);
      if (!circle) {
        return res.status(404).json({ error: "Circle not found" });
      }

      const isMember = await storage.isCircleMember(circleId, userId);
      if (isMember) {
        return res.status(400).json({ error: "Already a member" });
      }

      await storage.joinCircle({ circleId, userId });
      
      const user = await storage.getUser(userId);
      await createAndBroadcastNotification({
        userId: circle.createdBy,
        type: "circle_join",
        title: "New Member",
        message: `${user?.name} joined ${circle.name}`,
        link: `/chat/${circleId}`,
      });

      res.json({ message: "Joined successfully" });
    } catch (error: any) {
      console.error("Join circle error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/circles/:id/leave", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const circleId = req.params.id;

      await storage.leaveCircle(circleId, userId);
      res.json({ message: "Left successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/circles/:id/messages", requireAuth, async (req, res) => {
    try {
      const circleId = req.params.id;
      const userId = (req.user as any).id;

      const isMember = await storage.isCircleMember(circleId, userId);
      if (!isMember) {
        return res.status(403).json({ error: "Not a member of this circle" });
      }

      const messages = await storage.getCircleMessages(circleId);
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/messages/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const messageId = req.params.id;
      const { content } = req.body;

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ error: "Content is required" });
      }

      await storage.editMessage(messageId, userId, content);
      res.json({ success: true, message: "Message updated" });
    } catch (error: any) {
      console.error("Edit message error:", error);
      res.status(500).json({ error: "Failed to edit message" });
    }
  });

  app.delete("/api/messages/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const messageId = req.params.id;

      await storage.deleteMessage(messageId, userId);
      res.json({ success: true, message: "Message deleted" });
    } catch (error: any) {
      console.error("Delete message error:", error);
      res.status(500).json({ error: "Failed to delete message" });
    }
  });

  app.post("/api/messages/:id/reactions", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const messageId = req.params.id;
      const { emoji } = req.body;

      if (!emoji) {
        return res.status(400).json({ error: "Emoji is required" });
      }

      const reaction = await storage.addReaction({ messageId, userId, emoji });
      res.json(reaction);
    } catch (error: any) {
      console.error("Add reaction error:", error);
      res.status(500).json({ error: "Failed to add reaction" });
    }
  });

  app.delete("/api/messages/:id/reactions/:emoji", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const messageId = req.params.id;
      const emoji = req.params.emoji;

      await storage.removeReaction(messageId, userId, emoji);
      res.json({ success: true, message: "Reaction removed" });
    } catch (error: any) {
      console.error("Remove reaction error:", error);
      res.status(500).json({ error: "Failed to remove reaction" });
    }
  });

  app.get("/api/messages/:id/reactions", requireAuth, async (req, res) => {
    try {
      const messageId = req.params.id;
      const reactions = await storage.getMessageReactions(messageId);
      res.json(reactions);
    } catch (error: any) {
      console.error("Get reactions error:", error);
      res.status(500).json({ error: "Failed to get reactions" });
    }
  });

  // This is using Replit's AI Integrations service for OpenAI-compatible API access
  const openai = new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY
  });

  const chatMessageSchema = z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1).max(10000),
  });

  const chatRequestSchema = z.object({
    messages: z.array(chatMessageSchema).min(1).max(50),
  });

  const userRequestCounts = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT = 20;
  const RATE_WINDOW = 60000;

  app.post("/api/ai/chat", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      
      const now = Date.now();
      const userLimit = userRequestCounts.get(userId);
      
      if (userLimit) {
        if (now < userLimit.resetTime) {
          if (userLimit.count >= RATE_LIMIT) {
            return res.status(429).json({ error: "Too many requests. Please try again later." });
          }
          userLimit.count++;
        } else {
          userRequestCounts.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
        }
      } else {
        userRequestCounts.set(userId, { count: 1, resetTime: now + RATE_WINDOW });
      }

      const result = chatRequestSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid request", details: result.error });
      }

      const { messages } = result.data;
      const trimmedMessages = messages.slice(-20);

      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant for Circle, a social communities platform. Help users with their questions about their circles, provide suggestions, and engage in meaningful conversations. Be friendly, concise, and helpful."
          },
          ...trimmedMessages
        ],
        max_completion_tokens: 8192,
      });

      res.json({
        message: completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.",
        usage: completion.usage
      });
    } catch (error: any) {
      console.error("AI chat error:", error);
      res.status(500).json({ error: "An error occurred while processing your request. Please try again." });
    }
  });

  // Note: Rate limiter is in-memory and resets on server restart.
  // For production horizontal scaling, replace with Redis or similar shared store.

  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error: any) {
      console.error("Get notifications error:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/unread-count", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error: any) {
      console.error("Get unread count error:", error);
      res.status(500).json({ error: "Failed to fetch unread count" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      await storage.markNotificationAsRead(req.params.id, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Mark as read error:", error);
      res.status(500).json({ error: "Failed to mark notification as read" });
    }
  });

  app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Mark all as read error:", error);
      res.status(500).json({ error: "Failed to mark all notifications as read" });
    }
  });

  app.delete("/api/notifications/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      await storage.deleteNotification(req.params.id, userId);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Delete notification error:", error);
      res.status(500).json({ error: "Failed to delete notification" });
    }
  });

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  interface AuthenticatedWebSocket extends WebSocket {
    userId?: string;
    circleIds?: Set<string>;
  }

  async function refreshClientCircles(client: AuthenticatedWebSocket) {
    if (!client.userId) return;
    const userCircles = await storage.getUserCircles(client.userId);
    client.circleIds = new Set(userCircles.map(c => c.id));
  }

  async function broadcastNotification(userId: string, notification: any) {
    for (const client of wss.clients as Set<AuthenticatedWebSocket>) {
      if (client.readyState === WebSocket.OPEN && client.userId === userId) {
        client.send(JSON.stringify({
          type: "notification",
          data: notification
        }));
      }
    }
  }

  async function createAndBroadcastNotification(notification: { userId: string; type: string; title: string; message: string; link?: string }) {
    const newNotification = await storage.createNotification(notification);
    await broadcastNotification(notification.userId, newNotification);
    return newNotification;
  }

  wss.on("connection", async (ws: AuthenticatedWebSocket, req) => {
    console.log("WebSocket client connected");
    
    const cookies = req.headers.cookie;
    let userId: string | null = null;

    if (cookies) {
      const sessionCookie = cookies.split(';').find(c => c.trim().startsWith('connect.sid='));
      if (sessionCookie) {
        try {
          const sessionIdRaw = decodeURIComponent(sessionCookie.split('=')[1]);
          const sessionId = sessionIdRaw.startsWith('s:') ? sessionIdRaw.slice(2).split('.')[0] : sessionIdRaw;
          
          userId = await new Promise((resolve) => {
            sessionStore.get(sessionId, (err: any, session: any) => {
              if (!err && session?.passport?.user) {
                resolve(session.passport.user);
              } else {
                resolve(null);
              }
            });
          });
        } catch (error) {
          console.error("Session validation error:", error);
        }
      }
    }

    if (!userId) {
      ws.close(1008, "Authentication required");
      return;
    }

    ws.userId = userId;
    await refreshClientCircles(ws);

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "chat") {
          const isSenderMember = await storage.isCircleMember(message.circleId, userId as string);
          if (!isSenderMember) {
            await refreshClientCircles(ws);
            ws.send(JSON.stringify({ type: "error", error: "Not a member of this circle" }));
            return;
          }

          const newMessage = await storage.createMessage({
            circleId: message.circleId,
            userId: userId as string,
            content: message.content,
          });

          for (const client of wss.clients as Set<AuthenticatedWebSocket>) {
            if (client.readyState === WebSocket.OPEN && client.circleIds?.has(newMessage.circleId) && client.userId) {
              const isStillMember = await storage.isCircleMember(newMessage.circleId, client.userId);
              if (isStillMember) {
                client.send(JSON.stringify({
                  type: "chat",
                  message: newMessage,
                }));
              } else {
                await refreshClientCircles(client);
              }
            }
          }
        } else if (message.type === "refresh_circles") {
          await refreshClientCircles(ws);
          ws.send(JSON.stringify({ type: "circles_refreshed" }));
        }
      } catch (error) {
        console.error("WebSocket error:", error);
        ws.send(JSON.stringify({ type: "error", error: "Internal server error" }));
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  return httpServer;
}
