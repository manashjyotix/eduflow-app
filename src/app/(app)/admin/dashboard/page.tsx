"use client"
import { useState } from "react"
import Link from "next/link"
import {
  Users, UserX, CheckCircle2, Clock, LayoutGrid, ClipboardList,
  TrendingUp, ArrowRight, BookOpen, Zap, Bell, BarChart3,
  IndianRupee, GraduationCap, AlertTriangle, Repeat,
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
const Legend = dynamic(
  () => import("recharts").then((m) => ({ default: m.Legend })),
  { ssr: false }
)
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { WeatherGreeting } from "@/components/shared/weather-greeting"
import { BirthdayCard } from "@/components/shared/birthday-card"
import { TaskList, type TaskItem } from "@/components/shared/task-list"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { MOCK_ABSENCES } from "@/data/mock-absences"
import { TEACHERS } from "@/data/teachers"
import { MOCK_PROXIES } from "@/data/proxy-assignments"
import { PROXY_MONTHLY, ATTENDANCE_MONTHLY, FEE_COLLECTION_MONTHLY } from "@/data/mock-data"

const activeTeachers = TEACHERS.filter(t => t.status === "active").length
const absentToday    = MOCK_ABSENCES.filter(a => a.status === "approved" || a.status === "pending").length
const pendingCount   = MOCK_ABSENCES.filter(a => a.status === "pending").length
const coveredCount   = MOCK_PROXIES.filter(p => p.status === "accepted").length

const RECENT_ACTIVITY = [
  { text: "Proxy assigned: Priya Sharma → IV-C P3", time: "2 min ago", type: "proxy" },
  { text: "Absence approved: Anita Devi (Full Day)", time: "18 min ago", type: "absence" },
  { text: "Swap request from Sunita Borah accepted", time: "1 hr ago", type: "swap" },
  { text: "New notice posted: Mid-Term Exams Schedule", time: "2 hr ago", type: "notice" },
  { text: "Fee collected: Rohit Das ₹7,500", time: "3 hr ago", type: "fee" },
]

const PERIOD_COVERAGE = [
  { id: "P1", label: "P1",  covered: true,  proxy: "Rajesh Kalita",  class: "V-B",    subject: "English" },
  { id: "P2", label: "P2",  covered: false, proxy: null,             class: "V-A",    subject: "History" },
  { id: "P3", label: "P3",  covered: true,  proxy: "Priya Sharma",   class: "IV-C",   subject: "English" },
  { id: "P4", label: "P4",  covered: true,  proxy: "Priya Sharma",   class: "VIII-A", subject: "Science" },
  { id: "P5", label: "P5",  covered: false, proxy: null,             class: "VI-A",   subject: "Science" },
  { id: "P6", label: "P6",  covered: true,  proxy: "Sunita Borah",   class: "VII-B",  subject: "Biology" },
  { id: "P7", label: "P7",  covered: false, proxy: null,             class: "VI-A",   subject: "Biology" },
]

const TEACHER_WORKLOAD = TEACHERS.filter(t => t.status === "active").map(t => ({
  name: t.name.split(" ")[0],
  proxies: Math.floor(Math.random() * t.monthlyProxyCap * 0.6),
  cap: t.monthlyProxyCap,
}))

const FEE_PIE_DATA = [
  { name: "Paid",    value: 7, color: "var(--ef-green)" },
  { name: "Partial", value: 3, color: "var(--ef-amber)" },
  { name: "Due",     value: 2, color: "var(--ef-red)" },
]

const HELP_TASKS: TaskItem[] = [
  { id: "ht1", label: "Mark today's absences", hint: "Go to Absences → Mark Absence before 9 AM", done: false },
  { id: "ht2", label: "Assign proxies for uncovered periods", hint: "Use the Proxy Board to auto-assign or manually assign", done: false },
  { id: "ht3", label: "Approve pending leave requests", hint: "Review teacher leave requests in the Absences page", done: false },
  { id: "ht4", label: "Review fee defaulters", hint: "Check Fees → Defaulters for overdue payments", done: false },
  { id: "ht5", label: "Post any school notices", hint: "Notices → New Notice to broadcast to all roles", done: false },
  { id: "ht6", label: "Check swap requests inbox", hint: "Swap Requests page — approve or reject peer swaps", done: false },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number; name?: string; color?: string}[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-card text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm" style={{ background: p.color ?? "var(--primary)" }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold">{typeof p.value === "number" ? p.value : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
  const coveredPeriods = PERIOD_COVERAGE.filter(p => p.covered).length
  const totalPeriods = PERIOD_COVERAGE.length
  const coveragePct = Math.round((coveredPeriods / totalPeriods) * 100)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <WeatherGreeting />

      <PageHeader
        icon={<LayoutGrid size={20} />}
        title="Dashboard"
        subtitle={`Good morning — ${today}`}
        actions={
          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Button variant="secondary" size="sm" className="relative" asChild>
                <Link href="/admin/absences">
                  <Bell className="size-4" /> Pending
                  <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">{pendingCount}</span>
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/admin/absences">
                <ClipboardList className="size-4" /> Mark Absence
              </Link>
            </Button>
          </div>
        }
      />

      <BirthdayCard />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
        <KpiCard
          title="Active Teachers"
          value={activeTeachers}
          subtitle={`of ${TEACHERS.length} total staff`}
          icon={<Users className="size-5" />}
          trend={{ value: 2, label: "vs last week" }}
          sparkline={{ variant: "bar", data: [6,6,7,6,7,6,activeTeachers], color: "var(--ef-brand)" }}
        />
        <KpiCard
          title="Absent Today"
          value={absentToday}
          subtitle="approved + pending"
          icon={<UserX className="size-5" />}
          iconClassName="bg-destructive/10 text-destructive"
          trend={{ value: -1, label: "vs yesterday" }}
          sparkline={{ variant: "bar", data: [1,2,1,3,2,1,absentToday], color: "var(--ef-red)" }}
        />
        <KpiCard
          title="Coverage Rate"
          value={`${coveragePct}%`}
          subtitle={`${coveredPeriods} of ${totalPeriods} periods covered`}
          icon={<CheckCircle2 className="size-5" />}
          iconClassName="bg-success/15 text-success-foreground"
          trend={{ value: 5, label: "vs last week" }}
          sparkline={{ variant: "line", data: [55,60,58,65,70,57,coveragePct] }}
        />
        <KpiCard
          title="Pending Approvals"
          value={pendingCount}
          subtitle="absence requests"
          icon={<Clock className="size-5" />}
          iconClassName="bg-warning/20 text-warning-foreground"
          sparkline={{ variant: "bar", data: [2,1,3,0,1,2,pendingCount], color: "var(--ef-amber)" }}
        />
        <KpiCard
          title="Proxies This Month"
          value={PROXY_MONTHLY[PROXY_MONTHLY.length - 1].count}
          subtitle="duties assigned"
          icon={<Repeat className="size-5" />}
          tone="brand"
          trend={{ value: 1, label: "vs last month" }}
          sparkline={{ variant: "bar", data: PROXY_MONTHLY.map(m => m.count), color: "var(--ef-brand)" }}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LEFT: Period Coverage + Absences */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Period Coverage Visual */}
              <Card>
                <CardHeader className="flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2"><LayoutGrid className="size-4 text-primary" /> Today&apos;s Period Coverage</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/admin/proxy-board">Open Proxy Board <ArrowRight className="size-3 ml-1" /></Link>
                  </Button>
                </CardHeader>
                <Separator />
                <CardContent className="p-4">
                  <div className="overflow-x-auto -mx-1 px-1">
                    <div className="grid grid-cols-7 gap-2 min-w-[280px]">
                    {PERIOD_COVERAGE.map(p => (
                      <div key={p.id} className="flex flex-col items-center gap-1.5">
                        <div className="text-[10px] font-medium text-muted-foreground">{p.label}</div>
                        <div className={`w-full rounded-md p-2 text-center text-[10px] font-medium min-h-[60px] flex flex-col items-center justify-center gap-0.5 ${
                          p.covered
                            ? "bg-success text-success-foreground border border-success-foreground/20"
                            : "bg-destructive/10 text-destructive-foreground border border-destructive/20 border-dashed"
                        }`}>
                          {p.covered ? (
                            <><CheckCircle2 className="size-3" /><span className="leading-tight">{p.proxy?.split(" ")[0]}</span></>
                          ) : (
                            <><UserX className="size-3" /><span>Open</span></>
                          )}
                        </div>
                        <div className="text-[9px] text-muted-foreground truncate w-full text-center">{p.subject}</div>
                      </div>
                    ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-success-foreground">
                      <span className="size-2 rounded-full bg-[var(--ef-green)]" aria-hidden="true" />Covered ({coveredPeriods})
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-destructive">
                      <span className="size-2 rounded-full bg-destructive" aria-hidden="true" />Uncovered ({totalPeriods - coveredPeriods})
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Fill rate</span>
                      <span className="text-xs font-bold text-success-foreground">{coveragePct}%</span>
                    </div>
                  </div>
                  <Progress value={coveragePct} className="h-1.5 mt-2 [&>div]:bg-[var(--ef-green)]" />
                </CardContent>
              </Card>

              {/* Today's Absences Table */}
              <Card>
                <CardHeader className="flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2"><UserX className="size-4 text-primary" /> Today&apos;s Absences</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive">● {absentToday} absent</Badge>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/admin/absences">View all</Link>
                    </Button>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {MOCK_ABSENCES.map(absence => (
                      <li key={absence.id} className="flex items-center justify-between gap-4 px-6 py-3.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0" aria-hidden="true">
                            {absence.teacherName.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{absence.teacherName}</p>
                            <p className="text-xs text-muted-foreground">
                              {absence.periods.length === 7 ? "Full day" : `${absence.periods.length} period${absence.periods.length > 1 ? "s" : ""}`}
                              {" · "}{absence.reason}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant={absence.status === "approved" ? "success" : absence.status === "pending" ? "warning" : "secondary"} className="capitalize">
                            {absence.status}
                          </Badge>
                          <Button variant="outline" size="xs" asChild>
                            <Link href="/admin/proxy-board">Assign</Link>
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* Teacher Workload Chart */}
              <Card>
                <CardHeader className="flex-row items-center justify-between pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart3 className="size-4 text-primary" /> Teacher Proxy Workload — June
                  </CardTitle>
                  <Badge variant="secondary">Monthly caps</Badge>
                </CardHeader>
                <Separator />
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={TEACHER_WORKLOAD} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="32%">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                      <Bar dataKey="proxies" name="Used" fill="var(--ef-brand)" radius={[4,4,0,0]} fillOpacity={0.85} />
                      <Bar dataKey="cap" name="Cap" fill="var(--muted)" radius={[4,4,0,0]} fillOpacity={0.4} />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-primary" /> Proxies done</span>
                    <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-muted border" /> Monthly cap</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* RIGHT column */}
            <div className="flex flex-col gap-6" style={{ minWidth: 0 }}>
              {/* Proxy Trend Chart */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2"><Zap className="size-4 text-primary" /> Proxy Duties — 2026</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="p-4">
                  <ResponsiveContainer width="100%" height={100}>
                    <BarChart data={PROXY_MONTHLY} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap="30%">
                      <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                      <Bar dataKey="count" name="Duties" fill="var(--primary)" radius={[4,4,0,0]}>
                        {PROXY_MONTHLY.map((_, i) => (
                          <Cell key={i} fill={i === PROXY_MONTHLY.length - 1 ? "var(--ef-brand)" : "var(--ef-brand-light)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-2 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">This month</span>
                    <span className="text-sm font-semibold">{PROXY_MONTHLY[PROXY_MONTHLY.length - 1].count} duties</span>
                  </div>
                </CardContent>
              </Card>

              {/* Fee Distribution Donut */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <IndianRupee className="size-4 text-primary" /> Fee Status
                  </CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={80} height={80}>
                      <PieChart>
                        <Pie data={FEE_PIE_DATA} cx="50%" cy="50%" innerRadius={24} outerRadius={38} dataKey="value" strokeWidth={2} stroke="var(--card)">
                          {FEE_PIE_DATA.map((d, i) => <Cell key={i} fill={d.color} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 flex flex-col gap-1.5">
                      {FEE_PIE_DATA.map(d => (
                        <div key={d.name} className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                          <span className="text-xs flex-1">{d.name}</span>
                          <span className="text-xs font-bold">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/admin/fees">View Fee Details <ArrowRight className="size-3 ml-1" /></Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2"><ClipboardList className="size-4 text-primary" /> Quick Actions</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="p-4 grid grid-cols-2 gap-2">
                  {[
                    { label: "Proxy Board",  icon: LayoutGrid,    href: "/admin/proxy-board" },
                    { label: "Add Teacher",  icon: Users,         href: "/admin/teachers" },
                    { label: "Mark Absence", icon: ClipboardList, href: "/admin/absences" },
                    { label: "Analytics",    icon: TrendingUp,    href: "/admin/analytics" },
                    { label: "Students",     icon: GraduationCap, href: "/admin/students" },
                    { label: "Notices",      icon: Bell,          href: "/admin/notices" },
                  ].map(action => (
                    <Button key={action.label} variant="outline" size="sm" className="h-14 flex-col gap-1" asChild>
                      <Link href={action.href}>
                        <action.icon className="size-4" />
                        <span className="text-xs">{action.label}</span>
                      </Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2"><Clock className="size-4 text-primary" /> Recent Activity</CardTitle>
                </CardHeader>
                <Separator />
                <CardContent className="p-0">
                  <ul className="divide-y divide-border">
                    {RECENT_ACTIVITY.map((a, i) => (
                      <li key={i} className="flex items-start gap-3 px-4 py-2.5">
                        <div className={`mt-1 size-1.5 rounded-full flex-shrink-0 ${
                          a.type === "proxy" ? "bg-primary" : a.type === "absence" ? "bg-destructive" :
                          a.type === "swap" ? "bg-[var(--ef-purple)]" : a.type === "fee" ? "bg-success-foreground" : "bg-warning-foreground"
                        }`} aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-xs leading-relaxed">{a.text}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{a.time}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Attendance Trend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" /> Attendance Trend — 2026
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={ATTENDANCE_MONTHLY} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={36} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="percent" name="Attendance %" stroke="var(--ef-brand)" strokeWidth={2} dot={{ r: 4, fill: "var(--ef-brand)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Fee Collection Trend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <IndianRupee className="size-4 text-primary" /> Fee Collection — 2026
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={FEE_COLLECTION_MONTHLY} margin={{ top: 8, right: 8, left: -10, bottom: 0 }} barCategoryGap="28%">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v/1000).toFixed(0)}K`} width={44} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                    <Bar dataKey="collected" name="Collected" fill="var(--ef-green)" radius={[4,4,0,0]} />
                    <Bar dataKey="due" name="Due" fill="var(--ef-red)" radius={[4,4,0,0]} fillOpacity={0.7} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm" style={{ background: "var(--ef-green)" }} /> Collected</span>
                  <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm" style={{ background: "var(--ef-red)", opacity: 0.7 }} /> Due</span>
                </div>
              </CardContent>
            </Card>

            {/* Proxy duties trend */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Zap className="size-4 text-primary" /> Proxy Duties — 6 Months
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={PROXY_MONTHLY} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" name="Proxy Duties" stroke="var(--ef-amber)" strokeWidth={2} dot={{ r: 4, fill: "var(--ef-amber)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Teacher Status Breakdown */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Users className="size-4 text-primary" /> Staff Overview
                </CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-4">
                <div className="space-y-4">
                  {[
                    { label: "Active Teachers",   value: TEACHERS.filter(t => t.status === "active").length,   total: TEACHERS.length, color: "var(--ef-green)" },
                    { label: "On Leave",          value: TEACHERS.filter(t => t.status === "on_leave").length, total: TEACHERS.length, color: "var(--ef-amber)" },
                    { label: "Inactive",          value: TEACHERS.filter(t => t.status === "inactive").length, total: TEACHERS.length, color: "var(--muted-foreground)" },
                  ].map(row => (
                    <div key={row.label} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span className="font-semibold">{row.value} / {row.total}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(row.value / row.total) * 100}%`, background: row.color }} />
                      </div>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-border">
                    <Button variant="ghost" size="sm" className="w-full" asChild>
                      <Link href="/admin/teachers">Manage Teachers <ArrowRight className="size-3 ml-1" /></Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="mt-4">
          <Card>
            <CardContent className="p-12 text-center">
              <BookOpen className="size-10 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Reports</p>
              <p className="text-sm text-muted-foreground mt-1">Generate PDF and Excel reports</p>
              <div className="flex items-center gap-3 justify-center mt-4">
                <Button variant="outline">Attendance Report</Button>
                <Button variant="outline">Fee Report</Button>
                <Button>Proxy Report</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick action alert for uncovered periods */}
      {PERIOD_COVERAGE.filter(p => !p.covered).length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center gap-4">
            <AlertTriangle className="size-5 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">{PERIOD_COVERAGE.filter(p => !p.covered).length} uncovered periods need proxy assignment</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {PERIOD_COVERAGE.filter(p => !p.covered).map(p => `${p.id} (${p.class} · ${p.subject})`).join(" · ")}
              </p>
            </div>
            <Button variant="destructive" size="sm" asChild>
              <Link href="/admin/proxy-board"><Zap className="size-4" /> Assign Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Help & Resources */}
      <section>
        <h2 className="text-base font-semibold mb-3">Help &amp; Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TaskList
            title="Daily Admin Checklist"
            subtitle="Quick tasks to keep the school day running smoothly"
            tasks={HELP_TASKS}
            allowReset
          />
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="size-4 text-primary" /> Quick References
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-4 flex flex-col gap-3">
              {[
                { label: "Proxy Assignment Guide", href: "/admin/proxy-board", desc: "How to assign proxies and use auto-assign" },
                { label: "Absence Workflow", href: "/admin/absences", desc: "Mark, approve and manage teacher absences" },
                { label: "Fee Collection Steps", href: "/admin/fees/collection", desc: "Collect fees and generate receipts" },
                { label: "Timetable Management", href: "/admin/timetable", desc: "Build and edit the school timetable" },
              ].map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-start gap-3 rounded-md p-2 hover:bg-muted/40 transition-colors"
                >
                  <ArrowRight className="size-4 text-primary mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
