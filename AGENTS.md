# EduFlow — School Management App · AI Agent Context File
> **Read this first in every new session.** Updated: 2026-06-17
> **Design System:** shadcn/ui PRO Variables V6.0 (Figma: `BlFqAE1yNoGDD4IFKyqaIV`)

## Quick Navigation
| Document | Purpose |
|---|---|
| [AGENTS.md](./AGENTS.md) | ← You are here — AI agent context, roles, design system |
| [VISION.md](./VISION.md) | Complete product blueprint and business rules (wins on conflicts) |
| [ROADMAP.md](./ROADMAP.md) | Phase-by-phase build order (wins on phase order) |
| [REBUILD_PLAN.md](./REBUILD_PLAN.md) | Next.js 15 app architecture + shadcn PRO V6 token map |
| [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) | Page-by-page porting checklist (all 69 pages) |
| [AUDIT.md](./AUDIT.md) | ★ Frontend audit — gaps, icon map, upgrade features, task list |
| [KIRO_REBUILD_PROMPT.md](./KIRO_REBUILD_PROMPT.md) | Master AI prompt for rebuilding from scratch |
| [CHANGELOG.md](./CHANGELOG.md) | Version history |

---

## 1. What This Project Is

**EduFlow** is a multi-tenant school proxy class management SaaS app.
- A school admin/management user marks a teacher absent, the system assigns proxy (substitute) teachers for their periods.
- This repository contains **two things in one Vite app:**
  1. **`src/components/`** — the UI design system component library (50+ components, Vitest-tested)
  2. **`src/scholaris/`** — a full role-aware functional prototype with 69 pages across 6 roles (Scholaris app)
- Built with: **Vite 5 + React 18 + TypeScript + Tailwind CSS v4 + Radix UI primitives**
- The production SaaS application (Next.js 15) lives in a separate repository and consumes these components.

**School (demo/lead):** Holy Child English Academy (HCEA), Howly, Barpeta, Assam

---

## 2. Project Root

```
c:\Users\Manash Jyoti\Documents\Kiro\School Management App\
```

