# EduFlow — Changelog

All notable changes to EduFlow are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [2026-06-11] — shadcn/ui PRO V6 Design System Migration & Rebuild Plan

### Added
- `REBUILD_PLAN.md` — canonical blueprint for rebuilding EduFlow as a Next.js 15 production app, fully aligned to shadcn/ui PRO Variables V6.0 (Figma: `BlFqAE1yNoGDD4IFKyqaIV`). Covers: two-layer token architecture, folder structure (app router, components/ui, components/shared, components/domain), three-tier component hierarchy, proxy algorithm port, Payload CMS collection design, Tailwind config, shadcn install sequence, 13-week build timeline, page-by-page migration map.
- `KIRO_REBUILD_PROMPT.md` — master AI agent prompt for building the production app from scratch. Self-contained with full tech stack, design system spec, component rules, database schema, billing rules, role routing, demo seed data, and phase-1 start instructions. Ready to paste into Kiro Spec mode or any AI coding assistant with the context docs attached.

### Changed
- `Design.md` — upgraded to **v8.0**. Added §2 "Design System Architecture" documenting the shadcn/ui PRO V6 two-layer token model and the canonical globals.css token bridge. Updated §3 Color System to include shadcn semantic token column for each color. Updated §8 Component Library to reflect three-tier hierarchy (Tier 1 shadcn primitives / Tier 2 shared composites / Tier 3 domain components). Updated §13 Tech Stack to cover both Vite prototype and production Next.js 15 stack.
- `AGENTS.md` — updated header to reference shadcn/ui PRO V6, `REBUILD_PLAN.md`, and `KIRO_REBUILD_PROMPT.md`. Updated §3 file tree to include new docs. Updated §5 design system section to explain the two-layer token architecture. Added §9 architecture tasks for the production app bootstrap.
- `README.md` — updated stack line to include shadcn/ui PRO V6 reference. Added rebuild section pointing to `REBUILD_PLAN.md` and `KIRO_REBUILD_PROMPT.md`. Updated proxy dot colors to use Tailwind semantic class names. Added Key Documentation table covering all 8 reference files. Updated Roadmap section.
- `.kiro/steering/ui-consistency.md` — expanded from 5 sections to 7. Added §3 dual table (prototype vs production app component mapping). Rewrote §4 Styling as "Two-Layer Token System" covering both Vite prototype (shadcn semantic tokens) and production app (PRO V6 architecture). Added §5 Token Reference table (visual intent → Tailwind class → underlying token). Added §6 Proxy Board Dot Colors table with Tailwind classes. Updated `SchPageHeader` example to use `size="default"` per button hierarchy rules.

---

## [Unreleased]

### 2026-06-24 — Birthday Wish Feature

Added a branded **Birthday Wish** card + multi-channel notification, surfaced on
every role dashboard (admin, management, teacher, parent, super-admin) alongside
the existing Weather greeting card.

#### Added
- `src/data/birthdays.ts` — single source of truth for the feature: per-role
  persona birthdays, demo child birthday, delivery-channel tiers
  (staff = In-app · Push · SMS · WhatsApp; family = In-app only), date helpers
  (`isBirthdayToday`, `getActiveRoleBirthday`, `getActiveChildBirthday`), and a
  mock multi-channel dispatcher (`dispatchBirthdayWishes`). Includes a
  `BIRTHDAY_DEMO_MODE` flag (default `true`) so the card is always demoable.
- `src/components/shared/birthday-card.tsx` — `BirthdayCard`, an animated wish
  banner: a 3D candle (flame flicker) on the left, a larger 3D gift (tilt/bob)
  on the right, looping confetti, and a greeting line that alternates every ~2s
  between "Nth Happy Birthday!" (age ordinal computed from `dob`) and "Wishes
  you a wonderful day". Self-hides when it is not the user's birthday.
- `src/components/shared/birthday-scene.tsx` — `Candle3D` + `Gift3D` glossy
  animated SVG icons (pure SVG + scoped keyframes, reduced-motion safe).
- `dob` field added to `Teacher` and `Student` data models (populated for all
  mock teachers + students).
- Birthday in-app notifications (`n11`, `pn6`) in `mock-notifications.ts`, plus a
  new `birthday` notification type with a cake icon in `NotificationRow`.

#### Changed
- Admin, management, teacher, parent, and super-admin dashboards now render
  `<BirthdayCard />`. The parent dashboard also shows the child's birthday card.

#### Notes
- Figma MCP was not installed in this session; the card was built on the
  existing Figma-derived `--ef-*` design tokens already in `globals.css`, with
  cheer/confetti keyframes (`ef-bob`, `ef-wiggle`, `ef-pop`, `ef-float-up`,
  `ef-confetti`) appended to `globals.css` (respect `prefers-reduced-motion`).
