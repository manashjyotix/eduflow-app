import { z } from "zod"
import { periodIdValues } from "./absence"

// ── Leave type enum ───────────────────────────────────────────────────────────
export const leaveTypeValues = [
  "full_day",
  "partial",     // specific periods — requires periods array
  "half_day",
  "sick",
  "casual",
  "emergency",
  "official_duty",
] as const

export type LeaveType = (typeof leaveTypeValues)[number]

// ── Apply leave schema ────────────────────────────────────────────────────────
// Business rule: when leaveType is "partial", at least one period must be selected.
export const applyLeaveSchema = z
  .object({
    leaveType: z.enum(leaveTypeValues, {
      error: "Please select a valid leave type",
    }),
    reason: z
      .string()
      .min(10, "Reason must be at least 10 characters")
      .max(1000, "Reason must be at most 1000 characters"),
    startDate: z
      .string()
      .min(1, "Start date is required")
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Start date must be in YYYY-MM-DD format"),
    endDate: z
      .string()
      .optional()
      .refine(
        (v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v),
        "End date must be in YYYY-MM-DD format"
      ),
    // Optional array — required only when leaveType is "partial"
    periods: z
      .array(z.enum(periodIdValues))
      .optional(),
    // Optional supporting document reference
    documentUrl: z
      .string()
      .url("Must be a valid URL")
      .optional()
      .or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.leaveType === "partial") {
        return Array.isArray(data.periods) && data.periods.length > 0
      }
      return true
    },
    {
      message: "At least one period must be selected for partial-day leave",
      path: ["periods"],
    }
  )
  .refine(
    (data) => {
      if (data.endDate && data.startDate) {
        return data.endDate >= data.startDate
      }
      return true
    },
    {
      message: "End date must be on or after the start date",
      path: ["endDate"],
    }
  )

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>
