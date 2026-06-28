/**
 * role-gated-pages.test.tsx — Integration tests for role-gated page rendering
 *
 * Feature: exam-routine-builder
 *
 * Tests the context-layer authorization (ExamScheduleProvider + useExamSchedule)
 * with different roles to verify:
 *
 *   R10.5 — Unauthorized build/manage actions rejected without mutation
 *   R10.6 — Unauthorized manage-config actions rejected without mutation
 *   R10.7 — No authenticated user or undeterminable role → all actions rejected
 *
 * Role matrix:
 *   admin      → canEdit=true,  canManageConfig=true,  all mutations succeed
 *   management → canEdit=true,  canManageConfig=false, build mutations succeed,
 *                               manage-config mutations fail with "unauthorized"
 *   teacher    → canEdit=false, canManageConfig=false, ALL mutations return unauthorized
 *   parent     → canEdit=false, canManageConfig=false, ALL mutations return unauthorized
 *   null role  → canEdit=false, canManageConfig=false, ALL mutations return unauthorized
 *
 * Requirements: 10.5, 10.6, 10.7
 */

import React, { type ReactNode } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { ExamScheduleProvider, useExamSchedule } from "@/context/exam-schedule-context"
import {
  EXAM_SUBJECT_CATALOG,
  EXAM_SESSIONS,
  EXAM_DATES,
  MOCK_EXAM_SLOTS,
  DEFAULT_EXAM_DUTY_SETTINGS,
  type ExamRoutineState,
} from "@/data/mock-exams"

// ─────────────────────────────────────────────────────────────────────────────
// vi.hoisted: mutable control vars available inside vi.mock factories
// ─────────────────────────────────────────────────────────────────────────────

const controls = vi.hoisted(() => {
  let role: string | null = "admin"
  let overrideState: ExamRoutineState | null = null
  return {
    getRole: () => role,
    setRole: (r: string | null) => { role = r },
    getOverrideState: () => overrideState,
    setOverrideState: (s: ExamRoutineState | null) => { overrideState = s },
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Mock peer contexts (same pattern as exam-schedule-context.test.tsx)
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("@/context/role-context", () => ({
  useRole: () => ({ role: controls.getRole() }),
}))

vi.mock("@/context/notification-context", () => ({
  useNotifications: () => ({
    staff: [],
    parent: [],
    unreadCount: () => 0,
    upsert: vi.fn(),
    dismiss: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  }),
}))

vi.mock("@/data/mock-exams", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/data/mock-exams")>()
  const mod = { ...real }
  Object.defineProperty(mod, "INITIAL_EXAM_ROUTINE_STATE", {
    get() {
      return controls.getOverrideState() ?? real.INITIAL_EXAM_ROUTINE_STATE
    },
    enumerable: true,
    configurable: true,
  })
  return mod
})

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function wrapper({ children }: { children: ReactNode }) {
  return <ExamScheduleProvider>{children}</ExamScheduleProvider>
}

/** A valid slot coordinate present in the seed data (has subject "English"). */
const COORD_WITH_SUBJECT = { classId: "VIII-A", date: "2026-07-14", sessionId: "ses-morning" }

/** A coord for a slot with no invigilators (IX-A slot has subject "Science", no invigilators). */
const COORD_NO_INVIGILATOR = { classId: "IX-A", date: "2026-07-14", sessionId: "ses-morning" }

/** Snapshot state for comparison, excluding functions and derived fields. */
function snapState(ctx: ReturnType<typeof useExamSchedule>) {
  return {
    catalog: ctx.catalog,
    sessions: ctx.sessions,
    dates: ctx.dates,
    slots: ctx.slots,
    settings: ctx.settings,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset before each test
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  controls.setRole("admin")
  controls.setOverrideState(null)
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. Admin role — canEdit=true, canManageConfig=true, all mutations succeed
// ─────────────────────────────────────────────────────────────────────────────

describe("admin role — canEdit=true, canManageConfig=true", () => {
  beforeEach(() => controls.setRole("admin"))

  it("exposes canEdit=true and canManageConfig=true", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.canEdit).toBe(true)
    expect(result.current.canManageConfig).toBe(true)
  })

  it("manage-config: addSubject succeeds and mutates state (R10.1)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = result.current.catalog.length

    act(() => {
      const res = result.current.addSubject("PE Class")
      expect(res.ok).toBe(true)
    })

    expect(result.current.catalog.length).toBe(before + 1)
    expect(result.current.catalog.some(s => s.name === "PE Class")).toBe(true)
  })

  it("manage-config: addSession succeeds and mutates state (R10.1)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = result.current.sessions.length

    act(() => {
      const res = result.current.addSession({
        name: "Afternoon",
        startTime: "14:00",
        endTime: "17:00",
      })
      expect(res.ok).toBe(true)
    })

    expect(result.current.sessions.length).toBe(before + 1)
  })

  it("manage-config: addExamDate succeeds and mutates state (R10.1)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = result.current.dates.length

    act(() => {
      const res = result.current.addExamDate("2026-08-01")
      expect(res.ok).toBe(true)
    })

    expect(result.current.dates.length).toBe(before + 1)
  })

  it("build: setSubject succeeds and mutates state (R10.1)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      const res = result.current.setSubject(COORD_WITH_SUBJECT, "Science")
      expect(res.ok).toBe(true)
    })

    expect(result.current.slotFor(COORD_WITH_SUBJECT)?.subject).toBe("Science")
  })

  it("build: clearSlot succeeds and mutates state (R10.1)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      const res = result.current.clearSlot(COORD_WITH_SUBJECT)
      expect(res.ok).toBe(true)
    })

    expect(result.current.slotFor(COORD_WITH_SUBJECT)?.subject).toBeUndefined()
  })

  it("build: addInvigilator succeeds and mutates state (R10.1)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      const res = result.current.addInvigilator(COORD_NO_INVIGILATOR, "t2")
      expect(res.ok).toBe(true)
    })

    expect(result.current.slotFor(COORD_NO_INVIGILATOR)?.invigilatorIds).toContain("t2")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. Management role — canEdit=true, canManageConfig=false
