# EduFlow — Design & Feature Audit
> **Generated:** 2026-06-22 (refreshed)
> **Scope:** All Next.js App-Router pages + `src/components/{shared,domain,layout,ui}`
> **Source of truth:** `src/app/globals.css` + `FIGMA_DESIGN_GUIDE.md` (Figma `BlFqAE1yNoGDD4IFKyqaIV` — shadcn/ui PRO V6.0)
> **Related:** [AUDIT.md](./AUDIT.md) · [AGENTS.md](./AGENTS.md) · [VISION.md](./VISION.md)

---

## 0. Executive Summary

The **design foundation is strong and largely compliant.** The `ef-*` token bridge that broke 316 class usages has been fixed (`globals.css:84-101`), the fluid root font-size (`globals.css:298`) makes the whole type scale responsive, every shared component uses semantic tokens, and all 68 app pages route through the shared `<PageHeader>`. Dark mode is correctly architected (`next-themes` + `.dark` overrides with 0.25-opacity tinted fills).

What remains is a **cleanup pass, not a rebuild**:

| Severity | Issue | Scope | Status |
|---|---|---|---|
| 🔴 CRITICAL | `w-[440px]` Sheet overflows ≤375px phones | 1 file | ❌ Mobile-breaker |
| 🟠 HIGH | ~12 data tables missing `overflow-x-auto` wrapper | 12 files | ⚠️ Horizontal scroll on mobile |
| 🟠 HIGH | 13 fixed large headings (`text-3xl/4xl/6xl`) with no responsive variant | 5 marketing + 2 app files | ⚠️ Text too big on phones |
| 🟡 MED | 4px-rule violations — `px-3.5`/`py-2.5`/`gap-3.5`/`p-[3px]` layout spacing | ~8 files (super-admin worst) | ⚠️ Spacing inconsistency |
| 🟡 MED | Bare `grid-cols-4` TabsList + one large fixed `text-6xl` grade glyph | 2 files | ⚠️ Mobile squish |
| 🟢 LOW | PageHeader lacks `leading-tight`; 6 error.tsx use raw `<h1>` | 7 files | Polish |
| ✅ GOOD | Token foundation, fluid typography, KPI grid, shared components, dark mode | App-wide | Compliant |

---

## 1. Token Foundation ✅ Compliant

`src/app/globals.css` is complete and Figma-accurate:

- **Brand primitives → semantic bridge:** `--color-ef-*` entries (lines 84-101) expose every EduFlow primitive in `@theme inline`, so `bg-ef-brand-light`, `text-ef-purple`, etc. now resolve in Tailwind v4. *(This was the 🔴 CRITICAL from the previous audit — **resolved**.)*
- **Radius scale (4px/6px base):** `--radius: 6px` (Figma New York button radius); `--radius-sm=4px`, `--radius-md=6px`, `--radius-lg=8px`, `--radius-xl=12px`, `--radius-2xl=16px`, `--radius-pill=9999px`. All multiples of 2px, anchored to 6px — ✅.
- **Light + dark palettes:** iOS palette (`#007AFF`, `#34C759`, `#FF9500`, `#FF3B30`) in `:root`; dark overrides use iOS dark values (`#0A84FF`, `#30D158`, …) with tint `*-light` tokens bumped to 0.25 opacity (line 248-270) so filled icon chips stay visible on dark cards.
- **Charts:** 5-color palette mapped to brand primitives in both themes.
- **Sidebar tokens:** full `--sidebar-*` set wired; tablet sidebar narrowed to 200px (line 439).

**No action needed in globals.css.**

---

## 2. 4px Spacing Rule 🟡 Mostly compliant, ~8 files to clean

**Rule:** all layout padding/gaps must be multiples of 4px (Tailwind `1,2,3,4,5,6,8`). The violations are **half-step utilities on layout containers** (`*-2.5`=10px, `*-3.5`=14px) and a few arbitrary bracket values not divisible by 4.

> Note: half-steps on **icon+label rows, dense table cells, nav items, and small dots/badges** (`gap-1.5`, `py-2.5` on `TableHead`, `w-2.5 h-2.5` swatches) are standard shadcn/Tailwind-UI conventions and are **acceptable judgment calls** — they are NOT flagged here. Only *layout* spacing (card padding, section gaps, KPI grids, banner padding) is flagged.

