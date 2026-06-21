"use client"

/**
 * ProxyBoard — domain component extracted from admin/proxy-board/page.tsx
 * Renders the per-absence board table: teacher rows with availability dots
 * and period cells. Accepts all data and callbacks via props; contains
 * no state of its own.
 *
 * Requirements: 5.1, 5.2, 5.3, 10.4, 15.2, 15.5
 */

import { useState } from "react"
import { toast } from "sonner"
import { Zap, Search, QrCode } from "lucide-react"
import { AvailabilityDot } from "@/components/shared/status-badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { QRCheckInCard } from "@/components/domain/proxy/QRCheckInCard"
import { type Absence } from "@/data/mock-absences"
import { type ProxyAssignment } from "@/data/proxy-assignments"
import { type Teacher } from "@/data/teachers"
import { TEACHING_PERIODS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import {
  scoreTeacher,
  dotStatusFromScore,
  type ScoringInput,
  type DotStatus as AlgoDotStatus,
} from "@/lib/proxy-algorithm"

// ── Types ────────────────────────────────────────────────────────────────────

export interface ProxyBoardProps {
  absences: Absence[]
  proxies: ProxyAssignment[]
  teachers: Teacher[]
  onAssign: (teacherId: string, absenceId: string, periodId: string) => void
  onAutoAssign: (absenceId?: string) => void
  onRefresh: () => void
}

type DotStatus = AlgoDotStatus | "absent" | "none"

const DOT_CONFIG: Record<DotStatus, { label: string }> = {
  "available-same": { label: "Same subject" },
  "available-diff": { label: "Diff subject" },
  "capped":         { label: "Capped" },
  "unavailable":    { label: "Unavailable" },
  "absent":         { label: "Absent" },
  "none":           { label: "" },
}

/** Numeric rank for sorting: lower = better */
const DOT_RANK: Record<AlgoDotStatus, number> = {
  "available-same": 0,
  "available-diff": 1,
  "capped":         2,
  "unavailable":    3,
}

// ── Component ────────────────────────────────────────────────────────────────

export function ProxyBoard({
  absences,
  proxies,
  teachers,
  onAssign,
  onAutoAssign,
}: ProxyBoardProps) {
  const [search, setSearch] = useState("")
  // QR dialog state — stores the assignment whose QR card is open
  const [qrAssignment, setQrAssignment] = useState<ProxyAssignment | null>(null)

  const approvedAbsences = absences.filter(a => a.status === "approved")

  const absentIds = new Set(approvedAbsences.map(a => a.teacherId))

  /**
   * Compute the dot status for a teacher against an absence period using the
   * proxy-algorithm module (scoreTeacher + dotStatusFromScore).
   */
  function getDotStatus(teacher: Teacher, absentTeacher: Teacher, periodId: string): DotStatus {
    if (absentIds.has(teacher.id)) return "absent"
    if (teacher.status !== "active") return "unavailable"

    const input: ScoringInput = {
      teacher,
      absentTeacher,
      currentAssignments: proxies,
      periodId,
    }
    const score = scoreTeacher(input)

    const dailyCount = proxies.filter(
      p => p.proxyTeacherId === teacher.id && p.status !== "declined"
    ).length
    const isCapped = dailyCount >= teacher.dailyProxyCap

    return dotStatusFromScore(score, isCapped)
  }

  /**
   * Returns the best (lowest-rank) DotStatus a teacher can achieve across
   * ALL absent periods for a given absence. Used for sorting teacher rows.
   */
  function bestStatusForAbsence(teacher: Teacher, absence: Absence): AlgoDotStatus {
    const absentTeacher = teachers.find(t => t.id === absence.teacherId)
    if (!absentTeacher) return "unavailable"

    let best: AlgoDotStatus = "unavailable"
    for (const pid of absence.periods) {
      const status = getDotStatus(teacher, absentTeacher, pid)
      if (status === "absent" || status === "none") continue
      if (DOT_RANK[status as AlgoDotStatus] < DOT_RANK[best]) {
        best = status as AlgoDotStatus
        if (best === "available-same") break // can't do better
      }
    }
    return best
  }

  function getFilteredAndSortedTeachers(absence: Absence): Teacher[] {
    return teachers
      .filter(t => !absentIds.has(t.id) && t.status === "active")
      .filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
      .slice()
      .sort((a, b) => DOT_RANK[bestStatusForAbsence(a, absence)] - DOT_RANK[bestStatusForAbsence(b, absence)])
  }

  function getPeriodProxy(teacherId: string, periodId: string) {
    return proxies.find(p => p.proxyTeacherId === teacherId && p.periodId === periodId)
  }

  function uncoveredFor(absence: Absence): string[] {
    return absence.periods.filter(pid =>
      !proxies.some(
        p =>
          p.absenceId === absence.id &&
          p.periodId === pid &&
          (p.status === "accepted" || p.status === "assigned")
      )
    )
  }

  return (
    <div className="space-y-5">
      {approvedAbsences.map(absence => {
        const absentTeacher = teachers.find(t => t.id === absence.teacherId)
        const absentSubject = absentTeacher?.subjects[0] ?? ""
        const coveredCount = absence.periods.filter(pid =>
          proxies.some(
            p =>
              p.absenceId === absence.id &&
              p.periodId === pid &&
              (p.status === "accepted" || p.status === "assigned")
          )
        ).length
        const absencePct =
          absence.periods.length > 0
            ? Math.round((coveredCount / absence.periods.length) * 100)
            : 0
        const openForThis = uncoveredFor(absence).length

        return (
          <Card key={absence.id} className="overflow-hidden">
            {/* ── Absence header ── */}
            <CardHeader className="pb-3 bg-muted/30">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-destructive/10 flex items-center justify-center text-destructive text-xs font-bold flex-shrink-0" aria-hidden="true">
                    {absence.teacherName
                      .split(" ")
                      .map(n => n[0])
                      .join("")}
                  </div>
                  <div>
                    <CardTitle className="text-sm font-semibold">
                      {absence.teacherName}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {absence.periods.length === 7
                        ? "Full day absent"
                        : `Absent: ${absence.periods.join(", ")}`}
                      {absentTeacher && ` · ${absentTeacher.subjects.join(", ")}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Covered progress */}
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Covered</div>
                    <div className="text-sm font-bold text-success-foreground">
                      {coveredCount}/{absence.periods.length}
                    </div>
                  </div>
                  <div className="w-16 flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          absencePct >= 80
                            ? "bg-success-foreground"
                            : absencePct >= 50
                            ? "bg-warning-foreground"
                            : "bg-destructive"
                        )}
                        style={{ width: `${absencePct}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-medium">{absencePct}%</span>
                  </div>
                  <Badge
                    variant={
                      absence.category === "sick_leave" ? "warning" : "secondary"
                    }
                    className="capitalize"
                  >
                    {absence.reason}
                  </Badge>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() => onAutoAssign(absence.id)}
                    disabled={openForThis === 0}
                  >
                    <Zap className="size-3" /> Auto-Assign
                  </Button>
                </div>
              </div>
            </CardHeader>

            <Separator />

            {/* ── Teacher × Period grid ── */}
            <CardContent className="p-0 overflow-x-auto">
              <Table className="text-xs min-w-[600px]">
                <caption className="sr-only">
                  Substitute teacher availability for {absence.teacherName}&apos;s absent periods
                </caption>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-transparent border-border">
                    <TableHead className="text-left font-medium py-2.5 px-4 min-w-[160px] h-auto">
                      Teacher
                    </TableHead>
                    <TableHead className="text-left font-medium py-2.5 px-2 min-w-[100px] h-auto">
                      Subjects
                    </TableHead>
                    {TEACHING_PERIODS.map(p => (
                      <TableHead
                        key={p.id}
                        className={cn(
                          "text-center font-medium py-2.5 px-2 min-w-[52px] h-auto",
                          absence.periods.includes(p.id) ? "text-foreground" : "opacity-40"
                        )}
                      >
                        {p.id}
                      </TableHead>
                    ))}
                    <TableHead className="text-right font-medium py-2.5 px-4 h-auto">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredAndSortedTeachers(absence).map(teacher => {
                    const proxyCount = proxies.filter(
                      p => p.proxyTeacherId === teacher.id && p.status !== "declined"
                    ).length
                    return (
                      <TableRow
                        key={teacher.id}
                        className="border-border/50 last:border-0 hover:bg-muted/20"
                      >
                        {/* Teacher name + load */}
                        <TableCell className="py-2.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0" aria-hidden="true">
                              {teacher.name
                                .split(" ")
                                .map(n => n[0])
                                .join("")}
                            </div>
                            <div>
                              <p className="font-medium text-foreground text-[12px]">
                                {teacher.name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {proxyCount}/{teacher.dailyProxyCap} today
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Subject tags */}
                        <TableCell className="py-2.5 px-2">
                          <div className="flex flex-wrap gap-0.5">
                            {teacher.subjects.slice(0, 2).map(s => (
                              <span
                                key={s}
                                className={cn(
                                  "text-[9px] px-1.5 py-0.5 rounded font-medium",
                                  teacher.subjects.includes(absentSubject)
                                    ? "bg-success/40 text-success-foreground"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </TableCell>

                        {/* Period cells */}
                        {TEACHING_PERIODS.map(p => {
                          const isAbsentPeriod = absence.periods.includes(p.id)
                          const proxy = getPeriodProxy(teacher.id, p.id)
                          const dotStatus: DotStatus = !isAbsentPeriod
                            ? "none"
                            : getDotStatus(teacher, absentTeacher!, p.id)
                          const cfg = DOT_CONFIG[dotStatus]

                          return (
                            <TableCell key={p.id} className="py-2.5 px-2 text-center">
                              {dotStatus === "none" ? (
                                <span className="text-muted-foreground/30 text-[10px]">—</span>
                              ) : proxy ? (
                                <button
                                  onClick={() =>
                                    toast(`${teacher.name.split(" ")[0]} → ${p.id}`, {
                                      description: `${proxy.subject} · ${proxy.status}`,
                                    })
                                  }
                                  className="flex flex-col items-center gap-0.5 cursor-pointer"
                                  title={`${teacher.name} assigned to ${p.id} · ${proxy.status}`}
                                >
                                  <AvailabilityDot
                                    status={
                                      proxy.status === "accepted"
                                        ? "available-same"
                                        : proxy.status === "declined"
                                        ? "unavailable"
                                        : "available-diff"
                                    }
                                    label={proxy.status}
                                    className="flex-col gap-0 [&>span:first-child]:size-2.5 [&>span:last-child]:text-[8px] [&>span:last-child]:text-muted-foreground [&>span:last-child]:capitalize"
                                  />
                                </button>
                              ) : dotStatus === "capped" ? (
                                <AvailabilityDot
                                  status="capped"
                                  label="Cap"
                                  className="flex-col gap-0 opacity-60 [&>span:first-child]:size-2.5 [&>span:last-child]:text-[8px] [&>span:last-child]:text-muted-foreground"
                                />
                              ) : (
                                <button
                                  onClick={() =>
                                    onAssign(teacher.id, absence.id, p.id)
                                  }
                                  className="flex flex-col items-center gap-0.5 group cursor-pointer"
                                  title={`Assign ${teacher.name} to ${p.id}`}
                                  aria-label={`Assign ${teacher.name} to period ${p.id} — ${cfg.label}`}
                                >
                                  <AvailabilityDot
                                    status={
                                      dotStatus as "available-same" | "available-diff"
                                    }
                                    label={dotStatus === "available-same" ? "Same" : "Alt"}
                                    className="flex-col gap-0 [&>span:first-child]:size-2.5 [&>span:first-child]:transition-transform [&>span:first-child]:group-hover:scale-125 [&>span:last-child]:text-[8px]"
                                  />
                                </button>
                              )}
                            </TableCell>
                          )
                        })}

                        {/* Quick-assign + QR button */}
                        <TableCell className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* QR button — shown for any assigned/accepted proxy */}
                            {(() => {
                              const assignedProxy = proxies.find(
                                p =>
                                  p.proxyTeacherId === teacher.id &&
                                  (p.status === "assigned" || p.status === "accepted")
                              )
                              return assignedProxy ? (
                                <Button
                                  size="xs"
                                  variant="outline"
                                  onClick={() => setQrAssignment(assignedProxy)}
                                  aria-label={`Open QR check-in card for ${teacher.name}`}
                                  title="Show QR Check-In Card"
                                >
                                  <QrCode className="size-3" aria-hidden="true" />
                                  QR
                                </Button>
                              ) : null
                            })()}
                            <Button
                              size="xs"
                              variant="outline"
                              disabled={
                                proxyCount >= teacher.dailyProxyCap ||
                                uncoveredFor(absence).length === 0
                              }
                              onClick={() => {
                                const pid = uncoveredFor(absence)[0]
                                if (pid) onAssign(teacher.id, absence.id, pid)
                              }}
                            >
                              Assign
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>

            {/* ── Footer: search + per-absence auto-assign ── */}
            <div className="p-3 border-t border-border bg-muted/20 flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Filter teachers..."
                  className="pl-8 h-7 text-xs"
                />
              </div>
              <Button
                size="sm"
                className="ml-auto"
                onClick={() => onAutoAssign(absence.id)}
                disabled={openForThis === 0}
              >
                <Zap className="size-3.5" /> Auto-Assign for{" "}
                {absence.teacherName.split(" ")[0]}
              </Button>
            </div>
          </Card>
        )
      })}

      {/* ── QR Check-In Dialog ── */}
      <Dialog open={qrAssignment !== null} onOpenChange={v => { if (!v) setQrAssignment(null) }}>
        <DialogContent className="sm:max-w-sm print:hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5 text-primary" aria-hidden="true" />
              QR Check-In Card
            </DialogTitle>
            <DialogDescription>
              Scan this QR code to record proxy attendance check-in.
            </DialogDescription>
          </DialogHeader>
          {qrAssignment && (
            <QRCheckInCard
              assignment={qrAssignment}
              checkInUrl={`/api/proxy/checkin?id=${qrAssignment.id}`}
              onPrint={() => window.print()}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
