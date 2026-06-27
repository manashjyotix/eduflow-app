import { Schema, model, models, Document, Types } from "mongoose"

export type UserRole = "super_admin" | "admin" | "management" | "teacher" | "parent" | "driver"

export interface IUser extends Document {
  schoolId?: Types.ObjectId   // null for super_admin
  name: string
  email: string
  passwordHash: string
  role: UserRole
  phone?: string
  isActive: boolean
  lastLoginAt?: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    schoolId:     { type: Schema.Types.ObjectId, ref: "School", default: null },
    name:         { type: String, required: true, trim: true },
    email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["super_admin", "admin", "management", "teacher", "parent", "driver"],
      required: true,
    },
    phone:       { type: String },
    isActive:    { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
)

// Composite index: one email per school (super_admin has no schoolId)
UserSchema.index({ email: 1, schoolId: 1 }, { unique: true, sparse: true })

export const User = models.User ?? model<IUser>("User", UserSchema)
