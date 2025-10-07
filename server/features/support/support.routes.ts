import type { Express } from "express";
import { insertSupportTicketSchema } from "@shared/schema";
import admin from "firebase-admin";

// Simple input sanitization (trim whitespace)
function sanitizeInput(input: string): string {
  return input.trim();
}

export function registerSupportRoutes(app: Express) {
  // Support ticket endpoint
  app.post("/api/support/ticket", async (req, res) => {
    try {
      const validatedData = insertSupportTicketSchema.parse(req.body);
      
      // Sanitize inputs
      const sanitizedTicket = {
        ...validatedData,
        name: sanitizeInput(validatedData.name),
        subject: sanitizeInput(validatedData.subject),
        message: sanitizeInput(validatedData.message),
      };
      
      // Store ticket in Firebase
      const db = admin.database();
      const ticketRef = db.ref('supportTickets').push();
      const ticketId = ticketRef.key!;
      
      const ticket = {
        id: ticketId,
        ...sanitizedTicket,
        status: "open",
        createdAt: new Date().toISOString(),
      };
      
      await ticketRef.set(ticket);
      
      res.status(201).json({ success: true, ticketId });
    } catch (error) {
      console.error("Error creating support ticket:", error);
      res.status(400).json({ error: "Failed to create support ticket" });
    }
  });
}
