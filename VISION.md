# EduFlow — Design System & Product Vision
### Master Reference Document (v2.0)
> Updated: May 31, 2026 · Canonical reference — this file wins on all business rules.  
> Use alongside `Claude.md` (full spec), `Design.md` (visual component reference), and `ROADMAP.md` (phase order).

---

## 1. What We Are Building

**EduFlow** is a multi-tenant B2B SaaS for Indian schools, colleges, and educational institutes (CBSE, SEBA, ICSE, State boards). Core problem: when a teacher is absent, management scrambles manually to find a substitute. EduFlow automates the entire workflow — absence reporting → proxy assignment → acceptance/decline → audit trail → monthly reports.

**Lead school:** Holy Child English Academy (HCEA), Howly, Barpeta, Assam.

**Vision:** The world's best school operations platform — the single place schools manage teachers, timetables, absences, swaps, communication, parent engagement, billing, and AI-driven insights.

> **Offline-first strategy:** The app is fully functional offline using Payload CMS + local PostgreSQL (or SQLite for development). When ready, data syncs to a cloud PostgreSQL instance. No dependency on Supabase required. See §13 for the offline/cloud database plan.

---

## 2. Design System — Full Specification

### 2.1 Color Tokens

The design language is **iOS Human Interface Guidelines (HIG)** applied to a web SaaS.

```css
/* ── Brand ── */
--brand:          #007AFF;   /* iOS Blue — primary CTA, active states */
--brand-dark:     #0062CC;   /* Hover / pressed */
--brand-light:    #EAF3FF;   /* Soft fill backgrounds, hover regions */
--brand-mid:      #80BDFF;   /* Mid-tone for charts, gradients */
--brand-muted:    rgba(0,122,255,0.08);

/* ── Semantic ── */
--green:          #34C759;   /* Available · Success · Approved */
--green-light:    #E5F9EC;
--green-dark:     #1A6B30;
--amber:          #FF9500;   /* Warning · Pending · Alt-subject proxy */
--amber-light:    #FFF2D6;
--amber-dark:     #7A4700;
--red:            #FF3B30;   /* Error · Danger · Absent · Suspended */
--red-light:      #FFE8E7;
--red-dark:       #7A1B17;
--purple:         #6C63FF;   /* Humanities · Affiliate tier badges */
--purple-light:   #F0EFFE;
--blue:           #32ADE6;   /* Informational */
--blue-light:     #E3F5FD;

/* ── Neutrals ── */
--gray-50:   #F2F2F7;  --gray-100:  #E5E5EA;  --gray-200:  #D1D1D6;
--gray-400:  #AEAEB2;  --gray-500:  #8E8E93;  --gray-600:  #636366;
--gray-900:  #1C1C1E;

/* ── Surfaces ── */
--content-bg:  #F2F2F7;
--card-bg:     #FFFFFF;
--sidebar-bg:  rgba(255,255,255,0.95);

/* ── Text ── */
--t1:  #000000;                  /* Primary text */
--t2:  rgba(60,60,67,0.60);      /* Secondary / muted */
--t3:  rgba(60,60,67,0.30);      /* Placeholder / disabled */
--sep: rgba(60,60,67,0.12);      /* Dividers */

/* ── Alias Map (legacy pages) ── */
--text: var(--t1);  --text-muted: var(--t2);  --text-light: var(--t3);
--primary: var(--brand);  --primary-light: var(--brand-light);
--warning: var(--amber);  --danger: var(--red);
--border: var(--sep);  --bg: var(--content-bg);  --surface: var(--card-bg);
```

> **Rule:** Never use raw hex values inline. Always use a CSS variable.

---

### 2.2 Typography

