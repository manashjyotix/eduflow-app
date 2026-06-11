import { LayoutDashboard, BookOpen, Calendar, DollarSign, Bell, TrendingUp } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const CHILD = { name: "Rohit Das", class: "VIII-A", roll: 12, attendance: 84.6 }

const TODAY_CLASSES = [
  { period: "P1", subject: "Mathematics", teacher: "Priya Sharma",   time: "9:30",  status: "completed" },
  { period: "P2", subject: "English",     teacher: "Rajesh Kalita",  time: "10:10", status: "completed" },
  { period: "P3", subject: "Science",     teacher: "Sunita Borah",   time: "10:50", status: "ongoing",   proxy: true },
  { period: "P4", subject: "Hindi",       teacher: "Rima Das",       time: "11:30", status: "upcoming" },
]

const NOTIFICATIONS = [
  { id: "n1", msg: "PTM scheduled for June 20", time: "2h ago", read: false },
  { id: "n2", msg: "Fee due: ₹2,500 outstanding", time: "1d ago", read: false },
  { id: "n3", msg: "Science exam on June 22", time: "2d ago", read: true },
]

export default function ParentDashboardPage() {
  const daysToExam = Math.ceil((new Date("2026-06-20").getTime() - Date.now()) / 86400000)

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<LayoutDashboard size={22} />}
        title={`${CHILD.name}&apos;s Dashboard`}
        subtitle={`Class ${CHILD.class} · Roll No. ${CHILD.roll}`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Attendance" value={`${CHILD.attendance}%`} icon={<TrendingUp className="size-5" />} iconClassName={CHILD.attendance >= 85 ? "bg-success/20 text-success-foreground" : "bg-warning/20 text-warning-foreground"} trend={{ value: CHILD.attendance >= 85 ? 2 : -3 }} />
        <KpiCard title="Exam In"    value={`${daysToExam}d`}       icon={<Calendar className="size-5" />}   iconClassName="bg-primary/10 text-primary" />
        <KpiCard title="Fee Due"    value="₹2,500"                 icon={<DollarSign className="size-5" />} iconClassName="bg-destructive/10 text-destructive" />
        <KpiCard title="Notices"    value={NOTIFICATIONS.filter(n => !n.read).length} icon={<Bell className="size-5" />} iconClassName="bg-warning/20 text-warning-foreground" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's classes */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Today&apos;s Classes</CardTitle>
            <Button variant="ghost" size="sm">Full Journal</Button>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {TODAY_CLASSES.map(cls => (
                <li key={cls.period} className="flex items-center justify-between gap-4 px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`size-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${cls.status === "ongoing" ? "bg-primary text-primary-foreground" : cls.status === "completed" ? "bg-success/20 text-success-foreground" : "bg-muted text-muted-foreground"}`}>
                      {cls.period}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{cls.subject}</p>
                        {cls.proxy && <Badge variant="warning" className="text-xs">Proxy</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{cls.teacher} · {cls.time}</p>
                    </div>
                  </div>
                  <Badge variant={cls.status === "completed" ? "success" : cls.status === "ongoing" ? "default" : "secondary"} className="capitalize text-xs flex-shrink-0">
                    {cls.status}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {NOTIFICATIONS.map(n => (
                <li key={n.id} className={`px-6 py-3 ${!n.read ? "bg-primary/5" : ""}`}>
                  <p className="text-xs font-medium">{n.msg}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Attendance bar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Attendance Overview</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Attendance this year</span>
              <span className="font-semibold">{CHILD.attendance}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${CHILD.attendance >= 85 ? "bg-success" : CHILD.attendance >= 75 ? "bg-warning" : "bg-destructive"}`}
                style={{ width: `${CHILD.attendance}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">Minimum required: 75% · {CHILD.attendance < 75 ? "⚠️ Below minimum" : "✓ On track"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
