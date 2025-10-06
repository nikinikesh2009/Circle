import { z } from "zod";
import { pgTable, varchar, text, timestamp, integer, boolean, json, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// ============ DRIZZLE ORM TABLE DEFINITIONS ============

// Admin Tables
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

// Core Tables
export const pushSubscriptionsTable = pgTable("push_subscriptions", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  keys: json("keys").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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

export const userPreferencesTable = pgTable("user_preferences", {
  id: varchar("id").primaryKey().notNull(),
  userId: varchar("user_id").notNull().unique(),
  notificationPreferences: json("notification_preferences").notNull(),
  schedulePreferences: json("schedule_preferences").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const privateMessagesTable = pgTable("private_messages", {
  id: varchar("id").primaryKey().notNull(),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Drizzle Zod Insert Schemas for Admin
export const insertAdminSchema = createInsertSchema(admins).omit({ id: true, createdAt: true, updatedAt: true, lastLogin: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

// ============ ZOD SCHEMAS FOR VALIDATION ============

// User Schema
export const userSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  createdAt: z.date(),
  streak: z.number().default(0),
  bestStreak: z.number().default(0),
  totalDays: z.number().default(0),
  lastCompletedDate: z.string().optional(),
  likesGiven: z.number().default(0),
  country: z.string().optional(),
  bio: z.string().optional(),
  profilePhoto: z.string().optional(),
  autoShareProgress: z.boolean().default(false),
});

export const insertUserSchema = userSchema.omit({ 
  id: true, 
  createdAt: true,
  streak: true,
  bestStreak: true,
  totalDays: true,
  lastCompletedDate: true,
  likesGiven: true
});

export type User = z.infer<typeof userSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Motivational Post Schema
export const motivationalPostSchema = z.object({
  id: z.string(),
  content: z.string(),
  imageUrl: z.string().optional(),
  category: z.string().default("Daily Wisdom"),
  likes: z.number().default(0),
  createdAt: z.date(),
});

export const insertMotivationalPostSchema = motivationalPostSchema.omit({ 
  id: true, 
  createdAt: true,
  likes: true
});

export type MotivationalPost = z.infer<typeof motivationalPostSchema>;
export type InsertMotivationalPost = z.infer<typeof insertMotivationalPostSchema>;

// User Streak Schema
export const userStreakSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(), // YYYY-MM-DD format
  completed: z.boolean(),
  createdAt: z.date(),
});

export const insertUserStreakSchema = userStreakSchema.omit({ 
  id: true, 
  createdAt: true
});

export type UserStreak = z.infer<typeof userStreakSchema>;
export type InsertUserStreak = z.infer<typeof insertUserStreakSchema>;

// Post Likes Schema (tracks which users liked which posts)
export const postLikeSchema = z.object({
  id: z.string(), // Format: ${userId}_${postId}
  userId: z.string(),
  postId: z.string(),
  createdAt: z.date(),
});

export const insertPostLikeSchema = postLikeSchema.omit({ 
  id: true, 
  createdAt: true
});

export type PostLike = z.infer<typeof postLikeSchema>;
export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;

// Community Post Schema (user-generated posts)
export const postSchema = z.object({
  id: z.string(),
  userId: z.string(),
  content: z.string(),
  imageUrl: z.string().optional(),
  groupId: z.string().optional(),
  likes: z.number().default(0),
  commentCount: z.number().default(0),
  createdAt: z.date(),
});

export const insertPostSchema = postSchema.omit({ 
  id: true, 
  createdAt: true,
  likes: true,
  commentCount: true
});

export type Post = z.infer<typeof postSchema>;
export type InsertPost = z.infer<typeof insertPostSchema>;

// Comment Schema
export const commentSchema = z.object({
  id: z.string(),
  postId: z.string(),
  userId: z.string(),
  content: z.string(),
  createdAt: z.date(),
});

export const insertCommentSchema = commentSchema.omit({ 
  id: true, 
  createdAt: true
});

export type Comment = z.infer<typeof commentSchema>;
export type InsertComment = z.infer<typeof insertCommentSchema>;

// Group Schema
export const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  createdBy: z.string(),
  memberCount: z.number().default(0),
  imageUrl: z.string().optional(),
  createdAt: z.date(),
});

export const insertGroupSchema = groupSchema.omit({ 
  id: true, 
  createdAt: true,
  memberCount: true
});

export type Group = z.infer<typeof groupSchema>;
export type InsertGroup = z.infer<typeof insertGroupSchema>;

// Group Member Schema
export const groupMemberSchema = z.object({
  id: z.string(), // Format: ${groupId}_${userId}
  groupId: z.string(),
  userId: z.string(),
  joinedAt: z.date(),
});

export const insertGroupMemberSchema = groupMemberSchema.omit({ 
  id: true, 
  joinedAt: true
});

export type GroupMember = z.infer<typeof groupMemberSchema>;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;

// ============ FEATURE 1: DAILY PLANNER ============

// Daily Plan Schema
export const dailyPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(), // YYYY-MM-DD format
  totalTasks: z.number().default(0),
  completedTasks: z.number().default(0),
  createdAt: z.date(),
});

