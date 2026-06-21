"use client"
import Link from "next/link"
import {
  BarChart3, TrendingUp, CreditCard, AlertTriangle, School, ArrowRight,
  Building2, IndianRupee, Activity, Zap, Users, CheckCircle2,
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
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"

const SCHOOLS = [
  { id: "sch-1",  name: "Holy Child English Academy", location: "Howly, Assam",   plan: "annual",      mrr: 15000, status: "active",  health: 87, teachers: 10, students: 240 },
  { id: "sch-2",  name: "Delhi Public School",         location: "New Delhi",       plan: "annual",      mrr: 45000, status: "active",  health: 92, teachers: 42, students: 820 },
  { id: "sch-3",  name: "St. Xavier's High School",    location: "Kolkata, WB",     plan: "quarterly",   mrr: 9000,  status: "active",  health: 78, teachers: 18, students: 360 },
  { id: "sch-4",  name: "Kendriya Vidyalaya No. 2",    location: "Guwahati, Assam", plan: "monthly",     mrr: 999,   status: "trial",   health: 45, teachers: 12, students: 290 },
  { id: "sch-5",  name: "Carmel Convent School",       location: "Bhopal, MP",      plan: "half-yearly", mrr: 9998,  status: "active",  health: 81, teachers: 22, students: 480 },
]

const MRR_TREND = [
  { month: "Jan", mrr: 92,  newMrr: 18, churn: 3.2 },
  { month: "Feb", mrr: 98,  newMrr: 22, churn: 4.8 },
  { month: "Mar", mrr: 105, newMrr: 19, churn: 2.5 },
  { month: "Apr", mrr: 118, newMrr: 24, churn: 3.8 },
  { month: "May", mrr: 125, newMrr: 17, churn: 2.2 },
  { month: "Jun", mrr: 132, newMrr: 15, churn: 1.9 },
]

const PLAN_DIST = [
  { name: "Annual",      value: 2,  color: "var(--ef-brand)" },
  { name: "Half-Yearly", value: 1,  color: "var(--ef-green)" },
  { name: "Quarterly",   value: 1,  color: "var(--ef-amber)" },
  { name: "Trial",       value: 1,  color: "var(--ef-red)" },
]

const PLATFORM_HEALTH = [
  { service: "API Gateway",      status: "healthy", uptime: 99.9 },
  { service: "Auth Service",     status: "healthy", uptime: 100  },
  { service: "DB (PostgreSQL)",  status: "healthy", uptime: 99.8 },
  { service: "Storage (S3)",     status: "healthy", uptime: 100  },
  { service: "Email (Postmark)", status: "degraded", uptime: 98.2 },
  { service: "SMS Gateway",      status: "healthy", uptime: 99.5 },
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
          <span className="font-bold">{typeof p.value === "number" && p.name === "MRR (₹K)" ? `₹${p.value}K` : p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function SaaSOverviewPage() {
  const totalMRR = 132000
  const activeCount = SCHOOLS.filter(s => s.status === "active").length

  const { sorted: sortedSchools, sortField, sortDir, toggleSort } = useTableSort(SCHOOLS, {
    school: s => s.name,
    plan: s => s.plan,
    mrr: s => s.mrr,
    health: s => s.health,
    teachers: s => s.teachers,
    status: s => s.status,
  }, { field: "mrr", dir: "desc" })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      {/* Hero banner */}
      <Card className="border-0 text-white bg-gradient-to-br from-[#4147D5] to-[#007AFF]">
        <CardContent className="p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm opacity-75 mb-1 flex items-center gap-2"><Zap className="size-3.5" /> EduFlow Platform · June 2026</p>
            <h2 className="text-2xl font-extrabold">Platform Overview</h2>
            <p className="text-sm opacity-75 mt-0.5">12 active tenants · ₹1,32,000 MRR · 68% trial conversion</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link href="/super-admin/analytics">Deep Analytics <ArrowRight className="size-3" /></Link>
            </Button>
            <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10" asChild>
              <Link href="/super-admin/tenants">Manage Tenants</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <PageHeader
        icon={<BarChart3 size={22} />}
        title="SaaS Overview"
        subtitle="EduFlow platform metrics — real-time"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="MRR"
          value={`₹${(totalMRR/1000).toFixed(0)}K`}
          subtitle="+9.1% vs last month"
          icon={<IndianRupee className="size-5" />}
          trend={{ value: 9, label: "MoM" }}
          sparkline={{ variant: "line", data: MRR_TREND.map(m => m.mrr) }}
        />
        <KpiCard
          title="ARR"
          value={`₹${(totalMRR * 12 / 100000).toFixed(1)}L`}
          subtitle="annualised"
          icon={<TrendingUp className="size-5" />}
          iconClassName="bg-success/20 text-success-foreground"
          sparkline={{ variant: "line", data: MRR_TREND.map(m => m.mrr * 12 / 1000), color: "var(--ef-green)" }}
        />
        <KpiCard
          title="Active Schools"
          value={activeCount}
          subtitle={`of ${SCHOOLS.length} total`}
          icon={<Building2 className="size-5" />}
          iconClassName="bg-primary/10 text-primary"
          trend={{ value: 8 }}
          sparkline={{ variant: "bar", data: [6,7,8,8,9,activeCount] }}
        />
        <KpiCard
          title="Churn Risk"
          value={1}
          subtitle="school at risk"
          icon={<AlertTriangle className="size-5" />}
          iconClassName="bg-destructive/10 text-destructive"
          sparkline={{ variant: "bar", data: [2,1,2,1,0,1], color: "var(--ef-red)" }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" /> MRR Trend (₹K)
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={MRR_TREND} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}K`} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="mrr" name="MRR (₹K)" stroke="var(--ef-brand)" strokeWidth={2.5} dot={{ r: 4, fill: "var(--ef-brand)", strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-border">
              <div className="bg-success rounded-lg px-3.5 py-2.5">
                <div className="text-[10px] font-semibold text-success-foreground uppercase">New MRR Jun</div>
                <div className="text-base font-extrabold text-success-foreground">+₹15K</div>
              </div>
              <div className="bg-destructive/10 rounded-lg px-3.5 py-2.5">
                <div className="text-[10px] font-semibold text-destructive uppercase">Churned Jun</div>
                <div className="text-base font-extrabold text-destructive">−₹1.9K</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Plan Distribution</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={120} height={120}>
                <PieChart>
                  <Pie data={PLAN_DIST} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" strokeWidth={2} stroke="var(--card)">
                    {PLAN_DIST.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2.5">
                {[
                  { plan: "Annual",      count: 2, mrr: 60000, pct: 45, color: "var(--ef-brand)" },
                  { plan: "Half-Yearly", count: 1, mrr: 9998,  pct: 8,  color: "var(--ef-green)" },
                  { plan: "Quarterly",   count: 1, mrr: 9000,  pct: 7,  color: "var(--ef-amber)" },
                  { plan: "Trial",       count: 1, mrr: 0,     pct: 0,  color: "var(--ef-red)" },
                ].map(item => (
                  <div key={item.plan} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5"><span className="size-2 rounded-full" style={{ background: item.color }} />{item.plan}</span>
                      <span className="text-muted-foreground">{item.count} schools</span>
                    </div>
                    <Progress value={item.pct === 0 ? 5 : item.pct} className="h-1.5" style={{ "--progress-color": item.color } as React.CSSProperties} />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform health */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Activity className="size-4 text-primary" /> Platform Health
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PLATFORM_HEALTH.map(s => (
              <div key={s.service} className={`rounded-lg p-3 border ${s.status === "healthy" ? "border-success-foreground/20 bg-success" : "border-warning-foreground/20 bg-warning"}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold">{s.service}</span>
                  <span className={`size-1.5 rounded-full ${s.status === "healthy" ? "bg-[var(--ef-green)]" : "bg-[var(--ef-amber)]"}`} aria-hidden="true" />
                </div>
                <div className={`text-[11px] font-medium ${s.status === "healthy" ? "text-success-foreground" : "text-warning-foreground"}`}>
                  {s.uptime}% uptime
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* School list */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <School className="size-4 text-primary" /> Active Schools
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge>{SCHOOLS.length} total</Badge>
            <Button variant="ghost" size="sm" asChild><Link href="/super-admin/tenants">View All <ArrowRight className="size-3" /></Link></Button>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 overflow-x-auto">
          <Table className="text-sm">
            <caption className="sr-only">All tenant schools overview</caption>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                <SortableHead field="school" label="School" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-left text-xs font-medium text-muted-foreground px-6 py-3 h-auto" />
                <SortableHead field="plan" label="Plan" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 h-auto" />
                <SortableHead field="mrr" label="MRR" align="right" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-right text-xs font-medium text-muted-foreground px-4 py-3 h-auto" />
                <SortableHead field="health" label="Health" align="center" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-center text-xs font-medium text-muted-foreground px-4 py-3 h-auto" />
                <SortableHead field="teachers" label="Staff" align="right" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-right text-xs font-medium text-muted-foreground px-4 py-3 h-auto" />
                <SortableHead field="status" label="Status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-left text-xs font-medium text-muted-foreground px-4 py-3 h-auto" />
                <TableHead className="text-right text-xs font-medium text-muted-foreground px-6 py-3 h-auto">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSchools.map(school => (
                <TableRow key={school.id} className="hover:bg-muted/20 transition-colors">
                  <TableCell className="px-6 py-3">
                    <p className="font-medium text-sm">{school.name}</p>
                    <p className="text-xs text-muted-foreground">{school.location}</p>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="outline" className="capitalize text-xs">{school.plan}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right font-semibold text-sm">
                    {school.mrr > 0 ? `₹${school.mrr.toLocaleString("en-IN")}` : <span className="text-muted-foreground">Trial</span>}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden" role="img" aria-label={`Health score ${school.health} percent`}>
                        <div className={`h-full rounded-full ${school.health >= 80 ? "bg-[var(--ef-green)]" : school.health >= 60 ? "bg-[var(--ef-amber)]" : "bg-destructive"}`} style={{ width: `${school.health}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${school.health >= 80 ? "text-success-foreground" : school.health >= 60 ? "text-warning-foreground" : "text-destructive"}`}>{school.health}</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right text-xs text-muted-foreground">
                    <div className="flex items-center justify-end gap-1"><Users className="size-3" aria-hidden="true" />{school.teachers}</div>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant={school.status === "active" ? "success" : "warning"} className="capitalize">{school.status}</Badge>
                  </TableCell>
                  <TableCell className="px-6 py-3 text-right">
                    <Button size="xs" variant="ghost">Impersonate</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
