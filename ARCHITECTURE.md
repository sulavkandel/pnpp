# Architecture — Pokhara Mahanagarpalika Complaint Portal (PNPP)

## System Overview

```
┌────────────────────────────────────────────────────────────────┐
│                        Browser (Client)                        │
│                                                                │
│  index.html          citizen-portal.html   department-portal  │
│  admin-panel.html    department-login.html  admin-login.html  │
│                                                                │
│  scripts/            main.js  citizen-portal.js               │
│                      department-portal.js  admin-panel.js     │
│                      role-login.js  add-department-admin.js   │
│                                                                │
│  Fetch API ──────────────────────────────────────────────────►│
└───────────────────────────────┬────────────────────────────────┘
                                │ HTTP (port 4000)
                                │ Authorization: Bearer <token>
                                ▼
┌────────────────────────────────────────────────────────────────┐
│                    Node.js HTTP Server                         │
│                   backend/src/server.js                        │
│                                                                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────┐   │
│  │ Auth Routes │  │ Citizen/     │  │  Admin Routes      │   │
│  │ /api/auth/* │  │ Officer      │  │  /api/admin/*      │   │
│  └─────────────┘  │ Routes       │  └────────────────────┘   │
│                   │ /api/complaints│                           │
│                   │ /api/officer/* │                           │
│                   └──────────────┘                            │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                   Middleware Layer                       │  │
│  │  parseBody() → requireAuth() → role checks              │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                Business Logic Layer                      │  │
│  │  routing engine · round-robin assignment · SLA calc     │  │
│  │  points calculation · forwarding service                │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │                 Repository Layer                         │  │
│  │  userRepo · complaintRepo · officeAccountRepo            │  │
│  │  sessionRepo · departmentRepo · wardRepo                │  │
│  │  adminRepo · commentRepo · assignmentCounterRepo        │  │
│  └─────────────────────────────────────────────────────────┘  │
└───────────────┬───────────────────────────┬────────────────────┘
                │                           │
                ▼                           ▼
┌───────────────────────┐     ┌─────────────────────────────┐
│    MongoDB Atlas      │     │  local-store.json (fallback) │
│    pnpp_portal DB     │     │  backend/data/               │
│                       │     │                              │
│  11 collections       │     │  Same structure, in-memory   │
│  TTL indexes          │     │  read/write on each request  │
│  Unique indexes       │     └─────────────────────────────┘
└───────────────────────┘
```

---

## Backend Architecture

### Request Flow

```
HTTP Request
    │
    ▼
parseBody()         ← reads JSON body from stream
    │
    ▼
Route matching      ← manual if/else on req.url + req.method
    │
    ▼
requireAuth()       ← validates Bearer token against sessions collection
    │
    ▼
Role check          ← compares principal.role to required roles
    │
    ▼
Handler logic       ← all in server.js; calls repository methods
    │
    ▼
Repository          ← MongoDB or local JSON
    │
    ▼
JSON response       ← { success, data } or { success: false, message }
```

### Repository Pattern

Each entity has a repository file under `database/repositories/`. Repositories expose async CRUD methods. Both MongoDB and local-store implementations share the same interface.

```
database/repositories/
├── userRepository.js              findByMobile, findByCitizenCode, create, update
├── officeAccountRepository.js     findByLoginId, findByDeptSection, create, update
├── complaintRepository.js         findByToken, findByCitizenId, findByOfficer, create, update
├── sessionRepository.js           create, findByTokenHash, revoke, cleanup
├── departmentRepository.js        findAll, findByCode, create, update, delete
├── wardRepository.js              findAll, findByNumber
├── commentRepository.js           findByComplaint, create
├── adminRepository.js             logAction, getRecentLogs
└── assignmentCounterRepository.js getAndIncrement (round-robin counter)
```

### Database Collections

```
MongoDB: pnpp_portal
│
├── users                    ← Citizens
│   └── indexes: mobileNumber (unique), citizenCode
│
├── office_accounts          ← Officers & Ward accounts
│   └── indexes: loginId (unique), departmentCode+divisionName+sectionName
│
├── complaints               ← All complaints
│   └── indexes: tokenNumber (unique), citizenId, assignedOfficerId, status
│
├── sessions                 ← Auth sessions
│   └── indexes: tokenHash, expiresAt (TTL — auto-delete)
│
├── departments              ← Department registry
│   └── indexes: code (unique)
│
├── wards                    ← Ward information
│   └── indexes: wardNumber
│
├── complaint_comments       ← Full comment thread per complaint
│   └── indexes: complaintToken
│
├── complaint_status_history ← Immutable audit trail
│   └── indexes: complaintToken
│
├── assignment_counters      ← Round-robin counters per routing bucket
│   └── indexes: bucket (unique)
│
├── rotations                ← Officer weekly duty schedules
│   └── indexes: officerId, weekKeys, active
│
└── admin_logs               ← Admin action audit trail
    └── indexes: createdAt
```

---

## Frontend Architecture

### Page → Script Mapping

| HTML Page | JS Script | Role |
|-----------|-----------|------|
| index.html | main.js | Citizen login/signup, complaint tracking |
| citizen-portal.html | citizen-portal.js | Citizen dashboard & complaint wizard |
| department-login.html | role-login.js | Officer/Ward login |
| department-portal.html | department-portal.js | Officer complaint management |
| admin-login.html | main.js (inline) | Admin login |
| admin-panel.html | admin-panel.js | Admin dashboard & management |
| add-department-admin.html | add-department-admin.js | Officer registration form |

