"use client"

import { useState, useMemo } from "react"
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  TrendingUp,
  Users,
  AlertTriangle,
  BarChart3,
  Filter,
  UserCheck,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { TEACHERS } from "@/data/teachers"
import { SCHOOL_SESSION } from "@/data/school-session"

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionYear = "2026-27" | "2025-26" | "2024-25"
type ViewMode = "week" | "month"
type SectionFilter = "all" | "Primary" | "Middle" | "High"

// ─── Session config ───────────────────────────────────────────────────────────

const SESSIONS: { value: SessionYear; label: string; startYear: number }[] = [
  { value: "2026-27", label: "2026–27 (Current)", startYear: 2026 },
  { value: "2025-26", label: "2025–26", startYear: 2025 },
  { value: "2024-25", label: "2024–25", startYear: 2024 },
]

// School week: Mon–Sat (6 days, matches HCEA config)
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const DAY_OFFSETS = [1, 2, 3, 4, 5, 6] // getDay() offsets from Monday (Mon=1 … Sat=6)

// ─── Mock data generator ──────────────────────────────────────────────────────

/** Seeded pseudo-random so the same week always returns the same values */
function seededRand(seed: number): number {
  const x = Math.sin(seed + 1) * 10000
  return x - Math.floor(x)
}

