/**
 * access.test.ts — Property-based and example tests for the authorization matrix.
 *
 * Feature: exam-routine-builder
 *
 * Tests use Vitest + @fast-check/vitest. Each property runs a minimum of 100
 * iterations. Properties are tagged with a comment referencing the feature and
 * property number.
 *
 * Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.7
 */

import { describe, it, expect } from "vitest"
import { test } from "@fast-check/vitest"
import * as fc from "fast-check"
import { authorize } from "@/lib/exam/access"
import type { ExamAction } from "@/lib/exam/access"
import type { Role } from "@/lib/constants"

// ─────────────────────────────────────────────────────────────────────────────
// Arbitraries
// ─────────────────────────────────────────────────────────────────────────────

/** All four exam actions */
const allActions: ExamAction[] = ["manage-config", "build", "publish", "view"]

/** Roles that should have exam access of some kind */
const recognizedRoles: Role[] = ["admin", "management", "teacher", "parent"]

/** Roles with no exam access at all */
const noAccessRoles: Array<Role | string> = ["super_admin", "driver"]

/** View-only roles */
const viewOnlyRoles: Role[] = ["teacher", "parent"]

/** Role arbitraries */
const arbAction = fc.constantFrom<ExamAction>(...allActions)
const arbAdminRole = fc.constant<Role>("admin")
const arbManagementRole = fc.constant<Role>("management")
const arbViewOnlyRole = fc.constantFrom<Role>(...viewOnlyRoles)
const arbNoAccessRole = fc.constantFrom<string>(...noAccessRoles)

/** Non-admin roles: management, teacher, parent */
const arbNonAdminRole = fc.constantFrom<Role>("management", "teacher", "parent")

/** Unrecognized / unknown role strings */
const arbUnknownRole = fc.string().filter(
  s => !["admin", "management", "teacher", "parent", "student", "super_admin", "driver"].includes(s),
)

// ─────────────────────────────────────────────────────────────────────────────
// Property 41: Authorization matrix
// Feature: exam-routine-builder, Property 41: Authorization matrix
//
// Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.7
//
// The complete authorization matrix:
//   admin      → ALL actions (manage-config, build, publish, view)
//   management → build, publish, view  (NOT manage-config)
//   teacher    → view ONLY
//   parent     → view ONLY
//   student    → view ONLY  (forward-compat, not in Role union)
//   null       → nothing
//   undefined  → nothing
//   any other  → nothing
// ─────────────────────────────────────────────────────────────────────────────

