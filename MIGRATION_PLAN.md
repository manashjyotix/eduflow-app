# EduFlow — Feature Migration Plan & Checklist

> Porting all features from the Vite source app (`..\School Management App\src\scholaris`)
> into this Next.js 15 app, keeping the same layout and the shadcn/ui PRO V6 design system.  
> **Update the checklist after every page is completed. This file is the source of truth for porting progress.**

**Related:** [AGENTS.md](./AGENTS.md) · [AUDIT.md](./AUDIT.md) · [ROADMAP.md](./ROADMAP.md) · [REBUILD_PLAN.md](./REBUILD_PLAN.md)

---

## 1. Goal

Bring the full feature richness of the 69 Scholaris prototype pages into the existing Next.js
route scaffolding. The routes already exist; most pages are trimmed. This effort enriches each
page to match the source's sections and behavior while using this app's conventions.

## 2. Conventions (translation rules — apply to every port)

| Source (Vite Scholaris) | This app (Next.js) |
|---|---|
| `--sch-brand`, `--sch-t1`, `--sch-*` tokens | shadcn semantic tokens (`primary`, `foreground`, `muted-foreground`) + `ef-*` brand utilities |
| `../../ui/*` Scholaris wrappers | `@/components/ui/*` shadcn components |
| `SchPageHeader` | `@/components/shared/page-header` → `<PageHeader>` |
| `KpiCard` (scholaris) | `@/components/shared/kpi-card` → `<KpiCard>` |
| `MiniSparkline` | `@/components/shared/mini-sparkline` |
| inline mock arrays | reuse `@/data/*`; add new mock files when shared, inline when page-local |
| `useNavigate()` from ScholarisApp | `next/link` + `useRouter` from `next/navigation` |
| `WeatherClock` greeting banner | reuse if a port exists; otherwise a static greeting banner |
| status → badge helpers | `@/lib/status-badges` |

Rules:
- Client interactivity (`useState`, handlers) requires `"use client"` at top of file.
- Color must always pair with a text label (WCAG 1.4.1) — esp. proxy board dots.
- Keep currency in `₹` with `toLocaleString("en-IN")`.
- Run `npm run typecheck` after each batch; keep it green.

## 3. Design system / Figma

- The `figma` MCP server is configured in `.kiro/settings/mcp.json` but its tools are not
  currently exposed to the agent session. The full design system was already extracted from
  Figma `BlFqAE1yNoGDD4IFKyqaIV` into `src/app/globals.css` (tokens, shadows, radius, charts).
- Build against those tokens. Reconnect the MCP server from the MCP panel for live pulls.

## 4. Status legend

- [ ] todo · [~] in progress · [x] done · (✓) already strong, light touch only

---

## 5. Checklist

### Super Admin (11) — biggest gaps, highest priority
- [x] `overview` — greeting banner, 8 KPIs + sparklines, MRR chart, plan breakdown, new signups, churn risk, platform health
- [x] `analytics` (platform-analytics) — deep cross-tenant analytics + charts
- [x] `health` (system-health) — API uptime, service status grid, incident log
- [x] `tenants` (tenant-management) — paginated school list, filters, per-school actions
- [x] `school` (school-drilldown) — impersonation mode, per-school detail
- [x] `billing` (billing-logs) — subscription events, Razorpay log
- [x] `affiliates` — affiliate list, commissions, payout queue
- [x] `backup` (backup-restore) — snapshots, restore
- [x] `emergency` (emergency-console) — override controls
- [x] `settings` (global-settings) — platform config
- [x] `audit` (super-audit) — full platform audit log

### Management (12) — COMPLETE
- [x] `dashboard` — morning briefing, coverage %, uncovered periods, quick-assign (pre-existing, verified)
- [x] `proxy` — proxy board, AI suggestions w/ score breakdown, manual override, coverage + impact charts
- [x] `swaps` (swap-approvals) — full approval flow: KPI strip, filter bar, status tabs, card grid, approve/reject/detail dialogs, state persistence
- [x] `workload` — daily/weekly/monthly toggle, cap utilisation table, fairness distribution chart
- [x] `absences` (absence-approval) — pending/history tabs, approve & reject dialogs
- [x] `attendance` (attendance-summary) (pre-existing, verified)
- [x] `daily-log` (pre-existing, verified)
- [x] `exams` (exam-schedule) (pre-existing, verified)
- [x] `notices` (pre-existing, verified)
- [x] `profile` (pre-existing, verified)
- [x] `reports` (proxy-coverage-report) (pre-existing, verified)
- [x] `timetable` (timetable-viewer) (pre-existing, verified)

### Teacher (9) — COMPLETE
- [x] `dashboard` — schedule, proxy request card (accept/decline state), leave balance, monthly proxy counter
- [x] `proxy-history` — 5 KPIs, monthly trend bar, subject donut, monthly cap arc, filterable records table
- [x] `timetable` (my-timetable) — full weekly grid, color-coded cells, swap icons, legend
- [x] `leave` (apply-leave) (pre-existing, verified)
- [x] `leave/history` (pre-existing, verified)
- [x] `attendance/mark` (pre-existing, verified)
- [x] `attendance/history` (pre-existing, verified)
- [x] `notifications` (pre-existing, verified)
- [x] `notices` (notice-read) (pre-existing, verified)

### Parent (8) — COMPLETE
- [x] `dashboard` — greeting banner, fee alert, child card, today attendance, exam countdown, journal, notifications, quick links
- [x] `attendance` (child-attendance) — KPIs, monthly progress, calendar heatmap, absent-dates detail
- [x] `journal` (class-journal) (pre-existing, verified)
- [x] `report-card` (pre-existing, verified)
- [x] `exams` (child-exam-schedule) (pre-existing, verified)
- [x] `fees` (fees-dues) (pre-existing, verified)
- [x] `notifications` (pre-existing, verified)
- [x] `leave` (parent-leave-request) (pre-existing, verified)

