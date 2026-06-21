# EduFlow — Full-Stack Audit Report (Loopholes, Fixes & Improvements)

> **Generated:** June 19, 2026
> **Scope:** Full stack — frontend, backend, security, design system, features
> **Codebase audited:** `eduflow-app` (Next.js 15 + React 19 + TypeScript + Tailwind v4 + shadcn/ui + Mongoose)
> **Related:** [AGENTS.md](./AGENTS.md) · [AUDIT.md](./AUDIT.md) · [REBUILD_PLAN.md](./REBUILD_PLAN.md) · [VISION.md](./VISION.md)

---

## 0. Executive Summary

| Dimension | Grade | One-line verdict |
|---|---|---|
| Frontend UI / pages | 🟢 **A−** | 79 polished pages, design tokens, dark mode, lint & typecheck green |
| Component architecture | 🟡 **B** | 31 shadcn + 14 shared components; no `domain/` tier; pages too fat |
| Backend / API | 🔴 **F** | **Zero API routes.** `src/app/api/` exists but is empty. Models unused. |
| Authentication | 🔴 **F** | No auth provider, no session, no middleware. Demo passwords hardcoded. |
| Security | 🔴 **D** | XSS sink in chatbot, no authz, no input validation, demo creds shipped. |
| Data layer | 🟡 **C−** | Mongoose models are well-designed but **never imported by any page**. All UI is mock data. |
| Performance | 🟡 **C+** | No `loading.tsx`/`error.tsx`, charts not code-split, 23 pages hardcode hex colors. |
| Accessibility | 🟡 **C** | Color-only status in several views, missing table captions, icon-only buttons. |
| Tests | 🔴 **F** | No test runner installed. No unit/integration/e2e coverage. |

**Bottom line:** The frontend is a **high-quality prototype**. To become a real full-stack app, the entire backend, auth, and security layer must be built — currently **0%** of pages talk to a database.

---

## 1. Current Build Health (Verified Live)

| Check | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | ✅ **Exit 0** — clean |
| ESLint | `npx next lint` | ✅ **Exit 0** — ~18 minor warnings |
| Pages | count `page.tsx` | **79 pages** (67 app + 12 marketing) |
| Components | `src/components/**/*.tsx` | **48** (31 ui + 14 shared + 3 layout) |
| Loading boundaries | count `loading.tsx` | **0** ❌ |
| Error boundaries | count `error.tsx` | **0** ❌ |
| Not-found page | `not-found.tsx` | **0** ❌ |
| API routes | files in `src/app/api/` | **0** ❌ |
| Middleware | `middleware.ts` | **missing** ❌ |
| Server vs client pages | `"use client"` directive | 57 client / 22 server |
| Domain component tier | `src/components/domain/` | **missing** ❌ |

---

## 2. 🔴 CRITICAL Security Loopholes (Fix First)

These are exploitable today or become exploitable the moment any backend is attached.

### L1. Stored XSS via chatbot `dangerouslySetInnerHTML`
**File:** `src/components/shared/eduflow-assistant.tsx:109-111, 156`

```ts
function formatContent(content: string) {
  return content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                .replace(/\*(.*?)\*/g, "<em>$1</em>")
}
// …rendered via:
<p dangerouslySetInnerHTML={{ __html: formatContent(msg.content) }} />
```

Today `content` comes from a hardcoded map, so it's latent. But the **user's own message text** is the input surface, and the moment this bot is wired to any LLM/backend, `<img onerror=alert(1)>` in a user prompt renders as raw HTML.
**Fix:** Never build HTML by hand. Render markdown via a safe parser, or convert `**bold**`/`*italic*` to React nodes (no `dangerouslySetInnerHTML`):
```tsx
// Replace formatContent with a React-based renderer or DOMPurify:
import DOMPurify from "isomorphic-dompurify"
<p dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(formatContent(msg.content)) }} />
// Better: render inline by splitting on ** and * tokens into <strong>/<em> elements.
```

### L2. No authentication & no session
- `src/app/(marketing)/login/page.tsx` `handleLogin` is a `setTimeout` that always sets `setError("Demo mode…")`. No credential check, no session, no redirect.
- The `(app)` layout renders **every page to anyone** — `/admin/*`, `/super-admin/*`, `/teacher/*` are all publicly accessible.
- **No middleware** → no route protection at all.
- Demo plaintext passwords (`admin123`, `teacher123`, …) are **committed in source** and shown in the login UI.

