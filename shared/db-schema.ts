import { pgTable, varchar, text, timestamp, integer, boolean, json, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ============ ADMIN & SECURITY TABLES ============

export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").notNull().unique(),
  passwordHash: varchar("password_hash").notNull(),
  role: varchar("role").notNull().default("admin"),
  isActive: boolean("is_active").notNull().default(true),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id").references(() => admins.id),
  action: varchar("action").notNull(),
  resourceType: varchar("resource_type").notNull(),
  resourceId: varchar("resource_id"),
  details: json("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============ CORE TABLES ============

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull(),
  role: varchar("role").notNull(),
  content: text("content").notNull(),
  fileUrl: text("file_url"),
  fileType: varchar("file_type"),
  fileName: varchar("file_name"),
  mimeType: varchar("mime_type"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pushSubscriptions = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  keys: json("keys").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const scheduledNotifications = pgTable("scheduled_notifications", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull(),
  title: varchar("title").notNull(),
  body: text("body").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  type: varchar("type").notNull(),
  relatedId: varchar("related_id"),
  sent: boolean("sent").notNull().default(false),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().unique(),
  notificationPreferences: json("notification_preferences").notNull(),
  aiPreferences: json("ai_preferences").notNull(),
  schedulePreferences: json("schedule_preferences").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const aiContexts = pgTable("ai_contexts", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull(),
  contextType: varchar("context_type").notNull(),
  topic: varchar("topic").notNull(),
  content: text("content").notNull(),
  relevanceScore: integer("relevance_score").notNull().default(1),
  lastUsed: timestamp("last_used").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ============ RELATIONS ============

export const adminsRelations = relations(admins, ({ many }) => ({
  auditLogs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  admin: one(admins, {
    fields: [auditLogs.adminId],
    references: [admins.id],
  }),
}));
