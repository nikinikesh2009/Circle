import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  avatar: text("avatar"),
  bio: text("bio"),
  status: varchar("status", { length: 20 }).default("offline"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const circles = pgTable("circles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  coverImage: text("cover_image"),
  category: text("category"),
  isPrivate: boolean("is_private").default(false).notNull(),
  createdBy: varchar("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  memberCount: integer("member_count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const circleMembers = pgTable("circle_members", {
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: varchar("role", { length: 20 }).default("member").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.circleId, table.userId] }),
}));

export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id").notNull().references(() => circles.id, { onDelete: "cascade" }),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  status: true,
  createdAt: true,
});

export const insertCircleSchema = createInsertSchema(circles).omit({
  id: true,
  memberCount: true,
  createdAt: true,
});

export const insertCircleMemberSchema = createInsertSchema(circleMembers).omit({
  role: true,
  joinedAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCircle = z.infer<typeof insertCircleSchema>;
export type Circle = typeof circles.$inferSelect;

export type InsertCircleMember = z.infer<typeof insertCircleMemberSchema>;
export type CircleMember = typeof circleMembers.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
