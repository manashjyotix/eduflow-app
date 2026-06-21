# EduFlow — Full Rebuild Plan (shadcn/ui PRO Design System)
> **Version:** 1.0 · Created: June 11, 2026 · Updated: June 17, 2026  
> **Purpose:** Complete from-scratch architecture plan for the Next.js 15 production app, fully aligned to the shadcn/ui PRO Variables V6 design system.

**Related:** [AGENTS.md](./AGENTS.md) · [AUDIT.md](./AUDIT.md) · [VISION.md](./VISION.md) · [ROADMAP.md](./ROADMAP.md) · [MIGRATION_PLAN.md](./MIGRATION_PLAN.md)

---

## 0. What This Document Is

This is the canonical **blueprint for building EduFlow from scratch** as a production Next.js 15 app using the shadcn/ui PRO Variables V6.0 design system (the Figma community file: `BlFqAE1yNoGDD4IFKyqaIV`).

The existing Vite prototype (`src/scholaris/`) contains all the **UX logic, business rules, mock data, and page designs**. This rebuild plan maps all of that onto a clean, production-grade stack.

**Read alongside:**
- `AGENTS.md` — full domain knowledge (roles, pages, mock data, business rules)
- `VISION.md` — product blueprint and business rules
- `Claude.md` — full agency handoff spec
- `ROADMAP.md` — phase order

---

## 1. Design System: shadcn/ui PRO V6 Token Architecture

### 1.1 What shadcn/ui PRO V6 Provides

The Figma file uses a **two-layer variable architecture**:

**Layer 1 — Primitive palette** (raw HSL values, never used directly in components):
```css
/* Brand blues */
--blue-50 through --blue-950

/* Neutrals */
--slate-50 through --slate-950

/* Semantic status */
--green-50 through --green-950
--yellow-50 through --yellow-950
--red-50 through --red-950
```

**Layer 2 — Semantic tokens** (what components actually reference):
```css
/* Light mode (applied to :root) */
--background       /* page bg */
--foreground       /* primary text */
--card             /* card surface */
--card-foreground
--popover
--popover-foreground
--primary          /* brand CTA color */
--primary-foreground
--secondary        /* subtle filled surface */
--secondary-foreground
--muted            /* subdued bg */
--muted-foreground
--accent           /* hover/focus tint */
--accent-foreground
--destructive      /* danger/error */
--destructive-foreground
--border           /* dividers */
--input            /* form control borders */
--ring             /* focus ring */
--radius           /* base radius (all scale from this) */

/* Dark mode — same tokens, different values in .dark */
```

### 1.2 EduFlow Brand Mapped to shadcn Tokens

This is the exact token bridge — **use this in `globals.css`**:

