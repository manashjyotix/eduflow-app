"use client"

/**
 * AIRoutineDialog  (Feature: exam-routine-builder · Task 15.2)
 *
 * Build-gated entry point to the AI Routine Builder. It exposes the two
 * generation modes from the exam-schedule context behind a single Dialog:
 *
 *   - "Generate full draft" → `generateRoutine("full-draft")`: lays out a fresh
 *     first-draft routine, placing each class's linked subjects across the
 *     configured dates/sessions and assigning balanced invigilators (R9.1).
 *   - "Suggest invigilators" → `generateRoutine("suggest-invigilators")`: only
 *     fills subject-bearing slots that currently have no invigilator, leaving
 *     existing subjects and invigilator assignments untouched (R9.5).
 *
 * Both actions commit their result into context state on success (the context's
 * `generateRoutine` does the commit). This dialog renders the post-run report:
 *   - the count of subject-bearing slots left without an invigilator
 *     (`uncoveredSlotCount`, R9.8), and
 *   - per-class counts of subjects that could not be placed under the
 *     one-subject-per-class-per-date rule (`unplacedSubjectsByClass`, R9.10).
 *
 * When the generator rejects because configuration is missing it returns
 * `missing-dates` / `missing-sessions`; the dialog surfaces that error message
 * and generates nothing (R9.9).
 *
 * The trigger and all controls are gated on `canEdit` (build access); read-only
 * roles never see this component.
 *
 * All decision logic lives in the pure layer (`src/lib/exam/ai-routine-generator.ts`)
 * and is reached only through the exam-schedule context.
 *
 * _Requirements: 9.1, 9.5, 9.8, 9.9, 9.10_
 */

import { useState } from "react"
import {
  Sparkles, Wand2, AlertTriangle, CheckCircle2, Users, CalendarX2, Info,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useExamSchedule } from "@/context/exam-schedule-context"
import type { GenerationResult } from "@/lib/exam/ai-routine-generator"

type GenerationMode = "full-draft" | "suggest-invigilators"

/** A finished run we can render a report for. */
interface RunReport {
  mode: GenerationMode
  result: GenerationResult
}

/** A rejected run we surface the message for (e.g. missing-dates/missing-sessions). */
interface RunError {
  message: string
}

export function AIRoutineDialog() {
  const { generateRoutine, canEdit } = useExamSchedule()

  const [open, setOpen] = useState(false)
  const [report, setReport] = useState<RunReport | null>(null)
  const [error, setError] = useState<RunError | null>(null)

  // R10: build access gates the entire feature affordance.
  if (!canEdit) return null

  function run(mode: GenerationMode) {
    const res = generateRoutine(mode)
    if (res.ok) {
      setReport({ mode, result: res.value })
      setError(null)
    } else {
      // missing-dates / missing-sessions and any other rejection (R9.9).
      setError({ message: res.message })
      setReport(null)
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      // Reset the run state when the dialog closes so the next open starts clean.
      setReport(null)
      setError(null)
    }
  }

  const unplacedEntries = report
    ? Object.entries(report.result.unplacedSubjectsByClass).filter(([, n]) => n > 0)
    : []

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Sparkles className="size-4 text-primary" />
          AI Routine Builder
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />
            AI Routine Builder
          </DialogTitle>
          <DialogDescription>
            Generate a first-draft routine from your subject catalog, dates, and sessions,
            or suggest invigilators for slots that still need one.
          </DialogDescription>
        </DialogHeader>

        {/* Actions */}
        <div className="grid gap-3 sm:grid-cols-2">
          <Button onClick={() => run("full-draft")} className="h-auto flex-col items-start gap-1 py-3 text-left">
            <span className="flex items-center gap-2 font-semibold">
              <Wand2 className="size-4" />
              Generate full draft
            </span>
            <span className="text-xs font-normal text-primary-foreground/80">
              Lay out every linked subject across your dates and sessions, then assign balanced invigilators.
            </span>
          </Button>

          <Button
            variant="secondary"
            onClick={() => run("suggest-invigilators")}
            className="h-auto flex-col items-start gap-1 py-3 text-left"
          >
            <span className="flex items-center gap-2 font-semibold">
              <Users className="size-4" />
              Suggest invigilators
            </span>
            <span className="text-xs font-normal text-secondary-foreground/80">
              Only fill subject-bearing slots that have no invigilator yet.
            </span>
          </Button>
        </div>

        {/* Note explaining suggest-mode scope (R9.5). */}
        <Alert variant="info">
          <Info className="size-4" />
          <AlertDescription>
            Suggest invigilators only fills slots that already hold a subject and have no
            invigilator. It never changes existing subjects or invigilator assignments.
          </AlertDescription>
        </Alert>

        {/* Missing-configuration / rejection error (R9.9). */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Couldn&apos;t generate a routine</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {/* Post-run report (R9.8, R9.10). */}
        {report && (
          <div className="flex flex-col gap-3">
            <Alert variant={report.result.uncoveredSlotCount === 0 && unplacedEntries.length === 0 ? "success" : "warning"}>
              {report.result.uncoveredSlotCount === 0 && unplacedEntries.length === 0 ? (
                <CheckCircle2 className="size-4" />
              ) : (
                <AlertTriangle className="size-4" />
              )}
              <AlertTitle>
                {report.mode === "full-draft" ? "Draft routine generated" : "Invigilators suggested"}
              </AlertTitle>
              <AlertDescription>
                {report.result.uncoveredSlotCount === 0 && unplacedEntries.length === 0
                  ? "Every subject was placed and every exam slot has an invigilator."
                  : "The routine was generated, but some slots couldn't be fully covered — see below."}
              </AlertDescription>
            </Alert>

            {/* Uncovered invigilation slots (R9.8). */}
            <div className="flex items-start gap-2 rounded-lg border p-3 text-sm">
              <Users className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              <div>
                <p className="font-medium">
                  {report.result.uncoveredSlotCount} slot
                  {report.result.uncoveredSlotCount === 1 ? "" : "s"} left without an invigilator
                </p>
                <p className="text-xs text-muted-foreground">
                  Not enough available teachers to cover every subject-bearing slot without double-booking.
                </p>
              </div>
            </div>

            {/* Per-class unplaced subjects (R9.10) — only shown for full-draft. */}
            {report.mode === "full-draft" && (
              <div className="flex items-start gap-2 rounded-lg border p-3 text-sm">
                <CalendarX2 className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  {unplacedEntries.length === 0 ? (
                    <p className="font-medium">All subjects placed across the available dates.</p>
                  ) : (
                    <>
                      <p className="font-medium">Subjects that couldn&apos;t be placed</p>
                      <p className="mb-2 text-xs text-muted-foreground">
                        Not enough exam dates to fit one paper per class per day.
                      </p>
                      <ul className="flex flex-col gap-1">
                        {unplacedEntries.map(([classId, count]) => (
                          <li key={classId} className="flex items-center justify-between gap-2">
                            <span className="font-medium">{classId}</span>
                            <span className="text-muted-foreground">
                              {count} unplaced subject{count === 1 ? "" : "s"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default AIRoutineDialog
