import type { Express } from "express";
import { createServer, type Server } from "http";
import cookieParser from "cookie-parser";
import { storage } from "./storage";
import {
  generateToken,
  hashPassword,
  comparePassword,
  authMiddleware,
  requireRole,
} from "./auth";
import {
  loginSchema,
  registerSchema,
  insertLocationSchema,
  insertShiftSchema,
  insertTimeOffRequestSchema,
  insertNotificationSchema,
  insertMessageSchema,
  insertShiftSwapRequestSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.use(cookieParser());

  // ── Auth Routes ──
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = registerSchema.parse(req.body);

      const existing = await storage.getUserByEmail(data.email);
      if (existing) {
        return res.status(400).json({ message: "Email already in use" });
      }

      const org = await storage.createOrganization({
        name: data.organizationName,
      });

      const hashedPassword = await hashPassword(data.password);
      const user = await storage.createUser({
        organizationId: org.id,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        role: "owner",
      });

      await storage.createLocation({
        organizationId: org.id,
        name: "Main Location",
        timezone: "America/New_York",
      });

      const token = generateToken(user.id);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const data = loginSchema.parse(req.body);

      const user = await storage.getUserByEmail(data.email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const valid = await comparePassword(data.password, user.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = generateToken(user.id);
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      const { password: _, ...safeUser } = user;
      return res.json({ user: safeUser });
    } catch (err: any) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      return res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("token");
    return res.json({ message: "Logged out" });
  });

  app.get("/api/auth/me", authMiddleware, async (req, res) => {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const { password: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  });

  // ── Users Routes ──
  app.get("/api/users", authMiddleware, async (req, res) => {
    const users = await storage.getUsersByOrg(req.user!.organizationId);
    const safeUsers = users.map(({ password: _, ...u }) => u);
    return res.json(safeUsers);
  });

  app.post(
    "/api/users",
    authMiddleware,
    requireRole("owner", "manager"),
    async (req, res) => {
      try {
        const existing = await storage.getUserByEmail(req.body.email);
        if (existing) {
          return res.status(400).json({ message: "Email already in use" });
        }

        const hashedPassword = await hashPassword(req.body.password);
        const user = await storage.createUser({
          ...req.body,
          organizationId: req.user!.organizationId,
          password: hashedPassword,
        });

        const { password: _, ...safeUser } = user;
        return res.json(safeUser);
      } catch (err: any) {
        return res.status(500).json({ message: err.message });
      }
    }
  );

  // ── Update User (manager/owner can update any, employee can update self) ──
  app.patch("/api/users/:id", authMiddleware, async (req, res) => {
    try {
      const targetId = req.params.id;
      const isManagerRole = req.user!.role === "owner" || req.user!.role === "manager";
      const isSelf = targetId === req.user!.id;

      if (!isManagerRole && !isSelf) {
        return res.status(403).json({ message: "You can only update your own profile" });
      }

      const target = await storage.getUser(targetId);
      if (!target || target.organizationId !== req.user!.organizationId) {
        return res.status(404).json({ message: "User not found" });
      }

      const updateData: any = {};
      if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
      if (req.body.lastName !== undefined) updateData.lastName = req.body.lastName;
      if (req.body.phone !== undefined) updateData.phone = req.body.phone;
      if (req.body.position !== undefined) updateData.position = req.body.position;

      if (isManagerRole) {
        if (req.body.role !== undefined) updateData.role = req.body.role;
        if (req.body.hourlyRate !== undefined) updateData.hourlyRate = req.body.hourlyRate;
        if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
      }

      if (req.body.email !== undefined) {
        const existing = await storage.getUserByEmail(req.body.email);
        if (existing && existing.id !== targetId) {
          return res.status(400).json({ message: "Email already in use" });
        }
        updateData.email = req.body.email;
      }

      const updated = await storage.updateUser(targetId, updateData);
      const { password: _, ...safeUser } = updated;
      return res.json(safeUser);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ── Change Password ──
  app.post("/api/auth/change-password", authMiddleware, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Please provide both current and new passwords" });
      }
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
      }

      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const valid = await comparePassword(currentPassword, user.password);
      if (!valid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(req.user!.id, { password: hashedPassword });
      return res.json({ message: "Password changed successfully" });
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ── Locations Routes ──
  app.get("/api/locations", authMiddleware, async (req, res) => {
    const locs = await storage.getLocationsByOrg(req.user!.organizationId);
    return res.json(locs);
  });

  app.post(
    "/api/locations",
    authMiddleware,
    requireRole("owner", "manager"),
    async (req, res) => {
      try {
        const loc = await storage.createLocation({
          ...req.body,
          organizationId: req.user!.organizationId,
        });
        return res.json(loc);
      } catch (err: any) {
        return res.status(500).json({ message: err.message });
      }
    }
  );

  app.patch(
    "/api/locations/:id",
    authMiddleware,
    requireRole("owner", "manager"),
    async (req, res) => {
      try {
        const loc = await storage.getLocation(req.params.id);
        if (!loc || loc.organizationId !== req.user!.organizationId) {
          return res.status(404).json({ message: "Location not found" });
        }
        const updateData: any = {};
        if (req.body.name !== undefined) updateData.name = req.body.name;
        if (req.body.address !== undefined) updateData.address = req.body.address;
        if (req.body.timezone !== undefined) updateData.timezone = req.body.timezone;
        if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;
        const updated = await storage.updateLocation(req.params.id, updateData);
        return res.json(updated);
      } catch (err: any) {
        return res.status(500).json({ message: err.message });
      }
    }
  );

  // ── Shifts Routes ──
  app.get("/api/shifts", authMiddleware, async (req, res) => {
    const allShifts = await storage.getShiftsByOrg(
      req.user!.organizationId
    );
    return res.json(allShifts);
  });

  app.post(
    "/api/shifts",
    authMiddleware,
    requireRole("owner", "manager"),
    async (req, res) => {
      try {
        if (!req.body.locationId) {
          return res.status(400).json({ message: "Please select a location for this shift." });
        }
        if (!req.body.startTime || !req.body.endTime) {
          return res.status(400).json({ message: "Please provide both a start time and end time for this shift." });
        }
        const startTime = new Date(req.body.startTime);
        const endTime = new Date(req.body.endTime);
        if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
          return res.status(400).json({ message: "The times you entered are not valid. Please select valid start and end times." });
        }
        if (endTime <= startTime) {
          return res.status(400).json({ message: "The end time must be after the start time." });
        }
        const data = {
          organizationId: req.user!.organizationId,
          locationId: req.body.locationId,
          userId: req.body.userId === "unassigned" ? null : req.body.userId || null,
          startTime,
          endTime,
          position: req.body.position || null,
          notes: req.body.notes || null,
          status: req.body.status || "scheduled",
        };
        const shift = await storage.createShift(data);
        return res.json(shift);
      } catch (err: any) {
        return res.status(500).json({ message: err.message });
      }
    }
  );

  app.patch(
    "/api/shifts/:id",
    authMiddleware,
    requireRole("owner", "manager"),
    async (req, res) => {
      try {
        const existing = await storage.getShift(req.params.id);
        if (
          !existing ||
          existing.organizationId !== req.user!.organizationId
        ) {
          return res.status(404).json({ message: "Shift not found" });
        }
        const updated: any = {
          userId: req.body.userId === "unassigned" ? null : req.body.userId,
        };
        if (req.body.startTime) updated.startTime = new Date(req.body.startTime);
        if (req.body.endTime) updated.endTime = new Date(req.body.endTime);
        if (req.body.locationId) updated.locationId = req.body.locationId;
        if (req.body.position !== undefined) updated.position = req.body.position;
        if (req.body.notes !== undefined) updated.notes = req.body.notes;
        if (req.body.status) updated.status = req.body.status;
        const shift = await storage.updateShift(req.params.id, updated);
        return res.json(shift);
      } catch (err: any) {
        return res.status(500).json({ message: err.message });
      }
    }
  );

  app.delete(
    "/api/shifts/:id",
    authMiddleware,
    requireRole("owner", "manager"),
    async (req, res) => {
      try {
        const existing = await storage.getShift(req.params.id);
        if (
          !existing ||
          existing.organizationId !== req.user!.organizationId
        ) {
          return res.status(404).json({ message: "Shift not found" });
        }
        await storage.deleteShift(req.params.id);
        return res.json({ message: "Shift deleted" });
      } catch (err: any) {
        return res.status(500).json({ message: err.message });
      }
    }
  );

  // ── Time Off Routes ──
  app.get("/api/time-off", authMiddleware, async (req, res) => {
    const requests = await storage.getTimeOffRequestsByOrg(
      req.user!.organizationId
    );
    const isManagerRole = req.user!.role === "owner" || req.user!.role === "manager";
    if (isManagerRole) {
      return res.json(requests);
    }
    return res.json(requests.filter((r) => r.userId === req.user!.id));
  });

  app.post("/api/time-off", authMiddleware, async (req, res) => {
    try {
      if (!req.body.startDate || !req.body.endDate) {
        return res.status(400).json({ message: "Please select both a start date and end date for your time-off request." });
      }
      if (!req.body.type) {
        return res.status(400).json({ message: "Please select a time-off type (vacation, sick, personal, or unpaid)." });
      }
      const startDate = new Date(req.body.startDate);
      const endDate = new Date(req.body.endDate);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "The dates you entered are not valid. Please pick valid start and end dates." });
      }
      if (endDate < startDate) {
        return res.status(400).json({ message: "The end date must be after the start date." });
      }
      const request = await storage.createTimeOffRequest({
        organizationId: req.user!.organizationId,
        userId: req.body.userId || req.user!.id,
        startDate,
        endDate,
        type: req.body.type,
        reason: req.body.reason || null,
        status: req.body.status || "pending",
      });
      return res.json(request);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  app.patch(
    "/api/time-off/:id",
    authMiddleware,
    requireRole("owner", "manager"),
    async (req, res) => {
      try {
        const existing = await storage.getTimeOffRequest(req.params.id);
        if (
          !existing ||
          existing.organizationId !== req.user!.organizationId
        ) {
          return res.status(404).json({ message: "Request not found" });
        }
        const updated = await storage.updateTimeOffRequest(
          req.params.id,
          {
            ...req.body,
            reviewedBy: req.user!.id,
            reviewedAt: new Date(),
          }
        );

        if (req.body.status === "approved" || req.body.status === "denied") {
          await storage.createNotification({
            organizationId: req.user!.organizationId,
            userId: existing.userId,
            type: req.body.status === "approved" ? "time_off_approved" : "time_off_denied",
            title: `Time-off request ${req.body.status}`,
            message: `Your time-off request has been ${req.body.status} by your manager.`,
          });
        }

        return res.json(updated);
      } catch (err: any) {
        return res.status(500).json({ message: err.message });
      }
    }
  );

  // ── Notifications Routes ──
  app.get("/api/notifications", authMiddleware, async (req, res) => {
    const notifs = await storage.getNotificationsByUser(req.user!.id);
    return res.json(notifs);
  });

  app.patch("/api/notifications/:id", authMiddleware, async (req, res) => {
    try {
      const updated = await storage.updateNotification(
        req.params.id,
        req.body
      );
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  app.post(
    "/api/notifications/mark-all-read",
    authMiddleware,
    async (req, res) => {
      await storage.markAllNotificationsRead(req.user!.id);
      return res.json({ message: "All marked as read" });
    }
  );

  // ── Messages Routes ──
  app.get("/api/messages", authMiddleware, async (req, res) => {
    const msgs = await storage.getMessagesByOrg(
      req.user!.organizationId
    );
    return res.json(msgs);
  });

  app.post("/api/messages", authMiddleware, async (req, res) => {
    try {
      if (!req.body.subject || !req.body.body) {
        return res.status(400).json({ message: "Please provide a subject and message body." });
      }
      if (!req.body.isBroadcast && !req.body.recipientId) {
        return res.status(400).json({ message: "Please select a recipient or send as a broadcast." });
      }
      const msg = await storage.createMessage({
        organizationId: req.user!.organizationId,
        senderId: req.user!.id,
        recipientId: req.body.isBroadcast ? null : req.body.recipientId,
        subject: req.body.subject,
        body: req.body.body,
        isBroadcast: req.body.isBroadcast || false,
      });

      const senderUser = await storage.getUser(req.user!.id);
      const senderName = senderUser ? `${senderUser.firstName} ${senderUser.lastName}` : "Someone";

      if (req.body.isBroadcast) {
        const orgUsers = await storage.getUsersByOrg(req.user!.organizationId);
        for (const u of orgUsers) {
          if (u.id !== req.user!.id) {
            await storage.createNotification({
              organizationId: req.user!.organizationId,
              userId: u.id,
              type: "announcement",
              title: "New broadcast message",
              message: `${senderName} sent a broadcast: "${req.body.subject}"`,
            });
          }
        }
      } else if (req.body.recipientId) {
        await storage.createNotification({
          organizationId: req.user!.organizationId,
          userId: req.body.recipientId,
          type: "announcement",
          title: "New message",
          message: `${senderName} sent you a message: "${req.body.subject}"`,
        });
      }

      return res.json(msg);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  app.patch("/api/messages/:id", authMiddleware, async (req, res) => {
    try {
      const updated = await storage.updateMessage(
        req.params.id,
        req.body
      );
      return res.json(updated);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  // ── Shift Swap Routes ──
  app.get("/api/swaps", authMiddleware, async (req, res) => {
    const swaps = await storage.getShiftSwapRequestsByOrg(
      req.user!.organizationId
    );
    const isManagerRole = req.user!.role === "owner" || req.user!.role === "manager";
    if (isManagerRole) {
      return res.json(swaps);
    }
    return res.json(swaps.filter((s) => s.requesterId === req.user!.id || s.targetUserId === req.user!.id));
  });

  app.post("/api/swaps", authMiddleware, async (req, res) => {
    try {
      const swap = await storage.createShiftSwapRequest({
        ...req.body,
        organizationId: req.user!.organizationId,
        requesterId: req.user!.id,
      });
      return res.json(swap);
    } catch (err: any) {
      return res.status(500).json({ message: err.message });
    }
  });

  app.patch(
    "/api/swaps/:id",
    authMiddleware,
    requireRole("owner", "manager"),
    async (req, res) => {
      try {
        const updated = await storage.updateShiftSwapRequest(
          req.params.id,
          {
            ...req.body,
            reviewedBy: req.user!.id,
            reviewedAt: new Date(),
          }
        );

        if (req.body.status === "approved") {
          const swap = await storage.getShiftSwapRequestsByOrg(
            req.user!.organizationId
          );
          const swapReq = swap.find((s) => s.id === req.params.id);
          if (swapReq) {
            const shift = await storage.getShift(swapReq.shiftId);
            if (shift) {
              await storage.updateShift(shift.id, {
                userId: swapReq.targetUserId,
              });
            }
          }
        }

        return res.json(updated);
      } catch (err: any) {
        return res.status(500).json({ message: err.message });
      }
    }
  );

  // ── Reports (Owner Only) ──
  app.get(
    "/api/reports",
    authMiddleware,
    requireRole("owner"),
    async (req, res) => {
      try {
        const shifts = await storage.getShiftsByOrg(req.user!.organizationId);
        const users = await storage.getUsersByOrg(req.user!.organizationId);
        const timeOff = await storage.getTimeOffRequestsByOrg(req.user!.organizationId);
        const safeUsers = users.map(({ password: _, ...u }) => u);
        return res.json({ shifts, users: safeUsers, timeOff });
      } catch (err: any) {
        return res.status(500).json({ message: err.message });
      }
    }
  );

  return httpServer;
}
