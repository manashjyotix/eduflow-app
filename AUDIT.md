# EduFlow — Consolidated Audit
> **Last updated:** 2026-06-27 · Update after every sprint.
> **Scope:** Full stack — frontend pages, components, design system, backend, security, accessibility.
> **Codebase:** `eduflow-app` — Next.js 15 · React 19 · TypeScript · Tailwind v4 · shadcn/ui PRO V6 · Mongoose/MongoDB · NextAuth v5.

**Related Documentation:** [README](./README.md) · [AGENTS](./AGENTS.md) · [VISION](./VISION.md) · [ROADMAP](./ROADMAP.md) · [Design](./Design.md) · [CHANGELOG](./CHANGELOG.md)

> **This file consolidates three former documents** that previously overlapped heavily:
> - the original frontend audit (icon map, component coverage, feature gaps),
> - the full-stack/security audit (`AUDIT_REPORT.md`),
> - the design-system/responsive audit + batch tracker (`DESIGN_AUDIT.md` + `PROGRESS.md`).
>
> It is organized as: **Part A — Build State & Health**, **Part B — Security & Backend**, **Part C — Frontend & Components**, **Part D — Design System & Responsiveness**, **Part E — Feature Gaps & Upgrade List**, **Part F — Fix Plan & Build Order**, **Part G — Work Log / Batch Tracker**.

---

# Part A — Build State & Health

## A.1 Current Build State

| Category | Status | Notes |
|---|---|---|
| All pages (6 roles + marketing) | ✅ Complete | ~79 routes render with mock data |
| shadcn/ui components | ✅ 32 installed | Full list in C.1 |
| Shared component layer | ✅ Complete | `src/components/shared/` |
| Domain component tier | ✅ Present | `src/components/domain/` (proxy, absence, timetable, fee, etc.) |
| Design tokens (globals.css) | ✅ Complete | EduFlow brand → shadcn semantic bridge + `--color-ef-*` in `@theme inline` |
| Dark mode | ✅ Complete | `next-themes` + `.dark` strategy |
| TypeScript | ✅ Green | `npm run typecheck` passes |
| Lint | ✅ Clean | `npm run lint` (minor pre-existing warnings only) |
| Build | ✅ Static | `npm run build` prerenders all pages |
| Form validation | ✅ Present | `react-hook-form` + `zod` wired in key forms |
| Backend / Auth | 🟡 Scaffolded | Mongoose models + API routes exist; not all pages wired |
| Real-time | ❌ Not started | No websockets/SSE |
| Middleware (route guards) | 🟡 Partial | `auth-guard` component present; central `middleware.ts` to confirm |

## A.2 Verified Health Checks

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | ✅ clean |
| ESLint | `npx next lint` | ✅ ~18 minor warnings |
| Pages | count `page.tsx` | ~79 (app + marketing) |
| Loading boundaries | count `loading.tsx` | present per role segment |
| Error boundaries | count `error.tsx` | present per role segment |
| API routes | `src/app/api/**` | present (auth, teachers, absences, proxies, attendance, fees, notifications, hazard) |
| Models | `src/models/**` | School, User, Teacher, Absence, Proxy |

---

# Part B — Security & Backend

> Source: former `AUDIT_REPORT.md` (2026-06-19). Re-verify items as the backend is wired.

## B.1 Critical Security Items

- **L1 — Stored XSS via chatbot `dangerouslySetInnerHTML`** (`src/components/shared/eduflow-assistant.tsx`). `formatContent` builds HTML by hand and renders via `dangerouslySetInnerHTML`. Latent today (hardcoded content) but exploitable once wired to an LLM/backend. **Fix:** render markdown via a safe parser or React nodes; if HTML is required, sanitize with DOMPurify.
- **L2 — No authentication / no session.** `(marketing)/login` is a no-op `setTimeout`; the `(app)` layout renders every role's pages to anyone; demo plaintext passwords are committed and shown in UI. **Fix:** NextAuth v5 credentials provider against `User.passwordHash` (bcrypt), httpOnly session cookie, `middleware.ts` route guard.
- **L3 — No authorization / tenant isolation.** Models carry `schoolId` but no query filters by it; no role checks. **Fix:** every query `.find({ schoolId: session.schoolId })`; central `requireRole()` / `requireSchoolScope()` helpers.
- **L4/L5 — No input validation / NoSQL injection surface.** **Fix:** validate every API body with zod before Mongoose; `mongoose.set("strictQuery", true)`; never pass raw request objects to queries.
- **L6 — Secrets & env hygiene.** Generate a real `NEXTAUTH_SECRET`; validate env at boot (e.g. `@t3-oss/env-nextjs`).
- **L7 — Cookies & headers.** Set `Secure; SameSite=Lax` on cookies; add CSP + `X-Frame-Options: DENY` + `Referrer-Policy` + `Permissions-Policy` in `next.config.ts`.

## B.2 Backend Build-Out

