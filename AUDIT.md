# EduFlow — Frontend Audit & Improvement Plan
> **Generated:** June 17, 2026 · Updated after every sprint  
> **Scope:** Next.js 15 app at this repository root  
> **Related files:** [AGENTS.md](./AGENTS.md) · [ROADMAP.md](./ROADMAP.md) · [MIGRATION_PLAN.md](./MIGRATION_PLAN.md) · [REBUILD_PLAN.md](./REBUILD_PLAN.md) · [VISION.md](./VISION.md)

---

## 1. Current Build State

| Category | Status | Notes |
|---|---|---|
| All 69 pages (6 roles) | ✅ Complete | All routes render with mock data |
| shadcn/ui components | ✅ 31 installed | Full list in §3 |
| Shared component layer | ✅ 13 components | `src/components/shared/` |
| Design tokens (globals.css) | ✅ Complete | EduFlow brand → shadcn semantic bridge |
| Dark mode | ✅ Complete | `next-themes` + `.dark` class strategy |
| TypeScript | ✅ Green | `npm run typecheck` passes |
| Lint | ✅ 0 warnings | `npm run lint` clean |
| Build | ✅ Static | `npm run build` produces static output |
| Backend / Auth | ❌ Not started | All data is mock; no Payload CMS yet |
| Real-time | ❌ Not started | No websockets or polling |
| Middleware (route guards) | ❌ Not started | `middleware.ts` not created |
| Domain component tier | ❌ Missing | `components/domain/` folder absent |
| Breadcrumb | ❌ Missing | shadcn `breadcrumb` not installed or wired |
| Form validation | ❌ Missing | `react-hook-form` + `zod` not installed |

---

## 2. Sidebar Audit (Fixed in this session)

### 2.1 Duplicate Icons — Before Fix
| Icon | Used for |
|---|---|
| `DollarSign` | Fees **AND** Expenses (admin) |
| `Activity` | Analytics (super-admin) **AND** Audit Log (admin) **AND** Workload (management) |
| `ClipboardList` | Absences, Daily Log, Exams, Apply Leave, Parent Exams |
| `BookOpen` | Attendance **AND** Leave History **AND** Class Journal |
| `Megaphone` | Announcements **AND** Notifications (teacher) |
| `RefreshCw` | EduFlow logo **AND** Proxy History **AND** Swap Requests |

### 2.2 Icon Map — After Fix (no icon used twice within any role)

**Admin role:**
| Item | Icon |
|---|---|
| Dashboard | `LayoutDashboard` |
| Proxy Board | `LayoutGrid` |
| Teachers | `Users` |
| Students | `GraduationCap` |
| Staff | `UserCog` |
| Roles & Permissions | `ShieldCheck` |
| Absences | `ClipboardList` |
| Swap Requests | `ArrowLeftRight` |
| Attendance | `CheckSquare` |
| Timetable | `Calendar` |
| Holiday Calendar | `BookMarked` |
| Fees | `Banknote` |
| Expenses | `Wallet` |
| Analytics | `BarChart3` |
| Reports | `FileText` |
| Notices | `ScrollText` |
| Announcements | `Megaphone` |
| Audit Log | `History` |
| Subscription | `CreditCard` |
| Settings | `Settings` |

**Management role:**
| Item | Icon |
|---|---|
| Dashboard | `LayoutDashboard` |
| Daily Log | `NotebookPen` |
| Absence Approval | `ClipboardList` |
| Proxy Board | `LayoutGrid` |
| Swap Approvals | `ArrowLeftRight` |
| Workload | `TrendingUp` |
| Attendance | `CheckSquare` |
| Exam Schedule | `GraduationCap` |
| Timetable | `Calendar` |
| Proxy Reports | `BarChart3` |
| Notices | `ScrollText` |
| My Profile | `User` |

