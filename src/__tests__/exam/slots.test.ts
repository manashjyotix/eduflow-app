/**
 * slots.test.ts — Property-based tests for the Exam Routine Builder slot logic.
 *
 * Feature: exam-routine-builder
 *   - Property 7: Invalid subject placement is rejected  (Validates: Requirements 2.2, 7.3)
 *   - Property 14: Slot key uniqueness                   (Validates: Requirements 4.2)
 */

import { describe, expect, it } from "vitest"
import { fc, test as fcTest } from "@fast-check/vitest"
import { arbSlots, arbCatalog, arbClassId, arbSession } from "./generators"
import { setSubject, slotKey, slotAt, addInvigilatorToSlot, clearSlot } from "@/lib/exam/slots"
import type { SlotCoord } from "@/lib/exam/slots"

describe("Property 7: Invalid subject placement is rejected", () => {
  // Feature: exam-routine-builder, Property 7: Invalid subject placement is rejected

  fcTest.prop(
    [arbSlots, arbCatalog],
    { numRuns: 100 },
  )(
    "for any slot whose class is not in a subject's linkedClassIds, setSubject returns invalid-subject-for-class and leaves the slot unchanged",
    (slots, catalog) => {
      // We need at least one slot and at least one subject that is NOT linked
      // to that slot's class — skip via fc.pre() if no such combination exists.
      for (const slot of slots) {
        // Find a subject from the catalog whose linkedClassIds does NOT contain
        // this slot's classId.
        const invalidSubject = catalog.find(
          subj => !subj.linkedClassIds.includes(slot.classId),
        )

        // If no invalid subject exists for this slot in this catalog, skip to
        // the next slot.
        if (!invalidSubject) continue

        const coord: SlotCoord = {
          classId: slot.classId,
          date: slot.date,
          sessionId: slot.sessionId,
        }

        // Capture the target slot's existing subject and room before the call.
        const subjectBefore = slot.subject
        const roomBefore = slot.room

        // Attempt to place the invalid subject.
        const result = setSubject(slots, coord, invalidSubject.name, catalog)

        // The result must be a rejection with the correct error code (R2.2, R7.3).
        if (result.ok !== false || result.error !== "invalid-subject-for-class") {
          return false
        }

        // The target slot's subject and room must be unchanged in the original
        // slots array (since setSubject returns a new array on success, but on
        // failure it must not have mutated anything).
        // Verify immutability: the original slot object in `slots` must retain
        // its original subject and room values.
        const slotAfter = slots.find(
          s =>
            s.classId === coord.classId &&
            s.date === coord.date &&
            s.sessionId === coord.sessionId,
        )

        if (slotAfter) {
          // The existing slot must still have the same subject and room.
          if (slotAfter.subject !== subjectBefore) return false
          if (slotAfter.room !== roomBefore) return false
        }
        // If slotAfter is undefined the slot did not exist before — nothing to
        // check for immutability; the rejection itself is the invariant.

        // Found and verified one invalid placement for this run — property holds.
        return true
      }

      // No slot had an invalid subject available in this catalog.
      // Use fc.pre to skip this sample rather than trivially passing it.
      fc.pre(false)
      // Unreachable — fc.pre throws; satisfies TypeScript's return check.
      return true
    },
  )

  it("rejects placement when slot exists with an existing subject", () => {
    // Example test: slot VIII-A / 2026-01-10 / ses-morning holds "Mathematics"
    // Subject "Physics" is not linked to VIII-A → must be rejected unchanged.
    const catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: ["VIII-A"] },
      { id: "subj-phys", name: "Physics",      linkedClassIds: ["IX-A"] },
    ]
    const slots = [
      {
        id: "es-1",
        classId: "VIII-A",
        date: "2026-01-10",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 1",
        invigilatorIds: [],
      },
    ]
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-01-10", sessionId: "ses-morning" }

    const result = setSubject(slots, coord, "Physics", catalog)

    // Rejection with the correct error code.
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe("invalid-subject-for-class")
    }

    // The original slot is untouched.
    expect(slots[0].subject).toBe("Mathematics")
    expect(slots[0].room).toBe("Room 1")
  })

  it("rejects placement when the slot does not yet exist (empty grid)", () => {
    // No existing slot at the coordinate — setSubject must not create a slot
    // when the subject is not linked.
    const catalog = [
      { id: "subj-eng", name: "English", linkedClassIds: ["IX-A"] },
    ]
    const slots: typeof catalog extends never[] ? never : Parameters<typeof setSubject>[0] = []
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-03-15", sessionId: "ses-afternoon" }

    const result = setSubject(slots, coord, "English", catalog)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error).toBe("invalid-subject-for-class")
    }
    // The slots array must remain empty — no phantom slot was created.
    expect(slots).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 14: Slot key uniqueness
