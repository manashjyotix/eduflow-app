"use client"

/**
 * AssignModal — domain component extracted from admin/proxy-board/page.tsx
 * A confirmation Dialog for manually assigning a proxy teacher to a period.
 * Shows the teacher's name, subject match status, current load, and the
 * period / absence being assigned before confirming.
 *
 * Requirements: 5.1, 5.2, 5.3
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AvailabilityDot } from "@/components/shared/status-badge"
import { type Teacher } from "@/data/teachers"
import { type Absence } from "@/data/mock-absences"
import { type ProxyAssignment } from "@/data/proxy-assignments"
import { AlertTriangle, UserCheck } from "lucide-react"

export interface AssignModalProps {
  /** Whether the dialog is open */
  open: boolean
  /** Close / cancel callback */
  onClose: () => void
  /** Confirm assignment callback — called after user clicks "Confirm" */
  onConfirm: () => void
  /** The teacher being assigned */
  teacher: Teacher | null
  /** The absence record this assignment covers */
  absence: Absence | null
  /** The period ID being assigned (e.g. "P3") */
  periodId: string | null
  /** All current proxy assignments — used to calculate teacher's load */
  proxies: ProxyAssignment[]
}

export function AssignModal({
  open,
  onClose,
  onConfirm,
  teacher,
  absence,
  periodId,
  proxies,
}: AssignModalProps) {
  if (!teacher || !absence || !periodId) return null

  const currentLoad = proxies.filter(
    p => p.proxyTeacherId === teacher.id && p.status !== "declined"
  ).length
  const remainingCap = teacher.dailyProxyCap - currentLoad
  const isAtCap = remainingCap <= 0

  // Absent teacher for subject-match check
  const absentTeacherSubjects = absence ? [absence.teacherName] : []
  void absentTeacherSubjects // used below via teacher.subjects check

  // Determine subject match by looking at the absence's teacher name (proxy: read subjects from props if available)
  // We check by period-proxy subject field from existing proxies for the absence
  const absenceSubject =
    proxies.find(p => p.absenceId === absence.id)?.subject ?? "—"
  const isSubjectMatch = teacher.subjects.includes(absenceSubject)

  const availabilityStatus = isAtCap
    ? "capped"
    : isSubjectMatch
    ? "available-same"
    : "available-diff"

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="size-5 text-primary" aria-hidden="true" />
            Confirm Proxy Assignment
          </DialogTitle>
          <DialogDescription>
            Review the assignment details before confirming.
          </DialogDescription>
        </DialogHeader>

        {/* ── Assignment details ── */}
        <div className="space-y-4 py-2">
          {/* Teacher row */}
          <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0" aria-hidden="true">
                {teacher.name
                  .split(" ")
                  .map(n => n[0])
                  .join("")}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{teacher.name}</p>
                <p className="text-xs text-muted-foreground">
                  {teacher.subjects.join(", ")}
                </p>
              </div>
            </div>
            <AvailabilityDot status={availabilityStatus} className="text-xs" />
          </div>

          {/* Absence + period info */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">Absent Teacher</p>
              <p className="font-medium text-foreground">{absence.teacherName}</p>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-3">
              <p className="text-xs text-muted-foreground mb-1">Period</p>
              <p className="font-bold text-foreground">{periodId}</p>
            </div>
          </div>

          {/* Current load indicator */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Current daily load:</span>
            <span className="font-medium">
              {currentLoad} / {teacher.dailyProxyCap} duties
            </span>
          </div>

          {/* Subject match */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subject match:</span>
            <Badge variant={isSubjectMatch ? "success" : "secondary"}>
              {isSubjectMatch ? "Yes — same subject" : "No — alt subject"}
            </Badge>
          </div>

          {/* Cap warning */}
          {isAtCap && (
            <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4 flex-shrink-0" aria-hidden="true" />
              <span>
                {teacher.name.split(" ")[0]} has reached their daily proxy cap and
                cannot be assigned.
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isAtCap}>
            <UserCheck className="size-4" aria-hidden="true" />
            Confirm Assignment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
