# EduFlow — Product Roadmap
> **Canonical phase order + architecture.** When roadmap phases appear in other files, this file wins.  
> Updated: June 17, 2026

**Related Documentation:** [README](./README.md) · [AGENTS](./AGENTS.md) · [VISION](./VISION.md) · [AUDIT](./AUDIT.md) · [Design](./Design.md) · [CHANGELOG](./CHANGELOG.md)

> This file now also contains the **Architecture & Rebuild Plan** (merged from the former `REBUILD_PLAN.md`) — see the section after the phase roadmap.

---

## Current Status: Next.js App Complete (UI layer) ✅

The Next.js 15 app contains **all 69 pages** across 6 roles, fully ported from the Scholaris prototype.
See [AUDIT.md](./AUDIT.md) for the detailed gap analysis, outstanding features, and upgrade tasks.
See [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) for the full page-by-page porting checklist.

---

## Phase 0 — Prototype Completion (In Progress)

> **Goal:** Finish all missing features in the Scholaris prototype before starting the production backend.

| # | Deliverable | Priority |
|---|---|---|
| P0.1 | **Dark mode** — full `prefers-color-scheme` + manual `.dark` rollout across all 69 pages and 50+ components | 🔴 Critical |
| P0.2 | **Morning Briefing countdown timer** — 5-minute period countdown on `ManagementDashboardPage` | 🟠 High |
| P0.3 | **Exam Routine component** — add `ExamRoutine.tsx` to `src/components/` (reuse timetable builder layout) | 🟠 High |
| P0.4 | **Progress Notes input flow** — teacher selects class → section → student → adds note (understood/struggling/etc.) | 🟠 High |
| P0.5 | **Subject Completion Tracker** — per-subject syllabus progress bar for parent portal pages | 🟡 Medium |
| P0.6 | **Behavioral Trend chart** — weekly/monthly behavior summary graph per student for parent portal | 🟡 Medium |
| P0.7 | **Parent portal showcase** — add to `src/showcase/` (currently only accessible via Scholaris role switcher) | 🟡 Medium |
| P0.8 | **QR Code component** — `QRCodeCard.tsx` for proxy check-in; print-ready PDF output | 🟢 Low |

**Exit criteria:** All 6 roles feel complete and demo-ready. No placeholder pages.

---

## Phase 1 — Production Foundation
> **Goal:** Replace the Scholaris prototype with a real backend, auth, billing, and multi-tenancy.

| # | Deliverable | Priority |
|---|---|---|
| 1 | **Payload CMS setup** — users, teachers, classes, timetable collections + access control | 🔴 Critical |
| 2 | **PostgreSQL / SQLite schema** — full schema with `school_id` RLS (or Payload access control) | 🔴 Critical |
| 3 | **Auth** — Payload CMS Auth + social OAuth (Google, Apple, Facebook) | 🔴 Critical |
| 4 | **Multi-tenancy** — strict `school_id` isolation at API + DB layer | 🔴 Critical |
| 5 | **Real-time** — Payload Realtime or 10s polling for proxy board + notifications | 🔴 Critical |
| 6 | **Razorpay Billing** — plans, webhooks, trial/grace/suspended status gates | 🔴 Critical |
| 7 | **School onboarding wizard** — 5-step guided setup; auto-creates admin on school creation | 🔴 Critical |

**Exit criteria:** A new school can sign up, complete onboarding, and manage a real absence end-to-end.

---

## Phase 2 — Core Feature Completion
> **Goal:** Complete all daily-use features for admin, management, and teacher roles.

| # | Deliverable | Priority |
|---|---|---|
| 8 | **Class Manager** — CRUD for classes and sections | 🟠 High |
| 9 | **Expanded Teacher Profile** — photo upload, subjects/sections/classes checkboxes | 🟠 High |
| 10 | **Notification Hub** — channel config (MSG91, WATI, SendGrid), API key management, per-event toggles | 🟠 High |
| 11 | **Exam Routine Module** — timetable-style layout for exam scheduling, exam mode on proxy board | 🟠 High |
| 12 | **Swap System** — full peer-to-peer exchange with management approval flow | 🟠 High |
| 13 | **Leave Balance** — configurable quotas per school, track usage per teacher per academic year | 🟠 High |
| 14 | **Academic Year Management** — rollover, archive, fresh session | 🟡 Medium |
| 15 | **Excel Import** — `.xlsx` bulk import + CSV (alongside existing CSV) | 🟡 Medium |

