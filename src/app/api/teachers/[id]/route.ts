/**
 * /api/teachers/[id]
 *
 * PATCH  — Update teacher fields. Body validated with updateTeacherSchema.
 * DELETE — Soft-delete by setting status to "inactive".
 *
 * Requirements: 8.1, 8.4, 8.5, 7.5
 */

import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import { Teacher } from "@/models/Teacher"
import { updateTeacherSchema } from "@/lib/schemas/teacher"
import {
  ok,
  unauthorized,
  forbidden,
  validationError,
  notFound,
  internalError,
} from "@/lib/api-helpers"

type RouteContext = { params: Promise<{ id: string }> }

// ── PATCH /api/teachers/[id] ──────────────────────────────────────────────────
export async function PATCH(req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { role, schoolId } = session.user
    if (role !== "admin" && role !== "super_admin") return forbidden("insufficient_role")
    if (role === "admin" && !schoolId) return forbidden("cross_tenant")

    const { id } = await ctx.params

    const body = await req.json().catch(() => null)
    if (body === null) return validationError([{ code: "custom", path: [], message: "Request body must be valid JSON" }])

    const parsed = updateTeacherSchema.safeParse({ ...body, id })
    if (!parsed.success) return validationError(parsed.error.issues)

    await connectDB()

    // Ensure the teacher belongs to the caller's school
    const filter = role === "super_admin"
      ? { _id: id }
      : { _id: id, schoolId }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, ...updates } = parsed.data

    const teacher = await Teacher.findOneAndUpdate(
      filter,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean()

    if (!teacher) return notFound("teacher")

    return ok(teacher)
  } catch (err) {
    const mongoErr = err as { code?: number }
    if (mongoErr.code === 11000) {
      return validationError([{ code: "custom", path: ["email"], message: "A teacher with this email already exists in this school" }])
    }
    return internalError(err)
  }
}

// ── DELETE /api/teachers/[id] ─────────────────────────────────────────────────
export async function DELETE(_req: NextRequest, ctx: RouteContext) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { role, schoolId } = session.user
    if (role !== "admin" && role !== "super_admin") return forbidden("insufficient_role")
    if (role === "admin" && !schoolId) return forbidden("cross_tenant")

    const { id } = await ctx.params

    await connectDB()

    const filter = role === "super_admin"
      ? { _id: id }
      : { _id: id, schoolId }

    // Soft-delete: mark as inactive rather than hard delete
    const teacher = await Teacher.findOneAndUpdate(
      filter,
      { $set: { status: "inactive" } },
      { new: true }
    ).lean()

    if (!teacher) return notFound("teacher")

    return ok({ id, deleted: true })
  } catch (err) {
    return internalError(err)
  }
}
