# EduFlow — Design System Compliance Audit
> **Generated:** 2026-06-21
> **Scope:** All 69 Next.js pages + shared/domain components
> **Source of truth:** `src/app/globals.css` + `FIGMA_DESIGN_GUIDE.md` (Figma file `BlFqAE1yNoGDD4IFKyqaIV` — shadcn/ui PRO Variables V6.0)
> **Related:** [AUDIT.md](./AUDIT.md) · [FIGMA_DESIGN_GUIDE.md](./FIGMA_DESIGN_GUIDE.md) · [AGENTS.md](./AGENTS.md)

---

## 0. Executive Summary

The design system **foundation is strong**: `globals.css` contains a complete, Figma-accurate token map (EduFlow brand primitives → shadcn semantic tokens), 32 shadcn components are installed, dark mode is wired, and most pages already follow a consistent layout shell (`PageHeader` + `kpi-grid` + `Card` sections).

However, **one critical rendering bug** affects 316 class usages across 27 files, and several systemic patterns bypass the design system. This audit catalogues every issue with file:line references and a prioritized fix plan.

| Severity | Issue | Scope | Status |
|---|---|---|---|
| 🔴 CRITICAL | `bg-ef-*` / `text-ef-*` classes generate **zero CSS** in Tailwind v4 | 316 uses / 27 files | ❌ Broken |
| 🟠 HIGH | Hardcoded Tailwind palette colors (`bg-emerald-500`, etc.) | 351 uses / 16 files | ⚠️ Bypass |
| 🟠 HIGH | Raw `<table>` instead of shadcn `<Table>` | ~~~30 tables / 28 files~~ ✅ Already migrated (37 files use `<Table>`) | ✅ Done |
| 🟡 MEDIUM | Non-responsive grids (`grid-cols-3`/`4` with no mobile fallback) | 16 hard violations | ⚠️ Mobile |
| 🟡 MEDIUM | Hand-styled `<button>` bypassing `<Button>` | ~~52 instances~~ → 39 intentional custom UI | ✅ Batch C |
| 🟢 LOW | Accessibility (icon buttons, captions, color-only dots) | ~50 instances | ⚠️ WCAG |

---

## 1. 🔴 CRITICAL — `ef-*` utility classes silently broken

### Root cause
Tailwind v4 only generates utility classes for CSS variables declared inside the `@theme inline` block. In `globals.css`, only the **semantic** tokens are mapped (`--color-success`, `--color-warning`, etc.). The raw **EduFlow brand primitives** (`--ef-brand`, `--ef-green`, `--ef-red`, `--ef-purple`, `--ef-amber`, `--ef-cyan` and their `-light`/`-dark` variants) are defined in `:root` and `.dark` but are **NOT** exposed in `@theme inline`.

### Verification
Build output inspected (`npm run build` → `.next/static/css/*.css`):
```
Grep for "\.(bg|text|border)-ef-"  →  0 matches
Grep for "var(--ef-"               →  1 match (only from [var(--ef-*)] arbitrary form)
```
Classes like `bg-ef-red-light`, `text-ef-purple`, `bg-ef-green` produce **no CSS rule** — they render with default (no) color.

### Fix (Batch A — one-line change in globals.css)
Add `--color-ef-*` entries to the existing `@theme inline` block. This single edit fixes all 316 usages at once — no per-file changes needed.

### Affected files (316 uses / 27 files)

