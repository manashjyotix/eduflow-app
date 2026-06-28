/**
 * generators.ts — Property-test domain generators for the Exam Routine Builder.
 *
 * Feature: exam-routine-builder
 *
 * Provides fast-check arbitraries covering the full valid input space *plus*
 * deliberate edge-case pools (surrounding / all-whitespace names, exactly-100
 * and 101-char names, case variants, empty linked-class lists, impossible dates,
 * teacher-scarce configs) so every property test can exercise the boundaries
 * that the spec mandates without repeating the setup in each test file.
 *
 * _Requirements validated: 1.1, 3.1, 4.2, 5.1_
 */

import * as fc from "fast-check"
import type { CatalogSubject, ExamSession, ExamSlot } from "@/data/mock-exams"
import type { Teacher } from "@/data/teachers"
import type { GenerationInput } from "@/lib/exam/ai-routine-generator"

// ─────────────────────────────────────────────────────────────────────────────
// Low-level building blocks
// ─────────────────────────────────────────────────────────────────────────────

/** Stable id tokens that look like real ids — no spaces, URL-safe. */
const arbId = fc
  .stringMatching(/^[a-z][a-z0-9-]{0,15}$/)
  .filter(s => s.length >= 1)

/** A class identifier like "VIII-A", "IX-B", "X-A". */
export const arbClassId: fc.Arbitrary<string> = fc.oneof(
  fc.constant("VIII-A"),
  fc.constant("VIII-B"),
  fc.constant("IX-A"),
  fc.constant("IX-B"),
  fc.constant("X-A"),
  fc.constant("X-B"),
  // Also generate arbitrary section identifiers so generators are not limited
  // to the seeded demo classes.
  fc
    .tuple(
      fc.constantFrom("VI", "VII", "VIII", "IX", "X", "XI", "XII"),
      fc.constantFrom("A", "B", "C", "D"),
    )
    .map(([grade, section]) => `${grade}-${section}`),
)

// ─────────────────────────────────────────────────────────────────────────────
// Edge-case name pools (requirement boundary conditions)
// ─────────────────────────────────────────────────────────────────────────────

/** Exactly-100-character name (trimmed; at the upper valid boundary). */
const NAME_100 = "A".repeat(100)

/** 101-character name (trimmed; one over the limit — must be rejected). */
const NAME_101 = "A".repeat(101)

/** All-whitespace (must be rejected as empty after trim). */
const NAME_ALL_WHITESPACE = "     "

/** Leading/trailing whitespace around a valid core (must be accepted after trim). */
const NAME_SURROUNDING_WHITESPACE = "  Mathematics  "

/** Case variants of the same logical name — all must collide with each other. */
const CASE_VARIANTS = ["Math", "math", "MATH", "mAtH"] as const

/**
 * Arbitrary that emits names covering the full requirement boundary space:
 * - valid names of length 1 to 100 (after trim)
 * - surrounding-whitespace names
 * - all-whitespace (empty after trim → invalid)
 * - exactly 100 chars (valid boundary)
 * - 101 chars (over boundary → invalid)
 * - case variants
 */
export const arbSubjectName: fc.Arbitrary<string> = fc.oneof(
  // Typical valid trimmed names, 1–100 chars
  fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length >= 1),
  // Surrounding whitespace around a short valid core
  fc.constant(NAME_SURROUNDING_WHITESPACE),
  // All-whitespace (invalid after trim)
  fc.constant(NAME_ALL_WHITESPACE),
  // Exactly at the 100-char boundary
  fc.constant(NAME_100),
  // One over the boundary
  fc.constant(NAME_101),
  // Case variants that are logically duplicate
  fc.constantFrom(...CASE_VARIANTS),
)

/**
 * Same boundary pool but guaranteed to be valid after trim
 * (length 1–100 on the trimmed value).  Used wherever a generator needs a name
 * that should *pass* `validateSubjectName`.
 */
export const arbValidName: fc.Arbitrary<string> = fc.oneof(
  fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length >= 1 && s.trim().length <= 100),
  fc.constant(NAME_SURROUNDING_WHITESPACE),  // valid after trim (length 11)
  fc.constant(NAME_100),                     // exactly at boundary
  fc.constantFrom(...CASE_VARIANTS),         // valid individual names
)

// ─────────────────────────────────────────────────────────────────────────────
// arbCatalog — array of CatalogSubject objects
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Arbitrary for a single `CatalogSubject`.
 *
 * Covers:
 * - valid trimmed names (including 100-char boundary)
 * - empty `linkedClassIds` array (empty-palette edge case, R2.3)
 * - varied non-empty linked-class lists
 */
