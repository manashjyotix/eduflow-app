"use client"
import { useEffect, useMemo, useState } from "react"
import { ClipboardCheck, Check, X, CalendarOff, History, Lock, PencilLine } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { ProgressNotes } from "@/components/shared/progress-notes"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { STUDENTS } from "@/data/students"
import { MOCK_PROGRESS_NOTES, type ProgressNote } from "@/data/progress-notes"
import {
  MOCK_ATTENDANCE_OVERRIDES, type AttendanceOverrideEntry,
} from "@/data/mock-attendance-log"
import { STUDENT_LEAVE_TYPE_LABELS } from "@/data/mock-student-leave"
import { ATTENDANCE_EDIT_STATUS_VARIANTS } from "@/data/mock-attendance-edit-requests"
import { useStudentLeave } from "@/context/student-leave-context"
import { useAttendance } from "@/context/attendance-context"
import { useAttendanceMode } from "@/context/attendance-mode-context"
import { applyLeavesToRoster, type RosterEntry } from "@/lib/attendance-leave-merge"
import { cn } from "@/lib/utils"

const PERIODS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7"]
const CLASSES = ["VI-A", "VI-B", "VII-A", "VII-B", "VIII-A", "VIII-B", "IX-A", "X-A"]
/** Canonical demo "today" — matches the 2026 school session + seeded leaves. */
const DEMO_TODAY = "2026-06-25"
const TEACHER = "Priya Sharma"
const TEACHER_ID = "t1"

type Mark = "P" | "A"

