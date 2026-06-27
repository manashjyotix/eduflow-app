"use client"

import { useState } from "react"
import { Users, ClipboardList } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TEACHERS } from "@/data/teachers"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import { ToggleTabs } from "@/components/shared/toggle-tabs"
import { AttendanceEditInbox } from "@/components/domain/attendance/AttendanceEditInbox"
import { useAttendance } from "@/context/attendance-context"

const TEACHER_ATTENDANCE = TEACHERS.map((t, i) => ({
  id: t.id,
  name: t.name,
  subjects: t.subjects[0],
  section: t.section,
  status: t.status,
  thisMonthPct: t.status === "on_leave" ? 72 : t.status === "inactive" ? 0 : [98, 95, 91, 100, 96, 88, 94, 0, 79, 99][i] ?? 95,
  daysPresent: t.status === "on_leave" ? 11 : t.status === "inactive" ? 0 : [15, 14, 13, 15, 14, 13, 14, 0, 12, 15][i] ?? 14,
  daysAbsent: t.status === "on_leave" ? 4 : t.status === "inactive" ? 15 : [0, 1, 2, 0, 1, 2, 1, 15, 3, 0][i] ?? 1,
  leaveBalance: t.status === "inactive" ? 0 : [8, 7, 5, 9, 11, 3, 8, 0, 4, 10][i] ?? 8,
}))

const CLASS_ATTENDANCE = [
  { cls: "VI-A",   total: 42, present: 38, absent: 4,  pct: 90.5 },
  { cls: "VI-B",   total: 40, present: 36, absent: 4,  pct: 90.0 },
  { cls: "VII-A",  total: 45, present: 39, absent: 6,  pct: 86.7 },
  { cls: "VII-B",  total: 43, present: 40, absent: 3,  pct: 93.0 },
  { cls: "VIII-A", total: 44, present: 37, absent: 7,  pct: 84.1 },
  { cls: "VIII-B", total: 41, present: 38, absent: 3,  pct: 92.7 },
  { cls: "IX-A",   total: 38, present: 35, absent: 3,  pct: 92.1 },
  { cls: "IX-B",   total: 37, present: 33, absent: 4,  pct: 89.2 },
  { cls: "X-A",    total: 35, present: 30, absent: 5,  pct: 85.7 },
  { cls: "X-B",    total: 34, present: 31, absent: 3,  pct: 91.2 },
]

function statusVariant(status: string): "success" | "warning" | "secondary" | "destructive" {
  if (status === "active") return "success"
  if (status === "on_leave") return "warning"
  return "secondary"
}

function pctColor(pct: number): string {
  if (pct >= 90) return "text-[var(--ef-green-dark)]"
  if (pct >= 75) return "text-warning-foreground"
  return "text-destructive"
}

