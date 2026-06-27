"use client"
import { useState } from "react"
import {
  Activity, Server, Database, Zap, CheckCircle2, AlertTriangle,
  XCircle, Clock, RefreshCw, TrendingUp, Wifi, Shield, Globe,
  ArrowUpRight, Eye, Download,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"

const SERVICES = [
  { name: "API Server", status: "operational", uptime: 99.97, latency: 42, lastCheck: "12s ago", region: "ap-south-1" },
  { name: "Database (RDS)", status: "operational", uptime: 100, latency: 8, lastCheck: "12s ago", region: "ap-south-1" },
  { name: "Redis Cache", status: "operational", uptime: 99.99, latency: 2, lastCheck: "12s ago", region: "ap-south-1" },
  { name: "File Storage (S3)", status: "operational", uptime: 100, latency: 18, lastCheck: "12s ago", region: "ap-south-1" },
  { name: "Background Jobs", status: "degraded", uptime: 98.2, latency: 210, lastCheck: "12s ago", region: "ap-south-1" },
  { name: "SMS Gateway", status: "operational", uptime: 99.8, latency: 340, lastCheck: "45s ago", region: "global" },
  { name: "Email (SES)", status: "operational", uptime: 99.9, latency: 120, lastCheck: "1m ago", region: "us-east-1" },
  { name: "Razorpay Webhook", status: "operational", uptime: 99.3, latency: 88, lastCheck: "30s ago", region: "global" },
  { name: "CDN (CloudFront)", status: "operational", uptime: 100, latency: 14, lastCheck: "10s ago", region: "global" },
  { name: "Auth Service", status: "operational", uptime: 99.97, latency: 31, lastCheck: "12s ago", region: "ap-south-1" },
]

const LATENCY_HISTORY = [
  { time: "09:00", api: 38, db: 7 }, { time: "09:15", api: 42, db: 8 },
  { time: "09:30", api: 51, db: 9 }, { time: "09:45", api: 65, db: 12 },
  { time: "10:00", api: 48, db: 9 }, { time: "10:15", api: 42, db: 8 },
  { time: "10:30", api: 39, db: 7 },
]

const ERROR_RATES = [
  { time: "09:00", rate: 0.1 }, { time: "09:15", rate: 0.0 },
  { time: "09:30", rate: 0.3 }, { time: "09:45", rate: 0.8 },
  { time: "10:00", rate: 0.2 }, { time: "10:15", rate: 0.0 },
  { time: "10:30", rate: 0.1 },
]

const INCIDENTS = [
  { id: "INC-089", date: "2026-06-04 09:30", service: "Background Jobs", severity: "medium", duration: "22 min", summary: "Proxy assignment queue backed up due to DB connection pool exhaustion" },
  { id: "INC-088", date: "2026-06-03 14:05", service: "SMS Gateway", severity: "low", duration: "8 min", summary: "MSG91 delivery delays for Assam region; fallback activated" },
  { id: "INC-087", date: "2026-06-01 03:00", service: "API Server", severity: "low", duration: "5 min", summary: "Nightly deployment caused 5-minute cold start delay" },
  { id: "INC-086", date: "2026-05-28 11:20", service: "Razorpay Webhook", severity: "high", duration: "41 min", summary: "Webhook signature verification failures due to clock skew; patched" },
]

const DB_METRICS = [
  { label: "Active Connections", value: "12 / 100", pct: 12 },
  { label: "Query Cache Hit Rate", value: "94.2%", pct: 94 },
  { label: "Slow Queries (>1s)", value: "2", pct: 2 },
  { label: "Replication Lag", value: "0 ms", pct: 0 },
]

const QUEUE_METRICS = [
  { label: "Proxy Assign Queue", jobs: 4, failed: 0, rate: "98 jobs/hr" },
  { label: "Email Queue", jobs: 18, failed: 1, rate: "240/hr" },
  { label: "SMS Queue", jobs: 7, failed: 0, rate: "80/hr" },
  { label: "Report Gen Queue", jobs: 2, failed: 0, rate: "12/hr" },
]

type ServiceStatus = "operational" | "degraded" | "outage"
const STATUS_CONFIG: Record<ServiceStatus, { className: string; label: string; icon: React.ReactNode }> = {
  operational: { className: "bg-ef-green-light text-ef-green-dark", label: "Operational", icon: <CheckCircle2 className="size-3.5" /> },
  degraded: { className: "bg-ef-amber-light text-ef-amber-dark", label: "Degraded", icon: <AlertTriangle className="size-3.5" /> },
  outage: { className: "bg-ef-red-light text-ef-red", label: "Outage", icon: <XCircle className="size-3.5" /> },
}

const SEVERITY_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  low: "success", medium: "warning", high: "destructive", critical: "destructive",
}

