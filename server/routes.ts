import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import passport from "passport";
import { insertUserSchema, insertCircleSchema, insertMessageSchema } from "@shared/schema";
import { WebSocketServer } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
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
      res.json({ message: "Joined successfully" });
    } catch (error: any) {
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

  const httpServer = createServer(app);

  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  wss.on("connection", (ws, req) => {
    console.log("WebSocket client connected");

    ws.on("message", async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.type === "chat") {
          const newMessage = await storage.createMessage({
            circleId: message.circleId,
            userId: message.userId,
            content: message.content,
          });

          wss.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(JSON.stringify({
                type: "chat",
                message: newMessage,
              }));
            }
          });
        }
      } catch (error) {
        console.error("WebSocket error:", error);
      }
    });

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  return httpServer;
}
