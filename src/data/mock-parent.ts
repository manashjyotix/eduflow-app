/**
 * mock-parent.ts
 *
 * Centralized mock data for the Parent portal, keyed by child ID.
 * Covers: child profiles, fee history, payment methods.
 *
 * Single source of truth — import from here, never redeclare inline.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export interface ChildProfile {
  name: string
  class: string
  roll: number
  admissionNo: string
  attendance: number
  dob: string
  bloodGroup: string
  school: string
  classTeacher: string
  section: string
  initials: string
}

export type FeeStatus = "paid" | "overdue" | "pending"

export interface FeeRecord {
  month: string
  amount: number
  status: FeeStatus
  description?: string
}

// ─── Per-Child Profile Data ─────────────────────────────────────────────────────

export const CHILD_PROFILES: Record<string, ChildProfile> = {
  "child-1": {
    name: "Rohit Das",
    class: "VIII-A",
    roll: 12,
    admissionNo: "HCEA/2020/048",
    attendance: 84.6,
    dob: "March 15, 2012",
    bloodGroup: "O+",
    school: "Holy Child English Academy, Howly",
    classTeacher: "Priya Sharma",
    section: "High Section",
    initials: "RD",
  },
  "child-2": {
    name: "Riya Das",
    class: "VI-B",
    roll: 8,
    admissionNo: "HCEA/2022/091",
    attendance: 92.3,
    dob: "June 8, 2014",
    bloodGroup: "B+",
    school: "Holy Child English Academy, Howly",
    classTeacher: "Meena Gogoi",
    section: "Middle Section",
    initials: "RD",
  },
}

// ─── Per-Child Fee History ──────────────────────────────────────────────────────

export const CHILD_FEE_HISTORY: Record<string, FeeRecord[]> = {
  "child-1": [
    { month: "April 2026", amount: 3200, status: "paid",    description: "Tuition + Exam Fee" },
    { month: "March 2026", amount: 3200, status: "paid",    description: "Tuition + Exam Fee" },
    { month: "May 2026",   amount: 2500, status: "overdue", description: "Tuition Fee" },
    { month: "June 2026",  amount: 500,  status: "pending", description: "Exam Fee" },
  ],
  "child-2": [
    { month: "April 2026", amount: 2800, status: "paid",    description: "Tuition + Activity Fee" },
    { month: "March 2026", amount: 2800, status: "paid",    description: "Tuition + Activity Fee" },
    { month: "May 2026",   amount: 2800, status: "paid",    description: "Tuition + Activity Fee" },
    { month: "June 2026",  amount: 400,  status: "pending", description: "Exam Fee" },
  ],
}

// ─── Fee Status Styling ─────────────────────────────────────────────────────────

export const FEE_STATUS_CLASSES: Record<FeeStatus, string> = {
  paid:    "bg-[var(--ef-green-light)] text-[var(--ef-green-dark)]",
  overdue: "bg-[var(--ef-red-light)] text-[var(--ef-red-dark)]",
  pending: "bg-[var(--ef-amber-light)] text-warning-foreground",
}
