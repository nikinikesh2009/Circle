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
  type InsertAiContext,
  type PrivateMessage,
  type InsertPrivateMessage,
  chatMessagesTable,
  pushSubscriptionsTable,
  scheduledNotificationsTable,
  userPreferencesTable,
  aiContextsTable,
  privateMessagesTable
} from "@shared/schema";
import { db } from "./db";
import { eq, and, lte, or, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import type { IStorage } from "./storage";

export class PgStorage implements IStorage {
  // Chat Messages
  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    const messages = await db
      .select()
      .from(chatMessagesTable)
      .where(eq(chatMessagesTable.userId, userId));
    
    return messages.map(msg => ({
      ...msg,
      role: msg.role as "user" | "assistant",
      fileUrl: msg.fileUrl ?? undefined,
      fileType: (msg.fileType as "image" | "audio" | "document") ?? undefined,
      fileName: msg.fileName ?? undefined,
      mimeType: msg.mimeType ?? undefined,
      createdAt: new Date(msg.createdAt),
    }));
  }

  async addChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const [message] = await db
      .insert(chatMessagesTable)
      .values({
        id,
        ...insertMessage,
      })
      .returning();
    
    return {
      ...message,
      role: message.role as "user" | "assistant",
      fileUrl: message.fileUrl ?? undefined,
      fileType: (message.fileType as "image" | "audio" | "document") ?? undefined,
      fileName: message.fileName ?? undefined,
      mimeType: message.mimeType ?? undefined,
      createdAt: new Date(message.createdAt),
    };
  }

  async clearChatMessages(userId: string): Promise<void> {
    await db
      .delete(chatMessagesTable)
      .where(eq(chatMessagesTable.userId, userId));
  }

  // Push Subscriptions
  async getPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    const subscriptions = await db
      .select()
      .from(pushSubscriptionsTable)
      .where(eq(pushSubscriptionsTable.userId, userId));
    
    return subscriptions.map(sub => ({
      ...sub,
      keys: sub.keys as { p256dh: string; auth: string },
      createdAt: new Date(sub.createdAt),
    }));
  }

  async addPushSubscription(insertSubscription: InsertPushSubscription): Promise<PushSubscription> {
    const id = randomUUID();
    
    await db
      .delete(pushSubscriptionsTable)
      .where(
        and(
          eq(pushSubscriptionsTable.userId, insertSubscription.userId),
          eq(pushSubscriptionsTable.endpoint, insertSubscription.endpoint)
        )
      );
    
    const [subscription] = await db
      .insert(pushSubscriptionsTable)
      .values({
        id,
        ...insertSubscription,
      })
      .returning();
    
    return {
      ...subscription,
      keys: subscription.keys as { p256dh: string; auth: string },
      createdAt: new Date(subscription.createdAt),
    };
  }

  async removePushSubscription(userId: string, endpoint: string): Promise<void> {
    await db
      .delete(pushSubscriptionsTable)
      .where(
        and(
          eq(pushSubscriptionsTable.userId, userId),
          eq(pushSubscriptionsTable.endpoint, endpoint)
        )
      );
  }

  // Scheduled Notifications
  async getScheduledNotifications(userId: string): Promise<ScheduledNotification[]> {
    const notifications = await db
      .select()
      .from(scheduledNotificationsTable)
      .where(eq(scheduledNotificationsTable.userId, userId));
    
    return notifications.map(notif => ({
      ...notif,
      type: notif.type as "reminder" | "motivation" | "habit" | "task" | "break" | "custom",
      relatedId: notif.relatedId ?? undefined,
      scheduledFor: new Date(notif.scheduledFor),
      sentAt: notif.sentAt ? new Date(notif.sentAt) : undefined,
      createdAt: new Date(notif.createdAt),
    }));
  }

  async getPendingNotifications(): Promise<ScheduledNotification[]> {
    const now = new Date();
    const notifications = await db
      .select()
      .from(scheduledNotificationsTable)
      .where(
        and(
          eq(scheduledNotificationsTable.sent, false),
          lte(scheduledNotificationsTable.scheduledFor, now)
        )
      );
    
    return notifications.map(notif => ({
      ...notif,
      type: notif.type as "reminder" | "motivation" | "habit" | "task" | "break" | "custom",
      relatedId: notif.relatedId ?? undefined,
      scheduledFor: new Date(notif.scheduledFor),
      sentAt: notif.sentAt ? new Date(notif.sentAt) : undefined,
      createdAt: new Date(notif.createdAt),
    }));
  }

  async addScheduledNotification(insertNotification: InsertScheduledNotification): Promise<ScheduledNotification> {
    const id = randomUUID();
    const [notification] = await db
      .insert(scheduledNotificationsTable)
      .values({
        id,
        ...insertNotification,
      })
      .returning();
    
    return {
      ...notification,
      type: notification.type as "reminder" | "motivation" | "habit" | "task" | "break" | "custom",
      relatedId: notification.relatedId ?? undefined,
      scheduledFor: new Date(notification.scheduledFor),
      sentAt: notification.sentAt ? new Date(notification.sentAt) : undefined,
      createdAt: new Date(notification.createdAt),
    };
  }

  async markNotificationAsSent(notificationId: string): Promise<void> {
    await db
      .update(scheduledNotificationsTable)
      .set({
        sent: true,
        sentAt: new Date(),
      })
      .where(eq(scheduledNotificationsTable.id, notificationId));
  }

  async deleteScheduledNotification(notificationId: string): Promise<void> {
    await db
      .delete(scheduledNotificationsTable)
      .where(eq(scheduledNotificationsTable.id, notificationId));
  }

  // User Preferences
  async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    const [preferences] = await db
      .select()
      .from(userPreferencesTable)
      .where(eq(userPreferencesTable.userId, userId))
      .limit(1);
    
    if (!preferences) return null;
    
    return {
      ...preferences,
      notificationPreferences: preferences.notificationPreferences as any,
      aiPreferences: preferences.aiPreferences as any,
      schedulePreferences: preferences.schedulePreferences as any,
      updatedAt: new Date(preferences.updatedAt),
      createdAt: new Date(preferences.createdAt),
    };
  }

  async saveUserPreferences(insertPreferences: InsertUserPreferences): Promise<UserPreferences> {
    const id = randomUUID();
    
    const existing = await this.getUserPreferences(insertPreferences.userId);
    
    if (existing) {
      const [updated] = await db
        .update(userPreferencesTable)
        .set({
          ...insertPreferences,
          updatedAt: new Date(),
        })
        .where(eq(userPreferencesTable.userId, insertPreferences.userId))
        .returning();
      
      return {
        ...updated,
        notificationPreferences: updated.notificationPreferences as any,
        aiPreferences: updated.aiPreferences as any,
        schedulePreferences: updated.schedulePreferences as any,
        updatedAt: new Date(updated.updatedAt),
        createdAt: new Date(updated.createdAt),
      };
    }
    
    const [created] = await db
      .insert(userPreferencesTable)
      .values({
        id,
        ...insertPreferences,
      })
      .returning();
    
    return {
      ...created,
      notificationPreferences: created.notificationPreferences as any,
      aiPreferences: created.aiPreferences as any,
      schedulePreferences: created.schedulePreferences as any,
      updatedAt: new Date(created.updatedAt),
      createdAt: new Date(created.createdAt),
    };
  }

  // AI Context (Memory)
  async getAiContext(userId: string): Promise<AiContext[]> {
    const contexts = await db
      .select()
      .from(aiContextsTable)
      .where(eq(aiContextsTable.userId, userId));
    
    return contexts.map(ctx => ({
      ...ctx,
      contextType: ctx.contextType as "personal_info" | "goal" | "problem" | "preference" | "achievement",
      relevanceScore: ctx.relevanceScore as number,
      lastUsed: new Date(ctx.lastUsed),
      createdAt: new Date(ctx.createdAt),
    }));
  }

  async addAiContext(insertContext: InsertAiContext): Promise<AiContext> {
    const id = randomUUID();
    const [context] = await db
      .insert(aiContextsTable)
      .values({
        id,
        ...insertContext,
        relevanceScore: insertContext.relevanceScore || 1,
      })
      .returning();
    
    return {
      ...context,
      contextType: context.contextType as "personal_info" | "goal" | "problem" | "preference" | "achievement",
      relevanceScore: context.relevanceScore as number,
      lastUsed: new Date(context.lastUsed),
      createdAt: new Date(context.createdAt),
    };
  }

  async updateAiContextLastUsed(contextId: string): Promise<void> {
    await db
      .update(aiContextsTable)
      .set({
        lastUsed: new Date(),
      })
      .where(eq(aiContextsTable.id, contextId));
  }

  // Private Messages
  async getConversation(userId1: string, userId2: string): Promise<PrivateMessage[]> {
    const messages = await db
      .select()
      .from(privateMessagesTable)
      .where(
        or(
          and(
            eq(privateMessagesTable.senderId, userId1),
            eq(privateMessagesTable.receiverId, userId2)
          ),
          and(
            eq(privateMessagesTable.senderId, userId2),
            eq(privateMessagesTable.receiverId, userId1)
          )
        )
      )
      .orderBy(privateMessagesTable.createdAt);
    
    return messages.map(msg => ({
      ...msg,
      readAt: msg.readAt ? new Date(msg.readAt) : undefined,
      createdAt: new Date(msg.createdAt),
    }));
  }

  async sendPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage> {
    const id = randomUUID();
    const [newMessage] = await db
      .insert(privateMessagesTable)
      .values({
        id,
        ...message,
      })
      .returning();
    
    return {
      ...newMessage,
      readAt: newMessage.readAt ? new Date(newMessage.readAt) : undefined,
      createdAt: new Date(newMessage.createdAt),
    };
  }

  async markMessageAsRead(messageId: string): Promise<void> {
    await db
      .update(privateMessagesTable)
      .set({
        read: true,
        readAt: new Date(),
      })
      .where(eq(privateMessagesTable.id, messageId));
  }

  async getRecentConversations(userId: string): Promise<Array<{otherUserId: string, lastMessage: PrivateMessage, unreadCount: number}>> {
    const messages = await db
      .select()
      .from(privateMessagesTable)
      .where(
        or(
          eq(privateMessagesTable.senderId, userId),
          eq(privateMessagesTable.receiverId, userId)
        )
      )
      .orderBy(desc(privateMessagesTable.createdAt));
    
    const conversations = new Map<string, {lastMessage: PrivateMessage, unreadCount: number}>();
    
    for (const msg of messages) {
      let otherUserId: string | null = null;
      
      if (msg.senderId === userId) {
        otherUserId = msg.receiverId;
      } else if (msg.receiverId === userId) {
        otherUserId = msg.senderId;
      }
      
      if (otherUserId && !conversations.has(otherUserId)) {
        const unreadCount = await db
          .select()
          .from(privateMessagesTable)
          .where(
            and(
              eq(privateMessagesTable.senderId, otherUserId),
              eq(privateMessagesTable.receiverId, userId),
              eq(privateMessagesTable.read, false)
            )
          )
          .then(rows => rows.length);
        
        conversations.set(otherUserId, {
          lastMessage: {
            ...msg,
            readAt: msg.readAt ? new Date(msg.readAt) : undefined,
            createdAt: new Date(msg.createdAt),
          },
          unreadCount
        });
      }
    }
    
    return Array.from(conversations.entries()).map(([otherUserId, data]) => ({
      otherUserId,
      ...data
    }));
  }
}

export const pgStorage = new PgStorage();
