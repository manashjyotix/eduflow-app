# EduFlow — Figma Design Guide

> **Purpose:** End the "where do I start" paralysis. Build the Figma file in 5 layers, left to right. Don't move to the next page until the current one is settled.
>
> **Token source of truth:** `src/app/globals.css`. The values below are extracted from it so your Figma file and the code never drift.

---

## The 5-Page Structure

Create these as Figma **Pages** (left sidebar tabs), in order:

```
Figma File: EduFlow
├── 1. 🎨 Foundations   ← variables: color, type, spacing, radius, shadow  (START HERE)
├── 2. 🧱 Components      ← shadcn bricks styled with Foundations variables
├── 3. 🧩 Patterns        ← reusable blocks: PageHeader, KpiCard, DataTable, FilterBar…
├── 4. 📱 Screens         ← the 69 real pages, assembled from Patterns
└── 5. 🗺️ Flows           ← arrows linking screens (proxy flow, fee flow, absence flow)
```

**Rule of thumb:** A *screen* is just 3–4 *patterns* stacked. A *pattern* is just a few *components*. A *component* is just *foundations* applied. Build bottom-up and nothing feels overwhelming.

---

## Page 1 — Foundations (do this first, one sitting)

In Figma: open the **Variables** panel (right sidebar → the icon, or `Local variables`). Create **4 collections**. Add a `Light` and `Dark` mode to the Color collection.

### Collection: `color` (modes: Light / Dark)

#### Brand primitives
| Variable | Light | Dark |
|---|---|---|
| `brand` | `#007AFF` | `#0A84FF` |
| `brand/hover` | `#0062CC` | `#0A84FF` |
| `brand/light` | `#EAF3FF` | `rgba(10,132,255,0.15)` |
| `brand/muted` | `rgba(0,122,255,0.08)` | `rgba(10,132,255,0.08)` |
| `green` | `#34C759` | `#30D158` |
| `green/light` | `#E5F9EC` | `rgba(48,209,88,0.15)` |
| `green/dark` | `#15803D` | `#4ADE80` |
| `amber` | `#FF9500` | `#FF9F0A` |
| `amber/light` | `#FFF2D6` | `rgba(255,159,10,0.15)` |
| `amber/dark` | `#92400E` | `#FB923C` |
| `red` | `#FF3B30` | `#FF453A` |
| `red/light` | `#FFE8E7` | `rgba(255,69,58,0.15)` |
| `red/dark` | `#B91C1C` | `#F87171` |
| `purple` | `#4147D5` | `#818CF8` |
| `purple/light` | `#D7E0FF` | `rgba(65,71,213,0.15)` |
| `purple/mid` | `#948BFF` | `#A5B4FC` |
| `cyan` | `#2F88FF` | `#64D2FF` |
| `cyan/light` | `#43CCF8` | `rgba(100,210,255,0.15)` |

#### Semantic (shadcn — these are what components reference)
| Variable | Light | Dark |
|---|---|---|
| `background` | `#F8FAFC` | `#020617` |
| `foreground` | `#020617` | `#F8FAFC` |
| `card` | `#FFFFFF` | `#0F172A` |
| `card-foreground` | `#020617` | `#F8FAFC` |
| `popover` | `#FFFFFF` | `#0F172A` |
| `popover-foreground` | `#020617` | `#F8FAFC` |
| `primary` | → `brand` | → `brand` |
| `primary-foreground` | `#FFFFFF` | `#FFFFFF` |
| `secondary` | `#F1F5F9` | `#1E293B` |
| `secondary-foreground` | `#0F172A` | `#F8FAFC` |
| `muted` | `#F1F5F9` | `#1E293B` |
| `muted-foreground` | `#64748B` | `#94A3B8` |
| `accent` | → `brand/light` | → `brand/light` |
| `accent-foreground` | → `brand` | → `brand` |
| `destructive` | → `red` | `#FF453A` |
| `destructive-foreground` | `#FFFFFF` | `#FFFFFF` |
| `border` | `#E2E8F0` | `rgba(248,250,252,0.10)` |
| `input` | `#E2E8F0` | `rgba(248,250,252,0.15)` |
| `ring` | → `brand` | → `brand` |

#### Status + charts
| Variable | Light | Dark |
|---|---|---|
| `success` | `#E5F9EC` | `rgba(52,199,89,0.15)` |
| `success-foreground` | `#15803D` | `#34C759` |
| `warning` | `#FFF2D6` | `rgba(255,149,0,0.15)` |
| `warning-foreground` | `#92400E` | `#FF9500` |
| `info` | `#EFF6FF` | `rgba(10,132,255,0.15)` |
| `info-foreground` | `#1D4ED8` | `#0A84FF` |
| `chart-1` | `#007AFF` | `#0A84FF` |
| `chart-2` | `#34C759` | `#30D158` |
| `chart-3` | `#FF9500` | `#FF9F0A` |
| `chart-4` | `#4147D5` | `#BF5AF2` |
| `chart-5` | `#2F88FF` | `#64D2FF` |

