"use client"
import { useState } from "react"
import { ScrollText, Shield, Download, Filter, Eye, Clock, Activity, Building2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"

const logs = [
  { ts: "2026-06-04 09:41", school: "HCEA", actor: "Admin Panel", role: "admin", module: "Proxy", action: "Auto-Assign", detail: "AI assigned 3 proxies", ip: "192.168.1.2" },
  { ts: "2026-06-04 09:55", school: "HCEA", actor: "Mgmt Office", role: "management", module: "Absence", action: "Approve", detail: "Approved Dipak Baruah leave", ip: "192.168.1.5" },
  { ts: "2026-06-04 10:10", school: "DPS Guwahati", actor: "Admin Panel", role: "admin", module: "Fee", action: "Collect", detail: "Bulk fee collection ₹45,000", ip: "10.0.1.3" },
  { ts: "2026-06-03 11:22", school: "St. Xavier's", actor: "Super Admin", role: "superadmin", module: "Tenant", action: "Create", detail: "New school onboarded", ip: "127.0.0.1" },
  { ts: "2026-06-03 14:05", school: "DPS Guwahati", actor: "Admin Panel", role: "admin", module: "Settings", action: "Update", detail: "Proxy cap changed to 6", ip: "10.0.1.3" },
  { ts: "2026-06-02 09:30", school: "HCEA", actor: "Super Admin", role: "superadmin", module: "Billing", action: "Override", detail: "Extended trial 14 days", ip: "127.0.0.1" },
  { ts: "2026-06-01 16:00", school: "HCEA", actor: "Admin Panel", role: "admin", module: "Notice", action: "Publish", detail: "Annual Day notice published", ip: "192.168.1.2" },
  { ts: "2026-05-31 10:15", school: "St. Xavier's", actor: "Priya Sharma", role: "teacher", module: "Leave", action: "Apply", detail: "Leave request submitted", ip: "10.0.2.5" },
  { ts: "2026-05-30 09:00", school: "DPS Guwahati", actor: "Super Admin", role: "superadmin", module: "Tenant", action: "Impersonate", detail: "Ghost session started", ip: "127.0.0.1" },
  { ts: "2026-05-29 15:30", school: "HCEA", actor: "Admin Panel", role: "admin", module: "Student", action: "Import", detail: "CSV import: 42 students", ip: "192.168.1.2" },
  { ts: "2026-05-28 11:00", school: "Mount Carmel", actor: "Super Admin", role: "superadmin", module: "Billing", action: "Sync", detail: "Razorpay webhook sync triggered", ip: "127.0.0.1" },
  { ts: "2026-05-27 08:45", school: "Don Bosco", actor: "Admin Panel", role: "admin", module: "Teacher", action: "Create", detail: "New teacher: Rajesh Kalita added", ip: "10.0.1.8" },
]

const roleBadge: Record<string, { variant: "default" | "warning" | "success" | "secondary"; className?: string }> = {
  admin: { variant: "default" },
  management: { variant: "warning" },
  teacher: { variant: "success" },
  superadmin: { variant: "default", className: "bg-ef-purple text-white hover:bg-ef-purple/80" },
}

const MODULE_CLASS: Record<string, string> = {
  Proxy: "bg-ef-brand-light text-primary",
  Absence: "bg-ef-amber-light text-ef-amber-dark",
  Fee: "bg-ef-green-light text-ef-green-dark",
  Settings: "bg-ef-purple-light text-ef-purple",
  Tenant: "bg-ef-blue-light text-ef-blue",
  Billing: "bg-ef-green-light text-ef-green-dark",
  Notice: "bg-ef-cyan-light text-ef-cyan",
  Leave: "bg-ef-amber-light text-ef-amber-dark",
  Student: "bg-ef-brand-light text-primary",
  Teacher: "bg-ef-purple-light text-ef-purple",
}

const sessions = [
  { ts: "2026-06-03 14:05", school: "DPS Guwahati", duration: "22 min", by: "Super Admin", ended: true },
  { ts: "2026-05-30 09:00", school: "DPS Guwahati", duration: "8 min", by: "Super Admin", ended: true },
]

export default function SuperAuditLogPage() {
  const [search, setSearch] = useState("")
  const [schoolFilter, setSchoolFilter] = useState("all-schools")
  const [moduleFilter, setModuleFilter] = useState("all-modules")
  const [dateFilter, setDateFilter] = useState("2026-06-04")

  const filtered = logs.filter(l => {
    const q = search.toLowerCase()
    const matchSearch = !q || l.actor.toLowerCase().includes(q) || l.detail.toLowerCase().includes(q) || l.action.toLowerCase().includes(q) || l.school.toLowerCase().includes(q)
    const matchSchool = schoolFilter === "all-schools" || l.school.toLowerCase().includes(schoolFilter)
    const matchModule = moduleFilter === "all-modules" || l.module.toLowerCase() === moduleFilter
    return matchSearch && matchSchool && matchModule
  })

  const { sorted, sortField, sortDir, toggleSort } = useTableSort(filtered, {
    ts: l => l.ts,
    school: l => l.school,
    actor: l => l.actor,
    module: l => l.module,
    action: l => l.action,
  }, { field: "ts", dir: "desc" })

  const { sorted: sortedSessions, sortField: sessSortField, sortDir: sessSortDir, toggleSort: sessToggleSort } = useTableSort(sessions, {
    ts: s => s.ts,
    school: s => s.school,
    duration: s => parseInt(s.duration, 10),
    by: s => s.by,
  }, { field: "ts", dir: "desc" })

  const uniqueSchools = [...new Set(logs.map(l => l.school))]
  const uniqueModules = [...new Set(logs.map(l => l.module))]
  const superAdminActions = logs.filter(l => l.role === "superadmin").length

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<ScrollText size={20} />}
        title="Cross-Tenant Audit Log"
        subtitle="All platform actions across all schools"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-ef-green-dark bg-ef-green-light"><Shield className="size-3" /> Append-Only · Tamper-Proof</div>
            <Button variant="secondary" size="sm"><Download className="size-4" /> Export CSV</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard title="Total Actions (30d)" value={logs.length} subtitle="All platform events" icon={<Activity className="size-5" />} sparkline={{ variant: "bar", data: [12, 18, 15, 22, 19, 24] }} />
        <KpiCard title="Super Admin Actions" value={superAdminActions} subtitle="Privileged actions" icon={<Shield className="size-5" />} iconClassName="bg-ef-purple-light text-ef-purple" sparkline={{ variant: "bar", data: [1, 2, 1, 1, 2, 3], color: "var(--ef-purple)" }} />
        <KpiCard title="Schools Affected" value={uniqueSchools.length} subtitle="Unique tenants" icon={<Building2 className="size-5" />} iconClassName="bg-ef-green-light text-ef-green" sparkline={{ variant: "line", data: [4, 5, 5, 6, 6, 6], color: "var(--ef-green)" }} />
        <KpiCard title="Impersonation Sessions" value={sessions.length} subtitle="All ended safely" icon={<Eye className="size-5" />} iconClassName="bg-ef-amber-light text-ef-amber" sparkline={{ variant: "bar", data: [0, 1, 0, 1, 0, 2], color: "var(--ef-amber)" }} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Filter className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search actor, action, detail…" className="pl-9" />
            </div>
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-schools">All Schools</SelectItem>
                {uniqueSchools.map(s => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all-modules">All Modules</SelectItem>
                {uniqueModules.map(m => <SelectItem key={m} value={m.toLowerCase()}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="w-[160px]" />
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setSchoolFilter("all-schools"); setModuleFilter("all-modules") }}><Filter className="size-3.5" /> Clear</Button>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold"><ScrollText className="size-4 text-primary" /> Audit Events</CardTitle>
          <Badge variant="secondary">{filtered.length} of {logs.length} events</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="text-sm">
            <caption className="sr-only">Audit events log</caption>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                <SortableHead field="ts" label="Timestamp" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="school" label="School" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="actor" label="Actor" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="module" label="Module" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="action" label="Action" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <TableHead className="text-xs"><span className="inline-flex items-center gap-1 font-medium">Detail</span></TableHead>
                <TableHead className="text-xs"><span className="inline-flex items-center gap-1 font-medium">IP</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={7} className="py-12 text-center">
                    <Clock className="size-7 text-muted-foreground/70 mx-auto mb-3" />
                    <div className="text-[15px] font-semibold mb-1.5">No audit events match your filters</div>
                    <div className="text-sm text-muted-foreground/70">Try adjusting the search or filter criteria.</div>
                  </TableCell>
                </TableRow>
              ) : sorted.map((l, i) => {
                const rb = roleBadge[l.role]
                return (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-[11px] whitespace-nowrap text-muted-foreground">{l.ts}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{l.school}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-ef-brand-light text-primary flex items-center justify-center text-[10px] font-bold flex-shrink-0" aria-hidden="true">{l.actor.charAt(0)}</div>
                        <div>
                          <p className="text-xs font-semibold">{l.actor}</p>
                          <Badge variant={rb.variant} className={`text-[9px] mt-0.5 ${rb.className ?? ""}`}>{l.role}</Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${MODULE_CLASS[l.module] || "bg-ef-brand-light text-primary"}`}>{l.module}</span></TableCell>
                    <TableCell className="font-semibold text-xs">{l.action}</TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{l.detail}</TableCell>
                    <TableCell className="font-mono text-[11px] text-muted-foreground/70">{l.ip}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Impersonation Sessions */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-semibold"><Eye className="size-4 text-ef-amber" /> Impersonation Sessions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table className="text-sm">
            <caption className="sr-only">Impersonation sessions</caption>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                <SortableHead field="ts" label="Timestamp" sortField={sessSortField} sortDir={sessSortDir} onSort={sessToggleSort} className="text-xs" />
                <SortableHead field="school" label="School" sortField={sessSortField} sortDir={sessSortDir} onSort={sessToggleSort} className="text-xs" />
                <SortableHead field="duration" label="Duration" sortField={sessSortField} sortDir={sessSortDir} onSort={sessToggleSort} className="text-xs" />
                <SortableHead field="by" label="Initiated By" sortField={sessSortField} sortDir={sessSortDir} onSort={sessToggleSort} className="text-xs" />
                <TableHead className="text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSessions.map((s, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-[11px]">{s.ts}</TableCell>
                  <TableCell><Badge variant="outline">{s.school}</Badge></TableCell>
                  <TableCell className="font-semibold">{s.duration}</TableCell>
                  <TableCell>{s.by}</TableCell>
                  <TableCell><Badge variant="success">● Ended</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
