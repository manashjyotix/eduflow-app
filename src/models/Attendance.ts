import { Schema, model, models, Document, Types } from "mongoose"

export interface IAttendanceRecord {
  studentId: string
  studentName: string
  status: "present" | "absent" | "late" | "excused"
  note?: string
}

export interface IAttendance extends Document {
  schoolId: Types.ObjectId
  teacherId: Types.ObjectId
  classId: string               // e.g. "VIII-A"
  period: string                // "P1"–"P7", or "full-day"
  date: Date
  records: IAttendanceRecord[]
  markedAt: Date
  createdAt: Date
  updatedAt: Date
}

const AttendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    studentId:   { type: String, required: true },
    studentName: { type: String, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
    },
    note: { type: String },
  },
  { _id: false }
)

const AttendanceSchema = new Schema<IAttendance>(
  {
    schoolId:  { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
    classId:   { type: String, required: true },
    period:    { type: String, required: true },
    date:      { type: Date, required: true },
    records:   { type: [AttendanceRecordSchema], default: [] },
    markedAt:  { type: Date, default: () => new Date() },
  },
  { timestamps: true }
)

AttendanceSchema.index({ schoolId: 1, date: -1 })
AttendanceSchema.index({ schoolId: 1, classId: 1, date: -1 })

export const Attendance = models.Attendance ?? model<IAttendance>("Attendance", AttendanceSchema)
