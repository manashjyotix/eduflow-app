import { Schema, model, models, Document, Types } from "mongoose"

export interface IProxy extends Document {
  schoolId: Types.ObjectId
  absenceId: Types.ObjectId
  absentTeacherId: Types.ObjectId
  proxyTeacherId: Types.ObjectId
  proxyTeacherName: string
  period: string              // "P1" – "P7"
  classId: string             // e.g. "VIII-A"
  subject: string
  date: Date
  status: "assigned" | "accepted" | "declined" | "completed"
  assignedBy?: Types.ObjectId // null = auto-assigned
  score?: number              // scoring algorithm result
  createdAt: Date
  updatedAt: Date
}

const ProxySchema = new Schema<IProxy>(
  {
    schoolId:         { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    absenceId:        { type: Schema.Types.ObjectId, ref: "Absence", required: true },
    absentTeacherId:  { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    proxyTeacherId:   { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    proxyTeacherName: { type: String, required: true },
    period:           { type: String, required: true },
    classId:          { type: String, required: true },
    subject:          { type: String, required: true },
    date:             { type: Date, required: true },
    status: {
      type: String,
      enum: ["assigned", "accepted", "declined", "completed"],
      default: "assigned",
    },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User" },
    score:      { type: Number },
  },
  { timestamps: true }
)

ProxySchema.index({ schoolId: 1, date: -1 })
ProxySchema.index({ proxyTeacherId: 1, date: -1 })

export const Proxy = models.Proxy ?? model<IProxy>("Proxy", ProxySchema)
