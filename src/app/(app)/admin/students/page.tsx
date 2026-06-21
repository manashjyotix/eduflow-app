"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { GraduationCap, Search, Filter, Upload, Users, TrendingUp, UserPlus } from "lucide-react"
import dynamic from "next/dynamic"

// ── Dynamic recharts imports (SSR-safe, code-split) ───────────────────────────
const BarChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.BarChart })),
  { ssr: false }
)
const Bar = dynamic(
  () => import("recharts").then((m) => ({ default: m.Bar })),
  { ssr: false }
)
const XAxis = dynamic(
  () => import("recharts").then((m) => ({ default: m.XAxis })),
  { ssr: false }
)
const YAxis = dynamic(
  () => import("recharts").then((m) => ({ default: m.YAxis })),
  { ssr: false }
)
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => ({ default: m.CartesianGrid })),
  { ssr: false }
)
const Tooltip = dynamic(
  () => import("recharts").then((m) => ({ default: m.Tooltip })),
  { ssr: false }
)
const ResponsiveContainer = dynamic(
  () => import("recharts").then((m) => ({ default: m.ResponsiveContainer })),
  { ssr: false }
)
const Cell = dynamic(
  () => import("recharts").then((m) => ({ default: m.Cell })),
  { ssr: false }
)
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { EmptyState } from "@/components/shared/empty-state"
import { ImportModal } from "@/components/shared/import-modal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { STUDENTS, CLASSES } from "@/data/students"

// ── Inline student schema ─────────────────────────────────────────────────────
const CLASS_VALUES = ["VI", "VII", "VIII", "IX", "X"] as const
const SECTION_VALUES = ["A", "B", "C", "D"] as const

const createStudentSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name too long"),
  rollNo: z.coerce
    .number({ error: "Roll number must be a number" })
    .int()
    .positive("Roll number must be positive"),
  class: z.enum(CLASS_VALUES, { error: "Please select a class" }),
  section: z.enum(SECTION_VALUES, { error: "Please select a section" }),
  parentName: z
    .string()
    .min(2, "Parent name must be at least 2 characters")
    .max(100, "Parent name too long"),
  parentEmail: z
    .string()
    .email("Please enter a valid email address"),
  parentPhone: z
    .string()
    .min(7, "Please enter a valid phone number")
    .max(20, "Phone number too long"),
})

type CreateStudentInput = z.infer<typeof createStudentSchema>

// ── Types & constants ─────────────────────────────────────────────────────────
const FEE_VARIANT = { paid: "success", partial: "warning", due: "destructive" } as const
const ATT_COLOR = (p: number) => p >= 85 ? "bg-[var(--ef-green)]" : p >= 70 ? "bg-[var(--ef-amber)]" : "bg-destructive"

const ATT_DIST = [
  { range: "90–100%", count: 0, color: "var(--ef-green)" },
  { range: "80–89%",  count: 0, color: "var(--ef-brand)" },
  { range: "70–79%",  count: 0, color: "var(--ef-amber)" },
  { range: "<70%",    count: 0, color: "var(--ef-red)"   },
]
STUDENTS.forEach(s => {
  if      (s.attendancePercent >= 90) ATT_DIST[0].count++
  else if (s.attendancePercent >= 80) ATT_DIST[1].count++
  else if (s.attendancePercent >= 70) ATT_DIST[2].count++
  else                                ATT_DIST[3].count++
})

function AttTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-0.5">{label}</p>
      <p>{payload[0].value} students</p>
    </div>
  )
}

const DEFAULT_VALUES: CreateStudentInput = {
  name: "",
  rollNo: undefined as unknown as number,
  class: undefined as unknown as typeof CLASS_VALUES[number],
  section: undefined as unknown as typeof SECTION_VALUES[number],
  parentName: "",
  parentEmail: "",
  parentPhone: "",
}

