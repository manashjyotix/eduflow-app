"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  CreditCard, Plus, TrendingUp, Clock, CheckCircle2
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FeeReceiptCard, type FeeReceipt } from "@/components/domain/fee/FeeReceiptCard"

interface Payment {
  id: string
  studentName: string
  class: string
  feeHead: string
  amount: number
  date: string
  receiptNo: string
  status: "paid" | "pending"
  paymentMode: "Online" | "Cash" | "Cheque" | "—"
}

const INITIAL_PAYMENTS: Payment[] = [
  { id: "pay1", studentName: "Rohit Das", class: "VIII-A", feeHead: "Tuition Fee", amount: 2000, date: "2026-06-15", receiptNo: "RCP-2026-1021", status: "paid", paymentMode: "Online" },
  { id: "pay2", studentName: "Sneha Borah", class: "IX-B", feeHead: "Tuition Fee + Lab Fee", amount: 2300, date: "2026-06-15", receiptNo: "RCP-2026-1020", status: "paid", paymentMode: "Cash" },
  { id: "pay3", studentName: "Ankur Das", class: "VI-A", feeHead: "Transport Fee", amount: 1500, date: "2026-06-14", receiptNo: "RCP-2026-1019", status: "paid", paymentMode: "Online" },
  { id: "pay4", studentName: "Puja Gogoi", class: "X-A", feeHead: "Development Fee", amount: 500, date: "2026-06-14", receiptNo: "RCP-2026-1018", status: "paid", paymentMode: "Cheque" },
  { id: "pay5", studentName: "Raju Nath", class: "VII-C", feeHead: "Tuition Fee", amount: 2000, date: "2026-06-13", receiptNo: "RCP-2026-1017", status: "paid", paymentMode: "Cash" },
  { id: "pay6", studentName: "Priti Kalita", class: "VIII-B", feeHead: "Sports Fee", amount: 150, date: "2026-06-13", receiptNo: "RCP-2026-1016", status: "paid", paymentMode: "Online" },
  { id: "pay7", studentName: "Dipankar Roy", class: "IX-A", feeHead: "Library Fee", amount: 200, date: "2026-06-12", receiptNo: "RCP-2026-1015", status: "paid", paymentMode: "Cash" },
  { id: "pay8", studentName: "Mita Singh", class: "VI-B", feeHead: "Tuition Fee", amount: 2000, date: "2026-06-12", receiptNo: "RCP-2026-1014", status: "pending", paymentMode: "—" },
]

// ── Collect-payment form schema (react-hook-form + zod) ──
const paymentSchema = z.object({
  studentName: z.string().min(2, "Enter the student's name"),
  className: z.string().optional().default(""),
  feeHead: z.string().optional().default(""),
  amount: z.coerce.number().int().positive("Amount must be a positive number"),
  mode: z.enum(["Online", "Cash", "Cheque"]),
})
type PaymentFormValues = z.infer<typeof paymentSchema>

const PAYMENT_DEFAULTS: PaymentFormValues = {
  studentName: "",
  className: "",
  feeHead: "",
  amount: 0,
  mode: "Online",
}

