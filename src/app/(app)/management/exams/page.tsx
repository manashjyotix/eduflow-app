"use client"

import { BookOpen, Calendar, Clock, GraduationCap } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { EduBarChart } from "@/components/shared/edu-bar-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"

const EXAMS = [
  { id: "e1", subject: "Mathematics",    class: "Class VIII",  date: "2026-06-20", time: "9:30 – 11:30", room: "Room 4", invigilator: "Priya Sharma" },
  { id: "e2", subject: "English",        class: "Class VIII",  date: "2026-06-21", time: "9:30 – 11:30", room: "Room 4", invigilator: "Rajesh Kalita" },
  { id: "e3", subject: "Science",        class: "Class VII",   date: "2026-06-22", time: "9:30 – 11:30", room: "Room 3", invigilator: "Sunita Borah" },
  { id: "e4", subject: "Social Studies", class: "Class VII",   date: "2026-06-23", time: "9:30 – 11:30", room: "Room 3", invigilator: "Biju Das" },
  { id: "e5", subject: "Mathematics",    class: "Class IX",    date: "2026-06-24", time: "9:30 – 11:30", room: "Room 5", invigilator: "Priya Sharma" },
  { id: "e6", subject: "English",        class: "Class X",     date: "2026-06-25", time: "9:30 – 11:30", room: "Room 6", invigilator: "Rajesh Kalita" },
]

// Exams per day (for the bar chart)
const EXAM_SCHEDULE_CHART = EXAMS.reduce<{ date: string; exams: number }[]>((acc, e) => {
  const label = new Date(e.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
  const existing = acc.find(a => a.date === label)
  if (existing) existing.exams++
  else acc.push({ date: label, exams: 1 })
  return acc
}, [])

const today = new Date().toISOString().split("T")[0]
const classes = [...new Set(EXAMS.map(e => e.class))].length
const remaining = EXAMS.filter(e => e.date >= today).length
const invigilators = [...new Set(EXAMS.map(e => e.invigilator))].length

export default function ExamSchedulePage() {
  const { sorted: sortedExams, sortField, sortDir, toggleSort } = useTableSort<
    (typeof EXAMS)[number],
    "date" | "subject" | "class" | "time" | "room" | "invigilator"
  >(EXAMS, {
    date:        e => e.date,
    subject:     e => e.subject,
    class:       e => e.class,
    time:        e => e.time,
    room:        e => e.room,
    invigilator: e => e.invigilator,
  }, { field: "date" })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<BookOpen size={22} />}
        title="Exam Schedule"
        subtitle="Term-end examination timetable — HCEA"
        actions={<Button size="default">Edit Schedule</Button>}
      />

      {/* KPI grid — 4 cols */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="Total Exams"
          value={EXAMS.length}
          subtitle="this term"
          icon={<BookOpen className="size-5" />}
          sparkline={{ variant: "bar", data: [1, 1, 1, 1, 1, 1], color: "var(--ef-brand)" }}
        />
        <KpiCard
          title="Remaining"
          value={remaining}
          subtitle="yet to be held"
          icon={<Clock className="size-5" />}
          iconClassName="bg-ef-amber-light text-ef-amber"
          sparkline={{ variant: "bar", data: [6, 5, 4, 3, 2, remaining], color: "var(--ef-amber)" }}
        />
        <KpiCard
          title="Classes"
          value={classes}
          subtitle="classes scheduled"
          icon={<GraduationCap className="size-5" />}
          iconClassName="bg-primary/10 text-primary"
          sparkline={{ variant: "bar", data: [2, 2, 3, 3, 3, classes], color: "var(--ef-brand)" }}
        />
        <KpiCard
          title="Invigilators"
          value={invigilators}
          subtitle="teachers assigned"
          icon={<Calendar className="size-5" />}
          iconClassName="bg-success/15 text-success-foreground"
          sparkline={{ variant: "bar", data: [1, 2, 2, 2, 2, invigilators], color: "var(--ef-green)" }}
        />
      </div>

      {/* Daily exam load chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="size-4 text-primary" /> Daily Exam Load
          </CardTitle>
          <Badge variant="warning">{remaining} remaining</Badge>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <EduBarChart
            data={EXAM_SCHEDULE_CHART}
            series={[{ dataKey: "exams", name: "Exams", color: "var(--ef-brand)" }]}
            xKey="date"
            height={120}
            showYAxis={false}
            tooltipFormatter={v => `${v} exam${v > 1 ? "s" : ""}`}
          />
        </CardContent>
      </Card>

      {/* Timetable table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Upcoming Exams</CardTitle>
          <Badge variant="warning">{remaining} remaining</Badge>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 overflow-x-auto">
          <Table className="text-sm">
            <caption className="sr-only">Upcoming and past exam schedule</caption>
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <SortableHead field="date" label="Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs font-medium text-muted-foreground px-6 py-3" />
                <SortableHead field="subject" label="Subject" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs font-medium text-muted-foreground px-4 py-3" />
                <SortableHead field="class" label="Class" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs font-medium text-muted-foreground px-4 py-3" />
                <SortableHead field="time" label="Time" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs font-medium text-muted-foreground px-4 py-3" />
                <SortableHead field="room" label="Room" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs font-medium text-muted-foreground px-4 py-3" />
                <SortableHead field="invigilator" label="Invigilator" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs font-medium text-muted-foreground px-6 py-3" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExams.map(exam => {
                const isPast = exam.date < today
                const isToday = exam.date === today
                return (
                  <TableRow key={exam.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className={isPast ? "text-muted-foreground line-through" : "font-medium"}>
                          {new Date(exam.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                        {isToday && <Badge variant="default" className="text-xs">Today</Badge>}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-medium">{exam.subject}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">{exam.class}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">{exam.time}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground">{exam.room}</TableCell>
                    <TableCell className="px-6 py-3 text-muted-foreground">{exam.invigilator}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
