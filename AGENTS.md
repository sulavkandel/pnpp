# AGENTS.md — Pokhara Mahanagarpalika Complaint Portal (PNPP)

## Project Overview
A municipal citizen grievance portal for Pokhara Metropolitan City. Citizens submit complaints; officers handle them; admins oversee everything. Multi-role system with routing, assignment, SLA tracking, and a points/performance system.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend runtime | Node.js (ES Modules, `"type": "module"`) |
| HTTP server | Built-in `node:http` module — **no Express** |
| Database | MongoDB Atlas (primary) + local JSON fallback |
| Frontend | Vanilla HTML/CSS/JS — **no framework, no build step** |
| Auth | Custom session tokens (SHA256 hash stored in MongoDB) |
| i18n | Client-side translation objects (Nepali `ne` / English `en`) |

---

## Project Structure

```
PNPP/
├── backend/
│   ├── src/
│   │   ├── server.js              ← ALL route handlers live here (monolith)
│   │   ├── localStore.js          ← JSON fallback when MongoDB unavailable
│   │   ├── config/
│   │   │   └── appConfig.js       ← PORT, MONGODB_URI, DB_NAME, JWT_SECRET
│   │   ├── database/
│   │   │   ├── client.js          ← MongoDB connection
│   │   │   ├── collections.js     ← Collection name constants + getters
│   │   │   └── repositories/      ← Data access layer (one file per entity)
│   │   ├── models/                ← Schema definitions (not enforced; docs only)
│   │   ├── controllers/           ← Currently mostly empty stubs
│   │   ├── routes/                ← Route stubs (not wired up; server.js handles all)
│   │   ├── services/
│   │   │   └── forwardingService.js  ← Complaint forwarding logic
│   │   └── utils/constants.js     ← Department list
│   ├── data/local-store.json      ← Local fallback storage (~3 MB)
│   └── package.json               ← `mongodb`, `dotenv` only
│
├── frontend/
│   └── src/
│       ├── scripts/               ← One JS file per page
│       └── styles/main.css
│
├── index.html                     ← Landing / citizen login
├── citizen-portal.html
├── department-login.html
├── department-portal.html
├── admin-login.html
├── admin-panel.html
└── add-department-admin.html
```

---

## Key Architecture Decisions

### 1. Monolithic server.js
All API route handlers are in `backend/src/server.js`. The `controllers/` and `routes/` directories exist but are **not wired up**. Do not add logic there unless you're refactoring the whole routing layer.

### 2. No Express — raw `node:http`
Routing is done via manual string matching on `req.url` and `req.method`. When adding endpoints, follow the existing pattern in `server.js`.

### 3. MongoDB + Local JSON Fallback
If `MONGODB_URI` is unavailable, the app falls back to `backend/data/local-store.json`. Both paths are implemented in `repositories/`. Changes to one path should be mirrored in the other when possible.

### 4. Session Auth (not JWT)
- Token: 24-byte random hex string
- Stored: SHA256(token) in MongoDB `sessions` collection
- Client: Sends raw token in `Authorization: Bearer <token>` header
- Client stores token in `sessionStorage`
- Sessions expire after 12 hours

### 5. Password Hashing — SHA256 Only (no salt)
This is a known weakness. Do not introduce bcrypt/Argon2 unless specifically asked — changing it would break all existing accounts.

---

## User Roles

| Role | Login Page | Description |
|------|-----------|-------------|
| `citizen` | index.html | Submits and tracks complaints |
| `department` | department-login.html | Handles routed complaints for their division/section |
| `ward` | department-login.html | Handles ward-specific complaints |
| `admin` | admin-login.html | Full system oversight and management |

### Officer Login Constraint
Officers can only log in if they have an **active weekly duty rotation** assigned. Week key format: `YYYY-WNN`. Check `assignmentWeeks` on the `OfficeAccount` document.

---

## Complaint Lifecycle

```
submitted → pending
pending → in_progress       (officer accepts)
in_progress → solved        (officer resolves)
pending → forwarded         (officer forwards)
pending/in_progress → delayed    (officer indicates delay)
pending → escalated         (escalated to admin)
any → pending_admin_verification (flagged for admin)
any → closed_invalid        (admin rejects)
any → cannot_solve          (officer marks unsolvable)
```

---

## Routing Rules (Category → Department)
| Category keyword | Routes to |
|-----------------|-----------|
| road, street, bridge | Infrastructure / Road section |
| garbage, waste, sanitation | Urban Dev & Environment |
| water, drainage, sewer | Infrastructure / Water & Sewer |
| light, electricity | Administration / Inspection |
| health | Health division |
| education | Education division |
| legal | Legal division |
| other | Administration (fallback) |

Ward-level complaints go to the ward office matching `wardNumber`.

---

## Assignment Algorithm
Round-robin across available officers in the target bucket (`department:division:section` or `ward:N`). Counter stored in `assignment_counters` collection.

---

## SLA
- First response: 24 hours from submission
- Tracked via `firstResponseAt` and `slaDueAt` fields on complaints
- Admin dashboard alerts on breaches

---

## Points System

### Citizens
| Priority | Points |
|----------|--------|
| High | 60 |
| Medium | 40 |
| Low | 20 |
Awarded when complaint is solved and verified.

### Officers (weekly KPI)
| Priority | Base | +Bonus (if resolved < 48h) |
|----------|------|--------------------------|
| High | 30 | +10 |
| Medium | 20 | +10 |
| Low | 10 | +10 |

---

## Environment Variables

```env
PORT=4000
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=pnpp_portal
JWT_SECRET=<unused in current code>
```

Place `.env` in `backend/` directory.

---

## Running the Project

```bash
# Backend
cd backend
npm install
node src/server.js

# Frontend
# No build step needed — open HTML files directly or serve statically
# API calls go to http://localhost:4000
```

---

## Demo / Seed Accounts (local-store.json fallback)

| Type | Login ID | Password | Details |
|------|----------|----------|---------|
| Department officer | `road_admin_demo_2026` | `roadpass123` | Infrastructure / Road section |
| Ward officer | `ward17_demo_2026` | `wardpass123` | Ward 17 |
| Admin | `admin@pokharamun.gov.np` | `admin` | Hardcoded in server.js |

---

## MongoDB Collections

| Collection | Purpose |
|-----------|---------|
| `users` | Citizen accounts |
| `office_accounts` | Officer / Ward accounts |
| `complaints` | All complaint records |
| `departments` | Department registry |
| `wards` | Ward information |
| `sessions` | Auth sessions (TTL index auto-expires) |
| `complaint_comments` | Full comment history |
| `complaint_status_history` | Audit trail |
| `assignment_counters` | Round-robin counters |
| `rotations` | Officer duty rotation schedules |
| `admin_logs` | Admin action audit trail |

---

## Important Caveats

- **Do not remove SHA256 hashing** — changing the hash algo breaks all existing accounts in the data store.
- **server.js is large** (~25K+ lines). Searching for a specific endpoint: look for the URL pattern string (e.g., `'/api/officer/complaints'`).
- **controllers/ and routes/ are stubs** — do not use them for new logic unless doing a full refactor.
- **local-store.json is 3.3 MB** — avoid committing large data changes to it.
- **No build tools** — frontend changes take effect immediately on reload.
- **CORS is wide open** — all origins accepted in current config.