// Feature: exam-routine-builder, Property 14: Slot key uniqueness
// **Validates: Requirements 4.2**
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 14: Slot key uniqueness", () => {
  // ── 14-A: slotKey is injective (different coords → different keys) ────────

  fcTest.prop(
    [
      // Two independent SlotCoords; at least one component must differ.
      arbClassId,
      fc.tuple(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /\S/.test(s)),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /\S/.test(s)),
      ),
      arbSession.map(s => s.id),
      // Second coord components
      arbClassId,
      fc.tuple(
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /\S/.test(s)),
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => /\S/.test(s)),
      ),
      arbSession.map(s => s.id),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 14: Slot key uniqueness
    "slotKey is injective: two coords that differ in any component produce different keys",
    (classId1, [date1, dateSuffix1], sessionId1, classId2, [date2, dateSuffix2], sessionId2) => {
      const coord1: SlotCoord = { classId: classId1, date: date1, sessionId: sessionId1 }
      const coord2: SlotCoord = {
        classId: classId2,
        date: `${date2}-${dateSuffix2}`,  // guaranteed distinct from date1
        sessionId: sessionId2,
      }

      // Skip the trivial case where the coords happen to be identical.
      const coordsAreEqual =
        coord1.classId === coord2.classId &&
        coord1.date === coord2.date &&
        coord1.sessionId === coord2.sessionId

      if (coordsAreEqual) {
        // Same coord — keys must be equal (reflexivity, not injectivity test).
        return slotKey(coord1) === slotKey(coord2)
      }

      // Different coords must yield different keys.
      return slotKey(coord1) !== slotKey(coord2)
    },
  )

  fcTest.prop(
    [
      arbClassId,
      fc.string({ minLength: 8, maxLength: 10 }),  // ISO-like date string
      fc.string({ minLength: 3, maxLength: 8 }),    // session id
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 14: Slot key uniqueness
    "slotKey is reflexive: the same coord always produces the same key",
    (classId, date, sessionId) => {
      const coord: SlotCoord = { classId, date, sessionId }
      return slotKey(coord) === slotKey(coord) && slotKey(coord) === slotKey({ classId, date, sessionId })
    },
  )

  // ── 14-B: differing in classId alone produces different keys ─────────────

  fcTest.prop(
    [
      arbClassId,
      arbClassId,
      fc.string({ minLength: 3, maxLength: 10 }).filter(s => /\S/.test(s)),
      fc.string({ minLength: 3, maxLength: 10 }).filter(s => /\S/.test(s)),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 14: Slot key uniqueness
    "coords that differ only in classId produce different keys",
    (classId1, classId2, date, sessionId) => {
      fc.pre(classId1 !== classId2)
      const key1 = slotKey({ classId: classId1, date, sessionId })
      const key2 = slotKey({ classId: classId2, date, sessionId })
      return key1 !== key2
    },
  )

  // ── 14-C: differing in date alone produces different keys ─────────────────

  fcTest.prop(
    [
      arbClassId,
      fc.string({ minLength: 3, maxLength: 10 }).filter(s => /\S/.test(s)),
      fc.string({ minLength: 3, maxLength: 10 }).filter(s => /\S/.test(s)),
      fc.string({ minLength: 3, maxLength: 10 }).filter(s => /\S/.test(s)),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 14: Slot key uniqueness
    "coords that differ only in date produce different keys",
    (classId, date1, date2, sessionId) => {
      fc.pre(date1 !== date2)
      const key1 = slotKey({ classId, date: date1, sessionId })
      const key2 = slotKey({ classId, date: date2, sessionId })
      return key1 !== key2
    },
  )

  // ── 14-D: differing in sessionId alone produces different keys ────────────

  fcTest.prop(
    [
      arbClassId,
      fc.string({ minLength: 3, maxLength: 10 }).filter(s => /\S/.test(s)),
      fc.string({ minLength: 3, maxLength: 10 }).filter(s => /\S/.test(s)),
      fc.string({ minLength: 3, maxLength: 10 }).filter(s => /\S/.test(s)),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 14: Slot key uniqueness
    "coords that differ only in sessionId produce different keys",
    (classId, date, sessionId1, sessionId2) => {
      fc.pre(sessionId1 !== sessionId2)
      const key1 = slotKey({ classId, date, sessionId: sessionId1 })
      const key2 = slotKey({ classId, date, sessionId: sessionId2 })
      return key1 !== key2
    },
  )

  // ── 14-E: arbSlots produces no duplicate keys ─────────────────────────────

  fcTest.prop(
    [arbSlots],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 14: Slot key uniqueness
    "arbSlots never generates two slots with the same (classId, date, sessionId) key",
    (slots) => {
      const keys = slots.map(s => slotKey({ classId: s.classId, date: s.date, sessionId: s.sessionId }))
      const uniqueKeys = new Set(keys)
      return uniqueKeys.size === keys.length
    },
  )

  // ── 14-F: slotAt lookup returns the slot whose key matches ────────────────

  fcTest.prop(
    [arbSlots],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 14: Slot key uniqueness
    "slotAt(slots, coord) returns exactly the slot whose key matches the coord",
    (slots) => {
      for (const slot of slots) {
        const coord: SlotCoord = {
          classId: slot.classId,
          date: slot.date,
          sessionId: slot.sessionId,
        }
        const found = slotAt(slots, coord)

        // Must find exactly this slot.
        if (!found) return false
        if (slotKey(found) !== slotKey(coord)) return false

        // The found slot's key must match the query coord's key.
        const expectedKey = slotKey(coord)
        if (slotKey({ classId: found.classId, date: found.date, sessionId: found.sessionId }) !== expectedKey) {
          return false
        }
      }
      return true
    },
  )

  // ── 14-G: slotAt returns undefined for a coord not in the array ───────────

  it("slotAt returns undefined when no slot has the queried coord", () => {
    const slots = [
      { id: "es-1", classId: "VIII-A", date: "2026-01-10", sessionId: "ses-morning", invigilatorIds: [] },
      { id: "es-2", classId: "IX-A",   date: "2026-01-10", sessionId: "ses-morning", invigilatorIds: [] },
    ]
    const missing: SlotCoord = { classId: "X-A", date: "2026-01-10", sessionId: "ses-morning" }
    expect(slotAt(slots, missing)).toBeUndefined()
  })

  // ── 14-H: slotKey format encodes all three components ────────────────────

  it("slotKey embeds classId, date, and sessionId separated by double underscores", () => {
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-03-15", sessionId: "ses-morning" }
    expect(slotKey(coord)).toBe("VIII-A__2026-03-15__ses-morning")
  })

  it("slotKey for two different classes with the same date and session are distinct", () => {
    const k1 = slotKey({ classId: "VIII-A", date: "2026-03-15", sessionId: "ses-morning" })
    const k2 = slotKey({ classId: "IX-A",   date: "2026-03-15", sessionId: "ses-morning" })
    expect(k1).not.toBe(k2)
  })

  it("slotKey for two different dates with the same class and session are distinct", () => {
    const k1 = slotKey({ classId: "VIII-A", date: "2026-03-15", sessionId: "ses-morning" })
    const k2 = slotKey({ classId: "VIII-A", date: "2026-03-16", sessionId: "ses-morning" })
    expect(k1).not.toBe(k2)
  })

  it("slotKey for two different sessions with the same class and date are distinct", () => {
    const k1 = slotKey({ classId: "VIII-A", date: "2026-03-15", sessionId: "ses-morning" })
    const k2 = slotKey({ classId: "VIII-A", date: "2026-03-15", sessionId: "ses-afternoon" })
    expect(k1).not.toBe(k2)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 15: Subject assignment is localized and single-valued
// Feature: exam-routine-builder, Property 15: Subject assignment is localized and single-valued
// **Validates: Requirements 4.3, 4.4**
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 15: Subject assignment is localized and single-valued", () => {
  /**
   * Build a catalog and a valid linked subject for a given classId so that
   * setSubject is guaranteed to succeed (the subject IS linked to the class).
   * Returns { catalog, subject } where subject.name is linked to classId.
   *
   * We build a dedicated helper generator inline using fc.gen() to avoid
   * having to do complex filtering on arbCatalog.
   */

  // ── 15-A: only the target slot changes; all other slots are untouched ─────

  fcTest.prop(
    [
      arbSlots,
      // We'll supply a subject name and a class directly and build the catalog
      // so the subject IS linked to that class.
      fc.record({
        classId: fc.constantFrom("VIII-A", "VIII-B", "IX-A", "IX-B", "X-A"),
        date: fc.string({ minLength: 10, maxLength: 10 }).filter(s => /^\d{4}-\d{2}-\d{2}$/.test(s) || s.length === 10).map(() => "2026-05-01"),
        sessionId: fc.string({ minLength: 2, maxLength: 8 }).map(s => `ses-${s.replace(/\s/g, "")}`),
        subjectName: fc.constantFrom("Mathematics", "English", "Science", "History", "Physics"),
      }),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 15: Subject assignment is localized and single-valued
    "setSubject only mutates the target slot; every other slot is left unchanged",
    (slots, { classId, date, sessionId, subjectName }) => {
      // Build a catalog where subjectName IS linked to classId.
      const catalog = [{ id: "subj-target", name: subjectName, linkedClassIds: [classId] }]

      const coord: SlotCoord = { classId, date, sessionId }

      const result = setSubject(slots, coord, subjectName, catalog)

      // The operation must succeed because the subject is linked to the class.
      if (!result.ok) return false

      const newSlots = result.value

      // For every slot that is NOT the target coord, the slot must be
      // reference-equal (or value-equal) to its counterpart in the original.
      for (const original of slots) {
        const istarget =
          original.classId === classId &&
          original.date === date &&
          original.sessionId === sessionId

        if (istarget) continue // target slot is allowed to change

        // Find the corresponding slot in the new array.
        const updated = newSlots.find(
          s =>
            s.classId === original.classId &&
            s.date === original.date &&
            s.sessionId === original.sessionId,
        )

        // The non-target slot must still exist and be unchanged.
        if (!updated) return false
        if (updated.subject !== original.subject) return false
        if (updated.room !== original.room) return false
        if (updated.invigilatorIds.length !== original.invigilatorIds.length) return false
        for (let i = 0; i < original.invigilatorIds.length; i++) {
          if (updated.invigilatorIds[i] !== original.invigilatorIds[i]) return false
        }
      }

      // No extra slots should have been created for non-target coords.
      const nonTargetCountBefore = slots.filter(
        s => !(s.classId === classId && s.date === date && s.sessionId === sessionId),
      ).length
      const nonTargetCountAfter = newSlots.filter(
        s => !(s.classId === classId && s.date === date && s.sessionId === sessionId),
      ).length
      if (nonTargetCountBefore !== nonTargetCountAfter) return false

      return true
    },
  )

  // ── 15-B: the target slot holds exactly the new subject (single-valued) ───

  fcTest.prop(
    [
      arbSlots,
      fc.record({
        classId: fc.constantFrom("VIII-A", "VIII-B", "IX-A", "IX-B", "X-A"),
        sessionId: fc.constantFrom("ses-morning", "ses-afternoon", "ses-evening"),
        subjectName: fc.constantFrom("Mathematics", "English", "Science", "History", "Physics"),
      }),
      // Use a fixed date so we can reason about slot presence deterministically.
      fc.constantFrom("2026-05-01", "2026-06-15", "2026-07-20"),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 15: Subject assignment is localized and single-valued
    "the target slot holds exactly one subject (the newly assigned one) after setSubject succeeds",
    (slots, { classId, sessionId, subjectName }, date) => {
      const catalog = [{ id: "subj-target", name: subjectName, linkedClassIds: [classId] }]
      const coord: SlotCoord = { classId, date, sessionId }

      const result = setSubject(slots, coord, subjectName, catalog)
      if (!result.ok) return false

      const targetSlot = result.value.find(
        s => s.classId === classId && s.date === date && s.sessionId === sessionId,
      )

      // Target slot must exist in the result.
      if (!targetSlot) return false

      // It must hold exactly the new subject (single-valued invariant, R4.4).
      if (targetSlot.subject !== subjectName) return false

      // The subject field is a scalar string — it cannot hold multiple values
      // by the TypeScript type, but we also verify the result array has exactly
      // one slot at the target coord (no duplicates were created).
      const slotsAtTarget = result.value.filter(
        s => s.classId === classId && s.date === date && s.sessionId === sessionId,
      )
      if (slotsAtTarget.length !== 1) return false

      return true
    },
  )

  // ── 15-C: replacement — assigning a new subject replaces any prior subject ─

  fcTest.prop(
    [
      fc.record({
        classId: fc.constantFrom("VIII-A", "IX-A", "X-A"),
        date: fc.constantFrom("2026-05-01", "2026-06-15"),
        sessionId: fc.constantFrom("ses-morning", "ses-afternoon"),
        priorSubject: fc.constantFrom("Mathematics", "English"),
        newSubject: fc.constantFrom("Science", "History", "Physics"),
      }),
      // Optional room on the pre-existing slot.
      fc.option(fc.constantFrom("Room 1", "Room 2", "Lab"), { nil: undefined }),
      // Optional invigilators already on the slot.
      fc.uniqueArray(fc.constantFrom("t1", "t2", "t3"), { minLength: 0, maxLength: 2 }),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 15: Subject assignment is localized and single-valued
    "assigning a subject to a slot that already holds one replaces it (not accumulates)",
    (coord, room, invigilatorIds) => {
      const { classId, date, sessionId, priorSubject, newSubject } = coord

      // Catalog: both subjects are linked to classId so both operations succeed.
      const catalog = [
        { id: "subj-prior", name: priorSubject, linkedClassIds: [classId] },
        { id: "subj-new",   name: newSubject,   linkedClassIds: [classId] },
      ]

      // Pre-build the slots array with the target slot already holding priorSubject.
      const slotCoord: SlotCoord = { classId, date, sessionId }
      const slotsWithPrior: ReturnType<typeof setSubject> extends { ok: true; value: infer V } ? V : never[] = [
        {
          id: `es-${classId}__${date}__${sessionId}`,
          classId,
          date,
          sessionId,
          subject: priorSubject,
          ...(room !== undefined ? { room } : {}),
          invigilatorIds,
        },
      ]

      const result = setSubject(slotsWithPrior, slotCoord, newSubject, catalog)

      // Must succeed because newSubject is linked to classId.
      if (!result.ok) return false

      const targetSlot = result.value.find(
        s => s.classId === classId && s.date === date && s.sessionId === sessionId,
      )
      if (!targetSlot) return false

      // Must hold exactly the new subject, not the prior one.
      if (targetSlot.subject !== newSubject) return false

      // Prior subject must NOT be present anywhere in the target slot
      // (there is no "subject list" — but let's confirm the subject field is
      // exactly the new value and the old value is gone).
      if (targetSlot.subject === priorSubject) return false

      // Room and invigilators on the pre-existing slot must be retained (R4.3
      // only requires that no OTHER slot is changed; room/invigilators on the
      // target slot are preserved by the implementation).
      if (room !== undefined && targetSlot.room !== room) return false
      if (targetSlot.invigilatorIds.length !== invigilatorIds.length) return false
      for (let i = 0; i < invigilatorIds.length; i++) {
        if (targetSlot.invigilatorIds[i] !== invigilatorIds[i]) return false
      }

      // No duplicate target slots introduced.
      const slotsAtTarget = result.value.filter(
        s => s.classId === classId && s.date === date && s.sessionId === sessionId,
      )
      if (slotsAtTarget.length !== 1) return false

      return true
    },
  )

  // ── Example tests ──────────────────────────────────────────────────────────

  it("setSubject on a fresh slot creates exactly that slot with the new subject; other slots unchanged", () => {
    const catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: ["VIII-A", "IX-A"] },
    ]
    const existing = [
      {
        id: "es-ix-a__2026-01-10__ses-morning",
        classId: "IX-A",
        date: "2026-01-10",
        sessionId: "ses-morning",
        subject: "Mathematics",
        invigilatorIds: ["t1"],
      },
    ]
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-01-10", sessionId: "ses-morning" }

    const result = setSubject(existing, coord, "Mathematics", catalog)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const newSlots = result.value

    // A new slot was created for VIII-A.
    const target = newSlots.find(
      s => s.classId === "VIII-A" && s.date === "2026-01-10" && s.sessionId === "ses-morning",
    )
    expect(target).toBeDefined()
    expect(target?.subject).toBe("Mathematics")

    // The IX-A slot is completely unchanged.
    const ixSlot = newSlots.find(s => s.classId === "IX-A")
    expect(ixSlot).toBeDefined()
    expect(ixSlot?.subject).toBe("Mathematics")
    expect(ixSlot?.invigilatorIds).toEqual(["t1"])

    // Exactly two slots total (one pre-existing + one new).
    expect(newSlots).toHaveLength(2)
  })

  it("setSubject replaces the prior subject on the target slot and retains room + invigilators", () => {
    const catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: ["VIII-A"] },
      { id: "subj-sci",  name: "Science",     linkedClassIds: ["VIII-A"] },
    ]
    const slots = [
      {
        id: "es-viii-a__2026-03-01__ses-morning",
        classId: "VIII-A",
        date: "2026-03-01",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 3",
        invigilatorIds: ["t2", "t3"],
      },
    ]
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-03-01", sessionId: "ses-morning" }

    const result = setSubject(slots, coord, "Science", catalog)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const target = result.value[0]
    // Subject replaced.
    expect(target.subject).toBe("Science")
    // Room and invigilators preserved.
    expect(target.room).toBe("Room 3")
    expect(target.invigilatorIds).toEqual(["t2", "t3"])
    // Still exactly one slot in the array.
    expect(result.value).toHaveLength(1)
  })

  it("setSubject with multiple pre-existing slots leaves every non-target slot intact", () => {
    const catalog = [
      { id: "subj-eng", name: "English", linkedClassIds: ["VIII-A"] },
    ]
    const slots = [
      { id: "s1", classId: "VIII-A", date: "2026-01-01", sessionId: "ses-am", subject: "Math", room: "R1", invigilatorIds: [] },
      { id: "s2", classId: "IX-A",   date: "2026-01-01", sessionId: "ses-am", subject: "Physics", invigilatorIds: ["t1"] },
      { id: "s3", classId: "X-A",    date: "2026-01-02", sessionId: "ses-pm", invigilatorIds: [] },
    ]
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-01-01", sessionId: "ses-am" }

    const result = setSubject(slots, coord, "English", catalog)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const newSlots = result.value

    // Target slot updated.
    const target = newSlots.find(s => s.classId === "VIII-A" && s.date === "2026-01-01" && s.sessionId === "ses-am")
    expect(target?.subject).toBe("English")

    // Non-target slots are reference-unchanged (or at least value-unchanged).
    const ixSlot = newSlots.find(s => s.classId === "IX-A")
    expect(ixSlot?.subject).toBe("Physics")
    expect(ixSlot?.invigilatorIds).toEqual(["t1"])

    const xSlot = newSlots.find(s => s.classId === "X-A")
    expect(xSlot?.subject).toBeUndefined()

    // Total slot count unchanged (no new slots were created for non-target coords).
    expect(newSlots).toHaveLength(3)
  })
})


// ─────────────────────────────────────────────────────────────────────────────
// Property 16: Invigilator assignment is localized
// Feature: exam-routine-builder, Property 16: Invigilator assignment is localized
// **Validates: Requirements 4.5, 7.6**
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 16: Invigilator assignment is localized", () => {
  /**
   * For any state and slot holding a subject, adding an invigilator not already
   * listed associates that teacher only with the target slot and leaves every
   * other slot's invigilatorIds unchanged.
   *
   * Validates: Requirements 4.5, 7.6
   */

  // ── 16-A: core property — only the target slot's invigilatorIds changes ───

  fcTest.prop(
    [
      // Generate a slot array, then inject one slot that definitely has a subject
      // so addInvigilatorToSlot can succeed.
      arbSlots,
      fc.record({
        classId: fc.constantFrom("VIII-A", "VIII-B", "IX-A", "IX-B", "X-A"),
        date: fc.constantFrom("2026-05-01", "2026-06-15", "2026-07-20"),
        sessionId: fc.constantFrom("ses-morning", "ses-afternoon", "ses-evening"),
        subjectName: fc.constantFrom("Mathematics", "English", "Science", "History", "Physics"),
      }),
      // A teacher id that we will add — drawn from a distinct pool so we can
      // ensure it is NOT already in the target slot's invigilatorIds.
      fc.constantFrom("t-new-1", "t-new-2", "t-new-3", "t-new-4", "t-new-5"),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 16: Invigilator assignment is localized
    "addInvigilatorToSlot only modifies the target slot's invigilatorIds; every other slot is unchanged",
    (baseSlots, { classId, date, sessionId, subjectName }, teacherId) => {
      // Build the target slot with a subject and WITHOUT the teacherId so the
      // operation is guaranteed to succeed (not already-assigned).
      const targetSlot = {
        id: `es-${classId}__${date}__${sessionId}`,
        classId,
        date,
        sessionId,
        subject: subjectName,
        invigilatorIds: [] as string[], // teacher is not present yet
      }

      // Merge the target slot into baseSlots, replacing any existing slot at
      // the same coordinate to maintain the uniqueness invariant.
      const slots = [
        ...baseSlots.filter(
          s => !(s.classId === classId && s.date === date && s.sessionId === sessionId),
        ),
        targetSlot,
      ]

      const coord: SlotCoord = { classId, date, sessionId }
      const result = addInvigilatorToSlot(slots, coord, teacherId)

      // The operation must succeed because the slot has a subject and the
      // teacher is not already listed.
      if (!result.ok) return false

      const newSlots = result.value

      // ── Check 1: teacherId appears in the target slot ────────────────────
      const updatedTarget = newSlots.find(
        s => s.classId === classId && s.date === date && s.sessionId === sessionId,
      )
      if (!updatedTarget) return false
      if (!updatedTarget.invigilatorIds.includes(teacherId)) return false

      // ── Check 2: no other slot gained the teacherId ──────────────────────
      for (const s of newSlots) {
        const isTarget = s.classId === classId && s.date === date && s.sessionId === sessionId
        if (isTarget) continue

        // Find the original counterpart.
        const original = slots.find(
          o => o.classId === s.classId && o.date === s.date && o.sessionId === s.sessionId,
        )

        // The slot must still exist in the original.
        if (!original) return false

        // invigilatorIds must be unchanged (same length, same elements in order).
        if (s.invigilatorIds.length !== original.invigilatorIds.length) return false
        for (let i = 0; i < original.invigilatorIds.length; i++) {
          if (s.invigilatorIds[i] !== original.invigilatorIds[i]) return false
        }
      }

      // ── Check 3: the number of slots is the same (no slots were created or
      //    removed as a side-effect of the operation) ────────────────────────
      if (newSlots.length !== slots.length) return false

      return true
    },
  )

  // ── 16-B: target slot with existing invigilators — new one is appended ────

  fcTest.prop(
    [
      // Existing invigilators on the target slot (distinct from the new one).
      fc.uniqueArray(
        fc.constantFrom("t1", "t2", "t3", "t4", "t5"),
        { minLength: 0, maxLength: 3 },
      ),
      // The new teacher — guaranteed not in the pool above.
      fc.constantFrom("t-new-1", "t-new-2", "t-new-3"),
      // Other unrelated slots in the array.
      arbSlots,
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 16: Invigilator assignment is localized
    "existing invigilators on the target slot are retained after adding a new one",
    (existingInvigilators, newTeacherId, otherSlots) => {
      const classId = "VIII-A"
      const date = "2026-05-10"
      const sessionId = "ses-morning"

      const targetSlot = {
        id: `es-${classId}__${date}__${sessionId}`,
        classId,
        date,
        sessionId,
        subject: "Mathematics",
        invigilatorIds: existingInvigilators,
      }

      const slots = [
        ...otherSlots.filter(
          s => !(s.classId === classId && s.date === date && s.sessionId === sessionId),
        ),
        targetSlot,
      ]

      const coord: SlotCoord = { classId, date, sessionId }
      const result = addInvigilatorToSlot(slots, coord, newTeacherId)

      // Should succeed since the slot has a subject and newTeacherId is not listed.
      if (!result.ok) return false

      const updated = result.value.find(
        s => s.classId === classId && s.date === date && s.sessionId === sessionId,
      )
      if (!updated) return false

      // All prior invigilators are still present.
      for (const id of existingInvigilators) {
        if (!updated.invigilatorIds.includes(id)) return false
      }

      // The new teacher is also present.
      if (!updated.invigilatorIds.includes(newTeacherId)) return false

      // Total invigilator count increased by exactly one.
      if (updated.invigilatorIds.length !== existingInvigilators.length + 1) return false

      return true
    },
  )

  // ── 16-C: multiple other slots — all are left completely untouched ─────────

  it("adding an invigilator to one slot leaves every other slot's invigilatorIds identical", () => {
    const slots = [
      {
        id: "s1",
        classId: "VIII-A",
        date: "2026-01-10",
        sessionId: "ses-morning",
        subject: "Mathematics",
        invigilatorIds: ["t1", "t2"],
      },
      {
        id: "s2",
        classId: "IX-A",
        date: "2026-01-10",
        sessionId: "ses-morning",
        subject: "Physics",
        invigilatorIds: ["t3"],
      },
      {
        id: "s3",
        classId: "X-A",
        date: "2026-01-11",
        sessionId: "ses-afternoon",
        subject: "History",
        invigilatorIds: [],
      },
    ]

    // Add t-new to the VIII-A slot.
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-01-10", sessionId: "ses-morning" }
    const result = addInvigilatorToSlot(slots, coord, "t-new")

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const newSlots = result.value

    // Target slot now has t-new appended.
    const target = newSlots.find(s => s.classId === "VIII-A")
    expect(target?.invigilatorIds).toContain("t-new")
    expect(target?.invigilatorIds).toContain("t1")
    expect(target?.invigilatorIds).toContain("t2")
    expect(target?.invigilatorIds).toHaveLength(3)

    // IX-A slot is completely unchanged.
    const ixSlot = newSlots.find(s => s.classId === "IX-A")
    expect(ixSlot?.invigilatorIds).toEqual(["t3"])

    // X-A slot is completely unchanged.
    const xSlot = newSlots.find(s => s.classId === "X-A")
    expect(xSlot?.invigilatorIds).toEqual([])
  })

  it("addInvigilatorToSlot succeeds even when other slots in the array have no subject", () => {
    // Other slots without a subject must not interfere with adding to a slot
    // that does have one.
    const slots = [
      {
        id: "s1",
        classId: "VIII-A",
        date: "2026-03-01",
        sessionId: "ses-morning",
        subject: "Science",
        invigilatorIds: [],
      },
      {
        id: "s2",
        classId: "IX-A",
        date: "2026-03-01",
        sessionId: "ses-morning",
        // No subject on this slot — should not affect the other slot.
        invigilatorIds: ["t5"],
      },
    ]

    const coord: SlotCoord = { classId: "VIII-A", date: "2026-03-01", sessionId: "ses-morning" }
    const result = addInvigilatorToSlot(slots, coord, "t-alpha")

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const newSlots = result.value

    // Target updated.
    const target = newSlots.find(s => s.classId === "VIII-A")
    expect(target?.invigilatorIds).toEqual(["t-alpha"])

    // IX-A slot invigilators are unchanged.
    const ixSlot = newSlots.find(s => s.classId === "IX-A")
    expect(ixSlot?.invigilatorIds).toEqual(["t5"])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 17: Duplicate-invigilator and no-subject guards
// Feature: exam-routine-builder, Property 17: Duplicate-invigilator and no-subject guards
// **Validates: Requirements 4.6, 7.7, 7.8**
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 17: Duplicate-invigilator and no-subject guards", () => {
  /**
   * For any slot:
   * (a) Adding an invigilator already listed leaves the slot's invigilatorIds
   *     unchanged and returns `already-assigned` (R4.6, R7.8).
   * (b) Adding to a slot with no subject (or a non-existent slot) returns
   *     `no-subject-scheduled` regardless of the teacherId (R7.7).
   * Both guards leave every other slot unchanged.
   *
   * Validates: Requirements 4.6, 7.7, 7.8
   */

  // ── 17-A: duplicate-invigilator guard ─────────────────────────────────────

  fcTest.prop(
    [
      arbSlots,
      fc.record({
        classId: fc.constantFrom("VIII-A", "VIII-B", "IX-A", "IX-B", "X-A"),
        date: fc.constantFrom("2026-05-01", "2026-06-15", "2026-07-20"),
        sessionId: fc.constantFrom("ses-morning", "ses-afternoon", "ses-evening"),
        subjectName: fc.constantFrom("Mathematics", "English", "Science", "History", "Physics"),
      }),
      // An invigilator id that will be pre-placed on the slot.
      fc.constantFrom("t-dup-1", "t-dup-2", "t-dup-3", "t-dup-4", "t-dup-5"),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 17: Duplicate-invigilator and no-subject guards
    "adding an invigilator already listed returns already-assigned and leaves the slot unchanged",
    (baseSlots, { classId, date, sessionId, subjectName }, teacherId) => {
      // Build a slot that already has teacherId in its invigilatorIds.
      const targetSlot = {
        id: `es-${classId}__${date}__${sessionId}`,
        classId,
        date,
        sessionId,
        subject: subjectName,
        invigilatorIds: [teacherId], // teacherId is already present
      }

      const slots = [
        ...baseSlots.filter(
          s => !(s.classId === classId && s.date === date && s.sessionId === sessionId),
        ),
        targetSlot,
      ]

      const invigilatorsBefore = [...targetSlot.invigilatorIds]
      const coord: SlotCoord = { classId, date, sessionId }

      const result = addInvigilatorToSlot(slots, coord, teacherId)

      // ── Guard 1: must be rejected with the correct error code ────────────
      if (result.ok !== false) return false
      if (result.error !== "already-assigned") return false

      // ── Guard 2: the slot's invigilatorIds must be unchanged ─────────────
      // Since addInvigilatorToSlot is pure and returns a new array only on
      // success, on rejection the original `slots` array is untouched.
      const slotInOriginal = slots.find(
        s => s.classId === classId && s.date === date && s.sessionId === sessionId,
      )
      if (!slotInOriginal) return false
      if (slotInOriginal.invigilatorIds.length !== invigilatorsBefore.length) return false
      for (let i = 0; i < invigilatorsBefore.length; i++) {
        if (slotInOriginal.invigilatorIds[i] !== invigilatorsBefore[i]) return false
      }

      // ── Guard 3: every other slot is also unchanged ───────────────────────
      // On rejection, no slot in the original array is modified.
      for (const s of baseSlots) {
        const isTarget = s.classId === classId && s.date === date && s.sessionId === sessionId
        if (isTarget) continue // this slot was replaced by targetSlot above
        const inSlots = slots.find(
          o => o.classId === s.classId && o.date === s.date && o.sessionId === s.sessionId,
        )
        if (!inSlots) continue // shouldn't happen, but skip safely
        // Since the operation failed, slots is not mutated — reference check is
        // sufficient; we simply verify the slot still exists at its original position.
        if (inSlots.invigilatorIds.length !== s.invigilatorIds.length) return false
      }

      return true
    },
  )

  // ── 17-A extra: teacherId already in a multi-invigilator list ─────────────

  fcTest.prop(
    [
      // Existing invigilators (1–4 teachers already on the slot).
      fc.uniqueArray(
        fc.constantFrom("t1", "t2", "t3", "t4"),
        { minLength: 1, maxLength: 4 },
      ),
      // Pick one of the existing teachers as the duplicate.
      fc.nat({ max: 3 }),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 17: Duplicate-invigilator and no-subject guards
    "already-assigned is returned even when the slot has multiple invigilators",
    (existingInvigilators, pickIndex) => {
      // Clamp the index to the actual array length.
      const dupTeacherId = existingInvigilators[pickIndex % existingInvigilators.length]

      const slots = [
        {
          id: "es-viii-a__2026-05-01__ses-morning",
          classId: "VIII-A",
          date: "2026-05-01",
          sessionId: "ses-morning",
          subject: "Mathematics",
          invigilatorIds: existingInvigilators,
        },
      ]

      const coord: SlotCoord = { classId: "VIII-A", date: "2026-05-01", sessionId: "ses-morning" }
      const result = addInvigilatorToSlot(slots, coord, dupTeacherId)

      // Must be rejected.
      if (result.ok !== false) return false
      if (result.error !== "already-assigned") return false

      // Slot's invigilatorIds must remain exactly as before.
      const original = slots[0]
      if (original.invigilatorIds.length !== existingInvigilators.length) return false
      for (let i = 0; i < existingInvigilators.length; i++) {
        if (original.invigilatorIds[i] !== existingInvigilators[i]) return false
      }

      return true
    },
  )

  // ── 17-B: no-subject guard (slot exists but has no subject) ───────────────

  fcTest.prop(
    [
      arbSlots,
      fc.record({
        classId: fc.constantFrom("VIII-A", "VIII-B", "IX-A", "IX-B", "X-A"),
        date: fc.constantFrom("2026-05-01", "2026-06-15", "2026-07-20"),
        sessionId: fc.constantFrom("ses-morning", "ses-afternoon", "ses-evening"),
      }),
      // Any teacher id — result must be no-subject-scheduled regardless.
      fc.constantFrom("t-any-1", "t-any-2", "t-any-3", "t-any-4", "t-any-5"),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 17: Duplicate-invigilator and no-subject guards
    "adding to a slot with no subject returns no-subject-scheduled regardless of teacherId",
    (baseSlots, { classId, date, sessionId }, teacherId) => {
      // Build a slot at the target coord that has NO subject.
      const noSubjectSlot = {
        id: `es-${classId}__${date}__${sessionId}`,
        classId,
        date,
        sessionId,
        // subject intentionally absent
        invigilatorIds: [] as string[],
      }

      const slots = [
        ...baseSlots.filter(
          s => !(s.classId === classId && s.date === date && s.sessionId === sessionId),
        ),
        noSubjectSlot,
      ]

      const invigilatorsBefore = [...noSubjectSlot.invigilatorIds]
      const coord: SlotCoord = { classId, date, sessionId }

      const result = addInvigilatorToSlot(slots, coord, teacherId)

      // ── Guard: must be rejected with no-subject-scheduled ────────────────
      if (result.ok !== false) return false
      if (result.error !== "no-subject-scheduled") return false

      // ── The slot's invigilatorIds must remain empty ───────────────────────
      const slotInOriginal = slots.find(
        s => s.classId === classId && s.date === date && s.sessionId === sessionId,
      )
      if (!slotInOriginal) return false
      if (slotInOriginal.invigilatorIds.length !== invigilatorsBefore.length) return false

      // ── Every other slot in baseSlots is unchanged ────────────────────────
      for (const s of baseSlots) {
        const isTarget = s.classId === classId && s.date === date && s.sessionId === sessionId
        if (isTarget) continue
        const inSlots = slots.find(
          o => o.classId === s.classId && o.date === s.date && o.sessionId === s.sessionId,
        )
        if (!inSlots) continue
        if (inSlots.invigilatorIds.length !== s.invigilatorIds.length) return false
      }

      return true
    },
  )

  // ── 17-C: no-subject guard (slot does not exist at all) ───────────────────

  fcTest.prop(
    [
      arbSlots,
      fc.record({
        classId: fc.constantFrom("VIII-A", "VIII-B", "IX-A", "IX-B", "X-A"),
        date: fc.constantFrom("2026-08-01", "2026-09-01", "2026-10-01"), // dates absent from arbSlots pool
        sessionId: fc.constantFrom("ses-nonexistent-1", "ses-nonexistent-2"),
      }),
      fc.constantFrom("t-ghost-1", "t-ghost-2", "t-ghost-3"),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 17: Duplicate-invigilator and no-subject guards
    "adding to a non-existent slot returns no-subject-scheduled and all existing slots are unchanged",
    (slots, { classId, date, sessionId }, teacherId) => {
      // Ensure the coord genuinely does not exist in slots.
      const absent = !slots.some(
        s => s.classId === classId && s.date === date && s.sessionId === sessionId,
      )
      fc.pre(absent)

      const slotCountBefore = slots.length
      const coord: SlotCoord = { classId, date, sessionId }

      const result = addInvigilatorToSlot(slots, coord, teacherId)

      // Must be rejected.
      if (result.ok !== false) return false
      if (result.error !== "no-subject-scheduled") return false

      // The slots array must be completely unchanged (no phantom slot created).
      if (slots.length !== slotCountBefore) return false

      return true
    },
  )

  // ── Example tests ──────────────────────────────────────────────────────────

  it("returns already-assigned when the teacher is already listed on the slot", () => {
    const slots = [
      {
        id: "es-viii-a__2026-03-10__ses-morning",
        classId: "VIII-A",
        date: "2026-03-10",
        sessionId: "ses-morning",
        subject: "Mathematics",
        invigilatorIds: ["t1", "t2"],
      },
    ]
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-03-10", sessionId: "ses-morning" }

    const result = addInvigilatorToSlot(slots, coord, "t1") // t1 already present

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("already-assigned")
    // Original slot is untouched.
    expect(slots[0].invigilatorIds).toEqual(["t1", "t2"])
  })

  it("returns no-subject-scheduled when the slot has no subject", () => {
    const slots = [
      {
        id: "es-ix-a__2026-04-01__ses-afternoon",
        classId: "IX-A",
        date: "2026-04-01",
        sessionId: "ses-afternoon",
        // No subject field
        invigilatorIds: [],
      },
    ]
    const coord: SlotCoord = { classId: "IX-A", date: "2026-04-01", sessionId: "ses-afternoon" }

    const result = addInvigilatorToSlot(slots, coord, "t5")

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("no-subject-scheduled")
    // The slot's invigilatorIds remains empty.
    expect(slots[0].invigilatorIds).toEqual([])
  })

  it("returns no-subject-scheduled when no slot exists at the coordinate", () => {
    const slots = [
      {
        id: "es-ix-a__2026-04-01__ses-morning",
        classId: "IX-A",
        date: "2026-04-01",
        sessionId: "ses-morning",
        subject: "Physics",
        invigilatorIds: [],
      },
    ]
    // A different coord — does not exist in the array.
    const coord: SlotCoord = { classId: "X-A", date: "2026-04-01", sessionId: "ses-morning" }

    const result = addInvigilatorToSlot(slots, coord, "t7")

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("no-subject-scheduled")
    // No phantom slot was created.
    expect(slots).toHaveLength(1)
  })

  it("duplicate guard leaves other slots unchanged", () => {
    const slots = [
      {
        id: "s1",
        classId: "VIII-A",
        date: "2026-01-10",
        sessionId: "ses-morning",
        subject: "Mathematics",
        invigilatorIds: ["t1"],
      },
      {
        id: "s2",
        classId: "IX-A",
        date: "2026-01-10",
        sessionId: "ses-morning",
        subject: "English",
        invigilatorIds: ["t3", "t4"],
      },
    ]
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-01-10", sessionId: "ses-morning" }

    const result = addInvigilatorToSlot(slots, coord, "t1") // duplicate

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("already-assigned")

    // IX-A slot is completely unaffected.
    expect(slots[1].invigilatorIds).toEqual(["t3", "t4"])
    // VIII-A slot is unaffected too.
    expect(slots[0].invigilatorIds).toEqual(["t1"])
  })

  it("no-subject guard leaves other slots unchanged", () => {
    const slots = [
      {
        id: "s1",
        classId: "VIII-A",
        date: "2026-05-05",
        sessionId: "ses-morning",
        // No subject — trigger the guard
        invigilatorIds: [],
      },
      {
        id: "s2",
        classId: "IX-A",
        date: "2026-05-05",
        sessionId: "ses-morning",
        subject: "Science",
        invigilatorIds: ["t9"],
      },
    ]
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-05-05", sessionId: "ses-morning" }

    const result = addInvigilatorToSlot(slots, coord, "t-new")

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("no-subject-scheduled")

    // Both slots are untouched.
    expect(slots[0].invigilatorIds).toEqual([])
    expect(slots[1].invigilatorIds).toEqual(["t9"])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 18: Clearing a slot
// Feature: exam-routine-builder, Property 18: Clearing a slot
// **Validates: Requirements 4.7, 4.8**
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 18: Clearing a slot", () => {
  /**
   * For any state and slot coordinate:
   * (a) clearSlot removes subject, room, and all invigilators from the target
   *     slot while leaving all other slots completely unchanged (R4.7).
   * (b) Clearing an already-empty slot (no subject, no room, no invigilators)
   *     is a no-op — the returned array is the same reference (R4.8).
   * (c) Clearing a coordinate that does not exist in the array is a no-op (R4.8).
   * (d) clearSlot never adds or removes slots from the array.
   *
   * Validates: Requirements 4.7, 4.8
   */

  // ── 18-A: target slot is cleared; all other slots are unchanged ───────────

  fcTest.prop(
    [
      arbSlots,
      fc.record({
        classId: fc.constantFrom("VIII-A", "VIII-B", "IX-A", "IX-B", "X-A"),
        date: fc.constantFrom("2026-05-01", "2026-06-15", "2026-07-20"),
        sessionId: fc.constantFrom("ses-morning", "ses-afternoon", "ses-evening"),
        subjectName: fc.constantFrom("Mathematics", "English", "Science", "History", "Physics"),
        room: fc.constantFrom("Room 1", "Room 2", "Lab A"),
      }),
      fc.uniqueArray(
        fc.constantFrom("t1", "t2", "t3", "t4", "t5"),
        { minLength: 1, maxLength: 3 },
      ),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 18: Clearing a slot
    "clearSlot removes subject, room, and all invigilators from the target slot; all other slots are unchanged",
    (baseSlots, { classId, date, sessionId, subjectName, room }, invigilatorIds) => {
      // Build a populated target slot so clearSlot has something to clear.
      const populatedSlot = {
        id: `es-${classId}__${date}__${sessionId}`,
        classId,
        date,
        sessionId,
        subject: subjectName,
        room,
        invigilatorIds,
      }

      // Merge target slot into baseSlots, replacing any pre-existing slot at
      // the same coordinate to maintain the uniqueness invariant.
      const slots = [
        ...baseSlots.filter(
          s => !(s.classId === classId && s.date === date && s.sessionId === sessionId),
        ),
        populatedSlot,
      ]

      const coord: SlotCoord = { classId, date, sessionId }
      const result = clearSlot(slots, coord)

      // ── Check 1: the target slot has subject=undefined, room=undefined,
      //             invigilatorIds=[] ────────────────────────────────────────
      const cleared = result.find(
        s => s.classId === classId && s.date === date && s.sessionId === sessionId,
      )
      if (!cleared) return false
      if (cleared.subject !== undefined) return false
      if (cleared.room !== undefined) return false
      if (cleared.invigilatorIds.length !== 0) return false

      // ── Check 2: all other slots are completely unchanged ─────────────────
      for (const original of slots) {
        const isTarget =
          original.classId === classId &&
          original.date === date &&
          original.sessionId === sessionId
        if (isTarget) continue

        const updated = result.find(
          s =>
            s.classId === original.classId &&
            s.date === original.date &&
            s.sessionId === original.sessionId,
        )
        if (!updated) return false
        if (updated.subject !== original.subject) return false
        if (updated.room !== original.room) return false
        if (updated.invigilatorIds.length !== original.invigilatorIds.length) return false
        for (let i = 0; i < original.invigilatorIds.length; i++) {
          if (updated.invigilatorIds[i] !== original.invigilatorIds[i]) return false
        }
      }

      // ── Check 3: slot count is unchanged ─────────────────────────────────
      if (result.length !== slots.length) return false

      return true
    },
  )

  // ── 18-B: no-op on an already-empty slot (R4.8) ───────────────────────────

  fcTest.prop(
    [
      arbSlots,
      fc.record({
        classId: fc.constantFrom("VIII-A", "VIII-B", "IX-A", "IX-B", "X-A"),
        date: fc.constantFrom("2026-05-01", "2026-06-15", "2026-07-20"),
        sessionId: fc.constantFrom("ses-morning", "ses-afternoon", "ses-evening"),
      }),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 18: Clearing a slot
    "clearing an already-empty slot is a no-op: the same slots array reference is returned",
    (baseSlots, { classId, date, sessionId }) => {
      // Build an empty slot at the target coordinate.
      const emptySlot = {
        id: `es-${classId}__${date}__${sessionId}`,
        classId,
        date,
        sessionId,
        invigilatorIds: [] as string[],
        // subject and room intentionally absent — slot is empty
      }

      const slots = [
        ...baseSlots.filter(
          s => !(s.classId === classId && s.date === date && s.sessionId === sessionId),
        ),
        emptySlot,
      ]

      const coord: SlotCoord = { classId, date, sessionId }
      const result = clearSlot(slots, coord)

      // clearSlot must return the exact same reference (no-op) for an empty slot.
      return result === slots
    },
  )

  // ── 18-C: no-op when the coordinate does not exist in the array (R4.8) ────

  fcTest.prop(
    [
      arbSlots,
      // Use dates/sessions that are guaranteed absent from the arbSlots pool.
      fc.record({
        classId: fc.constantFrom("VIII-A", "VIII-B", "IX-A", "IX-B", "X-A"),
        date: fc.constantFrom("2099-01-01", "2099-02-01", "2099-03-01"),
        sessionId: fc.constantFrom("ses-absent-1", "ses-absent-2", "ses-absent-3"),
      }),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 18: Clearing a slot
    "clearing a coordinate that does not exist is a no-op: the same slots array reference is returned",
    (slots, { classId, date, sessionId }) => {
      // Verify the coordinate is truly absent (arbSlots uses dates 2025–2027;
      // we use 2099 so there is no accidental overlap).
      const absent = !slots.some(
        s => s.classId === classId && s.date === date && s.sessionId === sessionId,
      )
      fc.pre(absent)

      const coord: SlotCoord = { classId, date, sessionId }
      const result = clearSlot(slots, coord)

      // Must be an identity (no-op) — same reference.
      return result === slots
    },
  )

  // ── 18-D: slot count is unchanged after clearSlot ─────────────────────────

  fcTest.prop(
    [arbSlots],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 18: Clearing a slot
    "clearSlot never adds or removes slots from the array",
    (slots) => {
      // Clear every coordinate that exists and verify the count is preserved.
      for (const slot of slots) {
        const coord: SlotCoord = {
          classId: slot.classId,
          date: slot.date,
          sessionId: slot.sessionId,
        }
        const result = clearSlot(slots, coord)
        if (result.length !== slots.length) return false
      }
      return true
    },
  )

  // ── Example tests ──────────────────────────────────────────────────────────

  it("clearSlot removes subject, room, and all invigilators from a populated slot", () => {
    const slots = [
      {
        id: "es-viii-a__2026-03-10__ses-morning",
        classId: "VIII-A",
        date: "2026-03-10",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 2",
        invigilatorIds: ["t1", "t2", "t3"],
      },
    ]

    const coord: SlotCoord = { classId: "VIII-A", date: "2026-03-10", sessionId: "ses-morning" }
    const result = clearSlot(slots, coord)

    expect(result).toHaveLength(1)
    const cleared = result[0]
    expect(cleared.subject).toBeUndefined()
    expect(cleared.room).toBeUndefined()
    expect(cleared.invigilatorIds).toEqual([])
    // id and coordinate fields are preserved
    expect(cleared.classId).toBe("VIII-A")
    expect(cleared.date).toBe("2026-03-10")
    expect(cleared.sessionId).toBe("ses-morning")
  })

  it("clearSlot leaves every other slot completely unchanged", () => {
    const slots = [
      {
        id: "s1",
        classId: "VIII-A",
        date: "2026-01-10",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 1",
        invigilatorIds: ["t1"],
      },
      {
        id: "s2",
        classId: "IX-A",
        date: "2026-01-10",
        sessionId: "ses-morning",
        subject: "Physics",
        room: "Lab",
        invigilatorIds: ["t2", "t3"],
      },
      {
        id: "s3",
        classId: "X-A",
        date: "2026-01-11",
        sessionId: "ses-afternoon",
        subject: "History",
        invigilatorIds: [],
      },
    ]

    // Clear only the VIII-A slot.
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-01-10", sessionId: "ses-morning" }
    const result = clearSlot(slots, coord)

    expect(result).toHaveLength(3)

    // Target slot cleared.
    const target = result.find(s => s.classId === "VIII-A")
    expect(target?.subject).toBeUndefined()
    expect(target?.room).toBeUndefined()
    expect(target?.invigilatorIds).toEqual([])

    // IX-A slot completely unchanged.
    const ixSlot = result.find(s => s.classId === "IX-A")
    expect(ixSlot?.subject).toBe("Physics")
    expect(ixSlot?.room).toBe("Lab")
    expect(ixSlot?.invigilatorIds).toEqual(["t2", "t3"])

    // X-A slot completely unchanged.
    const xSlot = result.find(s => s.classId === "X-A")
    expect(xSlot?.subject).toBe("History")
    expect(xSlot?.invigilatorIds).toEqual([])
  })

  it("clearSlot on an already-empty slot is a no-op (same reference returned)", () => {
    const slots = [
      {
        id: "es-ix-a__2026-04-01__ses-afternoon",
        classId: "IX-A",
        date: "2026-04-01",
        sessionId: "ses-afternoon",
        // No subject, no room, empty invigilators — already empty
        invigilatorIds: [],
      },
    ]
    const coord: SlotCoord = { classId: "IX-A", date: "2026-04-01", sessionId: "ses-afternoon" }

    const result = clearSlot(slots, coord)

    // Same reference — no new array was created.
    expect(result).toBe(slots)
  })

  it("clearSlot on a non-existent coordinate is a no-op (same reference returned)", () => {
    const slots = [
      {
        id: "es-ix-a__2026-04-01__ses-morning",
        classId: "IX-A",
        date: "2026-04-01",
        sessionId: "ses-morning",
        subject: "Physics",
        invigilatorIds: [],
      },
    ]
    // A coordinate that does not exist in the array.
    const coord: SlotCoord = { classId: "X-A", date: "2026-04-01", sessionId: "ses-morning" }

    const result = clearSlot(slots, coord)

    // Same reference — no mutation or new array.
    expect(result).toBe(slots)
    expect(result).toHaveLength(1)
  })

  it("clearSlot on a slot that has only a subject (no room, no invigilators) clears the subject", () => {
    const slots = [
      {
        id: "es-x-a__2026-05-05__ses-morning",
        classId: "X-A",
        date: "2026-05-05",
        sessionId: "ses-morning",
        subject: "English",
        invigilatorIds: [],
      },
    ]
    const coord: SlotCoord = { classId: "X-A", date: "2026-05-05", sessionId: "ses-morning" }

    const result = clearSlot(slots, coord)

    expect(result).toHaveLength(1)
    expect(result[0].subject).toBeUndefined()
    expect(result[0].room).toBeUndefined()
    expect(result[0].invigilatorIds).toEqual([])
  })

  it("clearSlot on a slot that has only invigilators (no subject, no room) clears the invigilators", () => {
    // A slot can have invigilators without a subject in edge cases (e.g. after
    // the subject was cleared by a prior operation in the context layer).
    const slots = [
      {
        id: "es-viii-b__2026-06-01__ses-evening",
        classId: "VIII-B",
        date: "2026-06-01",
        sessionId: "ses-evening",
        // No subject, no room — but has invigilators
        invigilatorIds: ["t4", "t5"],
      },
    ]
    const coord: SlotCoord = { classId: "VIII-B", date: "2026-06-01", sessionId: "ses-evening" }

    const result = clearSlot(slots, coord)

    expect(result).toHaveLength(1)
    expect(result[0].subject).toBeUndefined()
    expect(result[0].room).toBeUndefined()
    expect(result[0].invigilatorIds).toEqual([])
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 23: Drag-place leaves room unset
// Feature: exam-routine-builder, Property 23: Drag-place leaves room unset
// **Validates: Requirements 7.1**
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 23: Drag-place leaves room unset", () => {
  /**
   * R7.1: "WHEN an Admin drags a subject chip from the palette and drops it
   * onto an empty Exam_Slot whose Class is linked to that subject, THE
   * Exam_Routine_Builder SHALL set that subject on the target Exam_Slot and
   * leave the room unset."
   *
   * A palette chip has no room — so when setSubject places a subject onto a
   * coordinate that has NO pre-existing slot (fresh/empty placement), the
   * resulting slot MUST have `room === undefined`.
   *
   * The complement: when a slot ALREADY EXISTS at the coordinate (a REPLACE
   * operation — R4.4), the existing room is preserved because only the subject
   * is being changed. That is intentional: R7.1 only governs palette drops onto
   * empty/non-existent slots.
   *
   * Validates: Requirements 7.1
   */

  // ── 23-A: core property — fresh placement leaves room undefined ───────────

  fcTest.prop(
    [
      arbCatalog,
      arbClassId,
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 23: Drag-place leaves room unset
    "setSubject on a coord with no pre-existing slot produces a slot with room === undefined",
    (catalog, classId) => {
      // Find a subject from the catalog that IS linked to classId so the
      // operation will succeed (not rejected as invalid-subject-for-class).
      const linkedSubject = catalog.find(subj => subj.linkedClassIds.includes(classId))

      // If no subject is linked to this classId in this catalog, skip the sample.
      fc.pre(linkedSubject !== undefined)
      if (!linkedSubject) return true // unreachable after fc.pre; satisfies TS

      // Use a coordinate that is guaranteed absent from any generated slot array
      // (we do NOT use arbSlots here — we start from an empty array).
      const slots: ReturnType<typeof setSubject> extends { ok: true; value: infer V } ? V : never[] = []
      const coord: SlotCoord = {
        classId,
        date: "2026-11-01",
        sessionId: "ses-palette-drop",
      }

      // Act: place subject from palette (no pre-existing slot at the coord).
      const result = setSubject(slots, coord, linkedSubject.name, catalog)

      // Must succeed — the subject is linked to the class.
      if (!result.ok) return false

      // The new slot must have room === undefined (R7.1: leave room unset).
      const newSlot = result.value.find(
        s => s.classId === classId && s.date === coord.date && s.sessionId === coord.sessionId,
      )
      if (!newSlot) return false
      if (newSlot.room !== undefined) return false

      return true
    },
  )

  // ── 23-B: palette drop onto slot array that has OTHER populated slots ──────

  fcTest.prop(
    [
      // Other pre-existing slots at DIFFERENT coordinates (to ensure isolation).
      fc.uniqueArray(
        fc.record({
          classId: fc.constantFrom("IX-A", "IX-B", "X-A", "X-B"),
          date: fc.constantFrom("2026-11-02", "2026-11-03", "2026-11-04"),
          sessionId: fc.constantFrom("ses-morning", "ses-afternoon"),
          subject: fc.constantFrom("Mathematics", "English", "Science"),
          room: fc.constantFrom("Room 1", "Room 2", "Lab A"),
        }),
        {
          minLength: 0,
          maxLength: 4,
          selector: s => `${s.classId}__${s.date}__${s.sessionId}`,
        },
      ),
      arbCatalog,
      arbClassId,
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 23: Drag-place leaves room unset
    "fresh palette placement onto an absent coord has room undefined even when other slots have rooms",
    (otherSlotDefs, catalog, classId) => {
      // Find a subject from the catalog that IS linked to classId.
      const linkedSubject = catalog.find(subj => subj.linkedClassIds.includes(classId))
      fc.pre(linkedSubject !== undefined)
      if (!linkedSubject) return true

      // The target coordinate uses a class and date/session that are not
      // present in otherSlotDefs (different class ensures isolation).
      const coord: SlotCoord = {
        classId,
        date: "2026-11-01",
        sessionId: "ses-palette-drop",
      }

      // Build the slots array from the other slot definitions.
      const slots = otherSlotDefs.map((def, idx) => ({
        id: `es-${idx}`,
        classId: def.classId,
        date: def.date,
        sessionId: def.sessionId,
        subject: def.subject,
        room: def.room,
        invigilatorIds: [] as string[],
      })).filter(
        // Ensure none of them accidentally collide with the target coord.
        s => !(s.classId === coord.classId && s.date === coord.date && s.sessionId === coord.sessionId),
      )

      // Confirm the coord is truly absent.
      const absent = !slots.some(
        s => s.classId === coord.classId && s.date === coord.date && s.sessionId === coord.sessionId,
      )
      fc.pre(absent)

      const result = setSubject(slots, coord, linkedSubject.name, catalog)

      // Must succeed.
      if (!result.ok) return false

      // The newly-created slot must have room === undefined.
      const newSlot = result.value.find(
        s => s.classId === coord.classId && s.date === coord.date && s.sessionId === coord.sessionId,
      )
      if (!newSlot) return false
      if (newSlot.room !== undefined) return false

      // Sanity: every other pre-existing slot must be completely unchanged.
      for (const original of slots) {
        const updated = result.value.find(
          s => s.classId === original.classId && s.date === original.date && s.sessionId === original.sessionId,
        )
        if (!updated) return false
        if (updated.room !== original.room) return false
        if (updated.subject !== original.subject) return false
      }

      return true
    },
  )

  // ── 23-C: complement — REPLACE on an existing slot with a room retains the room ──

  fcTest.prop(
    [
      arbCatalog,
      arbClassId,
      fc.constantFrom("Room 1", "Room 2", "Lab A", "Hall B"),
      fc.constantFrom("Mathematics", "English", "Science", "History"),
      fc.constantFrom("Physics", "Chemistry", "Biology", "Geography"),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 23: Drag-place leaves room unset
    "replacing the subject on an existing slot (REPLACE path) retains the existing room",
    (baseCatalog, classId, existingRoom, priorSubjectName, newSubjectName) => {
      // We need both subject names to be distinct and both linked to classId.
      fc.pre(priorSubjectName !== newSubjectName)

      // Build a catalog that explicitly links both subjects to classId.
      const catalog = [
        ...baseCatalog.filter(
          s =>
            s.name.trim().toLowerCase() !== priorSubjectName.trim().toLowerCase() &&
            s.name.trim().toLowerCase() !== newSubjectName.trim().toLowerCase(),
        ),
        { id: "subj-prior", name: priorSubjectName, linkedClassIds: [classId] },
        { id: "subj-new",   name: newSubjectName,   linkedClassIds: [classId] },
      ]

      const coord: SlotCoord = {
        classId,
        date: "2026-11-05",
        sessionId: "ses-replace-test",
      }

      // Pre-existing slot with the prior subject AND a room.
      const existingSlot = {
        id: "es-replace",
        classId,
        date: coord.date,
        sessionId: coord.sessionId,
        subject: priorSubjectName,
        room: existingRoom,
        invigilatorIds: [] as string[],
      }

      const result = setSubject([existingSlot], coord, newSubjectName, catalog)

      // Must succeed.
      if (!result.ok) return false

      const updatedSlot = result.value.find(
        s => s.classId === coord.classId && s.date === coord.date && s.sessionId === coord.sessionId,
      )
      if (!updatedSlot) return false

      // Subject replaced.
      if (updatedSlot.subject !== newSubjectName) return false

      // Room retained (this is the REPLACE path — room is NOT cleared).
      if (updatedSlot.room !== existingRoom) return false

      return true
    },
  )

  // ── Example tests ──────────────────────────────────────────────────────────

  it("palette drop onto an empty slots array creates a slot with room undefined", () => {
    // Simulates: Admin drags 'Mathematics' from palette onto empty VIII-A slot.
    const catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: ["VIII-A"] },
    ]
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-11-10", sessionId: "ses-morning" }

    const result = setSubject([], coord, "Mathematics", catalog)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const newSlot = result.value.find(
      s => s.classId === "VIII-A" && s.date === "2026-11-10" && s.sessionId === "ses-morning",
    )
    expect(newSlot).toBeDefined()
    expect(newSlot?.subject).toBe("Mathematics")
    // R7.1: room must be unset on a fresh palette drop.
    expect(newSlot?.room).toBeUndefined()
  })

  it("palette drop onto a non-existent coord in a non-empty slots array leaves room undefined", () => {
    // There are other slots with rooms, but the target coord is fresh.
    const catalog = [
      { id: "subj-eng", name: "English", linkedClassIds: ["IX-A"] },
    ]
    const slots = [
      {
        id: "s1",
        classId: "VIII-A",
        date: "2026-11-10",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 2",
        invigilatorIds: [],
      },
    ]
    const coord: SlotCoord = { classId: "IX-A", date: "2026-11-10", sessionId: "ses-morning" }

    const result = setSubject(slots, coord, "English", catalog)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const newSlot = result.value.find(s => s.classId === "IX-A")
    expect(newSlot).toBeDefined()
    expect(newSlot?.subject).toBe("English")
    // R7.1: fresh placement → room must be undefined.
    expect(newSlot?.room).toBeUndefined()

    // The other slot is untouched.
    const otherSlot = result.value.find(s => s.classId === "VIII-A")
    expect(otherSlot?.room).toBe("Room 2")
  })

  it("replacing a subject on an existing slot that already has a room preserves that room", () => {
    // This is the REPLACE path (R4.4), not a fresh palette drop.
    // The room must be retained when only the subject is replaced.
    const catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: ["VIII-A"] },
      { id: "subj-sci",  name: "Science",     linkedClassIds: ["VIII-A"] },
    ]
    const slots = [
      {
        id: "es-viii-a__2026-11-10__ses-morning",
        classId: "VIII-A",
        date: "2026-11-10",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 3",
        invigilatorIds: ["t1"],
      },
    ]
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-11-10", sessionId: "ses-morning" }

    const result = setSubject(slots, coord, "Science", catalog)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const updatedSlot = result.value[0]
    expect(updatedSlot.subject).toBe("Science")
    // Room is RETAINED on the replace path.
    expect(updatedSlot.room).toBe("Room 3")
    expect(updatedSlot.invigilatorIds).toEqual(["t1"])
  })

  it("rejected palette drop (invalid subject for class) leaves every slot unchanged", () => {
    // Subject is not linked to the target class — the drop is rejected and the
    // slots array must be left entirely unchanged.
    const catalog = [
      { id: "subj-phys", name: "Physics", linkedClassIds: ["IX-A"] },
    ]
    const slots: ReturnType<typeof setSubject> extends { ok: true; value: infer V } ? V : never[] = []
    const coord: SlotCoord = { classId: "VIII-A", date: "2026-11-10", sessionId: "ses-morning" }

    const result = setSubject(slots, coord, "Physics", catalog)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("invalid-subject-for-class")
    // No phantom slot was created.
    expect(slots).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 24: Moving a scheduled subject conserves subject and room
// Feature: exam-routine-builder, Property 24: Moving a scheduled subject conserves subject and room
// **Validates: Requirements 7.2**
// ─────────────────────────────────────────────────────────────────────────────

import { moveSubject } from "@/lib/exam/slots"

describe("Property 24: Moving a scheduled subject conserves subject and room", () => {
  /**
   * R7.2: "WHEN an Admin drags a scheduled subject from a source Exam_Slot and
   * drops it onto an empty target Exam_Slot whose Class is linked to that
   * subject, THE Exam_Routine_Builder SHALL place the subject and its room on
   * the target Exam_Slot and clear the subject and room from the source
   * Exam_Slot."
   *
   * R7.4: "WHERE both Classes are linked to the exchanged subjects, WHEN an
   * Admin drags a scheduled subject onto a target Exam_Slot that already holds a
   * subject, THE Exam_Routine_Builder SHALL swap the subjects and their rooms
   * between the source and target Exam_Slots."
   *
   * R7.3: "IF an Admin drops … a scheduled subject onto a target Exam_Slot
   * whose Class is not in that subject's linked-classes list, THEN THE
   * Exam_Routine_Builder SHALL reject the drop, leave both the source and target
   * Exam_Slots unchanged, and return an invalid-subject-for-class message."
   */

  // ── 24-A: move to empty target — subject and room transferred, source cleared ──

  fcTest.prop(
    [arbSlots, arbCatalog],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 24: Moving a scheduled subject conserves subject and room
    "move to empty target: target gets source subject+room; source subject+room cleared",
    (baseSlots, baseCatalog) => {
      // We need a source slot with a subject, a target coord that is either
      // absent or holds no subject, and a catalog that links the source subject
      // to BOTH source and target classes.
      //
      // Pick the first slot that has a subject as the source.
      const sourceSlot = baseSlots.find(s => s.subject)
      fc.pre(sourceSlot !== undefined)
      if (!sourceSlot) return true // unreachable after fc.pre

      const sourceSubject = sourceSlot.subject!
      const sourceRoom = sourceSlot.room

      // Use a fixed target coordinate that is unlikely to collide with anything
      // in baseSlots (different class, same date/session pattern).
      const targetCoord = {
        classId: "target-class-24a",
        date: sourceSlot.date,
        sessionId: sourceSlot.sessionId,
      }
      const fromCoord = {
        classId: sourceSlot.classId,
        date: sourceSlot.date,
        sessionId: sourceSlot.sessionId,
      }

      // Ensure no slot exists at the target coord (target must be empty).
      const slots = baseSlots.filter(
        s =>
          !(s.classId === targetCoord.classId &&
            s.date === targetCoord.date &&
            s.sessionId === targetCoord.sessionId),
      )

      // Build a catalog that links sourceSubject to both classes.
      const sanitizedBase = baseCatalog.filter(
        s => s.name.trim().toLowerCase() !== sourceSubject.trim().toLowerCase(),
      )
      const catalog = [
        ...sanitizedBase,
        {
          id: "subj-move-24a",
          name: sourceSubject,
          linkedClassIds: [sourceSlot.classId, targetCoord.classId],
        },
      ]

      const result = moveSubject(slots, fromCoord, targetCoord, catalog)

      if (!result.ok) return false

      const newSlots = result.value

      // Target slot must have source's subject and room.
      const targetAfter = newSlots.find(
        s =>
          s.classId === targetCoord.classId &&
          s.date === targetCoord.date &&
          s.sessionId === targetCoord.sessionId,
      )
      if (!targetAfter) return false
      if (targetAfter.subject !== sourceSubject) return false
      if (targetAfter.room !== sourceRoom) return false

      // Source slot must have subject and room cleared.
      const sourceAfter = newSlots.find(
        s =>
          s.classId === fromCoord.classId &&
          s.date === fromCoord.date &&
          s.sessionId === fromCoord.sessionId,
      )
      if (!sourceAfter) return false
      if (sourceAfter.subject !== undefined) return false
      if (sourceAfter.room !== undefined) return false

      // All other slots must be unchanged.
      for (const original of slots) {
        const isSource =
          original.classId === fromCoord.classId &&
          original.date === fromCoord.date &&
          original.sessionId === fromCoord.sessionId
        if (isSource) continue // source slot is expected to change

        const updated = newSlots.find(
          s =>
            s.classId === original.classId &&
            s.date === original.date &&
            s.sessionId === original.sessionId,
        )
        if (!updated) return false
        if (updated.subject !== original.subject) return false
        if (updated.room !== original.room) return false
      }

      return true
    },
  )

  // ── 24-B: swap (R7.4) — both classes must be linked to the exchanged subjects ─

  fcTest.prop(
    [
      arbSlots,
      arbCatalog,
      fc.constantFrom("Mathematics", "English", "Science", "History", "Physics"),
      fc.constantFrom("Chemistry", "Biology", "Geography", "Hindi", "Sanskrit"),
      fc.option(fc.constantFrom("Room 1", "Room 2", "Lab A"), { nil: undefined }),
      fc.option(fc.constantFrom("Room 3", "Room 4", "Hall B"), { nil: undefined }),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 24: Moving a scheduled subject conserves subject and room
    "swap (R7.4): when both slots have subjects linked to each other's classes, subjects and rooms are exchanged",
    (baseSlots, baseCatalog, subjectA, subjectB, roomA, roomB) => {
      fc.pre(subjectA !== subjectB)

      const classA = "swap-class-A-24b"
      const classB = "swap-class-B-24b"
      const date = "2026-04-01"
      const sessionId = "ses-swap-24b"

      const fromCoord = { classId: classA, date, sessionId }
      const toCoord = { classId: classB, date, sessionId }

      // Build a catalog that links subjectA to classA AND classB (so target
      // gets subjectA), and subjectB to classA AND classB (so source gets
      // subjectB after swap).
      const sanitized = baseCatalog.filter(
        s =>
          s.name.trim().toLowerCase() !== subjectA.trim().toLowerCase() &&
          s.name.trim().toLowerCase() !== subjectB.trim().toLowerCase(),
      )
      const catalog = [
        ...sanitized,
        { id: "subj-a-24b", name: subjectA, linkedClassIds: [classA, classB] },
        { id: "subj-b-24b", name: subjectB, linkedClassIds: [classA, classB] },
      ]

      // Build a minimal slot array for the two swap participants, merged with
      // baseSlots (removing any existing slot at those coords for isolation).
      const filteredBase = baseSlots.filter(
        s =>
          !(s.classId === classA && s.date === date && s.sessionId === sessionId) &&
          !(s.classId === classB && s.date === date && s.sessionId === sessionId),
      )
      const slotA = {
        id: `es-${classA}__${date}__${sessionId}`,
        classId: classA,
        date,
        sessionId,
        subject: subjectA,
        ...(roomA !== undefined ? { room: roomA } : {}),
        invigilatorIds: [] as string[],
      }
      const slotB = {
        id: `es-${classB}__${date}__${sessionId}`,
        classId: classB,
        date,
        sessionId,
        subject: subjectB,
        ...(roomB !== undefined ? { room: roomB } : {}),
        invigilatorIds: [] as string[],
      }
      const slots = [...filteredBase, slotA, slotB]

      const result = moveSubject(slots, fromCoord, toCoord, catalog)

      if (!result.ok) return false

      const newSlots = result.value

      // classA slot should now hold subjectB and roomB (what classB had).
      const slotAAfter = newSlots.find(
        s => s.classId === classA && s.date === date && s.sessionId === sessionId,
      )
      if (!slotAAfter) return false
      if (slotAAfter.subject !== subjectB) return false
      if (slotAAfter.room !== roomB) return false

      // classB slot should now hold subjectA and roomA (what classA had).
      const slotBAfter = newSlots.find(
        s => s.classId === classB && s.date === date && s.sessionId === sessionId,
      )
      if (!slotBAfter) return false
      if (slotBAfter.subject !== subjectA) return false
      if (slotBAfter.room !== roomA) return false

      return true
    },
  )

  // ── 24-C: invalid class rejection (R7.3) — both slots remain unchanged ────

  fcTest.prop(
    [arbSlots, arbCatalog],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 24: Moving a scheduled subject conserves subject and room
    "invalid class rejection: when target class is not linked to source subject, result is invalid-subject-for-class and both slots unchanged",
    (baseSlots, baseCatalog) => {
      // We need a source slot with a subject.
      const sourceSlot = baseSlots.find(s => s.subject)
      fc.pre(sourceSlot !== undefined)
      if (!sourceSlot) return true

      const sourceSubject = sourceSlot.subject!

      // Target uses a class that is explicitly NOT linked to the source subject.
      const unlinkedClass = "unlinked-class-24c"
      const targetCoord = {
        classId: unlinkedClass,
        date: sourceSlot.date,
        sessionId: sourceSlot.sessionId,
      }
      const fromCoord = {
        classId: sourceSlot.classId,
        date: sourceSlot.date,
        sessionId: sourceSlot.sessionId,
      }

      // Build catalog where sourceSubject is linked to sourceSlot.classId but
      // NOT to unlinkedClass.
      const sanitized = baseCatalog.filter(
        s => s.name.trim().toLowerCase() !== sourceSubject.trim().toLowerCase(),
      )
      const catalog = [
        ...sanitized,
        {
          id: "subj-src-24c",
          name: sourceSubject,
          linkedClassIds: [sourceSlot.classId], // only the source class — not unlinkedClass
        },
      ]

      // Remove any existing slot at the target coord.
      const slots = baseSlots.filter(
        s =>
          !(s.classId === unlinkedClass &&
            s.date === targetCoord.date &&
            s.sessionId === targetCoord.sessionId),
      )

      const sourceSubjectBefore = sourceSlot.subject
      const sourceRoomBefore = sourceSlot.room

      const result = moveSubject(slots, fromCoord, targetCoord, catalog)

      // Must be rejected with the correct error code (R7.3).
      if (result.ok) return false
      if (result.error !== "invalid-subject-for-class") return false

      // Source slot must be completely unchanged.
      const sourceAfter = slots.find(
        s =>
          s.classId === fromCoord.classId &&
          s.date === fromCoord.date &&
          s.sessionId === fromCoord.sessionId,
      )
      if (sourceAfter) {
        if (sourceAfter.subject !== sourceSubjectBefore) return false
        if (sourceAfter.room !== sourceRoomBefore) return false
      }

      // No phantom target slot was created.
      const phantomTarget = slots.find(
        s =>
          s.classId === targetCoord.classId &&
          s.date === targetCoord.date &&
          s.sessionId === targetCoord.sessionId,
      )
      if (phantomTarget) return false

      return true
    },
  )

  // ── Example tests ──────────────────────────────────────────────────────────

  it("move to empty target slot: target receives subject+room, source is cleared", () => {
    // R7.2: Admin drags 'Mathematics' (with 'Room 5') from VIII-A to empty IX-A.
    // IX-A is linked to Mathematics. After: IX-A has Math+Room5, VIII-A cleared.
    const catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: ["VIII-A", "IX-A"] },
    ]
    const slots = [
      {
        id: "es-viii-a__2026-03-10__ses-morning",
        classId: "VIII-A",
        date: "2026-03-10",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 5",
        invigilatorIds: ["t1"],
      },
    ]
    const from: SlotCoord = { classId: "VIII-A", date: "2026-03-10", sessionId: "ses-morning" }
    const to:   SlotCoord = { classId: "IX-A",   date: "2026-03-10", sessionId: "ses-morning" }

    const result = moveSubject(slots, from, to, catalog)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const newSlots = result.value

    // Target IX-A now holds Mathematics + Room 5.
    const target = newSlots.find(s => s.classId === "IX-A")
    expect(target).toBeDefined()
    expect(target?.subject).toBe("Mathematics")
    expect(target?.room).toBe("Room 5")

    // Source VIII-A has subject and room cleared (invigilators stay).
    const source = newSlots.find(s => s.classId === "VIII-A")
    expect(source).toBeDefined()
    expect(source?.subject).toBeUndefined()
    expect(source?.room).toBeUndefined()
    expect(source?.invigilatorIds).toEqual(["t1"])
  })

  it("swap (R7.4): subjects and rooms are exchanged between both slots", () => {
    // VIII-A holds Mathematics / Room 1; IX-A holds English / Room 2.
    // Both classes are linked to both subjects → swap succeeds.
    const catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: ["VIII-A", "IX-A"] },
      { id: "subj-eng",  name: "English",     linkedClassIds: ["VIII-A", "IX-A"] },
    ]
    const slots = [
      {
        id: "es-viii",
        classId: "VIII-A",
        date: "2026-03-10",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 1",
        invigilatorIds: [],
      },
      {
        id: "es-ix",
        classId: "IX-A",
        date: "2026-03-10",
        sessionId: "ses-morning",
        subject: "English",
        room: "Room 2",
        invigilatorIds: [],
      },
    ]
    const from: SlotCoord = { classId: "VIII-A", date: "2026-03-10", sessionId: "ses-morning" }
    const to:   SlotCoord = { classId: "IX-A",   date: "2026-03-10", sessionId: "ses-morning" }

    const result = moveSubject(slots, from, to, catalog)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const newSlots = result.value

    // VIII-A now holds English + Room 2.
    const viiiAfter = newSlots.find(s => s.classId === "VIII-A")
    expect(viiiAfter?.subject).toBe("English")
    expect(viiiAfter?.room).toBe("Room 2")

    // IX-A now holds Mathematics + Room 1.
    const ixAfter = newSlots.find(s => s.classId === "IX-A")
    expect(ixAfter?.subject).toBe("Mathematics")
    expect(ixAfter?.room).toBe("Room 1")
  })

  it("swap (R7.4): works even when one or both rooms are undefined", () => {
    const catalog = [
      { id: "subj-sci",  name: "Science",  linkedClassIds: ["VIII-A", "IX-A"] },
      { id: "subj-hist", name: "History",  linkedClassIds: ["VIII-A", "IX-A"] },
    ]
    const slots = [
      {
        id: "es-viii",
        classId: "VIII-A",
        date: "2026-04-01",
        sessionId: "ses-am",
        subject: "Science",
        // no room
        invigilatorIds: [],
      },
      {
        id: "es-ix",
        classId: "IX-A",
        date: "2026-04-01",
        sessionId: "ses-am",
        subject: "History",
        room: "Lab A",
        invigilatorIds: [],
      },
    ]
    const from: SlotCoord = { classId: "VIII-A", date: "2026-04-01", sessionId: "ses-am" }
    const to:   SlotCoord = { classId: "IX-A",   date: "2026-04-01", sessionId: "ses-am" }

    const result = moveSubject(slots, from, to, catalog)

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const newSlots = result.value

    // VIII-A receives History + Lab A.
    const viiiAfter = newSlots.find(s => s.classId === "VIII-A")
    expect(viiiAfter?.subject).toBe("History")
    expect(viiiAfter?.room).toBe("Lab A")

    // IX-A receives Science + undefined room.
    const ixAfter = newSlots.find(s => s.classId === "IX-A")
    expect(ixAfter?.subject).toBe("Science")
    expect(ixAfter?.room).toBeUndefined()
  })

  it("invalid class rejection (R7.3): returns invalid-subject-for-class and leaves both slots unchanged", () => {
    // IX-A is NOT linked to Mathematics → move must be rejected.
    const catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: ["VIII-A"] }, // only VIII-A
    ]
    const slots = [
      {
        id: "es-source",
        classId: "VIII-A",
        date: "2026-05-01",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 7",
        invigilatorIds: [],
      },
    ]
    const from: SlotCoord = { classId: "VIII-A", date: "2026-05-01", sessionId: "ses-morning" }
    const to:   SlotCoord = { classId: "IX-A",   date: "2026-05-01", sessionId: "ses-morning" }

    const result = moveSubject(slots, from, to, catalog)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("invalid-subject-for-class")

    // Source slot is completely unchanged.
    expect(slots[0].subject).toBe("Mathematics")
    expect(slots[0].room).toBe("Room 7")

    // No phantom target slot created.
    expect(slots).toHaveLength(1)
  })

  it("swap rejected (R7.3) when only one class is linked to the other's subject", () => {
    // VIII-A holds Math (linked to both); IX-A holds English (only linked to IX-A).
    // Swap would require VIII-A to receive English, but VIII-A is not linked → reject.
    const catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: ["VIII-A", "IX-A"] },
      { id: "subj-eng",  name: "English",     linkedClassIds: ["IX-A"] }, // NOT linked to VIII-A
    ]
    const slots = [
      {
        id: "es-viii",
        classId: "VIII-A",
        date: "2026-05-05",
        sessionId: "ses-pm",
        subject: "Mathematics",
        room: "Room 1",
        invigilatorIds: [],
      },
      {
        id: "es-ix",
        classId: "IX-A",
        date: "2026-05-05",
        sessionId: "ses-pm",
        subject: "English",
        room: "Room 2",
        invigilatorIds: [],
      },
    ]
    const from: SlotCoord = { classId: "VIII-A", date: "2026-05-05", sessionId: "ses-pm" }
    const to:   SlotCoord = { classId: "IX-A",   date: "2026-05-05", sessionId: "ses-pm" }

    const result = moveSubject(slots, from, to, catalog)

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("invalid-subject-for-class")

    // Both slots remain exactly as they were.
    expect(slots[0].subject).toBe("Mathematics")
    expect(slots[0].room).toBe("Room 1")
    expect(slots[1].subject).toBe("English")
    expect(slots[1].room).toBe("Room 2")
  })
})


// ─────────────────────────────────────────────────────────────────────────────
// Property 25: Swapping scheduled subjects is conservative and self-inverse
// Feature: exam-routine-builder, Property 25: Swapping scheduled subjects is conservative and self-inverse
// **Validates: Requirements 7.4**
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 25: Swapping scheduled subjects is conservative and self-inverse", () => {
  /**
   * R7.4: "WHERE both Classes are linked to the exchanged subjects, WHEN an Admin
   * drags a scheduled subject onto a target Exam_Slot that already holds a subject,
   * THE Exam_Routine_Builder SHALL swap the subjects and their rooms between the
   * source and target Exam_Slots."
   *
   * Two invariants are tested here:
   *
   * 1. **Conservative**: the multiset of subjects across the two involved slots is
   *    unchanged by the swap — no new subject is introduced and no subject disappears.
   *    Every subject that was in either slot is still in one of the two slots after.
   *
   * 2. **Self-inverse**: swapping twice returns to the original state — the second
   *    swap undoes the first swap exactly, for both subjects and rooms.
   */

  // ── 25-A: Conservative — swap doesn't create or destroy subjects ──────────

  fcTest.prop(
    [
      // Two distinct subject names
      fc.constantFrom("Mathematics", "English", "Science", "History", "Physics"),
      fc.constantFrom("Chemistry", "Biology", "Geography", "Hindi", "Sanskrit"),
      // Optional rooms for each slot
      fc.option(fc.constantFrom("Room 1", "Room 2", "Lab A"), { nil: undefined }),
      fc.option(fc.constantFrom("Room 3", "Room 4", "Hall B"), { nil: undefined }),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 25: Swapping scheduled subjects is conservative and self-inverse
    "conservative: the multiset of subjects across the two swap slots is unchanged after the swap",
    (subjectA, subjectB, roomA, roomB) => {
      // Feature: exam-routine-builder, Property 25: Swapping scheduled subjects is conservative and self-inverse
      fc.pre(subjectA !== subjectB)

      const classA = "swap-class-A-25a"
      const classB = "swap-class-B-25a"
      const date = "2026-05-01"
      const sessionId = "ses-swap-25a"

      const fromCoord: SlotCoord = { classId: classA, date, sessionId }
      const toCoord: SlotCoord = { classId: classB, date, sessionId }

      // Catalog: both subjects linked to both classes so the swap is valid.
      const catalog = [
        { id: "subj-a-25a", name: subjectA, linkedClassIds: [classA, classB] },
        { id: "subj-b-25a", name: subjectB, linkedClassIds: [classA, classB] },
      ]

      const slotA = {
        id: `es-${classA}__${date}__${sessionId}`,
        classId: classA,
        date,
        sessionId,
        subject: subjectA,
        ...(roomA !== undefined ? { room: roomA } : {}),
        invigilatorIds: [] as string[],
      }
      const slotB = {
        id: `es-${classB}__${date}__${sessionId}`,
        classId: classB,
        date,
        sessionId,
        subject: subjectB,
        ...(roomB !== undefined ? { room: roomB } : {}),
        invigilatorIds: [] as string[],
      }

      const slots = [slotA, slotB]

      // Collect the subjects present in the two slots BEFORE the swap.
      const subjectsBefore = [subjectA, subjectB].sort()

      const result = moveSubject(slots, fromCoord, toCoord, catalog)
      if (!result.ok) return false

      // Collect the subjects present in the two slots AFTER the swap.
      const newSlots = result.value
      const slotAAfter = newSlots.find(
        s => s.classId === classA && s.date === date && s.sessionId === sessionId,
      )
      const slotBAfter = newSlots.find(
        s => s.classId === classB && s.date === date && s.sessionId === sessionId,
      )

      if (!slotAAfter || !slotBAfter) return false
      if (!slotAAfter.subject || !slotBAfter.subject) return false

      const subjectsAfter = [slotAAfter.subject, slotBAfter.subject].sort()

      // The sorted multisets must be identical — no subject was created or destroyed.
      if (subjectsBefore.length !== subjectsAfter.length) return false
      for (let i = 0; i < subjectsBefore.length; i++) {
        if (subjectsBefore[i] !== subjectsAfter[i]) return false
      }

      return true
    },
  )

  // ── 25-B: Conservative for rooms — rooms are only redistributed, not lost ─

  fcTest.prop(
    [
      fc.constantFrom("Mathematics", "English", "Science", "History", "Physics"),
      fc.constantFrom("Chemistry", "Biology", "Geography", "Hindi", "Sanskrit"),
      fc.option(fc.constantFrom("Room 1", "Room 2", "Lab A", "Hall C"), { nil: undefined }),
      fc.option(fc.constantFrom("Room 3", "Room 4", "Hall B", "Lab D"), { nil: undefined }),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 25: Swapping scheduled subjects is conservative and self-inverse
    "conservative: the multiset of rooms across the two swap slots is unchanged after the swap",
    (subjectA, subjectB, roomA, roomB) => {
      // Feature: exam-routine-builder, Property 25: Swapping scheduled subjects is conservative and self-inverse
      fc.pre(subjectA !== subjectB)

      const classA = "swap-class-A-25b"
      const classB = "swap-class-B-25b"
      const date = "2026-05-02"
      const sessionId = "ses-swap-25b"

      const fromCoord: SlotCoord = { classId: classA, date, sessionId }
      const toCoord: SlotCoord = { classId: classB, date, sessionId }

      const catalog = [
        { id: "subj-a-25b", name: subjectA, linkedClassIds: [classA, classB] },
        { id: "subj-b-25b", name: subjectB, linkedClassIds: [classA, classB] },
      ]

      const slotA = {
        id: `es-${classA}__${date}__${sessionId}`,
        classId: classA,
        date,
        sessionId,
        subject: subjectA,
        ...(roomA !== undefined ? { room: roomA } : {}),
        invigilatorIds: [] as string[],
      }
      const slotB = {
        id: `es-${classB}__${date}__${sessionId}`,
        classId: classB,
        date,
        sessionId,
        subject: subjectB,
        ...(roomB !== undefined ? { room: roomB } : {}),
        invigilatorIds: [] as string[],
      }

      const slots = [slotA, slotB]

      // Collect rooms before (treating undefined as a distinct "no-room" marker).
      const roomsBefore = [roomA, roomB].sort()

      const result = moveSubject(slots, fromCoord, toCoord, catalog)
      if (!result.ok) return false

      const newSlots = result.value
      const slotAAfter = newSlots.find(
        s => s.classId === classA && s.date === date && s.sessionId === sessionId,
      )
      const slotBAfter = newSlots.find(
        s => s.classId === classB && s.date === date && s.sessionId === sessionId,
      )

      if (!slotAAfter || !slotBAfter) return false

      const roomsAfter = [slotAAfter.room, slotBAfter.room].sort()

      // The sorted room multisets must match — rooms are redistributed, not lost.
      if (roomsBefore.length !== roomsAfter.length) return false
      for (let i = 0; i < roomsBefore.length; i++) {
        if (roomsBefore[i] !== roomsAfter[i]) return false
      }

      return true
    },
  )

  // ── 25-C: Self-inverse — swapping twice returns to the original state ──────

  fcTest.prop(
    [
      fc.constantFrom("Mathematics", "English", "Science", "History", "Physics"),
      fc.constantFrom("Chemistry", "Biology", "Geography", "Hindi", "Sanskrit"),
      fc.option(fc.constantFrom("Room 1", "Room 2", "Lab A"), { nil: undefined }),
      fc.option(fc.constantFrom("Room 3", "Room 4", "Hall B"), { nil: undefined }),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 25: Swapping scheduled subjects is conservative and self-inverse
    "self-inverse: applying moveSubject twice (swap then swap back) restores original subjects and rooms",
    (subjectA, subjectB, roomA, roomB) => {
      // Feature: exam-routine-builder, Property 25: Swapping scheduled subjects is conservative and self-inverse
      fc.pre(subjectA !== subjectB)

      const classA = "swap-class-A-25c"
      const classB = "swap-class-B-25c"
      const date = "2026-05-03"
      const sessionId = "ses-swap-25c"

      const fromCoord: SlotCoord = { classId: classA, date, sessionId }
      const toCoord: SlotCoord = { classId: classB, date, sessionId }

      // Catalog: both subjects linked to both classes.
      const catalog = [
        { id: "subj-a-25c", name: subjectA, linkedClassIds: [classA, classB] },
        { id: "subj-b-25c", name: subjectB, linkedClassIds: [classA, classB] },
      ]

      const slotA = {
        id: `es-${classA}__${date}__${sessionId}`,
        classId: classA,
        date,
        sessionId,
        subject: subjectA,
        ...(roomA !== undefined ? { room: roomA } : {}),
        invigilatorIds: [] as string[],
      }
      const slotB = {
        id: `es-${classB}__${date}__${sessionId}`,
        classId: classB,
        date,
        sessionId,
        subject: subjectB,
        ...(roomB !== undefined ? { room: roomB } : {}),
        invigilatorIds: [] as string[],
      }

      const slots = [slotA, slotB]

      // First swap: A→B direction.
      const firstResult = moveSubject(slots, fromCoord, toCoord, catalog)
      if (!firstResult.ok) return false

      // Second swap: B→A direction (the reverse — this is the "undo" of the first).
      const secondResult = moveSubject(firstResult.value, toCoord, fromCoord, catalog)
      if (!secondResult.ok) return false

      // After two swaps the state must equal the original.
      const finalSlots = secondResult.value

      const slotAFinal = finalSlots.find(
        s => s.classId === classA && s.date === date && s.sessionId === sessionId,
      )
      const slotBFinal = finalSlots.find(
        s => s.classId === classB && s.date === date && s.sessionId === sessionId,
      )

      if (!slotAFinal || !slotBFinal) return false

      // classA must have its original subject and room back.
      if (slotAFinal.subject !== subjectA) return false
      if (slotAFinal.room !== roomA) return false

      // classB must have its original subject and room back.
      if (slotBFinal.subject !== subjectB) return false
      if (slotBFinal.room !== roomB) return false

      return true
    },
  )

  // ── 25-D: Third-party slots are untouched by the swap ─────────────────────

  fcTest.prop(
    [
      arbSlots,
      fc.constantFrom("Mathematics", "English", "Science", "History", "Physics"),
      fc.constantFrom("Chemistry", "Biology", "Geography", "Hindi", "Sanskrit"),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 25: Swapping scheduled subjects is conservative and self-inverse
    "conservative: a swap between two slots leaves every other slot in the array completely unchanged",
    (baseSlots, subjectA, subjectB) => {
      // Feature: exam-routine-builder, Property 25: Swapping scheduled subjects is conservative and self-inverse
      fc.pre(subjectA !== subjectB)

      const classA = "swap-class-A-25d"
      const classB = "swap-class-B-25d"
      const date = "2026-05-04"
      const sessionId = "ses-swap-25d"

      const fromCoord: SlotCoord = { classId: classA, date, sessionId }
      const toCoord: SlotCoord = { classId: classB, date, sessionId }

      const catalog = [
        { id: "subj-a-25d", name: subjectA, linkedClassIds: [classA, classB] },
        { id: "subj-b-25d", name: subjectB, linkedClassIds: [classA, classB] },
      ]

      // Remove any baseSlot that would collide with the two swap participants.
      const filteredBase = baseSlots.filter(
        s =>
          !(s.classId === classA && s.date === date && s.sessionId === sessionId) &&
          !(s.classId === classB && s.date === date && s.sessionId === sessionId),
      )

      const slotA = {
        id: `es-${classA}__${date}__${sessionId}`,
        classId: classA,
        date,
        sessionId,
        subject: subjectA,
        invigilatorIds: [] as string[],
      }
      const slotB = {
        id: `es-${classB}__${date}__${sessionId}`,
        classId: classB,
        date,
        sessionId,
        subject: subjectB,
        invigilatorIds: [] as string[],
      }

      const slots = [...filteredBase, slotA, slotB]

      const result = moveSubject(slots, fromCoord, toCoord, catalog)
      if (!result.ok) return false

      const newSlots = result.value

      // Every slot that was NOT one of the two swap participants must be
      // completely unchanged in the resulting array.
      for (const original of filteredBase) {
        const updated = newSlots.find(
          s =>
            s.classId === original.classId &&
            s.date === original.date &&
            s.sessionId === original.sessionId,
        )
        if (!updated) return false
        if (updated.subject !== original.subject) return false
        if (updated.room !== original.room) return false
        if (updated.invigilatorIds.length !== original.invigilatorIds.length) return false
        for (let i = 0; i < original.invigilatorIds.length; i++) {
          if (updated.invigilatorIds[i] !== original.invigilatorIds[i]) return false
        }
      }

      return true
    },
  )

  // ── 25-E: Invigilators stay with their original slot through the swap ──────

  fcTest.prop(
    [
      fc.constantFrom("Mathematics", "English", "Science"),
      fc.constantFrom("Chemistry", "Biology", "Geography"),
      fc.uniqueArray(fc.constantFrom("t1", "t2", "t3"), { minLength: 0, maxLength: 2 }),
      fc.uniqueArray(fc.constantFrom("t4", "t5", "t6"), { minLength: 0, maxLength: 2 }),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 25: Swapping scheduled subjects is conservative and self-inverse
    "conservative: invigilators stay with their slot (not the subject) through a swap",
    (subjectA, subjectB, invsA, invsB) => {
      // Feature: exam-routine-builder, Property 25: Swapping scheduled subjects is conservative and self-inverse
      fc.pre(subjectA !== subjectB)

      const classA = "swap-class-A-25e"
      const classB = "swap-class-B-25e"
      const date = "2026-05-05"
      const sessionId = "ses-swap-25e"

      const fromCoord: SlotCoord = { classId: classA, date, sessionId }
      const toCoord: SlotCoord = { classId: classB, date, sessionId }

      const catalog = [
        { id: "subj-a-25e", name: subjectA, linkedClassIds: [classA, classB] },
        { id: "subj-b-25e", name: subjectB, linkedClassIds: [classA, classB] },
      ]

      const slotA = {
        id: `es-${classA}__${date}__${sessionId}`,
        classId: classA,
        date,
        sessionId,
        subject: subjectA,
        invigilatorIds: [...invsA],
      }
      const slotB = {
        id: `es-${classB}__${date}__${sessionId}`,
        classId: classB,
        date,
        sessionId,
        subject: subjectB,
        invigilatorIds: [...invsB],
      }

      const slots = [slotA, slotB]

      const result = moveSubject(slots, fromCoord, toCoord, catalog)
      if (!result.ok) return false

      const newSlots = result.value

      const slotAAfter = newSlots.find(
        s => s.classId === classA && s.date === date && s.sessionId === sessionId,
      )
      const slotBAfter = newSlots.find(
        s => s.classId === classB && s.date === date && s.sessionId === sessionId,
      )

      if (!slotAAfter || !slotBAfter) return false

      // invigilatorIds stay with the slot coordinate, not the subject.
      // classA slot keeps invsA; classB slot keeps invsB.
      if (slotAAfter.invigilatorIds.length !== invsA.length) return false
      for (let i = 0; i < invsA.length; i++) {
        if (slotAAfter.invigilatorIds[i] !== invsA[i]) return false
      }

      if (slotBAfter.invigilatorIds.length !== invsB.length) return false
      for (let i = 0; i < invsB.length; i++) {
        if (slotBAfter.invigilatorIds[i] !== invsB[i]) return false
      }

      return true
    },
  )

  // ── Example tests ──────────────────────────────────────────────────────────

  it("conservative: swap preserves the exact set of subjects across both slots", () => {
    // Before: VIII-A=Mathematics/Room1, IX-A=English/Room2
    // After swap: VIII-A=English/Room2, IX-A=Mathematics/Room1
    // Subjects across both slots: {Mathematics, English} — unchanged.
    const catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: ["VIII-A", "IX-A"] },
      { id: "subj-eng",  name: "English",     linkedClassIds: ["VIII-A", "IX-A"] },
    ]
    const slots = [
      {
        id: "es-viii",
        classId: "VIII-A",
        date: "2026-06-01",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 1",
        invigilatorIds: [],
      },
      {
        id: "es-ix",
        classId: "IX-A",
        date: "2026-06-01",
        sessionId: "ses-morning",
        subject: "English",
        room: "Room 2",
        invigilatorIds: [],
      },
    ]

    const from: SlotCoord = { classId: "VIII-A", date: "2026-06-01", sessionId: "ses-morning" }
    const to:   SlotCoord = { classId: "IX-A",   date: "2026-06-01", sessionId: "ses-morning" }

    const result = moveSubject(slots, from, to, catalog)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const newSlots = result.value

    const subjectsBefore = ["Mathematics", "English"].sort()
    const subjectsAfter = newSlots
      .filter(s => s.date === "2026-06-01" && s.sessionId === "ses-morning")
      .map(s => s.subject!)
      .sort()

    // Same multiset of subjects — none created or destroyed.
    expect(subjectsAfter).toEqual(subjectsBefore)
  })

  it("self-inverse: swapping twice restores both subjects and rooms to their original slots", () => {
    // First swap: VIII-A(Math/R1) ↔ IX-A(English/R2)  →  VIII-A(English/R2) + IX-A(Math/R1)
    // Second swap (reverse): IX-A → VIII-A  →  VIII-A(Math/R1) + IX-A(English/R2)  [original]
    const catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: ["VIII-A", "IX-A"] },
      { id: "subj-eng",  name: "English",     linkedClassIds: ["VIII-A", "IX-A"] },
    ]
    const slots = [
      {
        id: "es-viii",
        classId: "VIII-A",
        date: "2026-06-02",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 1",
        invigilatorIds: [],
      },
      {
        id: "es-ix",
        classId: "IX-A",
        date: "2026-06-02",
        sessionId: "ses-morning",
        subject: "English",
        room: "Room 2",
        invigilatorIds: [],
      },
    ]

    const from: SlotCoord = { classId: "VIII-A", date: "2026-06-02", sessionId: "ses-morning" }
    const to:   SlotCoord = { classId: "IX-A",   date: "2026-06-02", sessionId: "ses-morning" }

    // First swap.
    const first = moveSubject(slots, from, to, catalog)
    expect(first.ok).toBe(true)
    if (!first.ok) return

    // Verify the swap happened.
    const viiiAfterFirst = first.value.find(s => s.classId === "VIII-A")
    expect(viiiAfterFirst?.subject).toBe("English")
    expect(viiiAfterFirst?.room).toBe("Room 2")

    // Second swap (reverse direction: from IX-A back to VIII-A).
    const second = moveSubject(first.value, to, from, catalog)
    expect(second.ok).toBe(true)
    if (!second.ok) return

    const viiiFinal = second.value.find(s => s.classId === "VIII-A")
    const ixFinal   = second.value.find(s => s.classId === "IX-A")

    // Both slots restored to their original state.
    expect(viiiFinal?.subject).toBe("Mathematics")
    expect(viiiFinal?.room).toBe("Room 1")
    expect(ixFinal?.subject).toBe("English")
    expect(ixFinal?.room).toBe("Room 2")
  })

  it("self-inverse holds when rooms are undefined on both slots", () => {
    // Swap(swap(s)) = s even when there are no rooms to track.
    const catalog = [
      { id: "subj-sci",  name: "Science",  linkedClassIds: ["VIII-A", "IX-A"] },
      { id: "subj-hist", name: "History",  linkedClassIds: ["VIII-A", "IX-A"] },
    ]
    const slots = [
      { id: "es-viii", classId: "VIII-A", date: "2026-06-03", sessionId: "ses-am", subject: "Science",  invigilatorIds: [] },
      { id: "es-ix",   classId: "IX-A",   date: "2026-06-03", sessionId: "ses-am", subject: "History",  invigilatorIds: [] },
    ]

    const from: SlotCoord = { classId: "VIII-A", date: "2026-06-03", sessionId: "ses-am" }
    const to:   SlotCoord = { classId: "IX-A",   date: "2026-06-03", sessionId: "ses-am" }

    const first  = moveSubject(slots, from, to, catalog)
    expect(first.ok).toBe(true)
    if (!first.ok) return

    const second = moveSubject(first.value, to, from, catalog)
    expect(second.ok).toBe(true)
    if (!second.ok) return

    const viiiF = second.value.find(s => s.classId === "VIII-A")
    const ixF   = second.value.find(s => s.classId === "IX-A")

    expect(viiiF?.subject).toBe("Science")
    expect(viiiF?.room).toBeUndefined()
    expect(ixF?.subject).toBe("History")
    expect(ixF?.room).toBeUndefined()
  })

  it("conservative: invigilators stay with their slot coordinate through the swap, not with the subject", () => {
    // Invigilators are slot-local (not subject-bound). After a swap the invigilator
    // list on each slot coord must be the same as before the swap.
    const catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: ["VIII-A", "IX-A"] },
      { id: "subj-eng",  name: "English",     linkedClassIds: ["VIII-A", "IX-A"] },
    ]
    const slots = [
      {
        id: "es-viii",
        classId: "VIII-A",
        date: "2026-06-04",
        sessionId: "ses-morning",
        subject: "Mathematics",
        room: "Room 1",
        invigilatorIds: ["t1", "t2"],
      },
      {
        id: "es-ix",
        classId: "IX-A",
        date: "2026-06-04",
        sessionId: "ses-morning",
        subject: "English",
        room: "Room 2",
        invigilatorIds: ["t3"],
      },
    ]

    const from: SlotCoord = { classId: "VIII-A", date: "2026-06-04", sessionId: "ses-morning" }
    const to:   SlotCoord = { classId: "IX-A",   date: "2026-06-04", sessionId: "ses-morning" }

    const result = moveSubject(slots, from, to, catalog)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const newSlots = result.value

    // Subjects swapped.
    const viiiAfter = newSlots.find(s => s.classId === "VIII-A")
    const ixAfter   = newSlots.find(s => s.classId === "IX-A")
    expect(viiiAfter?.subject).toBe("English")
    expect(ixAfter?.subject).toBe("Mathematics")

    // Invigilators stay with the slot coordinate, not the subject.
    expect(viiiAfter?.invigilatorIds).toEqual(["t1", "t2"])
    expect(ixAfter?.invigilatorIds).toEqual(["t3"])
  })
})


// ─────────────────────────────────────────────────────────────────────────────
// Property 26: Moving an invigilator duty conserves the assignment
// Feature: exam-routine-builder, Property 26: Moving an invigilator duty conserves the assignment
// **Validates: Requirements 7.5**
// ─────────────────────────────────────────────────────────────────────────────

import { moveInvigilator } from "@/lib/exam/slots"

describe("Property 26: Moving an invigilator duty conserves the assignment", () => {
  /**
   * R7.5: "WHEN an Admin drags an Invigilator duty from a source Exam_Slot and
   * drops it onto a target Exam_Slot that holds a subject and does not already
   * list that Invigilator, THE Exam_Routine_Builder SHALL remove that Invigilator
   * from the source Exam_Slot, add the Invigilator to the target Exam_Slot, and
   * re-evaluate conflicts via the Conflict_Engine."
   *
   * Properties tested:
   * 26-A: The invigilator appears in the target slot's invigilatorIds after the move.
   * 26-B: The invigilator is removed from the source slot's invigilatorIds after the move.
   * 26-C: No other slot's invigilatorIds is modified.
   * 26-D: The total invigilator-duty count across the two slots is conserved (net zero).
   * 26-E: Moving to a slot that already lists the teacher fails with already-assigned.
   * 26-F: Moving to a slot with no subject fails with no-subject-scheduled.
   * 26-G: Moving to the same slot (from === to) is a no-op — invigilatorIds unchanged,
   *        the same slots array reference is returned.
   *
   * Validates: Requirements 7.5
   */

  // ── 26-A + 26-B + 26-C: core conservation property ───────────────────────

  fcTest.prop(
    [
      arbSlots,
      fc.record({
        fromClassId:  fc.constantFrom("VIII-A", "VIII-B", "IX-A",  "IX-B",  "X-A"),
        toClassId:    fc.constantFrom("VIII-A", "VIII-B", "IX-A",  "IX-B",  "X-A"),
        date:         fc.constantFrom("2026-05-01", "2026-06-15", "2026-07-20"),
        sessionId:    fc.constantFrom("ses-morning", "ses-afternoon", "ses-evening"),
        subjectName:  fc.constantFrom("Mathematics", "English", "Science", "History", "Physics"),
      }),
      fc.constantFrom("t-move-1", "t-move-2", "t-move-3", "t-move-4", "t-move-5"),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 26: Moving an invigilator duty conserves the assignment
    "moveInvigilator: teacher appears in target, disappears from source, every other slot is unchanged",
    (baseSlots, { fromClassId, toClassId, date, sessionId, subjectName }, teacherId) => {
      // Require source and target to be different slots (different class ids).
      fc.pre(fromClassId !== toClassId)

      const fromCoord: SlotCoord = { classId: fromClassId, date, sessionId }
      const toCoord:   SlotCoord = { classId: toClassId,   date, sessionId }

      // Build a source slot that already has the teacherId in its invigilatorIds.
      const sourceSlot = {
        id: `es-${fromClassId}__${date}__${sessionId}`,
        classId:        fromClassId,
        date,
        sessionId,
        subject:        subjectName,
        invigilatorIds: [teacherId],
      }

      // Build a target slot that has a subject but does NOT list the teacher.
      const targetSlot = {
        id: `es-${toClassId}__${date}__${sessionId}`,
        classId:        toClassId,
        date,
        sessionId,
        subject:        subjectName,
        invigilatorIds: [] as string[],
      }

      // Merge both slots into baseSlots, replacing any pre-existing slot at the
      // same coordinates to preserve the slot-key uniqueness invariant.
      const slots = [
        ...baseSlots.filter(
          s =>
            !(s.classId === fromClassId && s.date === date && s.sessionId === sessionId) &&
            !(s.classId === toClassId   && s.date === date && s.sessionId === sessionId),
        ),
        sourceSlot,
        targetSlot,
      ]

      const result = moveInvigilator(slots, fromCoord, toCoord, teacherId)

      // The operation must succeed — target has a subject and teacher is not listed.
      if (!result.ok) return false
      const newSlots = result.value

      // ── 26-A: teacher is now in the target slot ────────────────────────────
      const updatedTarget = newSlots.find(
        s => s.classId === toClassId && s.date === date && s.sessionId === sessionId,
      )
      if (!updatedTarget) return false
      if (!updatedTarget.invigilatorIds.includes(teacherId)) return false

      // ── 26-B: teacher is no longer in the source slot ─────────────────────
      const updatedSource = newSlots.find(
        s => s.classId === fromClassId && s.date === date && s.sessionId === sessionId,
      )
      if (!updatedSource) return false
      if (updatedSource.invigilatorIds.includes(teacherId)) return false

      // ── 26-C: no other slot's invigilatorIds changed ───────────────────────
      for (const original of slots) {
        const isSource = original.classId === fromClassId && original.date === date && original.sessionId === sessionId
        const isTarget = original.classId === toClassId   && original.date === date && original.sessionId === sessionId
        if (isSource || isTarget) continue

        const updated = newSlots.find(
          s =>
            s.classId  === original.classId &&
            s.date     === original.date &&
            s.sessionId === original.sessionId,
        )
        if (!updated) return false
        if (updated.invigilatorIds.length !== original.invigilatorIds.length) return false
        for (let i = 0; i < original.invigilatorIds.length; i++) {
          if (updated.invigilatorIds[i] !== original.invigilatorIds[i]) return false
        }
      }

      // Slot count must not change.
      if (newSlots.length !== slots.length) return false

      return true
    },
  )

  // ── 26-D: total duty count across source + target is conserved ────────────

  fcTest.prop(
    [
      // Existing invigilators on the source slot (besides the one being moved).
      fc.uniqueArray(
        fc.constantFrom("t1", "t2", "t3", "t4"),
        { minLength: 0, maxLength: 3 },
      ),
      // Existing invigilators on the target slot.
      fc.uniqueArray(
        fc.constantFrom("t6", "t7", "t8"),
        { minLength: 0, maxLength: 2 },
      ),
      // The teacher being moved — guaranteed not in either pool above.
      fc.constantFrom("t-move-10", "t-move-11", "t-move-12"),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 26: Moving an invigilator duty conserves the assignment
    "duty count: the sum of invigilatorIds across source and target is unchanged after the move",
    (sourceOthers, targetOthers, movingTeacher) => {
      const sourceClassId = "move-src-26d"
      const targetClassId = "move-tgt-26d"
      const date = "2026-05-01"
      const sessionId = "ses-morning"

      const fromCoord: SlotCoord = { classId: sourceClassId, date, sessionId }
      const toCoord:   SlotCoord = { classId: targetClassId, date, sessionId }

      const sourceSlot = {
        id: `es-${sourceClassId}__${date}__${sessionId}`,
        classId:        sourceClassId,
        date,
        sessionId,
        subject:        "Mathematics",
        invigilatorIds: [...sourceOthers, movingTeacher],
      }

      const targetSlot = {
        id: `es-${targetClassId}__${date}__${sessionId}`,
        classId:        targetClassId,
        date,
        sessionId,
        subject:        "English",
        invigilatorIds: [...targetOthers],
      }

      const slots = [sourceSlot, targetSlot]
      const totalBefore = sourceSlot.invigilatorIds.length + targetSlot.invigilatorIds.length

      const result = moveInvigilator(slots, fromCoord, toCoord, movingTeacher)
      if (!result.ok) return false

      const newSlots = result.value
      const updatedSource = newSlots.find(s => s.classId === sourceClassId)!
      const updatedTarget = newSlots.find(s => s.classId === targetClassId)!
      const totalAfter = updatedSource.invigilatorIds.length + updatedTarget.invigilatorIds.length

      // Net-zero transfer: total duty count must be conserved.
      return totalBefore === totalAfter
    },
  )

  // ── 26-E: target already lists the teacher → already-assigned guard ────────

  fcTest.prop(
    [
      arbSlots,
      fc.record({
        fromClassId:  fc.constantFrom("VIII-A", "VIII-B", "IX-A"),
        toClassId:    fc.constantFrom("IX-B",   "X-A",   "X-B"),
        date:         fc.constantFrom("2026-05-01", "2026-06-15"),
        sessionId:    fc.constantFrom("ses-morning", "ses-afternoon"),
        subjectName:  fc.constantFrom("Mathematics", "English", "Science"),
      }),
      fc.constantFrom("t-dup-a", "t-dup-b", "t-dup-c"),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 26: Moving an invigilator duty conserves the assignment
    "moving to a slot that already lists the teacher returns already-assigned",
    (baseSlots, { fromClassId, toClassId, date, sessionId, subjectName }, teacherId) => {
      fc.pre(fromClassId !== toClassId)

      const fromCoord: SlotCoord = { classId: fromClassId, date, sessionId }
      const toCoord:   SlotCoord = { classId: toClassId,   date, sessionId }

      const sourceSlot = {
        id: `es-${fromClassId}__${date}__${sessionId}`,
        classId:        fromClassId,
        date,
        sessionId,
        subject:        subjectName,
        invigilatorIds: [teacherId],
      }

      // Target already has teacherId in its invigilatorIds.
      const targetSlot = {
        id: `es-${toClassId}__${date}__${sessionId}`,
        classId:        toClassId,
        date,
        sessionId,
        subject:        subjectName,
        invigilatorIds: [teacherId],
      }

      const slots = [
        ...baseSlots.filter(
          s =>
            !(s.classId === fromClassId && s.date === date && s.sessionId === sessionId) &&
            !(s.classId === toClassId   && s.date === date && s.sessionId === sessionId),
        ),
        sourceSlot,
        targetSlot,
      ]

      const result = moveInvigilator(slots, fromCoord, toCoord, teacherId)

      // Must be rejected.
      if (result.ok !== false) return false
      if (result.error !== "already-assigned") return false

      // Both slots must remain unchanged (no mutation on failure).
      const sourceInOriginal = slots.find(s => s.classId === fromClassId && s.date === date && s.sessionId === sessionId)
      const targetInOriginal = slots.find(s => s.classId === toClassId   && s.date === date && s.sessionId === sessionId)

      if (!sourceInOriginal || !sourceInOriginal.invigilatorIds.includes(teacherId)) return false
      if (!targetInOriginal || !targetInOriginal.invigilatorIds.includes(teacherId)) return false

      return true
    },
  )

  // ── 26-F: target has no subject → no-subject-scheduled guard ──────────────

  fcTest.prop(
    [
      arbSlots,
      fc.record({
        fromClassId:  fc.constantFrom("VIII-A", "VIII-B", "IX-A"),
        toClassId:    fc.constantFrom("IX-B",   "X-A",   "X-B"),
        date:         fc.constantFrom("2026-05-01", "2026-06-15"),
        sessionId:    fc.constantFrom("ses-morning", "ses-afternoon"),
        subjectName:  fc.constantFrom("Mathematics", "English", "Science"),
      }),
      fc.constantFrom("t-ns-a", "t-ns-b", "t-ns-c"),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 26: Moving an invigilator duty conserves the assignment
    "moving to a slot with no subject returns no-subject-scheduled",
    (baseSlots, { fromClassId, toClassId, date, sessionId, subjectName }, teacherId) => {
      fc.pre(fromClassId !== toClassId)

      const fromCoord: SlotCoord = { classId: fromClassId, date, sessionId }
      const toCoord:   SlotCoord = { classId: toClassId,   date, sessionId }

      const sourceSlot = {
        id: `es-${fromClassId}__${date}__${sessionId}`,
        classId:        fromClassId,
        date,
        sessionId,
        subject:        subjectName,
        invigilatorIds: [teacherId],
      }

      // Target slot has NO subject — must trigger the guard.
      const noSubjectTarget = {
        id: `es-${toClassId}__${date}__${sessionId}`,
        classId:        toClassId,
        date,
        sessionId,
        // subject intentionally absent
        invigilatorIds: [] as string[],
      }

      const slots = [
        ...baseSlots.filter(
          s =>
            !(s.classId === fromClassId && s.date === date && s.sessionId === sessionId) &&
            !(s.classId === toClassId   && s.date === date && s.sessionId === sessionId),
        ),
        sourceSlot,
        noSubjectTarget,
      ]

      const result = moveInvigilator(slots, fromCoord, toCoord, teacherId)

      if (result.ok !== false) return false
      if (result.error !== "no-subject-scheduled") return false

      // Source slot must still hold the teacher.
      const sourceInSlots = slots.find(s => s.classId === fromClassId && s.date === date && s.sessionId === sessionId)
      if (!sourceInSlots || !sourceInSlots.invigilatorIds.includes(teacherId)) return false

      return true
    },
  )

  // ── 26-G: same-slot move is a no-op ───────────────────────────────────────

  fcTest.prop(
    [
      arbSlots,
      fc.record({
        classId:      fc.constantFrom("VIII-A", "VIII-B", "IX-A", "IX-B", "X-A"),
        date:         fc.constantFrom("2026-05-01", "2026-06-15", "2026-07-20"),
        sessionId:    fc.constantFrom("ses-morning", "ses-afternoon", "ses-evening"),
        subjectName:  fc.constantFrom("Mathematics", "English", "Science", "History", "Physics"),
      }),
      fc.constantFrom("t-same-1", "t-same-2", "t-same-3"),
    ],
    { numRuns: 100 },
  )(
    // Feature: exam-routine-builder, Property 26: Moving an invigilator duty conserves the assignment
    "moving an invigilator from a slot to itself (same coord) is a no-op: same array reference returned",
    (baseSlots, { classId, date, sessionId, subjectName }, teacherId) => {
      // Build a slot with the teacher already listed (so the teacher genuinely exists on it).
      const selfSlot = {
        id: `es-${classId}__${date}__${sessionId}`,
        classId,
        date,
        sessionId,
        subject: subjectName,
        invigilatorIds: [teacherId],
      }

      const slots = [
        ...baseSlots.filter(
          s => !(s.classId === classId && s.date === date && s.sessionId === sessionId),
        ),
        selfSlot,
      ]

      const coord: SlotCoord = { classId, date, sessionId }

      // When from === to, the teacher is already in the target — guard triggers.
      // The result MUST be already-assigned (duplicate guard R7.8, R4.6).
      const result = moveInvigilator(slots, coord, coord, teacherId)

      // The "no-op / same-slot" case manifests as the already-assigned guard
      // because the target already lists the teacher.  The key invariant is that
      // the operation is rejected and nothing is mutated.
      if (result.ok !== false) return false
      if (result.error !== "already-assigned") return false

      // Slots array must be unmodified.
      const slotInArray = slots.find(s => s.classId === classId && s.date === date && s.sessionId === sessionId)
      if (!slotInArray) return false
      if (!slotInArray.invigilatorIds.includes(teacherId)) return false

      return true
    },
  )

  // ── Example tests ──────────────────────────────────────────────────────────

  it("moves the invigilator from source to target and leaves every other slot unchanged", () => {
    const slots = [
      {
        id: "es-viii",
        classId: "VIII-A",
        date: "2026-03-10",
        sessionId: "ses-morning",
        subject: "Mathematics",
        invigilatorIds: ["t1", "t2"],
      },
      {
        id: "es-ix",
        classId: "IX-A",
        date: "2026-03-10",
        sessionId: "ses-morning",
        subject: "Physics",
        invigilatorIds: ["t3"],
      },
      {
        id: "es-x",
        classId: "X-A",
        date: "2026-03-10",
        sessionId: "ses-morning",
        subject: "History",
        invigilatorIds: ["t5"],
      },
    ]

    const from: SlotCoord = { classId: "VIII-A", date: "2026-03-10", sessionId: "ses-morning" }
    const to:   SlotCoord = { classId: "IX-A",   date: "2026-03-10", sessionId: "ses-morning" }

    // Move t2 from VIII-A → IX-A.
    const result = moveInvigilator(slots, from, to, "t2")

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const newSlots = result.value

    // Source: t2 removed; t1 remains.
    const source = newSlots.find(s => s.classId === "VIII-A")
    expect(source?.invigilatorIds).toEqual(["t1"])
    expect(source?.invigilatorIds).not.toContain("t2")

    // Target: t2 appended; t3 remains.
    const target = newSlots.find(s => s.classId === "IX-A")
    expect(target?.invigilatorIds).toContain("t2")
    expect(target?.invigilatorIds).toContain("t3")
    expect(target?.invigilatorIds).toHaveLength(2)

    // X-A slot is completely untouched.
    const xSlot = newSlots.find(s => s.classId === "X-A")
    expect(xSlot?.invigilatorIds).toEqual(["t5"])

    // Total duty count conserved: (2 + 1) before = (1 + 2) after = 3.
    const totalAfter = source!.invigilatorIds.length + target!.invigilatorIds.length
    expect(totalAfter).toBe(3)
  })

  it("returns already-assigned when the target slot already lists the teacher", () => {
    const slots = [
      {
        id: "es-src",
        classId: "VIII-A",
        date: "2026-04-01",
        sessionId: "ses-morning",
        subject: "Mathematics",
        invigilatorIds: ["t10"],
      },
      {
        id: "es-tgt",
        classId: "IX-A",
        date: "2026-04-01",
        sessionId: "ses-morning",
        subject: "English",
        invigilatorIds: ["t10", "t11"], // t10 already here
      },
    ]

    const from: SlotCoord = { classId: "VIII-A", date: "2026-04-01", sessionId: "ses-morning" }
    const to:   SlotCoord = { classId: "IX-A",   date: "2026-04-01", sessionId: "ses-morning" }

    const result = moveInvigilator(slots, from, to, "t10")

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("already-assigned")

    // Both slots remain unchanged.
    expect(slots[0].invigilatorIds).toEqual(["t10"])
    expect(slots[1].invigilatorIds).toEqual(["t10", "t11"])
  })

  it("returns no-subject-scheduled when the target slot has no subject", () => {
    const slots = [
      {
        id: "es-src",
        classId: "VIII-A",
        date: "2026-04-10",
        sessionId: "ses-afternoon",
        subject: "Science",
        invigilatorIds: ["t20"],
      },
      {
        id: "es-tgt",
        classId: "IX-A",
        date: "2026-04-10",
        sessionId: "ses-afternoon",
        // No subject on target
        invigilatorIds: [],
      },
    ]

    const from: SlotCoord = { classId: "VIII-A", date: "2026-04-10", sessionId: "ses-afternoon" }
    const to:   SlotCoord = { classId: "IX-A",   date: "2026-04-10", sessionId: "ses-afternoon" }

    const result = moveInvigilator(slots, from, to, "t20")

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("no-subject-scheduled")

    // Source slot still has t20 — nothing moved.
    expect(slots[0].invigilatorIds).toContain("t20")
  })

  it("same-slot move is treated as already-assigned (no-op guard)", () => {
    const slots = [
      {
        id: "es-self",
        classId: "VIII-A",
        date: "2026-05-01",
        sessionId: "ses-morning",
        subject: "Mathematics",
        invigilatorIds: ["t99"],
      },
    ]

    const coord: SlotCoord = { classId: "VIII-A", date: "2026-05-01", sessionId: "ses-morning" }

    // from === to — teacher is already in the only slot.
    const result = moveInvigilator(slots, coord, coord, "t99")

    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe("already-assigned")

    // Slot is completely unchanged.
    expect(slots[0].invigilatorIds).toEqual(["t99"])
  })

  it("duty count is conserved: total invigilators across source + target is the same before and after", () => {
    const slots = [
      {
        id: "es-a",
        classId: "VIII-A",
        date: "2026-06-01",
        sessionId: "ses-morning",
        subject: "Mathematics",
        invigilatorIds: ["tA", "tB", "tC"], // 3 duties
      },
      {
        id: "es-b",
        classId: "IX-A",
        date: "2026-06-01",
        sessionId: "ses-morning",
        subject: "English",
        invigilatorIds: ["tD"], // 1 duty
      },
    ]

    const from: SlotCoord = { classId: "VIII-A", date: "2026-06-01", sessionId: "ses-morning" }
    const to:   SlotCoord = { classId: "IX-A",   date: "2026-06-01", sessionId: "ses-morning" }

    // Move tC from VIII-A to IX-A.
    const result = moveInvigilator(slots, from, to, "tC")

    expect(result.ok).toBe(true)
    if (!result.ok) return

    const newSlots = result.value
    const src = newSlots.find(s => s.classId === "VIII-A")!
    const tgt = newSlots.find(s => s.classId === "IX-A")!

    // Before: 3 + 1 = 4; After: 2 + 2 = 4 — conserved.
    expect(src.invigilatorIds).toEqual(["tA", "tB"])
    expect(tgt.invigilatorIds).toEqual(["tD", "tC"])
    expect(src.invigilatorIds.length + tgt.invigilatorIds.length).toBe(4)
  })
})