export default function StudentsPage() {
  const [search, setSearch] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [feeFilter, setFeeFilter] = useState("all")
  const [importOpen, setImportOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const form = useForm<CreateStudentInput>({
    resolver: zodResolver(createStudentSchema) as never,
    defaultValues: DEFAULT_VALUES,
  })

  const filtered = STUDENTS.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      String(s.rollNo).includes(search) || s.parentName.toLowerCase().includes(search.toLowerCase())
    const matchClass = classFilter === "all" || `${s.class}-${s.section}` === classFilter
    const matchFee   = feeFilter   === "all" || s.feeStatus === feeFilter
    return matchSearch && matchClass && matchFee
  })

  const { sorted, sortField, sortDir, toggleSort } = useTableSort<
    (typeof STUDENTS)[number],
    "roll" | "student" | "class" | "attendance" | "fee" | "parent"
  >(filtered, {
    roll:       s => s.rollNo,
    student:    s => s.name,
    class:      s => `${s.class}-${s.section}`,
    attendance: s => s.attendancePercent,
    fee:        s => s.feeStatus,
    parent:     s => s.parentName,
  }, { field: "roll" })

  const avgAtt   = Math.round(STUDENTS.reduce((sum, s) => sum + s.attendancePercent, 0) / STUDENTS.length * 10) / 10
  const paidCount = STUDENTS.filter(s => s.feeStatus === "paid").length
  const dueCount  = STUDENTS.filter(s => s.feeStatus === "due").length

  function handleAddStudent(values: CreateStudentInput) {
    toast.success("Student enrolled", {
      description: `${values.name} (${values.class}-${values.section}) has been added.`,
    })
    setAddOpen(false)
    form.reset(DEFAULT_VALUES)
  }

  function openAddDialog() {
    form.reset(DEFAULT_VALUES)
    setAddOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        entityName="Students"
        onConfirm={(data) => {
          console.log("Imported student rows:", data)
        }}
      />

      <PageHeader
        icon={<GraduationCap size={20} />}
        title="Students"
        subtitle={`Holy Child English Academy — ${STUDENTS.length} students enrolled`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" /> Import
            </Button>
            <Button size="sm" onClick={openAddDialog}>
              <UserPlus className="size-4" /> Add Student
            </Button>
          </div>
        }
      />

      {/* KPI grid — 4 cols */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="Total Students"
          value={STUDENTS.length}
          subtitle="enrolled this year"
          icon={<Users className="size-5" />}
          sparkline={{ variant: "bar", data: [10, 11, 11, 12, 12, STUDENTS.length] }}
        />
        <KpiCard
          title="Avg Attendance"
          value={`${avgAtt}%`}
          subtitle="across all classes"
          icon={<TrendingUp className="size-5" />}
          iconClassName="bg-success/15 text-success-foreground"
          trend={{ value: 2, label: "vs last month" }}
          sparkline={{ variant: "line", data: [80, 82, 83, 84, 84, avgAtt], color: "var(--ef-green)" }}
        />
        <KpiCard
          title="Fees Cleared"
          value={paidCount}
          subtitle={`of ${STUDENTS.length} students`}
          icon={<GraduationCap className="size-5" />}
          iconClassName="bg-primary/10 text-primary"
          sparkline={{ variant: "bar", data: [4, 5, 5, 6, 6, paidCount], color: "var(--ef-brand)" }}
        />
        <KpiCard
          title="Fee Defaulters"
          value={dueCount}
          subtitle="overdue fees"
          icon={<Filter className="size-5" />}
          iconClassName="bg-destructive/10 text-destructive"
          sparkline={{ variant: "bar", data: [3, 2, 2, 2, 2, dueCount], color: "var(--ef-red)" }}
        />
      </div>

      {/* Attendance distribution chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" /> Attendance Distribution
          </CardTitle>
          <Badge variant="secondary">{STUDENTS.length} students</Badge>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={ATT_DIST} margin={{ top: 4, right: 8, left: -20, bottom: 0 }} barCategoryGap="32%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip content={<AttTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
              <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                {ATT_DIST.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground flex-wrap justify-center">
            {ATT_DIST.map(d => (
              <span key={d.range} className="flex items-center gap-1">
                <span className="size-2.5 rounded-sm" style={{ background: d.color }} />
                {d.range}: <strong className="text-foreground">{d.count}</strong>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search name, roll no, parent…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-36">
            <Filter className="size-3.5 mr-1" />
            <SelectValue placeholder="Class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={feeFilter} onValueChange={setFeeFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Fee Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Fee Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="due">Due</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={<GraduationCap className="size-10" />} title="No students found" description="Adjust your search or filters" />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <caption className="sr-only">Student directory</caption>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <SortableHead field="roll" label="Roll" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="w-16 text-xs" />
                <SortableHead field="student" label="Student" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="class" label="Class" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="attendance" label="Attendance" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="fee" label="Fee Status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="parent" label="Parent" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <TableHead className="w-24 text-xs text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(s => (
                <TableRow key={s.id} className="hover:bg-muted/30">
                  <TableCell className="text-xs font-mono font-medium text-muted-foreground">{s.rollNo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0" aria-hidden="true">
                        {s.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <p className="text-sm font-medium">{s.name}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">{s.class}-{s.section}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${ATT_COLOR(s.attendancePercent)}`}
                          style={{ width: `${s.attendancePercent}%` }}
                        />
                      </div>
                      <span className={`text-xs font-medium ${s.attendancePercent >= 85 ? "text-[var(--ef-green-dark)]" : s.attendancePercent >= 70 ? "text-warning-foreground" : "text-[var(--ef-red-dark)]"}`}>
                        {s.attendancePercent}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={FEE_VARIANT[s.feeStatus]} className="capitalize text-xs">
                      {s.feeStatus}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-xs">{s.parentName}</p>
                    <p className="text-[10px] text-muted-foreground">{s.parentPhone}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="xs" className="text-xs">View</Button>
                      <Button variant="ghost" size="xs" className="text-xs">Edit</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">Showing {filtered.length} of {STUDENTS.length} students</p>

      {/* Add Student Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5" /> Enroll New Student
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddStudent)} className="flex flex-col gap-4">

              {/* Student Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Rohit Das" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Class + Section + Roll No */}
              <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="class"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Class" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {CLASS_VALUES.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="section"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Section *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sec" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SECTION_VALUES.map(s => (
                            <SelectItem key={s} value={s}>{s}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rollNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roll No. *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          placeholder="1"
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Parent Name */}
              <FormField
                control={form.control}
                name="parentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent / Guardian Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Anil Das" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Parent Email + Phone */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="parentEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Email *</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="parent@gmail.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parentPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Phone *</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit">Enroll Student</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
