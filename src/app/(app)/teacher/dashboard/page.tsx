import { LayoutDashboard, Calendar, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TEACHING_PERIODS } from "@/lib/constants"

const TODAY_SCHEDULE = [
  { period: "P1", subject: "Mathematics", class: "VIII-A", time: "9:30 – 10:10", type: "regular" },
  { period: "P3", subject: "Mathematics", class: "IX-B",   time: "10:50 – 11:30", type: "proxy" },
  { period: "P5", subject: "Science",     class: "VII-A",  time: "12:30 – 1:10",  type: "proxy" },
  { period: "P6", subject: "Mathematics", class: "X-A",    time: "1:10 – 1:50",   type: "regular" },
]

export default function TeacherDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<LayoutDashboard size={22} />}
        title="My Dashboard"
        subtitle="Welcome back, Priya Sharma"
        actions={
          <Button size="default">
            <Calendar className="size-4" />
            Apply Leave
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Periods Today"   value={TODAY_SCHEDULE.length} icon={<Clock className="size-5" />} />
        <KpiCard title="Proxy Duties"    value={TODAY_SCHEDULE.filter(s => s.type === "proxy").length} icon={<AlertCircle className="size-5" />} iconClassName="bg-warning/20 text-warning-foreground" />
        <KpiCard title="Leave Balance"   value="8 days" icon={<CheckCircle className="size-5" />} iconClassName="bg-success/20 text-success-foreground" />
        <KpiCard title="Proxies This Month" value={5} icon={<Calendar className="size-5" />} iconClassName="bg-primary/10 text-primary" />
      </div>

      {/* Proxy request card */}
      <Card className="border-warning bg-warning/5">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm font-semibold">Proxy Request: Period 3 — Class VII-B · English</p>
              <p className="text-xs text-muted-foreground mt-1">Requested by Management · Anita Devi is absent today</p>
              <p className="text-xs text-muted-foreground">10:50 – 11:30</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm">Accept</Button>
              <Button size="sm" variant="outline">Decline</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Schedule */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Today&apos;s Schedule</CardTitle>
          <Badge variant="secondary">{TODAY_SCHEDULE.length} periods</Badge>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {TEACHING_PERIODS.map(p => {
              const slot = TODAY_SCHEDULE.find(s => s.period === p.id)
              return (
                <li key={p.id} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`size-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${slot ? slot.type === "proxy" ? "bg-warning/20 text-warning-foreground" : "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {p.id}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{p.time}</p>
                      {slot ? (
                        <p className="text-sm font-medium">{slot.subject} · {slot.class}</p>
                      ) : (
                        <p className="text-sm text-muted-foreground">Free Period</p>
                      )}
                    </div>
                  </div>
                  {slot?.type === "proxy" && (
                    <Badge variant="warning" className="text-xs flex-shrink-0">Proxy</Badge>
                  )}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
