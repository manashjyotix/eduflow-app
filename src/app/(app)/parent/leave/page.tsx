"use client"

import { useState } from "react"
import { toast } from "sonner"
import { FileText, Send, CalendarDays, User, History, ChevronsUpDown } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"

type LeaveType = "sick" | "family_emergency" | "personal" | "religious" | "travel" | "medical" | "other"
type LeaveStatus = "approved" | "pending" | "rejected"
type DurationMode = "single" | "multiple"

interface PastLeave {
  id: string
  subject: string
  from: string
  to: string
  days: number
  type: LeaveType
  reason: string
  status: LeaveStatus
  submittedOn: string
}

const PAST_LEAVES: PastLeave[] = [
  { id: "pl1", subject: "Family function",       from: "2026-06-17", to: "2026-06-17", days: 1, type: "personal",         reason: "Family function at relatives' house", status: "approved", submittedOn: "2026-06-10" },
  { id: "pl2", subject: "Fever — doctor advised", from: "2026-06-03", to: "2026-06-04", days: 2, type: "sick",             reason: "Rohit had fever and was advised rest by doctor", status: "approved", submittedOn: "2026-06-03" },
  { id: "pl3", subject: "Grandfather hospitalised", from: "2026-05-22", to: "2026-05-22", days: 1, type: "family_emergency", reason: "Grandfather hospitalised — Rohit needed to accompany", status: "approved", submittedOn: "2026-05-22" },
  { id: "pl4", subject: "Festival trip",          from: "2026-05-08", to: "2026-05-09", days: 2, type: "personal",         reason: "Trip to native village for festival", status: "rejected", submittedOn: "2026-05-05" },
  { id: "pl5", subject: "Stomach ache",           from: "2026-04-15", to: "2026-04-15", days: 1, type: "sick",             reason: "Stomach ache and mild diarrhoea", status: "approved", submittedOn: "2026-04-15" },
]

const TYPE_LABELS: Record<LeaveType, string> = {
  sick:             "Sick Leave",
  family_emergency: "Family Emergency",
  personal:         "Personal",
  religious:        "Religious / Festival",
  travel:           "Travel",
  medical:          "Medical Appointment",
  other:            "Other",
}

const STATUS_VARIANTS: Record<LeaveStatus, "success" | "destructive" | "warning"> = {
  approved: "success",
  rejected: "destructive",
  pending:  "warning",
}

