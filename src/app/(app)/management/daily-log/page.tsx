import { ScrollText, Download, UserX, Grid3X3, ArrowLeftRight, IndianRupee, ShieldAlert, CheckCircle2, AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { TaskList, type TaskItem } from "@/components/shared/task-list"
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

const SUMMARY_ITEMS = [
  { label: "Teachers Absent",     value: "3",          icon: UserX,        color: "text-destructive" },
  { label: "Proxies Assigned",    value: "5 / 7",      icon: Grid3X3,      color: "text-primary" },
  { label: "Swap Requests",       value: "1",          icon: ArrowLeftRight,color: "text-[var(--ef-purple)]" },
  { label: "Fee Collected",       value: "₹42,500",    icon: IndianRupee,  color: "text-[var(--ef-green-dark)]" },
  { label: "Incidents",           value: "0",          icon: ShieldAlert,  color: "text-muted-foreground" },
]

const EOD_CHECKLIST: TaskItem[] = [
  { id: "c1", label: "All absences reviewed and approved", hint: "3 teachers absent today" },
  { id: "c2", label: "Every open period has proxy coverage", hint: "Target: 100% coverage" },
  { id: "c3", label: "Pending swap requests actioned", hint: "1 swap awaiting approval", done: true },
  { id: "c4", label: "Fee collections reconciled for the day", hint: "Match receipts with ledger" },
  { id: "c5", label: "Daily log exported and filed", hint: "PDF saved to records" },
]

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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {SUMMARY_ITEMS.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.label}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="rounded-lg p-2 bg-muted flex-shrink-0">
                  <Icon size={16} className={item.color} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground leading-tight">{item.label}</p>
                  <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Overall Status Card */}
      <Card className="border-l-4 border-l-[var(--ef-green)]">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="size-10 rounded-full bg-[var(--ef-green-light)] flex items-center justify-center flex-shrink-0">
            <CheckCircle2 size={20} className="text-[var(--ef-green-dark)]" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Day Status: <span className="text-[var(--ef-green-dark)]">Good</span></p>
            <p className="text-sm text-muted-foreground">
              71% proxy coverage · 0 incidents · ₹42,500 fee collected · All systems operational
            </p>
          </div>
          <Badge variant="success" className="ml-auto flex-shrink-0">Good Day</Badge>
        </CardContent>
      </Card>

      {/* End-of-day operations checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TaskList
          title="End-of-Day Checklist"
          subtitle="Confirm all daily operations are closed before finalizing."
          tasks={EOD_CHECKLIST}
        />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CheckCircle2 className="size-4 text-success-foreground" /> Coverage Summary
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Proxy coverage</span>
              <span className="text-sm font-bold text-primary">5 / 7 (71%)</span>
            </div>
            <Progress value={71} className="h-2 [&>div]:bg-primary" />
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Open gaps</p>
                <p className="text-lg font-bold text-destructive">2</p>
              </div>
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Declined</p>
                <p className="text-lg font-bold text-warning-foreground">0</p>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Finalize the checklist on the left before closing the daily log.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
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
