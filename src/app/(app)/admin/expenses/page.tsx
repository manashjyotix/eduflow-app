"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Wallet, TrendingUp, Clock, Plus, Check, Download, PieChart,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

// ── Inline expense schema ─────────────────────────────────────────────────────
const EXPENSE_CATEGORIES = [
  "Maintenance", "Stationery", "Utilities", "Events", "Transport", "Salaries", "Other",
] as const

const logExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES, { error: "Please select a category" }),
  description: z
    .string()
    .min(5, "Description must be at least 5 characters")
    .max(500, "Description too long"),
  amount: z.coerce
    .number({ error: "Amount must be a number" })
    .positive("Amount must be greater than zero")
    .max(10_000_000, "Amount seems too large"),
  date: z
    .string()
    .min(1, "Date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
})

type LogExpenseInput = z.infer<typeof logExpenseSchema>

// ── Types & mock data ─────────────────────────────────────────────────────────
interface Expense {
  date: string
  category: string
  desc: string
  amount: number
  by: string
  status: "approved" | "pending"
}

const INITIAL_EXPENSES: Expense[] = [
  { date: "Jun 3",  category: "Maintenance", desc: "Classroom repair — Room 4",   amount: 8500,  by: "Admin Panel", status: "approved" },
  { date: "Jun 2",  category: "Stationery",  desc: "Exam stationery purchase",     amount: 3200,  by: "Mgmt Office", status: "approved" },
  { date: "Jun 1",  category: "Utilities",   desc: "Electricity bill — May",       amount: 12800, by: "Admin Panel", status: "approved" },
  { date: "May 28", category: "Events",      desc: "Annual Day decoration",        amount: 9500,  by: "Mgmt Office", status: "pending"  },
  { date: "May 25", category: "Transport",   desc: "School bus fuel — May",        amount: 7200,  by: "Admin Panel", status: "approved" },
]

const monthlyData = [
  { month: "Jan", amt: 28000 },
  { month: "Feb", amt: 32000 },
  { month: "Mar", amt: 41000 },
  { month: "Apr", amt: 35000 },
  { month: "May", amt: 38500 },
  { month: "Jun", amt: 42000 },
]
const maxAmt = Math.max(...monthlyData.map(m => m.amt))

const categoryBreakdown = [
  { cat: "Maintenance", amt: 8500,  color: "var(--ef-brand)" },
  { cat: "Utilities",   amt: 12800, color: "var(--ef-amber)" },
  { cat: "Events",      amt: 9500,  color: "var(--ef-purple)" },
  { cat: "Transport",   amt: 7200,  color: "var(--ef-green)" },
  { cat: "Stationery",  amt: 3200,  color: "var(--ef-red)" },
]
const totalCat = categoryBreakdown.reduce((s, c) => s + c.amt, 0)