```css
:root {
  /* EduFlow brand palette */
  --ef-brand:        #007AFF;   /* iOS blue */
  --ef-brand-hover:  #0062CC;
  --ef-brand-light:  #EAF3FF;
  --ef-brand-muted:  rgba(0,122,255,0.08);
  --ef-green:        #34C759;
  --ef-green-light:  #E5F9EC;
  --ef-green-dark:   #1A6B30;
  --ef-amber:        #FF9500;
  --ef-amber-light:  #FFF2D6;
  --ef-amber-dark:   #7A4700;
  --ef-red:          #FF3B30;
  --ef-red-light:    #FFE8E7;
  --ef-red-dark:     #7A1B17;
  --ef-purple:       #6C63FF;
  --ef-purple-light: #F0EFFE;
  --ef-cyan:         #32ADE6;
  --ef-cyan-light:   #E3F5FD;

  /* shadcn semantic bridge */
  --radius: 0.875rem;            /* 14px — EduFlow base radius */
  --background:    #F2F2F7;      /* page bg */
  --foreground:    #000000;      /* primary text */
  --card:          #FFFFFF;
  --card-foreground: #000000;
  --popover:       #FFFFFF;
  --popover-foreground: #000000;
  --primary:       var(--ef-brand);
  --primary-foreground: #FFFFFF;
  --secondary:     #E5E5EA;
  --secondary-foreground: #000000;
  --muted:         #F2F2F7;
  --muted-foreground: rgba(60,60,67,0.60);
  --accent:        var(--ef-brand-light);
  --accent-foreground: var(--ef-brand);
  --destructive:   var(--ef-red);
  --destructive-foreground: #FFFFFF;
  --border:        rgba(60,60,67,0.12);
  --input:         #E5E5EA;
  --ring:          var(--ef-brand);

  /* Status extensions (non-standard shadcn, EduFlow additions) */
  --success:        var(--ef-green-light);
  --success-foreground: var(--ef-green-dark);
  --warning:        var(--ef-amber-light);
  --warning-foreground: var(--ef-amber-dark);
  --info:           var(--ef-cyan-light);
  --info-foreground: #164E6E;

  /* Charts */
  --chart-1: var(--ef-brand);
  --chart-2: var(--ef-green);
  --chart-3: var(--ef-amber);
  --chart-4: var(--ef-purple);
  --chart-5: var(--ef-cyan);

  /* Sidebar */
  --sidebar:                      rgba(255,255,255,0.97);
  --sidebar-foreground:           #000000;
  --sidebar-primary:              var(--ef-brand);
  --sidebar-primary-foreground:   #FFFFFF;
  --sidebar-accent:               var(--ef-brand-light);
  --sidebar-accent-foreground:    var(--ef-brand);
  --sidebar-border:               rgba(60,60,67,0.12);
  --sidebar-ring:                 var(--ef-brand);
}

.dark {
  --background:    #000000;
  --foreground:    #FFFFFF;
  --card:          #1C1C1E;
  --card-foreground: #FFFFFF;
  --popover:       #1C1C1E;
  --popover-foreground: #FFFFFF;
  --primary:       #0A84FF;     /* iOS dark-mode blue */
  --primary-foreground: #FFFFFF;
  --secondary:     #2C2C2E;
  --secondary-foreground: #FFFFFF;
  --muted:         #1C1C1E;
  --muted-foreground: rgba(235,235,245,0.60);
  --accent:        rgba(10,132,255,0.12);
  --accent-foreground: #0A84FF;
  --destructive:   #FF453A;
  --destructive-foreground: #FFFFFF;
  --border:        rgba(84,84,88,0.65);
  --input:         #2C2C2E;
  --ring:          #0A84FF;
  /* sidebar, charts, status tokens follow same dark-mode pattern */
}
```

---

## 2. Project Structure (New App — Next.js 15)

