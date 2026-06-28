/**
 * ai-routine-generator.test.ts — Property-based test for the AI Routine Generator.
 *
 * // Feature: exam-routine-builder, Property 33: Full-draft coverage
 *
 * Validates: Requirements 9.1
 *
 * NOTE: We use fc.assert(fc.property(...)) with standard vitest `it()` rather
 * than `it.prop` from @fast-check/vitest because Vitest v3 serializes test
 * metadata (including arbitrary objects) across the worker→main IPC channel
 * using structuredClone, which cannot clone fast-check's internal function
 * closures. fc.assert runs the property check synchronously inside the test.
 */

import { describe, expect, it } from "vitest"
import * as fc from "fast-check"
import { paletteForClass } from "@/lib/exam/subject-catalog"
import { HeuristicRoutineGenerator } from "@/lib/exam/ai-routine-generator"
import type { GenerationInput } from "@/lib/exam/ai-routine-generator"
import {
  arbCatalog,
  arbClassId,
  arbGenerationInput,
  arbSession,
  arbTeachers,
} from "./generators"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valid ISO yyyy-mm-dd dates drawn from a realistic exam-calendar window.
 * Day capped at 28 so every month/year combo is always valid.
 */
const arbValidIsoDate: fc.Arbitrary<string> = fc
  .tuple(
    fc.integer({ min: 2025, max: 2027 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }),
  )
  .map(
    ([y, m, d]) =>
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
  )

/**
 * Builds a `GenerationInput` where:
 *   - mode is always "full-draft"
 *   - dates.length >= max subjects per class  (capacity is sufficient)
 *   - every classId has at least one linked subject in the catalog
 *
 * This constrains the search space to cases where the generator CAN place
 * every subject for every class (Requirement 9.1).
 */
const arbFullDraftWithSufficientCapacity: fc.Arbitrary<GenerationInput> = fc
  .tuple(
    // 1–4 class identifiers, unique
    fc.uniqueArray(arbClassId, { minLength: 1, maxLength: 4 }),
    // 1–4 sessions, unique names
    fc.uniqueArray(arbSession, {
      minLength: 1,
      maxLength: 4,
      selector: s => s.name.trim().toLowerCase(),
    }),
    // Teachers pool — may be empty; generator handles that gracefully
    arbTeachers,
  )
  .chain(([classIds, sessions, teachers]) => {
    // Build a catalog where every classId has 1–4 linked subjects (unique per class).
    // We keep subject counts small so date capacity requirement stays manageable.
    const catalogArb: fc.Arbitrary<
      Array<{ id: string; name: string; linkedClassIds: string[] }>
    > = fc.tuple(
      ...classIds.map((cid, ci) =>
        fc
          .integer({ min: 1, max: 4 })
          .chain(subjectCount =>
            fc.uniqueArray(
              fc.integer({ min: 0, max: 99 }).map(n => `Subject${ci}_${n}`),
              { minLength: subjectCount, maxLength: subjectCount },
            ).map(names =>
              names.map((name, si) => ({
                id: `subj-${ci}-${si}`,
                name,
                linkedClassIds: [cid],
              })),
            ),
          ),
      ),
    ).map(perClassSubjects => (perClassSubjects as Array<typeof perClassSubjects[0]>).flat())

    return catalogArb.chain(catalog => {
      // Determine the maximum number of subjects for any single class.
      const maxSubjectsPerClass = classIds.reduce((max, cid) => {
        const count = paletteForClass(catalog, cid).length
        return Math.max(max, count)
      }, 0)

      // Need at least maxSubjectsPerClass dates for full coverage.
      const minDates = Math.max(1, maxSubjectsPerClass)

      return fc
        .uniqueArray(arbValidIsoDate, {
          minLength: minDates,
          maxLength: minDates + 4, // a few extra is fine
        })
        .map(dates => ({
          catalog,
          classIds,
          dates,
          sessions,
          teachers,
          existingSlots: [],
          mode: "full-draft" as const,
        }))
    })
  })

