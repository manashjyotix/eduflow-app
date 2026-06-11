import { DollarSign, CheckCircle, AlertTriangle, Download } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const FEE_HEADS = [
  { id: "fh1", head: "Tuition Fee",     amount: 2500, paid: 2500, due: 0,    month: "April 2026",  status: "paid" },
  { id: "fh2", head: "Tuition Fee",     amount: 2500, paid: 0,    due: 2500, month: "May 2026",    status: "overdue" },
  { id: "fh3", head: "Exam Fee",        amount: 500,  paid: 0,    due: 500,  month: "June 2026",   status: "pending" },
  { id: "fh4", head: "Annual Charges",  amount: 1500, paid: 1500, due: 0,    month: "April 2026",  status: "paid" },
]

export default function ParentFeesPage() {
  const totalDue = FEE_HEADS.reduce((s, f) => s + f.due, 0)
  const totalPaid = FEE_HEADS.reduce((s, f) => s + f.paid, 0)

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
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

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Total Paid"  value={`₹${totalPaid.toLocaleString("en-IN")}`}  icon={<CheckCircle className="size-5" />} iconClassName="bg-success/20 text-success-foreground" />
        <KpiCard title="Outstanding" value={`₹${totalDue.toLocaleString("en-IN")}`}   icon={<AlertTriangle className="size-5" />} iconClassName="bg-destructive/10 text-destructive" />
        <KpiCard title="Next Due"    value="Jun 30"                                    icon={<DollarSign className="size-5" />} iconClassName="bg-warning/20 text-warning-foreground" />
      </div>

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

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Fee Ledger</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Description</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Period</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Amount</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Paid</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Due</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {FEE_HEADS.map(f => (
                <tr key={f.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-6 py-3 font-medium">{f.head}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.month}</td>
                  <td className="px-4 py-3 text-right">₹{f.amount.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right text-success-foreground font-medium">₹{f.paid.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right text-destructive font-medium">₹{f.due.toLocaleString("en-IN")}</td>
                  <td className="px-6 py-3">
                    <Badge variant={f.status === "paid" ? "success" : f.status === "overdue" ? "destructive" : "warning"} className="capitalize">
                      {f.status}
                    </Badge>
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
