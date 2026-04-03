# PNPP Implementation Rebase Plan

This plan re-baselines `/Users/saangetamang/Downloads/implementation_plan.md` against the current code in this repository as of 2026-04-02.

## Why This Exists

The original implementation plan is partially stale. Several items listed there as "missing" are already implemented in this repo, so using it as-is would cause duplicate work and confusion. This document narrows the plan to the work that still appears necessary after scanning the codebase.

## Audit Summary

### Already Implemented In Code

- Officer handover queue endpoint exists in [backend/src/server.js](/Users/saangetamang/Documents/PNPP/backend/src/server.js).
- Officer portal already has a Handover Review tab in [department-portal.html](/Users/saangetamang/Documents/PNPP/department-portal.html) and [frontend/src/scripts/department-portal.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/department-portal.js).
- `proofImage` is already rendered in officer and citizen complaint detail views in [frontend/src/scripts/department-portal.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/department-portal.js) and [frontend/src/scripts/citizen-portal.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/citizen-portal.js).
- `pending_admin_verification` is already wired into backend status handling and admin oversight flows in [backend/src/server.js](/Users/saangetamang/Documents/PNPP/backend/src/server.js).
- The local JSON seed already includes 10 Mahashakhas plus 25 Ranak Sakha-style sub-units in [backend/src/localStore.js](/Users/saangetamang/Documents/PNPP/backend/src/localStore.js).
- Admin oversight, rotations, and analytics endpoints already exist in [backend/src/server.js](/Users/saangetamang/Documents/PNPP/backend/src/server.js), with matching UI in [frontend/src/scripts/admin-panel.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/admin-panel.js) and [admin-panel.html](/Users/saangetamang/Documents/PNPP/admin-panel.html).
- Weekly report print/PDF flow already exists in [frontend/src/scripts/department-portal.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/department-portal.js).
- The landing page already links to admin login, and the admin panel already contains officer-management UI, so `add-department-admin.html` is now secondary rather than required.

### Still Missing Or Needing Cleanup

- Frontend API URLs are still hardcoded to `http://localhost:4000` across multiple scripts.
- OTP-based citizen phone verification is not implemented.
- GPS capture exists, but coordinates are only stored in `locationText`; there is no map rendering.
- Chatbot integration is not implemented beyond a floating button style/presence on the landing page.
- The plan’s requested visual redesign has not been completed in a structured, portal-by-portal way, even though the current CSS is more polished than the old document suggests.
- The officer handover flow exists, but it still needs a product-level review:
  the current backend logic filters by "solved before this week" rather than by explicit outgoing/incoming rotation linkage, so the queue may be broader than the intended spec.
- Department metadata is split between seeded backend departments and hardcoded frontend selector lists, which can drift.

## Recommended Execution Order

### Phase 1: Stabilize Existing Behavior

Goal: reduce drift and tighten the features that already exist.

1. Reconcile department structure sources.
   Files:
   [backend/src/localStore.js](/Users/saangetamang/Documents/PNPP/backend/src/localStore.js)
   [frontend/src/scripts/role-login.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/role-login.js)
   [frontend/src/scripts/add-department-admin.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/add-department-admin.js)

2. Review the handover queue business rule.
   Files:
   [backend/src/server.js](/Users/saangetamang/Documents/PNPP/backend/src/server.js)
   [frontend/src/scripts/department-portal.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/department-portal.js)

3. Decide whether handover verification should create a distinct audit action or remain a normal complaint review action.
   Files:
   [backend/src/server.js](/Users/saangetamang/Documents/PNPP/backend/src/server.js)
   [frontend/src/scripts/department-portal.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/department-portal.js)

4. Verify that seeded sub-departments match the real municipal hierarchy.
   Files:
   [backend/src/localStore.js](/Users/saangetamang/Documents/PNPP/backend/src/localStore.js)

Acceptance criteria:

- Login selectors and backend department/section routing use the same vocabulary.
- Handover review behavior is clearly defined and documented.
- No duplicate or contradictory department/unit labels remain in the UI.

### Phase 2: Configuration Hardening

Goal: remove deployment blockers with minimal risk.

1. Introduce a shared frontend config module for API base URL.
   New file:
   [frontend/src/scripts/config.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/config.js)