//    Build mutations succeed; manage-config mutations return "unauthorized"
// ─────────────────────────────────────────────────────────────────────────────

describe("management role — canEdit=true, canManageConfig=false", () => {
  beforeEach(() => controls.setRole("management"))

  it("exposes canEdit=true and canManageConfig=false (R10.2, R10.3)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.canEdit).toBe(true)
    expect(result.current.canManageConfig).toBe(false)
  })

  it("build: setSubject succeeds — management may build routines (R10.2)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      const res = result.current.setSubject(COORD_WITH_SUBJECT, "Science")
      expect(res.ok).toBe(true)
    })

    expect(result.current.slotFor(COORD_WITH_SUBJECT)?.subject).toBe("Science")
  })

  it("build: clearSlot succeeds — management may build routines (R10.2)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      const res = result.current.clearSlot(COORD_WITH_SUBJECT)
      expect(res.ok).toBe(true)
    })

    expect(result.current.slotFor(COORD_WITH_SUBJECT)?.subject).toBeUndefined()
  })

  it("build: addInvigilator succeeds — management may build routines (R10.2)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      const res = result.current.addInvigilator(COORD_NO_INVIGILATOR, "t2")
      expect(res.ok).toBe(true)
    })

    expect(result.current.slotFor(COORD_NO_INVIGILATOR)?.invigilatorIds).toContain("t2")
  })

  it("manage-config: addSubject returns unauthorized and state is NOT mutated (R10.6)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.addSubject("Forbidden Subject")
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.catalog).toEqual(before.catalog)
  })

  it("manage-config: addSession returns unauthorized and state is NOT mutated (R10.6)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.addSession({ name: "Evening", startTime: "15:00", endTime: "18:00" })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.sessions).toEqual(before.sessions)
  })

  it("manage-config: addExamDate returns unauthorized and state is NOT mutated (R10.6)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.addExamDate("2026-08-10")
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.dates).toEqual(before.dates)
  })

  it("manage-config: deleteSession returns unauthorized ConfirmableResult and state is NOT mutated (R10.6)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)
    const firstSessionId = result.current.sessions[0]?.id

    act(() => {
      if (firstSessionId) {
        const res = result.current.deleteSession(firstSessionId, true)
        expect(res.ok).toBe(false)
        if (!res.ok) expect(res.reason).toBe("unauthorized")
      }
    })

    expect(result.current.sessions).toEqual(before.sessions)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. Teacher role — canEdit=false, canManageConfig=false, ALL mutations unauthorized
// ─────────────────────────────────────────────────────────────────────────────

describe("teacher role — canEdit=false, canManageConfig=false, all mutations unauthorized", () => {
  beforeEach(() => controls.setRole("teacher"))

  it("exposes canEdit=false and canManageConfig=false (R10.4)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.canEdit).toBe(false)
    expect(result.current.canManageConfig).toBe(false)
  })

  it("setSubject returns unauthorized and state is NOT mutated (R10.5)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.setSubject(COORD_WITH_SUBJECT, "Science")
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.slots).toEqual(before.slots)
  })

  it("clearSlot returns unauthorized and state is NOT mutated (R10.5)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.clearSlot(COORD_WITH_SUBJECT)
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.slots).toEqual(before.slots)
  })

  it("addInvigilator returns unauthorized and state is NOT mutated (R10.5)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.addInvigilator(COORD_NO_INVIGILATOR, "t2")
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.slots).toEqual(before.slots)
  })

  it("addSubject returns unauthorized and catalog is NOT mutated (R10.6)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.addSubject("Teacher Subject")
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.catalog).toEqual(before.catalog)
  })

  it("addSession returns unauthorized and sessions are NOT mutated (R10.6)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.addSession({ name: "Evening", startTime: "15:00", endTime: "18:00" })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.sessions).toEqual(before.sessions)
  })

  it("addExamDate returns unauthorized and dates are NOT mutated (R10.6)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.addExamDate("2026-08-20")
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.dates).toEqual(before.dates)
  })

  it("moveSubject returns unauthorized and slots are NOT mutated (R10.5)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const slotsBeforeCount = result.current.slots.length

    act(() => {
      const res = result.current.moveSubject(
        COORD_WITH_SUBJECT,
        { classId: "IX-A", date: "2026-07-14", sessionId: "ses-morning" },
      )
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.slots.length).toBe(slotsBeforeCount)
    // Original slot still holds its subject
    expect(result.current.slotFor(COORD_WITH_SUBJECT)?.subject).toBe("English")
  })

  it("duplicateRoutine returns unauthorized and slots are NOT mutated (R10.5)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.duplicateRoutine("VIII-A", ["IX-A"])
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.slots).toEqual(before.slots)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. Parent role — canEdit=false, canManageConfig=false, ALL mutations unauthorized
// ─────────────────────────────────────────────────────────────────────────────

