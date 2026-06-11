"use client"
import { useState, useEffect } from "react"
import { LayoutDashboard, AlertCircle, CheckCircle, Clock, Zap, Calendar } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MOCK_ABSENCES } from "@/data/mock-absences"
import { TEACHING_PERIODS } from "@/lib/constants"

function PeriodCountdown() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Find current/next period
  const todayStr = now.toTimeString().slice(0, 5)
  const current = TEACHING_PERIODS.find(p => todayStr >= p.time.split(" – ")[0] && todayStr < p.time.split(" – ")[1])
  const next    = !current && TEACHING_PERIODS.find(p => todayStr < p.time.split(" – ")[0])

  if (!current && !next) return <span className="text-sm text-muted-foreground">School day complete</span>

  return (
    <div className="text-sm">
      {current ? (
        <>
          <span className="text-xs text-muted-foreground">Current: </span>
          <span className="font-semibold text-primary">{current.label}</span>
          <span className="text-xs text-muted-foreground ml-1">({current.time})</span>
        </>
      ) : next ? (
        <>
          <span className="text-xs text-muted-foreground">Next: </span>
          <span className="font-semibold">{next.label}</span>
          <span className="text-xs text-muted-foreground ml-1">({next.time})</span>
        </>
      ) : null}
    </div>
  )
}

export default function ManagementDashboardPage() {
  const approvedAbsences = MOCK_ABSENCES.filter(a => a.status === "approved")
  const pendingAbsences  = MOCK_ABSENCES.filter(a => a.status === "pending")
  const totalPeriods     = approvedAbsences.reduce((s, a) => s + a.periods.length, 0)

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<LayoutDashboard size={22} />}
        title="Morning Briefing"
        subtitle={new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        actions={
          <Button size="default">
            <Zap className="size-4" />
            Auto-Assign All
          </Button>
        }
      />

      {/* Live period */}
      <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
        <Clock className="size-4 text-primary flex-shrink-0" />
        <PeriodCountdown />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Absent Today"  value={approvedAbsences.length + pendingAbsences.length}  icon={<AlertCircle className="size-5" />} iconClassName="bg-destructive/10 text-destructive" />
        <KpiCard title="Open Gaps"     value={totalPeriods}                                        icon={<Clock className="size-5" />}        iconClassName="bg-warning/20 text-warning-foreground" />
        <KpiCard title="Assigned"      value={3}                                                   icon={<CheckCircle className="size-5" />}   iconClassName="bg-success/20 text-success-foreground" />
        <KpiCard title="Coverage"      value="76%"                                                 icon={<Calendar className="size-5" />}      trend={{ value: -3, label: "vs yesterday" }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority queue */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Absence Queue</CardTitle>
            <Badge variant="warning">{pendingAbsences.length} pending</Badge>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {MOCK_ABSENCES.map(a => (
                <li key={a.id} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                      {a.teacherName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{a.teacherName}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.periods.length === 7 ? "Full day" : `${a.periods.length} periods`} · {a.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={a.status === "approved" ? "success" : a.status === "pending" ? "warning" : "secondary"} className="capitalize">
                      {a.status}
                    </Badge>
                    {a.status === "pending" && <Button size="xs">Approve</Button>}
                    {a.status === "approved" && <Button size="xs" variant="outline">Assign</Button>}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Period schedule today */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Today&apos;s Periods</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-3">
            <ul className="space-y-2">
              {TEACHING_PERIODS.map(p => (
                <li key={p.id} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{p.label}</span>
                  <span className="text-muted-foreground">{p.time}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
