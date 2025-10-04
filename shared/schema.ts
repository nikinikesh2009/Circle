import { z } from "zod";

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

// Chat Message Schema
export const chatMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  createdAt: z.date(),
});

export const insertChatMessageSchema = chatMessageSchema.omit({ 
  id: true, 
  createdAt: true
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

// ============ FEATURE 1: AI-POWERED DAILY PLANNER ============

// Daily Plan Schema
export const dailyPlanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(), // YYYY-MM-DD format
  generatedBy: z.enum(["ai", "user"]),
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
  aiGenerated: z.boolean().default(false),
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

// ============ FEATURE 2: ENHANCED HABIT TRACKER ============

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
  aiNudgesEnabled: z.boolean().default(true),
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
  aiMicroSteps: z.array(z.string()).optional(),
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

// ============ FEATURE 5: AI PROBLEM SOLVER & ASSISTANT ============

// User Preferences Schema (AI settings)
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
  aiPreferences: z.object({
    personalityStyle: z.enum(["supportive", "strict", "balanced", "friendly"]).default("balanced"),
    plannerEnabled: z.boolean().default(true),
    autoScheduleTasks: z.boolean().default(true),
    habitNudgesEnabled: z.boolean().default(true),
    focusModeEnabled: z.boolean().default(true),
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

// AI Conversation Context Schema (for memory)
export const aiContextSchema = z.object({
  id: z.string(),
  userId: z.string(),
  contextType: z.enum(["personal_info", "goal", "problem", "preference", "achievement"]),
  topic: z.string(),
  content: z.string(),
  relevanceScore: z.number().default(1.0),
  lastUsed: z.date(),
  createdAt: z.date(),
});

export const insertAiContextSchema = aiContextSchema.omit({ 
  id: true, 
  createdAt: true,
  lastUsed: true
});

export type AiContext = z.infer<typeof aiContextSchema>;
export type InsertAiContext = z.infer<typeof insertAiContextSchema>;
