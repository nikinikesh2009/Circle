import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { db } from "./db";
import { admins } from "@shared/schema";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || "change-this-in-production-to-a-secure-secret-key-at-least-32-characters-long";

export interface AdminAuthRequest extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
  };
}

// Middleware to verify admin JWT token
export async function authenticateAdmin(
  req: AdminAuthRequest,
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
      const decoded = jwt.verify(token, JWT_SECRET) as { adminId: string };
      
      // Verify admin still exists and is active
      const [admin] = await db
        .select()
        .from(admins)
        .where(eq(admins.id, decoded.adminId))
        .limit(1);
      
      if (!admin) {
        return res.status(401).json({ error: "Admin not found" });
      }
      
      if (!admin.isActive) {
        return res.status(403).json({ error: "Admin account is deactivated" });
      }
      
      req.admin = {
        id: admin.id,
        email: admin.email,
        role: admin.role,
      };
      
      next();
    } catch (error) {
      console.error("Token verification error:", error);
      return res.status(401).json({ error: "Invalid or expired token" });
    }
  } catch (error) {
    console.error("Admin authentication middleware error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

// Generate JWT token for admin
export function generateAdminToken(adminId: string): string {
  return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: "24h" });
}
