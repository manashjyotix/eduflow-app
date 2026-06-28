/**
 * conflict-engine.test.ts — Property and example tests for the Conflict Engine.
 *
 * Feature: exam-routine-builder, Property 21: Conflict detection biconditional
 *
 * Tests:
 *   - Property 21: Conflict detection biconditional (R6.1, R6.2, R6.7)
 *   - Example test: double-booking surfaces warning + override control (R6.3–6.5)
 *
 * Validates: Requirements 6.1, 6.2, 6.7
 *
 * NOTE: We use fc.assert(fc.property(...)) with standard vitest `it()` rather
 * than `it.prop` from @fast-check/vitest because Vitest v3 serializes test
 * metadata (including arbitrary objects) across the worker→main IPC channel
 * using structuredClone, which cannot clone fast-check's internal function
 * closures. fc.assert runs the property check synchronously inside the test.
 */

import { describe, expect, it } from "vitest"
import * as fc from "fast-check"
import type { ExamSlot } from "@/data/mock-exams"
import {
  detectConflicts,
  slotIsConflicted,
  wouldDoubleBook,
} from "@/lib/exam/conflict-engine"
import { slotKey } from "@/lib/exam/slots"
import { arbSlots } from "./generators"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count how many slots share a given (date, sessionId) and include `teacherId`
 * in their invigilatorIds.  This mirrors the biconditional predicate.
 */