```
eduflow-app/                    ← New repository (production)
├── app/                        ← Next.js App Router
│   ├── (auth)/                 ← Unauthenticated routes
│   │   ├── login/
│   │   ├── signup/
│   │   └── onboarding/
│   ├── (marketing)/            ← Public marketing pages
│   │   ├── page.tsx            ← Landing page
│   │   ├── features/
│   │   ├── pricing/
│   │   └── demo/
│   ├── (app)/                  ← Authenticated app shell
│   │   ├── layout.tsx          ← AppShell (sidebar + topbar)
│   │   ├── dashboard/
│   │   ├── admin/
│   │   │   ├── proxy-board/
│   │   │   ├── teachers/
│   │   │   ├── students/
│   │   │   ├── staff/
│   │   │   ├── absences/
│   │   │   ├── attendance/
│   │   │   ├── swaps/
│   │   │   ├── fees/
│   │   │   │   ├── structure/
│   │   │   │   ├── collection/
│   │   │   │   └── defaulters/
│   │   │   ├── expenses/
│   │   │   ├── timetable/
│   │   │   ├── notices/
│   │   │   ├── holidays/
│   │   │   ├── analytics/
│   │   │   ├── reports/
│   │   │   ├── announcements/
│   │   │   ├── audit/
│   │   │   ├── settings/
│   │   │   └── subscription/
│   │   ├── management/
│   │   │   ├── dashboard/
│   │   │   ├── absences/
│   │   │   ├── proxy/
│   │   │   ├── swaps/
│   │   │   ├── workload/
│   │   │   ├── timetable/
│   │   │   ├── notices/
│   │   │   ├── exams/
│   │   │   ├── reports/
│   │   │   ├── attendance/
│   │   │   ├── daily-log/
│   │   │   └── profile/
│   │   ├── teacher/
│   │   │   ├── dashboard/
│   │   │   ├── timetable/
│   │   │   ├── proxy-history/
│   │   │   ├── leave/
│   │   │   │   ├── apply/
│   │   │   │   └── history/
│   │   │   ├── attendance/
│   │   │   │   ├── mark/
│   │   │   │   └── history/
│   │   │   ├── notifications/
│   │   │   └── notices/
│   │   ├── parent/
│   │   │   ├── dashboard/
│   │   │   ├── attendance/
│   │   │   ├── journal/
│   │   │   ├── report-card/
│   │   │   ├── exams/
│   │   │   ├── fees/
│   │   │   ├── notifications/
│   │   │   └── leave/
│   │   └── super-admin/
│   │       ├── overview/
│   │       ├── analytics/
│   │       ├── health/
│   │       ├── tenants/
│   │       ├── billing/
│   │       ├── affiliates/
│   │       ├── backup/
│   │       ├── emergency/
│   │       ├── settings/
│   │       └── audit/
│   ├── api/                    ← Next.js API routes (Payload CMS bridge)
│   │   ├── auth/
│   │   ├── proxy/
│   │   ├── absences/
│   │   ├── teachers/
│   │   └── webhooks/
│   └── globals.css             ← shadcn token bridge (see §1.2)
│
├── components/
│   ├── ui/                     ← shadcn/ui generated components (DO NOT edit directly)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── tooltip.tsx
│   │   ├── avatar.tsx
│   │   ├── progress.tsx
│   │   ├── separator.tsx
│   │   ├── sidebar.tsx
│   │   ├── toast.tsx
│   │   ├── switch.tsx
│   │   ├── accordion.tsx
│   │   ├── alert.tsx
│   │   ├── calendar.tsx
│   │   ├── command.tsx
│   │   ├── popover.tsx
│   │   ├── sheet.tsx
│   │   └── skeleton.tsx
│   │
│   ├── layout/                 ← App shell primitives
│   │   ├── AppShell.tsx        ← Root authenticated layout
│   │   ├── AppSidebar.tsx      ← Role-aware nav sidebar
│   │   ├── Topbar.tsx          ← Sticky top bar with search + user
│   │   └── Breadcrumb.tsx      ← Auto breadcrumb from route
│   │
│   ├── shared/                 ← Cross-domain reusable components
│   │   ├── PageHeader.tsx      ← title + subtitle + actions (replaces SchPageHeader)
│   │   ├── SearchInput.tsx     ← Filter bar search (replaces SchSearchInput)
│   │   ├── EmptyState.tsx      ← No-results state (replaces SchEmptyState)
│   │   ├── SortIcon.tsx        ← Table sort indicator
│   │   ├── KpiCard.tsx         ← KPI stat card with sparkline
│   │   ├── MiniSparkline.tsx   ← Inline line/bar/arc sparklines
│   │   ├── StatusBadge.tsx     ← Status → Badge mapping (all domains)
│   │   ├── DataTable.tsx       ← Sortable/filterable table wrapper
│   │   ├── FilterBar.tsx       ← Responsive filter row
│   │   ├── ConfirmDialog.tsx   ← Reusable confirm/delete dialog
│   │   └── ExportMenu.tsx      ← PDF/CSV export dropdown
│   │
│   ├── domain/                 ← Domain-specific feature components
│   │   ├── proxy/
│   │   │   ├── ProxyBoard.tsx
│   │   │   ├── ProxyCard.tsx
│   │   │   ├── AssignModal.tsx
│   │   │   └── CoverageDonut.tsx
│   │   ├── absence/
│   │   │   ├── AbsenceForm.tsx
│   │   │   ├── AbsenceRow.tsx
│   │   │   └── PeriodPicker.tsx
│   │   ├── teacher/
│   │   │   ├── TeacherCard.tsx
│   │   │   ├── TeacherForm.tsx
│   │   │   └── WorkloadHeatmap.tsx
│   │   ├── student/
│   │   │   ├── StudentCard.tsx
│   │   │   └── AttendanceGrid.tsx
│   │   ├── fee/
│   │   │   ├── FeeReceiptCard.tsx
│   │   │   └── DefaulterRow.tsx
│   │   ├── timetable/
│   │   │   ├── TimetableGrid.tsx
│   │   │   └── PeriodCell.tsx
│   │   ├── notification/
│   │   │   └── NotificationRow.tsx
│   │   └── chat/
│   │       └── EduFlowAssistant.tsx  ← AI chatbot FAB
│   │
│   └── charts/                 ← Chart wrappers (recharts or shadcn charts)
│       ├── BarChart.tsx
│       ├── LineChart.tsx
│       ├── DonutChart.tsx
│       └── HeatMap.tsx
│
├── lib/
│   ├── utils.ts                ← cn() + shared utils
│   ├── constants.ts            ← PERIODS, PERIOD_LABELS, PLAN_CONFIG
│   ├── proxy-algorithm.ts      ← Auto-assign scoring logic (from AGENTS.md §6)
│   └── status-badges.ts        ← teacherStatus, absenceStatus, feeStatus helpers
│
├── hooks/
│   ├── useRole.ts              ← Current authenticated role
│   ├── useTenant.ts            ← Current school context
│   ├── useProxyBoard.ts        ← Real-time proxy board state
│   └── useAttendanceMode.ts    ← per-period | single-daily
│
├── server/                     ← Server-only code (Payload CMS)
│   ├── payload.config.ts
│   ├── collections/
│   │   ├── Users.ts
│   │   ├── Schools.ts
│   │   ├── Teachers.ts
│   │   ├── Classes.ts
│   │   ├── Timetable.ts
│   │   ├── Absences.ts
│   │   ├── ProxyAssignments.ts
│   │   ├── SwapRequests.ts
│   │   ├── Notifications.ts
│   │   ├── AuditLogs.ts
│   │   └── Subscriptions.ts
│   └── access/
│       ├── bySchool.ts         ← school_id RLS helper
│       └── byRole.ts           ← role-based access control
│
├── types/
│   ├── roles.ts                ← Role union types
│   ├── domain.ts               ← Teacher, Absence, Proxy, etc.
│   └── api.ts                  ← API response shapes
│
├── middleware.ts               ← Auth guard + role routing
├── components.json             ← shadcn CLI config
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## 3. Component Architecture Rules

### 3.1 Three-Tier Component Hierarchy

```
Tier 1 — shadcn/ui primitives (components/ui/)
  Never modified directly. Generated by CLI.
  Button, Card, Badge, Input, Dialog, Table, etc.

