import { Calendar, TrendingUp } from "lucide-react"
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
  const pct     = Math.round((present / RECORDS.length) * 100)

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<Calendar size={22} />}
        title="Rohit&apos;s Attendance"
        subtitle="Class VIII-A · Roll No. 12"
      />

      <div className="grid grid-cols-3 gap-4">
        <KpiCard title="Present"   value={present} icon={<TrendingUp className="size-5" />} iconClassName="bg-success/20 text-success-foreground" />
        <KpiCard title="Absent"    value={absent}  icon={<Calendar className="size-5" />}   iconClassName="bg-destructive/10 text-destructive" />
        <KpiCard title="This Period" value={`${pct}%`} icon={<TrendingUp className="size-5" />} trend={{ value: pct >= 85 ? 2 : -2 }} />
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Attendance Log</CardTitle>
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
