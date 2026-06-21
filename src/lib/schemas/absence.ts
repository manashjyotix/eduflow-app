import { z } from "zod"

// ── Absence category enum ─────────────────────────────────────────────────────
export const absenceCategoryValues = [
  "sick_leave",
  "casual_leave",
  "emergency",
  "personal",
  "maternity_leave",
  "paternity_leave",
  "bereavement",
  "official_duty",
  "other",
] as const

export type AbsenceCategory = (typeof absenceCategoryValues)[number]

// ── Period IDs (P1–P7, matching PERIOD_IDS in src/data/periods.ts) ────────────
export const periodIdValues = ["P1", "P2", "P3", "P4", "P5", "P6", "P7"] as const

// ── Mark absence schema ───────────────────────────────────────────────────────
export const markAbsenceSchema = z.object({
  teacherId: z
    .string()
    .min(1, "Please select a teacher"),
  date: z
    .string()
    .min(1, "Date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  periods: z
    .array(z.enum(periodIdValues))
    .min(1, "Select at least one period"),
  reason: z
    .string()
    .min(3, "Reason must be at least 3 characters")
    .max(500, "Reason must be at most 500 characters"),
  category: z.enum(absenceCategoryValues, {
    error: "Please select a valid absence category",
  }),
  isFullDay: z.boolean().default(false),
})

export type MarkAbsenceInput = z.infer<typeof markAbsenceSchema>