Tier 2 — Shared composites (components/shared/)
  Built from Tier 1. Used across all domains and roles.
  PageHeader, KpiCard, DataTable, FilterBar, EmptyState, etc.

Tier 3 — Domain components (components/domain/)
  Built from Tier 1 + Tier 2. Encapsulate business logic.
  ProxyBoard, AbsenceForm, WorkloadHeatmap, FeeReceiptCard, etc.
```

**Rule:** Pages import only from Tier 2 and Tier 3. Pages never import from `components/ui/` directly.

### 3.2 Page Anatomy (Every Page Follows This Pattern)

```tsx
// app/(app)/admin/proxy-board/page.tsx
import { PageHeader }    from "@/components/shared/PageHeader"
import { FilterBar }     from "@/components/shared/FilterBar"
import { ProxyBoard }    from "@/components/domain/proxy/ProxyBoard"
import { KpiCard }       from "@/components/shared/KpiCard"

export default function ProxyBoardPage() {
  return (
    <div className="page-content">           {/* padding + flex-col + gap */}
      <PageHeader
        icon={<LayoutGrid size={22} />}
        title="Proxy Board"
        subtitle="Today's coverage overview"
        actions={<Button>Auto-Assign</Button>}
      />
      <div className="kpi-grid">             {/* 4-col responsive grid */}
        <KpiCard ... />
        <KpiCard ... />
        <KpiCard ... />
        <KpiCard ... />
      </div>
      <FilterBar>
        <SearchInput ... />
        <Select ... />
        <Button>Export</Button>
      </FilterBar>
      <ProxyBoard ... />
    </div>
  )
}
```

### 3.3 Button Size Contract (Identical to prototype rules)

| Context | Size |
|---------|------|
| Page header direct CTAs | `default` (md) |
| Card header / dialog footer | `default` (md) |
| Inside wrapper div in header | `sm` |
| Table rows / list items | `xs` |
| Icon-only | `icon` or `icon-sm` |
| Marketing hero only | `lg` / `xl` |

---

## 4. Domain Model (What to Build First)

### Priority Order (matches ROADMAP.md Phase 1 + 2)

```
1. Auth domain       → Users, Schools, roles, sessions
2. Teacher domain    → CRUD, subjects, caps, timetable assignment
3. Absence domain    → create, approve, reject, full/partial day
4. Proxy domain      → ProxyBoard, auto-assign algorithm, accept/decline
5. Timetable domain  → period grid, drag-drop assignment, export
6. Fee domain        → structure, collection, receipts, defaulters
7. Notification domain → in-app, SMS hook, WhatsApp hook, email hook
8. Swap domain       → peer requests, management approval
9. Parent domain     → child attendance, journal, exams, fees
10. Billing domain   → Razorpay, plans, webhook handling
11. Super Admin domain → tenant management, platform analytics, audit
12. Affiliate domain  → referral links, commissions, payouts
```

---

## 5. Proxy Auto-Assign Algorithm (Port from Prototype)

The scoring engine lives in `lib/proxy-algorithm.ts`:

```typescript
// Step 1 — Hard filters (must ALL pass)
const eligible = teachers.filter(t =>
  t.isFreeAtPeriod(period) &&
  t.dailyProxyCount < t.dailyProxyCap &&
  t.weeklyProxyCount < t.weeklyProxyCap &&
  !t.isAbsentToday &&
  !violatesConsecutiveRule(t, period)
)

