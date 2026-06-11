"use client"
import { useState } from "react"
import { DollarSign, CheckCircle, AlertTriangle, Clock, Download } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { SearchInput } from "@/components/shared/search-input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const FEE_RECORDS = [
  { id: "f1", student: "Rohit Das",       class: "VIII-A", fee: 4500, paid: 4500, due: 0,    status: "paid",    dueDate: "2026-04-30" },
  { id: "f2", student: "Priti Bora",       class: "VIII-A", fee: 4500, paid: 2000, due: 2500, status: "partial", dueDate: "2026-04-30" },
  { id: "f3", student: "Aman Hazarika",    class: "VIII-A", fee: 4500, paid: 0,    due: 4500, status: "overdue", dueDate: "2026-04-30" },
  { id: "f4", student: "Neha Kalita",      class: "VII-B",  fee: 4000, paid: 4000, due: 0,    status: "paid",    dueDate: "2026-04-30" },
  { id: "f5", student: "Deepak Choudhury", class: "VII-B",  fee: 4000, paid: 0,    due: 4000, status: "pending", dueDate: "2026-05-15" },
  { id: "f6", student: "Laxmi Devi",       class: "IX-A",   fee: 5000, paid: 5000, due: 0,    status: "paid",    dueDate: "2026-04-30" },
  { id: "f7", student: "Bikash Sarma",     class: "IX-A",   fee: 5000, paid: 2500, due: 2500, status: "partial", dueDate: "2026-04-30" },
  { id: "f8", student: "Anjali Das",       class: "X-A",    fee: 5500, paid: 5500, due: 0,    status: "paid",    dueDate: "2026-04-30" },
]

export default function FeesPage() {
  const [query, setQuery] = useState("")
  const filtered = FEE_RECORDS.filter(r => r.student.toLowerCase().includes(query.toLowerCase()))

  const totalCollected = FEE_RECORDS.reduce((s, r) => s + r.paid, 0)
  const totalDue       = FEE_RECORDS.reduce((s, r) => s + r.due, 0)
  const defaulters     = FEE_RECORDS.filter(r => r.status === "overdue" || r.status === "partial").length

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<DollarSign size={22} />}
        title="Fee Collection"
        subtitle="Track payments and outstanding dues"
        actions={
          <>
            <Button variant="outline" size="default">
              <Download className="size-4" />
              Export
            </Button>
            <Button size="default">Collect Fee</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Collected"   value={`₹${totalCollected.toLocaleString("en-IN")}`} icon={<CheckCircle className="size-5" />} iconClassName="bg-success/20 text-success-foreground" trend={{ value: 8, label: "vs last month" }} />
        <KpiCard title="Outstanding" value={`₹${totalDue.toLocaleString("en-IN")}`}       icon={<AlertTriangle className="size-5" />} iconClassName="bg-warning/20 text-warning-foreground" />
        <KpiCard title="Defaulters"  value={defaulters}                                    icon={<AlertTriangle className="size-5" />} iconClassName="bg-destructive/10 text-destructive" />
        <KpiCard title="Total Enrolled" value={FEE_RECORDS.length}                         icon={<Clock className="size-5" />} />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Fee Register</CardTitle>
          <SearchInput placeholder="Search student..." className="h-8 w-56" value={query} onChange={e => setQuery(e.target.value)} />
        </CardHeader>
        <Separator />
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Student</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Class</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Total Fee</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Paid</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Due</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3 font-medium">{r.student}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.class}</td>
                  <td className="px-4 py-3 text-right">₹{r.fee.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right text-success-foreground font-medium">₹{r.paid.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right text-destructive font-medium">₹{r.due.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3">
                    <Badge variant={r.status === "paid" ? "success" : r.status === "partial" ? "warning" : r.status === "overdue" ? "destructive" : "secondary"} className="capitalize">
                      {r.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Button size="xs" variant="ghost">Receipt</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