### 2a. Worst offender — `super-admin/analytics/page.tsx` (~12 layout violations)

| Line | Class | Fix |
|---|---|---|
| 84, 89 | `px-3.5 py-2` (TableCell) | → `px-4 py-2` |
| 155 | `grid grid-cols-2 gap-2.5` | → `gap-2` or `gap-3` |
| 156, 160 | `rounded-lg px-3.5 py-2.5` | → `px-4 py-2` |
| 218, 244 | `px-3.5 py-2.5` | → `px-4 py-2` |
| 297, 298, 300, 307, 308 | `px-3.5` (TableHead/Cell) | → `px-4` |
| 336 | `grid … gap-3.5` | → `gap-3` or `gap-4` |

### 2b. Other layout-spacing offenders

| File:lines | Offending values | Fix |
|---|---|---|
| `management/swaps/page.tsx` :154, :225, :266, :281, :394, :400, :401, :409, :417, :423 | `gap-3.5`, `gap-2.5`, `px-3.5 py-3`, `px-3 py-2.5`, `min-w-[18px] h-[18px]` | → `gap-3/4`, `px-4 py-3`, `min-w-[20px] h-[20px]` |
| `super-admin/emergency/page.tsx` :183, :194, :229, :236, :284, :350 | `px-5 py-3.5`, `gap-2.5`, `px-3.5 py-3`, `gap-3.5` | → `py-4`, `gap-2/3/4` |
| `super-admin/affiliates/page.tsx` :106, :111, :146, :262, :296 | `px-4 py-3.5`, `px-3.5 py-2.5` | → `py-4`, `px-4 py-2` |
| `super-admin/backup/page.tsx` :307, :356 | `px-4 py-3.5`, `px-3.5 py-3` | → `py-4`, `px-4 py-3` |
| `super-admin/health/page.tsx` :119 | `px-5 py-3.5` banner | → `py-4` |
| `super-admin/overview/page.tsx` :214, :218 | `px-3.5 py-2.5` | → `px-4 py-2` |
| `super-admin/school/page.tsx` :113, :133, :138, :176 | `mb-3.5`, `mt-3.5`, `px-3.5 py-2.5` | → `mb-4`, `mt-4`, `px-4 py-2` |
| `super-admin/profile/page.tsx` :291, :381 | `px-3.5 py-3`, `py-3.5 px-2` | → `px-4 py-3`, `py-4 px-2` |
| `super-admin/billing/page.tsx` :108 | `px-5 py-3.5` | → `py-4` |
| `teacher/proxy-history/page.tsx` :90, :161, :294 | `gap-3.5`, `p-[3px] gap-0.5` | → `gap-4`, `p-1` |
| `admin/reports/page.tsx` :95, :177, :181 | `p-[3px] gap-0.5`, `max-w-[18px]` | → `p-1`, `max-w-[20px]` |
| `admin/expenses/page.tsx` :220 | `gap-2.5` CardContent | → `gap-2` or `gap-3` |
| `admin/settings/page.tsx` :126 | `h-[2px]` separator | → `h-1` (cosmetic) |
| `management/attendance` :86, `management/reports` :93 | `rounded-[10px] p-[3px] gap-0.5` segmented control | → `p-1` |

### 2c. Arbitrary sizing not divisible by 4

| Where | Value | Fix |
|---|---|---|
| `management/swaps:225` badge, `super-admin/analytics:179` bar, `admin/reports:177,181` bar | `min-w-[18px] h-[18px]`, `h-[18px]`, `max-w-[18px]` | → 20px (`size-5` / `min-w-[20px]`) |
| Various SelectTrigger widths | `w-[150px]`, `w-[170px]`, `w-[190px]`, `w-[110px]` | → round to 4px multiples (`148/152/188/192`); low priority — these are controls, not layout |

**Out of scope (upstream shadcn primitives):** `src/components/ui/*` uses `gap-1.5`, `px-2.5 py-1.5`, `h-[1px]` — these are shadcn generator output; leave unless forking.

---

## 3. Typography & Font Responsiveness 🟠 13 fixed large headings