2. Replace hardcoded API URLs in all affected scripts.
   Files:
   [frontend/src/scripts/main.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/main.js)
   [frontend/src/scripts/role-login.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/role-login.js)
   [frontend/src/scripts/add-department-admin.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/add-department-admin.js)
   [frontend/src/scripts/citizen-portal.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/citizen-portal.js)
   [frontend/src/scripts/department-portal.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/department-portal.js)
   [frontend/src/scripts/admin-panel.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/admin-panel.js)

3. Expand env docs to include all currently read backend variables.
   Files:
   [backend/.env.example](/Users/saangetamang/Documents/PNPP/backend/.env.example)
   [backend/src/config/appConfig.js](/Users/saangetamang/Documents/PNPP/backend/src/config/appConfig.js)

Acceptance criteria:

- No frontend script contains a literal localhost API base.
- Local dev still works without a build step.
- Environment docs mention `PORT`, `MONGODB_URI`, `MONGODB_DB_NAME`, `JWT_SECRET`, and the currently defined `ANTHROPIC_API_KEY`.

### Phase 3: UX Refresh Without Breaking Functionality

Goal: improve presentation while preserving the current working flows.

1. Refactor shared design tokens in [frontend/src/styles/main.css](/Users/saangetamang/Documents/PNPP/frontend/src/styles/main.css).
2. Redesign the landing page in [index.html](/Users/saangetamang/Documents/PNPP/index.html) and [frontend/src/scripts/main.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/main.js).
3. Refresh the citizen dashboard/wizard in [citizen-portal.html](/Users/saangetamang/Documents/PNPP/citizen-portal.html) and [frontend/src/scripts/citizen-portal.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/citizen-portal.js).
4. Refresh the officer portal in [department-portal.html](/Users/saangetamang/Documents/PNPP/department-portal.html) and [frontend/src/scripts/department-portal.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/department-portal.js).
5. Refresh the admin dashboard in [admin-panel.html](/Users/saangetamang/Documents/PNPP/admin-panel.html) and [frontend/src/scripts/admin-panel.js](/Users/saangetamang/Documents/PNPP/frontend/src/scripts/admin-panel.js).

Implementation note:

- Keep the existing bilingual support intact while redesigning.
- Prefer incremental CSS/HTML enhancement over large DOM rewrites, because the current pages already carry a lot of working behavior.

Acceptance criteria:

- All three portals remain usable on mobile and desktop.
- Existing workflows still function after restyling.
- No portal-specific redesign depends on a framework or build tooling.

### Phase 4: Optional Feature Decisions

Goal: close open product decisions before deeper implementation.

1. OTP verification
   Decision needed:
   integrate real SMS OTP now, mock it for staging only, or formally defer it.

2. Map display for GPS
   Decision needed:
   use a lightweight embedded map, a static map preview, or a plain coordinate linkout.

3. Chatbot
   Decision needed:
   remove the floating button until a real flow exists, or implement a minimal guided assistant later as a separate phase.

## Highest-Value Near-Term Tasks

If implementation starts immediately, these are the best first tasks:

1. Replace hardcoded frontend API URLs with a shared config module.
2. Unify department/section definitions between backend seeds and frontend selectors.
3. Revisit handover queue semantics so they match the actual rotation model instead of a date-only approximation.
4. Update environment documentation to match current code.

## Risks To Watch

- `backend/src/server.js` is the routing and business-logic monolith, so changes there need careful regression testing.
- The repo already has user changes in progress; avoid assuming the worktree is clean.
- `backend/data/local-store.json` is large and should not be churned unless seed behavior specifically requires it.
- Frontend translations are duplicated per page, so wording or label changes must be applied carefully in both Nepali and English.

## Suggested Manual Verification

1. Run backend and confirm login, complaint filing, officer review, admin oversight, and analytics still work.
2. Test both MongoDB-backed mode and local JSON fallback if possible.
3. Specifically test:
   citizen complaint submission with proof image,
   officer complaint accept/solve/forward flows,
   officer handover queue visibility,
   admin oversight actions on `pending_admin_verification`,
   frontend behavior when API base URL is changed via shared config.

## Decision Log From Audit

- Treat the original implementation plan as a starting reference, not the current source of truth.
- Do not schedule duplicate work for handover UI, proof-image rendering, analytics, or seeded sub-units unless a spec review says the current implementation is insufficient.
- Prioritize configuration hardening and data-model consistency before large visual redesign work.
