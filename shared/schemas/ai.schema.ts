import { z } from "zod";

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
  enableAutoScheduling: z.boolean().default(false),
  preferredResponseLength: z.enum(["concise", "balanced", "detailed"]).default("balanced"),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const insertAiSettingsSchema = aiSettingsSchema.omit({ 
  id: true, 
  createdAt: true,
  updatedAt: true
});

export type AiSettings = z.infer<typeof aiSettingsSchema>;
export type InsertAiSettings = z.infer<typeof insertAiSettingsSchema>;