**Industry standard for SaaS:** After reviewing Linear, Vercel, Notion, Figma, Loom, and Stripe — **Inter** is the dominant choice. It is neutral, highly legible on screens of all sizes, has excellent number rendering (critical for reports and stats), and is free via Google Fonts.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
font-feature-settings: 'cv11', 'ss01'; /* Stylistic alternates for Inter */
```

| Level | Size | Weight | Letter-Spacing | Use Case |
|---|---|---|---|---|
| Large Title | 34px | 700 | -0.8px | Hero headings |
| Title 1 | 28px | 700 | -0.6px | Page titles |
| Title 2 | 22px | 700 | -0.4px | Section headers |
| Headline | 17px | 600 | — | Card titles |
| Body | 15px | 400 | — | All body text |
| Footnote | 13px | 400 | — | Secondary content |
| Caption | 11px | 600 | +0.06em | UPPERCASE labels, badges |
| Mono | 13px | 400 | — | IDs, timestamps, code |

**Mono stack:** `'SF Mono', 'Geist Mono', ui-monospace, monospace`

---

### 2.3 Spacing, Grid, Radius & Shadows

**4px base unit. Every spacing is a multiple of 4.**

| Token | Value | Use |
|---|---|---|
| `--r-xs` | 4px | Kbd keys, small chips |
| `--r-sm` | 8px | Settings rows, small cards |
| `--r-md` | 12px | Standard cards |
| `--r-lg` | 16px | Large cards, modals |
| `--r-xl` | 20px | Wizard panels |
| `--r-2xl` | 24px | Hero sections |
| `--r-pill` | 100px | Buttons, badges, chips |

| Shadow | Value | Use |
|---|---|---|
| `--sh-xs` | `0 1px 3px rgba(0,0,0,0.06)` | Subtle lift |
| `--sh-sm` | `0 2px 8px rgba(0,0,0,0.08)` | Default card |
| `--sh-md` | `0 4px 20px rgba(0,0,0,0.10)` | Hover state |
| `--sh-lg` | `0 8px 40px rgba(0,0,0,0.14)` | Modals, dropdowns |

---

### 2.4 Layout System

```
┌─────────────────────────────────────────────────┐
│  Sidebar (320px fixed)  │  Main Content Area     │
│  - Logo                 │  - Topbar (sticky)     │
│  - Section labels       │  - .content-inner      │
│  - Role-specific nav    │    └── Page content    │
└─────────────────────────────────────────────────┘
```

- **Mobile < 768px:** Slide-in drawer sidebar, overlay background.
- **Tablet 768–1024px:** 2-column grids, sidebar overlay.
- **Desktop > 1024px:** Full persistent sidebar, multi-column layout.

---

### 2.5 Component Library

#### Buttons
```
.btn-primary    — Brand blue fill — primary CTA
.btn-secondary  — Gray fill — secondary actions
.btn-ghost      — Transparent, brand text
.btn-outline    — Brand border + text
.btn-danger     — Red-light fill, red-dark text (destructive)
.btn-success    — Green-light fill (confirm/approve)
.btn-sm         — 32px height (compact contexts)
.btn-lg         — 48px height (hero / onboarding)
```

#### Badges
| Class | Color | Meaning |
|---|---|---|
| `.badge-green` | Green | Approved / Available / Active |
| `.badge-amber` | Amber | Pending / Warning / Grace |
| `.badge-red` | Red | Rejected / Error / Suspended |
| `.badge-gray` | Gray | Inactive / Past / Maxed Out |
| `.badge-brand` | Blue | Assigned / Primary State |
| `.badge-blue` | Sky Blue | Informational / Notified |
| `.badge-purple` | Purple | Affiliate / Humanities |

#### Proxy Board Availability Dots

| Dot | Meaning |
|---|---|
| 🟢 Green | Available, **same subject** as absent teacher |
| 🟡 Amber | Available, **different subject** (alt proxy) |
| ⚫ Gray | **Maxed out** — at daily/weekly/monthly cap |
| 🔴 Red | **Unavailable** — currently in class or declined |

> Color is **always paired with a text label** — never color alone (accessibility).

#### Domain Components
- `.period-card` — period badge + time + class + subject + assign/edit action
- `.teacher-card` — availability dot + name + subject + action button
- `.notif` — notification row (unread = blue-tinted background)
- `.stat-card` — KPI card with label, value, trend pill
- `.tt-period-row` — timetable builder row
- `.tt-slot-chip` — subject chip in timetable (color-coded by subject type)

---

### 2.6 Dark Mode Strategy

- **Toggle:** User profile → dark mode switch. System preference respected on first load.
- **Implemented from Day 1** using CSS `prefers-color-scheme` + manual `.dark` class.
- Dark surface overrides: `--content-bg → #1C1C1E`, `--card-bg → #2C2C2E`, etc.

