import { 
  type PushSubscription,
  type InsertPushSubscription,
  type ScheduledNotification,
  type InsertScheduledNotification,
  type UserPreferences,
  type InsertUserPreferences,
  type PrivateMessage,
  type InsertPrivateMessage
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
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
  
  // Private Messages
  getConversation(userId1: string, userId2: string): Promise<PrivateMessage[]>;
  sendPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage>;
  markMessageAsRead(messageId: string): Promise<void>;
  getRecentConversations(userId: string): Promise<Array<{otherUserId: string, lastMessage: PrivateMessage, unreadCount: number}>>;
}

export class MemStorage implements IStorage {
  private pushSubscriptions: Map<string, PushSubscription[]>;
  private scheduledNotifications: ScheduledNotification[];
  private userPreferences: Map<string, UserPreferences>;

  constructor() {
    this.pushSubscriptions = new Map();
    this.scheduledNotifications = [];
    this.userPreferences = new Map();
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

  // Private Messages
  private privateMessages: PrivateMessage[] = [];

  async getConversation(userId1: string, userId2: string): Promise<PrivateMessage[]> {
    return this.privateMessages
      .filter(msg => 
        (msg.senderId === userId1 && msg.receiverId === userId2) ||
        (msg.senderId === userId2 && msg.receiverId === userId1)
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async sendPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage> {
    const newMessage: PrivateMessage = {
      ...message,
      id: randomUUID(),
      read: false,
      createdAt: new Date(),
    };
    this.privateMessages.push(newMessage);
    return newMessage;
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    const message = this.privateMessages.find(m => m.id === messageId);
    if (message) {
      message.read = true;
      message.readAt = new Date();
    }
  }

  async getRecentConversations(userId: string): Promise<Array<{otherUserId: string, lastMessage: PrivateMessage, unreadCount: number}>> {
    const conversations = new Map<string, {lastMessage: PrivateMessage, unreadCount: number}>();
    
    for (const msg of this.privateMessages) {
      let otherUserId: string | null = null;
      
      if (msg.senderId === userId) {
        otherUserId = msg.receiverId;
      } else if (msg.receiverId === userId) {
        otherUserId = msg.senderId;
      }
      
      if (otherUserId) {
        const existing = conversations.get(otherUserId);
        if (!existing || msg.createdAt > existing.lastMessage.createdAt) {
          const unreadCount = this.privateMessages.filter(
            m => m.senderId === otherUserId && m.receiverId === userId && !m.read
          ).length;
          conversations.set(otherUserId, { lastMessage: msg, unreadCount });
        }
      }
    }
    
    return Array.from(conversations.entries()).map(([otherUserId, data]) => ({
      otherUserId,
      ...data
    })).sort((a, b) => b.lastMessage.createdAt.getTime() - a.lastMessage.createdAt.getTime());
  }
}

import { pgStorage } from "./pg-storage";

// Use PostgreSQL storage for production
export const storage = pgStorage;