// Step 2 — Score
const scored = eligible.map(t => ({
  teacher: t,
  score:
    (t.primarySubject === absentTeacher.primarySubject ? 10 : 0) +
    (t.subjects.includes(absentTeacher.primarySubject) ? 7 : 0) +
    (t.hasTaughtClass(period.classId) ? 5 : 0) +
    (t.section === absentTeacher.section ? 4 : 0) +
    (maxProxyToday - t.proxyCountToday) * 0.3 +
    (maxProxyWeek - t.proxyCountWeek) * 0.2 -
    (t.declinedRecentProxy ? 3 : 0) -
    (t.section !== absentTeacher.section ? 5 : 0)
}))

// Step 3 — Sort and return top 3
return scored.sort((a, b) => b.score - a.score).slice(0, 3)
```

**Proxy Board Dot Colors:**
- 🟢 `bg-success` (same subject, available)
- 🟡 `bg-warning` (different subject, available)
- ⚫ `bg-muted-foreground` (capped)
- 🔴 `bg-destructive` (unavailable)

---

## 6. Role-Based Routing (middleware.ts)

```typescript
const ROLE_DEFAULT_ROUTES = {
  super_admin: '/super-admin/overview',
  admin:       '/admin/dashboard',
  management:  '/management/dashboard',
  teacher:     '/teacher/dashboard',
  parent:      '/parent/dashboard',
}

// Each role can only access its own prefix
// super_admin can access all (impersonation mode)
```

---

## 7. Data Layer (Payload CMS Collections)

### Key collection design decisions:

1. **Every collection has `schoolId`** (except `users` — cross-school for super admin)
2. **`access.read/update/delete`** always filters by `schoolId` matching the logged-in user's school
3. **`AuditLogs` is append-only** — never update or delete
4. **`Absences.status`**: `draft | pending | approved | rejected`
5. **`ProxyAssignments.status`**: `assigned | accepted | declined | completed`
6. **`SwapRequests.status`**: `pending | agreed | management_pending | approved | rejected`
7. **`Subscriptions.status`**: `trial | active | grace | suspended`

---

## 8. Shadcn Component Installation List

Run in order (these are the shadcn components to install via CLI):

```bash
# Core layout
npx shadcn@latest add sidebar
npx shadcn@latest add separator