export default function ExpensePage() {
  const [open, setOpen] = useState(false)
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES)

  const { sorted: sortedExpenses, sortField, sortDir, toggleSort } = useTableSort<
    Expense,
    "date" | "category" | "amount" | "status"
  >(expenses, {
    date:     e => e.date,
    category: e => e.category,
    amount:   e => e.amount,
    status:   e => e.status,
  })

  const form = useForm<LogExpenseInput>({
    resolver: zodResolver(logExpenseSchema) as never,
    defaultValues: {
      category: undefined,
      description: "",
      amount: undefined,
      date: new Date().toISOString().split("T")[0],
    },
  })

  function handleLogExpense(values: LogExpenseInput) {
    const newExpense: Expense = {
      date: new Date(values.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
      category: values.category,
      desc: values.description,
      amount: values.amount,
      by: "Admin Panel",
      status: "pending",
    }
    setExpenses(prev => [newExpense, ...prev])
    setOpen(false)
    form.reset()
    toast.success("Expense logged", {
      description: `₹${values.amount.toLocaleString("en-IN")} in ${values.category} submitted for approval.`,
    })
  }

  function openDialog() {
    form.reset({
      category: undefined,
      description: "",
      amount: undefined,
      date: new Date().toISOString().split("T")[0],
    })
    setOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Wallet size={22} />}
        title="Expense Tracking"
        subtitle="Institutional expense management and approval"
        actions={
          <>
            <Button variant="secondary" size="default"><Download size={14} /> Export</Button>
            <Button onClick={openDialog} size="default"><Plus size={15} /> Log Expense</Button>
          </>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="This Month"
          value={`₹${monthlyData[monthlyData.length - 1].amt.toLocaleString("en-IN")}`}
          subtitle={`+₹${(monthlyData[monthlyData.length - 1].amt - monthlyData[monthlyData.length - 2].amt).toLocaleString("en-IN")} vs ${monthlyData[monthlyData.length - 2].month}`}
          icon={<Wallet className="size-5" />}
          tone="brand"
          trend={{ value: Math.round(((monthlyData[monthlyData.length - 1].amt - monthlyData[monthlyData.length - 2].amt) / Math.max(monthlyData[monthlyData.length - 2].amt, 1)) * 100), label: "vs last month" }}
          sparkline={{ variant: "bar", data: monthlyData.map(m => m.amt) }}
        />
        <KpiCard
          title="vs Last Month"
          value={`${monthlyData[monthlyData.length - 1].amt >= monthlyData[monthlyData.length - 2].amt ? "+" : ""}${Math.round(((monthlyData[monthlyData.length - 1].amt - monthlyData[monthlyData.length - 2].amt) / Math.max(monthlyData[monthlyData.length - 2].amt, 1)) * 100)}%`}
          subtitle={`₹${monthlyData[monthlyData.length - 2].amt.toLocaleString("en-IN")} in ${monthlyData[monthlyData.length - 2].month}`}
          icon={<TrendingUp className="size-5" />}
          tone="amber"
          trend={{ value: Math.round(((monthlyData[monthlyData.length - 1].amt - monthlyData[monthlyData.length - 2].amt) / Math.max(monthlyData[monthlyData.length - 2].amt, 1)) * 100), label: "month-over-month" }}
          sparkline={{ variant: "line", data: monthlyData.map(m => m.amt) }}
        />
        <KpiCard
          title="Pending Approval"
          value={`₹${expenses.filter(e => e.status === "pending").reduce((s, e) => s + e.amount, 0).toLocaleString("en-IN")}`}
          subtitle={`${expenses.filter(e => e.status === "pending").length} item${expenses.filter(e => e.status === "pending").length !== 1 ? "s" : ""} need${expenses.filter(e => e.status === "pending").length === 1 ? "s" : ""} review`}
          icon={<Clock className="size-5" />}
          tone="red"
        />
        <KpiCard
          title="YTD Expenses"
          value={`₹${(monthlyData.reduce((s, m) => s + m.amt, 0) / 100000).toFixed(2)}L`}
          subtitle={`${monthlyData[0].month}–${monthlyData[monthlyData.length - 1].month} ${new Date().getFullYear()}`}
          icon={<Check className="size-5" />}
          tone="green"
          trend={{ value: Math.round(((monthlyData[monthlyData.length - 1].amt - monthlyData[0].amt) / Math.max(monthlyData[0].amt, 1)) * 100), label: "Jan vs now" }}
          sparkline={{ variant: "line", data: monthlyData.map(m => m.amt) }}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" /> Monthly Expense Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-32">
              {monthlyData.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] font-semibold text-muted-foreground">₹{(m.amt / 1000).toFixed(0)}K</span>
                  <div
                    className={`w-full rounded-t-md ${m.month === "Jun" ? "bg-primary" : "bg-muted"}`}
                    style={{ height: `${(m.amt / maxAmt) * 96}px` }}
                  />
                  <span className="text-[10px] text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <PieChart className="size-4 text-ef-purple" /> Expense by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {categoryBreakdown.map(c => (
              <div key={c.cat} className="flex items-center gap-3">
                <div className="size-3 rounded-full shrink-0" style={{ background: c.color }} />
                <span className="text-sm flex-1 text-foreground">{c.cat}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(c.amt / totalCat) * 100}%`, background: c.color }} />
                </div>
                <span className="text-xs font-bold w-14 text-right text-muted-foreground">₹{(c.amt / 1000).toFixed(1)}K</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Ledger */}
      <Card className="w-full">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Expense Ledger</CardTitle>
          <span className="text-xs text-muted-foreground">{expenses.length} entries</span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table className="text-sm">
            <caption className="sr-only">Expense ledger entries</caption>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                <SortableHead field="date" label="Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="category" label="Category" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <TableHead className="text-xs min-w-[200px]">Description</TableHead>
                <SortableHead field="amount" label="Amount" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <TableHead className="text-xs">Submitted By</TableHead>
                <SortableHead field="status" label="Status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <TableHead className="text-xs">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedExpenses.map((e, i) => (
                <TableRow key={i}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{e.date}</TableCell>
                  <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                  <TableCell className="text-sm">{e.desc}</TableCell>
                  <TableCell className="font-mono font-semibold">₹{e.amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.by}</TableCell>
                  <TableCell><Badge variant={e.status === "approved" ? "success" : "warning"}>{e.status}</Badge></TableCell>
                  <TableCell>
                    {e.status === "pending"
                      ? <Button size="sm" className="bg-ef-green text-white hover:bg-ef-green/90"><Check size={12} /> Approve</Button>
                      : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Log Expense Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Log New Expense</DialogTitle></DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleLogExpense)} className="flex flex-col gap-4">

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
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Brief description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amount */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (₹)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" min={1} {...field} />
                    </FormControl>
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
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit">Submit for Approval</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
