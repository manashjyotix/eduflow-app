# EduFlow Design System
### v8.0 · School Management App · shadcn/ui PRO V6 + iOS-Inspired

> **v8.0 update (June 2026):** This design system now targets the **shadcn/ui PRO Variables V6.0** architecture (Figma community file `BlFqAE1yNoGDD4IFKyqaIV`). The EduFlow iOS-style palette is mapped to shadcn semantic tokens. The production Next.js 15 app uses this architecture. See `REBUILD_PLAN.md` for the complete token bridge and component structure.

> A comprehensive design reference for the EduFlow platform — a multi-tenant B2B SaaS for Indian schools. Built on iOS Human Interface Guidelines applied to a web SaaS context, expressed through the shadcn/ui PRO V6 two-layer token system.

**Related Documentation:** [README](./README.md) · [AGENTS](./AGENTS.md) · [VISION](./VISION.md) · [ROADMAP](./ROADMAP.md) · [AUDIT](./AUDIT.md) · [CHANGELOG](./CHANGELOG.md)

---

## Table of Contents

1. [Brand & Vision](#1-brand--vision)
2. [Design System Architecture](#2-design-system-architecture)
3. [Color System](#3-color-system)
4. [Typography](#4-typography)
5. [Spacing, Grid & Radius](#5-spacing-grid--radius)
6. [Shadows & Elevation](#6-shadows--elevation)
7. [Layout System](#7-layout-system)
8. [Component Library](#8-component-library)
9. [School Modules](#9-school-modules)
10. [Platform & UX Patterns](#10-platform--ux-patterns)
11. [Dark Mode](#11-dark-mode)
12. [Accessibility](#12-accessibility)
13. [Tech Stack](#13-tech-stack)

---

## 1. Brand & Vision

**EduFlow** automates the teacher substitute (proxy) workflow for schools — absence reporting → proxy assignment → acceptance/decline → audit trail → monthly reports.

**Design Philosophy:** iOS Human Interface Guidelines applied to a web SaaS. Every component is built with auto-layout (flexbox), real design tokens, and accessible defaults. Expressed through the shadcn/ui PRO V6 semantic token architecture.

**Design Tagline:** Bright, iOS-inspired palette with minimal surfaces and production-grade components for school management.

**Lead School:** Holy Child English Academy (HCEA), Howly, Barpeta, Assam.

---

## 2. Design System Architecture

### shadcn/ui PRO V6 — Two-Layer Token Model

EduFlow uses the two-layer variable architecture from the shadcn/ui PRO Variables V6 Figma community file:

```
Layer 1 — Primitive palette  (--ef-brand, --ef-green, --ef-red, etc.)
           Raw hex/rgba values. Never referenced directly in components.
           Defined in app/globals.css under :root.

Layer 2 — Semantic tokens   (--background, --primary, --destructive, etc.)
           Standard shadcn/ui token names. Components always use these.
           Map to Layer 1 values in globals.css.
           Change the brand by changing the mapping, not the component.
```

**Why this matters:** Every shadcn component uses `bg-primary`, `text-foreground`, `border-border` etc. Swapping from light to dark mode (or changing the brand color from iOS Blue to any other) is a single `:root` override — zero component changes.

### Token Bridge (globals.css canonical mapping)

```css
:root {
  /* ── Layer 1: EduFlow primitives ── */
  --ef-brand:        #007AFF;
  --ef-brand-hover:  #0062CC;
  --ef-brand-light:  #EAF3FF;
  --ef-brand-muted:  rgba(0,122,255,0.08);
  --ef-green:        #34C759;
  --ef-green-light:  #E5F9EC;
  --ef-green-dark:   #1A6B30;
  --ef-amber:        #FF9500;
  --ef-amber-light:  #FFF2D6;
  --ef-amber-dark:   #7A4700;
  --ef-red:          #FF3B30;
  --ef-red-light:    #FFE8E7;
  --ef-red-dark:     #7A1B17;
  --ef-purple:       #6C63FF;
  --ef-purple-light: #F0EFFE;
  --ef-cyan:         #32ADE6;
  --ef-cyan-light:   #E3F5FD;

  /* ── Layer 2: shadcn semantic tokens ── */
  --radius: 0.875rem;
  --background:              #F2F2F7;
  --foreground:              #000000;
  --card:                    #FFFFFF;
  --card-foreground:         #000000;
  --popover:                 #FFFFFF;
  --popover-foreground:      #000000;
  --primary:                 var(--ef-brand);
  --primary-foreground:      #FFFFFF;
  --secondary:               #E5E5EA;
  --secondary-foreground:    #000000;
  --muted:                   #F2F2F7;
  --muted-foreground:        rgba(60,60,67,0.60);
  --accent:                  var(--ef-brand-light);
  --accent-foreground:       var(--ef-brand);
  --destructive:             var(--ef-red);
  --destructive-foreground:  #FFFFFF;
  --border:                  rgba(60,60,67,0.12);
  --input:                   #E5E5EA;
  --ring:                    var(--ef-brand);

  /* ── EduFlow extensions (not in standard shadcn) ── */
  --success:             var(--ef-green-light);
  --success-foreground:  var(--ef-green-dark);
  --warning:             var(--ef-amber-light);
  --warning-foreground:  var(--ef-amber-dark);
  --info:                var(--ef-cyan-light);
  --info-foreground:     #164E6E;

  /* Charts, sidebar — see REBUILD_PLAN.md §1.2 for full list */
}

.dark {
  --background:    #000000;
  --foreground:    #FFFFFF;
  --card:          #1C1C1E;
  --primary:       #0A84FF;   /* iOS dark blue */
  --destructive:   #FF453A;
  --border:        rgba(84,84,88,0.65);
  /* ... full dark map in REBUILD_PLAN.md §1.2 */
}
```

---

## 3. Color System

### Brand Colors (Layer 1 — EduFlow primitives)

| Token | Value | shadcn semantic | Usage |
|---|---|---|---|
| `--ef-brand` | `#007AFF` | `--primary` | iOS Blue — primary CTA, active states, links |
| `--ef-brand-hover` | `#0062CC` | hover state | Hover / pressed state |
| `--ef-brand-light` | `#EAF3FF` | `--accent` | Soft fill backgrounds, hover regions |
| `--ef-brand-muted` | `rgba(0,122,255,0.08)` | — | Focus ring, subtle tints |

### Semantic Colors (Layer 1 → Layer 2 mapping)

| Token | Value | shadcn semantic | Usage |
|---|---|---|---|
| `--ef-green` | `#34C759` | `--success-foreground` | Available · Success · Approved |
| `--ef-green-light` | `#E5F9EC` | `--success` | Success background fill |
| `--ef-green-dark` | `#1A6B30` | text on success bg | Success text on light bg |
| `--ef-amber` | `#FF9500` | `--warning-foreground` | Warning · Pending · Alt-subject proxy |
| `--ef-amber-light` | `#FFF2D6` | `--warning` | Warning background fill |
| `--ef-amber-dark` | `#7A4700` | text on warning bg | Warning text on light bg |
| `--ef-red` | `#FF3B30` | `--destructive` | Error · Danger · Absent · Suspended |
| `--ef-red-light` | `#FFE8E7` | — | Error background fill |
| `--ef-red-dark` | `#7A1B17` | — | Error text on light bg |
| `--ef-purple` | `#6C63FF` | `--chart-4` | Humanities · Affiliate tier badges |
| `--ef-purple-light` | `#F0EFFE` | — | Purple background fill |
| `--ef-cyan` | `#32ADE6` | `--chart-5` / `--info-foreground` | Informational / Neutral |
| `--ef-cyan-light` | `#E3F5FD` | `--info` | Info background fill |

### Neutral Scale

| Token | Value | Tailwind equivalent |
|---|---|---|
| `#1C1C1E` | `--foreground` in dark | `text-foreground` |
| `#2C2C2E` | `--secondary` in dark | `bg-secondary` |
| `#636366` | — | `text-muted-foreground/60` |
| `#8E8E93` | — | `text-muted-foreground` |
| `#AEAEB2` | — | `text-muted-foreground/70` |
| `#D1D1D6` | — | `border-border` approx |
| `#E5E5EA` | `--secondary` / `--input` | `bg-secondary`, `bg-input` |
| `#F2F2F7` | `--background` / `--muted` | `bg-background`, `bg-muted` |
| `#FFFFFF` | `--card` | `bg-card` |

### Surface Colors

| Token | Value | Tailwind class |
|---|---|---|
| Page background | `#F2F2F7` | `bg-background` |
| Card / panel surface | `#FFFFFF` | `bg-card` |
| Sidebar | `rgba(255,255,255,0.97)` | `bg-sidebar` |
| Popover / dropdown | `#FFFFFF` | `bg-popover` |

### Text & Separator

| Token | Value | Tailwind class |
|---|---|---|
| Primary text | `#000000` | `text-foreground` |
| Secondary / muted text | `rgba(60,60,67,0.60)` | `text-muted-foreground` |
| Placeholder / disabled | `rgba(60,60,67,0.30)` | `text-muted-foreground/50` |
| Dividers / borders | `rgba(60,60,67,0.12)` | `border-border` |

---

## 4. Typography

**Font:** Inter (Google Fonts CDN) — same as Linear, Vercel, Notion, Stripe.

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif;
font-feature-settings: 'cv11', 'ss01';
-webkit-font-smoothing: antialiased;
```

### Type Scale

| Use | Size | Weight | Class |
|---|---|---|---|
| Page title (H1) | 22–24px | 700 | `text-2xl font-bold tracking-tight` |
| Card heading (H2) | 16px | 600 | `text-base font-semibold` |
| Body / table data | 14px | 400 | `text-sm` |
| Caption / label | 12px | 500 | `text-xs font-medium` |
| Micro / badge | 10–11px | 700 | `text-[10px] font-bold` |

---

## 5. Spacing, Grid & Radius

### Radius Scale (derived from `--radius: 0.875rem`)

| Token | Value | Tailwind class |
|---|---|---|
| Pill / full round | 9999px | `rounded-full` |
| 2XL | ~26px | `rounded-2xl` |
| XL | ~20px | `rounded-xl` |
| LG (base) | 14px | `rounded-lg` |
| MD | 12px | `rounded-md` |
| SM | 8px | `rounded-sm` |

### Page Layout

```
Page padding:    28px 32px (desktop) → 20px (tablet) → 16px (mobile)
Section gap:     24px (desktop) → 20px (tablet) → 16px (mobile)
Card padding:    20–24px
Filter bar gap:  10px
KPI grid gap:    16px
```

### Responsive Grid

| Layout | Class |
|---|---|
| 4-col KPI grid | `grid grid-cols-2 md:grid-cols-4 gap-4` |
| 3-col card grid | `grid grid-cols-1 md:grid-cols-3 gap-4` |
| 2-col layout | `grid grid-cols-1 md:grid-cols-2 gap-4` |
| Sidebar + content | `flex` (sidebar fixed) + `flex-1 min-w-0` |

---

## 6. Shadows & Elevation

| Level | Value | Tailwind |
|---|---|---|
| XS (cards) | `0 1px 3px rgba(0,0,0,0.06)` | `shadow-sm` |
| SM (elevated cards) | `0 2px 8px rgba(0,0,0,0.08)` | `shadow` |
| MD (drawers, popovers) | `0 4px 20px rgba(0,0,0,0.10)` | `shadow-md` |
| LG (modals) | `0 8px 40px rgba(0,0,0,0.14)` | `shadow-lg` |

---

## 7. Layout System

### App Shell

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (260px collapsible)  │  Main Content Area   │
│  ┌────────────────────────┐   │  ┌───────────────┐  │
│  │ Logo + School Name     │   │  │  Topbar       │  │
│  ├────────────────────────┤   │  ├───────────────┤  │
│  │ Nav groups + items     │   │  │  Page content │  │
│  │ (role-aware)           │   │  │  (scrollable) │  │
│  ├────────────────────────┤   │  └───────────────┘  │
│  │ Role switcher + footer │   │                      │
│  └────────────────────────┘   │                      │
└─────────────────────────────────────────────────────┘
```

### Page Anatomy (every page)

```tsx
<div className="flex flex-col gap-6 p-6 md:p-8">       {/* page-content */}
  <PageHeader icon={} title="" subtitle="" actions={} />
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4"> {/* KPI strip */}
    <KpiCard />  <KpiCard />  <KpiCard />  <KpiCard />
  </div>
  <FilterBar>                                             {/* search + filters */}
    <SearchInput /> <Select /> <Button />
  </FilterBar>
  <Card>                                                  {/* main content */}
    <CardHeader><CardTitle /></CardHeader>
    <CardContent><DataTable /></CardContent>
  </Card>
</div>
```

---

## 8. Component Library

### Tier 1 — shadcn/ui Primitives (`components/ui/`)
Generated by shadcn CLI. Never edited directly.

`Button` `Card` `CardHeader` `CardContent` `CardFooter` `Badge` `Avatar`
`Input` `Select` `Switch` `Checkbox` `Textarea` `Label` `Form`
`Dialog` `Sheet` `Popover` `Tooltip` `AlertDialog` `DropdownMenu`
`Table` `Tabs` `Accordion` `Sidebar` `Separator` `Progress`
`Toast` / `Sonner` `Alert` `Skeleton` `Command` `Calendar`

### Tier 2 — Shared Composites (`components/shared/`)
Built from Tier 1. Used across all domains and roles.

| Component | Purpose |
|---|---|
| `PageHeader` | Every page's title + subtitle + action buttons |
| `KpiCard` | KPI stat card with optional sparkline |
| `MiniSparkline` | Inline line/bar/arc sparkline chart |
| `FilterBar` | Responsive filter row (search + selects + buttons) |
| `SearchInput` | Controlled search input for filter bars |
| `DataTable` | Sortable, filterable table wrapper |
| `SortIcon` | Table column sort indicator |
| `EmptyState` | No-results / zero-data state |
| `StatusBadge` | Status string → colored Badge |
| `ConfirmDialog` | Reusable delete/confirm dialog |
| `ExportMenu` | PDF/CSV export dropdown |

### Tier 3 — Domain Components (`components/domain/`)
Built from Tier 1 + Tier 2. Encode business logic.

| Domain | Components |
|---|---|
| Proxy | `ProxyBoard`, `ProxyCard`, `AssignModal`, `CoverageDonut` |
| Absence | `AbsenceForm`, `AbsenceRow`, `PeriodPicker` |
| Teacher | `TeacherCard`, `TeacherForm`, `WorkloadHeatmap` |
| Student | `StudentCard`, `AttendanceGrid` |
| Fee | `FeeReceiptCard`, `DefaulterRow` |
| Timetable | `TimetableGrid`, `PeriodCell` |
| Chat | `EduFlowAssistant` (AI chatbot FAB) |
| Charts | `BarChart`, `LineChart`, `DonutChart`, `HeatMap` |

---

## 9. School Modules

### Proxy Board (Core Feature)

The proxy board is a teacher × period grid. Each cell shows a colored availability dot paired with a text label:

| Dot color | Tailwind | Meaning |
|---|---|---|
| 🟢 Green | `bg-[var(--ef-green)]` | Available, same subject as absent teacher |
| 🟡 Amber | `bg-[var(--ef-amber)]` | Available, different subject |
| ⚫ Gray | `bg-muted-foreground` | At daily/weekly/monthly proxy cap |
| 🔴 Red | `bg-destructive` | Unavailable — in class or declined |

**Auto-assign algorithm** scores candidates (+10 same subject, +5 class familiarity, +4 same section, load-balance adjustments) and returns the top 3 candidates. See `AGENTS.md §9` and `REBUILD_PLAN.md §5`.

### Attendance Modes

Controlled by `SchoolSettingsContext`:
- `per-period` — roll call for every period slot
- `single-daily` — one present/absent per student per day

### Period Schedule (HCEA default)

P1 9:30–10:10 · P2 10:10–10:50 · P3 10:50–11:30 · P4 11:30–12:10 · Tiffin 12:10–12:30 · P5 12:30–1:10 · P6 1:10–1:50 · P7 1:50–2:30

---

## 10. Platform & UX Patterns

### Command Palette (⌘K / Ctrl+K)
Global search across teachers, classes, pages. Rendered via shadcn `Command` component.

### Notification System
In-app notification center + pluggable channels: SMS (MSG91), WhatsApp (WATI), Email (SendGrid). Schools provide their own API keys via the Notification Hub settings page.

### EduFlow Assistant
AI chatbot FAB (bottom-right). Mock response engine in prototype; wired to real LLM in production. Context-aware by role. Quick-prompt chips for common actions.

### WeatherClock Widget
Live weather + clock for greeting banners. Uses Open-Meteo API (free, no key). Defaults to Howly, Assam (lat 26.45, lon 90.87). Animated SVG weather scenes.

---

## 11. Dark Mode

Dark mode uses `.dark` class on `<html>` (toggled manually) + `prefers-color-scheme` media query.

All color tokens have dark-mode overrides. The token bridge means zero component changes — only the `:root` / `.dark` values change.

Dark mode primitive values:
```css
.dark {
  --ef-brand:  #0A84FF;    /* iOS dark blue */
  --ef-green:  #30D158;
  --ef-amber:  #FF9F0A;
  --ef-red:    #FF453A;
  /* Neutrals invert: g50 ↔ g900 */
}
```

**Status:** Partial rollout in prototype. Full rollout planned in production app (Phase 0.1 in `ROADMAP.md`).

---

## 12. Accessibility

- Color dots on proxy board **always** paired with text label (WCAG 1.4.1)
- All interactive elements have visible focus styles (`ring-ring ring-offset-2`)
- Form labels use `htmlFor`/`id` association
- Radix UI primitives provide ARIA roles, keyboard nav, screen reader announcements
- Minimum touch target: 44×44px (iOS HIG)
- Contrast: primary text on white background meets WCAG AA (4.5:1)
- Full validation requires manual testing with assistive technologies

---

## 13. Tech Stack

### Vite Prototype (current repo)
| Layer | Technology |
|---|---|
| Build | Vite 5 + React 18 + TypeScript |
| Styling | Tailwind CSS v4 + custom CSS (`--sch-*` tokens) |
| UI primitives | Radix UI + shadcn/ui wrappers |
| Icons | Lucide React |
| Charts | SVG (inline) + Recharts |
| Tests | Vitest + Testing Library |

### Production App (Next.js 15 — see `REBUILD_PLAN.md`)
| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router, React 19) |
| Styling | Tailwind CSS v4 + shadcn/ui PRO V6 tokens |
| UI components | shadcn/ui (CLI-generated, Radix UI primitives) |
| Icons | Lucide React |
| CMS / Backend | Payload CMS v3 |
| Database | PostgreSQL (Railway/Neon) + SQLite (local) |
| Auth | Payload CMS Auth (role-based) |
| Billing | Razorpay Subscriptions (INR) |
| Real-time | Payload CMS Realtime / polling |
| Testing | Vitest + Testing Library + Playwright |
| `g100` | `#E5E5EA` |
| `g50` | `#F2F2F7` |
| `white` | `#FFFFFF` |

### Surface Colors

| Token | Value | Usage |
|---|---|---|
| `bg` | `#F2F2F7` | Page background |
| `cardBg` | `#FFFFFF` | Card / panel surface |
| `sidebarBg` | `rgba(255,255,255,0.97)` | Sidebar with blur |

### Text & Separator

| Token | Value | Usage |
|---|---|---|
| `t1` | `#000000` | Primary text |
| `t2` | `rgba(60,60,67,0.60)` | Secondary / muted text |
| `t3` | `rgba(60,60,67,0.30)` | Placeholder / disabled |
| `sep` | `rgba(60,60,67,0.12)` | Dividers, borders |

> **Rule:** Never use raw hex values inline. Always reference a token from `ds` (the design token object).

---

## 3. Typography

### Font Stack

```css
/* Primary */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;

/* Monospace */
font-family: 'JetBrains Mono', ui-monospace, monospace;
```

Both fonts loaded via Google Fonts CDN. Inter for all UI text; JetBrains Mono for IDs, timestamps, code snippets, and monospace values.

### Type Scale

| Level | Size | Weight | Letter-Spacing | Use Case |
|---|---|---|---|---|
| Large Title | 32px | 800 | -0.8px | Hero headings, page H1 |
| Title 1 | 24px | 700 | -0.5px | Section titles |
| Title 2 | 18px | 700 | -0.3px | Card headers |
| Headline | 15px | 600 | — | Sub-headers |
| Body | 14px | 400 | — | All body text |
| Footnote | 12px | 400 | — | Secondary / muted content |
| Caption | 10px | 700 | +0.08em | UPPERCASE labels, section indexes |
| Mono | 12px | 400–500 | — | IDs, timestamps, code |

### Usage Examples

```tsx
// Page title
<h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.8px' }}>

// Section header
<h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.4px' }}>

// Card title
<div style={{ fontSize: 13, fontWeight: 600 }}>

// Body text
<p style={{ fontSize: 14, color: ds.t2 }}>

// Caption / label
<div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: ds.t3 }}>

// Monospace
<code style={{ fontSize: 12, fontFamily: ds.mono }}>
```

---

## 4. Spacing, Grid & Radius

### Spacing Scale

**4px base unit. Every spacing is a multiple of 4.**

| Name | Value | Usage |
|---|---|---|
| `xs` | 4px | Icon gaps, tight internal spacing |
| `sm` | 8px | Component internal padding |
| `md` | 16px | Card padding |
| `lg` | 24px | Section gaps |
| `xl` | 32px | Page section padding |
| `2xl` | 48px | Major section separators |

### Grid System

```tsx
// 2-column grid
gridTemplateColumns: 'repeat(2, 1fr)', gap: 14

// 3-column grid
gridTemplateColumns: 'repeat(3, 1fr)', gap: 14

// 4-column grid
gridTemplateColumns: 'repeat(4, 1fr)', gap: 14

// 10-column icon grid
gridTemplateColumns: 'repeat(10, 1fr)', gap: 10

// 11-column color scale
gridTemplateColumns: 'repeat(11, 1fr)', gap: 6
```

### Border Radius

| Value | Usage |
|---|---|
| 4px | Kbd keys, small chips |
| 8px | Settings rows, small cards |
| 10px | Standard inputs |
| 14px | Large cards |
| 18px | Modals, overlays, hero sections |
| 24px | Pricing cards |
| 999px | Buttons, badges, chips (pill) |

---

## 5. Shadows & Elevation

| Token | Value | Usage |
|---|---|---|
| `shXs` | `0 1px 3px rgba(0,0,0,0.06)` | Subtle lift, notification rows |
| `shSm` | `0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)` | Default card |
| `shMd` | `0 4px 20px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.05)` | Hover state, dropdowns |
| `shLg` | `0 8px 40px rgba(0,0,0,0.14), 0 4px 12px rgba(0,0,0,0.06)` | Modals, command palette |

**Elevation principle:** Cards rest at `shSm`. On hover, they lift to `shMd` with a `translateY(-2px)` transform via Framer Motion. Modals and overlays use `shLg`.

---

## 6. Layout System

### App Shell

```
┌─────────────────────────────────────────────────────┐
│  Sidebar (232px fixed)  │  Main Content Area         │
│  ─────────────────────  │  ─────────────────────     │
│  Logo + version badge   │  Topbar (sticky, 52px)     │
│  ─────────────────────  │  ─────────────────────     │
│  Foundation             │  Page header               │
│    Colors               │    Badges + H1 + desc      │
│    Typography           │  ─────────────────────     │
│    Spacing & Grid       │  Content sections          │
│    Shadows              │    (max-width: 1280px)     │
│    Icons                │    padding: 32px 36px      │
│  ─────────────────────  │                            │
│  Components             │                            │
│  School Modules         │                            │
│  Platform & UX          │                            │
└─────────────────────────────────────────────────────┘
```

### Sidebar

- **Width:** 232px, `position: fixed`, full viewport height
- **Background:** `rgba(255,255,255,0.97)` with `border-right: 1px solid ds.sep`
- **Logo area:** 30×30px brand mark (`#007AFF`, borderRadius 9) + "EduFlow" wordmark + `v7` badge
- **Nav groups:** Foundation · Components · School Modules · Platform & UX
- **Active item:** `brandLight` background + `brand` text + `brand` icon
- **Hover:** `motion.button` with `whileHover={{ x: 2 }}`
- **Item icon:** 14px Lucide icon, colored by `tint` per item
- **Count badge:** Red pill in top-right for items with counts (e.g. Badges: 8)
- **Scrollbar:** Hidden via `.sidebar-scroll::-webkit-scrollbar { width: 0 }`

### Topbar

- `position: sticky`, `top: 0`, `height: 52px`, `zIndex: 50`
- `background: rgba(242,242,247,0.88)` with `backdropFilter: blur(20px)`
- Contains: title, search bar (220px, `⌘K` shortcut), notification bell (with red dot), theme toggle, user avatar

### Content Area

- `marginLeft: 232px` to clear sidebar
- `padding: 32px 36px`
- `maxWidth: 1280px`
- Sections separated by `1px solid ds.sep` dividers with `56px` vertical margin

---

## 7. Component Library

### Icon

Lucide icons rendered via the UMD build. Each icon export is an array of SVG child tuples `[[tag, attrs], ...]`. Built into SVG DOM nodes at runtime using `createElementNS`.

```tsx
<Icon name="CheckCircle2" size={16} color={ds.green} strokeWidth={2.2} />
```

Props: `name` (PascalCase or kebab-case), `size`, `color`, `strokeWidth`, `style`

---

### Badge

```tsx
<Badge tone="green" dot>Approved</Badge>
```

**Tones:**

| Tone | Background | Text | Meaning |
|---|---|---|---|
| `green` | `greenLight` | `greenDark` | Approved / Available / Active |
| `amber` | `amberLight` | `amberDark` | Pending / Warning / Grace |
| `red` | `redLight` | `redDark` | Rejected / Error / Suspended |
| `blue` | `brandLight` | `brand` | Assigned / Primary State |
| `violet` / `purple` | `purpleLight` | `purpleDark` | Affiliate / Humanities |
| `gray` | `g100` | `g600` | Inactive / Past / Maxed Out |
| `cyan` | `cyanLight` | `cyanDark` | Informational / Notified |

Optional `dot` prop adds a 5px colored dot before the label. Font: 11px, weight 600, `borderRadius: 999`.

---

### Button (`Btn`)

```tsx
<Btn variant="primary" size="md" icon={<Icon name="Plus" size={14} />} full>
  Add Teacher
</Btn>
```

**Variants:**

| Variant | Background | Text | Hover bg |
|---|---|---|---|
| `primary` | `brand` | white | `brandHover` |
| `secondary` | `g50` | `t1` | `g100` |
| `ghost` | transparent | `brand` | `brandLight` |
| `outline` | transparent | `brand` | `brandLight` |
| `danger` | `redLight` | `redDark` | `#FFD6DF` |
| `success` | `greenLight` | `greenDark` | `#C8F5E0` |
| `warning` | `amberLight` | `amberDark` | `#FFE0A0` |

**Sizes:**

| Size | Height | Padding | Font |
|---|---|---|---|
| `sm` | 30px | 0 12px | 12px |
| `md` | 38px | 0 16px | 14px |
| `lg` | 46px | 0 24px | 15px |

All buttons: `borderRadius: 999` (pill), `fontWeight: 600`, `transition: all 0.15s ease`.

---

### Card

```tsx
<Card padding={18} hover>
  {children}
</Card>
```

- `background: ds.cardBg`, `borderRadius: 14`, `border: 1px solid ds.sep`
- Default shadow: `shSm`
- Hover (via Framer Motion `animate`): lifts to `shMd` + `translateY(-2px)`

---

### Avatar

```tsx
<Avatar initials="PS" gradient="linear-gradient(135deg, #007AFF, #32ADE6)" size={32} radius={8} />
<Avatar initials="PS" src="/photo.jpg" size={40} />
```

Gradient background with white initials when no `src`. Falls back to `<img>` when `src` provided.

---

### Input / Select / Field

```tsx
<Field label="Full Name" required hint="As per records" error="Required">
  <Input placeholder="Priya Sharma" prefix={<Icon name="User" size={14} />} />
</Field>
<Sel><option>Active</option></Sel>
```

- Background: `g50`, border: `1.5px solid g100` → `brand` on focus
- Focus ring: `0 0 0 3px brandMuted`
- Border radius: 10px, font size: 14px

---

### Toggle

```tsx
<Toggle checked label="Push notifications" sub="5 min before class" />
```

44×24px iOS-style toggle. Animated thumb via Framer Motion. Rows separated by `1px solid ds.sep`.

---

### Tabs

```tsx
<Tabs tabs={[{ id: 'all', label: 'All', count: 12 }]} active="all" onChange={setActive} />
```

`g50` background container, `borderRadius: 12`, `padding: 4`. Active tab: `cardBg` + `shSm`.

---

### ProgressBar

```tsx
<ProgressBar value={72} max={100} tone="brand" height={6} />
```

Tones: `brand` · `green` · `amber` · `red`. Animated width via `whileInView`.

---

### Skeleton

```tsx
<Skeleton width={200} height={14} radius={6} />
```

Shimmer: `linear-gradient(90deg, g100 25%, g50 50%, g100 75%)` with `background-size: 200%` sweep animation at 1.4s.

---

### SectionHeader

```tsx
<SectionHeader index="Section 01" title="Color System" sub="Bright, intentional palette" />
```

Index in 10px uppercase `t3`. Title at 22px/700. Sub at 13px `t2`. Fade-in via `whileInView`.

---

## 8. School Modules

The HTML defines 38 sections in this order. Section numbers match the `SectionHeader index` values in the code.

### Section 01 — Color System
8 primary swatches + 11-step neutral scale. Each swatch: colored block + name + hex + usage.

### Section 02 — Typography
8 type scale rows in a card list. Each row: sample text left, meta (size · weight · tracking) right in monospace.

### Section 03 — Spacing & Grid
Two cards: spacing scale (visual bars) + border radius (live preview squares with Framer Motion hover scale).

### Section 04 — Shadows & Elevation
5-column grid. Each card shows its own shadow. `whileHover={{ y: -4 }}` demo.

### Section 05 — Icons
30 icons in a 10-column grid. Each cell: icon + name in monospace. `whileHover={{ scale: 1.15, background: brandLight }}`.

### Section 06 — Stat Cards
4-column grid. Each card: colored icon square (40×40px, borderRadius 11) + uppercase label + large value (28px/800) + trend badge + period text.

### Section 07 — Proxy Assignment Board
4-column grid of period cards. States:
- `open` — brand badge, "Assign" button, optional red unassigned count pill
- `done` — green badge, teacher name + "Edit" ghost button
- `past` — gray badge, 55% opacity, "Period ended" text

### Section 08 — Availability Indicators
Two-column: legend card (4 dot + label rows) + teacher list card (dot + name + subject + quota + action button). Accessibility rule: color always paired with text label.

### Section 09 — Badges & Statuses
3-column grid: Absence Status · Proxy Status · Subscription tones.

### Section 10 — Buttons
3-column grid: Variants · Sizes · With Icons.

### Section 11 — Forms
Full "Add Teacher" card form. 2-column field grid + notification preferences panel (3 toggles on `g50` bg) + Cancel/Save footer.

### Section 12 — Data Tables
"Today's Absences" table. Toolbar + thead (10px uppercase) + `motion.tr` with `whileHover={{ backgroundColor: g50 }}` + pagination footer.

### Section 13 — Alerts
4 semantic tones stacked vertically. Each: colored icon square + title + message. Slide-in via `whileInView`.

### Section 14 — Notifications
3 notification rows. Unread: `#F5F8FF` bg + `rgba(0,122,255,0.14)` border + 6px brand dot. Read: white bg + sep border. Each row: icon square + title + message + time + "View" button.

### Section 15 — Modals & Overlays
Live "Open Modal" demo with `AnimatePresence` spring animation + static preview of the modal below. Overlay: `rgba(10,10,11,0.4)`. Modal: white, `borderRadius: 18`, `shLg`, `maxWidth: 420px`.

### Section 16 — Settings Rows
6 rows in a card. Each: 28×28px colored icon square + label + sub-label + right content (string, Toggle, Badge, or Button).

### Section 17 — Empty States
3-column grid. Each: 56×56px icon container + title + description + "Get Started" button.

### Section 18 — Loading States
2-column grid: Stat Card skeleton + Table Row skeletons (3 rows with shimmer blocks).

### Section 19 — Teacher Profile
2-column: profile card (avatar + stats row: Proxies / Absences / Coverage) + monthly coverage card (4 subject progress bars with color-coded tones).

### Section 20 — Teacher Directory
3-column card grid. Each card:
- 48×48px gradient avatar + name + subject + section
- Availability badge (Available / In Class / Maxed Out / On Leave) with dot
- Proxy quota `used/quota` in monospace + color-coded ProgressBar (brand → amber → red as quota fills)
- Footer: "Profile" button + conditional "Assign" button (only when `status === 'available'`)

### Section 21 — Teacher Profile+
2-column layout:
- Left: 80×80px avatar with camera overlay button (28×28px brand circle, bottom-right), subject expertise checkboxes (2-column grid, animated border/bg on select), Active + Senior Teacher badges
- Right: Assigned class chips (removable with X icon), bio textarea, employment type + department selects, Cancel/Save footer

### Section 22 — Super Admin
4-column metric cards (Schools: 142, Teachers: 6,840, MRR: ₹8.4L, Churn Risk: 3) + "All Schools" list card with school avatar, name, plan, status badge, chevron.

### Section 23 — Timetable
Period builder card. Each row: period badge + time (monospace) + subject chips (color-coded by subject) + dashed "Add" button. Break rows show italic text. `whileInView` slide-in animation.

### Section 24 — Period Swap
2-column: New swap request form (My Period select, Swap With Teacher select, reason input, urgency radio: Normal/Urgent/SOS with color-coded borders) + My Requests list (two period boxes connected by ArrowLeftRight icon, status badge, Withdraw button for pending).

### Section 25 — Exam Routine
Table with columns: Date, Subject (colored icon + name), Class/Section (monospace), Duration, Venue (MapPin icon). Alternating row backgrounds. Export button in header.

### Section 26 — Class Manager
3-column card grid. Each card: class name + grade + section pills (color-coded) + stats row (Students / Subjects / Sections). "Add New Class" dashed card with hover animation.

### Section 27 — Onboarding Wizard
5-step wizard with animated stepper (green = done, brand = active, gray = pending):
1. School Info — name, city, phone, email
2. School Type — 4 cards (Pre-Primary / Primary / Secondary / Sr. Secondary)
3. Grades — pill toggle buttons (Nursery → XII), multi-select
4. Board — dropdown with NE India boards first (SEBA, AHSEC, Manipur, Meghalaya, Nagaland, Tripura), then CBSE/ICSE/IB/Custom
5. Review — green checkmark success state

`AnimatePresence mode="wait"` slide transition between steps.

### Section 28 — Billing
Dark gradient hero (`#001A66 → #003ACC → #007AFF`) showing current plan (Half-Yearly, ₹4,999, 48 teachers, Jun 2027 renews) + 4-column plan grid:

| Plan | Price | Period | Featured |
|---|---|---|---|
| Starter | ₹999 | /mo | — |
| Quarterly | ₹2,699 | /3mo | — |
| Half-Yearly | ₹4,999 | /6mo | ✓ "Most Popular" |
| Annual | ₹8,999 | /yr | — |

Featured plan: `2px solid brand` border + "Most Popular" pill badge. Savings badge in `greenLight`.

### Section 29 — Razorpay Billing
2-column: dark card (`#1A1A2E → #0F3460`) with plan name, price, billing details grid, Manage + Upgrade buttons + Webhook event log card (Terminal icon, event rows with colored status dots, event type in monospace, amount + timestamp, success/failed badge).

### Section 30 — Pricing Plans
4-column card grid:

| Plan | Price | Style |
|---|---|---|
| Starter | ₹999/mo | White card |
| Standard | ₹1,999/mo | Blue gradient (`#0048D4 → #007AFF`), "POPULAR" badge |
| Pro | ₹4,999/mo | White card |
| Enterprise | ₹8,999/mo | Dark `g900` card |

Each card: plan name, teacher limit, price, feature list with `CheckCircle2` icons, CTA button. `whileHover={{ y: -4, boxShadow: shLg }}`.

### Section 31 — Navigation Patterns
3-column grid:
- **Segmented Tabs** — `g100` bg container, active tab on white with `shXs`, content preview below
- **Progress Stepper** — numbered circles with animated color, connecting lines, Back/Next buttons
- **Dropdown Menu** — `AnimatePresence` slide-in, items with icons, danger item in `red`

### Section 32 — Super Admin *(see Section 22)*

### Section 33 — Multi-Tenancy
2-column: school list (click to switch, active checkmark) + active tenant detail card (metrics grid: Teachers, Classes, Coverage, MRR, Status, Renews).

### Section 34 — Command Palette
Centered `maxWidth: 560px`. Search input + `⌘K` shortcut display. Grouped results (Teachers, Actions) with colored icon squares. Active item: brand left border + `brandLight` bg. Keyboard hint footer.

### Section 35 — PDF & Excel Exports
2-column: export options list (icon + label + format badge + Export button) + print preview panel (school name, date range, data rows).

### Section 36 — XLSX Importer
2-column: drag-and-drop zone with `UploadCloud` icon, animated progress bar, success state + preview table with validation (missing fields in red, valid rows with `CheckCircle2`, error rows with `AlertTriangle`). Import button shows valid row count.

### Section 37 — Charts
2-column:
- **Bar chart** — weekly coverage by day, animated bar heights via `whileInView`, color-coded bars (brand/green/amber/red)
- **Line chart** — 12-month trend, inline SVG `<polyline>` + gradient fill `<polygon>` + dot markers

### Section 38 — Toasts
Live demo with 3 trigger buttons. Toasts slide in from bottom-right via `AnimatePresence` spring animation, auto-dismiss after 3.5s:

| Type | Background | Text |
|---|---|---|
| Success | `#064E3B` | `#D1FAE5` |
| Error | `#7F1D1D` | `#FEE2E2` |
| Info | `#1E293B` | `#F8FAFC` |

Each toast: icon square + title + sub-text + close button. `minWidth: 280px`, `maxWidth: 380px`, `borderRadius: 12`, `shLg`.

### Section 39 — PWA
2-column: install prompt card (brand→cyan gradient, Smartphone icon, "Install App" button) + PWA features list:
- Offline schedule & proxy board (Service Worker)
- Web Push notifications
- QR proxy check-in (printable)
- Background sync on reconnect

---

## 9. Platform & UX Patterns

### Alerts

4 tones with icon square + title + message. Slide-in via `whileInView`:

| Tone | Background | Border | Text |
|---|---|---|---|
| `info` | `#EBF4FF` | `#B8D4FF` | `#002699` |
| `success` | `greenLight` | `#A3EFD0` | `greenDark` |
| `warn` | `amberLight` | `#FFD49E` | `amberDark` |
| `error` | `redLight` | `#FFBDCB` | `redDark` |

---

### Notifications

Unread: `#F5F8FF` bg + `rgba(0,122,255,0.14)` border + 6px `brand` dot.
Read: `cardBg` bg + `sep` border.
Each row: icon square + title + message + time + "View" button. `whileHover={{ y: -1, boxShadow: shMd }}`.

---

### Modals / Overlays

- Overlay: `rgba(10,10,11,0.4)` fixed backdrop, click to close
- Modal: `cardBg`, `borderRadius: 18`, `shLg`, `maxWidth: 420px`
- Header: title + close button (26×26px, `g100` bg, `borderRadius: 7`)
- Footer: `g50` background, right-aligned Cancel + primary action buttons
- Animation: `AnimatePresence` with spring (`stiffness: 400, damping: 30`), `scale: 0.92 → 1`, `y: 16 → 0`

---

### Settings Rows

Grouped in cards. Each row: 28×28px colored icon square + label (13px/500) + sub-label (10px `t2`) + right content (string, Toggle, Badge, or Button). `whileHover={{ background: g50 }}`.

---

### Navigation Patterns

- **Segmented Tabs:** `g100` bg, `borderRadius: 12`, `padding: 4`. Active tab: `cardBg` + `shXs`.
- **Progress Stepper:** Circles animate color via Framer Motion `animate`. Connecting lines transition from `g200` to `green` as steps complete.
- **Dropdown Menu:** `AnimatePresence` with `scale: 0.96 → 1`, `y: -8 → 0`. Items: icon + label, danger item in `red`.

---

### Toasts

Slide in from bottom-right (`x: 60 → 0`). Spring animation. Auto-dismiss at 3.5s. Dark semantic backgrounds. Icon square + title + sub + close button. `position: fixed, bottom: 24, right: 24, zIndex: 300`.

---

### Multi-Tenancy

School switcher in sidebar. Each tenant fully isolated. Left: school list with colored avatar, name, city, active checkmark. Right: metrics grid (6 cells: Teachers, Classes, Coverage, MRR, Status, Renews).

---

### Command Palette

`maxWidth: 560px`, centered. `shLg`. Search input with `⌘K` shortcut. Grouped results with section headers (10px uppercase `t3`). Active item: `3px solid brand` left border + `brandLight` bg. Footer: `↵ Select · ↑↓ Navigate · esc Close`.

---

### PDF & Excel Exports

Export options list with format badge (PDF/XLSX) + Export button. Print preview panel with school name header, date range, and data rows at 11px.

---

### XLSX Importer

Drag-and-drop zone → animated progress bar → success state. Preview table: valid rows transparent, error rows `redLight + 55` bg. Missing fields shown as `⚠ Missing` in `red`. Import button shows count of valid rows only.

---

### Charts

Built with inline SVG — no external chart library in the design system HTML.
- **Bar chart:** `motion.div` bars with `whileInView={{ height }}` animation, color-coded by value
- **Line chart:** `<polyline>` stroke + `<polygon>` gradient fill + `<circle>` dot markers. Gradient via `<linearGradient>` with `stopOpacity: 0.15 → 0`.

---

### Empty States

Centered layout: 56×56px icon container (`g50` bg, `sep` border, `borderRadius: 16`) + 15px/600 title + 13px `t2` description + action button. `whileInView` fade-in.

---

### Loading States (Skeletons)

Shimmer: `linear-gradient(90deg, g100 25%, g50 50%, g100 75%)` with `background-size: 200% 100%` and `animation: shimmer 1.4s ease-in-out infinite`. Matches shape of real content.

---

### PWA

- Service Worker for offline schedule + proxy board
- "Add to Home Screen" install prompt (brand→cyan gradient card)
- Web Push for management + teacher notifications
- QR codes for proxy check-in (printable)
- Background sync on reconnect

---

## 10. Dark Mode

Toggle via user profile → appearance toggle. System preference respected on first load.

**Dark surface overrides:**

| Token | Light | Dark |
|---|---|---|
| `bg` | `#F2F2F7` | `#1C1C1E` |
| `cardBg` | `#FFFFFF` | `#2C2C2E` |
| `t1` | `#000000` | `#FFFFFF` |
| `t2` | `rgba(60,60,67,0.60)` | `rgba(235,235,245,0.60)` |
| `sep` | `rgba(60,60,67,0.12)` | `rgba(84,84,88,0.65)` |

---

## 11. Accessibility

- **Color + label rule:** Availability dots and status indicators always pair color with a text label. Never color alone.
- **Minimum tap target:** 44×44px for all interactive elements (mobile).
- **Focus rings:** `0 0 0 3px brandMuted` on all inputs and interactive elements.
- **Contrast:** Primary text (`t1`) on `cardBg` meets WCAG AA. Secondary text (`t2`) used only for supplementary content.
- **Keyboard navigation:** All interactive components support keyboard focus and activation.
- **ARIA:** Buttons have descriptive labels. Form fields use `<label>` elements via the `Field` component.

> Full WCAG compliance requires manual testing with assistive technologies and expert accessibility review.

---

## 12. Tech Stack

### Design System HTML (standalone)

| Layer | Technology |
|---|---|
| Runtime | React 18 UMD (`unpkg.com/react@18`) |
| JSX transform | Babel Standalone (`unpkg.com/@babel/standalone`) |
| Animation | Framer Motion v10.18.0 UMD (`cdn.jsdelivr.net`) |
| Icons | Lucide v1.16.0 UMD (`unpkg.com/lucide@latest`) |
| CSS utilities | Tailwind CSS CDN (`cdn.tailwindcss.com`) |
| Fonts | Google Fonts — Inter + JetBrains Mono |

### Production App

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Inline styles via `ds` tokens + Tailwind CSS 4 |
| Icons | Lucide React |
| Animation | Framer Motion (Motion) |
| Forms | React Hook Form 7 |
| Routing | React Router 7 |
| Toasts | Sonner 2 |
| Command Palette | cmdk 1 |
| Package Manager | pnpm |

### Design Token Object

All tokens live in `src/app/components/tokens.ts` as the `ds` object:

```ts
import { ds } from './tokens';

style={{ background: ds.brand, color: ds.white }}
style={{ border: `1px solid ${ds.sep}` }}
style={{ boxShadow: ds.shSm }}
style={{ fontFamily: ds.mono }}
```

### Component Files

| File | Contents |
|---|---|
| `src/app/components/tokens.ts` | All design tokens (`ds` object) |
| `src/app/components/ui.tsx` | Primitive components (Card, Btn, Badge, Input, Toggle, etc.) |
| `src/app/components/sidebar.tsx` | App sidebar with navigation |
| `src/app/components/sections.tsx` | All design system showcase sections |
| `src/app/App.tsx` | Root app shell |
| `src/styles/theme.css` | Shadcn/Tailwind CSS variables |
| `src/styles/globals.css` | Global resets and base styles |
| `eduflow-design-system.html` | Standalone design system browser preview |

---

# Appendix — Figma File Build Guide

> Merged from the former `FIGMA_DESIGN_GUIDE.md`. **Token source of truth: `src/app/globals.css`** — the values below mirror it so the Figma file and code never drift. Figma community file: `BlFqAE1yNoGDD4IFKyqaIV` (shadcn/ui PRO V6.0).

## The 5-page structure

```
Figma File: EduFlow
├─ 1. Foundations   ← variables: color, type, spacing, radius, shadow  (START HERE)
├─ 2. Components    ← shadcn bricks styled with Foundations variables
├─ 3. Patterns      ← reusable blocks: PageHeader, KpiCard, DataTable, FilterBar…
├─ 4. Screens       ← the real pages, assembled from Patterns
└─ 5. Flows         ← arrows linking screens (proxy / fee / absence flows)
```

A *screen* is 3–4 *patterns* stacked; a *pattern* is a few *components*; a *component* is *foundations* applied. Build bottom-up.

## Page 1 — Foundations (Variables panel, 4 collections; Color has Light/Dark modes)

**Brand primitives** (Light / Dark): `brand` #007AFF / #0A84FF · `brand/hover` #0062CC · `brand/light` #EAF3FF · `green` #34C759 / #30D158 · `amber` #FF9500 / #FF9F0A · `red` #FF3B30 / #FF453A · `purple` #4147D5 / #818CF8 · `cyan` #2F88FF / #64D2FF (plus `*-light`/`*-dark`/`*-mid` tints).

**Semantic (shadcn — components reference these):** `background`, `foreground`, `card`, `popover`, `primary`→`brand`, `secondary`, `muted`, `accent`→`brand/light`, `destructive`→`red`, `border`, `input`, `ring`→`brand`. Use Figma's "alias another variable" where a row points to a primitive (mirrors `--primary: var(--ef-brand)`).

**Status + charts:** `success`/`warning`/`info` (+ `-foreground`), `chart-1..5` mapped to brand/green/amber/purple/cyan.

**radius:** sm 4 · md 6 (base) · lg 8 · xl 12 · 2xl 16 · pill 9999.
**spacing:** 1=4 · 2=8 · 3=12 · 4=16 · 6=24 · 8=32.
**type:** Inter, letter-spacing -0.6%, features `cv11 ss01` (xs 12/500 → 2xl 32/700).
**effects:** shadow-xs/sm/md/lg per `globals.css`.

## Page 2 — Components
Build only EduFlow's bricks as Figma components with variants, styled via Page-1 variables (never raw hex): Button (primary/secondary/ghost/destructive/outline × sm/md/lg), Input, Select, Card, Badge/StatusBadge, Avatar, Tabs, Dialog, Toggle, Sidebar item, Table row.

## Page 3 — Patterns
PageHeader · KpiCard (label + `text-2xl` number + sparkline + delta) · DataTable · FilterBar · EmptyState · ProxyBoard cell (dot + **text label**, never color alone).

ProxyBoard dot legend (must match code): `green` = Available · `amber` = Alt proxy · `muted-foreground` = Maxed out · `red` = Unavailable.

## Page 4 — Screens
Design pages by role in priority order, starting with the core loop: `Admin Dashboard → Absence Tracker → Proxy Board → Teacher: Accept Proxy`. Container max-width 1440px; page padding 16/24/32 (mobile/sm/md); section gap 24px (matches `.page-content`).

## Page 5 — Flows
Connector arrows between Page-4 frames showing intent (mark absent → proxy auto-assigns → teacher accepts).

---

*EduFlow Design System · v7.0 · 39 sections · Built for school management at scale*
*Last updated: 27 May 2026*