- The card shows only on the user's **actual birthday** (`BIRTHDAY_DEMO_MODE =
  false`). Demo personas admin/teacher/parent + the child carry a 24-June
  birthday so the card is visible on that date via a genuine match.

---

### 2026-06-21 — Design System Compliance Sweep (Batches A–F)

Complete execution of the `DESIGN_AUDIT.md` remediation plan on the Next.js 15
app. Approximately **898 issues resolved across ~100 files**, bringing the
entire frontend into compliance with the shadcn/ui PRO Variables V6.0 design
system (Figma: `BlFqAE1yNoGDD4IFKyqaIV`) and WCAG 2.1 accessibility guidelines.

#### Fixed
- **Critical token bug (Batch A)** — Tailwind v4 was silently emitting zero CSS
  for every `bg-ef-*`, `text-ef-*`, and `border-ef-*` utility class (316 uses
  across 27 files). Fixed by adding `--color-ef-*` mappings to the
  `@theme inline` block in `src/app/globals.css`. A single 22-line edit
  restored all 316 usages.
- **Hardcoded palette colors (Batch B)** — Eliminated all 351 hardcoded
  Tailwind palette colors (`bg-emerald-500`, `text-amber-600`, etc.) across
  16 files. `status-badge.tsx` refactored from a 96-color inline table to a
  data-driven tone map. Every status/role/subject/grade now resolves to a
  semantic token, making light + dark mode correct automatically.
- **Component compliance (Batch C)** — Migrated 13 hand-styled `<button>`
  elements to shadcn `<Button>` (error pages, password eye-toggles, dismiss
  buttons, link buttons). Added keyboard support (`onKeyDown` + `aria-sort`)
  to 7 sortable table headers and 1 expandable row across 4 files.
- **Responsive grids (Batch D)** — Fixed 21 non-responsive grids across 18
  files. All `grid-cols-3`/`grid-cols-4` now collapse to a single column on
  phones via `grid-cols-1 min-[480px]:grid-cols-{n}`. Calendar grids wrapped
  in `overflow-x-auto` containers.
- **Padding & typography (Batch E)** — Standardized 4 outlier page wrappers
  to the canonical `p-4 sm:p-6 md:p-8` scale. Replaced all 72 `text-[13px]`
  usages with Tailwind's standard `text-sm` token across 15 files.
- **Accessibility (Batch F)** — Final a11y polish: added 2 missing
  `<caption className="sr-only">` to `super-admin/health` tables,
  `aria-hidden="true"` to decorative status dot in `admin/holiday-calendar`,
  and `aria-hidden="true"` to initials avatar in `admin/dashboard`. 47 of 50
  §6 a11y items were already resolved in prior batches.

#### Accessibility
- All 8 icon-only `<Button>` elements have descriptive `aria-label`.
- All 7 sortable table headers are keyboard-navigable (`<button>` wrapper +
  `onKeyDown` + `aria-sort`).
- All 35 data tables have `<caption className="sr-only">` for screen readers.
- All decorative status dots have `aria-hidden="true"` or `role="img"` +
  `aria-label`.
- All 13 initials-avatar `<div>` elements have `aria-hidden="true"` (names
  conveyed via adjacent text).

#### Verification
- `npm run typecheck` — passes clean
- `npm run lint` — passes (only pre-existing warnings, zero errors)
- `npm run build` — succeeds, all 69 pages prerender

---

## [Unreleased]

### Changed
- `HolidayCalendarPage` (admin) — refactored `typeColor`/`typeText` split maps into a unified `typeStyle` record; replaced hardcoded `--sch-*` inline style references with shadcn semantic tokens (`text-foreground`, `text-muted-foreground`, `border-border`, `hover:bg-muted/60`); added `Separator` between calendar legend and month navigation; consolidated KPI `extra` prop to a bare SVG donut (removed redundant wrapper div + inline pct label); updated "All Holidays" list to use `Separator` between rows instead of conditional border class; improved dialog form layout with `htmlFor`/`id` label associations and `flex-col gap-1.5` field groups; updated sync dialog "Connect" buttons to `size="xs"` per card-nested button size rule
- `MgmtNoticePage` (management) — refactored notice cards from raw `<div>` wrappers to `Card`/`CardContent` shadcn components; added colored icon strip with per-notice tint surface; added `Edit2` icon button and `icon-sm` delete button; migrated audience toggles from inline `style={{}}` to Tailwind semantic tokens (`bg-primary`, `text-primary-foreground`, `border-primary`, `hover:bg-muted/60`); added `Separator` in meta row; improved dialog form layout with `htmlFor`/`id` label associations and `flex-col gap-1.5` field groups
- `ProxyBoardPage` (admin) — refactored inline `style={{...}}` to Tailwind/shadcn utility classes; replaced hand-rolled progress bars with the shared `Progress` component; migrated color references to semantic tokens (`text-foreground`, `text-muted-foreground`, `bg-destructive`, etc.); added `Separator` between coverage donut and sparkline in the analytics row
- `avatar.tsx` (scholaris/ui) — migrated status dot and fallback colors from raw `--sch-*` tokens to shadcn semantic tokens (`bg-destructive`, `bg-muted-foreground`, `text-primary-foreground`, `border-card`, `to-primary`) for consistent light/dark mode support via the token bridge
- `alert.tsx` (scholaris/ui) — migrated status variant colors from raw `--sch-*` tokens to shadcn semantic tokens (`--info`/`--info-foreground`, `--success`/`--success-foreground`, `--warning`/`--warning-foreground`, `border-destructive`) for consistent light/dark mode support via the token bridge
- `table.tsx` (scholaris/ui) — migrated all hardcoded `--sch-*` CSS variables to shadcn semantic tokens (`bg-muted`, `border-border`, `text-foreground`, `text-muted-foreground`, `bg-accent`) for consistent light/dark mode support via the token bridge
- `select.tsx` (scholaris/ui) — migrated all hardcoded `--sch-*` CSS variables to shadcn semantic tokens (`border-input`, `bg-card`, `text-foreground`, `bg-popover`, `bg-accent`, `text-primary`, `bg-border`) for consistent light/dark mode support via the token bridge
- `badge.tsx` (scholaris/ui) — migrated `default` and `secondary` variants to shadcn semantic tokens (`bg-accent`/`text-accent-foreground`, `bg-secondary`/`text-secondary-foreground`); migrated `outline` variant to `border-border`/`text-muted-foreground` for consistent light/dark mode support

### Fixed
- `SchoolDrilldownPage` (super-admin) — corrected mismatched closing tags: replaced `</div></div>` with `</CardContent></Card>` to properly close the card structure
- `SchoolDrilldownPage` (super-admin) — replaced raw `<div>` school card header/body wrappers with `<CardHeader>` and `<CardContent>` shadcn components for proper semantic structure

### Changed
- `AnalyticsPage` (admin) — imported `MiniSparkline` component for inline sparkline charts within KPI cards
- `AnalyticsPage` (admin) — added Monthly Attendance Trend SVG line chart (with gradient fill, guide lines, data dots) and Absences by Type donut chart with legend in a 3-column layout row
- `AnalyticsPage` (admin) — added monthly attendance trend data (`attendanceTrend`), min/max bounds, and absence breakdown by category (sick/casual/earned/emergency) with per-type colors
- `SuperAuditLogPage` (super-admin) — replaced `.sch-card` / `.sch-card__body` markup in the Filters section with `Card` / `CardContent` shadcn components for consistency
- `EmergencyConsolePage` (super-admin) — replaced `.sch-card` / `.sch-card__header` / `.sch-card__body` markup in the Broadcast tab with `Card`, `CardHeader`, `CardTitle`, `CardContent` shadcn components for consistency
- `EmergencyConsolePage` (super-admin) — added `Card`, `CardHeader`, `CardTitle`, `CardContent` imports from `../../ui/card` for consistent card usage
- `AffiliatesPage` (super-admin) — removed unused `CardFooter` import from `../../ui/card`
- `AffiliatesPage` (super-admin) — replaced `.sch-card` / `.sch-card__header` / `.sch-card__body` markup in the Payout Queue and Referral Link Generator sections with `Card`, `CardHeader`, `CardTitle`, `CardContent` shadcn components for consistency
- `BillingLogsPage` (super-admin) — replaced `.sch-card` / `.sch-card__header` / `.sch-card__body` / `.sch-card__footer` in Failed Payment Tracker and Filters sections with `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` shadcn components for consistency
- `WorkloadPage` (management) — replaced custom `.sch-card` / `.sch-card__header` markup with `Card`, `CardHeader`, `CardTitle` shadcn components for consistency
- `StaffDirectoryPage` (admin) — removed unused `CardContent` import from `../../ui/card`
- `RolesPermissionsPage` (admin) — replaced `.sch-card` / `.sch-card__header` / `.sch-card__body` markup with `Card`, `CardHeader`, `CardTitle`, `CardContent` shadcn components for consistency
- `StudentsPage` (admin) — added `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` and `KpiCard` imports; removed unused `TrendingUp` icon in preparation for KPI strip refactor
- `DashboardPage` (admin) — replaced remaining `.sch-card` / `.sch-card__header` / `.sch-card__body` markup in the Activity Feed and Help & Resources sections with `Card`, `CardHeader`, `CardTitle`, `CardContent` shadcn components
- `DashboardPage` (admin) — replaced `.sch-card` / `.sch-card__header` / `.sch-card__body` / `.sch-card__footer` markup in Proxy Status and Activity Feed sections with `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` shadcn components
- `DashboardPage` (admin) — imported `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`, and `Progress` components, wiring up new card-based UI sections
- `HolidayCalendarPage` (admin) — imported `KpiCard` shared component, aligning stat cards with the design system
- `AnnouncementsPage` (admin) — imported `KpiCard` component to replace inline KPI stat card markup with the shared component
- `BackupRestorePage` (super-admin) — replaced `.sch-card` / `.sch-card__body` markup in the backup schedule info section with `Card` / `CardContent` shadcn components for consistency
- `BackupRestorePage` (super-admin) — replaced raw `<div className="sch-card__footer">` with `CardFooter` shadcn component in the backup list footer row
- `DefaultersPage` (admin) — imported `KpiCard` component to replace inline KPI card markup with the shared component
- `SystemHealthPage` (super-admin) — replaced raw `<div className="sch-card__footer">` with `CardFooter` shadcn component in the incident tracker footer row
- `TeachersPage` (admin) — removed unused `teacherTrendData`, `activeTrendData`, and `leaveTrendData` sparkline constants, cleaning up dead code after KPI card simplification
- `SystemHealthPage` (super-admin) — replaced `.sch-card` / `.sch-card__header` markup in the Incident History section with `Card`, `CardHeader`, `CardTitle`, `CardContent` shadcn components for consistency
- `SystemHealthPage` (super-admin) — replaced `.sch-card` / `.sch-card__header` / `.sch-card__body` markup in the API Latency and Error Rate cards with `Card`, `CardHeader`, `CardTitle`, `CardContent` shadcn components for consistency
- `SystemHealthPage` (super-admin) — added `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter` imports from `../../ui/card` for consistent card usage
- `AnnouncementsPage` (admin) — removed `StatSparkline` inline bar charts and `sparkData` fields from stat cards, simplifying the KPI grid layout
- `AbsenceTrackerPage` (admin) — removed `MiniBar` sparkline and `sparkData` fields from KPI stat cards, simplifying the layout
- `StaffDirectoryPage` (admin) — removed `MiniBar` sparkline and `sparkData` fields from KPI stat cards, simplifying the layout
- `StudentsPage` (admin) — removed `MiniBar` sparkline and `sparkData` fields from KPI stat cards, simplifying the layout
- `PricingPage` (marketing) — enhanced plan cards with per-plan icons, highlight feature tagline, annual savings badge + progress bar, featured plan color tinting, and CTA button brand color override
- `PlatformAnalyticsPage` (super-admin) — fixed mismatched closing tags: replaced stray `</div>` with correct `</CardContent>` and `</Card>` to match shadcn card structure
- `PlatformAnalyticsPage` (super-admin) — migrated Geographic Distribution and Feature Adoption sections from `.sch-card` / `.sch-card__header` / `.sch-card__body` to `Card`, `CardHeader`, `CardTitle`, `CardContent` shadcn components for consistency
- `PlatformAnalyticsPage` (super-admin) — replaced `.sch-card` / `.sch-card__header` / `.sch-card__body` markup in the MRR Trend section with `Card`, `CardHeader`, `CardTitle`, `CardContent` shadcn components for consistency
- `PricingPage` (marketing) — added `savingsPct`, `highlightFeature`, and `icon` fields to Starter, Growth, and Enterprise plan data objects
- `PricingPage` (marketing) — added `Star`, `Users`, `Shield`, and `HeadphonesIcon` icon imports from lucide-react
- `SubscriptionPage` (admin) — enhanced current-plan banner with gradient background, usage mini-stats (students, days remaining, usage %), and Upgrade Plan CTA; added savings progress bars and `Star` icon to plan cards; added sortable invoice table with `SortIcon` on Date, Plan, Amount, and Invoice columns
- `AnnouncementsPage` (admin) — upgraded stat cards with inline `StatSparkline` bar charts and icon badges; added tone label badge to announcement cards; polished card padding, icon sizing, and dismiss button positioning
- `SchoolDrilldownPage` (super-admin) — reduced detail drawer border width from 2px to 1px for visual consistency with other cards
- `TenantManagementPage` (super-admin) — replaced `.sch-card` / `.sch-card__body` filter wrapper with `Card` / `CardContent` shadcn components for consistency
- `ReportsPage` (admin) — added inline bar sparklines to KPI stat cards; upgraded absence breakdown to full-width labeled progress bars with value/total counts; polished export row and subject-performance layouts with better spacing and responsive teacher-name column
- `StaffDirectoryPage` (admin) — upgraded stat cards to rich KPI layout: added `MiniBar` inline sparkline, trend label with `TrendingUp` icon, and icon badge; replaced `.sch-stat` class blocks with dynamic inline styling
- `StaffDirectoryPage` (admin) — added inline `MiniBar` sparkline sub-component for stat card trend visualization; imported `TrendingUp` icon
- `StudentsPage` (admin) — added inline `MiniBar` sparkline sub-component for stat card trend visualization; imported `TrendingUp` icon
- `AbsenceTrackerPage` (admin) — upgraded stat cards to rich KPI layout: added `MiniBar` sparkline sub-component, trend text, and icon badges; replaced `.sch-stat` class blocks with inline dynamic styling
- `AbsenceTrackerPage` (admin) — replaced hand-rolled `.sch-card` / `.sch-card__header` markup in the Absence Records table section with `Card`, `CardHeader`, `CardTitle` shadcn components
- `TeachersPage` (admin) — removed `MiniBar` sparkline and `sparkData` fields from stat cards, simplifying KPI card layout
- `TeachersPage` (admin) — added `MiniBar` inline sparkline sub-component and trend data arrays (`teacherTrendData`, `activeTrendData`, `leaveTrendData`) for stat card enhancements; imported `TrendingUp` and `BarChart2` icons
- `StudentAttendancePage` (admin) — removed attendance mode indicator widget from page header actions; mode is now only reflected via the inline alert banner and period-selector visibility
- `HolidayCalendarPage` (admin) — corrected button sizes from invalid `size="md"` to `size="default"` for header CTAs (Sync, Import, Export, Add Holiday), Browse File in import dialog, and Connect buttons in sync dialog
- `BillingLogsPage` (super-admin) — changed header action buttons (Export CSV, Sync Razorpay, Manual Override) from `size="sm"` to `size="default"`; note: UI consistency rules require `size="sm"` for page-level header CTAs — this is a regression
- `AnalyticsPage` (admin) — replaced non-existent `.sch-stats-grid` class with `grid grid-cols-2 md:grid-cols-4 gap-4` Tailwind responsive grid for KPI stat cards
- `TimetablePage` (admin) — corrected Print and CSV buttons in filter bar from `size="sm"` to `size="default"` per button size hierarchy (card-header/filter-bar actions use `default`)
- `AbsenceTrackerPage` (admin) — changed header CTA buttons ("AI Proxy Suggest", "Mark Absence") from `size="sm"` to `size="default"`; note: UI consistency rules require `size="sm"` for page-level header CTAs
- `TeachersPage` (admin) — corrected "Add Teacher" header CTA from unsized to `size="sm"` per button size hierarchy rules (page-level primary actions use `sm`)
- `ProxyBoardPage` (admin) — corrected "Assign" button inside open-gap cards from `size="xs"` to `size="sm"` per button size hierarchy rules (card-level actions use `sm`, not `xs`)
- `AnalyticsPage` (admin) — replaced hand-rolled page header with shared `SchPageHeader`; Export PDF action set to `size="sm"` per UI consistency rules
- `AnnouncementsPage` (admin) — added `SchPageHeader` import to replace inline page header markup
- `ProxyBoardPage` (admin) — removed `spark` and `sparkVariant` props from all four KPI cards (Open Gaps, Assigned, Completed, Coverage Rate)
- `StudentAttendancePage` (admin) — removed unused `Settings2` icon import from lucide-react
- `TeachersPage` (admin) — removed unused `BarChart2` import from lucide-react
- `DefaultersPage` (admin) — replaced inline page header markup with shared `SchPageHeader` component
- `FeeCollectionPage` (admin) — replaced hand-rolled page header with shared `SchPageHeader`; Export Report action set to `size="sm"` per UI consistency rules
- `FeeCollectionPage` (admin) — added "Collection Rate" KPI stat card (69% vs 100% target, amber) to the fee summary strip
- `FeeStructurePage` (admin) — added `SchPageHeader` import to replace inline page header markup
- `SystemHealthPage` (super-admin) — corrected Refresh and Export Report header action buttons from `size="sm"` to `size="default"` per button size hierarchy (card-header/dialog-footer actions use `default`)
- `AbsenceApprovalPage` (management) — replaced hand-rolled page header with shared `SchPageHeader`; Export CSV action set to `size="sm"` per UI consistency rules
- `ChildAttendancePage` (parent) — changed "Download Report" header CTA from `size="sm"` to `size="default"`; note: UI consistency rules require `size="sm"` for page-level header CTAs
- `ExpensePage` (admin) — added `CardHeader` with title "Expense Ledger" and entry count to the ledger table card; added `min-w-[200px]` to Description column for better readability
- `ProxyCoverageReportPage` (management) — changed Export PDF header action button from `size="sm"` to `size="default"`; note: UI consistency rules require `size="sm"` for page-level header CTAs
- `DailyLogPage` (management) — replaced inline page header markup with shared `SchPageHeader` component
- `NoticeBoardPage` (admin) — added `SchPageHeader` import to replace inline page header markup
- `ManagementProxyPage` — replaced inline page header markup with shared `SchPageHeader`; corrected Auto-Assign button from `size="lg"` to `size="sm"` per UI consistency rules
- `AbsenceTrackerPage` (admin) — added `SortIcon` import from shared components for use on sortable table column headers
- `ProxyBoardPage` (admin) — corrected "Reassign" button in Assigned kanban column from `size="xs"` to `size="sm"` per button size hierarchy rules (card-level actions use `sm`)
- `TimetablePage` (admin) — replaced inline page header markup with shared `SchPageHeader` component
- `ManagementDashboardPage` — refactored absent teachers table: switched to `sch-filter-bar` toolbar layout, replaced `SortIndicator` with `SortIcon`, added Sections and Actions columns, inline coverage mini-bar with color thresholds, and `absenceStatusBadge` for approval status
- `ManagementDashboardPage` — enriched `ABSENT_TEACHERS` data with teacher IDs, sections, employment type (`Full-time`/`Part-time`), and proxy cap fields; added `type` to `SortField` union; removed local `SortIndicator` in favour of shared component
- `ManagementDashboardPage` — major refactor: added `SchPageHeader`, `SchSearchInput`, `MiniSparkline`; added sortable absent-teachers table with search/filter toolbar; added 7-day coverage bar chart card; added period-filter tabs on covered periods; improved pending items with semantic colors; `periodFilter` state now drives filtered covered-period list
- `LeaveHistoryPage` (teacher) — replaced inline page header markup with shared `SchPageHeader` component
- `NotificationsPage` (teacher) — replaced inline page header markup with shared `SchPageHeader` component
- `ProxyBoardPage` (admin) — replaced inline page header markup with shared `SchPageHeader` component
- `SchoolDrilldownPage` — replaced inline page header markup with shared `SchPageHeader` component
- `SystemHealthPage` — replaced inline page header markup with shared `SchPageHeader` component
- `TenantManagementPage` — replaced inline page header markup with shared `SchPageHeader` component
- `ParentDashboardPage` — replaced inline page header markup with shared `SchPageHeader` component
- `ProxyHistoryPage` — replaced inline page header markup with shared `SchPageHeader` component
- `WorkloadPage` — replaced inline page header markup with shared `SchPageHeader` component
- `SwapApprovalsPage` — replaced inline page header markup with shared `SchPageHeader` component
- `RolesPermissionsPage` — replaced inline page header markup with shared `SchPageHeader` component
- `DashboardPage` (admin) — replaced inline page header markup with shared `SchPageHeader` component
- `ManagementProxyPage` — completed proxy assignments table with status badges, AI suggestions panel with score breakdown and arc sparklines, and manual override section with teacher/period selects
- `ScholarisApp.tsx` — added import for `BreadcrumbContext` from `./context/BreadcrumbContext`
- `TeacherDashboardPage` — added `MiniSparkline` import for inline sparkline chart support in KPI cards
- `GlobalSettingsPage` — replaced inline page header markup with shared `SchPageHeader` component
- `EmergencyConsolePage` — replaced inline page header markup with shared `SchPageHeader` component
- `AffiliatesPage` — added `SchPageHeader` import to replace inline page header markup
- `BackupRestorePage` — replaced `SortIcon` import with inline `ArrowUpDown` icon from lucide-react

### In Progress
- Dark mode: full `prefers-color-scheme` + manual `.dark` class rollout (both design system + Scholaris)
- Morning Briefing countdown timer on `ManagementDashboardPage`
- Exam Routine component for `src/components/`
- QR Code check-in component (Phase 4)
- Subject Completion Tracker for parent portal
- Behavioral Trend chart for parent portal
- Progress Notes per-period teacher input flow
- Academic Year Rollover with leave balance reset
- Excel import (`.xlsx`) for bulk teacher/student upload
- Parent portal showcase section in `src/showcase/`

---

## [2026-06-09] — Component Reuse Refactor (Batch 1)

### Added
- `src/scholaris/components/SortIcon.tsx` — shared sort indicator, replaces 10 identical inline definitions
- `src/scholaris/components/SchPageHeader.tsx` — shared page title/subtitle/actions bar for all Scholaris pages
- `src/scholaris/components/SchSearchInput.tsx` — shared search input for filter bars, replaces 12 raw inline inputs
- `src/scholaris/components/SchEmptyState.tsx` — shared empty/no-results state, replaces 6 inline div blocks
- `src/scholaris/lib/statusBadges.tsx` — central status → Badge helpers: `teacherStatusBadge`, `absenceStatusBadge`, `feeStatusBadge`, `swapStatusBadge`, `attColor`
- `src/scholaris/data/teachers.ts` — canonical HCEA teacher mock data (`TEACHERS`, `TEACHER_NAMES`), replaces 8 inline re-declarations
- `src/scholaris/data/periods.ts` — canonical HCEA period schedule (`PERIODS`, `PERIOD_LABELS`, `PERIOD_IDS`), replaces 5 inline re-declarations

### Changed (pages updated to use shared components)
- `TeachersPage` — uses `SortIcon`, `SchPageHeader`, `SchSearchInput`, `teacherStatusBadge`, `TEACHERS` from data/
- `StudentsPage` — uses `SortIcon`, `SchPageHeader`, `SchSearchInput`, `feeStatusBadge`, `attColor` from lib/
- `AbsenceTrackerPage` — uses `SchPageHeader`, `absenceStatusBadge`, `TEACHER_NAMES`, `PERIOD_LABELS` from data/
- `SuperAuditLogPage` — uses `SortIcon`, `SchPageHeader`, `SchSearchInput`, `SchEmptyState`
- `BillingLogsPage` — uses `SortIcon`, `SchPageHeader`, `SchSearchInput`, `SchEmptyState`
- `SwapRequestsPage` — uses `SchSearchInput`, `SchEmptyState`
- `AffiliatesPage`, `TenantManagementPage`, `BackupRestorePage`, `SystemHealthPage`, `DefaultersPage`, `StaffDirectoryPage`, `ExpensePage` — inline `SortIcon` removed, now import from shared component

### Tests
- All 29 Vitest tests pass ✅

---

## [0.2.0] — Scholaris Role-Aware Prototype — 2026-06-08

### Added — Scholaris App (`src/scholaris/`)

**App Shell**
- `ScholarisApp.tsx` — full role-aware app shell with shadcn/ui collapsible sidebar, role switcher, dark mode toggle, and global search
- 6 roles implemented: `superadmin`, `admin`, `management`, `teacher`, `parent`, `marketing`
- 69 pages total across all roles (see AGENTS.md §6 for full inventory)

**Scholaris Components**
- `EduFlowAssistant.tsx` — AI-powered floating chatbot FAB (bottom-right); mock response engine covers proxy assignment, absences, fees, timetable, attendance, reports, dark mode; persists state to localStorage; quick-prompt chips; simulated typing delay
- `WeatherClock.tsx` — live weather + clock widget; fetches from Open-Meteo API (free, no key); 3D animated SVG weather scenes (7 types: sunny, partly-cloudy, cloudy, rainy, snowy, foggy, stormy); live clock ticking every second; defaults to Howly, Assam (lat 26.45, lon 90.87)
- `MiniSparkline.tsx` — inline mini charts for KPI cards; variants: `line`, `bar`, `arc`

**Context**
- `SchoolSettingsContext.tsx` — React context for `attendanceMode`: `'per-period'` | `'single-daily'`; persisted to localStorage

**shadcn/ui wrappers** (`src/scholaris/ui/`)
- `avatar.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `input.tsx`, `progress.tsx`, `separator.tsx`, `sidebar.tsx`, `tooltip.tsx`

