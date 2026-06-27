import { Calendar, TrendingUp, CalendarCheck, CalendarX, ClipboardList } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

const RECORDS = [
  { date: "2026-06-11", status: "present", periods: 7 },
  { date: "2026-06-10", status: "present", periods: 6 },
  { date: "2026-06-09", status: "absent",  periods: 0 },
  { date: "2026-06-06", status: "present", periods: 7 },
  { date: "2026-06-05", status: "late",    periods: 5 },
  { date: "2026-06-04", status: "present", periods: 7 },
  { date: "2026-06-03", status: "present", periods: 7 },
  { date: "2026-06-02", status: "present", periods: 7 },
]

export default function ChildAttendancePage() {
  const present = RECORDS.filter(r => r.status === "present").length
  const absent  = RECORDS.filter(r => r.status === "absent").length
  const late    = RECORDS.filter(r => r.status === "late").length
  const total   = RECORDS.length
  const pct     = Math.round((present / total) * 100)

  // Oldest → newest, so sparklines read left-to-right in chronological order.
  const ordered    = [...RECORDS].reverse()
  const periodTrend  = ordered.map(r => r.periods)
  const presentTrend = ordered.map(r => (r.status === "present" ? 1 : 0))
  const absentTrend  = ordered.map(r => (r.status === "present" ? 0 : 1))

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Calendar size={22} />}
        title="Rohit&apos;s Attendance"
        subtitle="Class VIII-A · Roll No. 12"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard
          title="Present"
          value={present}
          subtitle={`of ${total} school days`}
          icon={<CalendarCheck className="size-5" />}
          iconClassName="bg-success/20 text-success-foreground"
          trend={{ value: 2, label: "vs last term" }}
          tone="green"
          sparkline={{ variant: "bar", data: presentTrend }}
        />
        <KpiCard
          title="Absent"
          value={absent}
          subtitle={`${late} late arrival${late === 1 ? "" : "s"}`}
          icon={<CalendarX className="size-5" />}
          iconClassName="bg-destructive/10 text-destructive"
          trend={{ value: 0, label: "no change" }}
          tone="red"
          sparkline={{ variant: "bar", data: absentTrend }}
        />
        <KpiCard
          title="This Period"
          value={`${pct}%`}
          subtitle="Min 75% required"
          icon={<TrendingUp className="size-5" />}
          trend={{ value: pct >= 85 ? 2 : -2 }}
          sparkline={{ variant: "arc", value: pct }}
        />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <ClipboardList className="size-4 text-primary" /> Attendance Log
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {RECORDS.map(r => (
              <li key={r.date} className="flex items-center justify-between px-6 py-3">
                <p className="text-sm font-medium">
                  {new Date(r.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
                </p>
                <div className="flex items-center gap-3">
                  {r.status === "present" && <span className="text-xs text-muted-foreground">{r.periods} periods</span>}
                  <Badge variant={r.status === "present" ? "success" : r.status === "absent" ? "destructive" : "warning"} className="capitalize">
                    {r.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
