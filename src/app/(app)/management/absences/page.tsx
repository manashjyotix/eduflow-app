"use client"
import { useState } from "react"
import { ClipboardList } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { MOCK_ABSENCES } from "@/data/mock-absences"
import { AbsenceRow } from "@/components/domain/absence/AbsenceRow"

export default function AbsenceApprovalPage() {
  const [absences, setAbsences] = useState(MOCK_ABSENCES)

  const pending  = absences.filter(a => a.status === "pending")
  const approved = absences.filter(a => a.status === "approved")

  function approve(id: string) { setAbsences(prev => prev.map(a => a.id === id ? { ...a, status: "approved" as const } : a)) }
  function reject(id: string)  { setAbsences(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" as const } : a)) }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Approved Today ({approved.length})</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {approved.map(a => (
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
    </div>
  )
}
