import { z } from "zod"

// ── Payment mode enum ─────────────────────────────────────────────────────────
export const paymentModeValues = [
  "cash",
  "upi",
  "bank_transfer",
  "cheque",
  "dd",
  "online",
] as const

// ── Fee category enum ─────────────────────────────────────────────────────────
export const feeCategoryValues = [
  "tuition",
  "transport",
  "hostel",
  "library",
  "lab",
  "sports",
  "exam",
  "admission",
  "miscellaneous",
] as const

// ── Collect fee schema (single transaction) ───────────────────────────────────
export const collectFeeSchema = z.object({
  studentId: z
    .string()
    .min(1, "Please select a student"),
  amount: z
    .number({ error: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .max(1_000_000, "Amount seems too large — please verify"),
  paymentMode: z.enum(paymentModeValues, {
    error: "Please select a valid payment mode",
  }),
  feeCategory: z.enum(feeCategoryValues, {
    error: "Please select a valid fee category",
  }),
  receiptNumber: z
    .string()
    .optional(),
  paymentDate: z
    .string()
    .min(1, "Payment date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  remarks: z
    .string()
    .max(500, "Remarks must be at most 500 characters")
    .optional(),
})

export type CollectFeeInput = z.infer<typeof collectFeeSchema>

// ── Fee structure schema (define fees per class / category) ───────────────────
export const feeStructureSchema = z.object({
  className: z
    .string()
    .min(1, "Please specify the class"),
  academicYear: z
    .string()
    .regex(
      /^\d{4}-\d{2,4}$/,
      "Academic year must be in format YYYY-YY or YYYY-YYYY (e.g. 2025-26)"
    ),
  feeHeads: z
    .array(
      z.object({
        category: z.enum(feeCategoryValues, {
          error: "Please select a valid fee category",
        }),
        label: z
          .string()
          .min(1, "Label is required")
          .max(100, "Label must be at most 100 characters"),
        amount: z
          .number({ error: "Amount must be a number" })
          .nonnegative("Amount cannot be negative"),
        frequency: z
          .enum(["monthly", "quarterly", "annual", "one_time"], {
            error: "Please select a valid frequency",
          })
          .default("annual"),
        isOptional: z.boolean().default(false),
      })
    )
    .min(1, "At least one fee head is required"),
})

export type FeeStructureInput = z.infer<typeof feeStructureSchema>
