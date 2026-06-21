/**
 * Unit tests and property-based tests for src/lib/proxy-algorithm.ts
 * Requirements: 13.2, 13.3
 */

import { describe, it, expect } from "vitest"
import * as fc from "fast-check"
import { scoreTeacher, dotStatusFromScore, coveragePercent, ScoringInput } from "@/lib/proxy-algorithm"
import type { Teacher } from "@/data/teachers"
import type { ProxyAssignment } from "@/data/proxy-assignments"

// ---------------------------------------------------------------------------
// Minimal mock builders
// ---------------------------------------------------------------------------

function makeTeacher(overrides: Partial<Teacher> = {}): Teacher {
  return {
    id: "tx",
    name: "Test Teacher",
    email: "test@hcea.edu",
    subjects: ["Mathematics"],
    section: "High",
    status: "active",
    dailyProxyCap: 3,
    weeklyProxyCap: 9,
    monthlyProxyCap: 25,
    ...overrides,
  }
}

function makeAbsentTeacher(overrides: Partial<Teacher> = {}): Teacher {
  return makeTeacher({
    id: "absent-t",
    name: "Absent Teacher",
    email: "absent@hcea.edu",
    subjects: ["Mathematics"],
    ...overrides,
  })
}

function makeInput(overrides: Partial<ScoringInput> = {}): ScoringInput {
  return {
    teacher: makeTeacher(),
    absentTeacher: makeAbsentTeacher(),
    currentAssignments: [],
    periodId: "P1",
    ...overrides,
  }
}

function makeAssignment(
  proxyTeacherId: string,
  periodId = "P2",
  idSuffix = "1"
): ProxyAssignment {
  return {
    id: `px${idSuffix}`,
    absenceId: "a1",
    absentTeacherId: "absent-t",
    absentTeacherName: "Absent Teacher",
    proxyTeacherId,
    proxyTeacherName: "Test Teacher",
    periodId,
    class: "VIII-A",
    subject: "Mathematics",
    status: "assigned",
    date: "2026-06-14",
  }
}

// ---------------------------------------------------------------------------
// scoreTeacher tests
// ---------------------------------------------------------------------------

describe("scoreTeacher", () => {
  it("subject-matching teacher scores higher than non-matching when all else equal", () => {
    const absentTeacher = makeAbsentTeacher({ subjects: ["Science"] })

    // Teacher A: subjects include the absent teacher's primary subject
    const teacherA = makeTeacher({ id: "tA", subjects: ["Science", "Biology"] })
    // Teacher B: subjects do NOT include it
    const teacherB = makeTeacher({ id: "tB", subjects: ["English", "History"] })

    const baseInput = { absentTeacher, currentAssignments: [], periodId: "P1" }

    const scoreA = scoreTeacher({ ...baseInput, teacher: teacherA })
    const scoreB = scoreTeacher({ ...baseInput, teacher: teacherB })

    expect(scoreA).toBeGreaterThan(scoreB)
  })

  it("returns 0 for a teacher with status !== 'active' (inactive)", () => {
    const teacher = makeTeacher({ status: "inactive" })
    const score = scoreTeacher(makeInput({ teacher }))
    expect(score).toBe(0)
  })

  it("returns 0 for a teacher with status !== 'active' (on_leave)", () => {
    const teacher = makeTeacher({ status: "on_leave" })
    const score = scoreTeacher(makeInput({ teacher }))
    expect(score).toBe(0)
  })

  it("returns 0 when teacher is already at their daily cap", () => {
    const teacher = makeTeacher({ id: "t-capped", dailyProxyCap: 2 })
    // Two existing assignments today for this teacher
    const assignments = [
      makeAssignment("t-capped", "P2", "1"),
      makeAssignment("t-capped", "P3", "2"),
    ]
    const score = scoreTeacher(makeInput({ teacher, currentAssignments: assignments, periodId: "P1" }))
    expect(score).toBe(0)
  })

  it("cap headroom bonus: teacher with 0 assignments and dailyProxyCap=3 gets +30 headroom bonus", () => {
    // Headroom = 3 - 0 = 3 → Math.min(3 * 10, 30) = 30
    // No subject match, headroom +30, fairness +20 × (1 - 0/25) = +20 → total 50
    const absentTeacher = makeAbsentTeacher({ subjects: ["Science"] })
    const teacher = makeTeacher({
      subjects: ["English"], // no subject match
      dailyProxyCap: 3,
      monthlyProxyCap: 25,
    })

    const score = scoreTeacher({
      teacher,
      absentTeacher,
      currentAssignments: [],
      periodId: "P1",
    })

    // Subject match: 0, cap headroom: 30, workload fairness: 20 × 1 = 20 → 50
    expect(score).toBe(50)
  })
})