| File | Count |
|---|---|
| `src/app/(app)/admin/holiday-calendar/page.tsx` | 30 |
| `src/app/(app)/management/swaps/page.tsx` | 29 |
| `src/app/(app)/super-admin/analytics/page.tsx` | 28 |
| `src/app/(app)/super-admin/health/page.tsx` | 21 |
| `src/app/(marketing)/onboarding/page.tsx` | 19 |
| `src/app/(app)/super-admin/emergency/page.tsx` | 18 |
| `src/app/(app)/management/dashboard/page.tsx` | 17 |
| `src/app/(app)/super-admin/audit/page.tsx` | 17 |
| `src/app/(app)/super-admin/affiliates/page.tsx` | 16 |
| `src/app/(app)/super-admin/profile/page.tsx` | 16 |
| `src/app/(app)/admin/subscription/page.tsx` | 15 |
| `src/app/(app)/super-admin/backup/page.tsx` | 14 |
| `src/app/(app)/admin/reports/page.tsx` | 11 |
| `src/app/(app)/super-admin/billing/page.tsx` | 11 |
| `src/app/(app)/admin/announcements/page.tsx` | 10 |
| `src/app/(app)/teacher/proxy-history/page.tsx` | 10 |
| `src/app/(app)/admin/expenses/page.tsx` | 5 |
| `src/app/(app)/admin/profile/page.tsx` | 5 |
| `src/app/(app)/super-admin/school/page.tsx` | 8 |
| `src/app/(app)/super-admin/tenants/page.tsx` | 6 |
| `src/app/(app)/management/profile/page.tsx` | 3 |
| `src/app/(app)/teacher/profile/page.tsx` | 2 |
| `src/app/(app)/admin/fees/page.tsx` | 1 |
| `src/app/(app)/management/exams/page.tsx` | 1 |
| `src/app/(app)/management/reports/page.tsx` | 1 |
| `src/app/(app)/teacher/leave-history/page.tsx` | 1 |
| `src/data/progress-notes.ts` | 1 |

---

## 2. 🟠 HIGH — Hardcoded Tailwind palette colors

### The problem
Colors like `bg-emerald-500`, `text-amber-600`, `bg-red-100` reference Tailwind's built-in palette — they bypass the design system and **do not adapt to dark mode**. They should map to EduFlow tokens (`bg-[var(--ef-green)]`, `text-warning-foreground`, etc.).

### Affected files (351 uses / 16 files)

| File | Count | Classes used |
|---|---|---|
| `src/components/shared/status-badge.tsx` | 96 | `bg-{color}-100`, `text-{color}-800`, `bg-{color}-900`, `text-{color}-300` × 4 colors (huge duplicated table — **refactor candidate**) |
| `src/app/(app)/admin/staff/page.tsx` | 44 | Full 10-color palette (`blue/green/amber/orange/red/pink/purple/teal/indigo/cyan`) |
| `src/app/(app)/parent/journal/page.tsx` | 33 | `bg-{color}-50/950/100`, `border-{color}-500`, `text-{color}-400/600/700` |
| `src/app/(marketing)/features/page.tsx` | 24 | `bg-{color}-50/950`, `border-{color}-200/800`, `text-{color}-600/400` |
| `src/app/(app)/parent/exams/page.tsx` | 22 | `bg-{color}-50/950/500` × 7 colors |
| `src/components/domain/proxy/QRCheckInCard.tsx` | 22 | `text-gray-*`, `border-gray-*` (should be `muted-foreground`/`border`) |
| `src/app/(app)/teacher/notices/page.tsx` | 21 | `bg-{color}-100/900`, `text-{color}-800/300` × 5 colors |
| `src/app/(app)/admin/fees/defaulters/page.tsx` | 18 | `bg-red-*`, `bg-amber-*`, `bg-yellow-400`, `border-red/amber-400` |
| `src/app/(app)/parent/report-card/page.tsx` | 18 | `bg-{color}-400/500`, `text-{color}-400/600/700` |
| `src/app/(app)/teacher/attendance/mark/page.tsx` | 16 | `bg-green/red-50/100/500/600/700/900`, `border-green/red-400/300` |
| `src/app/(app)/admin/audit/page.tsx` | 13 | `bg-{color}-100/900`, `text-{color}-800/300` × 4 colors |
| `src/app/(app)/admin/roles/page.tsx` | 12 | `bg-{color}-100/900`, `text-{color}-700` × 4 colors |
| `src/app/(marketing)/features/page.tsx` | (subset of above) | — |
| `src/app/(app)/management/daily-log/page.tsx` | 6 | `bg/border/text-purple-*` |
| `src/app/(app)/management/dashboard/page.tsx` | 2 | `bg-emerald-500`, `bg-amber-500` (coverage bar) |
| `src/app/(app)/parent/dashboard/page.tsx` | 2 | `bg-red-500` (×2) |
| `src/app/(app)/super-admin/overview/page.tsx` | 2 | `bg-emerald-500`, `bg-amber-500` |

