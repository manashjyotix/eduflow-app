import { BarChart3, TrendingUp, Users, ClipboardList } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const MONTHLY_PROXY = [
  { month: "Jan", count: 12 }, { month: "Feb", count: 18 }, { month: "Mar", count: 9 },
  { month: "Apr", count: 22 }, { month: "May", count: 15 }, { month: "Jun", count: 7 },
]

const TEACHER_LOAD = [
  { name: "Priya Sharma",       proxies: 8, periods: 35 },
  { name: "Rajesh Kalita",      proxies: 5, periods: 32 },
  { name: "Sunita Borah",       proxies: 7, periods: 33 },
  { name: "Meena Gogoi",        proxies: 3, periods: 28 },
  { name: "Himanta Bezbaruah",  proxies: 11, periods: 40 },
]

const MAX_COUNT = Math.max(...MONTHLY_PROXY.map(m => m.count))

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<BarChart3 size={22} />}
        title="Analytics"
        subtitle="Attendance, proxy and fee analytics"
        actions={null}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Avg Coverage"    value="84%"  icon={<TrendingUp className="size-5" />}  trend={{ value: 4, label: "vs last month" }} />
        <KpiCard title="Total Absences"  value={83}   icon={<ClipboardList className="size-5" />} iconClassName="bg-warning/20 text-warning-foreground" />
        <KpiCard title="Total Proxies"   value={67}   icon={<Users className="size-5" />}         iconClassName="bg-primary/10 text-primary" />
        <KpiCard title="Uncovered Slots" value={16}   icon={<BarChart3 className="size-5" />}     iconClassName="bg-destructive/10 text-destructive" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Proxy trend bar chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Monthly Proxy Count</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 pb-6">
            <div className="flex items-end gap-3 h-40">
              {MONTHLY_PROXY.map(m => (
                <div key={m.month} className="flex flex-col items-center gap-1 flex-1">
                  <span className="text-xs text-muted-foreground">{m.count}</span>
                  <div
                    className="w-full rounded-t-md bg-primary/80 transition-all"
                    style={{ height: `${(m.count / MAX_COUNT) * 100}%` }}
                  />
                  <span className="text-xs text-muted-foreground">{m.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Teacher load table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Teacher Workload</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Teacher</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-4 py-3">Periods</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Proxies</th>
                </tr>
              </thead>
              <tbody>
                {TEACHER_LOAD.map(t => (
                  <tr key={t.name} className="border-t border-border hover:bg-muted/30">
                    <td className="px-6 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{t.periods}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={t.proxies > 9 ? "text-destructive font-semibold" : t.proxies > 6 ? "text-warning-foreground font-medium" : "text-success-foreground font-medium"}>
                        {t.proxies}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      {/* Attendance summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Attendance Summary — Last 30 Days</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 divide-x divide-border text-center">
            {[
              { label: "Student Attendance", value: "82.4%", sub: "avg across all classes" },
              { label: "Teacher Attendance", value: "94.7%", sub: "approved days present" },
              { label: "On-Time Proxy Rate", value: "88.6%", sub: "assigned before period start" },
            ].map(stat => (
              <div key={stat.label} className="px-6 py-4">
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-sm font-medium mt-1">{stat.label}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
