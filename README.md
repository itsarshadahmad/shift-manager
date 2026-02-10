# ShiftFlow - Employee Shift Scheduler SaaS

A cloud-agnostic, self-hostable employee shift scheduling platform with time-off management, team communication, and reporting.

## Features

- **Schedule Management** - Drag-and-drop weekly schedule builder with conflict detection
- **Time-Off Management** - Employee self-service requests with manager approval workflow
- **Team Communication** - In-app messaging and broadcast announcements
- **Shift Swaps** - Employee-initiated shift swap requests with manager approval
- **Reporting** - Hours worked, labor cost projections, time-off usage tracking
- **Multi-Tenant** - Organization-level data isolation with role-based access control
- **Dark Mode** - Full light/dark theme support
- **Responsive** - Works on desktop, tablet, and mobile browsers

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Node.js 20+, Express.js, TypeScript |
| Database | PostgreSQL 15+ (Drizzle ORM) |
| Auth | JWT tokens with HTTP-only cookies |
| Build | Vite, esbuild |

## Quick Start

### Prerequisites

- Node.js 20+ (with npm)
- PostgreSQL 15+ database

### 1. Clone and Install

```bash
git clone <repository-url>
cd shift-scheduler
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/shiftflow
SESSION_SECRET=your-strong-random-secret-key-here
PORT=5000
NODE_ENV=development
```

See [CONFIGURATION.md](./CONFIGURATION.md) for all environment variables.

### 3. Set Up Database

```bash
npm run db:push
```

This creates all required tables in your PostgreSQL database.

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5000`.

### 5. Default Login

On first run, the database is seeded with sample data:

| Email | Password | Role |
|-------|----------|------|
| admin@sunrisecafe.com | password123 | Owner |
| manager@sunrisecafe.com | password123 | Manager |
| maria@sunrisecafe.com | password123 | Employee |

## Production Build

```bash
npm run build
npm start
```

## Project Structure

```
├── client/                  # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Route pages
│   │   ├── lib/             # Utilities (auth, query client)
│   │   └── hooks/           # Custom React hooks
│   └── index.html
├── server/                  # Backend (Express.js)
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # API routes
│   ├── storage.ts           # Database access layer
│   ├── auth.ts              # JWT auth middleware
│   ├── db.ts                # Database connection
│   └── seed.ts              # Sample data seeder
├── shared/
│   └── schema.ts            # Database schema + TypeScript types
├── CONFIGURATION.md         # Environment variables reference
├── DEPLOYMENT.md            # Cloud deployment guide
└── DATABASE.md              # Schema documentation
```

## Documentation

- [CONFIGURATION.md](./CONFIGURATION.md) - Environment variables and settings
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Cloud deployment instructions (AWS, Azure, IBM Cloud)
- [DATABASE.md](./DATABASE.md) - Database schema and migration guide
- [API.md](./API.md) - API endpoint documentation

## User Roles

| Role | Permissions |
|------|-------------|
| **Owner** | Full access - manage organization, employees, schedules, approvals |
| **Manager** | Create/edit schedules, approve time-off and swaps, add employees |
| **Employee** | View schedule, request time-off, request shift swaps, send messages |

## License

MIT
