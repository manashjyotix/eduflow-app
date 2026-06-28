/**
 * duty-notifications.test.ts — Property-based tests for the Duty Notifications
 * pure-logic module.
 *
 * // Feature: exam-routine-builder, Property 43: One message per subject-bearing assignment with required fields
 * // Feature: exam-routine-builder, Property 44: Subject-less assignments are skipped and counted
 *
 * Validates: Requirements 11.1, 11.2
 */

import { describe } from "vitest"
import { test } from "@fast-check/vitest"
import * as fc from "fast-check"
import { expect } from "vitest"
import { buildDutyMessages } from "@/lib/exam/duty-notifications"
import { arbSlots, arbSessions } from "@/__tests__/exam/generators"
import type { ExamDutySettings } from "@/data/mock-exams"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Arbitrary for a valid ExamDutySettings with notifyLeadMinutes in range 0–10080
 * and a boolean notifyOnCampusEntry.
 */
const arbSettings: fc.Arbitrary<ExamDutySettings> = fc
  .tuple(
    fc.integer({ min: 0, max: 10080 }),
    fc.boolean(),
  )
  .map(([notifyLeadMinutes, notifyOnCampusEntry]) => ({
    notifyLeadMinutes,
    notifyOnCampusEntry,
  }))

// ─────────────────────────────────────────────────────────────────────────────
// Property 43: One message per subject-bearing assignment with required fields
// ─────────────────────────────────────────────────────────────────────────────

/**
 * **Validates: Requirements 11.1**
 *
 * For any array of slots, sessions, and valid duty settings:
 *
 * 1. The total number of messages equals the number of (slot, invigilatorId)
 *    pairs where the slot has a non-empty subject — exactly one message per
 *    subject-bearing assignment (R11.1).
 *
 * 2. Every emitted message carries the required fields: classId, subject, date,
 *    sessionId, sessionStartTime, teacherId, and leadMinutes (R11.1, R11.5).
 *
 * 3. The `room` field is present in a message if and only if the originating
 *    slot has a non-empty room string assigned (R11.1).
 */
