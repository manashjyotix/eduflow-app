# EduFlow — Full Project Specification
### For: Anti Gravity Development Agency
### Version: 2.0 — May 2026
### Prepared by: EduFlow (Howly, Assam, India)

---

> **Context for the agency.** A high-fidelity functional prototype already exists (built in React with localStorage). All UI screens are designed, most interactions are wired, and the visual design system is established. Your primary job is to take this prototype to a production-grade, multi-tenant SaaS with a real database, real auth, real billing, and all the features listed in this document. Every section is final unless marked `[TBD]`.

---

## Table of Contents

1. [Product Identity](#1-product-identity)
2. [Current Prototype Status](#2-current-prototype-status)
3. [Tech Stack](#3-tech-stack)
4. [SaaS & Billing Model](#4-saas--billing-model)
5. [Role Specifications](#5-role-specifications)
   - 5.1 [Super Admin](#51-super-admin)
   - 5.2 [Admin](#52-admin)
   - 5.3 [Management](#53-management)
   - 5.4 [Teacher](#54-teacher)
6. [Period Swap System](#6-period-swap-system)
7. [Database Schema](#7-database-schema)
8. [API Integrations](#8-api-integrations)
9. [Notification System](#9-notification-system)
10. [Design System](#10-design-system)
11. [School Timetable Structure](#11-school-timetable-structure)
12. [Screen Inventory](#12-screen-inventory)
13. [Business Rules & Logic](#13-business-rules--logic)
14. [Build Phases & Priority Order](#14-build-phases--priority-order)

---

## 1. Product Identity

| Field | Value |
|---|---|
| **Product name** | EduFlow |
| **Tagline** | Smart substitute management for modern schools. |
| **Type** | Multi-tenant B2B SaaS |
| **Lead/demo school** | Holy Child English Academy (HCEA), Howly, Barpeta, Assam, India |
| **Target market** | Schools across India (CBSE, SEBA, ICSE, State boards) |
| **Billing currency** | INR via Razorpay |
| **Primary language** | English (Assamese + Hindi as phase 2 additions) |

**Core problem solved:** When a teacher is absent, school management scrambles to find a substitute, manually checks who is free, and the process is chaotic and undocumented. EduFlow automates the entire workflow — absence reporting, proxy assignment, acceptance/decline, real-time board tracking — and produces a clean audit trail and monthly report.

---

## 2. Current Prototype Status

The following are **already built** in the prototype (React + localStorage). The agency inherits this UI and wires it to a real backend.

| Screen / Feature | Status | Notes |
|---|---|---|
| Login screen (all roles) | ✅ Built | iOS-style inputs, social login buttons wired to UI only |
| Management dashboard | ✅ Built | Stats cards, today's absences, proxy status |
| Absence management | ✅ Built | Multi-period approval, time-gated edit actions |
| Proxy Assignment Board | ✅ Built | Colour-coded board, quick-assign modals, class labels |
| Teacher schedule view | ✅ Built | Weekly/daily toggle, proxy highlights |
| Leave application form | ✅ Built | Period picker, category select |
| Monthly reports | ✅ Built | Recharts heatmap, PDF-ready UI |
| Audit log viewer | ✅ Built | Full history, role filters |
| Notification center | ✅ Built | In-app alerts, read/unread |
| Teacher directory | ✅ Built | CRUD with iOS-style expanded fields |
| Data import (CSV) | ✅ Built | Working; Excel in progress |
| System settings | ✅ Built | iOS-style toggle groups |
| Table Builder | ✅ Built | D&D rows/cols, proportional heights, tiffin slots |
| Super Admin dashboard | ✅ Built | Revenue, school list, coupon system, soft-delete/restore |
| Command palette (⌘K) | ✅ Built | Global search across teachers, classes, pages |
| Class Manager | 🔲 To build | Admin CRUD for classes & sections |
| Expanded teacher profile | 🔲 To build | Photo upload, subjects/sections/classes checkboxes |
| Billing screen | 🔲 To build | Razorpay plans, current plan, upgrade flow |
| School onboarding wizard | 🔲 To build | 5-step guided setup |
| Notification hub | 🔲 To build | API key management, channel config per event |
| Swap system | 🔲 To build | Peer-to-peer period swap with approval flow |
| Affiliate dashboard | 🔲 To build | Referral links, commission tracking |
| Bug/ticket system | 🔲 To build | In-app bug reporting → super admin queue |
| Help & support center | 🔲 To build | CMS-managed articles at `/help` |
| PWA / mobile | 🔲 To build | Service worker, manifest, install prompts |
| Dark mode | 🔲 To build | Full light/dark toggle in profile |

**What needs to be replaced:**
- `localStorage` → PostgreSQL via Supabase
- Mock auth → Payload CMS Auth (+ social OAuth)
- Static mock data → Live Payload CMS collections
- No real-time → Supabase Realtime for proxy board

---

## 3. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | Next.js 15 (App Router) | Deployed on Vercel |
| **Styling** | Tailwind CSS | Core utility classes only — no arbitrary values |
| **Animation** | motion/react | 200ms ease-out cards, spring modals |
| **Icons** | Lucide React | Used throughout — do not mix icon libraries |
| **CMS / Backend** | Payload CMS 3.x | Self-hosted on Railway or Render Pro |
| **Database** | PostgreSQL via Supabase | Multi-tenant, row-level security via `school_id` |
| **Auth** | Payload CMS Auth | Roles: `super_admin` / `admin` / `management` / `teacher` |
| **Social Auth** | NextAuth.js adapters | Google, Apple, Facebook OAuth |
| **Billing** | Razorpay Subscriptions API | INR, 4 plan tiers |
| **Real-time** | Supabase Realtime | Proxy board live updates, notification push |
| **Notifications** | In-app (Supabase) + pluggable APIs | SMS, WhatsApp, email added via school's own API keys |
| **File import** | papaparse (CSV) + xlsx (Excel) | Admin seeds DB from school data |
| **PDF export** | Puppeteer or react-pdf | Monthly reports, daily proxy sheets |
| **Storage** | Supabase Storage | Teacher profile photos, school logos, documents |
| **Email (platform)** | Resend or SendGrid (EduFlow's key) | Platform emails: trial alerts, billing, welcome |

---

## 4. SaaS & Billing Model

### Tenant structure

- Every school is a **tenant** identified by a `school_id` (uuid).
- All tables carry `school_id` as a non-nullable foreign key.
- Row-Level Security (RLS) enforced at the Supabase/PostgreSQL layer.
- `super_admin` is outside school tenants — EduFlow staff only.

### Subscription plans (Razorpay)

| Plan | Duration | Price (INR) | Discount |
|---|---|---|---|
| Starter | 1 month | ₹999/mo | — |
| Quarterly | 3 months | ₹2,699 | Save 10% |
| Half-Yearly | 6 months | ₹4,999 | Save 17% |
| Annual | 12 months | ₹8,999 | Save 25% |

### Billing rules

- **14-day free trial** on signup — no credit card required.
- Trial ends → admin must select a plan → Razorpay checkout.
- **Grace period:** 7 days after a failed payment before access is suspended.
- Subscription status values: `trial` | `active` | `grace` | `suspended`.
- Razorpay webhook events to handle: `subscription.activated`, `subscription.charged`, `subscription.halted`, `subscription.cancelled`.
- Admin receives in-app + email alerts: 7 days before expiry, 3 days before trial ends.

### Affiliate program

- Every school admin gets a unique referral link from their billing screen.
- Referral tiers: Bronze (1–5 referrals) / Silver (6–15) / Gold (16+). Tiers affect status and perks only — not the commission rate.
- Commission: **25% one-time** on the referred school's first payment + **5% lifetime recurring** on every billing cycle, for as long as the school stays subscribed.
- Recurring commission stops when the school unsubscribes or is deleted. Affiliate is notified in-app.
- Super admin approves payout requests (UPI or bank transfer).
- Affiliate dashboard: clicks, signups, conversions, commission earned, payout history.

### Coupon system (super admin)

- Create discount codes: percentage or flat amount.
- Constraints per coupon: expiry date, max uses, plan restriction, school-specific lock.
- Super admin can toggle (enable/disable) any coupon.
- Coupon usage log: which school used it, when, and plan purchased.

---

## 5. Role Specifications

### 5.1 Super Admin

> EduFlow staff only. No school-level operations. Platform oversight, growth, and support.

#### Revenue & analytics dashboard

- MRR and ARR with month-over-month growth rate.
- Churn rate and LTV per plan tier.
- Trial-to-paid conversion rate by cohort (signup month).
- Plan mix donut chart: distribution across 1m / 3m / 6m / 12m.
- Revenue by state and board type (CBSE / SEBA / ICSE / State) — map or table view.
- School health score per tenant: composite of daily active users, proxy board usage, timetable completion, and absence log activity.
- AI-flagged at-risk schools: low engagement + billing issues → predicted churn within 30 days.

#### School management

- Paginated school list with filters: status, plan, board, state, health score, signup date.
- Per-school detail: users, usage stats, subscription history, audit log.
- Soft delete + restore with full audit trail.
- Manual grace period extension or shortening per school (edge-case support).
- Free tier toggle: grant permanent free access (NGOs, pilot partners, HCEA).
- Impersonation mode: view any school as that school's admin — read-only, all actions logged.
- Onboarding tracker: see completion % per school across the 5-step wizard. Flag stuck schools.
- Custom plan builder: create bespoke pricing for district-level or large institution deals.

#### Growth & operations

- Affiliate dashboard: all affiliates, clicks, conversions, commissions, payout queue.
- Coupon engine: create, edit, toggle, expire codes. Full usage log.
- Broadcast announcements: send in-app messages to all schools, filtered by plan/status/board.
- Changelog manager: push release notes visible inside each school's app. No code deploy needed.
- Bug & ticket system: schools report bugs in-app → appear in super admin queue with priority triage, status tracking, and resolution notes.
- Feature flags: toggle beta features per school or per plan tier without code deployment.
- Platform-level audit log: every super admin action logged with actor, IP, timestamp, entity.
- API usage monitor: track notification API calls (SMS/WhatsApp/email) per school — detect abuse or runaway costs.
- Status page: public `/status` route showing uptime per service (DB, auth, real-time, billing).

---

### 5.2 Admin

> Full control within their school tenant. Configures everything. Login: web + mobile (PWA).

#### Teacher management

- Add, edit, deactivate teachers.
- Fields: name, photo (upload to Supabase Storage), email, phone.
- Subjects taught (multi-checkbox — school defines subject list).
- School sections allowed: Pre-Primary | Primary | Middle School | High School (multi-checkbox).
- Classes assigned (multi-checkbox, populated from school's class list).
- Max proxy duties per month (default 5, configurable per teacher).
- Bulk import: CSV or Excel upload with column mapping UI and error-row highlighting.
- Export teacher list as CSV or Excel.

#### Management & user management

- Add and remove management-role users.
- View all users per role with last-login timestamps.

#### Class manager

- Define classes: `class_name` (e.g. "Class VII"), `class_numeral` (e.g. "VII"), `section_name` (e.g. "A"), `school_section` group.
- Example for HCEA: Pre-Primary (Nursery, LKG, UKG) → Primary (Class I–V) → Middle School (Class VI–VIII) → High School (Class IX–X).
- Full CRUD. Changes propagate to timetable and proxy board immediately.

#### Table builder (timetable)

- Drag-and-drop period rows and day columns.
- Proportional row heights based on period duration.
- Tiffin/break slots with distinct visual styling.
- Teacher daily cap enforced: max 5 of 7 periods per teacher per day. Builder blocks assigning a 6th period.
- Period assignment shows class/section and subject.

#### Proxy board (read + approve)

- Same board as management. Admin can assign and approve all proxy operations.
- See §5.3 Management for full proxy board spec.

#### School calendar

- Mark holidays, exam weeks, half-days, and school events.
- Holidays automatically block proxy assignment for that date.
- Exam mode: mark exam dates → proxy board shows "Exam Mode" banner → assignment UI disabled.

#### Academic year management

- Set academic year start and end dates.
- Year rollover: archive previous year's absence and proxy data. Fresh timetable and leave balances for new session.

#### Proxy rules engine

Admin configures per-school rules that the proxy assignment engine respects:

- Minimum match requirement: subject-match required or any available teacher.
- Preference order: same section first → same subject first → seniority → alphabetical.
- Max proxies per day (global school setting, overrides per-teacher setting if lower).
- Block same teacher from two consecutive proxy periods (optional toggle).
- Substitute pool: mark external/ad-hoc substitutes (non-staff) available for emergency coverage.

#### Notification hub

Admin configures which channels are active and adds API keys. EduFlow never stores keys in plaintext — encrypted at rest.

| Channel | Integration | Admin action |
|---|---|---|
| In-app | Supabase Realtime | Always on — no config needed |
| SMS | MSG91 or Twilio | Add API key + sender ID |
| WhatsApp | WATI (WhatsApp Business API) | Add WATI API key + template IDs |
| Email | SendGrid | Add SendGrid API key + sender email |

- Per-event toggle: choose which channels fire for each notification type (see §9).
- Per-role toggle: which roles receive which events.
- Delivery log: every notification sent — channel, recipient, status (delivered/failed/bounced), timestamp.
- Cost estimator: approximate SMS/WhatsApp cost per month based on current usage patterns (shown in notification hub, for informational purposes).

#### Reporting & data

- Monthly proxy summary with Recharts heatmaps and bar charts.
- Teacher performance report: absence frequency, proxy count, subject load, and trend over time.
- Export any table (absences, proxies, teachers, audit log) as CSV or Excel.
- PDF export: monthly report, daily proxy sheet. Puppeteer-rendered, print-ready.
- Audit log viewer with filters: role, actor, action type, date range.

#### School settings

- School profile: name, board, UDISE code, principal name, logo, address.
- School timings: gate open/close, prayer slot, period durations, tiffin break — all configurable.
- Leave balance config: set casual, sick, and earned leave quotas per staff type per academic year.
- Announcement board: post school-wide announcements visible to all roles on their dashboard.
- Document manager: upload and share circulars, handbooks, and policies with staff.
- Backup & restore: manual data snapshot. Restore with super admin assistance.

#### Billing screen

- View current plan, expiry date, and payment history.
- Upgrade or downgrade plan — Razorpay checkout opens in a modal or new tab.
- Cancel subscription with confirmation and grace period information.
- Affiliate referral link and commission dashboard.
- Apply coupon code.

---

### 5.3 Management

> Daily proxy operations. Manages all absence and assignment workflows. Login: web + mobile (PWA).

#### Core daily operations

- Approve or reject teacher-submitted absences with optional rejection reason.
- Manually mark a teacher absent (source logged as `manual`).
- Add and remove teacher-role users from the school.
- View the full proxy assignment board (spec below).
- View all teachers' weekly and daily schedules. Spot conflicts and free periods instantly.
- View and export monthly reports and PDF.
- View audit log (same as admin, read-only).

#### Morning briefing view

One-page dashboard, first thing on login:

- Today's date, day of week.
- Total absences today (pending + approved).
- Coverage score: real-time percentage of today's periods covered. Visual indicator, target 100%.
- Priority queue: uncovered periods with < 30 minutes to start, highlighted in red.
- Quick-action buttons: "Assign all unassigned" opens a bulk assignment modal.

#### Proxy assignment board

- One card per unassigned period of each absent teacher.
- Card shows: `[Period number]  Time  |  Class: VII – A  ·  Subject`.
- Colour coding:
  - 🟢 Green badge: available teacher, same subject.
  - 🟡 Amber badge: available teacher, different subject.
  - ⚫ Gray badge: teacher maxed out (cannot assign today).
  - 🔴 Red badge: teacher currently in another class / unavailable.
- One-tap assign: select teacher → card confirms → teacher notified instantly via Supabase Realtime.
- Edit action: shown only if current time is before the period's end time. Hidden after period ends.
- Bulk assignment: select multiple unassigned periods → assign same proxy teacher to all.
- Conflict detector: flags if selected teacher is already assigned or timetabled in an overlapping period.

#### Swap request management

- Swap inbox: all pending peer swap requests in one queue.
- Approve or reject with one tap. Optional note on rejection.
- Initiate a swap on behalf of two teachers (management-initiated swap skips peer notification, goes straight to assignment update).
- Swap history log: all approved/rejected swaps, searchable by teacher and date.

#### Enhanced tools

- Quick notify: send a one-off message to a specific teacher via any configured channel.
- Print daily sheet: one-page printable proxy assignment sheet for the staffroom noticeboard.
- End-of-day summary: auto-generated summary — absences received, assignments made, declines, uncovered periods. Viewable in reports.
- Notes on records: internal notes on absence or proxy records, visible only to management and admin.
- Availability heatmap: weekly view showing which teachers are most/least burdened. Helps spread proxy load fairly.

---

### 5.4 Teacher

> Self-service absence and schedule management. Receive and respond to proxy duties. Login: web + mobile (PWA).

#### Absence reporting

- Self-report absence: full day or specific periods.
- Reason categories: sick, personal, family, training, official duty, other.
- Submitted to management for approval. Teacher sees pending/approved/rejected status.
- View leave balance: remaining casual, sick, and earned leave for the academic year.

#### Schedule & proxy

- My schedule: daily and weekly view. Shows class name, section, Roman numeral label, subject, and time.
- Proxy assignments highlighted in a distinct colour.
- Accept or decline assigned proxy duty from the in-app notification or the schedule card.
- Decline requires a reason (shown to management).
- If declined, management is alerted and must reassign.
- Proxy history: all past proxy duties — date, class, subject, outcome (completed/declined).

#### Period swap system

Full spec in §6.

#### Productivity features

- Recurring unavailability: mark a recurring slot (e.g. every Friday Period 6) as unavailable for proxy. Management sees this on the board.
- Workload view: weekly chart — periods taught, proxy duties, and load vs. school average.
- QR proxy check-in: scan QR code on classroom door to mark attendance for proxy class. `[TBD - Phase 2]`
- Notification preferences: control which alert types to receive and on which channels (in-app, SMS, WhatsApp). Cannot turn off in-app.

#### Profile

- View and update: name, photo, email, phone.
- Language preference (English / Assamese / Hindi — Phase 2).
- Change password.
- Dark mode toggle.

#### Help

- Access to in-app help center at `/help` — filtered to teacher-relevant articles first.
- Submit a support ticket in-app.

---

## 6. Period Swap System

The swap system allows teachers to request period exchanges with peers. Management or Admin hold final approval authority.

### Swap types

| Type | Description |
|---|---|
| Single period swap | Teacher A's Period 3 ↔ Teacher B's Period 3 (same day) |
| Half-day swap | All morning or afternoon periods for the day |
| Full-day swap | Teacher A's entire day covered by Teacher B |
| Free period offer | Teacher volunteers a free period for any colleague to pick up (posted to a shared pool) |

### Full workflow

```
1. Teacher A opens their schedule and taps a period they want to swap.

2. The app shows eligible teachers for that period:
   - Has a free slot at the same time (not timetabled, not already assigned).
   - Has not reached their daily proxy cap.
   - Is in an eligible section (based on timetable config).

3. Teacher A selects Teacher B, adds an optional note, and sends the request.

4. Teacher B receives an in-app notification (+ configured channels):
   "Teacher A has requested a period swap for [Period] on [Date]. Period: VII-A · English."
   Teacher B sees which period they are being asked to cover and taps Accept or Decline.

5a. If ACCEPTED → Management/Admin receive an approval notification:
    "Teacher A and Teacher B have agreed to swap [Period] on [Date]. Approve?"
    Management taps Approve or Reject.

5b. If DECLINED → Teacher A is notified. They may request a different teacher.

6. On final approval → timetable and proxy board update instantly (Supabase Realtime).
   Both teachers receive a confirmation notification.
   Swap is logged in the audit trail.
```

### Who can initiate

| Role | Can initiate | Notes |
|---|---|---|
| Teacher | Yes | Standard peer-to-peer flow above |
| Management | Yes | Skips peer notification — goes directly to timetable update (management-initiated swaps are trusted) |
| Admin | Yes | Same as management |

### Business rules for swaps

- A swap request expires when the requested period ends or is currently running (not a fixed timer). Status → `expired`. Requester notified.
  - A teacher cannot have more than 3 pending outgoing swap requests simultaneously.
- Swaps are logged in `swap_requests` table (see §7) and reflected in the audit log.
- Approved swaps count toward each teacher's proxy tally for the month (configurable via proxy rules engine).

---

## 7. Database Schema

All tables include `school_id uuid NOT NULL` for multi-tenant isolation. Row-Level Security (RLS) enforced in Supabase.

```sql
schools (
  id                        uuid PRIMARY KEY,
  name                      text NOT NULL,
  address                   text,
  board                     text,                    -- 'CBSE' | 'SEBA' | 'ICSE' | 'State'
  logo_url                  text,
  subscription_status       text,                    -- 'trial' | 'active' | 'grace' | 'suspended'
  trial_ends_at             timestamptz,
  razorpay_subscription_id  text,
  plan                      text,                    -- '1m' | '3m' | '6m' | '12m' | 'free'
  plan_expires_at           timestamptz,
  health_score              int,                     -- 0–100, computed nightly
  referral_code             text UNIQUE,             -- affiliate referral code
  referred_by               uuid REFERENCES schools(id),
  created_at                timestamptz DEFAULT now()
)

classes (
  id              uuid PRIMARY KEY,
  school_id       uuid NOT NULL REFERENCES schools(id),
  class_name      text NOT NULL,                     -- 'Class VII'
  class_numeral   text,                              -- 'VII'
  section_name    text,                              -- 'A' | 'B' | 'Science'
  school_section  text,                              -- 'Pre-Primary'|'Primary'|'Middle School'|'High School'
  sort_order      int DEFAULT 0,
  created_at      timestamptz DEFAULT now()
)

subjects (
  id          uuid PRIMARY KEY,
  school_id   uuid NOT NULL REFERENCES schools(id),
  name        text NOT NULL,                         -- 'English', 'Mathematics', etc.
  created_at  timestamptz DEFAULT now()
)

teachers (
  id                    uuid PRIMARY KEY,
  school_id             uuid NOT NULL REFERENCES schools(id),
  name                  text NOT NULL,
  photo_url             text,
  email                 text,
  phone                 text,
  subjects              text[],                      -- ['English', 'History']
  school_sections       text[],                      -- ['Middle School', 'High School']
  class_ids             uuid[],                      -- FK refs → classes
  is_active             boolean DEFAULT true,
  max_proxies_per_month int DEFAULT 5,
  leave_casual          int DEFAULT 10,
  leave_sick            int DEFAULT 7,
  leave_earned          int DEFAULT 15,
  created_at            timestamptz DEFAULT now()
)

timetable (
  id            uuid PRIMARY KEY,
  school_id     uuid NOT NULL REFERENCES schools(id),
  teacher_id    uuid NOT NULL REFERENCES teachers(id),
  class_id      uuid NOT NULL REFERENCES classes(id),
  day_of_week   int NOT NULL,                        -- 1=Mon ... 6=Sat
  period_number int NOT NULL,                        -- 1–7
  subject       text NOT NULL,
  created_at    timestamptz DEFAULT now(),
  UNIQUE (school_id, class_id, day_of_week, period_number)
)

school_periods (
  id              uuid PRIMARY KEY,
  school_id       uuid NOT NULL REFERENCES schools(id),
  period_number   int NOT NULL,                      -- 1–7 or 0 for break
  label           text,                              -- 'Period 1' | 'Tiffin Break'
  start_time      time NOT NULL,
  end_time        time NOT NULL,
  is_break        boolean DEFAULT false,
  sort_order      int DEFAULT 0
)

school_calendar (
  id          uuid PRIMARY KEY,
  school_id   uuid NOT NULL REFERENCES schools(id),
  date        date NOT NULL,
  type        text NOT NULL,                         -- 'holiday' | 'exam' | 'halfday' | 'event'
  label       text,
  UNIQUE (school_id, date)
)

absences (
  id            uuid PRIMARY KEY,
  school_id     uuid NOT NULL REFERENCES schools(id),
  teacher_id    uuid NOT NULL REFERENCES teachers(id),
  date          date NOT NULL,
  periods       int[],                               -- null = full day, [3,4,5] = specific
  reason        text,
  reason_category text,                              -- 'sick'|'personal'|'family'|'training'|'official'|'other'
  source        text NOT NULL,                       -- 'app' | 'manual'
  status        text NOT NULL DEFAULT 'pending',     -- 'pending'|'approved'|'rejected'
  rejection_reason text,
  reported_by   uuid REFERENCES users(id),
  approved_by   uuid REFERENCES users(id),
  created_at    timestamptz DEFAULT now()
)

proxy_assignments (
  id                uuid PRIMARY KEY,
  school_id         uuid NOT NULL REFERENCES schools(id),
  absence_id        uuid NOT NULL REFERENCES absences(id),
  proxy_teacher_id  uuid NOT NULL REFERENCES teachers(id),
  class_id          uuid NOT NULL REFERENCES classes(id),
  period_number     int NOT NULL,
  date              date NOT NULL,
  status            text NOT NULL DEFAULT 'assigned', -- 'assigned'|'accepted'|'declined'|'completed'
  decline_reason    text,
  assigned_by       uuid REFERENCES users(id),
  assigned_at       timestamptz DEFAULT now(),
  notified_at       timestamptz,
  is_swap           boolean DEFAULT false
)

swap_requests (
  id                  uuid PRIMARY KEY,
  school_id           uuid NOT NULL REFERENCES schools(id),
  requester_id        uuid NOT NULL REFERENCES teachers(id),
  target_id           uuid NOT NULL REFERENCES teachers(id),
  period_number       int NOT NULL,
  date                date NOT NULL,
  swap_type           text NOT NULL,                 -- 'single'|'half_day'|'full_day'|'free_offer'
  note                text,
  status              text NOT NULL DEFAULT 'pending', -- 'pending'|'accepted'|'declined'|'approved'|'rejected'|'expired'
  peer_responded_at   timestamptz,
  management_action_by uuid REFERENCES users(id),
  management_actioned_at timestamptz,
  expires_at          timestamptz,                   -- 2 hours after creation
  created_at          timestamptz DEFAULT now()
)

leave_balances (
  id          uuid PRIMARY KEY,
  school_id   uuid NOT NULL REFERENCES schools(id),
  teacher_id  uuid NOT NULL REFERENCES teachers(id),
  year        int NOT NULL,
  casual_used int DEFAULT 0,
  sick_used   int DEFAULT 0,
  earned_used int DEFAULT 0,
  UNIQUE (school_id, teacher_id, year)
)

subscriptions (
  id                        uuid PRIMARY KEY,
  school_id                 uuid NOT NULL REFERENCES schools(id),
  razorpay_subscription_id  text NOT NULL,
  plan                      text NOT NULL,           -- '1m'|'3m'|'6m'|'12m'
  status                    text NOT NULL,           -- 'created'|'active'|'halted'|'cancelled'
  current_start             timestamptz,
  current_end               timestamptz,
  created_at                timestamptz DEFAULT now()
)

affiliates (
  id              uuid PRIMARY KEY,
  school_id       uuid NOT NULL REFERENCES schools(id),
  referral_code   text UNIQUE NOT NULL,
  tier            text DEFAULT 'bronze',             -- 'bronze'|'silver'|'gold'
  total_referrals int DEFAULT 0,
  total_earned    numeric(10,2) DEFAULT 0,
  created_at      timestamptz DEFAULT now()
)

affiliate_payouts (
  id            uuid PRIMARY KEY,
  affiliate_id  uuid NOT NULL REFERENCES affiliates(id),
  amount        numeric(10,2) NOT NULL,
  method        text,                                -- 'upi'|'bank'
  status        text DEFAULT 'pending',              -- 'pending'|'approved'|'paid'|'rejected'
  approved_by   uuid REFERENCES users(id),
  requested_at  timestamptz DEFAULT now(),
  paid_at       timestamptz
)

coupons (
  id            uuid PRIMARY KEY,
  code          text UNIQUE NOT NULL,
  type          text NOT NULL,                       -- 'percentage'|'flat'
  value         numeric(10,2) NOT NULL,
  plan_lock     text,                                -- null = any plan, or '1m'|'3m' etc.
  school_lock   uuid REFERENCES schools(id),         -- null = any school
  max_uses      int,
  used_count    int DEFAULT 0,
  is_active     boolean DEFAULT true,
  expires_at    timestamptz,
  created_at    timestamptz DEFAULT now()
)

coupon_uses (
  id          uuid PRIMARY KEY,
  coupon_id   uuid NOT NULL REFERENCES coupons(id),
  school_id   uuid NOT NULL REFERENCES schools(id),
  plan        text NOT NULL,
  used_at     timestamptz DEFAULT now()
)

notifications (
  id            uuid PRIMARY KEY,
  school_id     uuid NOT NULL REFERENCES schools(id),
  recipient_id  uuid NOT NULL REFERENCES users(id),
  type          text NOT NULL,                       -- see §9
  channel       text NOT NULL,                       -- 'in_app'|'sms'|'whatsapp'|'email'
  message       text NOT NULL,
  is_read       boolean DEFAULT false,
  status        text DEFAULT 'sent',                 -- 'sent'|'delivered'|'failed'|'bounced'
  sent_at       timestamptz DEFAULT now()
)

notification_settings (
  id            uuid PRIMARY KEY,
  school_id     uuid NOT NULL REFERENCES schools(id),
  event_type    text NOT NULL,                       -- notification type key
  in_app        boolean DEFAULT true,
  sms           boolean DEFAULT false,
  whatsapp      boolean DEFAULT false,
  email         boolean DEFAULT false,
  roles         text[],                              -- which roles receive this event
  UNIQUE (school_id, event_type)
)

notification_api_keys (
  id          uuid PRIMARY KEY,
  school_id   uuid NOT NULL REFERENCES schools(id),
  channel     text NOT NULL,                         -- 'sms'|'whatsapp'|'email'
  provider    text NOT NULL,                         -- 'msg91'|'twilio'|'wati'|'sendgrid'
  api_key_enc text NOT NULL,                         -- AES-256 encrypted
  sender_id   text,                                  -- phone/email sender ID
  is_active   boolean DEFAULT true,
  created_at  timestamptz DEFAULT now()
)

documents (
  id          uuid PRIMARY KEY,
  school_id   uuid NOT NULL REFERENCES schools(id),
  name        text NOT NULL,
  file_url    text NOT NULL,
  file_type   text,
  uploaded_by uuid REFERENCES users(id),
  visible_to  text[],                               -- roles that can see this doc
  created_at  timestamptz DEFAULT now()
)

announcements (
  id          uuid PRIMARY KEY,
  school_id   uuid NOT NULL REFERENCES schools(id),
  title       text NOT NULL,
  body        text NOT NULL,
  author_id   uuid REFERENCES users(id),
  visible_to  text[],                               -- roles
  is_pinned   boolean DEFAULT false,
  expires_at  timestamptz,
  created_at  timestamptz DEFAULT now()
)

support_tickets (
  id            uuid PRIMARY KEY,
  school_id     uuid NOT NULL REFERENCES schools(id),
  reporter_id   uuid REFERENCES users(id),
  title         text NOT NULL,
  description   text NOT NULL,
  category      text,                               -- 'bug'|'feature'|'billing'|'other'
  priority      text DEFAULT 'normal',              -- 'low'|'normal'|'high'|'critical'
  status        text DEFAULT 'open',                -- 'open'|'in_progress'|'resolved'|'closed'
  resolved_by   uuid REFERENCES users(id),
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
)

audit_logs (
  id            uuid PRIMARY KEY,
  school_id     uuid REFERENCES schools(id),        -- null for super_admin platform actions
  actor_id      uuid REFERENCES users(id),
  actor_role    text NOT NULL,
  action        text NOT NULL,
  entity_type   text NOT NULL,
  entity_id     uuid,
  metadata      jsonb,
  channel       text,                               -- 'web'|'mobile'
  ip_address    text,
  created_at    timestamptz DEFAULT now()
)

users (
  id            uuid PRIMARY KEY,                   -- matches Payload CMS Auth uid
  school_id     uuid REFERENCES schools(id),        -- null for super_admin
  teacher_id    uuid REFERENCES teachers(id),       -- null if not a teacher
  role          text NOT NULL,                      -- 'super_admin'|'admin'|'management'|'teacher'
  name          text NOT NULL,
  email         text UNIQUE NOT NULL,
  avatar_url    text,
  dark_mode     boolean DEFAULT false,
  language      text DEFAULT 'en',                  -- 'en'|'as'|'hi'
  created_at    timestamptz DEFAULT now()
)
```

---

## 8. API Integrations

### Razorpay (billing)

- Use Razorpay Subscriptions API to create, activate, and manage plans.
- Webhook endpoint: `POST /api/webhooks/razorpay` — verify signature, update `subscriptions` table, update `schools.subscription_status`.
- Events to handle: `subscription.activated` → set active, `subscription.charged` → extend `plan_expires_at`, `subscription.halted` → set grace, `subscription.cancelled` → set suspended after grace period.

### MSG91 (SMS) — school-configured

- School admin adds MSG91 API key and sender ID in notification hub.
- EduFlow sends SMS via `https://api.msg91.com/api/v5/flow/` using school's key.
- Template for proxy assignment: "EduFlow: You have been assigned a proxy class. [Class] [Period] on [Date]. Please check the app."

### WATI (WhatsApp Business API) — school-configured

- School admin adds WATI API key and endpoint URL.
- EduFlow sends template messages via WATI's REST API.
- Template messages must be pre-approved by Meta (WhatsApp Business Policy). School is responsible for their own template approvals.

### SendGrid (email) — school-configured

- School admin adds SendGrid API key and verified sender email.
- EduFlow sends via `POST https://api.sendgrid.com/v3/mail/send`.

### Resend (platform emails — EduFlow's key)

- EduFlow uses Resend for platform-level emails: welcome, trial ending, billing alerts, password reset.
- School admins cannot configure or see this key.

### Supabase Realtime

- Proxy board subscribes to `proxy_assignments` table changes for the school's date.
- Absence board subscribes to `absences` table changes.
- Notifications channel: `notifications` table insert → push to connected recipients instantly.
- Swap inbox: `swap_requests` table changes pushed to relevant teachers and management.

---

## 9. Notification System

### Notification types

| Event type key | Recipient role(s) | Trigger |
|---|---|---|
| `proxy_assigned` | Teacher | Management assigns them as proxy |
| `proxy_reminder` | Teacher | 10 minutes before proxy class starts |
| `proxy_accepted` | Management | Teacher accepts a proxy duty |
| `proxy_declined` | Management | Teacher declines — needs reassignment |
| `absence_submitted` | Management | Teacher submits absence via app |
| `absence_approved` | Teacher | Management approves absence |
| `absence_rejected` | Teacher | Management rejects absence with reason |
| `unassigned_alert` | Management | Period still uncovered 30 min before start |
| `swap_request_received` | Teacher | Peer sends a swap request |
| `swap_request_accepted` | Teacher + Management | Peer accepts swap → management approval needed |
| `swap_request_declined` | Teacher | Peer declines swap request |
| `swap_approved` | Both teachers | Management approves swap |
| `swap_rejected` | Requester | Management rejects approved swap |
| `subscription_expiring` | Admin | 7 days before plan expires |
| `trial_ending` | Admin | 3 days before trial ends |
| `subscription_suspended` | Admin | Grace period over, access suspended |
| `subscription_activated` | Admin | Razorpay confirms payment, plan activated |

### Channel defaults (overridable by admin)

- In-app: always on for all types.
- SMS and WhatsApp: off by default, admin enables per event type.
- Email: off by default for operational events; on by default for billing events.

---

## 10. Design System

### Brand colours

```css
--brand:          #007AFF   /* iOS Blue — primary CTA, active states, buttons */
--brand-dark:     #0062CC   /* Hover / pressed */
--brand-light:    #EAF3FF   /* Soft fill backgrounds, hover regions */
--brand-mid:      #80BDFF   /* Mid-tone for charts, gradients */
--brand-muted:    rgba(0,122,255,0.08);
```

> **Rule:** `#007AFF` is the primary color for ALL buttons, active nav items, links, and CTAs. Never use purple as the primary brand color.

### Semantic colours (iOS standard)

```css
--success:        #34C759   /* Available — Green */
--success-light:  #E5F9EB
--warning:        #FF9500   /* Alt subject proxy — Orange */
--warning-light:  #FFF3E0
--danger:         #FF3B30   /* Absent, error, suspended — Red */
--danger-light:   #FFEBEA
--info:           #007AFF   /* System info — Blue */
--info-light:     #E5F1FF
```

### Layout surfaces

```css
--bg:             #F2F2F7   /* Main content area — iOS system gray */
--surface:        #FFFFFF   /* Cards and page backgrounds */
--sidebar-bg:     rgba(255,255,255,0.88)   /* Frosted glass sidebar */
--border:         rgba(60,60,67,0.12)      /* Subtle iOS-style dividers */
--text:           #1C1C1E   /* Primary text */
--text-muted:     #636366   /* Secondary text */
--text-light:     #AEAEB2   /* Disabled / placeholder */
```

### Typography

- Primary font: DM Sans or SF Pro Display.
- Fallback: system-ui, -apple-system, BlinkMacSystemFont, sans-serif.
- Two weights only: 400 (regular) and 500 (medium). Never 600 or 700 — too heavy for this aesthetic.

### Spatial rules

- **4px grid:** All spacing and sizing follows a strict 4px base.
- **Corner radius:** 12px for cards (`--radius-md`), 16px for larger containers (`--radius-lg`), 999px for pills and badges.
- **Sidebar:** `backdrop-filter: blur(20px)` frosted glass. Purple accent for active nav items.
- **Buttons:** Pill-shaped or soft-rounded. Primary = purple fill. Secondary = ghost with border.
- **Inputs:** iOS `systemFill` style — borderless or very subtle border with light fill background.
- **Animations:** Cards at 200ms ease-out. Modals with spring transition. No layout shifts on load.

### Dark mode

Full dark mode with iOS-system dark colours. Toggle in user profile settings. Must be implemented from the start — not bolted on later.

### Proxy board colour coding

| Status | Colour | Label |
|---|---|---|
| Available, same subject | `--success` (#34C759) | ● Available |
| Available, different subject | `--warning` (#FF9500) | ● Different subject |
| At proxy cap / maxed out | Gray (#AEAEB2) | ● Maxed out |
| Currently in class / unavailable | `--danger` (#FF3B30) | ● Unavailable |

Colour is **always paired with a text label** — never colour-only (accessibility requirement).

### Proxy card format

```
[P2]  10:10 – 10:50 AM
Class: VII – A  ·  English
[ + Assign ]         or      [ Priya Sharma  ·  Edit ]
```

---

## 11. School Timetable Structure

Default timetable for HCEA (all times configurable per school in System Settings):

| Slot | Time |
|---|---|
| Gate opens | 8:45 AM |
| Gate closes | 9:15 AM |
| Morning prayer | 9:15 – 9:25 AM |
| Period 1 | 9:30 – 10:10 AM |
| Period 2 | 10:10 – 10:50 AM |
| Period 3 | 10:50 – 11:30 AM |
| Period 4 | 11:30 – 12:10 PM |
| **Tiffin break** | **12:10 – 12:30 PM** |
| Period 5 | 12:30 – 1:10 PM |
| Period 6 | 1:10 – 1:50 PM |
| Period 7 | 1:50 – 2:30 PM |
| Departure | 2:30 PM |

Total: **7 periods × 40 minutes.**

**Teacher daily cap:** Maximum 5 of 7 periods per teacher per day. The timetable builder and proxy assignment engine both enforce this. A 6th assignment is blocked.

---

## 12. Screen Inventory

### Super admin screens

| Route | Screen |
|---|---|
| `/super/dashboard` | Revenue, MRR/ARR, health scores, churn |
| `/super/schools` | Paginated school list with filters |
| `/super/schools/[id]` | Per-school detail, impersonation entry |
| `/super/affiliates` | Affiliate list, commission, payout queue |
| `/super/coupons` | Coupon engine — create, toggle, expire |
| `/super/tickets` | Bug and support ticket queue |
| `/super/flags` | Feature flags per school/plan |
| `/super/announcements` | Broadcast to all or filtered schools |
| `/super/changelog` | Push release notes in-app |
| `/super/audit` | Platform-level audit log |
| `/status` | Public service status page |

### Admin screens

| Route | Screen |
|---|---|
| `/dashboard` | School-level stats overview |
| `/teachers` | Teacher directory — list + CRUD |
| `/teachers/[id]` | Expanded teacher profile (photo, subjects, classes) |
| `/classes` | Class manager — CRUD for classes and sections |
| `/timetable` | Table builder — full D&D timetable |
| `/absences` | Absence list — approve/reject/manual |
| `/proxy-board` | Proxy assignment board |
| `/calendar` | School calendar — holidays, exams, events |
| `/reports` | Monthly reports + PDF export |
| `/import` | CSV/Excel bulk import |
| `/audit` | School audit log |
| `/notifications` | Notification hub — channels, API keys, event rules |
| `/notifications/log` | Delivery log |
| `/announcements` | Manage school announcements |
| `/documents` | Document manager |
| `/settings` | System settings — timings, proxy rules, academic year |
| `/billing` | Subscription plan, billing history, affiliate |
| `/help` | Help & support center |
| `/profile` | Admin profile, dark mode, language |

### Management screens

| Route | Screen |
|---|---|
| `/dashboard` | Morning briefing + coverage score |
| `/absences` | Absence approval queue |
| `/proxy-board` | Assignment board — real-time |
| `/schedule` | All teachers' weekly/daily schedules |
| `/swap-requests` | Swap request inbox and history |
| `/teachers` | Teacher list — add/remove |
| `/reports` | Monthly reports + print daily sheet |
| `/audit` | Audit log (read-only) |
| `/notifications` | Notification center |
| `/help` | Help & support center |
| `/profile` | Profile, dark mode, language |

### Teacher screens

| Route | Screen |
|---|---|
| `/dashboard` | Today's schedule, pending proxy duties, announcements |
| `/schedule` | Full weekly/daily schedule |
| `/absences/new` | Leave application form |
| `/absences` | My absence history + leave balance |
| `/proxy/history` | Past proxy duties |
| `/swaps` | Swap inbox (send/receive/history) |
| `/swaps/new` | Initiate a swap request |
| `/notifications` | Notification center + preferences |
| `/help` | Help & support (teacher articles first) |
| `/profile` | Profile, dark mode, language |

### Auth screens

| Route | Screen |
|---|---|
| `/login` | Role-aware login — school isolation, social OAuth |
| `/signup` | School admin signup — trial start |
| `/forgot-password` | Password reset |
| `/onboarding` | 5-step setup wizard (admin only, first login) |

---

## 13. Business Rules & Logic

1. **School isolation:** Every database query must include `school_id` in the WHERE clause. Supabase RLS policies enforce this at the DB layer as a second line of defence.

2. **Teacher daily cap:** No teacher may be assigned (timetable + proxy combined) more than 5 periods in a single day. Enforced in: table builder, proxy assignment engine, and swap approval.

3. **Period edit gate:** The "Edit" action on a proxy assignment card is only shown if `current_time < period.end_time`. After the period ends, the action cell is blank.

4. **Proxy cap per month:** Each teacher has a `max_proxies_per_month` value (default 5). The proxy board shows teachers approaching or at their cap with a gray badge. Assignment is blocked at the cap.

5. **Absence approval required:** A proxy assignment can only be made after the absence is in `approved` status. If management marks a teacher absent manually, the absence is auto-approved.

6. **Swap expiry:** Swap requests expire after 2 hours if not responded to by the target teacher. Status set to `expired`, requester notified.

7. **Holiday block:** If a date is marked as `holiday` in `school_calendar`, the proxy board shows a "School Holiday" state and all assignment actions are disabled.

8. **Exam mode:** If a date is marked `exam`, the proxy board shows an "Exam Mode" banner. Proxy assignment is disabled unless admin explicitly overrides.

9. **Trial gate:** If `subscription_status = 'suspended'`, all authenticated routes except `/billing` and `/help` redirect to a "Subscription Suspended" page.

10. **Notification channel fallback:** If a school has not configured SMS keys but SMS is enabled for an event, the notification silently falls back to in-app only. No error shown to the recipient — only visible in the delivery log for admin.

11. **Audit log coverage:** Every create, update, delete, and status-change action across all entities must write a record to `audit_logs`. This is non-negotiable — the audit log is a key trust feature for school administration.

12. **Super admin data access:** Super admin can read any school's data for support purposes. Every impersonation session is logged with actor, school, start time, and end time. Super admin cannot create, edit, or delete school data during impersonation — read-only mode enforced.

---

## 14. Build Phases & Priority Order

### Phase 1 — Production foundation (must-have before launch)

1. Payload CMS setup: replace mock data with real collections for users, teachers, classes, timetable.
2. Supabase PostgreSQL: implement full schema from §7. Enable RLS with `school_id` policies.
3. Auth: Payload CMS Auth + social OAuth (Google, Apple, Facebook) wired to login buttons.
4. Multi-tenancy: strict `school_id` isolation in Payload access control AND Supabase RLS.
5. Real-time: Supabase Realtime on proxy board and notification center.
6. Razorpay billing: subscription plans, webhook handler, trial/grace/suspended status gates.
7. School onboarding wizard: 5-step guided setup for new admin after signup.

### Phase 2 — Core feature completion

8. Class manager screen: admin CRUD for classes and sections.
9. Expanded teacher profile: photo upload, subjects/sections/classes checkboxes.
10. Notification hub: channel config, API key management (MSG91, WATI, SendGrid), event rules.
11. Swap system: full peer-to-peer period swap with management approval flow.
12. Excel import: complete `.xlsx` bulk import alongside existing CSV.
13. Leave balance: configure quotas, track usage per teacher per academic year.
14. Academic year management: year rollover, archive, fresh session.

### Phase 3 — Growth & ops

15. Affiliate program: referral links, commission tracking, tiered tiers, payout requests.
16. Bug & ticket system: in-app reporting → super admin queue.
17. Feature flags: super admin toggles per school/plan.
18. Announcement board: school-wide announcements by admin/management.
19. Document manager: upload and role-filter circulars and handbooks.
20. Proxy rules engine: configurable proxy assignment logic per school.
21. End-of-day summary report and print daily sheet.

### Phase 4 — Polish & scale

22. PWA: service worker, manifest, install prompts for iOS and Android.
23. Dark mode: full implementation across all screens and components.
24. Multi-language: English, Assamese, and Hindi (admin sets default, users override).
25. Help & support center: CMS-managed articles at `/help`. Role-filtered content.
26. QR proxy check-in: classroom QR code scan to mark proxy attendance.
27. AI churn prediction: flag at-risk schools in super admin dashboard.
28. Status page: public `/status` with live uptime per service.

---

*Document version: 2.0 — May 9, 2026*
*Covers all features discussed and agreed upon through the May 2026 planning session.*
*Update this document when schema changes, new screens are added, or business rules change.*