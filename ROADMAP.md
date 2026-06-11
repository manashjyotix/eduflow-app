# EduFlow — Product Roadmap
> **Canonical phase order.** When roadmap phases appear in other files, this file wins.
> Updated: June 8, 2026

---

## Current Status: Scholaris Prototype ✅

The Vite + React app now contains **two layers**:
1. **Design System** — 50+ production-ready components with Vitest test coverage (`src/components/`)
2. **Scholaris Prototype** — 69 fully designed pages across 6 roles (`src/scholaris/`)

The prototype is a complete high-fidelity mockup ready for backend wiring. The Next.js production app is the **next build target**.

---

## Phase 0 — Prototype Completion (In Progress)

> **Goal:** Finish all missing features in the Scholaris prototype before starting the production backend.

| # | Deliverable | Priority |
|---|---|---|
| P0.1 | **Dark mode** — full `prefers-color-scheme` + manual `.dark` rollout across all 69 pages and 50+ components | 🔴 Critical |
| P0.2 | **Morning Briefing countdown timer** — 5-minute period countdown on `ManagementDashboardPage` | 🟠 High |
| P0.3 | **Exam Routine component** — add `ExamRoutine.tsx` to `src/components/` (reuse timetable builder layout) | 🟠 High |
| P0.4 | **Progress Notes input flow** — teacher selects class → section → student → adds note (understood/struggling/etc.) | 🟠 High |
| P0.5 | **Subject Completion Tracker** — per-subject syllabus progress bar for parent portal pages | 🟡 Medium |
| P0.6 | **Behavioral Trend chart** — weekly/monthly behavior summary graph per student for parent portal | 🟡 Medium |
| P0.7 | **Parent portal showcase** — add to `src/showcase/` (currently only accessible via Scholaris role switcher) | 🟡 Medium |
| P0.8 | **QR Code component** — `QRCodeCard.tsx` for proxy check-in; print-ready PDF output | 🟢 Low |

**Exit criteria:** All 6 roles feel complete and demo-ready. No placeholder pages.

---

## Phase 1 — Production Foundation
> **Goal:** Replace the Scholaris prototype with a real backend, auth, billing, and multi-tenancy.

| # | Deliverable | Priority |
|---|---|---|
| 1 | **Payload CMS setup** — users, teachers, classes, timetable collections + access control | 🔴 Critical |
| 2 | **PostgreSQL / SQLite schema** — full schema with `school_id` RLS (or Payload access control) | 🔴 Critical |
| 3 | **Auth** — Payload CMS Auth + social OAuth (Google, Apple, Facebook) | 🔴 Critical |
| 4 | **Multi-tenancy** — strict `school_id` isolation at API + DB layer | 🔴 Critical |
| 5 | **Real-time** — Payload Realtime or 10s polling for proxy board + notifications | 🔴 Critical |
| 6 | **Razorpay Billing** — plans, webhooks, trial/grace/suspended status gates | 🔴 Critical |
| 7 | **School onboarding wizard** — 5-step guided setup; auto-creates admin on school creation | 🔴 Critical |

**Exit criteria:** A new school can sign up, complete onboarding, and manage a real absence end-to-end.

---

## Phase 2 — Core Feature Completion
> **Goal:** Complete all daily-use features for admin, management, and teacher roles.

| # | Deliverable | Priority |
|---|---|---|
| 8 | **Class Manager** — CRUD for classes and sections | 🟠 High |
| 9 | **Expanded Teacher Profile** — photo upload, subjects/sections/classes checkboxes | 🟠 High |
| 10 | **Notification Hub** — channel config (MSG91, WATI, SendGrid), API key management, per-event toggles | 🟠 High |
| 11 | **Exam Routine Module** — timetable-style layout for exam scheduling, exam mode on proxy board | 🟠 High |
| 12 | **Swap System** — full peer-to-peer exchange with management approval flow | 🟠 High |
| 13 | **Leave Balance** — configurable quotas per school, track usage per teacher per academic year | 🟠 High |
| 14 | **Academic Year Management** — rollover, archive, fresh session | 🟡 Medium |
| 15 | **Excel Import** — `.xlsx` bulk import + CSV (alongside existing CSV) | 🟡 Medium |

