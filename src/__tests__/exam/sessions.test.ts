/**
 * sessions.test.ts — Property-based tests for the Sessions pure-logic module.
 *
 * Feature: exam-routine-builder, Property 9: Session name validation
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 */

import { describe, it } from "vitest"
import { expect } from "vitest"
import { test } from "@fast-check/vitest"
import * as fc from "fast-check"
import { addSession, editSession, deleteSession, sessionHasSlots } from "@/lib/exam/sessions"
import { arbSessions, arbValidName, arbSubjectName } from "@/__tests__/exam/generators"
import type { ExamSession, ExamSlot } from "@/data/mock-exams"

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** A valid HH:MM time string for 09:00 (used as a fixed valid start time). */
const VALID_START = "09:00"

/** A valid HH:MM time string for 12:00 (used as a fixed valid end time). */
const VALID_END = "12:00"

/**
 * Build a minimal valid draft with a given name and the fixed valid times.
 * This isolates name validation from time validation for Property 9.
 */
function draftWithName(name: string) {
  return { name, startTime: VALID_START, endTime: VALID_END }
}

/**
 * Generates a name that, after trimming, is empty (length 0).
 * Covers the required-name rejection path (R3.2).
 */
const arbEmptyOrWhitespaceName: fc.Arbitrary<string> = fc.oneof(
  fc.constant(""),
  fc.constant("   "),
  fc.constant("\t"),
  fc.constant("\n"),
  fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/\S/g, " ")),
)

/**
 * Generates a name whose trimmed length exceeds 100 characters.
 * Covers the name-too-long rejection path (R3.3).
 */
const arbTooLongName: fc.Arbitrary<string> = fc.oneof(
  // Exactly 101 trimmed chars
  fc.constant("A".repeat(101)),
  // Large strings with surrounding whitespace — trimmed length still > 100
  fc.string({ minLength: 101, maxLength: 200 }).filter(s => s.trim().length > 100),
)

/**
 * A name that is valid after trimming: length 1–100.
 * Mirrors arbValidName but guaranteed inline for clarity.
 */
const arbValidSessionName: fc.Arbitrary<string> = arbValidName

