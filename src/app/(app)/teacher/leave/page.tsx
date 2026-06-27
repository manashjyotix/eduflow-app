"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Calendar, Send, Clock, AlertCircle, CheckCircle2, XCircle,
  CalendarDays, FileText, History, ChevronsUpDown, User,
  Stethoscope, Briefcase, Coffee, Zap, Shield, Info,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table"
import { PeriodPicker } from "@/components/shared/period-picker"
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from "@/components/ui/form"
import { applyLeaveSchema, type ApplyLeaveInput } from "@/lib/schemas/leave"

// ─── Static leave quota data for Priya Sharma ─────────────────────────────────
const LEAVE_QUOTA = [
  { value: "sick",     label: "Sick Leave",    total: 7,  used: 2, icon: Stethoscope, color: "red"    as const },
  { value: "casual",   label: "Casual Leave",  total: 10, used: 2, icon: Coffee,      color: "brand"  as const },
  { value: "earned",   label: "Earned Leave",  total: 12, used: 0, icon: Shield,      color: "green"  as const },
] as const

const LEAVE_TYPES = [
  { value: "sick",          label: "Sick Leave",    icon: Stethoscope },
  { value: "casual",        label: "Casual Leave",  icon: Coffee      },
  { value: "half_day",      label: "Half Day",      icon: Clock       },
  { value: "emergency",     label: "Emergency",     icon: Zap         },
  { value: "official_duty", label: "Official Duty", icon: Briefcase   },
] as const
type LeaveTypeValue = typeof LEAVE_TYPES[number]["value"]

// ─── Leave history ─────────────────────────────────────────────────────────────
type LeaveEntry = {
  id: string; date: string; type: string; duration: string
  reason: string; status: "approved" | "rejected" | "pending" | "cancelled"
  approvedBy?: string; appliedOn: string; note?: string
}

const INITIAL_HISTORY: LeaveEntry[] = [
  { id: "l1", date: "2026-05-15", type: "Sick Leave",    duration: "Full Day",   reason: "High fever and viral infection", status: "approved", approvedBy: "Admin", appliedOn: "2026-05-14", note: "Get well soon!" },
  { id: "l2", date: "2026-04-22", type: "Casual Leave",  duration: "3 periods",  reason: "Personal work — bank visit",    status: "approved", approvedBy: "Management", appliedOn: "2026-04-21" },
  { id: "l3", date: "2026-04-10", type: "Earned Leave",  duration: "Full Day",   reason: "Family function — sister's wedding", status: "rejected", approvedBy: "Admin", appliedOn: "2026-04-08", note: "Insufficient notice period." },
  { id: "l4", date: "2026-03-05", type: "Official Duty", duration: "Full Day",   reason: "District-level teacher training workshop", status: "approved", approvedBy: "Principal", appliedOn: "2026-03-01" },
]

type SortField = "date" | "type" | "duration" | "status" | "appliedOn"
type SortDir   = "asc" | "desc"

