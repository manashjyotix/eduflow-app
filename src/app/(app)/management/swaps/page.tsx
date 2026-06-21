"use client"
import { useState, useMemo } from "react"
import {
  CheckCircle2, XCircle, Clock, ArrowLeftRight,
  RefreshCw, AlertTriangle, Calendar, Pencil,
  Search, Filter, History, Eye, RotateCcw,
  MessageSquare, User, BookOpen, Hash,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

type SwapStatus = "pending" | "approved" | "rejected" | "expired"

interface SwapRequest {
  id: string; date: string
  teacherA: string; subjectA: string; periodA: string; classA: string; timeA: string
  teacherB: string; subjectB: string; periodB: string; classB: string; timeB: string
  reason: string; submittedAt: string; expiresIn: string | null
  bothConfirmed: boolean; status: SwapStatus
  resolvedAt?: string; rejectionNote?: string; resolvedBy?: string
}

const INITIAL_SWAPS: SwapRequest[] = [
  { id: "SW-001", date: "5 Jun 2026", teacherA: "Priya Sharma", subjectA: "Mathematics", periodA: "P2", classA: "VIII-A", timeA: "10:10–10:50", teacherB: "Rajesh Kalita", subjectB: "Science", periodB: "P3", classB: "VIII-A", timeB: "10:50–11:30", reason: "External training session conflicts with P2 for Priya", submittedAt: "8:30 AM, 5 Jun 2026", expiresIn: "2h 15m", bothConfirmed: true, status: "pending" },
  { id: "SW-002", date: "5 Jun 2026", teacherA: "Sunita Borah", subjectA: "Chemistry", periodA: "P4", classA: "X-A", timeA: "11:30–12:10", teacherB: "Meena Gogoi", subjectB: "Geography", periodB: "P6", classB: "IX-A", timeB: "1:10–1:50", reason: "Sunita has lab prep; Meena free in P4", submittedAt: "7:55 AM, 5 Jun 2026", expiresIn: "4h 50m", bothConfirmed: false, status: "pending" },
  { id: "SW-003", date: "4 Jun 2026", teacherA: "Biju Das", subjectA: "History", periodA: "P5", classA: "VII-B", timeA: "12:30–1:10", teacherB: "Himanta Bezbaruah", subjectB: "Computer", periodB: "P7", classB: "VII-A", timeB: "1:50–2:30", reason: "Both teachers mutually agreed to swap for convenience", submittedAt: "9:10 AM, 4 Jun 2026", expiresIn: null, bothConfirmed: true, status: "approved", resolvedAt: "10:00 AM, 4 Jun 2026", resolvedBy: "Management Office" },
  { id: "SW-004", date: "4 Jun 2026", teacherA: "Anita Devi", subjectA: "English", periodA: "P1", classA: "VI-B", timeA: "9:30–10:10", teacherB: "Dipak Baruah", subjectB: "Assamese", periodB: "P2", classB: "VI-A", timeB: "10:10–10:50", reason: "Anita needs to attend staff meeting during P1", submittedAt: "8:00 AM, 4 Jun 2026", expiresIn: null, bothConfirmed: true, status: "rejected", resolvedAt: "8:45 AM, 4 Jun 2026", resolvedBy: "Management Office", rejectionNote: "Dipak already assigned as proxy for Class IX-B in P2. Conflict detected." },
  { id: "SW-005", date: "3 Jun 2026", teacherA: "Rima Das", subjectA: "Biology", periodA: "P3", classA: "X-B", timeA: "10:50–11:30", teacherB: "Kamal Nath", subjectB: "Physics", periodB: "P6", classB: "IX-B", timeB: "1:10–1:50", reason: "Personal appointment during P3", submittedAt: "6:30 PM, 2 Jun 2026", expiresIn: null, bothConfirmed: false, status: "expired", resolvedAt: "6 hours after submission" },
]

const STATUS_CFG: Record<SwapStatus, { badge: "success" | "destructive" | "warning" | "secondary"; label: string; leftBorder: string }> = {
  pending:  { badge: "warning",     label: "Pending",  leftBorder: "border-l-ef-amber" },
  approved: { badge: "success",     label: "Approved", leftBorder: "border-l-ef-green" },
  rejected: { badge: "destructive", label: "Rejected", leftBorder: "border-l-ef-red" },
  expired:  { badge: "secondary",   label: "Expired",  leftBorder: "border-l-border" },
}

function Initial({ name, className = "" }: { name: string; className?: string }) {
  return <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${className}`}>{name.charAt(0)}</div>
}

type ResolveState = { status: SwapStatus; note?: string; resolvedAt?: string; resolvedBy?: string }

export default function SwapApprovalsPage() {
  const [swapStates, setSwapStates] = useState<Record<string, ResolveState>>({
    "SW-003": { status: "approved", resolvedAt: "10:00 AM, 4 Jun 2026", resolvedBy: "Management Office" },
    "SW-004": { status: "rejected", note: "Dipak already assigned as proxy for Class IX-B in P2. Conflict detected.", resolvedAt: "8:45 AM, 4 Jun 2026", resolvedBy: "Management Office" },
    "SW-005": { status: "expired",  resolvedAt: "6 hours after submission" },
  })

  const [approveId, setApproveId] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")

  const [statusFilter, setStatusFilter] = useState("all")
  const [teacherFilter, setTeacherFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  const allSwaps: SwapRequest[] = INITIAL_SWAPS.map(s => {
    const st = swapStates[s.id]
    if (!st) return s
    return { ...s, status: st.status, rejectionNote: st.note ?? s.rejectionNote, resolvedAt: st.resolvedAt ?? s.resolvedAt, resolvedBy: st.resolvedBy ?? s.resolvedBy }
  })

  const teachers = useMemo(() => {
    const names = new Set<string>()
    allSwaps.forEach(s => { names.add(s.teacherA); names.add(s.teacherB) })
    return Array.from(names).sort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const dates = useMemo(() => Array.from(new Set(allSwaps.map(s => s.date))).sort().reverse(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [])

  const filtered = allSwaps.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false
    if (teacherFilter !== "all" && s.teacherA !== teacherFilter && s.teacherB !== teacherFilter) return false
    if (dateFilter !== "all" && s.date !== dateFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return [s.id, s.teacherA, s.teacherB, s.subjectA, s.subjectB, s.reason].some(v => v.toLowerCase().includes(q))
    }
    return true
  })

  const counts = {
    all: allSwaps.length,
    pending: allSwaps.filter(s => s.status === "pending").length,
    approved: allSwaps.filter(s => s.status === "approved").length,
    rejected: allSwaps.filter(s => s.status === "rejected").length,
    expired: allSwaps.filter(s => s.status === "expired").length,
  }

  const activeSwap = allSwaps.find(s => s.id === approveId || s.id === rejectId)
  const detailSwap = allSwaps.find(s => s.id === detailId)
  const pendingCount = counts.pending

  function nowLabel() {
    return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + ", Today"
  }
  function handleApprove(id: string) {
    setSwapStates(p => ({ ...p, [id]: { status: "approved", resolvedAt: nowLabel(), resolvedBy: "Management Office" } }))
    setApproveId(null)
  }
  function handleReject(id: string) {
    setSwapStates(p => ({ ...p, [id]: { status: "rejected", note: rejectNote, resolvedAt: nowLabel(), resolvedBy: "Management Office" } }))
    setRejectId(null); setRejectNote("")
  }
  function handleResetToPending(id: string) {
    setSwapStates(p => { const next = { ...p }; delete next[id]; return next })
  }

  const KPIS = [
    { label: "Total",    key: "all",      value: counts.all,      icon: Hash,        chip: "bg-primary/10 text-primary" },
    { label: "Pending",  key: "pending",  value: counts.pending,  icon: Clock,       chip: "bg-ef-amber-light text-ef-amber" },
    { label: "Approved", key: "approved", value: counts.approved, icon: CheckCircle2,chip: "bg-ef-green-light text-ef-green" },
    { label: "Rejected", key: "rejected", value: counts.rejected, icon: XCircle,     chip: "bg-ef-red-light text-ef-red" },
  ] as const

  const TAB_ITEMS = [
    { key: "all", label: "All", count: counts.all, active: "bg-primary text-white border-primary" },
    { key: "pending", label: "Pending", count: counts.pending, active: "bg-ef-amber text-white border-ef-amber" },
    { key: "approved", label: "Approved", count: counts.approved, active: "bg-ef-green text-white border-ef-green" },
    { key: "rejected", label: "Rejected", count: counts.rejected, active: "bg-ef-red text-white border-ef-red" },
    { key: "expired", label: "Expired", count: counts.expired, active: "bg-muted-foreground text-white border-muted-foreground" },
  ]

  const hasFilters = statusFilter !== "all" || teacherFilter !== "all" || dateFilter !== "all" || Boolean(searchQuery)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<RefreshCw size={20} />}
        title="Swap Request Approvals"
        subtitle="Review, approve or reject period swap requests. All decisions are saved."
        actions={pendingCount > 0 ? <Badge variant="warning">{pendingCount} pending</Badge> : undefined}
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {KPIS.map(k => (
          <button key={k.label} onClick={() => setStatusFilter(k.key)} className="text-left">
            <Card className="hover:border-primary/40 transition-colors">
              <CardContent className="p-4 flex items-center gap-3.5">
                <div className={`size-10 rounded-[10px] flex items-center justify-center flex-shrink-0 ${k.chip}`}><k.icon className="size-4" /></div>
                <div>
                  <div className="text-[22px] font-extrabold leading-none">{k.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/40 p-4">
          <AlertTriangle className="size-5 text-ef-amber flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm">{pendingCount} swap request{pendingCount > 1 ? "s" : ""} need your approval</div>
            <div className="text-xs text-muted-foreground mt-0.5">Requests without both teacher confirmations are flagged. Unconfirmed requests expire in 6 hours.</div>
          </div>
        </div>
      )}

      {/* Filter bar */}
      <Card>
        <div className="px-4 py-3 border-b border-border flex items-center gap-1.5 text-xs text-muted-foreground">
          <Filter className="size-3.5" /> <span className="font-semibold">Filters</span>
          <History className="size-3.5 ml-1" /> <span>All history is saved</span>
        </div>
        <div className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search teacher, subject, ID…" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select value={teacherFilter} onValueChange={setTeacherFilter}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Teachers" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teachers</SelectItem>
              {teachers.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Dates" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              {dates.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("all"); setTeacherFilter("all"); setDateFilter("all"); setSearchQuery("") }}>
              <RotateCcw className="size-3" /> Clear
            </Button>
          )}
        </div>
        <div className="px-4 pb-3 flex gap-1.5 flex-wrap">
          {TAB_ITEMS.map(t => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${statusFilter === t.key ? t.active : "bg-card text-muted-foreground border-border"}`}
            >
              {t.label}
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1.5 ${statusFilter === t.key ? "bg-white/25" : "bg-muted"}`}>{t.count}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing <strong className="text-foreground">{filtered.length}</strong> of {allSwaps.length} requests
      </div>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <Card><CardContent className="py-12 text-center">
          <RefreshCw className="size-8 text-muted-foreground/40 mx-auto mb-3" />
          <div className="text-sm font-semibold text-muted-foreground">No swap requests match your filters</div>
          <div className="text-sm text-muted-foreground/70 mt-1">Try adjusting the filters above</div>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(swap => {
            const status = swap.status
            const isPending = status === "pending"
            const cfg = STATUS_CFG[status]
            return (
              <div key={swap.id} className={`rounded-[14px] border border-l-[3px] border-border ${cfg.leftBorder} bg-card overflow-hidden flex flex-col shadow-sm ${status === "expired" ? "opacity-70" : ""}`}>
                {/* header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-2 min-h-[48px]">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <RefreshCw className="size-3.5 text-primary flex-shrink-0" />
                    <span className="text-xs font-bold">{swap.id}</span>
                    <Badge variant={cfg.badge}>● {cfg.label}</Badge>
                    {isPending && !swap.bothConfirmed && <Badge variant="warning">Unconfirmed</Badge>}
                  </div>
                  {isPending && swap.expiresIn ? (
                    <span className="flex items-center gap-1 text-[11px] text-ef-amber-dark bg-ef-amber-light px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0"><Clock className="size-2.5" />{swap.expiresIn}</span>
                  ) : <span className="text-[11px] text-muted-foreground whitespace-nowrap flex-shrink-0">{swap.date}</span>}
                </div>

                {/* body */}
                <div className="px-4 py-3.5 flex-1 flex flex-col gap-3">
                  <div className="flex gap-2 items-stretch">
                    <div className="flex-1 bg-ef-brand-light border border-primary/30 rounded-[10px] px-3 py-2.5">
                      <div className="text-[9px] font-bold text-primary uppercase tracking-wider mb-1.5">Gives up</div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Initial name={swap.teacherA} className="bg-primary/15 text-primary" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">{swap.teacherA}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-0.5"><BookOpen className="size-2.5" />{swap.subjectA}</div>
                        </div>
                      </div>
                      <div className="bg-white/70 rounded-md px-2 py-1.5">
                        <div className="flex gap-1.5 items-center"><Badge>{swap.periodA}</Badge><span className="text-[11px] font-semibold">{swap.classA}</span></div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{swap.timeA}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center flex-shrink-0"><ArrowLeftRight className="size-4 text-muted-foreground" /></div>
                    <div className="flex-1 bg-ef-green-light border border-ef-green rounded-[10px] px-3 py-2.5">
                      <div className="text-[9px] font-bold text-ef-green-dark uppercase tracking-wider mb-1.5">Takes over</div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <Initial name={swap.teacherB} className="bg-ef-green/20 text-ef-green-dark" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">{swap.teacherB}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-0.5"><BookOpen className="size-2.5" />{swap.subjectB}</div>
                        </div>
                      </div>
                      <div className="bg-white/70 rounded-md px-2 py-1.5">
                        <div className="flex gap-1.5 items-center"><Badge variant="success">{swap.periodB}</Badge><span className="text-[11px] font-semibold">{swap.classB}</span></div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{swap.timeB}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/50 rounded-lg px-2.5 py-2 flex gap-2 items-start">
                    <Calendar className="size-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium leading-snug">{swap.reason}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Submitted: {swap.submittedAt}</div>
                    </div>
                  </div>

                  {swap.rejectionNote && (
                    <div className="bg-ef-red-light border border-ef-red rounded-lg px-2.5 py-2 flex gap-1.5 items-start">
                      <MessageSquare className="size-3 text-ef-red-dark flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-ef-red-dark leading-snug">{swap.rejectionNote}</div>
                    </div>
                  )}

                  {isPending && !swap.bothConfirmed && (
                    <div className="text-[11px] text-ef-amber-dark bg-ef-amber-light rounded-lg px-2.5 py-2">{swap.teacherB} hasn&apos;t confirmed yet. You can still approve.</div>
                  )}

                  {!isPending && swap.resolvedAt && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1.5"><User className="size-2.5" />{swap.resolvedBy ? `${swap.resolvedBy} · ` : ""}{swap.resolvedAt}</div>
                  )}
                </div>

                {/* footer */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-muted/40 gap-2 flex-wrap">
                  {isPending ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => setDetailId(swap.id)}><Eye className="size-3" /> View</Button>
                      <div className="flex gap-1.5">
                        <Button variant="destructive" size="sm" onClick={() => { setRejectId(swap.id); setApproveId(null); setRejectNote("") }}><XCircle className="size-3" /> Reject</Button>
                        <Button size="sm" className="bg-ef-green text-white hover:bg-ef-green/90" onClick={() => { setApproveId(swap.id); setRejectId(null) }}><CheckCircle2 className="size-3" /> Approve</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className={`text-xs font-semibold ${status === "approved" ? "text-ef-green-dark" : status === "rejected" ? "text-ef-red-dark" : "text-muted-foreground"}`}>
                        {status === "approved" ? "✓ Applied to timetable" : status === "rejected" ? "✕ Teachers notified" : "⏱ Request expired"}
                      </span>
                      <div className="flex gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => setDetailId(swap.id)}><Eye className="size-3" /> View</Button>
                        {status !== "expired" && <Button variant="secondary" size="sm" onClick={() => handleResetToPending(swap.id)}><Pencil className="size-3" /> Edit</Button>}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Approve Dialog */}
      <Dialog open={Boolean(approveId)} onOpenChange={open => { if (!open) setApproveId(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Approve Swap Request</DialogTitle></DialogHeader>
          {activeSwap && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">Approving this will permanently update both teachers&apos; timetables for this date.</p>
              <div className="bg-ef-green-light rounded-[10px] px-4 py-3 text-sm text-ef-green-dark">
                <strong>{activeSwap.teacherA}</strong> ({activeSwap.periodA} · {activeSwap.classA}) ⇄ <strong>{activeSwap.teacherB}</strong> ({activeSwap.periodB} · {activeSwap.classB})
              </div>
              {!activeSwap.bothConfirmed && (
                <div className="text-sm text-ef-amber-dark bg-ef-amber-light rounded-lg px-3 py-2 flex items-center gap-1.5"><AlertTriangle className="size-3.5" />{activeSwap.teacherB} has not confirmed. Approve anyway?</div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setApproveId(null)}>Cancel</Button>
            <Button className="bg-ef-green text-white hover:bg-ef-green/90" onClick={() => approveId && handleApprove(approveId)}><CheckCircle2 className="size-4" /> Confirm Approval</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={Boolean(rejectId)} onOpenChange={open => { if (!open) setRejectId(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject Swap Request</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Both teachers will be notified with your reason.</p>
            <div>
              <Label>Reason for rejection <span className="text-ef-red">*</span></Label>
              <Textarea className={`mt-1.5 h-[90px] ${rejectNote.trim() ? "" : "border-ef-red"}`} placeholder="Explain why this swap cannot be approved…" value={rejectNote} onChange={e => setRejectNote(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button variant="destructive" disabled={!rejectNote.trim()} onClick={() => rejectId && handleReject(rejectId)}><XCircle className="size-4" /> Reject Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={Boolean(detailId)} onOpenChange={open => { if (!open) setDetailId(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Swap Details — {detailSwap?.id}</DialogTitle></DialogHeader>
          {detailSwap && (
            <div className="flex flex-col gap-3.5">
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_CFG[detailSwap.status].badge}>● {STATUS_CFG[detailSwap.status].label}</Badge>
                <span className="text-xs text-muted-foreground">Date: {detailSwap.date}</span>
                {detailSwap.resolvedAt && <span className="text-xs text-muted-foreground ml-auto">Resolved: {detailSwap.resolvedAt}</span>}
              </div>
              <div className="grid grid-cols-[1fr_auto_1fr] gap-2.5 items-center">
                <div className="bg-ef-brand-light border border-primary/40 rounded-[10px] px-3.5 py-3">
                  <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1.5">Teacher A</div>
                  <div className="font-bold text-sm">{detailSwap.teacherA}</div>
                  <div className="text-xs text-muted-foreground">{detailSwap.subjectA}</div>
                  <div className="mt-2 flex gap-1.5 items-center"><Badge>{detailSwap.periodA}</Badge><span className="text-xs font-semibold">{detailSwap.classA}</span></div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{detailSwap.timeA}</div>
                </div>
                <ArrowLeftRight className="size-4 text-muted-foreground flex-shrink-0" />
                <div className="bg-ef-green-light border border-ef-green rounded-[10px] px-3.5 py-3">
                  <div className="text-[10px] font-bold text-ef-green-dark uppercase tracking-wider mb-1.5">Teacher B</div>
                  <div className="font-bold text-sm">{detailSwap.teacherB}</div>
                  <div className="text-xs text-muted-foreground">{detailSwap.subjectB}</div>
                  <div className="mt-2 flex gap-1.5 items-center"><Badge variant="success">{detailSwap.periodB}</Badge><span className="text-xs font-semibold">{detailSwap.classB}</span></div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{detailSwap.timeB}</div>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg px-3.5 py-2.5">
                <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Reason</div>
                <div className="text-sm">{detailSwap.reason}</div>
                <div className="text-[11px] text-muted-foreground mt-1">Submitted: {detailSwap.submittedAt}</div>
              </div>
              {detailSwap.rejectionNote && (
                <div className="bg-ef-red-light border border-ef-red rounded-lg px-3.5 py-2.5">
                  <div className="text-[11px] font-bold text-ef-red-dark uppercase tracking-wide mb-1">Rejection Note</div>
                  <div className="text-sm text-ef-red-dark">{detailSwap.rejectionNote}</div>
                </div>
              )}
              {detailSwap.resolvedBy && (
                <div className="text-xs text-muted-foreground flex items-center gap-1.5"><User className="size-3" />Resolved by: <strong className="text-foreground/70">{detailSwap.resolvedBy}</strong></div>
              )}
            </div>
          )}
          <DialogFooter><Button variant="secondary" onClick={() => setDetailId(null)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