**Fix — build the auth layer (see §5).** Minimum viable:
1. `src/app/api/auth/login/route.ts` — verify against `User.passwordHash` (bcrypt/argon2).
2. Issue an **httpOnly** session cookie (JWT signed with `NEXTAUTH_SECRET`, or use Auth.js / NextAuth v5).
3. `src/middleware.ts` — guard `/(app)/*`, read session, redirect to `/login` if absent, 404 if role mismatched.

### L3. No authorization / no tenant isolation
- Mongoose models all carry `schoolId` (good schema design), but there is **no code that filters queries by it**. The instant an API is added without school-scoping, **School A can read School B's data** (cross-tenant leak).
- Role checks don't exist — a logged-in `parent` could call `/api/admin/…` if the route exists.
**Fix:** Every DB query must `.find({ schoolId: session.schoolId })`. Every API route must check `session.role` against an allow-list. Add a central `requireRole()` / `requireSchoolScope()` helper.

### L4. No input validation / schema enforcement on writes
- No `zod` / `yup` / `react-hook-form`. When API routes are added, request bodies will be trusted raw → NoSQL injection (`{$ne: null}`), mass assignment, and type confusion.
- Mongoose `strictQuery` is not enabled.
**Fix:** Install `zod` + `react-hook-form`. Validate every API request body with a zod schema before touching Mongoose. Set `mongoose.set("strictQuery", true)` and `{ strict: "throw" }` on schemas.

### L5. NoSQL / injection surface prepared
- `mongodb.ts` is correct and cached, but once user input flows into `.find(req.body)` or `Model.update(req.body)` without sanitization, operator-injection (`$where`, `$gt`) becomes possible.
**Fix:** Strip/whitelist keys; never pass raw request objects to Mongoose; use zod to coerce types.

### L6. Secrets & env hygiene
- `.gitignore` correctly excludes `.env*.local` ✅ and `.kiro/settings/mcp.json` ✅.
- **But:** no `NEXTAUTH_SECRET` is generated anywhere, no `.env.example` validation, and the example ships placeholder secrets that users may forget to rotate.
- `mongodb.ts:16-23` **throws at module load** if `MONGODB_URI` is missing → breaks the static build for anyone who hasn't set it (which is correct for prod, but every page is currently static + mock, so this model file is dead code that can crash builds if ever imported by a static page).
**Fix:** Add `npx auth secret` / `openssl rand` instructions to README. Validate env with `@t3-oss/env-nextjs` or `zod` at startup.

