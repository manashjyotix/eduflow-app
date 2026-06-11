"use client"
import { useState } from "react"
import { BookOpen, CheckCircle, XCircle, MinusCircle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TEACHING_PERIODS } from "@/lib/constants"

const CLASSES = ["Class VI-A", "Class VII-A", "Class VIII-A", "Class IX-A", "Class X-A"]
const STUDENTS = [
  { id: "s1", name: "Rohit Das",       roll: 12 },
  { id: "s2", name: "Priti Bora",      roll: 13 },
  { id: "s3", name: "Aman Hazarika",   roll: 14 },
  { id: "s4", name: "Neha Kalita",     roll: 15 },
  { id: "s5", name: "Deepak Choudhury",roll: 16 },
]

type AttStatus = "present" | "absent" | "late"

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState(CLASSES[0])
  const [selectedPeriod, setSelectedPeriod] = useState(TEACHING_PERIODS[0].id)
  const [attendance, setAttendance] = useState<Record<string, AttStatus>>(
    Object.fromEntries(STUDENTS.map(s => [s.id, "present"]))
  )

  function toggle(id: string) {
    setAttendance(prev => ({
      ...prev,
      [id]: prev[id] === "present" ? "absent" : prev[id] === "absent" ? "late" : "present",
    }))
  }

  const present = Object.values(attendance).filter(v => v === "present").length
  const absent  = Object.values(attendance).filter(v => v === "absent").length

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<BookOpen size={22} />}
        title="Student Attendance"
        subtitle="Mark per-period roll call"
        actions={<Button size="default">Submit Roll</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="flex gap-1 flex-wrap">
          {CLASSES.map(cls => (
            <Button
              key={cls}
              size="xs"
              variant={selectedClass === cls ? "default" : "outline"}
              onClick={() => setSelectedClass(cls)}
            >
              {cls}
            </Button>
          ))}
        </div>
        <Separator orientation="vertical" className="h-7 hidden sm:block" />
        <div className="flex gap-1 flex-wrap">
          {TEACHING_PERIODS.map(p => (
            <Button
              key={p.id}
              size="xs"
              variant={selectedPeriod === p.id ? "default" : "outline"}
              onClick={() => setSelectedPeriod(p.id)}
            >
              {p.id}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base">
            {selectedClass} — {TEACHING_PERIODS.find(p => p.id === selectedPeriod)?.label}
          </CardTitle>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="text-success-foreground font-medium">{present} Present</span>
            <span className="text-destructive font-medium">{absent} Absent</span>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {STUDENTS.map(student => {
              const status = attendance[student.id]
              return (
                <li key={student.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-6 text-center">{student.roll}</span>
                    <p className="text-sm font-medium">{student.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={status === "present" ? "success" : status === "absent" ? "destructive" : "warning"}
                      className="w-16 justify-center capitalize"
                    >
                      {status}
                    </Badge>
                    <Button size="xs" variant="ghost" onClick={() => toggle(student.id)}>
                      {status === "present" ? <CheckCircle className="size-4 text-success-foreground" />
                       : status === "absent" ? <XCircle className="size-4 text-destructive" />
                       : <MinusCircle className="size-4 text-warning-foreground" />}
                    </Button>
                  </div>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
