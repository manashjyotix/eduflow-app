/**
 * ai-routine-generator.ts  (Feature: exam-routine-builder)
 *
 * The AI Routine Builder's pure-logic core. It produces a first-draft exam
 * routine (or suggests invigilators for an existing one) behind a single
 * swappable interface — the {@link RoutineGenerator} seam (R9.7) — so a future
 * language-model implementation can replace the deterministic heuristic without
 * touching callers.
 *
 * The shipped implementation, {@link HeuristicRoutineGenerator}, is **fully
 * deterministic**: it sorts classes, subjects, dates, sessions, and teachers by
 * stable keys (identifier / start time) and walks them in a fixed order. There
 * is no randomness, no clock, and no iteration over unordered structures, so
 * identical input always yields identical output (R9.6).
 *
 * Heuristic summary:
 *   - full-draft: for each class, place each linked subject into a slot, at most
 *     one subject per class per Exam_Date (R9.2), spread across the available
 *     dates+sessions; subjects that do not fit are left unplaced and counted per
 *     class (R9.10).
 *   - Invigilators are assigned by always choosing the eligible ACTIVE teacher
 *     with the lowest current duty count (tie-break by teacher id), which yields
 *     a max−min duty spread of ≤ 1 (R9.4) and never double-books a teacher in the
 *     same date+session (R9.3). Slots that cannot be covered are left without an
 *     invigilator and counted (R9.8).
 *   - suggest-invigilators: only fills subject-bearing slots that have no
 *     invigilator, never changing existing subjects or invigilators (R9.5).
 *   - Rejects with `missing-dates` / `missing-sessions` when no dates or no
 *     sessions are configured (R9.9).
 *
 * Every function here is pure and side-effect-free — this is a property-test
 * surface.
 *
 * _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10_
 */

import type { CatalogSubject, ExamSession, ExamSlot } from "@/data/mock-exams"
import type { Teacher } from "@/data/teachers"
import type { OpResult } from "@/lib/exam/types"
import { slotKey, type SlotCoord } from "@/lib/exam/slots"
import { paletteForClass } from "@/lib/exam/subject-catalog"

/** The inputs the generator needs to build (or augment) a routine. */
export interface GenerationInput {
  catalog: CatalogSubject[]
  classIds: string[]
  dates: string[]
  sessions: ExamSession[]
  teachers: Teacher[]
  existingSlots: ExamSlot[]
  mode: "full-draft" | "suggest-invigilators"
}

/** The outcome of a generation run. */
export interface GenerationResult {
  /** The resulting slot set (a fresh draft for full-draft; the augmented set for suggest). */
  slots: ExamSlot[]
  /** Subject-bearing slots left without an invigilator (R9.8). */
  uncoveredSlotCount: number
  /** Per-class count of subjects that could not be placed (R9.10). */
  unplacedSubjectsByClass: Record<string, number>
}

/**
 * The single swappable generation seam (R9.7). The deterministic heuristic
 * below implements it; a future LLM-backed generator can implement the same
 * interface and be dropped in without changing callers.
 */