**Super Admin Pages (11)**
- `SaaSOverviewPage` — MRR/ARR KPIs with sparklines, 6-month MRR bar chart, plan distribution (Starter/Quarterly/Annual), new signups list, churn risk alerts with progress bar, platform health metrics (API uptime, webhook success, SMS delivery, email open rate)
- `TenantManagementPage` — paginated school list with filters
- `BillingLogsPage` — subscription event log
- `AffiliatesPage` — affiliate commissions and payout queue
- `GlobalSettingsPage` — platform-wide configuration
- `SuperAuditLogPage` — full platform audit log with actor/IP/timestamp
- `SchoolDrilldownPage` — impersonation mode, per-school detail view
- `BackupRestorePage` — manual data snapshots and restore
- `PlatformAnalyticsPage` — deep analytics across all tenants
- `EmergencyConsolePage` — emergency override controls
- `SystemHealthPage` — API uptime and service status monitoring

**Admin Pages (22)**
- `DashboardPage` — KPI stat cards (coverage %, fees collected, pending absences, active proxies) with sparklines, greeting banner with WeatherClock, proxy status table, recent activity feed, teacher availability snapshot, mini stats (proxy fill rate, fee collection, avg attendance, timetable complete), help & resources panel
- `ProxyBoardPage` — full proxy assignment board with color-coded availability dots
- `TeachersPage` — teacher CRUD with subject/section assignment
- `StudentsPage` — student directory with class/section filter
- `StaffDirectoryPage` — non-teaching staff management
- `RolesPermissionsPage` — user roles and access control
- `AbsenceTrackerPage` — mark absences, approve/reject teacher requests
- `StudentAttendancePage` — per-period and single-daily roll call (respects SchoolSettingsContext)
- `SwapRequestsPage` — peer swap inbox with approve/reject
- `FeeStructurePage` — fee head definitions per class
- `FeeCollectionPage` — payment collection and receipt generation
- `DefaultersPage` — outstanding fee list with reminder actions
- `ExpensePage` — school expense tracking
- `TimetablePage` — drag-and-drop timetable builder
- `NoticeBoardPage` — post notices targeted by role
- `HolidayCalendarPage` — mark holidays, exam weeks, school events
- `AnalyticsPage` — attendance, proxy, fee analytics with charts
- `ReportsPage` — PDF/Excel report generation
- `AnnouncementsPage` — school-wide announcements with expiry
- `AuditPage` — full audit log viewer with filters
- `InstitutionSettingsPage` — school profile, timetable config, leave quotas
- `SubscriptionPage` — plan management and affiliate referral link