### Token mapping (for the fix)
| Hardcoded | Replace with |
|---|---|
| `bg-emerald-500` / `bg-green-500/600` | `bg-[var(--ef-green)]` |
| `bg-red-500` / `bg-red-900` | `bg-destructive` |
| `text-amber-600/700` | `text-warning-foreground` |
| `bg-amber-100/50` | `bg-warning` |
| `bg-green-100/50` | `bg-success` |
| `text-green-700/800` | `text-success-foreground` |
| `bg-purple-100/900`, `text-purple-700` | `bg-[var(--ef-purple-light)]`, `text-[var(--ef-purple)]` |
| `text-gray-400/500` | `text-muted-foreground` |
| `border-gray-200/300` | `border-border` |

---

## 3. 🟠 HIGH — Raw `<table>` instead of shadcn `<Table>`

~30 raw tables across 28 files bypass `@/components/ui/table` (`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`). The compliant reference is `src/components/shared/data-table.tsx`.

**Worst files (sortable `<th onClick>` also present — see §6):**
- `src/app/(app)/management/dashboard/page.tsx:394`
- `src/app/(app)/super-admin/tenants/page.tsx:165`
- `src/app/(app)/super-admin/billing/page.tsx:178`
- `src/app/(app)/super-admin/affiliates/page.tsx:192`
- `src/app/(app)/super-admin/audit/page.tsx:145, :203`
- `src/app/(app)/admin/expenses/page.tsx:256`
- `src/app/(app)/admin/fees/defaulters/page.tsx:158`
- `src/app/(app)/admin/swap-requests/page.tsx:215`
- `src/app/(app)/parent/report-card/page.tsx:105`
- `src/app/(app)/parent/journal/page.tsx:194`
- `src/app/(app)/parent/fees/page.tsx:102`
- `src/app/(app)/teacher/leave-history/page.tsx:223`
- `src/app/(app)/teacher/proxy-history/page.tsx:314`
- `src/components/domain/proxy/ProxyBoard.tsx:247`
- `src/components/domain/timetable/TimetableGrid.tsx:78`
- `src/components/domain/proxy/QRCheckInCard.tsx:195`

(Full list of ~30 tables in the explore notes.)

---

## 4. 🟡 MEDIUM — Non-responsive grids

### Tier 1 — Hard violations (bare `grid-cols-3`/`4`/`7`, no mobile fallback)

| File:Line | Grid | Context |
|---|---|---|
| `src/app/(app)/admin/fees/collection/page.tsx:176` | `grid-cols-3` | Payment methods stat row |
| `src/app/(app)/admin/students/page.tsx:393` | `grid-cols-3` | Form field row (Class+Section+Roll) |
| `src/app/(app)/admin/subscription/page.tsx:314` | `grid-cols-3` | Referral stats |
| `src/app/(app)/admin/dashboard/page.tsx:233` | `grid-cols-7` | Period coverage (intentional — tight on mobile) |
| `src/app/(app)/admin/holiday-calendar/page.tsx:222, :231` | `grid-cols-7` | Calendar (intentional) |
| `src/app/(app)/parent/attendance/page.tsx:32` | `grid-cols-3` | **KPI stat row** |
| `src/app/(app)/parent/fees/page.tsx:57` | `grid-cols-3` | **KPI stat row** |
| `src/app/(app)/parent/exams/page.tsx:120` | `grid-cols-7` | Calendar (intentional) |
| `src/app/(app)/super-admin/profile/page.tsx:275` | `grid-cols-3` | Proxy caps form row |
| `src/app/(app)/super-admin/school/page.tsx:113` | `grid-cols-3` | Per-school mini-stats |
| `src/app/(app)/teacher/leave/page.tsx:123` | `grid-cols-3` | Leave balance cards |
| `src/app/(marketing)/demo/page.tsx:284` | `grid-cols-3` | Session info |
| `src/app/(marketing)/features/page.tsx:252` | `grid-cols-4` | 4-role tabs |
| `src/app/(marketing)/onboarding/page.tsx:237` | `grid-cols-3` | Completion stats |
| `src/app/(marketing)/signup/page.tsx:225` | `grid-cols-3` | Plan selection |

