# EduFlow — School Management App

**School (demo/lead):** Holy Child English Academy (HCEA), Howly, Barpeta, Assam
**Stack:** Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui PRO V6 tokens · Radix UI · Lucide React · Mongoose/MongoDB · NextAuth v5 · Vitest · Playwright
**Design System:** [shadcn/ui PRO Variables V6.0](https://www.figma.com/community/file/BlFqAE1yNoGDD4IFKyqaIV) — two-layer token architecture

> EduFlow is a multi-tenant B2B SaaS for Indian schools. When a teacher is absent, management scrambles to find a substitute — EduFlow automates the whole workflow: absence reporting → proxy assignment → accept/decline → audit trail → reports.
>
> This repository is the **production Next.js 15 app**. An earlier Vite prototype ("Scholaris") was the design source and has been fully ported (see [`MIGRATION_PLAN.md`](./MIGRATION_PLAN.md)).

---

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Architecture & build sequence: [`ROADMAP.md`](./ROADMAP.md).

```bash
npm run build      # Production build
npm start          # Serve production build
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm test           # Vitest unit tests
npm run test:e2e   # Playwright e2e
npm run seed       # Seed demo data (needs .env.local)
```

Copy `.env.local.example` → `.env.local` and set `MONGODB_URI` + `NEXTAUTH_SECRET` before running `seed` or auth-backed routes.

---

## Roles

| Role | What they see |
|------|---------------|
| 🟣 **Super Admin** | Platform: MRR/ARR, tenants, billing, affiliates, system health |
| 🔵 **Admin** | School ops: proxy board, teachers, students, fees, timetable, analytics, settings |
| 🟠 **Management** | Daily ops: absence approvals, proxy assignment, workload, exams, reports |
| 🟢 **Teacher** | Personal: schedule, proxy accept/decline, leave, attendance |
| 🩷 **Parent** | Child: attendance, journal, exam countdown, fees, report card |
| 🚌 **Driver** | Transport: route, fleet, emergency contacts |
| 🌸 **Marketing** | Public site: landing, features, pricing, signup, onboarding |

## Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@proxymanager.app | super123 |
| Admin | admin@hcea.edu | admin123 |
| Management | mgmt@hcea.edu | mgmt123 |
| Teacher | priya@hcea.edu | teacher123 |
| Parent | parent@hcea.edu | parent123 |

> Demo only — rotate before any real deployment.

---

## Repository Structure

```
src/
  app/            ← App Router: (app)/<role>, (marketing), api/, globals.css
  auth.ts         ← NextAuth v5 config
  components/
    ui/           ← shadcn primitives (32)
    shared/       ← composites (PageHeader, KpiCard, DataTable, StatusBadge, …)
    domain/       ← business components (proxy, absence, timetable, fee, …)
    layout/       ← app-sidebar, topbar, auth-guard, theme-provider
  context/        ← React providers (role, auth, notification, …)
  data/           ← mock data (single source of truth until backend wired)
  hooks/ lib/     ← utilities + zod schemas
  models/         ← Mongoose: School, User, Teacher, Absence, Proxy
  __tests__/      ← unit tests
```

---

## Design System

EduFlow uses the [shadcn/ui PRO Variables V6.0](https://www.figma.com/community/file/BlFqAE1yNoGDD4IFKyqaIV) system with a two-layer token model. The iOS-style brand palette maps to shadcn semantic tokens so components use standard Tailwind utilities.

```
Layer 1 (primitives) →  --ef-brand: #007AFF, --ef-green: #34C759, …
Layer 2 (semantics)  →  --primary, --background, --destructive, …
Tailwind utilities   →  bg-primary, text-foreground, border-border, …
```

Full reference: [`Design.md`](./Design.md) (includes the Figma file build guide) · token source of truth: `src/app/globals.css`.

### Proxy Board Color Coding

| Dot | Meaning |
|-----|---------|
| 🟢 Green | Available, **same subject** as absent teacher |
| 🟡 Amber | Available, **different subject** (alt proxy) |
| ⚫ Gray | **Maxed out** — at daily/weekly/monthly cap |
| 🔴 Red | **Unavailable** — in class or declined |

> Color is **always paired with a text label** — never color alone (WCAG 1.4.1).

---

## Key Documentation

| File | Purpose |
|------|---------|
| [`AGENTS.md`](./AGENTS.md) | AI agent context — architecture, roles, design system, mock data |
| [`VISION.md`](./VISION.md) | Product blueprint + canonical business rules + full technical spec (DB schema, APIs, screens) |
| [`ROADMAP.md`](./ROADMAP.md) | Canonical phase order + architecture & rebuild plan (incl. AI rebuild prompt, migration record) |
| [`AUDIT.md`](./AUDIT.md) | Consolidated audit — build state, security, design, gaps, work log |
| [`Design.md`](./Design.md) | Visual design system reference · Appendix: Figma file build guide |
| [`CHANGELOG.md`](./CHANGELOG.md) | Version history |

---

## Roadmap to Production

See [`ROADMAP.md`](./ROADMAP.md) for the full plan and [`AUDIT.md`](./AUDIT.md) for the current gap analysis.

| Phase | Focus |
|-------|-------|
| **Phase 0** | Prototype completion: dark mode, exam routine, progress notes, QR check-in |
| **Phase 1** | Auth, multi-tenancy, MongoDB wiring, Razorpay billing, onboarding |
| **Phase 2** | Class manager, teacher profiles, notification hub, swap system, Excel import |
| **Phase 3** | Parent portal, affiliate program, announcements, proxy rules engine |
| **Phase 4** | PWA, multi-language, AI integration, QR check-in, native apps |
