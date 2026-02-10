# Database Documentation

## Overview

ShiftFlow uses PostgreSQL with Drizzle ORM for type-safe database access. The schema is defined in `shared/schema.ts` and shared between frontend and backend.

## Schema

### Organizations
Multi-tenant isolation boundary. All data belongs to an organization.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (UUID) | Primary key |
| name | TEXT | Organization name |
| plan_tier | TEXT | Subscription tier (starter, professional, enterprise) |
| created_at | TIMESTAMP | Creation date |

### Users
Employees, managers, and owners within an organization.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (UUID) | Primary key |
| organization_id | VARCHAR | FK to organizations |
| email | TEXT | Unique email address |
| password | TEXT | Bcrypt-hashed password |
| first_name | TEXT | First name |
| last_name | TEXT | Last name |
| phone | TEXT | Phone number (optional) |
| role | ENUM | owner, manager, or employee |
| hourly_rate | DECIMAL(10,2) | Pay rate (optional) |
| position | TEXT | Job title (optional) |
| is_active | BOOLEAN | Active/inactive status |
| created_at | TIMESTAMP | Creation date |

### Locations
Physical work locations.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (UUID) | Primary key |
| organization_id | VARCHAR | FK to organizations |
| name | TEXT | Location name |
| address | TEXT | Street address (optional) |
| timezone | TEXT | IANA timezone |
| is_active | BOOLEAN | Active/inactive status |
| created_at | TIMESTAMP | Creation date |

### Shifts
Individual shift assignments.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (UUID) | Primary key |
| organization_id | VARCHAR | FK to organizations |
| location_id | VARCHAR | FK to locations |
| user_id | VARCHAR | FK to users (nullable for unassigned) |
| start_time | TIMESTAMP | Shift start |
| end_time | TIMESTAMP | Shift end |
| position | TEXT | Role for this shift (optional) |
| notes | TEXT | Additional notes (optional) |
| status | ENUM | scheduled, published, completed, cancelled |
| created_at | TIMESTAMP | Creation date |

### Time Off Requests
Employee time-off submissions.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (UUID) | Primary key |
| organization_id | VARCHAR | FK to organizations |
| user_id | VARCHAR | FK to users |
| start_date | TIMESTAMP | Start of time off |
| end_date | TIMESTAMP | End of time off |
| type | ENUM | vacation, sick, personal, unpaid |
| status | ENUM | pending, approved, denied |
| reason | TEXT | Reason (optional) |
| reviewed_by | VARCHAR | Manager who reviewed |
| reviewed_at | TIMESTAMP | Review timestamp |
| created_at | TIMESTAMP | Creation date |

### Messages
In-app communication.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (UUID) | Primary key |
| organization_id | VARCHAR | FK to organizations |
| sender_id | VARCHAR | FK to users |
| recipient_id | VARCHAR | FK to users (null for broadcast) |
| subject | TEXT | Message subject |
| body | TEXT | Message content |
| is_read | BOOLEAN | Read status |
| is_broadcast | BOOLEAN | Sent to all team members |
| created_at | TIMESTAMP | Creation date |

### Shift Swap Requests
Shift exchange requests between employees.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (UUID) | Primary key |
| organization_id | VARCHAR | FK to organizations |
| shift_id | VARCHAR | FK to shifts |
| requester_id | VARCHAR | FK to users |
| target_user_id | VARCHAR | FK to users |
| status | ENUM | pending, approved, denied |
| reason | TEXT | Reason (optional) |
| reviewed_by | VARCHAR | Manager who reviewed |
| reviewed_at | TIMESTAMP | Review timestamp |
| created_at | TIMESTAMP | Creation date |

### Notifications
System notifications for users.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (UUID) | Primary key |
| organization_id | VARCHAR | FK to organizations |
| user_id | VARCHAR | FK to users |
| type | ENUM | Various notification types |
| title | TEXT | Notification title |
| message | TEXT | Notification body |
| is_read | BOOLEAN | Read status |
| created_at | TIMESTAMP | Creation date |

### Availability
Weekly availability preferences per employee.

| Column | Type | Description |
|--------|------|-------------|
| id | VARCHAR (UUID) | Primary key |
| user_id | VARCHAR | FK to users |
| day_of_week | INTEGER | 0 (Sunday) - 6 (Saturday) |
| start_time | TEXT | Available from (e.g. "09:00") |
| end_time | TEXT | Available until (e.g. "17:00") |
| is_available | BOOLEAN | Whether available |

## Migrations

ShiftFlow uses Drizzle Kit for schema management:

```bash
# Push schema changes to database (development)
npm run db:push

# Force push (drops and recreates changed columns)
npm run db:push --force
```

**Important:** Never manually write SQL migrations. Always modify `shared/schema.ts` and use `npm run db:push`.

## Backup & Restore

```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

## Multi-Tenancy

All queries are filtered by `organization_id` at the application level. Every table that stores business data includes an `organization_id` foreign key. This ensures complete data isolation between organizations sharing the same database.
