import { type ChatMessage, type InsertChatMessage } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  getChatMessages(): Promise<ChatMessage[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(): Promise<void>;
}

export class MemStorage implements IStorage {
  private chatMessages: ChatMessage[];

  constructor() {
    this.chatMessages = [];
  }

  async getChatMessages(): Promise<ChatMessage[]> {
    return [...this.chatMessages];
  }

  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const message: ChatMessage = {
      ...insertMessage,
      id: randomUUID(),
      createdAt: new Date(),
    };
    this.chatMessages.push(message);
    return message;
  }

  async clearChatMessages(): Promise<void> {
    this.chatMessages = [];
  }
}

export const storage = new MemStorage();
