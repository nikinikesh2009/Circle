import { z } from "zod";

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
