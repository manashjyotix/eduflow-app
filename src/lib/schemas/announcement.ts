import { z } from "zod"

// ── Role enum (matches the 6 app roles) ──────────────────────────────────────
export const roleValues = [
  "admin",
  "management",
  "teacher",
  "parent",
  "super_admin",
  "student",
] as const

export type AppRole = (typeof roleValues)[number]

// ── Announce schema ───────────────────────────────────────────────────────────
export const announceSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(150, "Title must be at most 150 characters"),
  body: z
    .string()
    .min(10, "Body must be at least 10 characters")
    .max(5000, "Body must be at most 5000 characters"),
  targetRoles: z
    .array(z.enum(roleValues))
    .min(1, "Select at least one target audience"),
  expiresAt: z
    .string()
    .min(1, "Expiry date is required")
    .refine(
      (v) => !isNaN(Date.parse(v)),
      "Please enter a valid date"
    )
    .refine(
      (v) => new Date(v) > new Date(),
      "Expiry date must be in the future"
    ),
  isPinned: z.boolean().default(false),
  attachmentUrl: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
})

export type AnnounceInput = z.infer<typeof announceSchema>
