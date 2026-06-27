import { Grid3x3, Zap, CheckCircle, Clock, PercentSquare } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TEACHERS } from "@/data/teachers"
import { MOCK_ABSENCES } from "@/data/mock-absences"
import { MOCK_PROXIES } from "@/data/proxy-assignments"
import { TEACHING_PERIODS } from "@/lib/constants"
import { cn } from "@/lib/utils"

// Weekly trend series (Mon–Sat) for sparklines — realistic HCEA proxy history
const WEEKLY_OPEN_GAPS: number[]    = [3, 5, 4, 6, 4, 4]
const WEEKLY_ASSIGNED: number[]     = [2, 4, 3, 5, 3, 3]
const WEEKLY_COMPLETED: number[]    = [1, 3, 2, 4, 2, 1]
const WEEKLY_COVERAGE_PCT: number[] = [67, 80, 75, 83, 75, 71]

const absentIds = new Set(MOCK_ABSENCES.filter(a => a.status === "approved").map(a => a.teacherId))

function getDotClass(teacherId: string, _periodId: string, absentSubject: string) {
  if (absentIds.has(teacherId)) return null
  const t = TEACHERS.find(t => t.id === teacherId)
  if (!t || t.status !== "active") return "bg-muted-foreground"
  if (t.subjects.includes(absentSubject)) return "bg-success"
  return "bg-warning"
}

