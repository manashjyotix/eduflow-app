"use client"

import { useState } from "react"
import { FileText, Download, Award, BookOpen, TrendingUp, CalendarDays, Landmark, School, ChevronsUpDown } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { SubjectTracker } from "@/components/shared/subject-tracker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { REPORT_CARD_DATA } from "@/data/mock-academics"
import { SUBJECT_COMPLETION } from "@/data/subject-completion"
import {
  SCHOOL_EXAMS,
  EXAM_TYPE_LABEL,
  computeGrade,
  examTotals,
  type SchoolExam,
} from "@/data/exam-config"

type BadgeVariant = "success" | "warning" | "destructive" | "secondary" | "default"

const GRADE_VARIANT: Record<string, BadgeVariant> = {
  "A+": "success",
  "A": "success",
  "A-": "success",
  "B+": "default",
  "B": "secondary",
  "B-": "secondary",
  "C": "warning",
  "F": "destructive",
}

function gradeVariant(grade: string): BadgeVariant {
  return GRADE_VARIANT[grade] ?? "secondary"
}

function barColor(pct: number) {
  if (pct >= 80) return "bg-[var(--ef-green)]"
  if (pct >= 60) return "bg-primary"
  if (pct >= 40) return "bg-[var(--ef-amber)]"
  return "bg-destructive"
}

/* ─────────────────────── shared sorting for marks tables ─────────────────────── */

type ReportSortField = "subject" | "marks" | "maxMarks" | "pct" | "grade" | "remarks"
type SortDir = "asc" | "desc"

interface SortableMark {
  subject: string
  marks: number
  maxMarks: number
  remarks: string
}

const REPORT_COLUMNS: { key: ReportSortField; label: string }[] = [
  { key: "subject",  label: "Subject" },
  { key: "marks",    label: "Marks" },
  { key: "maxMarks", label: "Max" },
  { key: "pct",      label: "%" },
  { key: "grade",    label: "Grade" },
  { key: "remarks",  label: "Remarks" },
]

function useMarkSort() {
  const [sortField, setSortField] = useState<ReportSortField>("subject")
  const [sortDir, setSortDir]     = useState<SortDir>("asc")
  function toggleSort(field: ReportSortField) {
    if (sortField === field) setSortDir(d => (d === "asc" ? "desc" : "asc"))
    else { setSortField(field); setSortDir("asc") }
  }
  return { sortField, sortDir, toggleSort }
}

function sortMarks<T extends SortableMark>(
  rows: T[],
  field: ReportSortField,
  dir: SortDir,
  getGrade: (row: T) => string,
): T[] {
  return [...rows].sort((a, b) => {
    let cmp = 0
    if (field === "subject")       cmp = a.subject.localeCompare(b.subject)
    else if (field === "marks")    cmp = a.marks - b.marks
    else if (field === "maxMarks") cmp = a.maxMarks - b.maxMarks
    else if (field === "pct")      cmp = a.marks / a.maxMarks - b.marks / b.maxMarks
    else if (field === "grade")    cmp = getGrade(a).localeCompare(getGrade(b))
    else if (field === "remarks")  cmp = a.remarks.localeCompare(b.remarks)
    return dir === "asc" ? cmp : -cmp
  })
}

function MarksSortHeader({
  sortField,
  sortDir,
  onSort,
}: {
  sortField: ReportSortField
  sortDir: SortDir
  onSort: (field: ReportSortField) => void
}) {
  return (
    <TableRow className="bg-muted/40 hover:bg-transparent">
      {REPORT_COLUMNS.map((col) => (
        <TableHead
          key={col.key}
          className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground h-auto"
          aria-sort={sortField === col.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
        >
          <button
            type="button"
            onClick={() => onSort(col.key)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSort(col.key) } }}
            className="inline-flex items-center gap-1 font-semibold cursor-pointer select-none hover:text-foreground"
          >
            {col.label}
            <ChevronsUpDown className={`size-3 ${sortField === col.key ? "text-primary" : "opacity-40"}`} />
          </button>
        </TableHead>
      ))}
    </TableRow>
  )
}

