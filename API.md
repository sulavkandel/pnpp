# API Reference — PNPP Backend

Base URL: `http://localhost:4000`

All protected endpoints require:
```
Authorization: Bearer <session-token>
Content-Type: application/json
```

---

## Health Check

| Method | Path |
|--------|------|
| GET | `/health` |
| GET | `/routes` |

---

## Authentication — `/api/auth`

### POST `/api/auth/register`
Register a new citizen account.

**Body:**
```json
{
  "name": "Ram Bahadur",
  "mobileNumber": "9800000000",
  "email": "ram@example.com",
  "password": "secret123",
  "anonymous": false
}
```
**Response `201`:**
```json
{
  "success": true,
  "data": {
    "token": "<session-token>",
    "user": { "name", "mobileNumber", "rewardPoints", "citizenCode" }
  }
}
```
If `anonymous: true`, a `citizenCode` (`CIT-XXXX`) is generated. No personal info required.

---

### POST `/api/auth/login`
Citizen login.

**Body:**
```json
{
  "identifier": "9800000000",
  "password": "secret123"
}
```
`identifier` can be a mobile number or `CIT-XXXX` code.

**Response `200`:**
```json
{
  "success": true,
  "data": { "token": "<token>", "user": { ... } }
}
```

---

### POST `/api/auth/department-login`
Officer or Ward login.

**Body:**
```json
{
  "officeType": "department",
  "divisionName": "Infrastructure Development",
  "sectionName": "Road Section",
  "loginId": "road_admin_demo_2026",
  "password": "roadpass123"
}
```
For ward type: include `"wardNumber": "17"`.

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "token": "<token>",
    "officer": {
      "name", "role", "divisionName", "sectionName",
      "wardNumber", "currentWeekPoints", "allTimePoints"
    }
  }
}
```
**Fails `401`** if officer has no active rotation for the current week.

---

### POST `/api/auth/admin-login`
Admin login.

**Body:**
```json
{
  "loginId": "admin@pokharamun.gov.np",
  "password": "admin"
}
```

---

### POST `/api/auth/logout`
Revoke current session. Requires auth.

---

## Citizen — `/api/citizen`, `/api/complaints`

### GET `/api/citizen/dashboard`
Auth: citizen

**Response:**
```json
{
  "success": true,
  "data": {
    "stats": { "total", "resolved", "inProgress", "underReview" },
    "recentComplaints": [ ... ],
    "rewardPoints": 120
  }
}
```

---

### POST `/api/complaints`
Auth: citizen. Submit a new complaint.

**Body:**
```json
{
  "title": "Pothole on main road",
  "category": "road",
  "subcategory": "pothole",
  "description": "Large pothole near...",
  "locationText": "Near Prithvi Chowk",
  "wardNumber": "17",
  "areaName": "Bagar",
  "nearestLandmark": "Post Office",
  "priority": "high",
  "anonymous": false,
  "contactOptIn": true,
  "contactName": "Ram Bahadur",
  "contactPhone": "9800000000",
  "contactEmail": "ram@example.com",
  "proofImage": {
    "name": "photo.jpg",
    "mimeType": "image/jpeg",
    "dataUrl": "data:image/jpeg;base64,..."
  },
  "attachments": []
}
```

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "tokenNumber": "PMC-2026-000001",
    "status": "pending",
    "assignedTo": "..."
  }
}
```

Media limits: images ≤ 2.5 MB, documents ≤ 4.5 MB, max 5 attachments.

---

### GET `/api/complaints/mine`
Auth: citizen. List all complaints by current user.

Query params: `?status=pending&page=1&limit=10`

---

### GET `/api/complaints/track`
Public (no auth). Track a complaint.

Query params: `?token=PMC-2026-000001` or `?mobile=9800000000`

---

### GET `/api/complaints/:tokenNumber`
Auth: required. Returns complaint details. Citizens see their own only.

---

### PATCH `/api/complaints/:tokenNumber/feedback`
Auth: citizen. Submit rating after complaint is solved.

**Body:**
```json
{
  "rating": 4,
  "feedback": "Resolved quickly, thank you."
}
```

---

## Officer — `/api/officer`, `/api/complaints`

### GET `/api/officer/dashboard`
Auth: department / ward

