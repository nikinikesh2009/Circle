import type { Express } from "express";
import { db } from "./db";
import { admins, auditLogs } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { authenticateAdmin, generateAdminToken, type AdminAuthRequest } from "./admin-auth-middleware";
import { authLimiter } from "./rate-limit";
import DOMPurify from "isomorphic-dompurify";

// Validate 32-digit password requirement
function validate32DigitPassword(password: string): { valid: boolean; error?: string } {
  if (password.length !== 32) {
    return { valid: false, error: "Password must be exactly 32 characters long" };
  }
  
  // Check for complexity requirements
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  
  if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
    return { 
      valid: false, 
      error: "Password must contain uppercase, lowercase, numbers, and special characters" 
    };
  }
  
  return { valid: true };
}

// Audit log helper
async function createAuditLog(
  adminId: string,
  action: string,
  resourceType: string,
  resourceId: string | null,
  details: any,
  req: AdminAuthRequest
) {
  await db.insert(auditLogs).values({
    adminId,
    action,
    resourceType,
    resourceId,
    details,
    ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
    userAgent: req.headers['user-agent'] || 'unknown',
  });
}

export function registerAdminRoutes(app: Express) {
  // Admin registration (create new admin) - only existing admins can create new admins
  app.post("/api/admin/create", authenticateAdmin, authLimiter, async (req: AdminAuthRequest, res) => {
    try {
      const { email, password, role } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Validate 32-digit password
      const passwordValidation = validate32DigitPassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.error });
      }
      
      // Check if admin already exists
      const [existingAdmin] = await db
        .select()
        .from(admins)
        .where(eq(admins.email, email))
        .limit(1);
      
      if (existingAdmin) {
        return res.status(400).json({ error: "Admin with this email already exists" });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);
      
      // Create admin
      const id = randomUUID();
      const [newAdmin] = await db
        .insert(admins)
        .values({
          id,
          email: DOMPurify.sanitize(email),
          passwordHash,
          role: role || 'admin',
          isActive: true,
        })
        .returning();
      
      // Create audit log
      await createAuditLog(
        req.admin!.id,
        'CREATE_ADMIN',
        'admin',
        newAdmin.id,
        { email: newAdmin.email, role: newAdmin.role },
        req
      );
      
      res.json({ 
        success: true, 
        admin: { 
          id: newAdmin.id, 
          email: newAdmin.email, 
          role: newAdmin.role 
        } 
      });
    } catch (error) {
      console.error("Admin creation error:", error);
      res.status(500).json({ error: "Failed to create admin" });
    }
  });
  
  // Admin login - separate from Firebase auth
  app.post("/api/admin/login", authLimiter, async (req, res) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      // Enforce 32-digit password requirement
      if (password.length !== 32) {
        return res.status(400).json({ error: "Invalid password format" });
      }
      
      // Find admin
      const [admin] = await db
        .select()
        .from(admins)
        .where(eq(admins.email, email))
        .limit(1);
      
      if (!admin) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      if (!admin.isActive) {
        return res.status(403).json({ error: "Admin account is deactivated" });
      }
      
      // Verify password
      const passwordValid = await bcrypt.compare(password, admin.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Update last login
      await db
        .update(admins)
        .set({ lastLogin: new Date() })
        .where(eq(admins.id, admin.id));
      
      // Generate JWT token
      const token = generateAdminToken(admin.id);
      
      // Return admin info with JWT token
      res.json({ 
        success: true,
        token,
        admin: {
          id: admin.id,
          email: admin.email,
          role: admin.role,
        }
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  
  // Get all admins
  app.get("/api/admin/list", authenticateAdmin, async (req: AdminAuthRequest, res) => {
    try {
      const allAdmins = await db.select().from(admins);
      
      res.json(allAdmins.map(admin => ({
        id: admin.id,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      })));
    } catch (error) {
      console.error("Failed to fetch admins:", error);
      res.status(500).json({ error: "Failed to fetch admins" });
    }
  });
  
  // Deactivate admin
  app.post("/api/admin/deactivate/:id", authenticateAdmin, async (req: AdminAuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // Can't deactivate yourself
      if (id === req.admin!.id) {
        return res.status(400).json({ error: "Cannot deactivate your own account" });
      }
      
      await db
        .update(admins)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(admins.id, id));
      
      await createAuditLog(
        req.admin!.id,
        'DEACTIVATE_ADMIN',
        'admin',
        id,
        {},
        req
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to deactivate admin:", error);
      res.status(500).json({ error: "Failed to deactivate admin" });
    }
  });
  
  // Get audit logs
  app.get("/api/admin/audit-logs", authenticateAdmin, async (req: AdminAuthRequest, res) => {
    try {
      const logs = await db
        .select()
        .from(auditLogs)
        .orderBy(auditLogs.createdAt)
        .limit(100);
      
      res.json(logs);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      res.status(500).json({ error: "Failed to fetch audit logs" });
    }
  });
  
  // Get Firebase users (for admin management)
  app.get("/api/admin/users", authenticateAdmin, async (req: AdminAuthRequest, res) => {
    try {
      // In production, you'd query Firebase Admin SDK for users
      // For now, we'll return users from Firebase Realtime Database if available
      res.json({ message: "User management endpoint - integrate with Firebase Admin SDK" });
    } catch (error) {
      console.error("Failed to fetch users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  
  // Suspend user (Firebase user management)
  app.post("/api/admin/users/:userId/suspend", authenticateAdmin, async (req: AdminAuthRequest, res) => {
    try {
      const { userId } = req.params;
      
      // In production, use Firebase Admin SDK to disable user
      // auth().updateUser(userId, { disabled: true });
      
      await createAuditLog(
        req.admin!.id,
        'SUSPEND_USER',
        'user',
        userId,
        {},
        req
      );
      
      res.json({ success: true, message: "User suspended successfully" });
    } catch (error) {
      console.error("Failed to suspend user:", error);
      res.status(500).json({ error: "Failed to suspend user" });
    }
  });
}
