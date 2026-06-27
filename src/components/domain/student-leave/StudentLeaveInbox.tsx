"use client"

/**
 * StudentLeaveInbox.tsx
 *
 * Shared approver UI for STUDENT leave requests submitted by parents.
 * Used by both /admin/student-leave and /management/student-leave.
 *
 * Reads/writes the live `student-leave-context` store, so requests raised on
 * the parent portal appear here in real time and approvals/rejections flow
 * back to the parent's "Past Leave Requests" table.
 */

import { useState } from "react"
import { toast } from "sonner"
import {
  FileText, CheckCircle, Clock, XCircle, Search, Filter,
  CalendarDays, User, MessageSquare, Inbox,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { useRole } from "@/context/role-context"
import { useStudentLeave } from "@/context/student-leave-context"
import {
  STUDENT_LEAVE_TYPE_LABELS as TYPE_LABELS,
  STUDENT_LEAVE_STATUS_VARIANTS as STATUS_VARIANTS,
  type StudentLeaveRequest,
} from "@/data/mock-student-leave"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

interface StudentLeaveInboxProps {
  /** "approve" tone differs slightly between admin & management copy */
  subtitle?: string
}

export function StudentLeaveInbox({ subtitle }: StudentLeaveInboxProps) {
  const { name: reviewer } = useRole()
  const { requests, approveLeave, rejectLeave } = useStudentLeave()

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Reject-with-reason dialog
  const [rejectTarget, setRejectTarget] = useState<StudentLeaveRequest | null>(null)
  const [rejectNote, setRejectNote] = useState("")

  const pending  = requests.filter(r => r.status === "pending").length
  const approved = requests.filter(r => r.status === "approved").length
  const rejected = requests.filter(r => r.status === "rejected").length

  const filtered = requests.filter(r => {
    const q = query.toLowerCase()
    const matchSearch =
      r.studentName.toLowerCase().includes(q) ||
      r.className.toLowerCase().includes(q) ||
      r.parentName.toLowerCase().includes(q) ||
      r.subject.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || r.status === statusFilter
    return matchSearch && matchStatus
  })

  // pending first, then by most recent submission
  const sorted = [...filtered].sort((a, b) => {
    if (a.status === "pending" && b.status !== "pending") return -1
    if (b.status === "pending" && a.status !== "pending") return 1
    return b.submittedOn.localeCompare(a.submittedOn)
  })

  function handleApprove(r: StudentLeaveRequest) {
    approveLeave(r.id, reviewer)
    toast.success("Leave approved", {
      description: `${r.studentName} (${r.className}) — ${r.days} day${r.days > 1 ? "s" : ""}. Parent notified.`,
    })
  }

  function confirmReject() {
    if (!rejectTarget) return
    rejectLeave(rejectTarget.id, reviewer, rejectNote.trim() || undefined)
    toast.error("Leave rejected", {
      description: `${rejectTarget.studentName}'s request was declined. Parent notified.`,
    })
    setRejectTarget(null)
    setRejectNote("")
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<FileText size={22} />}
        title="Student Leave Requests"
        subtitle={subtitle ?? "Review and approve student leave applications submitted by parents"}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Total Requests"
          value={requests.length}
          subtitle={`${pending} awaiting review`}
          icon={<Inbox className="size-5" />}
          tone="brand"
          sparkline={{ variant: "bar", data: [3, 5, 4, 6, 5, 7, requests.length], color: "var(--ef-brand)" }}
        />
        <KpiCard
          title="Pending"
          value={pending}
          subtitle={pending === 0 ? "All clear" : "Need a decision"}
          icon={<Clock className="size-5" />}
          tone="amber"
          sparkline={{ variant: "bar", data: [4, 2, 3, 4, 1, 3, pending], color: "var(--ef-amber)" }}
        />
        <KpiCard
          title="Approved"
          value={approved}
          subtitle={`${approved} granted`}
          icon={<CheckCircle className="size-5" />}
          tone="green"
          sparkline={{ variant: "bar", data: [1, 2, 3, 2, 4, 3, approved], color: "var(--ef-green)" }}
        />
        <KpiCard
          title="Rejected"
          value={rejected}
          subtitle={rejected === 0 ? "No rejections" : `${rejected} declined`}
          icon={<XCircle className="size-5" />}
          tone="red"
          sparkline={{ variant: "bar", data: [1, 0, 1, 2, 0, 1, rejected], color: "var(--ef-red)" }}
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 pb-3 flex-wrap">
          <CardTitle className="text-base">Leave Applications</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <SearchInput
                placeholder="Search student, class, parent..."
                className="h-8 w-60 pl-8"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <Filter className="size-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <EmptyState icon={<Inbox className="size-6" />} title="No leave requests" description="No student leave requests match your filters." />
          ) : (
            <ul className="divide-y divide-border">
              {sorted.map(r => (
                <li key={r.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-start sm:justify-between hover:bg-muted/20">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="text-sm font-semibold">{r.studentName}</span>
                      <Badge variant="secondary" className="text-[10px]">{r.className}</Badge>
                      <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[r.type]}</Badge>
                      <Badge variant={STATUS_VARIANTS[r.status]} className="text-[10px] capitalize">{r.status}</Badge>
                    </div>
                    <p className="text-sm font-medium">{r.subject}</p>
                    <p className="text-xs text-muted-foreground max-w-prose">{r.reason}</p>
                    <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground pt-0.5">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3" />
                        {formatDate(r.from)}{r.from !== r.to ? ` – ${formatDate(r.to)}` : ""} · {r.days} day{r.days > 1 ? "s" : ""}
                      </span>
                      <span>Parent: {r.parentName}</span>
                      <span>Submitted {formatDate(r.submittedOn)}</span>
                    </div>
                    {r.status !== "pending" && r.reviewedBy && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 pt-0.5">
                        <MessageSquare className="size-3" />
                        {r.status === "approved" ? "Approved" : "Rejected"} by {r.reviewedBy}
                        {r.reviewedOn ? ` on ${formatDate(r.reviewedOn)}` : ""}
                        {r.reviewNote ? ` — “${r.reviewNote}”` : ""}
                      </p>
                    )}
                  </div>

                  {r.status === "pending" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => { setRejectTarget(r); setRejectNote("") }}>
                        <XCircle className="size-3.5" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(r)}>
                        <CheckCircle className="size-3.5" /> Approve
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/20">
            <span className="text-xs text-muted-foreground">Showing {sorted.length} of {requests.length} requests</span>
          </div>
        </CardContent>
      </Card>

      {/* Reject dialog */}
      <Dialog open={rejectTarget !== null} onOpenChange={(o) => { if (!o) { setRejectTarget(null); setRejectNote("") } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-destructive" /> Reject Leave Request
            </DialogTitle>
            <DialogDescription>
              {rejectTarget
                ? `${rejectTarget.studentName} (${rejectTarget.className}) — ${rejectTarget.subject}. The parent will see this reason.`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Reason for rejection (optional but recommended)…"
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="secondary" onClick={() => { setRejectTarget(null); setRejectNote("") }}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject}>Confirm Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
