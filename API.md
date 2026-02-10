# API Documentation

## Base URL

All API endpoints are prefixed with `/api`.

## Authentication

ShiftFlow uses JWT tokens stored in HTTP-only cookies. Include credentials in all requests:

```javascript
fetch('/api/endpoint', { credentials: 'include' })
```

### POST /api/auth/register

Create a new organization and owner account.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "min6chars",
  "firstName": "John",
  "lastName": "Doe",
  "organizationName": "My Company"
}
```

**Response:** `200 OK`
```json
{
  "user": { "id": "...", "email": "...", "firstName": "...", ... }
}
```

### POST /api/auth/login

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:** `200 OK` with user object and `Set-Cookie` header.

### POST /api/auth/logout

Clears the authentication cookie.

### GET /api/auth/me

Returns the currently authenticated user. Returns `401` if not authenticated.

---

## Users

### GET /api/users

List all users in the organization.

**Auth:** Required  
**Response:** Array of user objects (passwords excluded)

### POST /api/users

Create a new employee.

**Auth:** Required (Owner or Manager)  
**Body:**
```json
{
  "email": "employee@example.com",
  "password": "password123",
  "firstName": "Jane",
  "lastName": "Smith",
  "role": "employee",
  "position": "Server",
  "hourlyRate": "18.00",
  "phone": "555-0123"
}
```

---

## Locations

### GET /api/locations

List all locations.

**Auth:** Required

### POST /api/locations

Create a new location.

**Auth:** Required (Owner or Manager)  
**Body:**
```json
{
  "name": "Downtown Branch",
  "address": "123 Main St",
  "timezone": "America/New_York"
}
```

---

## Shifts

### GET /api/shifts

List all shifts for the organization.

**Auth:** Required

### POST /api/shifts

Create a new shift.

**Auth:** Required (Owner or Manager)  
**Body:**
```json
{
  "locationId": "location-uuid",
  "userId": "user-uuid",
  "startTime": "2025-01-15T09:00:00.000Z",
  "endTime": "2025-01-15T17:00:00.000Z",
  "position": "Server",
  "status": "scheduled"
}
```

### PATCH /api/shifts/:id

Update an existing shift.

**Auth:** Required (Owner or Manager)

### DELETE /api/shifts/:id

Delete a shift.

**Auth:** Required (Owner or Manager)

---

## Time Off

### GET /api/time-off

List all time-off requests.

**Auth:** Required

### POST /api/time-off

Submit a time-off request.

**Auth:** Required  
**Body:**
```json
{
  "startDate": "2025-02-10T00:00:00.000Z",
  "endDate": "2025-02-12T00:00:00.000Z",
  "type": "vacation",
  "reason": "Family trip"
}
```

### PATCH /api/time-off/:id

Approve or deny a request.

**Auth:** Required (Owner or Manager)  
**Body:**
```json
{
  "status": "approved"
}
```

---

## Messages

### GET /api/messages

List all messages (inbox + sent).

**Auth:** Required

### POST /api/messages

Send a message.

**Auth:** Required  
**Body:**
```json
{
  "recipientId": "user-uuid",
  "subject": "Schedule update",
  "body": "Your shift has been updated.",
  "isBroadcast": false
}
```

### PATCH /api/messages/:id

Mark message as read.

**Auth:** Required  
**Body:**
```json
{
  "isRead": true
}
```

---

## Notifications

### GET /api/notifications

List all notifications for the current user.

**Auth:** Required

### PATCH /api/notifications/:id

Mark a notification as read.

**Auth:** Required

### POST /api/notifications/mark-all-read

Mark all notifications as read.

**Auth:** Required

---

## Shift Swaps

### GET /api/swaps

List all shift swap requests.

**Auth:** Required

### POST /api/swaps

Request a shift swap.

**Auth:** Required  
**Body:**
```json
{
  "shiftId": "shift-uuid",
  "targetUserId": "user-uuid",
  "reason": "Need to attend an event"
}
```

### PATCH /api/swaps/:id

Approve or deny a swap request. If approved, the shift is automatically reassigned.

**Auth:** Required (Owner or Manager)  
**Body:**
```json
{
  "status": "approved"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "message": "Description of the error"
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (not authenticated) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not Found |
| 500 | Internal Server Error |
