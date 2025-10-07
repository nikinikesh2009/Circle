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
