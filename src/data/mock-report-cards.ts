/**
 * mock-report-cards.ts  (Feature F3 — Report Cards)
 *
 * Report card records + delegated-entry assignments. Marks are entered by
 * Teacher / Management / Admin. Admin assigns a specific user (and role) to
 * enter report cards for a specific class+section and term.
 *
 * Import from here — never redeclare inline.
 */

export type ReportCardStatus = "draft" | "published"

export interface SubjectMark {
  subject: string
  marks: number
  maxMarks: number
  grade: string
  remark?: string
}

export interface ReportCard {
  id: string
  studentId: string
  studentName: string
  rollNo: number
  className: string      // combined "VIII-A"
  term: string           // "Term 1"
  subjects: SubjectMark[]
  total: number
  maxTotal: number
  percentage: number
  status: ReportCardStatus
  enteredBy: string
  publishedAt?: string
}

export type ReportCardEntryRole = "teacher" | "management" | "admin"

export interface ReportCardAssignment {
  id: string
  userId: string
  userName: string
  role: ReportCardEntryRole
  className: string      // scope: combined "VIII-A"
  term: string
  assignedBy: string
  assignedAt: string
}

export const REPORT_CARD_TERMS = ["Term 1", "Term 2", "Final"] as const

/** Standard grade bands (percentage → letter). */
export function gradeForPercentage(pct: number): string {
  if (pct >= 90) return "A+"
  if (pct >= 80) return "A"
  if (pct >= 70) return "B+"
  if (pct >= 60) return "B"
  if (pct >= 50) return "C+"
  if (pct >= 40) return "C"
  if (pct >= 33) return "D"
  return "E"
}

// ─── Seed ───────────────────────────────────────────────────────────────────

function card(
  id: string, studentId: string, studentName: string, rollNo: number,
  className: string, term: string, status: ReportCardStatus, enteredBy: string,
  subjects: SubjectMark[],
): ReportCard {
  const total = subjects.reduce((s, x) => s + x.marks, 0)
  const maxTotal = subjects.reduce((s, x) => s + x.maxMarks, 0)
  return {
    id, studentId, studentName, rollNo, className, term, subjects,
    total, maxTotal,
    percentage: maxTotal ? Math.round((total / maxTotal) * 1000) / 10 : 0,
    status, enteredBy,
    publishedAt: status === "published" ? "2026-06-20T10:00:00+05:30" : undefined,
  }
}

const VIII_A_SUBJECTS = (m: number[]): SubjectMark[] => {
  const defs = [
    ["English", 80], ["Mathematics", 80], ["Science", 80],
    ["Social Studies", 80], ["Hindi", 80], ["Computer Science", 50],
  ] as const
  return defs.map(([subject, max], i) => ({
    subject,
    maxMarks: max,
    marks: m[i],
    grade: gradeForPercentage((m[i] / max) * 100),
  }))
}

export const MOCK_REPORT_CARDS: ReportCard[] = [
  card("rc-1", "s1",  "Rohit Das",    12, "VIII-A", "Term 1", "published", "Priya Sharma", VIII_A_SUBJECTS([68, 74, 70, 62, 55, 44])),
  card("rc-2", "s2",  "Priti Kalita",  7, "VIII-A", "Term 1", "published", "Priya Sharma", VIII_A_SUBJECTS([72, 78, 75, 70, 66, 47])),
  card("rc-3", "s12", "Ankita Sarma",  2, "VIII-A", "Term 1", "draft",     "Priya Sharma", VIII_A_SUBJECTS([78, 80, 76, 74, 70, 49])),
]

export const MOCK_REPORT_CARD_ASSIGNMENTS: ReportCardAssignment[] = [
  {
    id: "rca-1",
    userId: "t1",
    userName: "Priya Sharma",
    role: "teacher",
    className: "VIII-A",
    term: "Term 1",
    assignedBy: "Arnab Paul",
    assignedAt: "2026-06-10T09:00:00+05:30",
  },
]
