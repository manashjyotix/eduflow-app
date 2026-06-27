"use client"
import Link from "next/link"
import dynamic from "next/dynamic"
import {
  LayoutDashboard, BookOpen, Calendar, DollarSign, Bell, TrendingUp,
  AlertTriangle, ArrowRight, SmilePlus,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"

// ── Dynamic recharts imports (SSR-safe, code-split) ───────────────────────────
const AreaChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.AreaChart })),
  { ssr: false }
)
const Area = dynamic(
  () => import("recharts").then((m) => ({ default: m.Area })),
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
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => ({ default: m.ResponsiveContainer })),
  { ssr: false }
)

import { KpiCard } from "@/components/shared/kpi-card"
import { WeatherGreeting } from "@/components/shared/weather-greeting"
import { BirthdayCard } from "@/components/shared/birthday-card"
import { getActiveChildBirthday } from "@/data/birthdays"
import { SubjectTracker } from "@/components/shared/subject-tracker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { SUBJECT_COMPLETION } from "@/data/subject-completion"
import { useChild } from "@/context/child-context"

interface ChildClass {
  period: string
  subject: string
  teacher: string
  time: string
  status: "completed" | "ongoing" | "upcoming"
  homework: string
  proxy?: boolean
}

interface ChildData {
  name: string
  class: string
  roll: number
  attendance: number
  school: string
  nextExamDate: string
  todayClasses: ChildClass[]
  attendanceTrend: { month: string; pct: number }[]
  behaviorTrend: { week: string; excellent: number; good: number; fair: number; poor: number }[]
  notifications: { id: string; msg: string; time: string; read: boolean; type: string }[]
  upcomingExams: { subject: string; date: string; days: number }[]
  feeDues: { head: string; month: string; amount: number; status: "overdue" | "pending" }[]
  /** Last 6 months outstanding-due amounts (₹) — drives the Fee Due sparkline. */
  feeTrend: number[]
  /** Last 6 weeks notice counts — drives the Notices sparkline. */
  noticeTrend: number[]
}

const SCHOOL = "Holy Child English Academy"

