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
import {
  SCHOOL_TIMETABLE,
  PERIOD_CONFIG,
  DAYS,
} from "@/data/timetable"

const CLASSES = Object.keys(SCHOOL_TIMETABLE)

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

export default function TimetableViewerPage() {
  const [selectedClass, setSelectedClass] = useState("VIII-A")
  const assignments = buildAssignments(selectedClass)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Calendar size={20} />}
        title="Timetable"
        subtitle="Weekly class schedule — all sections · synced with school timetable"
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
