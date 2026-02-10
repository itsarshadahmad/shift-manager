import { storage } from "./storage";
import { hashPassword } from "./auth";
import { db } from "./db";
import { users } from "@shared/schema";
import { addDays, setHours, setMinutes } from "date-fns";

export async function seedDatabase() {
  const existingUsers = await db.select().from(users).limit(1);
  if (existingUsers.length > 0) {
    return;
  }

  console.log("Seeding database with sample data...");

  const org = await storage.createOrganization({
    name: "Sunrise Cafe & Bistro",
    planTier: "professional",
  });

  const hashedPassword = await hashPassword("password123");

  const owner = await storage.createUser({
    organizationId: org.id,
    email: "admin@sunrisecafe.com",
    password: hashedPassword,
    firstName: "Sarah",
    lastName: "Mitchell",
    phone: "555-0100",
    role: "owner",
    position: "General Manager",
    hourlyRate: "35.00",
  });

  const manager = await storage.createUser({
    organizationId: org.id,
    email: "manager@sunrisecafe.com",
    password: hashedPassword,
    firstName: "David",
    lastName: "Chen",
    phone: "555-0101",
    role: "manager",
    position: "Shift Lead",
    hourlyRate: "25.00",
  });

  const emp1 = await storage.createUser({
    organizationId: org.id,
    email: "maria@sunrisecafe.com",
    password: hashedPassword,
    firstName: "Maria",
    lastName: "Garcia",
    phone: "555-0102",
    role: "employee",
    position: "Server",
    hourlyRate: "18.00",
  });

  const emp2 = await storage.createUser({
    organizationId: org.id,
    email: "james@sunrisecafe.com",
    password: hashedPassword,
    firstName: "James",
    lastName: "Wilson",
    phone: "555-0103",
    role: "employee",
    position: "Barista",
    hourlyRate: "17.50",
  });

  const emp3 = await storage.createUser({
    organizationId: org.id,
    email: "emily@sunrisecafe.com",
    password: hashedPassword,
    firstName: "Emily",
    lastName: "Johnson",
    phone: "555-0104",
    role: "employee",
    position: "Cook",
    hourlyRate: "22.00",
  });

  const emp4 = await storage.createUser({
    organizationId: org.id,
    email: "omar@sunrisecafe.com",
    password: hashedPassword,
    firstName: "Omar",
    lastName: "Hassan",
    phone: "555-0105",
    role: "employee",
    position: "Server",
    hourlyRate: "18.00",
  });

  const loc1 = await storage.createLocation({
    organizationId: org.id,
    name: "Downtown Branch",
    address: "123 Main Street, Suite 100",
    timezone: "America/New_York",
  });

  const loc2 = await storage.createLocation({
    organizationId: org.id,
    name: "Westside Location",
    address: "456 Oak Avenue",
    timezone: "America/New_York",
  });

  const today = new Date();
  const allEmployees = [owner, manager, emp1, emp2, emp3, emp4];
  const locs = [loc1, loc2];

  for (let dayOffset = -3; dayOffset <= 7; dayOffset++) {
    const day = addDays(today, dayOffset);

    for (let i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
      const emp = allEmployees[Math.floor(Math.random() * allEmployees.length)];
      const loc = locs[Math.floor(Math.random() * locs.length)];
      const startHour = 6 + Math.floor(Math.random() * 10);
      const duration = 4 + Math.floor(Math.random() * 5);

      await storage.createShift({
        organizationId: org.id,
        locationId: loc.id,
        userId: emp.id,
        startTime: setMinutes(setHours(day, startHour), 0),
        endTime: setMinutes(setHours(day, startHour + duration), 0),
        position: emp.position,
        status: dayOffset < 0 ? "completed" : dayOffset <= 2 ? "published" : "scheduled",
      });
    }
  }

  await storage.createTimeOffRequest({
    organizationId: org.id,
    userId: emp1.id,
    startDate: addDays(today, 5),
    endDate: addDays(today, 8),
    type: "vacation",
    status: "pending",
    reason: "Family vacation planned for the holiday weekend",
  });

  await storage.createTimeOffRequest({
    organizationId: org.id,
    userId: emp2.id,
    startDate: addDays(today, 2),
    endDate: addDays(today, 3),
    type: "sick",
    status: "approved",
    reason: "Doctor's appointment and recovery",
  });

  await storage.createTimeOffRequest({
    organizationId: org.id,
    userId: emp4.id,
    startDate: addDays(today, 10),
    endDate: addDays(today, 12),
    type: "personal",
    status: "pending",
    reason: "Moving to new apartment",
  });

  await storage.createNotification({
    organizationId: org.id,
    userId: owner.id,
    type: "time_off_approved",
    title: "Time Off Request",
    message: "Maria Garcia requested vacation from Feb 15 - Feb 18",
    isRead: false,
  });

  await storage.createNotification({
    organizationId: org.id,
    userId: owner.id,
    type: "schedule_published",
    title: "Schedule Published",
    message: "The weekly schedule has been published for all staff",
    isRead: true,
  });

  await storage.createNotification({
    organizationId: org.id,
    userId: emp1.id,
    type: "shift_assigned",
    title: "New Shift Assigned",
    message: "You have been assigned a shift on Monday, 9:00 AM - 5:00 PM",
    isRead: false,
  });

  await storage.createMessage({
    organizationId: org.id,
    senderId: owner.id,
    recipientId: null,
    subject: "Welcome to ShiftFlow!",
    body: "Hi everyone! We are now using ShiftFlow for all scheduling and time-off management. Please check the schedule regularly and submit any time-off requests through the system. If you have any questions, feel free to reach out!",
    isBroadcast: true,
  });

  await storage.createMessage({
    organizationId: org.id,
    senderId: emp1.id,
    recipientId: manager.id,
    subject: "Schedule question for next week",
    body: "Hi David, I noticed I'm scheduled for a closing shift on Tuesday and an opening shift on Wednesday. Would it be possible to swap one of those? I'd appreciate the extra rest time between shifts.",
    isBroadcast: false,
  });

  await storage.createMessage({
    organizationId: org.id,
    senderId: manager.id,
    recipientId: emp1.id,
    subject: "Re: Schedule question for next week",
    body: "Hi Maria, I'll look into that and see if we can adjust the schedule. Let me check with the rest of the team first.",
    isBroadcast: false,
  });

  console.log("Seed data created successfully!");
  console.log("Login with: admin@sunrisecafe.com / password123");
}
