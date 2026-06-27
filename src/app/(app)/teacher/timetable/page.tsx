"use client"

import { useMemo } from "react"
import { Calendar, BookOpen, Shuffle, GraduationCap } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  DAYS,
  DAY_LABELS,
  PERIOD_CONFIG,
  getTeacherSchedule,
  buildSubjectSummary,
  type TeacherSlot,
} from "@/data/timetable"
import { MOCK_PROXIES } from "@/data/proxy-assignments"

// ─── Logged-in teacher (Priya Sharma = t1) ────────────────────────────────────
const ME = { id: "t1", name: "Priya Sharma", subjects: ["Mathematics", "Science"] }

// ─── This week's proxy assignments for Priya (accepted/assigned) ───────────────
// Map proxy-assignments.ts → the day they fall on for the weekly grid.
// In production this day would come from the absence date; for the demo we
// spread them across Mon/Thu so they appear in different columns.
const PRIYA_PROXY_WEEK: {
  periodId: string; class: string; subject: string;
  absentTeacherName: string; day: typeof DAYS[number]
}[] = MOCK_PROXIES
  .filter(p => p.proxyTeacherId === ME.id && p.status !== "declined")
  .map((p, i) => ({
    periodId:          p.periodId,
    class:             p.class,
    subject:           p.subject,
    absentTeacherName: p.absentTeacherName,
    // Spread across days: first proxy Mon, second Thu (realistic spread)
    day:               (["Mon", "Thu"] as const)[i % 2],
  }))

// ─── Cell types ───────────────────────────────────────────────────────────────
type GridSlot = TeacherSlot | null

function buildGrid(): Record<string, Record<typeof DAYS[number], GridSlot>> {
  const regular = getTeacherSchedule(ME.id)
  // Build a map keyed [periodId][day] for O(1) lookup
  const grid: Record<string, Record<typeof DAYS[number], GridSlot>> = {}
  for (const p of PERIOD_CONFIG) {
    grid[p.id] = { Mon: null, Tue: null, Wed: null, Thu: null, Fri: null, Sat: null }
  }
  for (const slot of regular) {
    if (grid[slot.periodId]) grid[slot.periodId][slot.day] = slot
  }
  // Overlay proxy slots — mark with type:"proxy"
  for (const px of PRIYA_PROXY_WEEK) {
    if (grid[px.periodId]) {
      // Don't overwrite an existing regular class — place in same cell if empty
      if (!grid[px.periodId][px.day]) {
        grid[px.periodId][px.day] = {
          day:      px.day,
          periodId: px.periodId,
          class:    px.class,
          subject:  px.subject,
          type:     "proxy",
          covering: px.absentTeacherName,
        }
      }
    }
  }
  return grid
}

// ─── Visual helpers ───────────────────────────────────────────────────────────
const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  Science:     "bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800",
  English:     "bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  "Social Studies": "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  Hindi:       "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800",
  Sanskrit:    "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  SSt:         "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800",
  "Phys. Ed":  "bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-200 dark:border-teal-800",
}
function subjectColor(subject: string) {
  return SUBJECT_COLORS[subject] ?? "bg-muted/60 text-muted-foreground border-border"
}

