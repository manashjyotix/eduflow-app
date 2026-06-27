"use client"
import { useState } from "react"
import {
  BarChart3, TrendingUp, Users, ClipboardList, Download,
  IndianRupee, UserX, CheckCircle2, Activity,
} from "lucide-react"
import dynamic from "next/dynamic"

// ── Dynamic recharts imports (SSR-safe, code-split) ───────────────────────────
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => ({ default: m.ResponsiveContainer })),
  { ssr: false }
)
const BarChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.BarChart })),
  { ssr: false }
)
const Bar = dynamic(
  () => import("recharts").then((m) => ({ default: m.Bar })),
  { ssr: false }
)
const XAxis = dynamic(
  () => import("recharts").then((m) => ({ default: m.XAxis })),
  { ssr: false }
)
const YAxis = dynamic(
  () => import("recharts").then((m) => ({ default: m.YAxis })),
  { ssr: false }
)
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => ({ default: m.CartesianGrid })),
  { ssr: false }
)
const Tooltip = dynamic(
  () => import("recharts").then((m) => ({ default: m.Tooltip })),
  { ssr: false }
)
const LineChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.LineChart })),
  { ssr: false }
)
const Line = dynamic(
  () => import("recharts").then((m) => ({ default: m.Line })),
  { ssr: false }
)
const Legend = dynamic(
  () => import("recharts").then((m) => ({ default: m.Legend })),
  { ssr: false }
)
const PieChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.PieChart })),
  { ssr: false }
)
const Pie = dynamic(
  () => import("recharts").then((m) => ({ default: m.Pie })),
  { ssr: false }
)
const Cell = dynamic(
  () => import("recharts").then((m) => ({ default: m.Cell })),
  { ssr: false }
)
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ATTENDANCE_MONTHLY, PROXY_MONTHLY, FEE_COLLECTION_MONTHLY } from "@/data/mock-data"
import { TEACHERS } from "@/data/teachers"

const TEACHER_LOAD = [
  { name: "Priya S.",     proxies: 8,  periods: 35, cap: 20 },
  { name: "Rajesh K.",    proxies: 5,  periods: 32, cap: 20 },
  { name: "Sunita B.",    proxies: 7,  periods: 33, cap: 20 },
  { name: "Meena G.",     proxies: 3,  periods: 28, cap: 20 },
  { name: "Himanta B.",   proxies: 11, periods: 40, cap: 25 },
  { name: "Biju D.",      proxies: 4,  periods: 30, cap: 20 },
  { name: "Rajesh K.",    proxies: 6,  periods: 31, cap: 20 },
]

const ABSENCE_CATEGORIES = [
  { name: "Sick Leave",    value: 38, color: "var(--ef-red)" },
  { name: "Casual Leave",  value: 22, color: "var(--ef-amber)" },
  { name: "Emergency",     value: 12, color: "var(--ef-purple)" },
  { name: "Earned Leave",  value: 8,  color: "var(--ef-brand)" },
  { name: "Official Duty", value: 3,  color: "var(--ef-cyan)" },
]