function generateWeekData(
  teacherId: string,
  weekOffset: number,
  session: SessionYear
): number[] {
  const sessionSeed = parseInt(session.replace("-", ""), 10)
  return DAYS.map((_, dayIdx) => {
    const raw = seededRand(
      sessionSeed + weekOffset * 100 + dayIdx * 10 + teacherId.charCodeAt(1)
    )
    if (raw < 0.35) return 0
    if (raw < 0.6) return 1
    if (raw < 0.82) return 2
    return 3
  })
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Return the Monday of the week that contains `date`. */
function getMondayOf(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay() // 0=Sun,1=Mon…6=Sat
  const diff = day === 0 ? -6 : 1 - day // shift to Monday
  d.setDate(d.getDate() + diff)
  d.setHours(0, 0, 0, 0)
  return d
}

/** Return the Monday of the week inside a given session (by index from session start). */
function getSessionWeekMonday(session: SessionYear, weekOffset: number): Date {
  const startYear = SESSIONS.find(s => s.value === session)!.startYear
  // Session starts April 1 — find its Monday
  const sessionStart = new Date(startYear, 3, 1) // April 1
  const monday = getMondayOf(sessionStart)
  const result = new Date(monday)
  result.setDate(result.getDate() + weekOffset * 7)
  return result
}

function formatDateRange(monday: Date): string {
  const saturday = new Date(monday)
  saturday.setDate(saturday.getDate() + 5)
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
  return `${monday.toLocaleDateString("en-IN", opts)} – ${saturday.toLocaleDateString("en-IN", opts)}, ${monday.getFullYear()}`
}

function formatDayLabel(monday: Date, dayOffset: number): string {
  const d = new Date(monday)
  d.setDate(d.getDate() + dayOffset - 1) // offset: 1=Mon … 6=Sat
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

/** Get total weeks in a session (approx 52, Apr→Mar) */
function totalSessionWeeks(_session: SessionYear): number {
  return 52
}

/** Week number within session (1-based) for current date */
function currentSessionWeek(session: SessionYear): number {
  const monday = getSessionWeekMonday(session, 0)
  const today = getMondayOf(new Date())
  const diff = Math.round((today.getTime() - monday.getTime()) / (7 * 24 * 3600 * 1000))
  return Math.max(0, Math.min(diff, totalSessionWeeks(session) - 1))
}

// ─── Heat color ───────────────────────────────────────────────────────────────

function heatColor(val: number, cap: number) {
  if (val === 0) return "bg-muted/40 text-muted-foreground/50"
  const ratio = val / cap
  if (ratio <= 0.4) return "bg-primary/20 text-primary"
  if (ratio <= 0.7) return "bg-warning/30 text-warning-foreground"
  if (ratio < 1) return "bg-orange-400/70 text-white"
  return "bg-destructive text-destructive-foreground"
}

function totalBadgeColor(total: number, weekCap: number) {
  const ratio = total / weekCap
  if (ratio === 0) return "bg-muted text-muted-foreground"
  if (ratio <= 0.4) return "bg-primary/15 text-primary border-primary/30"
  if (ratio <= 0.7) return "bg-warning/20 text-warning-foreground border-warning/30"
  return "bg-destructive/15 text-destructive border-destructive/30"
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkloadPage() {
  const [session, setSession] = useState<SessionYear>("2026-27")
  const [weekOffset, setWeekOffset] = useState<number>(() =>
    currentSessionWeek("2026-27")
  )
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>("all")
  const [viewMode, setViewMode] = useState<ViewMode>("week")

  const totalWeeks = totalSessionWeeks(session)
  const weekMonday = getSessionWeekMonday(session, weekOffset)

  const filteredTeachers = useMemo(
    () =>
      TEACHERS.filter(
        t =>
          t.status !== "inactive" &&
          (sectionFilter === "all" || t.section === sectionFilter)
      ),
    [sectionFilter]
  )

  // Build workload matrix
  const workloadMatrix = useMemo(
    () =>
      filteredTeachers.map(t => ({
        teacher: t,
        loads: generateWeekData(t.id, weekOffset, session),
      })),
    [filteredTeachers, weekOffset, session]
  )

  // Summary stats
  const stats = useMemo(() => {
    const allTotals = workloadMatrix.map(row =>
      row.loads.reduce((a, b) => a + b, 0)
    )
    const totalProxies = allTotals.reduce((a, b) => a + b, 0)
    const avgLoad = allTotals.length
      ? (totalProxies / allTotals.length).toFixed(1)
      : "0"
    const overloaded = workloadMatrix.filter(
      row =>
        row.loads.reduce((a, b) => a + b, 0) >= row.teacher.weeklyProxyCap
    ).length
    const maxTeacher = workloadMatrix.reduce(
      (best, row) => {
        const t = row.loads.reduce((a, b) => a + b, 0)
        return t > best.total ? { name: row.teacher.name, total: t } : best
      },
      { name: "—", total: 0 }
    )
    const zeroDayCount = workloadMatrix.reduce(
      (acc, row) => acc + row.loads.filter(v => v === 0).length,
      0
    )
    return { totalProxies, avgLoad, overloaded, maxTeacher, zeroDayCount }
  }, [workloadMatrix])

  // Week navigation
  function goToPrevWeek() {
    setWeekOffset(w => Math.max(0, w - 1))
  }
  function goToNextWeek() {
    setWeekOffset(w => Math.min(totalWeeks - 1, w + 1))
  }
  function goToCurrentWeek() {
    setWeekOffset(currentSessionWeek(session))
  }

  function handleSessionChange(val: string) {
    setSession(val as SessionYear)
    setWeekOffset(currentSessionWeek(val as SessionYear))
  }

  const isCurrentWeek = weekOffset === currentSessionWeek(session)
  const weekLabel = formatDateRange(weekMonday)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Activity size={22} />}
        title="Workload Heatmap"
        subtitle="Teacher proxy duty distribution — navigate by week or session"
      />

      {/* ── Controls bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Session picker */}
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Session</span>
          <Select value={session} onValueChange={handleSessionChange}>
            <SelectTrigger className="h-8 w-[190px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SESSIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Section filter */}
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-muted-foreground" />
          <Select
            value={sectionFilter}
            onValueChange={v => setSectionFilter(v as SectionFilter)}
          >
            <SelectTrigger className="h-8 w-[140px] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sections</SelectItem>
              <SelectItem value="Primary">Primary</SelectItem>
              <SelectItem value="Middle">Middle</SelectItem>
              <SelectItem value="High">High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <KpiCard
          title="Total Proxies"
          value={stats.totalProxies}
          subtitle="this week"
          icon={<Activity className="size-5" />}
          tone="brand"
        />
        <KpiCard
          title="Avg Load / Teacher"
          value={stats.avgLoad}
          subtitle="proxies / week"
          icon={<Users className="size-5" />}
          tone="cyan"
        />
        <KpiCard
          title="Overloaded"
          value={stats.overloaded}
          subtitle="at / near weekly cap"
          icon={<AlertTriangle className="size-5" />}
          tone="red"
        />
        <KpiCard
          title="Heaviest Load"
          value={stats.maxTeacher.name}
          subtitle={`${stats.maxTeacher.total} proxies this week`}
          icon={<UserCheck className="size-5" />}
          tone="amber"
        />
      </div>

      {/* ── Heatmap card ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 size={16} className="text-primary" />
                Weekly Proxy Heatmap
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">{weekLabel}</p>
            </div>

            {/* Week navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={goToPrevWeek}
                disabled={weekOffset === 0}
                aria-label="Previous week"
              >
                <ChevronLeft size={15} />
              </Button>

              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border bg-muted/30 min-w-[110px] justify-center">
                <span className="text-xs font-medium text-foreground">
                  Week {weekOffset + 1}
                </span>
                <span className="text-xs text-muted-foreground">/ {totalWeeks}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2"
                onClick={goToNextWeek}
                disabled={weekOffset >= totalWeeks - 1}
                aria-label="Next week"
              >
                <ChevronRight size={15} />
              </Button>

              {!isCurrentWeek && (
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={goToCurrentWeek}
                >
                  Today
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-4 overflow-x-auto">
          <Table className="text-xs">
            <caption className="sr-only">Teacher workload heatmap — {weekLabel}</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-left font-medium pb-3 pr-4 min-w-[150px] h-auto">
                  Teacher
                </TableHead>
                {DAYS.map((d, i) => (
                  <TableHead
                    key={d}
                    className="text-center font-medium pb-3 px-2 min-w-[58px] h-auto"
                  >
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{d}</span>
                      <span className="text-[9px] text-muted-foreground font-normal">
                        {formatDayLabel(weekMonday, i + 1)}
                      </span>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center font-medium pb-3 px-3 min-w-[60px] h-auto">
                  Total
                </TableHead>
                <TableHead className="text-center font-medium pb-3 pl-2 min-w-[80px] h-auto">
                  Cap Usage
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workloadMatrix.map(({ teacher: t, loads }) => {
                const total = loads.reduce((a, b) => a + b, 0)
                const utilizationPct = Math.round((total / t.weeklyProxyCap) * 100)
                return (
                  <TableRow key={t.id} className="group">
                    <TableCell className="py-2.5 pr-4">
                      <div className="flex flex-col gap-0.5">
                        <p className="font-medium text-foreground leading-tight">{t.name}</p>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">{t.subjects[0]}</span>
                          <span className={`text-[10px] px-1.5 py-0 rounded-full border font-medium ${
                            t.section === "High"
                              ? "bg-purple/10 text-purple border-purple/20"
                              : t.section === "Middle"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-green/10 text-green-600 border-green/20"
                          }`}>
                            {t.section}
                          </span>
                          {t.status === "on_leave" && (
                            <span className="text-[10px] px-1.5 py-0 rounded-full bg-amber-100 text-amber-700 border border-amber-200 font-medium">
                              On Leave
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {loads.map((val, i) => (
                      <TableCell key={i} className="py-2.5 px-2 text-center">
                        <span
                          className={`inline-flex items-center justify-center size-7 rounded-md font-semibold text-xs transition-all ${heatColor(val, t.dailyProxyCap)}`}
                          title={`${val} ${val === 1 ? "proxy" : "proxies"} on ${DAYS[i]}`}
                        >
                          {val > 0 ? val : "—"}
                        </span>
                      </TableCell>
                    ))}

                    {/* Weekly total */}
                    <TableCell className="py-2.5 px-3 text-center">
                      <Badge
                        variant="outline"
                        className={`text-xs font-bold px-2 py-0.5 ${totalBadgeColor(total, t.weeklyProxyCap)}`}
                      >
                        {total}
                      </Badge>
                    </TableCell>

                    {/* Cap usage: total / cap + % bar */}
                    <TableCell className="py-2.5 pl-2 text-center">
                      <div className="flex flex-col items-center gap-1 min-w-[68px]">
                        {/* e.g. "8 / 6" — bold total, muted cap */}
                        <span
                          className={`text-xs font-bold leading-tight ${
                            total > t.weeklyProxyCap
                              ? "text-destructive"
                              : utilizationPct >= 70
                              ? "text-orange-500"
                              : "text-foreground"
                          }`}
                        >
                          {total}
                          <span className="font-normal text-muted-foreground">
                            {" / "}{t.weeklyProxyCap}
                          </span>
                        </span>
                        {/* progress bar */}
                        <div className="w-12 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              utilizationPct >= 100
                                ? "bg-destructive"
                                : utilizationPct >= 70
                                ? "bg-orange-400"
                                : utilizationPct >= 40
                                ? "bg-warning"
                                : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(utilizationPct, 100)}%` }}
                            role="progressbar"
                            aria-valuenow={utilizationPct}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${t.name} weekly cap utilisation ${utilizationPct}%`}
                          />
                        </div>
                        {/* percentage */}
                        <span
                          className={`text-[10px] font-medium ${
                            utilizationPct >= 100
                              ? "text-destructive"
                              : utilizationPct >= 70
                              ? "text-orange-500"
                              : "text-muted-foreground"
                          }`}
                        >
                          {utilizationPct}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Load distribution summary ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Fairness overview */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users size={14} className="text-primary" />
              Load Fairness
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4 flex flex-col gap-3">
            {workloadMatrix
              .slice()
              .sort(
                (a, b) =>
                  b.loads.reduce((x, y) => x + y, 0) -
                  a.loads.reduce((x, y) => x + y, 0)
              )
              .map(({ teacher: t, loads }) => {
                const total = loads.reduce((a, b) => a + b, 0)
                const pct = Math.min(
                  Math.round((total / t.weeklyProxyCap) * 100),
                  100
                )
                return (
                  <div key={t.id} className="flex items-center gap-3">
                    <span className="text-xs text-foreground font-medium w-28 truncate flex-shrink-0">
                      {t.name}
                    </span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          pct >= 100
                            ? "bg-destructive"
                            : pct >= 70
                            ? "bg-orange-400"
                            : pct >= 40
                            ? "bg-warning"
                            : "bg-primary"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-8 text-right flex-shrink-0">
                      {total}
                    </span>
                  </div>
                )
              })}
          </CardContent>
        </Card>

        {/* Daily distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <BarChart3 size={14} className="text-primary" />
              Daily Distribution
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4 flex flex-col gap-3">
            {DAYS.map((day, i) => {
              const dayTotal = workloadMatrix.reduce(
                (sum, row) => sum + row.loads[i],
                0
              )
              const maxPossible = workloadMatrix.length * 3
              const pct = maxPossible
                ? Math.round((dayTotal / maxPossible) * 100)
                : 0
              return (
                <div key={day} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-foreground w-8 flex-shrink-0">
                    {day}
                  </span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 70
                          ? "bg-destructive"
                          : pct >= 40
                          ? "bg-warning"
                          : "bg-primary"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right flex-shrink-0">
                    {dayTotal} proxies
                  </span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>

      {/* ── Legend ── */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Heat key (vs. daily cap):</span>
        {[
          { cls: "bg-muted/40", label: "No proxy" },
          { cls: "bg-primary/20", label: "Low (≤40%)" },
          { cls: "bg-warning/30", label: "Moderate (≤70%)" },
          { cls: "bg-orange-400/70", label: "High (<100%)" },
          { cls: "bg-destructive", label: "At cap" },
        ].map(item => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`size-4 rounded ${item.cls} inline-block border border-border/30`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