export const arbCatalogSubject: fc.Arbitrary<CatalogSubject> = fc
  .tuple(
    arbId,
    arbValidName,
    // Empty list included to exercise empty-palette behavior.
    fc.oneof(
      fc.constant([] as string[]),
      fc.uniqueArray(arbClassId, { minLength: 1, maxLength: 6 }),
    ),
  )
  .map(([id, name, linkedClassIds]) => ({ id, name: name.trim(), linkedClassIds }))

/**
 * Arbitrary array of `CatalogSubject` objects with case-insensitively unique
 * trimmed names (as the catalog invariant requires).
 *
 * Array length 0–8 to keep generation fast while still exercising non-trivial
 * catalogs.
 */
export const arbCatalog: fc.Arbitrary<CatalogSubject[]> = fc
  .uniqueArray(arbCatalogSubject, {
    minLength: 0,
    maxLength: 8,
    // Uniqueness key: trimmed name, lowercased (mirrors the catalog invariant).
    selector: subj => subj.name.trim().toLowerCase(),
  })

// ─────────────────────────────────────────────────────────────────────────────
// arbSession — arbitrary ExamSession with valid HH:MM start/end times
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Arbitrary 24-hour hour (0–23) and minute (0–59) pair formatted as "HH:MM".
 */
const arbHHMM: fc.Arbitrary<string> = fc
  .tuple(
    fc.integer({ min: 0, max: 23 }),
    fc.integer({ min: 0, max: 59 }),
  )
  .map(([h, m]) => `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`)

/**
 * Minutes-since-midnight value for an "HH:MM" string.  Used to guarantee
 * end > start when building `ExamSession` objects.
 */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h * 60 + m
}

/**
 * Arbitrary `ExamSession` with valid HH:MM start and end (end strictly > start).
 *
 * Session names follow the same boundary rules as subject names — `arbValidName`
 * is reused here (R3.1–3.4).  Ids are stable slugs.
 */
export const arbSession: fc.Arbitrary<ExamSession> = fc
  .tuple(arbId, arbValidName, arbHHMM, arbHHMM)
  .filter(([, , start, end]) => toMinutes(end) > toMinutes(start))
  .map(([id, name, startTime, endTime]) => ({
    id,
    name: name.trim(),
    startTime,
    endTime,
  }))

/**
 * Array of sessions with case-insensitively unique trimmed names, length 0–4.
 */
export const arbSessions: fc.Arbitrary<ExamSession[]> = fc.uniqueArray(arbSession, {
  minLength: 0,
  maxLength: 4,
  selector: s => s.name.trim().toLowerCase(),
})

// ─────────────────────────────────────────────────────────────────────────────
// arbIsoDate — arbitrary ISO date string (valid AND impossible dates)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Valid ISO yyyy-mm-dd dates drawn from a realistic exam-calendar window.
 * These should all pass `isValidIsoDate`.
 */