**Teacher role:**
| Item | Icon |
|---|---|
| Dashboard | `LayoutDashboard` |
| My Timetable | `Calendar` |
| Apply Leave | `ClipboardList` |
| Leave History | `History` |
| Proxy History | `ArrowLeftRight` |
| Mark Attendance | `CheckSquare` |
| Attendance History | `ListChecks` |
| Notices | `ScrollText` |
| Notifications | `Bell` |

**Parent role:**
| Item | Icon |
|---|---|
| Dashboard | `LayoutDashboard` |
| Attendance | `CheckSquare` |
| Class Journal | `BookOpen` |
| Report Card | `ScrollText` |
| Exams | `ClipboardCheck` |
| Fees & Dues | `Receipt` |
| Apply Leave | `FileText` |
| Notifications | `Bell` |

**Super Admin role:**
| Item | Icon |
|---|---|
| Platform Overview | `Globe` |
| Analytics | `BarChart3` |
| System Health | `PlugZap` |
| All Schools | `Building2` |
| School Drilldown | `UserRoundSearch` |
| Billing Logs | `Receipt` |
| Affiliates | `HeartHandshake` |
| Backup & Restore | `Database` |
| Emergency Console | `TriangleAlert` |
| Audit Log | `History` |
| Settings | `Settings` |

### 2.3 User Detail Improvements
- **Before:** Role labels only (e.g., "Admin", "Teacher")
- **After:** Full name + role title + email shown in footer
  - Admin: "Arnab Paul · Principal · Admin"
  - Management: "Mrinal Ojha · Vice Principal"
  - Teacher: "Priya Sharma · Mathematics · High"
  - Parent: "Pankaj Das · Parent of Rohit Das"
  - Super Admin: "Super Admin · Platform Owner"
- Role picker now shows full name + subtitle for each role
- Each role has a distinct avatar color (blue/green/amber/purple/red)
- "Sign out" button added to role picker dropdown
- Brand logo replaced `RefreshCw` with a custom SVG mark (grid-lines motif)
- School subtitle expanded to "HCEA · Howly, Assam"

---

## 3. shadcn/ui Component Coverage

### Installed (31 components)
`accordion` · `alert-dialog` · `alert` · `avatar` · `badge` · `button` · `calendar` ·
`card` · `chart` · `checkbox` · `collapsible` · `command` · `dialog` · `dropdown-menu` ·
`input` · `label` · `popover` · `progress` · `radio-group` · `scroll-area` · `select` ·
`separator` · `sheet` · `sidebar` · `skeleton` · `sonner` · `switch` · `table` · `tabs` ·
`textarea` · `tooltip`

### Missing from REBUILD_PLAN.md §8 target list
| Component | Priority | Reason needed |
|---|---|---|
| `breadcrumb` | 🔴 High | Auto-nav context; listed in REBUILD_PLAN §2 layout folder |
| `form` (react-hook-form + zod) | 🔴 High | All forms currently lack validation |
| `toast` (radix variant) | 🟡 Medium | Sonner installed but some pages use raw divs |
| `context-menu` | 🟢 Low | Right-click actions in timetable/proxy board |
| `hover-card` | 🟢 Low | Teacher info tooltip on hover in proxy board |
| `navigation-menu` | 🟢 Low | Marketing pages top nav |
| `menubar` | 🟢 Low | Command bar on admin pages |

---

## 4. Shared Component Gaps

### Existing shared components (13)
`confirm-dialog` · `data-table` · `edu-bar-chart` · `eduflow-assistant` · `empty-state` ·
`export-menu` · `filter-bar` · `kpi-card` · `mini-sparkline` · `page-header` ·
`search-input` · `sort-icon` · `status-badge`

