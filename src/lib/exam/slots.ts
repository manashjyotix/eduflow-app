/**
 * slots.ts  (Feature: exam-routine-builder)
 *
 * Pure, side-effect-free logic for the buildable Exam_Slots of the three-axis
 * routine grid. A slot lives at one `(classId, date, sessionId)` coordinate and
 * holds at most one subject, an optional room, and a distinct list of
 * invigilator (teacher) ids.
 *
 * Every function here is immutable: it takes the current slot array (plus
 * inputs) and returns either a new slot array or a typed {@link OpResult}. No
 * React, no I/O, fully deterministic — this is the property-test surface.
 *
 * Key invariants:
 *   - A slot is uniquely identified by `(classId, date, sessionId)`; {@link slotKey}
 *     produces the canonical string key (R4.2).
 *   - `setSubject` replaces, never appends, so a slot holds at most one subject (R4.4).
 *   - `invigilatorIds` holds distinct teacher ids (R4.6, R7.8).
 *   - Every placement path validates class-linking and leaves both source and
 *     target slots unchanged on rejection (R2.2, R7.3).
 *
 * _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_
 */

import type { CatalogSubject, ExamSlot } from "@/data/mock-exams"
import type { OpResult } from "@/lib/exam/types"
import { isSubjectLinkedToClass } from "@/lib/exam/subject-catalog"

/** A grid coordinate identifying a single slot. */
export interface SlotCoord {
  classId: string
  date: string
  sessionId: string
}

/**
 * Canonical three-axis slot key — uniquely (and injectively) identifies a slot
 * by its `(classId, date, sessionId)` coordinate (R4.2).
 */
export function slotKey(c: SlotCoord): string {
  return `${c.classId}__${c.date}__${c.sessionId}`
}

/** Find the slot at a coordinate, or `undefined` when none exists. */
export function slotAt(slots: ExamSlot[], c: SlotCoord): ExamSlot | undefined {
  return slots.find(
    s => s.classId === c.classId && s.date === c.date && s.sessionId === c.sessionId,
  )
}

/** Stable, deterministic id for a freshly created slot, derived from its coord. */
function makeSlotId(c: SlotCoord): string {
  return `es-${slotKey(c)}`
}

/** True iff a slot holds no subject, no room, and no invigilators. */
function isEmptySlot(slot: ExamSlot): boolean {
  return !slot.subject && !slot.room && slot.invigilatorIds.length === 0
}

/** Build a fresh, empty slot at a coordinate. */
function emptySlotAt(c: SlotCoord): ExamSlot {
  return {
    id: makeSlotId(c),
    classId: c.classId,
    date: c.date,
    sessionId: c.sessionId,
    invigilatorIds: [],
  }
}

/**
 * True when `subject` is already scheduled for `classId` in any slot other
 * than the one at `excludeCoord`. Used to enforce the one-subject-per-class
 * rule across the whole routine.
 */
export function isSubjectAlreadyScheduled(
  slots: ExamSlot[],
  subject: string,
  classId: string,
  excludeCoord?: SlotCoord,
): boolean {
  const excludeKey = excludeCoord ? slotKey(excludeCoord) : null
  return slots.some(
    s =>
      s.classId === classId &&
      s.subject?.toLowerCase() === subject.toLowerCase() &&
      slotKey(s) !== excludeKey,
  )
}

/**
 * Assign a subject to the slot at `c`, creating the slot if it does not yet
 * exist. The placement is rejected with `invalid-subject-for-class` (leaving
 * every slot unchanged) when the slot's class is not linked to the subject
 * (R2.2), or with `subject-already-scheduled` when the same subject is already
 * placed in another slot for the same class — each subject may appear at most
 * once per class across the entire routine. On success the subject replaces any
 * existing subject so the slot holds exactly one subject (R4.4); the room and
 * invigilators are retained, and no other slot is touched (R4.3).
 *
 * _Requirements: 4.3, 4.4, 2.2_
 */
