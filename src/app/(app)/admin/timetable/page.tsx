"use client"
import { useState } from "react"
import { Calendar, Printer } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CLASSES } from "@/data/students"
import { TimetableGrid, type TimetableAssignment, type TimetablePeriod } from "@/components/domain/timetable/TimetableGrid"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const PERIODS_CONFIG: TimetablePeriod[] = [
  { id: "P1", time: "9:30–10:10" },
  { id: "P2", time: "10:10–10:50" },
  { id: "P3", time: "10:50–11:30" },
  { id: "P4", time: "11:30–12:10" },
  { id: "TIFFIN", label: "Tiffin", time: "12:10–12:30", isBreak: true },
  { id: "P5", time: "12:30–1:10" },
  { id: "P6", time: "1:10–1:50" },
  { id: "P7", time: "1:50–2:30" },
]

type Cell = { subject: string; teacher: string; color?: string }
type Timetable = Record<string, Record<string, Cell>>

const TIMETABLE_VIII_A: Timetable = {
  Mon: { P1: {subject:"Math",    teacher:"Priya"},   P2: {subject:"English", teacher:"Rajesh"},  P3: {subject:"Science", teacher:"Anita"},  P4: {subject:"SSt",     teacher:"Rajesh"}, P5: {subject:"Hindi",   teacher:"Meena"}, P6: {subject:"Physics", teacher:"Sunita"}, P7: {subject:"PE",      teacher:"Himanta"} },
  Tue: { P1: {subject:"English", teacher:"Rajesh"},  P2: {subject:"Math",    teacher:"Priya"},   P3: {subject:"Hindi",   teacher:"Meena"},  P4: {subject:"Science", teacher:"Anita"},  P5: {subject:"Math",    teacher:"Biju"},  P6: {subject:"English", teacher:"Rajesh"}, P7: {subject:"SSt",     teacher:"Rajesh"} },
  Wed: { P1: {subject:"Science", teacher:"Anita"},   P2: {subject:"Hindi",   teacher:"Meena"},   P3: {subject:"Math",    teacher:"Priya"},  P4: {subject:"English", teacher:"Rajesh"}, P5: {subject:"Physics", teacher:"Sunita"},P6: {subject:"Math",    teacher:"Biju"},  P7: {subject:"PE",      teacher:"Himanta"} },
  Thu: { P1: {subject:"Hindi",   teacher:"Meena"},   P2: {subject:"Science", teacher:"Anita"},   P3: {subject:"English", teacher:"Rajesh"}, P4: {subject:"Math",    teacher:"Priya"},  P5: {subject:"SSt",     teacher:"Rajesh"},P6: {subject:"Physics", teacher:"Sunita"},P7: {subject:"Math",    teacher:"Biju"} },
  Fri: { P1: {subject:"Math",    teacher:"Priya"},   P2: {subject:"Physics", teacher:"Sunita"},  P3: {subject:"Hindi",   teacher:"Meena"},  P4: {subject:"Math",    teacher:"Biju"},   P5: {subject:"English", teacher:"Rajesh"},P6: {subject:"Science", teacher:"Anita"}, P7: {subject:"SSt",     teacher:"Rajesh"} },
  Sat: { P1: {subject:"PE",      teacher:"Himanta"}, P2: {subject:"Math",    teacher:"Priya"},   P3: {subject:"English", teacher:"Rajesh"}, P4: {subject:"Science", teacher:"Anita"},  P5: {subject:"Hindi",   teacher:"Meena"}, P6: {subject:"Math",    teacher:"Biju"},  P7: {subject:"Physics", teacher:"Sunita"} },
}

/** Convert the day→period map into flat TimetableAssignment[] */
function buildAssignments(timetable: Timetable): TimetableAssignment[] {
  const assignments: TimetableAssignment[] = []
  for (const day of DAYS) {
    const row = timetable[day] ?? {}
    for (const [periodId, cell] of Object.entries(row)) {
      assignments.push({ periodId, day, subject: cell.subject, teacher: cell.teacher })
    }
  }
  return assignments
}

export default function TimetablePage() {
  const [selectedClass, setSelectedClass] = useState("VIII-A")
  const assignments = buildAssignments(TIMETABLE_VIII_A)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Calendar size={20} />}
        title="Timetable"
        subtitle="HCEA Weekly Schedule 2025–26"
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
          classes={DAYS}
          assignments={assignments}
          readOnly={false}
        />
      </Card>
    </div>
  )
}