type SortField = "subject" | "from" | "type" | "days" | "status" | "submittedOn"
type SortDir = "asc" | "desc"

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export default function ParentLeavePage() {
  const [durationMode, setDurationMode] = useState<DurationMode>("single")
  const [from, setFrom]         = useState("")
  const [to, setTo]             = useState("")
  const [subject, setSubject]   = useState("")
  const [leaveType, setLeaveType] = useState("")
  const [otherType, setOtherType] = useState("")
  const [reason, setReason]     = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [pastLeaves, setPastLeaves] = useState<PastLeave[]>(PAST_LEAVES)

  const [sortField, setSortField] = useState<SortField>("submittedOn")
  const [sortDir, setSortDir]     = useState<SortDir>("desc")

  function toggleSort(field: SortField) {
    if (sortField === field) setSortDir(d => (d === "asc" ? "desc" : "asc"))
    else { setSortField(field); setSortDir("asc") }
  }

  const sortedLeaves = [...pastLeaves].sort((a, b) => {
    let cmp = 0
    if (sortField === "subject")          cmp = a.subject.localeCompare(b.subject)
    else if (sortField === "from")        cmp = a.from.localeCompare(b.from)
    else if (sortField === "type")        cmp = TYPE_LABELS[a.type].localeCompare(TYPE_LABELS[b.type])
    else if (sortField === "days")        cmp = a.days - b.days
    else if (sortField === "status")      cmp = a.status.localeCompare(b.status)
    else if (sortField === "submittedOn") cmp = a.submittedOn.localeCompare(b.submittedOn)
    return sortDir === "asc" ? cmp : -cmp
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const effectiveTo = durationMode === "single" ? from : to
    const days = durationMode === "single"
      ? 1
      : Math.max(1, Math.round((new Date(effectiveTo).getTime() - new Date(from).getTime()) / 86400000) + 1)
    const newLeave: PastLeave = {
      id: `pl${Date.now()}`,
      subject: subject.trim() || "Leave request",
      from,
      to: effectiveTo,
      days,
      type: (leaveType || "personal") as LeaveType,
      reason: reason.trim(),
      status: "pending",
      submittedOn: new Date().toISOString().split("T")[0],
    }
    setPastLeaves(prev => [newLeave, ...prev])
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 4000)
    toast.success("Leave request submitted", {
      description: `${days} day${days > 1 ? "s" : ""} · pending admin review.`,
    })
    setDurationMode("single")
    setFrom(""); setTo(""); setSubject(""); setLeaveType(""); setOtherType(""); setReason("")
  }

  const sortableHeaders: { label: string; field: SortField; className?: string }[] = [
    { label: "Subject", field: "subject" },
    { label: "Date Range", field: "from" },
    { label: "Type", field: "type" },
    { label: "Days", field: "days" },
    { label: "Status", field: "status" },
    { label: "Submitted", field: "submittedOn" },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<FileText size={20} />}
        title="Leave Request"
        subtitle="Apply for student leave — Rohit Das, Class VIII-A"
      />

      {submitted && (
        <Alert className="border-success-foreground/30 bg-success/40">
          <AlertDescription className="text-success-foreground font-medium">
            Leave request submitted successfully! Admin will review and respond within 24 hours.
          </AlertDescription>
        </Alert>
      )}

      {/* Form card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="tracking-tight text-base font-semibold flex items-center gap-2 leading-none">
            <CalendarDays className="size-4 text-primary shrink-0" />
            New Leave Application
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Auto-filled fields */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Student Name</Label>
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-muted/30 text-sm text-muted-foreground">
                <User className="size-3.5" />
                Rohit Das
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Class</Label>
              <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-muted/30 text-sm text-muted-foreground">
                VIII-A
              </div>
            </div>

            {/* Duration mode radio */}
            <div className="space-y-1.5 md:col-span-2">
              <Label className="text-xs font-semibold">Leave Duration</Label>
              <RadioGroup
                value={durationMode}
                onValueChange={(v) => {
                  setDurationMode(v as DurationMode)
                  if (v === "single") setTo("")
                }}
                className="flex flex-wrap items-center gap-6 pt-1"
              >
                {([
                  { v: "single",   label: "Single Day" },
                  { v: "multiple", label: "Multiple Days" },
                ] as const).map(opt => (
                  <div key={opt.v} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.v} id={`duration-${opt.v}`} />
                    <Label htmlFor={`duration-${opt.v}`} className="text-sm font-normal cursor-pointer">
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {durationMode === "single" ? (
              <div className="space-y-1.5">
                <Label htmlFor="from" className="text-xs font-semibold">Date</Label>
                <Input
                  id="from"
                  type="date"
                  value={from}
                  onChange={e => setFrom(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="from" className="text-xs font-semibold">From Date</Label>
                  <Input
                    id="from"
                    type="date"
                    value={from}
                    onChange={e => setFrom(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="to" className="text-xs font-semibold">To Date</Label>
                  <Input
                    id="to"
                    type="date"
                    value={to}
                    onChange={e => setTo(e.target.value)}
                    min={from || new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Leave Type</Label>
              <Select value={leaveType} onValueChange={setLeaveType} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select leave type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                  <SelectItem value="family_emergency">Family Emergency</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                  <SelectItem value="religious">Religious / Festival</SelectItem>
                  <SelectItem value="travel">Travel</SelectItem>
                  <SelectItem value="medical">Medical Appointment</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {leaveType === "other" && (
              <div className="space-y-1.5">
                <Label htmlFor="otherType" className="text-xs font-semibold">Specify Leave Type</Label>
                <Input
                  id="otherType"
                  placeholder="e.g. Sports event, Competition..."
                  value={otherType}
                  onChange={e => setOtherType(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="subject" className="text-xs font-semibold">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief subject / title for this request"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="reason" className="text-xs font-semibold">Reason</Label>
              <Textarea
                id="reason"
                placeholder="Please describe the reason for leave..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" className="gap-2">
                <Send className="size-4" />
                Submit Leave Request
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Past requests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="tracking-tight text-base font-semibold flex items-center gap-2 leading-none">
            <History className="size-4 text-primary shrink-0" />
            Past Leave Requests
          </CardTitle>
        </CardHeader>
        <Separator />
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <caption className="sr-only">Past student leave requests</caption>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                {sortableHeaders.map(h => (
                  <TableHead
                    key={h.field}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground h-auto"
                    aria-sort={sortField === h.field ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(h.field)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSort(h.field) } }}
                      className="inline-flex items-center gap-1 font-semibold cursor-pointer select-none hover:text-foreground"
                    >
                      {h.label}
                      <ChevronsUpDown className={`size-3 ${sortField === h.field ? "text-primary" : "opacity-40"}`} />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedLeaves.map((l, i) => (
                <TableRow key={l.id} className={`hover:bg-muted/20 ${i % 2 ? "bg-muted/10" : ""}`}>
                  <TableCell className="px-4 py-3 text-xs font-medium max-w-xs truncate" title={l.reason}>{l.subject}</TableCell>
                  <TableCell className="px-4 py-3 text-xs whitespace-nowrap">
                    {formatDate(l.from)}{l.from !== l.to ? ` – ${formatDate(l.to)}` : ""}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{TYPE_LABELS[l.type]}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium">{l.days} day{l.days > 1 ? "s" : ""}</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[l.status]} className="capitalize">{l.status}</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-xs text-muted-foreground">{formatDate(l.submittedOn)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
