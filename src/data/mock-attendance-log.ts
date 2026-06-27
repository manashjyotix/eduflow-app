/**
 * mock-attendance-log.ts  (Feature F6)
 *
 * Audit log of attendance overrides — specifically when a teacher marks a
 * student PRESENT even though that student had an APPROVED leave for the day
 * ("present despite leave"). This is the "related log" the leave→attendance
 * flow writes to.
 *
 * Producer:  Teacher mark-attendance page (override action).
 * Consumers: Admin / Management attendance monitor (surfaced in F1's audit view).
 *
 * For the demo this is a session-local seed; F1 (attendance governance) will
 * persist these into the shared Attendance.edits audit array + a context store.
 */

export type AttendanceOverrideReason = "present-despite-leave"

export interface AttendanceOverrideEntry {
  id: string
  date: string          // ISO yyyy-mm-dd of the class
  className: string     // e.g. "VIII-A"
  period: string        // e.g. "P3"
  studentId: string
  studentName: string
  leaveId?: string      // the approved leave that was overridden
  reason: AttendanceOverrideReason
  /** Who performed the override + when. */
  by: string
  byRole: "teacher" | "admin" | "management"
  at: string            // ISO timestamp
  note?: string
}

export const OVERRIDE_REASON_LABELS: Record<AttendanceOverrideReason, string> = {
  "present-despite-leave": "Marked present despite approved leave",
}

/** Seed: one historical override so the log panel is never empty in the demo. */
export const MOCK_ATTENDANCE_OVERRIDES: AttendanceOverrideEntry[] = [
  {
    id: "ov-1",
    date: "2026-06-17",
    className: "VIII-A",
    period: "P1",
    studentId: "s1",
    studentName: "Rohit Das",
    leaveId: "sl-1",
    reason: "present-despite-leave",
    by: "Priya Sharma",
    byRole: "teacher",
    at: "2026-06-17T09:35:00+05:30",
    note: "Student attended despite approved family-function leave.",
  },
]
