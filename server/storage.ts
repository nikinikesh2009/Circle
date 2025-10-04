import { 
  type ChatMessage, 
  type InsertChatMessage,
  type PushSubscription,
  type InsertPushSubscription,
  type ScheduledNotification,
  type InsertScheduledNotification,
  type UserPreferences,
  type InsertUserPreferences,
  type AiContext,
  type InsertAiContext
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Chat Messages
  getChatMessages(userId: string): Promise<ChatMessage[]>;
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  clearChatMessages(userId: string): Promise<void>;
  
  // Push Subscriptions
  getPushSubscriptions(userId: string): Promise<PushSubscription[]>;
  addPushSubscription(subscription: InsertPushSubscription): Promise<PushSubscription>;
  removePushSubscription(userId: string, endpoint: string): Promise<void>;
  
  // Scheduled Notifications
  getScheduledNotifications(userId: string): Promise<ScheduledNotification[]>;
  getPendingNotifications(): Promise<ScheduledNotification[]>;
  addScheduledNotification(notification: InsertScheduledNotification): Promise<ScheduledNotification>;
  markNotificationAsSent(notificationId: string): Promise<void>;
  deleteScheduledNotification(notificationId: string): Promise<void>;
  
  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences | null>;
  saveUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;
  
  // AI Context (Memory)
  getAiContext(userId: string): Promise<AiContext[]>;
  addAiContext(context: InsertAiContext): Promise<AiContext>;
  updateAiContextLastUsed(contextId: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private chatMessages: Map<string, ChatMessage[]>;
  private pushSubscriptions: Map<string, PushSubscription[]>;
  private scheduledNotifications: ScheduledNotification[];
  private userPreferences: Map<string, UserPreferences>;
  private aiContexts: Map<string, AiContext[]>;

  constructor() {
    this.chatMessages = new Map();
    this.pushSubscriptions = new Map();
    this.scheduledNotifications = [];
    this.userPreferences = new Map();
    this.aiContexts = new Map();
  }

  // Chat Messages
  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    return [...(this.chatMessages.get(userId) || [])];
  }

  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const message: ChatMessage = {
      ...insertMessage,
      id: randomUUID(),
      createdAt: new Date(),
    };
    const userMessages = this.chatMessages.get(insertMessage.userId) || [];
    userMessages.push(message);
    this.chatMessages.set(insertMessage.userId, userMessages);
    return message;
  }

  async clearChatMessages(userId: string): Promise<void> {
    this.chatMessages.set(userId, []);
  }

  // Push Subscriptions
  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    return [...(this.pushSubscriptions.get(userId) || [])];
  }

  async addPushSubscription(insertSubscription: InsertPushSubscription): Promise<PushSubscription> {
    const subscription: PushSubscription = {
      ...insertSubscription,
      id: randomUUID(),
      isActive: true,
      createdAt: new Date(),
    };
    const userSubs = this.pushSubscriptions.get(insertSubscription.userId) || [];
    // Remove any existing subscription with the same endpoint
    const filteredSubs = userSubs.filter(s => s.endpoint !== subscription.endpoint);
    filteredSubs.push(subscription);
    this.pushSubscriptions.set(insertSubscription.userId, filteredSubs);
    return subscription;
  }

  async removePushSubscription(userId: string, endpoint: string): Promise<void> {
    const userSubs = this.pushSubscriptions.get(userId) || [];
    const filteredSubs = userSubs.filter(s => s.endpoint !== endpoint);
    this.pushSubscriptions.set(userId, filteredSubs);
  }

  // Scheduled Notifications
  async getScheduledNotifications(userId: string): Promise<ScheduledNotification[]> {
    return this.scheduledNotifications.filter(n => n.userId === userId);
  }

  async getPendingNotifications(): Promise<ScheduledNotification[]> {
    const now = new Date();
    return this.scheduledNotifications.filter(n => !n.sent && n.scheduledFor <= now);
  }

  async addScheduledNotification(insertNotification: InsertScheduledNotification): Promise<ScheduledNotification> {
    const notification: ScheduledNotification = {
      ...insertNotification,
      id: randomUUID(),
      sent: false,
      createdAt: new Date(),
    };
    this.scheduledNotifications.push(notification);
    return notification;
  }

  async markNotificationAsSent(notificationId: string): Promise<void> {
    const notification = this.scheduledNotifications.find(n => n.id === notificationId);
    if (notification) {
      notification.sent = true;
      notification.sentAt = new Date();
    }
  }

  async deleteScheduledNotification(notificationId: string): Promise<void> {
    this.scheduledNotifications = this.scheduledNotifications.filter(n => n.id !== notificationId);
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    return this.userPreferences.get(userId) || null;
  }

  async saveUserPreferences(insertPreferences: InsertUserPreferences): Promise<UserPreferences> {
    const existing = this.userPreferences.get(insertPreferences.userId);
    const preferences: UserPreferences = {
      ...insertPreferences,
      id: existing?.id || randomUUID(),
      createdAt: existing?.createdAt || new Date(),
      updatedAt: new Date(),
    };
    this.userPreferences.set(insertPreferences.userId, preferences);
    return preferences;
  }

  // AI Context
  async getAiContext(userId: string): Promise<AiContext[]> {
    return [...(this.aiContexts.get(userId) || [])];
  }

  async addAiContext(insertContext: InsertAiContext): Promise<AiContext> {
    const context: AiContext = {
      ...insertContext,
      id: randomUUID(),
      lastUsed: new Date(),
      createdAt: new Date(),
    };
    const userContexts = this.aiContexts.get(insertContext.userId) || [];
    userContexts.push(context);
    this.aiContexts.set(insertContext.userId, userContexts);
    return context;
  }

  async updateAiContextLastUsed(contextId: string): Promise<void> {
    for (const [userId, contexts] of Array.from(this.aiContexts.entries())) {
      const context = contexts.find((c: AiContext) => c.id === contextId);
      if (context) {
        context.lastUsed = new Date();
        return;
      }
    }
  }
}

export const storage = new MemStorage();
