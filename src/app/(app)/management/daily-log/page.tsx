"use client"

import { ScrollText, Download, UserX, Grid3X3, ArrowLeftRight, IndianRupee, ShieldAlert, CheckCircle2, AlertTriangle, TrendingUp, Circle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { TaskList, type TaskItem } from "@/components/shared/task-list"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

interface LogEvent {
  time: string
  type: "absence" | "proxy" | "swap" | "fee" | "system" | "alert"
  message: string
  detail?: string
}

const LOG_EVENTS: LogEvent[] = [
  { time: "08:42", type: "absence",  message: "Anita Devi marked absent — full day",          detail: "Reason: Sick leave · Approved by Admin" },
  { time: "08:55", type: "absence",  message: "Dipak Baruah marked absent — P1, P2, P3",       detail: "Reason: Doctor visit · Approved by Admin" },
  { time: "09:02", type: "absence",  message: "Rima Das submitted leave request — full day",   detail: "Reason: Family emergency · Pending" },
  { time: "09:10", type: "proxy",    message: "Proxy assigned: Priya Sharma → P3, Class IV-C", detail: "Replacing Dipak Baruah · Status: Accepted" },
  { time: "09:15", type: "proxy",    message: "Proxy assigned: Rajesh Kalita → P1, Class VI-A",detail: "Replacing Anita Devi · Status: Accepted" },
  { time: "09:20", type: "proxy",    message: "Proxy assigned: Biju Das → P2, Class VII-B",    detail: "Replacing Anita Devi · Status: Accepted" },
  { time: "09:35", type: "proxy",    message: "Proxy assigned: Sunita Borah → P3, Class IX-A", detail: "Replacing Anita Devi · Status: Accepted" },
  { time: "10:05", type: "proxy",    message: "Proxy assigned: Meena Gogoi → P2, Class VIII-B",detail: "Replacing Dipak Baruah · Status: Pending" },
  { time: "10:30", type: "swap",     message: "Swap request: Priya ↔ Rajesh (P3, June 16)",    detail: "Status: Agreed — Awaiting mgmt approval" },
  { time: "11:15", type: "fee",      message: "Fee collected: Rohit Das — ₹3,500",              detail: "Class VIII-A · Monthly fee June 2026" },
  { time: "11:42", type: "fee",      message: "Fee collected: Trishna Borah — ₹15,000",         detail: "Class X-A · Annual fee installment" },
  { time: "12:10", type: "system",   message: "Tiffin break started",                           detail: "12:10–12:30 · Attendance paused" },
  { time: "13:50", type: "fee",      message: "Bulk fee collected: 3 students — ₹24,000",       detail: "Class IX-A · Term 2 fee" },
  { time: "15:20", type: "system",   message: "End-of-day attendance consolidated",              detail: "All periods marked · Report generated" },
  { time: "15:45", type: "system",   message: "Daily log finalized",                             detail: "Saved to records · Ready to export" },
]

const EVENT_ICONS: Record<LogEvent["type"], React.ComponentType<{ size: number; className?: string }>> = {
  absence: UserX,
  proxy: Grid3X3,
  swap: ArrowLeftRight,
  fee: IndianRupee,
  system: ShieldAlert,
  alert: AlertTriangle,
}

const EVENT_COLORS: Record<LogEvent["type"], string> = {
  absence: "bg-destructive/10 text-destructive border-destructive/20",
  proxy: "bg-primary/10 text-primary border-primary/20",
  swap: "bg-[var(--ef-purple-light)] text-[var(--ef-purple)] border-[var(--ef-purple-mid)]",
  fee: "bg-[var(--ef-green-light)] text-[var(--ef-green-dark)] border-[var(--ef-green-dark)]/20",
  system: "bg-muted text-muted-foreground border-border",
  alert: "bg-warning/10 text-warning-foreground border-warning/20",
}

// ─── Derived activity state (auto-checks EOD checklist) ───────────────────────
// In a real app these would come from server state; here we derive from LOG_EVENTS.
const absenceEvents    = LOG_EVENTS.filter(e => e.type === "absence")
const pendingAbsences  = absenceEvents.filter(e => e.detail?.toLowerCase().includes("pending")).length
const allAbsencesReviewed = pendingAbsences === 0

const proxyEvents      = LOG_EVENTS.filter(e => e.type === "proxy")
const proxiesPending   = proxyEvents.filter(e => e.detail?.toLowerCase().includes("pending")).length
const allPeriodsCovered = proxiesPending === 0

const swapEvents       = LOG_EVENTS.filter(e => e.type === "swap")
const swapsPending     = swapEvents.filter(e => e.detail?.toLowerCase().includes("awaiting")).length
const swapsActioned    = swapsPending === 0

const feeEvents        = LOG_EVENTS.filter(e => e.type === "fee")
const feesReconciled   = feeEvents.length > 0

const logFinalized     = LOG_EVENTS.some(e => e.message.toLowerCase().includes("daily log finalized"))

const EOD_CHECKLIST: TaskItem[] = [
  { id: "c1", label: "All absences reviewed and approved",   hint: `${absenceEvents.length} teacher${absenceEvents.length !== 1 ? "s" : ""} absent today`,              done: allAbsencesReviewed },
  { id: "c2", label: "Every open period has proxy coverage", hint: "Target: 100% coverage",                                                                               done: allPeriodsCovered },
  { id: "c3", label: "Pending swap requests actioned",       hint: `${swapEvents.length} swap${swapEvents.length !== 1 ? "s" : ""} logged today`,                        done: swapsActioned },
  { id: "c4", label: "Fee collections reconciled for the day", hint: `${feeEvents.length} fee transaction${feeEvents.length !== 1 ? "s" : ""} recorded`,                 done: feesReconciled },
  { id: "c5", label: "Daily log exported and filed",         hint: "PDF saved to records",                                                                                done: logFinalized },
]

// Coverage data
const TOTAL_PERIODS   = 7
const COVERED_COUNT   = 5
const OPEN_GAPS       = TOTAL_PERIODS - COVERED_COUNT
const COVERAGE_PCT    = Math.round((COVERED_COUNT / TOTAL_PERIODS) * 100)
const DECLINED_COUNT  = 0
const SAME_SUBJECT    = 3   // green proxies
const DIFF_SUBJECT    = 2   // amber proxies

export default function DailyLogPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 fade-in">
      <PageHeader
        icon={<ScrollText size={20} />}
        title="Daily Log"
        subtitle="End-of-day operations summary for June 15, 2026"
        actions={
          <Button variant="outline" size="sm">
            <Download size={14} className="mr-1.5" /> Export PDF
          </Button>
        }
      />

      {/* KPI Summary Cards — global KpiCard style */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Teachers Absent"
          value="3"
          subtitle="+1 vs yesterday"
          icon={<UserX className="size-5" />}
          tone="red"
          sparkline={{ variant: "bar", data: [1, 2, 1, 3, 2, 2, 3], color: "var(--ef-red)" }}
        />
        <KpiCard
          title="Proxies Assigned"
          value="5 / 7"
          subtitle="71% fill rate"
          icon={<Grid3X3 className="size-5" />}
          tone="brand"
          sparkline={{ variant: "bar", data: [4, 5, 6, 5, 7, 6, 5], color: "var(--ef-green)" }}
        />
        <KpiCard
          title="Swap Requests"
          value="1"
          subtitle="Agreed · Awaiting approval"
          icon={<ArrowLeftRight className="size-5" />}
          tone="purple"
          sparkline={{ variant: "bar", data: [0, 1, 2, 1, 0, 1, 1], color: "var(--ef-purple)" }}
        />
        <KpiCard
          title="Fee Collected"
          value="₹42,500"
          subtitle="3 transactions today"
          icon={<IndianRupee className="size-5" />}
          tone="green"
          sparkline={{ variant: "bar", data: [18000, 32000, 25000, 42000, 38000, 30000, 42500], color: "var(--ef-green)" }}
        />
      </div>

      {/* Day Status + Checklist + Coverage Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Left column: Day Status + Checklist stacked */}
        <div className="flex flex-col gap-6">
          {/* Overall Day Status */}
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="size-10 rounded-full bg-[var(--ef-green-light)] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={20} className="text-[var(--ef-green-dark)]" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  Day Status: <span className="text-[var(--ef-green-dark)]">Good</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  71% proxy coverage · 0 incidents · ₹42,500 fee collected · All systems operational
                </p>
              </div>
            </CardContent>
          </Card>

          <TaskList
            title="End-of-Day Checklist"
            subtitle="Activities already completed are auto-checked. Confirm remaining items before closing."
            tasks={EOD_CHECKLIST}
          />
        </div>

        {/* Right column: Coverage Summary */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" /> Coverage Summary
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4 flex flex-col gap-4 flex-1">

            {/* Main progress */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground">Proxy fill rate</span>
                <span className="text-sm font-bold text-primary tabular-nums">{COVERED_COUNT} / {TOTAL_PERIODS} ({COVERAGE_PCT}%)</span>
              </div>
              <Progress
                value={COVERAGE_PCT}
                className={`h-2.5 rounded-full ${COVERAGE_PCT >= 80 ? "[&>div]:bg-[var(--ef-green)]" : COVERAGE_PCT >= 50 ? "[&>div]:bg-primary" : "[&>div]:bg-destructive"}`}
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                {COVERAGE_PCT >= 85 ? "Excellent coverage — well above target." : COVERAGE_PCT >= 70 ? "Acceptable coverage — 2 gaps need follow-up." : "Below target — immediate action needed."}
              </p>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[var(--ef-green)] inline-block" />
                  <p className="text-xs text-muted-foreground">Same Subject</p>
                </div>
                <p className="text-2xl font-bold text-[var(--ef-green-dark)]">{SAME_SUBJECT}</p>
                <p className="text-[10px] text-muted-foreground">Best-match proxies</p>
              </div>
              <div className="rounded-xl border border-border p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-[var(--ef-amber)] inline-block" />
                  <p className="text-xs text-muted-foreground">Alt Subject</p>
                </div>
                <p className="text-2xl font-bold text-[var(--ef-amber-dark)]">{DIFF_SUBJECT}</p>
                <p className="text-[10px] text-muted-foreground">Cross-subject coverage</p>
              </div>
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-destructive inline-block" />
                  <p className="text-xs text-muted-foreground">Open Gaps</p>
                </div>
                <p className="text-2xl font-bold text-destructive">{OPEN_GAPS}</p>
                <p className="text-[10px] text-muted-foreground">Periods uncovered</p>
              </div>
              <div className="rounded-xl border border-border p-3 flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                  <Circle className="size-2.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Declined</p>
                </div>
                <p className="text-2xl font-bold text-muted-foreground">{DECLINED_COUNT}</p>
                <p className="text-[10px] text-muted-foreground">Proxy refusals</p>
              </div>
            </div>

            {/* Legend */}
            <div className="rounded-xl bg-muted/40 border border-border p-3">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Proxy dot legend</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {[
                  { dot: "bg-[var(--ef-green)]",    label: "Same subject (best match)" },
                  { dot: "bg-[var(--ef-amber)]",    label: "Alt subject (available)" },
                  { dot: "bg-muted-foreground",     label: "Capped (daily/weekly limit)" },
                  { dot: "bg-destructive",           label: "Unavailable / declined" },
                ].map(({ dot, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full inline-block flex-shrink-0 ${dot}`} />
                    <span className="text-[10px] text-muted-foreground">{label}</span>
                  </div>
                ))}
              </div>
            </div>

          </CardContent>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Activity Timeline — June 15, 2026</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-6">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-border" />

            <div className="space-y-5">
              {LOG_EVENTS.map((event, i) => {
                const Icon = EVENT_ICONS[event.type]
                return (
                  <div key={i} className="flex gap-4 relative">
                    {/* Icon circle */}
                    <div className={`size-10 rounded-full border flex items-center justify-center flex-shrink-0 z-10 ${EVENT_COLORS[event.type]}`}>
                      <Icon size={14} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-start gap-2 flex-wrap">
                        <span className="text-xs font-mono font-semibold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                          {event.time}
                        </span>
                        <p className="text-sm font-medium text-foreground flex-1">{event.message}</p>
                      </div>
                      {event.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5 ml-0">{event.detail}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
