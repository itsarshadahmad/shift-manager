import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  boolean,
  integer,
  decimal,
  timestamp,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const roleEnum = pgEnum("role", ["owner", "manager", "employee"]);
export const shiftStatusEnum = pgEnum("shift_status", [
  "scheduled",
  "published",
  "completed",
  "cancelled",
]);
export const timeOffTypeEnum = pgEnum("time_off_type", [
  "vacation",
  "sick",
  "personal",
  "unpaid",
]);
export const requestStatusEnum = pgEnum("request_status", [
  "pending",
  "approved",
  "denied",
]);
export const notificationTypeEnum = pgEnum("notification_type", [
  "schedule_published",
  "shift_changed",
  "shift_assigned",
  "time_off_approved",
  "time_off_denied",
  "shift_swap_requested",
  "shift_swap_approved",
  "shift_swap_denied",
  "announcement",
]);

export const organizations = pgTable("organizations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  planTier: text("plan_tier").notNull().default("starter"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: varchar("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    phone: text("phone"),
    role: roleEnum("role").notNull().default("employee"),
    hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }),
    position: text("position"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("users_org_idx").on(table.organizationId),
    uniqueIndex("users_email_idx").on(table.email),
  ]
);

export const locations = pgTable(
  "locations",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: varchar("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: text("address"),
    timezone: text("timezone").notNull().default("America/New_York"),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [index("locations_org_idx").on(table.organizationId)]
);

export const shifts = pgTable(
  "shifts",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: varchar("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    locationId: varchar("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    userId: varchar("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    position: text("position"),
    notes: text("notes"),
    status: shiftStatusEnum("status").notNull().default("scheduled"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("shifts_org_idx").on(table.organizationId),
    index("shifts_location_idx").on(table.locationId),
    index("shifts_user_idx").on(table.userId),
    index("shifts_time_idx").on(table.startTime, table.endTime),
  ]
);

export const timeOffRequests = pgTable(
  "time_off_requests",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: varchar("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    type: timeOffTypeEnum("type").notNull(),
    status: requestStatusEnum("status").notNull().default("pending"),
    reason: text("reason"),
    reviewedBy: varchar("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("time_off_org_idx").on(table.organizationId),
    index("time_off_user_idx").on(table.userId),
    index("time_off_status_idx").on(table.status),
  ]
);

export const availability = pgTable(
  "availability",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    isAvailable: boolean("is_available").notNull().default(true),
  },
  (table) => [index("availability_user_idx").on(table.userId)]
);

export const notifications = pgTable(
  "notifications",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: varchar("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("notifications_user_idx").on(table.userId),
    index("notifications_read_idx").on(table.isRead),
  ]
);

export const messages = pgTable(
  "messages",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: varchar("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    senderId: varchar("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recipientId: varchar("recipient_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    subject: text("subject").notNull(),
    body: text("body").notNull(),
    isRead: boolean("is_read").notNull().default(false),
    isBroadcast: boolean("is_broadcast").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("messages_sender_idx").on(table.senderId),
    index("messages_recipient_idx").on(table.recipientId),
  ]
);

export const shiftSwapRequests = pgTable(
  "shift_swap_requests",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    organizationId: varchar("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    shiftId: varchar("shift_id")
      .notNull()
      .references(() => shifts.id, { onDelete: "cascade" }),
    requesterId: varchar("requester_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetUserId: varchar("target_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: requestStatusEnum("status").notNull().default("pending"),
    reason: text("reason"),
    reviewedBy: varchar("reviewed_by"),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("swap_org_idx").on(table.organizationId),
    index("swap_requester_idx").on(table.requesterId),
  ]
);

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  locations: many(locations),
  shifts: many(shifts),
  timeOffRequests: many(timeOffRequests),
  notifications: many(notifications),
  messages: many(messages),
  shiftSwapRequests: many(shiftSwapRequests),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  shifts: many(shifts),
  timeOffRequests: many(timeOffRequests),
  availability: many(availability),
  notifications: many(notifications),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "recipient" }),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [locations.organizationId],
    references: [organizations.id],
  }),
  shifts: many(shifts),
}));

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [shifts.organizationId],
    references: [organizations.id],
  }),
  location: one(locations, {
    fields: [shifts.locationId],
    references: [locations.id],
  }),
  user: one(users, {
    fields: [shifts.userId],
    references: [users.id],
  }),
  swapRequests: many(shiftSwapRequests),
}));

export const timeOffRequestsRelations = relations(
  timeOffRequests,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [timeOffRequests.organizationId],
      references: [organizations.id],
    }),
    user: one(users, {
      fields: [timeOffRequests.userId],
      references: [users.id],
    }),
  })
);

export const availabilityRelations = relations(availability, ({ one }) => ({
  user: one(users, {
    fields: [availability.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  organization: one(organizations, {
    fields: [messages.organizationId],
    references: [organizations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "recipient",
  }),
}));

export const shiftSwapRequestsRelations = relations(
  shiftSwapRequests,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [shiftSwapRequests.organizationId],
      references: [organizations.id],
    }),
    shift: one(shifts, {
      fields: [shiftSwapRequests.shiftId],
      references: [shifts.id],
    }),
    requester: one(users, {
      fields: [shiftSwapRequests.requesterId],
      references: [users.id],
    }),
    targetUser: one(users, {
      fields: [shiftSwapRequests.targetUserId],
      references: [users.id],
    }),
  })
);

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
});
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});
export const insertShiftSchema = createInsertSchema(shifts).omit({
  id: true,
  createdAt: true,
});
export const insertTimeOffRequestSchema = createInsertSchema(
  timeOffRequests
).omit({ id: true, createdAt: true, reviewedBy: true, reviewedAt: true });
export const insertAvailabilitySchema = createInsertSchema(availability).omit({
  id: true,
});
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});
export const insertShiftSwapRequestSchema = createInsertSchema(
  shiftSwapRequests
).omit({ id: true, createdAt: true, reviewedBy: true, reviewedAt: true });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  organizationName: z.string().min(1),
});

export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Shift = typeof shifts.$inferSelect;
export type InsertShift = z.infer<typeof insertShiftSchema>;
export type TimeOffRequest = typeof timeOffRequests.$inferSelect;
export type InsertTimeOffRequest = z.infer<typeof insertTimeOffRequestSchema>;
export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = z.infer<typeof insertAvailabilitySchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type ShiftSwapRequest = typeof shiftSwapRequests.$inferSelect;
export type InsertShiftSwapRequest = z.infer<
  typeof insertShiftSwapRequestSchema
>;
