/**
 * /api/teachers
 *
 * GET  — List all teachers scoped to the caller's schoolId.
 *         Query params: page (default 1), limit (default 50), status
 * POST — Create a new teacher. Body validated with createTeacherSchema.
 *
 * Requirements: 8.1, 8.4, 8.5, 7.5
 */

import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import { Teacher } from "@/models/Teacher"
import { createTeacherSchema } from "@/lib/schemas/teacher"
import { ok, created, unauthorized, forbidden, validationError, internalError } from "@/lib/api-helpers"

// ── GET /api/teachers ─────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    // Super admin can pass an explicit schoolId via query param; all others
    // are locked to their own schoolId.
    const { searchParams } = new URL(req.url)
    let schoolId: string | null | undefined

    if (session.user.role === "super_admin") {
      schoolId = searchParams.get("schoolId")
      if (!schoolId) return forbidden("super_admin must supply schoolId query param")
    } else {
      if (!session.user.schoolId) return forbidden("cross_tenant")
      schoolId = session.user.schoolId
    }

    const page  = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? "50")))
    const status = searchParams.get("status")

    await connectDB()

    const filter: Record<string, unknown> = { schoolId }
    if (status) filter.status = status

    const [teachers, total] = await Promise.all([
      Teacher.find(filter)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Teacher.countDocuments(filter),
    ])

    return ok(teachers, { total, page })
  } catch (err) {
    return internalError(err)
  }
}

// ── POST /api/teachers ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    // Only admin and super_admin may create teachers
    const { role, schoolId } = session.user
    if (role !== "admin" && role !== "super_admin") return forbidden("insufficient_role")
    if (role === "admin" && !schoolId) return forbidden("cross_tenant")

    const body = await req.json().catch(() => null)
    if (body === null) return validationError([{ code: "custom", path: [], message: "Request body must be valid JSON" }])

    const parsed = createTeacherSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error.issues)

    await connectDB()

    const { name, email, subjects, phone, dailyProxyCap, weeklyProxyCap, status } = parsed.data

    // Resolve schoolId: admin uses their own; super_admin may pass it in body
    const resolvedSchoolId = role === "super_admin"
      ? (body.schoolId as string | undefined) ?? schoolId
      : schoolId

    if (!resolvedSchoolId) return forbidden("cross_tenant")

    const teacher = await Teacher.create({
      schoolId: resolvedSchoolId,
      name,
      email,
      subjects,
      phone,
      section: body.section ?? "Middle", // not in schema but required by model; default gracefully
      dailyProxyCap: dailyProxyCap ?? 2,
      weeklyProxyCap: weeklyProxyCap ?? 5,
      status: status ?? "active",
    })

    return created(teacher.toObject())
  } catch (err) {
    // Handle duplicate key (schoolId + email unique index)
    const mongoErr = err as { code?: number }
    if (mongoErr.code === 11000) {
      return validationError([{ code: "custom", path: ["email"], message: "A teacher with this email already exists in this school" }])
    }
    return internalError(err)
  }
}
