/**
 * mock-attendance-edit-requests.ts  (Feature F1 — Attendance governance)
 *
 * Once a teacher SUBMITS attendance it is locked. To change a locked record the
 * teacher files an edit request; Admin or Management approves/rejects it. On
 * approval the record unlocks for that teacher.
 *
 * Producer:  Teacher mark-attendance page  → requestEdit()
 * Consumers: Admin (/admin/attendance) and Management (/management/attendance)
 *            edit-request inbox → approve / reject.
 *
 * Import from here — never redeclare inline.
 */

export type AttendanceEditStatus = "pending" | "approved" | "rejected"

export interface AttendanceEditRequest {
  id: string
  className: string      // e.g. "VIII-A"
  period: string         // e.g. "P3"
  date: string           // ISO yyyy-mm-dd of the locked record
  teacherId: string
  teacherName: string
  reason: string
  status: AttendanceEditStatus
  submittedAt: string    // ISO timestamp
  reviewedBy?: string
  reviewedAt?: string
  reviewNote?: string
}

export const ATTENDANCE_EDIT_STATUS_VARIANTS: Record<
  AttendanceEditStatus,
  "success" | "destructive" | "warning"
> = {
  approved: "success",
  rejected: "destructive",
  pending:  "warning",
}

/** A composite key identifying one locked attendance record. */
export function attendanceKey(className: string, period: string, date: string): string {
  return `${className}__${period}__${date}`
}

export const MOCK_ATTENDANCE_EDIT_REQUESTS: AttendanceEditRequest[] = [
  {
    id: "aer-1",
    className: "VII-A",
    period: "P2",
    date: "2026-06-24",
    teacherId: "t2",
    teacherName: "Rajesh Kalita",
    reason: "Marked Aman Bora absent by mistake — he was present after the bell.",
    status: "pending",
    submittedAt: "2026-06-24T11:05:00+05:30",
  },
  {
    id: "aer-2",
    className: "IX-A",
    period: "P5",
    date: "2026-06-23",
    teacherId: "t5",
    teacherName: "Meena Gogoi",
    reason: "Two students arrived late — need to change Absent to Late.",
    status: "approved",
    submittedAt: "2026-06-23T13:20:00+05:30",
    reviewedBy: "Arnab Paul",
    reviewedAt: "2026-06-23T14:00:00+05:30",
    reviewNote: "Approved — please update and resubmit.",
  },
]
