"use client"

import { useMemo, useState } from "react"
import { DollarSign, CheckCircle, AlertTriangle, Download, Receipt, ListChecks, BarChart3, ChevronsUpDown } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { EduBarChart } from "@/components/shared/edu-bar-chart"
import { FeeReceiptCard, type FeeReceipt } from "@/components/domain/fee/FeeReceiptCard"
import { toast } from "sonner"

type FeeStatus = "paid" | "overdue" | "pending"

interface FeeHead {
  id: string
  head: string
  amount: number
  paid: number
  due: number
  month: string
  status: FeeStatus
}

const FEE_HEADS: FeeHead[] = [
  { id: "fh1", head: "Tuition Fee",    amount: 2500, paid: 2500, due: 0,    month: "April 2026", status: "paid"    },
  { id: "fh2", head: "Tuition Fee",    amount: 2500, paid: 0,    due: 2500, month: "May 2026",   status: "overdue" },
  { id: "fh3", head: "Exam Fee",       amount: 500,  paid: 0,    due: 500,  month: "June 2026",  status: "pending" },
  { id: "fh4", head: "Annual Charges", amount: 1500, paid: 1500, due: 0,    month: "April 2026", status: "paid"    },
]

/** Paid entries that can be represented as downloadable receipts */
const PAID_RECEIPTS: FeeReceipt[] = FEE_HEADS
  .filter(f => f.status === "paid")
  .map((f, i) => ({
    id: f.id,
    studentName: "Rohit Das",
    class: "VIII-A",
    feeHead: `${f.head} — ${f.month}`,
    amount: f.paid,
    date: i === 0 ? "2026-04-05" : "2026-04-10",
    receiptNo: `RCP-2026-${1000 + i}`,
    status: "paid",
    paymentMode: "Online",
  }))

// ── Sorting ───────────────────────────────────────────────────────────────────

type SortKey = "head" | "month" | "amount" | "paid" | "due" | "status"
type SortDir = "asc" | "desc"

const STATUS_RANK: Record<FeeStatus, number> = { overdue: 0, pending: 1, paid: 2 }

const COLUMNS: { key: SortKey; label: string; align: "left" | "right" }[] = [
  { key: "head",   label: "Description", align: "left"  },
  { key: "month",  label: "Period",      align: "left"  },
  { key: "amount", label: "Amount",      align: "right" },
  { key: "paid",   label: "Paid",        align: "right" },
  { key: "due",    label: "Due",         align: "right" },
  { key: "status", label: "Status",      align: "left"  },
]