### Admin (22) — COMPLETE
- [x] `proxy-board` — color-coded availability dots (green=same subj, amber=diff, gray=capped, red=unavailable), coverage donut, gaps-by-period, workload, kanban (open/assigned/completed), AI auto-assign dialog
- [x] `attendance` (student-attendance) — per-period/single-daily toggle, KPIs, roll-call with status toggles, save & lock
- [x] `expenses` — KPIs, monthly trend, category breakdown, sortable ledger, log dialog
- [x] `holiday-calendar` — month grid, holiday-type colors, add/import/sync dialogs, legend, upcoming list
- [x] `analytics` — 8 KPIs, attendance line chart, absence donut, coverage bars, fee-by-class, presence heatmap
- [x] `reports` — KPIs, monthly trend bars, absence breakdown, export panel, subject performance
- [x] `announcements` — KPIs, compose form, tone-colored announcement cards, dismiss/restore
- [x] `subscription` — current plan banner, usage KPIs, 3 plan cards, affiliate referral (copy), payment history, cancel
- [x] `dashboard` (pre-existing, verified)
- [x] `teachers` (pre-existing, verified)
- [x] `students` (pre-existing, verified)
- [x] `staff` (staff-directory) (pre-existing, verified)
- [x] `roles` (pre-existing, verified)
- [x] `absences` (absence-tracker) (pre-existing, verified)
- [x] `swap-requests` (pre-existing, verified)
- [x] `fees/structure` (pre-existing, verified)
- [x] `fees/collection` (pre-existing, verified)
- [x] `fees/defaulters` (pre-existing, verified)
- [x] `timetable` (pre-existing, verified)
- [x] `notices` (notice-board) (pre-existing, verified)
- [x] `audit` (pre-existing, verified)
- [x] `settings` (institution-settings) (pre-existing, verified)

### Marketing (7) — COMPLETE
- [x] landing (pre-existing, verified)
- [x] features (pre-existing, verified)
- [x] pricing — hero, monthly/annual billing toggle, 3 plan cards, comparison table, FAQ, CTA
- [x] demo (pre-existing, verified)
- [x] login (pre-existing, verified)
- [x] signup (pre-existing, verified)
- [x] onboarding — 5-step wizard (school → academic → periods → teachers → review), step validation, success screen

---

## 6. Work log (append after each task)

- 2026-06-16 — Baseline typecheck green. Mapped all 69 pages; built gap analysis & this plan.
- 2026-06-16 — super-admin/overview enriched (banner, 8 KPIs+sparklines, MRR chart, plan dist, signups, churn risk, health). Typecheck green.
- 2026-06-16 — super-admin role COMPLETE (10 pages: analytics, health, tenants, school, billing, affiliates, backup, emergency, settings, audit). Typecheck green, no source-isms.
- 2026-06-16 — Management role COMPLETE. Audited all 12 pages vs source by line count; dashboard + 7 others were already strong ports (verified). Ported the 4 trimmed placeholders: workload, proxy, absences (approval), swaps (largest, 692-line source). Converted --sch-* → ef-*/semantic tokens, inline styles → Tailwind, Avatar → initials divs, Alert → custom token-colored banners, DialogBody → div, Button variant="success" → bg-ef-green class (no success variant exists). Typecheck green.
- NOTE for future sessions: the MIGRATION_PLAN checklist was stale — many pages marked [ ] were already ported. Always audit current vs source line counts before porting (see §audit cmd in chat). Figma MCP server is configured in .kiro/settings/mcp.json but NOT exposed as agent tools this session; design system already extracted to globals.css — build against ef-*/shadcn tokens.
- 2026-06-16 — Teacher role COMPLETE. Ported the 3 trimmed pages (dashboard, proxy-history, my-timetable) via parallel sub-agents; other 6 pre-existing and verified. Parent role COMPLETE. Ported dashboard + child-attendance (the 2 big gaps); other 6 pre-existing. Fixed parent dashboard journal link (/parent/class-journal → /parent/journal). Full typecheck green.
- NEXT: Admin (22) — audit current vs source line counts and port trimmed placeholders. Key targets per original plan: proxy-board (CRITICAL color-coded dots), holiday-calendar, subscription, analytics, and the various CRUD/fee pages. Marketing (7) — verify parity only.
- 2026-06-16 — Admin role COMPLETE. Ported proxy-board (CRITICAL — color-coded availability dots green/amber/gray/red, coverage donut, gaps-by-period, workload, kanban, AI auto-assign dialog) myself; delegated 7 others (attendance, expenses, holiday-calendar, analytics, reports, announcements, subscription) to parallel sub-agents. Other 14 admin pages pre-existing/verified.
- 2026-06-16 — Marketing role COMPLETE. Ported pricing + onboarding (5-step wizard) via sub-agents; other 5 pre-existing.
- 2026-06-16 — ★ ALL 69 PAGES COMPLETE across all 6 roles. Full verification green: `npm run typecheck`, `npm run lint` (0 warnings), and `npm run build` (all routes prerender static). Note: `next build` initially failed with a stale turbopack cache error (`[turbopack]_runtime.js`) because dev uses `--turbopack`; fix = delete `.next` then rebuild. Figma MCP server configured but not exposed to agent session — built against the ef-*/shadcn tokens already in globals.css.
- 2026-06-17 — Comprehensive audit in [AUDIT.md](./AUDIT.md). Sidebar icons deduplicated (22 unique icons per role, no repeats within any role). User details enriched in sidebar footer. Custom EduFlow SVG logo. Distinct avatar colors per role. Sign-out button in role picker. Cross-links added to all .md files. Typecheck green.