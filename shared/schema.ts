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
