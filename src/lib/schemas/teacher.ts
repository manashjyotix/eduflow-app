import { z } from "zod"

// ── Shared subject values (matches mock data + onboarding) ────────────────────
export const SUBJECT_VALUES = [
  "Mathematics",
  "English",
  "Science",
  "Social Studies",
  "Hindi",
  "Art",
  "Physical Education",
  "Computer Science",
  "Other",
] as const

export const teacherStatusValues = ["active", "inactive", "on_leave"] as const

export const staffRoleValues = [
  "Class Teacher",
  "Subject Teacher",
  "Senior Teacher",
  "Head of Department",
] as const

// ── Create teacher schema ─────────────────────────────────────────────────────
export const createTeacherSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z
    .string()
    .email("Please enter a valid email address"),
  subjects: z
    .array(z.string().min(1))
    .min(1, "Select at least one subject"),
  phone: z
    .string()
    .optional()
    .refine(
      (v) => !v || /^\+?[\d\s\-().]{7,20}$/.test(v),
      "Please enter a valid phone number"
    ),
  role: z
    .enum(staffRoleValues, { error: "Please select a valid role" })
    .default("Subject Teacher"),
  dailyProxyCap: z
    .number({ error: "Must be a number" })
    .int()
    .min(0, "Daily cap cannot be negative")
    .max(10, "Daily cap cannot exceed 10")
    .default(2),
  weeklyProxyCap: z
    .number({ error: "Must be a number" })
    .int()
    .min(0, "Weekly cap cannot be negative")
    .max(30, "Weekly cap cannot exceed 30")
    .default(5),
  status: z.enum(teacherStatusValues).default("active"),
})

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>

// ── Update teacher schema (all fields optional except id) ─────────────────────
export const updateTeacherSchema = createTeacherSchema.partial().extend({
  id: z.string().min(1, "Teacher ID is required"),
})

export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>
