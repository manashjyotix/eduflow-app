import { Schema, model, models, Document, Types } from "mongoose"

export interface IAbsence extends Document {
  schoolId: Types.ObjectId
  teacherId: Types.ObjectId
  teacherName: string
  date: Date
  periods: string[]          // ["P1","P2"] or ["P1","P2","P3","P4","P5","P6","P7"] for full day
  reason: string
  reasonCategory: "sick_leave" | "casual_leave" | "earned_leave" | "emergency" | "other"
  status: "draft" | "pending" | "approved" | "rejected"
  approvedBy?: Types.ObjectId
  notes?: string
  createdAt: Date
  updatedAt: Date
}

const AbsenceSchema = new Schema<IAbsence>(
  {
    schoolId:    { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    teacherId:   { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    teacherName: { type: String, required: true },
    date:        { type: Date, required: true },
    periods:     { type: [String], default: [] },
    reason:      { type: String, required: true },
    reasonCategory: {
      type: String,
      enum: ["sick_leave", "casual_leave", "earned_leave", "emergency", "other"],
      default: "other",
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "pending",
    },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    notes:      { type: String },
  },
  { timestamps: true }
)

AbsenceSchema.index({ schoolId: 1, date: -1 })

export const Absence = models.Absence ?? model<IAbsence>("Absence", AbsenceSchema)