export default function ReportCardPage() {
  const { student, attendance, grades, total, teacherRemark, principalRemark } = REPORT_CARD_DATA
  const [showSchedule, setShowSchedule] = useState(false)
  const { sortField, sortDir, toggleSort } = useMarkSort()
  const sortedGrades = sortMarks(grades, sortField, sortDir, (g) => g.grade)

  function handleDownloadPdf() {
    window.print()
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<FileText size={20} />}
        title="Report Card"
        subtitle={`${student.name} — Class ${student.class} — ${student.year}`}
        actions={
          <Button size="sm" variant="outline" className="gap-2 print:hidden" onClick={handleDownloadPdf}>
            <Download className="size-4" />
            Download PDF
          </Button>
        }
      />

      <Tabs defaultValue="overall" className="flex flex-col gap-4">
        {/* Tab bar + schedule toggle */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <TabsList className="flex h-auto flex-wrap justify-start gap-1">
            <TabsTrigger value="overall">Overall</TabsTrigger>
            {SCHOOL_EXAMS.map((exam) => (
              <TabsTrigger key={exam.id} value={exam.id}>
                {exam.shortLabel}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex items-center gap-2">
            <Switch id="show-schedule" checked={showSchedule} onCheckedChange={setShowSchedule} />
            <Label htmlFor="show-schedule" className="text-sm text-muted-foreground cursor-pointer">
              Show exam date &amp; day
            </Label>
          </div>
        </div>

        {/* ── OVERALL (consolidated grade card) ───────────────────────── */}
        <TabsContent value="overall" className="mt-0">
          <div id="report-print-area" className="flex flex-col gap-6">
            <StudentInfo student={student} attendance={attendance} />

            {/* Overall grade highlight + grades table */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BookOpen className="size-4 text-primary" />
                    Subject-wise Performance (Consolidated)
                  </CardTitle>
                </CardHeader>
                <Separator />
                <div className="overflow-x-auto">
                  <Table className="text-sm">
                    <caption className="sr-only">Consolidated report card grades by subject</caption>
                    <TableHeader>
                      <MarksSortHeader sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                    </TableHeader>
                    <TableBody>
                      {sortedGrades.map((g, i) => {
                        const pct = Math.round((g.marks / g.maxMarks) * 100)
                        return (
                          <TableRow key={g.subject} className={`hover:bg-muted/20 ${i % 2 ? "bg-muted/10" : ""}`}>
                            <TableCell className="px-4 py-3 font-medium">{g.subject}</TableCell>
                            <TableCell className="px-4 py-3 font-bold text-foreground">{g.marks}</TableCell>
                            <TableCell className="px-4 py-3 text-muted-foreground">{g.maxMarks}</TableCell>
                            <TableCell className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden" role="img" aria-label={`${pct} percent`}>
                                  <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs text-muted-foreground">{pct}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3">
                              <Badge variant={gradeVariant(g.grade)} className="font-bold min-w-[36px] justify-center">{g.grade}</Badge>
                            </TableCell>
                            <TableCell className="px-4 py-3 text-muted-foreground text-xs">{g.remarks}</TableCell>
                          </TableRow>
                        )
                      })}
                      <TableRow className="bg-primary/5 border-t-2 border-primary/30 font-bold hover:bg-primary/5">
                        <TableCell className="px-4 py-3 text-foreground font-bold">Total</TableCell>
                        <TableCell className="px-4 py-3 text-foreground">{total.marks}</TableCell>
                        <TableCell className="px-4 py-3 text-foreground">{total.maxMarks}</TableCell>
                        <TableCell className="px-4 py-3 text-foreground">{total.percentage}%</TableCell>
                        <TableCell className="px-4 py-3"><Badge variant="default" className="font-bold">B+</Badge></TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground text-xs">Rank {total.rank}/{total.totalStudents}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </Card>

              <Card className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <Award className="size-10 text-primary mb-3" />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Overall Grade</p>
                <p className="text-6xl font-black text-primary mt-1">B+</p>
                <p className="text-sm font-semibold text-foreground mt-2">{total.percentage}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">Rank {total.rank} of {total.totalStudents}</p>
                <Badge variant="success" className="mt-3">Passed</Badge>
              </Card>
            </div>

            <SubjectTracker subjects={SUBJECT_COMPLETION} studentName={student.name} />
            <RemarksAndLegend teacherRemark={teacherRemark} principalRemark={principalRemark} />
          </div>
        </TabsContent>

        {/* ── PER-EXAM TABS ───────────────────────────────────────────── */}
        {SCHOOL_EXAMS.map((exam) => (
          <TabsContent key={exam.id} value={exam.id} className="mt-0">
            <ExamResult
              exam={exam}
              student={student}
              attendance={attendance}
              showSchedule={showSchedule}
              teacherRemark={teacherRemark}
              principalRemark={principalRemark}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

/* ─────────────────────────── sub-components ─────────────────────────── */

type StudentT = typeof REPORT_CARD_DATA.student
type AttendanceT = typeof REPORT_CARD_DATA.attendance

function StudentInfo({ student, attendance }: { student: StudentT; attendance: AttendanceT }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Student Information</CardTitle>
      </CardHeader>
      <Separator />
      <CardContent className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Student Name</p>
            <p className="text-sm font-semibold mt-0.5">{student.name}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Roll Number</p>
            <p className="text-sm font-semibold mt-0.5">{student.rollNo}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Class</p>
            <p className="text-sm font-semibold mt-0.5">{student.class}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Academic Year</p>
            <p className="text-sm font-semibold mt-0.5">{student.year}</p>
          </div>
          <div className="col-span-2 md:col-span-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
              Attendance — {attendance.present}/{attendance.total} days ({attendance.percentage}%)
            </p>
            <Progress value={attendance.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {attendance.percentage >= 85
                ? "Attendance is satisfactory"
                : "Below 85% threshold — improvement required"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ExamResult({
  exam,
  student,
  attendance,
  showSchedule,
  teacherRemark,
  principalRemark,
}: {
  exam: SchoolExam
  student: StudentT
  attendance: AttendanceT
  showSchedule: boolean
  teacherRemark: string
  principalRemark: string
}) {
  const totals = examTotals(exam)
  const overallGrade = computeGrade(totals.percentage)
  const passed = totals.percentage >= 40
  const { sortField, sortDir, toggleSort } = useMarkSort()
  const sortedResults = sortMarks(
    exam.results,
    sortField,
    sortDir,
    (r) => computeGrade(Math.round((r.marks / r.maxMarks) * 100)),
  )
  const scheduleLabel = exam.date
    ? new Date(exam.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null

  return (
    <div id="report-print-area" className="flex flex-col gap-6">
      <StudentInfo student={student} attendance={attendance} />

      {/* Exam meta header */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold text-foreground">{exam.name}</span>
            <Badge variant="secondary">{EXAM_TYPE_LABEL[exam.type]}</Badge>
            <Badge variant={exam.origin === "board" ? "default" : "outline"} className="gap-1">
              {exam.origin === "board" ? <Landmark className="size-3" /> : <School className="size-3" />}
              {exam.origin === "board" ? "Board Exam" : "School Exam"}
            </Badge>
          </div>
          {showSchedule && scheduleLabel && (
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="size-4 text-primary" />
              {exam.day}, {scheduleLabel}
            </span>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Marks table */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BookOpen className="size-4 text-primary" />
              Subject-wise Marks
            </CardTitle>
          </CardHeader>
          <Separator />
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <caption className="sr-only">{exam.name} marks by subject</caption>
              <TableHeader>
                <MarksSortHeader sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
              </TableHeader>
              <TableBody>
                {sortedResults.map((r, i) => {
                  const pct = Math.round((r.marks / r.maxMarks) * 100)
                  const grade = computeGrade(pct)
                  return (
                    <TableRow key={r.subject} className={`hover:bg-muted/20 ${i % 2 ? "bg-muted/10" : ""}`}>
                      <TableCell className="px-4 py-3 font-medium">{r.subject}</TableCell>
                      <TableCell className="px-4 py-3 font-bold text-foreground">{r.marks}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{r.maxMarks}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden" role="img" aria-label={`${pct} percent`}>
                            <div className={`h-full rounded-full ${barColor(pct)}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground">{pct}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant={gradeVariant(grade)} className="font-bold min-w-[36px] justify-center">{grade}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground text-xs">{r.remarks}</TableCell>
                    </TableRow>
                  )
                })}
                <TableRow className="bg-primary/5 border-t-2 border-primary/30 font-bold hover:bg-primary/5">
                  <TableCell className="px-4 py-3 text-foreground font-bold">Total</TableCell>
                  <TableCell className="px-4 py-3 text-foreground">{totals.marks}</TableCell>
                  <TableCell className="px-4 py-3 text-foreground">{totals.maxMarks}</TableCell>
                  <TableCell className="px-4 py-3 text-foreground">{totals.percentage}%</TableCell>
                  <TableCell className="px-4 py-3"><Badge variant={gradeVariant(overallGrade)} className="font-bold">{overallGrade}</Badge></TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground text-xs">Rank {exam.rank}/{exam.totalStudents}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Grade highlight */}
        <Card className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
          <Award className="size-10 text-primary mb-3" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest text-center">{exam.name} Grade</p>
          <p className="text-6xl font-black text-primary mt-1">{overallGrade}</p>
          <p className="text-sm font-semibold text-foreground mt-2">{totals.percentage}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Rank {exam.rank} of {exam.totalStudents}</p>
          <Badge variant={passed ? "success" : "destructive"} className="mt-3">{passed ? "Passed" : "Needs Improvement"}</Badge>
        </Card>
      </div>

      <RemarksAndLegend teacherRemark={teacherRemark} principalRemark={principalRemark} />
    </div>
  )
}

function RemarksAndLegend({ teacherRemark, principalRemark }: { teacherRemark: string; principalRemark: string }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" /> Grade Legend
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4 space-y-2">
          {[
            { range: "A+  (95-100%)", desc: "Outstanding",   color: "bg-[var(--ef-green)]" },
            { range: "A   (80-94%)",  desc: "Excellent",     color: "bg-[var(--ef-green-dark)]" },
            { range: "B+  (70-79%)",  desc: "Very Good",     color: "bg-[var(--ef-brand)]"  },
            { range: "B   (60-69%)",  desc: "Good",          color: "bg-[var(--ef-brand-hover)]" },
            { range: "C   (40-59%)",  desc: "Satisfactory",  color: "bg-[var(--ef-amber)]" },
            { range: "F   (Below 40%)", desc: "Fail",        color: "bg-[var(--ef-red)]"   },
          ].map((l) => (
            <div key={l.range} className="flex items-center gap-3">
              <span className={`inline-block w-3 h-3 rounded-full flex-shrink-0 ${l.color}`} />
              <span className="text-sm font-mono w-28">{l.range}</span>
              <span className="text-xs text-muted-foreground">{l.desc}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Remarks</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Class Teacher</p>
            <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3 border border-border/60 italic">
              &quot;{teacherRemark}&quot;
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Principal</p>
            <p className="text-sm text-foreground leading-relaxed bg-muted/30 rounded-lg p-3 border border-border/60 italic">
              &quot;{principalRemark}&quot;
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