export default function ManagementProxyPage() {
  const approvedAbsences = MOCK_ABSENCES.filter(a => a.status === "approved")

  // Derive proxy metrics from MOCK_PROXIES
  const totalOpenGaps   = approvedAbsences.reduce((s, a) => s + a.periods.length, 0)
  const assignedCount   = MOCK_PROXIES.filter(p => p.status === "accepted" || p.status === "assigned").length
  const completedCount  = MOCK_PROXIES.filter(p => p.status === "accepted").length
  const coveragePct     = totalOpenGaps > 0 ? Math.round((assignedCount / totalOpenGaps) * 100) : 0

  // Trend: compare today (last value) vs previous day (second-to-last)
  const prevGaps       = WEEKLY_OPEN_GAPS[WEEKLY_OPEN_GAPS.length - 2]
  const todayGaps      = WEEKLY_OPEN_GAPS[WEEKLY_OPEN_GAPS.length - 1]
  const gapTrend       = prevGaps > 0 ? Math.round(((todayGaps - prevGaps) / prevGaps) * 100) : 0

  const prevAssigned   = WEEKLY_ASSIGNED[WEEKLY_ASSIGNED.length - 2]
  const todayAssigned  = WEEKLY_ASSIGNED[WEEKLY_ASSIGNED.length - 1]
  const assignTrend    = prevAssigned > 0 ? Math.round(((todayAssigned - prevAssigned) / prevAssigned) * 100) : 0

  const prevCompleted  = WEEKLY_COMPLETED[WEEKLY_COMPLETED.length - 2]
  const todayCompleted = WEEKLY_COMPLETED[WEEKLY_COMPLETED.length - 1]
  const completeTrend  = prevCompleted > 0 ? Math.round(((todayCompleted - prevCompleted) / prevCompleted) * 100) : 0

  const prevCoverage   = WEEKLY_COVERAGE_PCT[WEEKLY_COVERAGE_PCT.length - 2]
  const todayCoverage  = WEEKLY_COVERAGE_PCT[WEEKLY_COVERAGE_PCT.length - 1]
  const coverageTrend  = prevCoverage > 0 ? Math.round(((todayCoverage - prevCoverage) / prevCoverage) * 100) : 0

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Grid3x3 size={22} />}
        title="Proxy Board"
        subtitle="Assign substitute teachers for today's absences"
        actions={
          <>
            <Button variant="outline" size="default">Print Sheet</Button>
            <Button size="default">
              <Zap className="size-4" />
              Auto-Assign
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Open Gaps"
          value={totalOpenGaps}
          subtitle={`${approvedAbsences.length} teacher${approvedAbsences.length !== 1 ? "s" : ""} absent today`}
          icon={<Clock className="size-5" />}
          tone="red"
          trend={{ value: gapTrend, label: "vs yesterday" }}
          sparkline={{ variant: "bar", data: WEEKLY_OPEN_GAPS }}
        />
        <KpiCard
          title="Assigned"
          value={assignedCount}
          subtitle={`${totalOpenGaps - assignedCount} period${totalOpenGaps - assignedCount !== 1 ? "s" : ""} still unassigned`}
          icon={<CheckCircle className="size-5" />}
          tone="green"
          trend={{ value: assignTrend, label: "vs yesterday" }}
          sparkline={{ variant: "bar", data: WEEKLY_ASSIGNED }}
        />
        <KpiCard
          title="Completed"
          value={completedCount}
          subtitle="Accepted proxy duties"
          icon={<CheckCircle className="size-5" />}
          tone="brand"
          trend={{ value: completeTrend, label: "vs yesterday" }}
          sparkline={{ variant: "bar", data: WEEKLY_COMPLETED }}
        />
        <KpiCard
          title="Coverage"
          value={`${coveragePct}%`}
          subtitle={`${assignedCount} of ${totalOpenGaps} periods covered`}
          icon={<PercentSquare className="size-5" />}
          tone="green"
          trend={{ value: coverageTrend, label: "vs yesterday" }}
          sparkline={{ variant: "arc", value: coveragePct }}
        />
      </div>

      <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
        <span className="font-medium text-foreground">Availability:</span>
        {[
          { dot: "bg-success",          label: "Available (same subject)" },
          { dot: "bg-warning",          label: "Available (different subject)" },
          { dot: "bg-muted-foreground", label: "At proxy cap" },
          { dot: "bg-destructive",      label: "Unavailable" },
        ].map(item => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full flex-shrink-0", item.dot)} aria-hidden="true" />
            {item.label}
          </span>
        ))}
      </div>

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
              <Table className="text-xs">
                <caption className="sr-only">Available substitute teachers by period</caption>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-left text-muted-foreground font-medium pb-2 pr-4 min-w-[140px] h-auto">Teacher</TableHead>
                    {TEACHING_PERIODS.map(p => (
                      <TableHead key={p.id} className="text-center text-muted-foreground font-medium pb-2 px-2 min-w-[52px] h-auto">
                        <div>{p.id}</div>
                        <div className="font-normal">{p.time.split(" – ")[0]}</div>
                      </TableHead>
                    ))}
                    <TableHead className="text-right text-muted-foreground font-medium pb-2 pl-4 h-auto">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {TEACHERS.filter(t => !absentIds.has(t.id) && t.status === "active").slice(0, 5).map(teacher => (
                    <TableRow key={teacher.id}>
                      <TableCell className="py-2 pr-4">
                        <p className="font-medium text-foreground">{teacher.name}</p>
                        <p className="text-muted-foreground text-[10px]">{teacher.subjects[0]}</p>
                      </TableCell>
                      {TEACHING_PERIODS.map(p => {
                        const dotClass = absence.periods.includes(p.id)
                          ? getDotClass(teacher.id, p.id, TEACHERS.find(t => t.id === absence.teacherId)?.subjects[0] ?? "")
                          : null
                        return (
                          <TableCell key={p.id} className="py-2 px-2 text-center">
                            {dotClass ? (
                              <span
                                className={cn("size-2.5 rounded-full inline-block", dotClass)}
                                aria-hidden="true"
                                title={dotClass === "bg-success" ? "Available (same subject)" : dotClass === "bg-warning" ? "Available (different subject)" : "At cap"}
                              />
                            ) : (
                              <span className="text-muted-foreground/40">—</span>
                            )}
                          </TableCell>
                        )
                      })}
                      <TableCell className="py-2 pl-4 text-right">
                        <Button size="xs" variant="outline">Assign</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