export interface RoutineGenerator {
  generate(input: GenerationInput): OpResult<GenerationResult>
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic ordering helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Classes ordered by identifier ascending. */
function sortedClassIds(classIds: string[]): string[] {
  return [...classIds].sort((a, b) => a.localeCompare(b))
}

/** Dates ordered earliest → latest (ISO strings sort lexicographically). */
function sortedDates(dates: string[]): string[] {
  return [...dates].sort((a, b) => a.localeCompare(b))
}

/** Sessions ordered by start time ascending, then by id for a stable tie-break. */
function sortedSessions(sessions: ExamSession[]): ExamSession[] {
  return [...sessions].sort(
    (a, b) => a.startTime.localeCompare(b.startTime) || a.id.localeCompare(b.id),
  )
}

/** A class's subjects ordered by name then id — the deterministic placement order. */
function subjectsForClass(catalog: CatalogSubject[], classId: string): CatalogSubject[] {
  return [...paletteForClass(catalog, classId)].sort(
    (a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id),
  )
}

/** Active teachers ordered by id — the eligible invigilator pool (R9.4). */
function activeTeachersById(teachers: Teacher[]): Teacher[] {
  return teachers
    .filter(t => t.status === "active")
    .sort((a, b) => a.id.localeCompare(b.id))
}

/** Deterministic id for a generated slot, derived from its coordinate. */
function makeSlotId(c: SlotCoord): string {
  return `es-${slotKey(c)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Invigilator assignment (shared by both modes)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Greedily assign one invigilator to each subject-bearing slot that still needs
 * one, mutating the provided `slots` (already cloned by the caller).
 *
 * For each slot, in deterministic order, the eligible active teacher with the
 * lowest running duty count is chosen (ties broken by teacher id), skipping any
 * teacher already on duty in the same date+session (R9.3). Lowest-count-first
 * selection keeps the max−min duty spread to ≤ 1 (R9.4). Slots for which no
 * eligible teacher is available are left uncovered and counted (R9.8).
 *
 * `dutyCount` is seeded by the caller with any pre-existing duties so suggest
 * mode balances on top of the current assignments.
 *
 * Returns the number of slots left uncovered.
 */
function assignInvigilators(
  slots: ExamSlot[],
  slotsToFill: ExamSlot[],
  activeTeachers: Teacher[],
  dutyCount: Map<string, number>,
): number {
  // Track which teachers are already booked in each (date, sessionId) bucket so
  // we never double-book within a session.
  const bookedBySession = new Map<string, Set<string>>()
  for (const slot of slots) {
    if (slot.invigilatorIds.length === 0) continue
    const bucket = `${slot.date}__${slot.sessionId}`
    let set = bookedBySession.get(bucket)
    if (!set) {
      set = new Set()
      bookedBySession.set(bucket, set)
    }
    for (const id of slot.invigilatorIds) set.add(id)
  }

  let uncovered = 0

  for (const slot of slotsToFill) {
    const bucket = `${slot.date}__${slot.sessionId}`
    let booked = bookedBySession.get(bucket)
    if (!booked) {
      booked = new Set()
      bookedBySession.set(bucket, booked)
    }

    // Eligible = active, not already booked this date+session.
    let chosen: Teacher | undefined
    let chosenDuty = Number.POSITIVE_INFINITY
    for (const teacher of activeTeachers) {
      if (booked.has(teacher.id)) continue
      const duty = dutyCount.get(teacher.id) ?? 0
      if (duty < chosenDuty) {
        chosen = teacher
        chosenDuty = duty
      }
    }

    if (!chosen) {
      uncovered++
      continue
    }

    slot.invigilatorIds = [...slot.invigilatorIds, chosen.id]
    booked.add(chosen.id)
    dutyCount.set(chosen.id, (dutyCount.get(chosen.id) ?? 0) + 1)
  }

  return uncovered
}

// ─────────────────────────────────────────────────────────────────────────────
// The deterministic heuristic implementation
// ─────────────────────────────────────────────────────────────────────────────

export class HeuristicRoutineGenerator implements RoutineGenerator {
  generate(input: GenerationInput): OpResult<GenerationResult> {
    // Reject when configuration is missing — no dates or no sessions (R9.9).
    if (input.dates.length === 0) {
      return {
        ok: false,
        error: "missing-dates",
        message: "Cannot generate a routine: no exam dates are configured.",
      }
    }
    if (input.sessions.length === 0) {
      return {
        ok: false,
        error: "missing-sessions",
        message: "Cannot generate a routine: no sessions are configured.",
      }
    }

    const activeTeachers = activeTeachersById(input.teachers)

    return input.mode === "suggest-invigilators"
      ? this.suggestInvigilators(input, activeTeachers)
      : this.fullDraft(input, activeTeachers)
  }

  /**
   * full-draft: build a fresh routine. For each class (ordered by id), place its
   * linked subjects (ordered by name) one per Exam_Date (R9.2) across the
   * date/session axis, then assign invigilators (R9.1, R9.3, R9.4). Subjects
   * that exceed the one-per-date capacity are left unplaced and counted (R9.10);
   * slots that cannot be covered are counted (R9.8).
   */
  private fullDraft(
    input: GenerationInput,
    activeTeachers: Teacher[],
  ): OpResult<GenerationResult> {
    const classIds = sortedClassIds(input.classIds)
    const dates = sortedDates(input.dates)
    const sessions = sortedSessions(input.sessions)

    const slots: ExamSlot[] = []
    const unplacedSubjectsByClass: Record<string, number> = {}

    for (const classId of classIds) {
      const subjects = subjectsForClass(input.catalog, classId)

      // Capacity under one-subject-per-class-per-date: at most one paper per
      // date, so at most `dates.length` subjects fit per class.
      subjects.forEach((subject, index) => {
        if (index >= dates.length) return // overflow handled below
        const date = dates[index]
        // Spread papers across sessions deterministically.
        const session = sessions[index % sessions.length]
        const coord: SlotCoord = { classId, date, sessionId: session.id }
        slots.push({
          id: makeSlotId(coord),
          classId,
          date,
          sessionId: session.id,
          subject: subject.name,
          invigilatorIds: [],
        })
      })

      const unplaced = subjects.length - Math.min(subjects.length, dates.length)
      if (unplaced > 0) unplacedSubjectsByClass[classId] = unplaced
    }

    // Assign invigilators to every subject-bearing slot, in deterministic order.
    const orderedSlots = orderSlots(slots, sessions)
    const dutyCount = new Map<string, number>()
    const uncoveredSlotCount = assignInvigilators(slots, orderedSlots, activeTeachers, dutyCount)

    return {
      ok: true,
      value: { slots, uncoveredSlotCount, unplacedSubjectsByClass },
    }
  }

  /**
   * suggest-invigilators: keep all existing slots, subjects, and invigilators
   * untouched; only fill subject-bearing slots that currently have no
   * invigilator (R9.5). Duty balancing seeds from the existing assignments.
   */
  private suggestInvigilators(
    input: GenerationInput,
    activeTeachers: Teacher[],
  ): OpResult<GenerationResult> {
    const sessions = sortedSessions(input.sessions)

    // Clone slots so the operation stays pure (no mutation of caller's array).
    const slots: ExamSlot[] = input.existingSlots.map(s => ({
      ...s,
      invigilatorIds: [...s.invigilatorIds],
    }))

    // Seed duty counts from existing active-teacher assignments so we balance on
    // top of the current routine (R9.4).
    const dutyCount = new Map<string, number>()
    const activeIds = new Set(activeTeachers.map(t => t.id))
    for (const slot of slots) {
      for (const id of slot.invigilatorIds) {
        if (activeIds.has(id)) dutyCount.set(id, (dutyCount.get(id) ?? 0) + 1)
      }
    }

    // Only subject-bearing slots with no invigilator are candidates.
    const slotsToFill = orderSlots(
      slots.filter(s => s.subject && s.invigilatorIds.length === 0),
      sessions,
    )

    const uncoveredSlotCount = assignInvigilators(slots, slotsToFill, activeTeachers, dutyCount)

    return {
      ok: true,
      value: { slots, uncoveredSlotCount, unplacedSubjectsByClass: {} },
    }
  }
}

/**
 * Order slots deterministically by date ascending, then session start time
 * ascending, then class id — the fixed traversal used for invigilator
 * assignment so the result is reproducible (R9.6).
 */
function orderSlots(slots: ExamSlot[], sessions: ExamSession[]): ExamSlot[] {
  const sessionStart = new Map(sessions.map(s => [s.id, s.startTime]))
  return [...slots].sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (sessionStart.get(a.sessionId) ?? "").localeCompare(sessionStart.get(b.sessionId) ?? "") ||
      a.sessionId.localeCompare(b.sessionId) ||
      a.classId.localeCompare(b.classId),
  )
}

/**
 * The shared generator instance used by the context and views. Swapping in a
 * different {@link RoutineGenerator} (e.g. an LLM-backed one) requires changing
 * only this binding (R9.7).
 */
export const routineGenerator: RoutineGenerator = new HeuristicRoutineGenerator()
