"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  ClipboardList, CheckCircle, XCircle, Clock, AlertTriangle,
  Plus, Search, Filter, UserX, Calendar, ChevronDown,
  TrendingUp,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { EduBarChart } from "@/components/shared/edu-bar-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { MOCK_ABSENCES, type Absence } from "@/data/mock-absences"
import { TEACHERS } from "@/data/teachers"
import { PERIOD_IDS, PERIODS } from "@/data/periods"
import { AbsenceRow } from "@/components/domain/absence/AbsenceRow"
import { markAbsenceSchema, type MarkAbsenceInput } from "@/lib/schemas/absence"

const ABSENCE_TREND = [
  { day: "Mon", absences: 2 },
  { day: "Tue", absences: 1 },
  { day: "Wed", absences: 3 },
  { day: "Thu", absences: 3 },
  { day: "Fri", absences: 2 },
  { day: "Sat", absences: 1 },
  { day: "Today", absences: 3 },
]

const TEACHING_PERIODS = PERIODS.filter(p => !p.isBreak)

const CATEGORY_LABELS: Record<string, string> = {
  sick_leave:    "Sick Leave",
  casual_leave:  "Casual Leave",
  earned_leave:  "Earned Leave",
  emergency:     "Emergency",
  official_duty: "Official Duty",
  personal:      "Personal",
  maternity_leave: "Maternity Leave",
  paternity_leave: "Paternity Leave",
  bereavement:   "Bereavement",
  other:         "Other",
}

