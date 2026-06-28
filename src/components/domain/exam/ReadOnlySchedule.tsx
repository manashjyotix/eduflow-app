"use client"

/**
 * ReadOnlySchedule  (Feature: exam-routine-builder)
 *
 * The read-only exam schedule presented to Teacher, Parent, and student roles
 * (Requirement 10.4). It renders the published exam routine as a static grid:
 * rows are classes ({@link EXAM_CLASSES}) and columns are (Exam_Date × Session)
 * pairs derived via {@link columnAxis} (date ascending, then session start
 * ascending). Each cell shows the slot's subject, room, and the resolved
 * invigilator names.
 *
 * This view is display-only by design: it carries NO create, edit, delete,
 * publish, or drag affordances. It reads state exclusively through
 * {@link useExamSchedule} (R12.5) so it always reflects the in-memory store
 * with no manual refresh (R12.4). Mutating actions are intentionally not
 * imported or invoked here.
 *
 * _Requirements: 10.4_
 */

import { CalendarX } from "lucide-react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"
import { useExamSchedule } from "@/context/exam-schedule-context"
import { columnAxis } from "@/lib/exam/exam-dates"
import { EXAM_CLASSES } from "@/data/mock-exams"
import { TEACHERS } from "@/data/teachers"

/** Resolve a teacher id to a display name, falling back to the id. */
function teacherName(teacherId: string): string {
  return TEACHERS.find(t => t.id === teacherId)?.name ?? teacherId
}

/** Format an ISO yyyy-mm-dd date for the column header. */
function formatExamDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
}

export function ReadOnlySchedule() {
  const { sessions, dates, slots, slotFor } = useExamSchedule()

  const columns = columnAxis(dates, sessions)
  const hasSchedule = columns.length > 0 && slots.length > 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Exam Schedule</CardTitle>
        <CardDescription>
          The published examination routine. This view is read-only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!hasSchedule ? (
          <EmptyState
            icon={<CalendarX className="size-6" />}
            title="No exam schedule yet"
            description="The exam routine has not been published. Once the school sets exam dates, sessions, and papers, the schedule will appear here."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table className="min-w-[640px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 z-10 bg-card align-bottom">Class</TableHead>
                  {columns.map(({ date, session }) => (
                    <TableHead
                      key={`${date}__${session.id}`}
                      className="min-w-[150px] text-center align-bottom"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="font-semibold text-foreground">{formatExamDate(date)}</span>
                        <span className="text-xs font-normal text-muted-foreground">
                          {session.name} · {session.startTime}–{session.endTime}
                        </span>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {EXAM_CLASSES.map(classId => (
                  <TableRow key={classId}>
                    <TableCell className="sticky left-0 z-10 bg-card font-semibold">
                      {classId}
                    </TableCell>
                    {columns.map(({ date, session }) => {
                      const slot = slotFor({ classId, date, sessionId: session.id })
                      const hasSubject = Boolean(slot?.subject)
                      return (
                        <TableCell
                          key={`${classId}__${date}__${session.id}`}
                          className={cn(
                            "align-top",
                            !hasSubject && "text-muted-foreground",
                          )}
                        >
                          {hasSubject ? (
                            <div className="flex flex-col gap-1.5">
                              <span className="text-sm font-semibold leading-tight text-foreground">
                                {slot!.subject}
                              </span>
                              {slot!.room && (
                                <span className="text-xs text-muted-foreground">{slot!.room}</span>
                              )}
                              {slot!.invigilatorIds.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {slot!.invigilatorIds.map(tid => (
                                    <Badge
                                      key={tid}
                                      variant="secondary"
                                      className="h-5 px-1.5 text-[10px] font-normal"
                                    >
                                      {teacherName(tid)}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs">—</span>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
