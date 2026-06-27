"use client"
import { useState } from "react"
import Link from "next/link"
import {
  AlertTriangle, CheckCircle2, Clock, Users, TrendingUp, Zap,
  UserX, Calendar, ArrowRight, Bell, RefreshCw, Printer,
  Edit2, Eye, Search as SearchIcon,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { BirthdayCard } from "@/components/shared/birthday-card"
import { MiniSparkline } from "@/components/shared/mini-sparkline"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { absenceStatusConfig } from "@/lib/status-badges"
import { CountdownTimer } from "@/components/shared/countdown-timer"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import { WeatherGreeting } from "@/components/shared/weather-greeting"

const STAT_DATE = "Thursday, 5 June 2026"

const UNCOVERED_PERIODS = [
  { period: "P4", time: "11:30–12:10", class: "VIII-B", subject: "Physics", absent: "Dipak Baruah" },
  { period: "P5", time: "12:30–1:10",  class: "IX-A",   subject: "Art",     absent: "Rima Das" },
]

const COVERED_PERIODS = [
  { period: "P1", time: "9:30–10:10",  class: "VII-A",  subject: "English", proxy: "Priya Sharma" },
  { period: "P2", time: "10:10–10:50", class: "VIII-A", subject: "English", proxy: "Meena Gogoi" },
  { period: "P3", time: "10:50–11:30", class: "IX-A",   subject: "English", proxy: "Rajesh Kalita" },
  { period: "P6", time: "1:10–1:50",   class: "VII-B",  subject: "Art",     proxy: "Himanta Bezbaruah" },
  { period: "P7", time: "1:50–2:30",   class: "X-A",    subject: "Physics", proxy: "Sunita Borah" },
]

const PENDING_SWAPS    = 2
const PENDING_ABSENCES = 1

const MGMT_SPARKS = {
  absent:   [1, 2, 1, 3, 2, 2, 3],
  filled:   [4, 5, 6, 5, 7, 6, 5],
  gaps:     [3, 2, 2, 3, 1, 2, 2],
  coverage: [58, 65, 71, 68, 75, 71, 71],
}

const COVERAGE_TREND = [
  { day: "Mon",   coverage: 58 },
  { day: "Tue",   coverage: 65 },
  { day: "Wed",   coverage: 71 },
  { day: "Thu",   coverage: 68 },
  { day: "Fri",   coverage: 75 },
  { day: "Sat",   coverage: 71 },
  { day: "Today", coverage: 71 },
]

const AI_SUGGESTIONS = [
  { teacher: "Meena Gogoi",       period: "P4 VIII-B", score: 13, reason: "Same dept + free period" },
  { teacher: "Himanta Bezbaruah", period: "P4 VIII-B", score: 9,  reason: "Free period, low load" },
  { teacher: "Sunita Borah",      period: "P5 IX-A",   score: 11, reason: "Lowest weekly proxy count" },
]

type AbsentStatus = "approved" | "pending"
const ABSENT_TEACHERS: {
  name: string; id: string; subject: string; sections: string; type: string;
  periods: string; reason: string; status: AbsentStatus; coverage: number; cap: string;
}[] = [
  { name: "Anita Devi",   id: "T003", subject: "English", sections: "VII-A, VIII-A", type: "Full-time", periods: "P1–P7",          reason: "Sick Leave",       status: "approved", coverage: 100, cap: "3/3" },
  { name: "Dipak Baruah", id: "T006", subject: "Physics", sections: "IX-A, X-A",     type: "Full-time", periods: "P1, P2, P3",     reason: "Doctor Visit",     status: "approved", coverage: 67,  cap: "2/3" },
  { name: "Rima Das",     id: "T009", subject: "Art",     sections: "VI-B, VII-B",   type: "Part-time", periods: "P1, P5, P6, P7", reason: "Family Emergency", status: "pending",  coverage: 25,  cap: "1/2" },
]

const maxCoverage = 100

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("")
}

