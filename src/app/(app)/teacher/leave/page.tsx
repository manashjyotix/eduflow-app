"use client"
import { useState } from "react"
import { Calendar, Send } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { TEACHING_PERIODS } from "@/lib/constants"

const LEAVE_HISTORY = [
  { id: "l1", date: "2026-05-15", type: "sick_leave",    periods: 7, reason: "High fever", status: "approved" },
  { id: "l2", date: "2026-04-22", type: "casual_leave",  periods: 3, reason: "Personal work", status: "approved" },
  { id: "l3", date: "2026-04-10", type: "earned_leave",  periods: 7, reason: "Family function", status: "rejected" },
]

const LEAVE_TYPES = [
  { value: "sick_leave",    label: "Sick Leave",    balance: 5 },
  { value: "casual_leave",  label: "Casual Leave",  balance: 8 },
  { value: "earned_leave",  label: "Earned Leave",  balance: 12 },
  { value: "emergency",     label: "Emergency",     balance: "—" },
  { value: "official_duty", label: "Official Duty", balance: "—" },
]

export default function TeacherLeavePage() {
  const [fullDay, setFullDay] = useState(true)
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>([])
  const [leaveType, setLeaveType] = useState("sick_leave")
  const [reason, setReason] = useState("")

  function togglePeriod(id: string) {
    setSelectedPeriods(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id])
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<Calendar size={22} />}
        title="Apply for Leave"
        subtitle="Submit an absence request to management"
      />

      {/* Balance cards */}
      <div className="grid grid-cols-3 gap-4">
        {LEAVE_TYPES.slice(0, 3).map(lt => (
          <Card key={lt.value}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{lt.balance}</p>
              <p className="text-xs text-muted-foreground mt-1">{lt.label} remaining</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Application form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">New Application</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-5">
          {/* Leave type */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Leave Type</label>
            <div className="flex flex-wrap gap-2">
              {LEAVE_TYPES.map(lt => (
                <Button
                  key={lt.value}
                  size="xs"
                  variant={leaveType === lt.value ? "default" : "outline"}
                  onClick={() => setLeaveType(lt.value)}
                >
                  {lt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Full day toggle */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Duration</label>
            <div className="flex gap-2">
              <Button size="xs" variant={fullDay ? "default" : "outline"} onClick={() => setFullDay(true)}>Full Day</Button>
              <Button size="xs" variant={!fullDay ? "default" : "outline"} onClick={() => setFullDay(false)}>Specific Periods</Button>
            </div>
            {!fullDay && (
              <div className="flex flex-wrap gap-2 mt-2">
                {TEACHING_PERIODS.map(p => (
                  <Button
                    key={p.id}
                    size="xs"
                    variant={selectedPeriods.includes(p.id) ? "default" : "outline"}
                    onClick={() => togglePeriod(p.id)}
                  >
                    {p.id}
                    <span className="ml-1 text-[10px] opacity-70">{p.time.split(" – ")[0]}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Reason */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Reason</label>
            <Input
              placeholder="Brief reason for absence..."
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="h-8"
            />
          </div>

          <Button className="w-full" disabled={!reason.trim()}>
            <Send className="size-4" />
            Submit Request
          </Button>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Leave History</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {LEAVE_HISTORY.map(l => (
              <li key={l.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div>
                  <p className="text-sm font-medium">{l.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(l.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                    {l.periods === 7 ? "Full day" : `${l.periods} periods`} ·{" "}
                    {l.type.replace("_", " ")}
                  </p>
                </div>
                <Badge variant={l.status === "approved" ? "success" : l.status === "pending" ? "warning" : "destructive"} className="capitalize flex-shrink-0">
                  {l.status}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
