import { Request, Response, NextFunction } from "express";
import admin from "firebase-admin";

// Initialize Firebase Admin SDK if not already initialized
try {
  if (admin.apps.length === 0) {
    // For Replit environment, we use the Firebase client config but on server side
    // In production, you should use Firebase Admin SDK with service account
    admin.initializeApp({
      projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
    });
  }
} catch (error) {
  console.error("Firebase Admin initialization error:", error);
}

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email?: string;
  };
}

export async function authenticateUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const token = authHeader.split("Bearer ")[1];
    
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
      };
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

// Middleware to validate userId matches authenticated user
export function validateUserId(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const userIdFromBody = req.body?.userId;
  const userIdFromQuery = req.query?.userId as string;
  const userIdFromParams = req.params?.userId;
  
  const userId = userIdFromBody || userIdFromQuery || userIdFromParams;
  
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  if (userId !== req.user.uid) {
    return res.status(403).json({ error: "Unauthorized: Cannot access other users' data" });
  }
  
  next();
}

// Admin-only middleware
export async function requireAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  
  // Check if user is admin in database
  try {
    const { db } = await import("./db");
    const { admins } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.id, req.user.uid))
      .limit(1);
    
    if (!admin || !admin.isActive) {
      return res.status(403).json({ error: "Admin access required" });
    }
    
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({ error: "Failed to verify admin status" });
  }
}