### 3a. The fluid-typography baseline ✅
`globals.css:298` — `html { font-size: clamp(15px, 0.9rem + 0.25vw, 16px); }` (17px at ≥1536px). Every rem-based Tailwind text utility scales fluidly with viewport. This is the **single correct lever** and it's already in place.

### 3b. CRITICAL — fixed large headings (text stays huge on phones)
The fluid clamp only varies the root font 15→16px; it does **not** downscale a `text-4xl` enough for a 360px screen. These need responsive variants.

| File:line | Class | Issue | Fix |
|---|---|---|---|
| `(marketing)/pricing/page.tsx:40` | `<h1 className="text-4xl font-bold mb-4">` | h1 no responsive, no leading | `text-3xl sm:text-4xl leading-tight` |
| `(marketing)/pricing/page.tsx:57` | `<span className="text-3xl font-bold">₹…` | price glyph | `text-2xl sm:text-3xl` |
| `(marketing)/page.tsx:75` | `<h2 className="text-3xl font-bold text-center mb-3">` | section h2 | `text-2xl sm:text-3xl leading-tight` |
| `(marketing)/page.tsx:96` | `<h2 className="text-3xl font-bold text-center mb-12">` | section h2 | `text-2xl sm:text-3xl leading-tight` |
| `(marketing)/page.tsx:121` | `<h2 className="text-3xl font-bold mb-4">` | CTA h2 | `text-2xl sm:text-3xl leading-tight` |
| `(marketing)/features/page.tsx:236` | `<div className="text-3xl font-bold text-primary">` | stat value | `text-2xl sm:text-3xl` |
| `(marketing)/features/page.tsx:246, :289, :330` | three `<h2 className="text-3xl font-bold …">` | section h2s | `text-2xl sm:text-3xl leading-tight` |
| `(app)/parent/report-card/page.tsx:235, :422` | `<p className="text-6xl font-black text-primary mt-1">B+</p>` | grade glyph | `text-5xl sm:text-6xl` |
| `(app)/admin/subscription/page.tsx:162` | `<p className="text-4xl font-black text-white leading-none">` | price (has leading-none ✓) | `text-3xl sm:text-4xl` |
| `(app)/admin/subscription/page.tsx:261` | `<p className="text-3xl font-black …">` | plan price | `text-2xl sm:text-3xl leading-tight` |

### 3c. POLISH — minor type issues
- **PageHeader** (`components/shared/page-header.tsx:21`) — h1 has `tracking-tight` but no `leading-*`. Add `leading-tight` for display-text consistency.
- **6 `error.tsx`** files (admin/management/parent/teacher/super-admin + shared) each use a raw `<h1 className="text-3xl font-bold text-destructive">` instead of `<PageHeader>` and lack responsive/leading. These are the only `<h1>` in the app shell that bypass the shared component.
- `admin/announcements/page.tsx:350` — `text-[15px] font-bold` ≈ `text-base`; with the 15px fluid root it collides with body size → use `text-base`.
- `management/swaps/page.tsx:157` — `text-[22px] font-extrabold leading-none` KPI number bypasses the fluid rem scale (raw px). → `text-2xl`.

### 3d. NOT violations (verified)
- All inline `fontSize:` values in chart pages are **Recharts axis/legend ticks** (9-12px) — intentional, below `text-xs`.
- `.data-table` rem sizes (`globals.css:399,409`) are Figma-mapped and rem-based.
- The ~245 `text-[9-11px]` micro-type utilities (badges, KPI sub-labels, swap captions) are **intentional sub-scale type** — they shrink text, not enlarge it.

---

## 4. Layout & Grid Responsiveness 🟠 Mostly compliant

### 4a. 🔴 CRITICAL — Sheet overflows phones
**`src/app/(app)/admin/notices/page.tsx:179`**
```tsx
<SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
```
`w-[440px]` is the **mobile base** width with no `max-w-full` fallback. On a 375px/360px phone this forces horizontal overflow (the `sm:max-w-[440px]` only applies ≥640px).
**Fix:** `w-full max-w-[440px]`.

### 4b. 🟠 HIGH — ~12 data tables missing `overflow-x-auto`
Wide tables (audit logs, cohorts, billing, health, backup) will cause horizontal page scroll on mobile. **Verified via `comm` diff** — these files have `<Table>` but **zero** `overflow-x-auto`:

