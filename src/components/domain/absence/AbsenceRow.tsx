"use client"

import { CheckCircle, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AbsenceBadge } from "@/components/shared/status-badge"
import type { Absence } from "@/data/mock-absences"
import { TEACHERS } from "@/data/teachers"

// ─── Category display config ─────────────────────────────────────────────────
const CATEGORY_LABELS: Record<Absence["category"], string> = {
  sick_leave:    "Sick Leave",
  casual_leave:  "Casual Leave",
  earned_leave:  "Earned Leave",
  emergency:     "Emergency",
  official_duty: "Official Duty",
}

const CATEGORY_COLORS: Record<Absence["category"], string> = {
  sick_leave:    "bg-[var(--ef-red-light)] text-[var(--ef-red-dark)]",
  casual_leave:  "bg-[var(--ef-brand-light)] text-primary",
  earned_leave:  "bg-[var(--ef-green-light)] text-[var(--ef-green-dark)]",
  emergency:     "bg-[var(--ef-amber-light)] text-warning-foreground",
  official_duty: "bg-[var(--ef-purple-light)] text-[var(--ef-purple)]",
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface AbsenceRowProps {
  absence: Absence
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AbsenceRow({ absence, onApprove, onReject }: AbsenceRowProps) {
  const teacher = TEACHERS.find(t => t.id === absence.teacherId)

  const initials = absence.teacherName
    .split(" ")
    .map(n => n[0])
    .join("")

  const periodSummary =
    absence.periods.length === 7
      ? "Full day"
      : absence.periods.join(", ")

  return (
    <li className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-muted/20 transition-colors">
      {/* Teacher info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0" aria-hidden="true">
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">{absence.teacherName}</p>
            {teacher && (
              <Badge variant="outline" className="text-[10px]">
                {teacher.section}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span
              className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${CATEGORY_COLORS[absence.category]}`}
            >
              {CATEGORY_LABELS[absence.category]}
            </span>
            <p className="text-xs text-muted-foreground">
              {periodSummary} · {absence.reason}
            </p>
          </div>
          {teacher && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Subjects: {teacher.subjects.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Status + actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <AbsenceBadge status={absence.status} />
        {absence.status === "pending" && (
          <>
            <Button size="xs" onClick={() => onApprove(absence.id)}>
              <CheckCircle className="size-3" />
              Approve
            </Button>
            <Button size="xs" variant="destructive" onClick={() => onReject(absence.id)}>
              <XCircle className="size-3" />
              Reject
            </Button>
          </>
        )}
      </div>
    </li>
  )
}
