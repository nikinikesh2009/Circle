import { z } from "zod";
import { pgTable, varchar, text, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Push Subscriptions Table
export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  keys: json("keys").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Scheduled Notifications Table
export const scheduledNotificationsTable = pgTable("scheduled_notifications", {
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

// User Preferences Table
export const userPreferencesTable = pgTable("user_preferences", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().unique(),
  notificationPreferences: json("notification_preferences").notNull(),
  schedulePreferences: json("schedule_preferences").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Push Subscription Schema
export const pushSubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  endpoint: z.string(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
});

export const insertPushSubscriptionSchema = pushSubscriptionSchema.omit({ 
  id: true, 
  createdAt: true,
  isActive: true
});

export type PushSubscription = z.infer<typeof pushSubscriptionSchema>;
export type InsertPushSubscription = z.infer<typeof insertPushSubscriptionSchema>;

// Scheduled Notification Schema
export const scheduledNotificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  body: z.string(),
  scheduledFor: z.date(),
  type: z.enum(["reminder", "motivation", "habit", "task", "break", "custom"]),
  relatedId: z.string().optional(), // habitId, taskId, etc.
  sent: z.boolean().default(false),
  sentAt: z.date().optional(),
  createdAt: z.date(),
});

export const insertScheduledNotificationSchema = scheduledNotificationSchema.omit({ 
  id: true, 
  createdAt: true,
  sent: true,
  sentAt: true
});

export type ScheduledNotification = z.infer<typeof scheduledNotificationSchema>;
export type InsertScheduledNotification = z.infer<typeof insertScheduledNotificationSchema>;

// User Preferences Schema
export const userPreferencesSchema = z.object({
  id: z.string(),
  userId: z.string(),
  notificationPreferences: z.object({
    enablePush: z.boolean().default(true),
    enablePopups: z.boolean().default(true),
    quietHoursStart: z.string().optional(), // HH:MM
    quietHoursEnd: z.string().optional(), // HH:MM
    motivationFrequency: z.enum(["low", "medium", "high"]).default("medium"),
  }),
  schedulePreferences: z.object({
    wakeUpTime: z.string().default("07:00"), // HH:MM
    sleepTime: z.string().default("23:00"), // HH:MM
    workStartTime: z.string().default("09:00"),
    workEndTime: z.string().default("17:00"),
    preferredBreakDuration: z.number().default(15), // minutes
    preferredFocusDuration: z.number().default(25), // minutes (pomodoro)
  }),
  updatedAt: z.date(),
  createdAt: z.date(),
});

export const insertUserPreferencesSchema = userPreferencesSchema.omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;

// Notification Schema
export const notificationSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["battle_invite", "battle_accepted", "battle_declined", "battle_completed", "message", "achievement"]),
  title: z.string(),
  message: z.string(),
  relatedId: z.string().optional(), // battleId, messageId, etc.
  relatedData: z.record(z.any()).optional(), // Additional data like battleType, challengeType, etc.
  read: z.boolean().default(false),
  actionUrl: z.string().optional(), // Where to navigate when clicked
  createdAt: z.date(),
  readAt: z.date().optional(),
});

export const insertNotificationSchema = notificationSchema.omit({ 
  id: true, 
  createdAt: true,
  read: true,
  readAt: true
});

export type Notification = z.infer<typeof notificationSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
