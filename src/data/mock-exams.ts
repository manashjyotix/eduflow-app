/**
 * mock-exams.ts  (Feature F4 — Exam scheduler)
 *
 * Exam routine built by Admin / Management via drag-and-drop: rows = classes,
 * columns = exam days. Each cell is one exam slot (a subject + room +
 * invigilation duty). Invigilators are notified either on campus check-in or a
 * configurable lead time before the exam starts (default 15 min).
 *
 * Import from here — never redeclare inline.
 */

export interface ExamSlot {
  id: string
  classId: string          // "VIII-A"
  date: string             // ISO yyyy-mm-dd (column)
  startTime: string        // "09:30"
  subject: string
  room?: string
  invigilatorIds: string[] // Teacher ids
}

export interface ExamSettings {
  /** Notify invigilators this many minutes before the exam starts. */
  notifyLeadMinutes: number
  /** Also (or instead) notify when the teacher checks in on campus. */
  notifyOnCampusEntry: boolean
}

export const DEFAULT_EXAM_SETTINGS: ExamSettings = {
  notifyLeadMinutes: 15,
  notifyOnCampusEntry: true,
}

/** Grid axes (demo). Admin can extend these in production. */
export const EXAM_CLASSES = ["VIII-A", "IX-A", "X-A"]
export const EXAM_DAYS = ["2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17"]
export const EXAM_SUBJECTS = [
  "English", "Mathematics", "Science", "Social Studies",
  "Hindi", "Sanskrit", "Computer Science",
]

export function examCellKey(classId: string, date: string): string {
  return `${classId}__${date}`
}

export const MOCK_EXAM_SLOTS: ExamSlot[] = [
  { id: "es-1", classId: "VIII-A", date: "2026-07-14", startTime: "09:30", subject: "English",     room: "Room 201", invigilatorIds: ["t1"] },
  { id: "es-2", classId: "VIII-A", date: "2026-07-15", startTime: "09:30", subject: "Mathematics", room: "Room 201", invigilatorIds: ["t4"] },
  { id: "es-3", classId: "IX-A",   date: "2026-07-14", startTime: "09:30", subject: "Science",     room: "Room 203", invigilatorIds: [] },
]
