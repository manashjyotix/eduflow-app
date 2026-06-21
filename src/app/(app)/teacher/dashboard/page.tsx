"use client"
import { useState } from "react"
import Link from "next/link"
import {
  LayoutDashboard, Calendar, CheckCircle, AlertCircle, Clock,
  ArrowRight, Bell, BookOpen, Award, TrendingUp, Zap, User,
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
const Tooltip = dynamic(
  () => import("recharts").then((m) => ({ default: m.Tooltip })),
  { ssr: false }
)
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => ({ default: m.CartesianGrid })),
  { ssr: false }
)
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { WeatherGreeting } from "@/components/shared/weather-greeting"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { TEACHING_PERIODS } from "@/lib/constants"

const TODAY_SCHEDULE = [
  { period: "P1", subject: "Mathematics", class: "VIII-A", time: "9:30 – 10:10",  type: "regular" as const },
  { period: "P3", subject: "Mathematics", class: "IX-B",   time: "10:50 – 11:30", type: "proxy" as const },
  { period: "P5", subject: "Science",     class: "VII-A",  time: "12:30 – 1:10",  type: "proxy" as const },
  { period: "P6", subject: "Mathematics", class: "X-A",    time: "1:10 – 1:50",   type: "regular" as const },
]

const PROXY_REQUESTS = [
  { id: "pr1", period: "P4", class: "VII-B", subject: "English", time: "11:30–12:10", absentTeacher: "Anita Devi",   status: "pending" as const },
]

const LEAVE_BALANCE = [
  { type: "Sick Leave",    used: 2, total: 7 },
  { type: "Casual Leave",  used: 2, total: 10 },
  { type: "Earned Leave",  used: 0, total: 12 },
]

const MONTHLY_PROXIES = [
  { month: "Jan", count: 2 }, { month: "Feb", count: 4 },
  { month: "Mar", count: 3 }, { month: "Apr", count: 5 },
  { month: "May", count: 3 }, { month: "Jun", count: 2 },
]

const RECENT_NOTIFICATIONS = [
  { id: "n1", text: "New proxy assignment: P4 Class VII-B", time: "5 min ago", type: "proxy", read: false },
  { id: "n2", text: "Leave approved: May 15 (Sick Leave)", time: "2d ago",  type: "leave", read: true },
  { id: "n3", text: "Notice: Staff meeting Jun 15, 4 PM",  time: "3d ago",  type: "notice", read: true },
]

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-xs">
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

