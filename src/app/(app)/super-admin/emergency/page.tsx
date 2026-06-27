"use client"
import { useState } from "react"
import { toast } from "sonner"
import {
  Zap, AlertTriangle, RefreshCw, Unlock, Bell, Building2,
  Power, Download, Wrench, CheckCircle2, Terminal, Megaphone, ChevronRight,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

const SCHOOLS = [
  { id: "sch-1", name: "Holy Child English Academy", status: "active" },
  { id: "sch-2", name: "Delhi Public School, Guwahati", status: "active" },
  { id: "sch-3", name: "St. Xavier's High School", status: "trial" },
  { id: "sch-4", name: "Don Bosco Academy", status: "active" },
  { id: "sch-5", name: "Kendriya Vidyalaya No. 1", status: "active" },
  { id: "sch-6", name: "Bright Minds Academy", status: "grace" },
]

const ACTION_LOG = [
  { ts: "2026-06-04 09:45", actor: "Super Admin", school: "All Schools", action: "Cache Flush", outcome: "success", detail: "Global cache cleared — 847 entries purged" },
  { ts: "2026-06-03 14:05", actor: "Super Admin", school: "DPS Delhi", action: "Force Proxy Re-Assign", outcome: "success", detail: "4 duplicate proxy assignments fixed" },
  { ts: "2026-06-03 09:22", actor: "Super Admin", school: "Bright Minds", action: "Storage Cleanup", outcome: "success", detail: "Freed 1.2 GB of orphaned media files" },
  { ts: "2026-06-02 16:30", actor: "Super Admin", school: "HCEA", action: "Reset Admin Password", outcome: "success", detail: "Admin locked out — password reset sent" },
  { ts: "2026-06-01 11:00", actor: "Super Admin", school: "All Schools", action: "Maintenance Window", outcome: "complete", detail: "Scheduled 2-hour maintenance — 0 complaints" },
]

interface ConfirmAction {
  label: string; detail: string; school?: string; risk: "low" | "medium" | "high"
}

const QUICK_ACTIONS: { group: string; actions: ConfirmAction[] }[] = [
  {
    group: "Data & Cache",
    actions: [
      { label: "Flush Global Cache", detail: "Clears all Redis/in-memory caches across the platform. Temporary slowdown expected.", risk: "low" },
      { label: "Rebuild Search Index", detail: "Re-indexes all school data for search. May take 2–5 minutes.", risk: "low" },
      { label: "Clear Orphaned Sessions", detail: "Removes expired/zombie user sessions from the database.", risk: "low" },
      { label: "Sync Payment Ledger", detail: "Force-reconciles all Razorpay transactions against the billing database.", risk: "medium" },
      { label: "Repair Proxy Assignments", detail: "Detects and fixes duplicate, missing, or conflicting proxy records for all schools.", risk: "medium" },
      { label: "Fix Orphaned Records", detail: "Scans and repairs broken foreign key relationships in the database.", risk: "medium" },
    ],
  },
  {
    group: "School-Specific",
    actions: [
      { label: "Reset School Admin Password", detail: "Sends a password reset email to the selected school admin.", risk: "medium", school: "required" },
      { label: "Unlock Suspended School", detail: "Removes suspension flag and restores full access immediately.", risk: "medium", school: "required" },
      { label: "Extend Trial by 14 Days", detail: "Adds 14 days to the trial expiry for the selected school.", risk: "low", school: "required" },
      { label: "Force Full Data Export", detail: "Generates a full ZIP export of all school data for manual recovery.", risk: "low", school: "required" },
      { label: "Clear School Cache", detail: "Purges only the selected school's cache entries.", risk: "low", school: "required" },
      { label: "Deactivate School (Emergency)", detail: "Immediately suspends school access. Use only if there is a data breach or legal reason.", risk: "high", school: "required" },
    ],
  },
  {
    group: "Platform Control",
    actions: [
      { label: "Force Background Jobs Restart", detail: "Restarts all queue workers and cron schedulers.", risk: "medium" },
      { label: "Disable AI Auto-Assign (Global)", detail: "Turns off AI proxy assignment for all schools temporarily.", risk: "medium" },
      { label: "Emergency Maintenance Mode", detail: "Takes the entire platform offline. Shows maintenance page to all users.", risk: "high" },
      { label: "Roll Back Last Deployment", detail: "Reverts the production environment to the previous build version.", risk: "high" },
      { label: "Purge All Trial Schools", detail: "Permanently deletes all expired trial schools with no conversion.", risk: "high" },
    ],
  },
]

const riskDot: Record<ConfirmAction["risk"], string> = {
  low: "bg-ef-green", medium: "bg-ef-amber", high: "bg-ef-red",
}

const AUDIENCES = ["All Schools", "Active Only", "Trial Schools", "Specific School", "Admins Only", "Teachers Only"]
const MSG_TYPES = [
  { type: "info", className: "border-primary bg-ef-brand-light text-primary", label: "Info" },
  { type: "warning", className: "border-ef-amber bg-ef-amber-light text-ef-amber-dark", label: "Warning" },
  { type: "maintenance", className: "border-ef-purple bg-ef-purple-light text-ef-purple", label: "Maintenance" },
  { type: "urgent", className: "border-ef-red bg-ef-red-light text-ef-red", label: "Urgent" },
]

export default function EmergencyConsolePage() {
  const [selectedSchool, setSelectedSchool] = useState("")
  const [confirm, setConfirm] = useState<ConfirmAction | null>(null)
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [completedActions, setCompletedActions] = useState<string[]>([])
  const [broadcastMsg, setBroadcastMsg] = useState("")
  const [broadcastTitle, setBroadcastTitle] = useState("")
  const [audience, setAudience] = useState("All Schools")
  const [msgType, setMsgType] = useState("info")
  const [confirmText, setConfirmText] = useState("")
  const [maintenanceActive, setMaintenanceActive] = useState(false)
  const [activeTab, setActiveTab] = useState("quick-actions")

  const { sorted: sortedLog, sortField: logSortField, sortDir: logSortDir, toggleSort: logToggleSort } = useTableSort(ACTION_LOG, {
    ts: l => l.ts,
    actor: l => l.actor,
    school: l => l.school,
    action: l => l.action,
    outcome: l => l.outcome,
  }, { field: "ts", dir: "desc" })

  function runAction(action: ConfirmAction) {
    setConfirm(null)
    setConfirmText("")
    setRunning(true)
    setProgress(0)
    let p = 0
    const interval = setInterval(() => {
      p += Math.random() * 25 + 5
      if (p >= 100) {
        p = 100; clearInterval(interval)
        setTimeout(() => {
          setRunning(false)
          setCompletedActions(prev => [action.label, ...prev])
          toast[action.risk === "high" ? "error" : "success"](`Executed: ${action.label}`, {
            description: action.risk === "high" ? "High-risk action completed and logged." : "Action completed successfully.",
          })
          if (action.label === "Emergency Maintenance Mode") setMaintenanceActive(true)
        }, 500)
      }
      setProgress(Math.min(100, Math.round(p)))
    }, 250)
  }

  function canExecute() {
    return confirmText.trim().toUpperCase() === "CONFIRM"
  }

  function sendBroadcast() {
    if (!broadcastMsg.trim()) return
    toast.success("Broadcast sent", {
      description: `“${broadcastTitle || broadcastMsg.slice(0, 30)}…” → ${audience}.`,
    })
    setBroadcastMsg(""); setBroadcastTitle("")
  }

  function endMaintenance() {
    setMaintenanceActive(false)
    toast.success("Maintenance ended", { description: "All schools back online." })
  }

  function exportLog() {
    const rows = [["Timestamp", "Actor", "School", "Action", "Outcome", "Detail"],
      ...ACTION_LOG.map(l => [l.ts, l.actor, l.school, l.action, l.outcome, l.detail])]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url; a.download = "emergency-action-log.csv"; a.click()
    URL.revokeObjectURL(url)
    toast.success("Action log exported", { description: `${ACTION_LOG.length} entries.` })
  }

  const selectedSchoolObj = SCHOOLS.find(s => s.id === selectedSchool)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Zap size={20} />}
        title="Emergency Console"
        subtitle="Emergency fix actions, maintenance mode, broadcasts, and platform controls"
        actions={<Badge variant="destructive">Super Admin Only</Badge>}
      />

      <Alert variant="destructive">
        <AlertTriangle className="size-4" />
        <AlertTitle>High-risk zone</AlertTitle>
        <AlertDescription>Actions in this console directly affect production data. Every action is logged. Use with extreme caution.</AlertDescription>
      </Alert>

      {maintenanceActive && (
        <div className="rounded-xl px-5 py-4 flex items-center gap-3 text-white bg-gradient-to-br from-[#DC2626] to-[#B91C1C]">
          <Power className="size-5" />
          <div className="flex-1">
            <div className="font-bold">MAINTENANCE MODE ACTIVE</div>
            <div className="text-xs opacity-85">All schools see the maintenance page. Started: 09:45 IST. Estimated end: 10:45 IST.</div>
          </div>
          <Button variant="secondary" size="sm" className="bg-white/20 text-white border-0 hover:bg-white/30" onClick={endMaintenance}><Unlock className="size-3.5" /> End Maintenance</Button>
        </div>
      )}

      {running && (
        <div className="bg-ef-amber-light rounded-lg px-5 py-4 border border-ef-amber">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="size-4 text-ef-amber animate-spin" />
            <span className="text-sm font-semibold text-ef-amber-dark">Action in progress…</span>
          </div>
          <Progress value={progress} className="h-1.5 [&>div]:bg-ef-amber" />
          <div className="text-xs text-muted-foreground/70 mt-1.5">{progress}% complete</div>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
          <TabsTrigger value="broadcast">Broadcast</TabsTrigger>
          <TabsTrigger value="action-log">Action Log</TabsTrigger>
        </TabsList>

        <TabsContent value="quick-actions" className="flex flex-col gap-4">
          <Card>
            <CardContent className="p-4 flex flex-wrap gap-3 items-center">
              <Building2 className="size-4 text-muted-foreground/70 flex-shrink-0" />
              <span className="text-sm text-muted-foreground flex-shrink-0">Target School (for school-specific actions):</span>
              <div className="flex-1 max-w-[300px] min-w-[200px]">
                <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                  <SelectTrigger><SelectValue placeholder="Select a school…" /></SelectTrigger>
                  <SelectContent>{SCHOOLS.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {selectedSchoolObj && <Badge variant={selectedSchoolObj.status === "active" ? "success" : "warning"}>● {selectedSchoolObj.status}</Badge>}
            </CardContent>
          </Card>

          {QUICK_ACTIONS.map(group => (
            <div key={group.group}>
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/70 mb-2.5">{group.group}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {group.actions.map(action => {
                  const needsSchool = action.school === "required"
                  const isCompleted = completedActions.includes(action.label)
                  const disabled = running || (needsSchool && !selectedSchool) || isCompleted
                  return (
                    <button key={action.label} disabled={disabled} onClick={() => setConfirm(action)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-[1.5px] text-left transition-colors disabled:cursor-not-allowed ${isCompleted ? "bg-ef-green-light border-ef-green" : "bg-card border-border hover:bg-muted/40"} ${needsSchool && !selectedSchool ? "opacity-50" : ""}`}>
                      <div className={`size-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isCompleted ? "bg-ef-green-light text-ef-green-dark" : "bg-muted text-muted-foreground"}`}>
                        {isCompleted ? <CheckCircle2 className="size-4" /> : <Wrench className="size-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold truncate ${isCompleted ? "text-ef-green-dark" : ""}`}>{action.label}</div>
                        <div className="text-[11px] text-muted-foreground/70 truncate">{action.detail.slice(0, 60)}…</div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <span className={`size-1.5 rounded-full ${riskDot[action.risk]}`} aria-hidden="true" />
                        <ChevronRight className="size-3.5 text-muted-foreground/70" />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          ))}

          {completedActions.length > 0 && (
            <div className="px-4 py-3 bg-ef-green-light rounded-lg flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-ef-green-dark" />
              <span className="text-ef-green-dark font-semibold flex-1">{completedActions.length} action{completedActions.length > 1 ? "s" : ""} completed this session: {completedActions.join(", ")}</span>
              <Button variant="ghost" size="sm" onClick={() => setCompletedActions([])}>Clear</Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="broadcast">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-1.5 text-base font-semibold"><Megaphone className="size-4 text-primary" /> Send Platform Broadcast</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Alert variant="warning">
                <AlertTriangle className="size-4" />
                <AlertTitle>Sends to all users</AlertTitle>
                <AlertDescription>This notification goes to all admins, teachers, and users across all active schools.</AlertDescription>
              </Alert>
              <div className="flex flex-col gap-1.5">
                <Label>Target Audience</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {AUDIENCES.map(t => (
                    <button key={t} onClick={() => setAudience(t)} className={`px-3 py-2 rounded-lg border-[1.5px] text-xs font-medium transition-colors ${audience === t ? "border-primary bg-ef-brand-light text-primary" : "border-border bg-card hover:border-primary hover:bg-ef-brand-light text-muted-foreground"}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Message Type</Label>
                <div className="flex gap-2 flex-wrap">
                  {MSG_TYPES.map(t => <button key={t.type} onClick={() => setMsgType(t.type)} className={`px-4 py-1.5 rounded-lg border-[1.5px] text-xs font-semibold transition-all ${msgType === t.type ? t.className + " ring-2 ring-offset-1 ring-offset-background ring-primary/40" : "border-border bg-card text-muted-foreground"}`}>{t.label}</button>)}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Title</Label>
                <Input placeholder="e.g. Scheduled maintenance tonight…" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Message</Label>
                <Textarea value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} placeholder="Type your broadcast message here…" rows={4} maxLength={500} />
                <div className="text-[11px] text-muted-foreground/70 text-right">{broadcastMsg.length}/500</div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => toast("Preview", { description: broadcastMsg || "Nothing to preview yet." })}><Bell className="size-4" /> Preview</Button>
                <Button disabled={!broadcastMsg.trim()} onClick={sendBroadcast}><Megaphone className="size-4" /> Send to All Schools</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="action-log">
          <Card>
            <CardHeader className="flex-row items-center justify-between pb-3">
              <CardTitle className="flex items-center gap-1.5 text-base font-semibold"><Terminal className="size-4 text-muted-foreground" /> Emergency Action Log</CardTitle>
              <Button variant="secondary" size="sm" onClick={exportLog}><Download className="size-3.5" /> Export</Button>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="text-sm">
                <caption className="sr-only">Emergency action log</caption>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-transparent">
                    <SortableHead field="ts" label="Timestamp" sortField={logSortField} sortDir={logSortDir} onSort={logToggleSort} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 whitespace-nowrap h-auto" />
                    <SortableHead field="actor" label="Actor" sortField={logSortField} sortDir={logSortDir} onSort={logToggleSort} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 whitespace-nowrap h-auto" />
                    <SortableHead field="school" label="School" sortField={logSortField} sortDir={logSortDir} onSort={logToggleSort} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 whitespace-nowrap h-auto" />
                    <SortableHead field="action" label="Action" sortField={logSortField} sortDir={logSortDir} onSort={logToggleSort} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 whitespace-nowrap h-auto" />
                    <SortableHead field="outcome" label="Outcome" sortField={logSortField} sortDir={logSortDir} onSort={logToggleSort} className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 whitespace-nowrap h-auto" />
                    <TableHead className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70 whitespace-nowrap h-auto">Detail</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedLog.map((log, i) => (
                    <TableRow key={i} className="hover:bg-muted/30">
                      <TableCell className="px-4 py-3 font-mono text-[11px] text-muted-foreground whitespace-nowrap">{log.ts}</TableCell>
                      <TableCell className="px-4 py-3 text-sm font-semibold text-primary">{log.actor}</TableCell>
                      <TableCell className="px-4 py-3"><Badge variant={log.school === "All Schools" ? "default" : "secondary"}>{log.school}</Badge></TableCell>
                      <TableCell className="px-4 py-3 text-sm font-semibold">{log.action}</TableCell>
                      <TableCell className="px-4 py-3"><Badge variant={log.outcome === "success" || log.outcome === "complete" ? "success" : "destructive"}>● {log.outcome}</Badge></TableCell>
                      <TableCell className="px-4 py-3 text-xs text-muted-foreground max-w-[240px] truncate">{log.detail}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Confirm Dialog */}
      <Dialog open={!!confirm} onOpenChange={v => !v && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirm?.risk === "high" ? <AlertTriangle className="size-[18px] text-ef-red" /> : <Wrench className="size-[18px] text-ef-amber" />}
              Confirm: {confirm?.label}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Alert variant={confirm?.risk === "high" ? "destructive" : confirm?.risk === "medium" ? "warning" : "default"}>
              <AlertTriangle className="size-4" />
              <AlertTitle>Risk: {confirm?.risk?.toUpperCase()}</AlertTitle>
              <AlertDescription>{confirm?.detail}</AlertDescription>
            </Alert>
            {confirm?.school === "required" && (
              <div className="p-3 bg-ef-brand-light rounded-lg text-sm text-primary">Targeting: <strong>{selectedSchoolObj?.name || "None selected"}</strong></div>
            )}
            <div className="flex flex-col gap-1.5">
              <Label>Type &quot;CONFIRM&quot; to proceed</Label>
              <Input placeholder="Type CONFIRM…" value={confirmText} onChange={e => setConfirmText(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => { setConfirm(null); setConfirmText("") }}>Cancel</Button>
            <Button variant={confirm?.risk === "high" ? "destructive" : "default"} disabled={!canExecute()} onClick={() => confirm && runAction(confirm)}><Zap className="size-4" /> Execute Action</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
