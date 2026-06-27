"use client"

/**
 * AttendanceEditInbox  (Feature F1)
 *
 * Approver inbox for teacher attendance-edit requests. Used by both
 * Admin (/admin/attendance) and Management (/management/attendance).
 */

import { useState } from "react"
import { Check, X, Clock, CalendarClock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAttendance } from "@/context/attendance-context"
import { ATTENDANCE_EDIT_STATUS_VARIANTS } from "@/data/mock-attendance-edit-requests"

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
}

export function AttendanceEditInbox({ reviewer }: { reviewer: string }) {
  const { requests, approveEdit, rejectEdit, pendingCount } = useAttendance()
  const [rejecting, setRejecting] = useState<string | null>(null)
  const [note, setNote] = useState("")

  const ordered = [...requests].sort((a, b) =>
    a.status === "pending" && b.status !== "pending" ? -1
      : b.status === "pending" && a.status !== "pending" ? 1
      : b.submittedAt.localeCompare(a.submittedAt),
  )

  function confirmReject() {
    if (rejecting) rejectEdit(rejecting, reviewer, note.trim() || undefined)
    setRejecting(null)
    setNote("")
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No modification requests.
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        {pendingCount > 0
          ? `${pendingCount} request${pendingCount > 1 ? "s" : ""} awaiting your review`
          : "All caught up — no pending requests"}
      </p>

      {ordered.map(r => (
        <Card key={r.id}>
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold">{r.teacherName}</span>
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <CalendarClock className="size-3" /> {r.className} · {r.period} · {r.date}
                </Badge>
                <Badge variant={ATTENDANCE_EDIT_STATUS_VARIANTS[r.status]} className="capitalize text-[11px]">
                  {r.status}
                </Badge>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">{r.reason}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/80">
                <Clock className="size-3" /> Requested {fmt(r.submittedAt)}
                {r.reviewedBy && ` · reviewed by ${r.reviewedBy}`}
              </p>
              {r.reviewNote && <p className="mt-1 text-xs italic text-muted-foreground">“{r.reviewNote}”</p>}
            </div>

            {r.status === "pending" && (
              <div className="flex shrink-0 gap-2">
                <Button
                  size="sm"
                  className="bg-success hover:bg-success/90 text-success-foreground"
                  onClick={() => approveEdit(r.id, reviewer)}
                >
                  <Check className="size-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejecting(r.id)}>
                  <X className="size-4 mr-1" /> Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={!!rejecting} onOpenChange={open => { if (!open) { setRejecting(null); setNote("") } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject modification request?</AlertDialogTitle>
            <AlertDialogDescription>
              Optionally tell the teacher why. The record stays locked.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Reason (optional)…" rows={3} />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReject}>Reject request</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