// ---------------------------------------------------------------------------
// dotStatusFromScore tests
// ---------------------------------------------------------------------------

describe("dotStatusFromScore", () => {
  it("score = 61, isCapped = false → 'available-same'", () => {
    expect(dotStatusFromScore(61, false)).toBe("available-same")
  })

  it("score = 60, isCapped = false → 'available-diff' (boundary: must be > 60 for same)", () => {
    expect(dotStatusFromScore(60, false)).toBe("available-diff")
  })

  it("score = 30, isCapped = false → 'available-diff'", () => {
    expect(dotStatusFromScore(30, false)).toBe("available-diff")
  })

  it("score = 1, isCapped = false → 'available-diff'", () => {
    expect(dotStatusFromScore(1, false)).toBe("available-diff")
  })

  it("score = 0, isCapped = false → 'unavailable'", () => {
    expect(dotStatusFromScore(0, false)).toBe("unavailable")
  })

  it("score = 50, isCapped = true → 'capped' (score > 0 and teacher is capped)", () => {
    expect(dotStatusFromScore(50, true)).toBe("capped")
  })
})

// ---------------------------------------------------------------------------
// coveragePercent tests
// ---------------------------------------------------------------------------

describe("coveragePercent", () => {
  it("coveragePercent(3, 7) returns Math.round((3/7)*1000)/10", () => {
    const expected = Math.round((3 / 7) * 1000) / 10
    expect(coveragePercent(3, 7)).toBe(expected)
  })

  it("coveragePercent(0, 5) returns 0", () => {
    expect(coveragePercent(0, 5)).toBe(0)
  })

  it("coveragePercent(5, 5) returns 100", () => {
    expect(coveragePercent(5, 5)).toBe(100)
  })

  it("returns 0 when total is 0 (guard against division by zero)", () => {
    expect(coveragePercent(3, 0)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Property-Based Tests (PBT)
// Requirements: 13.3
//
// NOTE: We use fc.assert(fc.property(...)) with standard vitest `it()` rather
// than `it.prop` from @fast-check/vitest because Vitest v3 serializes test
// metadata (including arbitrary objects) across the worker→main IPC channel
// using structuredClone, which cannot clone fast-check's internal function
// closures. fc.assert runs the property check synchronously inside the test.
// ---------------------------------------------------------------------------

describe("PBT — proxy-algorithm", () => {

  // ---------------------------------------------------------------------------
  // Property 11: Subject-match teacher always outscores non-match
  //
  // Feature: eduflow-app-audit, Property 11: Subject-matching teachers score higher
  // Validates: Requirements 15.1, 13.3
  // ---------------------------------------------------------------------------

  it(
    "Property 11: subject-match teacher always outscores non-match (all else equal)",
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 10, unit: "grapheme-ascii" }),
          (primarySubject) => {
            const absentTeacher: Teacher = {
              id: "absent-p11",
              name: "Absent T",
              email: "absent@test.edu",
              subjects: [primarySubject],
              section: "High",
              status: "on_leave",
              dailyProxyCap: 2,
              weeklyProxyCap: 6,
              monthlyProxyCap: 25,
            }
            const matchingTeacher: Teacher = {
              id: "t-match",
              name: "Matching T",
              email: "match@test.edu",
              subjects: [primarySubject],
              section: "High",
              status: "active",
              dailyProxyCap: 3,
              weeklyProxyCap: 9,
              monthlyProxyCap: 25,
            }
            const nonMatchingTeacher: Teacher = {
              id: "t-nomatch",
              name: "NonMatching T",
              email: "nomatch@test.edu",
              subjects: [primarySubject + "__DIFF__"],
              section: "High",
              status: "active",
              dailyProxyCap: 3,
              weeklyProxyCap: 9,
              monthlyProxyCap: 25,
            }
            const periodId = "P1"
            const base = { absentTeacher, currentAssignments: [] as ProxyAssignment[], periodId }
            const scoreMatch = scoreTeacher({ ...base, teacher: matchingTeacher })
            const scoreNoMatch = scoreTeacher({ ...base, teacher: nonMatchingTeacher })
            return scoreMatch > scoreNoMatch
          }
        ),
        { numRuns: 100 }
      )
    }
  )

  // ---------------------------------------------------------------------------
  // Property 12: All-capped returns empty
  //
  // Feature: eduflow-app-audit, Property 12: All-capped teacher lists produce empty result
  // Validates: Requirements 15.1, 13.3
  // ---------------------------------------------------------------------------

  it(
    "Property 12: all-capped teacher list produces empty assignment array without throwing",
    () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 8, unit: "grapheme-ascii" }),
              cap: fc.integer({ min: 1, max: 5 }),
            }),
            { minLength: 1, maxLength: 8 }
          ),
          (teacherSpecs) => {
            const cappedTeachers: Teacher[] = teacherSpecs.map(ts => ({
              id: ts.id,
              name: "T",
              email: "t@test.edu",
              subjects: ["Math"],
              section: "High" as const,
              status: "active" as const,
              dailyProxyCap: ts.cap,
              weeklyProxyCap: ts.cap * 3,
              monthlyProxyCap: ts.cap * 10,
            }))

            const currentAssignments: ProxyAssignment[] = cappedTeachers.flatMap(t =>
              Array.from({ length: t.dailyProxyCap }, (_, i): ProxyAssignment => ({
                id: `cap-${t.id}-${i}`,
                absenceId: "a-cap",
                absentTeacherId: "absent-cap",
                absentTeacherName: "Absent",
                proxyTeacherId: t.id,
                proxyTeacherName: t.name,
                periodId: `P${(i % 7) + 1}`,
                class: "VIII-A",
                subject: "Test",
                status: "assigned",
                date: "2026-06-14",
              }))
            )

            const absentTeacher: Teacher = {
              id: "absent-cap",
              name: "Absent T",
              email: "absent@test.edu",
              subjects: ["Mathematics"],
              section: "High",
              status: "on_leave",
              dailyProxyCap: 2,
              weeklyProxyCap: 6,
              monthlyProxyCap: 25,
            }

            let threw = false
            let eligibleCount = 0
            try {
              eligibleCount = cappedTeachers.filter(t =>
                scoreTeacher({ teacher: t, absentTeacher, currentAssignments, periodId: "P1" }) > 0
              ).length
            } catch {
              threw = true
            }

            return !threw && eligibleCount === 0
          }
        ),
        { numRuns: 100 }
      )
    }
  )

  // ---------------------------------------------------------------------------
  // Property 13: Scores bounded 0–100
  //
  // Feature: eduflow-app-audit, Property 13: Proxy scores are bounded between 0 and 100
  // Validates: Requirements 15.1, 13.3
  // ---------------------------------------------------------------------------

  it(
    "Property 13: scoreTeacher always returns a value in [0, 100]",
    () => {
      // Build a single teacher arbitrary inline to avoid module-level serialization
      const teacherArb = fc.record({
        id: fc.string({ minLength: 1, maxLength: 8, unit: "grapheme-ascii" }),
        name: fc.string({ minLength: 1, maxLength: 10, unit: "grapheme-ascii" }),
        email: fc.string({ minLength: 1, maxLength: 12, unit: "grapheme-ascii" }),
        subjects: fc.uniqueArray(
          fc.string({ minLength: 1, maxLength: 6, unit: "grapheme-ascii" }),
          { minLength: 1, maxLength: 4 }
        ),
        section: fc.constantFrom("Primary" as const, "Middle" as const, "High" as const),
        status: fc.constantFrom("active" as const, "inactive" as const, "on_leave" as const),
        dailyProxyCap: fc.integer({ min: 1, max: 5 }),
        weeklyProxyCap: fc.integer({ min: 3, max: 15 }),
        monthlyProxyCap: fc.integer({ min: 10, max: 50 }),
      })

      const assignmentArb = fc.record({
        id: fc.string({ minLength: 1, maxLength: 6, unit: "grapheme-ascii" }),
        absenceId: fc.constant("a-pbt"),
        absentTeacherId: fc.constant("abs-pbt"),
        absentTeacherName: fc.constant("Absent"),
        proxyTeacherId: fc.string({ minLength: 1, maxLength: 8, unit: "grapheme-ascii" }),
        proxyTeacherName: fc.constant("Proxy"),
        periodId: fc.constantFrom("P1" as const, "P2" as const, "P3" as const, "P4" as const, "P5" as const, "P6" as const, "P7" as const),
        class: fc.constant("VIII-A"),
        subject: fc.constant("Math"),
        status: fc.constantFrom("assigned" as const, "accepted" as const, "declined" as const, "pending" as const),
        date: fc.constant("2026-06-14"),
      })

      fc.assert(
        fc.property(
          teacherArb,
          teacherArb,
          fc.array(assignmentArb, { minLength: 0, maxLength: 10 }),
          fc.constantFrom("P1" as const, "P2" as const, "P3" as const, "P4" as const, "P5" as const, "P6" as const, "P7" as const),
          (teacher, absentTeacher, currentAssignments, periodId) => {
            const score = scoreTeacher({ teacher, absentTeacher, currentAssignments, periodId })
            return score >= 0 && score <= 100
          }
        ),
        { numRuns: 100 }
      )
    }
  )

  // ---------------------------------------------------------------------------
  // Property 14: dotStatusFromScore is deterministic
  //
  // Feature: eduflow-app-audit, Property 14: dotStatusFromScore maps score ranges deterministically
  // Validates: Requirements 15.2
  // ---------------------------------------------------------------------------

  it(
    "Property 14: dotStatusFromScore deterministic — matches all four exhaustive cases from design.md",
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 100 }),
          fc.boolean(),
          (score, isCapped) => {
            const result = dotStatusFromScore(score, isCapped)
            if (score === 0) return result === "unavailable"
            if (isCapped) return result === "capped"
            if (score > 60) return result === "available-same"
            return result === "available-diff"
          }
        ),
        { numRuns: 200 }
      )
    }
  )

  // ---------------------------------------------------------------------------
  // Property 15: Coverage % formula is correct for all valid inputs
  //
  // Feature: eduflow-app-audit, Property 15: Coverage percentage formula is correct
  // Validates: Requirements 15.4
  // ---------------------------------------------------------------------------

  it(
    "Property 15: coveragePercent equals Math.round((assigned/total)*1000)/10 and is in [0, 100]",
    () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 10_000 }),
          fc.integer({ min: 1, max: 10_000 }),
          (rawAssigned, total) => {
            const assigned = rawAssigned % (total + 1)
            const result = coveragePercent(assigned, total)
            const expected = Math.round((assigned / total) * 1000) / 10
            return result === expected && result >= 0 && result <= 100
          }
        ),
        { numRuns: 200 }
      )
    }
  )

})
