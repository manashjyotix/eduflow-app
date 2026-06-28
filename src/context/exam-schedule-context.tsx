"use client"

/**
 * exam-schedule-context.tsx  (Feature: exam-routine-builder)
 *
 * The single State-Orchestration layer for the Exam Routine Builder. It holds
 * one in-memory {@link ExamRoutineState} object, initialised from the mock data
 * layer in `src/data/` with per-source validation (R12.1, R12.2), and exposes
 * every read value and mutating action consumers depend on. Decision logic
 * lives entirely in the pure functions under `src/lib/exam/`; this context is a
 * thin wrapper that:
 *
 *   1. routes every mutating action through `authorize(role, action)` so an
 *      unauthorized caller is rejected without mutating state (R10.5–10.7),
 *   2. calls the matching pure reducer and commits its result, and
 *   3. derives `conflicts` from the slot set via `detectConflicts` (`useMemo`)
 *      so the grid, duty roster, and read-only views all reflect identical
 *      state with no manual refresh (R12.4, R6.7).
 *
 * Consumers only ever see this interface, preserving the "swap the mock data
 * layer for a backend without touching consumers" seam (R12.5).
 *
 * Mounted in (app)/layout.tsx BELOW <NotificationProvider> and <RoleProvider>.
 */

import {
  createContext, useContext, useState, useMemo, useCallback, type ReactNode,
} from "react"
import {
  INITIAL_EXAM_ROUTINE_STATE, DEFAULT_EXAM_DUTY_SETTINGS,
  type CatalogSubject, type ExamSession, type ExamDate, type ExamSlot,
  type ExamDutySettings, type ExamRoutineState, type ClassGroup,
} from "@/data/mock-exams"
import { TEACHERS } from "@/data/teachers"
import { useNotifications } from "@/context/notification-context"
import { useRole } from "@/context/role-context"

import type { OpResult } from "@/lib/exam/types"
import { authorize, type ExamAction } from "@/lib/exam/access"
import {
  addSubject as catalogAddSubject,
  renameSubject as catalogRenameSubject,
  deleteSubject as catalogDeleteSubject,
  linkClass as catalogLinkClass,
  unlinkClass as catalogUnlinkClass,
  paletteForClass as catalogPaletteForClass,
} from "@/lib/exam/subject-catalog"
import {
  addSession as sessionsAdd,
  editSession as sessionsEdit,
  deleteSession as sessionsDelete,
  sessionHasSlots as sessionsHasSlots,
  type SessionDraft,
} from "@/lib/exam/sessions"
import {
  addExamDate as datesAdd,
  removeExamDate as datesRemove,
  dateHasSlots as datesHasSlots,
  sortedDates,
  isValidIsoDate,
} from "@/lib/exam/exam-dates"
import {
  slotAt, setSubject as slotSetSubject, clearSlot as slotClear,
  addInvigilatorToSlot, setRoom as slotSetRoom,
  moveSubject as slotMoveSubject, moveInvigilator as slotMoveInvigilator,
  type SlotCoord,
} from "@/lib/exam/slots"
import { detectConflicts, type Conflict } from "@/lib/exam/conflict-engine"
import { duplicateRoutine as dupRoutine, type DuplicationReport } from "@/lib/exam/duplication"
import {
  routineGenerator, type GenerationResult,
} from "@/lib/exam/ai-routine-generator"
import { buildDutyMessages, buildCampusEntryDigest } from "@/lib/exam/duty-notifications"

// ─────────────────────────────────────────────────────────────────────────────
// Result type for confirmable deletions (session / exam-date with slots).
// These are not pure-logic OpResults: "needs-confirmation" is a UI gate, not a
// validation failure, so it gets its own discriminated outcome.
// ─────────────────────────────────────────────────────────────────────────────

export type ConfirmableResult =
  | { ok: true }
  | { ok: false; reason: "unauthorized"; message: string }
  | { ok: false; reason: "needs-confirmation"; message: string }

// ─────────────────────────────────────────────────────────────────────────────
// Context value
// ─────────────────────────────────────────────────────────────────────────────

