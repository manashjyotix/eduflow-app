/**
 * timetable.ts
 *
 * Single source of truth for the HCEA school timetable — used by:
 *   • Admin timetable builder   (/admin/timetable)
 *   • Management viewer         (/management/timetable)
 *   • Teacher personal view     (/teacher/timetable)
 *
 * The data is keyed [class][day][periodId] so any role can filter the same
 * dataset to their perspective (class-view for admin/management, teacher-view
 * for teachers).
 */

export type DayShort = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat"
export const DAYS: DayShort[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
export const DAY_LABELS: Record<DayShort, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday",
  Thu: "Thursday", Fri: "Friday", Sat: "Saturday",
}

export interface TimetableCell {
  subject:  string
  teacher:  string
  /** Teacher id — used to filter personal view */
  teacherId: string
}

/** [class][periodId][day] → cell */
export type SchoolTimetable = Record<
  string,
  Record<string, Record<DayShort, TimetableCell | null>>
>

export const PERIOD_IDS = ["P1", "P2", "P3", "P4", "P5", "P6", "P7"] as const
export const PERIOD_CONFIG: { id: string; time: string; isBreak?: boolean; label?: string }[] = [
  { id: "P1",     time: "9:30–10:10"   },
  { id: "P2",     time: "10:10–10:50"  },
  { id: "P3",     time: "10:50–11:30"  },
  { id: "P4",     time: "11:30–12:10"  },
  { id: "TIFFIN", time: "12:10–12:30", label: "Tiffin", isBreak: true },
  { id: "P5",     time: "12:30–1:10"   },
  { id: "P6",     time: "1:10–1:50"    },
  { id: "P7",     time: "1:50–2:30"    },
]

// ─── Teacher shorthand helpers ─────────────────────────────────────────────────
const T = {
  priya:   { name: "Priya Sharma",      id: "t1"  },
  rajesh:  { name: "Rajesh Kalita",     id: "t2"  },
  anita:   { name: "Anita Devi",        id: "t3"  },
  biju:    { name: "Biju Das",          id: "t4"  },
  meena:   { name: "Meena Gogoi",       id: "t5"  },
  rima:    { name: "Rima Das",          id: "t9"  },
  himanta: { name: "Himanta Bezbaruah", id: "t10" },
  sunita:  { name: "Sunita Borah",      id: "t7"  },
  dipak:   { name: "Dipak Baruah",      id: "t6"  },
}
function cell(subject: string, t: { name: string; id: string }): TimetableCell {
  return { subject, teacher: t.name, teacherId: t.id }
}