export default function FeeCollectionPage() {
  const [payments, setPayments] = useState<Payment[]>(INITIAL_PAYMENTS)
  const [collectOpen, setCollectOpen] = useState(false)

  // Collect-payment form (RHF + zod)
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema) as never,
    defaultValues: PAYMENT_DEFAULTS,
  })

  function markPaid(id: string) {
    const p = payments.find(x => x.id === id)
    setPayments(prev => prev.map(x => x.id === id ? { ...x, status: "paid", paymentMode: x.paymentMode === "—" ? "Cash" : x.paymentMode, date: new Date().toISOString().split("T")[0] } : x))
    toast.success("Payment recorded", { description: `${p?.studentName} — ₹${p?.amount.toLocaleString("en-IN")} marked as paid.` })
  }

  function printReceipt(p: Payment) {
    toast("Opening receipt…", { description: `${p.receiptNo} · ${p.studentName}` })
    setTimeout(() => window.print(), 400)
  }

  function recordPayment(values: PaymentFormValues) {
    const newPay: Payment = {
      id: `pay${Date.now()}`,
      studentName: values.studentName.trim(),
      class: values.className.trim() || "—",
      feeHead: values.feeHead.trim() || "Tuition Fee",
      amount: values.amount,
      date: new Date().toISOString().split("T")[0],
      receiptNo: `RCP-2026-${1100 + payments.length}`,
      status: "paid",
      paymentMode: values.mode,
    }
    setPayments(prev => [newPay, ...prev])
    setCollectOpen(false)
    form.reset(PAYMENT_DEFAULTS)
    toast.success("Payment collected", { description: `₹${values.amount.toLocaleString("en-IN")} from ${newPay.studentName}.` })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<CreditCard size={20} />}
        title="Fee Collection"
        subtitle="Collect and track fee payments"
        actions={
          <Button onClick={() => setCollectOpen(true)}>
            <Plus className="size-4 mr-2" />
            Record Payment
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Collected Today"
          value="₹42,500"
          subtitle="across 18 payments"
          icon={<CheckCircle2 size={18} />}
          iconClassName="bg-success/10 text-success-foreground"
          trend={{ value: 12, label: "vs yesterday" }}
        />
        <KpiCard
          title="This Month"
          value="₹3,85,000"
          subtitle="June 2026 total"
          icon={<TrendingUp size={18} />}
          trend={{ value: 8, label: "vs May" }}
        />
        <KpiCard
          title="Pending"
          value="₹78,500"
          subtitle="outstanding dues"
          icon={<Clock size={18} />}
          iconClassName="bg-warning/10 text-warning-foreground"
          trend={{ value: -5, label: "vs last month" }}
        />
        <KpiCard
          title="Collection Rate"
          value="83%"
          subtitle="of expected revenue"
          icon={<TrendingUp size={18} />}
          iconClassName="bg-primary/10 text-primary"
          trend={{ value: 3, label: "vs last month" }}
        />
      </div>

      {/* Collection Progress Bar */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Monthly Collection Progress</span>
            <span className="text-sm font-bold text-primary">₹3,85,000 / ₹4,63,500</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: "83%" }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>83% collected</span>
            <span>₹78,500 remaining</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods Breakdown */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-4">
        {[
          { mode: "Online", count: 124, amount: "₹2,42,800", pct: 63, color: "bg-primary", bar: "bg-primary" },
          { mode: "Cash", count: 78, amount: "₹1,15,200", pct: 30, color: "bg-success-foreground", bar: "bg-success-foreground" },
          { mode: "Cheque", count: 12, amount: "₹27,000", pct: 7, color: "bg-warning-foreground", bar: "bg-warning-foreground" },
        ].map(m => (
          <Card key={m.mode}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{m.mode}</span>
                <span className={`size-2 rounded-full ${m.color}`} />
              </div>
              <p className="text-xl font-bold">{m.amount}</p>
              <p className="text-xs text-muted-foreground">{m.count} payments · {m.pct}%</p>
              <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                <div className={`h-full ${m.bar} rounded-full`} style={{ width: `${m.pct}%` }} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Payments — FeeReceiptCard list */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Recent Payments</CardTitle>
          <Button variant="outline" size="sm" onClick={() => toast("Showing all payments", { description: `${payments.length} records.` })}>View All</Button>
        </CardHeader>
        <Separator />
        <CardContent className="p-3 flex flex-col gap-2">
          {payments.map(pay => {
            const receipt: FeeReceipt = {
              id: pay.id,
              studentName: pay.studentName,
              class: pay.class,
              feeHead: pay.feeHead,
              amount: pay.amount,
              date: pay.date,
              receiptNo: pay.receiptNo,
              status: pay.status,
              paymentMode: pay.paymentMode,
            }
            return (
              <FeeReceiptCard
                key={pay.id}
                receipt={receipt}
                onPrint={r => printReceipt(payments.find(p => p.id === r.id)!)}
              />
            )
          })}
        </CardContent>
      </Card>

      {/* Record Payment Dialog (react-hook-form + zod) */}
      <Dialog open={collectOpen} onOpenChange={setCollectOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Fee Payment</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(recordPayment)} className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="studentName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Rohit Das" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="className"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <FormControl>
                        <Input placeholder="VIII-A" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="feeHead"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Head</FormLabel>
                      <FormControl>
                        <Input placeholder="Tuition Fee" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} placeholder="2000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Mode</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Online">Online</SelectItem>
                          <SelectItem value="Cash">Cash</SelectItem>
                          <SelectItem value="Cheque">Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCollectOpen(false)}>Cancel</Button>
                <Button type="submit">Collect Payment</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
