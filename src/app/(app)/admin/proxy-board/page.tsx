import { Grid3x3, Zap, CheckCircle, Clock, PercentSquare } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TEACHERS } from "@/data/teachers"
import { MOCK_ABSENCES } from "@/data/mock-absences"
import { TEACHING_PERIODS } from "@/lib/constants"
import { cn } from "@/lib/utils"

// Derive proxy board state from mock data
const absentIds = new Set(
  MOCK_ABSENCES.filter(a => a.status === "approved").map(a => a.teacherId)
)

function getDotClass(teacherId: string, _periodId: string, absentTeacherSubject: string) {
  if (absentIds.has(teacherId)) return null // absent themselves
  const t = TEACHERS.find(t => t.id === teacherId)
  if (!t || t.status !== "active") return "bg-muted-foreground" // capped/unavailable
  if (t.subjects.includes(absentTeacherSubject)) return "bg-success" // same subject
  return "bg-warning" // different subject
}

export default function ProxyBoardPage() {
  const approvedAbsences = MOCK_ABSENCES.filter(a => a.status === "approved")

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<Grid3x3 size={22} />}
        title="Proxy Board"
        subtitle="Today's teacher coverage overview"
        actions={
          <>
            <Button variant="outline" size="default">Export</Button>
            <Button size="default">
              <Zap className="size-4" />
              Auto-Assign
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Open Gaps"    value={approvedAbsences.length * 2} icon={<Clock className="size-5" />}       iconClassName="bg-destructive/10 text-destructive" />
        <KpiCard title="Assigned"     value={3}                           icon={<CheckCircle className="size-5" />} iconClassName="bg-success/20 text-success-foreground" />
        <KpiCard title="Completed"    value={1}                           icon={<CheckCircle className="size-5" />} iconClassName="bg-primary/10 text-primary" />
        <KpiCard title="Coverage"     value="78%"                         icon={<PercentSquare className="size-5" />} trend={{ value: 5 }} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Availability:</span>
        {[
          { dot: "bg-success",          label: "Available (same subject)" },
          { dot: "bg-warning",          label: "Available (different subject)" },
          { dot: "bg-muted-foreground", label: "At proxy cap" },
          { dot: "bg-destructive",      label: "Unavailable" },
        ].map(item => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full flex-shrink-0", item.dot)} />
            {item.label}
          </span>
        ))}
      </div>

      {/* Board — per absence */}
      <div className="space-y-4">
        {approvedAbsences.map(absence => (
          <Card key={absence.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">
                  {absence.teacherName} —{" "}
                  <span className="font-normal text-muted-foreground">
                    {absence.periods.length === 7 ? "Full day" : absence.periods.join(", ")}
                  </span>
                </CardTitle>
                <Badge variant="warning">{absence.reason}</Badge>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left text-muted-foreground font-medium pb-2 pr-4 min-w-[140px]">Teacher</th>
                    {TEACHING_PERIODS.map(p => (
                      <th key={p.id} className="text-center text-muted-foreground font-medium pb-2 px-2 min-w-[64px]">
                        {p.id}
                      </th>
                    ))}
                    <th className="text-right text-muted-foreground font-medium pb-2 pl-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {TEACHERS.filter(t => !absentIds.has(t.id) && t.status === "active").slice(0, 5).map(teacher => (
                    <tr key={teacher.id} className="border-t border-border/50">
                      <td className="py-2 pr-4">
                        <div>
                          <p className="font-medium text-foreground">{teacher.name}</p>
                          <p className="text-muted-foreground">{teacher.subjects[0]}</p>
                        </div>
                      </td>
                      {TEACHING_PERIODS.map(p => {
                        const dotClass = absence.periods.includes(p.id)
                          ? getDotClass(teacher.id, p.id, TEACHERS.find(t => t.id === absence.teacherId)?.subjects[0] ?? "")
                          : null
                        return (
                          <td key={p.id} className="py-2 px-2 text-center">
                            {dotClass ? (
                              <div className="flex flex-col items-center gap-1">
                                <span className={cn("size-2.5 rounded-full", dotClass)} />
                              </div>
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </td>
                        )
                      })}
                      <td className="py-2 pl-4 text-right">
                        <Button size="xs" variant="outline">Assign</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
