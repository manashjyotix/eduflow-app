# EduFlow — School Management App

**School (demo/lead):** Holy Child English Academy (HCEA), Howly, Barpeta, Assam  
**Stack:** Vite 5 · React 18 · TypeScript · Tailwind CSS v4 · shadcn/ui PRO V6 tokens · Radix UI · Lucide React · Vitest  
**Design System:** [shadcn/ui PRO Variables V6.0](https://www.figma.com/community/file/BlFqAE1yNoGDD4IFKyqaIV) — two-layer token architecture

> This repo contains **two things**: a UI design system component library (50+ components) AND a full role-aware functional prototype — **69 pages across 6 roles** — called the Scholaris app.
>
> **Building from scratch?** See [`REBUILD_PLAN.md`](./REBUILD_PLAN.md) for the Next.js 15 production app architecture, and [`KIRO_REBUILD_PROMPT.md`](./KIRO_REBUILD_PROMPT.md) for the master AI agent prompt.

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

```bash
npm test          # Run Vitest test suite
npm run typecheck # TypeScript type check (no emit)
npm run build     # Production build
```

---

## What You'll See at localhost:5173

The app opens with the **Scholaris prototype** — a full role-aware school management UI. Use the role switcher in the sidebar footer to switch between:

| Role | What You See |
|------|-------------|
| 🟣 **Super Admin** | Platform overview: MRR/ARR, tenant management, billing, affiliates, system health |
| 🔵 **Admin** | School ops: proxy board, teachers, students, fees, timetable, analytics, settings |
| 🟠 **Management** | Daily ops: absence approvals, proxy assignment, workload, exam schedule, reports |
| 🟢 **Teacher** | Personal: daily schedule, proxy accept/decline, leave application, attendance |
| 🩷 **Parent** | Child tracking: attendance, class journal, exam countdown, fee dues, report card |
| 🌸 **Marketing** | Product site: landing page, features, pricing, signup, onboarding wizard |

The **component showcase** (design system) is accessible from the main entry. See `src/showcase/`.

---

## Demo Credentials (Production App)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@proxymanager.app | super123 |
| Admin | admin@hcea.edu | admin123 |
| Management | mgmt@hcea.edu | mgmt123 |
| Teacher | priya@hcea.edu | teacher123 |
| Parent | parent@hcea.edu | parent123 |

> These are for the production Next.js SaaS app. This repo has no real auth — use the role switcher.

---

## Repository Structure

```
src/
  components/    ← Design system components (50+) + __tests__/
  lib/           ← cn.ts, utils.ts
  logic/         ← Business logic modules + __tests__/
  showcase/      ← Visual component showcase pages
  styles/        ← CSS design system (global.css)
  theme/         ← DarkModeProvider
  tokens/        ← Design tokens + __tests__/

  scholaris/     ← Full role-aware prototype (69 pages)
    ScholarisApp.tsx        ← Root with shadcn sidebar + role switcher
    components/
      EduFlowAssistant.tsx  ← AI chatbot FAB (mock responses)
      WeatherClock.tsx      ← Live weather widget (Open-Meteo, no key)
      MiniSparkline.tsx     ← Inline sparkline charts
      SchPageHeader.tsx     ← Shared page header (all 69 pages use this)
      SchSearchInput.tsx    ← Shared search input
      SchEmptyState.tsx     ← Shared empty state
      SortIcon.tsx          ← Shared table sort indicator
    context/
      SchoolSettingsContext.tsx  ← attendanceMode config
    data/
      teachers.ts           ← HCEA mock teachers (single source of truth)
      periods.ts            ← HCEA period schedule (single source of truth)
    lib/
      statusBadges.tsx      ← Status → Badge helpers
    pages/
      admin/        ← 22 pages
      management/   ← 12 pages
      teacher/      ←  9 pages
      parent/       ←  8 pages
      super-admin/  ← 11 pages
      marketing/    ←  7 pages
    ui/             ← shadcn/ui component wrappers
    styles.css      ← Scholaris CSS + shadcn PRO V6 token bridge
```

---

## Design System

### shadcn/ui PRO V6 — Two-Layer Token Architecture

EduFlow uses the [shadcn/ui PRO Variables V6.0](https://www.figma.com/community/file/BlFqAE1yNoGDD4IFKyqaIV) design system. The brand palette is mapped to shadcn semantic tokens so all components use standard Tailwind utilities.

```
Layer 1 (primitives)  →  --ef-brand: #007AFF, --ef-green: #34C759, etc.
Layer 2 (semantics)   →  --primary, --background, --destructive, etc.
Tailwind utilities    →  bg-primary, text-foreground, border-border, etc.
```

**Core palette:**
```css
--ef-brand: #007AFF     /* iOS blue — --primary */
--ef-green: #34C759     /* available / success */
--ef-amber: #FF9500     /* warning / pending */
--ef-red:   #FF3B30     /* danger — --destructive */
--background: #F2F2F7   /* page bg */
--card:       #FFFFFF   /* card surface */
```

Full token reference in `Design.md`. Production app token bridge in `REBUILD_PLAN.md §1.2`.

---

## Proxy Board Color Coding

| Dot | Meaning |
|-----|---------|
| 🟢 Green (`bg-[var(--ef-green)]`) | Available, **same subject** as absent teacher |
| 🟡 Amber (`bg-[var(--ef-amber)]`) | Available, **different subject** (alt proxy) |
| ⚫ Gray (`bg-muted-foreground`) | **Maxed out** — at daily/weekly/monthly cap |
| 🔴 Red (`bg-destructive`) | **Unavailable** — in class or declined |

> Color is **always paired with a text label** — never color alone (WCAG 1.4.1).

---

## Key Documentation

| File | Purpose |
|------|---------|
| [`AGENTS.md`](./AGENTS.md) | AI agent context — full architecture, all 69 pages, mock data, business rules |
| [`REBUILD_PLAN.md`](./REBUILD_PLAN.md) | **★ Next.js 15 production app blueprint** — folder structure, component hierarchy, build sequence |
| [`KIRO_REBUILD_PROMPT.md`](./KIRO_REBUILD_PROMPT.md) | **★ Master AI prompt** for building the production app from scratch |
| [`VISION.md`](./VISION.md) | Complete product blueprint (canonical business rules) |
| [`Claude.md`](./Claude.md) | Full technical specification for agency handoff |
| [`Design.md`](./Design.md) | Visual design system reference (v8.0 — shadcn PRO V6) |
| [`ROADMAP.md`](./ROADMAP.md) | Canonical phase-by-phase build order |
| [`CHANGELOG.md`](./CHANGELOG.md) | Version history |

---

## Roadmap to Production

See [`ROADMAP.md`](./ROADMAP.md) for the full phase-by-phase build plan. See [`REBUILD_PLAN.md`](./REBUILD_PLAN.md) for the Next.js 15 architecture.

| Phase | Focus |
|-------|-------|
| **Phase 0** | Prototype completion: dark mode, exam routine, progress notes, QR check-in |
| **Phase 1** | Payload CMS + PostgreSQL, Auth, multi-tenancy, Razorpay billing, onboarding wizard |
| **Phase 2** | Class manager, teacher profiles, notification hub, swap system, leave balance, Excel import |
| **Phase 3** | Parent portal, affiliate program, announcement board, proxy rules engine |
| **Phase 4** | PWA, dark mode, multi-language, AI integration, QR check-in, native iOS/Android apps |

> `VISION.md` — complete product blueprint · `AGENTS.md` — AI agent context · `REBUILD_PLAN.md` — production architecture

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

```bash
npm test          # Run Vitest test suite
npm run typecheck # TypeScript type check (no emit)
npm run build     # Production build
```

---

## What You'll See at localhost:5173

The app opens with the **Scholaris prototype** — a full role-aware school management UI. Use the role switcher in the sidebar footer to switch between:

| Role | What You See |
|------|-------------|
| 🟣 **Super Admin** | Platform overview: MRR/ARR, tenant management, billing, affiliates, system health |
| 🔵 **Admin** | School ops: proxy board, teachers, students, fees, timetable, analytics, settings |
| 🟠 **Management** | Daily ops: absence approvals, proxy assignment, workload, exam schedule, reports |
| 🟢 **Teacher** | Personal: daily schedule, proxy accept/decline, leave application, attendance |
| 🩷 **Parent** | Child tracking: attendance, class journal, exam countdown, fee dues, report card |
| 🌸 **Marketing** | Product site: landing page, features, pricing, signup, onboarding wizard |

The **component showcase** (design system) is accessible from the main entry. See `src/showcase/`.

---

## Demo Credentials (Production App)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@proxymanager.app | super123 |
| Admin | admin@hcea.edu | admin123 |
| Management | mgmt@hcea.edu | mgmt123 |
| Teacher | priya@hcea.edu | teacher123 |
| Parent | parent@hcea.edu | parent123 |

> These are for the production Next.js SaaS app. This repo has no real auth — use the role switcher.

---

## Repository Structure

```
src/
  components/    ← Design system components (50+) + __tests__/
  lib/           ← cn.ts, utils.ts
  logic/         ← Business logic modules + __tests__/
  showcase/      ← Visual component showcase pages
  styles/        ← CSS design system (global.css)
  theme/         ← DarkModeProvider
  tokens/        ← Design tokens + __tests__/

  scholaris/     ← Full role-aware prototype (69 pages)
    ScholarisApp.tsx        ← Root with shadcn sidebar + role switcher
    components/
      EduFlowAssistant.tsx  ← AI chatbot FAB (mock responses)
      WeatherClock.tsx      ← Live weather widget (Open-Meteo, no key)
      MiniSparkline.tsx     ← Inline sparkline charts
    context/
      SchoolSettingsContext.tsx  ← attendanceMode config
    pages/
      admin/        ← 22 pages
      management/   ← 12 pages
      teacher/      ←  9 pages
      parent/       ←  8 pages
      super-admin/  ← 11 pages
      marketing/    ←  7 pages
    ui/             ← shadcn/ui component wrappers
```

---

## Design System Components (50+)

| Category | Components |
|----------|------------|
| **Layout** | `Header`, `Sidebar`, `Navigation`, `Drawer` |
| **Data Display** | `Card`, `Badge`, `Avatar`, `StaffProfileCard`, `StudentCard`, `ClassCard`, `SubjectCard` |
| **Inputs** | `Input`, `Select`, `Combobox`, `CheckRadio`, `DatePicker`, `FileUpload` |
| **Feedback** | `Alert`, `Callout`, `EmptyState`, `Spinner`, `Skeleton`, `Toast` |
| **Overlay** | `Modal`, `Drawer`, `Tooltip`, `Menu` |
| **Charts** | `Chart`, `Charts`, `HeatMap`, `LineChart` |
| **Domain** | `ProxyBoard`, `SwapRequest`, `NotificationRow`, `LeaveQuotaBar`, `PricingCard`, `FeeReceiptCard`, `ExamScheduleCard`, `GradeCard` |
| **Utility** | `CommandPalette`, `Accordion`, `Divider`, `Progress`, `Search`, `ExportPanel` |

---

## Design System

iOS Human Interface Guidelines applied to a web SaaS. Primary color: **#007AFF** (iOS Blue).

```css
--brand: #007AFF       /* iOS blue — primary */
--green: #34C759       /* available / success */
--amber: #FF9500       /* warning / pending */
--red:   #FF3B30       /* danger / SOS */
--content-bg: #F2F2F7  /* page background */
--card-bg: #FFFFFF     /* card background */
```

Full visual reference in `Design.md`. Full product blueprint in `VISION.md`.

---

## Proxy Board Color Coding

| Dot | Meaning |
|-----|---------|
| 🟢 Green | Available, **same subject** as absent teacher |
| 🟡 Amber | Available, **different subject** (alt proxy) |
| ⚫ Gray | **Maxed out** — at daily/weekly/monthly cap |
| 🔴 Red | **Unavailable** — in class or declined |

> Color is **always paired with a text label** — never color alone (accessibility).

---

## Roadmap to Production

See [`ROADMAP.md`](./ROADMAP.md) for the full phase-by-phase build plan.

| Phase | Focus |
|-------|-------|
| **Phase 1** | Payload CMS + PostgreSQL, Auth, multi-tenancy, Razorpay billing, onboarding wizard |
| **Phase 2** | Class manager, teacher profiles, notification hub, swap system, leave balance, Excel import |
| **Phase 3** | Parent portal, affiliate program, announcement board, proxy rules engine, document manager |
| **Phase 4** | PWA, dark mode, multi-language, AI integration, QR check-in, native iOS/Android apps |

> See `VISION.md` for the complete product blueprint · `AGENTS.md` for AI agent context · `PROJECT_BUNDLE.md` for the AI context pack.
