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
        const data = {
          ...req.body,
          organizationId: req.user!.organizationId,
          userId: req.body.userId === "unassigned" ? null : req.body.userId || null,
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
        const updated = {
          ...req.body,
          userId: req.body.userId === "unassigned" ? null : req.body.userId,
        };
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
    return res.json(requests);
  });

  app.post("/api/time-off", authMiddleware, async (req, res) => {
    try {
      const request = await storage.createTimeOffRequest({
        ...req.body,
        organizationId: req.user!.organizationId,
        userId: req.body.userId || req.user!.id,
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
      const msg = await storage.createMessage({
        ...req.body,
        organizationId: req.user!.organizationId,
        senderId: req.user!.id,
      });
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
    return res.json(swaps);
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

  return httpServer;
}
