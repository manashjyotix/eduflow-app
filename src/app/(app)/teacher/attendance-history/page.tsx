"use client"
import { useState } from "react"
import {
  BookOpen, CheckCircle2, XCircle, Clock, TrendingUp,
  Calendar, Filter, PieChart, ClipboardList,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EduBarChart } from "@/components/shared/edu-bar-chart"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type AttStatus = "present" | "absent" | "late" | "on_leave"

interface AttRecord {
  date: string
  status: AttStatus
  periods: number
  note?: string
}

const ATT_HISTORY: AttRecord[] = [
  { date: "2026-06-14", status: "present",  periods: 7 },
  { date: "2026-06-13", status: "present",  periods: 7 },
  { date: "2026-06-12", status: "late",     periods: 6, note: "Traffic delay" },
  { date: "2026-06-11", status: "present",  periods: 7 },
  { date: "2026-06-10", status: "present",  periods: 7 },
  { date: "2026-06-09", status: "absent",   periods: 0, note: "Sick leave (approved)" },
  { date: "2026-06-06", status: "present",  periods: 7 },
  { date: "2026-06-05", status: "present",  periods: 7 },
  { date: "2026-06-04", status: "present",  periods: 7 },
  { date: "2026-06-03", status: "present",  periods: 7 },
  { date: "2026-06-02", status: "on_leave", periods: 0, note: "Casual leave (approved)" },
  { date: "2026-05-30", status: "present",  periods: 7 },
  { date: "2026-05-29", status: "present",  periods: 6 },
  { date: "2026-05-28", status: "late",     periods: 5, note: "Train delayed" },
  { date: "2026-05-27", status: "present",  periods: 7 },
  { date: "2026-05-26", status: "present",  periods: 7 },
]

const MONTHLY_ATT = [
  { month: "Jan", pct: 95 }, { month: "Feb", pct: 92 }, { month: "Mar", pct: 96 },
  { month: "Apr", pct: 88 }, { month: "May", pct: 93 }, { month: "Jun", pct: 94 },
]

const STATUS_CONFIG: Record<AttStatus, { variant: "success" | "destructive" | "warning" | "secondary"; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  present:  { variant: "success",     label: "Present",  icon: CheckCircle2 },
  absent:   { variant: "destructive", label: "Absent",   icon: XCircle },
  late:     { variant: "warning",     label: "Late",     icon: Clock },
  on_leave: { variant: "secondary",   label: "On Leave", icon: Calendar },
}



