/**
 * /api/notifications
 *
 * GET   — List notifications for the authenticated user (scoped by recipientId + schoolId).
 *          Query params: page, limit, unreadOnly (boolean string)
 * PATCH — Mark one or more notifications as read.
 *          Body: { ids: string[] } or { all: true } to mark all read.
 *
 * Requirements: 8.1, 8.4, 8.5, 7.5
 */

import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/auth"
import { connectDB } from "@/lib/mongodb"
import { Notification } from "@/models/Notification"
import {
  ok,
  unauthorized,
  forbidden,
  validationError,
  internalError,
} from "@/lib/api-helpers"

// ── GET /api/notifications ────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { schoolId } = session.user
    // Notifications are tied to a school; super_admin has none via this endpoint
    if (!schoolId) return forbidden("cross_tenant")

    const { searchParams } = new URL(req.url)
    const page       = Math.max(1, Number(searchParams.get("page") ?? "1"))
    const limit      = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "20")))
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    await connectDB()

    const filter: Record<string, unknown> = {
      schoolId,
      recipientId: session.user.id,
    }
    if (unreadOnly) filter.isRead = false

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
    ])

    const unreadCount = await Notification.countDocuments({
      schoolId,
      recipientId: session.user.id,
      isRead: false,
    })

    return ok(notifications, { total, page })
    // Note: unreadCount is embedded in the data response as a convenience header
    // For now it lives in meta via a custom response — but keeping it simple with ok()
    void unreadCount // future: include in meta or response header
  } catch (err) {
    return internalError(err)
  }
}

// ── PATCH /api/notifications ──────────────────────────────────────────────────
const markReadSchema = z.union([
  z.object({ ids: z.array(z.string().min(1)).min(1, "Provide at least one notification ID"), all: z.undefined() }),
  z.object({ all: z.literal(true), ids: z.undefined() }),
])

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return unauthorized()

    const { schoolId } = session.user
    if (!schoolId) return forbidden("cross_tenant")

    const body = await req.json().catch(() => null)
    if (body === null) return validationError([{ code: "custom", path: [], message: "Request body must be valid JSON" }])

    const parsed = markReadSchema.safeParse(body)
    if (!parsed.success) return validationError(parsed.error.issues)

    await connectDB()

    const baseFilter: Record<string, unknown> = {
      schoolId,
      recipientId: session.user.id,
      isRead: false,
    }

    let filter: Record<string, unknown>
    if ("all" in parsed.data && parsed.data.all) {
      filter = baseFilter
    } else if ("ids" in parsed.data && parsed.data.ids) {
      filter = { ...baseFilter, _id: { $in: parsed.data.ids } }
    } else {
      filter = baseFilter
    }

    const result = await Notification.updateMany(
      filter,
      { $set: { isRead: true, readAt: new Date() } }
    )

    return ok({ updated: result.modifiedCount })
  } catch (err) {
    return internalError(err)
  }
}