# Navigation  
npx shadcn@latest add breadcrumb
npx shadcn@latest add command        ← Command palette (⌘K)
npx shadcn@latest add dropdown-menu

# Data display
npx shadcn@latest add card
npx shadcn@latest add badge
npx shadcn@latest add avatar
npx shadcn@latest add table
npx shadcn@latest add calendar

# Forms
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add switch
npx shadcn@latest add checkbox
npx shadcn@latest add textarea
npx shadcn@latest add form           ← react-hook-form + zod

# Overlay
npx shadcn@latest add dialog
npx shadcn@latest add sheet
npx shadcn@latest add popover
npx shadcn@latest add tooltip
npx shadcn@latest add alert-dialog

# Feedback
npx shadcn@latest add toast          ← or sonner
npx shadcn@latest add alert
npx shadcn@latest add skeleton
npx shadcn@latest add progress

# Navigation tabs
npx shadcn@latest add tabs
npx shadcn@latest add accordion
```

---

## 9. Tailwind Configuration (tailwind.config.ts)

```typescript
import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
    },
    extend: {
      colors: {
        background:  "hsl(var(--background))",
        foreground:  "hsl(var(--foreground))",
        card:        { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        popover:     { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        primary:     { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary:   { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted:       { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent:      { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        border:      "hsl(var(--border))",
        input:       "hsl(var(--input))",
        ring:        "hsl(var(--ring))",
        // EduFlow semantic extensions
        success:     { DEFAULT: "var(--success)", foreground: "var(--success-foreground)" },
        warning:     { DEFAULT: "var(--warning)", foreground: "var(--warning-foreground)" },
        info:        { DEFAULT: "var(--info)",    foreground: "var(--info-foreground)" },
        // Chart colors
        "chart-1":   "var(--chart-1)",
        "chart-2":   "var(--chart-2)",
        "chart-3":   "var(--chart-3)",
        "chart-4":   "var(--chart-4)",
        "chart-5":   "var(--chart-5)",
        // Sidebar
        sidebar: {
          DEFAULT:             "var(--sidebar)",
          foreground:          "var(--sidebar-foreground)",
          primary:             "var(--sidebar-primary)",
          "primary-foreground":"var(--sidebar-primary-foreground)",
          accent:              "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border:              "var(--sidebar-border)",
          ring:                "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg:  "var(--radius)",
        md:  "calc(var(--radius) - 2px)",
        sm:  "calc(var(--radius) - 4px)",
        xl:  "calc(var(--radius) + 6px)",
        "2xl": "calc(var(--radius) + 10px)",
        pill: "9999px",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config
```

---

## 10. Page-by-Page Migration Map

For each page in the prototype (`src/scholaris/pages/`), the rebuild approach is:

| Prototype file | New route | Key domain components |
|---|---|---|
| `admin/DashboardPage.tsx` | `/admin/dashboard` | `KpiCard`, `ProxyStatusTable`, `ActivityFeed`, `WeatherGreeting` |
| `admin/ProxyBoardPage.tsx` | `/admin/proxy-board` | `ProxyBoard`, `CoverageDonut`, `AssignModal` |
| `admin/TeachersPage.tsx` | `/admin/teachers` | `DataTable`, `TeacherForm`, `TeacherCard` |
| `admin/StudentsPage.tsx` | `/admin/students` | `DataTable`, `StudentCard` |
| `admin/AbsenceTrackerPage.tsx` | `/admin/absences` | `AbsenceForm`, `AbsenceRow`, `PeriodPicker` |
| `admin/StudentAttendancePage.tsx` | `/admin/attendance` | `AttendanceGrid`, `PeriodSelector` |
| `admin/TimetablePage.tsx` | `/admin/timetable` | `TimetableGrid`, `PeriodCell`, drag-drop |
| `admin/FeeCollectionPage.tsx` | `/admin/fees/collection` | `FeeReceiptCard`, `PaymentModal` |
| `admin/AnalyticsPage.tsx` | `/admin/analytics` | `LineChart`, `DonutChart`, `HeatMap` |
| `management/ManagementDashboardPage.tsx` | `/management/dashboard` | `MorningBriefing`, `CountdownTimer`, `CoverageBar` |
| `teacher/TeacherDashboardPage.tsx` | `/teacher/dashboard` | `DailySchedule`, `ProxyRequestCard`, `LeaveBalance` |
| `parent/ParentDashboardPage.tsx` | `/parent/dashboard` | `ChildStatusCard`, `AttendanceBar`, `ExamCountdown` |
| `super-admin/SaaSOverviewPage.tsx` | `/super-admin/overview` | `MrrChart`, `TenantList`, `ChurnRiskAlert` |
| `marketing/LandingPage.tsx` | `/` | Hero, Features, Pricing, Testimonials |
| `marketing/PricingPage.tsx` | `/pricing` | `PricingCard` with Razorpay plans |
| `marketing/OnboardingWizardPage.tsx` | `/onboarding` | `StepWizard`, 5-step form |

---

## 11. Build Sequence

Follow this exact order to avoid dependency hell:

```
Week 1–2:   Project scaffold + design system setup
            → Next.js 15 init, Tailwind config, shadcn install
            → globals.css token bridge
            → AppShell layout (sidebar + topbar)
            → Role-based routing in middleware.ts
            → PageHeader + KpiCard + FilterBar + DataTable shared components

Week 3–4:   Auth + database foundation
            → Payload CMS setup + collections (Users, Schools)
            → Login/signup pages
            → School onboarding wizard (5 steps)
            → Teacher CRUD + teacher profile page

Week 5–6:   Core proxy workflow (the MVP)
            → Absences: create, approve, reject
            → ProxyBoard: availability dots, assignment
            → Auto-assign algorithm wired
            → Teacher: accept/decline proxy request

Week 7–8:   Timetable + fee modules
            → TimetableGrid drag-drop builder
            → Fee structure + collection + receipt

Week 9–10:  Parent portal + notifications
            → Parent dashboard + child attendance + journal
            → Notification hub (in-app + SMS/WhatsApp hooks)

Week 11–12: Analytics + reporting + billing
            → Analytics charts (recharts)
            → PDF report generation
            → Razorpay integration + webhook handling

Week 13+:   Super admin, affiliate, PWA, dark mode polish
```

---

## 12. What NOT to Port From the Prototype

- `src/styles/global.css` — replaced by shadcn token bridge in `app/globals.css`
- `src/scholaris/styles.css` — replaced by the same
- All `.sch-*` CSS class names — replaced by Tailwind utilities + shadcn tokens
- `src/components/` (legacy design system) — replaced by `components/ui/` (shadcn)
- The dual-repo structure — the new app is a single Next.js 15 repo
- `localStorage` data layer — replaced by Payload CMS + PostgreSQL

---

## 13. What to Port 1:1

- All business logic in `src/logic/` → `lib/`
- Mock data schemas from `src/scholaris/data/` → seed files for Payload CMS
- Proxy algorithm from `AGENTS.md §6` → `lib/proxy-algorithm.ts`
- All 69 page layouts (visual structure, component arrangement, UX patterns)
- All design token values (colors, radii, shadows) — just remapped to shadcn names
- `EduFlowAssistant.tsx` chatbot FAB (API wiring optional, mock engine first)
- `WeatherClock.tsx` (Open-Meteo, no changes needed)
- `MiniSparkline.tsx` (port as-is to `components/shared/`)

---

## 14. Testing Strategy

```
Unit tests:   lib/proxy-algorithm.ts, lib/utils.ts, lib/status-badges.ts
Component:    PageHeader, KpiCard, ProxyBoard, DataTable (Vitest + Testing Library)
Integration:  Payload CMS collection access control tests
E2E:          Playwright — critical flows: login → mark absence → assign proxy → confirm
```

---

*This document is the master rebuild blueprint. All product decisions reference `VISION.md`. All phase order references `ROADMAP.md`. All design tokens reference `AGENTS.md §5`.*