- `src/lib/mongodb.ts` cached-connection helper ✅ correct pattern.
- `src/models/` — well-designed (`schoolId`, enums, indexes, timestamps).
- Wire pages off `src/data/mock-*.ts` → `fetch`/server components or SWR/React Query.
- Build: auth routes, core CRUD (teachers/absences/proxies/attendance/fees/notifications), seed script, Razorpay webhook, audit-log writer, trial-expiry + fee-reminder crons.

---

# Part C — Frontend & Components

## C.1 shadcn/ui Coverage (32 installed)

`accordion` · `alert-dialog` · `alert` · `avatar` · `badge` · `breadcrumb` · `button` · `calendar` · `card` · `chart` · `checkbox` · `collapsible` · `command` · `dialog` · `dropdown-menu` · `form` · `input` · `label` · `popover` · `progress` · `radio-group` · `scroll-area` · `select` · `separator` · `sheet` · `sidebar` · `skeleton` · `sonner` · `switch` · `table` · `tabs` · `textarea` · `tooltip`.

Optional future installs: `hover-card`, `context-menu`, `navigation-menu`, `menubar`.

## C.2 Sidebar Icon Map (unique per role)

**Admin:** Dashboard `LayoutDashboard` · Proxy Board `LayoutGrid` · Teachers `Users` · Students `GraduationCap` · Staff `UserCog` · Roles `ShieldCheck` · Absences `ClipboardList` · Swaps `ArrowLeftRight` · Attendance `CheckSquare` · Timetable `Calendar` · Holiday `BookMarked` · Fees `Banknote` · Expenses `Wallet` · Analytics `BarChart3` · Reports `FileText` · Notices `ScrollText` · Announcements `Megaphone` · Audit `History` · Subscription `CreditCard` · Settings `Settings`.

**Management:** Dashboard `LayoutDashboard` · Daily Log `NotebookPen` · Absence Approval `ClipboardList` · Proxy `LayoutGrid` · Swap Approvals `ArrowLeftRight` · Workload `TrendingUp` · Attendance `CheckSquare` · Exams `GraduationCap` · Timetable `Calendar` · Reports `BarChart3` · Notices `ScrollText` · Profile `User`.

**Teacher:** Dashboard `LayoutDashboard` · Timetable `Calendar` · Apply Leave `ClipboardList` · Leave History `History` · Proxy History `ArrowLeftRight` · Mark Attendance `CheckSquare` · Attendance History `ListChecks` · Notices `ScrollText` · Notifications `Bell`.

**Parent:** Dashboard `LayoutDashboard` · Attendance `CheckSquare` · Journal `BookOpen` · Report Card `ScrollText` · Exams `ClipboardCheck` · Fees `Receipt` · Leave `FileText` · Notifications `Bell`.

**Super Admin:** Overview `Globe` · Analytics `BarChart3` · Health `PlugZap` · Schools `Building2` · Drilldown `UserRoundSearch` · Billing `Receipt` · Affiliates `HeartHandshake` · Backup `Database` · Emergency `TriangleAlert` · Audit `History` · Settings `Settings`.

## C.3 Frontend Quality Notes

- **Fat client pages:** several pages are large (`onboarding` ~633 lines, `admin/dashboard` ~530). Move mock reads into server components; keep interactive islands as `'use client'`; extract into `domain/` components.
- **Accessibility:** color+label pairing on status dots, `aria-label`/`aria-hidden` on avatars and icon-only buttons, `<caption>` on data tables. Most resolved (see Part G); remaining items tracked there.
- **Performance:** code-split `recharts` for chart-heavy pages; `next/image` for photos; route-segment `loading.tsx`/`error.tsx` (present).

---

# Part D — Design System & Responsiveness

> Source: former `DESIGN_AUDIT.md` (2026-06-22). Foundation is strong; remaining work is cleanup, not rebuild.

## D.1 Token Foundation ✅

`src/app/globals.css` is Figma-accurate: `--color-ef-*` primitives exposed in `@theme inline` (resolves `bg-ef-*`/`text-ef-*`); radius scale anchored to 6px (4/6/8/12/16px); light + iOS-dark palettes with 0.25-opacity tinted `*-light` fills in dark mode; 5-color chart palette; full `--sidebar-*` set; fluid root `font-size: clamp(15px, 0.9rem + 0.25vw, 16px)`.

## D.2 Remaining Cleanup

- **Mobile Sheet width** (`admin/notices`): `w-[440px]` base → `w-full max-w-[440px]`.
- **~12 wide tables** missing `overflow-x-auto` wrapper (audit/cohorts/billing/health/backup/tenants/etc.).
- **13 fixed large headings** (`text-3xl/4xl/6xl`) need responsive step (`text-2xl sm:text-3xl leading-tight`).
- **4px spacing rule:** ~8 files (super-admin worst) use half-step layout spacing (`px-3.5`, `py-2.5`, `gap-3.5`, `p-[3px]`, `[18px]`) → round to 4px multiples. Half-steps on icon rows / dense cells / small dots are acceptable shadcn conventions and are NOT flagged.
- **Bare `grid-cols-4` TabsList** (`features`) → `grid-cols-2 sm:grid-cols-4`.