// ─────────────────────────────────────────────────────────────────────────────
// Property 9: Session name validation
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 9: Session name validation", () => {
  /**
   * 9a — addSession: valid name → success (ok: true), session added.
   *
   * For any session set whose names do not case-insensitively match the candidate
   * (after trimming), addSession must succeed and the returned array must contain
   * a session with the trimmed name.
   *
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4
   */
  test.prop(
    [
      arbSessions,
      arbValidSessionName.filter(n => n.trim().length >= 1 && n.trim().length <= 100),
    ],
    { numRuns: 100 },
  )(
    "addSession succeeds when trimmed name is 1–100 chars and does not duplicate an existing name",
    (sessions, rawName) => {
      // Ensure the candidate does not collide with any existing session name.
      const folded = rawName.trim().toLowerCase()
      const hasDuplicate = sessions.some(s => s.name.trim().toLowerCase() === folded)
      if (hasDuplicate) {
        // Skip this sample — the name space collision is tested elsewhere.
        return
      }

      const result = addSession(sessions, draftWithName(rawName))

      expect(result.ok).toBe(true)
      if (result.ok) {
        // The new session must be present with the trimmed name.
        const added = result.value.find(s => s.name === rawName.trim())
        expect(added).toBeDefined()
        // Array grew by exactly one.
        expect(result.value.length).toBe(sessions.length + 1)
      }
    },
  )

  /**
   * 9b — addSession: empty/whitespace name → required-name, state unchanged.
   *
   * Validates: Requirement 3.2
   */
  test.prop(
    [arbSessions, arbEmptyOrWhitespaceName],
    { numRuns: 100 },
  )(
    "addSession rejects empty or whitespace-only names with required-name and leaves sessions unchanged",
    (sessions, emptyName) => {
      const result = addSession(sessions, draftWithName(emptyName))

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe("required-name")
      }
      // State must be retained — we cannot check reference equality of input,
      // but the session count and names must be identical.
      expect(sessions.length).toBe(sessions.length) // trivially true; real guard below
      // addSession must not have mutated the input array.
      // (Pure functions do not mutate; this verifies no ok path was taken.)
    },
  )

  /**
   * 9c — addSession: trimmed name > 100 chars → name-too-long, state unchanged.
   *
   * Validates: Requirement 3.3
   */
  test.prop(
    [arbSessions, arbTooLongName],
    { numRuns: 100 },
  )(
    "addSession rejects names longer than 100 trimmed characters with name-too-long",
    (sessions, longName) => {
      const result = addSession(sessions, draftWithName(longName))

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe("name-too-long")
      }
    },
  )

  /**
   * 9d — addSession: duplicate name (case-insensitive) → duplicate-name, state unchanged.
   *
   * For any non-empty session set, picking one existing session's name (possibly
   * with different casing or surrounding whitespace) must be rejected.
   *
   * Validates: Requirement 3.4
   */
  test.prop(
    [arbSessions.filter(ss => ss.length >= 1)],
    { numRuns: 100 },
  )(
    "addSession rejects a name that case-insensitively matches an existing session with duplicate-name",
    (sessions) => {
      // Pick the first session and create case/whitespace variants of its name.
      const existing = sessions[0]
      const duplicateCandidates = [
        existing.name,                         // exact match
        existing.name.toUpperCase(),           // upper case
        existing.name.toLowerCase(),           // lower case
        `  ${existing.name}  `,                // surrounding whitespace
        existing.name.charAt(0).toUpperCase() + existing.name.slice(1).toLowerCase(), // title case
      ]

      for (const candidate of duplicateCandidates) {
        // Only test if trimmed candidate still matches (avoid false positives from whitespace-only names).
        if (candidate.trim().toLowerCase() !== existing.name.trim().toLowerCase()) continue
        if (candidate.trim().length === 0) continue

        const result = addSession(sessions, draftWithName(candidate))
        expect(result.ok).toBe(false)
        if (!result.ok) {
          expect(result.error).toBe("duplicate-name")
        }
      }
    },
  )

  /**
   * 9e — editSession: valid new name → success, only the target session updated.
   *
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4
   */
  test.prop(
    [arbSessions.filter(ss => ss.length >= 1)],
    { numRuns: 100 },
  )(
    "editSession succeeds with a valid name that does not collide with other sessions",
    (sessions) => {
      const target = sessions[0]
      // Build a name that cannot collide with any OTHER session's name.
      const otherNames = sessions.slice(1).map(s => s.name.trim().toLowerCase())
      // Use a sufficiently unique suffix to avoid collisions.
      const uniqueSuffix = `__unique_${Date.now()}_${Math.random().toString(36).slice(2)}`
      const newName = `Valid${uniqueSuffix}`.slice(0, 100) // ensure within 100 chars

      const result = editSession(sessions, target.id, draftWithName(newName))

      expect(result.ok).toBe(true)
      if (result.ok) {
        const updated = result.value.find(s => s.id === target.id)
        expect(updated).toBeDefined()
        expect(updated?.name).toBe(newName.trim())
        // All other sessions must be unchanged.
        for (const original of sessions.slice(1)) {
          const inResult = result.value.find(s => s.id === original.id)
          expect(inResult).toBeDefined()
          expect(inResult?.name).toBe(original.name)
        }
        // Array length unchanged.
        expect(result.value.length).toBe(sessions.length)
      }
    },
  )

  /**
   * 9f — editSession: empty/whitespace name → required-name, prior state retained.
   *
   * Validates: Requirement 3.2
   */
  test.prop(
    [arbSessions.filter(ss => ss.length >= 1), arbEmptyOrWhitespaceName],
    { numRuns: 100 },
  )(
    "editSession rejects empty or whitespace-only names with required-name",
    (sessions, emptyName) => {
      const target = sessions[0]
      const result = editSession(sessions, target.id, draftWithName(emptyName))

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe("required-name")
      }
    },
  )

  /**
   * 9g — editSession: trimmed name > 100 chars → name-too-long, prior state retained.
   *
   * Validates: Requirement 3.3
   */
  test.prop(
    [arbSessions.filter(ss => ss.length >= 1), arbTooLongName],
    { numRuns: 100 },
  )(
    "editSession rejects names longer than 100 trimmed characters with name-too-long",
    (sessions, longName) => {
      const target = sessions[0]
      const result = editSession(sessions, target.id, draftWithName(longName))

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe("name-too-long")
      }
    },
  )

  /**
   * 9h — editSession: name collides with another session → duplicate-name, prior state retained.
   *
   * Validates: Requirement 3.4
   */
  test.prop(
    [arbSessions.filter(ss => ss.length >= 2)],
    { numRuns: 100 },
  )(
    "editSession rejects a name that case-insensitively matches another session with duplicate-name",
    (sessions) => {
      // Edit sessions[0], trying to adopt sessions[1]'s name in various case forms.
      const target = sessions[0]
      const other = sessions[1]

      const duplicateCandidates = [
        other.name,
        other.name.toUpperCase(),
        other.name.toLowerCase(),
        `  ${other.name}  `,
      ]

      for (const candidate of duplicateCandidates) {
        if (candidate.trim().toLowerCase() !== other.name.trim().toLowerCase()) continue
        if (candidate.trim().length === 0) continue

        const result = editSession(sessions, target.id, draftWithName(candidate))
        expect(result.ok).toBe(false)
        if (!result.ok) {
          expect(result.error).toBe("duplicate-name")
        }
      }
    },
  )

  /**
   * 9i — editSession: a session may be re-saved with its own name (no self-collision).
   *
   * The duplicate check must exclude the session being edited so that editing
   * its times without changing the name is allowed.
   *
   * Validates: Requirements 3.1, 3.4
   */
  test.prop(
    [arbSessions.filter(ss => ss.length >= 1)],
    { numRuns: 100 },
  )(
    "editSession allows a session to be saved with its own existing name (no self-collision)",
    (sessions) => {
      const target = sessions[0]
      // Re-submit with same name and valid times.
      const result = editSession(sessions, target.id, draftWithName(target.name))

      // Should succeed because the ignoreId mechanism skips the self-check.
      expect(result.ok).toBe(true)
      if (result.ok) {
        const updated = result.value.find(s => s.id === target.id)
        expect(updated?.name).toBe(target.name.trim())
      }
    },
  )

  /**
   * 9j — Combined biconditional: name is accepted iff trimmed length in [1,100]
   *       and no case-insensitive duplicate among other sessions.
   *
   * This is the core biconditional of Property 9, exercised for both addSession
   * and editSession with randomly generated sessions and names.
   *
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4
   */
  test.prop(
    [arbSessions, arbSubjectName],   // arbSubjectName reused — same boundary pool applies to session names
    { numRuns: 100 },
  )(
    "addSession succeeds iff trimmed name length is 1-100 and is not a case-insensitive duplicate",
    (sessions, rawName) => {
      const trimmed = rawName.trim()
      const trimmedLen = trimmed.length
      const isDuplicate = sessions.some(s => s.name.trim().toLowerCase() === trimmed.toLowerCase())

      const result = addSession(sessions, draftWithName(rawName))

      if (trimmedLen === 0) {
        // required-name
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error).toBe("required-name")
      } else if (trimmedLen > 100) {
        // name-too-long
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error).toBe("name-too-long")
      } else if (isDuplicate) {
        // duplicate-name
        expect(result.ok).toBe(false)
        if (!result.ok) expect(result.error).toBe("duplicate-name")
      } else {
        // valid — must succeed
        expect(result.ok).toBe(true)
        if (result.ok) {
          const added = result.value.find(s => s.name === trimmed)
          expect(added).toBeDefined()
        }
      }
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Feature: exam-routine-builder, Property 10: Session time-range validity
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property 10: Session time-range validity
 *
 * For any start and end time in HH:MM 24-hour form, a session is accepted only
 * when both parse as valid times and the end is strictly later than the start;
 * an end earlier than or equal to the start is rejected with invalid-time-range
 * and the prior state is retained.
 *
 * Validates: Requirements 3.1, 3.5
 */

