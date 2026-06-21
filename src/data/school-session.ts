/**
 * School academic session + holiday configuration.
 *
 * In production this is configured by the school Admin (Institution Settings →
 * Academic Session: start month/date → end month/date) and the Holiday Calendar.
 * Here it is mocked as the single source of truth so role pages (parent journal,
 * attendance, etc.) can gate content to real school days only.
 *
 * Demo school (HCEA) session: 1 April 2026 → 31 March 2027.
 */

export interface SchoolSession {
  /** Human label, e.g. "2026–27". */
  label: string
  /** ISO yyyy-mm-dd — first day of the session (inclusive). */
  startDate: string
  /** ISO yyyy-mm-dd — last day of the session (inclusive). */
  endDate: string
}

export const SCHOOL_SESSION: SchoolSession = {
  label: "2026–27",
  startDate: "2026-04-01",
  endDate: "2027-03-31",
}

export type HolidayType = "National" | "Festival" | "Regional" | "School"

export interface Holiday {
  date: string
  name: string
  type: HolidayType
}

/** Declared holidays (mirrors the Admin → Holiday Calendar). */
export const HOLIDAYS: Holiday[] = [
  { date: "2026-04-14", name: "Bohag Bihu",       type: "Regional" },
  { date: "2026-06-21", name: "Eid al-Adha",      type: "Festival" },
  { date: "2026-08-15", name: "Independence Day", type: "National" },
  { date: "2026-10-02", name: "Gandhi Jayanti",   type: "National" },
  { date: "2026-10-12", name: "Durga Puja",       type: "Festival" },
  { date: "2026-10-13", name: "Navami",           type: "Festival" },
  { date: "2026-11-05", name: "Diwali",           type: "Festival" },
  { date: "2026-12-25", name: "Christmas",        type: "National" },
  { date: "2027-01-26", name: "Republic Day",     type: "National" },
  { date: "2027-03-25", name: "Holi",             type: "Festival" },
]

/** Weekly off days (0 = Sunday … 6 = Saturday). Admin-configurable. */
export const WEEKLY_OFF_DAYS: number[] = [0]

/** Parse an ISO yyyy-mm-dd string as a LOCAL date (avoids UTC off-by-one). */
function parseLocal(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, (m || 1) - 1, d || 1)
}

export function getHoliday(iso: string): Holiday | undefined {
  return HOLIDAYS.find(h => h.date === iso)
}

export function isWeeklyOff(iso: string): boolean {
  return WEEKLY_OFF_DAYS.includes(parseLocal(iso).getDay())
}

export function isWithinSession(iso: string): boolean {
  const d = parseLocal(iso).getTime()
  return d >= parseLocal(SCHOOL_SESSION.startDate).getTime()
    && d <= parseLocal(SCHOOL_SESSION.endDate).getTime()
}

export type DayStatusKind = "out-of-session" | "holiday" | "weekly-off" | "school-day"

export interface DayStatus {
  kind: DayStatusKind
  holiday?: Holiday
}

/**
 * Classify a date for "is there a class journal / school day here?" purposes.
 * Order of precedence: session window → holiday → weekly-off → normal school day.
 */
export function getDayStatus(iso: string): DayStatus {
  if (!isWithinSession(iso)) return { kind: "out-of-session" }
  const holiday = getHoliday(iso)
  if (holiday) return { kind: "holiday", holiday }
  if (isWeeklyOff(iso)) return { kind: "weekly-off" }
  return { kind: "school-day" }
}