---

## 3. Role-by-Role UX Design

### 3.1 Super Admin (You) — God Mode

> Platform owner. You can **read, write, and modify anything** in the entire app — any school, any teacher, any record.

**Key capabilities:**
- Query and modify any school's data using a service-role key (server-side only, never exposed to client).
- Build and deploy **custom logic and algorithms** directly in Payload CMS hooks, access control functions, and custom endpoints.
- **Ghost User:** Super admin can create a hidden "audit user" inside any school. The school sees this as a normal user but the account is flagged internally as a super-admin-controlled auditor. Used when a school reports an issue — silent investigation without disrupting the school.
- **School Creation Flow:** When super admin creates a new school, the system automatically creates an admin account for that school with a temporary password + welcome email. The school admin logs in and is guided through the onboarding wizard.
- Full audit log of every action performed under impersonation or ghost account.

### 3.2 Admin (School IT Manager / Principal)

> **Auto-created when super admin adds a school.** Has full control within their school tenant.

- Onboarding wizard starts automatically on first login (5-step setup).
- Manages teachers, classes, timetable, notification hub, billing, settings.
- **Leave balance is fully configurable** — every school, college, or educational institute can set their own casual/sick/earned/other leave quotas. Admin and management can update these according to the institution's rules at any time.

### 3.3 Management (Office Staff / Vice Principal)

> Daily operations user. Uses the app every morning, 7–9 AM, high-pressure.

**Morning briefing dashboard** shows:
- Today's date, total absences, coverage percentage.
- Uncovered periods highlighted in red.
- **5-minute period countdown timer** ("Period 2 starts in 5 min") — triggers urgency.
- Quick-action: "Auto-Assign All" → AI fills all open slots → sends alerts.

### 3.4 Teacher

> Mobile-first user. Submits leave, views schedule, accepts/declines proxy.

- Large tap targets (≥ 44px). Bottom-sheet modals on mobile.
- Real-time push notification on proxy assignment with one-tap Accept/Decline.
- Can view schedule, submit leave, initiate swaps.

---

## 4. New Modules

### 4.1 Parent Portal 👨‍👩‍👧

**Login:** Unique parent code per student (not email/password). Multi-child support.

| Feature | Detail |
|---|---|
| **Daily Class Journal** | Every period — subject, teacher (or proxy name), topic covered. |
| **Student Leave/Absence** | Parents can submit student leave requests. Admin/management see all student absences with reason and can approve/reject. |
| **Exam Countdown Timer** | Visual countdown widget for upcoming exams + departure time displayed daily. |
| **Student Attendance Track** | Monthly attendance %, visible to admin + management for monitoring. |
| **Progress Notes (per period)** | Teacher selects Class → Section → Student and adds a note: understood well, struggling, misbehaved, participated, fighting, noteworthy. These aggregate into a daily student report visible to parents. |
| **Subject Completion Tracker** | Per-subject syllabus progress bar showing how much is completed per term. |
| **Historical Navigation** | Browse any past school day — who taught what, which teacher was a proxy. |
| **Behavioral Trend** | Weekly/monthly behavior summary graph per student. |
| **Parent Announcements** | One-way: school posts circulars, exam schedules, events → parents see it in-app. |

**Admin / Management Student View:**
- Filter by Class → Section → All Students.
- Per-student detail: attendance, behavior log, leave history, subject notes.

**Teacher Input Flow:**
```
My Classes → [Select Class (e.g., VII)] → [Select Section (e.g., A)]
  → [Select Student (e.g., Rohit Das)]
    → Add Note: [ Understood well ▾ ]  [ Write detail... ]
      → [ Save ]
```

---

### 4.2 AI Integration 🤖

#### Tier 1 — Built-in AI (Free for all plans)
Powered by EduFlow's own key (Mistral / open-source):
- Monthly report summarization.
- At-risk school detection (super admin).

#### Tier 2 — BYO API Key (Premium — school's own key)
- AI report generation (PDF-ready).
- Behavioral pattern insights.
- Timetable optimizer.
- "Chat with your school data."

#### AI Auto-Assign Algorithm (Critical Logic)

