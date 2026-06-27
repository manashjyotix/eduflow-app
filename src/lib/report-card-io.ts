/**
 * report-card-io.ts  (Feature F3 — Report Cards: Excel/CSV import-export)
 *
 * SheetJS-backed helpers to:
 *  - build + download a demo template (with an Instructions sheet),
 *  - parse an uploaded .xlsx / .csv into rows,
 *  - validate rows (row-level errors before commit),
 *  - export report cards back out.
 *
 * One row = one subject for one student. Rows are grouped by student to form a
 * report card. Keep all spreadsheet logic here so the UI stays declarative.
 */

import * as XLSX from "xlsx"
import { gradeForPercentage, type ReportCard, type SubjectMark } from "@/data/mock-report-cards"

/** Canonical import columns (header row). Order matters for the template. */
export const REPORT_CARD_COLUMNS = [
  "Roll No",
  "Student Name",
  "Class",
  "Section",
  "Subject",
  "Max Marks",
  "Marks Obtained",
  "Remark",
] as const

type HeaderKey = (typeof REPORT_CARD_COLUMNS)[number]
export type RawRow = Record<HeaderKey, string | number>

export interface ParsedMarkRow {
  rollNo: number
  studentName: string
  className: string // combined "VIII-A"
  subject: string
  maxMarks: number
  marks: number
  remark?: string
}

export interface RowError {
  row: number // 1-based, matching the spreadsheet (header = row 1)
  message: string
}

export interface ValidationResult {
  valid: ParsedMarkRow[]
  errors: RowError[]
}

// ─── Demo template ──────────────────────────────────────────────────────────

const INSTRUCTIONS: string[][] = [
  ["EduFlow — Report Card Import — Instructions"],
  [""],
  ["1. Fill the 'Marks' sheet. One row per subject per student."],
  ["2. A student with 6 subjects therefore needs 6 rows (same Roll No / Name)."],
  ["3. Columns:"],
  ["   Roll No", "Integer. The student's roll number in the class."],
  ["   Student Name", "Full name. Must match the school records."],
  ["   Class", "Class only, e.g. VIII (no section here)."],
  ["   Section", "Section letter, e.g. A."],
  ["   Subject", "Subject name, e.g. Mathematics."],
  ["   Max Marks", "Integer > 0. Maximum marks for the subject."],
  ["   Marks Obtained", "Integer between 0 and Max Marks."],
  ["   Remark", "Optional short remark."],
  [""],
  ["4. Do not rename, reorder, or delete the header row in the 'Marks' sheet."],
  ["5. Grades and totals are computed automatically on import."],
]

/** Build a workbook: 'Marks' (headers + one example row) + 'Instructions'. */
export function buildDemoTemplate(): XLSX.WorkBook {
  const wb = XLSX.utils.book_new()

  const example: (string | number)[] = [12, "Rohit Das", "VIII", "A", "Mathematics", 80, 74, "Excellent"]
  const marks = XLSX.utils.aoa_to_sheet([[...REPORT_CARD_COLUMNS], example])
  marks["!cols"] = REPORT_CARD_COLUMNS.map(c => ({ wch: Math.max(12, c.length + 2) }))
  XLSX.utils.book_append_sheet(wb, marks, "Marks")

  const instr = XLSX.utils.aoa_to_sheet(INSTRUCTIONS)
  instr["!cols"] = [{ wch: 18 }, { wch: 60 }]
  XLSX.utils.book_append_sheet(wb, instr, "Instructions")

  return wb
}

/** Trigger a browser download of the demo template. */
export function downloadDemoTemplate(filename = "report-card-template.xlsx"): void {
  XLSX.writeFile(buildDemoTemplate(), filename)
}

// ─── Parse + validate ─────────────────────────────────────────────────────────

/** Read an uploaded file into raw rows (first sheet). */
export async function parseReportCardFile(file: File): Promise<RawRow[]> {
  const buf = await file.arrayBuffer()
  const wb = XLSX.read(buf)
  const ws = wb.Sheets[wb.SheetNames[0]]
  return XLSX.utils.sheet_to_json<RawRow>(ws, { defval: "" })
}

