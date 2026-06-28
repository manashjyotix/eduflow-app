/**
 * duty-notifications.ts  (Feature: exam-routine-builder)
 *
 * Pure logic for building invigilation-duty notification messages from the
 * routine's slots. No React, no I/O, fully deterministic — the context
 * (task 12) dispatches the returned messages through `notification-context`.
 *
 * - `buildDutyMessages` emits exactly one message per Invigilator assignment
 *   whose Exam_Slot holds a subject, skipping (and counting) assignments whose
 *   slot has no subject (R11.1, R11.2). The room is included only when present
 *   (R11.1); the configured lead time (0..10080 minutes) is carried on each
 *   message so it can be embedded in the message text (R11.5).
 * - `buildCampusEntryDigest` returns one digest listing all of a teacher's
 *   duties for a given date ordered by Session start time, or `null` when the
 *   teacher has no duty that date (R11.3, R11.4).
 *
 * _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_
 */

import type {
  ExamSlot,
  ExamSession,
  ExamDutySettings,
} from "@/data/mock-exams"

/**
 * A single resolved invigilation-duty notification. One is produced per
 * (Exam_Slot, Invigilator) pairing whose slot holds a subject.
 */
export interface DutyMessage {
  teacherId: string
  classId: string
  subject: string
  date: string
  sessionId: string
  /** Resolved from the referenced ExamSession; "" when the session is unknown. */
  sessionStartTime: string
  /** Included only when the slot has a room assigned (R11.1). */
  room?: string
  /** Configured notification lead time, whole minutes 0..10080 (R11.5). */
  leadMinutes: number
}

/** Index sessions by id for O(1) start-time resolution. */
function sessionStartTimeById(sessions: ExamSession[]): Map<string, string> {
  const map = new Map<string, string>()
  for (const s of sessions) map.set(s.id, s.startTime)
  return map
}

/**
 * Build one duty message per Invigilator assignment whose slot holds a subject.
 * Assignments on subject-less slots are skipped and counted (R11.2).
 *
 * @returns the emitted messages plus the count of skipped (subject-less) assignments.
 */
export function buildDutyMessages(
  slots: ExamSlot[],
  sessions: ExamSession[],
  settings: ExamDutySettings,
): { messages: DutyMessage[]; skipped: number } {
  const startTimes = sessionStartTimeById(sessions)
  const leadMinutes = settings.notifyLeadMinutes
  const messages: DutyMessage[] = []
  let skipped = 0

  for (const slot of slots) {
    const subject = slot.subject?.trim()
    if (!subject) {
      // Slot has no subject — every invigilator assignment on it is skipped.
      skipped += slot.invigilatorIds.length
      continue
    }
    for (const teacherId of slot.invigilatorIds) {
      const message: DutyMessage = {
        teacherId,
        classId: slot.classId,
        subject,
        date: slot.date,
        sessionId: slot.sessionId,
        sessionStartTime: startTimes.get(slot.sessionId) ?? "",
        leadMinutes,
      }
      if (slot.room !== undefined && slot.room !== "") {
        message.room = slot.room
      }
      messages.push(message)
    }
  }

  return { messages, skipped }
}

/**
 * Build a campus-entry digest for one teacher on one date: all of that
 * teacher's subject-bearing duties for the date, ordered by Session start time,
 * or `null` when the teacher has no duty that date (R11.3, R11.4).
 */
export function buildCampusEntryDigest(
  teacherId: string,
  date: string,
  slots: ExamSlot[],
  sessions: ExamSession[],
  settings: ExamDutySettings,
): DutyMessage[] | null {
  const { messages } = buildDutyMessages(slots, sessions, settings)
  const duties = messages.filter(
    m => m.teacherId === teacherId && m.date === date,
  )
  if (duties.length === 0) return null

  // Order by Session start time ascending; unknown ("") sorts first, then by
  // sessionId as a stable tie-break for deterministic output.
  return duties.sort((a, b) => {
    if (a.sessionStartTime !== b.sessionStartTime) {
      return a.sessionStartTime < b.sessionStartTime ? -1 : 1
    }
    if (a.sessionId !== b.sessionId) {
      return a.sessionId < b.sessionId ? -1 : 1
    }
    return 0
  })
}
