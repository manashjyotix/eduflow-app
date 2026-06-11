import {
  Users, ClipboardList, CheckCircle, TrendingUp,
  LayoutGrid, Clock, AlertTriangle
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { MOCK_ABSENCES } from "@/data/mock-absences"
import { TEACHERS } from "@/data/teachers"

const activeTeachers = TEACHERS.filter(t => t.status === "active").length
const absentToday    = MOCK_ABSENCES.filter(a => a.status === "approved" || a.status === "pending").length
const pendingCount   = MOCK_ABSENCES.filter(a => a.status === "pending").length

export default function AdminDashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<LayoutGrid size={22} />}
        title="Dashboard"
        subtitle={`Good morning — ${new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}`}
        actions={
          <Button size="default">
            <ClipboardList className="size-4" />
            Mark Absence
          </Button>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Active Teachers"
          value={activeTeachers}
          subtitle={`of ${TEACHERS.length} total`}
          icon={<Users className="size-5" />}
          trend={{ value: 0 }}
        />
        <KpiCard
          title="Absent Today"
          value={absentToday}
          subtitle="approved + pending"
          icon={<AlertTriangle className="size-5" />}
          iconClassName="bg-destructive/10 text-destructive"
          trend={{ value: -12, label: "vs yesterday" }}
        />
        <KpiCard
          title="Coverage Rate"
          value="78%"
          subtitle="periods covered"
          icon={<CheckCircle className="size-5" />}
          iconClassName="bg-success/20 text-success-foreground"
          trend={{ value: 5, label: "vs last week" }}
        />
        <KpiCard
          title="Pending Approvals"
          value={pendingCount}
          subtitle="absence requests"
          icon={<Clock className="size-5" />}
          iconClassName="bg-warning/20 text-warning-foreground"
        />
      </div>

      {/* Main content row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Today's Absences */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Today&apos;s Absences</CardTitle>
            <Button variant="ghost" size="sm">View all</Button>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {MOCK_ABSENCES.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No absences today 🎉
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {MOCK_ABSENCES.map(absence => (
                  <li key={absence.id} className="flex items-center justify-between gap-4 px-6 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                        {absence.teacherName.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{absence.teacherName}</p>
                        <p className="text-xs text-muted-foreground">
                          {absence.periods.length === 7 ? "Full day" : `${absence.periods.length} period${absence.periods.length > 1 ? "s" : ""}`}
                          {" · "}{absence.reason}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={absence.status === "approved" ? "success" : absence.status === "pending" ? "warning" : "secondary"}
                      className="flex-shrink-0 capitalize"
                    >
                      {absence.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4 grid grid-cols-2 gap-2">
            {[
              { label: "Proxy Board",    icon: LayoutGrid,    href: "/admin/proxy-board" },
              { label: "Add Teacher",    icon: Users,         href: "/admin/teachers" },
              { label: "Mark Absence",   icon: ClipboardList, href: "/admin/absences" },
              { label: "Analytics",      icon: TrendingUp,    href: "/admin/analytics" },
            ].map(action => (
              <Button key={action.label} variant="outline" size="sm" className="h-16 flex-col gap-1.5" asChild>
                <a href={action.href}>
                  <action.icon className="size-5" />
                  <span className="text-xs">{action.label}</span>
                </a>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
