"use client"

/**
 * DuplicateRoutineDialog  (Feature: exam-routine-builder · Task 15.1)
 *
 * Build-gated dialog for the Duplication_Service. An Admin or Management user
 * picks a source Class and 1–50 target Classes, then duplicates the source
 * routine onto every target. Each source Exam_Slot's subject, room, date, and
 * session is copied to the same (date, session) position of each target class;
 * invigilators are never carried over (handled by the pure layer). A subject
 * the target class is not linked to is omitted and reported.
 *
 * Behaviour:
 *   - The trigger button is gated on `canEdit` (build permission); a read-only
 *     role sees nothing (R8 actions are build-only).
 *   - Source class is chosen from a Select over `EXAM_CLASSES`.
 *   - Targets are a checkbox list of every class except the source — the source
 *     is auto-excluded so it can never be its own target (R8.5).
 *   - Confirm is disabled while no target is selected (R8.6).
 *   - On `OpResult` error (e.g. `empty-target-set`) the message is surfaced.
 *   - On success the `DuplicationReport` summary is shown: created / overwritten
 *     / omitted counts plus the omitted-subjects list flagged in the
 *     Availability_Color_Language (amber warning + text label) (R8.2, R8.4).
 *
 * All decision logic lives in the pure layer (`src/lib/exam/duplication.ts`)
 * and is reached only through the exam-schedule context.
 *
 * _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_
 */

import { useMemo, useState } from "react"
import { AlertTriangle, Copy, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useExamSchedule } from "@/context/exam-schedule-context"
import { EXAM_CLASSES } from "@/data/mock-exams"
import { MAX_DUPLICATION_TARGETS, type DuplicationReport } from "@/lib/exam/duplication"

export function DuplicateRoutineDialog() {
  const { duplicateRoutine, canEdit } = useExamSchedule()

  const [open, setOpen] = useState(false)
  const [sourceClassId, setSourceClassId] = useState<string>(EXAM_CLASSES[0] ?? "")
  const [targets, setTargets] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<DuplicationReport | null>(null)

  // Targets always exclude the source class (R8.5).
  const targetCandidates = useMemo(
    () => EXAM_CLASSES.filter((c) => c !== sourceClassId),
    [sourceClassId],
  )

  const selectedCount = targets.size
  // Confirm is disabled when nothing is selected (R8.6) or the 1–50 bound is
  // exceeded (R8.1).
  const canConfirm = selectedCount >= 1 && selectedCount <= MAX_DUPLICATION_TARGETS

  /** Reset the transient dialog state back to its initial shape. */
  function reset() {
    setSourceClassId(EXAM_CLASSES[0] ?? "")
    setTargets(new Set())
    setError(null)
    setReport(null)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) reset()
  }

  function handleSourceChange(next: string) {
    setSourceClassId(next)
    // Drop the new source from any prior target selection so it can never be a
    // target of itself (R8.5).
    setTargets((prev) => {
      const copy = new Set(prev)
      copy.delete(next)
      return copy
    })
    setError(null)
    setReport(null)
  }

  function toggleTarget(classId: string, checked: boolean) {
    setTargets((prev) => {
      const copy = new Set(prev)
      if (checked) copy.add(classId)
      else copy.delete(classId)
      return copy
    })
    setError(null)
    setReport(null)
  }

  function handleConfirm() {
    const res = duplicateRoutine(sourceClassId, [...targets])
    if (res.ok) {
      setReport(res.value)
      setError(null)
    } else {
      setError(res.message)
      setReport(null)
    }
  }

  // Build-only action: read-only roles get no affordance.
  if (!canEdit) return null

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Copy className="size-4" />
          Duplicate to…
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="size-4 text-primary" />
            Duplicate class routine
          </DialogTitle>
          <DialogDescription>
            Copy one class&apos;s routine onto up to {MAX_DUPLICATION_TARGETS} other classes.
            Subjects not offered by a target class are skipped, and invigilator duties are
            never carried over.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Source class */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="dup-source">Source class</Label>
            <Select value={sourceClassId} onValueChange={handleSourceChange}>
              <SelectTrigger id="dup-source">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {EXAM_CLASSES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target classes */}
          <div className="flex flex-col gap-2">
            <Label>Target classes</Label>
            {targetCandidates.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                No other classes available to duplicate to.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {targetCandidates.map((c) => {
                  const checked = targets.has(c)
                  return (
                    <li key={c}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 text-sm transition-colors",
                          checked ? "border-primary bg-primary/5" : "hover:bg-accent",
                        )}
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) => toggleTarget(c, v === true)}
                          aria-label={`Duplicate to ${c}`}
                        />
                        <span className="font-medium">{c}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            )}
            <p className="text-xs text-muted-foreground">
              {selectedCount} of {targetCandidates.length} selected
            </p>
          </div>

          {/* Error (e.g. empty-target-set) */}
          {error && (
            <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
              <AlertTriangle className="size-3.5 shrink-0" />
              {error}
            </p>
          )}

          {/* Success report (R8.4) */}
          {report && (
            <div
              role="status"
              className="flex flex-col gap-2 rounded-lg border border-success/40 bg-success/5 p-3"
            >
              <p className="flex items-center gap-1.5 text-sm font-semibold text-success">
                <CheckCircle2 className="size-4 shrink-0" />
                Duplication complete
              </p>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="success">{report.created} created</Badge>
                <Badge variant="secondary">{report.overwritten} overwritten</Badge>
                <Badge variant={report.omitted > 0 ? "warning" : "outline"}>
                  {report.omitted} omitted
                </Badge>
              </div>

              {/* Omitted subjects flagged in the color language (amber + label). */}
              {report.omittedSubjects.length > 0 && (
                <div className="flex flex-col gap-1.5 border-t border-success/30 pt-2">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-warning-foreground">
                    <AlertTriangle className="size-3.5 shrink-0 text-warning" />
                    Subjects skipped (not offered by the target class):
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {report.omittedSubjects.map((subject, i) => (
                      <Badge key={`${subject}-${i}`} variant="warning">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => handleOpenChange(false)}>
            {report ? "Close" : "Cancel"}
          </Button>
          <Button onClick={handleConfirm} disabled={!canConfirm}>
            <Copy className="size-4" />
            Duplicate{selectedCount > 0 ? ` to ${selectedCount}` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DuplicateRoutineDialog
