import {
  type User,
  type InsertUser,
  type Organization,
  type InsertOrganization,
  type Location,
  type InsertLocation,
  type Shift,
  type InsertShift,
  type TimeOffRequest,
  type InsertTimeOffRequest,
  type Availability,
  type InsertAvailability,
  type Notification,
  type InsertNotification,
  type Message,
  type InsertMessage,
  type ShiftSwapRequest,
  type InsertShiftSwapRequest,
  users,
  organizations,
  locations,
  shifts,
  timeOffRequests,
  availability,
  notifications,
  messages,
  shiftSwapRequests,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or } from "drizzle-orm";

export interface IStorage {
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getOrganization(id: string): Promise<Organization | undefined>;

  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsersByOrg(orgId: string): Promise<User[]>;

  createLocation(loc: InsertLocation): Promise<Location>;
  getLocationsByOrg(orgId: string): Promise<Location[]>;

  createShift(shift: InsertShift): Promise<Shift>;
  getShiftsByOrg(orgId: string): Promise<Shift[]>;
  getShift(id: string): Promise<Shift | undefined>;
  updateShift(id: string, data: Partial<Shift>): Promise<Shift>;
  deleteShift(id: string): Promise<void>;

  createTimeOffRequest(req: InsertTimeOffRequest): Promise<TimeOffRequest>;
  getTimeOffRequestsByOrg(orgId: string): Promise<TimeOffRequest[]>;
  getTimeOffRequest(id: string): Promise<TimeOffRequest | undefined>;
  updateTimeOffRequest(
    id: string,
    data: Partial<TimeOffRequest>
  ): Promise<TimeOffRequest>;

  createAvailability(a: InsertAvailability): Promise<Availability>;
  getAvailabilityByUser(userId: string): Promise<Availability[]>;

  createNotification(n: InsertNotification): Promise<Notification>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  updateNotification(
    id: string,
    data: Partial<Notification>
  ): Promise<Notification>;
  markAllNotificationsRead(userId: string): Promise<void>;

  createMessage(m: InsertMessage): Promise<Message>;
  getMessagesByOrg(orgId: string): Promise<Message[]>;
  updateMessage(id: string, data: Partial<Message>): Promise<Message>;

  createShiftSwapRequest(s: InsertShiftSwapRequest): Promise<ShiftSwapRequest>;
  getShiftSwapRequestsByOrg(orgId: string): Promise<ShiftSwapRequest[]>;
  updateShiftSwapRequest(
    id: string,
    data: Partial<ShiftSwapRequest>
  ): Promise<ShiftSwapRequest>;
}

export class DatabaseStorage implements IStorage {
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [result] = await db.insert(organizations).values(org).returning();
    return result;
  }

  async getOrganization(id: string): Promise<Organization | undefined> {
    const [result] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id));
    return result || undefined;
  }

  async getUser(id: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [result] = await db
      .select()
      .from(users)
      .where(eq(users.email, email));
    return result || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }

  async getUsersByOrg(orgId: string): Promise<User[]> {
    return db
      .select()
      .from(users)
      .where(eq(users.organizationId, orgId))
      .orderBy(users.firstName);
  }

  async createLocation(loc: InsertLocation): Promise<Location> {
    const [result] = await db.insert(locations).values(loc).returning();
    return result;
  }

  async getLocationsByOrg(orgId: string): Promise<Location[]> {
    return db
      .select()
      .from(locations)
      .where(eq(locations.organizationId, orgId))
      .orderBy(locations.name);
  }

  async createShift(shift: InsertShift): Promise<Shift> {
    const [result] = await db.insert(shifts).values(shift).returning();
    return result;
  }

  async getShiftsByOrg(orgId: string): Promise<Shift[]> {
    return db
      .select()
      .from(shifts)
      .where(eq(shifts.organizationId, orgId))
      .orderBy(shifts.startTime);
  }

  async getShift(id: string): Promise<Shift | undefined> {
    const [result] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id));
    return result || undefined;
  }

  async updateShift(id: string, data: Partial<Shift>): Promise<Shift> {
    const [result] = await db
      .update(shifts)
      .set(data)
      .where(eq(shifts.id, id))
      .returning();
    return result;
  }

  async deleteShift(id: string): Promise<void> {
    await db.delete(shifts).where(eq(shifts.id, id));
  }

  async createTimeOffRequest(
    req: InsertTimeOffRequest
  ): Promise<TimeOffRequest> {
    const [result] = await db
      .insert(timeOffRequests)
      .values(req)
      .returning();
    return result;
  }

  async getTimeOffRequestsByOrg(orgId: string): Promise<TimeOffRequest[]> {
    return db
      .select()
      .from(timeOffRequests)
      .where(eq(timeOffRequests.organizationId, orgId))
      .orderBy(desc(timeOffRequests.createdAt));
  }

  async getTimeOffRequest(id: string): Promise<TimeOffRequest | undefined> {
    const [result] = await db
      .select()
      .from(timeOffRequests)
      .where(eq(timeOffRequests.id, id));
    return result || undefined;
  }

  async updateTimeOffRequest(
    id: string,
    data: Partial<TimeOffRequest>
  ): Promise<TimeOffRequest> {
    const [result] = await db
      .update(timeOffRequests)
      .set(data)
      .where(eq(timeOffRequests.id, id))
      .returning();
    return result;
  }

  async createAvailability(a: InsertAvailability): Promise<Availability> {
    const [result] = await db.insert(availability).values(a).returning();
    return result;
  }

  async getAvailabilityByUser(userId: string): Promise<Availability[]> {
    return db
      .select()
      .from(availability)
      .where(eq(availability.userId, userId));
  }

  async createNotification(n: InsertNotification): Promise<Notification> {
    const [result] = await db.insert(notifications).values(n).returning();
    return result;
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async updateNotification(
    id: string,
    data: Partial<Notification>
  ): Promise<Notification> {
    const [result] = await db
      .update(notifications)
      .set(data)
      .where(eq(notifications.id, id))
      .returning();
    return result;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
  }

  async createMessage(m: InsertMessage): Promise<Message> {
    const [result] = await db.insert(messages).values(m).returning();
    return result;
  }

  async getMessagesByOrg(orgId: string): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.organizationId, orgId))
      .orderBy(desc(messages.createdAt));
  }

  async updateMessage(id: string, data: Partial<Message>): Promise<Message> {
    const [result] = await db
      .update(messages)
      .set(data)
      .where(eq(messages.id, id))
      .returning();
    return result;
  }

  async createShiftSwapRequest(
    s: InsertShiftSwapRequest
  ): Promise<ShiftSwapRequest> {
    const [result] = await db
      .insert(shiftSwapRequests)
      .values(s)
      .returning();
    return result;
  }

  async getShiftSwapRequestsByOrg(
    orgId: string
  ): Promise<ShiftSwapRequest[]> {
    return db
      .select()
      .from(shiftSwapRequests)
      .where(eq(shiftSwapRequests.organizationId, orgId))
      .orderBy(desc(shiftSwapRequests.createdAt));
  }

  async updateShiftSwapRequest(
    id: string,
    data: Partial<ShiftSwapRequest>
  ): Promise<ShiftSwapRequest> {
    const [result] = await db
      .update(shiftSwapRequests)
      .set(data)
      .where(eq(shiftSwapRequests.id, id))
      .returning();
    return result;
  }
}

export const storage = new DatabaseStorage();
