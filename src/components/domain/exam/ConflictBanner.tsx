"use client"

/**
 * ConflictBanner + cell availability badges  (Feature: exam-routine-builder)
 *
 * Two surfaces that render the proxy-board Availability_Color_Language —
 * green (available/same subject), amber (available/different subject),
 * gray (capped), red (unavailable) — always paired with a human-readable text
 * label, never color alone (accessibility, AGENTS.md §8 / WCAG 1.4.1).
 *
 *   1. `ConflictBanner` — summarizes invigilator double-bookings detected by the
 *      Conflict_Engine in the red color language with text, e.g.
 *      "Priya Sharma double-booked on 2026-07-14, Morning". Renders nothing when
 *      there are no conflicts (R6.2).
 *   2. `AvailabilityBadgeView` / `CellBadge` — render an {@link AvailabilityBadge}
 *      (status + label) as a colored dot/chip + its text label, reusing the
 *      proxy-board green/amber/gray/red token mapping (R6.6, R2.4).
 *
 * The color mapping and dot visuals are mirrored from the existing
 * `AvailabilityDot` in `src/components/shared/status-badge.tsx` (the
 * availability-dot covered by `src/__tests__/availability-dot.test.tsx`) so the
 * proxy board and exam routine builder stay visually consistent.
 *
 * _Requirements: 6.2, 6.6, 2.4_
 */

import { AlertTriangle } from "lucide-react"
import { AvailabilityDot } from "@/components/shared/status-badge"
import { cn } from "@/lib/utils"
import type { Conflict } from "@/lib/exam/conflict-engine"
import type { AvailabilityBadge } from "@/lib/exam/availability"
import type { ExamSession } from "@/data/mock-exams"
import { TEACHERS } from "@/data/teachers"

// ─── Cell availability badge ─────────────────────────────────────────────────

interface AvailabilityBadgeViewProps {
  badge: AvailabilityBadge
  className?: string
}

/**
 * Render a single {@link AvailabilityBadge} as a colored dot + its text label.
 *
 * Delegates to the shared {@link AvailabilityDot} so the dot color tokens
 * (green/amber/gray/red) and visual style match the proxy board exactly. The
 * badge's `status` drives the color and its `label` is always shown alongside
 * the dot — color is never used alone.
 *
 * _Requirements: 6.6, 2.4_
 */
export function AvailabilityBadgeView({ badge, className }: AvailabilityBadgeViewProps) {
  return <AvailabilityDot status={badge.status} label={badge.label} className={className} />
}

/** Alias — a cell badge is just an availability badge rendered in a grid cell. */
export const CellBadge = AvailabilityBadgeView

// ─── Conflict banner ─────────────────────────────────────────────────────────

interface ConflictBannerProps {
  /** Double-bookings detected by the Conflict_Engine (`detectConflicts`). */
  conflicts: Conflict[]
  /** Sessions used to resolve a `sessionId` to its display name. */
  sessions?: ExamSession[]
  className?: string
}

function teacherName(teacherId: string): string {
  return TEACHERS.find(t => t.id === teacherId)?.name ?? teacherId
}

function sessionName(sessionId: string, sessions: ExamSession[]): string {
  return sessions.find(s => s.id === sessionId)?.name ?? sessionId
}

/**
 * Summarize every detected double-booking in the red status of the
 * Availability_Color_Language paired with a text label that identifies the
 * invigilator, the shared Exam_Date, the shared Session, and the double-booked
 * status (R6.2).
 *
 * Renders nothing when there are no conflicts, so callers can mount it
 * unconditionally above the routine grid.
 */
export function ConflictBanner({ conflicts, sessions = [], className }: ConflictBannerProps) {
  if (conflicts.length === 0) return null

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-[var(--ef-red)] bg-[var(--ef-red-light)] p-3 text-[var(--ef-red-dark)]",
        className,
      )}
    >
      <div className="flex items-center gap-2 font-semibold">
        <AlertTriangle className="size-4 flex-shrink-0" aria-hidden="true" />
        <span>
          {conflicts.length} invigilation {conflicts.length === 1 ? "conflict" : "conflicts"} detected
        </span>
      </div>

      <ul className="mt-2 space-y-1.5">
        {conflicts.map(conflict => {
          const label =
            `${teacherName(conflict.teacherId)} double-booked on ` +
            `${conflict.date}, ${sessionName(conflict.sessionId, sessions)}`
          const key = `${conflict.teacherId}__${conflict.date}__${conflict.sessionId}`
          return (
            <li key={key}>
              <AvailabilityDot status="unavailable" label={label} />
            </li>
          )
        })}
      </ul>
    </div>
  )
}