export default function AttendanceSummaryPage() {
  const [viewMode, setViewMode] = useState<"Daily" | "Weekly" | "Monthly">("Daily")
  const { pendingCount } = useAttendance()

  const teacherSort = useTableSort<
    (typeof TEACHER_ATTENDANCE)[number],
    "name" | "subjects" | "section" | "thisMonthPct" | "daysPresent" | "daysAbsent" | "leaveBalance" | "status"
  >(TEACHER_ATTENDANCE, {
    name:         t => t.name,
    subjects:     t => t.subjects,
    section:      t => t.section,
    thisMonthPct: t => t.thisMonthPct,
    daysPresent:  t => t.daysPresent,
    daysAbsent:   t => t.daysAbsent,
    leaveBalance: t => t.leaveBalance,
    status:       t => t.status,
  }, { field: "name" })

  const classSort = useTableSort<
    (typeof CLASS_ATTENDANCE)[number],
    "cls" | "total" | "present" | "absent" | "pct"
  >(CLASS_ATTENDANCE, {
    cls:     r => r.cls,
    total:   r => r.total,
    present: r => r.present,
    absent:  r => r.absent,
    pct:     r => r.pct,
  }, { field: "cls" })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8 fade-in">
      <PageHeader
        icon={<ClipboardList size={20} />}
        title="Attendance Summary"
        subtitle="Teacher and student attendance overview — June 2026"
        actions={
          <ToggleTabs
            options={["Daily", "Weekly", "Monthly"] as const}
            value={viewMode}
            onChange={setViewMode}
          />
        }
      />

      <Tabs defaultValue="teachers">
        <TabsList className="mb-4">
          <TabsTrigger value="teachers" className="flex items-center gap-2">
            <Users size={14} /> Teachers
          </TabsTrigger>
          <TabsTrigger value="students" className="flex items-center gap-2">
            <ClipboardList size={14} /> Students
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <ClipboardList size={14} /> Edit Requests
            {pendingCount > 0 && (
              <Badge variant="warning" className="h-5 px-1.5 text-[10px]">{pendingCount}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Teachers Tab */}
        <TabsContent value="teachers">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Teacher Attendance — June 2026</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <caption className="sr-only">Teacher attendance summary for this month</caption>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-transparent">
                      <SortableHead field="name" label="Teacher" sortField={teacherSort.sortField} sortDir={teacherSort.sortDir} onSort={teacherSort.toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                      <SortableHead field="subjects" label="Subject" sortField={teacherSort.sortField} sortDir={teacherSort.sortDir} onSort={teacherSort.toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                      <SortableHead field="section" label="Section" sortField={teacherSort.sortField} sortDir={teacherSort.sortDir} onSort={teacherSort.toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                      <SortableHead field="thisMonthPct" label="This Month %" align="right" sortField={teacherSort.sortField} sortDir={teacherSort.sortDir} onSort={teacherSort.toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                      <SortableHead field="daysPresent" label="Present" align="right" sortField={teacherSort.sortField} sortDir={teacherSort.sortDir} onSort={teacherSort.toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                      <SortableHead field="daysAbsent" label="Absent" align="right" sortField={teacherSort.sortField} sortDir={teacherSort.sortDir} onSort={teacherSort.toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                      <SortableHead field="leaveBalance" label="Leave Balance" align="right" sortField={teacherSort.sortField} sortDir={teacherSort.sortDir} onSort={teacherSort.toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                      <SortableHead field="status" label="Status" sortField={teacherSort.sortField} sortDir={teacherSort.sortDir} onSort={teacherSort.toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherSort.sorted.map((t, i) => (
                      <TableRow key={t.id} className={`${i % 2 ? "bg-muted/10" : ""}`}>
                        <TableCell className="px-4 py-3 font-semibold">{t.name}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground text-xs">{t.subjects}</TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground text-xs">{t.section}</TableCell>
                        <TableCell className={`px-4 py-3 text-right font-bold ${pctColor(t.thisMonthPct)}`}>
                          {t.thisMonthPct}%
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right text-[var(--ef-green-dark)] font-medium">{t.daysPresent}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-destructive font-medium">{t.daysAbsent}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-muted-foreground">{t.leaveBalance} days</TableCell>
                        <TableCell className="px-4 py-3">
                          <Badge variant={statusVariant(t.status)} className="text-xs capitalize">
                            {t.status.replace("_", " ")}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Students Tab */}
        <TabsContent value="students">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Class-wise Student Attendance — Today (June 15, 2026)</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="text-sm">
                  <caption className="sr-only">Class-wise student attendance today</caption>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-transparent">
                      <SortableHead field="cls" label="Class" sortField={classSort.sortField} sortDir={classSort.sortDir} onSort={classSort.toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                      <SortableHead field="total" label="Total Students" align="right" sortField={classSort.sortField} sortDir={classSort.sortDir} onSort={classSort.toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                      <SortableHead field="present" label="Present Today" align="right" sortField={classSort.sortField} sortDir={classSort.sortDir} onSort={classSort.toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                      <SortableHead field="absent" label="Absent Today" align="right" sortField={classSort.sortField} sortDir={classSort.sortDir} onSort={classSort.toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                      <SortableHead field="pct" label="Attendance %" align="right" sortField={classSort.sortField} sortDir={classSort.sortDir} onSort={classSort.toggleSort} className="px-4 py-2.5 text-xs font-semibold text-muted-foreground" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classSort.sorted.map((row, i) => (
                      <TableRow key={row.cls} className={`${i % 2 ? "bg-muted/10" : ""}`}>
                        <TableCell className="px-4 py-3 font-semibold">{row.cls}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-muted-foreground">{row.total}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-[var(--ef-green-dark)] font-medium">{row.present}</TableCell>
                        <TableCell className="px-4 py-3 text-right text-destructive font-medium">{row.absent}</TableCell>
                        <TableCell className={`px-4 py-3 text-right font-bold ${pctColor(row.pct)}`}>
                          {row.pct.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Summary row */}
                    <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
                      <TableCell className="px-4 py-3">All Classes</TableCell>
                      <TableCell className="px-4 py-3 text-right">{CLASS_ATTENDANCE.reduce((s, r) => s + r.total, 0)}</TableCell>
                      <TableCell className="px-4 py-3 text-right text-[var(--ef-green-dark)]">{CLASS_ATTENDANCE.reduce((s, r) => s + r.present, 0)}</TableCell>
                      <TableCell className="px-4 py-3 text-right text-destructive">{CLASS_ATTENDANCE.reduce((s, r) => s + r.absent, 0)}</TableCell>
                      <TableCell className={`px-4 py-3 text-right ${pctColor(
                        (CLASS_ATTENDANCE.reduce((s, r) => s + r.present, 0) / CLASS_ATTENDANCE.reduce((s, r) => s + r.total, 0)) * 100
                      )}`}>
                        {((CLASS_ATTENDANCE.reduce((s, r) => s + r.present, 0) / CLASS_ATTENDANCE.reduce((s, r) => s + r.total, 0)) * 100).toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Requests Tab */}
        <TabsContent value="requests">
          <AttendanceEditInbox reviewer="Mrinal Ojha" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
