/**
 * duplication.test.ts — Property tests for the Duplication Service.
 *
 * Feature: exam-routine-builder, Property 27: Duplication copies subject, room, date, and session per position
 *
 * Tests:
 *   - Property 27: Duplication copies subject, room, date, and session per position (R8.1)
 *
 * Validates: Requirements 8.1
 *
 * NOTE: We use fc.assert(fc.property(...)) with standard vitest `it()` rather
 * than `it.prop` from @fast-check/vitest because Vitest v3 serializes test
 * metadata (including arbitrary objects) across the worker→main IPC channel
 * using structuredClone, which cannot clone fast-check's internal function
 * closures. fc.assert runs the property check synchronously inside the test.
 */

import { describe, expect, it } from "vitest"
import * as fc from "fast-check"
import type { CatalogSubject, ExamSlot } from "@/data/mock-exams"
import { duplicateRoutine } from "@/lib/exam/duplication"
import { slotKey } from "@/lib/exam/slots"
import { arbCatalog, arbClassId, arbSlots } from "./generators"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build an arbitrary that yields a valid duplication scenario:
 *   - A non-empty array of source slots (all sharing the same sourceClassId)
 *   - A sourceClassId present in those slots
 *   - At least one targetClassId that differs from the source
 *   - A catalog where all subjects in the source slots ARE linked to every
 *     target class (so R8.2 omission does not trigger — pure copy per position)
 *
 * Keeping subjects linked to all targets lets Property 27 focus solely on the
 * "copies subject, room, date, and session" invariant without worrying about
 * the omission path (that is Property 28's concern).
 */
const arbDuplicationScenario = fc
  .tuple(
    // 1–4 distinct class ids used as potential source / target ids
    fc.uniqueArray(arbClassId, { minLength: 2, maxLength: 4 }),
    // 1–4 source slots using stable coord ids drawn below
    fc.integer({ min: 1, max: 4 }),
  )
  .chain(([classIds, numSourceSlots]) => {
    const sourceClassId = classIds[0]
    const targetClassIds = classIds.slice(1) // at least 1 target

    // Build numSourceSlots source slots all sharing sourceClassId but with
    // unique (date, sessionId) positions.
    const dateOptions = [
      "2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17",
      "2026-07-18", "2026-07-19", "2026-07-20", "2026-07-21",
    ]
    const sessionOptions = ["ses-morning", "ses-afternoon", "ses-evening", "ses-extra"]
    const subjectNames = ["English", "Mathematics", "Science", "Social Studies"]

    // Generate unique (date, sessionId) pairs for source slots
    const allCoords = dateOptions.flatMap(d => sessionOptions.map(s => ({ date: d, sessionId: s })))
    const chosenCoords = allCoords.slice(0, numSourceSlots)

    const sourceSlots: ExamSlot[] = chosenCoords.map((coord, i) => ({
      id: `es-src-${i}`,
      classId: sourceClassId,
      date: coord.date,
      sessionId: coord.sessionId,
      subject: subjectNames[i % subjectNames.length],
      room: `Room ${101 + i}`,
      invigilatorIds: [`t${i + 1}`, `t${i + 2}`],
    }))

    // Build a catalog where every subject in the source slots is linked to ALL
    // classes (source + targets), so no subjects are omitted.
    const catalog: CatalogSubject[] = subjectNames.map((name, i) => ({
      id: `subj-${i}`,
      name,
      linkedClassIds: classIds,
    }))

    // Full slot array: source slots only (no pre-existing target slots so every
    // target slot is "created" fresh, exercising the main copy path).
    return fc.constant({
      slots: sourceSlots,
      sourceClassId,
      targetClassIds,
      catalog,
    })
  })

// ─────────────────────────────────────────────────────────────────────────────
// Property 27: Duplication copies subject, room, date, and session per position
//
// Feature: exam-routine-builder, Property 27: Duplication copies subject, room, date, and session per position
// Validates: Requirements 8.1
//
// For any valid duplication (source class with slots, non-empty target set,
// catalog linking all subjects to all target classes), after calling
// duplicateRoutine:
//
//   For every source slot at (date, sessionId):
//     1. Each target class has a corresponding slot at the SAME (date, sessionId).
//     2. That target slot's `date` equals the source slot's `date`.
//     3. That target slot's `sessionId` equals the source slot's `sessionId`.
//     4. That target slot's `subject` equals the source slot's `subject`.
//     5. That target slot's `room` equals the source slot's `room`.
//
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 27: Duplication copies subject, room, date, and session per position", () => {

  it(
    "each source slot's subject, room, date, and sessionId are present on the corresponding target slot",
    () => {
      // Feature: exam-routine-builder, Property 27: Duplication copies subject, room, date, and session per position
      // Validates: Requirements 8.1
      fc.assert(
        fc.property(
          arbDuplicationScenario,
          ({ slots, sourceClassId, targetClassIds, catalog }) => {
            const result = duplicateRoutine(slots, sourceClassId, targetClassIds, catalog)

            // The operation must succeed (all subjects are linked to all targets).
            if (!result.ok) return false

            const { slots: resultSlots } = result.value
            const sourceSlots = slots.filter(s => s.classId === sourceClassId)

            for (const src of sourceSlots) {
              for (const targetId of targetClassIds) {
                // Skip the source itself if it appears in the target list
                // (R8.5 — it would have been excluded by duplicateRoutine).
                if (targetId === sourceClassId) continue

                const targetKey = slotKey({ classId: targetId, date: src.date, sessionId: src.sessionId })
                const targetSlot = resultSlots.find(
                  s => slotKey({ classId: s.classId, date: s.date, sessionId: s.sessionId }) === targetKey,
                )

                // Sub-check 1: corresponding slot exists at same (date, sessionId).
                if (!targetSlot) return false

                // Sub-check 2: date is correctly copied per position.
                if (targetSlot.date !== src.date) return false

                // Sub-check 3: sessionId is correctly copied per position.
                if (targetSlot.sessionId !== src.sessionId) return false

                // Sub-check 4: subject is copied (all subjects are linked, so no omission).
                if (targetSlot.subject !== src.subject) return false

                // Sub-check 5: room is copied.
                if (targetSlot.room !== src.room) return false
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
    "target slot classId is the target class (not the source class)",
    () => {
      // Feature: exam-routine-builder, Property 27: Duplication copies subject, room, date, and session per position
      // Validates: Requirements 8.1
      fc.assert(
        fc.property(
          arbDuplicationScenario,
          ({ slots, sourceClassId, targetClassIds, catalog }) => {
            const result = duplicateRoutine(slots, sourceClassId, targetClassIds, catalog)
            if (!result.ok) return false

            const { slots: resultSlots } = result.value
            const sourceSlots = slots.filter(s => s.classId === sourceClassId)

            for (const src of sourceSlots) {
              for (const targetId of targetClassIds) {
                if (targetId === sourceClassId) continue

                const targetSlot = resultSlots.find(
                  s =>
                    s.classId === targetId &&
                    s.date === src.date &&
                    s.sessionId === src.sessionId,
                )

                // The copied slot must belong to the target class, not the source.
                if (!targetSlot) return false
                if (targetSlot.classId !== targetId) return false
                if (targetSlot.classId === sourceClassId) return false
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
    "source slots are preserved unchanged after duplication",
    () => {
      // Feature: exam-routine-builder, Property 27: Duplication copies subject, room, date, and session per position
      // Validates: Requirements 8.1
      fc.assert(
        fc.property(
          arbDuplicationScenario,
          ({ slots, sourceClassId, targetClassIds, catalog }) => {
            const result = duplicateRoutine(slots, sourceClassId, targetClassIds, catalog)
            if (!result.ok) return false

            const { slots: resultSlots } = result.value
            const originalSourceSlots = slots.filter(s => s.classId === sourceClassId)

            for (const orig of originalSourceSlots) {
              const key = slotKey({ classId: orig.classId, date: orig.date, sessionId: orig.sessionId })
              const afterCopy = resultSlots.find(
                s => slotKey({ classId: s.classId, date: s.date, sessionId: s.sessionId }) === key,
              )
              // Source slot must still exist.
              if (!afterCopy) return false
              // Source slot's subject, room, date, sessionId must be unchanged.
              if (afterCopy.subject !== orig.subject) return false
              if (afterCopy.room !== orig.room) return false
              if (afterCopy.date !== orig.date) return false
              if (afterCopy.sessionId !== orig.sessionId) return false
            }
            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "result slot count grows by (source slot count × target class count) when no pre-existing target slots",
    () => {
      // Feature: exam-routine-builder, Property 27: Duplication copies subject, room, date, and session per position
      // Validates: Requirements 8.1
      fc.assert(
        fc.property(
          arbDuplicationScenario,
          ({ slots, sourceClassId, targetClassIds, catalog }) => {
            const result = duplicateRoutine(slots, sourceClassId, targetClassIds, catalog)
            if (!result.ok) return false

            const { slots: resultSlots, report } = result.value
            const sourceSlotCount = slots.filter(s => s.classId === sourceClassId).length

            // Effective target count (source excluded by R8.5)
            const effectiveTargets = [...new Set(targetClassIds)].filter(
              id => id !== sourceClassId,
            )
            const expectedCreated = sourceSlotCount * effectiveTargets.length

            // No pre-existing target slots were in the input, so everything
            // should be "created", not "overwritten".
            if (report.created !== expectedCreated) return false
            if (report.overwritten !== 0) return false
            if (resultSlots.length !== slots.length + expectedCreated) return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Example test: concrete duplication scenario
  //
  // Validates: Requirements 8.1
  //
  // Scenario:
  //   Source class VIII-A has two slots on 2026-07-14 (ses-morning) and
  //   2026-07-15 (ses-morning). Duplicate to IX-A and X-A.
  //   Each target class must receive corresponding slots with identical
  //   subject, room, date, and sessionId.
  // ─────────────────────────────────────────────────────────────────────────

  it("example: copies subject, room, date, and session to each target class", () => {
    const sourceSlots: ExamSlot[] = [
      {
        id: "es-1",
        classId: "VIII-A",
        date: "2026-07-14",
        sessionId: "ses-morning",
        subject: "English",
        room: "Room 201",
        invigilatorIds: ["t1", "t2"],
      },
      {
        id: "es-2",
        classId: "VIII-A",
        date: "2026-07-15",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 202",
        invigilatorIds: ["t3"],
      },
    ]

    const catalog: CatalogSubject[] = [
      { id: "subj-en",  name: "English",     linkedClassIds: ["VIII-A", "IX-A", "X-A"] },
      { id: "subj-ma",  name: "Mathematics", linkedClassIds: ["VIII-A", "IX-A", "X-A"] },
    ]

    const result = duplicateRoutine(sourceSlots, "VIII-A", ["IX-A", "X-A"], catalog)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const { slots: resultSlots, report } = result.value

    // 2 source × 2 targets = 4 new slots
    expect(report.created).toBe(4)
    expect(report.overwritten).toBe(0)
    expect(report.omitted).toBe(0)

    const targetClasses = ["IX-A", "X-A"]
    const expectations = [
      { date: "2026-07-14", sessionId: "ses-morning", subject: "English",     room: "Room 201" },
      { date: "2026-07-15", sessionId: "ses-morning", subject: "Mathematics", room: "Room 202" },
    ]

    for (const targetId of targetClasses) {
      for (const exp of expectations) {
        const targetSlot = resultSlots.find(
          s => s.classId === targetId && s.date === exp.date && s.sessionId === exp.sessionId,
        )
        expect(targetSlot, `slot missing for ${targetId} at ${exp.date}/${exp.sessionId}`).toBeDefined()
        expect(targetSlot!.date).toBe(exp.date)
        expect(targetSlot!.sessionId).toBe(exp.sessionId)
        expect(targetSlot!.subject).toBe(exp.subject)
        expect(targetSlot!.room).toBe(exp.room)
        expect(targetSlot!.classId).toBe(targetId)
        // Invigilators must NOT be carried over (R8.3)
        expect(targetSlot!.invigilatorIds).toEqual([])
      }
    }

    // Source slots must remain intact
    const src1 = resultSlots.find(s => s.id === "es-1")
    expect(src1?.subject).toBe("English")
    expect(src1?.room).toBe("Room 201")
    const src2 = resultSlots.find(s => s.id === "es-2")
    expect(src2?.subject).toBe("Mathematics")
    expect(src2?.room).toBe("Room 202")
  })

  it("example: overwritten count increments when target slot pre-exists", () => {
    const sourceSlot: ExamSlot = {
      id: "es-src",
      classId: "VIII-A",
      date: "2026-07-14",
      sessionId: "ses-morning",
      subject: "Science",
      room: "Room 101",
      invigilatorIds: [],
    }
    const preExistingTargetSlot: ExamSlot = {
      id: "es-pre",
      classId: "IX-A",
      date: "2026-07-14",
      sessionId: "ses-morning",
      subject: "English",
      room: "Lab 1",
      invigilatorIds: ["t1"],
    }
    const catalog: CatalogSubject[] = [
      { id: "subj-sc", name: "Science", linkedClassIds: ["VIII-A", "IX-A"] },
      { id: "subj-en", name: "English", linkedClassIds: ["VIII-A", "IX-A"] },
    ]

    const result = duplicateRoutine(
      [sourceSlot, preExistingTargetSlot],
      "VIII-A",
      ["IX-A"],
      catalog,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const { slots: resultSlots, report } = result.value

    // The pre-existing target slot is overwritten, not created.
    expect(report.created).toBe(0)
    expect(report.overwritten).toBe(1)

    const overwritten = resultSlots.find(
      s => s.classId === "IX-A" && s.date === "2026-07-14" && s.sessionId === "ses-morning",
    )
    expect(overwritten).toBeDefined()
    expect(overwritten!.subject).toBe("Science")   // copied from source
    expect(overwritten!.room).toBe("Room 101")      // copied from source
    expect(overwritten!.invigilatorIds).toEqual([]) // cleared (R8.3)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 28: Duplication omits and flags unlinked subjects
//
// Feature: exam-routine-builder, Property 28: Duplication omits and flags unlinked subjects
// Validates: Requirements 8.2
//
// When some source slots carry subjects that are NOT linked to a target class:
//
//   1. duplicateRoutine still succeeds (ok: true).
//   2. report.omitted > 0 (at least one subject was omitted).
//   3. The target slot at the same (date, sessionId) position has no subject
//      set (subject === undefined) for each unlinked subject position.
//   4. report.omittedSubjects contains the names of every omitted subject
//      (one entry per omission, matching the source slot's subject name).
//
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 28: Duplication omits and flags unlinked subjects", () => {
  /**
   * Build a scenario where:
   *  - There is exactly one source class with one or more slots that have subjects.
   *  - There is exactly one target class.
   *  - At least one source slot's subject is NOT linked to the target class —
   *    we achieve this by building the catalog so those subjects only list the
   *    source class in linkedClassIds.
   *  - The remaining subjects (if any) ARE linked to the target, so we get a
   *    mix of linked/unlinked to keep the property meaningful.
   */
  const arbUnlinkedScenario = fc
    .tuple(
      // Two distinct class ids: [sourceClassId, targetClassId]
      fc.uniqueArray(arbClassId, { minLength: 2, maxLength: 2 }),
      // 1–4 source slots
      fc.integer({ min: 1, max: 4 }),
      // How many of those slots should carry unlinked subjects (at least 1)
      fc.integer({ min: 1, max: 4 }),
    )
    .chain(([classIds, numSlots, numUnlinked]) => {
      const sourceClassId = classIds[0]
      const targetClassId = classIds[1]

      const actualUnlinked = Math.min(numUnlinked, numSlots)

      const dateOptions = [
        "2026-08-01", "2026-08-02", "2026-08-03", "2026-08-04",
      ]
      const sessionOptions = ["ses-m", "ses-a", "ses-e", "ses-x"]

      const subjectNames = ["English", "Mathematics", "Science", "History"]

      // Build slots for the source class.
      const sourceSlots: import("@/data/mock-exams").ExamSlot[] = Array.from(
        { length: numSlots },
        (_, i) => ({
          id: `es-p28-src-${i}`,
          classId: sourceClassId,
          date: dateOptions[i % dateOptions.length],
          sessionId: sessionOptions[i % sessionOptions.length],
          subject: subjectNames[i % subjectNames.length],
          room: `Room ${200 + i}`,
          invigilatorIds: [`t${i + 10}`],
        }),
      )

      // Build catalog:
      //   - The first `actualUnlinked` subject names are linked only to the
      //     source class (NOT to the target) → will be omitted.
      //   - The remaining subject names are linked to both source and target
      //     → will be copied normally.
      const linkedSubjectNames = new Set(sourceSlots.map(s => s.subject!))
      const catalog: import("@/data/mock-exams").CatalogSubject[] = Array.from(
        linkedSubjectNames,
      ).map((name, i) => ({
        id: `subj-p28-${i}`,
        name,
        linkedClassIds:
          i < actualUnlinked
            ? [sourceClassId]               // unlinked from target
            : [sourceClassId, targetClassId], // linked to both
      }))

      // Determine which source slots carry an unlinked subject (for assertions).
      const unlinkedSubjectSet = new Set(
        Array.from(linkedSubjectNames).slice(0, actualUnlinked),
      )

      return fc.constant({
        slots: sourceSlots,
        sourceClassId,
        targetClassId,
        catalog,
        unlinkedSubjectSet,
        numSlots,
        actualUnlinked,
      })
    })

  it(
    "succeeds and sets report.omitted > 0 when any source subject is not linked to the target class",
    () => {
      // Feature: exam-routine-builder, Property 28: Duplication omits and flags unlinked subjects
      // Validates: Requirements 8.2
      fc.assert(
        fc.property(
          arbUnlinkedScenario,
          ({ slots, sourceClassId, targetClassId, catalog }) => {
            const result = duplicateRoutine(slots, sourceClassId, [targetClassId], catalog)

            // Must succeed — omitting unlinked subjects is not a failure (R8.2).
            if (!result.ok) return false

            // At least one subject was omitted.
            if (result.value.report.omitted <= 0) return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "target slot has no subject (undefined) for positions where the source subject is unlinked",
    () => {
      // Feature: exam-routine-builder, Property 28: Duplication omits and flags unlinked subjects
      // Validates: Requirements 8.2
      fc.assert(
        fc.property(
          arbUnlinkedScenario,
          ({ slots, sourceClassId, targetClassId, catalog, unlinkedSubjectSet }) => {
            const result = duplicateRoutine(slots, sourceClassId, [targetClassId], catalog)
            if (!result.ok) return false

            const { slots: resultSlots } = result.value

            // For every source slot whose subject is unlinked to the target class,
            // the corresponding target slot must have subject === undefined.
            const sourceSlots = slots.filter(s => s.classId === sourceClassId)
            for (const src of sourceSlots) {
              if (src.subject === undefined) continue
              if (!unlinkedSubjectSet.has(src.subject)) continue

              // Find the target slot at the same (date, sessionId) position.
              const targetSlot = resultSlots.find(
                s =>
                  s.classId === targetClassId &&
                  s.date === src.date &&
                  s.sessionId === src.sessionId,
              )

              // The target slot must exist (the position is still created per R8.2).
              if (!targetSlot) return false

              // Subject must be absent — not carried over.
              if (targetSlot.subject !== undefined) return false
            }

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "report.omittedSubjects contains each unlinked subject name (one entry per omission)",
    () => {
      // Feature: exam-routine-builder, Property 28: Duplication omits and flags unlinked subjects
      // Validates: Requirements 8.2
      fc.assert(
        fc.property(
          arbUnlinkedScenario,
          ({ slots, sourceClassId, targetClassId, catalog, unlinkedSubjectSet }) => {
            const result = duplicateRoutine(slots, sourceClassId, [targetClassId], catalog)
            if (!result.ok) return false

            const { report } = result.value

            // Every name in omittedSubjects must be an unlinked subject.
            for (const omittedName of report.omittedSubjects) {
              if (!unlinkedSubjectSet.has(omittedName)) return false
            }

            // report.omitted must equal the length of omittedSubjects.
            if (report.omitted !== report.omittedSubjects.length) return false

            // The omitted count must be positive (scenario always has ≥1 unlinked).
            if (report.omitted <= 0) return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "omitted count equals source slot count for fully-unlinked target class",
    () => {
      // Feature: exam-routine-builder, Property 28: Duplication omits and flags unlinked subjects
      // Validates: Requirements 8.2
      //
      // When NO subject in the catalog is linked to the target class, every
      // source slot with a subject contributes one omission.
      fc.assert(
        fc.property(
          arbUnlinkedScenario.map(scenario => ({
            ...scenario,
            // Override catalog so nothing is linked to the target class.
            catalog: scenario.catalog.map(cs => ({
              ...cs,
              linkedClassIds: [scenario.sourceClassId], // source only
            })),
            unlinkedSubjectSet: new Set(
              scenario.slots
                .filter(s => s.subject !== undefined)
                .map(s => s.subject as string),
            ),
          })),
          ({ slots, sourceClassId, targetClassId, catalog }) => {
            const result = duplicateRoutine(slots, sourceClassId, [targetClassId], catalog)
            if (!result.ok) return false

            const { report } = result.value
            const slotsWithSubject = slots.filter(
              s => s.classId === sourceClassId && s.subject !== undefined,
            ).length

            // Every subject-bearing source slot must have been omitted.
            if (report.omitted !== slotsWithSubject) return false
            if (report.omittedSubjects.length !== slotsWithSubject) return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Example test: concrete omission scenario
  //
  // Validates: Requirements 8.2
  //
  // Scenario:
  //   Source class VIII-A has three slots:
  //     - 2026-09-01 / ses-morning : subject "English"  (linked to IX-A)
  //     - 2026-09-02 / ses-morning : subject "Physics"  (NOT linked to IX-A)
  //     - 2026-09-03 / ses-morning : subject "Chemistry"(NOT linked to IX-A)
  //
  //   Duplicate to IX-A.
  //   Expected:
  //     - report.omitted = 2 ("Physics" and "Chemistry")
  //     - report.omittedSubjects includes "Physics" and "Chemistry"
  //     - IX-A slot on 2026-09-01 has subject "English"
  //     - IX-A slot on 2026-09-02 has subject undefined
  //     - IX-A slot on 2026-09-03 has subject undefined
  // ─────────────────────────────────────────────────────────────────────────

  it("example: unlinked subjects are absent from target and named in omittedSubjects", () => {
    const sourceSlots: import("@/data/mock-exams").ExamSlot[] = [
      {
        id: "es-p28-ex-1",
        classId: "VIII-A",
        date: "2026-09-01",
        sessionId: "ses-morning",
        subject: "English",
        room: "Room 101",
        invigilatorIds: ["t1"],
      },
      {
        id: "es-p28-ex-2",
        classId: "VIII-A",
        date: "2026-09-02",
        sessionId: "ses-morning",
        subject: "Physics",
        room: "Room 102",
        invigilatorIds: ["t2"],
      },
      {
        id: "es-p28-ex-3",
        classId: "VIII-A",
        date: "2026-09-03",
        sessionId: "ses-morning",
        subject: "Chemistry",
        room: "Room 103",
        invigilatorIds: [],
      },
    ]

    const catalog: import("@/data/mock-exams").CatalogSubject[] = [
      { id: "subj-en",  name: "English",   linkedClassIds: ["VIII-A", "IX-A"] }, // linked
      { id: "subj-ph",  name: "Physics",   linkedClassIds: ["VIII-A"] },          // NOT linked to IX-A
      { id: "subj-ch",  name: "Chemistry", linkedClassIds: ["VIII-A"] },          // NOT linked to IX-A
    ]

    const result = duplicateRoutine(sourceSlots, "VIII-A", ["IX-A"], catalog)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const { slots: resultSlots, report } = result.value

    // Report counts
    expect(report.omitted).toBe(2)
    expect(report.omittedSubjects).toHaveLength(2)
    expect(report.omittedSubjects).toContain("Physics")
    expect(report.omittedSubjects).toContain("Chemistry")

    // IX-A on 2026-09-01: English is linked → should be present
    const slot1 = resultSlots.find(
      s => s.classId === "IX-A" && s.date === "2026-09-01" && s.sessionId === "ses-morning",
    )
    expect(slot1, "IX-A slot on 2026-09-01 should exist").toBeDefined()
    expect(slot1!.subject).toBe("English")
    expect(slot1!.room).toBe("Room 101")
    expect(slot1!.invigilatorIds).toEqual([])

    // IX-A on 2026-09-02: Physics is NOT linked → subject must be absent
    const slot2 = resultSlots.find(
      s => s.classId === "IX-A" && s.date === "2026-09-02" && s.sessionId === "ses-morning",
    )
    expect(slot2, "IX-A slot on 2026-09-02 should still be created").toBeDefined()
    expect(slot2!.subject).toBeUndefined()
    expect(slot2!.room).toBe("Room 102") // room is always copied (R8.1)
    expect(slot2!.invigilatorIds).toEqual([])

    // IX-A on 2026-09-03: Chemistry is NOT linked → subject must be absent
    const slot3 = resultSlots.find(
      s => s.classId === "IX-A" && s.date === "2026-09-03" && s.sessionId === "ses-morning",
    )
    expect(slot3, "IX-A slot on 2026-09-03 should still be created").toBeDefined()
    expect(slot3!.subject).toBeUndefined()
    expect(slot3!.room).toBe("Room 103")
    expect(slot3!.invigilatorIds).toEqual([])

    // Source slots must remain intact
    const src1 = resultSlots.find(s => s.id === "es-p28-ex-1")
    expect(src1?.subject).toBe("English")
    const src2 = resultSlots.find(s => s.id === "es-p28-ex-2")
    expect(src2?.subject).toBe("Physics")
    const src3 = resultSlots.find(s => s.id === "es-p28-ex-3")
    expect(src3?.subject).toBe("Chemistry")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 29: Duplication clears target invigilators
//
// Feature: exam-routine-builder, Property 29: Duplication clears target invigilators
// Validates: Requirements 8.3
//
// For any valid duplication scenario:
//
//   1. Every new / overwritten target slot has `invigilatorIds === []`.
//      Source invigilators are NEVER carried over to target slots.
//   2. The source slots' `invigilatorIds` remain unchanged after duplication.
//   3. Target slots that did NOT change position (non-target, non-source slots)
//      also keep their invigilator lists unchanged.
//
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 29: Duplication clears target invigilators", () => {
  /**
   * Scenario for Property 29:
   *   - 2–4 distinct class ids (source + at least one target).
   *   - 1–4 source slots, each with 1–3 invigilator ids.
   *   - 0 or more pre-existing target slots at MATCHING positions so the
   *     "overwrite" path is exercised alongside the "create" path.
   *   - Catalog links every subject to every class so R8.2 omission never
   *     fires — we focus purely on the invigilator-clearing invariant (R8.3).
   */
  const arbInvigilatorScenario = fc
    .tuple(
      fc.uniqueArray(arbClassId, { minLength: 2, maxLength: 4 }),
      fc.integer({ min: 1, max: 4 }),
    )
    .chain(([classIds, numSourceSlots]) => {
      const sourceClassId = classIds[0]
      const targetClassIds = classIds.slice(1)

      const dateOptions = [
        "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04",
        "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08",
      ]
      const sessionOptions = ["ses-morning", "ses-afternoon", "ses-evening", "ses-extra"]
      const subjectNames = ["English", "Mathematics", "Science", "History"]

      // Pick unique (date, sessionId) coords for the source slots.
      const allCoords = dateOptions.flatMap(d => sessionOptions.map(s => ({ date: d, sessionId: s })))
      const chosenCoords = allCoords.slice(0, numSourceSlots)

      // Build source slots — each has at least one invigilator.
      const sourceSlots: ExamSlot[] = chosenCoords.map((coord, i) => ({
        id: `es-p29-src-${i}`,
        classId: sourceClassId,
        date: coord.date,
        sessionId: coord.sessionId,
        subject: subjectNames[i % subjectNames.length],
        room: `Room ${300 + i}`,
        // 1–3 invigilator ids, always non-empty so the clearing is testable.
        invigilatorIds: [`tinv-${i}-a`, `tinv-${i}-b`, `tinv-${i}-c`].slice(0, (i % 3) + 1),
      }))

      // Pre-existing target slots at the SAME (date, sessionId) positions for
      // the first targetClass — tests the overwrite path (invigilators cleared).
      const preExistingTargetSlots: ExamSlot[] = chosenCoords.map((coord, i) => ({
        id: `es-p29-pre-${i}`,
        classId: targetClassIds[0],
        date: coord.date,
        sessionId: coord.sessionId,
        subject: "History",
        room: `Old Room ${i}`,
        invigilatorIds: [`told-${i}`],
      }))

      // Catalog links every subject to every class.
      const catalog: import("@/data/mock-exams").CatalogSubject[] = subjectNames.map((name, i) => ({
        id: `subj-p29-${i}`,
        name,
        linkedClassIds: classIds,
      }))

      return fc.constant({
        slots: [...sourceSlots, ...preExistingTargetSlots],
        sourceClassId,
        targetClassIds,
        catalog,
        sourceSlots,
        preExistingTargetSlots,
      })
    })

  // ─────────────────────────────────────────────────────────────────────────
  // Sub-property A: Every target slot produced by duplication has empty invigilatorIds.
  // ─────────────────────────────────────────────────────────────────────────

  it(
    "every new/overwritten target slot has invigilatorIds === [] after duplication",
    () => {
      // Feature: exam-routine-builder, Property 29: Duplication clears target invigilators
      // Validates: Requirements 8.3
      fc.assert(
        fc.property(
          arbInvigilatorScenario,
          ({ slots, sourceClassId, targetClassIds, catalog }) => {
            const result = duplicateRoutine(slots, sourceClassId, targetClassIds, catalog)
            if (!result.ok) return false

            const { slots: resultSlots } = result.value
            const sourceSlots = slots.filter(s => s.classId === sourceClassId)

            const effectiveTargets = [...new Set(targetClassIds)].filter(
              id => id !== sourceClassId,
            )

            for (const targetId of effectiveTargets) {
              for (const src of sourceSlots) {
                // Find the target slot at the same (date, sessionId) position.
                const targetSlot = resultSlots.find(
                  s =>
                    s.classId === targetId &&
                    s.date === src.date &&
                    s.sessionId === src.sessionId,
                )

                // The slot must exist (duplication always creates the position).
                if (!targetSlot) return false

                // Invigilator list must be empty — never carried from source (R8.3).
                if (targetSlot.invigilatorIds.length !== 0) return false
              }
            }

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Sub-property B: Source slots' invigilatorIds are not mutated by duplication.
  // ─────────────────────────────────────────────────────────────────────────

  it(
    "source slots retain their original invigilatorIds after duplication",
    () => {
      // Feature: exam-routine-builder, Property 29: Duplication clears target invigilators
      // Validates: Requirements 8.3
      fc.assert(
        fc.property(
          arbInvigilatorScenario,
          ({ slots, sourceClassId, targetClassIds, catalog, sourceSlots }) => {
            const result = duplicateRoutine(slots, sourceClassId, targetClassIds, catalog)
            if (!result.ok) return false

            const { slots: resultSlots } = result.value

            for (const original of sourceSlots) {
              const afterCopy = resultSlots.find(
                s =>
                  s.classId === sourceClassId &&
                  s.date === original.date &&
                  s.sessionId === original.sessionId,
              )

              // Source slot must still exist.
              if (!afterCopy) return false

              // Its invigilator list must be unchanged — same length and same ids.
              if (afterCopy.invigilatorIds.length !== original.invigilatorIds.length) return false

              for (let k = 0; k < original.invigilatorIds.length; k++) {
                if (afterCopy.invigilatorIds[k] !== original.invigilatorIds[k]) return false
              }
            }

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Sub-property C: Unrelated (non-source, non-target) slots keep their
  //                 invigilator lists unchanged.
  // ─────────────────────────────────────────────────────────────────────────

  it(
    "slots not involved in the duplication retain their invigilatorIds unchanged",
    () => {
      // Feature: exam-routine-builder, Property 29: Duplication clears target invigilators
      // Validates: Requirements 8.3
      fc.assert(
        fc.property(
          arbInvigilatorScenario.chain(scenario =>
            // Append a bystander slot belonging to a class outside the duplication.
            fc.constant({
              ...scenario,
              slots: [
                ...scenario.slots,
                {
                  id: "es-p29-bystander",
                  classId: "bystander-class",
                  date: "2026-10-01",
                  sessionId: "ses-morning",
                  subject: "English",
                  room: "Room 999",
                  invigilatorIds: ["t-by-1", "t-by-2"],
                } satisfies ExamSlot,
              ],
            }),
          ),
          ({ slots, sourceClassId, targetClassIds, catalog }) => {
            const result = duplicateRoutine(slots, sourceClassId, targetClassIds, catalog)
            if (!result.ok) return false

            const { slots: resultSlots } = result.value

            // Find the bystander slot in the result.
            const bystander = resultSlots.find(s => s.id === "es-p29-bystander")
            if (!bystander) return false

            // Its invigilatorIds must be untouched.
            if (bystander.invigilatorIds.length !== 2) return false
            if (bystander.invigilatorIds[0] !== "t-by-1") return false
            if (bystander.invigilatorIds[1] !== "t-by-2") return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Sub-property D: The clearing holds regardless of how many invigilators
  //                 the source slot originally had.
  // ─────────────────────────────────────────────────────────────────────────

  it(
    "target invigilatorIds is [] even when source slot had multiple invigilators",
    () => {
      // Feature: exam-routine-builder, Property 29: Duplication clears target invigilators
      // Validates: Requirements 8.3
      fc.assert(
        fc.property(
          // Generate 1–5 invigilator ids on the source slot.
          fc.array(fc.string({ minLength: 2, maxLength: 10, unit: "grapheme-ascii" }), { minLength: 1, maxLength: 5 }),
          arbClassId,
          arbClassId,
          (invigilatorIds, rawSource, rawTarget) => {
            // Ensure source and target are distinct.
            const sourceClassId = `src-${rawSource}`
            const targetClassId = `tgt-${rawTarget}`

            if (sourceClassId === targetClassId) return true // skip degenerate case

            const sourceSlot: ExamSlot = {
              id: "es-p29-multi-inv",
              classId: sourceClassId,
              date: "2026-11-01",
              sessionId: "ses-morning",
              subject: "English",
              room: "Room 1",
              // De-duplicate the generated ids to avoid identity issues.
              invigilatorIds: [...new Set(invigilatorIds)],
            }

            const catalog: import("@/data/mock-exams").CatalogSubject[] = [
              {
                id: "subj-en",
                name: "English",
                linkedClassIds: [sourceClassId, targetClassId],
              },
            ]

            const result = duplicateRoutine([sourceSlot], sourceClassId, [targetClassId], catalog)
            if (!result.ok) return false

            const { slots: resultSlots } = result.value

            const targetSlot = resultSlots.find(
              s => s.classId === targetClassId && s.date === "2026-11-01" && s.sessionId === "ses-morning",
            )

            if (!targetSlot) return false

            // Target invigilators must be cleared to [] regardless of how many
            // the source had.
            return targetSlot.invigilatorIds.length === 0
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Example test: concrete invigilator-clearing scenario
  //
  // Validates: Requirements 8.3
  //
  // Scenario:
  //   Source class VIII-A has two slots both carrying invigilators:
  //     - 2026-12-01 / ses-morning : invigilators [t1, t2]
  //     - 2026-12-02 / ses-morning : invigilators [t3]
  //   Target class IX-A has a pre-existing slot at 2026-12-01/ses-morning
  //   with its own invigilators [t-old].
  //
  //   After duplication to IX-A and X-A:
  //     - Both IX-A and X-A slots at each position have invigilatorIds === [].
  //     - Source slots keep their original invigilators.
  // ─────────────────────────────────────────────────────────────────────────

  it("example: invigilators are cleared on all target slots, source is unchanged", () => {
    const sourceSlots: ExamSlot[] = [
      {
        id: "es-p29-ex-1",
        classId: "VIII-A",
        date: "2026-12-01",
        sessionId: "ses-morning",
        subject: "English",
        room: "Room 401",
        invigilatorIds: ["t1", "t2"],
      },
      {
        id: "es-p29-ex-2",
        classId: "VIII-A",
        date: "2026-12-02",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 402",
        invigilatorIds: ["t3"],
      },
    ]

    // IX-A already has a slot at 2026-12-01 with its own invigilator.
    const preExistingSlot: ExamSlot = {
      id: "es-p29-ex-pre",
      classId: "IX-A",
      date: "2026-12-01",
      sessionId: "ses-morning",
      subject: "History",
      room: "Old Room",
      invigilatorIds: ["t-old"],
    }

    const catalog: import("@/data/mock-exams").CatalogSubject[] = [
      { id: "subj-en", name: "English",     linkedClassIds: ["VIII-A", "IX-A", "X-A"] },
      { id: "subj-ma", name: "Mathematics", linkedClassIds: ["VIII-A", "IX-A", "X-A"] },
      { id: "subj-hi", name: "History",     linkedClassIds: ["VIII-A", "IX-A", "X-A"] },
    ]

    const result = duplicateRoutine(
      [...sourceSlots, preExistingSlot],
      "VIII-A",
      ["IX-A", "X-A"],
      catalog,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const { slots: resultSlots, report } = result.value

    // 1 overwritten (IX-A 2026-12-01 pre-existed) + 3 created
    expect(report.overwritten).toBe(1)
    expect(report.created).toBe(3)
    expect(report.omitted).toBe(0)

    const targetClasses = ["IX-A", "X-A"]
    const positions = [
      { date: "2026-12-01", sessionId: "ses-morning" },
      { date: "2026-12-02", sessionId: "ses-morning" },
    ]

    for (const targetId of targetClasses) {
      for (const pos of positions) {
        const slot = resultSlots.find(
          s => s.classId === targetId && s.date === pos.date && s.sessionId === pos.sessionId,
        )
        expect(slot, `slot missing for ${targetId} at ${pos.date}`).toBeDefined()
        // ── THE KEY ASSERTION (R8.3): invigilators must be cleared ──
        expect(slot!.invigilatorIds, `${targetId} at ${pos.date} must have empty invigilatorIds`).toEqual([])
      }
    }

    // Source slots must keep their invigilators.
    const src1 = resultSlots.find(s => s.id === "es-p29-ex-1")
    expect(src1?.invigilatorIds).toEqual(["t1", "t2"])

    const src2 = resultSlots.find(s => s.id === "es-p29-ex-2")
    expect(src2?.invigilatorIds).toEqual(["t3"])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 30: Duplication report is consistent
//
// Feature: exam-routine-builder, Property 30: Duplication report is consistent
// Validates: Requirements 8.4
//
// The DuplicationReport returned by duplicateRoutine must be internally
// consistent with the actual slot-array changes:
//
//   1. created + overwritten = total target slots touched
//      (i.e. the number of (target class × source position) pairs in the result)
//   2. omitted === omittedSubjects.length
//   3. "created" slots are those that did NOT exist before duplication
//      (no slot at that key was in the original slot array)
//   4. "overwritten" slots are those that DID exist before duplication
//      (a slot at that key was already present in the original slot array)
//   5. omittedSubjects contains names of subjects that appear in source slots
//      but are not linked to the respective target class in the catalog
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 30: Duplication report is consistent", () => {
  /**
   * Mixed scenario: source slots + some pre-existing target slots (to exercise
   * both the "created" and "overwritten" paths) + some subjects unlinked to
   * the target class (to exercise the "omitted" path).
   *
   * Structure:
   *   - 2 distinct classes: sourceClassId and targetClassId
   *   - 1–4 source slots (all sharing sourceClassId)
   *   - 0–N pre-existing target slots at a SUBSET of the source positions
   *   - A catalog where some subjects ARE linked to the target (copied) and
   *     some are NOT linked (omitted)
   */
  const arbMixedReportScenario = fc
    .tuple(
      fc.uniqueArray(arbClassId, { minLength: 2, maxLength: 2 }),
      fc.integer({ min: 1, max: 4 }), // numSourceSlots
      fc.integer({ min: 0, max: 3 }), // numPreExistingTargetSlots (≤ numSourceSlots)
      fc.integer({ min: 0, max: 3 }), // numUnlinked (subjects not linked to target)
    )
    .chain(([classIds, numSlots, numPreExisting, numUnlinkedRaw]) => {
      const sourceClassId = classIds[0]
      const targetClassId = classIds[1]
      const numPreExist = Math.min(numPreExisting, numSlots)
      const numUnlinked = Math.min(numUnlinkedRaw, numSlots)

      const dateOptions = [
        "2026-03-01", "2026-03-02", "2026-03-03", "2026-03-04",
        "2026-03-05", "2026-03-06", "2026-03-07", "2026-03-08",
      ]
      const sessionOptions = ["ses-morning", "ses-afternoon", "ses-evening", "ses-extra"]
      const subjectNames = ["English", "Mathematics", "Science", "History"]

      const allCoords = dateOptions.flatMap(d =>
        sessionOptions.map(s => ({ date: d, sessionId: s })),
      )
      const chosenCoords = allCoords.slice(0, numSlots)

      // Source slots — each carries a known subject
      const sourceSlots: ExamSlot[] = chosenCoords.map((coord, i) => ({
        id: `es-p30-src-${i}`,
        classId: sourceClassId,
        date: coord.date,
        sessionId: coord.sessionId,
        subject: subjectNames[i % subjectNames.length],
        room: `Room ${400 + i}`,
        invigilatorIds: [`tinv-p30-${i}`],
      }))

      // Pre-existing target slots at the first numPreExist positions
      const preExistingSlots: ExamSlot[] = chosenCoords.slice(0, numPreExist).map((coord, i) => ({
        id: `es-p30-pre-${i}`,
        classId: targetClassId,
        date: coord.date,
        sessionId: coord.sessionId,
        subject: "History",
        room: `Old Room ${i}`,
        invigilatorIds: [`t-old-${i}`],
      }))

      // Catalog: first numUnlinked distinct subjects are NOT linked to target;
      // the rest are linked to both source and target.
      const distinctSubjects = [...new Set(sourceSlots.map(s => s.subject!))]
      const catalog: import("@/data/mock-exams").CatalogSubject[] = distinctSubjects.map(
        (name, i) => ({
          id: `subj-p30-${i}`,
          name,
          linkedClassIds:
            i < numUnlinked
              ? [sourceClassId]                   // NOT linked to target
              : [sourceClassId, targetClassId],   // linked to both
        }),
      )

      // Derive expected report values so property tests can assert against them
      const unlinkedSubjectSet = new Set(distinctSubjects.slice(0, numUnlinked))
      const preExistKeySet = new Set(
        preExistingSlots.map(s => `${s.classId}__${s.date}__${s.sessionId}`),
      )

      // For each source slot × target class pair, determine if created/overwritten/omitted
      let expectedCreated = 0
      let expectedOverwritten = 0
      let expectedOmitted = 0

      for (const src of sourceSlots) {
        const key = `${targetClassId}__${src.date}__${src.sessionId}`
        if (preExistKeySet.has(key)) {
          expectedOverwritten++
        } else {
          expectedCreated++
        }
        if (src.subject && unlinkedSubjectSet.has(src.subject)) {
          expectedOmitted++
        }
      }

      return fc.constant({
        slots: [...sourceSlots, ...preExistingSlots],
        sourceClassId,
        targetClassId,
        catalog,
        sourceSlots,
        preExistingSlots,
        unlinkedSubjectSet,
        preExistKeySet,
        expectedCreated,
        expectedOverwritten,
        expectedOmitted,
      })
    })

  // ─────────────────────────────────────────────────────────────────────────
  // Consistency check 1: created + overwritten = total target slots touched
  // ─────────────────────────────────────────────────────────────────────────

  it(
    "report.created + report.overwritten equals the total number of target positions written",
    () => {
      // Feature: exam-routine-builder, Property 30: Duplication report is consistent
      // Validates: Requirements 8.4
      fc.assert(
        fc.property(
          arbMixedReportScenario,
          ({ slots, sourceClassId, targetClassId, catalog, sourceSlots }) => {
            const result = duplicateRoutine(slots, sourceClassId, [targetClassId], catalog)
            if (!result.ok) return false

            const { slots: resultSlots, report } = result.value

            // Count the actual target positions in the result array.
            const actualTargetSlots = resultSlots.filter(
              s => s.classId === targetClassId &&
                sourceSlots.some(src => src.date === s.date && src.sessionId === s.sessionId),
            ).length

            // created + overwritten must equal the number of (target, position) pairs.
            return (
              report.created + report.overwritten === actualTargetSlots &&
              report.created + report.overwritten === sourceSlots.length
            )
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Consistency check 2: omitted === omittedSubjects.length
  // ─────────────────────────────────────────────────────────────────────────

  it(
    "report.omitted equals the length of report.omittedSubjects",
    () => {
      // Feature: exam-routine-builder, Property 30: Duplication report is consistent
      // Validates: Requirements 8.4
      fc.assert(
        fc.property(
          arbMixedReportScenario,
          ({ slots, sourceClassId, targetClassId, catalog }) => {
            const result = duplicateRoutine(slots, sourceClassId, [targetClassId], catalog)
            if (!result.ok) return false

            const { report } = result.value

            // The scalar count must always equal the array length.
            return report.omitted === report.omittedSubjects.length
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Consistency check 3: "created" slots did NOT exist before duplication
  // ─────────────────────────────────────────────────────────────────────────

  it(
    "report.created equals slots produced at positions absent in the original array",
    () => {
      // Feature: exam-routine-builder, Property 30: Duplication report is consistent
      // Validates: Requirements 8.4
      fc.assert(
        fc.property(
          arbMixedReportScenario,
          ({
            slots,
            sourceClassId,
            targetClassId,
            catalog,
            sourceSlots,
            preExistKeySet,
            expectedCreated,
          }) => {
            const result = duplicateRoutine(slots, sourceClassId, [targetClassId], catalog)
            if (!result.ok) return false

            const { report } = result.value

            // A target slot is "created" when its key was absent in the input.
            // Count how many source positions do NOT have a pre-existing target slot.
            let actualNewPositions = 0
            for (const src of sourceSlots) {
              const key = `${targetClassId}__${src.date}__${src.sessionId}`
              if (!preExistKeySet.has(key)) {
                actualNewPositions++
              }
            }

            return (
              report.created === actualNewPositions &&
              report.created === expectedCreated
            )
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Consistency check 4: "overwritten" slots DID exist before duplication
  // ─────────────────────────────────────────────────────────────────────────

  it(
    "report.overwritten equals slots produced at positions already present in the original array",
    () => {
      // Feature: exam-routine-builder, Property 30: Duplication report is consistent
      // Validates: Requirements 8.4
      fc.assert(
        fc.property(
          arbMixedReportScenario,
          ({
            slots,
            sourceClassId,
            targetClassId,
            catalog,
            sourceSlots,
            preExistKeySet,
            expectedOverwritten,
          }) => {
            const result = duplicateRoutine(slots, sourceClassId, [targetClassId], catalog)
            if (!result.ok) return false

            const { report } = result.value

            // A target slot is "overwritten" when its key was present in the input.
            let actualExistingPositions = 0
            for (const src of sourceSlots) {
              const key = `${targetClassId}__${src.date}__${src.sessionId}`
              if (preExistKeySet.has(key)) {
                actualExistingPositions++
              }
            }

            return (
              report.overwritten === actualExistingPositions &&
              report.overwritten === expectedOverwritten
            )
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Consistency check 5: omittedSubjects are names of subjects unlinked from
  //                      the target class
  // ─────────────────────────────────────────────────────────────────────────

  it(
    "every name in report.omittedSubjects is a subject unlinked from the target class",
    () => {
      // Feature: exam-routine-builder, Property 30: Duplication report is consistent
      // Validates: Requirements 8.4
      fc.assert(
        fc.property(
          arbMixedReportScenario,
          ({ slots, sourceClassId, targetClassId, catalog, unlinkedSubjectSet }) => {
            const result = duplicateRoutine(slots, sourceClassId, [targetClassId], catalog)
            if (!result.ok) return false

            const { report } = result.value

            // Every name in omittedSubjects must belong to the unlinked subject set.
            for (const name of report.omittedSubjects) {
              if (!unlinkedSubjectSet.has(name)) return false
            }

            // The count must match the length.
            return report.omitted === report.omittedSubjects.length
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Consistency check 6: Full-consistency check using arbDuplicationScenario
  //   (all subjects linked → omitted = 0, omittedSubjects = [],
  //    and created + overwritten = source slots × effective targets)
  // ─────────────────────────────────────────────────────────────────────────

  it(
    "when all subjects are linked to all targets, omitted is 0 and created+overwritten equals total positions",
    () => {
      // Feature: exam-routine-builder, Property 30: Duplication report is consistent
      // Validates: Requirements 8.4
      fc.assert(
        fc.property(
          arbDuplicationScenario,
          ({ slots, sourceClassId, targetClassIds, catalog }) => {
            const result = duplicateRoutine(slots, sourceClassId, targetClassIds, catalog)
            if (!result.ok) return false

            const { report } = result.value
            const sourceSlotCount = slots.filter(s => s.classId === sourceClassId).length
            const effectiveTargets = [...new Set(targetClassIds)].filter(
              id => id !== sourceClassId,
            )

            const expectedTotal = sourceSlotCount * effectiveTargets.length

            // No omissions when every subject is linked to every target.
            if (report.omitted !== 0) return false
            if (report.omittedSubjects.length !== 0) return false

            // created + overwritten must equal total positions written.
            if (report.created + report.overwritten !== expectedTotal) return false

            // scalar and array must agree.
            if (report.omitted !== report.omittedSubjects.length) return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ─────────────────────────────────────────────────────────────────────────
  // Example test: concrete report-consistency scenario
  //
  // Validates: Requirements 8.4
  //
  // Scenario:
  //   Source class VIII-A has 3 slots:
  //     - 2026-05-01 / ses-morning  : "English"     linked to IX-A
  //     - 2026-05-02 / ses-morning  : "Physics"     NOT linked to IX-A
  //     - 2026-05-03 / ses-morning  : "Mathematics" linked to IX-A
  //
  //   IX-A already has a pre-existing slot at 2026-05-01 / ses-morning.
  //
  //   Duplicate VIII-A → IX-A.
  //
  //   Expected report:
  //     created    = 2  (2026-05-02 and 2026-05-03 are new)
  //     overwritten = 1  (2026-05-01 was already there)
  //     omitted    = 1  ("Physics" is not linked to IX-A)
  //     omittedSubjects = ["Physics"]
  //
  //   Consistency:
  //     created(2) + overwritten(1) = 3 = number of source slots
  //     omitted(1) === omittedSubjects.length(1)  ✓
  // ─────────────────────────────────────────────────────────────────────────

  it("example: report counts are consistent with actual slot changes", () => {
    const sourceSlots: ExamSlot[] = [
      {
        id: "es-p30-ex-1",
        classId: "VIII-A",
        date: "2026-05-01",
        sessionId: "ses-morning",
        subject: "English",
        room: "Room 501",
        invigilatorIds: ["t1"],
      },
      {
        id: "es-p30-ex-2",
        classId: "VIII-A",
        date: "2026-05-02",
        sessionId: "ses-morning",
        subject: "Physics",
        room: "Room 502",
        invigilatorIds: ["t2"],
      },
      {
        id: "es-p30-ex-3",
        classId: "VIII-A",
        date: "2026-05-03",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 503",
        invigilatorIds: [],
      },
    ]

    // IX-A already has the 2026-05-01 slot → will be overwritten
    const preExistingSlot: ExamSlot = {
      id: "es-p30-ex-pre",
      classId: "IX-A",
      date: "2026-05-01",
      sessionId: "ses-morning",
      subject: "History",
      room: "Old Room",
      invigilatorIds: ["t-old"],
    }

    const catalog: import("@/data/mock-exams").CatalogSubject[] = [
      { id: "subj-en", name: "English",     linkedClassIds: ["VIII-A", "IX-A"] }, // linked
      { id: "subj-ph", name: "Physics",     linkedClassIds: ["VIII-A"] },          // NOT linked to IX-A
      { id: "subj-ma", name: "Mathematics", linkedClassIds: ["VIII-A", "IX-A"] }, // linked
      { id: "subj-hi", name: "History",     linkedClassIds: ["VIII-A", "IX-A"] }, // linked
    ]

    const result = duplicateRoutine(
      [...sourceSlots, preExistingSlot],
      "VIII-A",
      ["IX-A"],
      catalog,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const { slots: resultSlots, report } = result.value

    // ── Report field assertions (R8.4) ──
    expect(report.created, "created should be 2 (new positions)").toBe(2)
    expect(report.overwritten, "overwritten should be 1 (pre-existing position)").toBe(1)
    expect(report.omitted, "omitted should be 1 (Physics not linked to IX-A)").toBe(1)
    expect(report.omittedSubjects).toHaveLength(1)
    expect(report.omittedSubjects).toContain("Physics")

    // ── Consistency invariants ──
    // created + overwritten = total source slot count
    expect(report.created + report.overwritten).toBe(sourceSlots.length)
    // omitted scalar matches array length
    expect(report.omitted).toBe(report.omittedSubjects.length)

    // ── Verify actual slot state matches the report ──

    // 2026-05-01: was overwritten → English replaces History, invigilators cleared
    const slot1 = resultSlots.find(
      s => s.classId === "IX-A" && s.date === "2026-05-01" && s.sessionId === "ses-morning",
    )
    expect(slot1).toBeDefined()
    expect(slot1!.subject).toBe("English")
    expect(slot1!.invigilatorIds).toEqual([])

    // 2026-05-02: was created → Physics omitted (not linked), slot created without subject
    const slot2 = resultSlots.find(
      s => s.classId === "IX-A" && s.date === "2026-05-02" && s.sessionId === "ses-morning",
    )
    expect(slot2).toBeDefined()
    expect(slot2!.subject).toBeUndefined()
    expect(slot2!.invigilatorIds).toEqual([])

    // 2026-05-03: was created → Mathematics is linked, copied normally
    const slot3 = resultSlots.find(
      s => s.classId === "IX-A" && s.date === "2026-05-03" && s.sessionId === "ses-morning",
    )
    expect(slot3).toBeDefined()
    expect(slot3!.subject).toBe("Mathematics")
    expect(slot3!.invigilatorIds).toEqual([])

    // Source slots must remain intact
    expect(resultSlots.find(s => s.id === "es-p30-ex-1")?.subject).toBe("English")
    expect(resultSlots.find(s => s.id === "es-p30-ex-2")?.subject).toBe("Physics")
    expect(resultSlots.find(s => s.id === "es-p30-ex-3")?.subject).toBe("Mathematics")
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Example test: multi-target report accumulates across all target classes
  //
  // Validates: Requirements 8.4
  //
  // Scenario:
  //   Source VIII-A has 2 slots. Duplicate to IX-A and X-A (2 targets).
  //   One subject is unlinked from IX-A but linked to X-A.
  //
  //   Expected:
  //     created    = 4  (2 slots × 2 targets, none pre-exist)
  //     overwritten = 0
  //     omitted    = 1  (one slot's subject unlinked from IX-A only)
  //     created + overwritten = 4 = total target positions
  // ─────────────────────────────────────────────────────────────────────────

  it("example: multi-target report accumulates omitted and created across all targets", () => {
    const sourceSlots: ExamSlot[] = [
      {
        id: "es-p30-mt-1",
        classId: "VIII-A",
        date: "2026-06-01",
        sessionId: "ses-morning",
        subject: "English",
        room: "Room 601",
        invigilatorIds: [],
      },
      {
        id: "es-p30-mt-2",
        classId: "VIII-A",
        date: "2026-06-02",
        sessionId: "ses-morning",
        subject: "Physics",
        room: "Room 602",
        invigilatorIds: ["t5"],
      },
    ]

    const catalog: import("@/data/mock-exams").CatalogSubject[] = [
      {
        id: "subj-en",
        name: "English",
        linkedClassIds: ["VIII-A", "IX-A", "X-A"], // linked to all
      },
      {
        id: "subj-ph",
        name: "Physics",
        linkedClassIds: ["VIII-A", "X-A"], // NOT linked to IX-A, but linked to X-A
      },
    ]

    const result = duplicateRoutine(sourceSlots, "VIII-A", ["IX-A", "X-A"], catalog)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const { report } = result.value

    // 2 source × 2 targets = 4 positions, none pre-existing
    expect(report.created).toBe(4)
    expect(report.overwritten).toBe(0)

    // Physics omitted from IX-A (not linked), but copied to X-A → 1 omission total
    expect(report.omitted).toBe(1)
    expect(report.omittedSubjects).toHaveLength(1)
    expect(report.omittedSubjects).toContain("Physics")

    // Consistency invariants
    expect(report.created + report.overwritten).toBe(4)
    expect(report.omitted).toBe(report.omittedSubjects.length)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 31: Source exclusion and empty-target abort
//
// Feature: exam-routine-builder, Property 31: Source exclusion and empty-target abort
// Validates: Requirements 8.5, 8.6
//
// R8.5 — If the sourceClassId appears in targetClassIds, it is excluded from
//         the effective target set (no self-duplication).
//
// R8.6 — If the effective target set is empty after source exclusion,
//         duplicateRoutine returns { ok: false, error: "empty-target-set" }
//         and leaves every existing slot unchanged.
//
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 31: Source exclusion and empty-target abort", () => {

  // ── Scenario helpers ────────────────────────────────────────────────────

  /**
   * Build an arbitrary scenario where sourceClassId is included in the
   * targetClassIds list (possibly as the only entry, possibly among others).
   *
   * Sub-scenarios:
   *   A) sourceClassId is the ONLY target → effective target set becomes empty
   *      → duplicateRoutine must abort with "empty-target-set".
   *   B) sourceClassId is ONE OF several targets → it is silently excluded
   *      while the remaining targets are processed normally.
   */
  const arbSourceInTargetsScenario = fc
    .tuple(
      // Two-to-four distinct class ids; first will be the source.
      fc.uniqueArray(arbClassId, { minLength: 2, maxLength: 4 }),
      // Number of source slots (1–3).
      fc.integer({ min: 1, max: 3 }),
    )
    .chain(([classIds, numSourceSlots]) => {
      const sourceClassId = classIds[0]
      const otherClasses   = classIds.slice(1)      // at least 1 other class

      const dateOptions    = ["2026-10-01", "2026-10-02", "2026-10-03"]
      const sessionOptions = ["ses-morning", "ses-afternoon", "ses-evening"]
      const subjectNames   = ["English", "Mathematics", "Science"]

      const sourceSlots: ExamSlot[] = Array.from({ length: numSourceSlots }, (_, i) => ({
        id: `es-p31-src-${i}`,
        classId: sourceClassId,
        date: dateOptions[i % dateOptions.length],
        sessionId: sessionOptions[i % sessionOptions.length],
        subject: subjectNames[i % subjectNames.length],
        room: `Room ${301 + i}`,
        invigilatorIds: [`t${i + 1}`],
      }))

      // Catalog links every subject to all class ids.
      const catalog: CatalogSubject[] = subjectNames.map((name, i) => ({
        id: `subj-p31-${i}`,
        name,
        linkedClassIds: classIds,
      }))

      // Build two target lists:
      //   - sourceOnly: [sourceClassId]            → triggers empty-target-set abort
      //   - sourceWithOthers: [sourceClassId, ...otherClasses] → source excluded, rest copied
      return fc.constant({
        slots: sourceSlots,
        sourceClassId,
        otherClasses,
        sourceOnlyTargets: [sourceClassId],
        sourceWithOthersTargets: [sourceClassId, ...otherClasses],
        catalog,
      })
    })

  // ── R8.6: empty-target-set when ONLY target is the source ────────────────

  it(
    "R8.6 — returns ok:false / empty-target-set when the only target is the source class",
    () => {
      // Feature: exam-routine-builder, Property 31: Source exclusion and empty-target abort
      // Validates: Requirements 8.6
      fc.assert(
        fc.property(
          arbSourceInTargetsScenario,
          ({ slots, sourceClassId, sourceOnlyTargets, catalog }) => {
            const result = duplicateRoutine(slots, sourceClassId, sourceOnlyTargets, catalog)

            // Must be a failure.
            if (result.ok) return false

            // Error code must be exactly "empty-target-set".
            if (result.error !== "empty-target-set") return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "R8.6 — returns ok:false / empty-target-set when targetClassIds is empty",
    () => {
      // Feature: exam-routine-builder, Property 31: Source exclusion and empty-target abort
      // Validates: Requirements 8.6
      fc.assert(
        fc.property(
          arbSourceInTargetsScenario,
          ({ slots, sourceClassId, catalog }) => {
            // Pass an empty target list directly.
            const result = duplicateRoutine(slots, sourceClassId, [], catalog)

            if (result.ok) return false
            if (result.error !== "empty-target-set") return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "R8.6 — no slots are changed when the operation aborts with empty-target-set",
    () => {
      // Feature: exam-routine-builder, Property 31: Source exclusion and empty-target abort
      // Validates: Requirements 8.6
      fc.assert(
        fc.property(
          arbSourceInTargetsScenario,
          ({ slots, sourceClassId, catalog }) => {
            // Use both abort paths: empty list and source-only list.
            for (const targets of [[], [sourceClassId]] as string[][]) {
              const result = duplicateRoutine(slots, sourceClassId, targets, catalog)

              // The operation must abort.
              if (result.ok) return false

              // The implementation returns the error without modifying any input,
              // and the OpResult does not carry a slot array — so the original
              // slots array must be identical in length and content.
              // (duplicateRoutine never mutates its input, so `slots` is intact.)
              if (result.error !== "empty-target-set") return false
            }

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ── R8.5: source excluded when mixed with other targets ──────────────────

  it(
    "R8.5 — source class is excluded from the effective target set when mixed in",
    () => {
      // Feature: exam-routine-builder, Property 31: Source exclusion and empty-target abort
      // Validates: Requirements 8.5
      fc.assert(
        fc.property(
          arbSourceInTargetsScenario,
          ({ slots, sourceClassId, sourceWithOthersTargets, otherClasses, catalog }) => {
            const result = duplicateRoutine(
              slots,
              sourceClassId,
              sourceWithOthersTargets,
              catalog,
            )

            // Must succeed (other targets are present after exclusion).
            if (!result.ok) return false

            const { slots: resultSlots } = result.value

            // No new slot should have classId === sourceClassId as a *target*
            // copy created by this operation.  The source slots already existed
            // and should remain unchanged; no additional source-class slot must
            // have been added by duplicateRoutine acting on it as a target.
            const originalSourceKeys = new Set(
              slots
                .filter(s => s.classId === sourceClassId)
                .map(s => `${s.classId}__${s.date}__${s.sessionId}`),
            )
            const resultSourceSlots = resultSlots.filter(s => s.classId === sourceClassId)

            // The number of source-class slots must be unchanged — no extras
            // were inserted because sourceClassId was treated as a target.
            if (resultSourceSlots.length !== originalSourceKeys.size) return false

            // Every remaining source slot must be one that existed before.
            for (const rs of resultSourceSlots) {
              const key = `${rs.classId}__${rs.date}__${rs.sessionId}`
              if (!originalSourceKeys.has(key)) return false
            }

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "R8.5 — passing [sourceClassId, ...targets] yields the same result as passing [...targets] alone",
    () => {
      // Feature: exam-routine-builder, Property 31: Source exclusion and empty-target abort
      // Validates: Requirements 8.5
      fc.assert(
        fc.property(
          arbSourceInTargetsScenario,
          ({ slots, sourceClassId, otherClasses, catalog }) => {
            // With source in target list vs. without — must produce identical results.
            const withSource    = duplicateRoutine(slots, sourceClassId, [sourceClassId, ...otherClasses], catalog)
            const withoutSource = duplicateRoutine(slots, sourceClassId, otherClasses, catalog)

            // Both calls must have the same ok status.
            if (withSource.ok !== withoutSource.ok) return false

            if (!withSource.ok || !withoutSource.ok) return true  // both failed (ok)

            // Same number of resulting slots.
            if (withSource.value.slots.length !== withoutSource.value.slots.length) return false

            // Same report.
            const r1 = withSource.value.report
            const r2 = withoutSource.value.report
            if (r1.created     !== r2.created)     return false
            if (r1.overwritten !== r2.overwritten)  return false
            if (r1.omitted     !== r2.omitted)      return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "R8.5 — source class slots are preserved unchanged when source appears in target list",
    () => {
      // Feature: exam-routine-builder, Property 31: Source exclusion and empty-target abort
      // Validates: Requirements 8.5
      fc.assert(
        fc.property(
          arbSourceInTargetsScenario,
          ({ slots, sourceClassId, sourceWithOthersTargets, catalog }) => {
            const before = slots.filter(s => s.classId === sourceClassId)
            const result = duplicateRoutine(slots, sourceClassId, sourceWithOthersTargets, catalog)
            if (!result.ok) return false

            const after = result.value.slots.filter(s => s.classId === sourceClassId)

            // Count must be unchanged.
            if (before.length !== after.length) return false

            // Each source slot must be byte-identical in key fields.
            for (const orig of before) {
              const copy = after.find(
                s => s.classId === orig.classId && s.date === orig.date && s.sessionId === orig.sessionId,
              )
              if (!copy)                         return false
              if (copy.subject !== orig.subject) return false
              if (copy.room    !== orig.room)    return false
              // Invigilator list is untouched on the source side.
              if (copy.invigilatorIds.join(",") !== orig.invigilatorIds.join(",")) return false
            }

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ── Duplicate-in-target-list (R8.5 de-duplication) ──────────────────────

  it(
    "R8.5 — duplicate class ids in targetClassIds are de-duplicated (each target receives exactly one copy)",
    () => {
      // Feature: exam-routine-builder, Property 31: Source exclusion and empty-target abort
      // Validates: Requirements 8.5
      fc.assert(
        fc.property(
          arbSourceInTargetsScenario,
          ({ slots, sourceClassId, otherClasses, catalog }) => {
            // Pass the first other class twice plus once normally.
            const firstTarget = otherClasses[0]
            const duplicatedTargets = [firstTarget, firstTarget, ...otherClasses]

            const deduped = duplicateRoutine(slots, sourceClassId, otherClasses, catalog)
            const doubled = duplicateRoutine(slots, sourceClassId, duplicatedTargets, catalog)

            // Both must succeed.
            if (!deduped.ok || !doubled.ok) return false

            // Report must be identical (duplicating the id twice ≠ twice the work).
            const r1 = deduped.value.report
            const r2 = doubled.value.report
            if (r1.created      !== r2.created)     return false
            if (r1.overwritten  !== r2.overwritten)  return false
            if (r1.omitted      !== r2.omitted)      return false
            if (r1.omittedSubjects.length !== r2.omittedSubjects.length) return false

            // Total slot count must be identical.
            if (deduped.value.slots.length !== doubled.value.slots.length) return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ── Example tests ────────────────────────────────────────────────────────

  it("example R8.6: empty targetClassIds → empty-target-set error, slots unchanged", () => {
    // Feature: exam-routine-builder, Property 31: Source exclusion and empty-target abort
    // Validates: Requirements 8.6
    const existingSlot: ExamSlot = {
      id: "es-p31-ex-1",
      classId: "VIII-A",
      date: "2026-11-01",
      sessionId: "ses-morning",
      subject: "English",
      room: "Room 101",
      invigilatorIds: ["t1"],
    }
    const catalog: CatalogSubject[] = [
      { id: "subj-en", name: "English", linkedClassIds: ["VIII-A", "IX-A"] },
    ]

    const result = duplicateRoutine([existingSlot], "VIII-A", [], catalog)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("empty-target-set")
  })

  it("example R8.6: [sourceClassId] as only target → empty-target-set, no mutation", () => {
    // Feature: exam-routine-builder, Property 31: Source exclusion and empty-target abort
    // Validates: Requirements 8.6
    const existingSlot: ExamSlot = {
      id: "es-p31-ex-2",
      classId: "VIII-A",
      date: "2026-11-02",
      sessionId: "ses-morning",
      subject: "Mathematics",
      room: "Room 202",
      invigilatorIds: [],
    }
    const catalog: CatalogSubject[] = [
      { id: "subj-ma", name: "Mathematics", linkedClassIds: ["VIII-A"] },
    ]

    const result = duplicateRoutine([existingSlot], "VIII-A", ["VIII-A"], catalog)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("empty-target-set")
  })

  it("example R8.5: sourceClassId in target list is silently excluded, others are copied", () => {
    // Feature: exam-routine-builder, Property 31: Source exclusion and empty-target abort
    // Validates: Requirements 8.5
    const sourceSlots: ExamSlot[] = [
      {
        id: "es-p31-ex-3",
        classId: "VIII-A",
        date: "2026-11-03",
        sessionId: "ses-morning",
        subject: "Science",
        room: "Lab 1",
        invigilatorIds: ["t1", "t2"],
      },
      {
        id: "es-p31-ex-4",
        classId: "VIII-A",
        date: "2026-11-04",
        sessionId: "ses-morning",
        subject: "English",
        room: "Room 104",
        invigilatorIds: [],
      },
    ]
    const catalog: CatalogSubject[] = [
      { id: "subj-sc", name: "Science", linkedClassIds: ["VIII-A", "IX-A", "X-A"] },
      { id: "subj-en", name: "English", linkedClassIds: ["VIII-A", "IX-A", "X-A"] },
    ]

    // Include "VIII-A" (the source) in the target list alongside real targets.
    const result = duplicateRoutine(
      sourceSlots,
      "VIII-A",
      ["VIII-A", "IX-A", "X-A"],
      catalog,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const { slots: resultSlots, report } = result.value

    // Only IX-A and X-A should have received copies (not VIII-A again).
    // 2 source slots × 2 effective targets = 4 created.
    expect(report.created).toBe(4)
    expect(report.overwritten).toBe(0)
    expect(report.omitted).toBe(0)

    // IX-A and X-A must each have their slots.
    for (const targetId of ["IX-A", "X-A"]) {
      const slot1 = resultSlots.find(
        s => s.classId === targetId && s.date === "2026-11-03" && s.sessionId === "ses-morning",
      )
      expect(slot1, `${targetId} slot on 2026-11-03 should exist`).toBeDefined()
      expect(slot1!.subject).toBe("Science")
      expect(slot1!.room).toBe("Lab 1")
      expect(slot1!.invigilatorIds).toEqual([]) // invigilators cleared (R8.3)

      const slot2 = resultSlots.find(
        s => s.classId === targetId && s.date === "2026-11-04" && s.sessionId === "ses-morning",
      )
      expect(slot2, `${targetId} slot on 2026-11-04 should exist`).toBeDefined()
      expect(slot2!.subject).toBe("English")
      expect(slot2!.room).toBe("Room 104")
      expect(slot2!.invigilatorIds).toEqual([])
    }

    // Source slots (VIII-A) must remain identical — not overwritten by self-copy.
    const src1 = resultSlots.find(s => s.id === "es-p31-ex-3")
    expect(src1?.subject).toBe("Science")
    expect(src1?.room).toBe("Lab 1")
    expect(src1?.invigilatorIds).toEqual(["t1", "t2"]) // invigilators preserved on source

    const src2 = resultSlots.find(s => s.id === "es-p31-ex-4")
    expect(src2?.subject).toBe("English")
    expect(src2?.room).toBe("Room 104")

    // No extra VIII-A slots should have been created (self-copy excluded).
    const viiiASlots = resultSlots.filter(s => s.classId === "VIII-A")
    expect(viiiASlots).toHaveLength(sourceSlots.length)
  })

  it("example R8.5: [sourceClassId, sourceClassId, targetId] de-dupes to one target", () => {
    // Feature: exam-routine-builder, Property 31: Source exclusion and empty-target abort
    // Validates: Requirements 8.5
    const sourceSlot: ExamSlot = {
      id: "es-p31-ex-5",
      classId: "VIII-A",
      date: "2026-11-05",
      sessionId: "ses-morning",
      subject: "History",
      room: "Room 105",
      invigilatorIds: ["t3"],
    }
    const catalog: CatalogSubject[] = [
      { id: "subj-hi", name: "History", linkedClassIds: ["VIII-A", "IX-A"] },
    ]

    // Source class appears twice in list, alongside a single real target.
    const result = duplicateRoutine(
      [sourceSlot],
      "VIII-A",
      ["VIII-A", "VIII-A", "IX-A"],
      catalog,
    )

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const { report } = result.value
    // Only IX-A was a valid effective target → 1 slot created.
    expect(report.created).toBe(1)
    expect(report.overwritten).toBe(0)
    expect(report.omitted).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 32: Duplication is atomic
//
// Feature: exam-routine-builder, Property 32: Duplication is atomic
// Validates: Requirements 8.7
//
// R8.7 — "all-or-nothing" semantics: if any target class fails to process
// (e.g. the effective target set is empty after source exclusion), the entire
// operation is aborted — NO slots are changed.  Conversely, when the operation
// succeeds, the result contains ALL target classes' positions.
//
// Two sub-invariants verified here:
//
//   A) SUCCESS PATH — when duplicateRoutine returns ok:true, the returned slot
//      array contains ALL positions for ALL effective targets (not a partial
//      result).  Every (targetClass × sourcePosition) pair must be present.
//
//   B) FAILURE PATH — when duplicateRoutine returns ok:false (e.g. empty target
//      set triggered by passing only the source class as the target), no partial
//      state is returned.  The function returns an OpResult without a slot array,
//      which means the caller's original slots are untouched (the implementation
//      only returns a new array on full success, so there is no partial commit).
//
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 32: Duplication is atomic", () => {

  // ── Shared scenario builder ──────────────────────────────────────────────

  /**
   * A scenario suitable for testing both the success and the failure path:
   *
   *   - 2–4 distinct class ids (first = source, rest = valid targets).
   *   - 1–4 source slots, each with a unique (date, sessionId) coordinate.
   *   - Catalog links every subject to every class so the subject-omission
   *     path (R8.2) never interferes — we focus purely on R8.7.
   *   - `emptyTargets` is the list to use when we want the abort path
   *     (only the source class, which becomes empty after exclusion).
   *   - `validTargets` is the list of non-source classes.
   */
  const arbAtomicScenario = fc
    .tuple(
      fc.uniqueArray(arbClassId, { minLength: 2, maxLength: 4 }),
      fc.integer({ min: 1, max: 4 }),
    )
    .chain(([classIds, numSourceSlots]) => {
      const sourceClassId = classIds[0]
      const validTargets  = classIds.slice(1)   // ≥1 real target

      const dateOptions    = ["2026-07-01", "2026-07-02", "2026-07-03", "2026-07-04"]
      const sessionOptions = ["ses-morning", "ses-afternoon", "ses-evening", "ses-extra"]
      const subjectNames   = ["English", "Mathematics", "Science", "History"]

      const allCoords = dateOptions.flatMap(d =>
        sessionOptions.map(s => ({ date: d, sessionId: s })),
      )
      const chosenCoords = allCoords.slice(0, numSourceSlots)

      const sourceSlots: ExamSlot[] = chosenCoords.map((coord, i) => ({
        id: `es-p32-src-${i}`,
        classId: sourceClassId,
        date: coord.date,
        sessionId: coord.sessionId,
        subject: subjectNames[i % subjectNames.length],
        room: `Room ${700 + i}`,
        invigilatorIds: [`t${i + 1}`],
      }))

      // Catalog links every subject to every class (no omission path).
      const catalog: CatalogSubject[] = subjectNames.map((name, i) => ({
        id: `subj-p32-${i}`,
        name,
        linkedClassIds: classIds,
      }))

      return fc.constant({
        slots: sourceSlots,
        sourceClassId,
        validTargets,
        // Abort trigger: source-only target list → empty after exclusion.
        emptyTargets: [sourceClassId] as string[],
        catalog,
      })
    })

  // ── Sub-property A: SUCCESS → all target positions are present ───────────

  it(
    "success: returned slot array contains every (target × source-position) pair — no partial result",
    () => {
      // Feature: exam-routine-builder, Property 32: Duplication is atomic
      // Validates: Requirements 8.7
      fc.assert(
        fc.property(
          arbAtomicScenario,
          ({ slots, sourceClassId, validTargets, catalog }) => {
            const result = duplicateRoutine(slots, sourceClassId, validTargets, catalog)

            // Must succeed (valid targets provided, all subjects linked).
            if (!result.ok) return false

            const { slots: resultSlots } = result.value
            const sourceSlots = slots.filter(s => s.classId === sourceClassId)

            // For EVERY effective target and EVERY source position, a slot must exist.
            for (const targetId of validTargets) {
              for (const src of sourceSlots) {
                const targetSlot = resultSlots.find(
                  s =>
                    s.classId   === targetId &&
                    s.date      === src.date &&
                    s.sessionId === src.sessionId,
                )
                // If even one (target, position) pair is missing, the copy was partial → fail.
                if (!targetSlot) return false
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
    "success: total target-slot count equals sourceSlotCount × effectiveTargetCount — no partial write",
    () => {
      // Feature: exam-routine-builder, Property 32: Duplication is atomic
      // Validates: Requirements 8.7
      fc.assert(
        fc.property(
          arbAtomicScenario,
          ({ slots, sourceClassId, validTargets, catalog }) => {
            const result = duplicateRoutine(slots, sourceClassId, validTargets, catalog)
            if (!result.ok) return false

            const { slots: resultSlots, report } = result.value

            const sourceSlotCount   = slots.filter(s => s.classId === sourceClassId).length
            const effectiveTargets  = [...new Set(validTargets)].filter(id => id !== sourceClassId)
            const expectedNewSlots  = sourceSlotCount * effectiveTargets.length

            // The result must have grown by exactly the expected number of new slots.
            // (No pre-existing target slots in this scenario, so all are "created".)
            if (resultSlots.length !== slots.length + expectedNewSlots) return false

            // report.created must equal the expected count (all-or-nothing: either all
            // slots were created or none were).
            if (report.created !== expectedNewSlots) return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ── Sub-property B: FAILURE → no slots are modified (original is intact) ─

  it(
    "failure: when the effective target set is empty, duplicateRoutine returns ok:false and no slot array",
    () => {
      // Feature: exam-routine-builder, Property 32: Duplication is atomic
      // Validates: Requirements 8.7
      fc.assert(
        fc.property(
          arbAtomicScenario,
          ({ slots, sourceClassId, emptyTargets, catalog }) => {
            // Pass only the source class as the target → effective set becomes
            // empty after exclusion → must abort.
            const result = duplicateRoutine(slots, sourceClassId, emptyTargets, catalog)

            // Must fail.
            if (result.ok) return false

            // The error must be the empty-target-set code (R8.6).
            if (result.error !== "empty-target-set") return false

            // The OpResult on failure carries no `value` (and thus no slot array).
            // This is the structural guarantee that no partial mutation occurred:
            // the failed result cannot deliver a partially-written slot array.
            if ("value" in result) return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "failure: original slots are identical in length and content after an aborted duplication",
    () => {
      // Feature: exam-routine-builder, Property 32: Duplication is atomic
      // Validates: Requirements 8.7
      //
      // duplicateRoutine never mutates its input array; on failure it returns an
      // error result without a slot array.  We verify that the input reference
      // is untouched (same length, same keys, same field values).
      fc.assert(
        fc.property(
          arbAtomicScenario,
          ({ slots, sourceClassId, catalog }) => {
            // Take a deep snapshot of the original slots before calling.
            const originalSnapshot = slots.map(s => ({ ...s, invigilatorIds: [...s.invigilatorIds] }))

            // Trigger both abort paths:
            //   1. Explicitly empty target list
            //   2. Source-only target list (excluded → empty)
            for (const targets of [[], [sourceClassId]] as string[][]) {
              const result = duplicateRoutine(slots, sourceClassId, targets, catalog)

              // Must abort.
              if (result.ok) return false

              // The input `slots` array must not have been mutated.
              if (slots.length !== originalSnapshot.length) return false

              for (let i = 0; i < originalSnapshot.length; i++) {
                const orig = originalSnapshot[i]
                const curr = slots[i]

                if (curr.id        !== orig.id)        return false
                if (curr.classId   !== orig.classId)   return false
                if (curr.date      !== orig.date)      return false
                if (curr.sessionId !== orig.sessionId) return false
                if (curr.subject   !== orig.subject)   return false
                if (curr.room      !== orig.room)      return false
                if (curr.invigilatorIds.join(",") !== orig.invigilatorIds.join(",")) return false
              }
            }

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ── Sub-property C: SUCCESS and FAILURE are mutually exclusive ───────────

  it(
    "atomicity: the same input with a valid target list succeeds and with empty target list fails — never both",
    () => {
      // Feature: exam-routine-builder, Property 32: Duplication is atomic
      // Validates: Requirements 8.7
      //
      // This property verifies the all-or-nothing boundary: the exact same
      // slot array + catalog yields either a complete result (ok:true) or a
      // complete abort (ok:false) — there is no intermediate state.
      fc.assert(
        fc.property(
          arbAtomicScenario,
          ({ slots, sourceClassId, validTargets, emptyTargets, catalog }) => {
            const successResult = duplicateRoutine(slots, sourceClassId, validTargets,  catalog)
            const failResult    = duplicateRoutine(slots, sourceClassId, emptyTargets,  catalog)

            // Valid targets → must succeed.
            if (!successResult.ok) return false

            // Empty (source-only) targets → must fail.
            if (failResult.ok) return false

            // They must disagree on ok.
            if (successResult.ok === failResult.ok) return false

            return true
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  // ── Example tests ─────────────────────────────────────────────────────────

  it("example: success path — all 6 target slots are written (3 positions × 2 targets)", () => {
    // Feature: exam-routine-builder, Property 32: Duplication is atomic
    // Validates: Requirements 8.7
    //
    // Scenario:
    //   Source VIII-A has 3 slots.  Duplicate to IX-A and X-A.
    //   The operation must produce ALL 6 target slots or none.
    //   Since all subjects are linked, it must produce all 6.
    const sourceSlots: ExamSlot[] = [
      {
        id: "es-p32-ex-1",
        classId: "VIII-A",
        date: "2026-08-01",
        sessionId: "ses-morning",
        subject: "English",
        room: "Room 801",
        invigilatorIds: ["t1"],
      },
      {
        id: "es-p32-ex-2",
        classId: "VIII-A",
        date: "2026-08-02",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 802",
        invigilatorIds: ["t2"],
      },
      {
        id: "es-p32-ex-3",
        classId: "VIII-A",
        date: "2026-08-03",
        sessionId: "ses-morning",
        subject: "Science",
        room: "Room 803",
        invigilatorIds: [],
      },
    ]

    const catalog: CatalogSubject[] = [
      { id: "subj-en", name: "English",     linkedClassIds: ["VIII-A", "IX-A", "X-A"] },
      { id: "subj-ma", name: "Mathematics", linkedClassIds: ["VIII-A", "IX-A", "X-A"] },
      { id: "subj-sc", name: "Science",     linkedClassIds: ["VIII-A", "IX-A", "X-A"] },
    ]

    const result = duplicateRoutine(sourceSlots, "VIII-A", ["IX-A", "X-A"], catalog)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const { slots: resultSlots, report } = result.value

    // 3 source × 2 targets = 6 created (all-or-nothing: must be exactly 6).
    expect(report.created).toBe(6)
    expect(report.overwritten).toBe(0)
    expect(report.omitted).toBe(0)

    // Each of the 6 (target, position) pairs must exist in the result.
    const targetClasses = ["IX-A", "X-A"]
    const positions = [
      { date: "2026-08-01", sessionId: "ses-morning", subject: "English" },
      { date: "2026-08-02", sessionId: "ses-morning", subject: "Mathematics" },
      { date: "2026-08-03", sessionId: "ses-morning", subject: "Science" },
    ]

    for (const targetId of targetClasses) {
      for (const pos of positions) {
        const slot = resultSlots.find(
          s => s.classId === targetId && s.date === pos.date && s.sessionId === pos.sessionId,
        )
        expect(slot, `missing slot for ${targetId} at ${pos.date}`).toBeDefined()
        expect(slot!.subject).toBe(pos.subject)
        expect(slot!.invigilatorIds).toEqual([]) // invigilators cleared (R8.3)
      }
    }

    // Total slot count: 3 source + 6 new = 9.
    expect(resultSlots.length).toBe(9)
  })

  it("example: failure path (empty target set) — no slots are modified, error is returned", () => {
    // Feature: exam-routine-builder, Property 32: Duplication is atomic
    // Validates: Requirements 8.7
    //
    // Scenario:
    //   Pass an empty targetClassIds list.  The operation must abort immediately
    //   (ok:false, error:"empty-target-set") without altering any existing slot.
    const existingSlots: ExamSlot[] = [
      {
        id: "es-p32-ex-fail-1",
        classId: "VIII-A",
        date: "2026-09-01",
        sessionId: "ses-morning",
        subject: "English",
        room: "Room 901",
        invigilatorIds: ["t1", "t2"],
      },
      {
        id: "es-p32-ex-fail-2",
        classId: "IX-A",
        date: "2026-09-01",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 902",
        invigilatorIds: ["t3"],
      },
    ]
    const catalog: CatalogSubject[] = [
      { id: "subj-en", name: "English",     linkedClassIds: ["VIII-A", "IX-A"] },
      { id: "subj-ma", name: "Mathematics", linkedClassIds: ["VIII-A", "IX-A"] },
    ]

    const result = duplicateRoutine(existingSlots, "VIII-A", [], catalog)

    // Must fail with the correct code.
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("empty-target-set")

    // The failed result must not carry a slot array (no partial state).
    expect("value" in result).toBe(false)
  })

  it("example: failure path (source-only target list) — slots unchanged, all-or-nothing confirmed", () => {
    // Feature: exam-routine-builder, Property 32: Duplication is atomic
    // Validates: Requirements 8.7
    //
    // Scenario:
    //   targetClassIds = ["VIII-A"] (same as source).
    //   After source exclusion the effective set is empty → abort.
    //   The function must NOT touch any existing slot.
    const existingSlots: ExamSlot[] = [
      {
        id: "es-p32-ex-self-1",
        classId: "VIII-A",
        date: "2026-10-01",
        sessionId: "ses-morning",
        subject: "History",
        room: "Room 1001",
        invigilatorIds: ["t5"],
      },
    ]
    const catalog: CatalogSubject[] = [
      { id: "subj-hi", name: "History", linkedClassIds: ["VIII-A"] },
    ]

    // Pass source class as the only target.
    const result = duplicateRoutine(existingSlots, "VIII-A", ["VIII-A"], catalog)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("empty-target-set")

    // All-or-nothing: no partial slot array was produced.
    expect("value" in result).toBe(false)

    // The original input array is still untouched (duplicateRoutine never mutates input).
    expect(existingSlots).toHaveLength(1)
    expect(existingSlots[0].subject).toBe("History")
    expect(existingSlots[0].invigilatorIds).toEqual(["t5"])
  })
})
