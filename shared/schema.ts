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