export default function AttendanceHistoryPage() {
  const [monthFilter, setMonthFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = ATT_HISTORY.filter(r => {
    const matchMonth = monthFilter === "all"
      || (monthFilter === "jun" && r.date.startsWith("2026-06"))
      || (monthFilter === "may" && r.date.startsWith("2026-05"))
    const matchStatus = statusFilter === "all" || r.status === statusFilter
    return matchMonth && matchStatus
  })

  const presentDays  = ATT_HISTORY.filter(r => r.status === "present").length
  const absentDays   = ATT_HISTORY.filter(r => r.status === "absent").length
  const lateDays     = ATT_HISTORY.filter(r => r.status === "late").length
  const onLeaveDays  = ATT_HISTORY.filter(r => r.status === "on_leave").length
  const attendancePct = Math.round((presentDays / ATT_HISTORY.length) * 100)

  // Attendance trend: Jun pct minus May pct (signed %)
  const attTrend = Math.round(MONTHLY_ATT[5].pct - MONTHLY_ATT[4].pct)

  // Approximate monthly present days from percentage (assuming ~22 working days/month)
  const monthlyPresentDays = MONTHLY_ATT.map(m => Math.round(m.pct * 22 / 100))

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<BookOpen size={22} />}
        title="Attendance History"
        subtitle="Your attendance record at Holy Child English Academy · Priya Sharma"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Present Days"
          value={presentDays}
          subtitle={`of ${ATT_HISTORY.length} working days`}
          icon={<CheckCircle2 className="size-5" />}
          iconClassName="bg-success/20 text-success-foreground"
          tone="green"
          sparkline={{ variant: "bar", data: monthlyPresentDays, color: "var(--ef-green)" }}
        />
        <KpiCard
          title="Absent Days"
          value={absentDays}
          subtitle={`${absentDays} day${absentDays !== 1 ? "s" : ""} missed`}
          icon={<XCircle className="size-5" />}
          iconClassName="bg-destructive/10 text-destructive"
          tone="red"
          sparkline={{ variant: "bar", data: [1,2,0,3,1,absentDays], color: "var(--ef-red)" }}
        />
        <KpiCard
          title="Late Arrivals"
          value={lateDays}
          subtitle={`${lateDays} late arrival${lateDays !== 1 ? "s" : ""} this period`}
          icon={<Clock className="size-5" />}
          iconClassName="bg-warning/20 text-warning-foreground"
          tone="amber"
          sparkline={{ variant: "bar", data: [0,1,0,1,1,lateDays], color: "var(--ef-amber)" }}
        />
        <KpiCard
          title="Attendance %"
          value={`${attendancePct}%`}
          subtitle={`Target: 85% · ${attendancePct >= 85 ? "On track" : "Below target"}`}
          icon={<TrendingUp className="size-5" />}
          tone={attendancePct >= 90 ? "green" : attendancePct >= 85 ? "brand" : "amber"}
          trend={{ value: attTrend, label: "vs last month" }}
          sparkline={{ variant: "line", data: MONTHLY_ATT.map(m => m.pct) }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly chart */}
        <Card className="flex flex-col">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" /> Monthly Attendance — 2026
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4 flex-1 flex flex-col">
            <div className="flex-1 min-h-[200px]">
              <EduBarChart
                data={MONTHLY_ATT}
                series={[{ dataKey: "pct", name: "Attendance", color: "var(--ef-brand)" }]}
                xKey="month"
                fluid
                showLabels
                showYAxis={false}
                tooltipFormatter={(v) => `${v}%`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Breakdown donut */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieChart className="size-4 text-primary" /> Attendance Breakdown
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4">
            <div className="space-y-3">
              {[
                { label: "Present",  value: presentDays,  total: ATT_HISTORY.length, color: "bg-[var(--ef-green)]",      textColor: "text-[var(--ef-green-dark)]" },
                { label: "Absent",   value: absentDays,   total: ATT_HISTORY.length, color: "bg-destructive",            textColor: "text-destructive" },
                { label: "Late",     value: lateDays,     total: ATT_HISTORY.length, color: "bg-[var(--ef-amber)]",      textColor: "text-warning-foreground" },
                { label: "On Leave", value: onLeaveDays,  total: ATT_HISTORY.length, color: "bg-muted-foreground",       textColor: "text-muted-foreground" },
              ].map(row => (
                <div key={row.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${row.color}`} />{row.label}</span>
                    <span className={`font-bold ${row.textColor}`}>{row.value} days ({Math.round((row.value / row.total) * 100)}%)</span>
                  </div>
                  <Progress value={(row.value / row.total) * 100} className={`h-1.5 [&>div]:${row.color}`} />
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-lg bg-muted/50">
              <div className="text-xs text-muted-foreground mb-1">Overall attendance rate</div>
              <div className={`text-2xl font-black ${attendancePct >= 90 ? "text-[var(--ef-green-dark)]" : attendancePct >= 85 ? "text-primary" : "text-warning-foreground"}`}>{attendancePct}%</div>
              <Progress value={attendancePct} className={`h-2 mt-1.5 ${attendancePct >= 90 ? "[&>div]:bg-[var(--ef-green)]" : "[&>div]:bg-primary"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Records */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3 gap-3 flex-wrap">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
              <ClipboardList className="size-4 text-primary" /> Attendance Log
            </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={monthFilter} onValueChange={setMonthFilter}>
              <SelectTrigger className="h-8 w-32 text-xs">
                <Filter className="size-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="jun">June 2026</SelectItem>
                <SelectItem value="may">May 2026</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="on_leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {filtered.map(r => {
              const cfg = STATUS_CONFIG[r.status]
              const Icon = cfg.icon
              return (
                <li key={r.date} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      r.status === "present" ? "bg-[var(--ef-green-light)] text-[var(--ef-green-dark)]"
                      : r.status === "absent" ? "bg-[var(--ef-red-light)] text-[var(--ef-red-dark)]"
                      : r.status === "late" ? "bg-[var(--ef-amber-light)] text-warning-foreground"
                      : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon className="size-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(r.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
                      </p>
                      {r.note && <p className="text-xs text-muted-foreground mt-0.5 italic">{r.note}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {r.status === "present" && <span className="text-xs text-muted-foreground">{r.periods} periods</span>}
                    <Badge variant={cfg.variant} className="capitalize text-xs">{cfg.label}</Badge>
                  </div>
                </li>
              )
            })}
          </ul>
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <span>Showing {filtered.length} of {ATT_HISTORY.length} records</span>
            <Button variant="ghost" size="sm" className="text-xs">Export</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