## D.3 Already Compliant ✅

Token bridge (316 `ef-*` usages render); `StatusBadge` family data-driven semantic tones (no raw palette); `AvailabilityDot` `aria-hidden` + text label; 0 raw `<table>` (all shadcn `<Table>`); sortable headers keyboard-accessible (`aria-sort` + `onKeyDown`); `lucide-react` only; KPI grid `grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4`; global `overflow-x: hidden` guard; print styles for report card.

---

# Part E — Feature Gaps & Upgrade List

## E.1 Critical / High

- Morning Briefing countdown timer (`/management/dashboard`) — live `useInterval`, currently static.
- Proxy auto-assign scoring engine — extract to `src/lib/proxy-algorithm.ts` (subject → availability → cap proximity → fairness); unit-test.
- Real-time proxy accept/decline (SSE or polling).
- Period Picker component (multi-select P1–P7) for leave/absence forms.
- Attendance mode persistence (`per-period` vs `single-daily`) to `School.settings`.

## E.2 Medium / Polish

- Progress Notes flow (teacher → class → student → note).
- Subject Completion Tracker + Behavioral Trend chart (parent portal).
- QR check-in (`qrcode`), Command Palette wiring (`cmdk` ⌘K), `BreadcrumbAuto`, WeatherGreeting banner.
- Academic Year Rollover wizard; Excel import (`xlsx`); Document Manager; multi-child parent switcher; announcement expiry; affiliate payout queue.
- Bulk table actions; in-page search wiring; empty states with CTAs; localized `formatINR`/`formatDate`.

---

# Part F — Fix Plan & Recommended Build Order

```
Week 1 — Security + Auth spine
  L1 XSS fix → NextAuth v5 → middleware.ts → env validation → security headers
  scripts/seed.ts (demo users + HCEA) → /api/auth/* routes
Week 2 — Core API + data wiring
  zod schemas → /api/teachers,/absences,/proxies (school-scoped, role-checked)
  swap pilot pages off mock data (admin dashboard, proxy-board, teachers)
Week 3 — Proxy engine + realtime
  lib/proxy-algorithm.ts (tested) → live accept/decline (SSE) → morning briefing timer
Week 4 — Billing + ops
  Razorpay checkout + webhook → trial-expiry cron → fee reminder job → audit log writer
Week 5 — Frontend hardening
  domain/ extraction → hex→token sweep → form validation polish
Week 6 — Tests + CI + Tier 3 features
  Vitest (lib) + Playwright (e2e) → GitHub Actions → QR check-in, command palette
```

---

# Part G — Work Log / Batch Tracker

> Source: former `PROGRESS.md` + `AUDIT.md` work log. Append after each session.

- **2026-06-17** — Comprehensive audit. Sidebar icon deduplication (unique per role). User details enriched in sidebar footer. Custom EduFlow SVG logo. Sign-out in role picker. Typecheck green.
- **2026-06-19** — Full-stack/security audit authored (now Part B).
- **2026-06-21** — **Design System Compliance Sweep (Batches A–F + Phase 1/2).** ~898 issues across ~100 files:
  - **Batch A** — Tailwind v4 token bug: added `--color-ef-*` to `@theme inline` (316 broken classes fixed with one edit).
  - **Batch B** — Eliminated 351 hardcoded palette colors across 16 files (`status-badge.tsx` → data-driven tone table).
  - **Batch C** — Migrated 13 hand-styled buttons → shadcn `<Button>`; keyboard + `aria-sort` on sortable headers. Raw `<table>` migration already complete (37 files use `<Table>`, 0 raw).
  - **Batch D** — 21 grids fixed across 18 files (mobile `grid-cols-1` fallbacks; calendar overflow wrappers).
  - **Batch E** — 76 changes across 18 files (page padding → `p-4 sm:p-6 md:p-8`; `text-[13px]` → `text-sm`).
  - **Batch F** — 3 remaining a11y fixes (2 `<caption>`, 1 `aria-hidden` dot, 1 `aria-hidden` avatar); 47 of 50 already resolved.
  - Gates green: typecheck ✅ · lint ✅ · build ✅.
- **2026-06-27** — Documentation consolidation: merged `AUDIT_REPORT.md`, `DESIGN_AUDIT.md`, `PROGRESS.md` into this file; rewired the MD cross-reference graph.

### Cumulative design-sweep impact

| Batch | Issues Fixed | Files |
|---|---|---|
| Batch A | 316 | 1 (globals.css) |
| Batch B | 351 | 16 |
| Batch C | 31 | 17 |
| Batch D | 21 | 18 |
| Batch E | 76 | 18 |
| Batch F | 3 | 3 |
| **Total** | **~898** | **~100 unique** |

---

*End of consolidated audit. Phase order + architecture → [ROADMAP.md](./ROADMAP.md) · business rules + technical spec → [VISION.md](./VISION.md) · design tokens → [Design.md](./Design.md) / `src/app/globals.css`.*