// ─── School-wide timetable (single source of truth) ────────────────────────────
export const SCHOOL_TIMETABLE: SchoolTimetable = {
  "VIII-A": {
    P1: {
      Mon: cell("Mathematics",    T.priya),
      Tue: cell("English",        T.rajesh),
      Wed: cell("Science",        T.anita),
      Thu: cell("Social Studies", T.rajesh),
      Fri: cell("Hindi",          T.rima),
      Sat: cell("Mathematics",    T.priya),
    },
    P2: {
      Mon: cell("English",        T.rajesh),
      Tue: cell("Mathematics",    T.priya),
      Wed: cell("Hindi",          T.rima),
      Thu: cell("Science",        T.anita),
      Fri: cell("Mathematics",    T.priya),
      Sat: cell("Sanskrit",       T.himanta),
    },
    P3: {
      Mon: cell("Science",        T.anita),
      Tue: cell("Social Studies", T.rajesh),
      Wed: cell("Mathematics",    T.priya),
      Thu: cell("English",        T.rajesh),
      Fri: cell("Science",        T.anita),
      Sat: cell("English",        T.rajesh),
    },
    P4: {
      Mon: cell("Hindi",          T.rima),
      Tue: cell("Science",        T.anita),
      Wed: cell("Social Studies", T.rajesh),
      Thu: cell("Mathematics",    T.priya),
      Fri: cell("English",        T.rajesh),
      Sat: cell("Science",        T.anita),
    },
    TIFFIN: { Mon: null, Tue: null, Wed: null, Thu: null, Fri: null, Sat: null },
    P5: {
      Mon: cell("Sanskrit",       T.himanta),
      Tue: cell("Hindi",          T.rima),
      Wed: cell("English",        T.rajesh),
      Thu: cell("Sanskrit",       T.himanta),
      Fri: cell("Social Studies", T.rajesh),
      Sat: cell("Mathematics",    T.biju),
    },
    P6: {
      Mon: cell("Social Studies", T.rajesh),
      Tue: cell("Sanskrit",       T.himanta),
      Wed: cell("Phys. Ed",       T.himanta),
      Thu: cell("Hindi",          T.rima),
      Fri: cell("Mathematics",    T.priya),
      Sat: cell("Hindi",          T.rima),
    },
    P7: {
      Mon: cell("Phys. Ed",       T.himanta),
      Tue: cell("Mathematics",    T.priya),
      Wed: cell("Sanskrit",       T.himanta),
      Thu: cell("Phys. Ed",       T.himanta),
      Fri: cell("Science",        T.anita),
      Sat: cell("Phys. Ed",       T.himanta),
    },
  },
  "IX-A": {
    P1: {
      Mon: cell("English",        T.rajesh),
      Tue: cell("Mathematics",    T.priya),
      Wed: cell("Science",        T.anita),
      Thu: cell("Hindi",          T.rima),
      Fri: cell("Social Studies", T.rajesh),
      Sat: cell("Mathematics",    T.priya),
    },
    P2: {
      Mon: cell("Mathematics",    T.priya),
      Tue: cell("Science",        T.anita),
      Wed: cell("English",        T.rajesh),
      Thu: cell("Social Studies", T.rajesh),
      Fri: cell("Hindi",          T.rima),
      Sat: cell("Science",        T.anita),
    },
    P3: {
      Mon: cell("Science",        T.anita),
      Tue: cell("Hindi",          T.rima),
      Wed: cell("Mathematics",    T.priya),
      Thu: cell("English",        T.rajesh),
      Fri: cell("Mathematics",    T.priya),
      Sat: cell("English",        T.rajesh),
    },
    P4: {
      Mon: cell("Social Studies", T.rajesh),
      Tue: cell("English",        T.rajesh),
      Wed: cell("Hindi",          T.rima),
      Thu: cell("Mathematics",    T.priya),
      Fri: cell("Science",        T.anita),
      Sat: cell("Hindi",          T.rima),
    },
    TIFFIN: { Mon: null, Tue: null, Wed: null, Thu: null, Fri: null, Sat: null },
    P5: {
      Mon: cell("Hindi",          T.rima),
      Tue: cell("Social Studies", T.rajesh),
      Wed: cell("Science",        T.anita),
      Thu: cell("Mathematics",    T.priya),
      Fri: cell("English",        T.rajesh),
      Sat: cell("Social Studies", T.rajesh),
    },
    P6: {
      Mon: cell("Mathematics",    T.sunita),
      Tue: cell("Mathematics",    T.priya),
      Wed: cell("Social Studies", T.rajesh),
      Thu: cell("Science",        T.anita),
      Fri: cell("Mathematics",    T.priya),
      Sat: cell("Mathematics",    T.priya),
    },
    P7: {
      Mon: cell("Phys. Ed",       T.himanta),
      Tue: cell("Phys. Ed",       T.himanta),
      Wed: cell("Phys. Ed",       T.himanta),
      Thu: cell("Phys. Ed",       T.himanta),
      Fri: cell("Phys. Ed",       T.himanta),
      Sat: cell("Phys. Ed",       T.himanta),
    },
  },
  "IX-B": {
    P1: {
      Mon: cell("Science",        T.anita),
      Tue: cell("English",        T.rajesh),
      Wed: cell("Mathematics",    T.priya),
      Thu: cell("Hindi",          T.rima),
      Fri: cell("Social Studies", T.rajesh),
      Sat: cell("English",        T.rajesh),
    },
    P2: {
      Mon: cell("Mathematics",    T.priya),
      Tue: cell("Mathematics",    T.priya),
      Wed: cell("Science",        T.anita),
      Thu: cell("English",        T.rajesh),
      Fri: cell("Mathematics",    T.priya),
      Sat: cell("Mathematics",    T.priya),
    },
    P3: {
      Mon: cell("English",        T.rajesh),
      Tue: cell("Science",        T.anita),
      Wed: cell("English",        T.rajesh),
      Thu: cell("Science",        T.anita),
      Fri: cell("English",        T.rajesh),
      Sat: cell("Science",        T.anita),
    },
    P4: {
      Mon: cell("Hindi",          T.rima),
      Tue: cell("Social Studies", T.rajesh),
      Wed: cell("Hindi",          T.rima),
      Thu: cell("Mathematics",    T.priya),
      Fri: cell("Hindi",          T.rima),
      Sat: cell("Hindi",          T.rima),
    },
    TIFFIN: { Mon: null, Tue: null, Wed: null, Thu: null, Fri: null, Sat: null },
    P5: {
      Mon: cell("Social Studies", T.rajesh),
      Tue: cell("Hindi",          T.rima),
      Wed: cell("Social Studies", T.rajesh),
      Thu: cell("Social Studies", T.rajesh),
      Fri: cell("Science",        T.anita),
      Sat: cell("Social Studies", T.rajesh),
    },
    P6: {
      Mon: cell("Mathematics",    T.priya),
      Tue: cell("Phys. Ed",       T.himanta),
      Wed: cell("Mathematics",    T.priya),
      Thu: cell("Phys. Ed",       T.himanta),
      Fri: cell("Phys. Ed",       T.himanta),
      Sat: cell("Phys. Ed",       T.himanta),
    },
    P7: {
      Mon: cell("Phys. Ed",       T.himanta),
      Tue: cell("Mathematics",    T.priya),
      Wed: cell("Phys. Ed",       T.himanta),
      Thu: cell("Mathematics",    T.priya),
      Fri: cell("Mathematics",    T.priya),
      Sat: cell("Mathematics",    T.priya),
    },
  },
  "X-A": {
    P1: {
      Mon: cell("Mathematics",    T.priya),
      Tue: cell("Science",        T.anita),
      Wed: cell("English",        T.rajesh),
      Thu: cell("Hindi",          T.rima),
      Fri: cell("Mathematics",    T.priya),
      Sat: cell("Science",        T.anita),
    },
    P2: {
      Mon: cell("English",        T.rajesh),
      Tue: cell("Mathematics",    T.priya),
      Wed: cell("Science",        T.anita),
      Thu: cell("Mathematics",    T.priya),
      Fri: cell("English",        T.rajesh),
      Sat: cell("Mathematics",    T.priya),
    },
    P3: {
      Mon: cell("Hindi",          T.rima),
      Tue: cell("English",        T.rajesh),
      Wed: cell("Hindi",          T.rima),
      Thu: cell("Science",        T.anita),
      Fri: cell("Hindi",          T.rima),
      Sat: cell("English",        T.rajesh),
    },
    P4: {
      Mon: cell("Science",        T.anita),
      Tue: cell("Hindi",          T.rima),
      Wed: cell("Mathematics",    T.priya),
      Thu: cell("English",        T.rajesh),
      Fri: cell("Science",        T.anita),
      Sat: cell("Hindi",          T.rima),
    },
    TIFFIN: { Mon: null, Tue: null, Wed: null, Thu: null, Fri: null, Sat: null },
    P5: {
      Mon: cell("Social Studies", T.rajesh),
      Tue: cell("Social Studies", T.rajesh),
      Wed: cell("Social Studies", T.rajesh),
      Thu: cell("Social Studies", T.rajesh),
      Fri: cell("Social Studies", T.rajesh),
      Sat: cell("Social Studies", T.rajesh),
    },
    P6: {
      Mon: cell("Mathematics",    T.priya),
      Tue: cell("Phys. Ed",       T.himanta),
      Wed: cell("Mathematics",    T.priya),
      Thu: cell("Mathematics",    T.priya),
      Fri: cell("Mathematics",    T.priya),
      Sat: cell("Phys. Ed",       T.himanta),
    },
    P7: {
      Mon: cell("Phys. Ed",       T.himanta),
      Tue: cell("Mathematics",    T.priya),
      Wed: cell("Phys. Ed",       T.himanta),
      Thu: cell("Phys. Ed",       T.himanta),
      Fri: cell("Phys. Ed",       T.himanta),
      Sat: cell("Mathematics",    T.priya),
    },
  },
  "VII-A": {
    P1: {
      Mon: cell("English",        T.rajesh),
      Tue: cell("Mathematics",    T.biju),
      Wed: cell("Science",        T.anita),
      Thu: cell("Hindi",          T.meena),
      Fri: cell("Mathematics",    T.biju),
      Sat: cell("English",        T.rajesh),
    },
    P2: {
      Mon: cell("Mathematics",    T.biju),
      Tue: cell("English",        T.rajesh),
      Wed: cell("Hindi",          T.meena),
      Thu: cell("Science",        T.anita),
      Fri: cell("English",        T.rajesh),
      Sat: cell("Mathematics",    T.biju),
    },
    P3: {
      Mon: cell("Hindi",          T.meena),
      Tue: cell("Science",        T.anita),
      Wed: cell("English",        T.rajesh),
      Thu: cell("Mathematics",    T.biju),
      Fri: cell("Science",        T.anita),
      Sat: cell("Hindi",          T.meena),
    },
    P4: {
      Mon: cell("Science",        T.anita),
      Tue: cell("Hindi",          T.meena),
      Wed: cell("Mathematics",    T.biju),
      Thu: cell("English",        T.rajesh),
      Fri: cell("Hindi",          T.meena),
      Sat: cell("Science",        T.anita),
    },
    TIFFIN: { Mon: null, Tue: null, Wed: null, Thu: null, Fri: null, Sat: null },
    P5: {
      Mon: cell("EVS",            T.anita),
      Tue: cell("EVS",            T.anita),
      Wed: cell("EVS",            T.anita),
      Thu: cell("EVS",            T.anita),
      Fri: cell("EVS",            T.anita),
      Sat: cell("EVS",            T.anita),
    },
    P6: {
      Mon: cell("Mathematics",    T.biju),
      Tue: cell("Mathematics",    T.biju),
      Wed: cell("Mathematics",    T.biju),
      Thu: cell("Mathematics",    T.biju),
      Fri: cell("Mathematics",    T.biju),
      Sat: cell("Mathematics",    T.biju),
    },
    P7: {
      Mon: cell("Phys. Ed",       T.himanta),
      Tue: cell("Phys. Ed",       T.himanta),
      Wed: cell("Phys. Ed",       T.himanta),
      Thu: cell("Phys. Ed",       T.himanta),
      Fri: cell("Phys. Ed",       T.himanta),
      Sat: cell("Phys. Ed",       T.himanta),
    },
  },
}

