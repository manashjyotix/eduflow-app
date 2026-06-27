"use client"

import { useState } from "react"
import { toast } from "sonner"
import {
  ArrowLeftRight, Download, CheckCircle2, Clock, ShieldCheck,
  Search, Filter, MoreHorizontal, Check, X, TrendingUp,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { SwapBadge } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import { EduBarChart } from "@/components/shared/edu-bar-chart"
import { MOCK_SWAP_REQUESTS, type SwapRequest } from "@/data/mock-swap-requests"

const SWAP_TREND = [
  { week: "W1 May", requests: 3, approved: 2 },
  { week: "W2 May", requests: 5, approved: 4 },
  { week: "W3 May", requests: 4, approved: 3 },
  { week: "W4 May", requests: 6, approved: 5 },
  { week: "W1 Jun", requests: 4, approved: 3 },
  { week: "W2 Jun", requests: 3, approved: 2 },
]

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "agreed", label: "Agreed" },
  { value: "management_pending", label: "Management Review" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

function formatTime(isoStr: string) {
  return new Date(isoStr).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").toUpperCase()
}

export default function SwapRequestsPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [swaps, setSwaps] = useState<SwapRequest[]>(MOCK_SWAP_REQUESTS)

  const filtered = swaps.filter((r: SwapRequest) => {
    const matchesSearch =
      r.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      r.targetName.toLowerCase().includes(search.toLowerCase()) ||
      r.classId.toLowerCase().includes(search.toLowerCase()) ||
      r.subject.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === "all" || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const { sorted, sortField, sortDir, toggleSort } = useTableSort<
    SwapRequest,
    "requester" | "target" | "date" | "period" | "classSubject" | "reason" | "submitted" | "status"
  >(filtered, {
    requester:    r => r.requesterName,
    target:       r => r.targetName,
    date:         r => new Date(r.date).getTime(),
    period:       r => r.periodId,
    classSubject: r => r.classId,
    reason:       r => r.reason,
    submitted:    r => new Date(r.createdAt).getTime(),
    status:       r => r.status,
  }, { field: "submitted", dir: "desc" })

  const total = swaps.length
  const pending = swaps.filter(r => r.status === "pending").length
  const agreed = swaps.filter(r => r.status === "agreed").length
  const approved = swaps.filter(r => r.status === "approved").length

  function updateStatus(id: string, status: SwapRequest["status"], label: string, desc: string) {
    setSwaps(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    toast[label === "Approved" ? "success" : label === "Rejected" ? "error" : "info"](label, { description: desc })
  }

  function exportCsv() {
    const rows = [
      ["Requester", "Target", "Date", "Period", "Class", "Subject", "Reason", "Status"],
      ...swaps.map(r => [r.requesterName, r.targetName, r.date, r.periodId, r.classId, r.subject, r.reason, r.status]),
    ]
    const csv = rows.map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `swap-requests-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported", { description: `${swaps.length} swap requests.` })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 fade-in">
      <PageHeader
        icon={<ArrowLeftRight size={20} />}
        title="Swap Requests"
        subtitle="Peer period swap management"
        actions={
          <Button variant="outline" onClick={exportCsv}>
            <Download className="size-4 mr-2" />
            Export
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Total Requests"
          value={total}
          subtitle={`${SWAP_TREND[SWAP_TREND.length - 1].requests} this week`}
          icon={<ArrowLeftRight size={18} />}
          tone="brand"
          trend={{ value: Math.round(((SWAP_TREND[SWAP_TREND.length - 1].requests - SWAP_TREND[SWAP_TREND.length - 2].requests) / Math.max(SWAP_TREND[SWAP_TREND.length - 2].requests, 1)) * 100), label: "vs last week" }}
          sparkline={{ variant: "bar", data: SWAP_TREND.map(w => w.requests) }}
        />
        <KpiCard
          title="Pending"
          value={pending}
          subtitle={pending === 0 ? "All responded" : `${pending} awaiting peer response`}
          icon={<Clock size={18} />}
          tone="amber"
          trend={{ value: Math.round(((SWAP_TREND[SWAP_TREND.length - 1].requests - SWAP_TREND[SWAP_TREND.length - 1].approved - (SWAP_TREND[SWAP_TREND.length - 2].requests - SWAP_TREND[SWAP_TREND.length - 2].approved)) / Math.max(SWAP_TREND[SWAP_TREND.length - 2].requests - SWAP_TREND[SWAP_TREND.length - 2].approved, 1)) * 100), label: "vs last week" }}
          sparkline={{ variant: "bar", data: SWAP_TREND.map(w => w.requests - w.approved) }}
        />
        <KpiCard
          title="Agreed"
          value={agreed}
          subtitle={agreed === 0 ? "No agreements yet" : `${agreed} both parties agreed`}
          icon={<CheckCircle2 size={18} />}
          tone="cyan"
          sparkline={{ variant: "bar", data: SWAP_TREND.map(w => w.approved) }}
        />
        <KpiCard
          title="Approved"
          value={approved}
          subtitle={`${SWAP_TREND[SWAP_TREND.length - 1].approved} approved this week`}
          icon={<ShieldCheck size={18} />}
          tone="green"
          trend={{ value: Math.round(((SWAP_TREND[SWAP_TREND.length - 1].approved - SWAP_TREND[SWAP_TREND.length - 2].approved) / Math.max(SWAP_TREND[SWAP_TREND.length - 2].approved, 1)) * 100), label: "vs last week" }}
          sparkline={{ variant: "line", data: SWAP_TREND.map(w => w.approved) }}
        />
      </div>

      {/* Swap Volume Trend */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" /> Weekly Swap Volume
          </CardTitle>
          <Badge variant="secondary">Last 6 weeks</Badge>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <EduBarChart
            data={SWAP_TREND}
            series={[
              { dataKey: "requests", name: "Requested", color: "var(--ef-brand)" },
              { dataKey: "approved", name: "Approved",  color: "var(--ef-green)" },
            ]}
            xKey="week"
            height={130}
            tooltipFormatter={(v, name) => `${v} ${name.toLowerCase()}`}
          />
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm bg-primary" /> Requested</span>
            <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm" style={{ background: "var(--ef-green)" }} /> Approved</span>
          </div>
        </CardContent>
      </Card>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by teacher, class, subject..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swap Requests Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            Swap Requests
            <Badge variant="secondary" className="ml-2 font-normal">{filtered.length}</Badge>
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <ArrowLeftRight className="size-10 text-muted-foreground/40" />
              <p className="font-medium text-muted-foreground">No swap requests found</p>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table className="text-sm">
              <caption className="sr-only">Swap requests between teachers</caption>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-transparent">
                  <SortableHead field="requester" label="Requester" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                  <SortableHead field="target" label="Target Teacher" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                  <SortableHead field="date" label="Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                  <SortableHead field="period" label="Period" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                  <SortableHead field="classSubject" label="Class / Subject" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                  <SortableHead field="reason" label="Reason" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                  <SortableHead field="submitted" label="Submitted" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                  <SortableHead field="status" label="Status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                  <TableHead className="text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((req, i) => (
                  <TableRow
                    key={req.id}
                    className={i % 2 === 0 ? "" : "bg-muted/10"}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {getInitials(req.requesterName)}
                        </div>
                        <span className="font-medium">{req.requesterName}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-muted text-muted-foreground flex items-center justify-center text-xs font-semibold flex-shrink-0">
                          {getInitials(req.targetName)}
                        </div>
                        <span className="text-muted-foreground">{req.targetName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(req.date)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">{req.periodId}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{req.classId}</span>
                      <div className="text-xs text-muted-foreground">{req.subject}</div>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      <p className="text-muted-foreground text-xs truncate">{req.reason}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(req.createdAt)}
                    </TableCell>
                    <TableCell>
                      <SwapBadge status={req.status} />
                    </TableCell>
                    <TableCell>
                      {req.status === "management_pending" ? (
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-success-foreground border-success-foreground/30 hover:bg-success/30 h-7 px-2 text-xs"
                            onClick={() => updateStatus(req.id, "approved", "Approved", `${req.requesterName.split(" ")[0]} ↔ ${req.targetName.split(" ")[0]} swap confirmed.`)}
                          >
                            <Check className="size-3 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10 h-7 px-2 text-xs"
                            onClick={() => updateStatus(req.id, "rejected", "Rejected", `${req.requesterName.split(" ")[0]}'s swap was rejected.`)}
                          >
                            <X className="size-3 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7" aria-label={`More actions for ${req.requesterName} swap`}>
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => toast.info("Swap details", { description: `${req.requesterName} ↔ ${req.targetName} · ${req.periodId}` })}>View Details</DropdownMenuItem>
                              {req.status === "pending" && (
                                <>
                                  <DropdownMenuItem onSelect={() => toast("Reminder sent", { description: `Nudged ${req.targetName}.` })}>Send Reminder</DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onSelect={() => updateStatus(req.id, "rejected", "Rejected", `Swap cancelled.`)}>Cancel Request</DropdownMenuItem>
                                </>
                              )}
                              {req.status === "agreed" && (
                                <DropdownMenuItem onSelect={() => updateStatus(req.id, "management_pending", "Forwarded", `Sent to management for final approval.`)}>Forward to Management</DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