### Frontend Patterns

- **No framework** — direct DOM manipulation via `document.querySelector`, `innerHTML`
- **API calls** — all via `fetch()` with `Authorization: Bearer <token>` header
- **Auth state** — token stored in `sessionStorage` as `authToken`; `sessionStorage` also holds `userRole`, `userName`, etc.
- **Language toggle** — `currentLang` variable, `applyTranslations()` function updates `[data-i18n]` elements
- **Forms** — multi-step wizard pattern in citizen portal (step 1-4)
- **Modals** — custom CSS modal classes, shown/hidden via `classList.toggle('active')`

### CSS Architecture

Single file: `frontend/src/styles/main.css`

- Shared across all pages via `<link>` tag
- CSS variables for color scheme (PMC blue: `#1a3a6b`, PMC gold: `#c9a227`)
- Responsive breakpoints at 768px and 480px
- Devanagari support via Google Fonts: Manrope + Noto Sans Devanagari

---

## Authentication Architecture

```
Client                          Server                       MongoDB
  │                               │                             │
  │── POST /api/auth/login ───────►│                             │
  │   { mobileNumber, password }   │── SHA256(password) ─────►  │
  │                               │   lookup users collection   │
  │                               │◄─ user document ────────── │
  │                               │                             │
  │                               │── crypto.randomBytes(24) ──►│
  │                               │   token = hex string        │
  │                               │   tokenHash = SHA256(token)  │
  │                               │── INSERT sessions ──────── ►│
  │                               │   { tokenHash, principal,   │
  │                               │     expiresAt: +12h }       │
  │◄── { token, user } ──────────│                             │
  │                               │                             │
  │  sessionStorage.setItem(      │                             │
  │    'authToken', token)        │                             │
  │                               │                             │
  │── GET /api/officer/dashboard ─►│                             │
  │   Authorization: Bearer token │── SHA256(token) ──────────►│
  │                               │   lookup sessions           │
  │                               │   check !revokedAt          │
  │                               │   check expiresAt > now     │
  │◄── dashboard data ────────── │                             │
```

---

## Complaint Routing Engine

```
Citizen submits complaint
        │
        ▼
  Extract keywords from
  category + description
        │
        ▼
  Match routing rules         ← 9 category → department mappings
        │
        ├─ ward complaint? ──► target = "ward" + wardNumber
        │
        └─ dept complaint? ──► target = "department" + divisionName + sectionName
                │
                ▼
        Find active officers
        in target bucket
                │
                ├─ officers found? ──► round-robin via assignment_counters
                │                      → assignedOfficerId set
                │
                └─ none found? ──► fallback to central_admin
                                   → admin reviews manually
```

---

## Officer Duty Rotation System

Officers are assigned to weeks using ISO week keys (`YYYY-WNN`).

```
Admin creates rotation
    └── officerId, startDate, endDate
            │
            ▼
    Server calculates weekKeys[]
    e.g. ["2026-W01", "2026-W02", "2026-W03"]
            │
            ▼
    Stored in rotations collection
    AND pushed to office_accounts.assignmentWeeks[]

Officer attempts login
    │
    ▼
    Get current week key (YYYY-WNN)
    Check office_accounts.assignmentWeeks includes currentWeek
    │
    ├─ yes → login allowed
    └─ no  → 401 "Not on duty this week"
```

---

## Points & Performance System

```
Complaint resolved
        │
        ▼
calculatePoints(priority)
  high   → 30 officer pts / 60 citizen pts
  medium → 20 officer pts / 40 citizen pts
  low    → 10 officer pts / 20 citizen pts
        │
        ├─ resolved < 48h? → officer +10 bonus
        │
        ▼
UPDATE office_accounts
  currentWeekPoints += officerPts
  allTimePoints += officerPts
        │
        ▼
UPDATE users (citizen)
  rewardPoints += citizenPts

Weekly leaderboard = sort officers by currentWeekPoints DESC, top 5
```

---

## Known Technical Debt

| Issue | Location | Risk |
|-------|----------|------|
| SHA256 password hashing (no salt) | server.js auth handlers | Security — rainbow table attacks |
| All API logic in one ~25K line file | server.js | Maintainability |
| controllers/ and routes/ unused | backend/src/ | Confusion — dead code |
| Hardcoded admin credentials | server.js | Security |
| CORS: allow all origins | server.js CORS headers | Security |
| No rate limiting | server.js | DoS / brute force |
| No HTTPS enforcement | server config | Security |
| local-store.json read on every request | localStore.js | Performance at scale |
| JWT_SECRET defined but unused | appConfig.js | Dead config |

---

## Deployment Considerations

- Set `MONGODB_URI`, `MONGODB_DB_NAME`, `PORT` in `.env`
- Backend serves API only; frontend HTML files need a separate static file server (e.g., nginx, GitHub Pages, Netlify)
- Frontend API URL (`http://localhost:4000`) is hardcoded in JS scripts — update for production
- MongoDB Atlas: ensure IP whitelist includes server IP
- No PM2/process manager configured — add for production uptime
