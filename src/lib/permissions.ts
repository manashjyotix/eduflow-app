/**
 * permissions.ts  (Feature F3 — delegated report-card entry)
 *
 * Small access helpers for report-card entry scope. Admin and Management may
 * enter for any class; a Teacher may only enter for a class+section+term they
 * have been explicitly assigned to.
 */

import type { Role } from "@/lib/constants"
import type { ReportCardAssignment } from "@/data/mock-report-cards"

export function canEnterReportCard(
  role: Role,
  userId: string,
  className: string,
  term: string,
  assignments: ReportCardAssignment[],
): boolean {
  if (role === "admin" || role === "management") return true
  if (role === "teacher") {
    return assignments.some(
      a => a.userId === userId && a.className === className && a.term === term,
    )
  }
  return false
}

/** Classes+terms a given user is assigned to (for filtering the entry UI). */
export function assignedScopesFor(
  userId: string,
  assignments: ReportCardAssignment[],
): { className: string; term: string }[] {
  return assignments
    .filter(a => a.userId === userId)
    .map(a => ({ className: a.className, term: a.term }))
}