export default function TeacherTimetablePage() {
  const grid = useMemo(buildGrid, [])

  // All flat slots for summary
  const allSlots = useMemo(() => {
    const flat: TeacherSlot[] = []
    for (const p of PERIOD_CONFIG) {
      if (p.isBreak) continue
      for (const day of DAYS) {
        const slot = grid[p.id]?.[day]
        if (slot) flat.push(slot)
      }
    }
    return flat
  }, [grid])

  const summary = useMemo(() => buildSubjectSummary(allSlots, ME.subjects), [allSlots])

  const regularCount = allSlots.filter(s => s.type === "regular").length
  const proxyCount   = allSlots.filter(s => s.type === "proxy").length

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Calendar size={22} />}
        title="My Timetable"
        subtitle={`${ME.name} — live schedule synced with school timetable`}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{regularCount} regular</Badge>
            {proxyCount > 0 && (
              <Badge variant="warning">{proxyCount} proxy</Badge>
            )}
          </div>
        }
      />

      {/* ═══ Weekly Grid ═══ */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3 flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">Weekly Grid</CardTitle>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-primary/20 border border-primary/40 inline-block" />
              Regular class
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-warning/20 border border-warning/40 inline-block" />
              Proxy duty
            </span>
          </div>
        </CardHeader>
        <Separator />

        {/* Scrollable grid */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted/40">
                <th className="sticky left-0 z-10 bg-muted/40 w-24 min-w-[6rem] px-3 py-2.5 text-left font-semibold text-muted-foreground border-b border-r border-border">
                  Period
                </th>
                {DAYS.map(day => (
                  <th
                    key={day}
                    className="px-2 py-2.5 text-center font-semibold text-muted-foreground border-b border-r border-border last:border-r-0 min-w-[130px]"
                  >
                    {DAY_LABELS[day]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIOD_CONFIG.map((period, idx) => {
                if (period.isBreak) {
                  return (
                    <tr key={period.id} className="bg-muted/20">
                      <td
                        colSpan={DAYS.length + 1}
                        className="px-3 py-1.5 text-center text-[10px] font-semibold text-muted-foreground tracking-widest uppercase border-b border-border"
                      >
                        {period.label ?? "Break"} · {period.time}
                      </td>
                    </tr>
                  )
                }
                return (
                  <tr
                    key={period.id}
                    className={cn(
                      "border-b border-border transition-colors hover:bg-muted/20",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/10"
                    )}
                  >
                    {/* Period label */}
                    <td className="sticky left-0 z-10 bg-inherit border-r border-border px-3 py-2">
                      <p className="font-bold text-foreground">{period.id}</p>
                      <p className="text-[10px] text-muted-foreground">{period.time}</p>
                    </td>

                    {/* Day cells */}
                    {DAYS.map(day => {
                      const slot = grid[period.id]?.[day]
                      if (!slot) {
                        return (
                          <td
                            key={day}
                            className="border-r border-border last:border-r-0 px-2 py-2 align-top"
                          >
                            <span className="block h-full min-h-[48px] rounded-lg border border-dashed border-border/50 bg-muted/20" />
                          </td>
                        )
                      }
                      const isProxy = slot.type === "proxy"
                      return (
                        <td
                          key={day}
                          className="border-r border-border last:border-r-0 px-2 py-2 align-top"
                        >
                          <div
                            className={cn(
                              "rounded-lg border px-2 py-1.5 min-h-[52px] flex flex-col gap-0.5 transition-shadow hover:shadow-sm",
                              isProxy
                                ? "bg-warning/10 border-warning/30"
                                : subjectColor(slot.subject)
                            )}
                          >
                            <p className={cn(
                              "font-semibold leading-tight text-[11px]",
                              isProxy ? "text-warning-foreground" : ""
                            )}>
                              {slot.subject}
                            </p>
                            <p className="text-[10px] font-medium opacity-80">{slot.class}</p>
                            {isProxy && (
                              <p className="text-[9px] opacity-70 leading-tight">
                                Proxy · {slot.covering}
                              </p>
                            )}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ═══ Subject Summary ═══ */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Subject Summary — This Week</h2>
          <Badge variant="secondary" className="text-[10px]">{summary.length} subjects</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {summary.map(s => (
            <Card
              key={s.subject}
              className={cn(
                "overflow-hidden border transition-shadow hover:shadow-card",
                s.isPrimary ? "border-primary/20" : "border-border"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn(
                      "size-8 rounded-lg flex items-center justify-center text-base flex-shrink-0",
                      subjectColor(s.subject)
                    )}>
                      {s.isPrimary ? (
                        <GraduationCap className="size-4" />
                      ) : (
                        <Shuffle className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold leading-tight truncate">{s.subject}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {s.isPrimary ? "Primary subject" : "Secondary / Proxy"}
                      </p>
                    </div>
                  </div>
                  {s.isPrimary ? (
                    <Badge variant="default" className="text-[9px] px-1.5 flex-shrink-0">Primary</Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[9px] px-1.5 flex-shrink-0">Other</Badge>
                  )}
                </div>

                <Separator className="mb-3" />

                {/* Counts */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="rounded-lg bg-muted/50 px-2.5 py-2 text-center">
                    <p className="text-lg font-black text-foreground leading-none">{s.regularCount}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Regular</p>
                  </div>
                  <div className={cn(
                    "rounded-lg px-2.5 py-2 text-center",
                    s.proxyCount > 0 ? "bg-warning/10" : "bg-muted/50"
                  )}>
                    <p className={cn(
                      "text-lg font-black leading-none",
                      s.proxyCount > 0 ? "text-warning-foreground" : "text-muted-foreground"
                    )}>
                      {s.proxyCount}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">Proxy</p>
                  </div>
                </div>

                {/* Classes */}
                <div className="flex flex-wrap gap-1">
                  {s.classes.sort().map(cls => (
                    <Badge key={cls} variant="outline" className="text-[9px] px-1.5 py-0.5">
                      {cls}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
