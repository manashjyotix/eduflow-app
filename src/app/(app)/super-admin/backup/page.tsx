"use client"
import { useState } from "react"
import {
  HardDrive, Download, RotateCcw, Plus, Search, Filter,
  CheckCircle2, AlertTriangle, Building2, Database,
  FileArchive, Shield, Zap, RefreshCw, Eye, Trash2,
  CloudUpload, Package, Info,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"

interface Backup {
  id: string; schoolId: string; schoolName: string
  type: "full" | "settings" | "students" | "finance"
  size: string; status: "complete" | "failed" | "in_progress"
  createdAt: string; createdBy: string; encrypted: boolean
  notes?: string; version: string
}

const BACKUPS: Backup[] = [
  { id: "bkp-001", schoolId: "sch-1", schoolName: "Holy Child English Academy", type: "full", size: "2.4 MB", status: "complete", createdAt: "2026-06-04 02:00", createdBy: "Auto-Scheduler", encrypted: true, notes: "Nightly full backup", version: "3.1.2" },
  { id: "bkp-002", schoolId: "sch-2", schoolName: "Delhi Public School, Guwahati", type: "full", size: "18.7 MB", status: "complete", createdAt: "2026-06-04 02:15", createdBy: "Auto-Scheduler", encrypted: true, version: "3.1.2" },
  { id: "bkp-003", schoolId: "sch-1", schoolName: "Holy Child English Academy", type: "settings", size: "0.3 MB", status: "complete", createdAt: "2026-06-03 11:22", createdBy: "Super Admin", encrypted: false, notes: "Before proxy cap change", version: "3.1.1" },
  { id: "bkp-004", schoolId: "sch-4", schoolName: "Don Bosco Academy", type: "finance", size: "3.1 MB", status: "complete", createdAt: "2026-06-03 09:00", createdBy: "Auto-Scheduler", encrypted: true, version: "3.1.1" },
  { id: "bkp-005", schoolId: "sch-3", schoolName: "St. Xavier's High School", type: "full", size: "5.2 MB", status: "complete", createdAt: "2026-06-03 02:00", createdBy: "Auto-Scheduler", encrypted: true, version: "3.1.1" },
  { id: "bkp-006", schoolId: "sch-6", schoolName: "Bright Minds Academy", type: "full", size: "1.1 MB", status: "failed", createdAt: "2026-06-03 02:45", createdBy: "Auto-Scheduler", encrypted: false, notes: "Storage quota exceeded", version: "3.1.1" },
  { id: "bkp-007", schoolId: "sch-5", schoolName: "Kendriya Vidyalaya No. 1", type: "students", size: "8.9 MB", status: "complete", createdAt: "2026-06-02 14:00", createdBy: "Super Admin", encrypted: true, notes: "Pre-migration student data", version: "3.1.0" },
  { id: "bkp-008", schoolId: "sch-8", schoolName: "Mount Carmel Academy", type: "full", size: "6.3 MB", status: "complete", createdAt: "2026-06-02 02:00", createdBy: "Auto-Scheduler", encrypted: true, version: "3.1.0" },
  { id: "bkp-009", schoolId: "sch-2", schoolName: "Delhi Public School, Guwahati", type: "settings", size: "0.5 MB", status: "complete", createdAt: "2026-06-01 16:30", createdBy: "Super Admin", encrypted: false, notes: "Timetable reconfiguration", version: "3.1.0" },
  { id: "bkp-010", schoolId: "sch-1", schoolName: "Holy Child English Academy", type: "full", size: "2.3 MB", status: "complete", createdAt: "2026-06-01 02:00", createdBy: "Auto-Scheduler", encrypted: true, version: "3.0.9" },
  { id: "bkp-011", schoolId: "sch-7", schoolName: "Greenfield Public School", type: "full", size: "3.8 MB", status: "in_progress", createdAt: "2026-06-04 09:45", createdBy: "Super Admin", encrypted: true, notes: "Manual backup requested", version: "3.1.2" },
]

const TYPE_META: Record<Backup["type"], { label: string; className: string; icon: React.ReactNode }> = {
  full: { label: "Full Backup", className: "bg-ef-brand-light text-primary", icon: <Database className="size-3" /> },
  settings: { label: "Settings Only", className: "bg-ef-purple-light text-ef-purple", icon: <Package className="size-3" /> },
  students: { label: "Student Data", className: "bg-ef-green-light text-ef-green", icon: <Building2 className="size-3" /> },
  finance: { label: "Finance Data", className: "bg-ef-amber-light text-ef-amber", icon: <FileArchive className="size-3" /> },
}

const STATUS_META: Record<Backup["status"], { variant: "success" | "destructive" | "warning"; label: string }> = {
  complete: { variant: "success", label: "Complete" },
  failed: { variant: "destructive", label: "Failed" },
  in_progress: { variant: "warning", label: "In Progress" },
}

const SCHOOLS = [...new Set(BACKUPS.map(b => b.schoolName))]

export default function BackupRestorePage() {
  const [search, setSearch] = useState("")
  const [schoolFilter, setSchoolFilter] = useState("")
  const [typeFilter, setTypeFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [confirmRestore, setConfirmRestore] = useState<Backup | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Backup | null>(null)
  const [viewDetail, setViewDetail] = useState<Backup | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newBackup, setNewBackup] = useState<{ school: string; type: Backup["type"] }>({ school: "", type: "full" })
  const [restoring, setRestoring] = useState(false)
  const [backupProgress, setBackupProgress] = useState(0)

  const filtered = BACKUPS.filter(b => {
    const q = search.toLowerCase()
    return (!q || b.schoolName.toLowerCase().includes(q) || b.id.includes(q) || (b.notes || "").toLowerCase().includes(q)) &&
      (!schoolFilter || b.schoolName === schoolFilter) && (!typeFilter || b.type === typeFilter) && (!statusFilter || b.status === statusFilter)
  })

  const { sorted, sortField, sortDir, toggleSort } = useTableSort(filtered, {
    school: b => b.schoolName,
    size: b => parseFloat(b.size),
    created: b => b.createdAt,
  }, { field: "created", dir: "desc" })

  const stats = {
    total: BACKUPS.length,
    complete: BACKUPS.filter(b => b.status === "complete").length,
    failed: BACKUPS.filter(b => b.status === "failed").length,
    totalSize: "52.9 MB",
    lastBackup: "2026-06-04 02:15",
  }

  function handleRestore() {
    setRestoring(true)
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 20
      if (p >= 100) { p = 100; clearInterval(interval); setTimeout(() => { setRestoring(false); setConfirmRestore(null); setBackupProgress(0) }, 800) }
      setBackupProgress(Math.min(100, Math.round(p)))
    }, 300)
  }

  function handleCreateBackup() {
    setShowCreateDialog(false)
    setNewBackup({ school: "", type: "full" })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<HardDrive size={20} />}
        title="Backup & Restore"
        subtitle="Manage backups for all school tenants · Restore from any snapshot"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm"><Download className="size-4" /> Export Manifest</Button>
            <Button size="sm" onClick={() => setShowCreateDialog(true)}><Plus className="size-4" /> Create Backup</Button>
          </div>
        }
      />

      {stats.failed > 0 && (
        <Alert variant="warning">
          <AlertTriangle className="size-4" />
          <AlertTitle>{stats.failed} backup(s) failed</AlertTitle>
          <AlertDescription>Bright Minds Academy nightly backup failed due to storage quota. Consider upgrading storage or cleaning old snapshots.</AlertDescription>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard title="Total Backups" value={stats.total} subtitle="All snapshots" icon={<HardDrive className="size-5" />} sparkline={{ variant: "bar", data: [7, 8, 9, 9, 10, 11] }} />
        <KpiCard title="Successful" value={stats.complete} subtitle="Completed OK" icon={<CheckCircle2 className="size-5" />} iconClassName="bg-ef-green-light text-ef-green" sparkline={{ variant: "line", data: [6, 7, 8, 9, 9, 9], color: "var(--ef-green)" }} />
        <KpiCard title="Failed" value={stats.failed} subtitle={stats.failed > 0 ? "Needs attention" : "All clear"} icon={<AlertTriangle className="size-5" />} iconClassName={stats.failed > 0 ? "bg-ef-red-light text-ef-red" : "bg-ef-green-light text-ef-green"} sparkline={{ variant: "bar", data: [1, 0, 1, 0, 1, 1], color: stats.failed > 0 ? "var(--ef-red)" : "var(--ef-green)" }} />
        <KpiCard title="Total Storage Used" value={stats.totalSize} subtitle="AES-256 encrypted" icon={<CloudUpload className="size-5" />} iconClassName="bg-ef-purple-light text-ef-purple" sparkline={{ variant: "line", data: [38, 42, 44, 47, 50, 53], color: "var(--ef-purple)" }} />
      </div>

      {/* Schedule info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="size-9 rounded-lg bg-ef-green-light text-ef-green-dark flex items-center justify-center"><Shield className="size-4" /></div>
                <div>
                  <div className="text-sm font-bold">Auto-Backup: Enabled</div>
                  <div className="text-xs text-muted-foreground/70">Every night at 02:00 IST</div>
                </div>
              </div>
              <div className="hidden md:block h-9 w-px bg-border flex-shrink-0" />
              <div className="flex-shrink-0">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Last Backup</div>
                <div className="text-sm font-semibold">{stats.lastBackup}</div>
              </div>
              <div className="hidden md:block h-9 w-px bg-border flex-shrink-0" />
              <div className="flex-shrink-0">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Retention Period</div>
                <div className="text-sm font-semibold">30 days</div>
              </div>
              <div className="hidden md:block h-9 w-px bg-border flex-shrink-0" />
              <div className="flex-shrink-0">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground/70">Encryption</div>
                <div className="text-sm font-semibold text-ef-green-dark flex items-center gap-1"><Shield className="size-3" /> AES-256</div>
              </div>
            </div>
            <Button variant="secondary" size="sm"><RefreshCw className="size-4" /> Run All Backups Now</Button>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search school, backup ID, notes…" className="pl-9" />
            </div>
            <Select value={schoolFilter || "__all__"} onValueChange={v => setSchoolFilter(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-[170px]"><SelectValue placeholder="All Schools" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Schools</SelectItem>
                {SCHOOLS.map(s => <SelectItem key={s} value={s}>{s.length > 30 ? s.slice(0, 28) + "…" : s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={typeFilter || "__all__"} onValueChange={v => setTypeFilter(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Types</SelectItem>
                <SelectItem value="full">Full Backup</SelectItem>
                <SelectItem value="settings">Settings Only</SelectItem>
                <SelectItem value="students">Student Data</SelectItem>
                <SelectItem value="finance">Finance Data</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter || "__all__"} onValueChange={v => setStatusFilter(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Statuses</SelectItem>
                <SelectItem value="complete">Complete</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setSchoolFilter(""); setTypeFilter(""); setStatusFilter("") }}><Filter className="size-3.5" /> Clear</Button>
          </div>
        </CardContent>
      </Card>

      {/* Backup Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <span className="flex items-center gap-1.5 font-semibold"><Database className="size-4 text-muted-foreground" /> Backup Snapshots ({filtered.length})</span>
          <Badge variant="secondary">{filtered.length} results</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <caption className="sr-only">Backup snapshots</caption>
            <TableHeader>
              <TableRow>
                <TableHead>Backup ID</TableHead>
                <SortableHead field="school" label="School" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <TableHead>Type</TableHead>
                <SortableHead field="size" label="Size" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <TableHead>Status</TableHead>
                <SortableHead field="created" label="Created" sortField={sortField} sortDir={sortDir} onSort={toggleSort} />
                <TableHead>By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(b => {
                const tm = TYPE_META[b.type]
                const sm = STATUS_META[b.status]
                return (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs text-primary font-semibold">{b.id}</span>
                        {b.encrypted && <Shield className="size-3 text-ef-green-dark" />}
                      </div>
                      {b.notes && <div className="text-[11px] text-muted-foreground/70 mt-0.5 max-w-[160px] truncate">{b.notes}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm font-medium"><Building2 className="size-3 text-muted-foreground/70" /><span className="max-w-[180px] truncate">{b.schoolName}</span></div>
                      <div className="text-[11px] text-muted-foreground/70">v{b.version}</div>
                    </TableCell>
                    <TableCell><span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${tm.className}`}>{tm.icon}{tm.label}</span></TableCell>
                    <TableCell><span className="font-mono text-sm font-semibold">{b.size}</span></TableCell>
                    <TableCell>
                      <Badge variant={sm.variant}>● {sm.label}</Badge>
                      {b.status === "in_progress" && <Progress value={65} className="h-1.5 mt-1.5 w-24" />}
                    </TableCell>
                    <TableCell><span className="font-mono text-[11px] text-muted-foreground">{b.createdAt}</span></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        {b.createdBy === "Auto-Scheduler" ? <Zap className="size-3 text-ef-amber" /> : <Shield className="size-3 text-primary" />}{b.createdBy}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setViewDetail(b)} aria-label="View backup details"><Eye className="size-3.5" /></Button>
                        {b.status === "complete" && (
                          <>
                            <Button size="sm" onClick={() => setConfirmRestore(b)}><RotateCcw className="size-3.5" /> Restore</Button>
                            <Button variant="secondary" size="sm" aria-label="Download backup"><Download className="size-3.5" /></Button>
                          </>
                        )}
                        {b.status === "failed" && <Button variant="secondary" size="sm"><RefreshCw className="size-3.5" /> Retry</Button>}
                        <Button variant="ghost" size="sm" className="text-destructive" onClick={() => setConfirmDelete(b)} aria-label="Delete backup"><Trash2 className="size-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
          {filtered.length === 0 && (
            <div className="py-12 text-center">
              <Database className="size-9 text-muted-foreground/70 mx-auto mb-3" />
              <div className="text-[15px] font-semibold mb-1.5">No backups found</div>
              <div className="text-sm text-muted-foreground/70">Adjust your search or filter criteria.</div>
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-xs text-muted-foreground">Showing {filtered.length} of {BACKUPS.length} backups</span>
          <div className="flex gap-1.5">
            <Badge variant="success">● {stats.complete} complete</Badge>
            {stats.failed > 0 && <Badge variant="destructive">● {stats.failed} failed</Badge>}
          </div>
        </CardFooter>
      </Card>

      {/* Restore Dialog */}
      <Dialog open={!!confirmRestore} onOpenChange={v => !v && setConfirmRestore(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><RotateCcw className="size-[18px] text-ef-amber" /> Confirm Restore</DialogTitle></DialogHeader>
          {!restoring ? (
            <div className="flex flex-col gap-4">
              <Alert variant="warning">
                <AlertTriangle className="size-4" />
                <AlertTitle>This will overwrite current school data</AlertTitle>
                <AlertDescription>Restoring a backup replaces all current data for this school with the selected snapshot. This action cannot be undone.</AlertDescription>
              </Alert>
              {confirmRestore && (
                <div className="bg-muted rounded-lg px-4 py-4 flex flex-col gap-2">
                  {([
                    ["Backup ID", confirmRestore.id],
                    ["School", confirmRestore.schoolName],
                    ["Type", TYPE_META[confirmRestore.type].label],
                    ["Snapshot Date", confirmRestore.createdAt],
                    ["Size", confirmRestore.size],
                    ["Version", `v${confirmRestore.version}`],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-sm"><span className="text-muted-foreground/70">{k}</span><span className="font-semibold">{v}</span></div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-4 items-center py-4">
              <div className="text-sm font-semibold">Restoring backup…</div>
              <Progress value={backupProgress} className="h-1.5 w-full" />
              <div className="text-xs text-muted-foreground/70">{backupProgress}% complete</div>
            </div>
          )}
          {!restoring && (
            <DialogFooter>
              <Button variant="secondary" onClick={() => setConfirmRestore(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRestore}><RotateCcw className="size-4" /> Restore Now</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="size-[18px] text-primary" /> Create Manual Backup</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label>Select School</Label>
              <Select value={newBackup.school} onValueChange={v => setNewBackup(s => ({ ...s, school: v }))}>
                <SelectTrigger><SelectValue placeholder="Choose a school…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Schools (Bulk)</SelectItem>
                  {SCHOOLS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Backup Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(TYPE_META) as [Backup["type"], typeof TYPE_META[Backup["type"]]][]).map(([type, meta]) => (
                  <button key={type} onClick={() => setNewBackup(s => ({ ...s, type }))} className={`px-4 py-3 rounded-lg border-[1.5px] text-left transition-colors ${newBackup.type === type ? "border-primary bg-ef-brand-light" : "border-border bg-card"}`}>
                    <div className="flex items-center gap-1.5"><span className={`inline-flex items-center justify-center rounded ${meta.className} size-5`}>{meta.icon}</span><span className="text-xs font-bold">{meta.label}</span></div>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Notes (optional)</Label>
              <Input placeholder="e.g. Pre-migration snapshot…" />
            </div>
            <div className="flex items-center gap-2 p-3 bg-ef-brand-light rounded-lg text-xs text-primary"><Info className="size-3.5" /> Backup will be encrypted with AES-256 and stored securely.</div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateBackup}><CloudUpload className="size-4" /> Start Backup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={v => !v && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2 text-destructive"><Trash2 className="size-[18px]" /> Delete Backup</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <AlertTitle>Permanent deletion</AlertTitle>
              <AlertDescription>This backup snapshot will be permanently deleted and cannot be recovered.</AlertDescription>
            </Alert>
            {confirmDelete && <p className="text-sm text-muted-foreground">Are you sure you want to delete <strong className="text-foreground">{confirmDelete.id}</strong> ({confirmDelete.schoolName}, {confirmDelete.createdAt})?</p>}
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => setConfirmDelete(null)}><Trash2 className="size-4" /> Delete Permanently</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Detail Dialog */}
      <Dialog open={!!viewDetail} onOpenChange={v => !v && setViewDetail(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="size-[18px] text-primary" /> Backup Details</DialogTitle></DialogHeader>
          {viewDetail && (
            <div className="bg-muted rounded-lg p-4">
              {([
                ["Backup ID", viewDetail.id],
                ["School", viewDetail.schoolName],
                ["Type", TYPE_META[viewDetail.type].label],
                ["Status", STATUS_META[viewDetail.status].label],
                ["Size", viewDetail.size],
                ["App Version", `v${viewDetail.version}`],
                ["Created At", viewDetail.createdAt],
                ["Created By", viewDetail.createdBy],
                ["Encrypted", viewDetail.encrypted ? "Yes (AES-256)" : "No"],
                ["Notes", viewDetail.notes || "—"],
              ] as [string, string][]).map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-border last:border-0 text-sm"><span className="text-muted-foreground/70">{k}</span><span className="font-semibold">{v}</span></div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setViewDetail(null)}>Close</Button>
            {viewDetail?.status === "complete" && <Button onClick={() => { setConfirmRestore(viewDetail); setViewDetail(null) }}><RotateCcw className="size-4" /> Restore This</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