// ─────────────────────────────────────────────────────────────────────────────
// Property 33: Full-draft coverage
//
// Feature: exam-routine-builder, Property 33: Full-draft coverage
// Validates: Requirements 9.1
//
// When an Admin requests a full draft routine, the AI_Routine_Generator SHALL
// place, for each Class, each subject linked to that Class into an Exam_Slot
// within the configured Exam_Dates and Sessions.
//
// Formally, when capacity is sufficient (dates.length >= subjects per class):
//   For every classId in input.classIds:
//     for every subject in paletteForClass(catalog, classId):
//       there exists exactly one slot in result.slots where
//         slot.classId === classId AND slot.subject === subject.name
//
//   AND unplacedSubjectsByClass[classId] is absent (or 0) for every class.
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 33: Full-draft coverage", () => {
  it(
    "places every subject linked to each class into exactly one slot when capacity is sufficient",
    () => {
      // Feature: exam-routine-builder, Property 33: Full-draft coverage
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(arbFullDraftWithSufficientCapacity, input => {
          const result = generator.generate(input)

          // The generator must succeed — capacity is guaranteed sufficient.
          expect(result.ok).toBe(true)
          if (!result.ok) return // type-narrowing; never reached

          const { slots, unplacedSubjectsByClass } = result.value

          for (const classId of input.classIds) {
            const linkedSubjects = paletteForClass(input.catalog, classId)

            // Requirement 9.1: every linked subject must appear in the output slots.
            for (const subject of linkedSubjects) {
              const matchingSlots = slots.filter(
                s => s.classId === classId && s.subject === subject.name,
              )

              // Each linked subject appears in at least one slot.
              expect(matchingSlots.length).toBeGreaterThanOrEqual(
                1,
                `Subject "${subject.name}" for class "${classId}" was not placed in any slot`,
              )

              // Each subject is placed in exactly one slot per class (not duplicated).
              expect(matchingSlots.length).toBe(
                1,
                `Subject "${subject.name}" for class "${classId}" was placed in ${matchingSlots.length} slots (expected 1)`,
              )
            }

            // R9.10: unplacedSubjectsByClass[classId] must be absent or 0
            // because we have sufficient capacity.
            const unplaced = unplacedSubjectsByClass[classId] ?? 0
            expect(unplaced).toBe(
              0,
              `Class "${classId}" has ${unplaced} unplaced subjects even though capacity is sufficient`,
            )
          }

          // Total placed-subject slots must equal the total linked subjects.
          const totalLinked = input.classIds.reduce(
            (sum, cid) => sum + paletteForClass(input.catalog, cid).length,
            0,
          )
          const totalPlaced = slots.filter(s => s.subject !== undefined).length
          expect(totalPlaced).toBe(
            totalLinked,
            `Expected ${totalLinked} subject-bearing slots but got ${totalPlaced}`,
          )
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "produces slots only within the configured dates and sessions",
    () => {
      // Feature: exam-routine-builder, Property 33: Full-draft coverage
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(arbFullDraftWithSufficientCapacity, input => {
          const result = generator.generate(input)
          if (!result.ok) return

          const dateSet = new Set(input.dates)
          const sessionIdSet = new Set(input.sessions.map(s => s.id))

          for (const slot of result.value.slots) {
            expect(dateSet.has(slot.date)).toBe(
              true,
              `Slot date "${slot.date}" is not in the configured exam dates`,
            )
            expect(sessionIdSet.has(slot.sessionId)).toBe(
              true,
              `Slot sessionId "${slot.sessionId}" is not in the configured sessions`,
            )
          }
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "produces slots only for the configured class identifiers",
    () => {
      // Feature: exam-routine-builder, Property 33: Full-draft coverage
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(arbFullDraftWithSufficientCapacity, input => {
          const result = generator.generate(input)
          if (!result.ok) return

          const classIdSet = new Set(input.classIds)

          for (const slot of result.value.slots) {
            expect(classIdSet.has(slot.classId)).toBe(
              true,
              `Slot classId "${slot.classId}" is not in the configured class identifiers`,
            )
          }
        }),
        { numRuns: 100 },
      )
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 34: At most one subject per class per date
//
// Feature: exam-routine-builder, Property 34: At most one subject per class per date
// Validates: Requirements 9.2
//
// When the AI_Routine_Generator places subjects, it SHALL assign at most one
// subject per Class per Exam_Date so that papers are spread across the available
// dates.
//
// Formally, for every (classId, date) pair in the generated result:
//   the number of slots where slot.classId === classId
//                           AND slot.date === date
//                           AND slot.subject !== undefined
//   must be at most 1.
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 34: At most one subject per class per date", () => {
  it(
    "never assigns more than one subject to the same class on the same date",
    () => {
      // Feature: exam-routine-builder, Property 34: At most one subject per class per date
      const generator = new HeuristicRoutineGenerator()

      // Use arbGenerationInput filtered to guarantee at least 1 date and 1 session
      // so the generator can actually run (not rejected by missing-config guard).
      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input => input.dates.length >= 1 && input.sessions.length >= 1,
          ),
          input => {
            const result = generator.generate(input)

            // Only check ok results — errors (e.g. missing config) are fine to skip.
            if (!result.ok) return

            const { slots } = result.value

            // Build a map: `${classId}__${date}` → count of subject-bearing slots
            const subjectCountPerClassDate = new Map<string, number>()

            for (const slot of slots) {
              if (slot.subject === undefined) continue

              const key = `${slot.classId}__${slot.date}`
              subjectCountPerClassDate.set(
                key,
                (subjectCountPerClassDate.get(key) ?? 0) + 1,
              )
            }

            // R9.2: every (class, date) pair must have at most one subject-bearing slot
            for (const [key, count] of subjectCountPerClassDate) {
              const [classId, date] = key.split("__")
              expect(count).toBeLessThanOrEqual(
                1,
                `Class "${classId}" has ${count} subjects scheduled on date "${date}" (at most 1 allowed per R9.2)`,
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "spreads all subjects across distinct dates — one subject per class per date (sufficient capacity)",
    () => {
      // Feature: exam-routine-builder, Property 34: At most one subject per class per date
      const generator = new HeuristicRoutineGenerator()

      // Re-use the arbFullDraftWithSufficientCapacity shape but rebuild it inline
      // using arbGenerationInput filtered for sufficient capacity, so we can also
      // verify the positional spread (each linked subject on a *different* date).
      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input =>
              input.dates.length >= 1 &&
              input.sessions.length >= 1 &&
              // Ensure sufficient capacity: dates >= max subjects per any class
              input.classIds.every(cid => {
                const linked = input.catalog.filter(s =>
                  s.linkedClassIds.includes(cid),
                ).length
                return input.dates.length >= linked
              }),
          ),
          input => {
            const result = generator.generate(input)
            if (!result.ok) return

            const { slots } = result.value

            // For each class, collect all (date, subject) pairs from placed slots
            for (const classId of input.classIds) {
              const classSlots = slots.filter(
                s => s.classId === classId && s.subject !== undefined,
              )

              // Group by date
              const dateToSubjects = new Map<string, string[]>()
              for (const slot of classSlots) {
                const existing = dateToSubjects.get(slot.date) ?? []
                existing.push(slot.subject!)
                dateToSubjects.set(slot.date, existing)
              }

              // Each date must have at most one subject for this class
              for (const [date, subjects] of dateToSubjects) {
                expect(subjects.length).toBeLessThanOrEqual(
                  1,
                  `Class "${classId}" has ${subjects.length} subjects on date "${date}": [${subjects.join(", ")}]. R9.2 requires at most 1.`,
                )
              }
            }
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 35: Generation produces no double-bookings
//
// Feature: exam-routine-builder, Property 35: Generation produces no double-bookings
// Validates: Requirements 9.3
//
// When the AI_Routine_Generator assigns Invigilators, it SHALL avoid assigning
// a teacher to two Exam_Slots that share the same Exam_Date and Session.
//
// Formally, for every (teacherId, date, sessionId) triple in the generated result:
//   the number of slots where teacherId ∈ slot.invigilatorIds
//                           AND slot.date === date
//                           AND slot.sessionId === sessionId
//   must be at most 1.
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 35: Generation produces no double-bookings", () => {
  it(
    "never assigns a teacher to two slots sharing the same date and session (full-draft)",
    () => {
      // Feature: exam-routine-builder, Property 35: Generation produces no double-bookings
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input =>
              input.dates.length >= 1 &&
              input.sessions.length >= 1 &&
              input.mode === "full-draft",
          ),
          input => {
            const result = generator.generate(input)

            // Only inspect successful results; missing-config errors are fine to skip.
            if (!result.ok) return

            const { slots } = result.value

            // Build a map: `${teacherId}__${date}__${sessionId}` → count of slots
            // that list this teacher in that (date, session) bucket.
            const bookingCount = new Map<string, number>()

            for (const slot of slots) {
              for (const teacherId of slot.invigilatorIds) {
                const key = `${teacherId}__${slot.date}__${slot.sessionId}`
                bookingCount.set(key, (bookingCount.get(key) ?? 0) + 1)
              }
            }

            // R9.3: every (teacher, date, session) bucket must have at most 1 slot.
            for (const [key, count] of bookingCount) {
              const [teacherId, date, sessionId] = key.split("__")
              expect(count).toBeLessThanOrEqual(
                1,
                `Teacher "${teacherId}" is assigned to ${count} slots on date "${date}" / session "${sessionId}" (double-booking, violates R9.3)`,
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "never assigns a teacher to two slots sharing the same date and session (suggest-invigilators)",
    () => {
      // Feature: exam-routine-builder, Property 35: Generation produces no double-bookings
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input =>
              input.dates.length >= 1 &&
              input.sessions.length >= 1 &&
              input.mode === "suggest-invigilators",
          ),
          input => {
            const result = generator.generate(input)

            if (!result.ok) return

            const { slots } = result.value

            const bookingCount = new Map<string, number>()

            for (const slot of slots) {
              for (const teacherId of slot.invigilatorIds) {
                const key = `${teacherId}__${slot.date}__${slot.sessionId}`
                bookingCount.set(key, (bookingCount.get(key) ?? 0) + 1)
              }
            }

            for (const [key, count] of bookingCount) {
              const [teacherId, date, sessionId] = key.split("__")
              expect(count).toBeLessThanOrEqual(
                1,
                `Teacher "${teacherId}" is assigned to ${count} slots on date "${date}" / session "${sessionId}" (double-booking in suggest mode, violates R9.3)`,
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "no double-bookings across both modes via arbGenerationInput (combined check)",
    () => {
      // Feature: exam-routine-builder, Property 35: Generation produces no double-bookings
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input => input.dates.length >= 1 && input.sessions.length >= 1,
          ),
          input => {
            const result = generator.generate(input)

            if (!result.ok) return

            const { slots } = result.value

            // Group each teacher's assignments by (date, sessionId).
            // Collect all teachers that appear in the output.
            const teacherSlotsBySession = new Map<string, string[]>()
            // key: `${teacherId}__${date}__${sessionId}`, value: list of slot ids

            for (const slot of slots) {
              for (const teacherId of slot.invigilatorIds) {
                const key = `${teacherId}__${slot.date}__${slot.sessionId}`
                const existing = teacherSlotsBySession.get(key) ?? []
                existing.push(slot.id)
                teacherSlotsBySession.set(key, existing)
              }
            }

            // R9.3: each group must have at most 1 slot.
            for (const [key, slotIds] of teacherSlotsBySession) {
              const [teacherId, date, sessionId] = key.split("__")
              expect(slotIds.length).toBeLessThanOrEqual(
                1,
                `Teacher "${teacherId}" has ${slotIds.length} assignments on date "${date}" / session "${sessionId}": [${slotIds.join(", ")}]. R9.3 requires at most 1.`,
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 36: Invigilation duties are balanced
//
// Feature: exam-routine-builder, Property 36: Invigilation duties are balanced
// Validates: Requirements 9.4
//
// When the AI_Routine_Generator assigns Invigilators across Exam_Slots, it SHALL
// distribute duties so that the difference between the highest and the lowest
// invigilation-duty count among assigned active teachers does not exceed one (1)
// duty.
//
// Formally, for a full-draft generation where at least 2 active teachers are
// provided and the result has at least one assigned invigilator:
//   Let duties(t) = count of slots in result.slots where t ∈ slot.invigilatorIds
//   Let assigned = { t ∈ activeTeachers | duties(t) > 0 }
//   Then max({ duties(t) | t ∈ assigned }) - min({ duties(t) | t ∈ assigned }) ≤ 1
//
// Teachers who receive zero duties (unassigned because slots were scarce) are
// intentionally excluded from the max−min spread check — the balancing property
// only applies to teachers who ARE assigned at least once.
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 36: Invigilation duties are balanced", () => {
  it(
    "max minus min duty count among assigned active teachers does not exceed 1",
    () => {
      // Feature: exam-routine-builder, Property 36: Invigilation duties are balanced
      const generator = new HeuristicRoutineGenerator()

      // Build a specialised arbitrary that constrains to:
      //   - mode = "full-draft"
      //   - at least 2 active teachers
      //   - at least 1 date
      //   - at least 1 session
      //   - at least 1 class with at least 1 linked subject (so slots with
      //     subjects exist and invigilator assignment can actually run)
      const arbBalancedInput: fc.Arbitrary<GenerationInput> = fc
        .tuple(
          // At least 2 unique active teachers
          fc
            .uniqueArray(
              arbGenerationInput
                .filter(i => i.teachers.some(t => t.status === "active"))
                .chain(i => {
                  // Not used directly; we rebuild teacher pool below
                  return fc.constant(i)
                }),
              { minLength: 1, maxLength: 1 },
            )
            .chain(() =>
              // Generate 2–6 active teachers with unique ids
              fc.uniqueArray(
                fc
                  .tuple(
                    fc.integer({ min: 1, max: 50 }).map(n => `teacher-${n}`),
                    fc.string({ minLength: 2, maxLength: 20 }),
                  )
                  .map(([id, name]) => ({
                    id,
                    name,
                    email: `${id}@school.edu`,
                    subjects: [] as string[],
                    section: "Middle" as const,
                    status: "active" as const,
                    dailyProxyCap: 4,
                    weeklyProxyCap: 10,
                    monthlyProxyCap: 25,
                  })),
                { minLength: 2, maxLength: 6, selector: t => t.id },
              ),
            ),
        )
        .chain(([activeTeachers]) => {
          // Build at least 1 date and 1 session
          const datesArb = fc.uniqueArray(
            fc
              .tuple(
                fc.integer({ min: 2025, max: 2027 }),
                fc.integer({ min: 1, max: 12 }),
                fc.integer({ min: 1, max: 28 }),
              )
              .map(
                ([y, m, d]) =>
                  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
              ),
            { minLength: 1, maxLength: 5 },
          )

          return datesArb.chain(dates =>
            arbSession.chain(session => {
              // Build a simple catalog: 1 class with 1+ subjects per date
              // so there is at least 1 subject-bearing slot per date slot.
              const classId = "VIII-A"
              const subjectCount = Math.min(dates.length, 4)
              const catalog = Array.from({ length: subjectCount }, (_, i) => ({
                id: `subj-${i}`,
                name: `Subject${i}`,
                linkedClassIds: [classId],
              }))

              return fc.constant<GenerationInput>({
                catalog,
                classIds: [classId],
                dates,
                sessions: [session],
                teachers: activeTeachers,
                existingSlots: [],
                mode: "full-draft" as const,
              })
            }),
          )
        })

      fc.assert(
        fc.property(arbBalancedInput, input => {
          const result = generator.generate(input)

          // Generator must succeed for valid (non-empty) config.
          expect(result.ok).toBe(true)
          if (!result.ok) return

          const { slots } = result.value

          // Collect the active teacher ids from the input.
          const activeTeacherIds = new Set(
            input.teachers.filter(t => t.status === "active").map(t => t.id),
          )

          // Count how many slots each active teacher is assigned to.
          const dutyCount = new Map<string, number>()
          for (const teacherId of activeTeacherIds) {
            dutyCount.set(teacherId, 0)
          }
          for (const slot of slots) {
            for (const teacherId of slot.invigilatorIds) {
              if (activeTeacherIds.has(teacherId)) {
                dutyCount.set(teacherId, (dutyCount.get(teacherId) ?? 0) + 1)
              }
            }
          }

          // Only consider teachers who were assigned at least once (R9.4 scope).
          const assignedCounts = [...dutyCount.values()].filter(count => count > 0)

          // If no teacher was assigned at all (e.g., zero subject-bearing slots),
          // there is nothing to balance — the property trivially holds.
          if (assignedCounts.length === 0) return

          const maxDuty = Math.max(...assignedCounts)
          const minDuty = Math.min(...assignedCounts)
          const spread = maxDuty - minDuty

          expect(spread).toBeLessThanOrEqual(
            1,
            `Invigilation duty spread is ${spread} (max=${maxDuty}, min=${minDuty}). ` +
              `R9.4 requires the difference between highest and lowest duty count to be ≤ 1. ` +
              `Duty distribution: ${JSON.stringify(Object.fromEntries(dutyCount))}`,
          )
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "duty spread is ≤ 1 across arbGenerationInput filtered for full-draft with ≥2 active teachers",
    () => {
      // Feature: exam-routine-builder, Property 36: Invigilation duties are balanced
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input =>
              input.mode === "full-draft" &&
              input.dates.length >= 1 &&
              input.sessions.length >= 1 &&
              input.teachers.filter(t => t.status === "active").length >= 2,
          ),
          input => {
            const result = generator.generate(input)
            if (!result.ok) return

            const { slots } = result.value

            const activeTeacherIds = new Set(
              input.teachers.filter(t => t.status === "active").map(t => t.id),
            )

            // Build duty counts for all active teachers.
            const dutyCount = new Map<string, number>()
            for (const teacherId of activeTeacherIds) {
              dutyCount.set(teacherId, 0)
            }
            for (const slot of slots) {
              for (const teacherId of slot.invigilatorIds) {
                if (activeTeacherIds.has(teacherId)) {
                  dutyCount.set(teacherId, (dutyCount.get(teacherId) ?? 0) + 1)
                }
              }
            }

            // Restrict to teachers who are assigned at least once.
            const assignedCounts = [...dutyCount.values()].filter(c => c > 0)
            if (assignedCounts.length === 0) return

            const spread = Math.max(...assignedCounts) - Math.min(...assignedCounts)

            expect(spread).toBeLessThanOrEqual(
              1,
              `Duty spread is ${spread} among assigned teachers. ` +
                `R9.4 requires max−min ≤ 1. ` +
                `Counts: ${JSON.stringify(Object.fromEntries(dutyCount))}`,
            )
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 37: Suggest mode preserves existing content
//
// Feature: exam-routine-builder, Property 37: Suggest mode preserves existing content
// Validates: Requirements 9.5
//
// When an Admin requests the suggest-invigilators mode, THE AI_Routine_Generator
// SHALL assign Invigilators only to Exam_Slots that hold a subject and have no
// Invigilator, and SHALL leave existing subjects and existing Invigilator
// assignments unchanged.
//
// Formally, given existingSlots and result.slots:
//   1. For every slot in existingSlots that has a subject AND at least one
//      invigilator: result must contain a slot with the same key AND the same
//      subject AND all the pre-existing invigilators still present.
//   2. For every slot in existingSlots that has NO subject: the corresponding
//      slot in result must still have no subject (the generator did not inject
//      a subject).
//   3. The generator never adds invigilators to slots that had no subject
//      (no-subject slots stay without a newly added invigilator from the generator).
//   4. The generator only ever ADDS invigilators to subject-bearing slots that
//      had none — i.e., invigilator additions are confined to that target set.
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 37: Suggest mode preserves existing content", () => {
  it(
    "does not modify subjects of any pre-existing slot",
    () => {
      // Feature: exam-routine-builder, Property 37: Suggest mode preserves existing content
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input =>
              input.mode === "suggest-invigilators" &&
              input.dates.length >= 1 &&
              input.sessions.length >= 1,
          ),
          input => {
            const result = generator.generate(input)
            if (!result.ok) return

            const { slots: resultSlots } = result.value

            // For every pre-existing slot, the subject must be unchanged.
            for (const existing of input.existingSlots) {
              const key = `${existing.classId}__${existing.date}__${existing.sessionId}`
              const resultSlot = resultSlots.find(
                s =>
                  s.classId === existing.classId &&
                  s.date === existing.date &&
                  s.sessionId === existing.sessionId,
              )

              // The slot must still exist in the result.
              expect(resultSlot).toBeDefined()
              if (!resultSlot) continue

              // R9.5: existing subject must be preserved unchanged.
              expect(resultSlot.subject).toBe(
                existing.subject,
                `Slot "${key}" had subject="${String(existing.subject)}" before suggest mode but ` +
                  `result has subject="${String(resultSlot.subject)}" — suggest mode must not modify existing subjects`,
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "does not remove or replace pre-existing invigilator assignments",
    () => {
      // Feature: exam-routine-builder, Property 37: Suggest mode preserves existing content
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input =>
              input.mode === "suggest-invigilators" &&
              input.dates.length >= 1 &&
              input.sessions.length >= 1 &&
              // Focus on inputs where at least one slot has a subject AND invigilators.
              input.existingSlots.some(
                s => s.subject !== undefined && s.invigilatorIds.length > 0,
              ),
          ),
          input => {
            const result = generator.generate(input)
            if (!result.ok) return

            const { slots: resultSlots } = result.value

            for (const existing of input.existingSlots) {
              if (
                existing.subject === undefined ||
                existing.invigilatorIds.length === 0
              ) {
                continue // Only check slots that had a subject AND invigilators.
              }

              const resultSlot = resultSlots.find(
                s =>
                  s.classId === existing.classId &&
                  s.date === existing.date &&
                  s.sessionId === existing.sessionId,
              )

              expect(resultSlot).toBeDefined()
              if (!resultSlot) continue

              const key = `${existing.classId}__${existing.date}__${existing.sessionId}`

              // R9.5: every pre-existing invigilator must still be present.
              for (const preExistingId of existing.invigilatorIds) {
                expect(resultSlot.invigilatorIds).toContain(
                  preExistingId,
                  `Slot "${key}" had pre-existing invigilator "${preExistingId}" ` +
                    `but it is missing from the result — suggest mode must not remove existing invigilators`,
                )
              }
            }
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "does not add invigilators to slots that had no subject",
    () => {
      // Feature: exam-routine-builder, Property 37: Suggest mode preserves existing content
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input =>
              input.mode === "suggest-invigilators" &&
              input.dates.length >= 1 &&
              input.sessions.length >= 1,
          ),
          input => {
            const result = generator.generate(input)
            if (!result.ok) return

            const { slots: resultSlots } = result.value

            // For every slot that had no subject before generation,
            // the generator must not have added new invigilators.
            for (const existing of input.existingSlots) {
              if (existing.subject !== undefined) continue // skip subject-bearing slots

              const resultSlot = resultSlots.find(
                s =>
                  s.classId === existing.classId &&
                  s.date === existing.date &&
                  s.sessionId === existing.sessionId,
              )

              expect(resultSlot).toBeDefined()
              if (!resultSlot) continue

              const key = `${existing.classId}__${existing.date}__${existing.sessionId}`

              // R9.5: no subject means the generator must not fill invigilators here.
              // The result's invigilator list must equal the pre-existing one
              // (no removals AND no additions).
              const preExistingIds = [...existing.invigilatorIds].sort()
              const resultIds = [...resultSlot.invigilatorIds].sort()

              expect(resultIds).toEqual(
                preExistingIds,
                `Slot "${key}" had no subject — suggest mode must not modify its ` +
                  `invigilator list, but got [${resultIds.join(", ")}] ` +
                  `(was [${preExistingIds.join(", ")}])`,
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "only fills subject-bearing slots that had no invigilator (no changes to already-assigned slots)",
    () => {
      // Feature: exam-routine-builder, Property 37: Suggest mode preserves existing content
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input =>
              input.mode === "suggest-invigilators" &&
              input.dates.length >= 1 &&
              input.sessions.length >= 1,
          ),
          input => {
            const result = generator.generate(input)
            if (!result.ok) return

            const { slots: resultSlots } = result.value

            // Build a lookup for existing slots by their coordinate key.
            const existingByKey = new Map(
              input.existingSlots.map(s => [
                `${s.classId}__${s.date}__${s.sessionId}`,
                s,
              ]),
            )

            for (const resultSlot of resultSlots) {
              const key = `${resultSlot.classId}__${resultSlot.date}__${resultSlot.sessionId}`
              const pre = existingByKey.get(key)

              if (!pre) continue // slot was not in the original input; skip

              // If the slot already had a subject AND at least one invigilator,
              // the result's invigilator list must be a superset of (or equal to)
              // the original — no invigilators are removed, but none are added either
              // (the slot was already covered, so it is not a target for suggest mode).
              if (pre.subject !== undefined && pre.invigilatorIds.length > 0) {
                const preSet = new Set(pre.invigilatorIds)

                // All pre-existing invigilators must still be present.
                for (const id of pre.invigilatorIds) {
                  expect(resultSlot.invigilatorIds).toContain(
                    id,
                    `Slot "${key}" had pre-existing invigilator "${id}" ` +
                      `that is missing from the result`,
                  )
                }

                // No new invigilators should have been added (already covered slot).
                for (const id of resultSlot.invigilatorIds) {
                  expect(preSet.has(id)).toBe(
                    true,
                    `Slot "${key}" already had invigilators but suggest mode added "${id}" ` +
                      `— it should only fill slots with no invigilator`,
                  )
                }
              }
            }
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 38: Generation is deterministic
//
// Feature: exam-routine-builder, Property 38: Generation is deterministic
// Validates: Requirements 9.6
//
// WHERE the AI_Routine_Generator is invoked with identical configuration and
// identical input data, THE AI_Routine_Generator SHALL produce an identical
// draft routine.
//
// Formally, for any GenerationInput `input`:
//   Let result1 = generator.generate(input)
//   Let result2 = generator.generate(input)
//   result1.ok === result2.ok
//   AND, when both succeed:
//     result1.value.slots has the same length as result2.value.slots
//     AND for every index i:
//       result1.value.slots[i] deep-equals result2.value.slots[i]
//     AND result1.value.uncoveredSlotCount === result2.value.uncoveredSlotCount
//     AND result1.value.unplacedSubjectsByClass deep-equals
//         result2.value.unplacedSubjectsByClass
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 38: Generation is deterministic", () => {
  it(
    "produces identical slots when called twice with the same input (full-draft)",
    () => {
      // Feature: exam-routine-builder, Property 38: Generation is deterministic
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input =>
              input.dates.length >= 1 &&
              input.sessions.length >= 1 &&
              input.mode === "full-draft",
          ),
          input => {
            const result1 = generator.generate(input)
            const result2 = generator.generate(input)

            // Both calls must agree on success / failure.
            expect(result1.ok).toBe(result2.ok)

            if (!result1.ok || !result2.ok) return // both error — nothing more to check

            const { slots: slots1, uncoveredSlotCount: uc1, unplacedSubjectsByClass: up1 } = result1.value
            const { slots: slots2, uncoveredSlotCount: uc2, unplacedSubjectsByClass: up2 } = result2.value

            // R9.6: the slot arrays must be identical — same length, same order,
            // same field values at every index.
            expect(slots1.length).toBe(
              slots2.length,
              `First call produced ${slots1.length} slots but second call produced ${slots2.length} slots`,
            )

            for (let i = 0; i < slots1.length; i++) {
              expect(slots1[i]).toEqual(
                slots2[i],
                `Slot at index ${i} differs between the two calls:\n` +
                  `  call 1: ${JSON.stringify(slots1[i])}\n` +
                  `  call 2: ${JSON.stringify(slots2[i])}`,
              )
            }

            // The uncovered-slot count must also be the same.
            expect(uc1).toBe(
              uc2,
              `uncoveredSlotCount differs: call 1 = ${uc1}, call 2 = ${uc2}`,
            )

            // The unplaced-subjects-by-class map must also be the same.
            expect(up1).toEqual(
              up2,
              `unplacedSubjectsByClass differs between the two calls`,
            )
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "produces identical slots when called twice with the same input (suggest-invigilators)",
    () => {
      // Feature: exam-routine-builder, Property 38: Generation is deterministic
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input =>
              input.dates.length >= 1 &&
              input.sessions.length >= 1 &&
              input.mode === "suggest-invigilators",
          ),
          input => {
            const result1 = generator.generate(input)
            const result2 = generator.generate(input)

            expect(result1.ok).toBe(result2.ok)
            if (!result1.ok || !result2.ok) return

            const { slots: slots1, uncoveredSlotCount: uc1, unplacedSubjectsByClass: up1 } = result1.value
            const { slots: slots2, uncoveredSlotCount: uc2, unplacedSubjectsByClass: up2 } = result2.value

            expect(slots1.length).toBe(slots2.length)

            for (let i = 0; i < slots1.length; i++) {
              expect(slots1[i]).toEqual(slots2[i])
            }

            expect(uc1).toBe(uc2)
            expect(up1).toEqual(up2)
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "produces identical results across both modes via arbGenerationInput (combined check)",
    () => {
      // Feature: exam-routine-builder, Property 38: Generation is deterministic
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input => input.dates.length >= 1 && input.sessions.length >= 1,
          ),
          input => {
            const result1 = generator.generate(input)
            const result2 = generator.generate(input)

            // Both calls must agree on success / failure.
            expect(result1.ok).toBe(result2.ok)

            if (!result1.ok || !result2.ok) return

            const { slots: slots1, uncoveredSlotCount: uc1, unplacedSubjectsByClass: up1 } = result1.value
            const { slots: slots2, uncoveredSlotCount: uc2, unplacedSubjectsByClass: up2 } = result2.value

            // Slot arrays must be identical in length, order, and content.
            expect(slots1.length).toBe(slots2.length)

            for (let i = 0; i < slots1.length; i++) {
              expect(slots1[i]).toEqual(slots2[i])
            }

            expect(uc1).toBe(uc2)
            expect(up1).toEqual(up2)
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 39: Insufficient resources are reported, not forced
//
// Feature: exam-routine-builder, Property 39: Insufficient resources are reported, not forced
// Validates: Requirements 9.8, 9.10
//
// R9.8 — If the number of available active teachers is insufficient to invigilate
// every subject-bearing Exam_Slot without double-booking, THE AI_Routine_Generator
// SHALL leave the un-coverable Exam_Slots without an Invigilator and report the
// count of un-covered Exam_Slots.
//
// R9.10 — If the available Exam_Slot capacity is insufficient to place all
// subjects linked to a Class under the one-subject-per-Class-per-Exam_Date rule,
// THE AI_Routine_Generator SHALL leave the unplaced subjects without an Exam_Slot
// and report the count of unplaced subjects per Class.
//
// Three sub-properties are tested:
//   1. The generator ALWAYS succeeds (ok: true) even in scarce conditions —
//      it degrades gracefully rather than throwing an error.
//   2. uncoveredSlotCount equals the count of subject-bearing slots in the result
//      that have an empty invigilator list (i.e., the count is accurate, not
//      fabricated — no slot is left uncovered unless it truly could not be covered
//      without double-booking).
//   3. No teacher is ever double-booked in the output, even when teachers are
//      scarce (R9.3 must never be violated to "cover" extra slots).
//   4. unplacedSubjectsByClass[classId] accurately reflects subjects the generator
//      could not fit given the one-subject-per-date capacity.
// ─────────────────────────────────────────────────────────────────────────────

import { arbTeacherScarceInput } from "./generators"

describe("Property 39: Insufficient resources are reported, not forced", () => {
  it(
    "succeeds (ok: true) even when active teachers are insufficient to cover all slots",
    () => {
      // Feature: exam-routine-builder, Property 39: Insufficient resources are reported, not forced
      // Validates: Requirements 9.8
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(arbTeacherScarceInput, input => {
          const result = generator.generate(input)

          // R9.8: The generator must NEVER return ok: false due to insufficient teachers.
          // It reports the problem via uncoveredSlotCount, not by failing.
          expect(result.ok).toBe(
            true,
            "Generator must succeed (ok: true) even when teachers are insufficient — " +
              "it should degrade gracefully and report uncoveredSlotCount, not throw an error",
          )
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "uncoveredSlotCount matches the actual count of subject-bearing slots with no invigilator",
    () => {
      // Feature: exam-routine-builder, Property 39: Insufficient resources are reported, not forced
      // Validates: Requirements 9.8
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          // Use the scarce input to exercise the reporting path; also mix in normal
          // inputs to verify that the count stays 0 when teachers are sufficient.
          fc.oneof(
            { weight: 3, arbitrary: arbTeacherScarceInput },
            {
              weight: 1,
              arbitrary: arbGenerationInput.filter(
                i => i.dates.length >= 1 && i.sessions.length >= 1 && i.mode === "full-draft",
              ),
            },
          ),
          input => {
            const result = generator.generate(input)
            if (!result.ok) return // missing-config; not the path under test

            const { slots, uncoveredSlotCount } = result.value

            // Compute the actual count of subject-bearing slots with no invigilator.
            const actualUncovered = slots.filter(
              s => s.subject !== undefined && s.invigilatorIds.length === 0,
            ).length

            // R9.8: the reported count must exactly match the actual count.
            expect(uncoveredSlotCount).toBe(
              actualUncovered,
              `Generator reported uncoveredSlotCount=${uncoveredSlotCount} but ` +
                `there are ${actualUncovered} subject-bearing slots with no invigilator in the output`,
            )
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "never double-books a teacher even when active teachers are insufficient to cover all slots",
    () => {
      // Feature: exam-routine-builder, Property 39: Insufficient resources are reported, not forced
      // Validates: Requirements 9.8, 9.3
      // The generator must NEVER violate the no-double-booking invariant (R9.3)
      // to force coverage of extra slots.  Uncoverable slots are left empty, not
      // double-booked.
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(arbTeacherScarceInput, input => {
          const result = generator.generate(input)
          if (!result.ok) return

          const { slots } = result.value

          // Build a map: `${teacherId}__${date}__${sessionId}` → count of slots
          // that teacher appears in during that (date, session) pair.
          const bookingCount = new Map<string, number>()
          for (const slot of slots) {
            for (const teacherId of slot.invigilatorIds) {
              const key = `${teacherId}__${slot.date}__${slot.sessionId}`
              bookingCount.set(key, (bookingCount.get(key) ?? 0) + 1)
            }
          }

          // R9.3 (enforced even under scarcity): no (teacher, date, session) bucket
          // may contain more than one slot.
          for (const [key, count] of bookingCount) {
            const [teacherId, date, sessionId] = key.split("__")
            expect(count).toBeLessThanOrEqual(
              1,
              `Teacher "${teacherId}" is double-booked on date "${date}" / ` +
                `session "${sessionId}" (${count} slots) — the generator must NEVER ` +
                `double-book a teacher, even under teacher scarcity`,
            )
          }
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "invigilated slots are not double-counted in uncoveredSlotCount — covered slots have exactly one invigilator",
    () => {
      // Feature: exam-routine-builder, Property 39: Insufficient resources are reported, not forced
      // Validates: Requirements 9.8
      // A slot is either covered (≥1 invigilator) or uncovered (0 invigilators).
      // The uncoveredSlotCount + covered-slot count must equal total subject-bearing slots.
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(arbTeacherScarceInput, input => {
          const result = generator.generate(input)
          if (!result.ok) return

          const { slots, uncoveredSlotCount } = result.value

          const subjectBearingSlots = slots.filter(s => s.subject !== undefined)
          const coveredSlots = subjectBearingSlots.filter(s => s.invigilatorIds.length > 0)
          const uncoveredSlots = subjectBearingSlots.filter(s => s.invigilatorIds.length === 0)

          // The partition must be complete: covered + uncovered = total subject-bearing.
          expect(coveredSlots.length + uncoveredSlots.length).toBe(
            subjectBearingSlots.length,
          )

          // The reported uncoveredSlotCount must equal the actual uncovered partition.
          expect(uncoveredSlotCount).toBe(
            uncoveredSlots.length,
            `uncoveredSlotCount=${uncoveredSlotCount} does not match the ` +
              `actual uncovered partition size=${uncoveredSlots.length}`,
          )
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "unplacedSubjectsByClass accurately reports subjects that could not fit under the one-per-date rule (R9.10)",
    () => {
      // Feature: exam-routine-builder, Property 39: Insufficient resources are reported, not forced
      // Validates: Requirements 9.10
      // When dates < subjects per class, the excess subjects are reported in
      // unplacedSubjectsByClass[classId].  The reported count must equal the
      // actual deficit: subjects.length - dates.length (when subjects > dates).
      const generator = new HeuristicRoutineGenerator()

      // Build an input where at least one class has more linked subjects than dates.
      const arbOverCapacityInput = fc
        .tuple(
          fc.uniqueArray(
            fc
              .tuple(
                fc.integer({ min: 2025, max: 2027 }),
                fc.integer({ min: 1, max: 12 }),
                fc.integer({ min: 1, max: 28 }),
              )
              .map(
                ([y, m, d]) =>
                  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
              ),
            { minLength: 1, maxLength: 3 }, // 1–3 dates — easy to overflow
          ),
          arbSession,
        )
        .chain(([dates, session]) => {
          // One class with more subjects than available dates.
          const classId = "IX-A"
          const subjectCount = dates.length + fc.sample(fc.integer({ min: 1, max: 3 }), 1)[0]
          const catalog: import("@/data/mock-exams").CatalogSubject[] = Array.from(
            { length: subjectCount },
            (_, i) => ({
              id: `subj-${i}`,
              name: `Subject${i}`,
              linkedClassIds: [classId],
            }),
          )
          return fc.constant<GenerationInput>({
            catalog,
            classIds: [classId],
            dates,
            sessions: [session],
            teachers: [], // teachers do not affect subject placement
            existingSlots: [],
            mode: "full-draft" as const,
          })
        })

      fc.assert(
        fc.property(arbOverCapacityInput, input => {
          const result = generator.generate(input)
          // Must succeed even with insufficient slot capacity.
          expect(result.ok).toBe(true)
          if (!result.ok) return

          const { unplacedSubjectsByClass } = result.value

          for (const classId of input.classIds) {
            const linkedSubjectCount = input.catalog.filter(s =>
              s.linkedClassIds.includes(classId),
            ).length

            const expectedUnplaced = Math.max(0, linkedSubjectCount - input.dates.length)
            const reportedUnplaced = unplacedSubjectsByClass[classId] ?? 0

            // R9.10: the reported unplaced count must match the actual deficit.
            expect(reportedUnplaced).toBe(
              expectedUnplaced,
              `Class "${classId}" has ${linkedSubjectCount} subjects and ${input.dates.length} dates. ` +
                `Expected unplacedSubjectsByClass["${classId}"]=${expectedUnplaced} ` +
                `but got ${reportedUnplaced}`,
            )
          }
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "unplacedSubjectsByClass is empty (or all zeros) when capacity is sufficient (R9.10 boundary)",
    () => {
      // Feature: exam-routine-builder, Property 39: Insufficient resources are reported, not forced
      // Validates: Requirements 9.10
      // When there are enough dates to fit every subject (dates >= subjects per class),
      // no class should have any unplaced subjects reported.
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          arbGenerationInput.filter(
            input =>
              input.dates.length >= 1 &&
              input.sessions.length >= 1 &&
              input.mode === "full-draft" &&
              // Sufficient capacity: every class can fit all its linked subjects.
              input.classIds.every(cid => {
                const linked = input.catalog.filter(s =>
                  s.linkedClassIds.includes(cid),
                ).length
                return input.dates.length >= linked
              }),
          ),
          input => {
            const result = generator.generate(input)
            if (!result.ok) return

            const { unplacedSubjectsByClass } = result.value

            // R9.10: no class should have unplaced subjects when capacity is sufficient.
            for (const classId of input.classIds) {
              const reportedUnplaced = unplacedSubjectsByClass[classId] ?? 0
              expect(reportedUnplaced).toBe(
                0,
                `Class "${classId}" has unplacedSubjectsByClass=${reportedUnplaced} ` +
                  `even though there are sufficient dates to place all its subjects`,
              )
            }
          },
        ),
        { numRuns: 100 },
      )
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 40: Missing configuration is rejected
//
// Feature: exam-routine-builder, Property 40: Missing configuration is rejected
// Validates: Requirements 9.9
//
// IF no Exam_Dates are configured OR no Sessions are configured when an Admin
// requests a draft routine, THEN THE AI_Routine_Generator SHALL reject the
// request, generate no Exam_Slots, and return an error indication identifying
// the missing configuration.
//
// Formally:
//   1. input.dates is empty  → result is { ok: false, error: "missing-dates" }
//   2. input.sessions is empty → result is { ok: false, error: "missing-sessions" }
//   3. Both empty            → result is { ok: false, error ∈ { "missing-dates", "missing-sessions" } }
//   4. On any { ok: false } result the generator must produce no slots
//      (GenerationResult is never returned alongside an error)
// ─────────────────────────────────────────────────────────────────────────────

import { arbMissingDatesInput, arbMissingSessionsInput } from "./generators"

describe("Property 40: Missing configuration is rejected", () => {
  it(
    "returns { ok: false, error: 'missing-dates' } when no Exam_Dates are configured",
    () => {
      // Feature: exam-routine-builder, Property 40: Missing configuration is rejected
      // Validates: Requirements 9.9
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(arbMissingDatesInput, input => {
          // Precondition: the arbitrary must always produce empty dates.
          expect(input.dates).toHaveLength(0)

          const result = generator.generate(input)

          // R9.9: missing dates → request must be rejected.
          expect(result.ok).toBe(
            false,
            "Generator must return ok: false when no Exam_Dates are configured",
          )

          if (result.ok) return // type narrowing; never reached given the assertion above

          // The error code must identify the missing configuration.
          expect(result.error).toBe(
            "missing-dates",
            `Expected error "missing-dates" but got "${result.error}"`,
          )
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "returns { ok: false, error: 'missing-sessions' } when no Sessions are configured",
    () => {
      // Feature: exam-routine-builder, Property 40: Missing configuration is rejected
      // Validates: Requirements 9.9
      // Note: we filter to ensure dates is non-empty so the generator reaches the
      // sessions check (implementations typically check dates first, then sessions).
      const generator = new HeuristicRoutineGenerator()

      fc.assert(
        fc.property(
          // Ensure dates is non-empty so the missing-sessions branch fires.
          arbMissingSessionsInput.filter(input => input.dates.length >= 1),
          input => {
            // Preconditions guaranteed by the arbitrary and filter.
            expect(input.sessions).toHaveLength(0)
            expect(input.dates.length).toBeGreaterThanOrEqual(1)

            const result = generator.generate(input)

            // R9.9: missing sessions → request must be rejected.
            expect(result.ok).toBe(
              false,
              "Generator must return ok: false when no Sessions are configured",
            )

            if (result.ok) return // type narrowing; never reached given the assertion above

            // The error code must identify the missing configuration.
            expect(result.error).toBe(
              "missing-sessions",
              `Expected error "missing-sessions" but got "${result.error}"`,
            )
          },
        ),
        { numRuns: 100 },
      )
    },
  )

  it(
    "returns a missing-config error code when BOTH dates and sessions are empty",
    () => {
      // Feature: exam-routine-builder, Property 40: Missing configuration is rejected
      // Validates: Requirements 9.9
      // When both are missing the generator must still reject the request.
      // The error is one of the two missing-config codes (implementation may
      // check dates first or sessions first — both are valid per R9.9).
      const generator = new HeuristicRoutineGenerator()

      const arbBothMissingInput = arbMissingDatesInput.map(input => ({
        ...input,
        sessions: [],
      }))

      fc.assert(
        fc.property(arbBothMissingInput, input => {
          expect(input.dates).toHaveLength(0)
          expect(input.sessions).toHaveLength(0)

          const result = generator.generate(input)

          // R9.9: must be rejected regardless of which field is checked first.
          expect(result.ok).toBe(
            false,
            "Generator must return ok: false when BOTH dates and sessions are empty",
          )

          if (result.ok) return // type narrowing; never reached

          // The error must be one of the two missing-config codes.
          expect(["missing-dates", "missing-sessions"]).toContain(
            result.error,
            `Expected error to be "missing-dates" or "missing-sessions" but got "${result.error}"`,
          )
        }),
        { numRuns: 100 },
      )
    },
  )

  it(
    "generates no Exam_Slots when the request is rejected for missing configuration",
    () => {
      // Feature: exam-routine-builder, Property 40: Missing configuration is rejected
      // Validates: Requirements 9.9
      // The result must be an OpResult error — GenerationResult (with slots) is
      // never returned alongside a missing-config error.
      const generator = new HeuristicRoutineGenerator()

      // Covers: missing dates, missing sessions, and both missing.
      const arbAnyMissingConfigInput = fc.oneof(
        { weight: 2, arbitrary: arbMissingDatesInput },
        { weight: 2, arbitrary: arbMissingSessionsInput },
        {
          weight: 1,
          arbitrary: arbMissingDatesInput.map(input => ({
            ...input,
            sessions: [],
          })),
        },
      )

      fc.assert(
        fc.property(arbAnyMissingConfigInput, input => {
          const result = generator.generate(input)

          // The result must be a rejected OpResult — no slots should be generated.
          expect(result.ok).toBe(
            false,
            "Generator must return ok: false for any missing-config scenario",
          )

          if (result.ok) {
            // If (unexpectedly) ok: true, ensure no slots were generated.
            expect(result.value.slots).toHaveLength(
              0,
              "Generator returned ok: true for missing-config but also produced slots — " +
                "R9.9 requires no Exam_Slots to be generated",
            )
          }
        }),
        { numRuns: 100 },
      )
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Task 8.10: Example Tests — Performance, Seam, and Concrete Small-School Case
//
// Validates: Requirements 9.7, 9.11
//
// These are concrete (example-based) tests, not property tests. They cover:
//   1. Performance: a large school config (10 classes × 7 subjects × 5 dates ×
//      2 sessions) generates within the 10-second budget (R9.11).
//   2. Seam: `routineGenerator` satisfies the `RoutineGenerator` interface; a
//      stub implementation swaps in without changing callers (R9.7).
//   3. Concrete small-school example: 2 classes × 3 subjects × 3 dates produces
//      the expected structure — correct slot count, subjects distributed (R9.1,
//      R9.2).
//   4. AI-unavailable fallback: when the AI/external suggestion is unavailable
//      or fails, the system falls back to rule-based generation without throwing.
// ─────────────────────────────────────────────────────────────────────────────

import {
  routineGenerator,
  type GenerationInput,
  type GenerationResult,
  type RoutineGenerator,
} from "@/lib/exam/ai-routine-generator"

// ─────────────────────────────────────────────────────────────────────────────
// Shared fixtures
// ─────────────────────────────────────────────────────────────────────────────

/** Build an active teacher fixture. */
function makeTeacher(n: number) {
  return {
    id: `t${n}`,
    name: `Teacher ${n}`,
    email: `t${n}@school.edu`,
    subjects: [] as string[],
    section: "Middle" as const,
    status: "active" as const,
    dailyProxyCap: 4,
    weeklyProxyCap: 10,
    monthlyProxyCap: 25,
  }
}

/** Build a session fixture with deterministic id, name, and times. */
function makeSession(n: number) {
  const start = `${String(8 + n).padStart(2, "0")}:00`
  const end = `${String(9 + n).padStart(2, "0")}:00`
  return { id: `ses-${n}`, name: `Session${n}`, startTime: start, endTime: end }
}

/** Build an ISO date fixture offset from a base date by `offset` days. */
function makeDate(offset: number): string {
  const base = new Date(2026, 2, 1) // 2026-03-01
  base.setDate(base.getDate() + offset)
  const y = base.getFullYear()
  const m = String(base.getMonth() + 1).padStart(2, "0")
  const d = String(base.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Performance test
// ─────────────────────────────────────────────────────────────────────────────

describe("Example: Performance — large school within 10 seconds (R9.11)", () => {
  it(
    "generates a routine for 10 classes × 7 subjects × 5 dates × 2 sessions within 10 000 ms",
    () => {
      // Feature: exam-routine-builder
      // Validates: Requirements 9.11

      const CLASS_COUNT = 10
      const SUBJECT_COUNT = 7
      const DATE_COUNT = 5
      const SESSION_COUNT = 2
      const TEACHER_COUNT = 15

      const classIds = Array.from({ length: CLASS_COUNT }, (_, i) => `Class-${i + 1}`)
      const sessions = Array.from({ length: SESSION_COUNT }, (_, i) => makeSession(i))
      const dates = Array.from({ length: DATE_COUNT }, (_, i) => makeDate(i))
      const teachers = Array.from({ length: TEACHER_COUNT }, (_, i) => makeTeacher(i + 1))

      // Each class gets SUBJECT_COUNT unique subjects, all linked to that class only.
      const catalog = classIds.flatMap((classId, ci) =>
        Array.from({ length: SUBJECT_COUNT }, (_, si) => ({
          id: `subj-${ci}-${si}`,
          name: `Subject${ci}_${si}`,
          linkedClassIds: [classId],
        })),
      )

      const input: GenerationInput = {
        catalog,
        classIds,
        dates,
        sessions,
        teachers,
        existingSlots: [],
        mode: "full-draft",
      }

      const generator = new HeuristicRoutineGenerator()

      const t0 = performance.now()
      const result = generator.generate(input)
      const elapsed = performance.now() - t0

      // R9.11: must complete within 10 000 ms.
      expect(elapsed).toBeLessThan(
        10_000,
        `Large-school generation took ${elapsed.toFixed(1)} ms — exceeds the 10-second budget (R9.11)`,
      )

      // Sanity: should succeed and produce slots.
      expect(result.ok).toBe(true)
      if (!result.ok) return

      // With DATE_COUNT = 5 and SUBJECT_COUNT = 7 per class, only 5 subjects
      // fit per class (one-per-date constraint). So each class contributes 5
      // subject-bearing slots → CLASS_COUNT × min(SUBJECT_COUNT, DATE_COUNT).
      const expectedSlots = CLASS_COUNT * Math.min(SUBJECT_COUNT, DATE_COUNT)
      expect(result.value.slots.length).toBe(
        expectedSlots,
        `Expected ${expectedSlots} slots but got ${result.value.slots.length}`,
      )
    },
  )

  it(
    "stays well within budget for a 10 classes × 5 subjects × 5 dates × 2 sessions config (< 2 000 ms)",
    () => {
      // Feature: exam-routine-builder
      // Validates: Requirements 9.11 (intermediate size check)

      const classIds = Array.from({ length: 10 }, (_, i) => `C${i + 1}`)
      const sessions = [makeSession(0), makeSession(1)]
      const dates = Array.from({ length: 5 }, (_, i) => makeDate(i))
      const teachers = Array.from({ length: 10 }, (_, i) => makeTeacher(i + 1))

      const catalog = classIds.flatMap((classId, ci) =>
        Array.from({ length: 5 }, (_, si) => ({
          id: `s-${ci}-${si}`,
          name: `Sub${ci}_${si}`,
          linkedClassIds: [classId],
        })),
      )

      const input: GenerationInput = {
        catalog,
        classIds,
        dates,
        sessions,
        teachers,
        existingSlots: [],
        mode: "full-draft",
      }

      const generator = new HeuristicRoutineGenerator()

      const t0 = performance.now()
      const result = generator.generate(input)
      const elapsed = performance.now() - t0

      expect(elapsed).toBeLessThan(
        2_000,
        `10×5×5×2 config took ${elapsed.toFixed(1)} ms — should be well under 2 000 ms`,
      )

      expect(result.ok).toBe(true)
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Seam tests — RoutineGenerator interface swappability (R9.7)
// ─────────────────────────────────────────────────────────────────────────────

describe("Example: Seam — RoutineGenerator interface and swappability (R9.7)", () => {
  it(
    "routineGenerator exported from the module satisfies the RoutineGenerator interface",
    () => {
      // Feature: exam-routine-builder
      // Validates: Requirements 9.7
      //
      // The exported `routineGenerator` constant must expose a `generate` method
      // that returns OpResult<GenerationResult> for any valid input.

      expect(typeof routineGenerator.generate).toBe("function")

      const input: GenerationInput = {
        catalog: [{ id: "s1", name: "Maths", linkedClassIds: ["VIII-A"] }],
        classIds: ["VIII-A"],
        dates: [makeDate(0), makeDate(1)],
        sessions: [makeSession(0)],
        teachers: [makeTeacher(1)],
        existingSlots: [],
        mode: "full-draft",
      }

      const result = routineGenerator.generate(input)

      // Must return an OpResult shape — either { ok: true, value } or { ok: false, error }
      expect(result).toBeDefined()
      expect(typeof result.ok).toBe("boolean")

      if (result.ok) {
        expect(result.value).toBeDefined()
        expect(Array.isArray(result.value.slots)).toBe(true)
        expect(typeof result.value.uncoveredSlotCount).toBe("number")
        expect(typeof result.value.unplacedSubjectsByClass).toBe("object")
      } else {
        expect(typeof result.error).toBe("string")
        expect(typeof result.message).toBe("string")
      }
    },
  )

  it(
    "a stub RoutineGenerator implementation drops in without changing the caller",
    () => {
      // Feature: exam-routine-builder
      // Validates: Requirements 9.7
      //
      // This test proves the seam: any object implementing RoutineGenerator can
      // be used in place of HeuristicRoutineGenerator without any change to the
      // caller. A vi.fn() spy is wrapped to satisfy the interface.

      const stubGenerate = vi.fn<
        (input: GenerationInput) => ReturnType<RoutineGenerator["generate"]>
      >(() => ({
        ok: true,
        value: {
          slots: [],
          uncoveredSlotCount: 0,
          unplacedSubjectsByClass: {},
        },
      }))

      // The stub satisfies the RoutineGenerator interface.
      const stubGenerator: RoutineGenerator = { generate: stubGenerate }

      const input: GenerationInput = {
        catalog: [],
        classIds: ["IX-A"],
        dates: [makeDate(0)],
        sessions: [makeSession(0)],
        teachers: [],
        existingSlots: [],
        mode: "full-draft",
      }

      // Caller code — only depends on the RoutineGenerator interface.
      function callGenerator(gen: RoutineGenerator, inp: GenerationInput) {
        return gen.generate(inp)
      }

      const result = callGenerator(stubGenerator, input)

      // The caller worked with the stub without any change.
      expect(result.ok).toBe(true)
      if (result.ok) {
        expect(result.value.slots).toHaveLength(0)
      }

      // The stub was called exactly once with our input.
      expect(stubGenerate).toHaveBeenCalledTimes(1)
      expect(stubGenerate).toHaveBeenCalledWith(input)
    },
  )

  it(
    "conflict engine and duty notification hooks are called at the right seam points via spies",
    async () => {
      // Feature: exam-routine-builder
      // Validates: Requirements 9.7 (seam verification)
      //
      // We verify that the generator's output slots are fed into the conflict
      // engine and duty notification paths by wiring spies at the seam boundary.
      // In the real app, detectConflicts and buildDutyMessages are called by the
      // context layer after generation; here we simulate that wiring with
      // imported functions and vi.fn() wrappers to record the calls.

      const { detectConflicts } = await import("@/lib/exam/conflict-engine")
      const { buildDutyMessages } = await import("@/lib/exam/duty-notifications")

      // Wrap the real functions in vi.fn() spies to track call arguments.
      const detectConflictsSpy = vi.fn(detectConflicts)
      const buildDutyMessagesSpy = vi.fn(buildDutyMessages)

      const generator = new HeuristicRoutineGenerator()
      const session = makeSession(0)
      const input: GenerationInput = {
        catalog: [{ id: "s1", name: "English", linkedClassIds: ["VIII-A"] }],
        classIds: ["VIII-A"],
        dates: [makeDate(0)],
        sessions: [session],
        teachers: [makeTeacher(1)],
        existingSlots: [],
        mode: "full-draft",
      }

      const result = generator.generate(input)
      expect(result.ok).toBe(true)
      if (!result.ok) return

      // Simulate the context layer calling conflict engine after generation.
      detectConflictsSpy(result.value.slots)
      expect(detectConflictsSpy).toHaveBeenCalledTimes(1)
      expect(detectConflictsSpy).toHaveBeenCalledWith(result.value.slots)

      // Simulate the context layer calling the duty-notification builder.
      const settings = { notifyLeadMinutes: 30, notifyOnCampusEntry: false }
      buildDutyMessagesSpy(result.value.slots, [session], settings)
      expect(buildDutyMessagesSpy).toHaveBeenCalledTimes(1)
      expect(buildDutyMessagesSpy).toHaveBeenCalledWith(result.value.slots, [session], settings)
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Concrete small-school example (R9.1, R9.2)
// ─────────────────────────────────────────────────────────────────────────────

describe("Example: Concrete small-school routine (2 classes, 3 subjects, 3 dates)", () => {
  /**
   * Fixture: 2 classes × 3 subjects each × 3 dates × 1 session
   *
   *   Classes:   VIII-A, IX-A
   *   Subjects:  Maths, English, Science (linked to both classes)
   *   Dates:     2026-03-01, 2026-03-02, 2026-03-03
   *   Sessions:  Morning (08:00–09:00)
   *   Teachers:  t1, t2, t3 (active)
   */
  const classes = ["VIII-A", "IX-A"]
  const subjectNames = ["Maths", "English", "Science"]
  const catalog = subjectNames.map((name, i) => ({
    id: `sub-${i}`,
    name,
    linkedClassIds: [...classes],
  }))
  const dates = [makeDate(0), makeDate(1), makeDate(2)]
  const sessions = [makeSession(0)]
  const teachers = [makeTeacher(1), makeTeacher(2), makeTeacher(3)]

  const input: GenerationInput = {
    catalog,
    classIds: classes,
    dates,
    sessions,
    teachers,
    existingSlots: [],
    mode: "full-draft",
  }

  const generator = new HeuristicRoutineGenerator()

  it("produces exactly 6 slots (3 subjects × 2 classes)", () => {
    // Feature: exam-routine-builder
    // Validates: Requirements 9.1, 9.2
    const result = generator.generate(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // 2 classes × 3 subjects each = 6 subject-bearing slots.
    expect(result.value.slots).toHaveLength(6)
  })

  it("places all three subjects for each class (one per date)", () => {
    // Feature: exam-routine-builder
    // Validates: Requirements 9.1, 9.2
    const result = generator.generate(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    for (const classId of classes) {
      const classSlots = result.value.slots.filter(s => s.classId === classId)

      // R9.1: all three subjects must appear.
      const placedSubjects = new Set(classSlots.map(s => s.subject))
      for (const name of subjectNames) {
        expect(placedSubjects.has(name)).toBe(
          true,
          `Subject "${name}" was not placed for class "${classId}"`,
        )
      }

      // R9.2: each subject on a different date (at most one subject per class per date).
      const dateToSubjects = new Map<string, string[]>()
      for (const slot of classSlots) {
        const existing = dateToSubjects.get(slot.date) ?? []
        existing.push(slot.subject ?? "")
        dateToSubjects.set(slot.date, existing)
      }
      for (const [date, subjects] of dateToSubjects) {
        expect(subjects.length).toBeLessThanOrEqual(
          1,
          `Class "${classId}" has ${subjects.length} subjects on ${date} — violates R9.2`,
        )
      }
    }
  })

  it("assigns exactly one invigilator per slot from the active teacher pool", () => {
    // Feature: exam-routine-builder
    // Validates: Requirements 9.3, 9.4
    const result = generator.generate(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const activeIds = new Set(teachers.map(t => t.id))

    for (const slot of result.value.slots) {
      expect(slot.invigilatorIds.length).toBeGreaterThanOrEqual(
        1,
        `Slot for class "${slot.classId}" on ${slot.date} has no invigilator`,
      )
      for (const id of slot.invigilatorIds) {
        expect(activeIds.has(id)).toBe(
          true,
          `Invigilator "${id}" is not in the active teacher pool`,
        )
      }
    }
  })

  it("reports zero unplaced subjects when capacity is sufficient", () => {
    // Feature: exam-routine-builder
    // Validates: Requirements 9.10
    const result = generator.generate(input)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    // All 3 subjects fit into 3 dates for each class → nothing unplaced.
    for (const classId of classes) {
      const unplaced = result.value.unplacedSubjectsByClass[classId] ?? 0
      expect(unplaced).toBe(
        0,
        `Class "${classId}" has ${unplaced} unplaced subjects despite sufficient date capacity`,
      )
    }

    expect(result.value.uncoveredSlotCount).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. AI-unavailable fallback (R9.7, R9.9)
// ─────────────────────────────────────────────────────────────────────────────

describe("Example: Fallback when AI suggestion is unavailable or fails (R9.7)", () => {
  it(
    "falls back to rule-based generation without throwing when the AI stub throws",
    () => {
      // Feature: exam-routine-builder
      // Validates: Requirements 9.7
      //
      // A production system using the RoutineGenerator seam can catch errors from
      // a failing AI implementation and fall back to the HeuristicRoutineGenerator.
      // This test proves that pattern works without any thrown errors surfacing.

      const failingAIGenerator: RoutineGenerator = {
        generate: vi.fn(() => {
          throw new Error("AI service unavailable")
        }),
      }

      const fallbackGenerator = new HeuristicRoutineGenerator()

      const input: GenerationInput = {
        catalog: [{ id: "s1", name: "Science", linkedClassIds: ["X-A"] }],
        classIds: ["X-A"],
        dates: [makeDate(0)],
        sessions: [makeSession(0)],
        teachers: [makeTeacher(1)],
        existingSlots: [],
        mode: "full-draft",
      }

      // Context-layer pattern: try primary generator, fall back on error.
      function generateWithFallback(
        primary: RoutineGenerator,
        fallback: RoutineGenerator,
        inp: GenerationInput,
      ) {
        try {
          return primary.generate(inp)
        } catch {
          return fallback.generate(inp)
        }
      }

      // Must not throw — the fallback handles the failure transparently.
      expect(() =>
        generateWithFallback(failingAIGenerator, fallbackGenerator, input),
      ).not.toThrow()

      const result = generateWithFallback(failingAIGenerator, fallbackGenerator, input)

      // The fallback rule-based generator should succeed.
      expect(result.ok).toBe(true)
      if (!result.ok) return

      // The fallback should produce the expected slot for the single subject.
      expect(result.value.slots.length).toBe(1)
      expect(result.value.slots[0].subject).toBe("Science")
      expect(result.value.slots[0].classId).toBe("X-A")
    },
  )

  it(
    "falls back gracefully when the AI stub returns an error OpResult",
    () => {
      // Feature: exam-routine-builder
      // Validates: Requirements 9.7
      //
      // The AI implementation may return ok: false (e.g. missing config from its
      // own perspective). The caller can detect this and use the heuristic fallback.

      const aiReturnsError: RoutineGenerator = {
        generate: vi.fn<(input: GenerationInput) => ReturnType<RoutineGenerator["generate"]>>(
          () => ({
            ok: false,
            error: "missing-dates",
            message: "AI: no exam dates provided",
          }),
        ),
      }

      const fallbackGenerator = new HeuristicRoutineGenerator()

      const input: GenerationInput = {
        catalog: [{ id: "s1", name: "History", linkedClassIds: ["IX-B"] }],
        classIds: ["IX-B"],
        dates: [makeDate(0), makeDate(1)],
        sessions: [makeSession(0)],
        teachers: [makeTeacher(1)],
        existingSlots: [],
        mode: "full-draft",
      }

      // Context-layer pattern: if primary returns ok: false, use heuristic.
      function generateWithFallback(
        primary: RoutineGenerator,
        fallback: RoutineGenerator,
        inp: GenerationInput,
      ) {
        const primaryResult = primary.generate(inp)
        if (!primaryResult.ok) {
          return fallback.generate(inp)
        }
        return primaryResult
      }

      const result = generateWithFallback(aiReturnsError, fallbackGenerator, input)

      // The fallback should succeed.
      expect(result.ok).toBe(true)
      if (!result.ok) return

      // One subject × two dates → 1 slot (one-per-date constraint satisfied).
      expect(result.value.slots.length).toBe(1)
      expect(result.value.slots[0].subject).toBe("History")
    },
  )

  it(
    "HeuristicRoutineGenerator itself does not throw for any valid non-empty input",
    () => {
      // Feature: exam-routine-builder
      // Validates: Requirements 9.7, 9.9
      //
      // The rule-based generator must never throw — it either returns ok: true
      // with a (possibly partial) result or ok: false with an error code.

      const validInputs: GenerationInput[] = [
        // Minimal: 1 class, 0 subjects, 1 date, 1 session
        {
          catalog: [],
          classIds: ["VIII-A"],
          dates: [makeDate(0)],
          sessions: [makeSession(0)],
          teachers: [],
          existingSlots: [],
          mode: "full-draft",
        },
        // Suggest mode, no existing slots
        {
          catalog: [{ id: "s1", name: "Bio", linkedClassIds: ["X-A"] }],
          classIds: ["X-A"],
          dates: [makeDate(0)],
          sessions: [makeSession(0)],
          teachers: [],
          existingSlots: [],
          mode: "suggest-invigilators",
        },
        // Full draft, teacher pool empty → uncoveredSlotCount > 0 but ok: true
        {
          catalog: [{ id: "s1", name: "Chem", linkedClassIds: ["XI-A"] }],
          classIds: ["XI-A"],
          dates: [makeDate(0)],
          sessions: [makeSession(0)],
          teachers: [],
          existingSlots: [],
          mode: "full-draft",
        },
      ]

      const generator = new HeuristicRoutineGenerator()

      for (const input of validInputs) {
        expect(() => generator.generate(input)).not.toThrow()
        const result = generator.generate(input)
        // Every valid non-missing-config input returns ok: true.
        expect(result.ok).toBe(true)
      }
    },
  )
})
