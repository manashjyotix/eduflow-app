/**
 * /api/proxies
 *
 * GET   — List proxy assignments scoped to schoolId.
 *          Query params: page, limit, date, absenceId, status
 * POST  — Assign a proxy. Body: { absenceId, proxyTeacherId, period, classId, subject, date }.
 * PATCH — Accept or decline a proxy request. Body: { id, status }.
 *         Teachers may only update their own assignments.
 *
 * Requirements: 8.1, 8.4, 8.5, 7.5
 */

import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import { Proxy } from "@/models/Proxy"
import { Teacher, type ITeacher } from "@/models/Teacher"
import {
  ok,
  created,
  unauthorized,
  forbidden,
  validationError,
  notFound,
  internalError,
} from "@/lib/api-helpers"

// ── GET /api/proxies ──────────────────────────────────────────────────────────
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
    const absenceId = searchParams.get("absenceId")
    const date     = searchParams.get("date")

    await connectDB()

    const filter: Record<string, unknown> = { schoolId: resolvedSchoolId }
    if (status) filter.status = status
    if (absenceId) filter.absenceId = absenceId
    if (date) {
      const d = new Date(date)
      const next = new Date(d)
      next.setDate(next.getDate() + 1)
      filter.date = { $gte: d, $lt: next }
    }

    // Teachers only see their own proxy assignments
    if (role === "teacher") {
      const teacher = await Teacher.findOne<ITeacher>({ schoolId: resolvedSchoolId, userId: session.user.id }).lean()
      if (teacher) filter.proxyTeacherId = teacher._id
    }

    const [proxies, total] = await Promise.all([
      Proxy.find(filter).sort({ date: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Proxy.countDocuments(filter),
    ])

    return ok(proxies, { total, page })
  } catch (err) {
    return internalError(err)
  }
}

// ── POST /api/proxies — assign a proxy ───────────────────────────────────────
const assignProxySchema = z.object({
  absenceId:       z.string().min(1, "absenceId is required"),
  proxyTeacherId:  z.string().min(1, "proxyTeacherId is required"),
  absentTeacherId: z.string().min(1, "absentTeacherId is required"),
  period:          z.enum(["P1", "P2", "P3", "P4", "P5", "P6", "P7"], { error: "Invalid period" }),
  classId:         z.string().min(1, "classId is required"),
  subject:         z.string().min(1, "subject is required"),
  date:            z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  score:           z.number().min(0).max(100).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { role, schoolId } = session.user
    if (!["admin", "management"].includes(role)) return forbidden("insufficient_role")
    if (!schoolId) return forbidden("cross_tenant")

    const body = await req.json().catch(() => null)
    if (body === null) return validationError([{ code: "custom", path: [], message: "Request body must be valid JSON" }])

    const parsed = assignProxySchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error.issues)

    await connectDB()

    // Confirm proxy teacher belongs to this school
    const proxyTeacher = await Teacher.findOne<ITeacher>({ _id: parsed.data.proxyTeacherId, schoolId }).lean()
    if (!proxyTeacher) return notFound("proxyTeacher")

    const assignment = await Proxy.create({
      schoolId,
      absenceId:        parsed.data.absenceId,
      absentTeacherId:  parsed.data.absentTeacherId,
      proxyTeacherId:   parsed.data.proxyTeacherId,
      proxyTeacherName: proxyTeacher.name,
      period:           parsed.data.period,
      classId:          parsed.data.classId,
      subject:          parsed.data.subject,
      date:             new Date(parsed.data.date),
      status:           "assigned",
      assignedBy:       session.user.id,
      score:            parsed.data.score,
    })

    return created(assignment.toObject())
  } catch (err) {
    return internalError(err)
  }
}

// ── PATCH /api/proxies — accept / decline ─────────────────────────────────────
const patchProxySchema = z.object({
  id:     z.string().min(1, "Proxy assignment ID is required"),
  status: z.enum(["accepted", "declined", "completed"], {
    error: "Status must be one of: accepted, declined, completed",
  }),
})

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { role, schoolId } = session.user
    if (!["admin", "management", "teacher"].includes(role)) return forbidden("insufficient_role")
    if (!schoolId) return forbidden("cross_tenant")

    const body = await req.json().catch(() => null)
    if (body === null) return validationError([{ code: "custom", path: [], message: "Request body must be valid JSON" }])

    const parsed = patchProxySchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error.issues)

    await connectDB()

    // Teachers may only update their own assignments to accepted/declined
    let teacherIdFilter: Record<string, unknown> = {}
    if (role === "teacher") {
      if (!["accepted", "declined"].includes(parsed.data.status)) return forbidden("insufficient_role")
      const teacher = await Teacher.findOne<ITeacher>({ schoolId, userId: session.user.id }).lean()
      if (!teacher) return notFound("teacher")
      teacherIdFilter = { proxyTeacherId: teacher._id }
    }

    const filter: Record<string, unknown> = { _id: parsed.data.id, schoolId, ...teacherIdFilter }

    const assignment = await Proxy.findOneAndUpdate(
      filter,
      { $set: { status: parsed.data.status } },
      { new: true }
    ).lean()

    if (!assignment) return notFound("proxy_assignment")

    return ok(assignment)
  } catch (err) {
    return internalError(err)
  }
}