interface ExamScheduleContextValue {
  // ── State (read) ──
  catalog: CatalogSubject[]
  sessions: ExamSession[]
  /** Always exposed sorted ascending (R5.9, R4.1). */
  dates: ExamDate[]
  slots: ExamSlot[]
  settings: ExamDutySettings
  /** Derived from slots; recomputed on every change (R6.7). */
  conflicts: Conflict[]
  /** Names of data sources that failed to load (R12.2). */
  loadErrors: string[]
  /** Class groups with sections, sorted by order. Admin/management-configurable. */
  classGroups: ClassGroup[]

  // ── Class & section management (admin + management — manage-config) ──
  /** Returns an error string on failure, null on success. */
  addClassGroup: (name: string) => string | null
  renameClassGroup: (id: string, name: string) => string | null
  deleteClassGroup: (id: string) => void
  addSection: (groupId: string, section: string) => string | null
  removeSection: (groupId: string, section: string) => void

  // ── Subject catalog (admin only — manage-config) ──
  addSubject: (raw: string) => OpResult<CatalogSubject[]>
  renameSubject: (id: string, raw: string) => OpResult<CatalogSubject[]>
  deleteSubject: (id: string) => OpResult<CatalogSubject[]>
  linkClass: (id: string, classId: string) => OpResult<CatalogSubject[]>
  unlinkClass: (id: string, classId: string) => OpResult<CatalogSubject[]>

  // ── Sessions (admin only — manage-config) ──
  addSession: (draft: SessionDraft) => OpResult<ExamSession[]>
  editSession: (id: string, draft: SessionDraft) => OpResult<ExamSession[]>
  /** Deletes a session and its slots. When the session has slots, `confirm` must be true. */
  deleteSession: (id: string, confirm?: boolean) => ConfirmableResult
  sessionHasSlots: (id: string) => boolean

  // ── Exam dates (admin only — manage-config) ──
  addExamDate: (date: string) => OpResult<ExamDate[]>
  /** Removes a date and its slots. When the date has slots, `confirm` must be true. */
  removeExamDate: (date: string, confirm?: boolean) => ConfirmableResult
  dateHasSlots: (date: string) => boolean

  // ── Grid build (admin + management — build) ──
  setSubject: (coord: SlotCoord, subject: string) => OpResult<ExamSlot[]>
  clearSlot: (coord: SlotCoord) => OpResult<ExamSlot[]>
  setRoom: (coord: SlotCoord, room: string | undefined) => OpResult<ExamSlot[]>
  addInvigilator: (coord: SlotCoord, teacherId: string) => OpResult<ExamSlot[]>
  removeInvigilator: (coord: SlotCoord, teacherId: string) => OpResult<ExamSlot[]>
  moveSubject: (from: SlotCoord, to: SlotCoord) => OpResult<ExamSlot[]>
  moveInvigilator: (from: SlotCoord, to: SlotCoord, teacherId: string) => OpResult<ExamSlot[]>

  // ── Bulk + AI ──
  duplicateRoutine: (sourceClassId: string, targetClassIds: string[]) => OpResult<DuplicationReport>
  generateRoutine: (mode: "full-draft" | "suggest-invigilators") => OpResult<GenerationResult>

  // ── Notifications + settings ──
  notifyDuties: () => { sent: number; skipped: number }
  notifyOnEntry: (teacherId: string) => void
  updateSettings: (patch: Partial<ExamDutySettings>) => void

  // ── Helpers ──
  slotFor: (coord: SlotCoord) => ExamSlot | undefined
  paletteForClass: (classId: string) => CatalogSubject[]
  /** True when the current role may build/edit routines (admin + management). */
  canEdit: boolean
  /** True when the current role may manage the catalog/sessions/dates (admin). */
  canManageConfig: boolean
}

const ExamScheduleContext = createContext<ExamScheduleContextValue | null>(null)

// ─────────────────────────────────────────────────────────────────────────────
// Initial-state loading with per-source validation (R12.1, R12.2)
// ─────────────────────────────────────────────────────────────────────────────

function isCatalogSubject(x: unknown): x is CatalogSubject {
  if (typeof x !== "object" || x === null) return false
  const s = x as Record<string, unknown>
  return typeof s.id === "string" && typeof s.name === "string" && Array.isArray(s.linkedClassIds)
}

function isExamSession(x: unknown): x is ExamSession {
  if (typeof x !== "object" || x === null) return false
  const s = x as Record<string, unknown>
  return (
    typeof s.id === "string" && typeof s.name === "string" &&
    typeof s.startTime === "string" && typeof s.endTime === "string"
  )
}

