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
import { TEACHING_PERIODS } from "@/lib/constants"
import { cn } from "@/lib/utils"

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

      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard title="Open Gaps"    value={approvedAbsences.length * 2} icon={<Clock className="size-5" />} iconClassName="bg-destructive/10 text-destructive" />
        <KpiCard title="Assigned"     value={3} icon={<CheckCircle className="size-5" />} iconClassName="bg-success/20 text-success-foreground" />
        <KpiCard title="Completed"    value={1} icon={<CheckCircle className="size-5" />} iconClassName="bg-primary/10 text-primary" />
        <KpiCard title="Coverage"     value="76%" icon={<PercentSquare className="size-5" />} />
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
