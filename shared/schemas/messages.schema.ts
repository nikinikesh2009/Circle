import { z } from "zod";
import { pgTable, varchar, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Private Messages Table
export const privateMessagesTable = pgTable("private_messages", {
  id: varchar("id").primaryKey().notNull(),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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