function isExamSlot(x: unknown): x is ExamSlot {
  if (typeof x !== "object" || x === null) return false
  const s = x as Record<string, unknown>
  return (
    typeof s.id === "string" && typeof s.classId === "string" &&
    typeof s.date === "string" && typeof s.sessionId === "string" &&
    Array.isArray(s.invigilatorIds)
  )
}

function isExamDutySettings(x: unknown): x is ExamDutySettings {
  if (typeof x !== "object" || x === null) return false
  const s = x as Record<string, unknown>
  return typeof s.notifyLeadMinutes === "number" && typeof s.notifyOnCampusEntry === "boolean"
}

/**
 * Validate one data-source slice. On any failure, push a descriptive entry into
 * `errors` and return an empty array so the grid renders empty instead of
 * crashing (R12.2).
 */
function loadSlice<T>(
  label: string,
  errors: string[],
  raw: unknown,
  guard: (x: unknown) => x is T,
): T[] {
  try {
    if (!Array.isArray(raw) || !raw.every(guard)) {
      throw new Error("invalid shape")
    }
    return raw as T[]
  } catch {
    errors.push(`${label} failed to load — showing an empty set.`)
    return []
  }
}

function isClassGroup(x: unknown): x is ClassGroup {
  if (typeof x !== "object" || x === null) return false
  const s = x as Record<string, unknown>
  return (
    typeof s.id === "string" && typeof s.name === "string" &&
    Array.isArray(s.sections) && s.sections.every((sec: unknown) => typeof sec === "string") &&
    typeof s.order === "number"
  )
}