### Tier 2 — Inconsistent KPI rows (`grid-cols-2` missing the `grid-cols-1` step)

~17 KPI stat rows use `grid grid-cols-2 md:grid-cols-4` instead of the canonical `grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4`. Files: all 5 profile pages, `admin/attendance`, `admin/audit`, `admin/fees/{collection,defaulters,structure}`, `admin/staff`, `management/reports`, `teacher/proxy-history`, `super-admin/{overview,school,billing,profile}`.

**Canonical fix pattern:** `grid grid-cols-1 min-[480px]:grid-cols-3 gap-3 sm:gap-4` (for 3-col) or the full 1→2→4 progression for KPI rows.

---

## 5. 🟡 MEDIUM — Hand-styled `<button>` bypassing `<Button>`

~20 instances of raw `<button>` with custom classes replicating `<Button>` variants. Notable:
- `src/app/(app)/admin/error.tsx:42, :48` — hand-styled buttons (full custom styling)
- `src/app/(app)/management/dashboard/page.tsx:297` — period-segment toggle
- `src/app/(app)/admin/teachers/page.tsx:328` — status pill
- `src/app/(app)/management/swaps/page.tsx:152` — status filter pill
- `src/app/(app)/super-admin/backup/page.tsx:365` — card-select toggle
- `src/app/(app)/super-admin/emergency/page.tsx:225, :267, :274` — audience/msg-type toggles
- Various password eye-toggle buttons across all 5 profile pages

**Note:** `period-picker.tsx` and `task-list.tsx` intentionally use raw `<button>` with `aria-pressed` (segmented-toggle semantics) — acceptable.

---

## 6. 🟢 LOW — Accessibility issues

### 6a. Icon-only `<Button>` missing accessible name (WCAG 4.1.2 — HIGH impact)
| File:Line | Button | Issue |
|---|---|---|
| `src/app/(app)/admin/fees/defaulters/page.tsx:229` | MoreHorizontal | No aria-label/sr-only |
| `src/app/(app)/admin/holiday-calendar/page.tsx:211, :214` | ChevronLeft/Right | No aria-label/title |
| `src/app/(app)/admin/staff/page.tsx:186` | MoreHorizontal | No aria-label |
| `src/app/(app)/admin/swap-requests/page.tsx:295` | MoreHorizontal | No aria-label |
| `src/app/(app)/management/dashboard/page.tsx:453, :454` | Eye/Edit2 | No aria-label/sr-only |
| `src/app/(app)/super-admin/affiliates/page.tsx:245` | MoreHorizontal | No aria-label |
| `src/app/(app)/super-admin/tenants/page.tsx:205` | MoreHorizontal | No aria-label |
| `src/components/shared/eduflow-assistant.tsx:151, :220` | Close/Send | No aria-label |

### 6b. Sortable `<th onClick>` / `<tr onClick>` without keyboard support (WCAG 2.1.1)
- `src/app/(app)/super-admin/billing/page.tsx:201` — `<tr onClick>` (expand/collapse) — no role/tabIndex/onKeyDown
- Sortable headers (`<th onClick>`) without nested button/keyboard:
  - `admin/expenses/page.tsx:259, 262, 266, 270`
  - `super-admin/affiliates/page.tsx:205`
  - `super-admin/audit/page.tsx:157`
  - `super-admin/billing/page.tsx:190`
  - `super-admin/tenants/page.tsx:168, 172, 174, 175`
  - `management/dashboard/page.tsx:408`

**Reference pattern:** `src/app/(app)/super-admin/backup/page.tsx:232` — `<TableHead>` wrapping a `<button>` (correct).

### 6c. Tables missing `<caption>` (WCAG 1.3.1)
Of ~30 raw tables, only **2** have captions (`admin/attendance:186`, `admin/fees/structure:149`). The other ~28 need `<caption className="sr-only">`.

