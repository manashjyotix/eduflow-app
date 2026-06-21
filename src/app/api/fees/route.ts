/**
 * /api/fees
 *
 * GET  — List fee transactions scoped to schoolId.
 *         Query params: page, limit, studentId, feeCategory, paymentMode, dateFrom, dateTo
 * POST — Record a fee collection. Body validated with collectFeeSchema.
 *
 * Requirements: 8.1, 8.4, 8.5, 7.5
 */

import { NextRequest } from "next/server"
import { auth } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import { Fee } from "@/models/Fee"
import { collectFeeSchema } from "@/lib/schemas/fee"
import {
  ok,
  created,
  unauthorized,
  forbidden,
  validationError,
  internalError,
} from "@/lib/api-helpers"

// ── GET /api/fees ─────────────────────────────────────────────────────────────
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

    // Parents may only view their own child's fee records — they pass studentId
    const studentIdParam = searchParams.get("studentId")
    if (role === "parent" && !studentIdParam) {
      return forbidden("parent must supply studentId query param")
    }

    const page        = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit       = Math.min(200, Math.max(1, Number(searchParams.get("limit") ?? "50")))
    const feeCategory = searchParams.get("feeCategory")
    const paymentMode = searchParams.get("paymentMode")
    const dateFrom    = searchParams.get("dateFrom")
    const dateTo      = searchParams.get("dateTo")

    await connectDB()

    const filter: Record<string, unknown> = { schoolId: resolvedSchoolId }
    if (studentIdParam) filter.studentId = studentIdParam
    if (feeCategory) filter.feeCategory = feeCategory
    if (paymentMode) filter.paymentMode = paymentMode
    if (dateFrom || dateTo) {
      const dateFilter: Record<string, Date> = {}
      if (dateFrom) dateFilter.$gte = new Date(dateFrom)
      if (dateTo)   dateFilter.$lte = new Date(dateTo)
      filter.paymentDate = dateFilter
    }

    const [fees, total] = await Promise.all([
      Fee.find(filter).sort({ paymentDate: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Fee.countDocuments(filter),
    ])

    return ok(fees, { total, page })
  } catch (err) {
    return internalError(err)
  }
}

// ── POST /api/fees ────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { role, schoolId } = session.user
    if (!["admin", "management"].includes(role)) return forbidden("insufficient_role")
    if (!schoolId) return forbidden("cross_tenant")

    const body = await req.json().catch(() => null)
    if (body === null) return validationError([{ code: "custom", path: [], message: "Request body must be valid JSON" }])

    const parsed = collectFeeSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error.issues)

    await connectDB()

    const fee = await Fee.create({
      schoolId,
      studentId:     parsed.data.studentId,
      studentName:   (body.studentName as string | undefined) ?? "Unknown",
      className:     (body.className as string | undefined) ?? "",
      amount:        parsed.data.amount,
      paymentMode:   parsed.data.paymentMode,
      feeCategory:   parsed.data.feeCategory,
      receiptNumber: parsed.data.receiptNumber,
      paymentDate:   new Date(parsed.data.paymentDate),
      remarks:       parsed.data.remarks,
      collectedBy:   session.user.id,
    })

    return created(fee.toObject())
  } catch (err) {
    return internalError(err)
  }
}
