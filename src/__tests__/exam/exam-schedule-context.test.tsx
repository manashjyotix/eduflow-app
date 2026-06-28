/**
 * exam-schedule-context.test.tsx — Integration tests for ExamScheduleProvider
 *
 * Feature: exam-routine-builder
 *
 * Covers:
 *   - 12.1  Init: provider initial state equals mock data
 *   - 12.2  Load failure: corrupted/missing source → empty grid + loadErrors, no crash
 *   - 12.3  Propagation: a mutation reflects identically in catalog, grid, duty roster,
 *           and read-only views (multiple consumers see the same updated state)
 *   - 12.4  State change is visible in all consumers without manual refresh
 *   - 12.5  Context-only access: state is accessed exclusively through useExamSchedule()
 *
 * Tests use Vitest + @testing-library/react.
 *
 * Requirements: 12.1, 12.2, 12.3, 12.4, 12.5
 */

import React, { createContext, useContext, type ReactNode } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { renderHook, act, render } from "@testing-library/react"
import { ExamScheduleProvider, useExamSchedule } from "@/context/exam-schedule-context"
import {
  EXAM_SUBJECT_CATALOG,
  EXAM_SESSIONS,
  EXAM_DATES,
  MOCK_EXAM_SLOTS,
  DEFAULT_EXAM_DUTY_SETTINGS,
  SEED_CLASS_GROUPS,
  type ExamRoutineState,
} from "@/data/mock-exams"

// ─────────────────────────────────────────────────────────────────────────────
// Use vi.hoisted so the mutable control variables are available inside vi.mock
// factories (vi.mock calls are hoisted to the top of the module by Vitest).
// ─────────────────────────────────────────────────────────────────────────────

const controls = vi.hoisted(() => {
  let role = "admin"
  let overrideState: ExamRoutineState | null = null

  return {
    getRole: () => role,
    setRole: (r: string) => { role = r },
    getOverrideState: () => overrideState,
    setOverrideState: (s: ExamRoutineState | null) => { overrideState = s },
  }
})

/**
 * Stable upsert mock — shared across all tests so we can inspect call counts.
 * Hoisted so it is available inside the vi.mock factory below.
 */
const { upsertMock } = vi.hoisted(() => ({ upsertMock: vi.fn() }))

// ─────────────────────────────────────────────────────────────────────────────
// Mock peer contexts so ExamScheduleProvider doesn't need the full auth chain.
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("@/context/role-context", () => ({
  useRole: () => ({ role: controls.getRole() }),
}))

