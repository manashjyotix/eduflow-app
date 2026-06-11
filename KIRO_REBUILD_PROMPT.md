# EduFlow — Master Rebuild Prompt for Kiro (or any AI agent)
> **Use this prompt in a new Kiro session to build the production Next.js 15 app from scratch.**
> Updated: June 11, 2026

---

## HOW TO USE THIS PROMPT

1. Open a new Kiro Spec session (or paste this into any AI coding assistant)
2. Attach these files as context: `AGENTS.md`, `VISION.md`, `REBUILD_PLAN.md`, `Design.md`, `Claude.md`
3. Paste the prompt below
4. Let the agent scaffold the project, then work through each phase

---

## THE MASTER PROMPT

---

You are building **EduFlow** — a multi-tenant B2B SaaS for school management — from scratch as a production Next.js 15 application.

### What you are building

EduFlow automates the teacher substitute (proxy) workflow for Indian schools. When a teacher is absent, school management marks the absence, the system auto-assigns proxy (substitute) teachers, those teachers accept or decline, and the entire workflow is audited. The lead demo school is Holy Child English Academy (HCEA), Howly, Barpeta, Assam.

The full product has 6 user roles (Super Admin, Admin, Management, Teacher, Parent, Marketing/Public) with 69 pages total. You will build them in priority order.

### Source of truth documents (read all before writing a single line of code)

1. **AGENTS.md** — complete architecture, design tokens, all 69 pages, mock data, business rules
2. **VISION.md** — full product blueprint and canonical business rules
3. **REBUILD_PLAN.md** — new app structure, component hierarchy, build sequence
4. **Design.md** — visual design reference for all components
5. **Claude.md** — full technical specification
6. **ROADMAP.md** — phase-by-phase build order (this file is canonical on phase order)

### Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS v4 + shadcn/ui PRO V6 design system |
| UI components | shadcn/ui (Radix UI primitives, generated via CLI) |
| Icons | Lucide React only — no other icon libraries |
| CMS / Backend | Payload CMS v3 |
| Database | PostgreSQL (via Railway or Neon) + SQLite for local dev |
| Auth | Payload CMS Auth (role-based: super_admin, admin, management, teacher, parent) |
| Billing | Razorpay Subscriptions (INR) |
| Real-time | Payload CMS Realtime or 10-second polling |
| Notifications | In-app + pluggable SMS (MSG91) / WhatsApp (WATI) / email (SendGrid) |
| Testing | Vitest + Testing Library + Playwright |
| Animations | motion/react (200ms ease-out) |

### Design system: shadcn/ui PRO Variables V6

Apply the two-layer token architecture from the shadcn/ui PRO Variables V6 Figma community file. Map EduFlow's iOS-style brand palette to shadcn semantic tokens in `app/globals.css`:

```css
:root {
  /* EduFlow primitives */
  --ef-brand: #007AFF;         /* iOS blue — primary CTA */
  --ef-green: #34C759;         /* available / success */
  --ef-amber: #FF9500;         /* warning / pending */
  --ef-red:   #FF3B30;         /* danger / absent */
  --ef-purple: #6C63FF;
  --ef-cyan:  #32ADE6;

  /* shadcn semantic bridge (components use these) */
  --radius: 0.875rem;
  --background:    #F2F2F7;
  --foreground:    #000000;
  --card:          #FFFFFF;
  --card-foreground: #000000;
  --primary:       #007AFF;
  --primary-foreground: #FFFFFF;
  --secondary:     #E5E5EA;
  --secondary-foreground: #000000;
  --muted:         #F2F2F7;
  --muted-foreground: rgba(60,60,67,0.60);
  --accent:        #EAF3FF;
  --accent-foreground: #007AFF;
  --destructive:   #FF3B30;
  --destructive-foreground: #FFFFFF;
  --border:        rgba(60,60,67,0.12);
  --input:         #E5E5EA;
  --ring:          #007AFF;
  /* status, charts, sidebar tokens follow in REBUILD_PLAN.md §1.2 */
}
.dark {
  /* iOS dark-mode palette — see REBUILD_PLAN.md §1.2 */
}
```

### Project structure

Follow the structure in REBUILD_PLAN.md §2 exactly. Key points:
- `components/ui/` — shadcn generated components, never edited directly
- `components/shared/` — reusable composites (PageHeader, KpiCard, DataTable, FilterBar, etc.)
- `components/domain/` — domain-specific components (ProxyBoard, AbsenceForm, etc.)
- `app/(app)/` — authenticated app shell with role-namespaced routes
- `app/(marketing)/` — public marketing pages
- `app/(auth)/` — login, signup, onboarding
- `server/` — Payload CMS config and collections

### Component rules (enforce these always)

1. **PageHeader** — every page uses `<PageHeader icon={} title="" subtitle="" actions={} />`. Never hand-roll a page title block.