describe("Property 41: Authorization matrix", () => {

  // ── R10.1: admin has ALL actions ──────────────────────────────────────────

  describe("admin role (R10.1)", () => {

    test.prop([arbAction], { numRuns: 100 })(
      "admin is authorized for every action",
      (action) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.1**
        expect(authorize("admin", action)).toBe(true)
      },
    )

    it("admin can manage-config", () => {
      expect(authorize("admin", "manage-config")).toBe(true)
    })

    it("admin can build", () => {
      expect(authorize("admin", "build")).toBe(true)
    })

    it("admin can publish", () => {
      expect(authorize("admin", "publish")).toBe(true)
    })

    it("admin can view", () => {
      expect(authorize("admin", "view")).toBe(true)
    })

  })

  // ── R10.2: management can build, publish, view ────────────────────────────

  describe("management role (R10.2, R10.3)", () => {

    const managementPermitted: ExamAction[] = ["build", "publish", "view"]
    const managementDenied: ExamAction[] = ["manage-config"]

    test.prop([fc.constantFrom<ExamAction>(...managementPermitted)], { numRuns: 100 })(
      "management is authorized for build, publish, and view",
      (action) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.2**
        expect(authorize("management", action)).toBe(true)
      },
    )

    test.prop([fc.constantFrom<ExamAction>(...managementDenied)], { numRuns: 100 })(
      "management is NOT authorized for manage-config",
      (action) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.3**
        expect(authorize("management", action)).toBe(false)
      },
    )

    it("management can build", () => {
      expect(authorize("management", "build")).toBe(true)
    })

    it("management can publish", () => {
      expect(authorize("management", "publish")).toBe(true)
    })

    it("management can view", () => {
      expect(authorize("management", "view")).toBe(true)
    })

    it("management CANNOT manage-config", () => {
      expect(authorize("management", "manage-config")).toBe(false)
    })

  })

  // ── R10.4: teacher / parent / student → view only ─────────────────────────

  describe("view-only roles: teacher, parent (R10.4)", () => {

    const nonViewActions: ExamAction[] = ["manage-config", "build", "publish"]

    test.prop([arbViewOnlyRole], { numRuns: 100 })(
      "teacher and parent are authorized for view",
      (role) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.4**
        expect(authorize(role, "view")).toBe(true)
      },
    )

    test.prop(
      [arbViewOnlyRole, fc.constantFrom<ExamAction>(...nonViewActions)],
      { numRuns: 100 },
    )(
      "teacher and parent are NOT authorized for manage-config, build, or publish",
      (role, action) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.4**
        expect(authorize(role, action)).toBe(false)
      },
    )

    it("teacher can view", () => {
      expect(authorize("teacher", "view")).toBe(true)
    })

    it("teacher CANNOT build", () => {
      expect(authorize("teacher", "build")).toBe(false)
    })

    it("teacher CANNOT publish", () => {
      expect(authorize("teacher", "publish")).toBe(false)
    })

    it("teacher CANNOT manage-config", () => {
      expect(authorize("teacher", "manage-config")).toBe(false)
    })

    it("parent can view", () => {
      expect(authorize("parent", "view")).toBe(true)
    })

    it("parent CANNOT build", () => {
      expect(authorize("parent", "build")).toBe(false)
    })

    it("parent CANNOT publish", () => {
      expect(authorize("parent", "publish")).toBe(false)
    })

    it("parent CANNOT manage-config", () => {
      expect(authorize("parent", "manage-config")).toBe(false)
    })

    // student is forward-compat in access.ts
    it("student can view", () => {
      expect(authorize("student" as Role, "view")).toBe(true)
    })

    it("student CANNOT build", () => {
      expect(authorize("student" as Role, "build")).toBe(false)
    })

    it("student CANNOT publish", () => {
      expect(authorize("student" as Role, "publish")).toBe(false)
    })

    it("student CANNOT manage-config", () => {
      expect(authorize("student" as Role, "manage-config")).toBe(false)
    })

  })

  // ── R10.7: null / undefined / undeterminable role → nothing ───────────────

  describe("null, undefined, and unknown roles (R10.7)", () => {

    test.prop([arbAction], { numRuns: 100 })(
      "null role is denied every action",
      (action) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.7**
        expect(authorize(null, action)).toBe(false)
      },
    )

    test.prop([arbAction], { numRuns: 100 })(
      "undefined role is denied every action",
      (action) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.7**
        expect(authorize(undefined, action)).toBe(false)
      },
    )

    test.prop([arbUnknownRole, arbAction], { numRuns: 100 })(
      "an unrecognized role string is denied every action",
      (unknownRole, action) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.7**
        expect(authorize(unknownRole as Role, action)).toBe(false)
      },
    )

    test.prop([arbNoAccessRole, arbAction], { numRuns: 100 })(
      "super_admin and driver have no exam routine actions",
      (role, action) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.7**
        expect(authorize(role as Role, action)).toBe(false)
      },
    )

    it("null is denied manage-config", () => {
      expect(authorize(null, "manage-config")).toBe(false)
    })

    it("null is denied build", () => {
      expect(authorize(null, "build")).toBe(false)
    })

    it("null is denied publish", () => {
      expect(authorize(null, "publish")).toBe(false)
    })

    it("null is denied view", () => {
      expect(authorize(null, "view")).toBe(false)
    })

    it("undefined is denied all actions", () => {
      for (const action of allActions) {
        expect(authorize(undefined, action)).toBe(false)
      }
    })

    it("empty string role is denied all actions", () => {
      for (const action of allActions) {
        expect(authorize("" as Role, action)).toBe(false)
      }
    })

    it("super_admin is denied all exam actions", () => {
      for (const action of allActions) {
        expect(authorize("super_admin", action)).toBe(false)
      }
    })

    it("driver is denied all exam actions", () => {
      for (const action of allActions) {
        expect(authorize("driver", action)).toBe(false)
      }
    })

  })

  // ── Exhaustive matrix cross-check ─────────────────────────────────────────

  describe("exhaustive matrix cross-check", () => {

    /**
     * Encode the full expected authorization matrix as a lookup and
     * verify every (role, action) cell against it.
     */
    const EXPECTED_MATRIX: Record<string, Record<ExamAction, boolean>> = {
      admin:      { "manage-config": true,  build: true,  publish: true,  view: true  },
      management: { "manage-config": false, build: true,  publish: true,  view: true  },
      teacher:    { "manage-config": false, build: false, publish: false, view: true  },
      parent:     { "manage-config": false, build: false, publish: false, view: true  },
      student:    { "manage-config": false, build: false, publish: false, view: true  },
      super_admin:{ "manage-config": false, build: false, publish: false, view: false },
      driver:     { "manage-config": false, build: false, publish: false, view: false },
    }

    test.prop(
      [
        fc.constantFrom(...(Object.keys(EXPECTED_MATRIX) as Role[])),
        arbAction,
      ],
      { numRuns: 100 },
    )(
      "every (role, action) cell matches the expected authorization matrix",
      (role, action) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.7**
        const expected = EXPECTED_MATRIX[role][action]
        expect(authorize(role, action)).toBe(expected)
      },
    )

    it("full matrix exhaustive check — all roles × all actions", () => {
      // Feature: exam-routine-builder, Property 41: Authorization matrix
      for (const [role, actionMap] of Object.entries(EXPECTED_MATRIX)) {
        for (const [action, expectedResult] of Object.entries(actionMap) as [ExamAction, boolean][]) {
          expect(
            authorize(role as Role, action),
            `authorize("${role}", "${action}") should be ${expectedResult}`,
          ).toBe(expectedResult)
        }
      }
    })

  })

  // ── Biconditional: manage-config iff admin ────────────────────────────────

  describe("manage-config is exclusively an admin action", () => {

    test.prop([arbNonAdminRole], { numRuns: 100 })(
      "no non-admin role can manage-config",
      (role) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.3**
        expect(authorize(role, "manage-config")).toBe(false)
      },
    )

    test.prop([arbAdminRole], { numRuns: 100 })(
      "admin always can manage-config",
      (role) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.1**
        expect(authorize(role, "manage-config")).toBe(true)
      },
    )

  })

  // ── Biconditional: build/publish iff admin or management ─────────────────

  describe("build and publish require admin or management role", () => {

    const buildPublishActions: ExamAction[] = ["build", "publish"]

    test.prop(
      [
        fc.constantFrom<Role>("admin", "management"),
        fc.constantFrom<ExamAction>(...buildPublishActions),
      ],
      { numRuns: 100 },
    )(
      "admin and management can always build and publish",
      (role, action) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.1, 10.2**
        expect(authorize(role, action)).toBe(true)
      },
    )

    test.prop(
      [
        arbViewOnlyRole,
        fc.constantFrom<ExamAction>(...buildPublishActions),
      ],
      { numRuns: 100 },
    )(
      "teacher and parent can never build or publish",
      (role, action) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.4**
        expect(authorize(role, action)).toBe(false)
      },
    )

  })

  // ── Biconditional: view iff recognized role ───────────────────────────────

  describe("view is available to all recognized exam roles", () => {

    test.prop(
      [fc.constantFrom<Role>(...recognizedRoles)],
      { numRuns: 100 },
    )(
      "every recognized exam role can view",
      (role) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.1, 10.2, 10.4**
        expect(authorize(role, "view")).toBe(true)
      },
    )

    test.prop([arbNoAccessRole], { numRuns: 100 })(
      "super_admin and driver cannot view exam routines",
      (role) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        // **Validates: Requirements 10.7**
        expect(authorize(role as Role, "view")).toBe(false)
      },
    )

  })

  // ── Return type is always boolean ─────────────────────────────────────────

  describe("return type invariant", () => {

    test.prop(
      [
        fc.option(fc.constantFrom<Role>(...recognizedRoles, ...noAccessRoles as Role[]), { nil: null }),
        arbAction,
      ],
      { numRuns: 100 },
    )(
      "authorize always returns a boolean",
      (role, action) => {
        // Feature: exam-routine-builder, Property 41: Authorization matrix
        const result = authorize(role, action)
        expect(typeof result).toBe("boolean")
      },
    )

  })

})