// Per-child mock data — keyed by child id from <ChildProvider>.
const CHILD_DATA: Record<string, ChildData> = {
  "child-1": {
    name: "Rohit Das", class: "VIII-A", roll: 12, attendance: 84.6, school: SCHOOL,
    nextExamDate: "2026-06-20",
    todayClasses: [
      { period: "P1", subject: "Mathematics", teacher: "Priya Sharma",  time: "9:30",  status: "completed", homework: "Ex 4.3 Q1–10" },
      { period: "P2", subject: "English",     teacher: "Rajesh Kalita", time: "10:10", status: "completed", homework: "" },
      { period: "P3", subject: "Science",     teacher: "Sunita Borah",  time: "10:50", status: "ongoing",   homework: "", proxy: true },
      { period: "P4", subject: "Hindi",       teacher: "Meena Gogoi",   time: "11:30", status: "upcoming",  homework: "" },
      { period: "P5", subject: "History",     teacher: "Rajesh Kalita", time: "12:30", status: "upcoming",  homework: "" },
    ],
    attendanceTrend: [
      { month: "Jan", pct: 90 }, { month: "Feb", pct: 87 }, { month: "Mar", pct: 94 },
      { month: "Apr", pct: 85 }, { month: "May", pct: 82 }, { month: "Jun", pct: 84.6 },
    ],
    behaviorTrend: [
      { week: "W1 May", excellent: 3, good: 1, fair: 1, poor: 0 },
      { week: "W2 May", excellent: 2, good: 2, fair: 1, poor: 0 },
      { week: "W3 May", excellent: 3, good: 2, fair: 0, poor: 0 },
      { week: "W4 May", excellent: 1, good: 3, fair: 1, poor: 1 },
      { week: "W1 Jun", excellent: 2, good: 2, fair: 2, poor: 0 },
      { week: "W2 Jun", excellent: 4, good: 1, fair: 0, poor: 0 },
    ],
    notifications: [
      { id: "n1", msg: "PTM scheduled for June 28, 10 AM – 4 PM", time: "2h ago", read: false, type: "info" },
      { id: "n2", msg: "Fee due: ₹2,500 before June 30",          time: "1d ago", read: false, type: "warning" },
      { id: "n3", msg: "Mid-term exam schedule released",          time: "2d ago", read: true,  type: "info" },
      { id: "n4", msg: "Rohit scored 88% in Math test",           time: "3d ago", read: true,  type: "success" },
    ],
    upcomingExams: [
      { subject: "Mathematics", date: "Jun 20", days: 3 },
      { subject: "Science",     date: "Jun 22", days: 5 },
      { subject: "English",     date: "Jun 24", days: 7 },
    ],
    feeDues: [
      { head: "Tuition Fee", month: "May 2026", amount: 2500, status: "overdue" },
      { head: "Exam Fee",    month: "Jun 2026", amount: 500,  status: "pending" },
    ],
    feeTrend: [1500, 0, 2000, 500, 1000, 3000],
    noticeTrend: [2, 4, 1, 3, 2, 4],
  },
  "child-2": {
    name: "Riya Das", class: "VI-B", roll: 8, attendance: 92.3, school: SCHOOL,
    nextExamDate: "2026-06-22",
    todayClasses: [
      { period: "P1", subject: "English",     teacher: "Rajesh Kalita",  time: "9:30",  status: "completed", homework: "Read Ch. 6" },
      { period: "P2", subject: "Mathematics", teacher: "Priya Sharma",   time: "10:10", status: "completed", homework: "Worksheet 2" },
      { period: "P3", subject: "Geography",   teacher: "Anita Devi",     time: "10:50", status: "ongoing",   homework: "" },
      { period: "P4", subject: "Science",     teacher: "Sunita Borah",   time: "11:30", status: "upcoming",  homework: "" },
      { period: "P5", subject: "Drawing",     teacher: "Meena Gogoi",    time: "12:30", status: "upcoming",  homework: "" },
    ],
    attendanceTrend: [
      { month: "Jan", pct: 95 }, { month: "Feb", pct: 91 }, { month: "Mar", pct: 96 },
      { month: "Apr", pct: 89 }, { month: "May", pct: 93 }, { month: "Jun", pct: 92.3 },
    ],
    behaviorTrend: [
      { week: "W1 May", excellent: 4, good: 1, fair: 0, poor: 0 },
      { week: "W2 May", excellent: 3, good: 2, fair: 0, poor: 0 },
      { week: "W3 May", excellent: 4, good: 1, fair: 0, poor: 0 },
      { week: "W4 May", excellent: 3, good: 2, fair: 0, poor: 0 },
      { week: "W1 Jun", excellent: 4, good: 1, fair: 0, poor: 0 },
      { week: "W2 Jun", excellent: 5, good: 0, fair: 0, poor: 0 },
    ],
    notifications: [
      { id: "n1", msg: "PTM scheduled for June 28, 10 AM – 4 PM", time: "2h ago", read: false, type: "info" },
      { id: "n2", msg: "Riya selected for inter-school quiz",      time: "1d ago", read: false, type: "success" },
      { id: "n3", msg: "Mid-term exam schedule released",          time: "2d ago", read: true,  type: "info" },
      { id: "n4", msg: "Riya scored 95% in English test",          time: "4d ago", read: true,  type: "success" },
    ],
    upcomingExams: [
      { subject: "English",     date: "Jun 22", days: 5 },
      { subject: "Mathematics", date: "Jun 24", days: 7 },
      { subject: "Science",     date: "Jun 26", days: 9 },
    ],
    feeDues: [],
    feeTrend: [800, 0, 1200, 0, 0, 0],
    noticeTrend: [3, 2, 4, 2, 3, 4],
  },
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-card text-xs">
      <p className="font-semibold">{label}</p>
      <p className="text-primary font-bold">{payload[0]?.value}%</p>
    </div>
  )
}

function BehaviorTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-card text-xs min-w-[120px]">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm flex-shrink-0" style={{ background: p.color }} />
          <span className="text-muted-foreground flex-1 capitalize">{p.name}:</span>
          <span className="font-bold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function ParentDashboardPage() {
  const { selectedChildId } = useChild()
  const CHILD = CHILD_DATA[selectedChildId] ?? CHILD_DATA["child-1"]

  const TODAY_CLASSES = CHILD.todayClasses
  const ATTENDANCE_TREND = CHILD.attendanceTrend
  const BEHAVIOR_TREND = CHILD.behaviorTrend
  const NOTIFICATIONS = CHILD.notifications
  const UPCOMING_EXAMS = CHILD.upcomingExams
  const FEE_DUES = CHILD.feeDues

  const daysToExam = Math.max(0, Math.ceil((new Date(CHILD.nextExamDate).getTime() - Date.now()) / 86400000))
  const totalDue = FEE_DUES.reduce((s, f) => s + f.amount, 0)
  const unreadCount = NOTIFICATIONS.filter(n => !n.read).length

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <WeatherGreeting subtitle={`Parent of ${CHILD.name}`} />

      {/* Birthday wishes — parent's own + their child's (in-app for family) */}
      <BirthdayCard />
      <BirthdayCard person={getActiveChildBirthday()} />


      <PageHeader
        icon={<LayoutDashboard size={22} />}
        title="Parent Dashboard"
        subtitle={`Monitoring ${CHILD.name}'s academic journey`}
      />

      {/* KPIs — 1 col (mobile) · 2 cols (tablet) · 4 cols (desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Attendance"
          value={`${CHILD.attendance}%`}
          icon={<TrendingUp className="size-5" />}
          iconClassName={CHILD.attendance >= 85 ? "bg-success/20 text-success-foreground" : "bg-warning/20 text-warning-foreground"}
          trend={{ value: CHILD.attendance >= 85 ? 2 : -3 }}
          sparkline={{ variant: "line", data: ATTENDANCE_TREND.map(a => a.pct) }}
        />
        <KpiCard
          title="Exam In"
          value={`${daysToExam}d`}
          subtitle={UPCOMING_EXAMS[0] ? `Next: ${UPCOMING_EXAMS[0].date}` : "No exams"}
          icon={<Calendar className="size-5" />}
          iconClassName="bg-primary/10 text-primary"
          sparkline={{ variant: "arc", value: Math.max(0, 100 - daysToExam * 10), color: "var(--ef-purple)" }}
        />
        <KpiCard
          title="Fee Due"
          value={`₹${totalDue.toLocaleString("en-IN")}`}
          subtitle={totalDue > 0 ? "Due Jun 30" : "All clear"}
          icon={<DollarSign className="size-5" />}
          iconClassName="bg-destructive/10 text-destructive"
          sparkline={{ variant: "bar", data: CHILD.feeTrend, color: "var(--ef-red)" }}
        />
        <KpiCard
          title="Notices"
          value={unreadCount}
          subtitle={`${unreadCount} unread`}
          icon={<Bell className="size-5" />}
          iconClassName="bg-warning/20 text-warning-foreground"
          sparkline={{ variant: "bar", data: CHILD.noticeTrend, color: "var(--ef-amber)" }}
        />
      </div>

      {/* Behavioral Trend */}
      <Card>
        <CardHeader className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <SmilePlus className="size-4 text-primary" /> Behavioral Trend — Last 6 Weeks
          </CardTitle>
          <div className="text-[11px] text-muted-foreground">
            Weekly conduct ratings recorded by class teachers · Last 6 weeks
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={BEHAVIOR_TREND} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barGap={2} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 5]}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={24}
                tickCount={6}
              />
              <Tooltip content={<BehaviorTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
              <Bar dataKey="excellent" name="Excellent" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="good"      name="Good"      fill="var(--chart-2)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="fair"      name="Fair"      fill="var(--chart-3)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="poor"      name="Poor"      fill="var(--chart-4)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground mt-2">
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm inline-block" style={{ background: "var(--chart-1)" }} /> Excellent</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm inline-block" style={{ background: "var(--chart-2)" }} /> Good</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm inline-block" style={{ background: "var(--chart-3)" }} /> Fair</span>
            <span className="flex items-center gap-1"><span className="size-2 rounded-sm inline-block" style={{ background: "var(--chart-4)" }} /> Poor</span>
          </div>
        </CardContent>
      </Card>

      {/* Fee alert */}
      {totalDue > 0 && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-destructive flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">Outstanding fee: ₹{totalDue.toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground">Deadline: June 30, 2026. A 2% late fee applies after due date.</p>
              </div>
            </div>
            <Button size="sm" variant="destructive" asChild>
              <Link href="/parent/fees">Pay Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's classes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Calendar className="size-4 text-primary" /> Today&apos;s Classes
            </CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/parent/journal">Class Journal <ArrowRight className="size-3" /></Link></Button>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {TODAY_CLASSES.map(cls => (
                <li key={cls.period} className={`flex items-center gap-4 px-5 py-3 ${cls.status === "ongoing" ? "bg-primary/5" : ""}`}>
                  <div className={`size-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    cls.status === "ongoing" ? "bg-primary text-primary-foreground"
                    : cls.status === "completed" ? "bg-[var(--ef-green-light)] text-[var(--ef-green-dark)]"
                    : "bg-muted text-muted-foreground"
                  }`}>{cls.period}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{cls.subject}</p>
                      {cls.proxy && <Badge variant="warning" className="text-[9px]">Proxy</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{cls.teacher} · {cls.time}</p>
                    {cls.homework && <p className="text-[10px] text-primary mt-0.5">HW: {cls.homework}</p>}
                  </div>
                  <Badge variant={cls.status === "completed" ? "success" : cls.status === "ongoing" ? "default" : "secondary"} className="capitalize text-xs flex-shrink-0">
                    {cls.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Upcoming exams */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <BookOpen className="size-4 text-primary" /> Upcoming Exams
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              {UPCOMING_EXAMS.map((exam, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-border last:border-0">
                  <div className={`size-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${exam.days <= 3 ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                    {exam.days}d
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{exam.subject}</p>
                    <p className="text-xs text-muted-foreground">{exam.date}</p>
                  </div>
                  {exam.days <= 3 && <Badge variant="destructive" className="text-[9px]">Soon</Badge>}
                </div>
              ))}
              <div className="p-3 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href="/parent/exams">Full schedule <ArrowRight className="size-3" /></Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="size-4 text-primary" /> Recent Notices
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {NOTIFICATIONS.slice(0, 3).map(n => (
                  <li key={n.id} className={`px-4 py-2.5 ${!n.read ? "bg-primary/5" : ""}`}>
                    <p className="text-xs font-medium leading-relaxed">{n.msg}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                  </li>
                ))}
              </ul>
              <div className="p-3 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href="/parent/notifications">View all <ArrowRight className="size-3" /></Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance trend chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" /> Attendance Trend — 2026
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${CHILD.attendance >= 85 ? "text-success-foreground" : "text-warning-foreground"}`}>{CHILD.attendance}% current</span>
            {CHILD.attendance < 75 && <Badge variant="destructive" className="text-xs">Below minimum</Badge>}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={ATTENDANCE_TREND} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="attGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--ef-brand)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--ef-brand)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} width={34} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="pct" name="Attendance" stroke="var(--ef-brand)" strokeWidth={2} fill="url(#attGradient)" dot={{ r: 4, fill: "var(--ef-brand)", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="space-y-1">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">This year</span>
                <span className="font-bold">{CHILD.attendance}%</span>
              </div>
              <Progress value={CHILD.attendance} className={`h-2 w-48 ${CHILD.attendance >= 85 ? "[&>div]:bg-[var(--ef-green)]" : "[&>div]:bg-[var(--ef-amber)]"}`} />
              <p className="text-[10px] text-muted-foreground">Min required: 75% · {CHILD.attendance >= 75 ? "✓ On track" : "⚠ Below minimum"}</p>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/parent/attendance">Full attendance log <ArrowRight className="size-3" /></Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Syllabus completion tracker */}
      <SubjectTracker subjects={SUBJECT_COMPLETION} studentName={CHILD.name} compact />
    </div>
  )
}
