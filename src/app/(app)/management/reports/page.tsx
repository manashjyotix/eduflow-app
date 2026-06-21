"use client"

import { useState } from "react"
import dynamic from "next/dynamic"

// ── Dynamic recharts imports (SSR-safe, code-split) ───────────────────────────
const LineChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.LineChart })),
  { ssr: false }
)
const Line = dynamic(
  () => import("recharts").then((m) => ({ default: m.Line })),
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
import { FileBarChart2, TrendingUp, Activity, Users, AlertOctagon } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { EduBarChart } from "@/components/shared/edu-bar-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"

const PROXY_BY_DAY = [
  { day: "Mon", proxies: 8, covered: 7 },
  { day: "Tue", proxies: 12, covered: 10 },
  { day: "Wed", proxies: 6, covered: 6 },
  { day: "Thu", proxies: 11, covered: 8 },
  { day: "Fri", proxies: 10, covered: 9 },
]

const COVERAGE_TREND = [
  { week: "W1 May", coverage: 72 },
  { week: "W2 May", coverage: 68 },
  { week: "W3 May", coverage: 81 },
  { week: "W4 May", coverage: 75 },
  { week: "W1 Jun", coverage: 78 },
  { week: "W2 Jun", coverage: 83 },
]

const TEACHER_PROXY_STATS = [
  { name: "Priya Sharma",       proxies: 9,  subject: "Mathematics",      status: "On track" },
  { name: "Rajesh Kalita",      proxies: 8,  subject: "English",           status: "On track" },
  { name: "Sunita Borah",       proxies: 7,  subject: "Mathematics",      status: "On track" },
  { name: "Biju Das",           proxies: 7,  subject: "Mathematics",      status: "On track" },
  { name: "Himanta Bezbaruah",  proxies: 6,  subject: "Physical Education", status: "On track" },
  { name: "Meena Gogoi",        proxies: 5,  subject: "Assamese/Hindi",   status: "On track" },
  { name: "Anita Devi",         proxies: 3,  subject: "Science",           status: "On leave" },
  { name: "Dipak Baruah",       proxies: 2,  subject: "English",           status: "On leave" },
]

export default function ProxyCoverageReportPage() {
  const [viewMode, setViewMode] = useState(2) // 0=Daily, 1=Weekly, 2=Monthly

  const { sorted: sortedStats, sortField, sortDir, toggleSort } = useTableSort<
    (typeof TEACHER_PROXY_STATS)[number],
    "name" | "subject" | "proxies" | "status"
  >(TEACHER_PROXY_STATS, {
    name:    t => t.name,
    subject: t => t.subject,
    proxies: t => t.proxies,
    status:  t => t.status,
  }, { field: "proxies", dir: "desc" })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<FileBarChart2 size={20} />}
        title="Proxy Coverage Report"
        subtitle="Coverage analytics and trends — June 2026"
        actions={
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
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Coverage Rate"
          value="78%"
          subtitle="this month"
          icon={<TrendingUp size={18} />}
          iconClassName="bg-success/10 text-success-foreground"
          trend={{ value: 3, label: "vs last month" }}
        />
        <KpiCard
          title="Total Proxies"
          value="47"
          subtitle="this month"
          icon={<Activity size={18} />}
        />
        <KpiCard
          title="Avg per Day"
          value="2.1"
          subtitle="proxy assignments / day"
          icon={<Users size={18} />}
          iconClassName="bg-primary/10 text-primary"
        />
        <KpiCard
          title="Uncovered Periods"
          value="12"
          subtitle="this month"
          icon={<AlertOctagon size={18} />}
          iconClassName="bg-destructive/10 text-destructive"
          trend={{ value: -2, label: "vs last month" }}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proxy Duties — June bar chart (styled like analytics Proxy Coverage Trend) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Proxy Duties — June</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <EduBarChart
              data={PROXY_BY_DAY}
              series={[
                { dataKey: "proxies", name: "Total Proxies", color: "var(--primary)" },
                { dataKey: "covered", name: "Covered",       color: "var(--ef-green)" },
              ]}
              xKey="day"
              height={200}
              tooltipFormatter={(v, name) => `${v} ${name}`}
            />
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2.5 rounded-sm bg-primary inline-block" /> Total Proxies
                </span>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-2.5 rounded-sm bg-ef-green inline-block" /> Covered
                </span>
              </div>
              <span className="text-sm font-extrabold text-foreground">47 duties</span>
            </div>
          </CardContent>
        </Card>

        {/* Line Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Coverage % Trend (Last 6 Weeks)</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={COVERAGE_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} unit="%" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: 12,
                  }}
                  formatter={(v: any) => [`${v}%`, "Coverage"]}
                />
                <Line
                  type="monotone"
                  dataKey="coverage"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Teacher-wise Proxy Count */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Teacher-wise Proxy Count — June 2026</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <caption className="sr-only">Teacher proxy coverage ranking</caption>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-transparent">
                  <TableHead className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground h-auto">Rank</TableHead>
                  <SortableHead field="name" label="Teacher" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                  <SortableHead field="subject" label="Subject" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                  <SortableHead field="proxies" label="Proxy Count" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                  <TableHead className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground h-auto">Progress</TableHead>
                  <SortableHead field="status" label="Status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStats.map((t, i) => (
                  <TableRow key={t.name} className={`${i % 2 ? "bg-muted/10" : ""}`}>
                    <TableCell className="px-4 py-3 text-muted-foreground text-xs font-mono">#{i + 1}</TableCell>
                    <TableCell className="px-4 py-3 font-semibold">{t.name}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground text-xs">{t.subject}</TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="font-bold text-primary">{t.proxies}</span>
                      <span className="text-xs text-muted-foreground"> / 20 cap</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 w-32">
                      <div className="w-full bg-muted rounded-full h-1.5" role="img" aria-label={`${Math.min((t.proxies / 20) * 100, 100)} percent of cap`}>
                        <div
                          className="bg-primary h-1.5 rounded-full"
                          style={{ width: `${Math.min((t.proxies / 20) * 100, 100)}%` }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge
                        variant={t.status === "On track" ? "success" : "warning"}
                        className="text-xs"
                      >
                        {t.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