2. **Button sizes:**
   - Page header CTAs → `size="default"`
   - Table rows / list items → `size="xs"`
   - Icon-only → `size="icon"` or `size="icon-sm"`
   - Marketing hero only → `size="lg"` / `size="xl"`

3. **Tier rule:** Pages import from `components/shared/` and `components/domain/` only. Never import from `components/ui/` directly in pages.

4. **No inline CSS for static layout.** Use Tailwind utilities and shadcn tokens. Inline `style` only for dynamic computed values.

5. **Lucide React only** for icons. Never mix other icon libraries.

6. **Single source of truth for data:**
   - Periods: define once in `lib/constants.ts` → `PERIODS`, `PERIOD_LABELS`, `PERIOD_IDS`
   - Teachers mock data: define once in a seed file
   - Never redeclare the same data inline in multiple files

### The proxy board (core feature — build with care)

The proxy board shows a grid of teachers × periods. Each cell has a colored dot:
- 🟢 `bg-success-foreground` — available, same subject as absent teacher
- 🟡 `bg-warning-foreground` — available, different subject
- ⚫ `bg-muted-foreground` — at daily/weekly/monthly proxy cap
- 🔴 `bg-destructive` — unavailable (in class or declined)

Color is **always** paired with a text label — never color alone (accessibility requirement).

The auto-assign algorithm (scoring logic) is in AGENTS.md §9 / REBUILD_PLAN.md §5. Port it to `lib/proxy-algorithm.ts`.

### Roles and their default routes

| Role | Default route | Access |
|------|--------------|--------|
| super_admin | /super-admin/overview | All routes |
| admin | /admin/dashboard | /admin/* only |
| management | /management/dashboard | /management/* only |
| teacher | /teacher/dashboard | /teacher/* only |
| parent | /parent/dashboard | /parent/* only |

### Database schema (multi-tenant)

Every table has `school_id uuid` for multi-tenancy. Row-level security enforces isolation. Key tables: `schools`, `users`, `teachers`, `classes`, `timetable`, `absences`, `proxy_assignments`, `swap_requests`, `notifications`, `audit_logs`, `subscriptions`. Full schema in Claude.md §7 and PROJECT_BUNDLE.md §4.

### Billing (Razorpay)

Plans: Starter ₹999/mo, Quarterly ₹2,699, Half-Yearly ₹4,999, Annual ₹8,999.
Statuses: `trial` (14 days) → `active` → `grace` (7 days) → `suspended`.
Handle webhooks: subscription.activated, subscription.charged, subscription.halted, subscription.cancelled.

### What to build first (Phase 1 — MVP)

1. Project scaffold (Next.js 15, Tailwind v4, shadcn install, globals.css token bridge)
2. AppShell layout (sidebar + topbar, role-aware nav)
3. Login / signup / onboarding wizard pages
4. Auth (Payload CMS, role-based middleware)
5. Admin dashboard page (KPI cards, proxy status table, activity feed)
6. Teacher CRUD (TeachersPage)
7. Absence workflow: create → approve → reject (AbsenceTrackerPage, AbsenceApprovalPage)
8. Proxy board: availability grid, auto-assign, accept/decline (ProxyBoardPage)
9. School onboarding wizard (5-step)

Do not build features beyond Phase 1 until the MVP is working end-to-end.

### Demo data (seed this first)

**School:** Holy Child English Academy (HCEA) · school_id: sch-hcea · admin@hcea.edu

**Teachers (10):**
Priya Sharma, Rajesh Kalita, Anita Devi, Biju Das, Meena Gogoi,
Dipak Baruah, Sunita Borah, Kamal Nath (inactive), Rima Das, Himanta Bezbaruah

**Periods (7 + tiffin):**
P1 9:30–10:10, P2 10:10–10:50, P3 10:50–11:30, P4 11:30–12:10,
Tiffin 12:10–12:30, P5 12:30–1:10, P6 1:10–1:50, P7 1:50–2:30

**Today's absences:**
- Anita Devi — full day, sick leave, approved
- Dipak Baruah — P1, P2, P3, doctor visit, approved
- Rima Das — full day, family emergency, pending

### Start with this

1. Read all the context documents listed above
2. Scaffold the Next.js 15 project with the correct folder structure
3. Install and configure Tailwind + shadcn/ui with the EduFlow token bridge
4. Build the AppShell (sidebar + topbar)
5. Build the shared components layer (PageHeader, KpiCard, FilterBar, DataTable, EmptyState)
6. Build the Admin Dashboard page as the first real page
7. Confirm the build passes and the page renders correctly before proceeding

---

*Full product details in VISION.md. Full component inventory in AGENTS.md. Full build sequence in REBUILD_PLAN.md. When in doubt, those three files are the source of truth.*
