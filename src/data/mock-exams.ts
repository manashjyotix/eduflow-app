/**
 * mock-exams.ts  (Feature F4 — Exam Routine Builder)
 *
 * Single source of truth for the exam routine builder's mock data layer.
 *
 * The routine is a three-axis grid: rows = Classes, columns = (Exam_Date ×
 * Session) pairs. Each Exam_Slot is one buildable cell at a (Class, Exam_Date,
 * Session) coordinate holding at most one subject, an optional room, and zero
 * or more invigilators. Subjects come from an admin-managed Subject_Catalog
 * where each Catalog_Subject is linked to the classes that take it. Sessions
 * are school-defined named time blocks. Invigilators are notified either on
 * campus check-in or a configurable lead time before the session starts.
 *
 * Import from here — never redeclare inline.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Class + Section model
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A class group with one or more sections. The exam routine is built at the
 * class level — every section within the same class shares the same schedule.
 * For example, Class IX with sections A, B, C produces one routine row "IX"
 * that applies to IX-A, IX-B, and IX-C.
 */
export interface ClassGroup {
  /** Stable id, e.g. "class-ix". */
  id: string
  /**
   * Display name of the class level, e.g. "Nursery", "LKG", "UKG", "Class I",
   * "Class IX". Trimmed; unique case-insensitively.
   */
  name: string
  /**
   * Section labels, e.g. ["A", "B", "C"]. At least one is required. Each is
   * trimmed; unique within this class case-insensitively.
   */
  sections: string[]
  /**
   * Sort order — lower numbers appear first in the grid/palette. Defaults to
   * the insertion index.
   */
  order: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Core entities (three-axis routine model)
// ─────────────────────────────────────────────────────────────────────────────

/** A single subject in the admin-managed catalog, linked to the classes that take it. */
export interface CatalogSubject {
  /** Stable id, e.g. "subj-english". */
  id: string
  /** Trimmed; 1..100 chars; unique case-insensitively. */
  name: string
  /** Classes that take this subject (R1.5–1.8, R2.1). */
  linkedClassIds: string[]
}

/** A school-defined named time block. */
export interface ExamSession {
  /** Stable id, e.g. "ses-morning". */
  id: string
  /** Trimmed; 1..100 chars; unique case-insensitively. */
  name: string
  /** "HH:MM" 24-hour. */
  startTime: string
  /** "HH:MM" 24-hour; strictly later than startTime (R3.5). */
  endTime: string
}

/** An exam date is an ISO calendar date string, "yyyy-mm-dd" (R5.1–5.2). */
export type ExamDate = string

/** A single buildable cell at one (Class, Exam_Date, Session) coordinate. */
export interface ExamSlot {
  id: string
  /** Grid row, e.g. "VIII-A". */
  classId: string
  /** Column axis part 1. */
  date: ExamDate
  /** Column axis part 2 — references ExamSession.id. */
  sessionId: string
  /** At most one subject (R4.4); references CatalogSubject.name. */
  subject?: string
  room?: string
  /** Teacher ids (R4.5); distinct within a slot (R4.6, R7.8). */
  invigilatorIds: string[]
}

/** Duty-notification configuration. */
export interface ExamDutySettings {
  /** Whole number 0..10080 (R11.5). */
  notifyLeadMinutes: number
  /** Also notify when the teacher checks in on campus. */
  notifyOnCampusEntry: boolean
}

/** The complete in-memory routine state held by the context. */
export interface ExamRoutineState {
  catalog: CatalogSubject[]
  sessions: ExamSession[]
  dates: ExamDate[]
  slots: ExamSlot[]
  settings: ExamDutySettings
  /** Admin/management-configurable class groups with sections. */
  classGroups: ClassGroup[]
  /** Names of data sources that failed to load (R12.2). */
  loadErrors: string[]
}

/**
 * @deprecated Use {@link ExamDutySettings}. Retained as a structural alias so
 * existing consumers compile until the context is migrated (task 12).
 */
export type ExamSettings = ExamDutySettings

// ─────────────────────────────────────────────────────────────────────────────
// Grid axes (demo seed). Admin/management can extend these in production.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seed class groups — each class has sections; the routine is built at the
 * class level and shared across all sections. Admin and management can manage
 * these in Settings → Classes & Sections.
 */
export const SEED_CLASS_GROUPS: ClassGroup[] = [
  { id: "class-viii", name: "Class VIII", sections: ["A", "B"], order: 1 },
  { id: "class-ix",   name: "Class IX",   sections: ["A", "B", "C"], order: 2 },
  { id: "class-x",    name: "Class X",    sections: ["A"], order: 3 },
]

/**
 * Derived flat class ids for backward compatibility (e.g. "VIII-A", "IX-A").
 * Used in legacy slot data and existing tests.
 * @deprecated Prefer iterating over `SEED_CLASS_GROUPS` with `sectionClassIds`.
 */
export const EXAM_CLASSES: string[] = SEED_CLASS_GROUPS.flatMap(g =>
  g.sections.map(s => `${g.name.replace("Class ", "")}-${s}`),
)

/** Returns the full class+section ids for a class group (e.g. ["IX-A","IX-B","IX-C"]). */
export function sectionClassIds(group: ClassGroup): string[] {
  return group.sections.map(s => `${group.name.replace("Class ", "")}-${s}`)
}

/** Returns just the base class label from a classId like "IX-A" → "IX". */
export function baseClassFromId(classId: string): string {
  return classId.includes("-") ? classId.split("-")[0] : classId
}

/** Seed exam dates (column axis), ISO yyyy-mm-dd. Alias {@link EXAM_DATES}. */
export const EXAM_DAYS: ExamDate[] = ["2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17"]
export const EXAM_DATES: ExamDate[] = EXAM_DAYS

/** Flat subject-name list (legacy). The catalog ({@link EXAM_SUBJECT_CATALOG}) is the model. */
export const EXAM_SUBJECTS = [
  "English", "Mathematics", "Science", "Social Studies",
  "Hindi", "Sanskrit", "Computer Science",
]

// ─────────────────────────────────────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────────────────────────────────────

/** Default session seeded during migration; existing slots reference its id. */
export const DEFAULT_EXAM_SESSION: ExamSession = {
  id: "ses-morning",
  name: "Morning",
  startTime: "09:30",
  endTime: "12:30",
}

export const EXAM_SESSIONS: ExamSession[] = [DEFAULT_EXAM_SESSION]

// ─────────────────────────────────────────────────────────────────────────────
// Subject catalog — migrated from EXAM_SUBJECTS, each linked to every class.
// ─────────────────────────────────────────────────────────────────────────────

function subjectSlug(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

export const EXAM_SUBJECT_CATALOG: CatalogSubject[] = EXAM_SUBJECTS.map(name => ({
  id: `subj-${subjectSlug(name)}`,
  name,
  // Linked to base class names (e.g. "Class VIII"), not section-specific ids.
  linkedClassIds: SEED_CLASS_GROUPS.map(g => g.id),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────────────────────

export const DEFAULT_EXAM_DUTY_SETTINGS: ExamDutySettings = {
  notifyLeadMinutes: 15,
  notifyOnCampusEntry: true,
}

/** @deprecated Use {@link DEFAULT_EXAM_DUTY_SETTINGS}. Retained for existing consumers. */
export const DEFAULT_EXAM_SETTINGS: ExamSettings = DEFAULT_EXAM_DUTY_SETTINGS

// ─────────────────────────────────────────────────────────────────────────────
// Slot keys
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @deprecated Two-axis key (classId, date). Superseded by the three-axis
 * {@link examSlotKey}. Retained until the context is migrated (task 12).
 */
export function examCellKey(classId: string, date: string): string {
  return `${classId}__${date}`
}

/** Canonical three-axis slot key — uniquely identifies a slot (R4.2). */
export function examSlotKey(classId: string, date: string, sessionId: string): string {
  return `${classId}__${date}__${sessionId}`
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed slots — migrated to the three-axis model (each gains the Morning session).
// ─────────────────────────────────────────────────────────────────────────────

export const MOCK_EXAM_SLOTS: ExamSlot[] = [
  // Slots use classGroupId (e.g. "class-viii") — the routine is shared across all sections.
  { id: "es-1", classId: "class-viii", date: "2026-07-14", sessionId: DEFAULT_EXAM_SESSION.id, subject: "English",     room: "Room 201", invigilatorIds: ["t1"] },
  { id: "es-2", classId: "class-viii", date: "2026-07-15", sessionId: DEFAULT_EXAM_SESSION.id, subject: "Mathematics", room: "Room 201", invigilatorIds: ["t4"] },
  { id: "es-3", classId: "class-ix",   date: "2026-07-14", sessionId: DEFAULT_EXAM_SESSION.id, subject: "Science",     room: "Room 203", invigilatorIds: [] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Initial in-memory routine state — the context initializes from this (task 12).
// Satisfies all uniqueness invariants: distinct slot keys, distinct catalog and
// session names (case-folded), and distinct valid ISO dates.
// ─────────────────────────────────────────────────────────────────────────────

export const INITIAL_EXAM_ROUTINE_STATE: ExamRoutineState = {
  catalog: EXAM_SUBJECT_CATALOG,
  sessions: EXAM_SESSIONS,
  dates: EXAM_DATES,
  slots: MOCK_EXAM_SLOTS,
  settings: DEFAULT_EXAM_DUTY_SETTINGS,
  classGroups: SEED_CLASS_GROUPS,
  loadErrors: [],
}