const CLASS_ATTENDANCE = [
  { class: "VI-A",   pct: 88 }, { class: "VI-B",   pct: 85 },
  { class: "VII-A",  pct: 82 }, { class: "VII-B",  pct: 91 },
  { class: "VIII-A", pct: 79 }, { class: "VIII-B", pct: 84 },
  { class: "IX-A",   pct: 87 }, { class: "IX-B",   pct: 76 },
  { class: "X-A",    pct: 93 }, { class: "X-B",    pct: 89 },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-card text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm" style={{ background: p.color ?? "var(--primary)" }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("6m")

  const activeTeachers = TEACHERS.filter(t => t.status === "active").length
  const totalProxies = PROXY_MONTHLY.reduce((s, m) => s + m.count, 0)

  // Derived KPI values
  const avgAttendance = Math.round(ATTENDANCE_MONTHLY.reduce((s, m) => s + m.percent, 0) / ATTENDANCE_MONTHLY.length)
  const prevAttendance = ATTENDANCE_MONTHLY[ATTENDANCE_MONTHLY.length - 2]?.percent ?? avgAttendance
  const currAttendance = ATTENDANCE_MONTHLY[ATTENDANCE_MONTHLY.length - 1]?.percent ?? avgAttendance
  const attendanceTrend = Math.round(((currAttendance - prevAttendance) / prevAttendance) * 100)

  // Absence totals (sum of ABSENCE_CATEGORIES is the total absences)
  const totalAbsences = ABSENCE_CATEGORIES.reduce((s, c) => s + c.value, 0)
  const absenceMonthly = [12, 18, 9, 22, 15, 7] // Jan-Jun monthly absence counts
  const prevAbsences = absenceMonthly[absenceMonthly.length - 2]
  const currAbsences = absenceMonthly[absenceMonthly.length - 1]
  const absenceTrend = Math.round(((currAbsences - prevAbsences) / prevAbsences) * 100)

  // Proxy trend
  const prevProxies = PROXY_MONTHLY[PROXY_MONTHLY.length - 2]?.count ?? 0
  const currProxies = PROXY_MONTHLY[PROXY_MONTHLY.length - 1]?.count ?? 0
  const proxyTrend = prevProxies > 0 ? Math.round(((currProxies - prevProxies) / prevProxies) * 100) : 0

  // Uncovered slots series
  const uncoveredSeries = [5, 3, 4, 2, 3, 2] as const
  const currUncovered = 16
  const prevUncovered = uncoveredSeries[uncoveredSeries.length - 1]
  const uncoveredTrend = Math.round(((currUncovered - prevUncovered) / prevUncovered) * 100)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<BarChart3 size={22} />}
        title="Analytics"
        subtitle="Attendance, proxy, and fee analytics — Holy Child English Academy"
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="h-8 w-36 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Last Month</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm"><Download className="size-4" /> Export</Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Avg Coverage"
          value={`${avgAttendance}%`}
          subtitle={`Current: ${currAttendance}% · ${ATTENDANCE_MONTHLY.length} months`}
          icon={<TrendingUp className="size-5" />}
          tone="brand"
          trend={{ value: attendanceTrend, label: "vs last month" }}
          sparkline={{ variant: "line", data: ATTENDANCE_MONTHLY.map(m => m.percent) }}
        />
        <KpiCard
          title="Total Absences"
          value={totalAbsences}
          subtitle={`${absenceMonthly[absenceMonthly.length - 1]} this month · top: sick leave`}
          icon={<ClipboardList className="size-5" />}
          tone="amber"
          trend={{ value: absenceTrend, label: "vs last month" }}
          sparkline={{ variant: "bar", data: [...absenceMonthly] }}
        />
        <KpiCard
          title="Total Proxies"
          value={totalProxies}
          subtitle={`${currProxies} this month · avg ${Math.round(totalProxies / PROXY_MONTHLY.length)}/mo`}
          icon={<Users className="size-5" />}
          tone="brand"
          trend={{ value: proxyTrend, label: "vs last month" }}
          sparkline={{ variant: "bar", data: PROXY_MONTHLY.map(m => m.count) }}
        />
        <KpiCard
          title="Uncovered Slots"
          value={currUncovered}
          subtitle={`${prevUncovered} last month · ${activeTeachers} active staff`}
          icon={<UserX className="size-5" />}
          tone="red"
          trend={{ value: uncoveredTrend, label: "vs last month" }}
          sparkline={{ variant: "bar", data: [...uncoveredSeries] }}
        />
      </div>

      <Tabs defaultValue="proxy">
        <TabsList>
          <TabsTrigger value="proxy">Proxy & Absence</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="workload">Staff Workload</TabsTrigger>
        </TabsList>

        {/* ── Proxy & Absence Tab ── */}
        <TabsContent value="proxy" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Monthly Proxy Count</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={PROXY_MONTHLY} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="30%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Bar dataKey="count" name="Proxies" fill="var(--primary)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs text-muted-foreground">
                  <span>Total: <strong className="text-foreground">{totalProxies} duties</strong></span>
                  <span>Avg: <strong className="text-foreground">{Math.round(totalProxies / PROXY_MONTHLY.length)}/month</strong></span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Absence Categories</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={120} height={120}>
                    <PieChart>
                      <Pie data={ABSENCE_CATEGORIES} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" strokeWidth={2} stroke="var(--card)">
                        {ABSENCE_CATEGORIES.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {ABSENCE_CATEGORIES.map(d => (
                      <div key={d.name} className="flex items-center gap-2">
                        <span className="size-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                        <span className="text-xs flex-1">{d.name}</span>
                        <span className="text-xs font-bold">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border text-xs text-muted-foreground">
                  Total absences: <strong className="text-foreground">83</strong> · Most common: <strong className="text-destructive">Sick Leave (38)</strong>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Attendance Tab ── */}
        <TabsContent value="attendance" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Monthly Attendance Trend</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={ATTENDANCE_MONTHLY} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={36} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="percent" name="Attendance %" stroke="var(--ef-brand)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--ef-brand)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Attendance by Class</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 space-y-3">
                {CLASS_ATTENDANCE.map(c => (
                  <div key={c.class} className="flex items-center gap-3">
                    <span className="text-xs font-medium w-12 text-right">{c.class}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${c.pct >= 90 ? "bg-[var(--ef-green)]" : c.pct >= 80 ? "bg-primary" : c.pct >= 75 ? "bg-[var(--ef-amber)]" : "bg-destructive"}`}
                        style={{ width: `${c.pct}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-10 ${c.pct >= 90 ? "text-[var(--ef-green-dark)]" : c.pct >= 80 ? "text-primary" : c.pct >= 75 ? "text-warning-foreground" : "text-destructive"}`}>{c.pct}%</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-border flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--ef-green)]" aria-hidden="true" /> ≥90%</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-primary" aria-hidden="true" /> 80-89%</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-[var(--ef-amber)]" aria-hidden="true" /> 75-79%</span>
                  <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-destructive" aria-hidden="true" /> {"<75%"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">30-Day Summary</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                  {[
                    { label: "Student Attendance", value: "82.4%", sub: "avg across all classes", icon: <CheckCircle2 className="size-5" />, color: "text-[var(--ef-green-dark)]", bg: "bg-[var(--ef-green-light)]" },
                    { label: "Teacher Attendance", value: "94.7%", sub: "approved present days", icon: <Users className="size-5" />, color: "text-primary", bg: "bg-primary/10" },
                    { label: "On-Time Proxy Rate", value: "88.6%", sub: "assigned before period", icon: <Activity className="size-5" />, color: "text-warning-foreground", bg: "bg-[var(--ef-amber-light)]" },
                  ].map(stat => (
                    <div key={stat.label} className="px-6 py-5 flex items-center gap-4">
                      <div className={`size-10 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color} flex-shrink-0`}>{stat.icon}</div>
                      <div>
                        <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                        <div className="text-sm font-medium mt-0.5">{stat.label}</div>
                        <div className="text-xs text-muted-foreground">{stat.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Fees Tab ── */}
        <TabsContent value="fees" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <IndianRupee className="size-4 text-primary" /> Monthly Fee Collection
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={FEE_COLLECTION_MONTHLY} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barCategoryGap="24%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} width={44} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                    <Bar dataKey="collected" name="Collected" fill="var(--ef-green)" radius={[4,4,0,0]} />
                    <Bar dataKey="due" name="Pending" fill="var(--ef-red)" radius={[4,4,0,0]} fillOpacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Monthly Collection Summary</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 space-y-3">
                {FEE_COLLECTION_MONTHLY.map(m => {
                  const total = m.collected + m.due
                  const pct = Math.round((m.collected / total) * 100)
                  return (
                    <div key={m.month} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{m.month}</span>
                        <span className="text-muted-foreground">₹{m.collected.toLocaleString("en-IN")} / ₹{total.toLocaleString("en-IN")} ({pct}%)</span>
                      </div>
                      <Progress value={pct} className={`h-2 ${pct >= 90 ? "[&>div]:bg-[var(--ef-green)]" : pct >= 70 ? "" : "[&>div]:bg-[var(--ef-amber)]"}`} />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ── Workload Tab ── */}
        <TabsContent value="workload" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Proxy Load by Teacher</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={TEACHER_LOAD} layout="vertical" margin={{ top: 4, right: 20, left: 40, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={52} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Bar dataKey="proxies" name="Proxies" fill="var(--ef-brand)" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">Staff Status Overview</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4 space-y-4">
                {[
                  { label: "Active",   value: TEACHERS.filter(t => t.status === "active").length,   color: "bg-[var(--ef-green)]",    textColor: "text-[var(--ef-green-dark)]" },
                  { label: "On Leave", value: TEACHERS.filter(t => t.status === "on_leave").length, color: "bg-[var(--ef-amber)]",    textColor: "text-warning-foreground" },
                  { label: "Inactive", value: TEACHERS.filter(t => t.status === "inactive").length, color: "bg-muted-foreground", textColor: "text-muted-foreground" },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className={`size-2.5 rounded-full flex-shrink-0 ${row.color}`} aria-hidden="true" />
                    <span className="text-sm flex-1">{row.label}</span>
                    <span className={`text-lg font-black ${row.textColor}`}>{row.value}</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${(row.value / TEACHERS.length) * 100}%` }} />
                    </div>
                  </div>
                ))}
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Total staff: <strong className="text-foreground">{TEACHERS.length}</strong></span>
                    <span>Available proxies today: <strong className="text-primary">{TEACHERS.filter(t => t.status === "active").length}</strong></span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