export function setSubject(
  slots: ExamSlot[],
  c: SlotCoord,
  subject: string,
  catalog: CatalogSubject[],
): OpResult<ExamSlot[]> {
  if (!isSubjectLinkedToClass(catalog, subject, c.classId)) {
    return {
      ok: false,
      error: "invalid-subject-for-class",
      message: `"${subject}" is not a valid subject for class ${c.classId}.`,
    }
  }

  // Allow replacing the subject already on this exact slot (same coord).
  if (isSubjectAlreadyScheduled(slots, subject, c.classId, c)) {
    return {
      ok: false,
      error: "subject-already-scheduled",
      message: `"${subject}" is already scheduled for ${c.classId} in another slot.`,
    }
  }

  const existing = slotAt(slots, c)
  if (existing) {
    return {
      ok: true,
      value: slots.map(s => (s === existing ? { ...s, subject } : s)),
    }
  }
  return { ok: true, value: [...slots, { ...emptySlotAt(c), subject }] }
}

/**
 * Clear the slot at `c`, removing its subject, room, and all invigilators while
 * leaving every other slot unchanged (R4.7). Clearing a slot that does not
 * exist, or that already holds nothing, leaves all slots unchanged (R4.8).
 *
 * _Requirements: 4.7, 4.8_
 */
export function clearSlot(slots: ExamSlot[], c: SlotCoord): ExamSlot[] {
  const existing = slotAt(slots, c)
  if (!existing || isEmptySlot(existing)) return slots
  return slots.map(s =>
    s === existing
      ? { id: s.id, classId: s.classId, date: s.date, sessionId: s.sessionId, invigilatorIds: [] }
      : s,
  )
}

/**
 * Add a teacher as an invigilator to the slot at `c`, creating no double-entry.
 * Rejected with `no-subject-scheduled` when the slot does not exist or holds no
 * subject (R7.7), and with `already-assigned` when the teacher is already listed
 * (R4.6, R7.8); both rejections leave the slot unchanged. On success the teacher
 * is associated only with the target slot (R4.5, R7.6).
 *
 * Note: a slot must hold a subject before an invigilator can be added, so a
 * non-existent slot (which has no subject) is rejected rather than created.
 *
 * _Requirements: 4.5, 4.6, 7.6, 7.7, 7.8_
 */
export function addInvigilatorToSlot(
  slots: ExamSlot[],
  c: SlotCoord,
  teacherId: string,
): OpResult<ExamSlot[]> {
  const existing = slotAt(slots, c)
  if (!existing || !existing.subject) {
    return {
      ok: false,
      error: "no-subject-scheduled",
      message: "Cannot assign an invigilator to a slot with no subject scheduled.",
    }
  }
  if (existing.invigilatorIds.includes(teacherId)) {
    return {
      ok: false,
      error: "already-assigned",
      message: "That teacher is already assigned to this slot.",
    }
  }
  return {
    ok: true,
    value: slots.map(s =>
      s === existing ? { ...s, invigilatorIds: [...s.invigilatorIds, teacherId] } : s,
    ),
  }
}

/**
 * Set (or clear, when `room` is empty/undefined) the room on the slot at `c`,
 * creating the slot if it does not yet exist. Leaves every other slot unchanged.
 */
export function setRoom(slots: ExamSlot[], c: SlotCoord, room: string | undefined): ExamSlot[] {
  const value = room && room.length > 0 ? room : undefined
  const existing = slotAt(slots, c)
  if (existing) {
    return slots.map(s => (s === existing ? { ...s, room: value } : s))
  }
  return [...slots, { ...emptySlotAt(c), room: value }]
}

/**
 * Move a scheduled subject from `from` to `to`.
 *
 * - When the target is empty, the subject and its room are placed on the target
 *   and cleared from the source — provided the target's class is linked to the
 *   subject (R7.2).
 * - When the target already holds a subject, the two subjects and rooms are
 *   swapped — provided each class is linked to the subject it receives (R7.4).
 *
 * Any class-linking failure rejects the move with `invalid-subject-for-class`
 * and leaves both the source and target slots unchanged (R7.3). Source
 * invigilators stay with the source slot; target invigilators stay with the
 * target slot (only subjects and rooms move).
 *
 * _Requirements: 7.2, 7.3, 7.4_
 */
