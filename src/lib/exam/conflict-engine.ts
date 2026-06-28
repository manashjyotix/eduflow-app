/**
 * conflict-engine.ts  (Feature F4 — Exam Routine Builder)
 *
 * Pure, side-effect-free logic for detecting invigilator double-bookings. A
 * conflict exists for a `(teacherId, date, sessionId)` triple when that teacher
 * appears in the invigilator list of two or more Exam_Slots sharing the same
 * Exam_Date and Session (R6.1, R6.2). The conflict set is recomputed from slot
 * state on every mutation, so a flag clears automatically once the
 * double-booking is resolved — no stateful bookkeeping is required (R6.7).
 *
 * `wouldDoubleBook` is the look-ahead used by the build flow to surface the
 * warn-and-override prompt before an assignment is finalized (R6.3): it reports
 * whether adding a teacher at a coordinate would place them in a second slot of
 * the same date+session.
 *
 * No React, no I/O — this is the property-test surface.
 *
 * _Requirements: 6.1, 6.2, 6.3, 6.7_
 */

import type { ExamSlot } from "@/data/mock-exams"
import { slotKey, type SlotCoord } from "@/lib/exam/slots"

/**
 * A detected double-booking: one teacher assigned to two or more Exam_Slots
 * that share the same Exam_Date and Session.
 */
export interface Conflict {
  teacherId: string
  date: string
  sessionId: string
  /** Canonical keys of the conflicting slots — always two or more. */
  slotKeys: string[]
}

/** The SlotCoord of a slot — its (classId, date, sessionId) coordinate. */
function coordOf(slot: ExamSlot): SlotCoord {
  return { classId: slot.classId, date: slot.date, sessionId: slot.sessionId }
}

/**
 * Recompute the full conflict set from slot state.
 *
 * Groups assignments by `(teacherId, date, sessionId)` and emits a `Conflict`
 * for every group that spans two or more distinct slots. The result is
 * deterministic: groups are ordered by date, then session, then teacher id, and
 * each group's `slotKeys` are sorted, so identical slot state always yields an
 * identical conflict list.
 *
 * Because this is derived purely from `slots`, resolving a double-booking
 * (removing or moving an invigilator) drops the corresponding group below the
 * two-slot threshold and the conflict disappears on the next recompute (R6.7).
 *
 * _Requirements: 6.1, 6.2, 6.7_
 */
export function detectConflicts(slots: ExamSlot[]): Conflict[] {
  // Map from "teacherId__date__sessionId" → the set of slot keys it appears in.
  const groups = new Map<string, { teacherId: string; date: string; sessionId: string; slotKeys: Set<string> }>()

  for (const slot of slots) {
    const key = slotKey(coordOf(slot))
    for (const teacherId of slot.invigilatorIds) {
      const groupKey = `${teacherId}__${slot.date}__${slot.sessionId}`
      let group = groups.get(groupKey)
      if (!group) {
        group = { teacherId, date: slot.date, sessionId: slot.sessionId, slotKeys: new Set() }
        groups.set(groupKey, group)
      }
      group.slotKeys.add(key)
    }
  }

  const conflicts: Conflict[] = []
  for (const group of groups.values()) {
    if (group.slotKeys.size >= 2) {
      conflicts.push({
        teacherId: group.teacherId,
        date: group.date,
        sessionId: group.sessionId,
        slotKeys: [...group.slotKeys].sort(),
      })
    }
  }

  conflicts.sort((a, b) =>
    a.date.localeCompare(b.date) ||
    a.sessionId.localeCompare(b.sessionId) ||
    a.teacherId.localeCompare(b.teacherId),
  )

  return conflicts
}

/**
 * Whether the slot at coordinate `c` participates in any detected conflict —
 * i.e. its canonical key appears in some `Conflict.slotKeys`. Used to render the
 * red conflict flag on affected cells (R6.2).
 */
export function slotIsConflicted(conflicts: Conflict[], c: SlotCoord): boolean {
  const key = slotKey(c)
  return conflicts.some(conflict => conflict.slotKeys.includes(key))
}

/**
 * Look-ahead for the warn-and-override flow: whether adding `teacherId` at
 * coordinate `c` would create a double-booking — that is, the teacher is already
 * an invigilator on a *different* slot sharing the same date and session (R6.3).
 *
 * Returns false when the teacher's only same-date+session assignment is the
 * target slot itself (re-adding to the same slot is not a double-booking).
 */
export function wouldDoubleBook(slots: ExamSlot[], c: SlotCoord, teacherId: string): boolean {
  const targetKey = slotKey(c)
  return slots.some(slot =>
    slot.date === c.date &&
    slot.sessionId === c.sessionId &&
    slotKey(coordOf(slot)) !== targetKey &&
    slot.invigilatorIds.includes(teacherId),
  )
}
