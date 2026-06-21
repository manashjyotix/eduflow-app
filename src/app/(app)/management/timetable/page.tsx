"use client"

import { useState } from "react"
import { Calendar, Download } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  TimetableGrid,
  type TimetableAssignment,
  type TimetablePeriod,
} from "@/components/domain/timetable/TimetableGrid"

const CLASSES = ["VI-A", "VI-B", "VII-A", "VII-B", "VIII-A", "IX-A", "X-A"]
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

const PERIODS_CONFIG: TimetablePeriod[] = [
  { id: "P1", time: "9:30–10:10" },
  { id: "P2", time: "10:10–10:50" },
  { id: "P3", time: "10:50–11:30" },
  { id: "P4", time: "11:30–12:10" },
  { id: "TIFFIN", label: "TIFFIN", time: "12:10–12:30", isBreak: true },
  { id: "P5", time: "12:30–1:10" },
  { id: "P6", time: "1:10–1:50" },
  { id: "P7", time: "1:50–2:30" },
]

type Cell = { subject: string; teacher: string } | null
type TimetableData = Record<string, Record<string, Record<string, Cell>>>

const TIMETABLE_DATA: TimetableData = {
  "VIII-A": {
    P1: {
      Monday: { subject: "Mathematics", teacher: "Priya Sharma" },
      Tuesday: { subject: "English", teacher: "Rajesh Kalita" },
      Wednesday: { subject: "Science", teacher: "Anita Devi" },
      Thursday: { subject: "Social Studies", teacher: "Rajesh Kalita" },
      Friday: { subject: "Hindi", teacher: "Rima Das" },
    },
    P2: {
      Monday: { subject: "English", teacher: "Rajesh Kalita" },
      Tuesday: { subject: "Mathematics", teacher: "Priya Sharma" },
      Wednesday: { subject: "Hindi", teacher: "Rima Das" },
      Thursday: { subject: "Science", teacher: "Anita Devi" },
      Friday: { subject: "Mathematics", teacher: "Priya Sharma" },
    },
    P3: {
      Monday: { subject: "Science", teacher: "Anita Devi" },
      Tuesday: { subject: "Social Studies", teacher: "Rajesh Kalita" },
      Wednesday: { subject: "Mathematics", teacher: "Priya Sharma" },
      Thursday: { subject: "English", teacher: "Rajesh Kalita" },
      Friday: { subject: "Science", teacher: "Anita Devi" },
    },
    P4: {
      Monday: { subject: "Hindi", teacher: "Rima Das" },
      Tuesday: { subject: "Science", teacher: "Anita Devi" },
      Wednesday: { subject: "Social Studies", teacher: "Rajesh Kalita" },
      Thursday: { subject: "Mathematics", teacher: "Priya Sharma" },
      Friday: { subject: "English", teacher: "Rajesh Kalita" },
    },
    TIFFIN: { Monday: null, Tuesday: null, Wednesday: null, Thursday: null, Friday: null },
    P5: {
      Monday: { subject: "Sanskrit", teacher: "Himanta Bezbaruah" },
      Tuesday: { subject: "Hindi", teacher: "Rima Das" },
      Wednesday: { subject: "English", teacher: "Rajesh Kalita" },
      Thursday: { subject: "Sanskrit", teacher: "Himanta Bezbaruah" },
      Friday: { subject: "Social Studies", teacher: "Rajesh Kalita" },
    },
    P6: {
      Monday: { subject: "Social Studies", teacher: "Rajesh Kalita" },
      Tuesday: { subject: "Sanskrit", teacher: "Himanta Bezbaruah" },
      Wednesday: { subject: "Phys. Ed", teacher: "Himanta Bezbaruah" },
      Thursday: { subject: "Hindi", teacher: "Rima Das" },
      Friday: { subject: "Mathematics", teacher: "Priya Sharma" },
    },
    P7: {
      Monday: { subject: "Phys. Ed", teacher: "Himanta Bezbaruah" },
      Tuesday: { subject: "Mathematics", teacher: "Priya Sharma" },
      Wednesday: { subject: "Sanskrit", teacher: "Himanta Bezbaruah" },
      Thursday: { subject: "Phys. Ed", teacher: "Himanta Bezbaruah" },
      Friday: { subject: "Science", teacher: "Anita Devi" },
    },
  },
}

const ORDERED_PERIOD_IDS = ["P1", "P2", "P3", "P4", "TIFFIN", "P5", "P6", "P7"]
const SUBJECTS = ["Mathematics", "English", "Science", "Social Studies", "Hindi", "Sanskrit", "EVS"]
const TEACHERS_LIST = [
  "Priya Sharma", "Rajesh Kalita", "Biju Das", "Meena Gogoi",
  "Sunita Borah", "Rima Das", "Himanta Bezbaruah",
]

function buildAssignments(cls: string): TimetableAssignment[] {
  const raw: Record<string, Record<string, Cell>> = TIMETABLE_DATA[cls] ?? (() => {
    const data: Record<string, Record<string, Cell>> = {}
    let idx = 0
    for (const pid of ORDERED_PERIOD_IDS) {
      data[pid] = {}
      for (const d of DAYS) {
        if (pid === "TIFFIN") { data[pid][d] = null; continue }
        data[pid][d] = {
          subject: SUBJECTS[idx % SUBJECTS.length],
          teacher: TEACHERS_LIST[idx % TEACHERS_LIST.length],
        }
        idx++
      }
    }
    return data
  })()

  const assignments: TimetableAssignment[] = []
  for (const [periodId, dayMap] of Object.entries(raw)) {
    for (const [day, cell] of Object.entries(dayMap)) {
      if (cell) {
        assignments.push({ periodId, day, subject: cell.subject, teacher: cell.teacher })
      }
    }
  }
  return assignments
}

export default function TimetableViewerPage() {
  const [selectedClass, setSelectedClass] = useState("VIII-A")
  const assignments = buildAssignments(selectedClass)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Calendar size={20} />}
        title="Timetable"
        subtitle="Weekly class schedule — all sections"
        actions={
          <Button variant="outline" size="sm">
            <Download size={14} className="mr-1.5" /> Export PDF
          </Button>
        }
      />

      {/* Class selector chips */}
      <div className="flex flex-wrap gap-3 items-center">
        <span className="text-sm font-medium text-muted-foreground">Select Class:</span>
        <div className="flex flex-wrap gap-2">
          {CLASSES.map(cls => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                selectedClass === cls
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-muted"
              }`}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Class {selectedClass} — Weekly Schedule
          </CardTitle>
          <Badge variant="outline">{selectedClass}</Badge>
        </CardHeader>
        <Separator />
        {/* readOnly — management can view but not assign */}
        <TimetableGrid
          periods={PERIODS_CONFIG}
          classes={DAYS}
          assignments={assignments}
          readOnly
        />
      </Card>
    </div>
  )
}