export default function TeacherDashboardPage() {
  const [acceptedIds, setAcceptedIds] = useState<string[]>([])
  const [declinedIds, setDeclinedIds] = useState<string[]>([])

  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })
  const proxyCount = TODAY_SCHEDULE.filter(s => s.type === "proxy").length
  const totalPeriods = TODAY_SCHEDULE.length
  const monthProxies = MONTHLY_PROXIES.reduce((s, m) => s + m.count, 0)
  const pendingRequests = PROXY_REQUESTS.filter(r => !acceptedIds.includes(r.id) && !declinedIds.includes(r.id))

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <WeatherGreeting />

      {/* Greeting banner */}
      <Card className="border-0 text-white bg-gradient-to-br from-[#007AFF] to-[#0062CC]">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm opacity-75 mb-1">
              <User className="size-3.5" />
              <span>Priya Sharma · Mathematics & Science · High Section</span>
            </div>
            <h2 className="text-xl font-extrabold">Good morning, Priya! 👋</h2>
            <p className="text-sm opacity-75 mt-0.5">{today} · {totalPeriods} periods scheduled today</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link href="/teacher/leave"><Calendar className="size-4" /> Apply Leave</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <PageHeader
        icon={<LayoutDashboard size={22} />}
        title="My Dashboard"
        subtitle="Your schedule, proxy duties, and leave at a glance"
        actions={
          pendingRequests.length > 0 ? (
            <Badge variant="warning" className="text-xs px-3 py-1">
              <Bell className="size-3.5 mr-1" /> {pendingRequests.length} proxy request{pendingRequests.length > 1 ? "s" : ""} pending
            </Badge>
          ) : undefined
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard title="Periods Today"      value={totalPeriods}  icon={<Clock className="size-5" />}        sparkline={{ variant: "bar", data: [4,5,3,4,4,3,totalPeriods] }} />
        <KpiCard title="Proxy Today"        value={proxyCount}    icon={<AlertCircle className="size-5" />}  iconClassName="bg-warning/20 text-warning-foreground" sparkline={{ variant: "bar", data: [0,1,1,2,1,1,proxyCount], color: "var(--ef-amber)" }} />
        <KpiCard title="Leave Balance"      value="29 days"       icon={<CheckCircle className="size-5" />}  iconClassName="bg-success/20 text-success-foreground" sparkline={{ variant: "arc", value: 73, color: "var(--ef-green)" }} />
        <KpiCard title="Proxies This Month" value={monthProxies}  icon={<Calendar className="size-5" />}     iconClassName="bg-primary/10 text-primary" trend={{ value: -1, label: "vs last month" }} sparkline={{ variant: "bar", data: MONTHLY_PROXIES.map(m => m.count) }} />
      </div>

      {/* Proxy Requests Alert */}
      {pendingRequests.map(req => (
        <Card key={req.id} className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-full bg-warning/20 text-warning-foreground flex items-center justify-center flex-shrink-0 mt-0.5">
                <Zap className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Proxy Request — {req.period} · {req.class} · {req.subject}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Covering for {req.absentTeacher} · {req.time}</p>
                <p className="text-xs text-muted-foreground">Assigned by management · Accept or decline before period starts</p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" onClick={() => setAcceptedIds(p => [...p, req.id])}>Accept</Button>
              <Button size="sm" variant="outline" onClick={() => setDeclinedIds(p => [...p, req.id])}>Decline</Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {acceptedIds.length > 0 && (
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="size-5 text-success-foreground" />
            <p className="text-sm font-medium text-success-foreground">Proxy accepted! Management has been notified.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Today's schedule */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Calendar className="size-4 text-primary" /> Today&apos;s Schedule</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{totalPeriods} periods</Badge>
                <Button variant="ghost" size="sm" asChild><Link href="/teacher/timetable">Full timetable <ArrowRight className="size-3" /></Link></Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {TEACHING_PERIODS.map(p => {
                  const slot = TODAY_SCHEDULE.find(s => s.period === p.id)
                  const isAcceptedProxy = slot?.type === "proxy" && acceptedIds.includes("pr1") && slot.period === "P4"
                  return (
                    <li key={p.id} className={`flex items-center justify-between gap-4 px-5 py-3 ${slot?.type === "proxy" ? "bg-warning/5" : ""}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          slot
                            ? slot.type === "proxy"
                              ? "bg-warning/20 text-warning-foreground"
                              : "bg-primary/10 text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}>{p.id}</div>
                        <div>
                          <p className="text-xs text-muted-foreground font-mono">{p.time}</p>
                          {slot ? (
                            <p className="text-sm font-medium">{slot.subject} · {slot.class}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Free Period</p>
                          )}
                        </div>
                      </div>
                      {slot?.type === "proxy" && <Badge variant="warning" className="text-xs flex-shrink-0">Proxy</Badge>}
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>

          {/* Monthly proxy chart */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="size-4 text-primary" /> Proxy Duties — Jan to Jun 2026
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-4">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={MONTHLY_PROXIES} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                  <Bar dataKey="count" name="Proxies" fill="var(--primary)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Total: <strong className="text-foreground">{monthProxies}</strong> duties YTD</span>
                <Button variant="ghost" size="sm" className="h-5 text-xs" asChild><Link href="/teacher/proxy-history">View history <ArrowRight className="size-3" /></Link></Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Leave balance + notifications */}
        <div className="flex flex-col gap-6">
          {/* Leave balance */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Award className="size-4 text-primary" /> Leave Balance
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-4 space-y-4">
              {LEAVE_BALANCE.map(lb => {
                const remaining = lb.total - lb.used
                const pct = Math.round((remaining / lb.total) * 100)
                return (
                  <div key={lb.type} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">{lb.type}</span>
                      <span className={`font-bold ${remaining <= 2 ? "text-destructive" : "text-success-foreground"}`}>{remaining} remaining</span>
                    </div>
                    <Progress
                      value={pct}
                      className={`h-2 ${remaining <= 2 ? "[&>div]:bg-destructive" : "[&>div]:bg-[var(--ef-green)]"}`}
                    />
                    <p className="text-[10px] text-muted-foreground">{lb.used} used of {lb.total} total</p>
                  </div>
                )
              })}
              <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                <Link href="/teacher/leave"><Calendar className="size-3.5" /> Apply for Leave</Link>
              </Button>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3 flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Bell className="size-4 text-primary" /> Notifications</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{RECENT_NOTIFICATIONS.filter(n => !n.read).length} new</Badge>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {RECENT_NOTIFICATIONS.map(n => (
                  <li key={n.id} className={`px-4 py-3 flex items-start gap-3 ${!n.read ? "bg-primary/5" : ""}`}>
                    <div className={`mt-0.5 size-1.5 rounded-full flex-shrink-0 ${
                      n.type === "proxy" ? "bg-warning-foreground" :
                      n.type === "leave" ? "bg-[var(--ef-green)]" : "bg-primary"
                    }`} aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-xs leading-relaxed">{n.text}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="p-3 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href="/teacher/notifications">All notifications <ArrowRight className="size-3" /></Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><LayoutDashboard className="size-4 text-primary" /> Quick Links</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-3 grid grid-cols-2 gap-2">
              {[
                { label: "My Timetable",   icon: Calendar,     href: "/teacher/timetable" },
                { label: "Proxy History",  icon: TrendingUp,   href: "/teacher/proxy-history" },
                { label: "Notices",        icon: Bell,         href: "/teacher/notices" },
                { label: "Attendance",     icon: BookOpen,     href: "/teacher/attendance" },
              ].map(item => (
                <Button key={item.label} variant="outline" size="sm" className="h-12 flex-col gap-1 text-xs" asChild>
                  <Link href={item.href}>
                    <item.icon className="size-3.5" />{item.label}
                  </Link>
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
