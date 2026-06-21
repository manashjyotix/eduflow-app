/**
 * Subject completion (syllabus progress) mock data.
 * Used by the parent portal SubjectTracker and the teacher subject overview.
 * Source of truth for per-subject syllabus completion percentages.
 */

export interface SubjectCompletion {
  /** Stable subject key, e.g. "mathematics". */
  id: string
  /** Display name, e.g. "Mathematics". */
  name: string
  /** Completed units out of total. */
  completedUnits: number
  totalUnits: number
  /** 0–100 completion of the prescribed syllabus for the term. */
  percent: number
  /** Units remaining to finish the term syllabus. */
  remaining: number
  /** Most recently taught topic. */
  lastTopic: string
  /** Teacher taking the subject. */
  teacher: string
}

/** Default subject-completion set for Rohit Das · Class VIII-A (parent demo child). */
export const SUBJECT_COMPLETION: SubjectCompletion[] = [
  { id: "mathematics",   name: "Mathematics",        completedUnits: 9,  totalUnits: 12, percent: 75, remaining: 3,  lastTopic: "Quadrilaterals",     teacher: "Priya Sharma" },
  { id: "science",       name: "Science",            completedUnits: 7,  totalUnits: 11, percent: 64, remaining: 4,  lastTopic: "Sound & Waves",      teacher: "Anita Devi" },
  { id: "english",       name: "English",            completedUnits: 8,  totalUnits: 10, percent: 80, remaining: 2,  lastTopic: "Tenses (Advanced)",  teacher: "Rajesh Kalita" },
  { id: "social",        name: "Social Studies",     completedUnits: 5,  totalUnits: 12, percent: 42, remaining: 7,  lastTopic: "Mughal Empire",      teacher: "Rajesh Kalita" },
  { id: "hindi",         name: "Hindi",              completedUnits: 6,  totalUnits: 10, percent: 60, remaining: 4,  lastTopic: "काव्य पाठ",          teacher: "Meena Gogoi" },
  { id: "computer",      name: "Computer Science",   completedUnits: 7,  totalUnits: 8,  percent: 88, remaining: 1,  lastTopic: "Python Loops",       teacher: "Biju Das" },
]

/** Average syllabus completion across all subjects. */
export const AVERAGE_COMPLETION = Math.round(
  SUBJECT_COMPLETION.reduce((sum, s) => sum + s.percent, 0) / SUBJECT_COMPLETION.length,
)
