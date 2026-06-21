import { Schema, model, models, Document, Types } from "mongoose"

export interface IFee extends Document {
  schoolId: Types.ObjectId
  studentId: string             // Student identifier (no Student model yet; kept as string)
  studentName: string
  className: string
  amount: number
  paymentMode: "cash" | "upi" | "bank_transfer" | "cheque" | "dd" | "online"
  feeCategory: "tuition" | "transport" | "hostel" | "library" | "lab" | "sports" | "exam" | "admission" | "miscellaneous"
  receiptNumber?: string
  paymentDate: Date
  remarks?: string
  collectedBy: Types.ObjectId   // User ref
  createdAt: Date
  updatedAt: Date
}

const FeeSchema = new Schema<IFee>(
  {
    schoolId:   { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    studentId:  { type: String, required: true },
    studentName:{ type: String, required: true },
    className:  { type: String, required: true },
    amount: { type: Number, required: true },
    paymentMode: {
      type: String,
      enum: ["cash", "upi", "bank_transfer", "cheque", "dd", "online"],
      required: true,
    },
    feeCategory: {
      type: String,
      enum: ["tuition", "transport", "hostel", "library", "lab", "sports", "exam", "admission", "miscellaneous"],
      required: true,
    },
    receiptNumber: { type: String },
    paymentDate:   { type: Date, required: true },
    remarks:       { type: String },
    collectedBy:   { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
)

FeeSchema.index({ schoolId: 1, paymentDate: -1 })
FeeSchema.index({ schoolId: 1, studentId: 1 })

export const Fee = models.Fee ?? model<IFee>("Fee", FeeSchema)
