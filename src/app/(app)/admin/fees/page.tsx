"use client"
import { useState } from "react"
import { DollarSign, Plus, Download, Receipt, AlertCircle, TrendingUp, IndianRupee } from "lucide-react"
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
const Tooltip = dynamic(
  () => import("recharts").then((m) => ({ default: m.Tooltip })),
  { ssr: false }
)
const CartesianGrid = dynamic(
  () => import("recharts").then((m) => ({ default: m.CartesianGrid })),
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
const PieChart = dynamic(
  () => import("recharts").then((m) => ({ default: m.PieChart })),
  { ssr: false }
)
const Pie = dynamic(
  () => import("recharts").then((m) => ({ default: m.Pie })),
  { ssr: false }
)
const Legend = dynamic(
  () => import("recharts").then((m) => ({ default: m.Legend })),
  { ssr: false }
)
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import { STUDENTS } from "@/data/students"

const FEE_STRUCTURE = [
  { head: "Tuition Fee",   VI: 2000, VII: 2200, VIII: 2500, IX: 2800, X: 3000 },
  { head: "Exam Fee",      VI: 500,  VII: 500,  VIII: 500,  IX: 600,  X: 600  },
  { head: "Sports Fee",    VI: 300,  VII: 300,  VIII: 300,  IX: 300,  X: 300  },
  { head: "Library",       VI: 200,  VII: 200,  VIII: 200,  IX: 200,  X: 200  },
  { head: "Total",         VI: 3000, VII: 3200, VIII: 3500, IX: 3900, X: 4100, isTotal: true },
]

const MONTHLY_COLLECTION = [
  { month: "Jan", collected: 145000, due: 28000 },
  { month: "Feb", collected: 158000, due: 22000 },
  { month: "Mar", collected: 162000, due: 18000 },
  { month: "Apr", collected: 170000, due: 15000 },
  { month: "May", collected: 175000, due: 14000 },
  { month: "Jun", collected: 180000, due: 42000 },
]

const FEE_VARIANT = { paid: "success", partial: "warning", due: "destructive" } as const

const FEE_STRUCTURE_CLASSES = ["VI", "VII", "VIII", "IX", "X"] as const

function feeInfo(s: (typeof STUDENTS)[number]) {
  const annualFee = s.class === "VI" ? 36000 : s.class === "VII" ? 38400 : s.class === "VIII" ? 42000 : s.class === "IX" ? 46800 : 49200
  const paid = s.feeStatus === "paid" ? annualFee : s.feeStatus === "partial" ? Math.round(annualFee * 0.6) : 0
  const due = annualFee - paid
  return { annualFee, paid, due }
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: {value: number; name?: string; color?: string}[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs">
      <p className="font-semibold mb-1">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="size-2 rounded-sm" style={{ background: p.color ?? "var(--primary)" }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold">₹{Number(p.value).toLocaleString("en-IN")}</span>
        </div>
      ))}
    </div>
  )
}