const STATUS_CONFIG: Record<LeaveEntry["status"], { label: string; variant: "success" | "destructive" | "warning" | "secondary"; icon: React.ElementType }> = {
  approved:  { label: "Approved",  variant: "success",     icon: CheckCircle2 },
  rejected:  { label: "Rejected",  variant: "destructive", icon: XCircle      },
  pending:   { label: "Pending",   variant: "warning",     icon: Clock        },
  cancelled: { label: "Cancelled", variant: "secondary",   icon: XCircle      },
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export default function TeacherLeavePage() {
  const [fullDay, setFullDay] = useState(true)
  const [leaveTypeUI, setLeaveTypeUI] = useState<LeaveTypeValue>("sick")
  const [history, setHistory] = useState<LeaveEntry[]>(INITIAL_HISTORY)
  const [submitted, setSubmitted] = useState(false)
  const [sortField, setSortField] = useState<SortField>("appliedOn")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  const today = new Date().toISOString().split("T")[0]

  const form = useForm<ApplyLeaveInput>({
    resolver: zodResolver(applyLeaveSchema),
    mode: "onBlur",
    defaultValues: { leaveType: "sick", reason: "", startDate: today, periods: [] },
  })

  function handleDurationToggle(isFullDay: boolean) {
    setFullDay(isFullDay)
    if (!isFullDay) form.setValue("leaveType", "partial", { shouldValidate: true })
    else { form.setValue("leaveType", leaveTypeUI, { shouldValidate: true }); form.setValue("periods", [], { shouldValidate: false }) }
  }
  function handleLeaveTypeClick(value: LeaveTypeValue) {
    setLeaveTypeUI(value)
    if (fullDay) form.setValue("leaveType", value, { shouldValidate: true })
  }

  function onSubmit(data: ApplyLeaveInput) {
    const typeLabel = LEAVE_TYPES.find(lt => lt.value === leaveTypeUI)?.label ?? leaveTypeUI.replace(/_/g, " ")
    const duration  = fullDay ? "Full Day" : `${data.periods?.length ?? 0} period(s)`
    const newEntry: LeaveEntry = {
      id:        `l${Date.now()}`,
      date:      data.startDate,
      type:      typeLabel,
      duration,
      reason:    data.reason,
      status:    "pending",
      appliedOn: today,
    }
    setHistory(prev => [newEntry, ...prev])
    form.reset({ leaveType: "sick", reason: "", startDate: today, periods: [] })
    setFullDay(true)
    setLeaveTypeUI("sick")
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 5000)
    toast.success("Leave request submitted", { description: `${typeLabel} · ${duration}` })
  }

  function toggleSort(f: SortField) {
    if (sortField === f) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortField(f); setSortDir("asc") }
  }

  const sorted = [...history].sort((a, b) => {
    let cmp = 0
    if      (sortField === "date")      cmp = a.date.localeCompare(b.date)
    else if (sortField === "type")      cmp = a.type.localeCompare(b.type)
    else if (sortField === "duration")  cmp = a.duration.localeCompare(b.duration)
    else if (sortField === "status")    cmp = a.status.localeCompare(b.status)
    else if (sortField === "appliedOn") cmp = a.appliedOn.localeCompare(b.appliedOn)
    return sortDir === "asc" ? cmp : -cmp
  })

  const totalUsed = LEAVE_QUOTA.reduce((s, q) => s + q.used, 0)
  const totalAvail = LEAVE_QUOTA.reduce((s, q) => s + (q.total - q.used), 0)
  const pendingCount = history.filter(l => l.status === "pending").length
  const approvedCount = history.filter(l => l.status === "approved").length

  const SORT_HEADERS: { label: string; field: SortField }[] = [
    { label: "Leave Date",  field: "date"      },
    { label: "Type",        field: "type"      },
    { label: "Duration",    field: "duration"  },
    { label: "Reason",      field: "duration"  }, // non-sortable visually, field unused
    { label: "Status",      field: "status"    },
    { label: "Applied On",  field: "appliedOn" },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Calendar size={22} />}
        title="Leave Management"
        subtitle="Apply for leave, track history, and view your quota"
      />

      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {LEAVE_QUOTA.map(q => {
          const remaining = q.total - q.used
          const pct = Math.round((remaining / q.total) * 100)
          return (
            <KpiCard
              key={q.value}
              title={q.label}
              value={remaining}
              subtitle={`${q.used} used · ${q.total} total`}
              icon={<q.icon className="size-5" />}
              tone={remaining <= 2 ? "red" : q.color}
              trend={{ value: remaining > 0 ? remaining : -q.used, label: "remaining" }}
              sparkline={{ variant: "arc", value: pct, color: `var(--ef-${remaining <= 2 ? "red" : q.color === "brand" ? "brand" : q.color})` }}
            />
          )
        })}
        <KpiCard
          title="This Year"
          value={`${totalUsed}d`}
          subtitle={`${totalAvail} days available`}
          icon={<CalendarDays className="size-5" />}
          tone="amber"
          sparkline={{ variant: "bar", data: [2, 1, 3, 0, 2, 1, totalUsed], color: "var(--ef-amber)" }}
        />
      </div>

      {/* ═══ New Application ═══ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="tracking-tight text-base font-semibold flex items-center gap-2 leading-none">
            <CalendarDays className="size-4 text-primary shrink-0" />
            New Leave Application
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-5">

          {submitted && (
            <Alert className="mb-5 border-success-foreground/30 bg-success/10">
              <CheckCircle2 className="size-4 text-success-foreground" />
              <AlertDescription className="text-success-foreground font-medium">
                Leave request submitted! Admin / Management will review and respond within 24 hours.
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* Auto-filled teacher info */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Teacher Name</Label>
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-muted/30 text-sm text-muted-foreground">
                  <User className="size-3.5" /> Priya Sharma
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Department / Subject</Label>
                <div className="flex items-center gap-2 h-9 px-3 rounded-md border border-border bg-muted/30 text-sm text-muted-foreground">
                  <Briefcase className="size-3.5" /> Mathematics &amp; Science · High Section
                </div>
              </div>

              {/* Leave Type */}
              <FormField
                control={form.control}
                name="leaveType"
                render={() => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs font-semibold">Leave Type</FormLabel>
                    <FormControl>
                      <input type="hidden" {...form.register("leaveType")} />
                    </FormControl>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {LEAVE_TYPES.map(lt => (
                        <button
                          key={lt.value}
                          type="button"
                          onClick={() => handleLeaveTypeClick(lt.value)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            leaveTypeUI === lt.value
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-card text-foreground border-border hover:bg-muted"
                          }`}
                        >
                          <lt.icon className="size-3.5" />
                          {lt.label}
                        </button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration mode */}
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs font-semibold">Duration</Label>
                <RadioGroup
                  value={fullDay ? "full" : "partial"}
                  onValueChange={v => handleDurationToggle(v === "full")}
                  className="flex flex-wrap items-center gap-6 pt-1"
                >
                  {[
                    { v: "full",    label: "Full Day" },
                    { v: "partial", label: "Specific Periods" },
                  ].map(opt => (
                    <div key={opt.v} className="flex items-center gap-2">
                      <RadioGroupItem value={opt.v} id={`dur-${opt.v}`} />
                      <Label htmlFor={`dur-${opt.v}`} className="text-sm font-normal cursor-pointer">{opt.label}</Label>
                    </div>
                  ))}
                </RadioGroup>

                {!fullDay && (
                  <FormField
                    control={form.control}
                    name="periods"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <PeriodPicker
                            value={field.value ?? []}
                            onChange={next => field.onChange(next)}
                            allowFullDay={false}
                            className="mt-2"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-semibold">Leave Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        min={today}
                        className="h-9"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact during leave */}
              <div className="space-y-1.5">
                <Label htmlFor="contact" className="text-xs font-semibold">Contact During Leave <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="contact" type="tel" placeholder="+91 98765 43210" className="h-9" />
              </div>

              {/* Substitute suggestion */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Suggested Substitute <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Select>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Let management decide..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="biju">Biju Das (Mathematics)</SelectItem>
                    <SelectItem value="anita">Anita Devi (Science)</SelectItem>
                    <SelectItem value="sunita">Sunita Borah (Mathematics)</SelectItem>
                    <SelectItem value="rajesh">Rajesh Kalita (English)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Supporting document */}
              <div className="space-y-1.5">
                <Label htmlFor="doc" className="text-xs font-semibold">Supporting Document <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Input id="doc" type="file" accept=".pdf,.jpg,.jpeg,.png" className="h-9 cursor-pointer" />
              </div>

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-xs font-semibold">Reason for Leave</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Please describe the reason for your leave request (min 10 characters)..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Info note */}
              <div className="md:col-span-2">
                <div className="flex items-start gap-2 text-[11px] text-muted-foreground rounded-lg bg-muted/50 px-3 py-2">
                  <Info className="size-3.5 mt-0.5 shrink-0" />
                  <span>Requests submitted before 8:00 AM are processed the same day. Management will assign a proxy teacher after approval. You will be notified via the app and SMS.</span>
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end">
                <Button type="submit" disabled={form.formState.isSubmitting} className="gap-2 min-w-[160px]">
                  <Send className="size-4" />
                  Submit Request
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* ═══ Leave History Table ═══ */}
      <Card>
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="tracking-tight text-base font-semibold flex items-center gap-2 leading-none">
            <History className="size-4 text-primary shrink-0" />
            Leave History
          </CardTitle>
          <div className="flex items-center gap-2">
            {pendingCount > 0 && <Badge variant="warning">{pendingCount} pending</Badge>}
            <Badge variant="secondary">{approvedCount} approved</Badge>
          </div>
        </CardHeader>
        <Separator />
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                {SORT_HEADERS.map((h, i) => (
                  <TableHead
                    key={`${h.field}-${i}`}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground h-auto"
                  >
                    <button
                      type="button"
                      onClick={() => i !== 3 && toggleSort(h.field)}
                      className={`inline-flex items-center gap-1 font-semibold select-none ${i !== 3 ? "cursor-pointer hover:text-foreground" : "cursor-default"}`}
                    >
                      {h.label}
                      {i !== 3 && (
                        <ChevronsUpDown className={`size-3 ${sortField === h.field ? "text-primary" : "opacity-40"}`} />
                      )}
                    </button>
                  </TableHead>
                ))}
                <TableHead className="px-4 py-3 text-xs font-semibold text-muted-foreground">Reviewed By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((l, i) => {
                const st = STATUS_CONFIG[l.status]
                return (
                  <TableRow key={l.id} className={`hover:bg-muted/20 ${i % 2 ? "bg-muted/10" : ""}`}>
                    <TableCell className="px-4 py-3 text-xs font-medium whitespace-nowrap">
                      {fmt(l.date)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{l.type}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs font-medium">{l.duration}</TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground max-w-[220px]">
                      <span className="block truncate" title={l.reason}>{l.reason}</span>
                      {l.note && (
                        <span className="block text-[10px] text-warning-foreground mt-0.5 truncate" title={l.note}>
                          Note: {l.note}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant={st.variant} className="gap-1 capitalize">
                        <st.icon className="size-3" />
                        {st.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {fmt(l.appliedOn)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {l.approvedBy ?? "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
              {sorted.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                    <AlertCircle className="size-8 mx-auto mb-2 opacity-30" />
                    No leave requests yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}
