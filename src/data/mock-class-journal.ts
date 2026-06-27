/**
 * mock-class-journal.ts  (Feature F2 — Class Journal)
 *
 * A class journal entry is written by the teacher who actually taught a slot
 * and is attached to the class+section+period taught — including classes a
 * teacher covered as a PROXY. The teacher's "today's classes" are therefore
 * derived from their regular weekly timetable PLUS any proxy duties.
 *
 * Import from here — never redeclare inline.
 */

import { MOCK_PROXIES } from "./proxy-assignments"

export interface ClassJournalEntry {
  id: string
  date: string          // ISO yyyy-mm-dd
  className: string     // e.g. "VIII-A"
  period: string        // "P1"–"P7"
  subject: string
  teacherId: string
  teacherName: string
  isProxy: boolean
  proxyForTeacher?: string
  topic: string
  homework?: string
  notes?: string
  status: "pending" | "completed"
  completedAt?: string
}

/** One slot a teacher is responsible for on a given day. */
export interface TeachingSlot {
  period: string
  className: string
  subject: string
  isProxy: boolean
  proxyForTeacher?: string
}

/** Stable key for one journal slot. */
export function journalKey(date: string, className: string, period: string): string {
  return `${date}__${className}__${period}`
}

/**
 * Regular weekly timetable per teacher (demo subset). In production this comes
 * from the Admin timetable builder; here it is mocked so the teacher journal
 * has real "regular" classes alongside derived proxy duties.
 */
const REGULAR_TIMETABLE: Record<string, { period: string; className: string; subject: string }[]> = {
  t1: [
    { period: "P2", className: "IX-A",   subject: "Mathematics" },
    { period: "P4", className: "VIII-A", subject: "Science" },
    { period: "P5", className: "VIII-A", subject: "Mathematics" },
  ],
  t2: [
    { period: "P1", className: "VIII-A", subject: "English" },
    { period: "P3", className: "IX-A",   subject: "Social Studies" },
  ],
}

/**
 * All teaching slots a teacher must journal for today: their regular timetable
 * plus accepted/assigned proxy duties. Sorted by period.
 */
export function getTeachingSlotsForTeacher(teacherId: string): TeachingSlot[] {
  const regular: TeachingSlot[] = (REGULAR_TIMETABLE[teacherId] ?? []).map(r => ({
    ...r,
    isProxy: false,
  }))
  const proxy: TeachingSlot[] = MOCK_PROXIES
    .filter(p => p.proxyTeacherId === teacherId && (p.status === "accepted" || p.status === "assigned"))
    .map(p => ({
      period: p.periodId,
      className: p.class,
      subject: p.subject,
      isProxy: true,
      proxyForTeacher: p.absentTeacherName,
    }))
  return [...regular, ...proxy].sort((a, b) => a.period.localeCompare(b.period))
}

/** Seed: today's (demo) slots plus a history of past journals for the filter/search view. */
export const MOCK_CLASS_JOURNAL: ClassJournalEntry[] = [
  // ── Today (2026-06-25) ──
  {
    id: "cj-1",
    date: "2026-06-25",
    className: "IX-A",
    period: "P2",
    subject: "Mathematics",
    teacherId: "t1",
    teacherName: "Priya Sharma",
    isProxy: false,
    topic: "Quadratic equations — solving by factorisation.",
    homework: "Exercise 4.2, Q1–8",
    status: "completed",
    completedAt: "2026-06-25T10:55:00+05:30",
  },

  // ── 2026-06-24 ──
  {
    id: "cj-2",
    date: "2026-06-24",
    className: "IX-A",
    period: "P2",
    subject: "Mathematics",
    teacherId: "t1",
    teacherName: "Priya Sharma",
    isProxy: false,
    topic: "Introduction to quadratic equations — standard form & roots.",
    homework: "Read section 4.1; attempt examples 1–3",
    notes: "Class was attentive; revise factorisation basics next time.",
    status: "completed",
    completedAt: "2026-06-24T10:50:00+05:30",
  },
  {
    id: "cj-3",
    date: "2026-06-24",
    className: "VIII-A",
    period: "P4",
    subject: "Science",
    teacherId: "t1",
    teacherName: "Priya Sharma",
    isProxy: false,
    topic: "Force and pressure — types of forces with examples.",
    homework: "Diagram of contact vs non-contact forces",
    status: "completed",
    completedAt: "2026-06-24T12:05:00+05:30",
  },
  {
    id: "cj-4",
    date: "2026-06-24",
    className: "VIII-A",
    period: "P5",
    subject: "Mathematics",
    teacherId: "t1",
    teacherName: "Priya Sharma",
    isProxy: false,
    topic: "Rational numbers — properties of addition.",
    homework: "Exercise 1.1, Q1–6",
    status: "completed",
    completedAt: "2026-06-24T13:10:00+05:30",
  },

  // ── 2026-06-23 ──
  {
    id: "cj-5",
    date: "2026-06-23",
    className: "IX-A",
    period: "P2",
    subject: "Mathematics",
    teacherId: "t1",
    teacherName: "Priya Sharma",
    isProxy: false,
    topic: "Polynomials — degree and types revision.",
    homework: "Worksheet 3 (all questions)",
    status: "completed",
    completedAt: "2026-06-23T10:52:00+05:30",
  },
  {
    id: "cj-6",
    date: "2026-06-23",
    className: "X-B",
    period: "P3",
    subject: "Mathematics",
    teacherId: "t1",
    teacherName: "Priya Sharma",
    isProxy: true,
    proxyForTeacher: "Rajesh Kalita",
    topic: "Trigonometric ratios — covered as proxy.",
    homework: "Exercise 8.1, Q1–5",
    notes: "Proxy class — informed regular teacher of progress.",
    status: "completed",
    completedAt: "2026-06-23T11:30:00+05:30",
  },

  // ── 2026-06-20 ──
  {
    id: "cj-7",
    date: "2026-06-20",
    className: "VIII-A",
    period: "P5",
    subject: "Mathematics",
    teacherId: "t1",
    teacherName: "Priya Sharma",
    isProxy: false,
    topic: "Integers — multiplication and division rules.",
    homework: "Exercise 1.3, Q1–10",
    status: "completed",
    completedAt: "2026-06-20T13:08:00+05:30",
  },
  {
    id: "cj-8",
    date: "2026-06-20",
    className: "IX-A",
    period: "P2",
    subject: "Mathematics",
    teacherId: "t1",
    teacherName: "Priya Sharma",
    isProxy: false,
    topic: "Coordinate geometry — plotting points on the Cartesian plane.",
    status: "completed",
    completedAt: "2026-06-20T10:48:00+05:30",
  },
]