### Missing shared components (needed per REBUILD_PLAN §3)
| Component | Priority | Description |
|---|---|---|
| `WeatherGreeting` | 🔴 High | Ported from Scholaris `WeatherClock.tsx`; greeting banner with live weather |
| `BreadcrumbAuto` | 🔴 High | Auto-generates breadcrumb from Next.js pathname |
| `NotificationRow` | 🟠 Medium | Reusable notification item (unread tint, icon, time, action) |
| `PeriodPicker` | 🟠 Medium | Multi-select P1–P7 period picker for absence/leave forms |
| `ProxyDot` | 🟠 Medium | Proxy availability dot with accessible text label pairing |
| `CoverageDonut` | 🟠 Medium | Recharts donut for proxy board coverage widget |
| `AcademicYearBanner` | 🟡 Low | "Academic Year 2025–26" context strip for relevant pages |
| `CommandPalette` | 🟡 Low | ⌘K global search using shadcn `command` |

---

## 5. Domain Component Tier (Missing)

Per REBUILD_PLAN §3.1, a `components/domain/` tier should exist. Currently all domain
logic lives inline in page files. This makes pages long and domain code unshared.

### Components to extract
| File (target) | Source | Pages using it |
|---|---|---|
| `domain/proxy/ProxyBoard.tsx` | `/admin/proxy-board/page.tsx` | admin, management |
| `domain/proxy/CoverageDonut.tsx` | `/admin/proxy-board/page.tsx` | admin, management |
| `domain/proxy/AssignModal.tsx` | `/admin/proxy-board/page.tsx` | admin |
| `domain/absence/AbsenceRow.tsx` | `/admin/absences/page.tsx` | admin, management |
| `domain/absence/PeriodPicker.tsx` | `/teacher/leave/page.tsx` | teacher, admin |
| `domain/teacher/WorkloadHeatmap.tsx` | `/management/workload/page.tsx` | management |
| `domain/timetable/TimetableGrid.tsx` | `/admin/timetable/page.tsx` | admin, management, teacher |
| `domain/fee/FeeReceiptCard.tsx` | `/admin/fees/collection/page.tsx` | admin |
| `domain/notification/NotificationRow.tsx` | `/teacher/notifications/page.tsx` | teacher, parent, admin |

---

## 6. Feature Gaps (Frontend Only)

These are UX features that are absent from the current Next.js pages but exist in the
Scholaris prototype or are specified in VISION.md / ROADMAP.md.

### 🔴 Critical Missing Features

| Feature | Affected pages | Description |
|---|---|---|
| **Morning Briefing Countdown Timer** | `/management/dashboard` | 5-min period countdown specified in VISION §3.3; currently a static banner |
| **Proxy Board Auto-assign scoring UI** | `/admin/proxy-board` | Score breakdown dialog exists but algorithm is mocked; no `lib/proxy-algorithm.ts` |
| **Period Picker component** | `/teacher/leave`, `/admin/absences` | Multi-select P1–P7; currently leave form is basic |
| **Attendance toggle (per-period vs single-daily)** | `/admin/attendance` | Mode toggle exists in page but no context persistence |

### 🟠 High Priority Missing Features

| Feature | Affected pages | Description |
|---|---|---|
| **Progress Notes input flow** | `/teacher/attendance/mark` | Teacher → class → student → note (understood/struggling/etc.) |
| **Subject Completion Tracker** | `/parent/report-card`, `/parent/dashboard` | Per-subject syllabus progress bar |
| **Behavioral Trend Chart** | `/parent/dashboard` | Weekly/monthly student behavior graph |
| **QR Code Check-in** | `/admin/proxy-board`, new page | Generate, print, scan proxy check-in QR |
| **Academic Year Rollover** | `/admin/settings` | Archive past year, reset leave balances |
| **Excel Import** | `/admin/teachers`, `/admin/students` | `.xlsx` bulk import in addition to CSV |
| **Command Palette (⌘K)** | Global | `cmdk` package installed; not wired up |

### 🟡 Medium Priority Missing Features

