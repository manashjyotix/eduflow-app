/**
 * /api/absences
 *
 * GET   — List absences scoped to schoolId.
 *          Query params: page, limit, status, teacherId, date (YYYY-MM-DD)
 * POST  — Mark a new absence. Body validated with markAbsenceSchema.
 * PATCH — Update absence status (approve / reject). Body: { id, status }.
 *
 * Requirements: 8.1, 8.4, 8.5, 7.5
 */

import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import { Absence } from "@/models/Absence"
import { Teacher, type ITeacher } from "@/models/Teacher"
import { markAbsenceSchema } from "@/lib/schemas/absence"
import {
  ok,
  created,
  unauthorized,
  forbidden,
  validationError,
  notFound,
  internalError,
} from "@/lib/api-helpers"

// ── GET /api/absences ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { role, schoolId } = session.user
    if (!schoolId && role !== "super_admin") return forbidden("cross_tenant")

    const { searchParams } = new URL(req.url)
    const resolvedSchoolId = role === "super_admin"
      ? searchParams.get("schoolId") ?? schoolId
      : schoolId

    if (!resolvedSchoolId) return forbidden("super_admin must supply schoolId query param")

    const page     = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit    = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? "50")))
    const status   = searchParams.get("status")
    const teacherId = searchParams.get("teacherId")
    const date     = searchParams.get("date")

    await connectDB()

    const filter: Record<string, unknown> = { schoolId: resolvedSchoolId }
    if (status) filter.status = status
    if (teacherId) filter.teacherId = teacherId
    if (date) {
      const d = new Date(date)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      filter.date = { $gte: d, $lt: next }
    }

    const [absences, total] = await Promise.all([
      Absence.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Absence.countDocuments(filter),
    ])

    return ok(absences, { total, page })
  } catch (err) {
    return internalError(err)
  }
}

// ── POST /api/absences ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { role, schoolId } = session.user
    // Admins, management, and teachers can create absence records
    if (!["admin", "management", "teacher"].includes(role)) return forbidden("insufficient_role")
    if (!schoolId) return forbidden("cross_tenant")

    const body = await req.json().catch(() => null)
    if (body === null) return validationError([{ code: "custom", path: [], message: "Request body must be valid JSON" }])

    const parsed = markAbsenceSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error.issues)

    await connectDB()

    // Verify the teacher belongs to this school
    const teacher = await Teacher.findOne<ITeacher>({ _id: parsed.data.teacherId, schoolId }).lean()
    if (!teacher) return notFound("teacher")

    const absence = await Absence.create({
      schoolId,
      teacherId:      parsed.data.teacherId,
      teacherName:    teacher.name,
      date:           new Date(parsed.data.date),
      periods:        parsed.data.periods,
      reason:         parsed.data.reason,
      reasonCategory: parsed.data.category,
      status:         role === "admin" || role === "management" ? "approved" : "pending",
    })

    return created(absence.toObject())
  } catch (err) {
    return internalError(err)
  }
}

// ── PATCH /api/absences ───────────────────────────────────────────────────────
// Update absence status: approve / reject
const patchAbsenceSchema = z.object({
  id:     z.string().min(1, "Absence ID is required"),
  status: z.enum(["approved", "rejected", "pending", "draft"], {
    error: "Status must be one of: approved, rejected, pending, draft",
  }),
  notes: z.string().max(500).optional(),
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { role, schoolId } = session.user
    if (!["admin", "management"].includes(role)) return forbidden("insufficient_role")
    if (!schoolId) return forbidden("cross_tenant")

    const body = await req.json().catch(() => null)
    if (body === null) return validationError([{ code: "custom", path: [], message: "Request body must be valid JSON" }])

    const parsed = patchAbsenceSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error.issues)

    await connectDB()

    const updates: Record<string, unknown> = { status: parsed.data.status }
    if (parsed.data.notes) updates.notes = parsed.data.notes
    if (parsed.data.status === "approved") {
      updates.approvedBy = session.user.id
    }

    const absence = await Absence.findOneAndUpdate(
      { _id: parsed.data.id, schoolId },
      { $set: updates },
      { new: true }
    ).lean()

    if (!absence) return notFound("absence")

    return ok(absence)
  } catch (err) {
    return internalError(err)
  }
}