**Management Pages (12)**
- `ManagementDashboardPage` — morning briefing: coverage %, uncovered periods, quick-assign actions
- `AbsenceApprovalPage` — approve/reject teacher absence requests
- `ManagementProxyPage` — proxy assignment board
- `SwapApprovalsPage` — final approval for peer-agreed swaps
- `WorkloadPage` — teacher workload heatmap and load fairness view
- `TimetableViewerPage` — read-only timetable for all classes
- `MgmtNoticePage` — post and read notices
- `ExamSchedulePage` — exam routine viewer and editor
- `ProxyCoverageReportPage` — proxy and coverage analytics
- `AttendanceSummaryPage` — student and teacher attendance summary
- `DailyLogPage` — end-of-day operations log
- `MgmtProfilePage` — profile and preference settings

**Teacher Pages (9)**
- `TeacherDashboardPage` — daily schedule (all 8 slots incl. tiffin), interactive proxy request card (accept/decline with React state), leave balance progress bars (casual/sick/earned), monthly proxy count vs. cap, quick action cards
- `MyTimetablePage` — personal weekly timetable
- `ProxyHistoryPage` — past proxy duties log
- `ApplyLeavePage` — submit absence: full day or specific periods, reason category
- `LeaveHistoryPage` — submitted leave requests with status
- `MarkAttendancePage` — take roll call for assigned class/period
- `AttendanceHistoryPage` — past attendance records
- `NotificationsPage` — in-app notification center
- `NoticeReadPage` — read-only notice board

