"use client"
import { useState } from "react"
import {
  Calendar, Filter, Clock, CheckCircle2, XCircle,
  AlertCircle, Award, BarChart2, Activity,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { MiniSparkline } from "@/components/shared/mini-sparkline"
import { EduBarChart } from "@/components/shared/edu-bar-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"

// ── Types ──────────────────────────────────────────────────────────────────────
type ProxyStatus = "Completed" | "Accepted" | "Declined" | "Expired"

interface ProxyRecord {
  id: string
  date: string
  period: string
  class: string
  absentTeacher: string
  subject: string
  status: ProxyStatus
  duration: string
}

// ── Mock Data ────────────────────────────────────────────────────────────────
const PROXY_HISTORY: ProxyRecord[] = [
  { id: "px1", date: "04 Jun 2026", period: "P4", class: "VII-B",  absentTeacher: "Anita Devi",    subject: "English",   status: "Accepted",  duration: "40 min" },
  { id: "px2", date: "02 Jun 2026", period: "P2", class: "IX-A",   absentTeacher: "Biju Das",      subject: "History",   status: "Completed", duration: "40 min" },
  { id: "px3", date: "28 May 2026", period: "P5", class: "VIII-B", absentTeacher: "Rajesh Kalita", subject: "Science",   status: "Completed", duration: "40 min" },
  { id: "px4", date: "22 May 2026", period: "P1", class: "X-A",    absentTeacher: "Dipak Baruah",  subject: "Physics",   status: "Completed", duration: "40 min" },
  { id: "px5", date: "15 May 2026", period: "P6", class: "VII-A",  absentTeacher: "Meena Gogoi",   subject: "Geography", status: "Completed", duration: "40 min" },
  { id: "px6", date: "10 May 2026", period: "P3", class: "VIII-A", absentTeacher: "Sunita Borah",  subject: "Chemistry", status: "Expired",   duration: "—" },
  { id: "px7", date: "05 May 2026", period: "P7", class: "IX-A",   absentTeacher: "Anita Devi",    subject: "English",   status: "Completed", duration: "40 min" },
  { id: "px8", date: "29 Apr 2026", period: "P4", class: "VII-B",  absentTeacher: "Rima Das",      subject: "Art",       status: "Declined",  duration: "—" },
]

// Monthly proxy count (Jan–Jun 2026)
const MONTHLY_TREND = [2, 4, 3, 5, 3, 2]
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]

// Recharts-compatible data for EduBarChart
const MONTHLY_TREND_DATA = MONTH_LABELS.map((month, i) => ({ month, proxies: MONTHLY_TREND[i] }))

// Subject distribution (all-time)
const SUBJECT_DIST = [
  { subject: "English",   count: 3, color: "var(--ef-brand)" },
  { subject: "History",   count: 2, color: "var(--ef-purple)" },
  { subject: "Science",   count: 1, color: "var(--ef-green)" },
  { subject: "Physics",   count: 1, color: "var(--ef-amber)" },
  { subject: "Others",    count: 1, color: "var(--muted-foreground)" },
]

const STATUS_CONFIG: Record<ProxyStatus, { variant: "success" | "warning" | "destructive" | "secondary" | "default"; icon: LucideIcon }> = {
  Completed: { variant: "success",     icon: CheckCircle2 },
  Accepted:  { variant: "default",     icon: CheckCircle2 },
  Declined:  { variant: "secondary",   icon: XCircle },
  Expired:   { variant: "destructive", icon: AlertCircle },
}

const MONTHS = ["June 2026", "May 2026", "April 2026", "March 2026"]

// Sortable columns for the substitution records table
const PROXY_COLUMNS = [
  { field: "date",          label: "Date" },
  { field: "period",        label: "Period" },
  { field: "class",         label: "Class" },
  { field: "absentTeacher", label: "Absent Teacher" },
  { field: "subject",       label: "Subject" },
  { field: "duration",      label: "Duration" },
  { field: "status",        label: "Status" },
] as const

// ── Sub-components ───────────────────────────────────────────────────────────

