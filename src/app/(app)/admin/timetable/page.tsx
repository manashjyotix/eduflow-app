"use client"
import { useState } from "react"
import { Calendar, Printer } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  TimetableGrid,
  type TimetableAssignment,
  type TimetablePeriod,
} from "@/components/domain/timetable/TimetableGrid"
import {
  SCHOOL_TIMETABLE,
  PERIOD_CONFIG,
  DAYS,
} from "@/data/timetable"
import { CLASSES } from "@/data/students"

/** Convert the shared timetable data into flat TimetableAssignment[] for TimetableGrid */
function buildAssignments(cls: string): TimetableAssignment[] {
  const periodMap = SCHOOL_TIMETABLE[cls]
  if (!periodMap) return []
  const assignments: TimetableAssignment[] = []
  for (const [periodId, dayMap] of Object.entries(periodMap)) {
    for (const [day, cell] of Object.entries(dayMap)) {
      if (cell) {
        assignments.push({ periodId, day, subject: cell.subject, teacher: cell.teacher })
      }
    }
  }
  return assignments
}

const PERIODS_CONFIG: TimetablePeriod[] = PERIOD_CONFIG.map(p => ({
  id:      p.id,
  label:   p.label,
  time:    p.time,
  isBreak: p.isBreak,
}))

// Use the short day labels (Mon/Tue/…) that TimetableGrid expects as column keys
const DAY_COLS = DAYS // ["Mon","Tue","Wed","Thu","Fri","Sat"]

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState("VIII-A")
  const assignments = buildAssignments(selectedClass)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Calendar size={20} />}
        title="Timetable"
        subtitle="HCEA Weekly Schedule 2025–26 · synced with school timetable"
        actions={
          <div className="flex gap-2">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Printer className="size-4" /> Print
            </Button>
            <Button size="sm" variant="outline">Edit Timetable</Button>
          </div>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Class {selectedClass} — Weekly Schedule
          </CardTitle>
        </CardHeader>
        <Separator />
        <TimetableGrid
          periods={PERIODS_CONFIG}
          classes={DAY_COLS}
          assignments={assignments}
          readOnly={false}
        />
      </Card>
    </div>
  )
}
