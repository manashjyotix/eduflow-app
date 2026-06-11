# EduFlow Project Bundle: AI Context Pack
**Version:** 2.0 (May 2026)
**Target:** AI Coding Assistants (Claude, GPT, Gemini, etc.)

> Use alongside `VISION.md` (product blueprint), `Claude.md` (full spec), and `Design.md` (visual component reference).

---

## 1. Project Overview

**EduFlow** is a multi-tenant B2B SaaS for Indian schools, colleges, and educational institutes (CBSE, SEBA, ICSE, State boards). When a teacher is absent, management scrambles manually to find a substitute. EduFlow automates the entire workflow — absence reporting → proxy assignment → acceptance/decline → audit trail → monthly reports.

**Lead school:** Holy Child English Academy (HCEA), Howly, Barpeta, Assam.

**Vision:** The world's best school operations platform — the single place schools manage teachers, timetables, absences, swaps, communication, parent engagement, billing, and AI-driven insights.

### Core Value Proposition
- **Schools:** Eliminate the morning "proxy scramble." Full coverage in < 60 seconds.
- **Teachers:** Easy leave reporting, proxy accept/decline, peer swap system.
- **Super Admins:** Full platform oversight, billing management, ghost accounts.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| **Design System Repo** | Vite 5 + React 18 + TypeScript + Tailwind CSS v4 + Radix UI + Vitest |
| **Production SaaS** | Next.js 15 (App Router, React 19) — separate repository |
| **Styling** | iOS-style Vanilla CSS Design System v5 + Tailwind CSS v4 |
| **CMS / Auth** | Payload CMS v3 (collections, access control, HTTP-only sessions) |
| **Database** | SQLite (local/offline) → PostgreSQL via Railway/Neon/Supabase (cloud) |
| **Real-time** | Payload CMS Realtime or 10-second polling (no mandatory Supabase) |
| **Billing** | Razorpay Subscriptions (INR) |
| **File Storage** | Local filesystem (offline) → Cloudflare R2 (cloud, free 10 GB/mo) |
| **Native Apps** | Capacitor shell (iOS + Android — Phase 4) |

> **Offline-first strategy:** Payload CMS + SQLite works entirely without internet. When ready, data syncs to cloud PostgreSQL. Supabase is **not required**.

---

## 3. Current Project State

The UI is fully built as a **localStorage prototype** (Phase 4). The task is to wire it to Payload CMS and PostgreSQL.

```text
app/                ← All screens built as prototypes (Next.js App Router)
  globals.css       ← Design System Source of Truth (CSS variables + classes)
components/         ← AppShell, Sidebar (authenticated layout)
lib/
  database.ts       ← Current localStorage API (to be replaced)
  mock-data.ts      ← Full HCEA seed data — 10 teachers, absences, proxies
  supabase.ts       ← Payload/Supabase client stub (ready to wire)
supabase/
  schema.sql        ← Production PostgreSQL schema (reference, not yet connected)
```

---

## 4. Production Database Schema (PostgreSQL / SQLite)

*Key principle: Every table includes `school_id uuid` for multi-tenancy. RLS enforces isolation at DB layer.*

```sql
schools        (id, name, board, subscription_status, plan, plan_expires_at)
users          (id, school_id, teacher_id, role, name, email)
               -- role: super_admin | admin | management | teacher | parent
teachers       (id, school_id, name, subjects, school_sections,
                daily_proxy_cap, weekly_proxy_cap, monthly_proxy_cap)
classes        (id, school_id, class_name, section_name)
timetable      (id, school_id, teacher_id, class_id, day_of_week, period_number)
absences       (id, school_id, teacher_id, date, periods, status, reason)
proxy_assignments (id, school_id, absence_id, proxy_teacher_id,
                   period_number, date, status)
swap_requests  (id, school_id, requester_id, target_id,
                period_number, date, status)
notifications  (id, school_id, user_id, type, message, read, created_at)
subscriptions  (id, school_id, razorpay_id, status, plan, expires_at)
audit_logs     (id, school_id, actor_id, action, entity, metadata,
                ip, created_at)   -- append-only, never updated/deleted
-- Phase 3+
students       (id, school_id, class_id, name, parent_code)
student_notes  (id, school_id, student_id, teacher_id, period_id,
                note_type, detail, created_at)
```

---

## 5. Design System (EduFlow v5 — iOS-style)

### Color Tokens
```css
--brand: #007AFF          /* iOS Blue — primary CTA */
--brand-dark: #0062CC     /* hover/pressed */
--brand-light: #EAF3FF    /* soft fill backgrounds */
--green: #34C759           /* success / available / approved */
--green-light: #E5F9EC
--amber: #FF9500           /* warning / pending */
--amber-light: #FFF2D6
--red: #FF3B30             /* danger / absent / rejected */
--red-light: #FFE8E7
--purple: #6C63FF          /* affiliate / humanities */
--purple-light: #F0EFFE
--content-bg: #F2F2F7      /* page background */
--card-bg: #FFFFFF
--t1: #000000              /* primary text */
--t2: rgba(60,60,67,0.60) /* secondary/muted text */
--t3: rgba(60,60,67,0.30) /* placeholder/disabled */
--sep: rgba(60,60,67,0.12)/* dividers */
```

*Legacy aliases (many pages use these):* `--text`, `--text-muted`, `--primary`, `--warning`, `--danger`, `--border`, `--bg`, `--surface` → all aliased in `globals.css`.