function doubleBookingCount(slots: ExamSlot[], teacherId: string, date: string, sessionId: string): number {
  return slots.filter(
    s => s.date === date && s.sessionId === sessionId && s.invigilatorIds.includes(teacherId),
  ).length
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 21: Conflict detection biconditional
//
// Feature: exam-routine-builder, Property 21: Conflict detection biconditional
// Validates: Requirements 6.1, 6.2, 6.7
//
// For ANY set of slots:
//   A conflict exists for (teacherId, date, sessionId) iff the teacher appears
//   in 2+ slots with that exact (date, sessionId) triple.
//
// This is truly biconditional — no false positives, no false negatives:
//   FORWARD:  double-booking exists  → conflict is detected
//   BACKWARD: conflict is detected   → double-booking exists
//
// R6.7 is covered by the "resolution clears the flag" sub-check.
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 21: Conflict detection biconditional", () => {

  it(
    "forward: every teacher/date/session triple with ≥2 slots produces a conflict (no false negatives)",
    () => {
      fc.assert(
        fc.property(arbSlots, slots => {
          const conflicts = detectConflicts(slots)

          // Collect all (teacher, date, session) triples that are double-booked
          // according to the raw data.
          const doubleBookedTriples = new Set<string>()
          for (const slot of slots) {
            for (const teacherId of slot.invigilatorIds) {
              const count = doubleBookingCount(slots, teacherId, slot.date, slot.sessionId)
              if (count >= 2) {
                doubleBookedTriples.add(`${teacherId}__${slot.date}__${slot.sessionId}`)
              }
            }
          }

          // Every double-booked triple must appear in the detected conflict list.
          for (const triple of doubleBookedTriples) {
            const [teacherId, date, sessionId] = triple.split("__")
            const found = conflicts.some(
              c => c.teacherId === teacherId && c.date === date && c.sessionId === sessionId,
            )
            if (!found) return false
          }
          return true
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "backward: every detected conflict corresponds to an actual double-booking (no false positives)",
    () => {
      fc.assert(
        fc.property(arbSlots, slots => {
          const conflicts = detectConflicts(slots)

          for (const conflict of conflicts) {
            const { teacherId, date, sessionId } = conflict
            const count = doubleBookingCount(slots, teacherId, date, sessionId)
            // A conflict must only be raised when there really are ≥2 slots.
            if (count < 2) return false
          }
          return true
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "each conflict's slotKeys contains ≥2 entries matching the teacher/date/session triple",
    () => {
      fc.assert(
        fc.property(arbSlots, slots => {
          const conflicts = detectConflicts(slots)

          for (const conflict of conflicts) {
            const { teacherId, date, sessionId, slotKeys } = conflict

            // Must have at least 2 slot keys.
            if (slotKeys.length < 2) return false

            // Every listed slot key must exist in the slot array and contain
            // the conflicting teacher in the matching date+session.
            for (const key of slotKeys) {
              const slot = slots.find(
                s =>
                  slotKey({ classId: s.classId, date: s.date, sessionId: s.sessionId }) === key,
              )
              if (!slot) return false
              if (slot.date !== date || slot.sessionId !== sessionId) return false
              if (!slot.invigilatorIds.includes(teacherId)) return false
            }
          }
          return true
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "R6.7: removing a teacher from one slot clears the conflict flag",
    () => {
      fc.assert(
        fc.property(arbSlots, slots => {
          const conflicts = detectConflicts(slots)

          // Pick the first conflict, if any; skip if the set is empty.
          if (conflicts.length === 0) return true

          const conflict = conflicts[0]
          const { teacherId, date, sessionId, slotKeys } = conflict

          // Remove the teacher from the first conflicting slot.
          const keyToFix = slotKeys[0]
          const resolvedSlots = slots.map(s => {
            const k = slotKey({ classId: s.classId, date: s.date, sessionId: s.sessionId })
            if (k !== keyToFix) return s
            return {
              ...s,
              invigilatorIds: s.invigilatorIds.filter(id => id !== teacherId),
            }
          })

          const resolvedConflicts = detectConflicts(resolvedSlots)

          // After removing from one slot the teacher is now in at most 1 slot
          // for this (date, session) → the conflict must be gone.
          const stillConflicted = resolvedConflicts.some(
            c => c.teacherId === teacherId && c.date === date && c.sessionId === sessionId,
          )
          return !stillConflicted
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "slotIsConflicted returns true iff the slot's key appears in any conflict",
    () => {
      fc.assert(
        fc.property(arbSlots, slots => {
          const conflicts = detectConflicts(slots)
          const conflictedKeys = new Set<string>(
            conflicts.flatMap(c => c.slotKeys),
          )

          for (const slot of slots) {
            const coord = { classId: slot.classId, date: slot.date, sessionId: slot.sessionId }
            const expected = conflictedKeys.has(slotKey(coord))
            const actual = slotIsConflicted(conflicts, coord)
            if (actual !== expected) return false
          }
          return true
        }),
        { numRuns: 100 },
      )
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Example test: double-booking surfaces warning + override control (R6.3–6.5)
//
// Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5, 6.7
//
// Scenario:
//   1. Two slots share the same date + sessionId; teacher "t1" is in both.
//   2. wouldDoubleBook → true  (warn-and-override prompt should be shown)
//   3. detectConflicts → conflict includes both slot keys (flag retained post-override)
//   4. After removing "t1" from one slot, detectConflicts → conflict is cleared (R6.7)
// ─────────────────────────────────────────────────────────────────────────────

describe("Example: double-booking warn/override flow (R6.3–6.5)", () => {

  const DATE = "2026-06-10"
  const SESSION = "ses-morning"
  const TEACHER = "t1"

  // Slot A: class VIII-A, same date+session, teacher t1 already assigned
  const slotA: ExamSlot = {
    id: "es-viiia",
    classId: "VIII-A",
    date: DATE,
    sessionId: SESSION,
    subject: "Mathematics",
    room: "Room 1",
    invigilatorIds: [TEACHER],
  }

  // Slot B: class IX-A, same date+session, teacher t1 assigned (the double-booking)
  const slotB: ExamSlot = {
    id: "es-ixb",
    classId: "IX-A",
    date: DATE,
    sessionId: SESSION,
    subject: "English",
    room: "Room 2",
    invigilatorIds: [TEACHER],
  }

  const slots: ExamSlot[] = [slotA, slotB]

  it("wouldDoubleBook returns true when teacher is already in another slot of the same date+session (R6.3)", () => {
    // From the perspective of slotB: would adding t1 to slotA create a double-booking?
    const coordA = { classId: slotA.classId, date: slotA.date, sessionId: slotA.sessionId }
    expect(wouldDoubleBook(slots, coordA, TEACHER)).toBe(true)
  })

  it("wouldDoubleBook returns false for a teacher not yet assigned in the date+session", () => {
    const coordA = { classId: slotA.classId, date: slotA.date, sessionId: slotA.sessionId }
    expect(wouldDoubleBook(slots, coordA, "t99")).toBe(false)
  })

  it("detectConflicts surfaces the conflict with both slot keys (R6.1, R6.2)", () => {
    const conflicts = detectConflicts(slots)

    expect(conflicts).toHaveLength(1)
    const [conflict] = conflicts
    expect(conflict.teacherId).toBe(TEACHER)
    expect(conflict.date).toBe(DATE)
    expect(conflict.sessionId).toBe(SESSION)

    const expectedKeys = [
      slotKey({ classId: slotA.classId, date: DATE, sessionId: SESSION }),
      slotKey({ classId: slotB.classId, date: DATE, sessionId: SESSION }),
    ].sort()
    expect([...conflict.slotKeys].sort()).toEqual(expectedKeys)
  })

  it("slotIsConflicted is true for both slots involved in the conflict (R6.2)", () => {
    const conflicts = detectConflicts(slots)

    const coordA = { classId: slotA.classId, date: DATE, sessionId: SESSION }
    const coordB = { classId: slotB.classId, date: DATE, sessionId: SESSION }
    expect(slotIsConflicted(conflicts, coordA)).toBe(true)
    expect(slotIsConflicted(conflicts, coordB)).toBe(true)
  })

  it("conflict is retained after admin confirms override — the flag stays (R6.4, R6.5)", () => {
    // Simulating 'confirmOverride': the slots are committed as-is with the
    // conflicting assignment kept.  The conflict flag must remain visible.
    const conflicts = detectConflicts(slots)
    expect(conflicts).toHaveLength(1)
    expect(conflicts[0].slotKeys).toHaveLength(2)
  })

  it("R6.7: removing teacher from one slot clears the conflict flag", () => {
    // Admin resolves the double-booking by removing t1 from slotB.
    const resolvedSlots = slots.map(s =>
      s === slotB
        ? { ...s, invigilatorIds: s.invigilatorIds.filter(id => id !== TEACHER) }
        : s,
    )

    const conflicts = detectConflicts(resolvedSlots)
    expect(conflicts).toHaveLength(0)

    // Neither slot is flagged anymore.
    const coordA = { classId: slotA.classId, date: DATE, sessionId: SESSION }
    const coordB = { classId: slotB.classId, date: DATE, sessionId: SESSION }
    expect(slotIsConflicted(conflicts, coordA)).toBe(false)
    expect(slotIsConflicted(conflicts, coordB)).toBe(false)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 22: Non-conflicting availability is green or amber
//
// Feature: exam-routine-builder, Property 22: Non-conflicting availability is green or amber
// Validates: Requirements 6.6
//
// For ANY teacher that is NOT double-booked in a given (date, sessionId) triple
// (i.e. the teacher appears in AT MOST ONE slot sharing that date+session,
// ignoring the target slot itself), `invigilatorAvailability` must return a
// badge whose status is EITHER "available-same" OR "available-diff" — never
// "unavailable" or "capped".
//
// Sub-checks:
//   A) The status is in the green/amber set (not red/gray).
//   B) The label is a non-empty string (color is always paired with a text label).
// ─────────────────────────────────────────────────────────────────────────────

import { invigilatorAvailability } from "@/lib/exam/availability"
import { arbTeachers } from "./generators"

describe("Property 22: Non-conflicting availability is green or amber", () => {

  it(
    "a teacher not double-booked in the target slot's (date, session) gets green or amber",
    () => {
      // Feature: exam-routine-builder, Property 22: Non-conflicting availability is green or amber
      // Validates: Requirements 6.6
      fc.assert(
        fc.property(
          arbSlots,
          arbTeachers,
          (slots, teachers) => {
            // Skip trivial cases where there are no slots to examine.
            if (slots.length === 0) return true

            for (const targetSlot of slots) {
              const coord = {
                classId: targetSlot.classId,
                date:      targetSlot.date,
                sessionId: targetSlot.sessionId,
              }

              for (const teacher of teachers) {
                // Determine if this teacher is assigned to any OTHER slot that
                // shares the same (date, sessionId).  If they are, they WOULD
                // be double-booked, so skip them — this property only applies
                // to non-conflicting teachers.
                const isDoubleBooked = slots.some(
                  s =>
                    // Must be a DIFFERENT slot (not the target itself)
                    !(s.classId === coord.classId && s.date === coord.date && s.sessionId === coord.sessionId) &&
                    s.date === coord.date &&
                    s.sessionId === coord.sessionId &&
                    s.invigilatorIds.includes(teacher.id),
                )
                if (isDoubleBooked) continue

                // The teacher is not double-booked for this (date, session).
                // invigilatorAvailability must return green or amber.
                const badge = invigilatorAvailability(
                  teacher.id,
                  coord,
                  slots,
                  teacher.subjects,       // absentTeacherSubjects
                  targetSlot.subject,     // slotSubject (may be undefined)
                )

                // Sub-check A: status must be available-same (green) or available-diff (amber).
                const validStatuses: string[] = ["available-same", "available-diff"]
                if (!validStatuses.includes(badge.status)) return false

                // Sub-check B: label must be a non-empty string (color always paired with text).
                if (typeof badge.label !== "string" || badge.label.trim().length === 0) return false
              }
            }
            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "a non-conflicting teacher with a matching subject gets available-same (green)",
    () => {
      // Feature: exam-routine-builder, Property 22: Non-conflicting availability is green or amber
      // Validates: Requirements 6.6
      fc.assert(
        fc.property(
          arbSlots,
          (slots) => {
            // Pick a slot that has a subject and at least one invigilator in the
            // slot itself (so we can test against that teacher's subjects).
            const slotsWithSubject = slots.filter(s => s.subject)
            if (slotsWithSubject.length === 0) return true

            const targetSlot = slotsWithSubject[0]
            const coord = {
              classId:   targetSlot.classId,
              date:      targetSlot.date,
              sessionId: targetSlot.sessionId,
            }
            const subject = targetSlot.subject!

            // Synthesise a teacher who teaches the slot's subject and is NOT
            // assigned to any other slot in the same (date, session).
            const teacherId = "prop22-teacher-green"
            const conflictingSlots = slots.filter(
              s =>
                !(s.classId === coord.classId && s.date === coord.date && s.sessionId === coord.sessionId) &&
                s.date === coord.date &&
                s.sessionId === coord.sessionId &&
                s.invigilatorIds.includes(teacherId),
            )
            // If the synthesised id appears somewhere (unlikely but possible),
            // skip this sample — the teacher would already be double-booked.
            if (conflictingSlots.length > 0) return true

            const badge = invigilatorAvailability(
              teacherId,
              coord,
              slots,
              [subject], // teaches the slot's subject → should be green
              subject,
            )

            return badge.status === "available-same" && badge.label.trim().length > 0
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "a non-conflicting teacher without a matching subject gets available-diff (amber)",
    () => {
      // Feature: exam-routine-builder, Property 22: Non-conflicting availability is green or amber
      // Validates: Requirements 6.6
      fc.assert(
        fc.property(
          arbSlots,
          (slots) => {
            // Pick a slot that has a subject.
            const slotsWithSubject = slots.filter(s => s.subject)
            if (slotsWithSubject.length === 0) return true

            const targetSlot = slotsWithSubject[0]
            const coord = {
              classId:   targetSlot.classId,
              date:      targetSlot.date,
              sessionId: targetSlot.sessionId,
            }
            const subject = targetSlot.subject!

            const teacherId = "prop22-teacher-amber"
            const conflictingSlots = slots.filter(
              s =>
                !(s.classId === coord.classId && s.date === coord.date && s.sessionId === coord.sessionId) &&
                s.date === coord.date &&
                s.sessionId === coord.sessionId &&
                s.invigilatorIds.includes(teacherId),
            )
            if (conflictingSlots.length > 0) return true

            const badge = invigilatorAvailability(
              teacherId,
              coord,
              slots,
              [], // teaches NO subjects → definitely not the slot's subject → amber
              subject,
            )

            return badge.status === "available-diff" && badge.label.trim().length > 0
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})