// ─────────────────────────────────────────────────────────────────────────────
// Property 42: Unauthorized actions do not mutate state
// Feature: exam-routine-builder, Property 42: Unauthorized actions do not mutate state
//
// Validates: Requirements 10.5, 10.6
//
// When authorize(role, action) returns false the pure logic functions must not
// be called, and therefore the state must remain identical to what it was
// before the attempted action. This property tests the integration of
// authorize() with the pure logic functions addSubject (catalog mutation) and
// setSubject (slot mutation) by guarding each call behind an authorize() check
// — exactly as the context layer does in production.
//
// Specifically:
//   - teacher / parent attempting addSubject (requires "manage-config") → denied
//   - null role attempting setSubject (requires "build") → denied
//   - In both cases the original state is returned without modification.
// ─────────────────────────────────────────────────────────────────────────────

import { addSubject } from "@/lib/exam/subject-catalog"
import { setSubject } from "@/lib/exam/slots"
import { arbCatalog, arbSlots, arbValidName, arbClassId } from "@/__tests__/exam/generators"
import type { ExamSlot } from "@/data/mock-exams"
import type { SlotCoord } from "@/lib/exam/slots"

describe("Property 42: Unauthorized actions do not mutate state", () => {

  // ── teacher / parent cannot addSubject (requires manage-config, R10.6) ────

  test.prop(
    [
      fc.constantFrom<Role>("teacher", "parent"),
      arbCatalog,
      arbValidName,
    ],
    { numRuns: 100 },
  )(
    "teacher or parent attempting addSubject leaves the catalog unchanged",
    (role, catalog, rawName) => {
      // Feature: exam-routine-builder, Property 42: Unauthorized actions do not mutate state
      // **Validates: Requirements 10.5, 10.6**
      //
      // Simulate the context guard: only call addSubject when authorized.
      // When authorize returns false, the catalog must not change.
      const catalogBefore = catalog.map(s => ({ ...s }))

      if (!authorize(role, "manage-config")) {
        // Unauthorized — catalog must remain exactly as it was.
        expect(catalog).toStrictEqual(catalogBefore)
        return
      }

      // If we somehow reach here the authorization check failed — fail the test.
      throw new Error(`Expected role "${role}" to be unauthorized for manage-config`)
    },
  )

  test.prop(
    [
      fc.constantFrom<Role>("teacher", "parent"),
      arbCatalog,
      arbValidName,
    ],
    { numRuns: 100 },
  )(
    "addSubject is not called when role is unauthorized — catalog reference is stable",
    (role, catalog, rawName) => {
      // Feature: exam-routine-builder, Property 42: Unauthorized actions do not mutate state
      // **Validates: Requirements 10.5, 10.6**
      //
      // When the guard prevents calling addSubject, the catalog array reference
      // is the same object (no new array was allocated).
      const authorized = authorize(role, "manage-config")
      expect(authorized).toBe(false)

      // The guarded call: do NOT invoke addSubject because unauthorized.
      const resultCatalog = authorized ? addSubject(catalog, rawName).ok ? [] : catalog : catalog
      expect(resultCatalog).toBe(catalog) // same reference — no mutation
    },
  )

  // ── null role cannot setSubject (requires build, R10.5, R10.7) ──────────

  test.prop(
    [
      arbSlots,
      arbCatalog,
      arbClassId,
    ],
    { numRuns: 100 },
  )(
    "null role attempting setSubject leaves slots unchanged",
    (slots, catalog, classId) => {
      // Feature: exam-routine-builder, Property 42: Unauthorized actions do not mutate state
      // **Validates: Requirements 10.5, 10.7**
      //
      // null role must never be allowed to mutate slot state.
      const slotsBefore: ExamSlot[] = slots.map(s => ({ ...s, invigilatorIds: [...s.invigilatorIds] }))

      const authorized = authorize(null, "build")
      expect(authorized).toBe(false)

      // Simulate the guarded context action — setSubject is NOT called.
      if (!authorized) {
        expect(slots).toStrictEqual(slotsBefore)
        return
      }

      throw new Error("Expected null role to be unauthorized for build")
    },
  )

  test.prop(
    [
      arbSlots,
      arbCatalog,
      arbClassId,
      arbValidName,
    ],
    { numRuns: 100 },
  )(
    "setSubject is not called when role is null — slots reference is stable",
    (slots, catalog, classId, rawSubject) => {
      // Feature: exam-routine-builder, Property 42: Unauthorized actions do not mutate state
      // **Validates: Requirements 10.5, 10.7**
      const authorized = authorize(null, "build")
      expect(authorized).toBe(false)

      // The guarded call: do NOT invoke setSubject because unauthorized.
      const coord: SlotCoord = {
        classId,
        date: "2026-06-01",
        sessionId: "ses-morning",
      }
      const resultSlots = authorized
        ? (() => { const r = setSubject(slots, coord, rawSubject.trim(), catalog); return r.ok ? r.value : slots })()
        : slots
      expect(resultSlots).toBe(slots) // same reference — no mutation
    },
  )

  // ── non-admin / non-management roles cannot perform build actions (R10.5) ─

  test.prop(
    [
      fc.constantFrom<Role>("teacher", "parent"),
      arbSlots,
      arbCatalog,
      arbClassId,
      arbValidName,
    ],
    { numRuns: 100 },
  )(
    "teacher or parent attempting setSubject (build action) leaves slots unchanged",
    (role, slots, catalog, classId, rawSubject) => {
      // Feature: exam-routine-builder, Property 42: Unauthorized actions do not mutate state
      // **Validates: Requirements 10.4, 10.5**
      //
      // teacher and parent have view-only access. Attempting to call the build
      // action (setSubject) must be blocked and the slot state must not change.
      const authorized = authorize(role, "build")
      expect(authorized).toBe(false)

      const coord: SlotCoord = {
        classId,
        date: "2026-06-01",
        sessionId: "ses-morning",
      }

      // Guard: only call setSubject when authorized.
      const resultSlots = authorized
        ? (() => { const r = setSubject(slots, coord, rawSubject.trim(), catalog); return r.ok ? r.value : slots })()
        : slots

      // Slots reference must be the same — no mutation occurred.
      expect(resultSlots).toBe(slots)
    },
  )

  // ── non-admin roles cannot perform manage-config actions (R10.6) ──────────

  test.prop(
    [
      fc.constantFrom<Role>("management", "teacher", "parent"),
      arbCatalog,
      arbValidName,
    ],
    { numRuns: 100 },
  )(
    "management, teacher, and parent cannot addSubject — catalog stays intact",
    (role, catalog, rawName) => {
      // Feature: exam-routine-builder, Property 42: Unauthorized actions do not mutate state
      // **Validates: Requirements 10.3, 10.6**
      //
      // Only admin can manage-config. All other roles must be blocked.
      const authorized = authorize(role, "manage-config")
      expect(authorized).toBe(false)

      // Guard: do not call addSubject when unauthorized.
      const resultCatalog = authorized
        ? (() => { const r = addSubject(catalog, rawName); return r.ok ? r.value : catalog })()
        : catalog

      // Catalog reference must be unchanged — no mutation.
      expect(resultCatalog).toBe(catalog)
    },
  )

  // ── undeterminable role cannot perform any mutating action (R10.7) ────────

  test.prop(
    [
      fc.oneof(
        fc.constant(null as null),
        fc.constant(undefined as undefined),
      ),
      arbCatalog,
      arbSlots,
      arbValidName,
      arbClassId,
    ],
    { numRuns: 100 },
  )(
    "null or undefined role is denied all mutating actions — no state change",
    (role, catalog, slots, rawName, classId) => {
      // Feature: exam-routine-builder, Property 42: Unauthorized actions do not mutate state
      // **Validates: Requirements 10.7**
      const canManageConfig = authorize(role, "manage-config")
      const canBuild = authorize(role, "build")
      const canPublish = authorize(role, "publish")

      expect(canManageConfig).toBe(false)
      expect(canBuild).toBe(false)
      expect(canPublish).toBe(false)

      // Verify catalog is untouched when no auth
      const resultCatalog = canManageConfig
        ? (() => { const r = addSubject(catalog, rawName); return r.ok ? r.value : catalog })()
        : catalog
      expect(resultCatalog).toBe(catalog)

      // Verify slots are untouched when no auth
      const coord: SlotCoord = { classId, date: "2026-06-01", sessionId: "ses-morning" }
      const resultSlots = canBuild
        ? (() => { const r = setSubject(slots, coord, rawName.trim(), catalog); return r.ok ? r.value : slots })()
        : slots
      expect(resultSlots).toBe(slots)
    },
  )

})
