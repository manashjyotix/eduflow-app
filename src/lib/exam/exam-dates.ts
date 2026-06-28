/**
 * exam-dates.ts  (Feature F4 — Exam Routine Builder)
 *
 * Pure, side-effect-free logic for managing the Exam_Date column axis of the
 * routine grid. Dates are ISO `yyyy-mm-dd` calendar-date strings. This module
 * validates additions (format, real calendar date, duplicates, the 100-date
 * cap), removes dates (caller has already confirmed when slots exist), sorts
 * dates ascending, and derives the ordered column axis as the cartesian
 * product of dates × sessions (date ascending, then session start ascending).
 *
 * No React, no I/O, fully deterministic — this is the property-test surface.
 *
 * _Requirements: 4.1, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_
 */

import type { ExamDate, ExamSession, ExamSlot } from "@/data/mock-exams"
import type { OpResult } from "./types"

/** Maximum number of Exam_Dates the routine may hold (R5.4). */
export const MAX_EXAM_DATES = 100

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

/**
 * True iff `s` is an ISO `yyyy-mm-dd` string that represents a real calendar
 * date. Rejects malformed strings and impossible dates such as `2026-02-30`
 * or `2026-13-01` (R5.2).
 */
export function isValidIsoDate(s: string): boolean {
  const m = ISO_DATE_RE.exec(s)
  if (!m) return false
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  // Round-trip through Date in UTC: if any component is normalized away, the
  // input was not a real calendar date (e.g. 2026-02-30 → March 2).
  const d = new Date(Date.UTC(year, month - 1, day))
  return (
    d.getUTCFullYear() === year &&
    d.getUTCMonth() === month - 1 &&
    d.getUTCDate() === day
  )
}

/**
 * Add an Exam_Date to the column axis. Succeeds only when `date` is a valid ISO
 * calendar date, is not already present, and the current count is below
 * {@link MAX_EXAM_DATES}; otherwise the date set is left unchanged and the
 * matching error code is returned (R5.1–5.4).
 */
export function addExamDate(dates: ExamDate[], date: ExamDate): OpResult<ExamDate[]> {
  if (!isValidIsoDate(date)) {
    return {
      ok: false,
      error: "invalid-date",
      message: `"${date}" is not a valid ISO yyyy-mm-dd calendar date.`,
    }
  }
  if (dates.includes(date)) {
    return {
      ok: false,
      error: "duplicate-date",
      message: `The exam date "${date}" is already added.`,
    }
  }
  if (dates.length >= MAX_EXAM_DATES) {
    return {
      ok: false,
      error: "maximum-dates-reached",
      message: `Cannot add more than ${MAX_EXAM_DATES} exam dates.`,
    }
  }
  return { ok: true, value: [...dates, date] }
}

/** True iff at least one slot is scheduled on the given Exam_Date (R5.5–5.8). */
export function dateHasSlots(slots: ExamSlot[], date: ExamDate): boolean {
  return slots.some(slot => slot.date === date)
}

/**
 * Remove an Exam_Date from the column axis along with every slot scheduled on
 * that date. The caller is responsible for obtaining explicit confirmation when
 * the date has slots (R5.6–5.8); this function performs the removal
 * unconditionally and returns the new date set and slot set (R5.5/5.7).
 */
export function removeExamDate(
  dates: ExamDate[],
  slots: ExamSlot[],
  date: ExamDate,
): { dates: ExamDate[]; slots: ExamSlot[] } {
  return {
    dates: dates.filter(d => d !== date),
    slots: slots.filter(slot => slot.date !== date),
  }
}

/**
 * Return the Exam_Dates ordered earliest to latest. ISO `yyyy-mm-dd` strings
 * sort correctly under lexicographic comparison (R5.9, R4.1).
 */
export function sortedDates(dates: ExamDate[]): ExamDate[] {
  return [...dates].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
}

/**
 * Derive the grid column axis: the cartesian product of dates × sessions,
 * ordered by Exam_Date ascending and then by Session start time ascending
 * (R4.1, R5.9). Session start times are zero-padded 24-hour `HH:MM` strings, so
 * lexicographic comparison yields chronological order.
 */
export function columnAxis(
  dates: ExamDate[],
  sessions: ExamSession[],
): { date: ExamDate; session: ExamSession }[] {
  const orderedDates = sortedDates(dates)
  const orderedSessions = [...sessions].sort((a, b) =>
    a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : 0,
  )
  const columns: { date: ExamDate; session: ExamSession }[] = []
  for (const date of orderedDates) {
    for (const session of orderedSessions) {
      columns.push({ date, session })
    }
  }
  return columns
}