export default function FeesPage() {
  const paid    = STUDENTS.filter(s => s.feeStatus === "paid").length
  const partial = STUDENTS.filter(s => s.feeStatus === "partial").length
  const due     = STUDENTS.filter(s => s.feeStatus === "due").length

  const FEE_PIE = [
    { name: "Paid",    value: paid,    color: "var(--ef-green)" },
    { name: "Partial", value: partial, color: "var(--ef-amber)" },
    { name: "Due",     value: due,     color: "var(--ef-red)"   },
  ]

  const {
    sorted: sortedStudents,
    sortField: colField,
    sortDir: colDir,
    toggleSort: colToggle,
  } = useTableSort<
    (typeof STUDENTS)[number],
    "roll" | "student" | "class" | "annual" | "paid" | "due" | "status"
  >(STUDENTS, {
    roll:    s => s.rollNo,
    student: s => s.name,
    class:   s => `${s.class}-${s.section}`,
    annual:  s => feeInfo(s).annualFee,
    paid:    s => feeInfo(s).paid,
    due:     s => feeInfo(s).due,
    status:  s => s.feeStatus,
  }, { field: "roll" })

  const feeStructureRows = FEE_STRUCTURE.filter(r => !r.isTotal)
  const feeStructureTotal = FEE_STRUCTURE.find(r => r.isTotal)

  const {
    sorted: sortedStructure,
    sortField: structField,
    sortDir: structDir,
    toggleSort: structToggle,
  } = useTableSort<
    (typeof FEE_STRUCTURE)[number],
    "head" | "VI" | "VII" | "VIII" | "IX" | "X"
  >(feeStructureRows, {
    head: r => r.head,
    VI:   r => r.VI,
    VII:  r => r.VII,
    VIII: r => r.VIII,
    IX:   r => r.IX,
    X:    r => r.X,
  }, { field: "head" })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<DollarSign size={20} />}
        title="Fee Management"
        subtitle="Collect fees and track payments — June 2026"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="size-4" /> Generate Report
            </Button>
            <Button size="sm">
              <Plus className="size-4" /> Collect Fee
            </Button>
          </div>
        }
      />

      {/* KPIs — 4-col grid */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="Total Collected"
          value="₹1,80,000"
          subtitle="81% of June target"
          icon={<IndianRupee className="size-5" />}
          iconClassName="bg-success/15 text-success-foreground"
          trend={{ value: 4, label: "vs last month" }}
          sparkline={{ variant: "line", data: [145, 158, 162, 170, 175, 180], color: "var(--ef-green)" }}
        />
        <KpiCard
          title="Dues Pending"
          value="₹42,000"
          subtitle={`${due} student${due !== 1 ? "s" : ""} overdue`}
          icon={<AlertCircle className="size-5" />}
          iconClassName="bg-destructive/10 text-destructive"
          trend={{ value: -8, label: "vs last month" }}
          sparkline={{ variant: "bar", data: [28, 22, 18, 15, 14, 42], color: "var(--ef-red)" }}
        />
        <KpiCard
          title="Receipts Issued"
          value={paid}
          subtitle="this month"
          icon={<Receipt className="size-5" />}
          iconClassName="bg-primary/10 text-primary"
          sparkline={{ variant: "bar", data: [5, 6, 7, 6, 7, paid], color: "var(--ef-brand)" }}
        />
        <KpiCard
          title="Collection Rate"
          value="81%"
          subtitle="of annual target"
          icon={<TrendingUp className="size-5" />}
          iconClassName="bg-ef-amber-light text-ef-amber"
          sparkline={{ variant: "line", data: [72, 76, 78, 80, 80, 81], color: "var(--ef-amber)" }}
        />
      </div>

      {/* Defaulters Alert */}
      {due > 0 && (
        <Alert variant="destructive" className="bg-destructive/5 border-destructive/30">
          <AlertCircle className="size-4" />
          <AlertDescription>
            <strong>{due} student{due !== 1 ? "s" : ""}</strong> with overdue fees — {STUDENTS.filter(s => s.feeStatus === "due").map(s => s.name).join(", ")}. Send reminders?
            <Button variant="link" size="sm" className="text-destructive ml-2 p-0 h-auto">Send SMS</Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" /> Monthly Collection Trend
            </CardTitle>
            <Badge variant="secondary">Jan–Jun 2026</Badge>
          </CardHeader>
          <Separator />
          <CardContent className="p-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={MONTHLY_COLLECTION} margin={{ top: 4, right: 8, left: -10, bottom: 0 }} barCategoryGap="28%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} width={44} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.4 }} />
                <Bar dataKey="collected" name="Collected" fill="var(--ef-green)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="due" name="Due" fill="var(--ef-red)" radius={[4, 4, 0, 0]} fillOpacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm" style={{ background: "var(--ef-green)" }} /> Collected</span>
              <span className="flex items-center gap-1"><span className="size-2.5 rounded-sm" style={{ background: "var(--ef-red)", opacity: 0.7 }} /> Due</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <DollarSign className="size-4 text-primary" /> Payment Status — June
            </CardTitle>
            <Badge>
              {STUDENTS.length} students
            </Badge>
          </CardHeader>
          <Separator />
          <CardContent className="p-4 flex items-center gap-6">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={FEE_PIE} cx="50%" cy="50%" innerRadius={32} outerRadius={52} dataKey="value" strokeWidth={2} stroke="var(--card)">
                  {FEE_PIE.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 flex flex-col gap-2">
              {FEE_PIE.map(d => (
                <div key={d.name} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-sm flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-sm flex-1">{d.name}</span>
                  <span className="text-sm font-bold">{d.value}</span>
                  <span className="text-xs text-muted-foreground">({Math.round((d.value / STUDENTS.length) * 100)}%)</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="collection">
        <TabsList>
          <TabsTrigger value="collection">Collection</TabsTrigger>
          <TabsTrigger value="structure">Fee Structure</TabsTrigger>
        </TabsList>

        <TabsContent value="collection" className="mt-4">
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <caption className="sr-only">Student fee collection overview</caption>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <SortableHead field="roll" label="Roll" sortField={colField} sortDir={colDir} onSort={colToggle} className="w-14 text-xs" />
                  <SortableHead field="student" label="Student" sortField={colField} sortDir={colDir} onSort={colToggle} className="text-xs" />
                  <SortableHead field="class" label="Class" sortField={colField} sortDir={colDir} onSort={colToggle} className="text-xs" />
                  <SortableHead field="annual" label="Annual Fee" sortField={colField} sortDir={colDir} onSort={colToggle} align="right" className="text-xs text-right" />
                  <SortableHead field="paid" label="Paid" sortField={colField} sortDir={colDir} onSort={colToggle} align="right" className="text-xs text-right" />
                  <SortableHead field="due" label="Due" sortField={colField} sortDir={colDir} onSort={colToggle} align="right" className="text-xs text-right" />
                  <SortableHead field="status" label="Status" sortField={colField} sortDir={colDir} onSort={colToggle} className="text-xs" />
                  <TableHead className="text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedStudents.map(s => {
                  const { annualFee, paid, due } = feeInfo(s)
                  return (
                    <TableRow key={s.id} className="hover:bg-muted/20">
                      <TableCell className="text-xs font-mono text-muted-foreground">{s.rollNo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[9px] font-bold flex-shrink-0" aria-hidden="true">
                            {s.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="text-sm font-medium">{s.name}</span>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{s.class}-{s.section}</Badge></TableCell>
                      <TableCell className="text-right text-sm">₹{annualFee.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-success-foreground">₹{paid.toLocaleString("en-IN")}</TableCell>
                      <TableCell className="text-right text-sm font-medium text-destructive">₹{due.toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Badge variant={FEE_VARIANT[s.feeStatus]} className="capitalize text-xs">{s.feeStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {s.feeStatus !== "paid" ? (
                          <Button size="xs" className="text-xs">Collect</Button>
                        ) : (
                          <Button size="xs" variant="outline" className="text-xs">
                            <Receipt className="size-3 mr-1" /> Receipt
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="structure" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Fee Structure 2025–26 (Per Month)</CardTitle>
            </CardHeader>
            <Separator />
            <div className="overflow-x-auto">
              <Table>
                <caption className="sr-only">Fee structure matrix by class</caption>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <SortableHead field="head" label="Fee Head" sortField={structField} sortDir={structDir} onSort={structToggle} className="text-xs px-6" />
                    {FEE_STRUCTURE_CLASSES.map(c => (
                      <SortableHead key={c} field={c} label={`Class ${c}`} sortField={structField} sortDir={structDir} onSort={structToggle} align="right" className="text-xs text-right px-6" />
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStructure.map(row => (
                    <TableRow key={row.head} className="hover:bg-muted/20">
                      <TableCell className="text-sm px-6">{row.head}</TableCell>
                      {FEE_STRUCTURE_CLASSES.map(c => (
                        <TableCell key={c} className="text-right text-sm px-6">
                          ₹{row[c as keyof typeof row]?.toLocaleString("en-IN")}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {feeStructureTotal && (
                    <TableRow key={feeStructureTotal.head} className="font-semibold bg-muted/30">
                      <TableCell className="text-sm px-6">{feeStructureTotal.head}</TableCell>
                      {FEE_STRUCTURE_CLASSES.map(c => (
                        <TableCell key={c} className="text-right text-sm px-6">
                          ₹{feeStructureTotal[c as keyof typeof feeStructureTotal]?.toLocaleString("en-IN")}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
