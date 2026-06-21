"use client"

/**
 * admin/proxy-board/page.tsx — DATA SHELL
 *
 * This page owns all state and mutation logic. Rendering is fully
 * delegated to domain components:
 *   - ProxyBoard    — absence rows + teacher × period grid
 *   - CoverageDonut — ring-chart for coverage percentage
 *   - AssignModal   — manual-assignment confirmation dialog
 *
 * Requirements: 5.1, 5.2, 5.3, 12.10
 */

import { useMemo, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import {
  Grid3x3, Zap, CheckCircle, Clock, PercentSquare, AlertTriangle,
  UserX, Printer, RefreshCw, FlaskConical,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { ResponsiveActions } from "@/components/shared/responsive-actions"
import { AvailabilityDot } from "@/components/shared/status-badge"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ProxyBoard } from "@/components/domain/proxy/ProxyBoard"
import { CoverageDonut } from "@/components/domain/proxy/CoverageDonut"
import { AssignModal } from "@/components/domain/proxy/AssignModal"
import { TEACHERS, type Teacher } from "@/data/teachers"
import { MOCK_ABSENCES, type Absence } from "@/data/mock-absences"
import { MOCK_PROXIES, type ProxyAssignment } from "@/data/proxy-assignments"
import { coveragePercent, scoreTeacher } from "@/lib/proxy-algorithm"
import { useExamMode } from "@/context/exam-mode-context"

// ── Pending-assignment state (for AssignModal) ───────────────────────────────
interface PendingAssign {
  teacher: Teacher
  absence: Absence
  periodId: string
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ProxyBoardPage() {
  const [absences, setAbsences] = useState<Absence[]>(MOCK_ABSENCES)
  const [proxies, setProxies] = useState<ProxyAssignment[]>(MOCK_PROXIES)
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const [pending, setPending] = useState<PendingAssign | null>(null)

  const { examMode } = useExamMode()

  void lastRefresh // suppress unused-var lint; kept for future polling

  const approvedAbsences = useMemo(
    () => absences.filter(a => a.status === "approved"),
    [absences]
  )

  // ── Coverage stats ───────────────────────────────────────────────────────
  const totalGaps = approvedAbsences.reduce((s, a) => s + a.periods.length, 0)
  const assigned  = proxies.filter(p => p.status === "accepted" || p.status === "assigned").length
  const declined  = proxies.filter(p => p.status === "declined").length

  // ── Handlers ─────────────────────────────────────────────────────────────

  /** Called by ProxyBoard when a cell is clicked — opens confirm dialog. */
  function handleAssignRequest(teacherId: string, absenceId: string, periodId: string) {
    if (examMode) {
      toast.warning("Exam Mode is active — proxy assignment is disabled.")
      return
    }
    const teacher = TEACHERS.find(t => t.id === teacherId)
    const absence = absences.find(a => a.id === absenceId)
    if (!teacher || !absence) return
    setPending({ teacher, absence, periodId })
  }

  /** Confirmed via AssignModal — writes proxy record. */
  function handleAssignConfirm() {
    if (!pending) return
    const { teacher, absence, periodId } = pending

    const load = proxies.filter(
      p => p.proxyTeacherId === teacher.id && p.status !== "declined"
    ).length
    if (load >= teacher.dailyProxyCap) {
      toast.error(`${teacher.name} is at their daily proxy cap.`)
      setPending(null)
      return
    }

    setProxies(prev => [
      ...prev,
      {
        id: `px${Date.now()}`,
        absenceId: absence.id,
        absentTeacherId: absence.teacherId,
        absentTeacherName: absence.teacherName,
        proxyTeacherId: teacher.id,
        proxyTeacherName: teacher.name,
        periodId,
        class: "TBD",
        subject: teacher.subjects[0] ?? "General",
        status: "assigned",
        date: new Date().toISOString().split("T")[0],
      },
    ])

    toast.success(`${teacher.name.split(" ")[0]} → ${periodId}`, {
      description: "Proxy assigned.",
    })
    setPending(null)
  }

  /** Greedy auto-assign for all or a single absence. */
  function handleAutoAssign(absenceId?: string) {
    if (examMode) {
      toast.warning("Exam Mode is active — proxy assignment is disabled.")
      return
    }
    const absentIds = new Set(
      approvedAbsences.map(a => a.teacherId)
    )
    const targets = absenceId
      ? approvedAbsences.filter(a => a.id === absenceId)
      : approvedAbsences

    const next = [...proxies]
    let added = 0

    for (const absence of targets) {
      const absentTeacher = TEACHERS.find(t => t.id === absence.teacherId)
      const subject = absentTeacher?.subjects[0] ?? ""

      for (const pid of absence.periods) {
        const alreadyCovered = next.some(
          p =>
            p.absenceId === absence.id &&
            p.periodId === pid &&
            (p.status === "accepted" || p.status === "assigned")
        )
        if (alreadyCovered) continue

        const candidates = TEACHERS.filter(t =>
          t.status === "active" &&
          t.id !== absence.teacherId &&
          !absentIds.has(t.id) &&
          !next.some(
            p =>
              p.proxyTeacherId === t.id &&
              p.periodId === pid &&
              p.status !== "declined"
          )
        )
          .map(t => {
            const load = next.filter(
              p => p.proxyTeacherId === t.id && p.status !== "declined"
            ).length
            const sameSubject = t.subjects.includes(subject) ? 0 : 1
            return { t, load, sameSubject, score: sameSubject * 100 + load }
          })
          .filter(c => c.load < c.t.dailyProxyCap)
          .sort((a, b) => a.score - b.score || a.load - b.load)

        const pick = candidates[0]
        if (!pick) continue

        next.push({
          id: `px${Date.now()}_${added}`,
          absenceId: absence.id,
          absentTeacherId: absence.teacherId,
          absentTeacherName: absence.teacherName,
          proxyTeacherId: pick.t.id,
          proxyTeacherName: pick.t.name,
          periodId: pid,
          class: "TBD",
          subject,
          status: "assigned",
          date: new Date().toISOString().split("T")[0],
        })
        added++
      }
    }

    setProxies(next)
    if (added === 0) {
      toast.info("Nothing to auto-assign", {
        description: "All open periods already have coverage.",
      })
    } else {
      toast.success(
        `Auto-assigned ${added} proxy ${added === 1 ? "duty" : "duties"}`,
        {
          description: absenceId
            ? "Best-fit teachers selected."
            : "All open periods processed.",
        }
      )
    }
  }

  function handleRefresh() {
    setLastRefresh(Date.now())
    toast.success("Proxy board refreshed", { description: "Coverage recalculated." })
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Grid3x3 size={22} />}
        title="Proxy Board"
        subtitle="Today's teacher coverage overview · Holy Child English Academy"
        actions={
          <ResponsiveActions
            actions={[
              { label: "Print Sheet", icon: <Printer className="size-4" />, onClick: () => window.print(), variant: "outline" },
              { label: "Refresh", icon: <RefreshCw className="size-4" />, onClick: handleRefresh, variant: "outline" },
              { label: "Auto-Assign All", icon: <Zap className="size-4" />, onClick: () => handleAutoAssign(), disabled: examMode },
            ]}
          />
        }
      />

      {/* ── Exam Mode banner ── */}
      {examMode && (
        <Alert variant="warning">
          <FlaskConical className="size-4" />
          <AlertTitle>Exam Mode Active — proxy assignment is disabled</AlertTitle>
          <AlertDescription>
            The school is currently in Exam Mode. Auto-assign and manual assignment
            are suspended. Go to{" "}
            <a href="/admin/settings" className="underline font-medium">
              Settings
            </a>{" "}
            to deactivate Exam Mode.
          </AlertDescription>
        </Alert>
      )}

      {/* ── KPI row ── */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="Open Gaps"
          value={totalGaps - assigned}
          icon={<AlertTriangle className="size-5" />}
          iconClassName="bg-destructive/10 text-destructive"
          sparkline={{ variant: "bar", data: [3, 2, 4, 3, 2, 3, totalGaps - assigned], color: "var(--ef-red)" }}
        />
        <KpiCard
          title="Assigned"
          value={assigned}
          icon={<CheckCircle className="size-5" />}
          iconClassName="bg-success/20 text-success-foreground"
          sparkline={{ variant: "bar", data: [2, 3, 2, 4, 3, 4, assigned], color: "var(--ef-green)" }}
        />
        <KpiCard
          title="Declined"
          value={declined}
          icon={<UserX className="size-5" />}
          iconClassName="bg-warning/20 text-warning-foreground"
          sparkline={{ variant: "bar", data: [0, 1, 0, 0, 1, 0, declined], color: "var(--ef-amber)" }}
        />
        <KpiCard
          title="Coverage"
          value={totalGaps > 0 ? `${coveragePercent(assigned, totalGaps)}%` : "100%"}
          icon={<PercentSquare className="size-5" />}
          trend={{ value: assigned / Math.max(totalGaps, 1) >= 0.75 ? 5 : -5 }}
          sparkline={{ variant: "line", data: [55, 60, 58, 65, 70, 57, totalGaps > 0 ? coveragePercent(assigned, totalGaps) : 100] }}
        />
      </div>

      {/* ── Coverage donut card ── */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center gap-4">
          <Clock className="size-5 text-primary flex-shrink-0" aria-hidden="true" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold mb-2">Today&apos;s Coverage</p>
            <CoverageDonut assigned={assigned} total={totalGaps} />
          </div>
        </CardContent>
      </Card>

      {/* ── Availability legend ── */}
      <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
        <span className="font-medium text-foreground">Availability:</span>
        <AvailabilityDot status="available-same" className="text-xs" />
        <AvailabilityDot status="available-diff" className="text-xs" />
        <AvailabilityDot status="capped"         className="text-xs" />
        <AvailabilityDot status="unavailable"    className="text-xs" />
      </div>

      {/* ── Uncovered periods Alert ── */}
      {(() => {
        const absentIds = new Set(approvedAbsences.map(a => a.teacherId))
        const activeCandidates = TEACHERS.filter(
          t => !absentIds.has(t.id) && t.status === "active"
        )
        const uncoveredSlots: { absenceName: string; periodId: string }[] = []

        for (const absence of approvedAbsences) {
          const absentTeacher = TEACHERS.find(t => t.id === absence.teacherId)
          if (!absentTeacher) continue
          for (const pid of absence.periods) {
            const alreadyCovered = proxies.some(
              p =>
                p.absenceId === absence.id &&
                p.periodId === pid &&
                (p.status === "accepted" || p.status === "assigned")
            )
            if (alreadyCovered) continue
            const allScoreZero = activeCandidates.every(
              t => scoreTeacher({ teacher: t, absentTeacher, currentAssignments: proxies, periodId: pid }) === 0
            )
            if (allScoreZero) {
              uncoveredSlots.push({ absenceName: absence.teacherName, periodId: pid })
            }
          }
        }

        if (uncoveredSlots.length === 0) return null

        return (
          <Alert variant="destructive">
            <AlertTriangle className="size-4" />
            <AlertTitle>Uncovered Periods</AlertTitle>
            <AlertDescription>
              No eligible teacher available for:{" "}
              {uncoveredSlots
                .map(s => `${s.absenceName} · ${s.periodId}`)
                .join(", ")}
            </AlertDescription>
          </Alert>
        )
      })()}

      {/* ── ProxyBoard — pure rendering component ── */}
      <ProxyBoard
        absences={absences}
        proxies={proxies}
        teachers={TEACHERS}
        onAssign={handleAssignRequest}
        onAutoAssign={handleAutoAssign}
        onRefresh={handleRefresh}
      />

      {/* ── Empty state ── */}
      {approvedAbsences.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle className="size-10 text-success-foreground mx-auto mb-3" />
            <p className="font-medium text-success-foreground">All clear!</p>
            <p className="text-sm text-muted-foreground mt-1">
              No approved absences today.
            </p>
            <Button variant="outline" size="sm" asChild className="mt-4">
              <Link href="/admin/absences">Go to Absence Tracker</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── AssignModal — manual assignment confirmation ── */}
      <AssignModal
        open={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={handleAssignConfirm}
        teacher={pending?.teacher ?? null}
        absence={pending?.absence ?? null}
        periodId={pending?.periodId ?? null}
        proxies={proxies}
      />
    </div>
  )
}