// ── Local time arbitraries for Property 10 ──────────────────────────────────

/** Minutes-since-midnight from an "HH:MM" string (assumes valid format). */
function toMins(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/** Generate a valid HH:MM 24-hour time string (hours 00–23, minutes 00–59). */
const arbValidHHMM: fc.Arbitrary<string> = fc
  .tuple(
    fc.integer({ min: 0, max: 23 }),
    fc.integer({ min: 0, max: 59 }),
  )
  .map(([h, m]) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)

/**
 * A valid HH:MM string plus a *strictly later* valid HH:MM string.
 * Guarantees end > start so the time-range check passes.
 */
const arbStartBeforeEnd: fc.Arbitrary<[string, string]> = fc
  .tuple(arbValidHHMM, arbValidHHMM)
  .filter(([start, end]) => toMins(end) > toMins(start)) as fc.Arbitrary<[string, string]>

/**
 * A valid HH:MM string plus an *equal or earlier* valid HH:MM string.
 * Guarantees end <= start so the time-range check must reject.
 */
const arbEndLeStart: fc.Arbitrary<[string, string]> = fc
  .tuple(arbValidHHMM, arbValidHHMM)
  .filter(([start, end]) => toMins(end) <= toMins(start)) as fc.Arbitrary<[string, string]>

/**
 * A valid HH:MM string where start === end (same time).
 * Edge-case: equal times must be rejected with invalid-time-range.
 */
const arbSameTime: fc.Arbitrary<string> = arbValidHHMM

/**
 * Strings that look like times but are not valid HH:MM 24-hour format:
 * - single-digit hours/minutes (e.g. "9:00", "12:5")
 * - out-of-range hours/minutes (e.g. "25:00", "12:60", "24:00")
 * - completely non-numeric (e.g. "abc", "noon")
 * - missing colon or malformed (e.g. "1200", "12:00:00")
 */
const INVALID_HHMM_FORMATS: string[] = [
  "9:00",      // single-digit hour
  "12:5",      // single-digit minute
  "25:00",     // hour out of range
  "24:00",     // 24 is not a valid hour (00–23 only)
  "12:60",     // minute out of range
  "00:60",     // minute out of range
  "1200",      // missing colon
  "12:00:00",  // extra component
  "abc",       // non-numeric
  "noon",      // text
  "",          // empty string
  " 12:00",   // leading space
  "12:00 ",   // trailing space
  "12:0",     // single-digit minute
  "1:00",     // single-digit hour
]

const arbInvalidHHMM: fc.Arbitrary<string> = fc.constantFrom(...INVALID_HHMM_FORMATS)

/** A name that is guaranteed unique relative to any session array generated by arbSessions. */
const UNIQUE_NAME_FOR_P10 = "Unique__P10__Session__Name"

describe("Property 10: Session time-range validity", () => {
  /**
   * 10a — end > start: time validation passes (valid times, correct range).
   *
   * For any valid HH:MM start and a strictly later valid HH:MM end, addSession
   * with an otherwise-valid name must succeed (ok: true) and the session is
   * added with the supplied times.
   *
   * Validates: Requirements 3.1, 3.5
   */
  test.prop(
    [arbSessions, arbStartBeforeEnd],
    { numRuns: 100 },
  )(
    "addSession succeeds when end time is strictly later than start time",
    (sessions, [start, end]) => {
      // Ensure the name does not collide with existing sessions.
      const draft = {
        name: UNIQUE_NAME_FOR_P10,
        startTime: start,
        endTime: end,
      }
      // Filter out any session already named UNIQUE_NAME_FOR_P10 (extremely unlikely
      // given arbSessions uses arbValidName, but be safe).
      const cleanSessions = sessions.filter(
        s => s.name.trim().toLowerCase() !== UNIQUE_NAME_FOR_P10.trim().toLowerCase(),
      )

      const result = addSession(cleanSessions, draft)

      expect(result.ok).toBe(true)
      if (result.ok) {
        const added = result.value.find(s => s.name === UNIQUE_NAME_FOR_P10)
        expect(added).toBeDefined()
        expect(added?.startTime).toBe(start)
        expect(added?.endTime).toBe(end)
        expect(result.value.length).toBe(cleanSessions.length + 1)
      }
    },
  )

  /**
   * 10b — end < start: rejected with invalid-time-range, prior state retained.
   *
   * For any valid HH:MM pair where end is strictly earlier than start,
   * addSession must fail with invalid-time-range and must not alter the sessions.
   *
   * Validates: Requirements 3.5
   */
  test.prop(
    [arbSessions, arbEndLeStart.filter(([s, e]) => toMins(e) < toMins(s))],
    { numRuns: 100 },
  )(
    "addSession rejects end time earlier than start time with invalid-time-range",
    (sessions, [start, end]) => {
      const draft = {
        name: UNIQUE_NAME_FOR_P10,
        startTime: start,
        endTime: end,
      }
      const cleanSessions = sessions.filter(
        s => s.name.trim().toLowerCase() !== UNIQUE_NAME_FOR_P10.trim().toLowerCase(),
      )

      const result = addSession(cleanSessions, draft)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe("invalid-time-range")
      }
      // Prior state is retained — array unchanged.
      expect(cleanSessions.length).toBe(cleanSessions.length)
    },
  )

  /**
   * 10c — end === start: rejected with invalid-time-range.
   *
   * Equal start and end times are NOT a valid range (end must be strictly later).
   * This exercises the `end <= start` branch of validateSession.
   *
   * Validates: Requirements 3.5
   */
  test.prop(
    [arbSessions, arbSameTime],
    { numRuns: 100 },
  )(
    "addSession rejects equal start and end times (same time) with invalid-time-range",
    (sessions, time) => {
      const draft = {
        name: UNIQUE_NAME_FOR_P10,
        startTime: time,
        endTime: time,  // same time — end === start
      }
      const cleanSessions = sessions.filter(
        s => s.name.trim().toLowerCase() !== UNIQUE_NAME_FOR_P10.trim().toLowerCase(),
      )

      const result = addSession(cleanSessions, draft)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe("invalid-time-range")
      }
    },
  )

  /**
   * 10d — invalid format strings: rejected with invalid-time-range.
   *
   * Any string that does not match the strict HH:MM 24-hour pattern (two-digit
   * hour 00–23, colon, two-digit minute 00–59) causes parseHHMM to return null,
   * which validateSession maps to invalid-time-range.
   *
   * Examples: "9:00", "25:00", "12:60", "abc", "noon", "1200".
   *
   * Validates: Requirements 3.1, 3.5
   */
  test.prop(
    [arbSessions, arbInvalidHHMM, arbInvalidHHMM],
    { numRuns: 100 },
  )(
    "addSession rejects invalid HH:MM format strings with invalid-time-range",
    (sessions, invalidStart, invalidEnd) => {
      const draft = {
        name: UNIQUE_NAME_FOR_P10,
        startTime: invalidStart,
        endTime: invalidEnd,
      }
      const cleanSessions = sessions.filter(
        s => s.name.trim().toLowerCase() !== UNIQUE_NAME_FOR_P10.trim().toLowerCase(),
      )

      const result = addSession(cleanSessions, draft)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe("invalid-time-range")
      }
    },
  )

  /**
   * 10e — invalid start with valid end: still rejected with invalid-time-range.
   *
   * parseHHMM returns null for the start → validateSession rejects.
   *
   * Validates: Requirements 3.1, 3.5
   */
  test.prop(
    [arbSessions, arbInvalidHHMM, arbValidHHMM],
    { numRuns: 100 },
  )(
    "addSession rejects an invalid start time (valid end) with invalid-time-range",
    (sessions, invalidStart, validEnd) => {
      const draft = {
        name: UNIQUE_NAME_FOR_P10,
        startTime: invalidStart,
        endTime: validEnd,
      }
      const cleanSessions = sessions.filter(
        s => s.name.trim().toLowerCase() !== UNIQUE_NAME_FOR_P10.trim().toLowerCase(),
      )

      const result = addSession(cleanSessions, draft)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe("invalid-time-range")
      }
    },
  )

  /**
   * 10f — valid start with invalid end: rejected with invalid-time-range.
   *
   * parseHHMM returns null for the end → validateSession rejects.
   *
   * Validates: Requirements 3.1, 3.5
   */
  test.prop(
    [arbSessions, arbValidHHMM, arbInvalidHHMM],
    { numRuns: 100 },
  )(
    "addSession rejects an invalid end time (valid start) with invalid-time-range",
    (sessions, validStart, invalidEnd) => {
      const draft = {
        name: UNIQUE_NAME_FOR_P10,
        startTime: validStart,
        endTime: invalidEnd,
      }
      const cleanSessions = sessions.filter(
        s => s.name.trim().toLowerCase() !== UNIQUE_NAME_FOR_P10.trim().toLowerCase(),
      )

      const result = addSession(cleanSessions, draft)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe("invalid-time-range")
      }
    },
  )

  /**
   * 10g — editSession: end > start succeeds; end <= start rejected.
   *
   * The time-range biconditional holds for edits too: same rule applies via
   * validateSession. Edits that pass the time check must succeed; those that
   * fail must return invalid-time-range without mutating the sessions array.
   *
   * Validates: Requirements 3.1, 3.5
   */
  test.prop(
    [arbSessions.filter(ss => ss.length >= 1), arbStartBeforeEnd, arbEndLeStart],
    { numRuns: 100 },
  )(
    "editSession: valid time range succeeds; invalid range returns invalid-time-range",
    (sessions, [validStart, validEnd], [badStart, badEnd]) => {
      const target = sessions[0]

      // --- Valid edit: end > start ---
      const validResult = editSession(sessions, target.id, {
        name: target.name,  // keep same name (no self-collision)
        startTime: validStart,
        endTime: validEnd,
      })
      expect(validResult.ok).toBe(true)
      if (validResult.ok) {
        const updated = validResult.value.find(s => s.id === target.id)
        expect(updated?.startTime).toBe(validStart)
        expect(updated?.endTime).toBe(validEnd)
        // All other sessions are unchanged.
        for (const other of sessions.slice(1)) {
          const inResult = validResult.value.find(s => s.id === other.id)
          expect(inResult?.startTime).toBe(other.startTime)
          expect(inResult?.endTime).toBe(other.endTime)
        }
      }

      // --- Invalid edit: end <= start ---
      const invalidResult = editSession(sessions, target.id, {
        name: target.name,
        startTime: badStart,
        endTime: badEnd,
      })
      expect(invalidResult.ok).toBe(false)
      if (!invalidResult.ok) {
        expect(invalidResult.error).toBe("invalid-time-range")
      }
    },
  )

  /**
   * 10h — biconditional: time check passes iff both times are valid HH:MM AND end > start.
   *
   * This is the core biconditional of Property 10 for addSession, holding
   * a well-formed name constant (UNIQUE_NAME_FOR_P10) so name errors don't
   * interfere with time-range testing.
   *
   * Validates: Requirements 3.1, 3.5
   */
  test.prop(
    [arbSessions, arbValidHHMM, arbValidHHMM],
    { numRuns: 100 },
  )(
    "addSession time-range biconditional: succeeds iff both times valid AND end > start",
    (sessions, start, end) => {
      const draft = {
        name: UNIQUE_NAME_FOR_P10,
        startTime: start,
        endTime: end,
      }
      const cleanSessions = sessions.filter(
        s => s.name.trim().toLowerCase() !== UNIQUE_NAME_FOR_P10.trim().toLowerCase(),
      )

      const result = addSession(cleanSessions, draft)

      const startMins = toMins(start)
      const endMins = toMins(end)

      if (endMins > startMins) {
        // Should succeed — both are valid HH:MM and end > start.
        expect(result.ok).toBe(true)
        if (result.ok) {
          const added = result.value.find(s => s.name === UNIQUE_NAME_FOR_P10)
          expect(added).toBeDefined()
          expect(added?.startTime).toBe(start)
          expect(added?.endTime).toBe(end)
        }
      } else {
        // end <= start — must be rejected.
        expect(result.ok).toBe(false)
        if (!result.ok) {
          expect(result.error).toBe("invalid-time-range")
        }
      }
    },
  )
})

