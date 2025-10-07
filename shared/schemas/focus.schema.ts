import { z } from "zod";

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