**Exit criteria:** All daily workflows (absence → proxy → audit) work without workarounds.

---

## Phase 3 — Growth & Communication
> **Goal:** Add growth loops, parent engagement, and advanced school management.

| # | Deliverable | Priority |
|---|---|---|
| 16 | **Parent Portal (live)** — wire up the Scholaris parent pages to real data; unique parent login code per student; multi-child support | 🟠 High |
| 17 | **Progress Notes (live)** — teacher input → per-period notes → parent portal display | 🟠 High |
| 18 | **Affiliate Program** — 25% one-time + 5% lifetime, tiered tiers (Bronze/Silver/Gold), payout queue | 🟡 Medium |
| 19 | **Bug & Ticket System** — in-app reporting → super admin queue with priority triage | 🟡 Medium |
| 20 | **Feature Flags** — toggle beta features per school/plan without code deploy | 🟡 Medium |
| 21 | **Announcement Board** — school-wide posts with expiry, role-filtered visibility | 🟡 Medium |
| 22 | **Document Manager** — upload circulars, handbooks, policies; role-filtered access | 🟡 Medium |
| 23 | **Proxy Rules Engine** — per-school configurable algorithm & preferences | 🟡 Medium |

**Exit criteria:** Schools refer other schools. Parents use the portal. Reports are share-worthy.

---

## Phase 4 — Polish & Scale
> **Goal:** Cross-platform reach, AI intelligence, and enterprise-ready scale.

| # | Deliverable | Priority |
|---|---|---|
| 24 | **PWA** — service worker, manifest, install prompts (iOS + Android) | 🟡 Medium |
| 25 | **Multi-Language** — English (default), Assamese, Hindi | 🟡 Medium |
| 26 | **AI Integration** — built-in (free: report summarization, at-risk detection) + BYO API key (premium: timetable optimizer, behavioral insights) | 🟡 Medium |
| 27 | **QR Proxy Check-In** — generate, print, scan, mark attendance | 🟢 Low |
| 28 | **Native Apps (iOS + Android)** — Capacitor shell | 🟢 Low |
| 29 | **Status Page** — public `/status` with live service uptime | 🟢 Low |
| 30 | **Help Center** — CMS-managed articles, role-filtered by audience | 🟢 Low |

**Exit criteria:** EduFlow works offline, on mobile, in Assamese, and principals share the reports.

---

## Future Consideration (Post Phase 4)

- **District Mode** — read-only cross-school visibility for district education offices
- **Public Coverage Page** — shareable school URL showing today's class coverage (no PII)
- **Seasonal Pricing Automation** — coupon automation tied to exam season calendar
- **Competitor Comparison Page** — EduFlow vs. WhatsApp chaos / Excel registers
- **Behavioral Analytics** — weekly/monthly behavior trend charts per student (parent portal)
- **Subject Completion Tracker** — per-subject syllabus progress bar visible to admin, teacher, and parent

---

## Key Business Rules (Quick Reference)

> Full rules in `VISION.md §5`. This file only links to them.

