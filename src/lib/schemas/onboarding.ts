import { z } from "zod"

/**
 * Onboarding wizard — 5 step schemas.
 * Step indices match STEPS[] in src/app/(marketing)/onboarding/page.tsx:
 *   0 → School Details
 *   1 → Academic Setup
 *   2 → Periods Setup
 *   3 → Add Teachers
 *   4 → Review & Launch  (read-only summary — no additional input schema needed)
 */

// ── Step 0: School Details ────────────────────────────────────────────────────
export const boardValues = [
  "CBSE",
  "ICSE",
  "State Board (Assam)",
  "SEBA",
  "State Board (Other)",
  "IB",
  "Cambridge IGCSE",
] as const

export const stateValues = [
  "Assam",
  "West Bengal",
  "Bihar",
  "Delhi",
  "Maharashtra",
  "Karnataka",
  "Other",
] as const

export const classRangeValues = [
  "Nursery–V",
  "VI–X",
  "XI–XII",
  "Full (Nursery–XII)",
  "Other",
] as const

export const onboardingStep0Schema = z.object({
  schoolName: z
    .string()
    .min(2, "School name must be at least 2 characters")
    .max(150, "School name must be at most 150 characters"),
  about: z
    .string()
    .max(500, "Description must be at most 500 characters")
    .optional()
    .or(z.literal("")),
  address: z
    .string()
    .max(300, "Address must be at most 300 characters")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .min(1, "City / town is required")
    .max(100, "City must be at most 100 characters"),
  state: z.enum(stateValues, {
    error: "Please select a valid state",
  }),
  board: z.enum(boardValues, {
    error: "Please select a valid board",
  }),
  classes: z.enum(classRangeValues).optional(),
  totalTeachers: z
    .string()
    .optional()
    .refine(
      (v) => !v || (Number(v) > 0 && Number.isInteger(Number(v))),
      "Must be a positive whole number"
    ),
  totalStudents: z
    .string()
    .optional()
    .refine(
      (v) => !v || (Number(v) > 0 && Number.isInteger(Number(v))),
      "Must be a positive whole number"
    ),
  principalName: z
    .string()
    .max(100, "Name must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  principalEmail: z
    .string()
    .optional()
    .refine(
      (v) => !v || z.string().email().safeParse(v).success,
      "Please enter a valid email address"
    )
    .or(z.literal("")),
  principalPhone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\+?[\d\s\-().]{7,20}$/.test(v),
      "Please enter a valid phone number"
    )
    .or(z.literal("")),
})

export type OnboardingStep0Input = z.infer<typeof onboardingStep0Schema>

// ── Step 1: Academic Setup ────────────────────────────────────────────────────
export const periodsPerDayValues = ["5", "6", "7", "8"] as const
export const academicMonthValues = ["January", "April", "June", "July"] as const
export const workingDayValues = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const

/** HH:MM time format validator */
const timeString = z
  .string()
  .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")

export const onboardingStep1Schema = z
  .object({
    startTime: timeString,
    endTime: timeString,
    periodsPerDay: z.enum(periodsPerDayValues, {
      error: "Please select a valid number of periods",
    }),
    breakTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
      .optional()
      .or(z.literal("")),
    academicMonth: z.enum(academicMonthValues, {
      error: "Please select a valid month",
    }),
    workingDays: z
      .array(z.enum(workingDayValues))
      .min(1, "Select at least one working day"),
  })
  .refine(
    (data) => data.endTime > data.startTime,
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  )

export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>

// ── Step 2: Periods Setup ─────────────────────────────────────────────────────
export const periodRowSchema = z.object({
  name: z
    .string()
    .min(1, "Period name cannot be empty")
    .max(50, "Period name must be at most 50 characters"),
  start: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
    .optional()
    .or(z.literal("")),
  end: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
    .optional()
    .or(z.literal("")),
})

export const onboardingStep2Schema = z.object({
  periods: z
    .array(periodRowSchema)
    .min(1, "At least one period is required")
    .refine(
      (rows) => rows.every((r) => r.name.trim().length > 0),
      "All period rows must have a name"
    ),
})

export type OnboardingStep2Input = z.infer<typeof onboardingStep2Schema>

// ── Step 3: Add Teachers ──────────────────────────────────────────────────────
export const onboardingSubjectValues = [
  "Mathematics",
  "English",
  "Science",
  "Social Studies",
  "Hindi",
  "Art",
  "Physical Education",
  "Computer Science",
] as const

export const onboardingStaffRoleValues = [
  "Class Teacher",
  "Subject Teacher",
  "Senior Teacher",
  "Head of Department",
] as const

export const staffRowSchema = z.object({
  name: z
    .string()
    .max(100, "Name must be at most 100 characters")
    .optional()
    .or(z.literal("")),
  subject: z.enum(onboardingSubjectValues).optional(),
  role: z.enum(onboardingStaffRoleValues).optional(),
  email: z
    .string()
    .optional()
    .refine(
      (v) => !v || z.string().email().safeParse(v).success,
      "Please enter a valid email address"
    )
    .or(z.literal("")),
})

export const onboardingStep3Schema = z.object({
  staff: z
    .array(staffRowSchema)
    .refine(
      (rows) => rows.filter((r) => r.name && r.name.trim().length > 0).length >= 3,
      "Add at least 3 teachers to get started"
    ),
})

export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>

// ── Step 4: Review & Launch ───────────────────────────────────────────────────
// Read-only summary — no user inputs. Schema validates the launch action.
export const onboardingStep4Schema = z.object({
  acknowledged: z
    .boolean()
    .refine((v) => v === true, "Please review and acknowledge the setup summary"),
})

export type OnboardingStep4Input = z.infer<typeof onboardingStep4Schema>

// ── Full wizard schema (steps 0–3 combined) ───────────────────────────────────
export const onboardingWizardSchema = z.object({
  step0: onboardingStep0Schema,
  step1: onboardingStep1Schema,
  step2: onboardingStep2Schema,
  step3: onboardingStep3Schema,
})

export type OnboardingWizardInput = z.infer<typeof onboardingWizardSchema>

// ── Convenience array for iterating step schemas by index ─────────────────────
export const ONBOARDING_STEP_SCHEMAS = [
  onboardingStep0Schema,
  onboardingStep1Schema,
  onboardingStep2Schema,
  onboardingStep3Schema,
  onboardingStep4Schema,
] as const
