# ShiftFlow - Employee Shift Scheduler SaaS

## Overview
Cloud-agnostic, self-hostable employee shift scheduling platform. Multi-tenant architecture with role-based access control (Owner, Manager, Employee).

## Current State
MVP complete with all core features: authentication, schedule management, time-off, messaging, shift swaps, notifications, and reporting. Enhanced with modern indigo-violet theming, professional SaaS landing page, responsive design, role-aware dashboards, and comprehensive deployment documentation.

### Recent Changes
- Theme: Modern indigo-violet color scheme (243 75% 59%) with blue-tinted dark mode (228 18% 10%), warm accent chart colors
- Landing page: Professional SaaS landing at "/" with hero, features grid, how-it-works, pricing, footer
- Role badges: Distinct colors for Admin (violet), Manager (sky), Employee (emerald) via exported roleConfig
- Schedule page: Responsive layout (desktop 7-col grid, tablet scroll, mobile single-day), searchable employee combobox (Popover+Command), custom 12h time picker, colored status badges
- Dashboard: Role-aware content - admin/manager stats vs employee personal analytics (My Shifts, Hours, Next Shift)
- Reports: Owner+Manager access with server-side /api/reports endpoint using requireRole("owner", "manager") + client-side guard
- Time-off: Controlled Popover for date picker auto-close, colored status badges (amber/emerald/red)
- Login: Indigo-violet gradient on left panel
- Red destructive logout button in sidebar
- Employees page: Uses roleConfig for consistent colored role badges
- SEO: Title, meta description, and OpenGraph tags in index.html

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
- `server/routes.ts` - All API endpoints (includes /api/reports with owner-only middleware)
- `server/storage.ts` - DatabaseStorage layer (IStorage interface)
- `server/auth.ts` - JWT authentication middleware + requireRole helper
- `client/src/App.tsx` - Main app with routing and layout
- `client/src/lib/auth.tsx` - Auth context provider
- `client/src/components/app-sidebar.tsx` - Sidebar with roleConfig export
- `client/src/pages/landing.tsx` - SaaS landing page

## Development
- Start: `npm run dev` (serves on port 5000)
- DB push: `npm run db:push`
- Build: `npm run build`
- Production: `npm start`

## Documentation
- README.md, CONFIGURATION.md, DEPLOYMENT.md, DATABASE.md, API.md

## User Preferences
- Cloud-agnostic (no Replit-specific services)
- Self-hostable with comprehensive deployment docs
- Standard PostgreSQL, JWT auth, SMTP-ready
- Theme: Indigo-violet primary, role-based badge colors