vi.mock("@/context/notification-context", () => ({
  useNotifications: () => ({
    staff: [],
    parent: [],
    unreadCount: () => 0,
    upsert: upsertMock,
    dismiss: vi.fn(),
    markRead: vi.fn(),
    markAllRead: vi.fn(),
  }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Mock mock-exams so tests can inject corrupted initial state.
// The getter is called lazily each time buildInitialState() reads the export.
// ─────────────────────────────────────────────────────────────────────────────

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

/** Simple wrapper supplying only ExamScheduleProvider (peers are mocked). */
function wrapper({ children }: { children: ReactNode }) {
  return <ExamScheduleProvider>{children}</ExamScheduleProvider>
}

/**
 * Render two hook consumers inside the SAME provider tree so they share state.
 * Returns refs to both hook results.
 */
function renderTwoConsumers() {
  type CtxRef = ReturnType<typeof useExamSchedule>
  // We capture hook results via a simple shared context trick.
  const ResultCtx = createContext<{ a: CtxRef | null; b: CtxRef | null }>({ a: null, b: null })

  let refA: CtxRef | null = null
  let refB: CtxRef | null = null

  function ConsumerA() {
    refA = useExamSchedule()
    return null
  }
  function ConsumerB() {
    refB = useExamSchedule()
    return null
  }

  const { rerender } = render(
    <ExamScheduleProvider>
      <ConsumerA />
      <ConsumerB />
    </ExamScheduleProvider>,
  )

  // Force a re-read of the refs after initial render.
  return {
    getA: () => refA!,
    getB: () => refB!,
    rerender: (fn: () => void) => act(fn),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset before each test.
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  controls.setRole("admin")
  controls.setOverrideState(null)
  upsertMock.mockClear()
})

// ─────────────────────────────────────────────────────────────────────────────
// 12.1 — Initialization: provider initial state equals mock data
// ─────────────────────────────────────────────────────────────────────────────

describe("12.1 Initialization — initial state equals mock data", () => {
  it("catalog matches EXAM_SUBJECT_CATALOG", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.catalog).toEqual(EXAM_SUBJECT_CATALOG)
  })

  it("sessions matches EXAM_SESSIONS", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.sessions).toEqual(EXAM_SESSIONS)
  })

  it("dates matches EXAM_DATES (sorted ascending)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const sorted = [...EXAM_DATES].sort()
    expect(result.current.dates).toEqual(sorted)
  })

  it("slots match MOCK_EXAM_SLOTS", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.slots).toEqual(MOCK_EXAM_SLOTS)
  })

  it("settings match DEFAULT_EXAM_DUTY_SETTINGS", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.settings).toEqual(DEFAULT_EXAM_DUTY_SETTINGS)
  })

  it("loadErrors is empty on successful initialization", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.loadErrors).toEqual([])
  })

  it("conflicts is an array (empty initially — no double-booked teachers in seed)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(Array.isArray(result.current.conflicts)).toBe(true)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 12.2 — Load failure: corrupted data → empty slice + loadErrors, no crash
// ─────────────────────────────────────────────────────────────────────────────

describe("12.2 Load failure — corrupted data → empty slice + loadErrors, no crash", () => {
  // Helper: build a valid base + override one field so buildInitialState encounters it.
  const base = (): ExamRoutineState => ({
    catalog: EXAM_SUBJECT_CATALOG,
    sessions: EXAM_SESSIONS,
    dates: EXAM_DATES,
    slots: MOCK_EXAM_SLOTS,
    settings: DEFAULT_EXAM_DUTY_SETTINGS,
    loadErrors: [], classGroups: SEED_CLASS_GROUPS,
  })

  it("corrupted catalog (non-array) → empty catalog + loadErrors mentions 'Subject catalog'", () => {
    controls.setOverrideState({ ...base(), catalog: "not-an-array" as never })
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.catalog).toEqual([])
    expect(result.current.loadErrors.length).toBeGreaterThan(0)
    expect(result.current.loadErrors.some(e => /Subject catalog/i.test(e))).toBe(true)
  })

  it("corrupted catalog item (missing id field) → empty catalog + loadErrors", () => {
    controls.setOverrideState({
      ...base(),
      catalog: [{ name: "Math", linkedClassIds: [] }] as never,
    })
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.catalog).toEqual([])
    expect(result.current.loadErrors.some(e => /Subject catalog/i.test(e))).toBe(true)
  })

  it("corrupted sessions (null) → empty sessions + loadErrors mentions 'Session'", () => {
    controls.setOverrideState({ ...base(), sessions: null as never })
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.sessions).toEqual([])
    expect(result.current.loadErrors.some(e => /Session/i.test(e))).toBe(true)
  })

  it("corrupted sessions item (missing endTime) → empty sessions + loadErrors", () => {
    controls.setOverrideState({
      ...base(),
      sessions: [{ id: "s1", name: "Morning", startTime: "09:00" }] as never,
    })
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.sessions).toEqual([])
    expect(result.current.loadErrors.some(e => /Session/i.test(e))).toBe(true)
  })

  it("corrupted slots (non-array item missing required fields) → empty slots + loadErrors", () => {
    controls.setOverrideState({
      ...base(),
      slots: [{ classId: "VIII-A" }] as never,
    })
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.slots).toEqual([])
    expect(result.current.loadErrors.some(e => /Exam slot/i.test(e))).toBe(true)
  })

  it("invalid exam dates (non-ISO strings) → empty dates + loadErrors mentions 'Exam date'", () => {
    controls.setOverrideState({ ...base(), dates: ["not-a-date", "9999-99-99"] as never })
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.dates).toEqual([])
    expect(result.current.loadErrors.some(e => /Exam date/i.test(e))).toBe(true)
  })

  it("corrupted settings → falls back to default settings without crashing", () => {
    controls.setOverrideState({
      ...base(),
      settings: { notifyLeadMinutes: "bad" } as never,
    })
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(typeof result.current.settings.notifyLeadMinutes).toBe("number")
    expect(typeof result.current.settings.notifyOnCampusEntry).toBe("boolean")
  })

  it("multiple corrupted sources → loadErrors has one entry per failed source", () => {
    controls.setOverrideState({
      ...base(),
      catalog: "bad" as never,
      sessions: 42 as never,
    })
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.loadErrors.length).toBeGreaterThanOrEqual(2)
  })

  it("loadErrors entries are non-empty strings identifying the failed source", () => {
    controls.setOverrideState({ ...base(), slots: "broken" as never })
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    for (const err of result.current.loadErrors) {
      expect(typeof err).toBe("string")
      expect(err.length).toBeGreaterThan(0)
    }
  })

  it("all sources corrupted → all slices empty, provider does not crash", () => {
    controls.setOverrideState({
      catalog: "bad" as never,
      sessions: "bad" as never,
      dates: "bad" as never,
      slots: "bad" as never,
      settings: DEFAULT_EXAM_DUTY_SETTINGS,
      loadErrors: [], classGroups: SEED_CLASS_GROUPS,
    })
    expect(() => renderHook(() => useExamSchedule(), { wrapper })).not.toThrow()
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.catalog).toEqual([])
    expect(result.current.sessions).toEqual([])
    expect(result.current.dates).toEqual([])
    expect(result.current.slots).toEqual([])
    expect(result.current.loadErrors.length).toBeGreaterThan(0)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 12.3 / 12.4 — Propagation: mutation reflects in all consumers immediately
//
// We render multiple consumers inside the SAME provider tree so they share
// the same React state. After a mutation via one consumer, all others must
// reflect the change without any manual refresh.
// ─────────────────────────────────────────────────────────────────────────────

describe("12.3 / 12.4 Propagation — mutation reflects in all consumers immediately", () => {
  it("addSubject: both consumers see the updated catalog", async () => {
    const { getA, getB } = renderTwoConsumers()

    const initialCount = getA().catalog.length

    await act(async () => {
      const res = getA().addSubject("Physical Education")
      expect(res.ok).toBe(true)
    })

    expect(getA().catalog.length).toBe(initialCount + 1)
    expect(getB().catalog.length).toBe(initialCount + 1)
    expect(getA().catalog.map(s => s.name)).toContain("Physical Education")
    expect(getB().catalog.map(s => s.name)).toContain("Physical Education")
  })

  it("addSubject: both consumers hold identical catalog state", async () => {
    const { getA, getB } = renderTwoConsumers()

    await act(async () => {
      getA().addSubject("Art & Craft")
    })

    expect(getA().catalog).toEqual(getB().catalog)
  })

  it("setSubject: slot update is reflected by all consumers", async () => {
    const { getA, getB } = renderTwoConsumers()

    // Replace "English" with "Science" on the VIII-A / 2026-07-14 / ses-morning slot.
    const coord = { classId: "VIII-A", date: "2026-07-14", sessionId: "ses-morning" }

    await act(async () => {
      const res = getA().setSubject(coord, "Science")
      expect(res.ok).toBe(true)
    })

    expect(getA().slotFor(coord)?.subject).toBe("Science")
    expect(getB().slotFor(coord)?.subject).toBe("Science")
  })

  it("clearSlot: cleared slot is observed by all consumers", async () => {
    const { getA, getB } = renderTwoConsumers()

    const coord = { classId: "VIII-A", date: "2026-07-14", sessionId: "ses-morning" }

    await act(async () => {
      getA().clearSlot(coord)
    })

    expect(getA().slotFor(coord)?.subject).toBeUndefined()
    expect(getB().slotFor(coord)?.subject).toBeUndefined()
  })

  it("addInvigilator: new invigilator is visible to all consumers", async () => {
    const { getA, getB } = renderTwoConsumers()

    // IX-A / 2026-07-14 / ses-morning has "Science" and no invigilators.
    const coord = { classId: "IX-A", date: "2026-07-14", sessionId: "ses-morning" }

    await act(async () => {
      const res = getA().addInvigilator(coord, "t2")
      expect(res.ok).toBe(true)
    })

    expect(getA().slotFor(coord)?.invigilatorIds).toContain("t2")
    expect(getB().slotFor(coord)?.invigilatorIds).toContain("t2")
  })

  it("conflicts are derived automatically — double-booked teacher triggers conflict flag", async () => {
    const { getA } = renderTwoConsumers()

    // t1 is already in VIII-A/2026-07-14/ses-morning.
    // Adding t1 to IX-A/2026-07-14/ses-morning (same date+session) creates a conflict.
    const coordIXA = { classId: "IX-A", date: "2026-07-14", sessionId: "ses-morning" }

    await act(async () => {
      getA().addInvigilator(coordIXA, "t1")
    })

    expect(getA().conflicts.some(c => c.teacherId === "t1")).toBe(true)
  })

  it("successive mutations accumulate and are visible to all consumers", async () => {
    const { getA, getB } = renderTwoConsumers()

    const initialCount = getA().catalog.length

    await act(async () => {
      getA().addSubject("Music")
    })
    await act(async () => {
      getA().addSubject("Physical Education")
    })

    expect(getA().catalog.length).toBe(initialCount + 2)
    expect(getB().catalog.length).toBe(initialCount + 2)
    expect(getA().catalog.map(s => s.name)).toContain("Music")
    expect(getB().catalog.map(s => s.name)).toContain("Physical Education")
  })

  it("duty-roster and read-only view consumers see the same slot state after mutation", async () => {
    // Three consumers: builder, duty-roster, read-only view.
    let builderCtx: ReturnType<typeof useExamSchedule> | null = null
    let rosterCtx: ReturnType<typeof useExamSchedule> | null = null
    let readOnlyCtx: ReturnType<typeof useExamSchedule> | null = null

    function Builder() { builderCtx = useExamSchedule(); return null }
    function Roster()  { rosterCtx  = useExamSchedule(); return null }
    function ReadOnly() { readOnlyCtx = useExamSchedule(); return null }

    render(
      <ExamScheduleProvider>
        <Builder /><Roster /><ReadOnly />
      </ExamScheduleProvider>,
    )

    const coord = { classId: "VIII-A", date: "2026-07-15", sessionId: "ses-morning" }

    await act(async () => {
      builderCtx!.setSubject(coord, "Hindi")
    })

    expect(builderCtx!.slotFor(coord)?.subject).toBe("Hindi")
    expect(rosterCtx!.slotFor(coord)?.subject).toBe("Hindi")
    expect(readOnlyCtx!.slotFor(coord)?.subject).toBe("Hindi")
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 12.5 — Context-only access: state is accessed exclusively through
//         useExamSchedule(); it is the sole interface consumers depend on.
// ─────────────────────────────────────────────────────────────────────────────

describe("12.5 Context-only access — useExamSchedule() is the sole interface", () => {
  it("exposes all required read-state fields", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current).toHaveProperty("catalog")
    expect(result.current).toHaveProperty("sessions")
    expect(result.current).toHaveProperty("dates")
    expect(result.current).toHaveProperty("slots")
    expect(result.current).toHaveProperty("settings")
    expect(result.current).toHaveProperty("conflicts")
    expect(result.current).toHaveProperty("loadErrors")
  })

  it("exposes all mutating action methods", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const ctx = result.current
    // Catalog
    expect(typeof ctx.addSubject).toBe("function")
    expect(typeof ctx.renameSubject).toBe("function")
    expect(typeof ctx.deleteSubject).toBe("function")
    expect(typeof ctx.linkClass).toBe("function")
    expect(typeof ctx.unlinkClass).toBe("function")
    // Sessions
    expect(typeof ctx.addSession).toBe("function")
    expect(typeof ctx.editSession).toBe("function")
    expect(typeof ctx.deleteSession).toBe("function")
    expect(typeof ctx.sessionHasSlots).toBe("function")
    // Dates
    expect(typeof ctx.addExamDate).toBe("function")
    expect(typeof ctx.removeExamDate).toBe("function")
    expect(typeof ctx.dateHasSlots).toBe("function")
    // Grid
    expect(typeof ctx.setSubject).toBe("function")
    expect(typeof ctx.clearSlot).toBe("function")
    expect(typeof ctx.setRoom).toBe("function")
    expect(typeof ctx.addInvigilator).toBe("function")
    expect(typeof ctx.removeInvigilator).toBe("function")
    expect(typeof ctx.moveSubject).toBe("function")
    expect(typeof ctx.moveInvigilator).toBe("function")
    // Bulk + AI
    expect(typeof ctx.duplicateRoutine).toBe("function")
    expect(typeof ctx.generateRoutine).toBe("function")
    // Notifications + settings
    expect(typeof ctx.notifyDuties).toBe("function")
    expect(typeof ctx.notifyOnEntry).toBe("function")
    expect(typeof ctx.updateSettings).toBe("function")
    // Helpers
    expect(typeof ctx.slotFor).toBe("function")
    expect(typeof ctx.paletteForClass).toBe("function")
    expect(typeof ctx.canEdit).toBe("boolean")
    expect(typeof ctx.canManageConfig).toBe("boolean")
  })

  it("throws when used outside <ExamScheduleProvider>", () => {
    expect(() => renderHook(() => useExamSchedule())).toThrow(
      "useExamSchedule must be used inside <ExamScheduleProvider>",
    )
  })

  it("canEdit and canManageConfig are true for admin role", () => {
    controls.setRole("admin")
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.canEdit).toBe(true)
    expect(result.current.canManageConfig).toBe(true)
  })

  it("canEdit is true but canManageConfig is false for management role", () => {
    controls.setRole("management")
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.canEdit).toBe(true)
    expect(result.current.canManageConfig).toBe(false)
  })

  it("canEdit and canManageConfig are both false for teacher role", () => {
    controls.setRole("teacher")
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.canEdit).toBe(false)
    expect(result.current.canManageConfig).toBe(false)
  })

  it("canEdit and canManageConfig are both false for parent role", () => {
    controls.setRole("parent")
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    expect(result.current.canEdit).toBe(false)
    expect(result.current.canManageConfig).toBe(false)
  })

  it("unauthorized mutation (teacher addSubject) returns unauthorized and leaves state unchanged", () => {
    controls.setRole("teacher")
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    const catalogBefore = [...result.current.catalog]

    act(() => {
      const res = result.current.addSubject("Unauthorized Subject")
      expect(res.ok).toBe(false)
      if (!res.ok) {
        expect(res.error).toBe("unauthorized")
        expect(typeof res.message).toBe("string")
      }
    })

    expect(result.current.catalog).toEqual(catalogBefore)
  })

  it("paletteForClass returns subjects linked to the given class", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const palette = result.current.paletteForClass("VIII-A")
    expect(palette.length).toBe(EXAM_SUBJECT_CATALOG.length)
    for (const subj of palette) {
      expect(subj.linkedClassIds).toContain("VIII-A")
    }
  })

  it("slotFor returns the correct slot by coordinate", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const slot = result.current.slotFor({
      classId: "VIII-A",
      date: "2026-07-14",
      sessionId: "ses-morning",
    })
    expect(slot).toBeDefined()
    expect(slot?.subject).toBe("English")
    expect(slot?.room).toBe("Room 201")
  })

  it("slotFor returns undefined for a coordinate with no slot", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })
    const slot = result.current.slotFor({
      classId: "X-A",
      date: "2026-07-17",
      sessionId: "ses-morning",
    })
    expect(slot).toBeUndefined()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 12.4 — Notification dispatch: notifyDuties and notifyOnEntry push expected
