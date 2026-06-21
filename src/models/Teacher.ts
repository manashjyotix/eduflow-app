import { Schema, model, models, Document, Types } from "mongoose"

export interface ITeacher extends Document {
  schoolId: Types.ObjectId
  userId?: Types.ObjectId        // linked User account (optional)
  name: string
  email: string
  phone?: string
  subjects: string[]
  section: "Primary" | "Middle" | "High"
  status: "active" | "on_leave" | "inactive"
  dailyProxyCap: number
  weeklyProxyCap: number
  monthlyProxyCap: number
  createdAt: Date
  updatedAt: Date
}

const TeacherSchema = new Schema<ITeacher>(
  {
    schoolId:  { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    userId:    { type: Schema.Types.ObjectId, ref: "User" },
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, lowercase: true, trim: true },
    phone:     { type: String },
    subjects:  { type: [String], default: [] },
    section: {
      type: String,
      enum: ["Primary", "Middle", "High"],
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "on_leave", "inactive"],
      default: "active",
    },
    dailyProxyCap:   { type: Number, default: 5 },
    weeklyProxyCap:  { type: Number, default: 15 },
    monthlyProxyCap: { type: Number, default: 40 },
  },
  { timestamps: true }
)

TeacherSchema.index({ schoolId: 1, email: 1 }, { unique: true })

export const Teacher = models.Teacher ?? model<ITeacher>("Teacher", TeacherSchema)