export default function ParentFeesPage() {
  const totalDue   = FEE_HEADS.reduce((s, f) => s + f.due,    0)
  const totalPaid  = FEE_HEADS.reduce((s, f) => s + f.paid,   0)
  const totalBilled = FEE_HEADS.reduce((s, f) => s + f.amount, 0)
  const pendingHeads = FEE_HEADS.filter(f => f.due > 0).length
  const paidPct = totalBilled > 0 ? Math.round((totalPaid / totalBilled) * 100) : 0

  const [sortKey, setSortKey] = useState<SortKey>("month")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const sortedHeads = useMemo(() => {
    const rows = [...FEE_HEADS]
    rows.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case "head":
        case "month":
          cmp = a[sortKey].localeCompare(b[sortKey])
          break
        case "status":
          cmp = STATUS_RANK[a.status] - STATUS_RANK[b.status]
          break
        default:
          cmp = a[sortKey] - b[sortKey]
      }
      return sortDir === "asc" ? cmp : -cmp
    })
    return rows
  }, [sortKey, sortDir])

  // Per-month billed vs paid for the payment overview chart
  const chartData = useMemo(() => {
    const byMonth = new Map<string, { month: string; billed: number; paid: number }>()
    for (const f of FEE_HEADS) {
      const short = f.month.replace(/ 20\d\d$/, "") // "April 2026" → "April"
      const entry = byMonth.get(short) ?? { month: short, billed: 0, paid: 0 }
      entry.billed += f.amount
      entry.paid += f.paid
      byMonth.set(short, entry)
    }
    return [...byMonth.values()]
  }, [])

  // Upcoming due amounts (unpaid heads, chronological) for the Next Due Date sparkline
  const dueSchedule = useMemo(
    () => FEE_HEADS.filter(f => f.due > 0).map(f => f.due),
    [],
  )

  function handleDownload(receipt: FeeReceipt) {
    toast("Opening receipt…", { description: `${receipt.receiptNo} · ${receipt.studentName}` })
    setTimeout(() => window.print(), 400)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<DollarSign size={22} />}
        title="Fee & Dues"
        subtitle="Rohit Das · Class VIII-A"
        actions={
          <Button variant="outline" size="default">
            <Download className="size-4" />
            Download Receipt
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Total Paid"
          value={`₹${totalPaid.toLocaleString("en-IN")}`}
          subtitle={`${paidPct}% of ₹${totalBilled.toLocaleString("en-IN")} billed`}
          tone="green"
          icon={<CheckCircle className="size-5" />}
          sparkline={{ variant: "arc", value: paidPct }}
        />
        <KpiCard
          title="Outstanding"
          value={`₹${totalDue.toLocaleString("en-IN")}`}
          subtitle={pendingHeads === 0 ? "All dues cleared" : `${pendingHeads} fee head${pendingHeads > 1 ? "s" : ""} pending`}
          tone="red"
          icon={<AlertTriangle className="size-5" />}
          sparkline={{ variant: "bar", data: chartData.map(d => d.billed - d.paid) }}
        />
        <KpiCard
          title="Next Due Date"
          value="Jun 30"
          subtitle="Exam Fee · ₹500"
          tone="amber"
          icon={<DollarSign className="size-5" />}
          sparkline={{ variant: "line", data: dueSchedule }}
        />
      </div>

      {/* Payment overview chart */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="size-4 text-muted-foreground" />
            Payment Overview
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4 sm:p-5">
          <EduBarChart
            data={chartData}
            xKey="month"
            height={200}
            series={[
              { dataKey: "billed", name: "Billed", color: "var(--ef-brand)" },
              { dataKey: "paid",   name: "Paid",   color: "var(--ef-green)" },
            ]}
            yFormatter={v => `₹${v >= 1000 ? `${v / 1000}k` : v}`}
            tooltipFormatter={v => `₹${v.toLocaleString("en-IN")}`}
          />
        </CardContent>
      </Card>

      {totalDue > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center justify-between p-5 gap-4">
            <div>
              <p className="text-sm font-semibold">Outstanding dues: ₹{totalDue.toLocaleString("en-IN")}</p>
              <p className="text-xs text-muted-foreground">Please clear dues before June 30 to avoid late fee.</p>
            </div>
            <Button size="sm">Pay Now</Button>
          </CardContent>
        </Card>
      )}

      {/* Payment receipts (paid entries) */}
      {PAID_RECEIPTS.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Receipt className="size-4 text-muted-foreground" />
              Payment Receipts
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-3 flex flex-col gap-2">
            {PAID_RECEIPTS.map(receipt => (
              <FeeReceiptCard
                key={receipt.id}
                receipt={receipt}
                showDownload
                onDownload={handleDownload}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Full fee ledger */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="size-4 text-muted-foreground" />
            Fee Ledger
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 overflow-x-auto">
          <Table className="text-sm">
            <caption className="sr-only">Fee heads with payment status</caption>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                {COLUMNS.map(col => (
                  <TableHead
                    key={col.key}
                    className={`text-xs font-medium text-muted-foreground py-3 h-auto ${
                      col.key === "head" || col.key === "status" ? "px-6" : "px-4"
                    } ${col.align === "right" ? "text-right" : "text-left"}`}
                    aria-sort={
                      sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : "none"
                    }
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSort(col.key) } }}
                      className={`inline-flex items-center gap-1 font-semibold cursor-pointer select-none hover:text-foreground ${
                        col.align === "right" ? "flex-row-reverse" : ""
                      }`}
                    >
                      {col.label}
                      <ChevronsUpDown className={`size-3 ${sortKey === col.key ? "text-primary" : "opacity-40"}`} />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedHeads.map((f, i) => (
                <TableRow key={f.id} className={`hover:bg-muted/20 ${i % 2 ? "bg-muted/10" : ""}`}>
                  <TableCell className="px-6 py-3 font-medium">{f.head}</TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground">{f.month}</TableCell>
                  <TableCell className="px-4 py-3 text-right">₹{f.amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="px-4 py-3 text-right text-success-foreground font-medium">₹{f.paid.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="px-4 py-3 text-right text-destructive font-medium">₹{f.due.toLocaleString("en-IN")}</TableCell>
                  <TableCell className="px-6 py-3">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${
                        f.status === "paid"
                          ? "bg-[var(--ef-green-light)] text-[var(--ef-green-dark)]"
                          : f.status === "overdue"
                          ? "bg-[var(--ef-red-light)] text-[var(--ef-red-dark)]"
                          : "bg-[var(--ef-amber-light)] text-warning-foreground"
                      }`}
                    >
                      {f.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
