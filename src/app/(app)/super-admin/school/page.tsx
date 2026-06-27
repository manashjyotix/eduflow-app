"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Building2, Eye, Users, GraduationCap, ArrowLeftRight, Shield,
  LogIn, Activity, AlertTriangle, BarChart3,
  MapPin, Mail, Globe,
  TrendingUp, HardDrive, Search,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

interface School {
  id: string; name: string; board: string; city: string; state: string
  plan: "Starter" | "Quarterly" | "Annual" | "Trial"
  status: "active" | "trial" | "suspended" | "grace"
  admin: string; phone: string; mrr: number; students: number; teachers: number
  activeProxies: number; pendingAbsences: number
  storageUsed: string; storageLimit: string; storagePercent: number
  lastActivity: string; joinedAt: string; uptime: number
  feesCollected: number; feePending: number
}

const SCHOOLS: School[] = [
  { id: "sch-1", name: "Holy Child English Academy", board: "SEBA", city: "Howly", state: "Assam", plan: "Starter", status: "active", admin: "admin@hcea.edu", phone: "+91 97060 12345", mrr: 999, students: 380, teachers: 10, activeProxies: 3, pendingAbsences: 2, storageUsed: "2.4 MB", storageLimit: "5 GB", storagePercent: 48, lastActivity: "5 min ago", joinedAt: "Jan 2025", uptime: 99.97, feesCollected: 4200000, feePending: 380000 },
  { id: "sch-2", name: "Delhi Public School, Guwahati", board: "CBSE", city: "Guwahati", state: "Assam", plan: "Annual", status: "active", admin: "principal@dpsg.edu", phone: "+91 98540 56789", mrr: 8999, students: 2400, teachers: 68, activeProxies: 12, pendingAbsences: 7, storageUsed: "18.7 MB", storageLimit: "50 GB", storagePercent: 37, lastActivity: "12 min ago", joinedAt: "Mar 2025", uptime: 100, feesCollected: 28000000, feePending: 1800000 },
  { id: "sch-3", name: "St. Xavier's High School", board: "CBSE", city: "Silchar", state: "Assam", plan: "Trial", status: "trial", admin: "admin@stxaviers.edu", phone: "+91 94360 23456", mrr: 0, students: 620, teachers: 18, activeProxies: 2, pendingAbsences: 1, storageUsed: "5.2 MB", storageLimit: "5 GB", storagePercent: 104, lastActivity: "1 hr ago", joinedAt: "May 2026", uptime: 99.8, feesCollected: 720000, feePending: 95000 },
  { id: "sch-4", name: "Don Bosco Academy", board: "CBSE", city: "Guwahati", state: "Assam", plan: "Quarterly", status: "active", admin: "admin@donbosco.edu", phone: "+91 99540 34567", mrr: 2499, students: 1100, teachers: 32, activeProxies: 5, pendingAbsences: 3, storageUsed: "9.1 MB", storageLimit: "20 GB", storagePercent: 46, lastActivity: "32 min ago", joinedAt: "Sep 2025", uptime: 99.9, feesCollected: 9800000, feePending: 640000 },
  { id: "sch-5", name: "Kendriya Vidyalaya No. 1", board: "CBSE", city: "Jorhat", state: "Assam", plan: "Annual", status: "active", admin: "kvj1@kv.edu", phone: "+91 97050 45678", mrr: 7499, students: 1800, teachers: 55, activeProxies: 9, pendingAbsences: 5, storageUsed: "14.3 MB", storageLimit: "50 GB", storagePercent: 29, lastActivity: "8 min ago", joinedAt: "Jun 2025", uptime: 100, feesCollected: 18600000, feePending: 920000 },
  { id: "sch-6", name: "Bright Minds Academy", board: "SEBA", city: "Barpeta", state: "Assam", plan: "Starter", status: "grace", admin: "admin@brightminds.edu", phone: "+91 96060 67890", mrr: 999, students: 220, teachers: 8, activeProxies: 0, pendingAbsences: 4, storageUsed: "4.9 MB", storageLimit: "5 GB", storagePercent: 98, lastActivity: "2 hr ago", joinedAt: "Nov 2025", uptime: 99.1, feesCollected: 1100000, feePending: 280000 },
]

