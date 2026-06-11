"use client"
import { useState } from "react"
import { ClipboardList, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MOCK_ABSENCES } from "@/data/mock-absences"
import { PERIODS } from "@/lib/constants"

const periodLabel: Record<string, string> = Object.fromEntries(PERIODS.map(p => [p.id, p.label]))

export default function AbsencesPage() {
  const [query, setQuery] = useState("")
  const [absences, setAbsences] = useState(MOCK_ABSENCES)

  const filtered = absences.filter(a =>
    a.teacherName.toLowerCase().includes(query.toLowerCase())
  )

  const approved = absences.filter(a => a.status === "approved").length
  const pending  = absences.filter(a => a.status === "pending").length
  const rejected = absences.filter(a => a.status === "rejected").length

  function approve(id: string) {
    setAbsences(prev => prev.map(a => a.id === id ? { ...a, status: "approved" as const } : a))
  }
  function reject(id: string) {
    setAbsences(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" as const } : a))
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<ClipboardList size={22} />}
        title="Absence Tracker"
        subtitle="Review and approve teacher absence requests"
        actions={
          <Button size="default">
            <ClipboardList className="size-4" />
            Mark Absence
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Today"  value={absences.length}  icon={<ClipboardList className="size-5" />} />
        <KpiCard title="Approved"     value={approved}         icon={<CheckCircle className="size-5" />}   iconClassName="bg-success/20 text-success-foreground" />
        <KpiCard title="Pending"      value={pending}          icon={<Clock className="size-5" />}          iconClassName="bg-warning/20 text-warning-foreground" />
        <KpiCard title="Rejected"     value={rejected}         icon={<XCircle className="size-5" />}        iconClassName="bg-destructive/10 text-destructive" />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Absence Requests</CardTitle>
          <SearchInput
            placeholder="Search teacher..."
            className="h-8 w-56"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle className="size-6" />}
              title="No absences found"
              description="No absence requests match your search."
            />
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map(absence => (
                <li key={absence.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                      {absence.teacherName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{absence.teacherName}</p>
                      <p className="text-xs text-muted-foreground">
                        {absence.periods.length === 7
                          ? "Full day"
                          : absence.periods.map(p => periodLabel[p] ?? p).join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 italic">{absence.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge
                      variant={
                        absence.status === "approved" ? "success"
                        : absence.status === "pending"  ? "warning"
                        : absence.status === "rejected" ? "destructive"
                        : "secondary"
                      }
                      className="capitalize"
                    >
                      {absence.status}
                    </Badge>
                    {absence.status === "pending" && (
                      <>
                        <Button size="xs" onClick={() => approve(absence.id)}>Approve</Button>
                        <Button size="xs" variant="destructive" onClick={() => reject(absence.id)}>Reject</Button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