| Feature | Affected pages | Description |
|---|---|---|
| **Exam Mode toggle** | `/admin/proxy-board` | Disables proxy assignment in exam weeks |
| **Proxy Rules Engine UI** | `/admin/settings` | Configure per-school proxy algorithm preferences |
| **Ghost User / Impersonation** | `/super-admin/school` | Super admin view-as-school; currently read-only drilldown |
| **Affiliate payout queue** | `/super-admin/affiliates` | Payout processing flow |
| **Document Manager** | New page `/admin/documents` | Upload circulars, handbooks, policies |
| **Announcement expiry** | `/admin/announcements` | Auto-expire after date; currently manual dismiss only |
| **Multi-child parent switcher** | `/parent/*` | Parent with 2+ children — child selector in topbar |
| **Leave balance visual** | `/teacher/dashboard` | Visual quota bar per leave type (casual/sick/earned) |

---

## 7. Page-Level Issues Found

### Admin
- `/admin/fees/page.tsx` — Main fees overview page may be empty/stub; sub-routes exist
- `/admin/roles/page.tsx` — Roles page exists but lacks permission matrix table
- `/admin/proxy-board` — `lib/proxy-algorithm.ts` file referenced in REBUILD_PLAN §5 but doesn't exist yet

### Management
- `/management/dashboard` — Morning briefing countdown timer is static text; needs `useInterval` hook
- `/management/timetable` — Read-only viewer; no indication of exam week overlay

### Teacher
- `/teacher/timetable` — Swap initiation icon exists but no modal; needs `SwapRequestModal`
- `/teacher/leave` — Period picker is basic checkboxes inline; should use `PeriodPicker` component

### Parent
- `/parent/dashboard` — Exam countdown is static; should be a live `CountdownTimer` component
- `/parent/attendance` — Calendar heatmap uses CSS classes; no `react-day-picker` integration

### Super Admin
- `/super-admin/emergency` — Emergency controls are UI only; no confirmation guards wired
- `/super-admin/school` — Impersonation button does nothing; needs router redirect logic

---

## 8. Accessibility Issues

| Issue | Location | WCAG criterion |
|---|---|---|
| Proxy board dots shown without text label in some views | `/admin/proxy-board` | 1.4.1 Use of Color |
| Avatar initials divs lack `aria-label` | Sidebar footer, teacher cards | 1.1.1 Non-text content |
| `<button>` without accessible names in role picker | `app-sidebar.tsx` (fixed) | 4.1.2 Name, Role, Value |
| Icon-only buttons missing `sr-only` text | Topbar sort icons | 4.1.2 |
| Color-only status indicators on fee defaulter rows | `/admin/fees/defaulters` | 1.4.1 |
| Missing `<caption>` on data tables | Multiple pages | 1.3.1 Info and Relationships |

---

## 9. Performance Observations

| Observation | Recommendation |
|---|---|
| All mock data imported at build time | Fine for prototype; will need API routes + `loading.tsx` suspense boundaries in production |
| Charts (`recharts`) loaded on all pages | Add `dynamic(() => import(...), { ssr: false })` for chart-heavy pages |
| No `loading.tsx` files in any route | Add skeleton loaders per route segment |
| No `error.tsx` files | Add error boundaries per route segment |
| Images: only SVGs in `/public` | Add `next/image` for any photos (teacher avatars eventually) |
| No `next/font` optimization for Inter | Root layout already uses `next/font/google` ✅ |

---

## 10. Upgrade Feature List (Prioritized)

These are net-new features not yet designed, ranked by business value.

### Tier 1 — Ship before beta launch
- [ ] **`middleware.ts` route guard** — redirect unauthenticated users; enforce role prefixes
- [ ] **`BreadcrumbAuto` component** — auto-generate from pathname in `Topbar`
- [ ] **Form validation** — install `react-hook-form` + `zod`; wire to all create/edit forms
- [ ] **`WeatherGreeting` banner** — port from Scholaris `WeatherClock.tsx` (Open-Meteo, no key needed)
- [ ] **`CountdownTimer` component** — live period countdown for management dashboard
- [ ] **`PeriodPicker` component** — reusable multi-select period selector