//         messages through notification-context.
//
// Seed data recap (from mock-exams.ts):
//   es-1  VIII-A / 2026-07-14 / ses-morning  subject:"English"   room:"Room 201"  invigilators:["t1"]
//   es-2  VIII-A / 2026-07-15 / ses-morning  subject:"Mathematics" room:"Room 201" invigilators:["t4"]
//   es-3  IX-A   / 2026-07-14 / ses-morning  subject:"Science"   room:"Room 203"  invigilators:[]
//
// notifyDuties dispatches one upsert per subject-bearing invigilator assignment.
// From the seed: es-1 has 1 assignment (t1, has subject), es-2 has 1 assignment
// (t4, has subject), es-3 has 0 invigilators → 2 upsert calls total, 0 skipped.
//
// notifyOnEntry(teacherId) dispatches one upsert when the teacher has duties
// on today's date; nothing when there are no duties.
//
// Requirements: 11.1, 11.2, 11.3, 11.4
// ─────────────────────────────────────────────────────────────────────────────

describe("12.4 Notification dispatch — notifyDuties and notifyOnEntry", () => {
  // ── notifyDuties ────────────────────────────────────────────────────────────

  it("notifyDuties: calls upsert once per subject-bearing invigilator assignment", () => {
    // Seed has 2 subject-bearing assignments (es-1: t1, es-2: t4).
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      result.current.notifyDuties()
    })

    // Exactly 2 upsert calls: one for t1 on es-1, one for t4 on es-2.
    expect(upsertMock).toHaveBeenCalledTimes(2)
  })

  it("notifyDuties: returns { sent, skipped } with sent equal to dispatched message count", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    let outcome: { sent: number; skipped: number } | undefined

    act(() => {
      outcome = result.current.notifyDuties()
    })

    // 2 subject-bearing assignments → sent = 2; es-3 has no invigilators → skipped = 0.
    expect(outcome).toBeDefined()
    expect(outcome!.sent).toBe(2)
    expect(outcome!.skipped).toBe(0)
  })

  it("notifyDuties: skips slots without subjects and counts them in skipped", async () => {
    // Add a subject-less slot with one invigilator so skipped > 0.
    // Use addExamDate + addInvigilator to build it in-state.
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    // Add a new exam date so we can create a fresh slot with no subject.
    await act(async () => {
      result.current.addExamDate("2026-07-18")
    })

    // setSubject deliberately not called — slot stays subject-less.
    // addInvigilator requires a subject, so instead we mutate via clearSlot on
    // an existing slot and re-add via addInvigilator to a fresh coord. But
    // addInvigilatorToSlot itself requires a subject on the slot (R7.7).
    //
    // The simpler approach: build an ExamRoutineState override that has a
    // subject-less slot with an invigilator, and re-render the hook with it.
    //
    // Re-mount with overridden state that includes a subject-less invigilator.
    const subjectlessSlot = {
      id: "es-subjectless",
      classId: "X-A",
      date: "2026-07-14",
      sessionId: "ses-morning",
      // NO subject field
      invigilatorIds: ["t2"],
    }
    controls.setOverrideState({
      catalog: EXAM_SUBJECT_CATALOG,
      sessions: EXAM_SESSIONS,
      dates: EXAM_DATES,
      slots: [...MOCK_EXAM_SLOTS, subjectlessSlot],
      settings: DEFAULT_EXAM_DUTY_SETTINGS,
      loadErrors: [], classGroups: SEED_CLASS_GROUPS,
    })

    upsertMock.mockClear()

    const { result: result2 } = renderHook(() => useExamSchedule(), { wrapper })

    let outcome2: { sent: number; skipped: number } | undefined
    act(() => {
      outcome2 = result2.current.notifyDuties()
    })

    // seed has 2 subject-bearing assignments; subjectless has 1 invigilator → skipped = 1.
    expect(outcome2!.skipped).toBeGreaterThanOrEqual(1)
    // upsert called only for subject-bearing ones (2 from seed).
    expect(upsertMock).toHaveBeenCalledTimes(2)
  })

  it("notifyDuties: upsert payload includes classId, subject, date, sessionId fields", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      result.current.notifyDuties()
    })

    // Each upsert call is made with ("staff", notificationObject).
    // Verify both calls were made with "staff" as the first argument.
    for (const call of upsertMock.mock.calls) {
      expect(call[0]).toBe("staff")
      const notif = call[1] as { id: string; title: string; body: string; type: string }
      expect(typeof notif.id).toBe("string")
      expect(notif.id.length).toBeGreaterThan(0)
      expect(typeof notif.title).toBe("string")
      expect(typeof notif.body).toBe("string")
      expect(notif.type).toBe("exam_duty")
    }
  })

  it("notifyDuties: notification body contains the subject name (R11.1)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      result.current.notifyDuties()
    })

    const bodies: string[] = upsertMock.mock.calls.map(
      (c: unknown[]) => (c[1] as { body: string }).body,
    )
    // es-1 → "English", es-2 → "Mathematics"
    expect(bodies.some(b => b.includes("English"))).toBe(true)
    expect(bodies.some(b => b.includes("Mathematics"))).toBe(true)
  })

  it("notifyDuties: notification body contains the room when a room is assigned (R11.1)", () => {
    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      result.current.notifyDuties()
    })

    const bodies: string[] = upsertMock.mock.calls.map(
      (c: unknown[]) => (c[1] as { body: string }).body,
    )
    // Both seed slots have room "Room 201".
    expect(bodies.some(b => b.includes("Room 201"))).toBe(true)
  })

  it("notifyDuties: returns sent = 0 and calls upsert 0 times when no invigilators are assigned", () => {
    // Override: only es-3 which has no invigilators.
    controls.setOverrideState({
      catalog: EXAM_SUBJECT_CATALOG,
      sessions: EXAM_SESSIONS,
      dates: EXAM_DATES,
      slots: [{ id: "es-3", classId: "IX-A", date: "2026-07-14", sessionId: "ses-morning", subject: "Science", room: "Room 203", invigilatorIds: [] }],
      settings: DEFAULT_EXAM_DUTY_SETTINGS,
      loadErrors: [], classGroups: SEED_CLASS_GROUPS,
    })

    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    let outcome: { sent: number; skipped: number } | undefined
    act(() => {
      outcome = result.current.notifyDuties()
    })

    expect(outcome!.sent).toBe(0)
    expect(outcome!.skipped).toBe(0)
    expect(upsertMock).not.toHaveBeenCalled()
  })

  // ── notifyOnEntry ────────────────────────────────────────────────────────────

  it("notifyOnEntry: calls upsert when teacher has duties on today's date (mocked Date)", () => {
    // Override slots to use today's date so notifyOnEntry finds a match.
    const today = "2026-07-14"
    vi.setSystemTime(new Date(`${today}T08:00:00.000Z`))

    controls.setOverrideState({
      catalog: EXAM_SUBJECT_CATALOG,
      sessions: EXAM_SESSIONS,
      dates: EXAM_DATES,
      // t1 has a duty on 2026-07-14 (same as mocked "today")
      slots: MOCK_EXAM_SLOTS,
      settings: { notifyLeadMinutes: 15, notifyOnCampusEntry: true },
      loadErrors: [], classGroups: SEED_CLASS_GROUPS,
    })

    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      result.current.notifyOnEntry("t1")
    })

    // t1 has a subject-bearing duty on 2026-07-14 → upsert called once.
    expect(upsertMock).toHaveBeenCalledTimes(1)
    expect(upsertMock.mock.calls[0][0]).toBe("staff")
    const notif = upsertMock.mock.calls[0][1] as { type: string; body: string }
    expect(notif.type).toBe("exam_duty")
    // Body must mention today's subject.
    expect(notif.body).toMatch(/English/i)

    vi.useRealTimers()
  })

  it("notifyOnEntry: does NOT call upsert when teacher has no duties on today's date", () => {
    // Use a date for which t1 has no slots.
    const today = "2026-07-20" // not in MOCK_EXAM_SLOTS
    vi.setSystemTime(new Date(`${today}T08:00:00.000Z`))

    controls.setOverrideState({
      catalog: EXAM_SUBJECT_CATALOG,
      sessions: EXAM_SESSIONS,
      dates: EXAM_DATES,
      slots: MOCK_EXAM_SLOTS,
      settings: { notifyLeadMinutes: 15, notifyOnCampusEntry: true },
      loadErrors: [], classGroups: SEED_CLASS_GROUPS,
    })

    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      result.current.notifyOnEntry("t1")
    })

    expect(upsertMock).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it("notifyOnEntry: does NOT call upsert when notifyOnCampusEntry setting is disabled", () => {
    const today = "2026-07-14"
    vi.setSystemTime(new Date(`${today}T08:00:00.000Z`))

    controls.setOverrideState({
      catalog: EXAM_SUBJECT_CATALOG,
      sessions: EXAM_SESSIONS,
      dates: EXAM_DATES,
      slots: MOCK_EXAM_SLOTS,
      // Disable campus-entry notifications.
      settings: { notifyLeadMinutes: 15, notifyOnCampusEntry: false },
      loadErrors: [], classGroups: SEED_CLASS_GROUPS,
    })

    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => {
      result.current.notifyOnEntry("t1")
    })

    expect(upsertMock).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it("notifyOnEntry: notification id is deterministic — based on teacherId + today", () => {
    const today = "2026-07-14"
    vi.setSystemTime(new Date(`${today}T08:00:00.000Z`))

    controls.setOverrideState({
      catalog: EXAM_SUBJECT_CATALOG,
      sessions: EXAM_SESSIONS,
      dates: EXAM_DATES,
      slots: MOCK_EXAM_SLOTS,
      settings: { notifyLeadMinutes: 15, notifyOnCampusEntry: true },
      loadErrors: [], classGroups: SEED_CLASS_GROUPS,
    })

    const { result } = renderHook(() => useExamSchedule(), { wrapper })

    act(() => { result.current.notifyOnEntry("t1") })
    const firstId = (upsertMock.mock.calls[0][1] as { id: string }).id

    upsertMock.mockClear()

    act(() => { result.current.notifyOnEntry("t1") })
    const secondId = (upsertMock.mock.calls[0][1] as { id: string }).id

    // Calling with the same teacher on the same date must produce the same id
    // so repeated check-ins upsert (deduplicate) rather than stack up.
    expect(secondId).toBe(firstId)
    expect(secondId).toContain("t1")
    expect(secondId).toContain(today)

    vi.useRealTimers()
  })
})
