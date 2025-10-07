import { z } from "zod";

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
