/**
 * StatusBadge — EduFlow domain status → shadcn Badge mapping
 * Source: AGENTS.md §7 (statusBadges.tsx logic) + REBUILD_PLAN.md §5 dot colors
 *
 * Design principle: every status resolves to a *semantic* token, never a raw
 * Tailwind palette color. This keeps light + dark mode correct automatically
 * (matches how Linear / Vercel / Stripe dashboards theme).
 */
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ─── Teacher availability dot ────────────────────────────────────────────────

export type TeacherAvailability = "available-same" | "available-diff" | "capped" | "unavailable"

interface AvailabilityDotProps {
  status: TeacherAvailability
  label?: string          // always shown alongside dot (WCAG 1.4.1 — never color alone)
  className?: string
}

const DOT_CLASSES: Record<TeacherAvailability, string> = {
  "available-same": "bg-[var(--ef-green)]",
  "available-diff": "bg-[var(--ef-amber)]",
  "capped":         "bg-muted-foreground",
  "unavailable":    "bg-[var(--ef-red)]",
}

export const DOT_LABELS: Record<TeacherAvailability, string> = {
  "available-same": "Available (same subject)",
  "available-diff": "Available (alt subject)",
  "capped":         "Capped",
  "unavailable":    "Unavailable",
}

export function AvailabilityDot({ status, label, className }: AvailabilityDotProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn("inline-block size-2.5 rounded-full flex-shrink-0", DOT_CLASSES[status])}
        aria-hidden="true"
      />
      <span className="text-sm">{label ?? DOT_LABELS[status]}</span>
    </span>
  )
}

// ─── Absence status ───────────────────────────────────────────────────────────

export type AbsenceStatus = "pending" | "approved" | "rejected" | "draft"

const ABSENCE_BADGE: Record<AbsenceStatus, { variant: "default" | "success" | "destructive" | "secondary" | "warning"; label: string }> = {
  pending:  { variant: "warning",     label: "Pending" },
  approved: { variant: "success",     label: "Approved" },
  rejected: { variant: "destructive", label: "Rejected" },
  draft:    { variant: "secondary",   label: "Draft" },
}

export function AbsenceBadge({ status }: { status: AbsenceStatus }) {
  const { variant, label } = ABSENCE_BADGE[status]
  return <Badge variant={variant}>{label}</Badge>
}

// ─── Proxy assignment status ──────────────────────────────────────────────────

export type ProxyStatus = "assigned" | "accepted" | "declined" | "completed"

const PROXY_BADGE: Record<ProxyStatus, { variant: "default" | "success" | "destructive" | "secondary" | "warning"; label: string }> = {
  assigned:  { variant: "default",     label: "Assigned" },
  accepted:  { variant: "success",     label: "Accepted" },
  declined:  { variant: "destructive", label: "Declined" },
  completed: { variant: "secondary",   label: "Completed" },
}

export function ProxyBadge({ status }: { status: ProxyStatus }) {
  const { variant, label } = PROXY_BADGE[status]
  return <Badge variant={variant}>{label}</Badge>
}

// ─── Fee status ───────────────────────────────────────────────────────────────

export type FeeStatus = "paid" | "partial" | "overdue" | "pending"

const FEE_BADGE: Record<FeeStatus, { variant: "default" | "success" | "destructive" | "secondary" | "warning"; label: string }> = {
  paid:    { variant: "success",     label: "Paid" },
  partial: { variant: "warning",     label: "Partial" },
  overdue: { variant: "destructive", label: "Overdue" },
  pending: { variant: "secondary",   label: "Pending" },
}

export function FeeBadge({ status }: { status: FeeStatus }) {
  const { variant, label } = FEE_BADGE[status]
  return <Badge variant={variant}>{label}</Badge>
}

// ─── Swap request status ──────────────────────────────────────────────────────

export type SwapStatus = "pending" | "agreed" | "management_pending" | "approved" | "rejected"

const SWAP_BADGE: Record<SwapStatus, { variant: "default" | "success" | "destructive" | "secondary" | "warning"; label: string }> = {
  pending:            { variant: "secondary", label: "Pending" },
  agreed:             { variant: "default",   label: "Agreed" },
  management_pending: { variant: "warning",   label: "Mgmt Review" },
  approved:           { variant: "success",   label: "Approved" },
  rejected:           { variant: "destructive", label: "Rejected" },
}

export function SwapBadge({ status }: { status: SwapStatus }) {
  const { variant, label } = SWAP_BADGE[status]
  return <Badge variant={variant}>{label}</Badge>
}

// ─── Subscription status ─────────────────────────────────────────────────────

export type SubscriptionStatus = "trial" | "active" | "grace" | "suspended"

const SUB_BADGE: Record<SubscriptionStatus, { variant: "default" | "success" | "destructive" | "secondary" | "warning"; label: string }> = {
  trial:     { variant: "default",     label: "Trial" },
  active:    { variant: "success",     label: "Active" },
  grace:     { variant: "warning",     label: "Grace Period" },
  suspended: { variant: "destructive", label: "Suspended" },
}

export function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  const { variant, label } = SUB_BADGE[status]
  return <Badge variant={variant}>{label}</Badge>
}

// ─── Generic StatusBadge (string → auto-colored badge) ────────────────────────
//
// Every status maps to a *semantic tone* (success / warning / info / error /
// neutral / brand / purple), which then resolves to a pair of semantic tokens
// (background + foreground) defined in globals.css. No raw Tailwind palette
// colors — this fixes the 96-color hardcode flagged in DESIGN_AUDIT Batch B #1.

type Tone = "success" | "warning" | "info" | "error" | "neutral" | "brand" | "purple"

const TONE_CLASSES: Record<Tone, string> = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  info:    "bg-info text-info-foreground",
  error:   "bg-destructive text-destructive-foreground",
  neutral: "bg-muted text-muted-foreground",
  brand:   "bg-[var(--ef-brand-light)] text-[var(--ef-brand)]",
  purple:  "bg-[var(--ef-purple-light)] text-[var(--ef-purple)]",
}

const STATUS_TONE: Record<string, Tone> = {
  // success
  approved: "success", active: "success", paid: "success", completed: "success",
  accepted: "success", present: "success", success: "success",
  // warning
  pending: "warning", partial: "warning", grace: "warning", assigned: "warning",
  // brand (was blue-100 — neutralized to brand tint)
  agreed: "brand",
  // info
  trial: "info", management_pending: "info",
  // error
  rejected: "error", declined: "error", overdue: "error", suspended: "error",
  absent: "error", failed: "error", cancelled: "error",
  // neutral
  draft: "neutral", inactive: "neutral", capped: "neutral",
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const tone = STATUS_TONE[status.toLowerCase()] ?? "neutral"
  const label = status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", TONE_CLASSES[tone], className)}>
      {label}
    </span>
  )
}