When management triggers "Auto-Assign" or the system suggests a proxy, the algorithm follows this strict priority order:

```
Step 1 — FILTER (Hard Rules, cannot be broken):
  ✅ Teacher must have a FREE period at that exact time slot
  ✅ Teacher must not exceed 5 periods total today (timetable + proxy)
  ✅ Teacher must not exceed DAILY proxy cap (per their profile setting)
  ✅ Teacher must not exceed WEEKLY proxy cap (rolling 7 days)
  ✅ Teacher must not exceed MONTHLY proxy cap
  ✅ Teacher must be active (not absent themselves)
  ✅ Teacher must not have a consecutive proxy block (if school setting is ON)

Step 2 — SCORE (Soft ranking, higher = better suggestion):
  +10  Same primary subject as the absent teacher
  +7   Subject is in teacher's secondary subjects list
  +5   Teacher has taught this class/section before (familiarity)
  +4   Teacher is in the same school section (Primary/Middle/High)
  +3   Lowest proxy count today (spreading load fairly)
  +2   Lowest proxy count this week (fairness over time)
  -3   Teacher has declined a proxy in the last 3 days (reliability penalty)
  -5   Teacher is in a different school section entirely

Step 3 — SELECT:
  Top 3 scored teachers shown as suggestions.
  Auto-assign picks #1 automatically.

Step 4 — NOTIFY:
  1. In-app alert to Management + Admin: "Auto-assigned [Teacher] to [Period/Class]. Review if needed."
  2. Push notification to the assigned Teacher: "You have been assigned a proxy class. [Class] [Period] on [Date]. Accept or Decline?"
```

**Settings UI:**
```
Proxy Rules Engine → Auto-Assign
─────────────────────────────────────────
[✅] Enable AI auto-assign suggestions
[✅] Require Management confirmation before notifying teacher
[ ] Fully automatic (notify teacher immediately without confirmation)

Subject match required:  [ Required ▾ ]
Section match required:  [ Preferred ▾ ]
```

---

### 4.3 Exam Routine Module 📋

> Same visual design language as the timetable builder — familiar and consistent.

- Same layout as the timetable builder but for **exam scheduling**.
- Admin can create an exam routine: select date range, class, section, subject, exam time slot.
- Exam routine is viewable by management, teachers, and parents.
- When a date is marked as exam:
  - Proxy board shows **"Exam Mode"** banner.
  - Proxy assignment is disabled unless admin explicitly overrides.
  - Teachers can still be assigned for supervision duty during exam periods.

---

## 5. Business Rules — Complete Reference

| # | Rule | Detail |
|---|---|---|
| 1 | **School Isolation** | Every DB query includes `school_id`. RLS enforces at DB layer. |
| 2 | **Teacher Daily Cap** | Max 5 periods (timetable + proxy) per day. Enforced in builder, proxy engine, and swap approval. |
| 3 | **Proxy Caps (3 levels)** | Each teacher has a **daily cap**, **weekly cap**, and **monthly cap** — all configurable per teacher and overridable by school-wide settings. Proxy board shows gray dot when at cap. Assignment blocked. |
| 4 | **Edit Gate** | Edit action on proxy card shown only while `current_time < period.end_time`. Hidden permanently after period ends. |
| 5 | **Absence pre-condition** | Proxy assignment requires absence to be `approved`. Manual absences by management auto-approve instantly. |
| 6 | **Swap Expiry** | Swap requests expire when **the requested period ends or is currently running** (not a fixed 2-hour timer). Status → `expired`. Requester notified. |
| 7 | **Holiday Block** | Date marked `holiday` → proxy board shows "School Holiday" state. All assignment actions disabled. |
| 8 | **Exam Mode** | Date marked `exam` → "Exam Mode" banner. Assignments disabled unless admin overrides. Teachers can be assigned for supervision. |
| 9 | **Tiffin Supervision** | Tiffin/break periods appear in the timetable builder with distinct styling. Teachers **can be assigned** for class supervision and student management during breaks. |
| 10 | **Trial Gate** | `subscription_status = 'suspended'` → all routes except `/billing` and `/help` redirect to a Suspended page. |
| 11 | **Notification Fallback** | If SMS unconfigured, silently falls back to in-app only. Delivery log shows fallback for admin. |
| 12 | **Audit Log** | Every create, update, delete, status-change writes to `audit_logs`. Non-negotiable. |
| 13 | **Super Admin Access** | Super admin can read, write, and modify **anything** in the platform. Every action is logged with actor, IP, timestamp. Impersonation sessions and ghost accounts are logged separately. |
| 14 | **Leave Balance Config** | Leave quotas (casual, sick, earned, and custom types) are fully configurable per school. Admin and management can update them at any time per institutional rules. |
| 15 | **Timetable Configurability** | Every school, college, or educational institute configures their own timetable — period count, start/end times, break slots, and labels. No hardcoded values. |
| 16 | **QR Code Printing** | Admin and management can generate and **print QR codes** for proxy check-in. PDF/print-ready output. |
| 17 | **Auto Admin Creation** | When super admin creates a new school, an admin account is automatically created and a welcome email is sent with a temporary password. |