### Typography
**Font:** Inter (Google Fonts) — same as Linear, Vercel, Notion, Stripe.

### Key CSS Classes
```
.card  .btn .btn-primary .btn-secondary .btn-ghost .btn-danger .btn-success .btn-sm
.badge .badge-green .badge-amber .badge-red .badge-gray .badge-brand .badge-purple
.stat-card  .modal-overlay .modal  .topbar  .content-inner  .table-wrapper
.toggle (iOS-switch)  .empty-state  .alert-info .alert-warn .alert-error
```

> Full reference: `Design.md` (component visuals) · `app/globals.css` (CSS source)

---

## 6. AI Auto-Assign Algorithm

When management triggers "Auto-Assign" or the system suggests a proxy:

```
Step 1 — FILTER (hard rules, cannot be broken):
  ✅ Teacher has a FREE period at that exact time slot
  ✅ Not exceeding 5 periods/day (timetable + proxy combined)
  ✅ Not at daily / weekly / monthly proxy cap
  ✅ Not absent themselves
  ✅ No consecutive proxy block (if school setting is ON)

Step 2 — SCORE (soft ranking):
  +10  Same primary subject as absent teacher
  +7   Subject in teacher's secondary subjects
  +5   Has taught this class/section before (familiarity)
  +4   Same school section (Primary/Middle/High)
  +3   Lowest proxy count today (load balancing)
  +2   Lowest proxy count this week (fairness)
  -3   Declined a proxy in the last 3 days (reliability penalty)
  -5   Different school section entirely

Step 3 — SELECT: Top 3 shown as suggestions. Auto-assign picks #1.

Step 4 — NOTIFY:
  → Management + Admin: "Auto-assigned [Teacher] to [Period/Class]."
  → Teacher: Push notification with Accept / Decline action.
```

---

## 7. Business Rules Summary

| # | Rule |
|---|---|
| 1 | Every DB query scoped by `school_id`. RLS enforces at DB layer. |
| 2 | Teacher daily cap: max 5 periods (timetable + proxy) per day. |
| 3 | Three proxy cap levels: daily, weekly, monthly — all configurable per teacher. |
| 4 | Edit gate: proxy card edit hidden permanently after period end time. |
| 5 | Proxy requires absence to be `approved`. Manual absences auto-approve. |
| 6 | Swap requests expire when the requested period ends or is running. |
| 7 | Holiday block: proxy board disabled on holidays. |
| 8 | Exam mode: assignments disabled unless admin overrides. Supervision assignable. |
| 9 | Suspended schools: all routes redirect to `/billing` (except `/help`). |
| 10 | Audit log: every state change written — append-only, never deleted. |
| 11 | Super admin can read/write anything; every action logged with actor + IP. |
| 12 | Leave quotas configurable per school (casual, sick, earned, custom types). |
| 13 | Timetable fully configurable: period count, times, break slots — no hardcoded values. |
| 14 | SMS/WhatsApp/Email use school's own API keys. In-app notifications always free. |
| 15 | QR codes for proxy check-in: printable PDF by admin/management. |

---

## 8. Billing & Plans (Razorpay, INR)

| Plan | Duration | Price |
|---|---|---|
| Starter | 1 month | ₹999/mo |
| Quarterly | 3 months | ₹2,699 |
| Half-Yearly | 6 months | ₹4,999 |
| Annual | 12 months | ₹8,999 |

- 14-day free trial, no credit card required.
- 7-day grace after failed payment.
- Status flow: `trial` → `active` → `grace` → `suspended`.

**Affiliate commissions:** 25% one-time on the referred school's first payment + 5% lifetime recurring on every billing cycle thereafter, for as long as the school stays subscribed.

> Tiers (Bronze: 1–5 referrals, Silver: 6–15, Gold: 16+) affect status and perks only — not the commission rate.

---

## 9. Feature Roadmap

| Phase | Key Deliverables |
|---|---|
| **Phase 1** | Payload CMS setup, PostgreSQL schema, Auth (social OAuth), multi-tenancy, Razorpay billing, onboarding wizard |
| **Phase 2** | Class manager, expanded teacher profile, notification hub, exam routine, swap system, leave balance, Excel import |
| **Phase 3** | Parent portal, affiliate program, announcement board, proxy rules engine, document manager |
| **Phase 4** | PWA, dark mode, multi-language, AI integration, QR check-in, native iOS/Android apps |

---

## 10. How to Help (Prompt Template)

> "I am working on EduFlow, a school proxy manager for Indian schools. We are moving from a localStorage prototype to a Payload CMS + PostgreSQL production build. I have provided `PROJECT_BUNDLE.md` (architecture), `VISION.md` (full product blueprint), and `Design.md` (visual system). Please help me implement [FEATURE] while strictly adhering to the iOS-style design system, multi-tenant schema, and the business rules in §7."

---

## 11. Useful References

| File | Purpose |
|---|---|
| `VISION.md` | Master product & design blueprint (600+ lines) |
| `Claude.md` | Full technical specification |
| `Design.md` | Visual component reference (~160KB) |
| `AGENTS.md` | AI agent context file (architecture, auth, CSS tokens) |
| `app/globals.css` | Design system CSS source of truth |
| `supabase/schema.sql` | Production PostgreSQL schema |

**Local dev (design system):** `npm run dev` → [http://localhost:5173](http://localhost:5173)
**Local dev (production app):** `npm run dev` → [http://localhost:3000](http://localhost:3000)