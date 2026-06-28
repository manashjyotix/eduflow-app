/**
 * availability.ts  (Feature: exam-routine-builder)
 *
 * Pure-logic layer that maps a teacher's invigilation state — and a slot's
 * subject-linking state — onto the proxy-board Availability_Color_Language.
 *
 * The color vocabulary is reused verbatim from the proxy board's `DotStatus`
 * (`src/lib/proxy-algorithm.ts`) so conflicts, validation flags, and the
 * invigilator palette all speak the same language:
 *
 *   - "available-same" (green)  — available, teaches the slot's subject
 *   - "available-diff" (amber)  — available, different subject (alt invigilator)
 *   - "capped"         (gray)   — at duty cap
 *   - "unavailable"    (red)    — double-booked / not assignable
 *
 * Per the design rule, a color is **always paired with a human text label** —
 * never color alone (accessibility).
 *
 * Every function here is pure and side-effect-free — this is a property-test
 * surface.
 *
 * _Requirements: 6.6, 2.4, 8.2_
 */

import type { CatalogSubject, ExamSlot } from "@/data/mock-exams"
import type { DotStatus } from "@/lib/proxy-algorithm"
import type { SlotCoord } from "@/lib/exam/slots"
import { isSubjectLinkedToClass } from "@/lib/exam/subject-catalog"

/**
 * Availability status for an invigilator/slot, reusing the proxy-board
 * `DotStatus` color vocabulary so the two surfaces stay in lockstep.
 */
export type AvailabilityStatus = DotStatus

/** A status (color) always paired with a human-readable text label. */
export interface AvailabilityBadge {
  status: AvailabilityStatus
  label: string
}

/** Whether `slot` sits at the same coordinate as `c`. */
function sameSlot(slot: ExamSlot, c: SlotCoord): boolean {
  return slot.classId === c.classId && slot.date === c.date && slot.sessionId === c.sessionId
}

/**
 * Map a teacher's availability for invigilating the slot at coordinate `c` to
 * an {@link AvailabilityBadge}.
 *
 * - If the teacher is already an invigilator on **another** slot that shares the
 *   same Exam_Date and Session, assigning them here would double-book them, so
 *   they are flagged `unavailable` (red) with a label naming the clash.
 * - Otherwise the teacher is available: `available-same` (green) when they teach
 *   the slot's subject, `available-diff` (amber) when the subject differs.
 *
 * `slotSubject` is the subject currently held by the target slot (if any);
 * `absentTeacherSubjects` is the set of subjects the candidate teacher teaches.
 *
 * _Requirements: 6.6_
 */
export function invigilatorAvailability(
  teacherId: string,
  c: SlotCoord,
  slots: ExamSlot[],
  absentTeacherSubjects: string[],
  slotSubject?: string,
): AvailabilityBadge {
  // A conflicting assignment is the same teacher invigilating a *different*
  // slot that shares this slot's date + session.
  const conflicts = slots.some(
    s =>
      !sameSlot(s, c) &&
      s.date === c.date &&
      s.sessionId === c.sessionId &&
      s.invigilatorIds.includes(teacherId),
  )

  if (conflicts) {
    return {
      status: "unavailable",
      label: "Unavailable — already on duty this date and session",
    }
  }

  if (slotSubject && absentTeacherSubjects.includes(slotSubject)) {
    return {
      status: "available-same",
      label: `Available — teaches ${slotSubject}`,
    }
  }

  return {
    status: "available-diff",
    label: "Available — different subject",
  }
}

/**
 * Flag a slot whose subject is no longer linked to its class.
 *
 * When a class is unlinked from a subject while a slot for that class still
 * holds the subject, the slot becomes invalid and must be flagged with the red
 * status of the Availability_Color_Language paired with a label naming the
 * now-invalid subject. Returns `null` when the slot is empty or its subject is
 * still validly linked to the class.
 *
 * _Requirements: 2.4, 8.2_
 */
export function flagUnlinkedSubject(
  slot: ExamSlot,
  catalog: CatalogSubject[],
): AvailabilityBadge | null {
  if (!slot.subject) return null
  if (isSubjectLinkedToClass(catalog, slot.subject, slot.classId)) return null

  return {
    status: "unavailable",
    label: `"${slot.subject}" is no longer valid for ${slot.classId}`,
  }
}
