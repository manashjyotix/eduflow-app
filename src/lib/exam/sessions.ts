/**
 * sessions.ts  (Feature F4 — Exam Routine Builder)
 *
 * Pure, side-effect-free logic for school-defined named Sessions. A Session is
 * a named time block with a start and end time in 24-hour HH:MM form, where the
 * end time is strictly later than the start time. Sessions form the second part
 * of the routine's column axis (Exam_Date × Session); Exam_Slots reference a
 * Session by `sessionId`, so editing a Session's fields automatically flows
 * through to every referencing slot (R3.6).
 *
 * Name validation mirrors the Subject_Catalog rules: the name is trimmed, must
 * be 1..100 characters, and must be unique case-insensitively against the other
 * Sessions (required-name / name-too-long / duplicate-name).
 *
 * No React, no I/O — this is the property-test surface.
 *
 * _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9_
 */

import type { ExamSession, ExamSlot } from "@/data/mock-exams"
import type { OpResult } from "@/lib/exam/types"

/** Maximum allowed length of a trimmed Session name. */
const MAX_NAME_LENGTH = 100

/** A draft Session — the editable fields supplied by the caller. */
export interface SessionDraft {
  name: string
  startTime: string
  endTime: string
}

/** Trim surrounding whitespace from a raw name. */
function normalizeName(raw: string): string {
  return raw.trim()
}

/**
 * Parse an "HH:MM" 24-hour time string into minutes since midnight.
 *
 * Returns `null` when the input is not a strictly-formatted 24-hour time:
 * exactly two digits for hours (00–23), a colon, then exactly two digits for
 * minutes (00–59). Anything else (missing colon, out-of-range, extra
 * characters, single-digit fields) is rejected.
 */
export function parseHHMM(s: string): number | null {
  const match = /^([0-9]{2}):([0-9]{2})$/.exec(s)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

/**
 * Validate a draft Session against the other Sessions.
 *
 * Pass `ignoreId` when editing so the Session being edited is excluded from the
 * duplicate-name check. Validation order: required-name → name-too-long →
 * duplicate-name → invalid-time-range. On success returns the trimmed name plus
 * the (unchanged) start and end times.
 *
 * _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
 */
export function validateSession(
  draft: SessionDraft,
  existing: ExamSession[],
  ignoreId?: string,
): OpResult<{ name: string; startTime: string; endTime: string }> {
  const name = normalizeName(draft.name)

  if (name.length === 0) {
    return { ok: false, error: "required-name", message: "Session name is required." }
  }
  if (name.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      error: "name-too-long",
      message: `Session name must be at most ${MAX_NAME_LENGTH} characters.`,
    }
  }

  const folded = name.toLowerCase()
  const duplicate = existing.some(
    s => s.id !== ignoreId && s.name.trim().toLowerCase() === folded,
  )
  if (duplicate) {
    return { ok: false, error: "duplicate-name", message: "A session with that name already exists." }
  }

  const start = parseHHMM(draft.startTime)
  const end = parseHHMM(draft.endTime)
  if (start === null || end === null || end <= start) {
    return {
      ok: false,
      error: "invalid-time-range",
      message: "End time must be a valid 24-hour time later than the start time.",
    }
  }

  return { ok: true, value: { name, startTime: draft.startTime, endTime: draft.endTime } }
}

/** Build a stable id slug from a Session name. */
function sessionSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

/** Produce a Session id that does not collide with the existing set. */
function uniqueSessionId(name: string, existing: ExamSession[]): string {
  const base = sessionSlug(name)
  const root = base.length > 0 ? `ses-${base}` : "ses"
  if (!existing.some(s => s.id === root)) return root
  let n = 2
  while (existing.some(s => s.id === `${root}-${n}`)) n++
  return `${root}-${n}`
}

/**
 * Add a new Session. Validates the draft; on success returns a new array with
 * the appended Session (trimmed name). On failure the input array is left
 * unchanged and the validation error is returned.
 *
 * _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
 */
export function addSession(sessions: ExamSession[], draft: SessionDraft): OpResult<ExamSession[]> {
  const validated = validateSession(draft, sessions)
  if (!validated.ok) return validated

  const session: ExamSession = {
    id: uniqueSessionId(validated.value.name, sessions),
    name: validated.value.name,
    startTime: validated.value.startTime,
    endTime: validated.value.endTime,
  }
  return { ok: true, value: [...sessions, session] }
}

/**
 * Edit an existing Session's name, start time, or end time. Validates against
 * the other Sessions (ignoring the one being edited). On success returns a new
 * array with only that Session's record mutated; referencing Exam_Slots inherit
 * the change automatically because they reference the Session by id (R3.6). If
 * the id is not found, or validation fails, the input array is left unchanged.
 *
 * _Requirements: 3.6, 3.2, 3.3, 3.4, 3.5_
 */
export function editSession(
  sessions: ExamSession[],
  id: string,
  draft: SessionDraft,
): OpResult<ExamSession[]> {
  const validated = validateSession(draft, sessions, id)
  if (!validated.ok) return validated

  // A missing id is a no-op: map leaves every record unchanged.
  const next = sessions.map(s =>
    s.id === id
      ? { ...s, name: validated.value.name, startTime: validated.value.startTime, endTime: validated.value.endTime }
      : s,
  )
  return { ok: true, value: next }
}

/** True when at least one slot references the given Session id (R3.7–3.9). */
export function sessionHasSlots(slots: ExamSlot[], sessionId: string): boolean {
  return slots.some(slot => slot.sessionId === sessionId)
}

/**
 * Delete a Session and every Exam_Slot that references it. The caller is
 * responsible for obtaining confirmation when the Session has slots (R3.8/3.9);
 * this pure function performs the removal unconditionally and returns the new
 * Sessions and Slots arrays. Slots that do not reference the Session are left
 * unchanged.
 *
 * _Requirements: 3.7, 3.8_
 */
export function deleteSession(
  sessions: ExamSession[],
  slots: ExamSlot[],
  id: string,
): { sessions: ExamSession[]; slots: ExamSlot[] } {
  return {
    sessions: sessions.filter(s => s.id !== id),
    slots: slots.filter(slot => slot.sessionId !== id),
  }
}