export function moveSubject(
  slots: ExamSlot[],
  from: SlotCoord,
  to: SlotCoord,
  catalog: CatalogSubject[],
): OpResult<ExamSlot[]> {
  const source = slotAt(slots, from)

  // Nothing to move from an empty / non-existent source.
  if (!source || !source.subject) return { ok: true, value: slots }

  // Moving onto the same coordinate is a no-op.
  if (slotKey(from) === slotKey(to)) return { ok: true, value: slots }

  const sourceSubject = source.subject
  const sourceRoom = source.room
  const target = slotAt(slots, to)

  if (!target || !target.subject) {
    // Place onto an empty target: target's class must be linked to the subject.
    if (!isSubjectLinkedToClass(catalog, sourceSubject, to.classId)) {
      return {
        ok: false,
        error: "invalid-subject-for-class",
        message: `"${sourceSubject}" is not a valid subject for class ${to.classId}.`,
      }
    }
    // The source slot is excluded from the duplicate check so the move itself
    // doesn't collide with the slot we're moving away from.
    if (isSubjectAlreadyScheduled(slots, sourceSubject, to.classId, from)) {
      return {
        ok: false,
        error: "subject-already-scheduled",
        message: `"${sourceSubject}" is already scheduled for ${to.classId} in another slot.`,
      }
    }

    const clearedSource = { ...source, subject: undefined, room: undefined }
    if (target) {
      return {
        ok: true,
        value: slots.map(s =>
          s === source ? clearedSource : s === target ? { ...target, subject: sourceSubject, room: sourceRoom } : s,
        ),
      }
    }
    return {
      ok: true,
      value: [
        ...slots.map(s => (s === source ? clearedSource : s)),
        { ...emptySlotAt(to), subject: sourceSubject, room: sourceRoom },
      ],
    }
  }

  // Swap with an occupied target: each class must be linked to the subject it
  // will receive.
  const targetSubject = target.subject
  const targetRoom = target.room
  const targetGetsSourceSubject = isSubjectLinkedToClass(catalog, sourceSubject, to.classId)
  const sourceGetsTargetSubject = isSubjectLinkedToClass(catalog, targetSubject, from.classId)
  if (!targetGetsSourceSubject || !sourceGetsTargetSubject) {
    return {
      ok: false,
      error: "invalid-subject-for-class",
      message: "Cannot swap subjects: one or both classes are not linked to the exchanged subject.",
    }
  }

  return {
    ok: true,
    value: slots.map(s =>
      s === source
        ? { ...source, subject: targetSubject, room: targetRoom }
        : s === target
          ? { ...target, subject: sourceSubject, room: sourceRoom }
          : s,
    ),
  }
}

/**
 * Move an invigilator duty from `from` to `to`. Rejected with
 * `no-subject-scheduled` when the target holds no subject, and with
 * `already-assigned` when the target already lists the teacher (R7.5); both
 * leave the source and target unchanged. On success the teacher is removed from
 * the source and added to the target. Conflict re-evaluation is the caller's
 * responsibility (the conflict set is derived from the resulting slots).
 *
 * _Requirements: 7.5_
 */
export function moveInvigilator(
  slots: ExamSlot[],
  from: SlotCoord,
  to: SlotCoord,
  teacherId: string,
): OpResult<ExamSlot[]> {
  const target = slotAt(slots, to)
  if (!target || !target.subject) {
    return {
      ok: false,
      error: "no-subject-scheduled",
      message: "Cannot assign an invigilator to a slot with no subject scheduled.",
    }
  }
  if (target.invigilatorIds.includes(teacherId)) {
    return {
      ok: false,
      error: "already-assigned",
      message: "That teacher is already assigned to the target slot.",
    }
  }

  const source = slotAt(slots, from)
  return {
    ok: true,
    value: slots.map(s => {
      if (s === source) {
        return { ...s, invigilatorIds: s.invigilatorIds.filter(id => id !== teacherId) }
      }
      if (s === target) {
        return { ...s, invigilatorIds: [...s.invigilatorIds, teacherId] }
      }
      return s
    }),
  }
}