### Tier 2 — Ship at beta
- [ ] **`lib/proxy-algorithm.ts`** — extract scoring engine from proxy board page into testable module
- [ ] **`CommandPalette`** — wire `cmdk` (already installed) to ⌘K global shortcut
- [ ] **`domain/` component tier** — extract ProxyBoard, AbsenceRow, TimetableGrid from pages
- [ ] **`loading.tsx` per route** — skeleton states for each major route segment
- [ ] **`error.tsx` per route** — error boundaries with retry actions
- [ ] **Excel import modal** — `xlsx` parsing for teacher/student bulk upload
- [ ] **Progress Notes flow** — teacher attendance mark → student note input

### Tier 3 — Post-beta
- [ ] **QR Check-in** — `qrcode` library; print-ready PDF output
- [ ] **Academic Year Rollover wizard** — archive data, reset quotas
- [ ] **Exam mode toggle** — disable proxy assignment during exam weeks
- [ ] **Document Manager page** — `/admin/documents` with file categories and role filtering
- [ ] **Multi-child parent switcher** — child selector dropdown in parent topbar
- [ ] **Subject Completion Tracker** — progress bars per subject per term
- [ ] **Behavioral Trend Chart** — weekly behavior graph in parent portal
- [ ] **Affiliate payout queue** — approve/reject/process payouts in super-admin affiliates

---

## 11. Shadcn Components to Install Next

```bash
# Install in this order (run in eduflow-app root)
npx shadcn@latest add breadcrumb
npx shadcn@latest add form
npx shadcn@latest add hover-card
npx shadcn@latest add context-menu
npx shadcn@latest add navigation-menu
```

Also install npm packages:
```bash
npm install react-hook-form zod @hookform/resolvers
npm install qrcode @types/qrcode
```

---

## 12. Work Log (append after each session)

- **2026-06-17** — Comprehensive audit performed. Sidebar icon deduplication (22 icons now unique per role). User details enriched in sidebar footer (full name + role title + email + distinct avatar colors per role). Custom EduFlow SVG logo added. Sign-out button added to role picker. `AUDIT.md` created. Cross-links added to all `.md` files. Typecheck green after all changes.
- **2026-06-21** — **Design System Compliance Sweep (Batches A–F + Phase 1/2).** Complete execution of `DESIGN_AUDIT.md` remediation plan (~898 issues resolved across ~100 files):
  - **Batch A** — Fixed critical Tailwind v4 token bug: added `--color-ef-*` mappings to `@theme inline` in `globals.css` (316 broken `bg-ef-*`/`text-ef-*` classes now generate valid CSS).
  - **Batch B** — Eliminated all 351 hardcoded Tailwind palette colors across 16 files (refactored `status-badge.tsx` to data-driven tone table; swapped every `bg-emerald-500`/`text-amber-600`/etc. to semantic tokens).
  - **Batch C** — Component compliance: migrated 13 hand-styled `<button>`s to shadcn `<Button>`, added keyboard support (`onKeyDown` + `aria-sort`) to 7 sortable table headers and 1 expandable row. Raw `<table>` migration already complete.
  - **Batch D** — Responsive grid sweep: 21 grids fixed across 18 files (added `grid-cols-1 min-[480px]:` mobile fallbacks; overflow wrappers on calendar grids).
  - **Batch E** — Padding/typography normalization: 76 changes across 18 files (standardized page padding to `p-4 sm:p-6 md:p-8`; replaced all `text-[13px]` with `text-sm`).
  - **Batch F** — Accessibility polish: 3 remaining fixes (2 table `<caption>`s in `super-admin/health`, 1 `aria-hidden` dot in `admin/holiday-calendar`, 1 `aria-hidden` avatar in `admin/dashboard`). 47 of 50 §6 items already resolved in prior batches.
  - All gates green: `npm run typecheck` ✅ · `npm run lint` ✅ (0 errors) · `npm run build` ✅ (69 pages prerender).
  - Tracking docs updated: `PROGRESS.md`, `DESIGN_AUDIT.md` §0 status column. Created `CHANGELOG.md`.