```
src/app/(app)/admin/expenses/page.tsx
src/app/(app)/admin/students/page.tsx
src/app/(app)/admin/subscription/page.tsx
src/app/(app)/admin/swap-requests/page.tsx
src/app/(app)/management/dashboard/page.tsx
src/app/(app)/super-admin/affiliates/page.tsx
src/app/(app)/super-admin/analytics/page.tsx
src/app/(app)/super-admin/audit/page.tsx
src/app/(app)/super-admin/backup/page.tsx
src/app/(app)/super-admin/health/page.tsx
src/app/(app)/super-admin/tenants/page.tsx
src/app/(app)/teacher/proxy-history/page.tsx
```
**Fix pattern:** wrap each `<Table>` in `<div className="overflow-x-auto">…</div>` (matches the existing pattern at `admin/audit/page.tsx:115`).

### 4c. 🟡 MED — bare 4-column TabsList
**`(marketing)/features/page.tsx:253`** — `<TabsList className="grid w-full grid-cols-4 mb-10 h-auto">` — 4 equal tabs on a 360px screen is cramped.
**Fix:** `grid grid-cols-2 sm:grid-cols-4`.

### 4d. ✅ GOOD — everything else responsive
- **All other `grid-cols-3/4/5`** (108 hits) start with `grid grid-cols-1`/`grid-cols-2` as the mobile default, or carry `sm:/md:/lg:` prefixes. **No other bare hard grids.**
- **KPI rows** consistently follow `grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4` (canonical pattern from `globals.css:.kpi-grid`).
- **Calendar/timetable `grid-cols-7`** (3 usages) — all wrapped in `overflow-x-auto -mx-1 px-1`. ✅
- **No `w-[≥400px]` or `min-w-[≥300px]`** anywhere except the notices Sheet above.
- **Global overflow guard:** `globals.css:288-292` clamps `html, body { max-width: 100%; overflow-x: hidden; }` — so even unwrapped tables degrade to internal scroll rather than blowing out the whole page. (Still worth wrapping explicitly for UX.)

---

## 5. Color & Component Compliance ✅ Mostly done

- **`bg-ef-*`/`text-ef-*`** — resolved via the token bridge; 316 usages now render. ✅
- **`StatusBadge` family** (`components/shared/status-badge.tsx`) — fully refactored to semantic tones (`bg-success`, `bg-warning`, `bg-info`, `bg-destructive`, `bg-muted`, + brand/purple tints). No raw Tailwind palette. ✅
- **`KpiCard`** — uses `bg-[var(--ef-*-light)]` arbitrary form with tone system, dark-mode safe. ✅
- **`AvailabilityDot`** — `aria-hidden="true"` on the dot, always paired with text label (WCAG 1.4.1). ✅
- **`<Table>` migration** — 30 files use shadcn `<Table>` primitives; **0 raw `<table>`** remain. ✅
- **Sortable headers** — `SortableHead` (sortable-table.tsx) wraps the label in a `<button>` with `aria-sort` + `onKeyDown`. ✅
- **Icons** — exclusively `lucide-react`, no mixed libraries. ✅
- **Form validation** — `react-hook-form` + `zod` wired in teachers, leave, teacher forms. ✅

> The 351-instance hardcoded-palette issue from the previous audit is **mostly resolved** in shared components; any remaining `bg-emerald-500` etc. are in page-specific chart swatches/legends where a token mapping is non-trivial — see previous §2 table for the mapping if a full sweep is desired.

---

## 6. Fix Plan (batch order)

Each batch ends with `npm run typecheck && npm run lint && npm run build`.

### Batch 1 — Mobile-breakers (1 hour, highest impact)
1. `admin/notices/page.tsx:179` → `w-full max-w-[440px]`
2. Wrap the 12 unwrapped tables in `<div className="overflow-x-auto">` (§4b list)
3. `features/page.tsx:253` → `grid-cols-2 sm:grid-cols-4`

### Batch 2 — Fixed large headings (30 min)
Add responsive variants + `leading-tight` to the 13 headings in §3b. Standardize: every `text-3xl+` heading gets a `text-2xl sm:` mobile-first step.

