"use client"
import { useMemo, useState } from "react"
import { BookOpen, Check, X, Clock } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { AttendanceEditInbox } from "@/components/domain/attendance/AttendanceEditInbox"
import { useAttendance } from "@/context/attendance-context"
import { cn } from "@/lib/utils"
import { TEACHING_PERIODS } from "@/lib/constants"

const CLASSES = ["Class VI-A", "Class VII-A", "Class VIII-A", "Class IX-A", "Class X-A"]

const STUDENTS = [
  { id: "s1", name: "Rohit Das",        roll: 12 },
  { id: "s2", name: "Priti Bora",       roll: 13 },
  { id: "s3", name: "Aman Hazarika",    roll: 14 },
  { id: "s4", name: "Neha Kalita",      roll: 15 },
  { id: "s5", name: "Deepak Choudhury", roll: 16 },
  { id: "s6", name: "Sneha Saikia",     roll: 17 },
]

// Earlier (historical) attendance — per-day summary for this class
const HISTORY = [
  { date: "2026-06-20", present: 6, absent: 0, late: 0 },
  { date: "2026-06-19", present: 5, absent: 1, late: 0 },
  { date: "2026-06-18", present: 4, absent: 1, late: 1 },
  { date: "2026-06-17", present: 6, absent: 0, late: 0 },
  { date: "2026-06-16", present: 5, absent: 0, late: 1 },
]

type AttStatus = "present" | "absent" | "late"

const STATUS_BTN: Record<AttStatus, { label: string; icon: typeof Check; on: string }> = {
  present: { label: "Present", icon: Check, on: "bg-[var(--ef-green)] text-white border-transparent hover:bg-[var(--ef-green)]/90" },
  absent:  { label: "Absent",  icon: X,     on: "bg-destructive text-white border-transparent hover:bg-destructive/90" },
  late:    { label: "Late",    icon: Clock, on: "bg-[var(--ef-amber)] text-white border-transparent hover:bg-[var(--ef-amber)]/90" },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })
}