/** Subject distribution donut */
function SubjectDonut({ data }: { data: typeof SUBJECT_DIST }) {
  const total = data.reduce((s, d) => s + d.count, 0)
  const r = 24, cx = 30, cy = 30, stroke = 8
  const circ = 2 * Math.PI * r
  let offset = 0
  return (
    <div className="flex items-center gap-3.5">
      <div className="relative size-[60px] flex-shrink-0">
        <svg width={60} height={60} viewBox="0 0 60 60">
          {data.map(d => {
            const dash = (d.count / total) * circ
            const el = (
              <circle
                key={d.subject} cx={cx} cy={cy} r={r} fill="none"
                stroke={d.color} strokeWidth={stroke}
                strokeDasharray={`${dash - 1} ${circ - dash + 1}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${cx} ${cy})`}
              />
            )
            offset += dash
            return el
          })}
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-extrabold text-foreground">{total}</span>
      </div>
      <div className="flex-1 flex flex-col gap-1.5">
        {data.map(d => (
          <div key={d.subject} className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm flex-shrink-0" style={{ background: d.color }} />
            <span className="text-[11px] text-foreground flex-1">{d.subject}</span>
            <span className="text-[11px] font-bold" style={{ color: d.color }}>{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function ProxyHistoryPage() {
  const [selectedMonth, setSelectedMonth] = useState("June 2026")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState(2) // 0=Daily, 1=Weekly, 2=Monthly

  const filtered = PROXY_HISTORY.filter(r => {
    const monthMatch = selectedMonth === "June 2026" ? r.date.includes("Jun") :
                       selectedMonth === "May 2026"  ? r.date.includes("May") : true
    const statusMatch = statusFilter === "all" || r.status === statusFilter
    return monthMatch && statusMatch
  })

  const thisMonth = PROXY_HISTORY.filter(r => r.date.includes("Jun"))
  const thisWeek = PROXY_HISTORY.filter(r => r.date.includes("04 Jun") || r.date.includes("02 Jun"))
  const declined = PROXY_HISTORY.filter(r => r.status === "Declined")
  const total = PROXY_HISTORY.filter(r => r.status === "Completed")
  const totalMinutes = total.length * 40

  const { sorted, sortField, sortDir, toggleSort } = useTableSort<ProxyRecord, (typeof PROXY_COLUMNS)[number]["field"]>(filtered, {
    date:          r => new Date(r.date).getTime(),
    period:        r => r.period,
    class:         r => r.class,
    absentTeacher: r => r.absentTeacher,
    subject:       r => r.subject,
    duration:      r => r.duration,
    status:        r => r.status,
  }, { field: "date", dir: "desc" })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      {/* ── Page Header ── */}
      <PageHeader
        icon={<Calendar size={20} />}
        title="Proxy History"
        subtitle="Your substitution record at HCEA · Priya Sharma"
        actions={
          <div className="flex items-center gap-2">
            <div className="inline-flex bg-muted rounded-[10px] p-[3px] gap-0.5">
              {(["Daily", "Weekly", "Monthly"] as const).map((label, idx) => (
                <button
                  key={label}
                  onClick={() => setViewMode(idx)}
                  className={`px-3 h-7 rounded-lg text-xs transition-colors ${viewMode === idx ? "bg-card text-primary font-bold shadow-sm" : "text-muted-foreground font-medium"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="min-w-[160px]">
                <span className="flex items-center gap-2">
                  <Calendar size={14} />
                  <SelectValue />
                </span>
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard
          title="This Month"
          value={thisMonth.length}
          subtitle="Jun 2026"
          icon={<Calendar className="size-5" />}
          trend={{ value: -1, label: "vs May" }}
          sparkline={{ variant: "line", data: MONTHLY_TREND, color: "var(--ef-brand)" }}
        />
        <KpiCard
          title="This Week"
          value={thisWeek.length}
          subtitle="2–6 Jun"
          icon={<Clock className="size-5" />}
          iconClassName="bg-ef-purple-light text-ef-purple"
          sparkline={{ variant: "bar", data: [0, 1, 1, 2, 2, 2, thisWeek.length], color: "var(--ef-purple)" }}
        />
        <KpiCard
          title="Declined"
          value={declined.length}
          subtitle="All time"
          icon={<XCircle className="size-5" />}
          iconClassName="bg-muted text-muted-foreground"
          sparkline={{ variant: "bar", data: [0, 0, 1, 0, 0, 1, declined.length], color: "var(--muted-foreground)" }}
        />
        <KpiCard
          title="Total Completed"
          value={total.length}
          subtitle="All time"
          icon={<Award className="size-5" />}
          iconClassName="bg-ef-green-light text-ef-green"
          trend={{ value: 1, label: "Active" }}
          sparkline={{ variant: "line", data: [2, 4, 3, 5, 3, 2, total.length], color: "var(--ef-green)" }}
        />
        <KpiCard
          title="Teaching Time"
          value={`${totalMinutes}m`}
          subtitle={`As proxy · ${Math.round(totalMinutes / 60)}h total`}
          icon={<Activity className="size-5" />}
          iconClassName="bg-ef-amber-light text-ef-amber"
          sparkline={{ variant: "line", data: [80, 160, 120, 200, 120, 80, totalMinutes], color: "var(--ef-amber)" }}
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Monthly Trend — redesigned with EduBarChart */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart2 size={15} className="text-primary" /> Proxy Duties — June
            </CardTitle>
            <Badge variant="default">Jan–Jun 2026</Badge>
          </CardHeader>
          <div className="border-t border-border" />
          <CardContent className="pt-4">
            <EduBarChart
              data={MONTHLY_TREND_DATA}
              series={[{ dataKey: "proxies", name: "Proxy Duties", color: "var(--ef-brand)" }]}
              xKey="month"
              height={130}
              showYAxis={false}
              tooltipFormatter={(v) => `${v} duties`}
            />
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>This month</span>
              <span className="font-extrabold text-foreground text-sm">{MONTHLY_TREND[MONTHLY_TREND.length - 1]} duties</span>
            </div>
          </CardContent>
        </Card>

        {/* Subject Distribution */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Activity size={15} className="text-ef-purple" /> Subject Distribution
            </CardTitle>
            <Badge className="bg-ef-purple text-white hover:bg-ef-purple/80">All time</Badge>
          </CardHeader>
          <CardContent>
            <SubjectDonut data={SUBJECT_DIST} />
            <div className="mt-3.5 text-[11px] text-muted-foreground">
              Most covered: <strong className="text-primary">English (3)</strong>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Cap */}
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock size={15} className="text-ef-amber" /> Monthly Cap — Jun 2026
            </CardTitle>
            <Badge variant="warning">3 / 8 used</Badge>
          </CardHeader>
          <CardContent>
            {/* Arc showing cap usage */}
            <div className="flex items-center gap-4 mb-3.5">
              <MiniSparkline variant="arc" value={(3 / 8) * 100} color="var(--ef-amber)" height={72} width={72} />
              <div>
                <div className="text-[28px] font-extrabold text-foreground tracking-tight leading-none">3</div>
                <div className="text-xs text-muted-foreground mt-1">of 8 cap used</div>
                <div className="text-xs text-ef-green-dark font-semibold mt-0.5">5 remaining</div>
              </div>
            </div>
            <Progress value={(3 / 8) * 100} className="h-3 [&>div]:bg-ef-amber" />
            <div className="flex gap-3.5 mt-3">
              {[
                { label: "Completed", count: 2, color: "var(--ef-green)" },
                { label: "Pending",   count: 1, color: "var(--ef-brand)" },
                { label: "Remaining", count: 5, color: "var(--muted-foreground)" },
              ].map(i => (
                <div key={i.label} className="flex items-center gap-1.5">
                  <div className="size-2 rounded-full" style={{ background: i.color }} />
                  <span className="text-[11px] text-muted-foreground">
                    {i.label}: <strong className="text-foreground">{i.count}</strong>
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Substitution Records Table ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <CardTitle className="text-base font-semibold">Substitution Records</CardTitle>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="min-w-[140px]">
                  <span className="flex items-center gap-2">
                    <Filter size={13} />
                    <SelectValue placeholder="All Status" />
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Declined">Declined</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="text-sm">
            <caption className="sr-only">Proxy duty history</caption>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                {PROXY_COLUMNS.map(col => (
                  <SortableHead
                    key={col.field}
                    field={col.field}
                    label={col.label}
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    className="text-xs"
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No proxy records found for this filter.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map(r => {
                  const conf = STATUS_CONFIG[r.status]
                  const Icon = conf.icon
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="text-sm font-medium text-foreground">{r.date}</div>
                      </TableCell>
                      <TableCell>
                        <div className="size-8 rounded-lg bg-ef-brand-light text-primary inline-flex items-center justify-center text-xs font-bold">{r.period}</div>
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold text-foreground">{r.class}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0" aria-hidden="true">{r.absentTeacher.charAt(0)}</div>
                          <span className="text-sm text-foreground">{r.absentTeacher}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.subject}</TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {r.duration !== "—" ? (
                          <span className="flex items-center gap-1">
                            <Clock size={11} className="text-ef-green" /> {r.duration}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={conf.variant}>
                          <Icon size={10} />
                          {r.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/40 text-xs text-muted-foreground">
            <span>Showing {filtered.length} of {PROXY_HISTORY.length} records</span>
            <span className="flex items-center gap-1.5">
              <Clock size={12} />
              Total: <strong className="text-foreground">{totalMinutes} min</strong> teaching time as proxy
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
