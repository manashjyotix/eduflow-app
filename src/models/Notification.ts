import { Schema, model, models, Document, Types } from "mongoose"
import type { UserRole } from "./User"

export interface INotification extends Document {
  schoolId: Types.ObjectId
  recipientId: Types.ObjectId   // User ref
  recipientRole: UserRole
  title: string
  body: string
  type: "info" | "warning" | "success" | "error" | "proxy_request" | "absence" | "fee" | "announcement"
  isRead: boolean
  readAt?: Date
  meta?: Record<string, unknown>  // optional extra payload (absenceId, proxyId, etc.)
  createdAt: Date
  updatedAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    schoolId:      { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    recipientId:   { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recipientRole: {
      type: String,
      enum: ["super_admin", "admin", "management", "teacher", "parent"],
      required: true,
    },
    title:  { type: String, required: true },
    body:   { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error", "proxy_request", "absence", "fee", "announcement"],
      default: "info",
    },
    isRead:  { type: Boolean, default: false },
    readAt:  { type: Date },
    meta:    { type: Schema.Types.Mixed },
  },
  { timestamps: true }
)

NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 })

export const Notification = models.Notification ?? model<INotification>("Notification", NotificationSchema)
