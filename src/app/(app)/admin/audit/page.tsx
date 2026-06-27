"use client"
import { useState } from "react"
import { ClipboardCheck, Download, Search, ShieldCheck, AlertTriangle, XCircle, Activity } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const AUDIT_LOGS = [
  { id: "a1",  ts: "2026-06-15 09:15:23", user: "Admin (AP)",      role: "admin",       action: "Absence Approved",    resource: "Absence #abs-001",   ip: "192.168.1.10", status: "success" },
  { id: "a2",  ts: "2026-06-15 09:02:11", user: "Admin (AP)",      role: "admin",       action: "Proxy Assigned",      resource: "Period P3 → Priya",  ip: "192.168.1.10", status: "success" },
  { id: "a3",  ts: "2026-06-15 08:55:00", user: "Priya Sharma",    role: "teacher",     action: "Login",               resource: "Session",            ip: "10.0.0.23",    status: "success" },
  { id: "a4",  ts: "2026-06-15 08:47:32", user: "Admin (AP)",      role: "admin",       action: "Login",               resource: "Session",            ip: "192.168.1.10", status: "success" },
  { id: "a5",  ts: "2026-06-14 16:30:45", user: "Admin (AP)",      role: "admin",       action: "Fee Collected",       resource: "Rohit Das ₹7,500",   ip: "192.168.1.10", status: "success" },
  { id: "a6",  ts: "2026-06-14 15:22:10", user: "Mgmt (MO)",       role: "management",  action: "Swap Approved",       resource: "SwapReq #sw4",       ip: "192.168.1.21", status: "success" },
  { id: "a7",  ts: "2026-06-14 14:10:03", user: "Admin (AP)",      role: "admin",       action: "Notice Posted",       resource: "Notice #ntc-009",    ip: "192.168.1.10", status: "success" },
  { id: "a8",  ts: "2026-06-14 13:45:00", user: "Rajesh Kalita",   role: "teacher",     action: "Proxy Declined",      resource: "Period P5",          ip: "10.0.0.41",    status: "warning" },
  { id: "a9",  ts: "2026-06-14 11:30:22", user: "Admin (AP)",      role: "admin",       action: "Settings Changed",    resource: "Timetable Config",   ip: "192.168.1.10", status: "success" },
  { id: "a10", ts: "2026-06-14 10:00:00", user: "Parent (PU)",     role: "parent",      action: "Login",               resource: "Session",            ip: "203.0.113.5",  status: "success" },
  { id: "a11", ts: "2026-06-13 17:05:11", user: "Admin (AP)",      role: "admin",       action: "Teacher Added",       resource: "Teacher #t11",       ip: "192.168.1.10", status: "success" },
  { id: "a12", ts: "2026-06-13 15:20:00", user: "Admin (AP)",      role: "admin",       action: "Leave Rejected",      resource: "Leave #lv-012",      ip: "192.168.1.10", status: "success" },
  { id: "a13", ts: "2026-06-13 12:15:44", user: "Anita Devi",      role: "teacher",     action: "Attendance Marked",   resource: "Class VI-B P2",      ip: "10.0.0.55",    status: "success" },
  { id: "a14", ts: "2026-06-13 09:01:00", user: "Unknown",         role: "-",           action: "Login Failed",        resource: "admin@hcea.edu",     ip: "45.92.10.201", status: "error"   },
  { id: "a15", ts: "2026-06-12 16:45:30", user: "Admin (AP)",      role: "admin",       action: "Student Enrolled",    resource: "Student #s-285",     ip: "192.168.1.10", status: "success" },
]

const STATUS_BADGE: Record<string, string> = {
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  error:   "bg-destructive text-destructive-foreground",
}

// ── Derived KPI values from AUDIT_LOGS ─────────────────────────────────
const TOTAL_EVENTS   = AUDIT_LOGS.length
const TODAY_EVENTS   = AUDIT_LOGS.filter(l => l.ts.startsWith("2026-06-15")).length
const WARN_COUNT     = AUDIT_LOGS.filter(l => l.status === "warning").length
const ERROR_COUNT    = AUDIT_LOGS.filter(l => l.status === "error").length
// Daily event series (Jun 10–15 approximate)
const EVENTS_SERIES: number[] = [8, 11, 6, 9, 7, TODAY_EVENTS]

