import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatMessageSchema } from "@shared/schema";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/chat/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessages();
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat/messages", async (req, res) => {
    try {
      const validatedData = insertChatMessageSchema.parse(req.body);
      const userMessage = await storage.addChatMessage(validatedData);

      const chatHistory = await storage.getChatMessages();
      const geminiMessages = chatHistory.slice(-10).map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: geminiMessages,
      });

      const aiContent = response.text || "I'm sorry, I couldn't generate a response.";

      const assistantMessage = await storage.addChatMessage({
        role: "assistant",
        content: aiContent,
      });

      res.json({ userMessage, assistantMessage });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  app.delete("/api/chat/messages", async (req, res) => {
    try {
      await storage.clearChatMessages();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear messages" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