### Batch 3 — 4px-rule spacing sweep (1-2 hours)
Fix the ~8 worst files in §2a/§2b. Priority order: `super-admin/analytics` → `management/swaps` → `super-admin/emergency` → `super-admin/affiliates` → remaining `super-admin/*` → `teacher/proxy-history` → `admin/reports`. Mechanical `3.5→4` / `2.5→2 or 3` / `[3px]→1` / `[18px]→20` replacements.

### Batch 4 — Polish (30 min)
- Add `leading-tight` to `PageHeader` h1.
- Convert 6 `error.tsx` raw `<h1>` → `<PageHeader>` (or at least add responsive + leading).
- `announcements:350` `text-[15px]` → `text-base`; `swaps:157` `text-[22px]` → `text-2xl`.

---

## 7. Feature Inventory (current state)

**67 pages across 6 roles** + 9 marketing/public pages. All render with mock data.

### Admin (25 pages) — full school operations
Dashboard (KPIs + daily checklist), Proxy Board, Teachers (CRUD + bulk import), Students, Staff Directory, Roles & Permissions, Absence Tracker, Student Attendance, Swap Requests, Fee Structure / Collection / Defaulters, Expenses, Timetable, Notice Board, Holiday Calendar, Analytics, Reports, Announcements, Audit Log, Document Manager, Settings (8 dialogs), Subscription, Profile.

### Management (12 pages) — coverage-obsessed operations
Dashboard (coverage %, open gaps), Absence Approvals, Proxy Board, Swap Approvals (12 dialogs), Workload Heatmap, Timetable, Notices, Exam Schedule, Proxy Coverage Report, Attendance Summary, Daily Log, Profile.

### Teacher (10 pages) — personal ops
Dashboard (schedule + accept/decline proxy), My Timetable, Proxy History, Apply Leave, Leave History, Mark Attendance, Attendance History, Notifications, Notice Board, Profile.

### Parent (9 pages) — child-facing
Dashboard, Attendance, Class Journal (5 tabs), Report Card (6 tabs, printable), Exam Schedule (countdown), Fees & Dues, Notifications, Leave Request, Profile.

### Super-Admin (12 pages) — platform ops
Overview (12 charts), Platform Analytics (cohorts/funnels), System Health, Tenants, School Drilldown (impersonation), Billing Logs, Affiliates (8 dialogs), Backup & Restore (16 dialogs), Emergency Console (6 tabs/5 dialogs), Global Settings, Platform Audit, Profile.

### Marketing (9 pages) — acquisition funnel
Landing, Features (5 tabs), Pricing (4 plans), Demo request, Login, Signup, 5-step School Signup, Onboarding Wizard, Forgot Password.

### Shared infrastructure
- **Auth:** NextAuth (credentials), role-based `auth-guard`, impersonation banner
- **Layout:** role-aware `app-sidebar`, `topbar`, theme provider, breadcrumbs
- **Productivity:** Command Palette (Cmd+K), EduFlow Assistant (AI FAB), Weather Greeting, Task List, Countdown Timer
- **Data:** DataTable + SortableHead, FilterBar, SearchInput, ExportMenu, ImportModal (xlsx), ConfirmDialog
- **Domain:** ProxyBoard, AssignModal, CoverageDonut, QRCheckInCard, TimetableGrid, AbsenceRow, DocumentCard/Upload, FeeReceiptCard, NotificationRow
- **Academic:** ProgressNotes, SubjectTracker, PeriodPicker
- **Density:** 152 charts / 29 files, 100 dialogs / 14 files, 64 tabs / 11 files

---

## 8. Feature Improvement Recommendations

Ranked by **impact × effort**. Top items are high-value, low-effort.

### Tier 1 — High impact, low effort

1. **Mobile Sheet/table fix (Batch 1 above).** Right now several super-admin tables and the notices panel overflow on phones. This is the single biggest perceived-quality jump.

2. **Bulk-actions for table pages.** Fees Defaulters, Students, Teachers, Audit Log all have row-level actions but no "select-all → bulk approve / bulk remind / bulk export." Add a checkbox column + a sticky bulk-action bar (pattern already exists in `data-table.tsx` — extend it).

3. **Global search inside pages.** The topbar has search → Command Palette, but individual table pages (Students, Teachers, Defaulters) lack an in-page `SearchInput` wired to client-side filtering. The component exists (`search-input.tsx`) — just needs wiring.

