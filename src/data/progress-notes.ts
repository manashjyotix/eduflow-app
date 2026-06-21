/**
 * Progress notes mock data — teacher per-period per-student qualitative notes.
 * Created during roll-call / class journaling by the subject teacher.
 */

export type ProgressTag =
  | "understood"
  | "struggling"
  | "needs_practice"
  | "excellent"
  | "distracted"
  | "absent"

export interface ProgressNote {
  id: string
  studentId: string
  studentName: string
  class: string
  periodId: string
  subject: string
  /** Qualitative tag — drives the chip colour. */
  tag: ProgressTag
  /** Free-text teacher comment. */
  note: string
  /** ISO timestamp. */
  createdAt: string
  teacher: string
}

/** Human label + short hint per tag. */
export const PROGRESS_TAG_META: Record<
  ProgressTag,
  { label: string; hint: string; chip: string }
> = {
  understood:     { label: "Understood",    hint: "Grasped the topic",      chip: "bg-success/40 text-success-foreground" },
  excellent:      { label: "Excellent",     hint: "Top performance",        chip: "bg-primary/10 text-primary" },
  needs_practice: { label: "Needs Practice",hint: "Almost there",           chip: "bg-warning/40 text-warning-foreground" },
  struggling:     { label: "Struggling",    hint: "Needs extra help",       chip: "bg-destructive/10 text-destructive" },
  distracted:     { label: "Distracted",    hint: "Off-task in class",      chip: "bg-ef-purple-light text-[var(--ef-purple)]" },
  absent:         { label: "Absent",        hint: "Not in class",           chip: "bg-muted text-muted-foreground" },
}

/** Ordered list for the picker UI. */
export const PROGRESS_TAGS: ProgressTag[] = [
  "understood", "excellent", "needs_practice", "struggling", "distracted", "absent",
]

/** Seed notes for the demo (Priya Sharma's recent P3 Mathematics class). */
export const MOCK_PROGRESS_NOTES: ProgressNote[] = [
  { id: "pn1", studentId: "s1",  studentName: "Rohit Das",     class: "VIII-A", periodId: "P3", subject: "Mathematics", tag: "needs_practice", note: "Quadrilateral properties — confused between rhombus and parallelogram.", createdAt: "2026-06-18T11:30:00Z", teacher: "Priya Sharma" },
  { id: "pn2", studentId: "s2",  studentName: "Priti Kalita",  class: "VIII-A", periodId: "P3", subject: "Mathematics", tag: "excellent",      note: "Solved the advanced proof on the board unaided.", createdAt: "2026-06-18T11:30:00Z", teacher: "Priya Sharma" },
  { id: "pn3", studentId: "s7",  studentName: "Manash Deka",   class: "VIII-B", periodId: "P2", subject: "Mathematics", tag: "struggling",     note: "Needs remedial on linear equations. Recommended after-school session.", createdAt: "2026-06-17T10:50:00Z", teacher: "Priya Sharma" },
]