**Response:**
```json
{
  "success": true,
  "data": {
    "kpis": {
      "receivedThisWeek": 12,
      "completed": 8,
      "avgResponseTimeHours": 18,
      "weeklyPoints": 160
    },
    "leaderboard": [ { "name", "points" }, ... ],
    "slaBreach": 2
  }
}
```

---

### GET `/api/officer/complaints`
Auth: department / ward. Returns complaints routed to this officer's division/section.

Query: `?status=pending&page=1&limit=20`

---

### PATCH `/api/complaints/:tokenNumber/status`
Auth: department / ward. Update complaint status.

**Body:**
```json
{
  "status": "in_progress",
  "note": "Accepted and assigned crew"
}
```
Valid statuses: `in_progress`, `solved`, `delayed`, `escalated`, `cannot_solve`, `pending_admin_verification`

---

### PATCH `/api/complaints/:tokenNumber/eta`
Auth: department / ward. Set estimated completion date.

**Body:**
```json
{
  "estimatedCompletionAt": "2026-04-10T00:00:00Z"
}
```

---

### POST `/api/complaints/:tokenNumber/comments`
Auth: department / ward / admin. Add a comment.

**Body:**
```json
{
  "message": "Work crew dispatched.",
  "visibility": "public"
}
```
`visibility`: `"public"` (visible to citizen) or `"internal"` (officers only)

---

### PATCH `/api/complaints/:tokenNumber/forward`
Auth: department / ward. Forward complaint to another office.

**Body:**
```json
{
  "forwardTo": "department",
  "divisionName": "Urban Dev & Environment",
  "sectionName": "Solid Waste",
  "reason": "Incorrect routing — this is a waste issue"
}
```

---

## Admin — `/api/admin`

All admin endpoints require auth with role `admin`.

### GET `/api/admin/dashboard`
Full system overview: total complaints, status breakdown, SLA breaches, recent activity.

---

### GET `/api/admin/complaints`
All complaints with filters.

Query: `?status=escalated&department=...&ward=...&page=1&limit=20`

---

### GET `/api/admin/departments`
List all departments.

### POST `/api/admin/departments`
**Body:** `{ "code", "name", "type", "wards", "description" }`

### PATCH `/api/admin/departments/:code`
**Body:** partial department fields

### DELETE `/api/admin/departments/:code`

---

### GET `/api/admin/officers`
List all officer accounts.

### POST `/api/admin/officers`
Create officer account.

**Body:**
```json
{
  "name": "Sita Sharma",
  "loginId": "sita_infra_2026",
  "password": "pass123",
  "email": "sita@pokharamun.gov.np",
  "phone": "9812345678",
  "officeType": "department",
  "departmentCode": "INFRA",
  "divisionName": "Infrastructure Development",
  "sectionName": "Road Section"
}
```

### PATCH `/api/admin/officers/:id`

---

### GET `/api/admin/rotations`
List all duty rotations.

### POST `/api/admin/rotations`
Assign officer to date range.

**Body:**
```json
{
  "officerId": "<ObjectId>",
  "startDate": "2026-04-07",
  "endDate": "2026-04-20"
}
```
Server calculates `weekKeys` automatically.

---

### GET `/api/admin/oversight`
List escalated, flagged, and `pending_admin_verification` complaints.

### PATCH `/api/admin/oversight/:tokenNumber`
Admin decision on flagged complaint.

**Body:**
```json
{
  "action": "reopen",
  "note": "Returning for re-investigation"
}
```
Actions: `"reopen"`, `"close_invalid"`, `"verify_solved"`

---

### GET `/api/admin/office-accounts`
List all office accounts (officers + wards).

### POST `/api/admin/office-accounts`
Same as POST `/api/admin/officers`.

---

### GET `/api/admin/analytics`
Department performance metrics, ward breakdown, SLA compliance rates, resolution timelines.

---

## Common Response Shapes

**Success:**
```json
{ "success": true, "data": { ... } }
```

**Created:**
```json
{ "success": true, "data": { ... } }  // HTTP 201
```

**Error:**
```json
{ "success": false, "message": "Description of error" }
```

**HTTP Status Codes:**
| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Bad request / validation error |
| 401 | Unauthenticated / expired session |
| 403 | Forbidden / wrong role |
| 404 | Not found |
| 409 | Conflict (duplicate) |
| 500 | Server error |