export default function MarkAttendancePage() {
  const { requests } = useStudentLeave()
  const { requestEdit, latestFor } = useAttendance()
  const { attendanceMode } = useAttendanceMode()

  const [cls, setCls]       = useState("VIII-A")
  const [period, setPeriod] = useState("P3")
  const [date, setDate]     = useState(DEMO_TODAY)
  const [submitted, setSubmitted] = useState(false)
  const [notes, setNotes] = useState<ProgressNote[]>(MOCK_PROGRESS_NOTES)

  // Explicit teacher marks. Absent of an entry → use the leave-derived default.
  const [marks, setMarks] = useState<Record<string, Mark>>({})
  const [overrideLog, setOverrideLog] = useState<AttendanceOverrideEntry[]>(MOCK_ATTENDANCE_OVERRIDES)
  const [pendingOverride, setPendingOverride] = useState<RosterEntry | null>(null)
  const [showReqModal, setShowReqModal] = useState(false)
  const [reqReason, setReqReason] = useState("")

  // Roster for the selected class (combined "VIII-A" form from class + section).
  const roster = useMemo(
    () =>
      STUDENTS
        .filter(s => `${s.class}-${s.section}` === cls)
        .map(s => ({ id: s.id, name: s.name, rollNo: s.rollNo })),
    [cls],
  )

  // Enrich with approved-leave flags for the selected class + date (live).
  const rosterWithLeave = useMemo(
    () => applyLeavesToRoster(roster, requests, cls, date),
    [roster, requests, cls, date],
  )

  // Reset teacher marks + submission whenever class or date changes.
  useEffect(() => {
    setMarks({})
    setSubmitted(false)
  }, [cls, date])

  function effective(entry: RosterEntry): Mark | "L" {
    return marks[entry.id] ?? (entry.onLeave ? "L" : "P")
  }

  const presentCount = rosterWithLeave.filter(e => effective(e) === "P").length
  const leaveCount   = rosterWithLeave.filter(e => effective(e) === "L").length
  const absentCount  = rosterWithLeave.length - presentCount - leaveCount

  function handleCardClick(entry: RosterEntry) {
    if (submitted) return
    const cur = effective(entry)
    if (cur === "L") {
      // Student is on approved leave — overriding to present needs confirmation.
      setPendingOverride(entry)
      return
    }
    setMarks(prev => ({ ...prev, [entry.id]: cur === "P" ? "A" : "P" }))
  }

  function confirmOverride() {
    const entry = pendingOverride
    if (!entry) return
    setMarks(prev => ({ ...prev, [entry.id]: "P" }))
    setOverrideLog(prev => [
      {
        id: `ov-${Date.now()}`,
        date,
        className: cls,
        period,
        studentId: entry.id,
        studentName: entry.name,
        leaveId: entry.leaveId,
        reason: "present-despite-leave",
        by: TEACHER,
        byRole: "teacher",
        at: new Date().toISOString(),
        note: "Student attended despite approved leave.",
      },
      ...prev,
    ])
    setPendingOverride(null)
  }

  const todaysOverrides = overrideLog.filter(o => o.className === cls && o.date === date)

  function submitEditRequest() {
    if (!reqReason.trim()) return
    requestEdit({ className: cls, period, date, teacherId: TEACHER_ID, teacherName: TEACHER, reason: reqReason.trim() })
    setReqReason("")
    setShowReqModal(false)
  }

  if (submitted) {
    const editReq = latestFor(cls, period, date)
    const approved = editReq?.status === "approved"
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
        <PageHeader icon={<ClipboardCheck size={20} />} title="Mark Attendance" subtitle={`${cls} · ${attendanceMode === "per-period" ? `${period} · ` : ""}${date}`} />
        <Card className="max-w-md mx-auto text-center">
          <CardContent className="pt-8 pb-6">
            <div className="size-16 rounded-full bg-success flex items-center justify-center mx-auto mb-4">
              <Check className="size-8 text-success-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Attendance Submitted!</h3>
            <p className="text-muted-foreground text-sm">
              {presentCount} present · {absentCount} absent · {leaveCount} on leave{attendanceMode === "per-period" ? ` — ${period}` : ""} · {cls}
            </p>

            <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3.5" /> This record is locked. Changes need approval.
            </div>

            {/* Edit-request status */}
            {editReq && (
              <div className="mt-4 rounded-lg border bg-muted/30 p-3 text-left text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Modification request</span>
                  <Badge variant={ATTENDANCE_EDIT_STATUS_VARIANTS[editReq.status]} className="capitalize">{editReq.status}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{editReq.reason}</p>
                {editReq.reviewNote && <p className="mt-1 text-xs italic text-muted-foreground">“{editReq.reviewNote}”</p>}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2">
              {approved ? (
                <Button className="w-full bg-success hover:bg-success/90 text-success-foreground" onClick={() => setSubmitted(false)}>
                  <PencilLine className="size-4 mr-1" /> Edit now (approved)
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant="outline"
                  disabled={editReq?.status === "pending"}
                  onClick={() => setShowReqModal(true)}
                >
                  <PencilLine className="size-4 mr-1" />
                  {editReq?.status === "pending" ? "Request pending approval…" : "Request to modify"}
                </Button>
              )}
              <Button className="w-full" variant="ghost" onClick={() => setSubmitted(false)}>Mark Another</Button>
            </div>
          </CardContent>
        </Card>

        {/* Request-to-modify reason modal */}
        <Dialog open={showReqModal} onOpenChange={setShowReqModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request to modify attendance</DialogTitle>
              <DialogDescription>
                {cls}{attendanceMode === "per-period" ? ` · ${period}` : ""} · {date}. Admin or Management will review your request. The record stays locked until approved.
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={reqReason}
              onChange={e => setReqReason(e.target.value)}
              placeholder="Why do you need to change this record?"
              rows={4}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowReqModal(false)}>Cancel</Button>
              <Button onClick={submitEditRequest} disabled={!reqReason.trim()}>Send request</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<ClipboardCheck size={20} />}
        title="Mark Attendance"
        subtitle="Take roll call for your class"
        actions={
          <Button onClick={() => setSubmitted(true)} className="bg-success hover:bg-success/90 text-success-foreground">
            <Check className="size-4 mr-1" /> Submit Attendance
          </Button>
        }
      />

      {/* Selectors + stats */}
      <div className="flex flex-col gap-3">
        {/* Controls row */}
        <div className="flex flex-wrap gap-3 items-center">
          <Select value={cls} onValueChange={setCls}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Class" /></SelectTrigger>
            <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          {attendanceMode === "per-period" && (
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-36"><SelectValue placeholder="Period" /></SelectTrigger>
              <SelectContent>{PERIODS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          )}
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
          {/* Stats — hidden on mobile/tablet, shown inline on desktop */}
          <div className="hidden lg:flex ml-auto items-center gap-3 text-sm">
            <span className="text-[var(--ef-green-dark)] font-semibold">Present: {presentCount}</span>
            <span className="text-destructive font-semibold">Absent: {absentCount}</span>
            {leaveCount > 0 && <span className="text-[var(--ef-amber-dark)] font-semibold">On leave: {leaveCount}</span>}
            <span className="text-muted-foreground">Total: {rosterWithLeave.length}</span>
          </div>
        </div>
        {/* Stats row — visible on mobile/tablet, hidden on desktop */}
        <div className="flex lg:hidden items-center gap-4 text-sm">
          <span className="text-[var(--ef-green-dark)] font-semibold">Present: {presentCount}</span>
          <span className="text-destructive font-semibold">Absent: {absentCount}</span>
          {leaveCount > 0 && <span className="text-[var(--ef-amber-dark)] font-semibold">On leave: {leaveCount}</span>}
          <span className="text-muted-foreground">Total: {rosterWithLeave.length}</span>
        </div>
      </div>

      {leaveCount > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-[var(--ef-amber)]/30 bg-[var(--ef-amber-light)] px-3 py-2 text-sm text-[var(--ef-amber-dark)]">
          <CalendarOff className="size-4 mt-0.5 flex-shrink-0" />
          <span>
            {leaveCount} student{leaveCount > 1 ? "s are" : " is"} pre-marked <strong>on approved leave</strong> from parent requests.
            Tap a leave card only if the student actually attended — the change is logged.
          </span>
        </div>
      )}

      {/* Student Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {rosterWithLeave.map(entry => {
          const state = effective(entry)
          const overridden = entry.onLeave && marks[entry.id] === "P"
          return (
            <button
              key={entry.id}
              onClick={() => handleCardClick(entry)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                state === "P" && "border-[var(--ef-green)] bg-[var(--ef-green-light)]",
                state === "A" && "border-[var(--ef-red)] bg-[var(--ef-red-light)]",
                state === "L" && "border-[var(--ef-amber)] bg-[var(--ef-amber-light)]",
              )}
            >
              <div className={cn(
                "size-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white",
                state === "P" && "bg-[var(--ef-green)]",
                state === "A" && "bg-[var(--ef-red)]",
                state === "L" && "bg-[var(--ef-amber)]",
              )} aria-hidden="true">
                {entry.rollNo}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{entry.name}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <p className="text-xs text-muted-foreground">Roll #{entry.rollNo}</p>
                  {state === "L" && (
                    <Badge variant="warning" className="h-4 px-1.5 text-[10px]">On leave</Badge>
                  )}
                  {overridden && (
                    <Badge variant="success" className="h-4 px-1.5 text-[10px]">Attended</Badge>
                  )}
                </div>
              </div>
              <div className={cn(
                "size-6 rounded-full flex items-center justify-center flex-shrink-0 text-white",
                state === "P" && "bg-[var(--ef-green)]",
                state === "A" && "bg-[var(--ef-red)]",
                state === "L" && "bg-[var(--ef-amber)]",
              )}>
                {state === "P" && <Check className="size-3.5" />}
                {state === "A" && <X className="size-3.5" />}
                {state === "L" && <CalendarOff className="size-3" />}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setMarks(Object.fromEntries(rosterWithLeave.map(e => [e.id, "P" as Mark])))}>Mark All Present</Button>
        <Button variant="outline" onClick={() => setMarks(Object.fromEntries(rosterWithLeave.map(e => [e.id, "A" as Mark])))}>Mark All Absent</Button>
      </div>

      {/* Override log — students marked present despite an approved leave */}
      {todaysOverrides.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <History className="size-4 text-muted-foreground" />
              <h4 className="text-sm font-semibold">Leave override log · {cls} · {date}</h4>
            </div>
            <ul className="flex flex-col gap-2">
              {todaysOverrides.map(o => (
                <li key={o.id} className="flex items-start gap-2 text-sm">
                  <Badge variant="success" className="h-5 mt-0.5">Present</Badge>
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{o.studentName}</strong> attended despite approved leave
                    {" · "}marked by {o.by} ({o.byRole})
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Per-student progress notes (understood / struggling / …) */}
      <ProgressNotes
        notes={notes.filter(n => n.class === cls)}
        classes={CLASSES}
        students={rosterWithLeave.map(s => ({ id: s.id, name: s.name }))}
        subject="Mathematics"
        periodId={period}
        teacher={TEACHER}
        onSave={n => setNotes(prev => [n, ...prev])}
      />

      {/* Override confirmation */}
      <AlertDialog open={!!pendingOverride} onOpenChange={open => { if (!open) setPendingOverride(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Mark {pendingOverride?.name} present?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingOverride?.name} has an <strong>approved leave</strong>
              {pendingOverride?.leaveType ? ` (${STUDENT_LEAVE_TYPE_LABELS[pendingOverride.leaveType]})` : ""} for {date}.
              Marking them present records an override in the attendance log so Admin and Management can see the student attended despite the leave.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep on leave</AlertDialogCancel>
            <AlertDialogAction onClick={confirmOverride}>Mark present &amp; log</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
