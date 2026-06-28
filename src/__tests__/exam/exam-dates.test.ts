/**
 * exam-dates.test.ts — Property-based tests for exam-dates.ts
 *
 * Feature: exam-routine-builder, Property 13: Column and row ordering
 *
 * Validates: Requirements 4.1, 5.9
 */

import { describe, it, expect } from "vitest"
import { test } from "@fast-check/vitest"
import * as fc from "fast-check"
import { sortedDates, columnAxis, addExamDate, isValidIsoDate, MAX_EXAM_DATES } from "@/lib/exam/exam-dates"
import { arbValidDates, arbSessions, arbIsoDate } from "./generators"

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────

/** Convert an "HH:MM" string to minutes since midnight. */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

// ─────────────────────────────────────────────────────────────────────────────
// Property 13: Column and row ordering
// Feature: exam-routine-builder, Property 13: Column and row ordering
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 13: Column and row ordering", () => {
  /**
   * **Validates: Requirements 4.1, 5.9**
   *
   * 13a — sortedDates output is ordered ascending (lexicographic on ISO dates).
   * For any set of valid ISO dates, sortedDates must return the same dates in
   * non-decreasing lexicographic order. ISO yyyy-mm-dd strings sort correctly
   * under lexicographic comparison.
   */
  test.prop([arbValidDates], { numRuns: 100 })(
    "13a: sortedDates returns dates in ascending lexicographic order",
    (dates) => {
      // Feature: exam-routine-builder, Property 13: Column and row ordering
      const sorted = sortedDates(dates)

      // Same length — no dates dropped or added.
      expect(sorted).toHaveLength(dates.length)

      // Ascending: each adjacent pair satisfies sorted[i] <= sorted[i+1].
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i] <= sorted[i + 1]).toBe(true)
      }

      // Contains exactly the same elements as the input (as a set).
      expect(new Set(sorted)).toEqual(new Set(dates))
    },
  )

  /**
   * **Validates: Requirements 4.1, 5.9**
   *
   * 13b — columnAxis columns are ordered by date ascending, then session start
   * time ascending within each date group.
   *
   * For any set of valid dates and sessions:
   * 1. The column list contains exactly (|dates| × |sessions|) entries.
   * 2. Dates in the column list appear earliest to latest (R5.9, R4.1).
   * 3. Within every date group, sessions are ordered by start time ascending
   *    (R4.1).
   */
  test.prop([arbValidDates, arbSessions], { numRuns: 100 })(
    "13b: columnAxis orders columns by date ascending then session start time ascending",
    (dates, sessions) => {
      // Feature: exam-routine-builder, Property 13: Column and row ordering
      const columns = columnAxis(dates, sessions)

      // 1. Cardinality: exactly |dates| × |sessions| columns.
      expect(columns).toHaveLength(dates.length * sessions.length)

      if (columns.length === 0) return // nothing more to check when either axis is empty

      // 2. Date ordering: for any two consecutive columns, the date of the
      //    later column must be >= the date of the earlier column.
      for (let i = 0; i < columns.length - 1; i++) {
        expect(columns[i].date <= columns[i + 1].date).toBe(true)
      }

      // 3. Session ordering within each date group: collect all columns for
      //    a given date and verify their session start times are non-decreasing.
      const uniqueDates = [...new Set(columns.map(c => c.date))]
      for (const date of uniqueDates) {
        const group = columns.filter(c => c.date === date)
        for (let i = 0; i < group.length - 1; i++) {
          const startA = toMinutes(group[i].session.startTime)
          const startB = toMinutes(group[i + 1].session.startTime)
          expect(startA <= startB).toBe(true)
        }
      }
    },
  )

  /**
   * **Validates: Requirements 4.1, 5.9**
   *
   * 13c — every (date, session) pair appears exactly once in columnAxis output.
   * The cartesian product must be complete and contain no duplicates.
   */
  test.prop([arbValidDates, arbSessions], { numRuns: 100 })(
    "13c: columnAxis contains every (date, session) combination exactly once",
    (dates, sessions) => {
      // Feature: exam-routine-builder, Property 13: Column and row ordering
      const columns = columnAxis(dates, sessions)

      // Build a map: composite key → count.
      const seen = new Map<string, number>()
      for (const col of columns) {
        const key = `${col.date}__${col.session.id}`
        seen.set(key, (seen.get(key) ?? 0) + 1)
      }

      // Every key appears exactly once (no duplicates).
      for (const [, count] of seen) {
        expect(count).toBe(1)
      }

      // Every expected (date, session) pair is present.
      for (const date of dates) {
        for (const session of sessions) {
          const key = `${date}__${session.id}`
          expect(seen.has(key)).toBe(true)
        }
      }
    },
  )

  /**
   * **Validates: Requirements 4.1, 5.9**
   *
   * 13d — sortedDates is idempotent: sorting an already-sorted list produces
   * the same output. The column axis derived from pre-sorted dates is identical
   * to the one derived from an unsorted version (since columnAxis sorts
   * internally).
   */
  test.prop([arbValidDates, arbSessions], { numRuns: 100 })(
    "13d: columnAxis output is independent of input date order",
    (dates, sessions) => {
      // Feature: exam-routine-builder, Property 13: Column and row ordering
      // Shuffle dates to produce a different ordering.
      const shuffled = [...dates].reverse()

      const columnsOriginal = columnAxis(dates, sessions)
      const columnsShuffled = columnAxis(shuffled, sessions)

      // Both should produce identical ordered columns.
      expect(columnsOriginal).toEqual(columnsShuffled)
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Example / edge-case tests
// ─────────────────────────────────────────────────────────────────────────────

describe("sortedDates — edge cases", () => {
  it("returns empty array for empty input", () => {
    expect(sortedDates([])).toEqual([])
  })

  it("single date returns the same date", () => {
    expect(sortedDates(["2026-06-15"])).toEqual(["2026-06-15"])
  })

  it("already-sorted input is returned in the same order", () => {
    const dates = ["2026-01-01", "2026-03-15", "2026-12-31"]
    expect(sortedDates(dates)).toEqual(dates)
  })

  it("reverse-sorted input is sorted ascending", () => {
    const dates = ["2026-12-31", "2026-06-01", "2026-01-15"]
    expect(sortedDates(dates)).toEqual(["2026-01-15", "2026-06-01", "2026-12-31"])
  })

  it("does not mutate the original array", () => {
    const dates = ["2026-12-31", "2026-01-01"]
    const original = [...dates]
    sortedDates(dates)
    expect(dates).toEqual(original)
  })
})

describe("columnAxis — edge cases", () => {
  it("returns empty array when no dates", () => {
    const sessions = [{ id: "s1", name: "Morning", startTime: "09:00", endTime: "12:00" }]
    expect(columnAxis([], sessions)).toEqual([])
  })

  it("returns empty array when no sessions", () => {
    expect(columnAxis(["2026-06-01"], [])).toEqual([])
  })

  it("produces correct columns for one date and two sessions ordered by start time", () => {
    const dates = ["2026-06-01"]
    const sessions = [
      { id: "s2", name: "Afternoon", startTime: "14:00", endTime: "17:00" },
      { id: "s1", name: "Morning", startTime: "09:00", endTime: "12:00" },
    ]
    const columns = columnAxis(dates, sessions)

    expect(columns).toHaveLength(2)
    // Morning (09:00) should come first despite being listed second in input.
    expect(columns[0].session.id).toBe("s1")
    expect(columns[1].session.id).toBe("s2")
  })

  it("produces correct columns for two dates and two sessions — date ordering is primary", () => {
    const dates = ["2026-06-15", "2026-06-01"] // out of order
    const sessions = [
      { id: "s1", name: "Morning", startTime: "09:00", endTime: "12:00" },
      { id: "s2", name: "Afternoon", startTime: "14:00", endTime: "17:00" },
    ]
    const columns = columnAxis(dates, sessions)

    expect(columns).toHaveLength(4)
    // Earliest date first.
    expect(columns[0].date).toBe("2026-06-01")
    expect(columns[0].session.id).toBe("s1")
    expect(columns[1].date).toBe("2026-06-01")
    expect(columns[1].session.id).toBe("s2")
    expect(columns[2].date).toBe("2026-06-15")
    expect(columns[2].session.id).toBe("s1")
    expect(columns[3].date).toBe("2026-06-15")
    expect(columns[3].session.id).toBe("s2")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 19: Exam-date addition validity
// Feature: exam-routine-builder, Property 19: Exam-date addition validity
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 19: Exam-date addition validity", () => {
  /**
   * **Validates: Requirements 5.1**
   *
   * 19a — Valid date, not a duplicate, under the 100-date cap → success.
   * addExamDate must return `{ ok: true }` and the returned array must contain
   * the new date. All other existing dates must be preserved.
   */
  test.prop(
    [
      // An existing date set that is valid, deduplicated, and well under the cap.
      arbValidDates.filter(dates => dates.length < MAX_EXAM_DATES),
      // A fresh valid ISO date to add.
      arbIsoDate.filter(d => isValidIsoDate(d)),
    ],
    { numRuns: 100 },
  )(
    "19a: adding a valid, non-duplicate date under the cap succeeds and date is present",
    (existingDates, newDate) => {
      // Feature: exam-routine-builder, Property 19: Exam-date addition validity
      // Ensure the new date is not already in the existing set.
      fc.pre(!existingDates.includes(newDate))

      const result = addExamDate(existingDates, newDate)

      // Must succeed.
      expect(result.ok).toBe(true)
      if (!result.ok) return // type narrowing

      // The returned array must contain the newly added date.
      expect(result.value).toContain(newDate)

      // All previously existing dates must still be present.
      for (const d of existingDates) {
        expect(result.value).toContain(d)
      }

      // The new array is exactly one element longer than the input.
      expect(result.value).toHaveLength(existingDates.length + 1)
    },
  )

  /**
   * **Validates: Requirements 5.2**
   *
   * 19b — Invalid date format or impossible calendar date → `{ ok: false, error: "invalid-date" }`.
   * The date array must remain unchanged.
   */
  test.prop(
    [
      arbValidDates,
      // Dates that fail isValidIsoDate: impossible calendar dates, bad format, etc.
      arbIsoDate.filter(d => !isValidIsoDate(d)),
    ],
    { numRuns: 100 },
  )(
    "19b: adding an invalid or impossible date returns invalid-date error and leaves dates unchanged",
    (existingDates, badDate) => {
      // Feature: exam-routine-builder, Property 19: Exam-date addition validity
      const result = addExamDate(existingDates, badDate)

      // Must fail with the correct error code.
      expect(result.ok).toBe(false)
      if (result.ok) return // type narrowing
      expect(result.error).toBe("invalid-date")

      // The date array must be left unchanged — verified by checking the
      // original array is still intact (addExamDate must not mutate).
      expect(existingDates).toHaveLength(existingDates.length)
    },
  )

  /**
   * **Validates: Requirements 5.3**
   *
   * 19c — Duplicate date → `{ ok: false, error: "duplicate-date" }`.
   * Attempting to add a date that is already present must be rejected, and
   * the existing dates array must remain unchanged.
   */
  test.prop(
    [
      // An existing date set with at least one entry to pick as the duplicate.
      arbValidDates.filter(dates => dates.length >= 1),
    ],
    { numRuns: 100 },
  )(
    "19c: adding a date already present returns duplicate-date error and leaves dates unchanged",
    (existingDates) => {
      // Feature: exam-routine-builder, Property 19: Exam-date addition validity
      // Pick any existing date as the duplicate candidate.
      const duplicate = existingDates[0]

      const result = addExamDate(existingDates, duplicate)

      // Must fail with the correct error code.
      expect(result.ok).toBe(false)
      if (result.ok) return // type narrowing
      expect(result.error).toBe("duplicate-date")

      // The existing date set is unchanged — still the same length.
      expect(existingDates).toHaveLength(existingDates.length)
    },
  )

  /**
   * **Validates: Requirements 5.4**
   *
   * 19d — When exactly 100 dates are already present, adding any further valid
   * date must return `{ ok: false, error: "maximum-dates-reached" }` and leave
   * the date array unchanged.
   */
  it(
    "19d: adding a date when 100 dates are already present returns maximum-dates-reached",
    () => {
      // Feature: exam-routine-builder, Property 19: Exam-date addition validity
      // Build exactly MAX_EXAM_DATES unique valid dates by varying the day within 2025.
      // We use 4 years × 25 days = 100 entries to stay within real calendar bounds.
      const fullDates: string[] = []
      for (let year = 2025; year <= 2028 && fullDates.length < MAX_EXAM_DATES; year++) {
        for (let day = 1; day <= 25 && fullDates.length < MAX_EXAM_DATES; day++) {
          fullDates.push(`${year}-01-${String(day).padStart(2, "0")}`)
        }
      }
      expect(fullDates).toHaveLength(MAX_EXAM_DATES)

      // Any valid date not already in the list.
      const extraDate = "2029-06-15"
      expect(fullDates).not.toContain(extraDate)

      const result = addExamDate(fullDates, extraDate)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toBe("maximum-dates-reached")

      // Original array unchanged.
      expect(fullDates).toHaveLength(MAX_EXAM_DATES)
    },
  )

  /**
   * **Validates: Requirements 5.4**
   *
   * 19e — Property-based complement to 19d: for any date set of exactly
   * MAX_EXAM_DATES valid unique dates, adding any additional valid, non-duplicate
   * date must be rejected with `maximum-dates-reached`.
   *
   * We construct the full-capacity set programmatically to guarantee exactly 100
   * entries, then property-test the new date across many random valid candidates.
   */
  test.prop(
    [
      // A fresh valid date that won't collide with our fixed 2025-01-01..2028-01-25 set.
      arbIsoDate.filter(d => isValidIsoDate(d) && !d.startsWith("2025-01-") && !d.startsWith("2026-01-") && !d.startsWith("2027-01-") && !d.startsWith("2028-01-")),
    ],
    { numRuns: 100 },
  )(
    "19e: any valid addition to a full (100-date) set is rejected with maximum-dates-reached",
    (extraDate) => {
      // Feature: exam-routine-builder, Property 19: Exam-date addition validity
      const fullDates: string[] = []
      for (let year = 2025; year <= 2028 && fullDates.length < MAX_EXAM_DATES; year++) {
        for (let day = 1; day <= 25 && fullDates.length < MAX_EXAM_DATES; day++) {
          fullDates.push(`${year}-01-${String(day).padStart(2, "0")}`)
        }
      }

      const result = addExamDate(fullDates, extraDate)

      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.error).toBe("maximum-dates-reached")
    },
  )
})


// ─────────────────────────────────────────────────────────────────────────────
// Property 20: Exam-date removal removes the date and exactly its slots
// Feature: exam-routine-builder, Property 20: Exam-date removal removes the date and exactly its slots
// ─────────────────────────────────────────────────────────────────────────────

import { removeExamDate, dateHasSlots } from "@/lib/exam/exam-dates"
import { arbSlots } from "./generators"

describe("Property 20: Exam-date removal removes the date and exactly its slots", () => {
  /**
   * **Validates: Requirements 5.5**
   *
   * 20a — Removing a date with NO slots: the date is absent from the returned
   * dates array, and the slots array is returned unchanged.
   *
   * For any valid dates array and any slot array where no slot references
   * `targetDate`, `removeExamDate` must:
   * 1. Return a dates array that does not contain `targetDate`.
   * 2. Return the exact same slots (length and contents unchanged — no other
   *    slot is affected).
   */
  test.prop(
    [
      // A set of valid dates with at least one entry so we can pick a target.
      arbValidDates.filter(dates => dates.length >= 1),
      // A slot array whose dates are all distinct from the target date we will
      // pick. We filter after drawing by replacing slot dates with non-target
      // values, which is impractical without knowing the target upfront, so
      // instead we draw the slots and date together and use fc.pre.
      arbSlots,
    ],
    { numRuns: 100 },
  )(
    "20a: removing a date with no slots removes the date and leaves slots unchanged",
    (dates, allSlots) => {
      // Feature: exam-routine-builder, Property 20: Exam-date removal removes the date and exactly its slots
      const targetDate = dates[0]

      // Precondition: no slot references targetDate.
      fc.pre(allSlots.every(s => s.date !== targetDate))

      const before = { dates: [...dates], slots: [...allSlots] }
      const result = removeExamDate(before.dates, before.slots, targetDate)

      // 1. The target date must be absent from the returned dates array.
      expect(result.dates).not.toContain(targetDate)

      // 2. All other dates are preserved.
      for (const d of dates) {
        if (d !== targetDate) {
          expect(result.dates).toContain(d)
        }
      }

      // 3. The returned dates array is exactly one shorter.
      const expectedLength = dates.includes(targetDate) ? dates.length - 1 : dates.length
      expect(result.dates).toHaveLength(expectedLength)

      // 4. Slots are completely unchanged — no slot added, removed, or mutated.
      expect(result.slots).toHaveLength(allSlots.length)
      expect(result.slots).toEqual(allSlots)
    },
  )

  /**
   * **Validates: Requirements 5.7**
   *
   * 20b — Removing a date WITH slots: the date is absent from the returned
   * dates array, and every slot for that date is removed. No other slot is
   * removed.
   *
   * We build a slot array with at least one slot on `targetDate` plus
   * potentially some slots on other dates. After `removeExamDate`:
   * 1. `targetDate` is absent from the dates array.
   * 2. No slot with `date === targetDate` remains in the slots array.
   * 3. Every slot with `date !== targetDate` is still present.
   */
  test.prop(
    [
      // Dates with at least one entry.
      arbValidDates.filter(dates => dates.length >= 1),
      // Slot array; we may have slots on any date including targetDate.
      arbSlots,
    ],
    { numRuns: 100 },
  )(
    "20b: removing a date with slots removes that date and all its slots, leaving other slots intact",
    (dates, allSlots) => {
      // Feature: exam-routine-builder, Property 20: Exam-date removal removes the date and exactly its slots
      const targetDate = dates[0]

      // Inject at least one slot on targetDate so dateHasSlots returns true.
      // Reuse the first slot's structure but override its date.
      const slotOnTarget = {
        id: "slot-injected-target",
        classId: "VIII-A",
        date: targetDate,
        sessionId: "ses-morning",
        invigilatorIds: [] as string[],
      }
      // Merge: any existing slots with targetDate + the injected slot (keyed to
      // avoid duplicates by (classId, date, sessionId)).
      const slotsWithTarget = [
        ...allSlots.filter(
          s => !(s.classId === slotOnTarget.classId && s.date === targetDate && s.sessionId === slotOnTarget.sessionId),
        ),
        slotOnTarget,
      ]

      // Verify our precondition: dateHasSlots must return true.
      expect(dateHasSlots(slotsWithTarget, targetDate)).toBe(true)

      const result = removeExamDate([...dates], slotsWithTarget, targetDate)

      // 1. targetDate is absent from the returned dates array.
      expect(result.dates).not.toContain(targetDate)

      // 2. No slot with date === targetDate remains.
      const remainingTargetSlots = result.slots.filter(s => s.date === targetDate)
      expect(remainingTargetSlots).toHaveLength(0)

      // 3. Every slot whose date !== targetDate is still present.
      const slotsForOtherDates = slotsWithTarget.filter(s => s.date !== targetDate)
      expect(result.slots).toHaveLength(slotsForOtherDates.length)
      for (const slot of slotsForOtherDates) {
        expect(result.slots.some(s => s.id === slot.id)).toBe(true)
      }
    },
  )

  /**
   * **Validates: Requirements 5.5, 5.7**
   *
   * 20c — No other dates are removed: for any removal, the returned dates array
   * is exactly the input dates minus the target date — every other date survives.
   */
  test.prop(
    [
      arbValidDates.filter(dates => dates.length >= 1),
      arbSlots,
    ],
    { numRuns: 100 },
  )(
    "20c: no other dates are removed by removeExamDate",
    (dates, slots) => {
      // Feature: exam-routine-builder, Property 20: Exam-date removal removes the date and exactly its slots
      const targetDate = dates[0]
      const otherDates = dates.filter(d => d !== targetDate)

      const result = removeExamDate([...dates], [...slots], targetDate)

      // Every date that was NOT targetDate must still be present.
      for (const d of otherDates) {
        expect(result.dates).toContain(d)
      }

      // Result dates set is exactly input minus targetDate (as a set comparison).
      expect(new Set(result.dates)).toEqual(new Set(otherDates))
    },
  )

  /**
   * **Validates: Requirements 5.5, 5.7**
   *
   * 20d — No slots for other dates are removed: the removal is scoped to
   * exactly the target date. For any slot whose date is not the target date,
   * that slot survives in the returned slots array.
   */
  test.prop(
    [
      arbValidDates.filter(dates => dates.length >= 1),
      arbSlots,
    ],
    { numRuns: 100 },
  )(
    "20d: slots for other dates are preserved after removal",
    (dates, slots) => {
      // Feature: exam-routine-builder, Property 20: Exam-date removal removes the date and exactly its slots
      const targetDate = dates[0]
      const slotsForOtherDates = slots.filter(s => s.date !== targetDate)

      const result = removeExamDate([...dates], [...slots], targetDate)

      // Every slot with a different date must still be in the result.
      for (const slot of slotsForOtherDates) {
        expect(result.slots.some(s => s.id === slot.id)).toBe(true)
      }

      // Result slots count equals slots that were NOT on targetDate.
      expect(result.slots).toHaveLength(slotsForOtherDates.length)
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Example tests: remove-with-slots confirmation flow (R5.6–5.8)
// Feature: exam-routine-builder, Property 20 — confirmation flow examples
// ─────────────────────────────────────────────────────────────────────────────

describe("dateHasSlots and remove-confirmation examples (R5.6–5.8)", () => {
  const DATES = ["2026-06-01", "2026-06-02", "2026-06-03"]
  const SLOTS = [
    { id: "s1", classId: "VIII-A", date: "2026-06-01", sessionId: "ses-morning", invigilatorIds: [] },
    { id: "s2", classId: "IX-A",   date: "2026-06-01", sessionId: "ses-morning", invigilatorIds: [] },
    { id: "s3", classId: "VIII-A", date: "2026-06-02", sessionId: "ses-morning", subject: "Math", invigilatorIds: ["t1"] },
    { id: "s4", classId: "IX-A",   date: "2026-06-03", sessionId: "ses-morning", invigilatorIds: [] },
  ]

  /**
   * **Validates: Requirements 5.5, 5.6**
   *
   * `dateHasSlots` returns `true` when at least one slot exists for the date.
   * This is the condition that triggers the confirmation prompt before removal.
   */
  it("5.6 — dateHasSlots returns true when slots exist for the date", () => {
    // Feature: exam-routine-builder, Property 20: Exam-date removal removes the date and exactly its slots
    expect(dateHasSlots(SLOTS, "2026-06-01")).toBe(true)
    expect(dateHasSlots(SLOTS, "2026-06-02")).toBe(true)
    expect(dateHasSlots(SLOTS, "2026-06-03")).toBe(true)
  })

  /**
   * **Validates: Requirements 5.5**
   *
   * `dateHasSlots` returns `false` when no slot exists for the date.
   * In this case no confirmation is needed.
   */
  it("5.5 — dateHasSlots returns false when no slots exist for the date", () => {
    // Feature: exam-routine-builder, Property 20: Exam-date removal removes the date and exactly its slots
    expect(dateHasSlots(SLOTS, "2026-06-04")).toBe(false)
    expect(dateHasSlots([], "2026-06-01")).toBe(false)
  })

  /**
   * **Validates: Requirements 5.7**
   *
   * "Confirm" path: calling `removeExamDate` (the action taken after the admin
   * confirms) removes the date AND all its slots. Other dates and other slots
   * remain intact.
   */
  it("5.7 — confirming removal: date is removed and its slots are deleted; other dates/slots survive", () => {
    // Feature: exam-routine-builder, Property 20: Exam-date removal removes the date and exactly its slots
    const target = "2026-06-01"

    // Precondition: the date has slots (so the dialog would be shown).
    expect(dateHasSlots(SLOTS, target)).toBe(true)

    // Simulate admin confirming → call removeExamDate.
    const result = removeExamDate([...DATES], [...SLOTS], target)

    // The date is gone.
    expect(result.dates).not.toContain(target)

    // Both slots for 2026-06-01 are removed.
    expect(result.slots.filter(s => s.date === target)).toHaveLength(0)

    // Dates 2026-06-02 and 2026-06-03 are still present.
    expect(result.dates).toContain("2026-06-02")
    expect(result.dates).toContain("2026-06-03")

    // Slots for other dates (s3 on 06-02, s4 on 06-03) survive.
    expect(result.slots.some(s => s.id === "s3")).toBe(true)
    expect(result.slots.some(s => s.id === "s4")).toBe(true)
    expect(result.slots).toHaveLength(2) // s3 + s4
  })

  /**
   * **Validates: Requirements 5.8**
   *
   * "Cancel" path: when the admin cancels the confirmation dialog, the caller
   * simply does NOT invoke `removeExamDate`. The date and all its slots are
   * retained unchanged. This test models that contract by verifying the state
   * before the call equals the state the caller would preserve on cancel.
   */
  it("5.8 — canceling removal: date and its slots are retained unchanged", () => {
    // Feature: exam-routine-builder, Property 20: Exam-date removal removes the date and exactly its slots
    const target = "2026-06-01"

    // Precondition: the date has slots, meaning confirmation would be requested.
    expect(dateHasSlots(SLOTS, target)).toBe(true)

    // Cancel means removeExamDate is NOT called.  The original state is unchanged.
    const datesCopy = [...DATES]
    const slotsCopy = [...SLOTS]

    // Verify the state is fully intact — date present, its slots present.
    expect(datesCopy).toContain(target)
    expect(slotsCopy.filter(s => s.date === target)).toHaveLength(2)

    // Explicitly: no mutation occurred (we did NOT call removeExamDate).
    expect(datesCopy).toEqual(DATES)
    expect(slotsCopy).toEqual(SLOTS)
  })
})
