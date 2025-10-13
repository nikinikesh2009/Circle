import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, requireAuth } from "./auth";
import passport from "passport";
import { insertUserSchema, insertCircleSchema, insertMessageSchema } from "@shared/schema";
import { WebSocketServer } from "ws";
import type { Store } from "express-session";

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

  interface AuthenticatedWebSocket extends WebSocket {
    userId?: string;
    circleIds?: Set<string>;
  }

  async function refreshClientCircles(client: AuthenticatedWebSocket) {
    if (!client.userId) return;
    const userCircles = await storage.getUserCircles(client.userId);
    client.circleIds = new Set(userCircles.map(c => c.id));
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