export default function AbsencesPage() {
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [absences, setAbsences] = useState(MOCK_ABSENCES)
  const [markOpen, setMarkOpen] = useState(false)
  const [absenceType, setAbsenceType] = useState<"full" | "partial">("full")

  const form = useForm<MarkAbsenceInput>({
    resolver: zodResolver(markAbsenceSchema) as never,
    defaultValues: {
      teacherId: "",
      date: new Date().toISOString().split("T")[0],
      periods: [],
      reason: "",
      category: "sick_leave",
      isFullDay: true,
    },
  })

  const filtered = absences.filter(a => {
    const matchSearch = a.teacherName.toLowerCase().includes(query.toLowerCase())
    const matchStatus = statusFilter === "all" || a.status === statusFilter
    return matchSearch && matchStatus
  })

  const approved = absences.filter(a => a.status === "approved").length
  const pending  = absences.filter(a => a.status === "pending").length
  const rejected = absences.filter(a => a.status === "rejected").length

  function approve(id: string) {
    const target = absences.find(a => a.id === id)
    setAbsences(prev => prev.map(a => a.id === id ? { ...a, status: "approved" as const } : a))
    toast.success("Absence approved", { description: target ? `${target.teacherName} is now marked absent.` : undefined })
  }
  function reject(id: string) {
    const target = absences.find(a => a.id === id)
    setAbsences(prev => prev.map(a => a.id === id ? { ...a, status: "rejected" as const } : a))
    toast.error("Absence rejected", { description: target ? `${target.teacherName}'s request was rejected.` : undefined })
  }

  function handleMarkAbsence(values: MarkAbsenceInput) {
    const teacher = TEACHERS.find(t => t.id === values.teacherId)
    if (!teacher) return

    // Map schema category to Absence type category (best-effort)
    const mappedCategory = (
      ["sick_leave", "casual_leave", "earned_leave", "emergency", "official_duty"].includes(values.category)
        ? values.category
        : "sick_leave"
    ) as Absence["category"]

    const newAbsence: Absence = {
      id: `a${Date.now()}`,
      teacherId: values.teacherId,
      teacherName: teacher.name,
      date: values.date,
      periods: absenceType === "full" ? [...PERIOD_IDS] : values.periods,
      reason: values.reason,
      category: mappedCategory,
      status: "pending",
      appliedAt: new Date().toISOString(),
    }
    setAbsences(prev => [newAbsence, ...prev])
    setMarkOpen(false)
    form.reset()
    setAbsenceType("full")
    toast.success("Absence marked", { description: `${teacher.name} marked absent — pending approval.` })
  }

  function openMarkDialog() {
    form.reset({
      teacherId: "",
      date: new Date().toISOString().split("T")[0],
      periods: [],
      reason: "",
      category: "sick_leave",
      isFullDay: true,
    })
    setAbsenceType("full")
    setMarkOpen(true)
  }

  function exportCsv() {
    const rows = [
      ["Teacher", "Date", "Periods", "Category", "Reason", "Status"],
      ...absences.map(a => [a.teacherName, a.date, a.periods.join(" "), a.category, a.reason, a.status]),
    ]
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `absences-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
    toast.success("CSV exported", { description: `${absences.length} absence records.` })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<ClipboardList size={22} />}
        title="Absence Tracker"
        subtitle="Review and approve teacher absence requests"
        actions={
          <Button size="default" onClick={openMarkDialog}>
            <Plus className="size-4" /> Mark Absence
          </Button>
        }
      />

      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard title="Total Today"  value={absences.length}  icon={<ClipboardList className="size-5" />} sparkline={{ variant: "bar", data: [1,2,1,3,2,1,absences.length] }} />
        <KpiCard title="Approved"     value={approved}         icon={<CheckCircle className="size-5" />}   iconClassName="bg-success/20 text-success-foreground" sparkline={{ variant: "bar", data: [1,2,1,2,1,1,approved], color: "var(--ef-green)" }} />
        <KpiCard title="Pending"      value={pending}          icon={<Clock className="size-5" />}          iconClassName="bg-warning/20 text-warning-foreground" sparkline={{ variant: "bar", data: [0,1,0,1,1,0,pending], color: "var(--ef-amber)" }} />
        <KpiCard title="Rejected"     value={rejected}         icon={<XCircle className="size-5" />}        iconClassName="bg-destructive/10 text-destructive" sparkline={{ variant: "bar", data: [0,0,0,1,0,0,rejected], color: "var(--ef-red)" }} />
      </div>

      {/* Absence Trend Chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" /> 7-Day Absence Trend
          </CardTitle>
          <Badge variant="secondary">This week</Badge>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <EduBarChart
            data={ABSENCE_TREND}
            series={[{ dataKey: "absences", name: "Absences", color: "var(--ef-red)" }]}
            xKey="day"
            height={110}
            showYAxis={false}
            tooltipFormatter={v => `${v} absent`}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 pb-3 flex-wrap">
          <CardTitle className="text-base">Absence Requests</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <SearchInput
                placeholder="Search teacher..."
                className="h-8 w-52 pl-8"
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
          {filtered.length === 0 ? (
            <EmptyState icon={<AlertTriangle className="size-6" />} title="No absences found" description="No absence requests match your search." />
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map(absence => (
                <AbsenceRow
                  key={absence.id}
                  absence={absence}
                  onApprove={approve}
                  onReject={reject}
                />
              ))}
            </ul>
          )}
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/20">
            <span className="text-xs text-muted-foreground">Showing {filtered.length} of {absences.length} records</span>
            <Button variant="ghost" size="sm" className="text-xs" onClick={exportCsv}>Export CSV</Button>
          </div>
        </CardContent>
      </Card>

      {/* Mark Absence Dialog */}
      <Dialog open={markOpen} onOpenChange={setMarkOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserX className="size-5 text-destructive" /> Mark Teacher Absence
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleMarkAbsence)} className="flex flex-col gap-4">

              {/* Teacher */}
              <FormField
                control={form.control}
                name="teacherId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teacher *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select teacher..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEACHERS.filter(t => t.status === "active").map(t => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} — {t.subjects.join(", ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date */}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date *</FormLabel>
                    <FormControl>
                      <input
                        type="date"
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Absence Type toggle */}
              <div>
                <p className="text-sm font-medium mb-1.5">Absence Type</p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={absenceType === "full" ? "default" : "outline"}
                    onClick={() => {
                      setAbsenceType("full")
                      form.setValue("isFullDay", true)
                      form.setValue("periods", [...PERIOD_IDS] as MarkAbsenceInput["periods"])
                    }}
                    className="flex-1"
                  >
                    <Calendar className="size-3.5 mr-1" /> Full Day
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={absenceType === "partial" ? "default" : "outline"}
                    onClick={() => {
                      setAbsenceType("partial")
                      form.setValue("isFullDay", false)
                      form.setValue("periods", [])
                    }}
                    className="flex-1"
                  >
                    <ChevronDown className="size-3.5 mr-1" /> Specific Periods
                  </Button>
                </div>
              </div>

              {/* Period picker (partial only) */}
              {absenceType === "partial" && (
                <FormField
                  control={form.control}
                  name="periods"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Periods *</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap gap-2">
                          {TEACHING_PERIODS.map(p => {
                            const pid = p.id as MarkAbsenceInput["periods"][number]
                            const selected = field.value.includes(pid)
                            return (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => {
                                  const next = selected
                                    ? field.value.filter(x => x !== pid)
                                    : [...field.value, pid]
                                  field.onChange(next as MarkAbsenceInput["periods"])
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                                  selected
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border text-muted-foreground hover:border-primary/40"
                                }`}
                              >
                                {p.id}
                                <span className="text-[9px] ml-1 opacity-70">{p.startTime}</span>
                              </button>
                            )
                          })}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Category */}
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <SelectItem key={k} value={k}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason / Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setMarkOpen(false)}>Cancel</Button>
                <Button type="submit">Mark as Absent</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