export const insertDailyPlanSchema = dailyPlanSchema.omit({ 
  id: true, 
  createdAt: true,
  totalTasks: true,
  completedTasks: true
});

export type DailyPlan = z.infer<typeof dailyPlanSchema>;
export type InsertDailyPlan = z.infer<typeof insertDailyPlanSchema>;

// Task Schema (for daily planner)
export const taskSchema = z.object({
  id: z.string(),
  userId: z.string(),
  planId: z.string(),
  title: z.string(),
  description: z.string().optional(),
  category: z.enum(["study", "work", "gym", "meal", "break", "personal", "social", "other"]),
  startTime: z.string(), // HH:MM format
  endTime: z.string(), // HH:MM format
  duration: z.number(), // minutes
  priority: z.enum(["low", "medium", "high", "urgent"]),
  status: z.enum(["pending", "in_progress", "completed", "skipped", "postponed"]),
  completedAt: z.date().optional(),
  createdAt: z.date(),
});

export const insertTaskSchema = taskSchema.omit({ 
  id: true, 
  createdAt: true,
  completedAt: true
});

export type Task = z.infer<typeof taskSchema>;
export type InsertTask = z.infer<typeof insertTaskSchema>;

// ============ FEATURE 2: HABIT TRACKER ============

// Habit Schema
export const habitSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  category: z.string(),
  frequency: z.enum(["daily", "weekly", "custom"]),
  targetDays: z.array(z.number()).optional(), // [0-6] for days of week
  reminderTime: z.string().optional(), // HH:MM format
  currentStreak: z.number().default(0),
  bestStreak: z.number().default(0),
  totalCompletions: z.number().default(0),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
});

export const insertHabitSchema = habitSchema.omit({ 
  id: true, 
  createdAt: true,
  currentStreak: true,
  bestStreak: true,
  totalCompletions: true
});

export type Habit = z.infer<typeof habitSchema>;
export type InsertHabit = z.infer<typeof insertHabitSchema>;

// Habit Completion Schema
export const habitCompletionSchema = z.object({
  id: z.string(),
  habitId: z.string(),
  userId: z.string(),
  date: z.string(), // YYYY-MM-DD format
  completed: z.boolean(),
  note: z.string().optional(),
  createdAt: z.date(),
});

export const insertHabitCompletionSchema = habitCompletionSchema.omit({ 
  id: true, 
  createdAt: true
});

export type HabitCompletion = z.infer<typeof habitCompletionSchema>;
export type InsertHabitCompletion = z.infer<typeof insertHabitCompletionSchema>;

// Goal Schema
export const goalSchema = z.object({
  id: z.string(),
  userId: z.string(),
  habitId: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  targetValue: z.number(),
  currentValue: z.number().default(0),
  unit: z.string(), // "days", "times", "hours", etc.
  deadline: z.string().optional(), // YYYY-MM-DD format
  status: z.enum(["active", "completed", "abandoned"]),
  createdAt: z.date(),
});

export const insertGoalSchema = goalSchema.omit({ 
  id: true, 
  createdAt: true,
  currentValue: true
});

