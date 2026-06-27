"use client"
import Link from "next/link"
import {
  TrendingUp, AlertTriangle, School, ArrowRight,
  Building2, IndianRupee, Activity, Zap, Users,
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
import { KpiCard } from "@/components/shared/kpi-card"
import { BirthdayCard } from "@/components/shared/birthday-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"


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
  { name: "Annual",      value: 2,  color: "#007AFF" },
  { name: "Half-Yearly", value: 1,  color: "#34C759" },
  { name: "Quarterly",   value: 1,  color: "#FF9500" },
  { name: "Trial",       value: 1,  color: "#FF3B30" },
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
    <div className="rounded-lg border bg-card px-3 py-2 shadow-card text-xs">
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
      {/* Platform Overview banner — light blue WeatherGreeting style */}
      <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5 mb-0.5">
            <Zap className="size-3.5 text-primary" /> EduFlow Platform · June 2026
          </p>
          <p className="text-lg font-bold text-foreground">Platform Overview</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeCount} active tenants · ₹{(totalMRR / 1000).toFixed(0)}K MRR · 68% trial conversion
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href="/super-admin/analytics">Deep Analytics <ArrowRight className="size-3" /></Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/super-admin/tenants">Manage Tenants</Link>
          </Button>
        </div>
      </div>

      <BirthdayCard />


      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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
              <div className="bg-success rounded-lg px-4 py-2">
                <div className="text-[10px] font-semibold text-success-foreground uppercase">New MRR Jun</div>
                <div className="text-base font-extrabold text-success-foreground">+₹15K</div>
              </div>
              <div className="bg-destructive/10 rounded-lg px-4 py-2">
                <div className="text-[10px] font-semibold text-destructive uppercase">Churned Jun</div>
                <div className="text-base font-extrabold text-destructive">−₹1.9K</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Plan distribution — pure SVG donut (recharts Cell breaks with next/dynamic) */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Plan Distribution</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 flex items-center p-5">
            <div className="flex items-center gap-6 w-full">
              {/* SVG Donut Chart */}
              <div className="shrink-0">
                <svg width="140" height="140" viewBox="0 0 140 140">
                  {(() => {
                    const total = PLAN_DIST.reduce((s, d) => s + d.value, 0)
                    const cx = 70, cy = 70, outerR = 62, innerR = 40, gap = 0.03
                    let cumulative = 0
                    return PLAN_DIST.map((d, i) => {
                      const sliceFrac = d.value / total
                      const startAngle = cumulative * 2 * Math.PI - Math.PI / 2 + gap
                      cumulative += sliceFrac
                      const endAngle = cumulative * 2 * Math.PI - Math.PI / 2 - gap
                      const largeArc = endAngle - startAngle > Math.PI ? 1 : 0
                      const x1o = cx + outerR * Math.cos(startAngle)
                      const y1o = cy + outerR * Math.sin(startAngle)
                      const x2o = cx + outerR * Math.cos(endAngle)
                      const y2o = cy + outerR * Math.sin(endAngle)
                      const x2i = cx + innerR * Math.cos(endAngle)
                      const y2i = cy + innerR * Math.sin(endAngle)
                      const x1i = cx + innerR * Math.cos(startAngle)
                      const y1i = cy + innerR * Math.sin(startAngle)
                      const path = [
                        `M ${x1o} ${y1o}`,
                        `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2o} ${y2o}`,
                        `L ${x2i} ${y2i}`,
                        `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x1i} ${y1i}`,
                        `Z`,
                      ].join(' ')
                      return <path key={i} d={path} fill={d.color} />
                    })
                  })()}
                  {/* Center label */}
                  <text x="70" y="66" textAnchor="middle" className="fill-foreground text-xl font-bold">{PLAN_DIST.reduce((s, d) => s + d.value, 0)}</text>
                  <text x="70" y="82" textAnchor="middle" className="fill-muted-foreground text-[10px]">schools</text>
                </svg>
              </div>
              {/* Legend with bars */}
              <div className="flex-1 space-y-3">
                {[
                  { plan: "Annual",      count: 2, pct: 40, color: "#007AFF" },
                  { plan: "Half-Yearly", count: 1, pct: 20, color: "#34C759" },
                  { plan: "Quarterly",   count: 1, pct: 20, color: "#FF9500" },
                  { plan: "Trial",       count: 1, pct: 20, color: "#FF3B30" },
                ].map(item => (
                  <div key={item.plan} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium">
                        <span className="size-2.5 rounded-full" style={{ background: item.color }} />
                        {item.plan}
                      </span>
                      <span className="text-muted-foreground">{item.count} schools</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary/60 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${item.pct}%`, background: item.color }}
                      />
                    </div>
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