function toNumber(v: string | number): number | null {
  if (typeof v === "number") return v
  const n = Number(String(v).trim())
  return Number.isFinite(n) ? n : null
}

/** Validate raw rows; returns clean rows + row-level errors. */
export function validateRows(rows: RawRow[]): ValidationResult {
  const valid: ParsedMarkRow[] = []
  const errors: RowError[] = []

  rows.forEach((r, i) => {
    const rowNum = i + 2 // header is row 1
    const name = String(r["Student Name"] ?? "").trim()
    const cls = String(r["Class"] ?? "").trim()
    const section = String(r["Section"] ?? "").trim()
    const subject = String(r["Subject"] ?? "").trim()
    const rollNo = toNumber(r["Roll No"])
    const maxMarks = toNumber(r["Max Marks"])
    const marks = toNumber(r["Marks Obtained"])
    const remark = String(r["Remark"] ?? "").trim()

    const rowErrors: string[] = []
    if (!name) rowErrors.push("Student Name is required")
    if (!cls) rowErrors.push("Class is required")
    if (!section) rowErrors.push("Section is required")
    if (!subject) rowErrors.push("Subject is required")
    if (rollNo === null) rowErrors.push("Roll No must be a number")
    if (maxMarks === null || maxMarks <= 0) rowErrors.push("Max Marks must be a positive number")
    if (marks === null || marks < 0) rowErrors.push("Marks Obtained must be 0 or more")
    if (maxMarks !== null && marks !== null && marks > maxMarks)
      rowErrors.push(`Marks Obtained (${marks}) cannot exceed Max Marks (${maxMarks})`)

    if (rowErrors.length) {
      errors.push({ row: rowNum, message: rowErrors.join("; ") })
      return
    }

    valid.push({
      rollNo: rollNo as number,
      studentName: name,
      className: `${cls}-${section}`,
      subject,
      maxMarks: maxMarks as number,
      marks: marks as number,
      remark: remark || undefined,
    })
  })

  return { valid, errors }
}

/** Group validated rows into report cards (one per student per class). */
export function rowsToReportCards(
  rows: ParsedMarkRow[],
  term: string,
  enteredBy: string,
): ReportCard[] {
  const byStudent = new Map<string, ParsedMarkRow[]>()
  for (const r of rows) {
    const key = `${r.className}__${r.rollNo}__${r.studentName}`
    const list = byStudent.get(key) ?? []
    list.push(r)
    byStudent.set(key, list)
  }

  const cards: ReportCard[] = []
  for (const [key, list] of byStudent) {
    const subjects: SubjectMark[] = list.map(r => ({
      subject: r.subject,
      marks: r.marks,
      maxMarks: r.maxMarks,
      grade: gradeForPercentage((r.marks / r.maxMarks) * 100),
      remark: r.remark,
    }))
    const total = subjects.reduce((s, x) => s + x.marks, 0)
    const maxTotal = subjects.reduce((s, x) => s + x.maxMarks, 0)
    const first = list[0]
    cards.push({
      id: `rc-${key.replace(/\W+/g, "-")}`,
      studentId: `imp-${first.rollNo}`,
      studentName: first.studentName,
      rollNo: first.rollNo,
      className: first.className,
      term,
      subjects,
      total,
      maxTotal,
      percentage: maxTotal ? Math.round((total / maxTotal) * 1000) / 10 : 0,
      status: "draft",
      enteredBy,
    })
  }
  return cards
}

// ─── Export ───────────────────────────────────────────────────────────────────

/** Export report cards to a downloadable .xlsx (one row per subject). */
export function exportReportCards(cards: ReportCard[], filename = "report-cards.xlsx"): void {
  const aoa: (string | number)[][] = [[...REPORT_CARD_COLUMNS, "Grade", "Term", "Status"]]
  for (const c of cards) {
    const [cls, section] = c.className.split("-")
    for (const s of c.subjects) {
      aoa.push([
        c.rollNo, c.studentName, cls, section ?? "",
        s.subject, s.maxMarks, s.marks, s.remark ?? "",
        s.grade, c.term, c.status,
      ])
    }
  }
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  XLSX.utils.book_append_sheet(wb, ws, "Report Cards")
  XLSX.writeFile(wb, filename)
}
