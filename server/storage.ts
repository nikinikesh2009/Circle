import { db } from "./db";
import { eq, and, desc, count, or, sql as drizzleSql } from "drizzle-orm";
import {
  users,
  circles,
  circleMembers,
  messages,
  notifications,
  reactions,
  conversations,
  dmMessages,
  adminCredentials,
  adminLogs,
  systemSettings,
  type User,
  type InsertUser,
  type Circle,
  type InsertCircle,
  type InsertCircleMember,
  type Message,
  type InsertMessage,
  type Notification,
  type InsertNotification,
  type Reaction,
  type InsertReaction,
  type Conversation,
  type InsertConversation,
  type DmMessage,
  type InsertDmMessage,
  type AdminCredentials,
  type InsertAdminCredentials,
  type AdminLog,
  type InsertAdminLog,
  type SystemSettings,
  type InsertSystemSettings,
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(userId: string, updates: Partial<Pick<User, 'name' | 'bio' | 'targets' | 'avatar'>>): Promise<User>;
  updateUserStatus(userId: string, status: string): Promise<void>;

  // Circle methods
  createCircle(circle: InsertCircle): Promise<Circle>;
  getCircle(id: string): Promise<Circle | undefined>;
  getCircles(): Promise<Circle[]>;
  getOfficialCircles(): Promise<Circle[]>;
  getUserCreatedCircles(userId: string): Promise<Circle[]>;
  getUserCircles(userId: string): Promise<Circle[]>;
  updateCircleMemberCount(circleId: string): Promise<void>;

  // Circle membership methods
  joinCircle(data: InsertCircleMember): Promise<void>;
  leaveCircle(circleId: string, userId: string): Promise<void>;
  isCircleMember(circleId: string, userId: string): Promise<boolean>;

  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getCircleMessages(circleId: string, limit?: number): Promise<Message[]>;
  editMessage(messageId: string, userId: string, content: string): Promise<void>;
  deleteMessage(messageId: string, userId: string): Promise<void>;

  // Reaction methods
  addReaction(reaction: InsertReaction): Promise<Reaction | null>;
  removeReaction(messageId: string, userId: string, emoji: string): Promise<void>;
  getMessageReactions(messageId: string): Promise<Reaction[]>;

  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string, userId: string): Promise<void>;

  // DM (Direct Messaging) methods
  getOrCreateConversation(userId1: string, userId2: string): Promise<any>;
  getUserConversations(userId: string): Promise<any[]>;
  sendDmMessage(conversationId: string, senderId: string, content: string): Promise<any>;
  getDmMessages(conversationId: string, limit?: number): Promise<any[]>;

  // Admin methods
  getAdminCredentials(): Promise<AdminCredentials | undefined>;
  createAdminCredentials(credentials: InsertAdminCredentials): Promise<AdminCredentials>;
  updateAdminCredentials(id: string, updates: Partial<InsertAdminCredentials>): Promise<AdminCredentials>;
  verifyAdminPassword(password: string): Promise<boolean>;
  verifySecretEmail(email: string): Promise<boolean>;
  verifyBackupCode(code: string): Promise<boolean>;
  
  // Admin log methods
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(limit?: number): Promise<AdminLog[]>;
  getFailedLoginLogs(limit?: number): Promise<AdminLog[]>;
  
  // System settings methods
  getSystemSetting(key: string): Promise<SystemSettings | undefined>;
  getAllSystemSettings(): Promise<SystemSettings[]>;
  upsertSystemSetting(key: string, value: string, description?: string): Promise<SystemSettings>;
  
  // Admin user management
  getAllUsers(limit?: number): Promise<User[]>;
  banUser(userId: string): Promise<void>;
  unbanUser(userId: string): Promise<void>;
  deleteUserAdmin(userId: string): Promise<void>;
  
  // Admin circle management
  deleteCircleAdmin(circleId: string): Promise<void>;
  updateCircle(circleId: string, updates: Partial<Circle>): Promise<Circle>;
}