| Rule | Value |
|---|---|
| Affiliate commission | 25% one-time + 5% lifetime recurring (flat rate, tiers = perks only) |
| Swap expiry | When the requested period ends or is running (not a fixed timer) |
| Primary brand color | `#007AFF` iOS Blue |
| Teacher daily cap | Max 5 periods/day (timetable + proxy combined) |
| Proxy cap levels | Daily + Weekly + Monthly (all configurable per teacher) |
| Trial period | 14 days, no credit card required |
| Grace period | 7 days after failed payment before suspension |
| Tiffin supervision | Teachers CAN be assigned for break supervision (it's a valid slot) |
| Exam mode | Proxy assignment disabled unless admin overrides; supervision duty still assignable |

---

*See [VISION.md](./VISION.md) for complete product blueprint · [AGENTS.md](./AGENTS.md) for AI agent resume instructions · [AUDIT.md](./AUDIT.md) for current task list · [CHANGELOG.md](./CHANGELOG.md) for what's been built*

---

# Architecture & Rebuild Plan

> Merged from the former `REBUILD_PLAN.md`. The production app is Next.js 15 + shadcn/ui PRO V6. **Design tokens / Tailwind config live in `AGENTS.md §5` and `Design.md`** (not duplicated here).

## Project structure (Next.js 15)

```
eduflow-app/
├─ app/
│  ├─ (auth)/         login, signup, onboarding
│  ├─ (marketing)/    landing, features, pricing, demo
│  ├─ (app)/          authenticated shell (layout = sidebar + topbar)
│  │  ├─ admin/  management/  teacher/  parent/  super-admin/  driver/
│  ├─ api/            auth, proxies, absences, teachers, attendance, fees, notifications, webhooks
│  └─ globals.css     shadcn token bridge (see AGENTS §5)
├─ components/ui/      shadcn primitives (never edited directly)
├─ components/layout/  AppShell, AppSidebar, Topbar, Breadcrumb
├─ components/shared/  PageHeader, KpiCard, DataTable, FilterBar, EmptyState, StatusBadge, …
├─ components/domain/  proxy/, absence/, teacher/, fee/, timetable/, notification/, …
├─ lib/                utils, constants (PERIODS), proxy-algorithm, status-badges
├─ hooks/  context/  models/ (or server/ Payload collections)  types/
└─ middleware.ts       auth guard + role routing
```

## Three-tier component hierarchy

```
Tier 1 — components/ui/      shadcn primitives, CLI-generated, never edited
Tier 2 — components/shared/  composites built from Tier 1 (PageHeader, KpiCard, DataTable…)
Tier 3 — components/domain/  business components built from Tier 1+2 (ProxyBoard, AbsenceForm…)
```

**Rule:** pages import only from Tier 2 + Tier 3 — never from `components/ui/` directly.

## Page anatomy (every page)

```tsx
<div className="page-content">
  <PageHeader icon title subtitle actions={<Button>…</Button>} />
  <div className="kpi-grid"> <KpiCard/> ×4 </div>
  <FilterBar> <SearchInput/> <Select/> <Button>Export</Button> </FilterBar>
  <DomainComponent />
</div>
```

Button sizes: header CTAs `default` · table rows `xs` · icon-only `icon`/`icon-sm` · marketing hero `lg`/`xl`.

## Domain build priority

1. Auth (Users, Schools, roles, sessions) → 2. Teacher (CRUD, subjects, caps) → 3. Absence (create/approve/reject) → 4. Proxy (board, auto-assign, accept/decline) → 5. Timetable → 6. Fee → 7. Notification → 8. Swap → 9. Parent → 10. Billing (Razorpay) → 11. Super Admin → 12. Affiliate.

## Proxy auto-assign (lib/proxy-algorithm.ts)

```ts
// 1) Hard filters (all must pass)
const eligible = teachers.filter(t =>
  t.isFreeAtPeriod(period) && t.dailyProxyCount < t.dailyProxyCap &&
  t.weeklyProxyCount < t.weeklyProxyCap && !t.isAbsentToday &&
  !violatesConsecutiveRule(t, period))

// 2) Score (see VISION § Auto-Assign for the canonical weights)
//    +10 same primary subject · +7 secondary subject · +5 taught class ·
//    +4 same section · + load/fairness · -3 recent decline · -5 different section

// 3) sort desc, return top 3 (auto-assign picks #1)
```

Dot colors: 🟢 `bg-success` (same subject) · 🟡 `bg-warning` (diff subject) · ⚫ `bg-muted-foreground` (capped) · 🔴 `bg-destructive` (unavailable). Always paired with a text label.

## Role-based routing (middleware.ts)

```
super_admin → /super-admin/overview (all routes; impersonation)
admin → /admin/dashboard · management → /management/dashboard
teacher → /teacher/dashboard · parent → /parent/dashboard
```
Each non-super role is restricted to its own prefix.

## Data layer (collections / models)

Every collection carries `schoolId` (except `users`, cross-school for super admin); `access.read/update/delete` filters by `schoolId`; `AuditLogs` append-only. Status enums: Absences `draft|pending|approved|rejected` · ProxyAssignments `assigned|accepted|declined|completed` · SwapRequests `pending|agreed|management_pending|approved|rejected` · Subscriptions `trial|active|grace|suspended`. Full SQL schema in **VISION § Full Technical Specification §7**.

## Build sequence

```
Week 1–2   Scaffold + design system + AppShell + role routing + shared components
Week 3–4   Auth + collections (Users/Schools) + login/signup + onboarding + Teacher CRUD
Week 5–6   Core proxy workflow MVP: absences, proxy board, auto-assign, accept/decline
Week 7–8   Timetable builder + fee modules
Week 9–10  Parent portal + notification hub
Week 11–12 Analytics + PDF reports + Razorpay + webhooks
Week 13+   Super admin, affiliate, PWA, dark-mode polish
```

## Testing

Unit: `lib/proxy-algorithm`, `lib/utils`, `lib/status-badges`. Component: PageHeader, KpiCard, ProxyBoard, DataTable (Vitest + Testing Library). Integration: collection access control. E2E: login → mark absence → assign proxy → confirm (Playwright).

---

## Appendix A — Master AI Rebuild Prompt

> Paste into a new AI coding session to build from scratch. Attach as context: `AGENTS.md`, `VISION.md`, this file, `Design.md`.

You are building **EduFlow** — a multi-tenant B2B SaaS for school management — as a production Next.js 15 app (App Router, React 19, TypeScript strict, Tailwind v4 + shadcn/ui PRO V6, Lucide icons only, MongoDB/Mongoose or Payload CMS, NextAuth v5, Razorpay INR, Vitest + Playwright). It automates the teacher substitute (proxy) workflow for Indian schools; lead school HCEA, Howly, Assam; 6 roles.

**Enforce:** every page uses `<PageHeader>`; pages import only Tier 2/3 components; Lucide only; single source of truth for data (periods, teachers); proxy dots always paired with a text label; port the scoring engine to `lib/proxy-algorithm.ts`.

**Build first (Phase 1 MVP):** scaffold → AppShell → login/signup/onboarding → auth + role middleware → admin dashboard → teacher CRUD → absence workflow → proxy board → onboarding wizard. Don't build beyond Phase 1 until the MVP works end-to-end.

**Seed:** HCEA (`admin@hcea.edu`); 10 teachers (Priya Sharma, Rajesh Kalita, Anita Devi, Biju Das, Meena Gogoi, Dipak Baruah, Sunita Borah, Kamal Nath [inactive], Rima Das, Himanta Bezbaruah); periods P1–P7 + Tiffin; today's absences (Anita Devi full-day sick approved, Dipak Baruah P1–P3 doctor approved, Rima Das full-day family-emergency pending).

## Appendix B — Migration / Porting Record

> The Scholaris (Vite) → Next.js port is **complete** (all roles/pages, verified `typecheck`/`lint`/`build` green). Translation conventions kept for reference:

| Source (Vite Scholaris) | This app (Next.js) |
|---|---|
| `--sch-*` tokens | shadcn semantic tokens + `ef-*` brand utilities |
| `../../ui/*` wrappers | `@/components/ui/*` |
| `SchPageHeader` | `@/components/shared/page-header` |
| inline mock arrays | `@/data/*` |
| `useNavigate()` | `next/link` + `useRouter` (`next/navigation`) |
| status → badge helpers | `@/lib/status-badges` |

Rules: client interactivity needs `"use client"`; color always pairs with a text label; currency `₹` via `toLocaleString("en-IN")`; keep typecheck green per batch.

---

# Core Operations Feature Specifications
> Merged from `.kiro/specs/eduflow-core-features/PLAN.md`. 7 operational features built on the Next.js 15 app.
> Design driven from Figma MCP (file `BlFqAE1yNoGDD4IFKyqaIV`, shadcn/ui PRO Variables V6.0 + `--ef-*` tokens).

## App Wiring Conventions (build against these)

| Concern | Convention |
|---|---|
| Routing | Next.js App Router. Role pages under `src/app/(app)/<role>/<feature>/page.tsx` |
| Navigation | Single source of truth: `src/lib/navigation.ts` → `NAV_BY_ROLE`. Every new page MUST be registered here with a Lucide icon. |
| Live state | React context "session stores" in `src/context/*`, mounted in `src/app/(app)/layout.tsx`. Pattern: `student-leave-context.tsx`. |
| Mock data | `src/data/*.ts` — single source of truth, imported never re-declared. |
| DB schemas | Mongoose models in `src/models/*.ts`, every collection scoped by `schoolId` (multi-tenant RLS). |
| API | Route Handlers in `src/app/api/<resource>/route.ts`. |
| Shared UI | `src/components/shared/*` + domain UI in `src/components/domain/<feature>/*`. |
| Design tokens | `src/app/globals.css` — `--ef-*` brand bridged to shadcn semantic tokens. Never hardcode hex. |
| School calendar | `src/data/school-session.ts` (`getDayStatus`, holidays, weekly-off). |
| Periods | `src/data/periods.ts` (P1–P7 + Tiffin). |
| Roles | `src/lib/constants.ts` → `Role` = `admin \| management \| teacher \| parent \| super_admin \| driver`. |

**Golden rules:**
1. Pull visual spec from Figma MCP before writing JSX. Map Figma → existing shared components; only build new domain components when no shared one fits.
2. Add page route → register in `navigation.ts` → mount any new provider in `(app)/layout.tsx`.
3. Ship mock data + context store first (demoable with no DB), then Mongoose model + API route.
4. Pair every status color with a text label (accessibility).
5. Run `npm run typecheck` and `npm run lint` after each feature.

---

## Feature Build Order (Phase Order)

| Phase | Features | Why first |
|---|---|---|
| **P1** | F6 Parent-leave→attendance, F1 Attendance governance | Smallest blast radius, reuse existing contexts, foundational. |
| **P2** | F2 Class Journal, F8 Notification engine | Journal needs the engine; engine then serves everything else. |
| **P3** | F3 Report Cards | Establishes the Excel/CSV + assignment pattern. |
| **P4** | F5 Fees & Dues offline/import | Reuses F3's IO + assignment patterns. |
| **P5** | F4 Exam Scheduler | Drag-and-drop + duty timing; depends on notification engine. |
| **P6** | F7 Transport Tracking | Largest: maps, realtime, new `driver` role, security review. |

**All 7 features are ✅ complete.** See checklist below.

---

## F1 — Attendance Governance ✅

**Goal:** Teacher takes attendance → locked on submit. Admin/Management edit freely (logged). Teacher edits via modification request → Admin/Management approve/reject → unlock.

**Data:**
- `src/models/Attendance.ts` extended: `status: 'draft'|'submitted'|'locked'`, `submittedBy`, `submittedAt`, `lockedAt`, `edits[]` audit array.
- `src/models/AttendanceEditRequest.ts`: `{ schoolId, attendanceId, requestedBy, classId, period, date, reason, status, reviewedBy, reviewNote }`.
- Mock: `src/data/mock-attendance-edit-requests.ts`.

**State/API:** `src/context/attendance-context.tsx` + `src/app/api/attendance/route.ts` + `api/attendance/edit-requests/route.ts`.

**Pages/UI:**
- `teacher/attendance/mark`: post-submit read-only + "Request to modify" button.
- Admin/Management attendance pages: editable grid + Edit Requests inbox (`AttendanceEditInbox`).
- Domain: `AttendanceEditRequestModal.tsx`, `AttendanceEditInbox.tsx`, `AttendanceLockBadge.tsx`.

**Acceptance:** Submitted attendance is immutable for teacher until approved; admin edits always allowed + logged.

---

## F2 — Class Journal ✅

**Goal:** Teacher writes post-class journal attached to the class actually taught (including proxy classes). Missing journals trigger repeating notifications.

**Data:**
- `src/models/ClassJournal.ts`: `{ schoolId, date, classId, section, period, subject, teacherId, isProxy, topic, homework, notes, status, completedAt }`.
- Mock: `src/data/mock-class-journal.ts`.

**State/API:** `src/context/class-journal-context.tsx` + `src/app/api/class-journal/route.ts`.

**Pages/UI:**
- Teacher: `src/app/(app)/teacher/journal/page.tsx` — "Today's classes" list (regular + proxy), write/edit entries.
- Parent: `src/app/(app)/parent/journal/page.tsx` — read entries for child's class (proxy entries show automatically).
- Domain: `JournalEntryForm.tsx`, `JournalSlotList.tsx`, `JournalProxyBadge.tsx`.

**Acceptance:** Proxy class journal appears in proxied class's parent view; missed entries notify until written.

---

## F3 — Report Cards ✅

**Goal:** Marks/grades entered by Teacher, Management, or Admin. Admin assigns users to enter report cards for specific class/section. Admin can import/export via Excel/CSV with a downloadable demo template.

**Data:**
- `src/models/ReportCard.ts`: `{ schoolId, studentId, classId, section, term, subjects[], total, percentage, rank, status, enteredBy, publishedAt }`.
- `src/models/ReportCardAssignment.ts`: `{ schoolId, userId, role, scope: { classId?, section? }, term, assignedBy }`.
- Mock: `src/data/mock-report-cards.ts`.

**Import/Export:** `src/lib/report-card-io.ts` — `parseReportCardSheet`, `validateRows`, `exportReportCards`, `buildDemoTemplate` (demo template has an Instructions sheet).

**Pages/UI:**
- Admin: `src/app/(app)/admin/report-cards/page.tsx` — tabs: Entry / Assignments / Import-Export.
- Parent: `src/app/(app)/parent/report-card/page.tsx` — published cards.
- Domain: `MarksEntryGrid.tsx`, `ReportCardImportPanel.tsx`, `AssignmentManager.tsx`, `ReportCardPreview.tsx`.

**Acceptance:** Admin assigns "Teacher Priya → VIII-A → Term 1"; Priya sees only that scope; import rejects invalid rows with reasons; demo template downloads; export round-trips.

---

## F4 — Exam Scheduler ✅

**Goal:** Admin & Management build exam routine via drag-and-drop grid (dates × periods/time-slots) with invigilation duty per slot. Teacher notified of duty on campus entry or configurable lead time (default 15 min).

**Data:**
- `src/models/Exam.ts`: `{ schoolId, term, name, slots[{ date, period, startTime, classId, subject, room, invigilatorIds[] }], status }`.
- Extends `exam-mode-context.tsx` + `exam-config.ts`. `notifyLeadMinutes` default 15.
- Mock: `src/data/mock-exams.ts`.

**Drag-and-drop:** `@dnd-kit/core` — `src/components/domain/exam/ExamGridBuilder.tsx`.

**Pages/UI:**
- Admin: `src/app/(app)/admin/exams/` — `ExamGridBuilder` + duty-roster panel + settings popover.
- Management: `src/app/(app)/management/exams/page.tsx` — same builder.
- Teacher: exam duty card on dashboard.

**Acceptance:** Admin drags subjects+teachers into routine, sets lead time; assigned teacher gets duty notification 15 min before start.

---

## F5 — Fees & Dues (Offline + Import) ✅

**Goal:** Admin & Management record fee collection offline (cash/cheque/bank) + bulk Excel/CSV import with demo template.

**Data:**
- `src/models/Fee.ts` extended: `payments[{ amount, mode: 'cash'|'cheque'|'online'|'bank', reference, collectedBy, collectedAt, note }]`, `source: 'manual'|'import'|'online'`.
- `src/lib/fee-io.ts`: `parseFeeCsvSheet`, `validateRows`, `exportFees`, `buildFeeTemplate`.

**Pages/UI:**
- Admin `fees/collection` + Management equivalent: "Record offline payment" modal + "Import collections" panel.
- Domain: `OfflinePaymentModal.tsx`, `FeeImportPanel.tsx` (reuses `FeeReceiptCard.tsx`).

**Acceptance:** Cash payment recorded offline updates dues + generates receipt; CSV import of 50 payments validates and commits; export round-trips.

---

## F6 — Parent Leave → Teacher Attendance Link ✅

**Goal:** Parent-submitted leave for a child → child auto-marked absent/excused in teacher's roll call on the leave date. Teacher can flip to present (override logged).

**Data:** Reuses `src/context/student-leave-context.tsx`. Override logged in Attendance `edits[]` with `reason: 'present-despite-leave'`.

**Logic:** `src/lib/attendance-leave-merge.ts` — `applyLeavesToRoster(roster, approvedLeaves, date)` → returns roster with on-leave students flagged + locked-reason.

**Pages/UI:**
- Teacher mark-attendance: on-leave rows visually distinct, default absent/excused, editable with confirm → logged.
- Admin/Management attendance monitor: surface "overridden leave" entries.

**Acceptance:** Child with approved leave is auto-absent; teacher flips to present → present AND log entry created.

---

## F7 — Transport Tracking ✅

**Goal:** Admin/Management register routes + vehicles. Driver starts journey → live location shared on Google Maps to subscribed parents. Stop auto-checks via geofence. Parent must accept child at drop point (safety handshake). Fleet tracking page for Admin/Management.

**Data Models:**
- `src/models/TransportRoute.ts`: `{ schoolId, name, stops[{ name, lat, lng, seq, plannedTime }], assignedStudentIds[] }`.
- `src/models/Vehicle.ts`: `{ schoolId, label, regNo, type, routeId, driver: { name, phone }, capacity }`.
- `src/models/TripLog.ts`: `{ schoolId, vehicleId, routeId, date, status, startedAt, endedAt, stopChecks[], dropHandshakes[] }`.
- Mock: `src/data/mock-transport.ts`.

**Maps + realtime:** `@react-google-maps/api` (key: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`). Demo uses self-contained animated SVG `RouteMap` + simulated GPS in `transport-context` — swappable for Google Maps behind the same props.

**State/API:** `src/context/transport-context.tsx` + `api/transport/routes`, `api/transport/vehicles`, `api/transport/trips`.

**Pages/UI:**
- Admin/Management setup: `admin/transport/page.tsx`, `management/transport/page.tsx` — routes, vehicles, driver assignment.
- Driver: `/driver/dashboard` (trip start/stop), `/driver/route`, `/driver/profile`.
- Parent: `/parent/transport` — live bus on map, ETA, "Child received" handshake button.
- Domain: `FleetView.tsx`, `LiveRouteMap.tsx`, `RouteMap.tsx` (static fallback), `EmergencyContacts.tsx`.

**Driver role wiring:** `constants.ts`, `User` model enum, `auth-context` demo creds (`driver@hcea.edu / driver123`), `role-context` metadata, `navigation.ts` driver nav group, `middleware.ts` prefix guard, login quick-login tile.

**Security notes (production requirements):** auth + per-school data isolation + parent consent + key restriction by HTTP referrer.

**Acceptance:** Management starts Trip for Bus-1; parents see it move on map; each stop auto-checks; at child's stop parent taps Accept → Admin sees "child safe with parent".

---

## F8 — Notification Engine ✅

**Goal:** Centralized notification engine for timed/repeating notifications across all features (journal escalation, exam-duty lead time, attendance-submit alerts, transport events).

**Architecture:** `src/context/notification-context.tsx` — audience-scoped store, idempotent `upsert`, typed notifications.

**Notification types added:**
`attendance_submitted` · `attendance_edit_request` · `journal_pending` · `exam_duty` · `transport_*` · `report_card_published`

**Each type maps to:** target role(s)/user, Lucide icon, route, optional repeat policy `{ everyMinutes, untilHour }`.

**In-session scheduler:** lightweight `setInterval` drives repeating reminders for demo. Production: replace with cron/queue + push/SMS/WhatsApp channels (mirrors the birthday `CHANNELS_BY_AUDIENCE` tier pattern).

---

## Feature Dependencies & Confirmed Additions

| Dependency | Status |
|---|---|
| `xlsx` (SheetJS) for import/export | ✅ In `package.json` |
| `@dnd-kit/core` for exam drag-and-drop | ✅ In `package.json` |
| `@react-google-maps/api` + Maps key | ✅ `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local` |
| `driver` role (new) | ✅ Added — full role wiring complete |
| Real-time transport (v1) | ✅ Simulated movement; production websockets deferred |
| Notification channels (push/SMS/WhatsApp) | 🟡 In-app only for demo; production wiring deferred |
