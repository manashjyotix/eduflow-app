"use client"
import { useState } from "react"
import {
  ClipboardList, Filter, CheckCircle, XCircle, Clock,
  Calendar, TrendingUp, Award,
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
import { MiniSparkline } from "@/components/shared/mini-sparkline"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type LeaveStatus = "approved" | "pending" | "rejected"
type LeaveType = "sick_leave" | "casual_leave" | "earned_leave" | "emergency" | "official_duty"

interface LeaveRecord {
  id: string
  date: string
  type: LeaveType
  periods: number
  reason: string
  status: LeaveStatus
  approvedBy?: string
}

const LEAVE_HISTORY: LeaveRecord[] = [
  { id: "l1", date: "2026-06-01", type: "sick_leave",    periods: 7, reason: "High fever",           status: "approved", approvedBy: "Principal" },
  { id: "l2", date: "2026-05-15", type: "casual_leave",  periods: 3, reason: "Bank work",            status: "approved", approvedBy: "Management" },
  { id: "l3", date: "2026-04-22", type: "earned_leave",  periods: 7, reason: "Family function",      status: "approved", approvedBy: "Management" },
  { id: "l4", date: "2026-04-10", type: "emergency",     periods: 7, reason: "Medical emergency",   status: "rejected" },
  { id: "l5", date: "2026-03-18", type: "official_duty", periods: 7, reason: "Training program",     status: "approved", approvedBy: "Principal" },
  { id: "l6", date: "2026-03-05", type: "sick_leave",    periods: 4, reason: "Doctor appointment",   status: "approved", approvedBy: "Management" },
  { id: "l7", date: "2026-02-14", type: "casual_leave",  periods: 7, reason: "Personal",             status: "approved", approvedBy: "Management" },
  { id: "l8", date: "2026-01-20", type: "sick_leave",    periods: 7, reason: "Flu",                  status: "approved", approvedBy: "Principal" },
]

const LEAVE_BALANCES = [
  { type: "Sick Leave",    label: "sick_leave",    used: 18, total: 25 },
  { type: "Casual Leave",  label: "casual_leave",  used: 10, total: 20 },
  { type: "Earned Leave",  label: "earned_leave",  used: 7,  total: 30 },
]

const MONTHLY_USAGE = [
  { month: "Jan", days: 7 }, { month: "Feb", days: 7 }, { month: "Mar", days: 11 },
  { month: "Apr", days: 14 }, { month: "May", days: 3 }, { month: "Jun", days: 7 },
]

const TYPE_LABELS: Record<LeaveType, string> = {
  sick_leave: "Sick Leave", casual_leave: "Casual Leave",
  earned_leave: "Earned Leave", emergency: "Emergency", official_duty: "Official Duty",
}
const TYPE_COLORS: Record<LeaveType, string> = {
  sick_leave:    "bg-destructive/10 text-destructive dark:bg-destructive/20",
  casual_leave:  "bg-primary/10 text-primary dark:bg-primary/20",
  earned_leave:  "bg-success/15 text-success-foreground dark:bg-success/20",
  emergency:     "bg-warning/15 text-warning-foreground dark:bg-warning/20",
  official_duty: "bg-ef-purple-light text-ef-purple dark:bg-ef-purple-light/10 dark:text-ef-purple",
}

// Sortable columns for the leave records table
const LEAVE_COLUMNS = [
  { field: "date",       label: "Date" },
  { field: "type",       label: "Type" },
  { field: "duration",   label: "Duration" },
  { field: "reason",     label: "Reason" },
  { field: "approvedBy", label: "Approved By" },
  { field: "status",     label: "Status" },
] as const

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1">{label}</p>
      <div className="flex items-center gap-1.5">
        <span className="size-2 rounded-sm bg-primary" />
        <span className="text-muted-foreground">Days:</span>
        <span className="font-bold">{payload[0]?.value}</span>
      </div>
    </div>
  )
}

