"use client"
import { useState, useMemo } from "react"
import { toast } from "sonner"
import {
  ArrowLeftRight, Plus, Clock, CheckCircle2, XCircle,
  AlertCircle, Send, User, BookOpen, Calendar,
  MessageSquare, RefreshCw, Search, Filter,
  RotateCcw, Eye, Info,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

// ─── Types ────────────────────────────────────────────────────────────────────
type SwapDirection = "sent" | "received"
type SwapStatus = "pending" | "agreed" | "management_pending" | "approved" | "rejected" | "expired"

interface TeacherSwap {
  id: string
  direction: SwapDirection
  peerName: string
  peerSubject: string
  myPeriod: string; myClass: string; myTime: string; mySubject: string
  theirPeriod: string; theirClass: string; theirTime: string
  reason: string
  date: string
  submittedAt: string
  expiresIn?: string
  status: SwapStatus
  rejectionNote?: string
  resolvedAt?: string
}

// ─── Mock data scoped to Priya Sharma ────────────────────────────────────────
const INITIAL_SWAPS: TeacherSwap[] = [
  {
    id: "SW-001", direction: "sent",
    peerName: "Rajesh Kalita", peerSubject: "English",
    myPeriod: "P3", myClass: "VIII-A", myTime: "10:50–11:30", mySubject: "Mathematics",
    theirPeriod: "P5", theirClass: "IX-B", theirTime: "12:30–1:10",
    reason: "Medical appointment during P3 — need to visit doctor",
    date: "16 Jun 2026", submittedAt: "9:00 AM, 15 Jun", expiresIn: "3h 10m",
    status: "pending",
  },
  {
    id: "SW-003", direction: "received",
    peerName: "Sunita Borah", peerSubject: "Chemistry",
    myPeriod: "P7", myClass: "VII-C", myTime: "1:50–2:30", mySubject: "Mathematics",
    theirPeriod: "P4", theirClass: "X-A", theirTime: "11:30–12:10",
    reason: "Lab preparation conflicts with P4 today",
    date: "15 Jun 2026", submittedAt: "7:50 AM, 15 Jun", expiresIn: "1h 40m",
    status: "pending",
  },
  {
    id: "SW-004", direction: "sent",
    peerName: "Biju Das", peerSubject: "History",
    myPeriod: "P2", myClass: "VIII-A", myTime: "10:10–10:50", mySubject: "Mathematics",
    theirPeriod: "P6", theirClass: "IX-A", theirTime: "1:10–1:50",
    reason: "Department coordination meeting overlapping P2",
    date: "13 Jun 2026", submittedAt: "8:00 AM, 12 Jun",
    status: "agreed",
  },
  {
    id: "SW-005", direction: "sent",
    peerName: "Meena Gogoi", peerSubject: "Geography",
    myPeriod: "P1", myClass: "X-A", myTime: "9:30–10:10", mySubject: "Science",
    theirPeriod: "P3", theirClass: "IX-B", theirTime: "10:50–11:30",
    reason: "Parent-teacher briefing session in the morning",
    date: "10 Jun 2026", submittedAt: "6:00 PM, 9 Jun",
    status: "management_pending",
  },
  {
    id: "SW-006", direction: "received",
    peerName: "Himanta Bezbaruah", peerSubject: "Computer Science",
    myPeriod: "P5", myClass: "VII-A", myTime: "12:30–1:10", mySubject: "Science",
    theirPeriod: "P7", theirClass: "VIII-B", theirTime: "1:50–2:30",
    reason: "IT lab booking for P5 — needs to proceed",
    date: "5 Jun 2026", submittedAt: "9:15 AM, 4 Jun",
    status: "approved",
    resolvedAt: "Management Office · 10:30 AM, 4 Jun",
  },
  {
    id: "SW-007", direction: "sent",
    peerName: "Dipak Baruah", peerSubject: "Assamese",
    myPeriod: "P6", myClass: "VII-B", myTime: "1:10–1:50", mySubject: "Mathematics",
    theirPeriod: "P2", theirClass: "X-B", theirTime: "10:10–10:50",
    reason: "Training workshop assignment conflict",
    date: "2 Jun 2026", submittedAt: "8:00 AM, 1 Jun",
    status: "rejected",
    rejectionNote: "Dipak already assigned as proxy for Class VI-A in P2. Conflict detected.",
    resolvedAt: "Management Office · 9:00 AM, 1 Jun",
  },
]

const PERIODS = [
  { id: "P1", label: "P1 · 9:30–10:10" }, { id: "P2", label: "P2 · 10:10–10:50" },
  { id: "P3", label: "P3 · 10:50–11:30" }, { id: "P4", label: "P4 · 11:30–12:10" },
  { id: "P5", label: "P5 · 12:30–1:10" }, { id: "P6", label: "P6 · 1:10–1:50" },
  { id: "P7", label: "P7 · 1:50–2:30" },
]

const TEACHERS = [
  "Rajesh Kalita", "Anita Devi", "Biju Das", "Meena Gogoi",
  "Dipak Baruah", "Sunita Borah", "Himanta Bezbaruah",
]

const CLASSES = [
  "V-A", "V-B", "VI-A", "VI-B", "VII-A", "VII-B", "VII-C",
  "VIII-A", "VIII-B", "IX-A", "IX-B", "X-A", "X-B",
]

// ─── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<SwapStatus, {
  badge: "default" | "success" | "destructive" | "warning" | "secondary" | "outline"
  label: string; icon: React.ElementType
  dotColor: string
}> = {
  pending:            { badge: "warning",     label: "Pending",           dotColor: "bg-amber-400",   icon: Clock },
  agreed:             { badge: "default",     label: "Agreed",            dotColor: "bg-blue-400",    icon: CheckCircle2 },
  management_pending: { badge: "outline",     label: "Management Review", dotColor: "bg-purple-400",  icon: RefreshCw },
  approved:           { badge: "success",     label: "Approved",          dotColor: "bg-green-500",   icon: CheckCircle2 },
  rejected:           { badge: "destructive", label: "Rejected",          dotColor: "bg-red-500",     icon: XCircle },
  expired:            { badge: "secondary",   label: "Expired",           dotColor: "bg-muted-foreground", icon: AlertCircle },
}