describe("parent role — canEdit=false, canManageConfig=false, all mutations unauthorized", () => {
  beforeEach(() => controls.setRole("parent"))

  it("exposes canEdit=false and canManageConfig=false (R10.4)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.canEdit).toBe(false)
    expect(result.current.canManageConfig).toBe(false)
  })

  it("setSubject returns unauthorized and state is NOT mutated (R10.5)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.setSubject(COORD_WITH_SUBJECT, "Science")
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.slots).toEqual(before.slots)
  })

  it("clearSlot returns unauthorized and state is NOT mutated (R10.5)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.clearSlot(COORD_WITH_SUBJECT)
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.slots).toEqual(before.slots)
  })

  it("addInvigilator returns unauthorized and state is NOT mutated (R10.5)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.addInvigilator(COORD_NO_INVIGILATOR, "t3")
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.slots).toEqual(before.slots)
  })

  it("addSubject returns unauthorized and catalog is NOT mutated (R10.6)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.addSubject("Parent Subject")
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.catalog).toEqual(before.catalog)
  })

  it("read state is accessible — catalog, sessions, dates, slots are readable (R10.4)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    // Parent can read the schedule
    expect(Array.isArray(result.current.catalog)).toBe(true)
    expect(Array.isArray(result.current.sessions)).toBe(true)
    expect(Array.isArray(result.current.dates)).toBe(true)
    expect(Array.isArray(result.current.slots)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. null/undefined role — ALL mutations return unauthorized, state unchanged
// ─────────────────────────────────────────────────────────────────────────────

describe("null role — canEdit=false, canManageConfig=false, all mutations unauthorized", () => {
  beforeEach(() => controls.setRole(null))

  it("exposes canEdit=false and canManageConfig=false (R10.7)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.canEdit).toBe(false)
    expect(result.current.canManageConfig).toBe(false)
  })

  it("setSubject returns unauthorized and state is NOT mutated (R10.7)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.setSubject(COORD_WITH_SUBJECT, "Science")
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.slots).toEqual(before.slots)
  })

  it("clearSlot returns unauthorized and state is NOT mutated (R10.7)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.clearSlot(COORD_WITH_SUBJECT)
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.slots).toEqual(before.slots)
  })

  it("addSubject returns unauthorized and catalog is NOT mutated (R10.7)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.addSubject("Null Role Subject")
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.catalog).toEqual(before.catalog)
  })

  it("addSession returns unauthorized and sessions are NOT mutated (R10.7)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.addSession({ name: "Night", startTime: "20:00", endTime: "22:00" })
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.sessions).toEqual(before.sessions)
  })

  it("addExamDate returns unauthorized and dates are NOT mutated (R10.7)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.addExamDate("2026-09-01")
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.dates).toEqual(before.dates)
  })

  it("addInvigilator returns unauthorized and slots are NOT mutated (R10.7)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.addInvigilator(COORD_NO_INVIGILATOR, "t2")
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.slots).toEqual(before.slots)
  })

  it("duplicateRoutine returns unauthorized and slots are NOT mutated (R10.7)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const before = snapState(result.current)

    act(() => {
      const res = result.current.duplicateRoutine("VIII-A", ["IX-A"])
      expect(res.ok).toBe(false)
      if (!res.ok) expect(res.error).toBe("unauthorized")
    })

    expect(result.current.slots).toEqual(before.slots)
  })

  it("unauthorized mutation error message is a non-empty string (R10.7)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      const res = result.current.setSubject(COORD_WITH_SUBJECT, "Science")
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(typeof res.message).toBe("string")
        expect(res.message.length).toBeGreaterThan(0)
      }
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 6. Cross-role: state is never mutated by unauthorized calls
//    (verifies R10.5 and R10.6 hold across role transitions)
// ─────────────────────────────────────────────────────────────────────────────