export type Goal = z.infer<typeof goalSchema>;
export type InsertGoal = z.infer<typeof insertGoalSchema>;

// ============ FEATURE 3: WEB PUSH NOTIFICATIONS ============

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

// ============ FEATURE 4: IN-APP POPUPS & FOCUS MODE ============

// Focus Session Schema
export const focusSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  taskId: z.string().optional(),
  duration: z.number(), // minutes
  breakDuration: z.number(), // minutes
  startedAt: z.date(),
  endedAt: z.date().optional(),
  status: z.enum(["active", "paused", "completed", "cancelled"]),
  distractionsLogged: z.number().default(0),
  createdAt: z.date(),
});

export const insertFocusSessionSchema = focusSessionSchema.omit({ 
  id: true, 
  createdAt: true,
  distractionsLogged: true,
  endedAt: true
});

export type FocusSession = z.infer<typeof focusSessionSchema>;
export type InsertFocusSession = z.infer<typeof insertFocusSessionSchema>;

// Distraction Log Schema
export const distractionLogSchema = z.object({
  id: z.string(),
  userId: z.string(),
  sessionId: z.string().optional(),
  type: z.enum(["app", "website", "phone", "other"]),
  description: z.string(),
  timestamp: z.date(),
});

export const insertDistractionLogSchema = distractionLogSchema.omit({ 
  id: true, 
  timestamp: true
});

export type DistractionLog = z.infer<typeof distractionLogSchema>;
export type InsertDistractionLog = z.infer<typeof insertDistractionLogSchema>;

// In-App Popup Schema
export const popupMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  type: z.enum(["motivation", "reminder", "warning", "achievement", "tip"]),
  title: z.string(),
  message: z.string(),
  action: z.string().optional(),
  actionUrl: z.string().optional(),
  displayedAt: z.date().optional(),
  dismissed: z.boolean().default(false),
  createdAt: z.date(),
});

export const insertPopupMessageSchema = popupMessageSchema.omit({ 
  id: true, 
  createdAt: true,
  displayedAt: true,
  dismissed: true
});

export type PopupMessage = z.infer<typeof popupMessageSchema>;
export type InsertPopupMessage = z.infer<typeof insertPopupMessageSchema>;

// ============ FEATURE 5: USER PREFERENCES ============

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

// ============ PRIVATE MESSAGING ============

// Private Message Schema
export const privateMessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  receiverId: z.string(),
  content: z.string(),
  read: z.boolean().default(false),
  readAt: z.date().optional(),
  createdAt: z.date(),
});

export const insertPrivateMessageSchema = privateMessageSchema.omit({ 
  id: true, 
  createdAt: true,
  read: true,
  readAt: true
});

export type PrivateMessage = z.infer<typeof privateMessageSchema>;
export type InsertPrivateMessage = z.infer<typeof insertPrivateMessageSchema>;

// ============ SUPPORT SYSTEM ============

// Support Ticket Schema
export const supportTicketSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  subject: z.string(),
  message: z.string(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).default("open"),
  createdAt: z.date(),
  resolvedAt: z.date().optional(),
});

export const insertSupportTicketSchema = supportTicketSchema.omit({ 
  id: true, 
  createdAt: true,
  status: true,
  resolvedAt: true
});

export type SupportTicket = z.infer<typeof supportTicketSchema>;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;

// ============ BATTLE SYSTEM ============

// Battle Schema
export const battleSchema = z.object({
  id: z.string(),
  type: z.enum(["1v1", "group"]),
  challengeType: z.enum(["habit_streak", "focus_time", "tasks_completed", "custom"]),
  customChallenge: z.string().optional(),
  participants: z.array(z.string()), // userIds or groupIds
  participantNames: z.record(z.string()), // { userId: displayName }
  scores: z.record(z.number()), // { userId: score }
  status: z.enum(["pending", "active", "completed", "cancelled"]),
  startDate: z.string(), // YYYY-MM-DD
  endDate: z.string(), // YYYY-MM-DD
  winnerId: z.string().optional(),
  createdBy: z.string(),
  createdAt: z.date(),
  completedAt: z.date().optional(),
});

