"use client"

/**
 * student-leave-context.tsx
 *
 * Live, session-scoped store that links the PARENT leave-request producer to
 * the ADMIN / MANAGEMENT approver consumers.
 *
 * Mounted in the (app) layout so a request submitted from /parent/leave is
 * immediately visible (and actionable) on /admin/student-leave and
 * /management/student-leave within the same session — no backend required.
 */

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react"
import {
  MOCK_STUDENT_LEAVES,
  type StudentLeaveRequest,
  type StudentLeaveType,
} from "@/data/mock-student-leave"

export interface SubmitLeaveInput {
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
}

interface StudentLeaveContextValue {
  requests: StudentLeaveRequest[]
  /** Counts for badges / KPIs */
  pendingCount: number
  /** Parent → create a new pending request. Returns the created record. */
  submitLeave: (input: SubmitLeaveInput) => StudentLeaveRequest
  /** Admin / Management → approve a pending request. */
  approveLeave: (id: string, reviewer: string, note?: string) => void
  /** Admin / Management → reject a pending request. */
  rejectLeave: (id: string, reviewer: string, note?: string) => void
}

const StudentLeaveContext = createContext<StudentLeaveContextValue | null>(null)

export function StudentLeaveProvider({ children }: { children: ReactNode }) {
  const [requests, setRequests] = useState<StudentLeaveRequest[]>(MOCK_STUDENT_LEAVES)

  const submitLeave = useCallback((input: SubmitLeaveInput): StudentLeaveRequest => {
    const record: StudentLeaveRequest = {
      id: `sl-${Date.now()}`,
      status: "pending",
      submittedOn: new Date().toISOString().split("T")[0],
      ...input,
    }
    setRequests(prev => [record, ...prev])
    return record
  }, [])

  const approveLeave = useCallback((id: string, reviewer: string, note?: string) => {
    setRequests(prev =>
      prev.map(r =>
        r.id === id
          ? {
              ...r,
              status: "approved" as const,
              reviewedBy: reviewer,
              reviewedOn: new Date().toISOString().split("T")[0],
              reviewNote: note ?? r.reviewNote,
            }
          : r
      )
    )
  }, [])

  const rejectLeave = useCallback((id: string, reviewer: string, note?: string) => {
    setRequests(prev =>
      prev.map(r =>
        r.id === id
          ? {
              ...r,
              status: "rejected" as const,
              reviewedBy: reviewer,
              reviewedOn: new Date().toISOString().split("T")[0],
              reviewNote: note ?? r.reviewNote,
            }
          : r
      )
    )
  }, [])

  const value: StudentLeaveContextValue = useMemo(
    () => ({
      requests,
      pendingCount: requests.filter(r => r.status === "pending").length,
      submitLeave,
      approveLeave,
      rejectLeave,
    }),
    [requests, submitLeave, approveLeave, rejectLeave]
  )

  return (
    <StudentLeaveContext.Provider value={value}>
      {children}
    </StudentLeaveContext.Provider>
  )
}

export function useStudentLeave(): StudentLeaveContextValue {
  const ctx = useContext(StudentLeaveContext)
  if (!ctx) throw new Error("useStudentLeave must be used inside <StudentLeaveProvider>")
  return ctx
}
