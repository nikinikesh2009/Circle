import { db } from "./db";
import { eq, and, desc, count } from "drizzle-orm";
import {
  users,
  circles,
  circleMembers,
  messages,
  notifications,
  type User,
  type InsertUser,
  type Circle,
  type InsertCircle,
  type InsertCircleMember,
  type Message,
  type InsertMessage,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserStatus(userId: string, status: string): Promise<void>;

  // Circle methods
  createCircle(circle: InsertCircle): Promise<Circle>;
  getCircle(id: string): Promise<Circle | undefined>;
  getCircles(): Promise<Circle[]>;
  getUserCircles(userId: string): Promise<Circle[]>;
  updateCircleMemberCount(circleId: string): Promise<void>;

  // Circle membership methods
  joinCircle(data: InsertCircleMember): Promise<void>;
  leaveCircle(circleId: string, userId: string): Promise<void>;
  isCircleMember(circleId: string, userId: string): Promise<boolean>;

  // Message methods
  createMessage(message: InsertMessage): Promise<Message>;
  getCircleMessages(circleId: string, limit?: number): Promise<Message[]>;

  // Notification methods
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  markNotificationAsRead(notificationId: string, userId: string): Promise<void>;
  markAllNotificationsAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string, userId: string): Promise<void>;
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

  async getUserCircles(userId: string): Promise<Circle[]> {
    const result = await db
      .select({
        id: circles.id,
        name: circles.name,
        description: circles.description,
        coverImage: circles.coverImage,
        category: circles.category,
        isPrivate: circles.isPrivate,
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
}

export const storage = new DbStorage();