export default function AuditPage() {
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = AUDIT_LOGS.filter(l => {
    const matchSearch = !search || l.user.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "all" || l.role === roleFilter
    const matchStatus = statusFilter === "all" || l.status === statusFilter
    return matchSearch && matchRole && matchStatus
  })

  const { sorted, sortField, sortDir, toggleSort } = useTableSort(
    filtered,
    {
      ts: l => l.ts,
      user: l => l.user,
      role: l => l.role,
      action: l => l.action,
      resource: l => l.resource,
      ip: l => l.ip,
      status: l => l.status,
    },
    { field: "ts", dir: "desc" },
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 fade-in">
      <PageHeader
        icon={<ClipboardCheck size={20} />}
        title="Audit Log"
        subtitle="System activity and access log"
        actions={<Button variant="outline"><Download className="size-4 mr-1" />Export CSV</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Total Events"
          value={TOTAL_EVENTS}
          subtitle={`${TODAY_EVENTS} today · all roles`}
          icon={<Activity className="size-5" />}
          tone="brand"
          trend={{ value: Math.round(((TODAY_EVENTS - 3) / 3) * 100), label: "vs yesterday" }}
          sparkline={{ variant: "bar", data: EVENTS_SERIES }}
        />
        <KpiCard
          title="Today"
          value={TODAY_EVENTS}
          subtitle={`${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · ${AUDIT_LOGS.filter(l => l.ts.startsWith("2026-06-15") && l.status === "success").length} success`}
          icon={<ShieldCheck className="size-5" />}
          tone="green"
          sparkline={{ variant: "arc", value: Math.round((TODAY_EVENTS / TOTAL_EVENTS) * 100) }}
        />
        <KpiCard
          title="Warnings"
          value={WARN_COUNT}
          subtitle={`${WARN_COUNT} flagged action${WARN_COUNT !== 1 ? "s" : ""} logged`}
          icon={<AlertTriangle className="size-5" />}
          tone="amber"
          sparkline={{ variant: "bar", data: [0, 1, 0, 0, 0, WARN_COUNT] }}
        />
        <KpiCard
          title="Errors"
          value={ERROR_COUNT}
          subtitle={`${ERROR_COUNT} failed login attempt${ERROR_COUNT !== 1 ? "s" : ""}`}
          icon={<XCircle className="size-5" />}
          tone="red"
          trend={{ value: 0, label: "vs last period" }}
          sparkline={{ variant: "bar", data: [0, 0, 1, 0, 0, ERROR_COUNT] }}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input placeholder="Search user or action…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="management">Management</SelectItem>
            <SelectItem value="teacher">Teacher</SelectItem>
            <SelectItem value="parent">Parent</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-0"><CardTitle className="text-sm font-medium text-muted-foreground">Showing {filtered.length} events</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <caption className="sr-only">Audit log entries</caption>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-transparent">
                  {([
                    { field: "ts", label: "Timestamp" },
                    { field: "user", label: "User" },
                    { field: "role", label: "Role" },
                    { field: "action", label: "Action" },
                    { field: "resource", label: "Resource" },
                    { field: "ip", label: "IP Address" },
                    { field: "status", label: "Status" },
                  ] as const).map(col => (
                    <SortableHead
                      key={col.field}
                      field={col.field}
                      label={col.label}
                      sortField={sortField}
                      sortDir={sortDir}
                      onSort={toggleSort}
                      className="text-left text-xs font-medium text-muted-foreground px-4 py-3 whitespace-nowrap h-auto"
                    />
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground font-mono whitespace-nowrap">{log.ts}</TableCell>
                    <TableCell className="px-4 py-3 font-medium whitespace-nowrap">{log.user}</TableCell>
                    <TableCell className="px-4 py-3"><Badge variant="outline" className="text-xs capitalize">{log.role}</Badge></TableCell>
                    <TableCell className="px-4 py-3 whitespace-nowrap">{log.action}</TableCell>
                    <TableCell className="px-4 py-3 text-muted-foreground text-xs">{log.resource}</TableCell>
                    <TableCell className="px-4 py-3 text-xs font-mono text-muted-foreground">{log.ip}</TableCell>
                    <TableCell className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[log.status]}`}>
                        {log.status}
                      </span>
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