export const insertBattleSchema = battleSchema.omit({ 
  id: true, 
  createdAt: true,
  completedAt: true,
  scores: true,
  winnerId: true
});

export type Battle = z.infer<typeof battleSchema>;
export type InsertBattle = z.infer<typeof insertBattleSchema>;

// Badge Schema
export const badgeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  icon: z.string(), // emoji or icon name
  rarity: z.enum(["common", "rare", "epic", "legendary"]),
  category: z.enum(["battle", "habit", "focus", "streak", "community", "special"]),
  requirementType: z.string(), // "first_win", "10_wins", "win_streak_5", etc.
  requirementValue: z.number().default(1),
  createdAt: z.date(),
});

export const insertBadgeSchema = badgeSchema.omit({ 
  id: true, 
  createdAt: true
});

export type Badge = z.infer<typeof badgeSchema>;
export type InsertBadge = z.infer<typeof insertBadgeSchema>;

// User Badge Schema
export const userBadgeSchema = z.object({
  id: z.string(), // Format: ${userId}_${badgeId}
  userId: z.string(),
  badgeId: z.string(),
  battleId: z.string().optional(),
  earnedAt: z.date(),
});

export const insertUserBadgeSchema = userBadgeSchema.omit({ 
  id: true, 
  earnedAt: true
});

export type UserBadge = z.infer<typeof userBadgeSchema>;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;

// Battle Invitation Schema
export const battleInvitationSchema = z.object({
  id: z.string(),
  battleId: z.string(),
  inviterId: z.string(),
  inviteeId: z.string(),
  status: z.enum(["pending", "accepted", "declined"]),
  createdAt: z.date(),
  respondedAt: z.date().optional(),
});

export const insertBattleInvitationSchema = battleInvitationSchema.omit({ 
  id: true, 
  createdAt: true,
  respondedAt: true
});

export type BattleInvitation = z.infer<typeof battleInvitationSchema>;
export type InsertBattleInvitation = z.infer<typeof insertBattleInvitationSchema>;

// ============ NOTIFICATION SYSTEM ============

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

// ============ AI ASSISTANT SYSTEM ============

// AI Task Suggestion Schema (for validation)
export const aiTaskSuggestionSchema = z.object({
  title: z.string().min(1, "Task title is required"),
  description: z.string().optional(),
  category: z.enum(["work", "personal", "health", "learning", "other"]).default("other"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  timeEstimate: z.string().optional(),
  dueDate: z.string().optional(),
});

export const aiTaskSuggestionsArraySchema = z.object({
  tasks: z.array(aiTaskSuggestionSchema).min(1, "At least one task is required"),
});

export type AiTaskSuggestion = z.infer<typeof aiTaskSuggestionSchema>;

// AI Chat Message Schema
export const aiChatMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  taskSuggestions: z.object({
    tasks: z.array(z.object({
      title: z.string(),
      description: z.string().optional(),
      category: z.string().optional(),
      priority: z.string().optional(),
      timeEstimate: z.string().optional(),
      dueDate: z.string().optional(),
    }))
  }).nullable().optional(),
  createdAt: z.date(),
});

export const insertAiChatMessageSchema = aiChatMessageSchema.omit({ 
  id: true, 
  createdAt: true
});

export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;
export type InsertAiChatMessage = z.infer<typeof insertAiChatMessageSchema>;

// AI Settings Schema
export const aiSettingsSchema = z.object({
  id: z.string(),
  userId: z.string(),
  personality: z.enum(["professional", "friendly", "motivating", "coach"]).default("friendly"),
  customSystemPrompt: z.string().optional(),
  enableTaskSuggestions: z.boolean().default(true),
  enableProductivityCheckins: z.boolean().default(true),
  updatedAt: z.date(),
  createdAt: z.date(),
});

export const insertAiSettingsSchema = aiSettingsSchema.omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export type AiSettings = z.infer<typeof aiSettingsSchema>;
export type InsertAiSettings = z.infer<typeof insertAiSettingsSchema>;
