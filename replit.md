# ShiftFlow - Employee Shift Scheduler SaaS

## Overview
Cloud-agnostic, self-hostable employee shift scheduling platform. Multi-tenant architecture with role-based access control (Owner, Manager, Employee).

## Current State
MVP complete with all core features: authentication, schedule management, time-off, messaging, shift swaps, notifications, and reporting.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: JWT tokens in HTTP-only cookies
- **State**: TanStack Query for server state

## Project Structure
- `client/` - React frontend (pages, components, lib)
- `server/` - Express backend (routes, storage, auth, seed)
- `shared/` - Schema definitions (Drizzle models, Zod schemas, TypeScript types)

## Key Files
- `shared/schema.ts` - All database models and types
- `server/routes.ts` - All API endpoints
- `server/storage.ts` - DatabaseStorage layer (IStorage interface)
- `server/auth.ts` - JWT authentication middleware
- `server/seed.ts` - Sample data seeder
- `client/src/App.tsx` - Main app with routing and layout
- `client/src/lib/auth.tsx` - Auth context provider

## Development
- Start: `npm run dev` (serves on port 5000)
- DB push: `npm run db:push`
- Build: `npm run build`
- Production: `npm start`

## Default Login
- admin@sunrisecafe.com / password123 (Owner)
- manager@sunrisecafe.com / password123 (Manager)

## Documentation
- README.md, CONFIGURATION.md, DEPLOYMENT.md, DATABASE.md, API.md

## User Preferences
- Cloud-agnostic (no Replit-specific services)
- Self-hostable with comprehensive deployment docs
- Standard PostgreSQL, JWT auth, SMTP-ready
