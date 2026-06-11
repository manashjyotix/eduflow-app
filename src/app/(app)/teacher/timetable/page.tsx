import { Calendar } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TEACHING_PERIODS } from "@/lib/constants"
import { cn } from "@/lib/utils"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const MY_TIMETABLE: Record<string, Record<string, { class: string; subject: string }>> = {
  P1: { Monday: { class: "VIII-A", subject: "Mathematics" }, Wednesday: { class: "IX-B", subject: "Mathematics" }, Friday: { class: "X-A", subject: "Mathematics" } },
  P2: { Tuesday: { class: "VII-A", subject: "Mathematics" }, Thursday: { class: "VIII-A", subject: "Mathematics" }, Saturday: { class: "IX-A", subject: "Mathematics" } },
  P3: { Monday: { class: "IX-A", subject: "Mathematics" }, Friday: { class: "VIII-B", subject: "Mathematics" } },
  P4: { Wednesday: { class: "X-B", subject: "Mathematics" }, Thursday: { class: "VI-A", subject: "Science" } },
  P5: { Tuesday: { class: "VII-B", subject: "Mathematics" }, Saturday: { class: "VIII-A", subject: "Science" } },
  P6: { Monday: { class: "X-A", subject: "Mathematics" }, Wednesday: { class: "VII-A", subject: "Mathematics" } },
  P7: { Thursday: { class: "IX-A", subject: "Mathematics" } },
}

export default function TeacherTimetablePage() {
  const totalPeriods = Object.values(MY_TIMETABLE).reduce((sum, days) => sum + Object.keys(days).length, 0)

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<Calendar size={22} />}
        title="My Timetable"
        subtitle="Priya Sharma — weekly schedule"
        actions={<Badge variant="secondary">{totalPeriods} periods/week</Badge>}
      />

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Weekly Grid</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left text-muted-foreground font-medium py-3 px-4 border-r border-border w-24">Period</th>
                {DAYS.map(d => (
                  <th key={d} className="text-center text-muted-foreground font-medium py-3 px-2 min-w-[110px]">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEACHING_PERIODS.map((p, i) => (
                <tr key={p.id} className={cn("border-t border-border", i % 2 === 0 ? "" : "bg-muted/20")}>
                  <td className="py-3 px-4 border-r border-border">
                    <p className="font-semibold">{p.id}</p>
                    <p className="text-[10px] text-muted-foreground">{p.time}</p>
                  </td>
                  {DAYS.map(day => {
                    const cell = MY_TIMETABLE[p.id]?.[day]
                    return (
                      <td key={day} className="py-2 px-2 text-center">
                        {cell ? (
                          <div className="rounded-md bg-primary/10 text-primary px-2 py-1.5">
                            <p className="font-semibold text-[11px]">{cell.subject}</p>
                            <p className="text-[10px] opacity-75">Class {cell.class}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/30 text-[10px]">Free</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