**Parent Pages (8)**
- `ParentDashboardPage` — child's today status (present/absent with timestamp), attendance % progress bar, exam countdown (days to first exam), fee alert (outstanding amount + due date), class journal preview (period/subject/teacher/topic), recent notification feed (color-coded by type), quick-link cards with sparklines
- `ChildAttendancePage` — full attendance history for the child
- `ClassJournalPage` — period-by-period class journal with homework indicators
- `ReportCardPage` — term report card with grades
- `ChildExamSchedulePage` — upcoming exam schedule with countdown
- `FeesDuesPage` — outstanding fees and payment history
- `ParentNotificationsPage` — school notifications (attendance, fee, exam, announcement, report)
- `ParentLeaveRequestPage` — submit student leave request to school

**Marketing Pages (7)**
- `LandingPage` — public landing page with hero, features, social proof
- `FeaturesPage` — full feature breakdown by role
- `PricingPage` — plan cards with Razorpay pricing (₹999–₹8,999/mo/quarter/half-year/year)
- `RequestDemoPage` — demo request form
- `LoginPage` — login UI with demo role switcher
- `SignupPage` — signup and 14-day free trial form
- `OnboardingWizardPage` — 5-step school setup wizard

---

## [0.1.0] — Design System Library — 2026-05-31

