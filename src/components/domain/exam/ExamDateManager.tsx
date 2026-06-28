"use client"

/**
 * ExamDateManager  (Feature: exam-routine-builder · Task 13.3)
 *
 * Admin-only configuration view for the Exam_Date column axis. It lets an Admin
 * add ISO `yyyy-mm-dd` dates (validated for format, duplicates and the 100-date
 * cap) and remove dates, prompting for explicit confirmation through a shadcn
 * `AlertDialog` whenever the date being removed still has scheduled slots.
 *
 * All decision logic lives in the pure layer (`src/lib/exam/exam-dates.ts`) and
 * is reached only through the `exam-schedule-context` interface; this component
 * surfaces the `OpResult` / `ConfirmableResult` messages and renders the dates
 * sorted ascending (the context already exposes them sorted — R5.9).
 *
 * Management controls are gated on `canManageConfig` (R10.6): non-admin roles
 * see a read-only list with no add or remove affordances.
 *
 * _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 10.6_
 */

import { useState } from "react"
import { CalendarPlus, CalendarX2, Plus, Trash2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useExamSchedule } from "@/context/exam-schedule-context"
import { MAX_EXAM_DATES } from "@/lib/exam/exam-dates"

/**
 * Format an ISO `yyyy-mm-dd` string for display without shifting across time
 * zones. Parsing with an explicit midnight local time keeps the calendar date
 * intact regardless of the viewer's locale offset.
 */
function formatExamDate(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return iso
  return parsed.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function ExamDateManager() {
  const { dates, addExamDate, removeExamDate, dateHasSlots, canManageConfig } = useExamSchedule()

  const [draft, setDraft] = useState("")
  const [error, setError] = useState<string | null>(null)
  /** The date awaiting delete-confirmation (it has scheduled slots), or null. */
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null)

  const atCap = dates.length >= MAX_EXAM_DATES

  function handleAdd() {
    setError(null)
    const value = draft.trim()
    if (!value) {
      setError("Pick an exam date to add.")
      return
    }
    const res = addExamDate(value)
    if (!res.ok) {
      setError(res.message)
      return
    }
    setDraft("")
  }

  function handleRemove(date: string) {
    setError(null)
    // Direct attempt first. The context returns "needs-confirmation" when the
    // date still has scheduled slots (R5.6); we then open the AlertDialog
    // instead of removing (R5.5 removes directly when there are no slots).
    const res = removeExamDate(date)
    if (res.ok) return
    if (res.reason === "needs-confirmation") {
      setPendingRemoval(date)
      return
    }
    setError(res.message)
  }

  function confirmRemoval() {
    if (!pendingRemoval) return
    // Confirmed: remove the date and its associated slots (R5.7).
    const res = removeExamDate(pendingRemoval, true)
    if (!res.ok && res.reason !== "needs-confirmation") setError(res.message)
    setPendingRemoval(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="size-4 text-primary" />
          Exam dates
        </CardTitle>
        <CardDescription>
          {canManageConfig
            ? `Define the calendar dates exams may be scheduled on. Up to ${MAX_EXAM_DATES} dates.`
            : "Exam dates configured for this routine."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {canManageConfig && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-1.5">
                <Label htmlFor="exam-date-input">Add a date</Label>
                <Input
                  id="exam-date-input"
                  type="date"
                  value={draft}
                  disabled={atCap}
                  onChange={e => {
                    setDraft(e.target.value)
                    setError(null)
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAdd()
                    }
                  }}
                />
              </div>
              <Button type="button" onClick={handleAdd} disabled={atCap || !draft.trim()}>
                <Plus className="size-4" />
                Add date
              </Button>
            </div>

            {atCap && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--ef-amber-dark)]">
                <AlertTriangle className="size-3.5" />
                Maximum of {MAX_EXAM_DATES} exam dates reached. Remove a date before adding another.
              </p>
            )}

            {error && (
              <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-destructive">
                <AlertTriangle className="size-3.5" />
                {error}
              </p>
            )}
          </div>
        )}

        {/* Dates list — rendered ascending (the context exposes them sorted). */}
        {dates.length === 0 ? (
          <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed py-8 text-center">
            <CalendarX2 className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No exam dates yet</p>
            <p className="text-xs text-muted-foreground">
              {canManageConfig ? "Add a date above to start building the routine." : "No dates have been configured."}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {dates.map(date => {
              const hasSlots = dateHasSlots(date)
              return (
                <li key={date} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{formatExamDate(date)}</span>
                    <span className="text-[11px] text-muted-foreground">
                      {date}
                      {hasSlots && " · has scheduled slots"}
                    </span>
                  </div>
                  {canManageConfig && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove exam date ${date}`}
                      className={cn("text-muted-foreground hover:text-destructive")}
                      onClick={() => handleRemove(date)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      {/* Delete-confirmation prompt for a date that still has scheduled slots
          (R5.6). Cancel retains the date and its slots (R5.8); confirm removes
          the date and its associated slots (R5.7). */}
      <AlertDialog
        open={pendingRemoval !== null}
        onOpenChange={open => {
          if (!open) setPendingRemoval(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this exam date?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingRemoval && (
                <>
                  <span className="font-medium text-foreground">{formatExamDate(pendingRemoval)}</span> has
                  one or more scheduled exam slots. Removing it will also delete every slot scheduled on that
                  date. This cannot be undone.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep date</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmRemoval}
            >
              Remove date &amp; slots
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
