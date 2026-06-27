"use client"

/**
 * attendance-context.tsx  (Feature F1 — Attendance governance)
 *
 * Live, session-scoped store linking the TEACHER attendance-edit producer to
 * the ADMIN / MANAGEMENT approver consumers — the attendance counterpart of
 * student-leave-context.
 *
 * Flow: teacher submits → record locked → teacher files an edit request →
 * admin/management approve/reject → on approval the teacher may edit again.
 *
 * Mounted in (app)/layout.tsx so a request filed on /teacher/attendance/mark is
 * immediately actionable on /admin/attendance and /management/attendance.
 */

import {
  createContext, useContext, useState, useMemo, useCallback, type ReactNode,
} from "react"
import {
  MOCK_ATTENDANCE_EDIT_REQUESTS,
  attendanceKey,
  type AttendanceEditRequest,
} from "@/data/mock-attendance-edit-requests"

export interface RequestEditInput {
  className: string
  period: string
  date: string
  teacherId: string
  teacherName: string
  reason: string
}

interface AttendanceContextValue {
  requests: AttendanceEditRequest[]
  pendingCount: number
  /** Teacher → file an edit request for a locked record. */
  requestEdit: (input: RequestEditInput) => AttendanceEditRequest
  /** Admin / Management → approve a pending request. */
  approveEdit: (id: string, reviewer: string, note?: string) => void
  /** Admin / Management → reject a pending request. */
  rejectEdit: (id: string, reviewer: string, note?: string) => void
  /** Latest request for a given record (most recent first). */
  latestFor: (className: string, period: string, date: string) => AttendanceEditRequest | undefined
}

const AttendanceContext = createContext<AttendanceContextValue | null>(null)

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<AttendanceEditRequest[]>(MOCK_ATTENDANCE_EDIT_REQUESTS)

  const requestEdit = useCallback((input: RequestEditInput): AttendanceEditRequest => {
    const record: AttendanceEditRequest = {
      id: `aer-${Date.now()}`,
      status: "pending",
      submittedAt: new Date().toISOString(),
      ...input,
    }
    setRequests(prev => [record, ...prev])
    return record
  }, [])

  const review = useCallback(
    (id: string, status: "approved" | "rejected", reviewer: string, note?: string) => {
      setRequests(prev =>
        prev.map(r =>
          r.id === id
            ? { ...r, status, reviewedBy: reviewer, reviewedAt: new Date().toISOString(), reviewNote: note ?? r.reviewNote }
            : r,
        ),
      )
    },
    [],
  )

  const approveEdit = useCallback(
    (id: string, reviewer: string, note?: string) => review(id, "approved", reviewer, note),
    [review],
  )
  const rejectEdit = useCallback(
    (id: string, reviewer: string, note?: string) => review(id, "rejected", reviewer, note),
    [review],
  )

  const latestFor = useCallback(
    (className: string, period: string, date: string) => {
      const key = attendanceKey(className, period, date)
      return requests.find(r => attendanceKey(r.className, r.period, r.date) === key)
    },
    [requests],
  )

  const value: AttendanceContextValue = useMemo(
    () => ({
      requests,
      pendingCount: requests.filter(r => r.status === "pending").length,
      requestEdit,
      approveEdit,
      rejectEdit,
      latestFor,
    }),
    [requests, requestEdit, approveEdit, rejectEdit, latestFor],
  )

  return <AttendanceContext.Provider value={value}>{children}</AttendanceContext.Provider>
}

export function useAttendance(): AttendanceContextValue {
  const ctx = useContext(AttendanceContext)
  if (!ctx) throw new Error("useAttendance must be used inside <AttendanceProvider>")
  return ctx
}