// ─── Teacher-personal view helpers ─────────────────────────────────────────────

export interface TeacherSlot {
  day:      DayShort
  periodId: string
  class:    string
  subject:  string
  type:     "regular" | "proxy"
  /** For proxy: name of the absent teacher being covered */
  covering?: string
}

/**
 * Build a teacher's personal weekly schedule by scanning SCHOOL_TIMETABLE.
 * Returns only the slots where the given teacher is assigned (regular).
 */
export function getTeacherSchedule(teacherId: string): TeacherSlot[] {
  const slots: TeacherSlot[] = []
  for (const [cls, periodMap] of Object.entries(SCHOOL_TIMETABLE)) {
    for (const [pid, dayMap] of Object.entries(periodMap)) {
      for (const [day, c] of Object.entries(dayMap) as [DayShort, TimetableCell | null][]) {
        if (c && c.teacherId === teacherId) {
          slots.push({ day, periodId: pid, class: cls, subject: c.subject, type: "regular" })
        }
      }
    }
  }
  return slots
}

/**
 * Merge proxy assignments (this week) on top of the regular schedule.
 * Proxy slots are added as extra entries; they do NOT replace regular slots.
 */
export function mergeProxySlots(
  regularSlots: TeacherSlot[],
  proxyAssignments: { periodId: string; class: string; subject: string; absentTeacherName: string; day?: DayShort }[]
): TeacherSlot[] {
  const proxySlots: TeacherSlot[] = proxyAssignments.map(p => ({
    day:      p.day ?? "Mon",
    periodId: p.periodId,
    class:    p.class,
    subject:  p.subject,
    type:     "proxy" as const,
    covering: p.absentTeacherName,
  }))
  return [...regularSlots, ...proxySlots]
}