describe("Property 43: One message per subject-bearing assignment with required fields", () => {
  test.prop(
    [arbSlots, arbSessions, arbSettings],
    { numRuns: 100 },
  )(
    "emits exactly one message per (slot, invigilatorId) pair with a subject and all required fields",
    (slots, sessions, settings) => {
      const { messages } = buildDutyMessages(slots, sessions, settings)

      // ── 1. Count: one message per subject-bearing (slot × invigilator) pair ──

      // Collect all (slot, invigilatorId) pairs where slot has a subject.
      const expectedPairs = slots.flatMap(slot => {
        const trimmedSubject = slot.subject?.trim()
        if (!trimmedSubject) return []
        return slot.invigilatorIds.map(tid => ({
          slotKey: `${slot.classId}__${slot.date}__${slot.sessionId}`,
          teacherId: tid,
        }))
      })

      expect(messages.length).toBe(expectedPairs.length)

      // ── 2. Required fields present on every message ──

      for (const msg of messages) {
        // classId must be a non-empty string
        expect(typeof msg.classId).toBe("string")
        expect(msg.classId.length).toBeGreaterThan(0)

        // subject must be a non-empty string (subject-less slots are skipped)
        expect(typeof msg.subject).toBe("string")
        expect(msg.subject.length).toBeGreaterThan(0)

        // date must be present
        expect(typeof msg.date).toBe("string")
        expect(msg.date.length).toBeGreaterThan(0)

        // sessionId must be present
        expect(typeof msg.sessionId).toBe("string")
        expect(msg.sessionId.length).toBeGreaterThan(0)

        // sessionStartTime must be a string (may be "" when session is unknown)
        expect(typeof msg.sessionStartTime).toBe("string")

        // teacherId must be a non-empty string
        expect(typeof msg.teacherId).toBe("string")
        expect(msg.teacherId.length).toBeGreaterThan(0)

        // leadMinutes must equal the configured value and be in 0–10080
        expect(msg.leadMinutes).toBe(settings.notifyLeadMinutes)
        expect(msg.leadMinutes).toBeGreaterThanOrEqual(0)
        expect(msg.leadMinutes).toBeLessThanOrEqual(10080)
      }

      // ── 3. Room present iff the originating slot has a non-empty room ──

      // Build a lookup map from (classId, date, sessionId, teacherId) → slot
      // so we can verify room inclusion per message.
      const slotByCoord = new Map(
        slots.map(s => [`${s.classId}__${s.date}__${s.sessionId}`, s]),
      )

      for (const msg of messages) {
        const coordKey = `${msg.classId}__${msg.date}__${msg.sessionId}`
        const originSlot = slotByCoord.get(coordKey)

        // The originating slot must exist
        expect(originSlot).toBeDefined()
        if (!originSlot) continue

        const slotHasRoom =
          originSlot.room !== undefined && originSlot.room !== ""

        if (slotHasRoom) {
          // room must be present in the message
          expect(msg.room).toBeDefined()
          expect(msg.room).toBe(originSlot.room)
        } else {
          // room must be absent from the message
          expect(msg.room).toBeUndefined()
        }
      }
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 44: Subject-less assignments are skipped and counted
// ─────────────────────────────────────────────────────────────────────────────

// Feature: exam-routine-builder, Property 44: Subject-less assignments are skipped and counted

/**
 * **Validates: Requirements 11.2**
 *
 * For any array of slots and sessions:
 *
 * 1. The `skipped` count equals the total number of (slot, invigilatorId) pairs
 *    where the slot has NO subject (empty, whitespace-only, or absent) (R11.2).
 *
 * 2. No message is emitted for a subject-less slot — `messages` contains
 *    entries only for slots with a non-empty trimmed subject (R11.2).
 *
 * 3. The total `messages.length + skipped` equals the grand total of
 *    invigilator assignments across ALL slots (R11.1 + R11.2 together are
 *    exhaustive: every assignment is either messaged or skipped).
 */
describe("Property 44: Subject-less assignments are skipped and counted", () => {
  test.prop(
    [arbSlots, arbSessions, arbSettings],
    { numRuns: 100 },
  )(
    "skipped count equals subject-less invigilator assignments, no message emitted for them, and messages + skipped equals total assignments",
    (slots, sessions, settings) => {
      const { messages, skipped } = buildDutyMessages(slots, sessions, settings)

      // ── Partition slots by whether they have a subject ──
      const subjectLessSlots = slots.filter(s => !s.subject?.trim())
      const subjectBearingSlots = slots.filter(s => !!s.subject?.trim())

      // ── 1. `skipped` equals the number of invigilator assignments on subject-less slots ──
      const expectedSkipped = subjectLessSlots.reduce(
        (acc, slot) => acc + slot.invigilatorIds.length,
        0,
      )
      expect(skipped).toBe(expectedSkipped)

      // ── 2. No message is emitted for a subject-less slot ──
      // Collect the set of (classId, date, sessionId) keys for subject-less slots.
      const subjectLessKeys = new Set(
        subjectLessSlots.map(s => `${s.classId}__${s.date}__${s.sessionId}`),
      )
      for (const msg of messages) {
        const key = `${msg.classId}__${msg.date}__${msg.sessionId}`
        expect(subjectLessKeys.has(key)).toBe(false)
      }

      // ── 3. messages.length + skipped === total invigilator assignments ──
      const totalAssignments = slots.reduce(
        (acc, slot) => acc + slot.invigilatorIds.length,
        0,
      )
      expect(messages.length + skipped).toBe(totalAssignments)

      // ── Bonus consistency: messages.length equals subject-bearing assignment count ──
      const expectedMessages = subjectBearingSlots.reduce(
        (acc, slot) => acc + slot.invigilatorIds.length,
        0,
      )
      expect(messages.length).toBe(expectedMessages)
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 45: Campus-entry digest aggregates and orders duties
// ─────────────────────────────────────────────────────────────────────────────

// Feature: exam-routine-builder, Property 45: Campus-entry digest aggregates and orders duties

import { buildCampusEntryDigest } from "@/lib/exam/duty-notifications"
import { arbTeachers } from "@/__tests__/exam/generators"

/**
 * **Validates: Requirements 11.3, 11.4**
 *
 * For any teacherId, date, slots, sessions, and valid duty settings:
 *
 * 1. `buildCampusEntryDigest` returns `null` when the teacher has no
 *    subject-bearing invigilation duty on the given date (R11.4).
 *
 * 2. `buildCampusEntryDigest` returns a non-null `DutyMessage[]` when the
 *    teacher has at least one subject-bearing duty on the given date (R11.3).
 *
 * 3. Every returned message is for the given `teacherId` and the given `date`
 *    (no cross-contamination from other teachers or dates) (R11.3).
 *
 * 4. The returned list is ordered by `sessionStartTime` ascending; ties are
 *    broken by `sessionId` ascending, which matches the stable sort applied by
 *    `buildCampusEntryDigest` (R11.3).
 */
describe("Property 45: Campus-entry digest aggregates and orders duties", () => {
  test.prop(
    [
      arbTeachers,         // pool of teachers whose ids drive the teacherId pick
      arbSlots,            // arbitrary slots (may or may not contain the teacher's duties)
      arbSessions,         // sessions for start-time resolution
      fc.integer({ min: 0, max: 10080 }).chain(lead =>
        fc.boolean().map(entry => ({
          notifyLeadMinutes: lead,
          notifyOnCampusEntry: entry,
        })),
      ),                   // ExamDutySettings
    ],
    { numRuns: 100 },
  )(
    "returns null when no duties on date, non-null ordered list when duties exist, and all messages match teacherId and date",
    (teachers, slots, sessions, settings) => {
      // Pick a teacherId from the teacher pool if any; otherwise fall back to a
      // fixed id that is unlikely to appear in the generated slots.
      const teacherId =
        teachers.length > 0 ? teachers[0].id : "t-probe-no-match"

      // Pick a date to probe — use the date from the first slot that belongs to
      // this teacher (if any), so we exercise both null and non-null branches
      // with reasonable frequency.
      const teacherSlotDates = slots
        .filter(s => s.invigilatorIds.includes(teacherId) && s.subject?.trim())
        .map(s => s.date)

      const probeDate =
        teacherSlotDates.length > 0
          ? teacherSlotDates[0]
          : "2099-12-31" // a date unlikely to appear in generated slots

      const result = buildCampusEntryDigest(
        teacherId,
        probeDate,
        slots,
        sessions,
        settings,
      )

      // ── Determine ground truth: does this teacher have a subject-bearing duty
      //    on probeDate? ──
      const hasDuty = slots.some(
        s =>
          s.invigilatorIds.includes(teacherId) &&
          s.date === probeDate &&
          !!s.subject?.trim(),
      )

      // ── 1 & 2. Null iff no duties; non-null (array) iff has duties ──
      if (!hasDuty) {
        // R11.4: no duty → must return null
        expect(result).toBeNull()
      } else {
        // R11.3: has duty → must return a non-null array
        expect(result).not.toBeNull()
        expect(Array.isArray(result)).toBe(true)
        // The digest must contain at least one message (the one we detected above)
        expect((result as NonNullable<typeof result>).length).toBeGreaterThan(0)
      }

      // If we got a non-null result, run the structural checks.
      if (result !== null) {
        const messages = result

        // ── 3. Every message is for the correct teacherId and date ──
        for (const msg of messages) {
          expect(msg.teacherId).toBe(teacherId)
          expect(msg.date).toBe(probeDate)
          // Each message must reference a real subject (not empty)
          expect(msg.subject.length).toBeGreaterThan(0)
        }

        // ── 4. Ordered by sessionStartTime ascending, tie-broken by sessionId ──
        for (let i = 1; i < messages.length; i++) {
          const prev = messages[i - 1]
          const curr = messages[i]

          if (prev.sessionStartTime === curr.sessionStartTime) {
            // Tie-break: sessionId ascending
            expect(prev.sessionId <= curr.sessionId).toBe(true)
          } else {
            // Primary sort: sessionStartTime ascending
            expect(prev.sessionStartTime <= curr.sessionStartTime).toBe(true)
          }
        }
      }
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Property 46: Lead time appears in the message
// ─────────────────────────────────────────────────────────────────────────────

// Feature: exam-routine-builder, Property 46: Lead time appears in the message

/**
 * **Validates: Requirements 11.5**
 *
 * For any slots, sessions, and settings, every message returned by
 * `buildDutyMessages` has `leadMinutes` equal to the configured
 * `notifyLeadMinutes` from `ExamDutySettings`, and that value is a whole
 * number between 0 and 10080 inclusive (R11.5).
 *
 * Specifically:
 * 1. `msg.leadMinutes === settings.notifyLeadMinutes` for every emitted message.
 * 2. `msg.leadMinutes` is a whole number (integer — no fractional component).
 * 3. `msg.leadMinutes` is within the valid range [0, 10080].
 * 4. The property holds regardless of slot content, session configuration, or
 *    whether slots have subjects — the lead time is purely determined by
 *    `settings.notifyLeadMinutes`.
 */
describe("Property 46: Lead time appears in the message", () => {
  test.prop(
    [arbSlots, arbSessions, arbSettings],
    { numRuns: 100 },
  )(
    "every message carries leadMinutes equal to the configured notifyLeadMinutes and within 0–10080",
    (slots, sessions, settings) => {
      const { messages } = buildDutyMessages(slots, sessions, settings)

      for (const msg of messages) {
        // 1. leadMinutes must equal the configured value exactly
        expect(msg.leadMinutes).toBe(settings.notifyLeadMinutes)

        // 2. leadMinutes must be a whole number (no fractional component)
        expect(Number.isInteger(msg.leadMinutes)).toBe(true)

        // 3. leadMinutes must be within the valid range [0, 10080] (R11.5)
        expect(msg.leadMinutes).toBeGreaterThanOrEqual(0)
        expect(msg.leadMinutes).toBeLessThanOrEqual(10080)
      }
    },
  )
})
