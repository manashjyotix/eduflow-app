/**
 * mock-student-leave.ts
 *
 * Shared source of truth for STUDENT leave requests (parent → school).
 *
 * Producer:  Parent portal  (/parent/leave) submits new requests.
 * Consumers: Admin (/admin/student-leave) and Management
 *            (/management/student-leave) review / approve / reject them.
 *
 * This is the student-leave counterpart of `mock-absences.ts` (which covers
 * TEACHER absences). Import from here — never redeclare inline.
 */

export type StudentLeaveType =
  | "sick"
  | "family_emergency"
  | "personal"
  | "religious"
  | "travel"
  | "medical"
  | "other"

export type StudentLeaveStatus = "approved" | "pending" | "rejected"

export interface StudentLeaveRequest {
  id: string
  /** Maps to MockChild.id in child-context (child-1, child-2, …) */
  studentId: string
  studentName: string
  className: string
  parentName: string
  subject: string
  from: string
  to: string
  days: number
  type: StudentLeaveType
  reason: string
  status: StudentLeaveStatus
  submittedOn: string
  /** Set when an admin / management user acts on the request */
  reviewedBy?: string
  reviewedOn?: string
  reviewNote?: string
}

export const STUDENT_LEAVE_TYPE_LABELS: Record<StudentLeaveType, string> = {
  sick:             "Sick Leave",
  family_emergency: "Family Emergency",
  personal:         "Personal",
  religious:        "Religious / Festival",
  travel:           "Travel",
  medical:          "Medical Appointment",
  other:            "Other",
}

export const STUDENT_LEAVE_STATUS_VARIANTS: Record<
  StudentLeaveStatus,
  "success" | "destructive" | "warning"
> = {
  approved: "success",
  rejected: "destructive",
  pending:  "warning",
}

// ─── Seed data ────────────────────────────────────────────────────────────────
// child-1 (Rohit) & child-2 (Riya) belong to the demo parent (Pankaj Das).
// The remaining entries belong to other students so the Admin / Management
// inbox shows realistic cross-class volume, including a fresh pending request.

export const MOCK_STUDENT_LEAVES: StudentLeaveRequest[] = [
  { id: "sl-203", studentId: "child-1", studentName: "Rohit Das",    className: "VIII-A", parentName: "Pankaj Das",   subject: "Medical check-up",         from: "2026-06-25", to: "2026-06-25", days: 1, type: "medical",          reason: "Routine medical check-up — approved by class teacher.",      status: "approved", submittedOn: "2026-06-22", reviewedBy: "Arnab Paul",  reviewedOn: "2026-06-23" },
  { id: "sl-201", studentId: "child-3", studentName: "Aman Bora",    className: "VII-B",  parentName: "Dipul Bora",   subject: "Wedding in family",        from: "2026-06-25", to: "2026-06-26", days: 2, type: "personal",         reason: "Elder sister's wedding — needs to travel to native place.", status: "pending",  submittedOn: "2026-06-23" },
  { id: "sl-202", studentId: "child-4", studentName: "Priti Kalita", className: "VI-A",   parentName: "Ramen Kalita", subject: "Viral fever",              from: "2026-06-24", to: "2026-06-24", days: 1, type: "sick",             reason: "High temperature since morning, doctor advised rest.",       status: "pending",  submittedOn: "2026-06-23" },
  { id: "sl-1",   studentId: "child-1", studentName: "Rohit Das",    className: "VIII-A", parentName: "Pankaj Das",   subject: "Family function",          from: "2026-06-17", to: "2026-06-17", days: 1, type: "personal",         reason: "Family function at relatives' house.",                       status: "approved", submittedOn: "2026-06-10", reviewedBy: "Arnab Paul", reviewedOn: "2026-06-11" },
  { id: "sl-2",   studentId: "child-1", studentName: "Rohit Das",    className: "VIII-A", parentName: "Pankaj Das",   subject: "Fever — doctor advised",   from: "2026-06-03", to: "2026-06-04", days: 2, type: "sick",             reason: "Rohit had fever and was advised rest by doctor.",            status: "approved", submittedOn: "2026-06-03", reviewedBy: "Arnab Paul", reviewedOn: "2026-06-03" },
  { id: "sl-3",   studentId: "child-2", studentName: "Riya Das",     className: "VI-B",   parentName: "Pankaj Das",   subject: "Grandfather hospitalised", from: "2026-05-22", to: "2026-05-22", days: 1, type: "family_emergency", reason: "Grandfather hospitalised — Riya needed to accompany.",       status: "approved", submittedOn: "2026-05-22", reviewedBy: "Mrinal Ojha", reviewedOn: "2026-05-22" },
  { id: "sl-4",   studentId: "child-1", studentName: "Rohit Das",    className: "VIII-A", parentName: "Pankaj Das",   subject: "Festival trip",            from: "2026-05-08", to: "2026-05-09", days: 2, type: "personal",         reason: "Trip to native village for festival.",                       status: "rejected", submittedOn: "2026-05-05", reviewedBy: "Arnab Paul", reviewedOn: "2026-05-06", reviewNote: "Falls on exam revision days — please reschedule." },
  { id: "sl-5",   studentId: "child-1", studentName: "Rohit Das",    className: "VIII-A", parentName: "Pankaj Das",   subject: "Stomach ache",             from: "2026-04-15", to: "2026-04-15", days: 1, type: "sick",             reason: "Stomach ache and mild diarrhoea.",                           status: "approved", submittedOn: "2026-04-15", reviewedBy: "Mrinal Ojha", reviewedOn: "2026-04-15" },
]