/** Build the initial in-memory state from the mock data layer, validating each source. */
function buildInitialState(): ExamRoutineState {
  const loadErrors: string[] = []
  const source = INITIAL_EXAM_ROUTINE_STATE as Partial<ExamRoutineState> | undefined

  const catalog = loadSlice<CatalogSubject>("Subject catalog", loadErrors, source?.catalog, isCatalogSubject)
  const sessions = loadSlice<ExamSession>("Sessions", loadErrors, source?.sessions, isExamSession)
  const slots = loadSlice<ExamSlot>("Exam slots", loadErrors, source?.slots, isExamSlot)
  const classGroups = loadSlice<ClassGroup>("Classes", loadErrors, source?.classGroups, isClassGroup)

  // Exam dates: an array of valid ISO calendar-date strings.
  const dates = loadSlice<ExamDate>(
    "Exam dates", loadErrors, source?.dates,
    (x): x is ExamDate => typeof x === "string" && isValidIsoDate(x),
  )

  // Settings are not a list; fall back to the default on any malformed value.
  const settings = isExamDutySettings(source?.settings)
    ? (source!.settings as ExamDutySettings)
    : { ...DEFAULT_EXAM_DUTY_SETTINGS }

  return { catalog, sessions, dates, slots, settings, classGroups, loadErrors }
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function ExamScheduleProvider({ children }: { children: ReactNode }) {
  const { role } = useRole()
  const { upsert } = useNotifications()
  const [state, setState] = useState<ExamRoutineState>(buildInitialState)

  // Authorization helper: produces the standard unauthorized OpResult.
  const unauthorized = useCallback(
    <T,>(): OpResult<T> => ({
      ok: false,
      error: "unauthorized",
      message: "You are not authorized to perform this action.",
    }),
    [],
  )

  const can = useCallback((action: ExamAction) => authorize(role, action), [role])

  // Derived conflict set — recomputed only when slots change (R6.7, R12.4).
  const conflicts = useMemo(() => detectConflicts(state.slots), [state.slots])

  // Dates are always exposed sorted ascending (R4.1, R5.9).
  const dates = useMemo(() => sortedDates(state.dates), [state.dates])

  // Sorted class groups
  const classGroups = useMemo(
    () => [...state.classGroups].sort((a, b) => a.order - b.order),
    [state.classGroups],
  )

  // ── Class group actions (manage-config) ──

  const addClassGroup = useCallback((name: string): string | null => {
    if (!can("manage-config")) return "You are not authorized to manage classes."
    const trimmed = name.trim()
    if (!trimmed) return "Class name is required."
    if (trimmed.length > 80) return "Class name must be at most 80 characters."
    if (state.classGroups.some(g => g.name.toLowerCase() === trimmed.toLowerCase())) {
      return `A class named "${trimmed}" already exists.`
    }
    const id = `class-${trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${Date.now()}`
    const order = state.classGroups.length
    const newGroup: ClassGroup = { id, name: trimmed, sections: ["A"], order }
    setState(prev => ({ ...prev, classGroups: [...prev.classGroups, newGroup] }))
    return null
  }, [can, state.classGroups])

  const renameClassGroup = useCallback((id: string, name: string): string | null => {
    if (!can("manage-config")) return "You are not authorized to manage classes."
    const trimmed = name.trim()
    if (!trimmed) return "Class name is required."
    if (trimmed.length > 80) return "Class name must be at most 80 characters."
    if (state.classGroups.some(g => g.id !== id && g.name.toLowerCase() === trimmed.toLowerCase())) {
      return `A class named "${trimmed}" already exists.`
    }
    setState(prev => ({
      ...prev,
      classGroups: prev.classGroups.map(g => g.id === id ? { ...g, name: trimmed } : g),
    }))
    return null
  }, [can, state.classGroups])

  const deleteClassGroup = useCallback((id: string): void => {
    if (!can("manage-config")) return
    // Remove the class and all its slots
    setState(prev => ({
      ...prev,
      classGroups: prev.classGroups.filter(g => g.id !== id),
      slots: prev.slots.filter(s => s.classId !== id),
    }))
  }, [can])

  const addSection = useCallback((groupId: string, section: string): string | null => {
    if (!can("manage-config")) return "You are not authorized to manage sections."
    const trimmed = section.trim()
    if (!trimmed) return "Section label is required."
    if (trimmed.length > 10) return "Section label must be at most 10 characters."
    const group = state.classGroups.find(g => g.id === groupId)
    if (!group) return "Class not found."
    if (group.sections.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
      return `Section "${trimmed}" already exists in this class.`
    }
    setState(prev => ({
      ...prev,
      classGroups: prev.classGroups.map(g =>
        g.id === groupId ? { ...g, sections: [...g.sections, trimmed] } : g,
      ),
    }))
    return null
  }, [can, state.classGroups])

  const removeSection = useCallback((groupId: string, section: string): void => {
    if (!can("manage-config")) return
    setState(prev => ({
      ...prev,
      classGroups: prev.classGroups.map(g =>
        g.id === groupId
          ? { ...g, sections: g.sections.filter(s => s !== section) }
          : g,
      ),
    }))
  }, [can])

  // Map a Session id → its human-readable name for notification copy. The duty
  // messages carry the Session id (the design's `DutyMessage` field for the
  // Session); this only turns that id into a friendly label, it does not
  // re-derive any duty logic.
  const sessionNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of state.sessions) map.set(s.id, s.name)
    return map
  }, [state.sessions])

  // ── Subject catalog actions (manage-config) ──

  const addSubject = useCallback((raw: string): OpResult<CatalogSubject[]> => {
    if (!can("manage-config")) return unauthorized()
    const res = catalogAddSubject(state.catalog, raw)
    if (res.ok) setState(prev => ({ ...prev, catalog: res.value }))
    return res
  }, [can, unauthorized, state.catalog])

  const renameSubject = useCallback((id: string, raw: string): OpResult<CatalogSubject[]> => {
    if (!can("manage-config")) return unauthorized()
    const res = catalogRenameSubject(state.catalog, id, raw)
    if (res.ok) setState(prev => ({ ...prev, catalog: res.value }))
    return res
  }, [can, unauthorized, state.catalog])

  const deleteSubject = useCallback((id: string): OpResult<CatalogSubject[]> => {
    if (!can("manage-config")) return unauthorized()
    const next = catalogDeleteSubject(state.catalog, id)
    setState(prev => ({ ...prev, catalog: next }))
    return { ok: true, value: next }
  }, [can, unauthorized, state.catalog])

  const linkClass = useCallback((id: string, classId: string): OpResult<CatalogSubject[]> => {
    if (!can("manage-config")) return unauthorized()
    const res = catalogLinkClass(state.catalog, id, classId)
    if (res.ok) setState(prev => ({ ...prev, catalog: res.value }))
    return res
  }, [can, unauthorized, state.catalog])

  const unlinkClass = useCallback((id: string, classId: string): OpResult<CatalogSubject[]> => {
    if (!can("manage-config")) return unauthorized()
    const res = catalogUnlinkClass(state.catalog, id, classId)
    if (res.ok) setState(prev => ({ ...prev, catalog: res.value }))
    return res
  }, [can, unauthorized, state.catalog])

  // ── Session actions (manage-config) ──

  const addSession = useCallback((draft: SessionDraft): OpResult<ExamSession[]> => {
    if (!can("manage-config")) return unauthorized()
    const res = sessionsAdd(state.sessions, draft)
    if (res.ok) setState(prev => ({ ...prev, sessions: res.value }))
    return res
  }, [can, unauthorized, state.sessions])

  const editSession = useCallback((id: string, draft: SessionDraft): OpResult<ExamSession[]> => {
    if (!can("manage-config")) return unauthorized()
    const res = sessionsEdit(state.sessions, id, draft)
    if (res.ok) setState(prev => ({ ...prev, sessions: res.value }))
    return res
  }, [can, unauthorized, state.sessions])

  const sessionHasSlots = useCallback(
    (id: string) => sessionsHasSlots(state.slots, id),
    [state.slots],
  )

  const deleteSession = useCallback((id: string, confirm = false): ConfirmableResult => {
    if (!can("manage-config")) {
      return { ok: false, reason: "unauthorized", message: "You are not authorized to manage sessions." }
    }
    if (sessionsHasSlots(state.slots, id) && !confirm) {
      return {
        ok: false,
        reason: "needs-confirmation",
        message: "This session has scheduled slots. Confirm to delete the session and its slots.",
      }
    }
    const next = sessionsDelete(state.sessions, state.slots, id)
    setState(prev => ({ ...prev, sessions: next.sessions, slots: next.slots }))
    return { ok: true }
  }, [can, state.sessions, state.slots])

  // ── Exam-date actions (manage-config) ──

  const addExamDate = useCallback((date: string): OpResult<ExamDate[]> => {
    if (!can("manage-config")) return unauthorized()
    const res = datesAdd(state.dates, date)
    if (res.ok) setState(prev => ({ ...prev, dates: res.value }))
    return res
  }, [can, unauthorized, state.dates])

  const dateHasSlots = useCallback(
    (date: string) => datesHasSlots(state.slots, date),
    [state.slots],
  )

  const removeExamDate = useCallback((date: string, confirm = false): ConfirmableResult => {
    if (!can("manage-config")) {
      return { ok: false, reason: "unauthorized", message: "You are not authorized to manage exam dates." }
    }
    if (datesHasSlots(state.slots, date) && !confirm) {
      return {
        ok: false,
        reason: "needs-confirmation",
        message: "This date has scheduled slots. Confirm to remove the date and its slots.",
      }
    }
    const next = datesRemove(state.dates, state.slots, date)
    setState(prev => ({ ...prev, dates: next.dates, slots: next.slots }))
    return { ok: true }
  }, [can, state.dates, state.slots])

  // ── Grid build actions (build) ──

  const setSubject = useCallback((coord: SlotCoord, subject: string): OpResult<ExamSlot[]> => {
    if (!can("build")) return unauthorized()
    const res = slotSetSubject(state.slots, coord, subject, state.catalog)
    if (res.ok) setState(prev => ({ ...prev, slots: res.value }))
    return res
  }, [can, unauthorized, state.slots, state.catalog])

  const clearSlot = useCallback((coord: SlotCoord): OpResult<ExamSlot[]> => {
    if (!can("build")) return unauthorized()
    const next = slotClear(state.slots, coord)
    setState(prev => ({ ...prev, slots: next }))
    return { ok: true, value: next }
  }, [can, unauthorized, state.slots])

  const setRoom = useCallback((coord: SlotCoord, room: string | undefined): OpResult<ExamSlot[]> => {
    if (!can("build")) return unauthorized()
    const next = slotSetRoom(state.slots, coord, room)
    setState(prev => ({ ...prev, slots: next }))
    return { ok: true, value: next }
  }, [can, unauthorized, state.slots])

  const addInvigilator = useCallback((coord: SlotCoord, teacherId: string): OpResult<ExamSlot[]> => {
    if (!can("build")) return unauthorized()
    const res = addInvigilatorToSlot(state.slots, coord, teacherId)
    if (res.ok) setState(prev => ({ ...prev, slots: res.value }))
    return res
  }, [can, unauthorized, state.slots])

  const removeInvigilator = useCallback((coord: SlotCoord, teacherId: string): OpResult<ExamSlot[]> => {
    if (!can("build")) return unauthorized()
    const existing = slotAt(state.slots, coord)
    if (!existing || !existing.invigilatorIds.includes(teacherId)) {
      // Nothing to remove — no-op success, state unchanged.
      return { ok: true, value: state.slots }
    }
    const next = state.slots.map(s =>
      s === existing ? { ...s, invigilatorIds: s.invigilatorIds.filter(id => id !== teacherId) } : s,
    )
    setState(prev => ({ ...prev, slots: next }))
    return { ok: true, value: next }
  }, [can, unauthorized, state.slots])

  const moveSubject = useCallback((from: SlotCoord, to: SlotCoord): OpResult<ExamSlot[]> => {
    if (!can("build")) return unauthorized()
    const res = slotMoveSubject(state.slots, from, to, state.catalog)
    if (res.ok) setState(prev => ({ ...prev, slots: res.value }))
    return res
  }, [can, unauthorized, state.slots, state.catalog])

  const moveInvigilator = useCallback((from: SlotCoord, to: SlotCoord, teacherId: string): OpResult<ExamSlot[]> => {
    if (!can("build")) return unauthorized()
    const res = slotMoveInvigilator(state.slots, from, to, teacherId)
    if (res.ok) setState(prev => ({ ...prev, slots: res.value }))
    return res
  }, [can, unauthorized, state.slots])

  // ── Bulk + AI ──

  const duplicateRoutine = useCallback(
    (sourceClassId: string, targetClassIds: string[]): OpResult<DuplicationReport> => {
      if (!can("build")) return unauthorized()
      const res = dupRoutine(state.slots, sourceClassId, targetClassIds, state.catalog)
      if (!res.ok) return res
      setState(prev => ({ ...prev, slots: res.value.slots }))
      return { ok: true, value: res.value.report }
    },
    [can, unauthorized, state.slots, state.catalog],
  )

  const generateRoutine = useCallback(
    (mode: "full-draft" | "suggest-invigilators"): OpResult<GenerationResult> => {
      if (!can("build")) return unauthorized()
      const res = routineGenerator.generate({
        catalog: state.catalog,
        classIds: [...new Set(state.catalog.flatMap(s => s.linkedClassIds))],
        dates: state.dates,
        sessions: state.sessions,
        teachers: TEACHERS,
        existingSlots: state.slots,
        mode,
      })
      if (!res.ok) return res
      setState(prev => ({ ...prev, slots: res.value.slots }))
      return res
    },
    [can, unauthorized, state.catalog, state.dates, state.sessions, state.slots],
  )

  // ── Notifications + settings ──

  const notifyDuties = useCallback((): { sent: number; skipped: number } => {
    if (!can("build")) return { sent: 0, skipped: 0 }
    const { messages, skipped } = buildDutyMessages(state.slots, state.sessions, state.settings)
    for (const m of messages) {
      const teacher = TEACHERS.find(t => t.id === m.teacherId)
      const sessionName = sessionNameById.get(m.sessionId) ?? m.sessionId
      const roomPart = m.room ? `, ${m.room}` : ""
      // Body reads entirely from the DutyMessage fields produced by
      // buildDutyMessages (subject, date, sessionStartTime, room, leadMinutes)
      // so the pure logic stays the single source. The notification carries the
      // assignment's Class (classId), subject, Exam_Date, Session (name +
      // start time), the room only when present, and the lead time (R11.1, R11.5).
      upsert("staff", {
        id: `exam-duty-${m.classId}-${m.date}-${m.sessionId}-${m.teacherId}`,
        type: "exam_duty",
        title: `Exam invigilation duty — ${m.classId}`,
        body: `${teacher?.name ?? m.teacherId}: ${m.subject} for ${m.classId} on ${m.date}, ` +
          `${sessionName} session (starts ${m.sessionStartTime})${roomPart}. ` +
          `You'll be reminded ${m.leadMinutes} min before${state.settings.notifyOnCampusEntry ? " (and on campus check-in)" : ""}.`,
        actionHref: "/teacher/dashboard",
      })
    }
    return { sent: messages.length, skipped }
  }, [can, state.slots, state.sessions, state.settings, sessionNameById, upsert])

  const notifyOnEntry = useCallback((teacherId: string) => {
    if (!state.settings.notifyOnCampusEntry) return
    const today = new Date().toISOString().slice(0, 10)
    const digest = buildCampusEntryDigest(teacherId, today, state.slots, state.sessions, state.settings)
    if (!digest || digest.length === 0) return
    const teacher = TEACHERS.find(t => t.id === teacherId)
    // Single digest listing every duty for the current date, already ordered by
    // Session start time by buildCampusEntryDigest (R11.3). Each entry surfaces
    // the Class, subject, Session (name + start time), and room when present;
    // the configured lead time is embedded in the message text (R11.5).
    const leadMinutes = digest[0].leadMinutes
    upsert("staff", {
      id: `exam-duty-entry-${teacherId}-${today}`,
      type: "exam_duty",
      title: "Campus check-in — your exam duty today",
      body: `${teacher?.name ?? teacherId}, you have ${digest.length} invigilation dut${digest.length > 1 ? "ies" : "y"} today: ` +
        digest.map(d => {
          const sessionName = sessionNameById.get(d.sessionId) ?? d.sessionId
          return `${d.classId} ${d.subject} — ${sessionName} session (starts ${d.sessionStartTime})${d.room ? ` (${d.room})` : ""}`
        }).join(", ") +
        `. Reminders go out ${leadMinutes} min before each session.`,
      actionHref: "/teacher/dashboard",
    })
  }, [state.settings, state.slots, state.sessions, sessionNameById, upsert])

  const updateSettings = useCallback((patch: Partial<ExamDutySettings>) => {
    if (!can("build")) return
    setState(prev => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [can])

  // ── Helpers ──

  const slotFor = useCallback((coord: SlotCoord) => slotAt(state.slots, coord), [state.slots])

  const paletteForClass = useCallback(
    (classId: string) => catalogPaletteForClass(state.catalog, classId),
    [state.catalog],
  )

  const canEdit = can("build")
  const canManageConfig = can("manage-config")

  const value: ExamScheduleContextValue = useMemo(
    () => ({
      catalog: state.catalog,
      sessions: state.sessions,
      dates,
      slots: state.slots,
      settings: state.settings,
      conflicts,
      loadErrors: state.loadErrors,
      classGroups,
      addClassGroup, renameClassGroup, deleteClassGroup, addSection, removeSection,
      addSubject, renameSubject, deleteSubject, linkClass, unlinkClass,
      addSession, editSession, deleteSession, sessionHasSlots,
      addExamDate, removeExamDate, dateHasSlots,
      setSubject, clearSlot, setRoom, addInvigilator, removeInvigilator,
      moveSubject, moveInvigilator,
      duplicateRoutine, generateRoutine,
      notifyDuties, notifyOnEntry, updateSettings,
      slotFor, paletteForClass, canEdit, canManageConfig,
    }),
    [
      state.catalog, state.sessions, dates, state.slots, state.settings,
      conflicts, state.loadErrors, classGroups,
      addClassGroup, renameClassGroup, deleteClassGroup, addSection, removeSection,
      addSubject, renameSubject, deleteSubject, linkClass, unlinkClass,
      addSession, editSession, deleteSession, sessionHasSlots,
      addExamDate, removeExamDate, dateHasSlots,
      setSubject, clearSlot, setRoom, addInvigilator, removeInvigilator,
      moveSubject, moveInvigilator,
      duplicateRoutine, generateRoutine,
      notifyDuties, notifyOnEntry, updateSettings,
      slotFor, paletteForClass, canEdit, canManageConfig,
    ],
  )

  return <ExamScheduleContext.Provider value={value}>{children}</ExamScheduleContext.Provider>
}

export function useExamSchedule(): ExamScheduleContextValue {
  const ctx = useContext(ExamScheduleContext)
  if (!ctx) throw new Error("useExamSchedule must be used inside <ExamScheduleProvider>")
  return ctx
}