// ─── Helper ────────────────────────────────────────────────────────────────────
function Initial({ name, className = "" }: { name: string; className?: string }) {
  return (
    <div className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${className}`}>
      {name.charAt(0)}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function TeacherSwapRequestsPage() {
  const [swaps, setSwaps] = useState<TeacherSwap[]>(INITIAL_SWAPS)
  const [statusFilter, setStatusFilter] = useState("all")
  const [dirFilter, setDirFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [detailId, setDetailId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  // new swap form state
  const [formPeer, setFormPeer] = useState("")
  const [formMyPeriod, setFormMyPeriod] = useState("")
  const [formMyClass, setFormMyClass] = useState("")
  const [formTheirPeriod, setFormTheirPeriod] = useState("")
  const [formDate, setFormDate] = useState("")
  const [formReason, setFormReason] = useState("")

  const today = new Date().toISOString().split("T")[0]

  // ── derived counts ──
  const counts = useMemo(() => ({
    all: swaps.length,
    sent: swaps.filter(s => s.direction === "sent").length,
    received: swaps.filter(s => s.direction === "received").length,
    pending: swaps.filter(s => s.status === "pending").length,
    approved: swaps.filter(s => s.status === "approved").length,
  }), [swaps])

  const pendingReceived = swaps.filter(s => s.direction === "received" && s.status === "pending").length

  const filtered = swaps.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false
    if (dirFilter !== "all" && s.direction !== dirFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return [s.peerName, s.myClass, s.theirClass, s.reason, s.id].some(v => v.toLowerCase().includes(q))
    }
    return true
  })

  function handleAcceptIncoming(id: string) {
    setSwaps(prev => prev.map(s => s.id === id ? { ...s, status: "agreed" } : s))
    toast.success("Swap request accepted", { description: "Both parties agreed. Awaiting management approval." })
  }

  function handleDeclineIncoming(id: string) {
    setSwaps(prev => prev.map(s => s.id === id ? { ...s, status: "rejected", rejectionNote: "Declined by teacher." } : s))
    toast.error("Swap request declined", { description: "The requester will be notified." })
  }

  function handleForwardToManagement(id: string) {
    setSwaps(prev => prev.map(s => s.id === id ? { ...s, status: "management_pending" } : s))
    toast.success("Forwarded to management", { description: "Awaiting final approval." })
  }

  function handleCancelSent(id: string) {
    setSwaps(prev => prev.map(s => s.id === id ? { ...s, status: "rejected", rejectionNote: "Cancelled by requester." } : s))
    toast("Swap request cancelled")
  }

  function handleSubmitNew() {
    if (!formPeer || !formMyPeriod || !formMyClass || !formTheirPeriod || !formDate || formReason.trim().length < 10) return
    const periodObj = PERIODS.find(p => p.id === formMyPeriod)
    const theirPeriodObj = PERIODS.find(p => p.id === formTheirPeriod)
    const newSwap: TeacherSwap = {
      id: `SW-${Date.now().toString().slice(-4)}`,
      direction: "sent",
      peerName: formPeer, peerSubject: "—",
      myPeriod: formMyPeriod, myClass: formMyClass,
      myTime: periodObj?.label.split("· ")[1] ?? "",
      mySubject: "Mathematics",
      theirPeriod: formTheirPeriod,
      theirClass: "—",
      theirTime: theirPeriodObj?.label.split("· ")[1] ?? "",
      reason: formReason,
      date: new Date(formDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      submittedAt: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) + ", Today",
      expiresIn: "6h 0m",
      status: "pending",
    }
    setSwaps(prev => [newSwap, ...prev])
    setFormPeer(""); setFormMyPeriod(""); setFormMyClass(""); setFormTheirPeriod(""); setFormDate(""); setFormReason("")
    setShowNewForm(false)
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 6000)
    toast.success("Swap request sent", { description: `Awaiting ${formPeer}'s confirmation.` })
  }

  const TAB_ITEMS = [
    { key: "all",               label: "All",        count: counts.all },
    { key: "pending",           label: "Pending",    count: counts.pending },
    { key: "agreed",            label: "Agreed",     count: swaps.filter(s => s.status === "agreed").length },
    { key: "management_pending",label: "Mgmt Review",count: swaps.filter(s => s.status === "management_pending").length },
    { key: "approved",          label: "Approved",   count: counts.approved },
    { key: "rejected",          label: "Rejected",   count: swaps.filter(s => s.status === "rejected").length },
  ]

  const detailSwap = swaps.find(s => s.id === detailId)
  const hasFormErrors = !formPeer || !formMyPeriod || !formMyClass || !formTheirPeriod || !formDate || formReason.trim().length < 10

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<ArrowLeftRight size={20} />}
        title="Swap Requests"
        subtitle="Send and manage period swap requests with your colleagues"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowNewForm(v => !v)}>
              <Plus className="size-4" />
              New Swap Request
            </Button>
          </div>
        }
      />

      {/* ── KPI strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard title="Total Requests" value={counts.all} subtitle={`${counts.sent} sent · ${counts.received} received`}
          icon={<ArrowLeftRight className="size-5" />} tone="brand"
          sparkline={{ variant: "bar", data: [3, 5, 4, 2, 6, counts.all] }} />
        <KpiCard title="Pending" value={counts.pending} subtitle={counts.pending > 0 ? "Awaiting response" : "All clear"}
          icon={<Clock className="size-5" />} tone="amber"
          sparkline={{ variant: "bar", data: [1, 2, 1, 3, 1, counts.pending] }} />
        <KpiCard title="Incoming" value={pendingReceived} subtitle={pendingReceived > 0 ? "Need your response" : "Nothing to respond to"}
          icon={<AlertCircle className="size-5" />} tone={pendingReceived > 0 ? "red" : "green"}
          sparkline={{ variant: "bar", data: [0, 1, 0, 2, 0, pendingReceived] }} />
        <KpiCard title="Approved" value={counts.approved} subtitle="Timetable updated"
          icon={<CheckCircle2 className="size-5" />} tone="green"
          sparkline={{ variant: "line", data: [1, 2, 2, 3, 3, counts.approved] }} />
      </div>

      {/* ── Submit success notice ── */}
      {submitted && (
        <Alert className="border-success-foreground/30 bg-success/10">
          <CheckCircle2 className="size-4 text-success-foreground" />
          <AlertDescription className="text-success-foreground font-medium">
            Swap request sent! Your colleague will be notified to confirm. Unconfirmed requests expire in 6 hours.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Incoming action banner ── */}
      {pendingReceived > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
          <AlertCircle className="size-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-sm text-amber-900 dark:text-amber-200">
              {pendingReceived} colleague{pendingReceived > 1 ? "s have" : " has"} requested a swap with you
            </div>
            <div className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Accept or decline below — unresponded requests expire in 6 hours.
            </div>
          </div>
        </div>
      )}

      {/* ── New Swap Form ── */}
      {showNewForm && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2 leading-none">
              <Plus className="size-4 text-primary shrink-0" />
              New Swap Request
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Requester info (read-only) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Your Name</Label>
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-muted/30 text-sm text-muted-foreground">
                <User className="size-3.5" /> Priya Sharma
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Swap With</Label>
              <Select value={formPeer} onValueChange={setFormPeer}>
                <SelectTrigger className="h-9 shadow-none"><SelectValue placeholder="Select colleague…" /></SelectTrigger>
                <SelectContent>{TEACHERS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Your Period to Give Up</Label>
              <Select value={formMyPeriod} onValueChange={setFormMyPeriod}>
                <SelectTrigger className="h-9 shadow-none"><SelectValue placeholder="Select period…" /></SelectTrigger>
                <SelectContent>{PERIODS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Your Class</Label>
              <Select value={formMyClass} onValueChange={setFormMyClass}>
                <SelectTrigger className="h-9 shadow-none"><SelectValue placeholder="Select class…" /></SelectTrigger>
                <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Colleague&apos;s Period (Taking Over)</Label>
              <Select value={formTheirPeriod} onValueChange={setFormTheirPeriod}>
                <SelectTrigger className="h-9 shadow-none"><SelectValue placeholder="Select period…" /></SelectTrigger>
                <SelectContent>{PERIODS.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Swap Date</Label>
              <Input type="date" min={today} className="h-9 shadow-none" value={formDate} onChange={e => setFormDate(e.target.value)} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">Reason <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Explain why you need this swap (min 10 characters)…"
                rows={3}
                value={formReason}
                onChange={e => setFormReason(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-start gap-2 text-[11px] text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
                <Info className="size-3.5 mt-0.5 shrink-0" />
                <span>Your colleague will be notified and must confirm within 6 hours. Once both agree, management reviews and gives final approval.</span>
              </div>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setShowNewForm(false)}>Cancel</Button>
              <Button onClick={handleSubmitNew} disabled={hasFormErrors}>
                <Send className="size-4" /> Send Request
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Filter bar ── */}
      <Card>
        <div className="px-4 pb-3 pt-3 flex flex-wrap gap-1.5 border-b border-border">
          {TAB_ITEMS.map(t => (
            <button
              key={t.key}
              onClick={() => setStatusFilter(t.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                statusFilter === t.key
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {t.label}
              <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-bold px-1 ${statusFilter === t.key ? "bg-white/25" : "bg-muted"}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <div className="p-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search teacher, class, ID…" className="pl-9 h-9 shadow-none" />
          </div>
          <Select value={dirFilter} onValueChange={setDirFilter}>
            <SelectTrigger className="w-full sm:w-auto min-w-[140px] h-9 shadow-none"><Filter className="size-3.5 mr-1.5" /><SelectValue placeholder="Direction" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="sent">Sent by me</SelectItem>
              <SelectItem value="received">Received</SelectItem>
            </SelectContent>
          </Select>
          {(statusFilter !== "all" || dirFilter !== "all" || Boolean(searchQuery)) && (
            <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("all"); setDirFilter("all"); setSearchQuery("") }}>
              <RotateCcw className="size-3" /> Clear
            </Button>
          )}
        </div>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing <strong className="text-foreground">{filtered.length}</strong> of {swaps.length} requests
      </div>

      {/* ── Cards grid ── */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center flex flex-col items-center gap-3">
            <ArrowLeftRight className="size-10 text-muted-foreground/30" />
            <p className="text-sm font-semibold text-muted-foreground">No swap requests match your filters</p>
            <p className="text-sm text-muted-foreground/70">Try adjusting the filters above or send a new request</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(swap => {
            const cfg = STATUS_CFG[swap.status]
            const isIncoming = swap.direction === "received"
            const isPending = swap.status === "pending"
            const isAgreed = swap.status === "agreed"
            const StatusIcon = cfg.icon
            return (
              <div key={swap.id} className="rounded-2xl border border-border bg-card flex flex-col overflow-hidden">
                {/* header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border gap-2 min-h-[48px]">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <span className={`size-2 rounded-full shrink-0 ${cfg.dotColor}`} />
                    <span className="text-xs font-bold">{swap.id}</span>
                    <Badge variant={cfg.badge} className="gap-1">
                      <StatusIcon className="size-2.5" /> {cfg.label}
                    </Badge>
                    <Badge variant={isIncoming ? "destructive" : "secondary"} className="text-[10px]">
                      {isIncoming ? "Incoming" : "Sent"}
                    </Badge>
                  </div>
                  {isPending && swap.expiresIn ? (
                    <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300 px-2 py-1 rounded-full whitespace-nowrap shrink-0">
                      <Clock className="size-2.5" />{swap.expiresIn}
                    </span>
                  ) : (
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap shrink-0">{swap.date}</span>
                  )}
                </div>

                {/* body */}
                <div className="px-4 py-3.5 flex-1 flex flex-col gap-3">
                  {/* Swap detail: my period ↔ their period */}
                  <div className="flex gap-2 items-stretch">
                    <div className="flex-1 bg-primary/5 border border-primary/20 rounded-[10px] px-3 py-2">
                      <div className="text-[9px] font-bold text-primary uppercase tracking-wider mb-1.5">
                        {isIncoming ? "They give up" : "You give up"}
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Initial name={isIncoming ? swap.peerName : "P"} className="bg-primary/15 text-primary" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">{isIncoming ? swap.peerName : "Priya Sharma"}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                            <BookOpen className="size-2.5" />{isIncoming ? swap.peerSubject : swap.mySubject}
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/70 dark:bg-background/40 rounded-md px-2 py-1.5">
                        <div className="flex gap-1.5 items-center">
                          <Badge variant="outline" className="font-mono text-[10px]">{isIncoming ? swap.myPeriod : swap.myPeriod}</Badge>
                          <span className="text-[11px] font-semibold">{isIncoming ? swap.myClass : swap.myClass}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{isIncoming ? swap.myTime : swap.myTime}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center shrink-0">
                      <ArrowLeftRight className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-[10px] px-3 py-2">
                      <div className="text-[9px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider mb-1.5">
                        {isIncoming ? "You take over" : "They take over"}
                      </div>
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <Initial name={isIncoming ? "P" : swap.peerName} className="bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400" />
                        <div className="min-w-0">
                          <div className="font-bold text-xs truncate">{isIncoming ? "Priya Sharma" : swap.peerName}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-0.5">
                            <BookOpen className="size-2.5" />{isIncoming ? swap.mySubject : swap.peerSubject}
                          </div>
                        </div>
                      </div>
                      <div className="bg-white/70 dark:bg-background/40 rounded-md px-2 py-1.5">
                        <div className="flex gap-1.5 items-center">
                          <Badge variant="success" className="font-mono text-[10px]">{swap.theirPeriod}</Badge>
                          <span className="text-[11px] font-semibold">{swap.theirClass}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{swap.theirTime}</div>
                      </div>
                    </div>
                  </div>

                  {/* reason */}
                  <div className="bg-muted/50 rounded-lg px-2.5 py-2 flex gap-2 items-start">
                    <Calendar className="size-3 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-medium leading-snug">{swap.reason}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Submitted: {swap.submittedAt}</div>
                    </div>
                  </div>

                  {/* rejection note */}
                  {swap.rejectionNote && (
                    <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg px-2.5 py-2 flex gap-1.5 items-start">
                      <MessageSquare className="size-3 text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-red-700 dark:text-red-400 leading-snug">{swap.rejectionNote}</div>
                    </div>
                  )}

                  {/* resolved info */}
                  {swap.resolvedAt && (
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <User className="size-2.5" />{swap.resolvedAt}
                    </div>
                  )}
                </div>

                {/* footer actions */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30 gap-2 flex-wrap">
                  {isIncoming && isPending ? (
                    <>
                      <Button variant="ghost" size="sm" className="h-7" onClick={() => setDetailId(swap.id)}>
                        <Eye className="size-3" /> View
                      </Button>
                      <div className="flex gap-1.5">
                        <Button variant="outline" size="sm" className="h-7 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs" onClick={() => handleDeclineIncoming(swap.id)}>
                          <XCircle className="size-3" /> Decline
                        </Button>
                        <Button size="sm" className="h-7 bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => handleAcceptIncoming(swap.id)}>
                          <CheckCircle2 className="size-3" /> Accept
                        </Button>
                      </div>
                    </>
                  ) : !isIncoming && isPending ? (
                    <>
                      <span className="text-xs text-amber-600 font-medium">Waiting for {swap.peerName.split(" ")[0]}…</span>
                      <div className="flex gap-1.5">
                        <Button variant="ghost" size="sm" className="h-7" onClick={() => setDetailId(swap.id)}>
                          <Eye className="size-3" /> View
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-destructive border-destructive/30 hover:bg-destructive/10 text-xs" onClick={() => handleCancelSent(swap.id)}>
                          <XCircle className="size-3" /> Cancel
                        </Button>
                      </div>
                    </>
                  ) : !isIncoming && isAgreed ? (
                    <>
                      <span className="text-xs text-blue-600 font-medium">Both agreed — forward to management?</span>
                      <Button size="sm" className="h-7 text-xs" onClick={() => handleForwardToManagement(swap.id)}>
                        <Send className="size-3" /> Forward
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className={`text-xs font-semibold ${swap.status === "approved" ? "text-green-700" : swap.status === "rejected" ? "text-red-700" : "text-muted-foreground"}`}>
                        {swap.status === "approved" ? "✓ Timetable updated" : swap.status === "management_pending" ? "⏳ Awaiting management" : swap.status === "rejected" ? "✕ Notified" : "⏱ Expired"}
                      </span>
                      <Button variant="ghost" size="sm" className="h-7" onClick={() => setDetailId(swap.id)}>
                        <Eye className="size-3" /> View
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Detail Dialog ── */}
      <Dialog open={Boolean(detailId)} onOpenChange={open => { if (!open) setDetailId(null) }}>
        <DialogContent className="max-w-md p-0 overflow-hidden gap-0">
          {detailSwap && (() => {
            const cfg = STATUS_CFG[detailSwap.status]
            const StatusIcon = cfg.icon
            const isIncoming = detailSwap.direction === "received"
            const teacherA = isIncoming ? detailSwap.peerName : "Priya Sharma"
            const teacherB = isIncoming ? "Priya Sharma" : detailSwap.peerName
            const subjectA = isIncoming ? detailSwap.peerSubject : detailSwap.mySubject
            const subjectB = isIncoming ? detailSwap.mySubject : detailSwap.peerSubject

            return (
              <>
                {/* ── Coloured header band ── */}
                <div className="relative px-6 pt-6 pb-5 bg-muted/40 border-b border-border">
                  {/* close button handled by DialogContent internally */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`size-2.5 rounded-full shrink-0 ${cfg.dotColor}`} />
                        <span className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">{detailSwap.id}</span>
                      </div>
                      <h2 className="text-lg font-bold leading-tight text-foreground">Period Swap Details</h2>
                      <p className="text-xs text-muted-foreground mt-0.5">{detailSwap.date} · Submitted {detailSwap.submittedAt}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant={cfg.badge} className="gap-1">
                        <StatusIcon className="size-3" /> {cfg.label}
                      </Badge>
                      <Badge variant={isIncoming ? "destructive" : "secondary"} className="text-[10px]">
                        {isIncoming ? "Incoming request" : "You sent this"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* ── Body ── */}
                <div className="flex flex-col gap-4 px-6 py-5">

                  {/* Swap parties — stacked layout with arrow */}
                  <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Period Exchange</p>
                    <div className="flex flex-col gap-2">
                      {/* Teacher A */}
                      <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/15 px-4 py-3">
                        <div className="size-9 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                          {teacherA.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm leading-tight">{teacherA}</div>
                          <div className="text-xs text-muted-foreground">{subjectA}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-xs font-bold font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-md">{detailSwap.myPeriod}</span>
                            <span className="text-xs font-semibold">{detailSwap.myClass}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{detailSwap.myTime}</div>
                        </div>
                      </div>

                      {/* Arrow divider */}
                      <div className="flex items-center gap-2 px-2">
                        <div className="flex-1 h-px bg-border" />
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium bg-muted rounded-full px-2 py-0.5">
                          <ArrowLeftRight className="size-3" /> swaps with
                        </div>
                        <div className="flex-1 h-px bg-border" />
                      </div>

                      {/* Teacher B */}
                      <div className="flex items-center gap-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 px-4 py-3">
                        <div className="size-9 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 flex items-center justify-center text-sm font-bold shrink-0">
                          {teacherB.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm leading-tight">{teacherB}</div>
                          <div className="text-xs text-muted-foreground">{subjectB}</div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-xs font-bold font-mono bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-md">{detailSwap.theirPeriod}</span>
                            <span className="text-xs font-semibold">{detailSwap.theirClass}</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{detailSwap.theirTime}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="rounded-xl bg-muted/50 px-4 py-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5">Reason</p>
                    <p className="text-sm leading-relaxed">{detailSwap.reason}</p>
                  </div>

                  {/* Rejection note */}
                  {detailSwap.rejectionNote && (
                    <div className="rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 px-4 py-3 flex gap-2 items-start">
                      <MessageSquare className="size-3.5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400 mb-1">Note</p>
                        <p className="text-sm text-red-700 dark:text-red-300 leading-snug">{detailSwap.rejectionNote}</p>
                      </div>
                    </div>
                  )}

                  {/* Resolved by */}
                  {detailSwap.resolvedAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="size-3.5 shrink-0" />
                      <span>{detailSwap.resolvedAt}</span>
                    </div>
                  )}
                </div>

                {/* ── Footer ── */}
                <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border bg-muted/20">
                  <Button variant="outline" className="shadow-none" onClick={() => setDetailId(null)}>Close</Button>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
    </div>
  )
}
