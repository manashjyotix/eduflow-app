import { BookOpen, Calendar } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const EXAMS = [
  { id: "e1", subject: "Mathematics",    class: "Class VIII",  date: "2026-06-20", time: "9:30 – 11:30", room: "Room 4", invigilator: "Priya Sharma" },
  { id: "e2", subject: "English",        class: "Class VIII",  date: "2026-06-21", time: "9:30 – 11:30", room: "Room 4", invigilator: "Rajesh Kalita" },
  { id: "e3", subject: "Science",        class: "Class VII",   date: "2026-06-22", time: "9:30 – 11:30", room: "Room 3", invigilator: "Sunita Borah" },
  { id: "e4", subject: "Social Studies", class: "Class VII",   date: "2026-06-23", time: "9:30 – 11:30", room: "Room 3", invigilator: "Biju Das" },
  { id: "e5", subject: "Mathematics",    class: "Class IX",    date: "2026-06-24", time: "9:30 – 11:30", room: "Room 5", invigilator: "Priya Sharma" },
  { id: "e6", subject: "English",        class: "Class X",     date: "2026-06-25", time: "9:30 – 11:30", room: "Room 6", invigilator: "Rajesh Kalita" },
]

const today = new Date().toISOString().split("T")[0]

export default function ExamSchedulePage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<BookOpen size={22} />}
        title="Exam Schedule"
        subtitle="Term-end examination timetable — HCEA"
        actions={<Button size="default">Edit Schedule</Button>}
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Upcoming Exams</CardTitle>
          <Badge variant="warning">{EXAMS.filter(e => e.date >= today).length} remaining</Badge>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Date</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Subject</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Class</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Time</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Room</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Invigilator</th>
              </tr>
            </thead>
            <tbody>
              {EXAMS.map(exam => {
                const isPast = exam.date < today
                const isToday = exam.date === today
                return (
                  <tr key={exam.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className={isPast ? "text-muted-foreground line-through" : "font-medium"}>
                          {new Date(exam.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                        </span>
                        {isToday && <Badge variant="default" className="text-xs">Today</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium">{exam.subject}</td>
                    <td className="px-4 py-3 text-muted-foreground">{exam.class}</td>
                    <td className="px-4 py-3 text-muted-foreground">{exam.time}</td>
                    <td className="px-4 py-3 text-muted-foreground">{exam.room}</td>
                    <td className="px-6 py-3 text-muted-foreground">{exam.invigilator}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-4 text-center">
        {[
          { label: "Total Exams",  value: EXAMS.length },
          { label: "Remaining",    value: EXAMS.filter(e => e.date >= today).length },
          { label: "Classes",      value: [...new Set(EXAMS.map(e => e.class))].length },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