const SEVERITY_RANK: Record<string, number> = { low: 0, medium: 1, high: 2, critical: 3 }

export default function SystemHealthPage() {
  const [lastRefresh, setLastRefresh] = useState("just now")

  const { sorted: sortedServices, sortField, sortDir, toggleSort } = useTableSort(SERVICES, {
    name: s => s.name,
    status: s => s.status,
    uptime: s => s.uptime,
    latency: s => s.latency,
  }, { field: "status", dir: "asc" })

  const { sorted: sortedIncidents, sortField: incSortField, sortDir: incSortDir, toggleSort: incToggleSort } = useTableSort(INCIDENTS, {
    id: i => i.id,
    date: i => i.date,
    service: i => i.service,
    severity: i => SEVERITY_RANK[i.severity] ?? 0,
    duration: i => parseInt(i.duration, 10),
  }, { field: "date", dir: "desc" })

  const allGood = SERVICES.every(s => s.status === "operational")
  const hasDegraded = SERVICES.some(s => s.status === "degraded")
  const hasOutage = SERVICES.some(s => s.status === "outage")
  const overallStatus: ServiceStatus = hasOutage ? "outage" : hasDegraded ? "degraded" : "operational"
  const overallConfig = STATUS_CONFIG[overallStatus]
  const maxLatency = Math.max(...LATENCY_HISTORY.map(h => h.api))

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Activity size={20} />}
        title="System Health"
        subtitle="Real-time infrastructure monitoring · API, DB, queues, delivery"
        actions={
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground/70 flex items-center gap-1"><Clock className="size-3" /> Refreshed {lastRefresh}</span>
            <Button variant="secondary" size="sm" onClick={() => setLastRefresh("just now")}><RefreshCw className="size-4" /> Refresh</Button>
            <Button variant="secondary" size="sm"><Download className="size-4" /> Export Report</Button>
          </div>
        }
      />

      {/* Overall Status Banner */}
      <div className={`rounded-xl px-5 py-4 flex items-center gap-3 ${allGood ? "bg-ef-green-light" : hasDegraded ? "bg-ef-amber-light" : "bg-ef-red-light"}`}>
        <div className="flex items-center gap-2">
          {overallConfig.icon}
          <span className="text-[15px] font-bold">{overallConfig.label}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {allGood ? "All systems are running normally. No active incidents." : hasDegraded ? "Some services are experiencing degraded performance. Team notified." : "Critical outage detected. Incident response activated."}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span className={`size-2 rounded-full inline-block ${overallStatus === "operational" ? "bg-ef-green" : overallStatus === "degraded" ? "bg-ef-amber" : "bg-ef-red"}`} aria-hidden="true" />
          <span className="text-xs font-semibold">LIVE</span>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard title="API Uptime (30d)" value="99.97%" subtitle="+0.02% vs 1h ago" icon={<Globe className="size-5" />} iconClassName="bg-ef-green-light text-ef-green" sparkline={{ variant: "line", data: [99.95, 99.97, 99.99, 99.96, 99.97, 99.97], color: "var(--ef-green)" }} />
        <KpiCard title="Avg API Latency" value="42 ms" subtitle="−3ms vs 1h ago" icon={<Zap className="size-5" />} sparkline={{ variant: "line", data: [48, 52, 65, 51, 44, 42] }} />
        <KpiCard title="Error Rate (1h)" value="0.18%" subtitle="−0.1% vs 1h ago" icon={<AlertTriangle className="size-5" />} iconClassName="bg-ef-amber-light text-ef-amber" sparkline={{ variant: "bar", data: [0.2, 0.1, 0.3, 0.8, 0.2, 0.18], color: "var(--ef-amber)" }} />
        <KpiCard title="Active Sessions" value="87" subtitle="+12 vs 1h ago" icon={<Wifi className="size-5" />} iconClassName="bg-ef-purple-light text-ef-purple" sparkline={{ variant: "line", data: [62, 71, 78, 83, 81, 87], color: "var(--ef-purple)" }} />
      </div>

      {/* Services Status */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><Server className="size-4 text-muted-foreground" /> Service Status</CardTitle>
          <Badge variant={allGood ? "success" : "warning"}>● {allGood ? "All Operational" : `${SERVICES.filter(s => s.status !== "operational").length} Degraded`}</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <caption className="sr-only">Service status with uptime and latency metrics</caption>
            <TableHeader>
              <TableRow>
                <SortableHead field="name" label="Service" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead field="status" label="Status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead field="uptime" label="Uptime" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <SortableHead field="latency" label="Latency" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <TableHead>Region</TableHead>
                <TableHead>Last Check</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedServices.map(svc => {
                const sc = STATUS_CONFIG[svc.status as ServiceStatus]
                return (
                  <TableRow key={svc.name}>
                    <TableCell><div className="flex items-center gap-2 font-semibold">{sc.icon}{svc.name}</div></TableCell>
                    <TableCell><span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${sc.className}`}>{sc.icon}{sc.label}</span></TableCell>
                    <TableCell><span className={`font-mono text-sm font-semibold ${svc.uptime >= 99.9 ? "text-ef-green-dark" : "text-ef-amber-dark"}`}>{svc.uptime}%</span></TableCell>
                    <TableCell><span className={`font-mono text-sm font-semibold ${svc.latency > 150 ? "text-ef-amber" : ""}`}>{svc.latency}ms</span></TableCell>
                    <TableCell className="text-xs text-muted-foreground/70">{svc.region}</TableCell>
                    <TableCell className="text-xs text-muted-foreground/70">{svc.lastCheck}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Latency + Error Rate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><TrendingUp className="size-4 text-primary" /> API Latency (2h)</CardTitle>
            <Badge variant="success">● Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-32">
              {LATENCY_HISTORY.map(h => {
                const barH = Math.round((h.api / maxLatency) * 100)
                const isHigh = h.api > 55
                return (
                  <div key={h.time} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`text-[9px] font-semibold ${isHigh ? "text-ef-amber" : "text-muted-foreground/70"}`}>{h.api}ms</div>
                    <div className={`w-full rounded-t ${isHigh ? "bg-ef-amber" : "bg-primary"}`} style={{ height: barH, minHeight: 3 }} />
                    <div className="text-[9px] text-muted-foreground/70">{h.time.slice(3)}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex gap-4 text-xs">
              <div><span className="text-muted-foreground/70">P50</span> <strong>42ms</strong></div>
              <div><span className="text-muted-foreground/70">P95</span> <strong>89ms</strong></div>
              <div><span className="text-muted-foreground/70">P99</span> <strong className="text-ef-amber">210ms</strong></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><AlertTriangle className="size-4 text-ef-amber" /> Error Rate (2h)</CardTitle>
            <Badge variant="success">{"<1%"}</Badge>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5 h-32">
              {ERROR_RATES.map(h => {
                const barH = Math.round((h.rate / 1.0) * 100)
                const isHigh = h.rate > 0.5
                return (
                  <div key={h.time} className="flex-1 flex flex-col items-center gap-1">
                    <div className={`text-[9px] font-semibold ${isHigh ? "text-ef-red" : "text-muted-foreground/70"}`}>{h.rate}%</div>
                    <div className={`w-full rounded-t ${isHigh ? "bg-ef-red" : "bg-ef-green"}`} style={{ height: Math.max(barH, 3) }} />
                    <div className="text-[9px] text-muted-foreground/70">{h.time.slice(3)}</div>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex gap-3 text-xs">
              <div><span className="text-muted-foreground/70">4xx</span> <strong className="text-ef-amber">0.12%</strong></div>
              <div><span className="text-muted-foreground/70">5xx</span> <strong className="text-ef-red">0.06%</strong></div>
              <div><span className="text-muted-foreground/70">Total requests (1h)</span> <strong>14,892</strong></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database + Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><Database className="size-4 text-primary" /> Database Metrics</CardTitle>
            <Badge variant="success">● Healthy</Badge>
          </CardHeader>
          <CardContent>
            {DB_METRICS.map(m => (
              <div key={m.label} className="mb-3.5">
                <div className="flex justify-between mb-1.5">
                  <span className="text-sm font-medium">{m.label}</span>
                  <span className="text-sm font-bold font-mono">{m.value}</span>
                </div>
                {m.pct > 0 && <Progress value={m.pct} className={`h-1.5 ${m.pct > 80 ? "[&>div]:bg-destructive" : m.pct > 50 ? "[&>div]:bg-ef-amber" : "[&>div]:bg-ef-green"}`} />}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><Zap className="size-4 text-primary" /> Background Queues</CardTitle>
            <Badge variant="warning">● 1 slow queue</Badge>
          </CardHeader>
          <CardContent className="p-0">
            {QUEUE_METRICS.map((q, i) => (
              <div key={q.label} className={`flex items-center gap-3 px-5 py-3 ${i < QUEUE_METRICS.length - 1 ? "border-b border-border" : ""}`}>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{q.label}</div>
                  <div className="text-[11px] text-muted-foreground/70">{q.rate}</div>
                </div>
                <div className="flex gap-2.5 items-center">
                  <div className="text-center">
                    <div className="text-base font-extrabold">{q.jobs}</div>
                    <div className="text-[10px] text-muted-foreground/70">pending</div>
                  </div>
                  {q.failed > 0 ? <Badge variant="destructive">{q.failed} failed</Badge> : <CheckCircle2 className="size-4 text-ef-green" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Incident History */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><Shield className="size-4 text-muted-foreground" /> Incident History (30 days)</CardTitle>
          <div className="flex gap-1.5">
            <Badge variant="success">4 resolved</Badge>
            <Button variant="secondary" size="sm"><Eye className="size-3.5" /> Full History</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <caption className="sr-only">Incident history with severity and resolution status</caption>
            <TableHeader>
              <TableRow>
                <SortableHead field="id" label="ID" sortField={incSortField} sortDir={incSortDir} onSort={incToggleSort} />
                <SortableHead field="date" label="Date" sortField={incSortField} sortDir={incSortDir} onSort={incToggleSort} />
                <SortableHead field="service" label="Service" sortField={incSortField} sortDir={incSortDir} onSort={incToggleSort} />
                <SortableHead field="severity" label="Severity" sortField={incSortField} sortDir={incSortDir} onSort={incToggleSort} />
                <SortableHead field="duration" label="Duration" sortField={incSortField} sortDir={incSortDir} onSort={incToggleSort} />
                <TableHead>Status</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedIncidents.map(inc => (
                <TableRow key={inc.id}>
                  <TableCell className="font-mono text-xs text-primary font-semibold">{inc.id}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">{inc.date}</TableCell>
                  <TableCell><Badge variant="secondary">{inc.service}</Badge></TableCell>
                  <TableCell><Badge variant={SEVERITY_VARIANT[inc.severity]}>● {inc.severity}</Badge></TableCell>
                  <TableCell className="text-sm font-semibold">{inc.duration}</TableCell>
                  <TableCell><Badge variant="success">● Resolved</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[280px] truncate">{inc.summary}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-xs text-ef-green-dark flex items-center gap-1"><CheckCircle2 className="size-3" /> 0 open incidents · 4 resolved in 30 days</span>
          <span className="text-xs text-muted-foreground/70 flex items-center gap-1"><ArrowUpRight className="size-3" /> MTTR: 19 min avg</span>
        </CardFooter>
      </Card>
    </div>
  )
}