---

## 6. School Timetable Structure

> **All times and slots are fully configurable per school, college, or educational institute.** The below is HCEA's default — it is just a starting template.

| Slot | Default Time | Type |
|---|---|---|
| Gate Opens | 8:45 AM | — |
| Morning Prayer | 9:15 – 9:25 AM | Break |
| Period 1 | 9:30 – 10:10 AM | Teaching |
| Period 2 | 10:10 – 10:50 AM | Teaching |
| Period 3 | 10:50 – 11:30 AM | Teaching |
| Period 4 | 11:30 – 12:10 PM | Teaching |
| Tiffin Break | 12:10 – 12:30 PM | Break (Supervision assignable) |
| Period 5 | 12:30 – 1:10 PM | Teaching |
| Period 6 | 1:10 – 1:50 PM | Teaching |
| Period 7 | 1:50 – 2:30 PM | Teaching |
| Departure | 2:30 PM | — |

**Enforced rules (also configurable):**
- Max **5 of 7 teaching periods** per teacher per day (timetable + proxy combined).
- Break/tiffin slots: teachers can be assigned for student supervision.
- Exam routine: overlays the timetable with exam slots on exam dates.

---

## 7. Notification System

### 7.1 Event Types

| Event Key | Recipient | Trigger |
|---|---|---|
| `proxy_assigned` | Teacher | Assigned as proxy |
| `proxy_reminder` | Teacher | **5 minutes** before proxy class starts |
| `proxy_accepted` | Management | Teacher confirms |
| `proxy_declined` | Management | Teacher declines → needs reassignment |
| `absence_submitted` | Management | Teacher self-reports |
| `absence_approved` | Teacher | Absence approved |
| `unassigned_alert` | Management | Period uncovered 5 min before start |
| `auto_assign_done` | Management + Admin | AI auto-assigned a proxy |
| `swap_request_received` | Teacher B | Teacher A requests swap |
| `swap_approved` | Both Teachers | Management approves swap |
| `subscription_expiring` | Admin | 7 days before plan expires |
| `trial_ending` | Admin | 3 days before trial ends |

### 7.2 Channels

| Channel | Cost | Config | Default |
|---|---|---|---|
| **In-app** | **Free — zero cost to EduFlow** (real-time via server push or polling) | None needed | ✅ Always on |
| SMS (MSG91/Twilio) | School pays their own provider | School adds API key | ❌ Off |
| WhatsApp (WATI) | School pays their own provider | School adds WATI key | ❌ Off |
| Email (SendGrid) | School pays their own provider | School adds API key | ❌ Off (ops), ✅ On (billing) |

> **In-app notifications are always free.** EduFlow handles delivery internally with no external API call — this keeps operating costs at zero for in-app. External channels (SMS, WhatsApp, Email) use the school's own API keys and their own budget.

---

## 8. Billing & Affiliate System

### Plans (Razorpay, INR)

| Plan | Duration | Price | Savings |
|---|---|---|---|
| Starter | 1 month | ₹999/mo | — |
| Quarterly | 3 months | ₹2,699 | Save 10% |
| Half-Yearly | 6 months | ₹4,999 | Save 17% |
| Annual | 12 months | ₹8,999 | Save 25% |