### Added
- Initial design system component library setup (Vite 5 + React 18 + Tailwind v4)
- 50+ components: Accordion, Alert, AnnouncementBanner, Avatar, Badge, Button, Card, Chart, Charts, CheckRadio, Chip, ClassCard, Combobox, CommandPalette, DatePicker, Divider, Drawer, EmptyState, EventCalendarCard, ExamScheduleCard, ExportPanel, FeeReceiptCard, FileUpload, GradeCard, Header, HeatMap, Input, LeaveQuotaBar, LibraryBookCard, LineChart, Menu, Modal, Navigation, NotificationRow, PricingCard, Progress, ProxyBoard, ResultSummaryCard, Search, Select, SettingsRow, Sidebar, Skeleton, Spinner, StaffProfileCard, StudentCard, SubjectCard, SuperAdminCard, SwapRequest, Toast, Tooltip
- Radix UI primitive integrations: Accordion, Dialog, Dropdown, Select, Switch, Tabs, Toast, Tooltip
- Vitest + Testing Library test suite
- Design tokens (CSS variables) aligned to iOS HIG with Inter typography
- Showcase pages for all components
- `VISION.md` — complete product blueprint and business rules (v2.0)
- `Claude.md` — full technical specification for agency handoff (v2.0)
- `Design.md` — visual HTML design system reference (~1800 lines)
- `PROJECT_BUNDLE.md` — AI context pack for external LLMs
- `AGENTS.md` — AI agent context file with architecture, design tokens, and resume instructions
- `ROADMAP.md` — canonical phase-by-phase build order

### Design System Tokens
- Primary brand: `--brand: #007AFF` (iOS Blue)
- 7 semantic colors: green, amber, red, purple, blue, gray scale
- Radius tokens: `--r-xs` through `--r-pill`
- Shadow tokens: `--sh-xs` through `--sh-lg`
- Full alias map for legacy compatibility

### Business Rules Established
- 17 canonical rules in `VISION.md §5` — these are the source of truth
- AI auto-assign algorithm: 4-step filter/score/select/notify pipeline
- Affiliate: 25% one-time + 5% lifetime recurring commission (flat, tier affects perks only)
- Swap expiry: when the requested period ends or is currently running (not a fixed timer)
- Primary color: `#007AFF` iOS Blue (not purple)

---

## Future Releases

See [`ROADMAP.md`](./ROADMAP.md) for the planned feature phases.
