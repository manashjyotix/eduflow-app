import { BarChart3, TrendingUp, Users, CreditCard, AlertTriangle, School } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const SCHOOLS = [
  { id: "sch-1",  name: "Holy Child English Academy", location: "Howly, Assam",     plan: "annual",  mrr: 15000, status: "active",  health: 87 },
  { id: "sch-2",  name: "Delhi Public School",         location: "New Delhi",         plan: "annual",  mrr: 45000, status: "active",  health: 92 },
  { id: "sch-3",  name: "St. Xavier's High School",    location: "Kolkata, WB",       plan: "quarterly",mrr: 9000, status: "active",  health: 78 },
  { id: "sch-4",  name: "Kendriya Vidyalaya No. 2",    location: "Guwahati, Assam",   plan: "monthly", mrr: 999,  status: "trial",   health: 45 },
  { id: "sch-5",  name: "Carmel Convent School",       location: "Bhopal, MP",        plan: "half-yearly",mrr: 9998,status: "active",health: 81 },
]

const MRR_DATA = [
  { month: "Jan", mrr: 92000 }, { month: "Feb", mrr: 98000 }, { month: "Mar", mrr: 105000 },
  { month: "Apr", mrr: 118000 }, { month: "May", mrr: 125000 }, { month: "Jun", mrr: 132000 },
]

const MAX_MRR = Math.max(...MRR_DATA.map(m => m.mrr))
const TOTAL_MRR = 132000

export default function SaaSOverviewPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<BarChart3 size={22} />}
        title="Platform Overview"
        subtitle="EduFlow SaaS — June 2026"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="MRR"             value={`₹${(TOTAL_MRR/1000).toFixed(0)}K`} icon={<CreditCard className="size-5" />}    trend={{ value: 5.6, label: "vs last month" }} />
        <KpiCard title="ARR"             value={`₹${(TOTAL_MRR * 12 / 100000).toFixed(1)}L`} icon={<TrendingUp className="size-5" />} iconClassName="bg-success/20 text-success-foreground" />
        <KpiCard title="Active Schools"  value={SCHOOLS.filter(s => s.status === "active").length} icon={<School className="size-5" />} iconClassName="bg-primary/10 text-primary" trend={{ value: 8 }} />
        <KpiCard title="Churn Risk"      value={1}                                    icon={<AlertTriangle className="size-5" />} iconClassName="bg-destructive/10 text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* MRR trend */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">MRR Trend (6 months)</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 pb-6">
            <div className="flex items-end gap-3 h-36">
              {MRR_DATA.map(m => (
                <div key={m.month} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-[10px] text-muted-foreground">₹{(m.mrr/1000).toFixed(0)}K</span>
                  <div className="w-full rounded-t-md bg-primary/80" style={{ height: `${(m.mrr / MAX_MRR) * 100}%` }} />
                  <span className="text-xs text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Plan distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Plan Distribution</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-3">
            {[
              { plan: "Annual",      count: 2, pct: 40, color: "bg-primary" },
              { plan: "Half-Yearly", count: 1, pct: 20, color: "bg-success" },
              { plan: "Quarterly",   count: 1, pct: 20, color: "bg-warning" },
              { plan: "Monthly",     count: 0, pct: 0,  color: "bg-muted-foreground" },
              { plan: "Trial",       count: 1, pct: 20, color: "bg-destructive" },
            ].map(item => (
              <div key={item.plan} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{item.plan}</span>
                  <span className="text-muted-foreground">{item.count} schools</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* School list */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Active Schools</CardTitle>
          <Button variant="ghost" size="sm">View All Tenants</Button>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">School</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Plan</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">MRR</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Health</th>
                <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {SCHOOLS.map(school => (
                <tr key={school.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-3">
                    <p className="font-medium">{school.name}</p>
                    <p className="text-xs text-muted-foreground">{school.location}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground capitalize">{school.plan}</td>
                  <td className="px-4 py-3 text-right font-medium">₹{school.mrr.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={school.health >= 80 ? "text-success-foreground font-semibold" : school.health >= 60 ? "text-warning-foreground font-semibold" : "text-destructive font-semibold"}>
                      {school.health}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={school.status === "active" ? "success" : "warning"} className="capitalize">{school.status}</Badge>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Button size="xs" variant="ghost">Impersonate</Button>
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
