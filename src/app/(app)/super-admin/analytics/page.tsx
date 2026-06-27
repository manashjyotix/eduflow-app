"use client"
import { useState } from "react"
import {
  BarChart3, TrendingUp, Download, IndianRupee, MapPin, Zap,
  ArrowUpRight, ArrowDownRight, Building2, Activity, Target,
  PieChart, RefreshCw, Layers,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"

const MRR_TREND = [
  { month: "Jan", mrr: 65000, newMrr: 18000, churn: 3200 },
  { month: "Feb", mrr: 78000, newMrr: 22000, churn: 9000 },
  { month: "Mar", mrr: 92000, newMrr: 19000, churn: 5000 },
  { month: "Apr", mrr: 108000, newMrr: 24000, churn: 8000 },
  { month: "May", mrr: 121000, newMrr: 17000, churn: 4000 },
  { month: "Jun", mrr: 132000, newMrr: 15000, churn: 4000 },
]

const COHORT_DATA = [
  { cohort: "Jan 2025", size: 3, m1: 100, m2: 100, m3: 100, m6: 67, m12: 67 },
  { cohort: "Apr 2025", size: 2, m1: 100, m2: 100, m3: 100, m6: 100, m12: 100 },
  { cohort: "Jun 2025", size: 4, m1: 100, m2: 75, m3: 75, m6: 75, m12: null },
  { cohort: "Sep 2025", size: 2, m1: 100, m2: 100, m3: 100, m6: null, m12: null },
  { cohort: "Jan 2026", size: 3, m1: 100, m2: 100, m3: null, m6: null, m12: null },
  { cohort: "May 2026", size: 2, m1: 100, m2: null, m3: null, m6: null, m12: null },
]

const FEATURE_ADOPTION = [
  { feature: "Proxy Auto-Assign (AI)", pct: 100, schools: 12, trend: 8 },
  { feature: "Teacher Leave Portal", pct: 92, schools: 11, trend: 4 },
  { feature: "Student Attendance", pct: 83, schools: 10, trend: 12 },
  { feature: "Fee Collection Module", pct: 75, schools: 9, trend: 5 },
  { feature: "Parent Portal", pct: 58, schools: 7, trend: 15 },
  { feature: "Exam Schedule Manager", pct: 50, schools: 6, trend: 8 },
  { feature: "QR Check-in", pct: 25, schools: 3, trend: 25 },
  { feature: "Analytics Dashboard", pct: 100, schools: 12, trend: 0 },
]

const GEO_DATA = [
  { city: "Guwahati", schools: 3, mrr: 19997, pct: 35 },
  { city: "Howly", schools: 1, mrr: 999, pct: 8 },
  { city: "Silchar", schools: 1, mrr: 2499, pct: 8 },
  { city: "Jorhat", schools: 1, mrr: 7499, pct: 10 },
  { city: "Barpeta", schools: 1, mrr: 999, pct: 5 },
  { city: "Nagaon", schools: 1, mrr: 0, pct: 5 },
  { city: "Dibrugarh", schools: 1, mrr: 2499, pct: 8 },
]

const CONVERSION_FUNNEL = [
  { stage: "Demo Requests", value: 48, bar: "bg-primary" },
  { stage: "Trial Started", value: 32, bar: "bg-ef-purple" },
  { stage: "Active Trial", value: 24, bar: "bg-ef-blue" },
  { stage: "Converted (Paid)", value: 17, bar: "bg-ef-green" },
  { stage: "Annual Upgrade", value: 5, bar: "bg-ef-amber" },
]

const DAILY_ACTIVITY = [
  { day: "Mon", sessions: 87, absences: 12, proxies: 28 },
  { day: "Tue", sessions: 91, absences: 9, proxies: 23 },
  { day: "Wed", sessions: 95, absences: 14, proxies: 31 },
  { day: "Thu", sessions: 88, absences: 11, proxies: 26 },
  { day: "Fri", sessions: 76, absences: 8, proxies: 18 },
  { day: "Sat", sessions: 12, absences: 1, proxies: 2 },
  { day: "Sun", sessions: 5, absences: 0, proxies: 0 },
]

const PLAN_REVENUE = [
  { plan: "Annual", schools: 2, mrr: 16498, pct: 69, dot: "bg-primary" },
  { plan: "Quarterly", schools: 3, mrr: 7497, pct: 20, dot: "bg-ef-purple" },
  { plan: "Starter", schools: 5, mrr: 4995, pct: 10, dot: "bg-ef-blue" },
  { plan: "Trial", schools: 2, mrr: 0, pct: 0, dot: "bg-ef-amber" },
]

function CohortCell({ value }: { value: number | null }) {
  if (value === null)
    return <TableCell className="px-4 py-2 text-center text-xs bg-muted text-muted-foreground/70">—</TableCell>
  const cls =
    value >= 70 ? "bg-ef-green-light text-ef-green-dark"
    : value >= 50 ? "bg-ef-amber-light text-ef-amber-dark"
    : "bg-ef-red-light text-ef-red-dark"
  return <TableCell className={`px-4 py-2 text-center text-xs font-bold ${cls}`}>{value}%</TableCell>
}

export default function PlatformAnalyticsPage() {
  const [period, setPeriod] = useState("6m")
  const maxMRR = Math.max(...MRR_TREND.map(m => m.mrr))
  const maxSessions = Math.max(...DAILY_ACTIVITY.map(d => d.sessions))
  const last = MRR_TREND[MRR_TREND.length - 1]

  const { sorted: sortedCohorts, sortField: cohortSortField, sortDir: cohortSortDir, toggleSort: cohortToggleSort } = useTableSort(COHORT_DATA, {
    cohort: c => c.cohort,
    size: c => c.size,
  })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<BarChart3 size={20} />}
        title="Analytics"
        subtitle="Deep insights — MRR, cohorts, feature adoption, geography, funnels"
        actions={
          <div className="flex items-center gap-2">
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="min-w-[140px] h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Last 1 Month</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last 1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" size="sm"><RefreshCw className="size-4" /> Refresh</Button>
            <Button size="sm"><Download className="size-4" /> Export PDF</Button>
          </div>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard title="MRR" value="₹1,32,000" subtitle="+9.1% vs last month" icon={<IndianRupee className="size-5" />} sparkline={{ variant: "line", data: [65, 78, 92, 108, 121, 132] }} />
        <KpiCard title="Paying Schools" value="10" subtitle="+2 MoM" icon={<Building2 className="size-5" />} iconClassName="bg-ef-green-light text-ef-green" sparkline={{ variant: "bar", data: [6, 7, 8, 8, 9, 10], color: "var(--ef-green)" }} />
        <KpiCard title="Trial Conversion" value="68%" subtitle="+4% vs last month" icon={<Target className="size-5" />} iconClassName="bg-ef-purple-light text-ef-purple" sparkline={{ variant: "line", data: [52, 55, 60, 62, 64, 68], color: "var(--ef-purple)" }} />
        <KpiCard title="Churn Rate" value="2.1%" subtitle="−0.4% vs last month" icon={<Activity className="size-5" />} iconClassName="bg-ef-amber-light text-ef-amber" sparkline={{ variant: "line", data: [3.2, 2.9, 2.6, 2.5, 2.5, 2.1], color: "var(--ef-amber)" }} />
      </div>

      {/* MRR Trend + Weekly Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><TrendingUp className="size-4 text-primary" /> MRR Trend</CardTitle>
            <Badge variant="success">● Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {MRR_TREND.map((m, i) => {
                const h = Math.round((m.mrr / maxMRR) * 130)
                const isLast = i === MRR_TREND.length - 1
                return (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] font-semibold text-muted-foreground/70">₹{m.mrr >= 100000 ? `${(m.mrr / 100000).toFixed(0)}L` : `${(m.mrr / 1000).toFixed(0)}K`}</span>
                    <div className={isLast ? "w-full rounded-t-md bg-primary" : "w-full rounded-t-md bg-ef-brand-light border-[1.5px] border-primary"} style={{ height: h, minHeight: 4 }} />
                    <span className="text-[10px] font-medium text-muted-foreground">{m.month}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="bg-ef-green-light rounded-lg px-4 py-2">
                <div className="text-[11px] font-semibold uppercase text-ef-green-dark">New MRR</div>
                <div className="text-lg font-extrabold text-ef-green-dark">+₹{(last.newMrr / 1000).toFixed(0)}K</div>
              </div>
              <div className="bg-ef-red-light rounded-lg px-4 py-2">
                <div className="text-[11px] font-semibold uppercase text-ef-red-dark">Churned</div>
                <div className="text-lg font-extrabold text-ef-red">−₹{(last.churn / 1000).toFixed(0)}K</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><Activity className="size-4 text-primary" /> Weekly Platform Activity</CardTitle>
            <Badge variant="secondary">This Week</Badge>
          </CardHeader>
          <CardContent>
            {DAILY_ACTIVITY.map(d => {
              const sessionPct = Math.round((d.sessions / maxSessions) * 100)
              return (
                <div key={d.day} className="flex items-center gap-3 mb-2.5">
                  <div className="w-8 text-xs font-semibold text-muted-foreground">{d.day}</div>
                  <div className="flex-1 h-[18px] rounded bg-muted overflow-hidden">
                    <div className="h-full rounded bg-primary" style={{ width: `${sessionPct}%`, minWidth: 2 }} title={`${d.sessions} sessions`} />
                  </div>
                  <div className="text-[11px] text-muted-foreground/70 min-w-[80px] text-right">{d.sessions} sessions · {d.proxies} proxy</div>
                </div>
              )
            })}
            <div className="mt-3.5 flex gap-4 text-[11px] text-muted-foreground/70">
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-primary inline-block" /> Sessions</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel + Geo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><Layers className="size-4 text-primary" /> Acquisition Funnel</CardTitle>
            <Badge>June 2026</Badge>
          </CardHeader>
          <CardContent>
            {CONVERSION_FUNNEL.map((f, i) => {
              const pct = Math.round((f.value / CONVERSION_FUNNEL[0].value) * 100)
              return (
                <div key={f.stage} className="mb-3.5">
                  <div className="flex justify-between mb-1.5 text-sm">
                    <span className="font-medium">{f.stage}</span>
                    <div className="flex gap-3 items-center">
                      <span className="font-mono font-bold">{f.value}</span>
                      <span className="text-[11px] text-muted-foreground/70">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full rounded-full ${f.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            <div className="mt-4 px-4 py-2 bg-ef-green-light rounded-lg">
              <div className="text-xs font-semibold text-ef-green-dark">Overall Conversion Rate</div>
              <div className="text-2xl font-extrabold text-ef-green-dark">35.4%</div>
              <div className="text-[11px] text-muted-foreground/70">Demo → Paid (last 6 months)</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><MapPin className="size-4 text-primary" /> Geographic Distribution</CardTitle>
            <Badge>Assam</Badge>
          </CardHeader>
          <CardContent>
            {GEO_DATA.map(g => (
              <div key={g.city} className="flex items-center gap-3 mb-3">
                <div className="size-8 rounded-lg bg-ef-brand-light text-primary flex items-center justify-center flex-shrink-0"><MapPin className="size-3.5" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-semibold">{g.city}</span>
                    <span className="text-xs text-muted-foreground">{g.schools} school{g.schools > 1 ? "s" : ""} · {g.mrr > 0 ? `₹${g.mrr.toLocaleString("en-IN")}/mo` : "Trial"}</span>
                  </div>
                  <Progress value={g.pct} className="h-1.5" />
                </div>
              </div>
            ))}
            <div className="mt-4 px-4 py-2 bg-ef-brand-light rounded-lg text-xs text-primary">
              <strong>9 cities covered</strong> across Assam. Next expansion target: Tezpur, Nagaon.
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Adoption */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><Zap className="size-4 text-primary" /> Feature Adoption Across All Schools</CardTitle>
          <div className="flex gap-1.5">
            <Badge>12 schools</Badge>
            <Button variant="secondary" size="sm"><Download className="size-3.5" /> Export</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...FEATURE_ADOPTION].sort((a, b) => b.pct - a.pct).map(f => (
              <div key={f.feature} className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{f.feature}</span>
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-muted-foreground/70">{f.schools}/12</span>
                    <span className="text-xs font-bold">{f.pct}%</span>
                    {f.trend !== 0 && (
                      <span className={`text-[11px] flex items-center gap-0.5 ${f.trend > 0 ? "text-ef-green-dark" : "text-ef-red"}`}>
                        {f.trend > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}{Math.abs(f.trend)}%
                      </span>
                    )}
                  </div>
                </div>
                <Progress value={f.pct} className={`h-1.5 ${f.pct === 100 ? "[&>div]:bg-ef-green" : f.pct >= 70 ? "" : f.pct >= 50 ? "[&>div]:bg-ef-amber" : "[&>div]:bg-destructive"}`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cohort Retention */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><PieChart className="size-4 text-primary" /> Cohort Retention</CardTitle>
          <div className="flex gap-1.5">
            <Badge variant="success">Schools</Badge>
            <Button variant="secondary" size="sm"><Download className="size-3.5" /> CSV</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <caption className="sr-only">Cohort retention by month</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <SortableHead field="cohort" label="Cohort" sortField={cohortSortField} sortDir={cohortSortDir} onSort={cohortToggleSort} className="px-4 text-xs" />
                <SortableHead field="size" label="Schools" sortField={cohortSortField} sortDir={cohortSortDir} onSort={cohortToggleSort} className="px-4 text-xs" />
                {["Month 1", "Month 2", "Month 3", "Month 6", "Month 12"].map(h => (
                  <TableHead key={h} className="px-4 text-xs">{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCohorts.map((row, i) => (
                <TableRow key={row.cohort} className={i < COHORT_DATA.length - 1 ? "" : "border-0"}>
                  <TableCell className="px-4 text-sm font-semibold whitespace-nowrap">{row.cohort}</TableCell>
                  <TableCell className="px-4 text-sm font-semibold text-muted-foreground">n={row.size}</TableCell>
                  <CohortCell value={row.m1} />
                  <CohortCell value={row.m2} />
                  <CohortCell value={row.m3} />
                  <CohortCell value={row.m6} />
                  <CohortCell value={row.m12} />
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-ef-green-light inline-block" />≥70%</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-ef-amber-light inline-block" />50–69%</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-ef-red-light inline-block" />{"<50%"}</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-muted inline-block" />N/A</span>
          </div>
        </CardFooter>
      </Card>

      {/* Plan Revenue Breakdown */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Revenue by Plan — June 2026</CardTitle>
          <Badge>₹1,32,000 MRR</Badge>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLAN_REVENUE.map(p => (
              <div key={p.plan} className="bg-muted rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className={`size-2.5 rounded-sm ${p.dot}`} />
                  <span className="text-sm font-bold">{p.plan}</span>
                </div>
                <div className={`text-2xl font-extrabold ${p.mrr > 0 ? "text-foreground" : "text-muted-foreground/70"}`}>{p.mrr > 0 ? `₹${p.mrr.toLocaleString("en-IN")}` : "—"}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{p.schools} schools · {p.pct}% of MRR</div>
                <Progress value={p.pct} className="h-1.5 mt-2.5" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