export class DbStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, password: hashedPassword })
      .returning();
    return user;
  }

  async updateUser(userId: string, updates: Partial<Pick<User, 'name' | 'bio' | 'targets' | 'avatar'>>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async updateUserStatus(userId: string, status: string): Promise<void> {
    await db.update(users).set({ status }).where(eq(users.id, userId));
  }

  async createCircle(insertCircle: InsertCircle): Promise<Circle> {
    const [circle] = await db.insert(circles).values(insertCircle).returning();
    
    await db.insert(circleMembers).values({
      circleId: circle.id,
      userId: insertCircle.createdBy,
      role: "admin",
    });

    await this.updateCircleMemberCount(circle.id);
    return circle;
  }

  async getCircle(id: string): Promise<Circle | undefined> {
    const [circle] = await db.select().from(circles).where(eq(circles.id, id));
    return circle;
  }

  async getCircles(): Promise<Circle[]> {
    return db.select().from(circles).orderBy(desc(circles.createdAt));
  }

  async getOfficialCircles(): Promise<Circle[]> {
    return db.select().from(circles).where(eq(circles.isOfficial, true)).orderBy(desc(circles.createdAt));
  }

  async getUserCreatedCircles(userId: string): Promise<Circle[]> {
    const userCircleIds = db
      .select({ circleId: circleMembers.circleId })
      .from(circleMembers)
      .where(eq(circleMembers.userId, userId));

    const result = await db
      .select()
      .from(circles)
      .where(and(
        eq(circles.isOfficial, false),
      ))
      .orderBy(desc(circles.createdAt));

    const joinedCircleIds = (await userCircleIds).map(c => c.circleId);
    return result.filter(circle => !joinedCircleIds.includes(circle.id));
  }

  async getUserCircles(userId: string): Promise<Circle[]> {
    const result = await db
      .select({
        id: circles.id,
        name: circles.name,
        description: circles.description,
        coverImage: circles.coverImage,
        category: circles.category,
        isPrivate: circles.isPrivate,
        isOfficial: circles.isOfficial,
        createdBy: circles.createdBy,
        memberCount: circles.memberCount,
        createdAt: circles.createdAt,
      })
      .from(circleMembers)
      .innerJoin(circles, eq(circleMembers.circleId, circles.id))
      .where(eq(circleMembers.userId, userId))
      .orderBy(desc(circles.createdAt));

    return result;
  }

  async updateCircleMemberCount(circleId: string): Promise<void> {
    const result = await db
      .select({ count: count() })
      .from(circleMembers)
      .where(eq(circleMembers.circleId, circleId));

    const memberCount = Number(result[0]?.count) || 0;
    
    await db
      .update(circles)
      .set({ memberCount })
      .where(eq(circles.id, circleId));
  }

  async joinCircle(data: InsertCircleMember): Promise<void> {
    await db.insert(circleMembers).values(data);
    await this.updateCircleMemberCount(data.circleId);
  }

  async leaveCircle(circleId: string, userId: string): Promise<void> {
    await db
      .delete(circleMembers)
      .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));
    await this.updateCircleMemberCount(circleId);
  }

  async isCircleMember(circleId: string, userId: string): Promise<boolean> {
    const [member] = await db
      .select()
      .from(circleMembers)
      .where(and(eq(circleMembers.circleId, circleId), eq(circleMembers.userId, userId)));
    return !!member;
  }

  async createMessage(insertMessage: InsertMessage): Promise<any> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    
    const [user] = await db.select().from(users).where(eq(users.id, message.userId));
    
    return {
      ...message,
      user: user ? {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
      } : undefined,
    };
  }

  async getCircleMessages(circleId: string, limit = 50): Promise<any[]> {
    const messageList = await db
      .select()
      .from(messages)
      .where(eq(messages.circleId, circleId))
      .orderBy(messages.createdAt)
      .limit(limit);

    const messagesWithUsers = await Promise.all(
      messageList.map(async (message) => {
        const [user] = await db.select().from(users).where(eq(users.id, message.userId));
        return {
          ...message,
          user: user ? {
            id: user.id,
            name: user.name,
            username: user.username,
            avatar: user.avatar,
          } : undefined,
        };
      })
    );

    return messagesWithUsers;
  }

  async editMessage(messageId: string, userId: string, content: string): Promise<void> {
    await db
      .update(messages)
      .set({ content, isEdited: true, editedAt: new Date() })
      .where(and(eq(messages.id, messageId), eq(messages.userId, userId)));
  }

  async deleteMessage(messageId: string, userId: string): Promise<void> {
    await db
      .update(messages)
      .set({ isDeleted: true, content: "Message deleted" })
      .where(and(eq(messages.id, messageId), eq(messages.userId, userId)));
  }

  async addReaction(reaction: InsertReaction): Promise<Reaction | null> {
    const [newReaction] = await db
      .insert(reactions)
      .values(reaction)
      .onConflictDoNothing()
      .returning();
    return newReaction || null;
  }

  async removeReaction(messageId: string, userId: string, emoji: string): Promise<void> {
    await db
      .delete(reactions)
      .where(
        and(
          eq(reactions.messageId, messageId),
          eq(reactions.userId, userId),
          eq(reactions.emoji, emoji)
        )
      );
  }

  async getMessageReactions(messageId: string): Promise<Reaction[]> {
    return await db
      .select()
      .from(reactions)
      .where(eq(reactions.messageId, messageId));
  }

  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(insertNotification).returning();
    return notification;
  }

  async getUserNotifications(userId: string, limit = 50): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit);
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)));
    return Number(result[0]?.count) || 0;
  }

  async markNotificationAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    await db.delete(notifications).where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  async getOrCreateConversation(userId1: string, userId2: string): Promise<Conversation> {
    if (userId1 === userId2) {
      throw new Error("Cannot create conversation with yourself");
    }

    const [user1Id, user2Id] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];

    const [existing] = await db
      .select()
      .from(conversations)
      .where(
        and(
          eq(conversations.user1Id, user1Id),
          eq(conversations.user2Id, user2Id)
        )
      );

    if (existing) {
      return existing;
    }

    const [newConversation] = await db
      .insert(conversations)
      .values({ user1Id, user2Id })
      .returning();
    
    return newConversation;
  }

  async getUserConversations(userId: string): Promise<any[]> {
    const userConversations = await db
      .select({
        id: conversations.id,
        user1Id: conversations.user1Id,
        user2Id: conversations.user2Id,
        createdAt: conversations.createdAt,
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        )
      )
      .orderBy(desc(conversations.createdAt));

    const conversationsWithUsers = await Promise.all(
      userConversations.map(async (conv) => {
        const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        const otherUser = await this.getUser(otherUserId);
        return {
          ...conv,
          otherUser: otherUser ? { id: otherUser.id, name: otherUser.name, username: otherUser.username, avatar: otherUser.avatar } : null,
        };
      })
    );

    return conversationsWithUsers;
  }

  async sendDmMessage(conversationId: string, senderId: string, content: string): Promise<DmMessage> {
    const [dmMessage] = await db
      .insert(dmMessages)
      .values({ conversationId, senderId, content })
      .returning();
    
    return dmMessage;
  }

  async getDmMessages(conversationId: string, limit = 100): Promise<any[]> {
    const msgs = await db
      .select()
      .from(dmMessages)
      .where(eq(dmMessages.conversationId, conversationId))
      .orderBy(desc(dmMessages.createdAt))
      .limit(limit);

    const messagesWithUsers = await Promise.all(
      msgs.map(async (msg) => {
        const sender = await this.getUser(msg.senderId);
        return {
          ...msg,
          sender: sender ? { id: sender.id, name: sender.name, username: sender.username, avatar: sender.avatar } : null,
        };
      })
    );

    return messagesWithUsers.reverse();
  }

  // Admin credentials methods
  async getAdminCredentials(): Promise<AdminCredentials | undefined> {
    const [credentials] = await db.select().from(adminCredentials).limit(1);
    return credentials;
  }

  async createAdminCredentials(credentials: InsertAdminCredentials): Promise<AdminCredentials> {
    const hashedPassword = await bcrypt.hash(credentials.password, 10);
    const [adminCreds] = await db
      .insert(adminCredentials)
      .values({ ...credentials, password: hashedPassword })
      .returning();
    return adminCreds;
  }

  async updateAdminCredentials(id: string, updates: Partial<InsertAdminCredentials>): Promise<AdminCredentials> {
    const updatedData: any = { ...updates, updatedAt: new Date() };
    if (updates.password) {
      updatedData.password = await bcrypt.hash(updates.password, 10);
    }
    const [updated] = await db
      .update(adminCredentials)
      .set(updatedData)
      .where(eq(adminCredentials.id, id))
      .returning();
    return updated;
  }

  async verifyAdminPassword(password: string): Promise<boolean> {
    const creds = await this.getAdminCredentials();
    if (!creds) return false;
    return bcrypt.compare(password, creds.password);
  }

  async verifySecretEmail(email: string): Promise<boolean> {
    const creds = await this.getAdminCredentials();
    if (!creds) return false;
    return creds.secretEmails.includes(email);
  }

  async verifyBackupCode(code: string): Promise<boolean> {
    const creds = await this.getAdminCredentials();
    if (!creds) return false;
    return creds.backupCodes.includes(code);
  }

  // Admin log methods
  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const [adminLog] = await db.insert(adminLogs).values(log).returning();
    return adminLog;
  }

  async getAdminLogs(limit = 100): Promise<AdminLog[]> {
    return db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt)).limit(limit);
  }

  async getFailedLoginLogs(limit = 100): Promise<AdminLog[]> {
    return db
      .select()
      .from(adminLogs)
      .where(and(eq(adminLogs.success, false), eq(adminLogs.action, 'admin_login')))
      .orderBy(desc(adminLogs.createdAt))
      .limit(limit);
  }

  // System settings methods
  async getSystemSetting(key: string): Promise<SystemSettings | undefined> {
    const [setting] = await db.select().from(systemSettings).where(eq(systemSettings.key, key));
    return setting;
  }

  async getAllSystemSettings(): Promise<SystemSettings[]> {
    return db.select().from(systemSettings);
  }

  async upsertSystemSetting(key: string, value: string, description?: string): Promise<SystemSettings> {
    const existing = await this.getSystemSetting(key);
    if (existing) {
      const [updated] = await db
        .update(systemSettings)
        .set({ value, description: description || existing.description, updatedAt: new Date() })
        .where(eq(systemSettings.key, key))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(systemSettings)
        .values({ key, value, description })
        .returning();
      return created;
    }
  }

  // Admin user management
  async getAllUsers(limit = 1000): Promise<User[]> {
    return db.select().from(users).orderBy(desc(users.createdAt)).limit(limit);
  }

  async banUser(userId: string): Promise<void> {
    await db.update(users).set({ status: 'banned' }).where(eq(users.id, userId));
  }

  async unbanUser(userId: string): Promise<void> {
    await db.update(users).set({ status: 'offline' }).where(eq(users.id, userId));
  }

  async deleteUserAdmin(userId: string): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  // Admin circle management
  async deleteCircleAdmin(circleId: string): Promise<void> {
    await db.delete(circles).where(eq(circles.id, circleId));
  }

  async updateCircle(circleId: string, updates: Partial<Circle>): Promise<Circle> {
    const [updated] = await db
      .update(circles)
      .set(updates)
      .where(eq(circles.id, circleId))
      .returning();
    return updated;
  }
}

export const storage = new DbStorage();
