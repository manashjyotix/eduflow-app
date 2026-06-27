/**
 * fee-io.ts  (Feature F5 — Fees & Dues: offline collection import-export)
 *
 * SheetJS helpers for bulk fee-collection import (schools that collect fees
 * offline and update the app), plus a downloadable demo template and export.
 * Mirrors report-card-io.ts so the two import flows behave identically.
 *
 * One row = one payment.
 */

import * as XLSX from "xlsx"

export const FEE_COLUMNS = [
  "Roll No",
  "Student",
  "Class",
  "Fee Head",
  "Amount",
  "Mode",
  "Reference",
  "Date",
] as const

type HeaderKey = (typeof FEE_COLUMNS)[number]
export type RawFeeRow = Record<HeaderKey, string | number>

export const FEE_MODES = ["Cash", "Cheque", "Bank", "Online"] as const
export type FeeMode = (typeof FEE_MODES)[number]

export interface ParsedFeePayment {
  rollNo?: number
  studentName: string
  className: string
  feeHead: string
  amount: number
  mode: FeeMode
  reference?: string
  date: string // ISO yyyy-mm-dd
}

export interface FeeRowError {
  row: number
  message: string
}

export interface FeeValidationResult {
  valid: ParsedFeePayment[]
  errors: FeeRowError[]
}

// ─── Demo template ──────────────────────────────────────────────────────────

const INSTRUCTIONS: string[][] = [
  ["EduFlow — Fee Collection Import — Instructions"],
  [""],
  ["1. Fill the 'Payments' sheet. One row per payment received."],
  ["2. Columns:"],
  ["   Roll No", "Optional. Student roll number."],
  ["   Student", "Required. Full name of the student."],
  ["   Class", "Required. e.g. VIII-A."],
  ["   Fee Head", "Required. e.g. Tuition Fee, Transport Fee."],
  ["   Amount", "Required. Positive number, no currency symbol."],
  ["   Mode", "Required. One of: Cash, Cheque, Bank, Online."],
  ["   Reference", "Optional. Cheque no. / UTR / txn id."],
  ["   Date", "Required. Format yyyy-mm-dd, e.g. 2026-06-25."],
  [""],
  ["3. Do not rename, reorder, or delete the header row."],
]

export function buildFeeTemplate(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()
  const example: (string | number)[] = [12, "Rohit Das", "VIII-A", "Tuition Fee", 2000, "Cash", "", "2026-06-25"]
  const ws = XLSX.utils.aoa_to_sheet([[...FEE_COLUMNS], example])
  ws["!cols"] = FEE_COLUMNS.map(c => ({ wch: Math.max(12, c.length + 2) }))
  XLSX.utils.book_append_sheet(wb, ws, "Payments")
  const instr = XLSX.utils.aoa_to_sheet(INSTRUCTIONS)
  instr["!cols"] = [{ wch: 16 }, { wch: 56 }]
  XLSX.utils.book_append_sheet(wb, instr, "Instructions")
  return wb
}

export function downloadFeeTemplate(filename = "fee-collection-template.xlsx"): void {
  XLSX.writeFile(buildFeeTemplate(), filename)
}

// ─── Parse + validate ─────────────────────────────────────────────────────────

export async function parseFeeFile(file: File): Promise<RawFeeRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf)
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json<RawFeeRow>(ws, { defval: "" })
}

function toNum(v: string | number): number | null {
  if (typeof v === "number") return v
  const n = Number(String(v).trim())
  return Number.isFinite(n) ? n : null
}

function normalizeMode(v: string): FeeMode | null {
  const m = String(v).trim().toLowerCase()
  if (m === "cash") return "Cash"
  if (m === "cheque" || m === "check") return "Cheque"
  if (m === "bank" || m === "bank transfer" || m === "neft" || m === "upi") return "Bank"
  if (m === "online") return "Online"
  return null
}

function normalizeDate(v: string | number): string | null {
  if (typeof v === "number") {
    // Excel serial date
    const d = XLSX.SSF ? XLSX.SSF.parse_date_code(v) : null
    if (d) return `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`
    return null
  }
  const s = String(v).trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  const parsed = new Date(s)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

export function validateFeeRows(rows: RawFeeRow[]): FeeValidationResult {
  const valid: ParsedFeePayment[] = []
  const errors: FeeRowError[] = []

  rows.forEach((r, i) => {
    const rowNum = i + 2
    const studentName = String(r["Student"] ?? "").trim()
    const className = String(r["Class"] ?? "").trim()
    const feeHead = String(r["Fee Head"] ?? "").trim()
    const amount = toNum(r["Amount"])
    const mode = normalizeMode(String(r["Mode"] ?? ""))
    const reference = String(r["Reference"] ?? "").trim()
    const date = normalizeDate(r["Date"])
    const rollNo = toNum(r["Roll No"])

    const rowErrors: string[] = []
    if (!studentName) rowErrors.push("Student is required")
    if (!className) rowErrors.push("Class is required")
    if (!feeHead) rowErrors.push("Fee Head is required")
    if (amount === null || amount <= 0) rowErrors.push("Amount must be a positive number")
    if (!mode) rowErrors.push("Mode must be Cash, Cheque, Bank, or Online")
    if (!date) rowErrors.push("Date must be yyyy-mm-dd")

    if (rowErrors.length) {
      errors.push({ row: rowNum, message: rowErrors.join("; ") })
      return
    }

    valid.push({
      rollNo: rollNo ?? undefined,
      studentName,
      className,
      feeHead,
      amount: amount as number,
      mode: mode as FeeMode,
      reference: reference || undefined,
      date: date as string,
    })
  })

  return { valid, errors }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export interface ExportablePayment {
  rollNo?: number
  studentName: string
  className: string
  feeHead: string
  amount: number
  mode: string
  reference?: string
  date: string
}

export function exportFeePayments(payments: ExportablePayment[], filename = "fee-collections.xlsx"): void {
  const aoa: (string | number)[][] = [[...FEE_COLUMNS]]
  for (const p of payments) {
    aoa.push([
      p.rollNo ?? "", p.studentName, p.className, p.feeHead,
      p.amount, p.mode, p.reference ?? "", p.date,
    ])
  }
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  XLSX.utils.book_append_sheet(wb, ws, "Payments")
  XLSX.writeFile(wb, filename)
}
