"use client"

/**
 * DutyRoster  (Feature: exam-routine-builder, Task 15.3)
 *
 * Lists every invigilation duty assignment in the routine and lets an
 * authorized user (Admin / Management) trigger duty notifications. The roster
 * reads state exclusively through {@link useExamSchedule} (R12.5) so it always
 * reflects the in-memory store with no manual refresh (R12.4).
 *
 * Assignments are grouped by (Exam_Date × Session) — ordered by date ascending
 * then session start time ascending — and each row surfaces the slot's class,
 * subject, room (when present), the session name + start time, and the resolved
 * invigilator names. Assignments whose slot holds NO subject are shown
 * separately and flagged, because the notifier skips them (R11.2).
 *
 * The "Notify duties" button is gated on `canEdit` (build permission). It calls
 * `notifyDuties()` and reports the returned `{ sent, skipped }` counts to the
 * user both as a toast and as an inline summary (R11.1, R11.2).
 *
 * _Requirements: 11.1, 11.2_
 */

import { useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Bell, ClipboardList, DoorClosed, AlertTriangle, Users,
} from "lucide-react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"
import { useExamSchedule } from "@/context/exam-schedule-context"
import type { ExamSession, ExamSlot } from "@/data/mock-exams"
import { TEACHERS } from "@/data/teachers"

/** Resolve a teacher id to a display name, falling back to the id. */
function teacherName(teacherId: string): string {
  return TEACHERS.find(t => t.id === teacherId)?.name ?? teacherId
}

/** Format an ISO yyyy-mm-dd date for a group header. */
function formatExamDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
}

/** A roster group keyed by a (date, session) column. */
interface DutyGroup {
  key: string
  date: string
  session: ExamSession
  slots: ExamSlot[]
}

/** The transient summary line shown after the last notify run. */
type NotifySummary = { sent: number; skipped: number } | null

