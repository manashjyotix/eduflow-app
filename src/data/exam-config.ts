/**
 * exam-config.ts
 *
 * School-level exam configuration — this is the data an Admin sets up when
 * configuring the school:
 *   1. How many exams the school conducts in the year.
 *   2. For each exam: its name, type (unit test / half-yearly / annual / test /
 *      mock test), and whether it is a Board or School exam.
 *   3. Per-subject max marks + obtained marks for the child.
 *   4. Optional schedule (date + day) which the Admin may choose to display.
 *
 * The parent Report Card page renders one tab per configured exam, plus a
 * consolidated "Overall" tab.
 *
 * In production this comes from the school's exam settings + the student's
 * marks ledger. Here it is mock data for Rohit Das · Class VIII-A.
 */

export type ExamType =
  | "unit-test"
  | "half-yearly"
  | "annual"
  | "test"
  | "mock-test"

export type ExamOrigin = "board" | "school"

export interface ExamSubjectResult {
  subject: string
  marks: number
  maxMarks: number
  remarks: string
}

export interface SchoolExam {
  id: string
  /** Display name, e.g. "1st Unit Test". */
  name: string
  /** Short tab label, e.g. "Unit Test 1". */
  shortLabel: string
  type: ExamType
  origin: ExamOrigin
  /** Sequence order in the academic year. */
  order: number
  /** ISO date the exam window starts (optional — Admin may leave blank). */
  date?: string
  /** Day of week for the start date. */
  day?: string
  /** Class rank for this exam. */
  rank: number
  totalStudents: number
  results: ExamSubjectResult[]
}

export const EXAM_TYPE_LABEL: Record<ExamType, string> = {
  "unit-test": "Unit Test",
  "half-yearly": "Half Yearly",
  annual: "Annual",
  test: "Test",
  "mock-test": "Mock Test",
}

/**
 * Mock school setup: 2 Unit Tests, 1 Half Yearly, 1 Annual.
 * Order: 1st Unit Test → Half Yearly → 2nd Unit Test → Annual.
 */
export const SCHOOL_EXAMS: SchoolExam[] = [
  {
    id: "ut1",
    name: "1st Unit Test",
    shortLabel: "Unit Test 1",
    type: "unit-test",
    origin: "school",
    order: 1,
    date: "2026-05-12",
    day: "Tuesday",
    rank: 6,
    totalStudents: 38,
    results: [
      { subject: "English",          marks: 20, maxMarks: 25, remarks: "Good performance" },
      { subject: "Mathematics",      marks: 22, maxMarks: 25, remarks: "Excellent" },
      { subject: "Science",          marks: 19, maxMarks: 25, remarks: "Very good" },
      { subject: "Social Studies",   marks: 16, maxMarks: 25, remarks: "Satisfactory" },
      { subject: "Hindi",            marks: 15, maxMarks: 25, remarks: "Needs improvement" },
      { subject: "Sanskrit",         marks: 18, maxMarks: 25, remarks: "Good" },
      { subject: "Computer Science", marks: 23, maxMarks: 25, remarks: "Outstanding" },
    ],
  },
  {
    id: "hy",
    name: "Half Yearly",
    shortLabel: "Half Yearly",
    type: "half-yearly",
    origin: "school",
    order: 2,
    date: "2026-07-14",
    day: "Monday",
    rank: 5,
    totalStudents: 38,
    results: [
      { subject: "English",          marks: 68, maxMarks: 80, remarks: "Good performance" },
      { subject: "Mathematics",      marks: 74, maxMarks: 80, remarks: "Excellent" },
      { subject: "Science",          marks: 70, maxMarks: 80, remarks: "Very good" },
      { subject: "Social Studies",   marks: 62, maxMarks: 80, remarks: "Satisfactory" },
      { subject: "Hindi",            marks: 55, maxMarks: 80, remarks: "Needs improvement" },
      { subject: "Sanskrit",         marks: 38, maxMarks: 50, remarks: "Good" },
      { subject: "Computer Science", marks: 44, maxMarks: 50, remarks: "Excellent" },
    ],
  },
  {
    id: "ut2",
    name: "2nd Unit Test",
    shortLabel: "Unit Test 2",
    type: "unit-test",
    origin: "school",
    order: 3,
    date: "2026-09-08",
    day: "Tuesday",
    rank: 4,
    totalStudents: 38,
    results: [
      { subject: "English",          marks: 21, maxMarks: 25, remarks: "Improved" },
      { subject: "Mathematics",      marks: 23, maxMarks: 25, remarks: "Excellent" },
      { subject: "Science",          marks: 20, maxMarks: 25, remarks: "Very good" },
      { subject: "Social Studies",   marks: 18, maxMarks: 25, remarks: "Good" },
      { subject: "Hindi",            marks: 17, maxMarks: 25, remarks: "Improving" },
      { subject: "Sanskrit",         marks: 19, maxMarks: 25, remarks: "Good" },
      { subject: "Computer Science", marks: 24, maxMarks: 25, remarks: "Outstanding" },
    ],
  },
  {
    id: "annual",
    name: "Annual Examination",
    shortLabel: "Annual",
    type: "annual",
    origin: "board",
    order: 4,
    date: "2027-03-02",
    day: "Tuesday",
    rank: 5,
    totalStudents: 38,
    results: [
      { subject: "English",          marks: 71, maxMarks: 80, remarks: "Good performance" },
      { subject: "Mathematics",      marks: 76, maxMarks: 80, remarks: "Excellent" },
      { subject: "Science",          marks: 72, maxMarks: 80, remarks: "Very good" },
      { subject: "Social Studies",   marks: 64, maxMarks: 80, remarks: "Satisfactory" },
      { subject: "Hindi",            marks: 58, maxMarks: 80, remarks: "Improved" },
      { subject: "Sanskrit",         marks: 41, maxMarks: 50, remarks: "Good" },
      { subject: "Computer Science", marks: 46, maxMarks: 50, remarks: "Excellent" },
    ],
  },
]

/** Letter grade from a percentage, matching the Report Card grade legend. */
export function computeGrade(percentage: number): string {
  if (percentage >= 95) return "A+"
  if (percentage >= 80) return "A"
  if (percentage >= 70) return "B+"
  if (percentage >= 60) return "B"
  if (percentage >= 40) return "C"
  return "F"
}

/** Totals (obtained, max, percentage) for an exam's subject results. */
export function examTotals(exam: SchoolExam) {
  const marks = exam.results.reduce((sum, r) => sum + r.marks, 0)
  const maxMarks = exam.results.reduce((sum, r) => sum + r.maxMarks, 0)
  const percentage = maxMarks > 0 ? Math.round((marks / maxMarks) * 1000) / 10 : 0
  return { marks, maxMarks, percentage }
}