describe("cross-role: unauthorized mutations never change state", () => {
  it("unauthorized roles produce identical slot snapshots regardless of which mutation is attempted", () => {
    const unauthorizedRoles: (string | null)[] = ["teacher", "parent", null]

    for (const role of unauthorizedRoles) {
      controls.setRole(role)
      const { result } = renderHook(() => useExamSchedule(), { wrapper })
      const slotsBefore = [...result.current.slots]

      act(() => {
        result.current.setSubject(COORD_WITH_SUBJECT, "Biology")
        result.current.clearSlot(COORD_WITH_SUBJECT)
        result.current.addInvigilator(COORD_NO_INVIGILATOR, "t3")
      })

      // None of the three mutations should change slots
      expect(result.current.slots).toEqual(slotsBefore)
    }
  })

  it("unauthorized manage-config calls from management leave catalog, sessions, dates unchanged", () => {
    controls.setRole("management")
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const catalogBefore = [...result.current.catalog]
    const sessionsBefore = [...result.current.sessions]
    const datesBefore = [...result.current.dates]

    act(() => {
      result.current.addSubject("Forbidden A")
      result.current.addSession({ name: "Forbidden Session", startTime: "06:00", endTime: "08:00" })
      result.current.addExamDate("2026-12-25")
    })

    expect(result.current.catalog).toEqual(catalogBefore)
    expect(result.current.sessions).toEqual(sessionsBefore)
    expect(result.current.dates).toEqual(datesBefore)
  })

  it("all unauthorized roles see the same read-only data (catalog/sessions/dates/slots)", () => {
    // Establish a reference snapshot from admin.
    controls.setRole("admin")
    const { result: adminResult } = renderHook(() => useExamSchedule(), { wrapper })
    const refCatalog = adminResult.current.catalog
    const refSessions = adminResult.current.sessions
    const refDates = adminResult.current.dates
    const refSlots = adminResult.current.slots

    for (const role of ["teacher", "parent"] as const) {
      controls.setRole(role)
      const { result } = renderHook(() => useExamSchedule(), { wrapper })
      expect(result.current.catalog).toEqual(refCatalog)
      expect(result.current.sessions).toEqual(refSessions)
      expect(result.current.dates).toEqual(refDates)
      expect(result.current.slots).toEqual(refSlots)
    }
  })
})
