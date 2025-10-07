import { z } from "zod";

// Support Ticket Schema
export const supportTicketSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  subject: z.string(),
  message: z.string(),
  status: z.enum(["open", "in_progress", "resolved", "closed"]).default("open"),
  createdAt: z.date(),
  resolvedAt: z.date().optional(),
});

export const insertSupportTicketSchema = supportTicketSchema.omit({ 
  id: true, 
  createdAt: true,
  status: true,
  resolvedAt: true
});

export type SupportTicket = z.infer<typeof supportTicketSchema>;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