const STATUS_META: Record<School["status"], { variant: "success" | "warning" | "destructive"; label: string }> = {
  active: { variant: "success", label: "Active" },
  trial: { variant: "warning", label: "Trial" },
  suspended: { variant: "destructive", label: "Suspended" },
  grace: { variant: "destructive", label: "Grace Period" },
}

export default function SchoolDrilldownPage() {
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selected, setSelected] = useState<School | null>(null)
  const [confirmLogin, setConfirmLogin] = useState<School | null>(null)

  const filtered = SCHOOLS.filter(s => {
    const q = search.toLowerCase()
    return (!q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.admin.toLowerCase().includes(q)) && (!statusFilter || s.status === statusFilter)
  })

  function startGhostSession(school: School) {
    setConfirmLogin(null)
    router.push(`/admin/dashboard?impersonating=${school.id}`)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader icon={<Eye size={20} />} title="School Access & Impersonation" subtitle="Monitor any school · Impersonate admin · Fix issues in real time" />

      <Alert variant="warning">
        <Shield className="size-4" />
        <AlertTitle>Ghost sessions are fully logged</AlertTitle>
        <AlertDescription>All impersonation sessions are audit-logged with timestamp, actions performed, and session duration. Only use for support and emergency fixes.</AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search school, city, admin email…" className="pl-9" />
            </div>
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
          </div>
        </CardContent>
      </Card>

      {/* Schools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(school => {
          const sm = STATUS_META[school.status]
          return (
            <Card key={school.id} className="cursor-pointer" onClick={() => setSelected(selected?.id === school.id ? null : school)}>
              <CardHeader className="flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="size-9 rounded-lg bg-ef-brand-light text-primary flex items-center justify-center font-bold text-sm flex-shrink-0">{school.name.charAt(0)}</div>
                  <div className="min-w-0">
                    <div className="text-sm font-bold truncate">{school.name}</div>
                    <div className="text-[11px] text-muted-foreground/70 flex items-center gap-1"><MapPin className="size-2.5" />{school.city}, {school.state}</div>
                  </div>
                </div>
                <Badge variant={sm.variant}>● {sm.label}</Badge>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3 mb-4">
                  {[
                    { label: "Students", value: school.students, icon: Users, color: "text-primary" },
                    { label: "Teachers", value: school.teachers, icon: GraduationCap, color: "text-ef-green" },
                    { label: "Proxies", value: school.activeProxies, icon: ArrowLeftRight, color: "text-ef-amber" },
                  ].map(m => (
                    <div key={m.label} className="text-center py-2 px-1.5 rounded-lg bg-muted">
                      <m.icon className={`size-3 mx-auto mb-0.5 ${m.color}`} />
                      <div className="text-base font-extrabold">{m.value}</div>
                      <div className="text-[10px] text-muted-foreground/70">{m.label}</div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground/70 flex items-center gap-1"><Mail className="size-3" />Admin</span><span className="text-primary font-medium">{school.admin}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground/70 flex items-center gap-1"><Activity className="size-3" />Last Active</span><span className="font-medium">{school.lastActivity}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground/70 flex items-center gap-1"><TrendingUp className="size-3" />Uptime</span><span className={`font-semibold ${school.uptime >= 99.9 ? "text-ef-green-dark" : "text-ef-amber"}`}>{school.uptime}%</span></div>
                  <div className="flex justify-between text-xs"><span className="text-muted-foreground/70 flex items-center gap-1"><HardDrive className="size-3" />Storage</span><span className={`font-semibold ${school.storagePercent > 90 ? "text-ef-red" : ""}`}>{school.storageUsed} / {school.storageLimit}</span></div>
                </div>
                <Progress value={Math.min(100, school.storagePercent)} className={`h-1.5 mt-2.5 ${school.storagePercent > 90 ? "[&>div]:bg-destructive" : ""}`} />
                <div className="flex gap-2 mt-3.5">
                  <Button size="sm" className="flex-1" onClick={e => { e.stopPropagation(); setConfirmLogin(school) }}><LogIn className="size-3.5" /> Ghost Login</Button>
                  <Button variant="secondary" size="sm" onClick={e => { e.stopPropagation(); setSelected(school) }}><BarChart3 className="size-3.5" /> Details</Button>
                </div>
                {school.pendingAbsences > 0 && (
                  <div className="mt-2 px-2.5 py-1.5 bg-ef-amber-light rounded-md text-xs text-ef-amber-dark flex items-center gap-1.5"><AlertTriangle className="size-3" />{school.pendingAbsences} pending absence{school.pendingAbsences > 1 ? "s" : ""} need attention</div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <Card className="border-primary">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold"><Building2 className="size-4 text-primary" /> {selected.name} — Full Details</CardTitle>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setConfirmLogin(selected)}><LogIn className="size-3.5" /> Ghost Login</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Close</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {([
                ["School ID", selected.id],
                ["Board", selected.board],
                ["City/State", `${selected.city}, ${selected.state}`],
                ["Plan", selected.plan],
                ["MRR", selected.mrr > 0 ? `₹${selected.mrr.toLocaleString("en-IN")}` : "—"],
                ["Students", selected.students.toString()],
                ["Teachers", selected.teachers.toString()],
                ["Active Proxies", selected.activeProxies.toString()],
                ["Phone", selected.phone],
                ["Admin Email", selected.admin],
                ["Storage", `${selected.storageUsed} / ${selected.storageLimit}`],
                ["Joined", selected.joinedAt],
                ["Uptime", `${selected.uptime}%`],
                ["Last Activity", selected.lastActivity],
                ["Fee Collected", `₹${(selected.feesCollected / 100000).toFixed(1)}L`],
                ["Fee Pending", `₹${(selected.feePending / 100000).toFixed(1)}L`],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="bg-muted rounded-lg px-3.5 py-2.5">
                  <div className="text-[11px] text-muted-foreground/70 mb-1">{k}</div>
                  <div className="text-sm font-semibold">{v}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ghost Login confirm dialog */}
      <Dialog open={!!confirmLogin} onOpenChange={v => !v && setConfirmLogin(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="size-[18px] text-ef-purple" /> Confirm Ghost Login</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <Alert variant="warning">
              <AlertTriangle className="size-4" />
              <AlertTitle>Ghost session will be logged</AlertTitle>
              <AlertDescription>This session is fully audit-logged. You will see the school exactly as the admin sees it. Any changes you make are real.</AlertDescription>
            </Alert>
            {confirmLogin && (
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="size-11 rounded-xl text-white flex items-center justify-center text-lg font-extrabold bg-gradient-to-br from-[#7C3AED]/60 to-[#7C3AED]">{confirmLogin.name.charAt(0)}</div>
                  <div>
                    <div className="text-[15px] font-bold">{confirmLogin.name}</div>
                    <div className="text-xs text-muted-foreground/70 flex items-center gap-1"><Globe className="size-3" />{confirmLogin.admin}</div>
                  </div>
                </div>
                <div className="flex gap-6 text-xs">
                  <div><div className="text-muted-foreground/70">Status</div><div className="font-semibold">{STATUS_META[confirmLogin.status].label}</div></div>
                  <div><div className="text-muted-foreground/70">Plan</div><div className="font-semibold">{confirmLogin.plan}</div></div>
                  <div><div className="text-muted-foreground/70">Last Active</div><div className="font-semibold">{confirmLogin.lastActivity}</div></div>
                </div>
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label>Reason for access (required)</Label>
              <Input placeholder="e.g. Customer support, emergency fix, data audit…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmLogin(null)}>Cancel</Button>
            <Button className="bg-ef-purple hover:bg-ef-purple/90" onClick={() => confirmLogin && startGhostSession(confirmLogin)}><LogIn className="size-4" /> Start Ghost Session</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
