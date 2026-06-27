/**
 * attendance-leave-merge.ts  (Feature F6)
 *
 * Bridges the PARENT student-leave flow into the TEACHER attendance roster.
 *
 * When a teacher opens roll-call for a class on a given date, any student with
 * an APPROVED leave covering that date is pre-flagged as "on leave" so the
 * teacher does not have to mark them manually. If the student actually shows
 * up, the teacher can override to Present — that override is recorded in the
 * attendance override log (see `src/data/mock-attendance-log.ts`).
 *
 * Pure functions only — no React, no side effects — so they are trivially
 * testable and reusable by the API layer later.
 */

import type { StudentLeaveRequest } from "@/data/mock-student-leave"

/** Minimal roster row the merge needs. */
export interface RosterStudent {
  id: string
  name: string
  rollNo: number
}

/** A roster row enriched with leave status. */
export interface RosterEntry extends RosterStudent {
  onLeave: boolean
  leaveId?: string
  leaveType?: StudentLeaveRequest["type"]
  leaveReason?: string
}

/** Inclusive ISO yyyy-mm-dd range check (string comparison is safe for ISO). */
function withinRange(date: string, from: string, to: string): boolean {
  return date >= from && date <= to
}

/**
 * All APPROVED leaves for a given class that cover `date`.
 * `className` is the combined form, e.g. "VIII-A".
 */
export function getApprovedLeavesForClassOnDate(
  leaves: StudentLeaveRequest[],
  className: string,
  date: string,
): StudentLeaveRequest[] {
  return leaves.filter(
    l =>
      l.status === "approved" &&
      l.className === className &&
      withinRange(date, l.from, l.to),
  )
}

/**
 * Enrich a roster with on-leave flags for the selected class + date.
 * Matches a leave to a roster student by id first, then by name (the demo
 * mock uses `child-*` ids for leaves but `s*` ids for the roster, so name is
 * the reliable bridge).
 */
export function applyLeavesToRoster(
  roster: RosterStudent[],
  leaves: StudentLeaveRequest[],
  className: string,
  date: string,
): RosterEntry[] {
  const dayLeaves = getApprovedLeavesForClassOnDate(leaves, className, date)
  return roster.map(s => {
    const leave = dayLeaves.find(l => l.studentId === s.id || l.studentName === s.name)
    return leave
      ? {
          ...s,
          onLeave: true,
          leaveId: leave.id,
          leaveType: leave.type,
          leaveReason: leave.reason,
        }
      : { ...s, onLeave: false }
  })
}

/** Count of students pre-flagged on leave in an enriched roster. */
export function countOnLeave(entries: RosterEntry[]): number {
  return entries.filter(e => e.onLeave).length
}
