"use client"
import { useState } from "react"
import { ClipboardList, CheckCircle, XCircle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MOCK_ABSENCES } from "@/data/mock-absences"
import { PERIODS } from "@/lib/constants"

const periodLabel: Record<string, string> = Object.fromEntries(PERIODS.map(p => [p.id, p.label]))

export default function AbsenceApprovalPage() {
  const [absences, setAbsences] = useState(MOCK_ABSENCES)

  const pending  = absences.filter(a => a.status === "pending")
  const approved = absences.filter(a => a.status === "approved")

  function approve(id: string) { setAbsences(prev => prev.map(a => a.id === id ? { ...a, status: "approved" as const } : a)) }
  function reject(id: string)  { setAbsences(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" as const } : a)) }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<ClipboardList size={22} />}
        title="Absence Approvals"
        subtitle="Review and approve teacher absence requests"
      />

      {pending.length > 0 && (
        <Card className="border-warning">
          <CardHeader className="pb-3 flex-row items-center justify-between">
            <CardTitle className="text-base">Pending Approval</CardTitle>
            <Badge variant="warning">{pending.length} pending</Badge>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {pending.map(a => (
                <li key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-9 rounded-full bg-warning/20 flex items-center justify-center text-warning-foreground text-xs font-semibold flex-shrink-0">
                      {a.teacherName.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{a.teacherName}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.periods.length === 7 ? "Full day" : a.periods.map(p => periodLabel[p] ?? p).join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground italic mt-0.5">{a.reason}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button size="xs" onClick={() => approve(a.id)}>
                      <CheckCircle className="size-3" />
                      Approve
                    </Button>
                    <Button size="xs" variant="destructive" onClick={() => reject(a.id)}>
                      <XCircle className="size-3" />
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Approved Today ({approved.length})</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {approved.map(a => (
              <li key={a.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-full bg-success/20 flex items-center justify-center text-success-foreground text-xs font-semibold flex-shrink-0">
                    {a.teacherName.split(" ").map(n => n[0]).join("")}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{a.teacherName}</p>
                    <p className="text-xs text-muted-foreground">{a.periods.length === 7 ? "Full day" : `${a.periods.length} periods`} · {a.reason}</p>
                  </div>
                </div>
                <Badge variant="success">Approved</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