4. **Empty states everywhere.** `EmptyState` component exists but several tables render a bare "No data" row. Wire `EmptyState` with role-appropriate CTAs ("Add first teacher", "Import students").

5. **Keyboard shortcuts surface.** Command Palette exists but isn't discoverable. Add a `?`-key "keyboard shortcuts" dialog and a `⌘K` hint chip in the topbar.

### Tier 2 — High impact, medium effort

6. **Real-time proxy board updates.** The Proxy Board is the core feature but currently re-renders on manual refresh. Add polling (or Server-Sent Events) so new absences/assignments appear live — the `CountdownTimer` + `WeatherGreeting` already prove the live-data pattern works.

7. **Notification preferences.** The VISION promises "SMS, WhatsApp & email alerts" (pricing page line 16) but there's no notification-channel preference UI in any Settings page. Add a per-role notification-preferences tab (channel toggles per event type).

8. **Parent → Teacher 2-way messaging.** Parents can submit leave requests but can't ask a clarifying question. A lightweight messaging thread on the journal/leave request would close the loop (the `NotificationRow` + `ConfirmDialog` primitives cover most of this).

9. **Academic year rollover.** Flagged in AGENTS.md §9 as outstanding. Without it, leave balances and timetables don't reset between sessions. Add a Settings → "Start New Academic Year" wizard (archive → reset → promote students).

10. **Print/Export beyond Report Card.** Only `parent/report-card` has print styles (`@media print` in globals.css). Add PDF/Excel export to Fee Receipts, Proxy Coverage Report, Audit Log, and Timetable — `ExportMenu` already exists.

### Tier 3 — Polish & differentiation

11. **Dark-mode parity check.** Foundation is good, but several page-specific inline chart colors (`bg-emerald-500` swatches, legend dots) won't adapt. Sweep the chart swatches to use `--chart-1..5` tokens (already defined for both themes).

12. **Skeleton loading states.** Only a few pages have skeletons. Add `Skeleton` rows to the big tables (Students, Teachers, Audit, Tenants) so navigation feels instant.

13. **Onboarding checklist.** After school signup, show a 4-item "finish setup" checklist on the admin dashboard (add teachers → build timetable → set fee structure → invite staff) with progress. Reuses `TaskList`.

14. **Localized number/date formatting.** Fee amounts use `toLocaleString("en-IN")` inconsistently. Centralize an `formatINR` / `formatDate` util — Indian-format lakhs/crores formatting should be consistent everywhere.

15. **Accessibility pass.** Add `<caption className="sr-only">` to the ~28 tables that lack it; add `aria-label` to the icon-only "more" buttons (the §6a list from the prior audit is still valid).

16. **Pricing page tiered plans.** Currently "one plan, all features" (pricing page line 41) with 4 duration tiers. Consider a true 3-tier plan (Starter/Pro/Institution) to capture larger schools — the PLANS data structure supports it.

---

## 9. What's Already Compliant ✅

- **Token foundation** (`globals.css`) — complete, Figma-accurate, dark-mode safe
- **Fluid root font-size** — makes the entire rem type scale responsive
- **32 shadcn components** installed, `components.json` correct
- **Shared layer** — `PageHeader`, `KpiCard`, `FilterBar`, `DataTable`, `EmptyState`, `StatusBadge` family — consistent and token-driven
- **KPI grid pattern** — `grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4` applied app-wide
- **`<Table>` primitives** — 30 files use shadcn Table; 0 raw `<table>`
- **Sortable headers** — accessible (`aria-sort`, keyboard, button-wrapped)
- **Icons** — exclusively `lucide-react`
- **Global overflow guard** — `overflow-x: hidden` on html/body prevents catastrophic page blowout
- **Print styles** — clean A4 PDF for report card
- **Form validation** — `react-hook-form` + `zod` in critical forms
- **Dynamic chart imports** — Recharts is SSR-safe code-split (dashboard line 12-60)

---

*End of audit. For phase order see [ROADMAP.md](./ROADMAP.md); for business rules see [VISION.md](./VISION.md); for the prior component-level audit see [AUDIT.md](./AUDIT.md).*