- 14-day free trial, no credit card required.
- 7-day grace period after failed payment.
- Statuses: `trial` → `active` → `grace` → `suspended`.

### Affiliate Commission Structure

| Commission Type | Rate | Trigger |
|---|---|---|
| **One-time referral bonus** | **25%** of the referred school's first payment | On successful subscription activation |
| **Lifetime recurring commission** | **5%** of every recurring payment | Every billing cycle, for as long as the school stays subscribed |

**Stop conditions for recurring commission:**
- School unsubscribes.
- School account is deleted.
- When commissions stop, the referring affiliate receives an **in-app notification**: "Recurring commission for [School Name] has ended."

**Tiers (for status and perks, not commission rate change):**

| Tier | Referrals |
|---|---|
| Bronze | 1 – 5 |
| Silver | 6 – 15 |
| Gold | 16+ |

---

## 9. Security Strategy

### 9.1 Database & API Isolation
- **RLS (Row Level Security):** Every table enforces `school_id` at the PostgreSQL layer.
- **API Layer:** Payload CMS access control double-checks `school_id` on every operation.
- **Super admin bypass:** Uses a server-side service-role key. Never exposed to the client.

### 9.2 Authentication
- **Payload CMS Auth:** HTTP-only cookie sessions, short-lived JWTs.
- **Social OAuth:** Google, Apple, Facebook. Tokens never stored — only user profile persisted.
- **Password Policy:** Min 8 characters, bcrypt hashed.
- **Biometric login:** Face ID / Fingerprint via Capacitor on native apps.

### 9.3 API Key Encryption
- School notification keys (MSG91, WATI, SendGrid) encrypted with AES-256 before storage.
- Decryption only happens in the server-side notification dispatch function. Never on the client.

### 9.4 Audit Trail
- Every create / update / delete / status-change → `audit_logs` row with actor, IP, timestamp, metadata.
- Append-only. No update or delete on audit records ever.
- Super admin ghost accounts and impersonation sessions logged separately.

### 9.5 Rate Limiting
- Login: max 10 attempts per 15 minutes per IP → temporary block.
- Notification dispatch: per-school API quota monitored. Alert if cost exceeds threshold.
- Razorpay webhooks: signature verified on every call before processing.

### 9.6 Compliance
- Data residency: `ap-south-1` (Mumbai) for Indian school data.
- Teacher PII (phone, email) never exposed in client-side JS.

---

## 10. Database Strategy — Offline First, Then Cloud

> **The user wants to run EduFlow locally first, then move to the cloud. No mandatory Supabase dependency.**