export function DutyRoster() {
  const { slots, sessions, canEdit, notifyDuties } = useExamSchedule()
  const [summary, setSummary] = useState<NotifySummary>(null)

  // Session id → record, for resolving names + start times in the roster.
  const sessionById = useMemo(() => {
    const map = new Map<string, ExamSession>()
    for (const s of sessions) map.set(s.id, s)
    return map
  }, [sessions])

  // Every slot carrying at least one invigilator is a duty assignment.
  const assignedSlots = useMemo(
    () => slots.filter(s => s.invigilatorIds.length > 0),
    [slots],
  )

  // Total number of invigilator assignments (one per teacher per slot).
  const totalAssignments = useMemo(
    () => assignedSlots.reduce((n, s) => n + s.invigilatorIds.length, 0),
    [assignedSlots],
  )

  // Assignments whose slot has no subject: the notifier skips these (R11.2).
  const skippableCount = useMemo(
    () => assignedSlots
      .filter(s => !s.subject)
      .reduce((n, s) => n + s.invigilatorIds.length, 0),
    [assignedSlots],
  )

  // Group the assigned slots by (date, session), ordered date asc then start asc.
  const groups = useMemo<DutyGroup[]>(() => {
    const byKey = new Map<string, DutyGroup>()
    for (const slot of assignedSlots) {
      const session = sessionById.get(slot.sessionId)
      if (!session) continue
      const key = `${slot.date}__${slot.sessionId}`
      let group = byKey.get(key)
      if (!group) {
        group = { key, date: slot.date, session, slots: [] }
        byKey.set(key, group)
      }
      group.slots.push(slot)
    }
    const ordered = [...byKey.values()]
    ordered.sort((a, b) =>
      a.date !== b.date
        ? a.date.localeCompare(b.date)
        : a.session.startTime.localeCompare(b.session.startTime),
    )
    for (const g of ordered) {
      g.slots.sort((a, b) => a.classId.localeCompare(b.classId))
    }
    return ordered
  }, [assignedSlots, sessionById])

  function handleNotify() {
    const result = notifyDuties()
    setSummary(result)
    if (result.sent > 0) {
      toast.success("Duty notifications queued", {
        description:
          `Sent ${result.sent} notification${result.sent === 1 ? "" : "s"}` +
          (result.skipped > 0
            ? `, skipped ${result.skipped} assignment${result.skipped === 1 ? "" : "s"} with no subject.`
            : "."),
      })
    } else {
      toast("No duty notifications sent", {
        description: result.skipped > 0
          ? `Skipped ${result.skipped} assignment${result.skipped === 1 ? "" : "s"} with no subject.`
          : "No invigilators are assigned yet.",
      })
    }
  }

  const hasDuties = totalAssignments > 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-5 text-[var(--ef-brand,#007AFF)]" />
            Invigilation Duty Roster
          </CardTitle>
          <CardDescription>
            {hasDuties
              ? `${totalAssignments} duty assignment${totalAssignments === 1 ? "" : "s"} across ${groups.length} session${groups.length === 1 ? "" : "s"}.`
              : "Assign invigilators on the routine grid to populate the roster."}
          </CardDescription>
        </div>
        {canEdit && (
          <Button onClick={handleNotify} disabled={!hasDuties}>
            <Bell className="mr-1 size-4" />
            Notify duties
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {summary && (
          <Alert>
            <Bell className="size-4" />
            <AlertDescription>
              {summary.sent > 0
                ? `Sent ${summary.sent} notification${summary.sent === 1 ? "" : "s"}`
                : "Sent no notifications"}
              {summary.skipped > 0
                ? `, skipped ${summary.skipped} assignment${summary.skipped === 1 ? "" : "s"} with no subject.`
                : "."}
            </AlertDescription>
          </Alert>
        )}

        {skippableCount > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertDescription>
              {skippableCount} assignment{skippableCount === 1 ? "" : "s"} {skippableCount === 1 ? "has" : "have"} an
              invigilator but no subject scheduled — {skippableCount === 1 ? "it" : "they"} will be skipped when notifying.
            </AlertDescription>
          </Alert>
        )}

        {!hasDuties ? (
          <EmptyState
            icon={<Users className="size-6" />}
            title="No invigilation duties yet"
            description="Drag a teacher chip onto a scheduled exam slot in the routine builder to assign invigilation duty."
          />
        ) : (
          <ul className="flex flex-col gap-5">
            {groups.map(group => (
              <li key={group.key} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="text-sm font-semibold text-foreground">
                    {formatExamDate(group.date)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {group.session.name} · {group.session.startTime}–{group.session.endTime}
                  </span>
                </div>
                <Separator />
                <ul className="flex flex-col gap-2">
                  {group.slots.map(slot => {
                    const noSubject = !slot.subject
                    return (
                      <li
                        key={slot.id}
                        className={cn(
                          "flex flex-wrap items-center gap-2 rounded-[var(--r-md,12px)] border p-2.5 text-sm",
                          noSubject
                            ? "border-destructive/40 bg-destructive/5"
                            : "border-[var(--sep,rgba(60,60,67,0.12))] bg-card",
                        )}
                      >
                        <Badge variant="outline" className="font-medium">{slot.classId}</Badge>
                        {noSubject ? (
                          <span className="flex items-center gap-1 font-medium text-destructive">
                            <AlertTriangle className="size-3.5" />
                            No subject — will be skipped
                          </span>
                        ) : (
                          <span className="font-medium text-foreground">{slot.subject}</span>
                        )}
                        {slot.room && (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <DoorClosed className="size-3.5" />
                            {slot.room}
                          </span>
                        )}
                        <span className="text-muted-foreground" aria-hidden>→</span>
                        <div className="flex flex-wrap gap-1">
                          {slot.invigilatorIds.map(tid => (
                            <Badge key={tid} variant="secondary" className="text-[11px] font-normal">
                              {teacherName(tid)}
                            </Badge>
                          ))}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
