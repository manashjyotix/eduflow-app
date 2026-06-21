"use client"
import { useState, Fragment } from "react"
import {
  IndianRupee, Download, Filter, CheckCircle2, AlertTriangle,
  Clock, RefreshCw, Webhook, Building2, Calendar, ChevronDown,
  ReceiptText, ShieldCheck, Search,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"

interface WebhookEvent {
  id: string; event: string; school: string; amount: number
  status: "success" | "failed" | "pending" | "retrying"
  timestamp: string; webhookId: string; plan: string
}

const WEBHOOK_EVENTS: WebhookEvent[] = [
  { id: "wh-001", event: "payment.captured", school: "Holy Child English Academy", amount: 999, status: "success", timestamp: "2026-06-04 09:12:34", webhookId: "pay_OxB1234abc", plan: "Starter" },
  { id: "wh-002", event: "subscription.activated", school: "Delhi Public School, Guwahati", amount: 8999, status: "success", timestamp: "2026-06-04 08:44:10", webhookId: "sub_OxB5678def", plan: "Annual" },
  { id: "wh-003", event: "payment.captured", school: "Mount Carmel Academy", amount: 2499, status: "success", timestamp: "2026-06-03 17:30:55", webhookId: "pay_OxC9012ghi", plan: "Quarterly" },
  { id: "wh-004", event: "invoice.payment_failed", school: "Bright Minds Academy", amount: 999, status: "failed", timestamp: "2026-06-03 14:20:08", webhookId: "inv_OxD3456jkl", plan: "Starter" },
  { id: "wh-005", event: "subscription.renewed", school: "Kendriya Vidyalaya No. 1", amount: 7499, status: "success", timestamp: "2026-06-03 10:05:22", webhookId: "sub_OxE7890mno", plan: "Annual" },
  { id: "wh-006", event: "payment.captured", school: "Don Bosco Academy", amount: 2499, status: "success", timestamp: "2026-06-02 16:18:41", webhookId: "pay_OxF2345pqr", plan: "Quarterly" },
  { id: "wh-007", event: "subscription.created", school: "St. Xavier's High School", amount: 0, status: "pending", timestamp: "2026-06-02 11:00:00", webhookId: "sub_OxG6789stu", plan: "Trial" },
  { id: "wh-008", event: "payment.captured", school: "Greenfield Public School", amount: 0, status: "pending", timestamp: "2026-06-01 09:33:16", webhookId: "sub_OxH1234vwx", plan: "Trial" },
  { id: "wh-009", event: "refund.processed", school: "Don Bosco Academy", amount: 2499, status: "success", timestamp: "2026-05-31 14:55:00", webhookId: "rfnd_OxI5678yza", plan: "Quarterly" },
  { id: "wh-010", event: "invoice.payment_failed", school: "Bright Minds Academy", amount: 999, status: "retrying", timestamp: "2026-06-04 12:00:00", webhookId: "inv_OxJ0123bcd", plan: "Starter" },
]

const STATUS_META: Record<WebhookEvent["status"], { variant: "success" | "warning" | "destructive" | "default"; label: string }> = {
  success: { variant: "success", label: "Success" },
  failed: { variant: "destructive", label: "Failed" },
  pending: { variant: "warning", label: "Pending" },
  retrying: { variant: "default", label: "Retrying" },
}

const EVENT_DOT: Record<string, string> = {
  "payment.captured": "bg-ef-green",
  "subscription.activated": "bg-primary",
  "subscription.renewed": "bg-primary",
  "subscription.created": "bg-ef-purple",
  "invoice.payment_failed": "bg-ef-red",
  "refund.processed": "bg-ef-amber",
}

export default function BillingLogsPage() {
  const [search, setSearch] = useState("")
  const [eventFilter, setEventFilter] = useState("")
  const [schoolFilter, setSchoolFilter] = useState("")
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  const filtered = WEBHOOK_EVENTS.filter(e => {
    const matchSearch = e.school.toLowerCase().includes(search.toLowerCase()) || e.webhookId.toLowerCase().includes(search.toLowerCase())
    const matchEvent = !eventFilter || e.event === eventFilter
    const matchSchool = !schoolFilter || e.school === schoolFilter
    return matchSearch && matchEvent && matchSchool
  })

  const { sorted, sortField, sortDir, toggleSort } = useTableSort(filtered, {
    timestamp: e => e.timestamp,
    amount: e => e.amount,
    event: e => e.event,
    school: e => e.school,
  }, { field: "timestamp", dir: "desc" })

  const mtdRevenue = WEBHOOK_EVENTS.filter(e => e.status === "success" && e.event.includes("payment")).reduce((s, e) => s + e.amount, 0)
  const failedCount = WEBHOOK_EVENTS.filter(e => e.status === "failed" || e.status === "retrying").length
  const uniqueEvents = [...new Set(WEBHOOK_EVENTS.map(e => e.event))]
  const uniqueSchools = [...new Set(WEBHOOK_EVENTS.map(e => e.school))]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<ReceiptText size={20} />}
        title="Billing & Payment Logs"
        subtitle="Razorpay webhook events · Real-time billing ledger"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm"><Download className="size-4" /> Export CSV</Button>
            <Button variant="secondary" size="sm"><RefreshCw className="size-4" /> Sync Razorpay</Button>
            <Button size="sm"><ReceiptText className="size-4" /> Manual Override</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard title="Total Revenue MTD" value={`₹${mtdRevenue.toLocaleString("en-IN")}`} subtitle="This month" icon={<IndianRupee className="size-5" />} iconClassName="bg-ef-green-light text-ef-green" sparkline={{ variant: "line", data: [4200, 5100, 3800, 6200, 5997, 5997], color: "var(--ef-green)" }} />
        <KpiCard title="Failed Payments" value={failedCount} subtitle={failedCount > 0 ? "Needs attention" : "All clear"} icon={<AlertTriangle className="size-5" />} iconClassName={failedCount > 0 ? "bg-ef-red-light text-ef-red" : "bg-ef-green-light text-ef-green"} sparkline={{ variant: "bar", data: [1, 0, 2, 1, 0, 2], color: failedCount > 0 ? "var(--ef-red)" : "var(--ef-green)" }} />
        <KpiCard title="Grace Period Schools" value={1} subtitle="At risk of churn" icon={<Clock className="size-5" />} iconClassName="bg-ef-amber-light text-ef-amber" sparkline={{ variant: "bar", data: [2, 1, 1, 0, 1, 1], color: "var(--ef-amber)" }} />
        <KpiCard title="Webhooks Processed" value={WEBHOOK_EVENTS.length} subtitle="This billing cycle" icon={<Webhook className="size-5" />} sparkline={{ variant: "bar", data: [6, 8, 7, 9, 10, 10] }} />
      </div>

      {/* Failed Payment Tracker */}
      <Card className="border-ef-amber">
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold"><AlertTriangle className="size-4 text-ef-amber" /> Failed Payment Tracker</CardTitle>
          <Badge variant="warning">● 1 issue</Badge>
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-5 py-3.5 border-b border-border">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="text-sm font-semibold">Bright Minds Academy</div>
                <div className="text-xs text-muted-foreground mt-0.5">invoice.payment_failed · ₹999 · Starter Plan · Retry attempt 2/3</div>
                <div className="text-[11px] text-muted-foreground/70 mt-0.5">Last tried: 2026-06-04 12:00:00 · Next retry in 4h</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="destructive">● Retrying</Badge>
                <Button variant="secondary" size="sm">Force Retry</Button>
                <Button variant="destructive" size="sm">Mark Suspended</Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <div className="flex items-center gap-1.5 text-xs text-ef-green-dark"><ShieldCheck className="size-3.5" /> All other payments are current</div>
        </CardFooter>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search school or webhook ID…" className="pl-9" />
            </div>
            <Select value={eventFilter || "__all__"} onValueChange={v => setEventFilter(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-[190px]"><SelectValue placeholder="All Event Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Event Types</SelectItem>
                {uniqueEvents.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={schoolFilter || "__all__"} onValueChange={v => setSchoolFilter(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Schools" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Schools</SelectItem>
                {uniqueSchools.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="secondary" size="sm"><Calendar className="size-3.5" /> Date Range</Button>
            <Button variant="secondary" size="sm"><Filter className="size-3.5" /> Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Event log */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold"><Webhook className="size-4 text-muted-foreground" /> Webhook Event Log</CardTitle>
          <Badge variant="secondary">{filtered.length} events</Badge>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          {filtered.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-3xl mb-3">📋</div>
              <div className="text-[15px] font-semibold mb-1.5">No events found</div>
              <div className="text-sm text-muted-foreground/70">Try adjusting your search or filter criteria.</div>
            </div>
          ) : (
            <Table className="text-sm">
              <caption className="sr-only">Webhook event log</caption>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-transparent">
                  <SortableHead field="event" label="Event Type" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                  <SortableHead field="school" label="School" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                  <SortableHead field="amount" label="Amount" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                  <TableHead className="text-xs"><span className="font-medium">Status</span></TableHead>
                  <SortableHead field="timestamp" label="Timestamp" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                  <TableHead className="text-xs"><span className="font-medium">Webhook ID</span></TableHead>
                  <TableHead className="text-xs"><span className="font-medium">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(ev => {
                  const sm = STATUS_META[ev.status]
                  return (
                    <Fragment key={ev.id}>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => setExpandedRow(expandedRow === ev.id ? null : ev.id)}
                        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedRow(expandedRow === ev.id ? null : ev.id) } }}
                        tabIndex={0}
                        role="button"
                        aria-expanded={expandedRow === ev.id}
                        aria-label={`Billing event ${ev.event} for ${ev.school}, ${sm.label}`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`size-2 rounded-full flex-shrink-0 ${EVENT_DOT[ev.event] ?? "bg-muted-foreground"}`} aria-hidden="true" />
                            <span className="font-mono text-xs font-semibold">{ev.event}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-sm"><Building2 className="size-3 text-muted-foreground/70 flex-shrink-0" /><span className="max-w-[200px] truncate">{ev.school}</span></div>
                        </TableCell>
                        <TableCell><span className={`font-mono text-sm font-semibold ${ev.amount > 0 ? "" : "text-muted-foreground/70"}`}>{ev.amount > 0 ? `₹${ev.amount.toLocaleString("en-IN")}` : "—"}</span></TableCell>
                        <TableCell><Badge variant={sm.variant}>● {sm.label}</Badge></TableCell>
                        <TableCell><span className="font-mono text-[11px] text-muted-foreground">{ev.timestamp}</span></TableCell>
                        <TableCell><span className="font-mono text-[11px] text-primary">{ev.webhookId}</span></TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm"><ChevronDown className={`size-3.5 transition-transform ${expandedRow === ev.id ? "rotate-180" : ""}`} /> Details</Button>
                            {ev.status === "failed" && <Button variant="secondary" size="sm"><RefreshCw className="size-3" /> Retry</Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRow === ev.id && (
                        <TableRow className="bg-muted/40 hover:bg-muted/40">
                          <TableCell colSpan={7} className="px-6 py-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div><div className="text-muted-foreground/70 mb-0.5">Plan</div><div className="font-semibold">{ev.plan}</div></div>
                              <div><div className="text-muted-foreground/70 mb-0.5">Webhook ID</div><div className="text-primary font-mono">{ev.webhookId}</div></div>
                              <div><div className="text-muted-foreground/70 mb-0.5">Processing Time</div><div className="font-semibold">143ms</div></div>
                              <div><div className="text-muted-foreground/70 mb-0.5">Gateway</div><div className="font-semibold">Razorpay</div></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
        <CardFooter className="justify-between">
          <span className="text-xs text-muted-foreground">
            {filtered.length} of {WEBHOOK_EVENTS.length} events · <span className="text-ef-green-dark"><CheckCircle2 className="size-2.5 inline mr-1" />{WEBHOOK_EVENTS.filter(e => e.status === "success").length} successful</span>
          </span>
          <Button variant="ghost" size="sm"><Download className="size-3.5" /> Export full log</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