> **Tip:** Where a row says `→ brand`, use Figma's "alias another variable" feature instead of typing the hex. That mirrors how the code does `--primary: var(--ef-brand)` and keeps everything in sync.

### Collection: `radius` (single mode)
| Variable | Value |
|---|---|
| `sm` | `4px` |
| `md` | `6px`  ← base |
| `lg` | `8px` |
| `xl` | `12px` |
| `2xl` | `16px` |
| `pill` | `9999px` |

### Collection: `spacing` (single mode)
| Variable | Value | Use |
|---|---|---|
| `1` | `4px` | tight gaps |
| `2` | `8px` | chip/badge padding |
| `3` | `12px` | KPI grid gap (mobile) |
| `4` | `16px` | card padding, page padding (mobile) |
| `6` | `24px` | section gap, table cell x-padding |
| `8` | `32px` | page padding (desktop) |

### Type styles (Text styles, not variables)
Font: **Inter**, letter-spacing **-0.6%**, features `cv11, ss01`.

| Style | Size | Weight | Use |
|---|---|---|---|
| `text-xs` | 12 | 500 | table headers, captions |
| `text-sm` | 14 | 400 | body, table cells |
| `text-base` | 16 | 400 | default body |
| `text-lg` | 20 | 600 | card titles |
| `text-xl` | 24 | 600 | page titles |
| `text-2xl` | 32 | 700 | KPI numbers, hero |

### Effects (shadow styles)
| Style | Value |
|---|---|
| `shadow-xs` | `0 1px 3px rgba(0,0,0,0.06)` |
| `shadow-sm` | `0 2px 8px rgba(0,0,0,0.08)` |
| `shadow-md` | `0 4px 20px rgba(0,0,0,0.10)` |
| `shadow-lg` | `0 8px 40px rgba(0,0,0,0.14)` |

---

## Page 2 — Components

Build **only the bricks EduFlow uses**, each as a Figma component with variants. Style every fill/stroke/text using Page 1 variables (never raw hex).

Priority set: `Button` (primary/secondary/ghost/destructive/outline × sm/md/lg), `Input`, `Select`, `Card`, `Badge` / `StatusBadge`, `Avatar`, `Tabs`, `Dialog`, `Toggle`, `Sidebar item`, `Table row`.

---

## Page 3 — Patterns (the real shortcut)

These repeat on nearly every screen. Build them once as components:

- **PageHeader** — title + subtitle + action buttons (right)
- **KpiCard** — label + big number (`text-2xl`) + mini sparkline + delta
- **DataTable** — muted header row + sortable columns + zebra rows + pagination
- **FilterBar** — search input + dropdowns + result count
- **EmptyState** — icon + title + description + optional CTA
- **ProxyBoard cell** — availability dot + **text label** (never color alone)

### ProxyBoard dot legend (must match code)
| Dot variable | Meaning | Label |
|---|---|---|
| `green` | available, same subject | "Available" |
| `amber` | available, different subject | "Alt proxy" |
| `muted-foreground` | at cap | "Maxed out" |
| `red` | unavailable / declined | "Unavailable" |

---

## Page 4 — Screens

Design the 69 pages by role, **in priority order**. Start with the core product loop — it exercises almost every pattern:

```
Admin Dashboard → Absence Tracker → Proxy Board → Teacher: Accept Proxy
```

Each screen = stack of Patterns. Example — **Admin Dashboard**:
`PageHeader` + 4× `KpiCard` (in `kpi-grid`) + `DataTable` (proxy status) + activity feed card.

Layout container: max-width **1440px**, page padding 16/24/32px (mobile/sm/md), section gap **24px** — matches `.page-content` in code.

---

## Page 5 — Flows

Use connector arrows between Page 4 frames to show intent (e.g. *mark absent → proxy auto-assigns → teacher accepts*). This is what tells me the "why" when I build.

---

## The build loop (you → me)

1. You finish a frame on Page 4.
2. Right-click the frame → **Copy link** (or give me the frame name).
3. Paste it to me. I pull it via the Figma MCP and build the real Next.js page using your existing `src/components/ui/` shadcn components.
4. We review, tweak, move to the next screen.

> **Why this works:** your `globals.css` tokens === your Figma variables === my generated code. One source of truth, three places, zero drift.