export default function AttendancePage() {
  const [selectedClass, setSelectedClass] = useState<string>(CLASSES[0])
  const [selectedPeriod, setSelectedPeriod] = useState<string>(TEACHING_PERIODS[0].id)
  const [attendance, setAttendance] = useState<Record<string, AttStatus>>(
    Object.fromEntries(STUDENTS.map((s) => [s.id, "present"]))
  )
  const { pendingCount } = useAttendance()

  function setStatus(id: string, status: AttStatus) {
    setAttendance((prev) => ({ ...prev, [id]: status }))
  }

  const counts = useMemo(() => {
    const vals = Object.values(attendance)
    return {
      present: vals.filter((v) => v === "present").length,
      absent: vals.filter((v) => v === "absent").length,
      late: vals.filter((v) => v === "late").length,
      total: vals.length,
    }
  }, [attendance])

  // Late counts toward attendance (present-equivalent for %), absent does not.
  const pct = counts.total
    ? Math.round(((counts.present + counts.late) / counts.total) * 1000) / 10
    : 0

  const { sorted: sortedHistory, sortField, sortDir, toggleSort } = useTableSort<
    (typeof HISTORY)[number],
    "date" | "present" | "absent" | "late" | "pct"
  >(
    HISTORY,
    {
      date: h => h.date,
      present: h => h.present,
      absent: h => h.absent,
      late: h => h.late,
      pct: h => {
        const total = h.present + h.absent + h.late
        return total ? (h.present + h.late) / total : 0
      },
    },
    { field: "date", dir: "desc" },
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<BookOpen size={22} />}
        title="Student Attendance"
        subtitle="Mark per-period roll call and review history"
        actions={<Button>Submit Roll</Button>}
      />

      {/* ── Class + Period selectors (consistent h-9 controls) ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Class</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {CLASSES.map((cls) => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">Period</label>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {TEACHING_PERIODS.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Live KPI summary ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Attendance %"
          value={`${pct}%`}
          subtitle={`${counts.present + counts.late} of ${counts.total} students in`}
          icon={<Check size={18} />}
          tone="brand"
          trend={{ value: Math.round((pct - (HISTORY[1] ? Math.round(((HISTORY[1].present + HISTORY[1].late) / Math.max(HISTORY[1].present + HISTORY[1].absent + HISTORY[1].late, 1)) * 1000) / 10 : pct))), label: "vs yesterday" }}
          sparkline={{ variant: "arc", value: Math.round(pct) }}
        />
        <KpiCard
          title="Present"
          value={counts.present}
          subtitle={`of ${counts.total} students today`}
          icon={<Check size={18} />}
          tone="green"
          trend={{ value: Math.round(((counts.present - (HISTORY[0]?.present ?? counts.present)) / Math.max(HISTORY[0]?.present ?? 1, 1)) * 100), label: "vs last recorded" }}
          sparkline={{ variant: "bar", data: [...HISTORY].reverse().map(h => h.present) }}
        />
        <KpiCard
          title="Absent"
          value={counts.absent}
          subtitle={counts.absent === 0 ? "Full house today" : `${counts.absent} missing today`}
          icon={<X size={18} />}
          tone="red"
          trend={{ value: Math.round(((counts.absent - (HISTORY[0]?.absent ?? counts.absent)) / Math.max(HISTORY[0]?.absent ?? 1, 1)) * 100), label: "vs last recorded" }}
          sparkline={{ variant: "bar", data: [...HISTORY].reverse().map(h => h.absent) }}
        />
        <KpiCard
          title="Late"
          value={counts.late}
          subtitle={counts.late === 0 ? "No late arrivals" : `${counts.late} late arrival${counts.late > 1 ? "s" : ""}`}
          icon={<Clock size={18} />}
          tone="amber"
          trend={{ value: Math.round(((counts.late - (HISTORY[0]?.late ?? counts.late)) / Math.max(HISTORY[0]?.late ?? 1, 1)) * 100), label: "vs last recorded" }}
          sparkline={{ variant: "bar", data: [...HISTORY].reverse().map(h => h.late) }}
        />
      </div>

      <Tabs defaultValue="today">
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="earlier">Earlier</TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5">
            Edit Requests
            {pendingCount > 0 && (
              <Badge variant="warning" className="h-5 px-1.5 text-[10px]">{pendingCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Today: mark roll ── */}
        <TabsContent value="today" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedClass} — {TEACHING_PERIODS.find((p) => p.id === selectedPeriod)?.label}
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {STUDENTS.map((student) => {
                  const status = attendance[student.id]
                  return (
                    <li key={student.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-6 text-center">{student.roll}</span>
                        <p className="text-sm font-medium">{student.name}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {(Object.keys(STATUS_BTN) as AttStatus[]).map((s) => {
                          const cfg = STATUS_BTN[s]
                          const Icon = cfg.icon
                          const active = status === s
                          return (
                            <button
                              key={s}
                              type="button"
                              aria-pressed={active}
                              onClick={() => setStatus(student.id, s)}
                              className={cn(
                                "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition-colors",
                                active ? cfg.on : "border-input bg-background text-muted-foreground hover:bg-muted",
                              )}
                            >
                              <Icon className="size-3.5" />
                              {cfg.label}
                            </button>
                          )
                        })}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Earlier: history ── */}
        <TabsContent value="earlier" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{selectedClass} — Recent days</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <caption className="sr-only">Recent daily attendance for {selectedClass}</caption>
                  <TableHeader>
                    <TableRow className="bg-muted/40 text-xs text-muted-foreground hover:bg-transparent">
                      <SortableHead field="date" label="Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-5 py-3 text-left font-medium h-auto" />
                      <SortableHead field="present" label="Present" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-4 py-3 text-left font-medium h-auto" />
                      <SortableHead field="absent" label="Absent" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-4 py-3 text-left font-medium h-auto" />
                      <SortableHead field="late" label="Late" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-4 py-3 text-left font-medium h-auto" />
                      <SortableHead field="pct" label="%" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="px-4 py-3 text-left font-medium h-auto" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedHistory.map((h) => {
                      const total = h.present + h.absent + h.late
                      const dayPct = total ? Math.round(((h.present + h.late) / total) * 1000) / 10 : 0
                      return (
                        <TableRow key={h.date} className="hover:bg-muted/20 transition-colors">
                          <TableCell className="px-5 py-3 font-medium">{fmtDate(h.date)}</TableCell>
                          <TableCell className="px-4 py-3 text-[var(--ef-green-dark)]">{h.present}</TableCell>
                          <TableCell className="px-4 py-3 text-destructive">{h.absent}</TableCell>
                          <TableCell className="px-4 py-3 text-[var(--ef-amber-dark)]">{h.late}</TableCell>
                          <TableCell className="px-4 py-3 font-semibold">{dayPct}%</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Edit Requests: teacher modification inbox ── */}
        <TabsContent value="requests" className="mt-4">
          <AttendanceEditInbox reviewer="Arnab Paul" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