**Exit criteria:** All daily workflows (absence → proxy → audit) work without workarounds.

---

## Phase 3 — Growth & Communication
> **Goal:** Add growth loops, parent engagement, and advanced school management.

| # | Deliverable | Priority |
|---|---|---|
| 16 | **Parent Portal (live)** — wire up the Scholaris parent pages to real data; unique parent login code per student; multi-child support | 🟠 High |
| 17 | **Progress Notes (live)** — teacher input → per-period notes → parent portal display | 🟠 High |
| 18 | **Affiliate Program** — 25% one-time + 5% lifetime, tiered tiers (Bronze/Silver/Gold), payout queue | 🟡 Medium |
| 19 | **Bug & Ticket System** — in-app reporting → super admin queue with priority triage | 🟡 Medium |
| 20 | **Feature Flags** — toggle beta features per school/plan without code deploy | 🟡 Medium |
| 21 | **Announcement Board** — school-wide posts with expiry, role-filtered visibility | 🟡 Medium |
| 22 | **Document Manager** — upload circulars, handbooks, policies; role-filtered access | 🟡 Medium |
| 23 | **Proxy Rules Engine** — per-school configurable algorithm & preferences | 🟡 Medium |

**Exit criteria:** Schools refer other schools. Parents use the portal. Reports are share-worthy.

---

## Phase 4 — Polish & Scale
> **Goal:** Cross-platform reach, AI intelligence, and enterprise-ready scale.

| # | Deliverable | Priority |
|---|---|---|
| 24 | **PWA** — service worker, manifest, install prompts (iOS + Android) | 🟡 Medium |
| 25 | **Multi-Language** — English (default), Assamese, Hindi | 🟡 Medium |
| 26 | **AI Integration** — built-in (free: report summarization, at-risk detection) + BYO API key (premium: timetable optimizer, behavioral insights) | 🟡 Medium |
| 27 | **QR Proxy Check-In** — generate, print, scan, mark attendance | 🟢 Low |
| 28 | **Native Apps (iOS + Android)** — Capacitor shell | 🟢 Low |
| 29 | **Status Page** — public `/status` with live service uptime | 🟢 Low |
| 30 | **Help Center** — CMS-managed articles, role-filtered by audience | 🟢 Low |

**Exit criteria:** EduFlow works offline, on mobile, in Assamese, and principals share the reports.

---

## Future Consideration (Post Phase 4)

- **District Mode** — read-only cross-school visibility for district education offices
- **Public Coverage Page** — shareable school URL showing today's class coverage (no PII)
- **Seasonal Pricing Automation** — coupon automation tied to exam season calendar
- **Competitor Comparison Page** — EduFlow vs. WhatsApp chaos / Excel registers
- **Behavioral Analytics** — weekly/monthly behavior trend charts per student (parent portal)
- **Subject Completion Tracker** — per-subject syllabus progress bar visible to admin, teacher, and parent

---

## Key Business Rules (Quick Reference)

> Full rules in `VISION.md §5`. This file only links to them.

| Rule | Value |
|---|---|
| Affiliate commission | 25% one-time + 5% lifetime recurring (flat rate, tiers = perks only) |
| Swap expiry | When the requested period ends or is running (not a fixed timer) |
| Primary brand color | `#007AFF` iOS Blue |
| Teacher daily cap | Max 5 periods/day (timetable + proxy combined) |
| Proxy cap levels | Daily + Weekly + Monthly (all configurable per teacher) |
| Trial period | 14 days, no credit card required |
| Grace period | 7 days after failed payment before suspension |
| Tiffin supervision | Teachers CAN be assigned for break supervision (it's a valid slot) |
| Exam mode | Proxy assignment disabled unless admin overrides; supervision duty still assignable |

---

*See `VISION.md` for complete product blueprint · `Claude.md` for full technical specification · `AGENTS.md` for AI agent resume instructions · `CHANGELOG.md` for what's been built*