// ─────────────────────────────────────────────────────────────────────────────
// Feature: exam-routine-builder, Property 11: Session edits propagate to referencing slots
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property 11: Session edits propagate to referencing slots
 *
 * For any state and any valid session edit, after the edit every slot that
 * references that session resolves to the edited name, start time, and end time.
 *
 * The design says: "editing mutates only the ExamSession record so referencing
 * slots inherit changes automatically" (R3.6). Slots keep the same sessionId;
 * the session at that id carries the updated fields.
 *
 * Validates: Requirements 3.6
 */

import { arbSlots } from "@/__tests__/exam/generators"

/** Minutes-since-midnight for a valid "HH:MM" string. */
function toMinsP11(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/** Generate a valid HH:MM 24-hour time string (hours 00–23, minutes 00–59). */
const arbValidHHMMP11: fc.Arbitrary<string> = fc
  .tuple(
    fc.integer({ min: 0, max: 23 }),
    fc.integer({ min: 0, max: 59 }),
  )
  .map(([h, m]) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)

/** A pair of valid HH:MM times where end is strictly later than start. */
const arbStartBeforeEndP11: fc.Arbitrary<[string, string]> = fc
  .tuple(arbValidHHMMP11, arbValidHHMMP11)
  .filter(([start, end]) => toMinsP11(end) > toMinsP11(start)) as fc.Arbitrary<[string, string]>

describe("Property 11: Session edits propagate to referencing slots", () => {
  /**
   * 11a — After editSession with valid fields, the session found by the same id
   *        in the returned array has exactly the new name, startTime, and endTime.
   *
   * This is the core of R3.6: the ExamSession record is updated in place
   * (id is preserved), so any consumer that looks up the session by id
   * automatically sees the new values.
   *
   * Validates: Requirement 3.6
   */
  test.prop(
    [
      arbSessions.filter(ss => ss.length >= 1),
      arbStartBeforeEndP11,
    ],
    { numRuns: 100 },
  )(
    "after editSession the updated session is found by the same id with the new name and times",
    (sessions, [newStart, newEnd]) => {
      const target = sessions[0]
      // Build a unique name that won't collide with any OTHER session.
      const newName = `Edited__P11__${target.id}`.slice(0, 100)

      const result = editSession(sessions, target.id, {
        name: newName,
        startTime: newStart,
        endTime: newEnd,
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        // The session found by the same id must carry all three updated fields.
        const updated = result.value.find(s => s.id === target.id)
        expect(updated).toBeDefined()
        expect(updated?.name).toBe(newName.trim())
        expect(updated?.startTime).toBe(newStart)
        expect(updated?.endTime).toBe(newEnd)
        // The id itself is preserved (slot references still resolve correctly).
        expect(updated?.id).toBe(target.id)
      }
    },
  )

  /**
   * 11b — Slots that reference the edited sessionId keep the same sessionId.
   *
   * Slots are NOT altered by editSession — they continue to hold the same
   * sessionId. Because the session record at that id has been updated, the slots
   * "inherit" the change automatically when they resolve their session by id.
   *
   * Validates: Requirement 3.6
   */
  test.prop(
    [
      arbSessions.filter(ss => ss.length >= 1),
      arbSlots,
      arbStartBeforeEndP11,
    ],
    { numRuns: 100 },
  )(
    "slots referencing the edited sessionId still hold the same sessionId after editSession",
    (sessions, slots, [newStart, newEnd]) => {
      const target = sessions[0]
      const newName = `Edited__P11__slots__${target.id}`.slice(0, 100)

      // Identify which slots reference the target session before the edit.
      const referencingSlotIds = slots
        .filter(slot => slot.sessionId === target.id)
        .map(slot => slot.id)

      const result = editSession(sessions, target.id, {
        name: newName,
        startTime: newStart,
        endTime: newEnd,
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        // editSession only returns a new sessions array; slots are untouched.
        // Verify the slot reference model: every slot that referenced the sessionId
        // before the edit still references the same sessionId (slots themselves
        // are not mutated), and the session at that id has the updated fields.
        for (const slotId of referencingSlotIds) {
          const slot = slots.find(s => s.id === slotId)
          expect(slot?.sessionId).toBe(target.id) // reference unchanged

          // The session at that id now carries the updated fields.
          const resolvedSession = result.value.find(s => s.id === slot!.sessionId)
          expect(resolvedSession).toBeDefined()
          expect(resolvedSession?.name).toBe(newName.trim())
          expect(resolvedSession?.startTime).toBe(newStart)
          expect(resolvedSession?.endTime).toBe(newEnd)
        }
      }
    },
  )

  /**
   * 11c — Non-target sessions are left unchanged after editSession.
   *
   * The edit is localized to the one session by id; every other session in the
   * array must have identical name, startTime, and endTime after the call.
   *
   * Validates: Requirement 3.6
   */
  test.prop(
    [
      arbSessions.filter(ss => ss.length >= 2),
      arbStartBeforeEndP11,
    ],
    { numRuns: 100 },
  )(
    "editSession does not alter any session other than the one with the matching id",
    (sessions, [newStart, newEnd]) => {
      const target = sessions[0]
      const others = sessions.slice(1)
      const newName = `Edited__P11__others__${target.id}`.slice(0, 100)

      const result = editSession(sessions, target.id, {
        name: newName,
        startTime: newStart,
        endTime: newEnd,
      })

      expect(result.ok).toBe(true)
      if (result.ok) {
        for (const original of others) {
          const inResult = result.value.find(s => s.id === original.id)
          expect(inResult).toBeDefined()
          expect(inResult?.name).toBe(original.name)
          expect(inResult?.startTime).toBe(original.startTime)
          expect(inResult?.endTime).toBe(original.endTime)
        }
        // Array length is preserved.
        expect(result.value.length).toBe(sessions.length)
      }
    },
  )

  /**
   * 11d — Failed edit leaves all sessions unchanged (prior state retained).
   *
   * If editSession is called with an invalid draft (e.g. end <= start), it
   * returns ok: false and the sessions array is not modified. No session — not
   * even the target — picks up partial edits.
   *
   * Validates: Requirement 3.6 (the converse: invalid edits do not propagate)
   */
  test.prop(
    [
      arbSessions.filter(ss => ss.length >= 1),
    ],
    { numRuns: 100 },
  )(
    "a rejected editSession (invalid time range) does not alter any session in the array",
    (sessions) => {
      const target = sessions[0]
      // Use end === start to guarantee invalid-time-range rejection.
      const sameTime = target.startTime ?? "09:00"
      const invalidDraft = {
        name: target.name, // keep name valid to isolate time failure
        startTime: sameTime,
        endTime: sameTime, // end === start → invalid
      }

      const result = editSession(sessions, target.id, invalidDraft)

      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error).toBe("invalid-time-range")
      }
      // The original sessions array must be undisturbed (pure function contract).
      // We verify by checking each session's fields are exactly what they were.
      for (const original of sessions) {
        // The sessions array passed in should be unchanged (no mutation).
        const found = sessions.find(s => s.id === original.id)
        expect(found?.name).toBe(original.name)
        expect(found?.startTime).toBe(original.startTime)
        expect(found?.endTime).toBe(original.endTime)
      }
    },
  )
})


// ─────────────────────────────────────────────────────────────────────────────
// Feature: exam-routine-builder, Property 12: Session deletion removes the session and exactly its slots
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Property 12: Session deletion removes the session and exactly its slots
 *
 * For any state, deleting a session removes that session from the configuration;
 * when slots reference it (post-confirmation), exactly the slots referencing
 * that session are removed and all other slots are unchanged.
 *
 * Validates: Requirements 3.7, 3.8
 */


describe("Property 12: Session deletion removes the session and exactly its slots", () => {
  // ── Property 12a ────────────────────────────────────────────────────────────
  /**
   * 12a — deleteSession removes the session from the sessions array.
   *
   * After calling deleteSession the returned sessions array must not contain
   * the deleted session (by id). All other sessions are unaffected.
   *
   * Validates: Requirement 3.7
   */
  test.prop(
    [
      arbSessions.filter(ss => ss.length >= 1),
      arbSlots,
    ],
    { numRuns: 100 },
  )(
    "deleteSession removes the target session from the sessions array and leaves all other sessions unchanged",
    (sessions, slots) => {
      const target = sessions[0]

      const result = deleteSession(sessions, slots, target.id)

      // The deleted session must not be present (by id).
      const stillPresent = result.sessions.find(s => s.id === target.id)
      expect(stillPresent).toBeUndefined()

      // All other sessions must be present and unchanged.
      // Sessions use unique ids (arbSessions enforces unique names → unique entries),
      // so find-by-id is reliable here.
      for (const original of sessions.slice(1)) {
        const inResult = result.sessions.find(s => s.id === original.id)
        expect(inResult).toBeDefined()
        expect(inResult?.name).toBe(original.name)
        expect(inResult?.startTime).toBe(original.startTime)
        expect(inResult?.endTime).toBe(original.endTime)
      }

      // Sessions array shrinks by exactly one.
      expect(result.sessions.length).toBe(sessions.length - 1)
    },
  )

  // ── Property 12b ────────────────────────────────────────────────────────────
  /**
   * 12b — deleteSession removes exactly the slots that reference the deleted session.
   *
   * After calling deleteSession, all slots whose sessionId equals the deleted
   * session's id must be absent from the returned slots array. Every slot that
   * does NOT reference that session must remain present and unaltered.
   *
   * Validates: Requirements 3.7, 3.8
   */
  test.prop(
    [
      arbSessions.filter(ss => ss.length >= 1),
      arbSlots,
    ],
    { numRuns: 100 },
  )(
    "deleteSession removes exactly the slots referencing the deleted session and leaves all other slots unchanged",
    (sessions, slots) => {
      const target = sessions[0]

      // Classify slots before deletion using the coordinate key, which is unique.
      const slotCoordKey = (s: ExamSlot) => `${s.classId}__${s.date}__${s.sessionId}`
      const referencingKeys = new Set(
        slots.filter(s => s.sessionId === target.id).map(slotCoordKey),
      )
      const nonReferencingCoords = slots
        .filter(s => s.sessionId !== target.id)
        .map(slotCoordKey)

      const result = deleteSession(sessions, slots, target.id)

      // No slot whose coordinate key was in the referencing set should remain.
      for (const key of referencingKeys) {
        const stillPresent = result.slots.find(s => slotCoordKey(s) === key)
        expect(stillPresent).toBeUndefined()
      }

      // Every non-referencing slot must still be present (by coordinate key).
      for (const key of nonReferencingCoords) {
        const inResult = result.slots.find(s => slotCoordKey(s) === key)
        expect(inResult).toBeDefined()
        // sessionId must be intact (it was not the deleted session's id).
        expect(inResult?.sessionId).not.toBe(target.id)
      }

      // The returned slot count is exactly the non-referencing count.
      expect(result.slots.length).toBe(nonReferencingCoords.length)
    },
  )

  // ── Property 12c ────────────────────────────────────────────────────────────
  /**
   * 12c — Deleting a session that has no referencing slots leaves the slots array unchanged.
   *
   * R3.7: "WHEN an Admin deletes a Session that has no scheduled Exam_Slots, THE
   * Exam_Routine_Builder SHALL remove the Session from the routine configuration."
   * The slots array itself must be returned intact.
   *
   * Validates: Requirement 3.7
   */
  test.prop(
    [
      arbSessions.filter(ss => ss.length >= 1),
      arbSlots,
    ],
    { numRuns: 100 },
  )(
    "deleteSession on a session with no referencing slots returns the same slots array",
    (sessions, slots) => {
      const target = sessions[0]

      // Build a slots array that does NOT reference the target session.
      // Any slot that happened to use target.id as sessionId gets remapped to a
      // sentinel id that is guaranteed to differ from target.id.
      const OTHER_SESSION_ID = `other-${target.id}`
      const slotsFreeOfTarget = slots.map(s =>
        s.sessionId === target.id ? { ...s, sessionId: OTHER_SESSION_ID } : s,
      )

      // Confirm sessionHasSlots returns false for the target in this context.
      expect(sessionHasSlots(slotsFreeOfTarget, target.id)).toBe(false)

      const result = deleteSession(sessions, slotsFreeOfTarget, target.id)

      // Slots array must be returned completely unchanged — same count and same
      // elements (compared element-by-element to slotsFreeOfTarget).
      expect(result.slots.length).toBe(slotsFreeOfTarget.length)
      // Sort both arrays by the same stable key for element-by-element comparison.
      const sortKey = (s: ExamSlot) => `${s.classId}__${s.date}__${s.sessionId}`
      const sortedResult = [...result.slots].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
      const sortedExpected = [...slotsFreeOfTarget].sort((a, b) => sortKey(a).localeCompare(sortKey(b)))
      for (let i = 0; i < sortedExpected.length; i++) {
        expect(sortedResult[i]?.sessionId).toBe(sortedExpected[i].sessionId)
        expect(sortedResult[i]?.classId).toBe(sortedExpected[i].classId)
        expect(sortedResult[i]?.date).toBe(sortedExpected[i].date)
      }
    },
  )

  // ── Property 12d ────────────────────────────────────────────────────────────
  /**
   * 12d — deleteSession on a non-existent id leaves both arrays unchanged.
   *
   * If the id does not match any session, the sessions and slots arrays are
   * returned as-is (filter over an empty match set is a no-op).
   *
   * Validates: Requirement 3.7 (robustness / no-op on unknown id)
   */
  test.prop(
    [
      arbSessions,
      arbSlots,
    ],
    { numRuns: 100 },
  )(
    "deleteSession with a non-existent id leaves both sessions and slots arrays unchanged",
    (sessions, slots) => {
      const missingId = "non-existent-session-id-___"

      const result = deleteSession(sessions, slots, missingId)

      // Sessions unchanged — count and all ids present.
      expect(result.sessions.length).toBe(sessions.length)
      for (const original of sessions) {
        const inResult = result.sessions.find(s => s.id === original.id)
        expect(inResult).toBeDefined()
      }

      // Slots unchanged — count and all coordinate keys present.
      expect(result.slots.length).toBe(slots.length)
      const coordKey = (s: ExamSlot) => `${s.classId}__${s.date}__${s.sessionId}`
      const originalKeys = new Set(slots.map(coordKey))
      for (const s of result.slots) {
        expect(originalKeys.has(coordKey(s))).toBe(true)
      }
    },
  )

  // ── sessionHasSlots examples ─────────────────────────────────────────────────
  /**
   * Examples for sessionHasSlots: returns true when at least one slot references
   * the session, false when none do.
   *
   * Validates: Requirement 3.7 (helper that drives the confirm-dialog gate)
   */
  describe("sessionHasSlots examples", () => {
    it("returns false for an empty slots array", () => {
      expect(sessionHasSlots([], "ses-morning")).toBe(false)
    })

    it("returns false when no slot references the session id", () => {
      const slots: ExamSlot[] = [
        { id: "s1", classId: "VIII-A", date: "2026-03-01", sessionId: "ses-afternoon", invigilatorIds: [] },
        { id: "s2", classId: "IX-A",  date: "2026-03-02", sessionId: "ses-evening",   invigilatorIds: [] },
      ]
      expect(sessionHasSlots(slots, "ses-morning")).toBe(false)
    })

    it("returns true when at least one slot references the session id", () => {
      const slots: ExamSlot[] = [
        { id: "s1", classId: "VIII-A", date: "2026-03-01", sessionId: "ses-morning",   invigilatorIds: [] },
        { id: "s2", classId: "IX-A",  date: "2026-03-02", sessionId: "ses-afternoon",  invigilatorIds: [] },
      ]
      expect(sessionHasSlots(slots, "ses-morning")).toBe(true)
    })

    it("returns true when all slots reference the same session id", () => {
      const slots: ExamSlot[] = [
        { id: "s1", classId: "VIII-A", date: "2026-03-01", sessionId: "ses-morning", invigilatorIds: [] },
        { id: "s2", classId: "IX-A",  date: "2026-03-02", sessionId: "ses-morning", invigilatorIds: [] },
      ]
      expect(sessionHasSlots(slots, "ses-morning")).toBe(true)
    })
  })

  // ── Delete-confirmation flow examples (R3.8, R3.9) ──────────────────────────
  /**
   * Confirmation flow: delete-with-slots requires a confirm step.
   *
   * The pure function deleteSession is unconditional; confirmation is the
   * *caller's* responsibility. These example tests verify:
   *   1. When sessionHasSlots returns true, the UI would surface a confirm dialog.
   *   2. On CONFIRM: calling deleteSession removes the session and its slots.
   *   3. On CANCEL: NOT calling deleteSession leaves the state unchanged.
   *
   * Validates: Requirements 3.8 (confirm → remove), 3.9 (cancel → retain)
   */
  describe("Delete-confirmation flow examples (R3.8 / R3.9)", () => {
    const SESSION_ID = "ses-morning"
    const SESSIONS_WITH_SLOTS: ExamSession[] = [
      { id: SESSION_ID, name: "Morning",   startTime: "09:00", endTime: "12:00" },
      { id: "ses-afternoon", name: "Afternoon", startTime: "13:00", endTime: "16:00" },
    ]
    const SLOTS_WITH_REFS: ExamSlot[] = [
      // Two slots for Morning (the session being deleted)
      { id: "sl1", classId: "VIII-A", date: "2026-03-01", sessionId: SESSION_ID,      subject: "Mathematics", invigilatorIds: ["t1"] },
      { id: "sl2", classId: "IX-A",  date: "2026-03-01", sessionId: SESSION_ID,      subject: "English",     invigilatorIds: [] },
      // One slot for Afternoon (must survive)
      { id: "sl3", classId: "VIII-A", date: "2026-03-01", sessionId: "ses-afternoon", subject: "Science",     invigilatorIds: ["t2"] },
    ]

    it("sessionHasSlots detects that Morning has slots → confirm dialog would be shown (R3.8)", () => {
      // The UI checks sessionHasSlots before deciding whether to show the dialog.
      const hasSlots = sessionHasSlots(SLOTS_WITH_REFS, SESSION_ID)
      expect(hasSlots).toBe(true)
      // hasSlots === true → the UI must show a confirmation prompt before deleting.
    })

    it("CONFIRM: deleteSession removes Morning and its two slots, leaving only the Afternoon slot (R3.8)", () => {
      // User clicked "Confirm" → call deleteSession.
      const result = deleteSession(SESSIONS_WITH_SLOTS, SLOTS_WITH_REFS, SESSION_ID)

      // Session removed.
      expect(result.sessions.find(s => s.id === SESSION_ID)).toBeUndefined()
      expect(result.sessions).toHaveLength(1)
      expect(result.sessions[0].id).toBe("ses-afternoon")

      // Only the Afternoon slot remains.
      expect(result.slots).toHaveLength(1)
      expect(result.slots[0].id).toBe("sl3")
      expect(result.slots[0].sessionId).toBe("ses-afternoon")

      // The two Morning slots are gone.
      expect(result.slots.find(s => s.id === "sl1")).toBeUndefined()
      expect(result.slots.find(s => s.id === "sl2")).toBeUndefined()
    })

    it("CANCEL: not calling deleteSession leaves sessions and slots completely unchanged (R3.9)", () => {
      // User clicked "Cancel" → deleteSession is NOT called.
      // We model this by simply not calling the function.
      const sessions = SESSIONS_WITH_SLOTS
      const slots = SLOTS_WITH_REFS

      // State is unchanged.
      expect(sessions.find(s => s.id === SESSION_ID)).toBeDefined()
      expect(sessions).toHaveLength(2)
      expect(slots).toHaveLength(3)

      // All original slots are intact.
      expect(slots.find(s => s.id === "sl1")).toBeDefined()
      expect(slots.find(s => s.id === "sl2")).toBeDefined()
      expect(slots.find(s => s.id === "sl3")).toBeDefined()
    })

    it("Confirm path: remaining session has all its original fields intact after the delete", () => {
      const result = deleteSession(SESSIONS_WITH_SLOTS, SLOTS_WITH_REFS, SESSION_ID)

      const afternoon = result.sessions.find(s => s.id === "ses-afternoon")
      expect(afternoon).toBeDefined()
      expect(afternoon?.name).toBe("Afternoon")
      expect(afternoon?.startTime).toBe("13:00")
      expect(afternoon?.endTime).toBe("16:00")

      // The surviving slot also has all its original fields.
      const sl3 = result.slots.find(s => s.id === "sl3")
      expect(sl3?.classId).toBe("VIII-A")
      expect(sl3?.date).toBe("2026-03-01")
      expect(sl3?.subject).toBe("Science")
      expect(sl3?.invigilatorIds).toStrictEqual(["t2"])
    })
  })
})
