"use client"
import { useState } from "react"
import Link from "next/link"
import {
  Building2, Plus, Eye, MoreHorizontal, Download, Filter,
  Globe, MapPin, Calendar, ShieldAlert, CheckCircle2,
  Clock, XCircle, Zap, Search,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"

interface Tenant {
  id: string
  name: string
  board: string
  city: string
  state: string
  plan: "Starter" | "Quarterly" | "Annual" | "Trial"
  mrr: number
  status: "active" | "trial" | "suspended" | "grace"
  trialExpiry?: string
  createdAt: string
  students: number
  teachers: number
  admin: string
}

const TENANTS: Tenant[] = [
  { id: "sch-1", name: "Holy Child English Academy", board: "SEBA", city: "Howly", state: "Assam", plan: "Starter", mrr: 999, status: "active", createdAt: "Jan 2025", students: 380, teachers: 10, admin: "admin@hcea.edu" },
  { id: "sch-2", name: "Delhi Public School, Guwahati", board: "CBSE", city: "Guwahati", state: "Assam", plan: "Annual", mrr: 8999, status: "active", createdAt: "Mar 2025", students: 2400, teachers: 68, admin: "principal@dpsg.edu" },
  { id: "sch-3", name: "St. Xavier's High School", board: "CBSE", city: "Silchar", state: "Assam", plan: "Trial", mrr: 0, status: "trial", trialExpiry: "12 Jun 2026", createdAt: "May 2026", students: 620, teachers: 18, admin: "admin@stxaviers.edu" },
  { id: "sch-4", name: "Don Bosco Academy", board: "CBSE", city: "Guwahati", state: "Assam", plan: "Quarterly", mrr: 2499, status: "active", createdAt: "Sep 2025", students: 1100, teachers: 32, admin: "admin@donbosco.edu" },
  { id: "sch-5", name: "Kendriya Vidyalaya No. 1", board: "CBSE", city: "Jorhat", state: "Assam", plan: "Annual", mrr: 7499, status: "active", createdAt: "Jun 2025", students: 1800, teachers: 55, admin: "kvj1@kv.edu" },
  { id: "sch-6", name: "Bright Minds Academy", board: "SEBA", city: "Barpeta", state: "Assam", plan: "Starter", mrr: 999, status: "grace", trialExpiry: "4 days left", createdAt: "Nov 2025", students: 220, teachers: 8, admin: "admin@brightminds.edu" },
  { id: "sch-7", name: "Greenfield Public School", board: "SEBA", city: "Nagaon", state: "Assam", plan: "Trial", mrr: 0, status: "trial", trialExpiry: "25 Jun 2026", createdAt: "Jun 2026", students: 410, teachers: 12, admin: "admin@greenfield.edu" },
  { id: "sch-8", name: "Mount Carmel Academy", board: "ICSE", city: "Dibrugarh", state: "Assam", plan: "Quarterly", mrr: 2499, status: "active", createdAt: "Feb 2026", students: 780, teachers: 24, admin: "admin@mca.edu" },
]

const STATUS_META: Record<string, { variant: "success" | "warning" | "destructive" | "secondary"; label: string; icon: React.ReactNode }> = {
  active: { variant: "success", label: "Active", icon: <CheckCircle2 className="size-3" /> },
  trial: { variant: "warning", label: "Trial", icon: <Clock className="size-3" /> },
  suspended: { variant: "destructive", label: "Suspended", icon: <XCircle className="size-3" /> },
  grace: { variant: "destructive", label: "Grace Period", icon: <ShieldAlert className="size-3" /> },
}

const PLAN_BADGE: Record<string, { variant: "secondary" | "default" | "warning"; className?: string }> = {
  Starter: { variant: "secondary" },
  Quarterly: { variant: "default" },
  Annual: { variant: "default", className: "bg-ef-purple text-white hover:bg-ef-purple/80" },
  Trial: { variant: "warning" },
}

export default function TenantManagementPage() {
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [newSchool, setNewSchool] = useState({ name: "", city: "", board: "", email: "", plan: "" })

  const filtered = TENANTS.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.city.toLowerCase().includes(search.toLowerCase())
    const matchPlan = !planFilter || t.plan === planFilter
    const matchStatus = !statusFilter || t.status === statusFilter
    return matchSearch && matchPlan && matchStatus
  })

  const { sorted, sortField, sortDir, toggleSort } = useTableSort(filtered, {
    name: t => t.name,
    mrr: t => t.mrr,
    students: t => t.students,
    createdAt: t => t.createdAt,
  }, { field: "name", dir: "asc" })

  const totals = {
    total: TENANTS.length,
    active: TENANTS.filter(t => t.status === "active").length,
    trial: TENANTS.filter(t => t.status === "trial").length,
    suspended: TENANTS.filter(t => t.status === "suspended").length,
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Building2 size={20} />}
        title="Tenant Management"
        subtitle="All schools on EduFlow Scholaris platform"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm"><Download className="size-4" /> Export CSV</Button>
            <Button size="sm" onClick={() => setShowCreate(true)}><Plus className="size-4" /> Create New School</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard title="Total Schools" value={totals.total} subtitle="All tenants" icon={<Building2 className="size-5" />} sparkline={{ variant: "bar", data: [4, 5, 6, 6, 7, 8] }} />
        <KpiCard title="Active" value={totals.active} subtitle="Paying schools" icon={<CheckCircle2 className="size-5" />} iconClassName="bg-ef-green-light text-ef-green" sparkline={{ variant: "line", data: [3, 4, 4, 5, 5, 5], color: "var(--ef-green)" }} />
        <KpiCard title="On Trial" value={totals.trial} subtitle="Free trial" icon={<Clock className="size-5" />} iconClassName="bg-ef-amber-light text-ef-amber" sparkline={{ variant: "bar", data: [1, 2, 3, 2, 3, 2], color: "var(--ef-amber)" }} />
        <KpiCard title="Suspended" value={totals.suspended} subtitle={totals.suspended === 0 ? "None suspended" : `${totals.suspended} suspended`} icon={<XCircle className="size-5" />} iconClassName="bg-ef-red-light text-ef-red" sparkline={{ variant: "bar", data: [0, 0, 1, 0, 0, 0], color: "var(--ef-red)" }} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search schools, cities…" className="pl-9" />
            </div>
            <Select value={planFilter || "__all__"} onValueChange={v => setPlanFilter(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Plans" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Plans</SelectItem>
                <SelectItem value="Starter">Starter</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
                <SelectItem value="Annual">Annual</SelectItem>
                <SelectItem value="Trial">Trial</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter || "__all__"} onValueChange={v => setStatusFilter(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="grace">Grace Period</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" size="sm"><Filter className="size-3.5" /> Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Schools ({filtered.length})</CardTitle>
          <div className="flex gap-1">
            {planFilter && <Badge>{planFilter}</Badge>}
            {statusFilter && <Badge variant="warning">{statusFilter}</Badge>}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="text-sm">
            <caption className="sr-only">School tenants and their plan, status, and students</caption>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                <SortableHead field="name" label="School" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <TableHead className="text-xs">Board</TableHead>
                <TableHead className="text-xs">City</TableHead>
                <TableHead className="text-xs">Plan</TableHead>
                <SortableHead field="mrr" label="MRR" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <TableHead className="text-xs">Status</TableHead>
                <SortableHead field="createdAt" label="Trial / Since" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="students" label="Students" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <TableHead className="text-xs">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(t => {
                const sm = STATUS_META[t.status]
                const pm = PLAN_BADGE[t.plan]
                return (
                  <TableRow key={t.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-lg bg-ef-brand-light text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">{t.name.charAt(0)}</div>
                        <div>
                          <div className="font-semibold text-sm">{t.name}</div>
                          <div className="text-[11px] text-muted-foreground/70">{t.admin}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary">{t.board}</Badge></TableCell>
                    <TableCell><span className="flex items-center gap-1 text-sm text-muted-foreground"><MapPin className="size-3" /> {t.city}</span></TableCell>
                    <TableCell><Badge variant={pm.variant} className={pm.className}>{t.plan}</Badge></TableCell>
                    <TableCell><span className="font-mono text-sm font-semibold">{t.mrr > 0 ? `₹${t.mrr.toLocaleString("en-IN")}` : "—"}</span></TableCell>
                    <TableCell><Badge variant={sm.variant}>● {sm.label}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.trialExpiry ? <span className="flex items-center gap-1"><Calendar className="size-3" />{t.trialExpiry}</span> : <span className="text-muted-foreground/70">Since {t.createdAt}</span>}</TableCell>
                    <TableCell><span className="font-semibold text-sm">{t.students}</span> <span className="text-[11px] text-muted-foreground/70">students</span></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="xs" asChild><Link href="/super-admin/school"><Eye className="size-3" /> View</Link></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`More actions for ${t.name}`}><MoreHorizontal className="size-3.5" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Upgrade Plan</DropdownMenuItem>
                            <DropdownMenuItem>Downgrade Plan</DropdownMenuItem>
                            <DropdownMenuItem>Reset Password</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Suspend</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Showing {filtered.length} of {TENANTS.length} schools</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">Previous</Button>
              <Button variant="secondary" size="sm">Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New School</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="school-name">School Name</Label>
              <Input id="school-name" value={newSchool.name} onChange={e => setNewSchool(s => ({ ...s, name: e.target.value }))} placeholder="e.g. Holy Child English Academy" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="school-city">City</Label>
                <Input id="school-city" value={newSchool.city} onChange={e => setNewSchool(s => ({ ...s, city: e.target.value }))} placeholder="e.g. Howly" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Board</Label>
                <Select value={newSchool.board} onValueChange={v => setNewSchool(s => ({ ...s, board: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Board" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBSE">CBSE</SelectItem>
                    <SelectItem value="SEBA">SEBA</SelectItem>
                    <SelectItem value="ICSE">ICSE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="school-email">Admin Email</Label>
              <div className="relative">
                <Globe className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input id="school-email" value={newSchool.email} onChange={e => setNewSchool(s => ({ ...s, email: e.target.value }))} placeholder="admin@school.edu" type="email" className="pl-9" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Initial Plan</Label>
              <Select value={newSchool.plan} onValueChange={v => setNewSchool(s => ({ ...s, plan: v }))}>
                <SelectTrigger><SelectValue placeholder="Select Plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Free Trial (30 days)</SelectItem>
                  <SelectItem value="starter">Starter — ₹999/mo</SelectItem>
                  <SelectItem value="quarterly">Quarterly — ₹2,499/mo</SelectItem>
                  <SelectItem value="annual">Annual — ₹8,999/mo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-start p-3 bg-ef-brand-light rounded-lg text-xs text-primary">
              <Zap className="size-3.5 mt-0.5 flex-shrink-0" />
              An onboarding email with login credentials will be sent to the admin email automatically.
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button><Plus className="size-4" /> Create School</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