### 6d. Color-only status indicators (WCAG 1.4.1)
- Coverage bars/threshold dots: `management/dashboard:446`, `parent/report-card:125`, `super-admin/overview:265, :317`
- Status dots: `super-admin/health:129`, `admin/holiday-calendar:255`
- `src/components/shared/status-badge.tsx:36` — `DOT_CLASSES` dot component (recommend `aria-hidden` + rely on badge text)

### 6e. Avatar divs missing `aria-label` (WCAG 1.1.1 — LOW)
~25 initials-avatar `<div>`s lack `aria-label`/`title`. Most sit next to name text (partially mitigated). Notable: `admin/dashboard:285`, `admin/teachers:189`, `admin/students:319`, `admin/staff:176`, `parent/profile:199`, `super-admin/affiliates:218`, `super-admin/audit:180`, `teacher/proxy-history:346`, plus domain components `AbsenceRow:52`, `FeeReceiptCard:70`, `NotificationRow:68`, `AssignModal:96`, `ProxyBoard:180, :285`.

---

## 7. 🟢 LOW — Inline color styles bypassing tokens

Hardcoded `background`/`color` in inline `style={{}}` (dynamic width/height OK, flagged only color):
- Chart swatches: `admin/analytics:107, :228`, `admin/dashboard:130, :386, :544`, `admin/fees:88, :197, :198, :224`, `admin/students:254`, `parent/dashboard:114, :224-227`, `super-admin/overview:106, :239, :242`, `teacher/proxy-history:100, :102, :278`
- Legend dots: `admin/expenses:237, :240`, `admin/swap-requests:162`

---

## 8. Fix Plan (Batch Order)

Each batch ends with `npm run typecheck && npm run lint`.

### Batch A — Critical token fix (1 file, fixes 316 uses)
**Add `--color-ef-*` to `@theme inline` in `globals.css`.** Verify with rebuild.

### Batch B — Hardcoded color replacement (16 files)
Replace Tailwind palette classes with token equivalents (mapping table in §2). Prioritize `status-badge.tsx` (96 uses — refactor to a data-driven table), then `admin/staff` (44), `parent/journal` (33).

### Batch C — Component compliance ✅ DONE 2026-06-21
- ~~Migrate ~30 raw `<table>` → `<Table>` primitives~~ **Already complete** — 37 files use shadcn `<Table>`, 0 raw `<table>` in pages
- ✅ Replace hand-styled buttons in error pages (4) + eye-toggles (7) + dismiss (1) + link (1) → `<Button>`
- ✅ Wrap sortable `<th onClick>` in `<button>` (+ `onKeyDown` + `aria-sort`) — adopted `backup:232` pattern across 4 files
- **Deferred to Batch E/F:** ARIA polish for custom UI patterns (tabs, pills, card selectors) — see PROGRESS.md

### Batch D — Responsive grid sweep
- Fix 15 Tier-1 hard violations with mobile-first breakpoints
- Normalize 17 Tier-2 KPI rows to `grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4`

### Batch E — Accessibility
- Add `aria-label`/`sr-only` to 8 icon-only buttons (§6a)
- Add `<caption className="sr-only">` to ~28 tables (§6c)
- Add `role="button"`/`tabIndex`/`onKeyDown` to `<tr onClick>`/`<th onClick>` (§6b)
- Add `aria-hidden` to decorative status dots (§6d)

### Batch F — Token inline-style cleanup
Replace hardcoded `style={{ background: ... }}` with token classes where static.

---

## 9. What's Already Compliant ✅

- **Token foundation** (`globals.css`) — complete and Figma-accurate
- **32 shadcn components** installed, `components.json` correct
- **Dark mode** (`next-themes` + `.dark` overrides) — properly architected
- **`KpiCard`** — uses `tone` system correctly with `bg-[var(--ef-*)]` arbitrary form
- **`PageHeader`, `FilterBar`, `EmptyState`, `DataTable`** — consistent shared layer
- **Most dashboard KPI strips** — follow `grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4`
- **`ProxyBoard`** domain component — uses `AvailabilityDot` with text labels (WCAG-safe)
- **Form validation** — `react-hook-form` + `zod` wired in teachers, leave, teacher forms
- **Icons** — exclusively `lucide-react` (no mixed libraries)