// ─── Subject summary helper ─────────────────────────────────────────────────────

export interface SubjectSummary {
  subject:   string
  /** true = part of teacher's official subject list */
  isPrimary: boolean
  /** how many regular periods/week */
  regularCount: number
  /** proxy periods taken for this subject this week */
  proxyCount: number
  /** classes this subject is taught in */
  classes:   string[]
}

export function buildSubjectSummary(
  slots: TeacherSlot[],
  primarySubjects: string[]
): SubjectSummary[] {
  const map = new Map<string, SubjectSummary>()
  for (const slot of slots) {
    const existing = map.get(slot.subject) ?? {
      subject:      slot.subject,
      isPrimary:    primarySubjects.some(s => s.toLowerCase() === slot.subject.toLowerCase()),
      regularCount: 0,
      proxyCount:   0,
      classes:      [],
    }
    if (slot.type === "proxy") {
      existing.proxyCount++
    } else {
      existing.regularCount++
    }
    if (!existing.classes.includes(slot.class)) existing.classes.push(slot.class)
    map.set(slot.subject, existing)
  }
  // Sort: primary first, then by total period count desc
  return [...map.values()].sort((a, b) => {
    if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1
    return (b.regularCount + b.proxyCount) - (a.regularCount + a.proxyCount)
  })
}
