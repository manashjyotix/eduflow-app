"use client"
import { useState, useMemo } from "react"
import { ClipboardList, Search, Filter } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MOCK_ABSENCES } from "@/data/mock-absences"
import type { Absence } from "@/data/mock-absences"
import { AbsenceRow } from "@/components/domain/absence/AbsenceRow"
import { EmptyState } from "@/components/shared/empty-state"

export default function AbsenceApprovalPage() {
  const [absences, setAbsences] = useState(MOCK_ABSENCES)

  // ── Previous section filters ─────────────────────────────────────────────
  const [searchQuery, setSearchQuery]     = useState("")
  const [statusFilter, setStatusFilter]   = useState<"all" | Absence["status"]>("all")
  const [categoryFilter, setCategoryFilter] = useState<"all" | Absence["category"]>("all")

  const pending  = absences.filter(a => a.status === "pending")
  const previous = absences.filter(a => a.status !== "pending")

  const filteredPrevious = useMemo(() => {
    return previous.filter(a => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        a.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.reason.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus   = statusFilter === "all"   || a.status === statusFilter
      const matchesCategory = categoryFilter === "all" || a.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [previous, searchQuery, statusFilter, categoryFilter])

  function approve(id: string) { setAbsences(prev => prev.map(a => a.id === id ? { ...a, status: "approved" as const } : a)) }
  function reject(id: string)  { setAbsences(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" as const } : a)) }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<ClipboardList size={22} />}
        title="Absence Approvals"
        subtitle="Review and approve teacher absence requests"
      />

      {/* ── Pending Approval ───────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <Card className="border-warning">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Pending Approval ({pending.length})</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {pending.map(a => (
                <AbsenceRow
                  key={a.id}
                  absence={a}
                  onApprove={approve}
                  onReject={reject}
                />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* ── Previous Absence Approvals ─────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3 gap-3">
          <CardTitle className="text-base">
            Previous Absence Approvals
            {filteredPrevious.length === previous.length
              ? ` (${previous.length})`
              : ` (${filteredPrevious.length} of ${previous.length})`}
          </CardTitle>

          {/* Filter bar */}
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none"
                aria-hidden="true"
              />
              <Input
                className="pl-8 h-8 text-sm"
                placeholder="Search teacher or reason…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                aria-label="Search previous absences"
              />
            </div>

            {/* Status filter */}
            <Select value={statusFilter} onValueChange={v => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className="h-8 w-full sm:w-36 text-sm" aria-label="Filter by status">
                <Filter className="size-3.5 text-muted-foreground mr-1" aria-hidden="true" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            {/* Category filter */}
            <Select value={categoryFilter} onValueChange={v => setCategoryFilter(v as typeof categoryFilter)}>
              <SelectTrigger className="h-8 w-full sm:w-44 text-sm" aria-label="Filter by category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="sick_leave">Sick Leave</SelectItem>
                <SelectItem value="casual_leave">Casual Leave</SelectItem>
                <SelectItem value="earned_leave">Earned Leave</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
                <SelectItem value="official_duty">Official Duty</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {filteredPrevious.length === 0 ? (
            <EmptyState
              icon={<ClipboardList className="size-8 text-muted-foreground" />}
              title="No records found"
              description={
                searchQuery || statusFilter !== "all" || categoryFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "No previous absence approvals yet."
              }
              className="py-10"
            />
          ) : (
            <ul className="divide-y divide-border">
              {filteredPrevious.map(a => (
                <AbsenceRow
                  key={a.id}
                  absence={a}
                  onApprove={approve}
                  onReject={reject}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