export default function LeaveHistoryPage() {
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  const filtered = LEAVE_HISTORY.filter(l => {
    const matchStatus = statusFilter === "all" || l.status === statusFilter
    const matchType   = typeFilter   === "all" || l.type   === typeFilter
    return matchStatus && matchType
  })

  const approved  = LEAVE_HISTORY.filter(l => l.status === "approved").length
  const rejected  = LEAVE_HISTORY.filter(l => l.status === "rejected").length
  const totalDays = LEAVE_HISTORY.filter(l => l.status === "approved").reduce((s, l) => s + (l.periods === 7 ? 1 : 0.5), 0)

  const { sorted, sortField, sortDir, toggleSort } = useTableSort(filtered, {
    date:       l => new Date(l.date).getTime(),
    type:       l => TYPE_LABELS[l.type],
    duration:   l => l.periods,
    reason:     l => l.reason,
    approvedBy: l => l.approvedBy ?? "",
    status:     l => l.status,
  }, { field: "date", dir: "desc" })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<ClipboardList size={22} />}
        title="Leave History"
        subtitle="Your leave records at Holy Child English Academy · Priya Sharma"
      />

      {/* KPIs */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard title="Total Leaves"  value={LEAVE_HISTORY.length}   icon={<ClipboardList className="size-5" />} sparkline={{ variant: "bar", data: MONTHLY_USAGE.map(m => m.days) }} />
        <KpiCard title="Approved"      value={approved}               icon={<CheckCircle className="size-5" />}   iconClassName="bg-success/20 text-success-foreground" sparkline={{ variant: "bar", data: [2,2,3,3,1,1], color: "var(--ef-green)" }} />
        <KpiCard title="Rejected"      value={rejected}               icon={<XCircle className="size-5" />}       iconClassName="bg-destructive/10 text-destructive" sparkline={{ variant: "bar", data: [0,0,0,1,0,0], color: "var(--ef-red)" }} />
        <KpiCard title="Days Used"     value={`${totalDays}d`}        icon={<Calendar className="size-5" />}      iconClassName="bg-primary/10 text-primary" trend={{ value: -3, label: "vs last year" }} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly usage chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" /> Monthly Leave Usage — 2026
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={MONTHLY_USAGE} margin={{ top: 4, right: 4, left: -28, bottom: 0 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                <Bar dataKey="days" name="Days" fill="var(--primary)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Leave balances */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Award className="size-4 text-primary" /> Leave Balance — 2026–27
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4 space-y-4">
            {LEAVE_BALANCES.map(lb => {
              const remaining = lb.total - lb.used
              const pct = Math.round((remaining / lb.total) * 100)
              return (
                <div key={lb.type} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{lb.type}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{lb.used} used</span>
                      <span className={`font-bold text-sm ${remaining <= 3 ? "text-destructive" : "text-success-foreground"}`}>{remaining} left</span>
                    </div>
                  </div>
                  <Progress value={pct} className={`h-2 ${remaining <= 3 ? "[&>div]:bg-destructive" : "[&>div]:bg-[var(--ef-green)]"}`} />
                  <p className="text-[10px] text-muted-foreground">Total entitlement: {lb.total} days</p>
                </div>
              )
            })}
            <div className="pt-2 border-t border-border flex items-center gap-2 text-xs text-muted-foreground">
              <MiniSparkline variant="arc" value={65} color="var(--ef-brand)" width={32} height={32} />
              <span>65% of annual entitlement remaining</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3 gap-3 flex-wrap">
          <CardTitle className="text-base font-semibold">Leave Records</CardTitle>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <Filter className="size-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-8 w-40 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(TYPE_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 overflow-x-auto">
          <Table className="text-sm">
            <caption className="sr-only">Leave request history</caption>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                {LEAVE_COLUMNS.map(col => (
                  <SortableHead
                    key={col.field}
                    field={col.field}
                    label={col.label}
                    sortField={sortField}
                    sortDir={sortDir}
                    onSort={toggleSort}
                    className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground"
                  />
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground text-sm">No leave records match your filter.</TableCell></TableRow>
              ) : sorted.map(l => (
                <TableRow key={l.id} className="hover:bg-muted/20">
                  <TableCell className="px-4 py-3 text-xs font-mono">
                    {new Date(l.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${TYPE_COLORS[l.type]}`}>
                      {TYPE_LABELS[l.type]}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs">
                    {l.periods === 7 ? "Full Day" : `${l.periods} periods`}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">{l.reason}</TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                    {l.approvedBy ?? <span className="italic text-muted-foreground/60">—</span>}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant={l.status === "approved" ? "success" : l.status === "rejected" ? "destructive" : "warning"} className="capitalize text-xs">
                      {l.status === "approved" ? <CheckCircle className="size-3 mr-1" /> : l.status === "rejected" ? <XCircle className="size-3 mr-1" /> : <Clock className="size-3 mr-1" />}
                      {l.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            <span>Showing {filtered.length} of {LEAVE_HISTORY.length} records</span>
            <Button variant="ghost" size="sm" className="text-xs">Export CSV</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
