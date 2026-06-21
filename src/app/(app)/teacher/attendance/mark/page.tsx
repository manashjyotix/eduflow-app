"use client"
import { useState } from "react"
import { ClipboardCheck, Check, X } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { ProgressNotes } from "@/components/shared/progress-notes"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { STUDENTS } from "@/data/students"
import { MOCK_PROGRESS_NOTES, type ProgressNote } from "@/data/progress-notes"
import { cn } from "@/lib/utils"

const PERIODS = ["P1","P2","P3","P4","P5","P6","P7"]
const CLASSES = ["VI-A","VI-B","VII-A","VII-B","VIII-A","VIII-B","IX-A","X-A"]

export default function MarkAttendancePage() {
  const [cls, setCls]       = useState("VIII-A")
  const [period, setPeriod] = useState("P3")
  const [submitted, setSubmitted] = useState(false)
  const [notes, setNotes] = useState<ProgressNote[]>(MOCK_PROGRESS_NOTES)
  const classStudents = STUDENTS.slice(0,22)
  const [attendance, setAttendance] = useState<Record<string,"P"|"A">>(
    Object.fromEntries(classStudents.map(s => [s.id, "P"]))
  )
  const presentCount = Object.values(attendance).filter(v => v==="P").length

  function toggle(id: string) {
    if (submitted) return
    setAttendance(prev => ({ ...prev, [id]: prev[id]==="P" ? "A" : "P" }))
  }

  if (submitted) return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader icon={<ClipboardCheck size={20}/>} title="Mark Attendance" subtitle={`${cls} · ${period}`}/>
      <Card className="max-w-md mx-auto text-center">
        <CardContent className="pt-8 pb-6">
          <div className="size-16 rounded-full bg-success flex items-center justify-center mx-auto mb-4">
            <Check className="size-8 text-success-foreground"/>
          </div>
          <h3 className="text-lg font-semibold mb-1">Attendance Submitted!</h3>
          <p className="text-muted-foreground text-sm">{presentCount}/{classStudents.length} students marked present for {period} · {cls}</p>
          <Button className="mt-6 w-full" variant="outline" onClick={() => setSubmitted(false)}>Mark Another</Button>
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<ClipboardCheck size={20}/>}
        title="Mark Attendance"
        subtitle="Take roll call for your class"
        actions={
          <Button onClick={() => setSubmitted(true)} className="bg-success hover:bg-success/90 text-success-foreground">
            <Check className="size-4 mr-1"/> Submit Attendance
          </Button>
        }
      />

      {/* Selectors */}
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={cls} onValueChange={setCls}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Class"/></SelectTrigger>
          <SelectContent>{CLASSES.map(c=><SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Period"/></SelectTrigger>
          <SelectContent>{PERIODS.map(p=><SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-3 text-sm">
          <span className="text-[var(--ef-green-dark)] font-semibold">Present: {presentCount}</span>
          <span className="text-destructive font-semibold">Absent: {classStudents.length - presentCount}</span>
          <span className="text-muted-foreground">Total: {classStudents.length}</span>
        </div>
      </div>

      {/* Student Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {classStudents.map((student, idx) => {
          const isPresent = attendance[student.id] === "P"
          return (
            <button
              key={student.id}
              onClick={() => toggle(student.id)}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all",
                isPresent
                  ? "border-[var(--ef-green)] bg-[var(--ef-green-light)]"
                  : "border-[var(--ef-red)] bg-[var(--ef-red-light)]"
              )}
            >
              <div className={cn(
                "size-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                isPresent ? "bg-[var(--ef-green)] text-white" : "bg-[var(--ef-red)] text-white"
              )} aria-hidden="true">
                {idx+1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{student.name}</p>
                <p className="text-xs text-muted-foreground">Roll #{idx+1}</p>
              </div>
              <div className={cn("size-6 rounded-full flex items-center justify-center flex-shrink-0",
                isPresent ? "bg-[var(--ef-green)]" : "bg-[var(--ef-red)]"
              )}>
                {isPresent ? <Check className="size-3.5 text-white"/> : <X className="size-3.5 text-white"/>}
              </div>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => setAttendance(Object.fromEntries(classStudents.map(s=>[s.id,"P"])))}>Mark All Present</Button>
        <Button variant="outline" onClick={() => setAttendance(Object.fromEntries(classStudents.map(s=>[s.id,"A"])))}>Mark All Absent</Button>
      </div>

      {/* Per-student progress notes (understood / struggling / …) */}
      <ProgressNotes
        notes={notes.filter(n => n.class === cls)}
        classes={CLASSES}
        students={classStudents.map(s => ({ id: s.id, name: s.name }))}
        subject="Mathematics"
        periodId={period}
        teacher="Priya Sharma"
        onSave={n => setNotes(prev => [n, ...prev])}
      />
    </div>
  )
}
