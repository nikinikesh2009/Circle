import { z } from "zod";

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