### L7. Other findings
- `sidebar.tsx:86` writes sidebar state to a non-`SameSite`/non-`Secure` cookie → set `SameSite=Lax; Secure` in production.
- `avatar-upload.tsx:78` uses raw `<img>` instead of `next/image` (performance, not security).
- No CSP headers in `next.config.ts` (empty `{}`). Add `Content-Security-Policy`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`.

---

## 3. Backend Audit — **The Biggest Gap**

### 3.1 What exists (scaffolding only)
- `src/lib/mongodb.ts` — cached Mongoose connection helper ✅ (correct pattern).
- `src/models/` — **5 well-designed models**: `School`, `User`, `Teacher`, `Absence`, `Proxy`. All carry `schoolId`, proper enums, indexes, timestamps. **This is genuinely good work** — but it's orphaned.

### 3.2 What is completely missing
| Layer | Status | Notes |
|---|---|---|
| API routes (`src/app/api/**`) | ❌ **0 routes** | CRUD for nothing exists |
| Auth (login/logout/session) | ❌ | `login/page.tsx` is a no-op |
| Password hashing | ❌ | `passwordHash` field exists, nothing writes/verifies it |
| Authorization helpers | ❌ | No `requireRole`, no school scoping |
| Validation (zod) | ❌ | Not installed |
| Background jobs / cron | ❌ | Proxy auto-assign, fee reminders, trial expiry — none |
| Realtime (proxy accept/decline) | ❌ | No websockets/SSE |
| File storage (avatars, documents, receipts) | ❌ | No upload route |
| Payments (Razorpay) | ❌ | Pricing UI exists, no integration |
| Email/SMS (fee reminders, leave alerts) | ❌ | |
| Audit log writes | ❌ | Audit *pages* exist, nothing writes log entries |
| Seed scripts | ❌ | `prisma seed`-equivalent not present |
| DB migrations / indexes | ❌ | Indexes defined in schema, no `ensureIndex` runner |

### 3.3 No models are imported anywhere
Confirmed by grep: **zero** files under `src/app` import `@/models` or `@/lib/mongodb`. Every one of the 79 pages reads from `src/data/mock-*.ts`. The backend is architecturally present but electrically disconnected.

---

## 4. Frontend Audit

### 4.1 Page size & client/server imbalance
- 57 of 79 pages (72%) are `"use client"`. The largest: `onboarding/page.tsx` (**633 lines**), `admin/dashboard` (530), `super-admin/profile` (502), `school-signup` (483).
- Fat pages do data-fetching-by-import + all rendering client-side → no streaming, no suspense benefit.
**Fix:** Move mock-data reads into server components; keep only interactive islands as `'use client'`. Split >400-line pages into `domain/` components.

### 4.2 Missing `domain/` component tier
Per `REBUILD_PLAN §3.1`, business components should live in `src/components/domain/`. Currently none exist — all proxy/absence/timetable/fee logic is copy-pasted inline across pages. Highest-value extractions:

| Target file | Current location | Reused by |
|---|---|---|
| `domain/proxy/ProxyBoard.tsx` | `admin/proxy-board/page.tsx` | admin, management |
| `domain/proxy/CoverageDonut.tsx` | `admin/proxy-board/page.tsx` | admin, management |
| `domain/absence/AbsenceRow.tsx` | `admin/absences/page.tsx` | admin, management, teacher |
| `domain/absence/PeriodPicker.tsx` | `teacher/leave/page.tsx` | teacher, admin |
| `domain/timetable/TimetableGrid.tsx` | `admin/timetable/page.tsx` | admin, management, teacher |
| `domain/fee/FeeReceiptCard.tsx` | `admin/fees/collection/page.tsx` | admin, parent |
| `domain/notification/NotificationRow.tsx` | `teacher/notifications/page.tsx` | teacher, parent, admin |

### 4.3 Dark-mode breakers: hardcoded brand hex
**23 pages** use raw hex (`#34C759`, `#FF9500`, `#FF3B30`, `#007AFF`, `#6C63FF`) directly. These **do not flip** in dark mode — e.g. `text-[#7A1B17]` (dark red text) on a dark background becomes unreadable.
Example (`proxy-board/page.tsx:29-34`):
```tsx
"available-same": { bg: "bg-[#34C759]", textColor: "text-[#1A6B30]" }
```
**Fix:** Replace with semantic tokens already defined in `globals.css` (`--success`, `--warning`, `--destructive`, `--primary`) and shadcn classes (`bg-success`, `text-success-foreground`). The `DOT_CONFIG` should map to tokens, not hex.

### 4.4 Missing route-level UX infrastructure
- **0 `loading.tsx`** → blank screen flashes; no perceived-performance story.
- **0 `error.tsx`** → an unhandled throw nukes the whole app, no retry.
- **0 `not-found.tsx`** → default Next 404, not branded.
- **No `Suspense` boundaries** around charts.
**Fix:** Add `loading.tsx` + `error.tsx` at least at `(app)/`, `(app)/admin/`, `(marketing)/`. Add `dynamic(() => import('recharts-wrap'), { ssr:false })` for chart-heavy pages.

### 4.5 Forms have no validation
No `react-hook-form` / `zod`. Login, leave request, fee collection, onboarding (633 lines!) all validate with ad-hoc `if (!email)` checks.
**Fix:** Install `react-hook-form zod @hookform/resolvers` + shadcn `form` component; standardize all forms.

### 4.6 Accessibility issues
| Issue | Where | WCAG |
|---|---|---|
| Color-only status (no text label) on some proxy/fee rows | proxy-board, fees/defaulters | 1.4.1 |
| Avatar `<div>` initials lack `aria-label` | sidebar footer, teacher cards | 1.1.1 |
| Icon-only buttons missing `sr-only` name | topbar sort icons | 4.1.2 |
| Data tables missing `<caption>` / `aria-describedby` | many list pages | 1.3.1 |
| Focus order not audited in modals/drawers | proxy assign modal | 2.4.3 |

### 4.7 Lint warnings to clean (~18)
`Badge`/`CardHeader`/`CardTitle`/`Types` unused imports, unescaped apostrophes in `demo/page.tsx`, raw `<img>` in `avatar-upload.tsx`, empty supertype interfaces in `command.tsx`/`input.tsx`. All non-blocking — fix in a sweep.

---

## 5. Feature Improvements (Frontend + Backend) — Prioritized

### Tier 0 — Unblock "full-stack" (must ship together)
1. **Auth system** — NextAuth v5 (Auth.js) credentials provider against `User` model; bcrypt password hash; httpOnly session cookie; `/login`, `/signup`, `/forgot-password` wired.
2. **`middleware.ts`** — protect `/(app)/*`; role→prefix enforcement (`admin`→`/admin`, etc.); redirect unauthenticated to `/login`.
3. **Core CRUD API routes** with zod validation + school scoping:
   - `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
   - `/api/teachers`, `/api/absences`, `/api/proxies` (GET/POST/PATCH)
   - `/api/attendance`, `/api/fees`, `/api/notifications`
4. **Replace mock imports** with `fetch()` from server components or React Query/SWR on client. Keep `src/data/*` as **seed/fixture** data only.
5. **Seed script** `scripts/seed.ts` — populate HCEA demo school + the 5 demo users (with hashed passwords) + 10 teachers.
6. **Validation layer** — `react-hook-form` + `zod` on every form.

### Tier 1 — Core product features (from VISION.md)
7. **Proxy auto-assign algorithm** — extract `getDotStatus` + a real scoring engine into `src/lib/proxy-algorithm.ts` (subject match → availability → cap proximity → workload fairness). Unit-test it.
8. **Realtime proxy accept/decline** — Server-Sent Events or polling so a teacher's "Accept" updates the admin board live.
9. **Morning Briefing countdown timer** — `useInterval` live period countdown on `/management/dashboard` (specified in VISION §3.3, currently static).
10. **Attendance mode toggle persistence** — `SchoolSettingsContext` already exists in Scholaris; port it and persist to `School.settings.attendanceMode`.
11. **Period Picker component** — reusable multi-select P1–P7 for leave/absence forms.
12. **CountdownTimer component** — live exam/period countdown (parent dashboard, management).
13. **`domain/` component tier** — extract the 7 components listed in §4.2.

### Tier 2 — Billing & operations
14. **Razorpay integration** — subscription checkout on `/admin/subscription` and `/school-signup`; webhook `POST /api/webhooks/razorpay` to update `School.subscriptionStatus`.
15. **Trial-expiry cron** — Vercel cron `/api/cron/trial-expiry` moves `trial`→`grace`→`suspended`.
16. **Fee reminder job** — cron emails/SMS to defaulters (`/admin/fees/defaulters`).
17. **Audit log writer** — middleware that appends to an `AuditLog` collection on every mutating API call; powers the existing audit pages.
18. **Excel/CSV import** — `xlsx` parsing for teachers/students bulk upload.

### Tier 3 — Polish & growth
19. **QR check-in** — `qrcode` lib; print proxy-assignment QR; scan to mark `completed`.
20. **Command palette (⌘K)** — `cmdk` is installed but unwired.
21. **`BreadcrumbAuto`** — auto from `usePathname()` in Topbar.
22. **WeatherGreeting banner** — port `WeatherClock` (Open-Meteo, no key) from Scholaris.
23. **Multi-child parent switcher** — parent topbar dropdown.
24. **Subject Completion Tracker / Behavioral Trend chart** — parent portal.
25. **Academic Year Rollover wizard** — archive + reset leave balances.
26. **Install missing shadcn** — `breadcrumb`, `form`, `hover-card`, `context-menu`, `navigation-menu`.

### Tier 4 — Quality & DevOps
27. **Testing** — no runner exists. Add **Vitest** (unit for `lib/`, esp. proxy algorithm) + **Playwright** (e2e for login → proxy assign). Target ≥70% on `src/lib`.
28. **`loading.tsx` / `error.tsx` / `not-found.tsx`** per route segment.
29. **Security headers + CSP** in `next.config.ts`.
30. **Env validation** with `@t3-oss/env-nextjs`.
31. **CI** — GitHub Actions: `typecheck` → `lint` → `test` → `build`.
32. **Dark-mode hex sweep** — replace all 23 pages' raw hex with tokens.
33. **Image optimization** — replace `<img>` with `next/image`; add real avatar upload route.

---

## 6. Consolidated Fix Checklist

### 🔴 Critical (security — do immediately)
- [ ] **L1** Remove `dangerouslySetInnerHTML` in `eduflow-assistant.tsx`; sanitize with DOMPurify or render React nodes.
- [ ] **L2** Build auth (NextAuth v5) + `middleware.ts` route guard; remove hardcoded demo passwords from UI.
- [ ] **L3** Add `requireRole()` + school-scope filter to **every** future query.
- [ ] **L4/L5** Add zod validation on all API bodies; `mongoose.set("strictQuery", true)`.
- [ ] **L6** Generate real `NEXTAUTH_SECRET`; validate env at boot.
- [ ] **L7** Set `Secure; SameSite=Lax` on cookies; add CSP + security headers in `next.config.ts`.

### 🟠 High (backend build-out)
- [ ] Implement auth + core CRUD API routes (§5 Tier 0 #1–#5).
- [ ] Wire pages off mock data → `fetch`/server components.
- [ ] `lib/proxy-algorithm.ts` + unit tests.
- [ ] Seed script; Razorpay webhook; audit-log writer.

### 🟡 Medium (frontend quality)
- [ ] Create `src/components/domain/` tier; split fat pages.
- [ ] Replace 23 pages of hardcoded hex → tokens (fixes dark mode).
- [ ] Add `loading.tsx`/`error.tsx`/`not-found.tsx`.
- [ ] Install `react-hook-form` + `zod` + shadcn `form`; standardize forms.
- [ ] a11y fixes: color+label pairing, `aria-label` on avatars/icons, table captions.

### 🟢 Lower (polish & DevOps)
- [ ] Add Vitest + Playwright; CI pipeline.
- [ ] Install missing shadcn components (breadcrumb, form, hover-card, …).
- [ ] Command palette, breadcrumbs, weather banner, countdown timer.
- [ ] Code-split recharts; replace `<img>` with `next/image`.

---

## 7. Recommended Build Order (Shortest Path to "Full-Stack")

```
Week 1 — Security + Auth spine
  L1 XSS fix → NextAuth v5 → middleware.ts → env validation → security headers
  scripts/seed.ts (demo users + HCEA school) → /api/auth/* routes
Week 2 — Core API + data wiring
  zod schemas → /api/teachers,/absences,/proxies (school-scoped, role-checked)
  swap 3 pilot pages off mock data (admin dashboard, proxy-board, teachers)
Week 3 — Proxy engine + realtime
  lib/proxy-algorithm.ts (tested) → live accept/decline (SSE) → morning briefing timer
Week 4 — Billing + ops
  Razorpay checkout + webhook → trial-expiry cron → fee reminder job → audit log writer
Week 5 — Frontend hardening
  domain/ tier → hex→token sweep → loading/error/not-found → form validation
Week 6 — Tests + CI + Tier 3 features
  Vitest (lib) + Playwright (e2e) → GitHub Actions → QR check-in, command palette
```

---

## 8. What's Already Good (Don't Break These)

- **Mongoose models** (`School/User/Teacher/Absence/Proxy`) are correctly designed — `schoolId`, enums, compound indexes, timestamps. Keep this shape.
- **`mongodb.ts`** cached-connection pattern is correct for Next dev hot-reload.
- **TypeScript & ESLint are green.**
- **Design tokens** in `globals.css` (334 lines) properly bridge EduFlow brand → shadcn semantics.
- **31 shadcn components + 14 shared** cover most UI needs.
- **Dark mode** is wired via `next-themes` + `ThemeProvider`.
- **`.gitignore`** correctly excludes env files and `.kiro/settings/mcp.json`.
- **Role context** (`role-context.tsx`) is a clean, extensible pattern — repurpose it as the *real* session provider once auth exists.

---

*End of report. Update [AUDIT.md](./AUDIT.md) §12 Work Log and this file's checklist as items are closed.*
