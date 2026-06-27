import { Grid3x3, Zap, CheckCircle, Clock, PercentSquare } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { MOCK_ABSENCES } from "@/data/mock-absences"
import { MOCK_PROXIES } from "@/data/proxy-assignments"
import { cn } from "@/lib/utils"
import { ProxyBoard } from "./proxy-board"

// Weekly trend series (Mon–Sat)
const WEEKLY_OPEN_GAPS    = [3, 5, 4, 6, 4, 4]
const WEEKLY_ASSIGNED     = [2, 4, 3, 5, 3, 3]
const WEEKLY_COMPLETED    = [1, 3, 2, 4, 2, 1]
const WEEKLY_COVERAGE_PCT = [67, 80, 75, 83, 75, 71]

const trend = (s: number[]) => Math.round(((s.at(-1)! - s.at(-2)!) / s.at(-2)!) * 100)

const LEGEND = [
  { dot: "bg-ef-green",         label: "Same subject" },
  { dot: "bg-ef-amber",         label: "Different subject" },
  { dot: "bg-muted-foreground", label: "At cap" },
  { dot: "bg-ef-red",           label: "Unavailable" },
]

export default function ManagementProxyPage() {
  const approvedAbsences = MOCK_ABSENCES.filter(a => a.status === "approved")
  const totalOpenGaps  = approvedAbsences.reduce((s, a) => s + a.periods.length, 0)
  const assignedCount  = MOCK_PROXIES.filter(p => p.status === "accepted" || p.status === "assigned").length
  const completedCount = MOCK_PROXIES.filter(p => p.status === "accepted").length
  const coveragePct    = totalOpenGaps > 0 ? Math.round((assignedCount / totalOpenGaps) * 100) : 0

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Grid3x3 size={22} />}
        title="Proxy Board"
        subtitle="Tap a period to assign the best-matched substitute"
        actions={
          <>
            <Button variant="outline" size="default">Print Sheet</Button>
            <Button size="default"><Zap className="size-4" />Auto-Assign All</Button>
          </>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard title="Open Gaps"  value={totalOpenGaps}     subtitle={`${approvedAbsences.length} teacher${approvedAbsences.length !== 1 ? "s" : ""} absent today`}                          icon={<Clock className="size-5" />}         tone="red"   trend={{ value: trend(WEEKLY_OPEN_GAPS),    label: "vs yesterday" }} sparkline={{ variant: "bar", data: WEEKLY_OPEN_GAPS }} />
        <KpiCard title="Assigned"   value={assignedCount}     subtitle={`${totalOpenGaps - assignedCount} period${totalOpenGaps - assignedCount !== 1 ? "s" : ""} unassigned`}                  icon={<CheckCircle className="size-5" />}   tone="green" trend={{ value: trend(WEEKLY_ASSIGNED),     label: "vs yesterday" }} sparkline={{ variant: "bar", data: WEEKLY_ASSIGNED }} />
        <KpiCard title="Completed"  value={completedCount}    subtitle="Accepted proxy duties"                                                                                                  icon={<CheckCircle className="size-5" />}   tone="brand" trend={{ value: trend(WEEKLY_COMPLETED),    label: "vs yesterday" }} sparkline={{ variant: "bar", data: WEEKLY_COMPLETED }} />
        <KpiCard title="Coverage"   value={`${coveragePct}%`} subtitle={`${assignedCount} of ${totalOpenGaps} periods covered`}                                                                 icon={<PercentSquare className="size-5" />} tone="green" trend={{ value: trend(WEEKLY_COVERAGE_PCT), label: "vs yesterday" }} sparkline={{ variant: "arc", value: coveragePct }} />
      </div>

      {/* Legend */}
      <div className="flex items-center gap-x-5 gap-y-2 text-xs text-muted-foreground flex-wrap">
        <span className="font-semibold text-foreground">Availability key:</span>
        {LEGEND.map(item => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={cn("size-2.5 rounded-full flex-shrink-0", item.dot)} aria-hidden="true" />
            <span className="text-foreground">{item.label}</span>
          </span>
        ))}
        <Separator orientation="vertical" className="h-4 hidden sm:block" />
        <span className="text-muted-foreground/80">👑 Best match · ⭐ Match score</span>
      </div>

      <ProxyBoard absences={approvedAbsences} />
    </div>
  )
}