export default function ManagementDashboardPage() {
  const [periodFilter, setPeriodFilter] = useState(0)
  const [absentSearch, setAbsentSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filteredAbsent = ABSENT_TEACHERS
    .filter(t => {
      const matchSearch = t.name.toLowerCase().includes(absentSearch.toLowerCase()) ||
        t.subject.toLowerCase().includes(absentSearch.toLowerCase())
      const matchStatus = statusFilter === "all" || t.status === statusFilter
      return matchSearch && matchStatus
    })

  const { sorted: sortedAbsent, sortField, sortDir, toggleSort } = useTableSort(filteredAbsent, {
    name:     t => t.name,
    subject:  t => t.subject,
    type:     t => t.type,
    status:   t => t.status,
    coverage: t => t.coverage,
  })

  const filteredCovered = periodFilter === 0 ? COVERED_PERIODS
    : periodFilter === 1 ? COVERED_PERIODS.filter(p => ["P1", "P2", "P3", "P4"].includes(p.period))
    : COVERED_PERIODS.filter(p => ["P5", "P6", "P7"].includes(p.period))

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <WeatherGreeting />

      <PageHeader
        icon={<Clock size={20} />}
        title="Morning Briefing"
        subtitle={`${STAT_DATE} · Holy Child English Academy`}
        actions={
          <div className="flex items-center gap-2">
            {PENDING_ABSENCES > 0 && (
              <Button variant="secondary" size="sm" className="relative" asChild>
                <Link href="/management/absences">
                  <Bell className="size-4" /> Pending Approvals
                  <span className="absolute -top-1.5 -right-1.5 size-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center">{PENDING_ABSENCES}</span>
                </Link>
              </Button>
            )}
            <Button variant="outline" size="sm"><Printer className="size-4" /> Print Sheet</Button>
            <Button variant="outline" size="sm"><RefreshCw className="size-4" /> Refresh</Button>
          </div>
        }
      />

      <BirthdayCard />

      {/* Period Countdown Banner */}
      <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-destructive bg-ef-red-light">
        <div className="relative flex items-center justify-center shrink-0">
          <span className="absolute size-8 rounded-full bg-destructive opacity-25 animate-ping" />
          <span className="relative flex items-center justify-center size-7 rounded-full bg-destructive">
            <Clock className="size-3.5 text-white" />
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <CountdownTimer label="Next period in" className="[&_p:first-child]:text-destructive [&_p.text-2xl]:text-destructive" />
          <div className="text-xs text-ef-red-dark/80 mt-1">2 gaps still uncovered — assign proxies now</div>
        </div>
        <Button variant="destructive" size="sm" className="shrink-0"><Zap className="size-4" /> Auto-Assign All</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard title="Absent Today" value="3" subtitle="+1 vs yesterday" icon={<UserX className="size-5" />} iconClassName="bg-destructive/10 text-destructive" sparkline={{ variant: "bar", data: MGMT_SPARKS.absent, color: "var(--ef-red)" }} />
        <KpiCard title="Proxy Filled" value="5 / 7" subtitle="71% fill rate" icon={<CheckCircle2 className="size-5" />} iconClassName="bg-success/20 text-success-foreground" sparkline={{ variant: "bar", data: MGMT_SPARKS.filled, color: "var(--ef-green)" }} />
        <KpiCard title="Open Gaps" value="2" subtitle="Needs action" icon={<AlertTriangle className="size-5" />} iconClassName="bg-warning/20 text-warning-foreground" sparkline={{ variant: "bar", data: MGMT_SPARKS.gaps, color: "var(--ef-amber)" }} />
        <KpiCard title="Coverage %" value="71%" subtitle="−14% vs target" icon={<TrendingUp className="size-5" />} sparkline={{ variant: "line", data: MGMT_SPARKS.coverage }} />
      </div>

      {/* Coverage Trend Chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" /> 7-Day Coverage Trend
          </CardTitle>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="inline-block size-3 rounded bg-primary" /> Today</span>
            <span className="flex items-center gap-1"><span className="inline-block size-3 rounded bg-ef-brand-light border border-primary/40" /> Previous days</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1.5 h-24 w-full pt-2">
            {COVERAGE_TREND.map(d => {
              const h = Math.round((d.coverage / maxCoverage) * 100)
              const isToday = d.day === "Today"
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={isToday ? "w-full rounded-t-md bg-primary" : "w-full rounded-t-md bg-ef-brand-light border border-primary/40"}
                    style={{ height: `${h}%`, minHeight: 4 }}
                    title={`${d.day}: ${d.coverage}% coverage`}
                  />
                  <span className="text-[9px] font-semibold text-muted-foreground truncate w-full text-center">{d.day}</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
            <div className="flex gap-6">
              {[
                { label: "Weekly Avg", value: "68%", className: "text-primary" },
                { label: "Best Day",   value: "75%", className: "text-ef-green" },
                { label: "Worst Day",  value: "58%", className: "text-destructive" },
              ].map(stat => (
                <div key={stat.label} className="text-center">
                  <div className={`text-lg font-black ${stat.className}`}>{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold">{stat.label}</div>
                </div>
              ))}
            </div>
            <MiniSparkline variant="line" data={MGMT_SPARKS.coverage} width={120} height={40} />
          </div>
        </CardContent>
      </Card>

      {/* Uncovered + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="size-4" /> Uncovered Periods
            </CardTitle>
            <Badge variant="destructive">● 2 open</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {UNCOVERED_PERIODS.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-4 border-b border-border last:border-b-0 bg-ef-red-light">
                <div className="size-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 bg-destructive">{p.period}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{p.class} · {p.subject}</div>
                  <div className="text-xs text-muted-foreground font-mono">{p.time}</div>
                  <div className="text-xs text-destructive mt-0.5">Absent: {p.absent}</div>
                </div>
                <Button size="xs" className="shrink-0"><Zap className="size-3" /> Assign</Button>
              </div>
            ))}
            <div className="p-4 flex items-center justify-between border-t border-border">
              <span className="text-xs text-muted-foreground">2 gaps need immediate attention</span>
              <Button size="sm"><Zap className="size-3" /> Auto-Assign All</Button>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><Zap className="size-4 text-primary" /> Quick Actions</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button className="w-full justify-center"><Zap className="size-4" /> Auto-Assign All Open Periods</Button>
              <div className="flex gap-3">
                <Button variant="secondary" size="sm" className="flex-1" asChild><Link href="/management/absences"><UserX className="size-4" /> Mark Absence</Link></Button>
                <Button variant="secondary" size="sm" className="flex-1" asChild><Link href="/management/timetable"><Calendar className="size-4" /> View Timetable</Link></Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold flex items-center gap-2"><Clock className="size-4 text-primary" /> Pending Items</CardTitle></CardHeader>
            <CardContent className="p-0">
              {[
                { label: "Absence Approvals", count: PENDING_ABSENCES, href: "/management/absences", icon: UserX,     iconClass: "bg-ef-red-light text-ef-red",     variant: "destructive" as const },
                { label: "Swap Requests",     count: PENDING_SWAPS,    href: "/management/swaps",    icon: RefreshCw, iconClass: "bg-ef-amber-light text-ef-amber", variant: "warning" as const },
              ].map((item, i) => (
                <Link key={i} href={item.href} className="flex items-center gap-3 p-4 border-b border-border last:border-b-0 hover:bg-muted/30">
                  <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${item.iconClass}`}><item.icon className="size-3.5" /></div>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <Badge variant={item.variant}>● {item.count} pending</Badge>
                  <ArrowRight className="size-3.5 text-muted-foreground/70" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Covered + AI Suggestions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-success-foreground">
              <CheckCircle2 className="size-4" /> Covered Periods
            </CardTitle>
            <div className="flex gap-2">
              {["Today", "P1–P4", "P5–P7"].map((seg, i) => (
                <button
                  key={seg}
                  onClick={() => setPeriodFilter(i)}
                  className={`px-3 h-7 rounded-lg text-xs font-semibold border transition-colors ${periodFilter === i ? "border-primary text-primary bg-ef-brand-light" : "border-border text-muted-foreground"}`}
                >
                  {seg}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCovered.map((p, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border-b border-border last:border-b-0">
                <div className="size-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 bg-success text-success-foreground">{p.period}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{p.class} · {p.subject}</div>
                  <div className="text-xs font-mono text-muted-foreground">{p.time}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-medium text-success-foreground">→ {p.proxy}</div>
                  <Badge variant="success">Covered</Badge>
                </div>
              </div>
            ))}
            <div className="p-4 border-t border-border">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Fill rate</span>
                <span className="text-xs font-bold text-success-foreground">71%</span>
              </div>
              <Progress value={71} className="h-1.5 [&>div]:bg-ef-green" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Zap className="size-4 text-ef-purple" /> AI Proxy Suggestions
            </CardTitle>
            <Badge className="bg-ef-purple text-white hover:bg-ef-purple/80">Smart</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {AI_SUGGESTIONS.map((s, i) => (
              <div key={i} className={`flex items-center gap-3 p-4 border-b border-border last:border-b-0 ${i === 0 ? "bg-ef-purple-light" : ""}`}>
                <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">{s.teacher.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm">{s.teacher}</div>
                  <div className="text-xs text-muted-foreground">{s.period} · {s.reason}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`text-xl font-black ${i === 0 ? "text-ef-purple" : "text-foreground"}`}>{s.score}</div>
                  <div className="text-[10px] text-muted-foreground">score</div>
                </div>
                {i === 0 && <Button size="sm" className="shrink-0">Confirm</Button>}
              </div>
            ))}
            <div className="p-4 border-t border-border">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-xs font-semibold text-muted-foreground">Score basis:</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="inline-block size-2 rounded-full bg-ef-green" aria-hidden="true" /> Same subject +10</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="inline-block size-2 rounded-full bg-primary" aria-hidden="true" /> Free period +3</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground"><span className="inline-block size-2 rounded-full bg-ef-amber" aria-hidden="true" /> Lowest load +3</span>
              </div>
              <div className="flex justify-end mt-2">
                <Button variant="ghost" size="sm" asChild><Link href="/management/proxy">View proxy board <ArrowRight className="size-3" /></Link></Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Absent Teachers Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="size-4" /> Absent Teachers — Today
          </CardTitle>
          <Badge variant="destructive">● 3 absent</Badge>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="flex flex-wrap gap-3 items-center mb-3">
            <div className="relative flex-1 min-w-[220px]">
              <SearchIcon className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={absentSearch} onChange={e => setAbsentSearch(e.target.value)} placeholder="Search teachers…" className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm"><Printer className="size-4" /> Export</Button>
          </div>

          <div className="rounded-lg border border-border overflow-hidden overflow-x-auto">
            <Table className="text-sm">
              <caption className="sr-only">Absent teachers with proxy coverage status</caption>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-transparent">
                  <SortableHead field="name" label="Teacher" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-4 py-2.5 text-xs font-medium text-muted-foreground" />
                  <SortableHead field="subject" label="Subject" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-4 py-2.5 text-xs font-medium text-muted-foreground" />
                  <TableHead className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground h-auto">Sections</TableHead>
                  <TableHead className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground h-auto">Periods Absent</TableHead>
                  <TableHead className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground h-auto">Reason</TableHead>
                  <SortableHead field="type" label="Type" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-4 py-2.5 text-xs font-medium text-muted-foreground" />
                  <SortableHead field="status" label="Approval" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-4 py-2.5 text-xs font-medium text-muted-foreground" />
                  <SortableHead field="coverage" label="Coverage" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-4 py-2.5 text-xs font-medium text-muted-foreground" />
                  <TableHead className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground h-auto">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAbsent.length === 0 ? (
                  <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground/70 text-sm">No teachers match your filter.</TableCell></TableRow>
                ) : sortedAbsent.map((t, i) => {
                  const sc = absenceStatusConfig[t.status]
                  return (
                    <TableRow key={i} className="hover:bg-muted/30">
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">{initials(t.name)}</div>
                          <div>
                            <div className="font-semibold text-sm">{t.name}</div>
                            <div className="text-[11px] text-muted-foreground/70">{t.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm">{t.subject}</TableCell>
                      <TableCell className="px-4 py-3 text-xs text-muted-foreground">{t.sections}</TableCell>
                      <TableCell className="px-4 py-3 font-mono text-xs">{t.periods}</TableCell>
                      <TableCell className="px-4 py-3 text-sm">{t.reason}</TableCell>
                      <TableCell className="px-4 py-3"><Badge variant="outline">{t.type}</Badge></TableCell>
                      <TableCell className="px-4 py-3"><Badge className={sc.className}>{sc.label}</Badge></TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden" role="img" aria-label={`Coverage ${t.coverage} percent`}>
                            <div className={`h-full rounded-full ${t.coverage >= 80 ? "bg-[var(--ef-green)]" : t.coverage >= 50 ? "bg-[var(--ef-amber)]" : "bg-destructive"}`} style={{ width: `${t.coverage}%` }} />
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono">{t.cap}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon-sm" aria-label={`View ${t.name}`}><Eye className="size-3.5" /></Button>
                          <Button variant="ghost" size="icon-sm" aria-label={`Edit ${t.name}`}><Edit2 className="size-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between px-1 py-3">
            <span className="text-xs text-muted-foreground">Showing {sortedAbsent.length} of {ABSENT_TEACHERS.length} absent teachers</span>
            <Button variant="ghost" size="sm" asChild><Link href="/management/absences">View All Absences <ArrowRight className="size-3" /></Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