### Option A: Local Development (Offline)
- **Payload CMS + SQLite** — zero config, file-based, works on any machine.
- Run entirely without internet. Full feature parity for development.
- `DATABASE_URI=file:./eduflow-local.db` (SQLite via Payload's db-sqlite adapter).

### Option B: Self-Hosted Cloud (Free)
- **PostgreSQL on Railway (Free Tier)** — 500MB, sufficient for hundreds of schools in pilot.
- Or **Neon PostgreSQL** (free tier, serverless, cold-start resumable).
- Or **Supabase** (if eventually preferred — same PostgreSQL under the hood).
- Payload CMS connects via `DATABASE_URI=postgresql://...`.

### Migration Path
```
Phase 1: Local SQLite (offline development)
    ↓   Export Payload collections as JSON
Phase 2: Railway / Neon PostgreSQL (cloud, free tier)
    ↓   Apply schema migrations
Phase 3: Upgrade PostgreSQL instance as school count grows
```

### No Supabase Required
- Real-time proxy board: can use **Payload CMS Realtime** (built-in with v3) or a simple polling interval (updates every 10 seconds).
- Authentication: **Payload CMS Auth** handles everything natively.
- File storage: **Local filesystem** (offline) → **Cloudflare R2** (free 10GB/month, S3-compatible, cloud).

### Payload CMS Adapters Summary
| Environment | DB | Storage |
|---|---|---|
| Local / Offline | SQLite (`@payloadcms/db-sqlite`) | Local filesystem |
| Cloud (free) | PostgreSQL via Railway or Neon | Cloudflare R2 |
| Cloud (paid) | Supabase PostgreSQL | Supabase Storage |

---

## 11. Cross-Platform Strategy

| Platform | Approach | Key Features |
|---|---|---|
| Web (Desktop) | Next.js 15, Vercel | Full feature set, responsive layout |
| Web (Mobile Browser) | Responsive CSS, PWA manifest | Mobile-optimized layout |
| iOS | Capacitor native shell | Face ID, push notifications, camera |
| Android | Capacitor native shell | Fingerprint, push notifications, camera |
| iPad / Android Tablet | Same app, ≥ 768px layout | Persistent sidebar, landscape proxy board |

**PWA Features:**
- Service Worker for offline schedule + proxy board.
- "Add to Home Screen" install prompt (`.pwa-install-prompt` component).
- Web Push for management + teacher notifications.
- QR codes for proxy check-in: **printable by admin and management** from the web app.

---

## 12. Full Feature Roadmap

### Phase 1 — Production Foundation
1. Payload CMS setup — users, teachers, classes, timetable collections
2. PostgreSQL / SQLite schema — full schema with RLS (or Payload access control)
3. Auth — Payload CMS Auth + social OAuth (Google, Apple, Facebook)
4. Multi-tenancy — strict `school_id` isolation at API + DB layer
5. Real-time — Payload Realtime or polling for proxy board + notifications
6. Razorpay Billing — plans, webhooks, trial/grace/suspended gates
7. School onboarding wizard — 5-step guided setup; auto-creates admin on school creation

### Phase 2 — Core Features
8. Class Manager — CRUD for classes/sections
9. Expanded Teacher Profile — photo upload, subjects, sections, proxy caps
10. Notification Hub — channel config, API key management, per-event toggles
11. Exam Routine Module — timetable-style layout for exam scheduling
12. Swap System — peer-to-peer exchange with management approval
13. Leave Balance — configurable quotas per school, editable by admin/management
14. Academic Year Management — rollover, archive, fresh session
15. Excel Import — `.xlsx` support + CSV

### Phase 3 — Growth & Communication
16. Parent Portal — student tracking, daily journal, exam countdown, leave requests
17. Affiliate Program — 25% one-time + 5% lifetime, payout queue
18. Bug & Ticket System — in-app reporting → super admin queue
19. Feature Flags — per school / plan tier
20. Announcement Board — school-wide posts with expiry
21. Document Manager — upload circulars, role-filtered visibility
22. Proxy Rules Engine — per-school configurable algorithm & preferences

### Phase 4 — Polish & Scale
23. PWA — service worker, manifest, install prompts
24. Dark Mode — full implementation
25. Multi-Language — English, Assamese, Hindi
26. AI Integration — built-in (free) + BYO API key
27. QR Proxy Check-In — generate, print, scan, mark attendance
28. Native Apps (iOS + Android) — Capacitor shell
29. Status Page — public `/status` with live service uptime
30. Help Center — CMS-managed articles, role-filtered

---

## 13. Senior Designer's Movement — 6 Principles

### 1. Zero-Friction Morning Operations
Management's proxy assignment must take **under 60 seconds**. AI pre-selects the best substitute (subject-match + free period + lowest load). A **5-minute countdown timer** on the proxy board creates urgency without stress.

### 2. Mobile-First for Teachers
Teachers are not at a desk. Every teacher screen is optimized for one-handed mobile use — large tap targets ≥ 44px, bottom-sheet modals, clear status colors.

### 3. Trust Through Transparency
The audit log, delivery log, and proxy history are prominent features, not hidden admin tools. Management can see who did what and when. This builds institutional trust.

### 4. Delight in Details
- Spring animations on modal open/close.
- Skeleton loaders for all data fetches.
- When coverage hits 100%: subtle ✅ green animation on the coverage stat.
- Period countdown shows "5 min" urgency, not just a clock.

### 5. Data Tells the Story
Monthly reports must be beautiful — heatmaps, bar charts, trend lines — something a principal can print and present to a school board with pride.

### 6. Progressive Disclosure
New admins see a simplified, guided wizard. Advanced features (proxy rules, AI config, notification API keys) reveal progressively as familiarity grows. No overwhelming screens on Day 1.

---

*Master Reference v2.0 · May 24, 2026*  
*Updated from review session comments — 14 changes applied.*