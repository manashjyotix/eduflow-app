import { Schema, model, models, Document, Types } from "mongoose"

export interface ISchool extends Document {
  name: string
  address?: string
  city: string
  state: string
  pincode?: string
  website?: string
  phone?: string
  email: string
  principalName?: string
  board?: string
  plan: "monthly" | "quarterly" | "annual"
  trialEndsAt: Date
  subscriptionStatus: "trial" | "active" | "grace" | "suspended"
  settings: {
    attendanceMode: "per-period" | "single-daily"
    dailyProxyCap: number
    weeklyProxyCap: number
    monthlyProxyCap: number
  }
  createdAt: Date
  updatedAt: Date
}

const SchoolSchema = new Schema<ISchool>(
  {
    name:          { type: String, required: true, trim: true },
    address:       { type: String },
    city:          { type: String, required: true },
    state:         { type: String, required: true },
    pincode:       { type: String },
    website:       { type: String },
    phone:         { type: String },
    email:         { type: String, required: true, lowercase: true, trim: true },
    principalName: { type: String },
    board:         { type: String },
    plan: {
      type: String,
      enum: ["monthly", "quarterly", "annual"],
      default: "monthly",
    },
    trialEndsAt: { type: Date, default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) },
    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "grace", "suspended"],
      default: "trial",
    },
    settings: {
      attendanceMode:  { type: String, enum: ["per-period", "single-daily"], default: "per-period" },
      dailyProxyCap:   { type: Number, default: 5 },
      weeklyProxyCap:  { type: Number, default: 15 },
      monthlyProxyCap: { type: Number, default: 40 },
    },
  },
  { timestamps: true }
)

export const School = models.School ?? model<ISchool>("School", SchoolSchema)