Run dev server: `npm run dev` (Vite default: **http://localhost:5173**)

Run tests: `npm test` (Vitest + Testing Library)

---

## 3. Architecture At a Glance

```
src/
  components/         ← Design system UI components (50+)
    Accordion.tsx / Alert.tsx / AnnouncementBanner.tsx / Avatar.tsx
    Badge.tsx / Button.tsx / Card.tsx / Chart.tsx / Charts.tsx
    CheckRadio.tsx / Chip.tsx / ClassCard.tsx / Combobox.tsx
    CommandPalette.tsx / DatePicker.tsx / Divider.tsx / Drawer.tsx
    EmptyState.tsx / EventCalendarCard.tsx / ExamScheduleCard.tsx
    ExportPanel.tsx / FeeReceiptCard.tsx / FileUpload.tsx
    GradeCard.tsx / Header.tsx / HeatMap.tsx / icons.tsx
    Input.tsx / LeaveQuotaBar.tsx / LibraryBookCard.tsx
    LineChart.tsx / Menu.tsx / Modal.tsx / Navigation.tsx
    NotificationRow.tsx / PricingCard.tsx / Progress.tsx
    ProxyBoard.tsx        ← Core feature component
    ResultSummaryCard.tsx / Search.tsx / Select.tsx
    SettingsRow.tsx / Sidebar.tsx / Skeleton.tsx / Spinner.tsx
    StaffProfileCard.tsx / StudentCard.tsx / SubjectCard.tsx
    SuperAdminCard.tsx / SwapRequest.tsx / Toast.tsx / Tooltip.tsx
    __tests__/           ← Component-level tests

  lib/                ← Utility functions (cn.ts, utils.ts)
  logic/              ← Business logic modules
    contrast.ts / initials.ts / pagination.ts / palette.ts
    progress.ts / selection.ts / sort.ts / stepper.ts
    __tests__/
  showcase/           ← Visual showcase pages for each component
  styles/             ← CSS design system (global.css)
  theme/              ← DarkModeProvider, theme config
  tokens/             ← Design tokens + __tests__/
  test/
    setup.ts          ← Vitest setup (jsdom)

  scholaris/          ← FULL FUNCTIONAL PROTOTYPE (role-aware app)
    ScholarisApp.tsx  ← Root: role switcher + shadcn sidebar shell
    components/
      EduFlowAssistant.tsx   ← AI chatbot FAB (bottom-right, mock responses)
      MiniSparkline.tsx      ← Inline sparkline charts (line/bar/arc)
      WeatherClock.tsx       ← Live weather + clock widget (Open-Meteo API, no key needed)
    context/
      SchoolSettingsContext.tsx  ← attendanceMode: 'per-period' | 'single-daily'
    pages/
      admin/          ← 22 pages (see §6)
      management/     ← 12 pages (see §6)
      teacher/        ← 9 pages (see §6)
      parent/         ← 8 pages (see §6)
      super-admin/    ← 11 pages (see §6)
      marketing/      ← 7 pages (see §6)
    ui/               ← shadcn/ui component wrappers used inside Scholaris
      avatar.tsx / badge.tsx / button.tsx / card.tsx
      input.tsx / progress.tsx / separator.tsx / sidebar.tsx
      tooltip.tsx / index.ts
    data/             ← Shared mock data (SINGLE SOURCE OF TRUTH — never re-declare inline)
      teachers.ts     ← TEACHERS[], TEACHER_NAMES[] — 10 HCEA staff
      periods.ts      ← PERIODS[], PERIOD_LABELS[], PERIOD_IDS[] — P1–P7 schedule
    lib/              ← Shared Scholaris utilities
      statusBadges.tsx← teacherStatusBadge / absenceStatusBadge / feeStatusBadge / swapStatusBadge / attColor

index.html            ← Vite entry point
vite.config.ts        ← Vite + Vitest + Tailwind v4 config
tailwind.config.ts    ← Tailwind configuration
package.json          ← Dependencies (React 18, Radix UI, Lucide, CVA, shadcn)

Design.md             ← Full HTML design system reference (~1800 lines)
VISION.md             ← Complete product blueprint (master reference)
Claude.md             ← Full technical specification (agency handoff doc)
PROJECT_BUNDLE.md     ← AI context pack for external LLMs
README.md             ← Quick start guide
ROADMAP.md            ← Canonical phase-by-phase build order
CHANGELOG.md          ← Version history
REBUILD_PLAN.md       ← ★ NEW: Next.js 15 production app architecture + shadcn PRO V6 token map
KIRO_REBUILD_PROMPT.md← ★ NEW: Master AI prompt for building the production app from scratch
```

---

## 4. Role Switcher (Scholaris Prototype)

The Scholaris app has a role switcher in the sidebar footer. No real auth — just a dropdown to preview each role.

| Role | Avatar | Email shown |
|------|--------|-------------|
| Super Admin | SA | superadmin@proxymanager.app |
| Admin | AP | admin@hcea.edu |
| Management | MO | mgmt@hcea.edu |
| Teacher (Priya Sharma) | PS | priya@hcea.edu |
| Parent | PU | parent@hcea.edu |
| Marketing | MK | marketing@eduflow.app |

**Auth in production SaaS (Next.js app — reference only):**

| Role | Email | Password |
|------|-------|----------|
| super_admin | superadmin@proxymanager.app | super123 |
| admin | admin@hcea.edu | admin123 |
| management | mgmt@hcea.edu | mgmt123 |
| teacher | priya@hcea.edu | teacher123 |
| parent | parent@hcea.edu | parent123 |

---

## 5. Design System (CRITICAL — use exactly these)

**Source files:** `src/styles/global.css` · `src/scholaris/styles.css` · `src/tokens/` · `tailwind.config.ts`

> **Design system target:** shadcn/ui PRO Variables V6.0 (Figma community file `BlFqAE1yNoGDD4IFKyqaIV`).
> The Vite prototype is already partially migrated. The production Next.js app (see `REBUILD_PLAN.md`) uses the full two-layer shadcn token architecture.

> **Scholaris uses `--sch-*` prefixed tokens** (e.g. `--sch-brand`, `--sch-t1`). The base design system uses unprefixed tokens (e.g. `--brand`, `--t1`). In the production app both are replaced by shadcn semantic tokens (`--primary`, `--foreground`, etc.).

### Color Tokens
```css
--brand: #007AFF          /* iOS blue — PRIMARY color for everything */
--brand-dark: #0062CC
--brand-light: #EAF3FF
--brand-mid: #80BDFF
--brand-muted: rgba(0,122,255,0.08)
--green: #34C759          /* success / available */
--green-light: #E5F9EC
--green-dark: #1A6B30
--amber: #FF9500          /* warning */
--amber-light: #FFF2D6
--amber-dark: #7A4700
--red: #FF3B30            /* danger / SOS / error */
--red-light: #FFE8E7
--red-dark: #7A1B17
--purple: #6C63FF
--purple-light: #F0EFFE
--blue: #32ADE6           /* informational */
--blue-light: #E3F5FD
```

### Text & Surface Tokens
```css
--t1: #000000             /* primary text */
--t2: rgba(60,60,67,0.60) /* secondary/muted text */
--t3: rgba(60,60,67,0.30) /* placeholder/disabled */
--sep: rgba(60,60,67,0.12)/* borders/dividers */
--content-bg: #F2F2F7     /* page background */
--card-bg: #FFFFFF        /* card background */
--sidebar-bg: rgba(255,255,255,0.95)

/* Gray scale */
--gray-50: #F2F2F7  --gray-100: #E5E5EA  --gray-200: #D1D1D6
--gray-400: #AEAEB2 --gray-500: #8E8E93  --gray-600: #636366
--gray-900: #1C1C1E
```

### Alias Map (legacy compatibility)
```css
--text-muted:    var(--t2)
--text:          var(--t1)
--text-light:    var(--t3)
--primary:       var(--brand)
--primary-light: var(--brand-light)
--warning:       var(--amber)
--warning-light: var(--amber-light)
--danger:        var(--red)
--border:        var(--sep)
--border-light:  var(--sep)
--bg:            var(--content-bg)
--surface:       var(--card-bg)
--radius-sm:     var(--r-sm)
--radius-md:     var(--r-md)
--shadow-xs:     var(--sh-xs)
```

### Spacing & Radius
```css
--r-xs:4px  --r-sm:8px  --r-md:12px  --r-lg:16px  --r-xl:20px  --r-2xl:24px  --r-pill:100px
--sh-xs: 0 1px 3px rgba(0,0,0,0.06)
--sh-sm: 0 2px 8px rgba(0,0,0,0.08)
--sh-md: 0 4px 20px rgba(0,0,0,0.10)
--sh-lg: 0 8px 40px rgba(0,0,0,0.14)
--sidebar-width: 320px
```

### Typography
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
font-feature-settings: 'cv11', 'ss01';
```

### Key Component Classes
```
/* Design system (src/styles/global.css) */
.card             white card with border + shadow
.btn .btn-primary .btn-secondary .btn-ghost .btn-danger .btn-success .btn-sm .btn-outline .btn-lg
.badge .badge-green .badge-amber .badge-red .badge-gray .badge-brand .badge-blue .badge-purple
.input .input-group .input-label
.avatar           circular avatar (32px, brand gradient)
.stat-card        KPI card (use .stat-header .stat-label .stat-value .stat-footer)
.modal-overlay .modal .modal-header .modal-body .modal-footer .modal-close
.topbar           sticky top bar inside AppShell
.content-inner    page content padding wrapper
.grid-cols-2 .grid-cols-3 .grid-cols-4  responsive grids
.fade-in          animation
.table-wrapper table th td
.alert .alert-info .alert-warn .alert-error .alert-success
.toggle .toggle-track .toggle-thumb  (iOS-style switch)
.empty-state .empty-icon .empty-title .empty-desc
.period-pill .divider .hover-card .badge-purple

/* Scholaris app (src/scholaris/styles.css) */
.sch-content       page content wrapper
.sch-page-header   page title + subtitle + action buttons bar
.sch-grid-2/3/4    responsive grid layouts
.sch-card          Scholaris-scoped card
.sch-table / .sch-table-wrap   table styles
.sch-stat / .sch-stat__*       KPI stat card parts
```

---

## 6. Complete Page Inventory — Scholaris App (69 pages)

### Super Admin (11 pages)
| Page ID | File | Description |
|---------|------|-------------|
| `saas-overview` | SaaSOverviewPage.tsx | MRR/ARR KPIs, MRR trend chart, plan distribution, churn risk, new signups, platform health |
| `platform-analytics` | PlatformAnalyticsPage.tsx | Deep analytics across all tenants |
| `system-health` | SystemHealthPage.tsx | API uptime, service status monitoring |
| `tenants` | TenantManagementPage.tsx | Paginated school list, filters, per-school actions |
| `school-drilldown` | SchoolDrilldownPage.tsx | Impersonation mode, per-school detail view |
| `billing-logs` | BillingLogsPage.tsx | All subscription events, Razorpay log |
| `affiliates` | AffiliatesPage.tsx | Affiliate list, commissions, payout queue |
| `backup-restore` | BackupRestorePage.tsx | Manual data snapshots, restore |
| `emergency-console` | EmergencyConsolePage.tsx | Emergency override controls |
| `global-settings` | GlobalSettingsPage.tsx | Platform-wide configuration |
| `super-audit` | SuperAuditLogPage.tsx | Full platform audit log |

### Admin (22 pages)
| Page ID | File | Description |
|---------|------|-------------|
| `dashboard` | DashboardPage.tsx | KPI stats, proxy status table, activity feed, teacher availability, help & resources |
| `proxy-board` | ProxyBoardPage.tsx | Full proxy assignment board with color-coded availability dots |
| `teachers` | TeachersPage.tsx | Teacher CRUD, bulk import, subject/section assignment |
| `students` | StudentsPage.tsx | Student directory, class/section filter |
| `staff-directory` | StaffDirectoryPage.tsx | Non-teaching staff management |
| `roles-permissions` | RolesPermissionsPage.tsx | User roles and access control |
| `absence-tracker` | AbsenceTrackerPage.tsx | Mark absences, approve/reject teacher requests |
| `student-attendance` | StudentAttendancePage.tsx | Per-period or single-daily roll call |
| `swap-requests` | SwapRequestsPage.tsx | Peer swap inbox, approve/reject |
| `fee-structure` | FeeStructurePage.tsx | Define fee heads per class |
| `fee-collection` | FeeCollectionPage.tsx | Collect payments, generate receipts |
| `defaulters` | DefaultersPage.tsx | Outstanding fee list, send reminders |
| `expenses` | ExpensePage.tsx | School expense tracking |
| `timetable` | TimetablePage.tsx | Drag-and-drop timetable builder |
| `notice-board` | NoticeBoardPage.tsx | Post notices, target by role |
| `holiday-calendar` | HolidayCalendarPage.tsx | Mark holidays, exam weeks, events |
| `analytics` | AnalyticsPage.tsx | Attendance, proxy, fee analytics with charts |
| `reports` | ReportsPage.tsx | PDF/Excel report generation |
| `announcements` | AnnouncementsPage.tsx | School-wide announcements with expiry |
| `audit` | AuditPage.tsx | Full audit log viewer with filters |
| `institution-settings` | InstitutionSettingsPage.tsx | School profile, timetable config, leave quotas |
| `subscription` | SubscriptionPage.tsx | Current plan, upgrade, affiliate referral link |

### Management (12 pages)
| Page ID | File | Description |
|---------|------|-------------|
| `mgmt-dashboard` | ManagementDashboardPage.tsx | Morning briefing: coverage %, uncovered periods, quick-assign |
| `absence-approval` | AbsenceApprovalPage.tsx | Approve/reject teacher absence requests |
| `mgmt-proxy` | ManagementProxyPage.tsx | Proxy assignment board |
| `swap-approvals` | SwapApprovalsPage.tsx | Final approval for peer swap agreements |
| `workload` | WorkloadPage.tsx | Teacher workload heatmap, load fairness view |
| `timetable-viewer` | TimetableViewerPage.tsx | Read-only timetable for all classes |
| `mgmt-notices` | MgmtNoticePage.tsx | Post and read notices |
| `exam-schedule` | ExamSchedulePage.tsx | Exam routine viewer and editor |
| `proxy-report` | ProxyCoverageReportPage.tsx | Proxy & coverage analytics |
| `attendance-summary` | AttendanceSummaryPage.tsx | Student and teacher attendance summary |
| `daily-log` | DailyLogPage.tsx | End-of-day operations log |
| `mgmt-profile` | MgmtProfilePage.tsx | Profile settings |

### Teacher (9 pages)
| Page ID | File | Description |
|---------|------|-------------|
| `teacher-dashboard` | TeacherDashboardPage.tsx | Daily schedule, proxy request card (accept/decline), leave balance, proxy count |
| `my-timetable` | MyTimetablePage.tsx | Personal weekly timetable |
| `proxy-history` | ProxyHistoryPage.tsx | Past proxy duties log |
| `apply-leave` | ApplyLeavePage.tsx | Submit absence: full day or specific periods, reason category |
| `leave-history` | LeaveHistoryPage.tsx | Submitted leave requests and status |
| `mark-attendance` | MarkAttendancePage.tsx | Take roll call for assigned class/period |
| `attendance-history` | AttendanceHistoryPage.tsx | Past attendance records |
| `notifications` | NotificationsPage.tsx | In-app notification center |
| `notice-read` | NoticeReadPage.tsx | Read-only notice board |

### Parent (8 pages)
| Page ID | File | Description |
|---------|------|-------------|
| `parent-dashboard` | ParentDashboardPage.tsx | Child's today status, attendance %, exam countdown, fee alert, journal, notifications |
| `child-attendance` | ChildAttendancePage.tsx | Full attendance history for the child |
| `class-journal` | ClassJournalPage.tsx | Period-by-period class journal: subject, teacher, topic, homework |
| `report-card` | ReportCardPage.tsx | Term report card with grades |
| `child-exams` | ChildExamSchedulePage.tsx | Upcoming exam schedule with countdown |
| `fees-dues` | FeesDuesPage.tsx | Outstanding fees, payment history |
| `parent-notifications` | ParentNotificationsPage.tsx | School notifications for the parent |
| `parent-leave` | ParentLeaveRequestPage.tsx | Submit student leave request to admin |

### Marketing (7 pages)
| Page ID | File | Description |
|---------|------|-------------|
| `mk-landing` | LandingPage.tsx | Public landing page with hero, features, social proof |
| `mk-features` | FeaturesPage.tsx | Full feature list with role-by-role breakdown |
| `mk-pricing` | PricingPage.tsx | Plan cards with Razorpay pricing (₹999–₹8,999) |
| `mk-demo` | RequestDemoPage.tsx | Demo request form |
| `mk-login` | LoginPage.tsx | Login UI (role switcher for demo) |
| `mk-signup` | SignupPage.tsx | Signup + free trial form |
| `mk-onboarding` | OnboardingWizardPage.tsx | 5-step school setup wizard |

---

## 7. Special Scholaris Components

### `EduFlowAssistant.tsx`
AI-powered floating chatbot (bottom-right FAB).
- Mock response engine covering: proxy assignment, absences, fees, timetable, attendance, reports, dark mode, HCEA context.
- Persists dismissed/enabled state to `localStorage`.
- Quick-prompt chips on first load.
- Simulates typing delay (600–1400ms).

### `WeatherClock.tsx`
Live weather + clock widget used in dashboard greeting banners.
- Fetches from **Open-Meteo API** — free, no API key required.
- Defaults to Howly, Assam coordinates (lat 26.45, lon 90.87). Accepts `lat`/`lon` props.
- 3D animated SVG weather scenes: sunny, partly-cloudy, cloudy, rainy, snowy, foggy, stormy.
- Live clock ticks every second.

### `MiniSparkline.tsx`
Inline mini charts for KPI cards.
- Variants: `line` (smooth line), `bar` (grouped bars), `arc` (progress arc/donut).
- Props: `data`, `variant`, `color`, `width`, `height`, `value` (for arc).

### `SchoolSettingsContext.tsx`
React context for school-level configuration.
- `attendanceMode`: `'per-period'` | `'single-daily'` — persisted to `localStorage`.
- Used by `StudentAttendancePage` and `MarkAttendancePage`.

### Shared UI Components (`src/scholaris/components/`)
> **Always use these — never write inline equivalents in pages.**

| Component | Purpose | Usage |
|-----------|---------|-------|
| `SortIcon` | Sort indicator for table headers | `<SortIcon active={sortField === 'name'} />` |
| `SchPageHeader` | Page title + subtitle + action buttons | `<SchPageHeader icon={...} title="..." subtitle="..." actions={<Button>...</Button>} />` |
| `SchSearchInput` | Search input for filter bars | `<SchSearchInput value={q} onChange={setQ} placeholder="Search…" />` |
| `SchEmptyState` | No-results / empty state | `<SchEmptyState icon={<X/>} title="No results" description="..." />` |

### Shared Data (`src/scholaris/data/`)
> **Single source of truth — import, never redeclare.**

| File | Exports | Used by |
|------|---------|---------|
| `teachers.ts` | `TEACHERS`, `TEACHER_NAMES` | TeachersPage, AbsenceTrackerPage, etc. |
| `periods.ts` | `PERIODS`, `PERIOD_LABELS`, `PERIOD_IDS`, `TEACHING_PERIODS` | AbsenceTrackerPage, MyTimetablePage, etc. |

### Shared Utilities (`src/scholaris/lib/`)
| File | Exports | Purpose |
|------|---------|---------|
| `statusBadges.tsx` | `teacherStatusBadge`, `absenceStatusBadge`, `feeStatusBadge`, `swapStatusBadge`, `attColor` | Status → Badge rendering |

---

## 8. Proxy Board Color Coding (CRITICAL)
| Dot | Meaning |
|-----|---------|
| 🟢 Green | Available, **same subject** as absent teacher |
| 🟡 Amber | Available, **different subject** (alt proxy) |
| ⚫ Gray | **Maxed out** — at daily/weekly/monthly cap |
| 🔴 Red | **Unavailable** — in class or declined |

> Color is **always paired with a text label** — never color alone (accessibility).

---

## 9. Outstanding Work (Pending Tasks)

> **Full task list with priorities:** See [AUDIT.md](./AUDIT.md) for the comprehensive frontend audit.  
> **Phase order:** See [ROADMAP.md](./ROADMAP.md). **Business rules:** See [VISION.md](./VISION.md).

### 🔴 Critical
- [ ] Verify all design tokens in `src/tokens/` match the canonical values in Section 5
- [ ] Ensure `ProxyBoard.tsx` uses availability dot colors: green (same subject), amber (diff subject), gray (capped), red (unavailable)
- [ ] Dark mode: implement `prefers-color-scheme` + manual `.dark` class for all components (both design system + Scholaris)

### 🔵 Architecture (New — Production App)
- [ ] **Bootstrap production Next.js 15 app** — follow `REBUILD_PLAN.md` §2 for folder structure
- [ ] **shadcn/ui PRO V6 token bridge** — `app/globals.css` with full EduFlow brand → shadcn semantic token map (`REBUILD_PLAN.md §1.2`)
- [ ] **Install all shadcn components** — full list in `REBUILD_PLAN.md §8`
- [ ] **Shared component layer** — `PageHeader`, `KpiCard`, `FilterBar`, `DataTable`, `EmptyState`, `StatusBadge` (`REBUILD_PLAN.md §3`)
- [ ] **Domain component layer** — `ProxyBoard`, `AbsenceForm`, `TimetableGrid`, `FeeReceiptCard` (`REBUILD_PLAN.md §4`)
- [ ] **Payload CMS collections** — all schemas with `school_id` RLS (`REBUILD_PLAN.md §7`)
- [ ] **Role-based middleware** — route guard per role (`REBUILD_PLAN.md §6`)

### 🟡 Features (Planned for Scholaris)
- [ ] **Morning Briefing countdown timer** — 5-minute period countdown on `ManagementDashboardPage.tsx`
- [ ] **Exam Routine component** — add to `src/components/` (reuse timetable builder layout)
- [ ] **QR Code check-in component** — generate, print, scan (Phase 4)
- [ ] **Subject Completion Tracker** — per-subject syllabus progress bar for parent portal
- [ ] **Behavioral Trend chart** — weekly/monthly behavior summary for parent portal
- [ ] **Progress Notes (per period)** — teacher input flow: select class → student → add note
- [ ] **Academic Year Rollover** — archive past year, reset leave balances
- [ ] **Excel import** — `.xlsx` bulk import for teachers and students
- [ ] **Parent portal showcase** — add to `src/showcase/` (currently only in Scholaris)
- [ ] **EduFlowAssistant parent context** — add parent-specific quick prompts

### ✅ Working (don't break these)
- All 50+ components in `src/components/` — render correctly in showcase
- All 69 pages in `src/scholaris/pages/` — renderable via role switcher at http://localhost:5173
- Vitest test suite — `npm test` must pass
- Tailwind v4 configuration
- Radix UI primitive integrations (Accordion, Dialog, Dropdown, Select, Switch, Tabs, Toast, Tooltip)
- Lucide React icons (do NOT mix other icon libraries)
- `WeatherClock` live weather widget (Open-Meteo, no API key)
- `EduFlowAssistant` chatbot FAB
- `SchoolSettingsContext` attendance mode toggle
- Dark mode provider (`src/theme/DarkModeProvider`) — partial, needs full rollout

---

## 10. Mock Data Reference

**Teachers (10):** Priya Sharma, Rajesh Kalita, Anita Devi, Biju Das, Meena Gogoi, Dipak Baruah, Sunita Borah, Kamal Nath (inactive), Rima Das, Himanta Bezbaruah

**Today's Absences (3):**
- Anita Devi — full day, sick leave, approved (a1)
- Dipak Baruah — P1,P2,P3, doctor visit, approved (a2)
- Rima Das — full day, family emergency, pending (a3)

**Proxy Assignments (5):** p1–p5, linked to a1 and a2

**Notifications (7):** n1–n7, mix of read/unread

**SaaS Schools (demo):**
- sch-1: HCEA, Howly (₹15,000 MRR) — admin@hcea.edu
- sch-2: Delhi Public School (₹45,000 MRR)
- Platform: 12 active tenants, ₹1,32,000 MRR total (as of June 2026)

**Periods (7 — HCEA default, all configurable):**
P1 9:30–10:10, P2 10:10–10:50, P3 10:50–11:30, P4 11:30–12:10, Tiffin 12:10–12:30, P5 12:30–1:10, P6 1:10–1:50, P7 1:50–2:30

**Parent demo child:** Rohit Das · Class VIII-A · Roll No. 12 · Attendance 84.6%

---

## 11. Files to NEVER Modify Without Care
- `src/components/` — any change may break tests; run `npm test` after every change
- `tailwind.config.ts` — Tailwind v4 config; renaming tokens breaks entire design system
- `src/scholaris/styles.css` — Scholaris-scoped CSS; changes affect all 69 pages
- `Design.md` — source of truth for visual component reference (~1800 lines)
- `VISION.md` — master product blueprint; always sync with Claude.md on business rules
- `src/scholaris/ScholarisApp.tsx` — routing and role nav; changes affect all role views

---

## 12. How to Resume Work

1. **Read this file** (AGENTS.md) — you now know everything
2. **Read [AUDIT.md](./AUDIT.md)** — current gaps, icon map, upgrade feature list
3. **Read [VISION.md](./VISION.md)** for complete product blueprint and business rules
4. **Read [ROADMAP.md](./ROADMAP.md)** for phase-by-phase build order
5. Run `npm run dev` → http://localhost:3000 to view the app (Next.js, not Vite)
6. Switch roles using the role dropdown in the sidebar footer
7. Run `npm run typecheck` to verify TypeScript health

> **Canonical business rules are in [VISION.md](./VISION.md) §5. When in doubt, that file wins.**  
> **Canonical roadmap is in [ROADMAP.md](./ROADMAP.md). Do not refer to other files for phase order.**  
> **Canonical task list is in [AUDIT.md](./AUDIT.md). Update it after every session.**