const arbValidIsoDate: fc.Arbitrary<string> = fc
  .tuple(
    fc.integer({ min: 2025, max: 2027 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 }), // day ≤ 28 is always valid for any month
  )
  .map(
    ([y, m, d]) =>
      `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
  )

/** Impossible dates that form a valid-looking string but are not real calendar dates. */
const IMPOSSIBLE_DATES: string[] = [
  "2026-02-30", // Feb 30 never exists
  "2026-02-29", // 2026 is not a leap year
  "2026-13-01", // month 13
  "2026-00-15", // month 0
  "2026-04-31", // Apr has 30 days
  "2026-06-31", // Jun has 30 days
  "2026-11-31", // Nov has 30 days
  "2026-01-00", // day 0
  "2026-01-32", // day 32
]

/**
 * Arbitrary ISO date string that includes:
 * - realistic valid calendar dates (should pass `isValidIsoDate`)
 * - impossible dates like "2026-02-30" (should fail `isValidIsoDate`)
 *
 * Requirement 5.1: only valid ISO dates that represent real calendar dates may
 * be added.  The impossible-date pool exercises the rejection path.
 */
export const arbIsoDate: fc.Arbitrary<string> = fc.oneof(
  { weight: 4, arbitrary: arbValidIsoDate },
  { weight: 1, arbitrary: fc.constantFrom(...IMPOSSIBLE_DATES) },
)

/**
 * Array of unique, valid ISO dates (up to MAX_EXAM_DATES = 100).
 * All dates here pass `isValidIsoDate` so they can be used as legitimate
 * column-axis inputs.
 */
export const arbValidDates: fc.Arbitrary<string[]> = fc.uniqueArray(arbValidIsoDate, {
  minLength: 0,
  maxLength: 10, // keep test runs fast; property tests focus on logic, not scale
})

// ─────────────────────────────────────────────────────────────────────────────
// arbSlots — arbitrary array of ExamSlot objects
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A teacher-id string that looks like "t1" … "t20", suitable for use in
 * `invigilatorIds` without requiring a full Teacher object.
 */
const arbTeacherId: fc.Arbitrary<string> = fc
  .integer({ min: 1, max: 20 })
  .map(n => `t${n}`)

/**
 * Arbitrary `ExamSlot` using independently generated coordinate components.
 * Slots generated here are NOT guaranteed to have unique keys — callers that
 * need uniqueness (e.g. slot-key property tests) should deduplicate with
 * `uniqueArray` or draw from `arbSlots` which enforces uniqueness.
 */
const arbSlot: fc.Arbitrary<ExamSlot> = fc
  .tuple(
    arbId,                                                         // id
    arbClassId,                                                    // classId
    arbValidIsoDate,                                               // date
    arbId,                                                         // sessionId
    fc.option(arbValidName.map(n => n.trim()), { nil: undefined }), // subject (optional)
    fc.option(fc.string({ minLength: 1, maxLength: 20 }), { nil: undefined }), // room
    fc.uniqueArray(arbTeacherId, { minLength: 0, maxLength: 4 }), // invigilatorIds
  )
  .map(([id, classId, date, sessionId, subject, room, invigilatorIds]) => ({
    id,
    classId,
    date,
    sessionId,
    ...(subject !== undefined ? { subject } : {}),
    ...(room !== undefined ? { room } : {}),
    invigilatorIds,
  }))

/**
 * Arbitrary array of `ExamSlot` objects with **unique (classId, date, sessionId)**
 * keys — enforcing the slot-identity invariant (R4.2).
 *
 * Length 0–12 gives a meaningful but fast sample.
 */
export const arbSlots: fc.Arbitrary<ExamSlot[]> = fc.uniqueArray(arbSlot, {
  minLength: 0,
  maxLength: 12,
  selector: s => `${s.classId}__${s.date}__${s.sessionId}`,
})

// ─────────────────────────────────────────────────────────────────────────────
// arbTeachers — arbitrary array of Teacher objects
// ─────────────────────────────────────────────────────────────────────────────

const SECTIONS = ["Primary", "Middle", "High"] as const
const STATUSES = ["active", "inactive", "on_leave"] as const

const arbTeacherSubjects: fc.Arbitrary<string[]> = fc.uniqueArray(
  fc.constantFrom(
    "English", "Mathematics", "Science", "Social Studies",
    "Hindi", "Sanskrit", "Computer Science", "Physics",
    "Chemistry", "Biology", "History", "Geography",
  ),
  { minLength: 0, maxLength: 4 },
)

/**
 * Arbitrary single `Teacher`.  Covers active, inactive, and on-leave statuses
 * so generators can exercise the filter for "active teachers only" in the
 * invigilator assignment paths.
 */
const arbTeacher: fc.Arbitrary<Teacher> = fc
  .tuple(
    fc.integer({ min: 1, max: 99 }).map(n => `t${n}`), // id
    fc.string({ minLength: 2, maxLength: 40 }),         // name
    fc.string({ minLength: 3, maxLength: 30 }).map(s => `${s.replace(/\s/g, "")}@school.edu`), // email
    arbTeacherSubjects,
    fc.constantFrom(...SECTIONS),
    fc.constantFrom(...STATUSES),
    fc.integer({ min: 1, max: 4 }),   // dailyProxyCap
    fc.integer({ min: 3, max: 10 }),  // weeklyProxyCap
    fc.integer({ min: 10, max: 30 }), // monthlyProxyCap
  )
  .map(([id, name, email, subjects, section, status, dailyCap, weeklyCap, monthlyCap]) => ({
    id,
    name,
    email,
    subjects,
    section,
    status,
    dailyProxyCap: dailyCap,
    weeklyProxyCap: weeklyCap,
    monthlyProxyCap: monthlyCap,
  }))

/**
 * Arbitrary array of `Teacher` objects with **unique ids**, length 0–10.
 *
 * Includes a mix of active/inactive/on_leave so property tests can verify that
 * only active teachers are assigned as invigilators.
 */
export const arbTeachers: fc.Arbitrary<Teacher[]> = fc.uniqueArray(arbTeacher, {
  minLength: 0,
  maxLength: 10,
  selector: t => t.id,
})

// ─────────────────────────────────────────────────────────────────────────────
// arbGenerationInput — arbitrary GenerationInput for the AI routine generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Arbitrary `GenerationInput` covering the full normal space.
 *
 * Modes are selected with equal probability so both "full-draft" and
 * "suggest-invigilators" paths are exercised.
 */
const arbNormalGenerationInput: fc.Arbitrary<GenerationInput> = fc
  .tuple(
    arbCatalog,
    fc.uniqueArray(arbClassId, { minLength: 1, maxLength: 4 }),
    arbValidDates,
    arbSessions,
    arbTeachers,
    arbSlots,
    fc.constantFrom("full-draft", "suggest-invigilators") as fc.Arbitrary<
      "full-draft" | "suggest-invigilators"
    >,
  )
  .map(([catalog, classIds, dates, sessions, teachers, existingSlots, mode]) => ({
    catalog,
    classIds,
    dates,
    sessions,
    teachers,
    existingSlots,
    mode,
  }))

/**
 * Teacher-scarce configuration: more exam slots than active teachers.
 *
 * This exercises R9.8 — when the active-teacher pool cannot cover every slot,
 * un-coverable slots are left without an invigilator and the count is reported.
 *
 * We build the config so the number of active teachers is strictly less than
 * the total number of (class × date × session) combinations, guaranteeing at
 * least one slot must go uncovered.
 */
const arbTeacherScarceInput: fc.Arbitrary<GenerationInput> = fc
  .tuple(
    // 2–3 classes, 2–4 dates, 1–2 sessions → 4–24 slots
    fc.uniqueArray(arbClassId, { minLength: 2, maxLength: 3 }),
    fc.uniqueArray(arbValidIsoDate, { minLength: 2, maxLength: 4 }),
    fc.uniqueArray(arbSession, {
      minLength: 1,
      maxLength: 2,
      selector: s => s.name.trim().toLowerCase(),
    }),
  )
  .chain(([classIds, dates, sessions]) => {
    const slotCount = classIds.length * dates.length * sessions.length
    // At most (slotCount - 1) active teachers; minimum 0.
    const maxActive = Math.max(0, slotCount - 1)
    const numActive = Math.min(maxActive, 3) // cap at 3 for fast generation

    const activeTeachers: fc.Arbitrary<Teacher[]> = fc.uniqueArray(
      arbTeacher.map(t => ({ ...t, status: "active" as const })),
      { minLength: 0, maxLength: numActive, selector: t => t.id },
    )

    return activeTeachers.chain(teachers => {
      // Build a catalog where each class has at least one linked subject.
      const catalog: CatalogSubject[] = classIds.map((cid, i) => ({
        id: `subj-${i}`,
        name: `Subject${i}`,
        linkedClassIds: [cid],
      }))

      return fc.constant({
        catalog,
        classIds,
        dates,
        sessions,
        teachers,
        existingSlots: [] as ExamSlot[],
        mode: "full-draft" as const,
      })
    })
  })

/**
 * Configuration with empty dates (triggers `missing-dates` error, R9.9).
 */
const arbMissingDatesInput: fc.Arbitrary<GenerationInput> = arbNormalGenerationInput.map(
  input => ({ ...input, dates: [] }),
)

/**
 * Configuration with empty sessions (triggers `missing-sessions` error, R9.9).
 */
const arbMissingSessionsInput: fc.Arbitrary<GenerationInput> = arbNormalGenerationInput.map(
  input => ({ ...input, sessions: [] }),
)

/**
 * Configuration with an empty target class set (exercises empty-palette and
 * missing-config rejection paths).
 */
const arbEmptyTargetInput: fc.Arbitrary<GenerationInput> = arbNormalGenerationInput.map(
  input => ({ ...input, classIds: [] }),
)

/**
 * Arbitrary `GenerationInput` that covers:
 * - normal varied inputs (most weight)
 * - teacher-scarce configurations (R9.8)
 * - missing-dates / missing-sessions rejection cases (R9.9)
 * - empty target class set
 *
 * Property tests that need a specific edge case can import the named
 * sub-arbitraries directly; `arbGenerationInput` is the general-purpose mixer.
 */
export const arbGenerationInput: fc.Arbitrary<GenerationInput> = fc.oneof(
  { weight: 6, arbitrary: arbNormalGenerationInput },
  { weight: 2, arbitrary: arbTeacherScarceInput },
  { weight: 1, arbitrary: arbMissingDatesInput },
  { weight: 1, arbitrary: arbMissingSessionsInput },
  { weight: 1, arbitrary: arbEmptyTargetInput },
)

// ─────────────────────────────────────────────────────────────────────────────
// Re-export named sub-arbitraries for property tests that need them directly
// ─────────────────────────────────────────────────────────────────────────────

export {
  arbTeacherScarceInput,
  arbMissingDatesInput,
  arbMissingSessionsInput,
  arbEmptyTargetInput,
}
