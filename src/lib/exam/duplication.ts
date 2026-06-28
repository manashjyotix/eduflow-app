/**
 * duplication.ts  (Feature: exam-routine-builder)
 *
 * Pure, side-effect-free logic for the Duplication_Service: copying one source
 * Class's routine onto one or more target Classes.
 *
 * For each source Exam_Slot, the service copies the slot's subject, room, date,
 * and session to the corresponding `(date, session)` position of every target
 * class (R8.1). Invigilators are never carried over — every target slot is
 * created with an empty invigilator list (R8.3). When a copied subject is not
 * linked to the target class, the subject is omitted from that target slot (the
 * position is still created) and counted/flagged in the report (R8.2). The
 * source class is excluded from the target set (R8.5), an empty effective
 * target set aborts the operation (R8.6), and the whole copy is computed into a
 * fresh slot array that is only returned on full success, giving all-or-nothing
 * semantics (R8.7).
 *
 * Every function here is immutable and deterministic — no React, no I/O. This
 * is the property-test surface.
 *
 * _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
 */

import type { CatalogSubject, ExamSlot } from "@/data/mock-exams"
import type { OpResult } from "@/lib/exam/types"
import { slotKey, type SlotCoord } from "@/lib/exam/slots"
import { isSubjectLinkedToClass } from "@/lib/exam/subject-catalog"

/** Upper bound on the number of target classes a single duplication may target (R8.1). */
export const MAX_DUPLICATION_TARGETS = 50

/** Summary of a completed duplication (R8.4). */
export interface DuplicationReport {
  /** Target Exam_Slots created at a position that did not previously exist. */
  created: number
  /** Pre-existing target Exam_Slots that were replaced. */
  overwritten: number
  /** Subjects dropped because the target class is not linked to them. */
  omitted: number
  /** Names of the omitted subjects (one entry per omission, in copy order). */
  omittedSubjects: string[]
}

/**
 * Duplicate the `sourceClassId` routine onto each class in `targetClassIds`.
 *
 * The effective target set is `targetClassIds` de-duplicated with the source
 * class removed (R8.5). The operation aborts — leaving every slot unchanged —
 * when that set is empty (R8.6, `empty-target-set`) or larger than
 * {@link MAX_DUPLICATION_TARGETS} (R8.1, `duplication-failed`).
 *
 * On success it returns a brand-new slot array (the original is never mutated,
 * R8.7) plus a {@link DuplicationReport}.
 *
 * _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7_
 */
export function duplicateRoutine(
  slots: ExamSlot[],
  sourceClassId: string,
  targetClassIds: string[],
  catalog: CatalogSubject[],
): OpResult<{ slots: ExamSlot[]; report: DuplicationReport }> {
  // Effective target set: de-duplicate and exclude the source class (R8.5).
  const seen = new Set<string>()
  const targets: string[] = []
  for (const id of targetClassIds) {
    if (id === sourceClassId || seen.has(id)) continue
    seen.add(id)
    targets.push(id)
  }

  // Abort on an empty target set (R8.6).
  if (targets.length === 0) {
    return {
      ok: false,
      error: "empty-target-set",
      message: "Select at least one target class (other than the source) to duplicate to.",
    }
  }

  // Enforce the 1..50 upper bound (R8.1).
  if (targets.length > MAX_DUPLICATION_TARGETS) {
    return {
      ok: false,
      error: "duplication-failed",
      message: `Cannot duplicate to more than ${MAX_DUPLICATION_TARGETS} target classes at once.`,
    }
  }

  // Source slots, in their existing order, give the positions to copy.
  const sourceSlots = slots.filter(s => s.classId === sourceClassId)

  // Work on a fresh array so the input is never mutated (all-or-nothing, R8.7).
  const next = slots.map(s => ({ ...s, invigilatorIds: [...s.invigilatorIds] }))
  const indexByKey = new Map<string, number>()
  next.forEach((s, i) => indexByKey.set(slotKey(s), i))

  let created = 0
  let overwritten = 0
  let omitted = 0
  const omittedSubjects: string[] = []

  for (const targetId of targets) {
    for (const src of sourceSlots) {
      const coord: SlotCoord = { classId: targetId, date: src.date, sessionId: src.sessionId }
      const key = slotKey(coord)

      // Omit a subject the target class is not linked to (R8.2); the position
      // is still created, just without the subject.
      let subject = src.subject
      if (subject && !isSubjectLinkedToClass(catalog, subject, targetId)) {
        omitted++
        omittedSubjects.push(subject)
        subject = undefined
      }

      const existingIndex = indexByKey.get(key)
      const copied: ExamSlot = {
        id: existingIndex === undefined ? `es-${key}` : next[existingIndex].id,
        classId: targetId,
        date: src.date,
        sessionId: src.sessionId,
        subject,
        room: src.room,
        invigilatorIds: [], // never carry invigilators over (R8.3)
      }

      if (existingIndex === undefined) {
        indexByKey.set(key, next.length)
        next.push(copied)
        created++
      } else {
        next[existingIndex] = copied
        overwritten++
      }
    }
  }

  return {
    ok: true,
    value: {
      slots: next,
      report: { created, overwritten, omitted, omittedSubjects },
    },
  }
}
