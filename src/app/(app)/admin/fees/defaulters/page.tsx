"use client"

import {
  AlertTriangle, Bell, TrendingDown, Calendar, Eye, MessageSquare, MoreHorizontal
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

const DEFAULTERS = [
  {
    id: "d1", rank: 1, studentName: "Amrit Hazarika", class: "X-A",
    totalDue: 12500, monthsOverdue: 4, daysOverdue: 87, lastPayment: "2026-02-28",
    feeHeads: ["Tuition", "Development", "Lab"]
  },
  {
    id: "d2", rank: 2, studentName: "Bina Kalita", class: "IX-B",
    totalDue: 9200, monthsOverdue: 3, daysOverdue: 71, lastPayment: "2026-03-15",
    feeHeads: ["Tuition", "Development"]
  },
  {
    id: "d3", rank: 3, studentName: "Chandan Roy", class: "VIII-C",
    totalDue: 8800, monthsOverdue: 3, daysOverdue: 64, lastPayment: "2026-03-20",
    feeHeads: ["Tuition", "Transport"]
  },
  {
    id: "d4", rank: 4, studentName: "Dipika Sharma", class: "VII-A",
    totalDue: 6500, monthsOverdue: 2, daysOverdue: 45, lastPayment: "2026-04-30",
    feeHeads: ["Tuition", "Library"]
  },
  {
    id: "d5", rank: 5, studentName: "Emon Das", class: "VI-B",
    totalDue: 5500, monthsOverdue: 2, daysOverdue: 42, lastPayment: "2026-04-30",
    feeHeads: ["Tuition", "Transport"]
  },
  {
    id: "d6", rank: 6, studentName: "Farida Begum", class: "X-B",
    totalDue: 5000, monthsOverdue: 2, daysOverdue: 38, lastPayment: "2026-05-08",
    feeHeads: ["Tuition", "Development"]
  },
  {
    id: "d7", rank: 7, studentName: "Gautam Singh", class: "IX-A",
    totalDue: 4300, monthsOverdue: 2, daysOverdue: 35, lastPayment: "2026-05-12",
    feeHeads: ["Tuition", "Lab"]
  },
  {
    id: "d8", rank: 8, studentName: "Hema Gogoi", class: "VIII-A",
    totalDue: 3800, monthsOverdue: 1, daysOverdue: 22, lastPayment: "2026-05-24",
    feeHeads: ["Tuition"]
  },
  {
    id: "d9", rank: 9, studentName: "Indira Nath", class: "VII-B",
    totalDue: 3200, monthsOverdue: 1, daysOverdue: 18, lastPayment: "2026-05-28",
    feeHeads: ["Tuition", "Sports"]
  },
  {
    id: "d10", rank: 10, studentName: "Jai Borah", class: "VI-A",
    totalDue: 2700, monthsOverdue: 1, daysOverdue: 15, lastPayment: "2026-06-01",
    feeHeads: ["Tuition"]
  },
]

function getRowClass(daysOverdue: number) {
  if (daysOverdue > 60) return "bg-[var(--ef-red-light)] hover:bg-[var(--ef-red-light)]/70"
  if (daysOverdue > 30) return "bg-[var(--ef-amber-light)] hover:bg-[var(--ef-amber-light)]/70"
  return "hover:bg-muted/20"
}

function getSeverityBadge(daysOverdue: number) {
  if (daysOverdue > 60) return <Badge variant="destructive">Critical</Badge>
  if (daysOverdue > 30) return <Badge variant="warning">High</Badge>
  return <Badge variant="secondary">Moderate</Badge>
}

export default function DefaultersPage() {
  const critical = DEFAULTERS.filter(d => d.daysOverdue > 60).length
  const totalDue = DEFAULTERS.reduce((acc, d) => acc + d.totalDue, 0)
  const avgDays = Math.round(DEFAULTERS.reduce((acc, d) => acc + d.daysOverdue, 0) / DEFAULTERS.length)

  const { sorted, sortField, sortDir, toggleSort } = useTableSort<
    (typeof DEFAULTERS)[number],
    "rank" | "student" | "class" | "totalDue" | "daysOverdue" | "lastPayment" | "severity"
  >(DEFAULTERS, {
    rank:        d => d.rank,
    student:     d => d.studentName,
    class:       d => d.class,
    totalDue:    d => d.totalDue,
    daysOverdue: d => d.daysOverdue,
    lastPayment: d => new Date(d.lastPayment).getTime(),
    severity:    d => d.daysOverdue,
  }, { field: "rank" })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<AlertTriangle size={20} />}
        title="Fee Defaulters"
        subtitle="Students with outstanding dues"
        actions={
          <Button variant="destructive">
            <Bell className="size-4 mr-2" />
            Send Reminder (All)
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Total Defaulters"
          value={15}
          subtitle="students with dues"
          icon={<AlertTriangle size={18} />}
          iconClassName="bg-warning/10 text-warning-foreground"
        />
        <KpiCard
          title="Outstanding Amount"
          value={`₹${(totalDue / 1000).toFixed(0)}K`}
          subtitle="total pending recovery"
          icon={<TrendingDown size={18} />}
          iconClassName="bg-destructive/10 text-destructive"
        />
        <KpiCard
          title="Avg Days Overdue"
          value={avgDays}
          subtitle="average across defaulters"
          icon={<Calendar size={18} />}
          iconClassName="bg-warning text-warning-foreground"
        />
        <KpiCard
          title="Critical (>60 days)"
          value={critical}
          subtitle="need urgent follow-up"
          icon={<AlertTriangle size={18} />}
          iconClassName="bg-destructive/10 text-destructive"
        />
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-[var(--ef-red)]/30 border border-[var(--ef-red)]" />
          <span className="text-muted-foreground">Critical — over 60 days overdue</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-[var(--ef-amber)]/30 border border-[var(--ef-amber)]" />
          <span className="text-muted-foreground">High — 30–60 days overdue</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-3 rounded-sm bg-muted border border-border" />
          <span className="text-muted-foreground">Moderate — under 30 days</span>
        </span>
      </div>

      {/* Defaulters Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">
            Defaulters List
            <Badge variant="destructive" className="ml-2 font-normal">{DEFAULTERS.length} shown of 15</Badge>
          </CardTitle>
          <Button variant="outline" size="sm">Export List</Button>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <caption className="sr-only">Fee defaulters ranked by days overdue</caption>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-transparent">
                  <SortableHead field="rank" label="#" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="center" className="text-center font-medium text-muted-foreground px-4 py-3 w-10 h-auto" />
                  <SortableHead field="student" label="Student" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-left font-medium text-muted-foreground px-4 py-3 h-auto" />
                  <SortableHead field="class" label="Class" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-left font-medium text-muted-foreground px-4 py-3 h-auto" />
                  <SortableHead field="totalDue" label="Total Due" sortField={sortField} sortDir={sortDir} onSort={toggleSort} align="right" className="text-right font-medium text-muted-foreground px-4 py-3 h-auto" />
                  <SortableHead field="daysOverdue" label="Days Overdue" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-left font-medium text-muted-foreground px-4 py-3 h-auto" />
                  <SortableHead field="lastPayment" label="Last Payment" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-left font-medium text-muted-foreground px-4 py-3 h-auto" />
                  <TableHead className="text-left font-medium text-muted-foreground px-4 py-3 h-auto">Fee Heads</TableHead>
                  <SortableHead field="severity" label="Severity" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-left font-medium text-muted-foreground px-4 py-3 h-auto" />
                  <TableHead className="text-left font-medium text-muted-foreground px-4 py-3 h-auto">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map(def => (
                  <TableRow
                    key={def.id}
                    className={`transition-colors ${getRowClass(def.daysOverdue)}`}
                  >
                    <TableCell className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-muted-foreground">#{def.rank}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">
                          {def.studentName.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-medium">{def.studentName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge variant="outline" className="font-mono text-xs">{def.class}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <span className="font-bold text-destructive">
                        ₹{def.totalDue.toLocaleString("en-IN")}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden" role="img" aria-label={`${def.daysOverdue} days overdue`}>
                          <div
                            className={`h-full rounded-full ${def.daysOverdue > 60 ? "bg-destructive" : def.daysOverdue > 30 ? "bg-[var(--ef-amber)]" : "bg-[var(--ef-amber-dark)]"}`}
                            style={{ width: `${Math.min((def.daysOverdue / 90) * 100, 100)}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold">{def.daysOverdue}d</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(def.lastPayment).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {def.feeHeads.map(h => (
                          <span key={h} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{h}</span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">{getSeverityBadge(def.daysOverdue)}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-7" title="View" aria-label={`View ${def.studentName}`}>
                          <Eye className="size-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-7" title="Send Reminder" aria-label={`Send reminder to ${def.studentName}`}>
                          <MessageSquare className="size-3.5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-7" aria-label={`More actions for ${def.studentName}`}>
                              <MoreHorizontal className="size-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Full Profile</DropdownMenuItem>
                            <DropdownMenuItem>Record Payment</DropdownMenuItem>
                            <DropdownMenuItem>Send SMS Reminder</DropdownMenuItem>
                            <DropdownMenuItem>Print Statement</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-muted/30 hover:bg-transparent">
                  <TableCell colSpan={3} className="px-4 py-3 font-semibold text-sm">Total Outstanding</TableCell>
                  <TableCell className="px-4 py-3 text-right font-bold text-destructive text-sm">
                    ₹{totalDue.toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell colSpan={5} />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
