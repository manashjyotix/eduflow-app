/**
 * /api/attendance
 *
 * GET  — List attendance records scoped to schoolId.
 *         Query params: page, limit, classId, date, period, teacherId
 * POST — Submit an attendance roll call.
 *         Body: { classId, period, date, records: [{ studentId, studentName, status, note? }] }
 *
 * Requirements: 8.1, 8.4, 8.5, 7.5
 */

import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import { Attendance } from "@/models/Attendance"
import { Teacher, type ITeacher } from "@/models/Teacher"
import {
  ok,
  created,
  unauthorized,
  forbidden,
  validationError,
  internalError,
} from "@/lib/api-helpers"

// ── Schema ────────────────────────────────────────────────────────────────────
const postAttendanceSchema = z.object({
  classId: z.string().min(1, "classId is required"),
  period:  z.string().min(1, "period is required"),
  date:    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  records: z
    .array(
      z.object({
        studentId:   z.string().min(1, "studentId is required"),
        studentName: z.string().min(1, "studentName is required"),
        status:      z.enum(["present", "absent", "late", "excused"], {
          error: "status must be present, absent, late, or excused",
        }),
        note: z.string().max(200).optional(),
      })
    )
    .min(1, "At least one student record is required"),
})

// ── GET /api/attendance ───────────────────────────────────────────────────────
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
    const classId  = searchParams.get("classId")
    const date     = searchParams.get("date")
    const period   = searchParams.get("period")
    const teacherId = searchParams.get("teacherId")

    await connectDB()

    const filter: Record<string, unknown> = { schoolId: resolvedSchoolId }
    if (classId) filter.classId = classId
    if (period) filter.period = period
    if (teacherId) filter.teacherId = teacherId
    if (date) {
      const d = new Date(date)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      filter.date = { $gte: d, $lt: next }
    }

    const [records, total] = await Promise.all([
      Attendance.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Attendance.countDocuments(filter),
    ])

    return ok(records, { total, page })
  } catch (err) {
    return internalError(err)
  }
}

// ── POST /api/attendance ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { role, schoolId } = session.user
    if (!["admin", "management", "teacher"].includes(role)) return forbidden("insufficient_role")
    if (!schoolId) return forbidden("cross_tenant")

    const body = await req.json().catch(() => null)
    if (body === null) return validationError([{ code: "custom", path: [], message: "Request body must be valid JSON" }])

    const parsed = postAttendanceSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error.issues)

    await connectDB()

    // Resolve teacherId: teachers submit their own; admin/management may supply it in body
    let teacherId: string | undefined
    if (role === "teacher") {
      const teacher = await Teacher.findOne<ITeacher>({ schoolId, userId: session.user.id }).lean()
      teacherId = teacher?._id?.toString()
    } else {
      teacherId = body.teacherId as string | undefined
    }

    const record = await Attendance.create({
      schoolId,
      teacherId,
      classId:  parsed.data.classId,
      period:   parsed.data.period,
      date:     new Date(parsed.data.date),
      records:  parsed.data.records,
      markedAt: new Date(),
    })

    return created(record.toObject())
  } catch (err) {
    return internalError(err)
  }
}
