"use client"

import { useMemo, useState } from "react"
import {
  CheckCircle, AlertCircle, User, BookOpen, Sparkles, X,
  Crown, Star, Check, Ban, Clock3,
} from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TEACHERS, type Teacher } from "@/data/teachers"
import { type Absence } from "@/data/mock-absences"
import { MOCK_PROXIES, type ProxyAssignment } from "@/data/proxy-assignments"
import { TEACHING_PERIODS } from "@/lib/constants"
import { rankProxyCandidates, type ProxyCandidate } from "@/lib/proxy-algorithm"
import { cn } from "@/lib/utils"

const absentIds = new Set(TEACHERS.filter(t => t.status === "on_leave").map(t => t.id))

type ProxyStatus = ProxyAssignment["status"]

const STATUS_META: Record<ProxyStatus, { label: string; icon: typeof Check; cls: string; pill: string }> = {
  accepted: { label: "Accepted", icon: Check,  cls: "text-success-foreground",  pill: "bg-success border-success-foreground/25 text-success-foreground" },
  assigned: { label: "Assigned", icon: Clock3, cls: "text-info-foreground",     pill: "bg-info border-info-foreground/30 text-info-foreground" },
  pending:  { label: "Pending",  icon: Clock3, cls: "text-warning-foreground",  pill: "bg-warning border-warning-foreground/25 text-warning-foreground" },
  declined: { label: "Declined", icon: Ban,    cls: "text-destructive",         pill: "bg-destructive/15 border-destructive/45 text-destructive" },
}

function initials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2)
}

type SubjectMatch = "same-subject" | "diff-subject"

/** Subject-match color for an assigned period chip — matches the Availability key. */
const SUBJECT_PILL: Record<SubjectMatch, string> = {
  "same-subject": "bg-ef-green-light border-ef-green text-ef-green-dark",
  "diff-subject": "bg-ef-amber-light border-ef-amber text-ef-amber-dark",
}

function matchKindFor(teacher: Teacher | undefined, absentTeacher: Teacher): SubjectMatch {
  if (teacher && teacher.subjects.some(s => absentTeacher.subjects.includes(s))) return "same-subject"
  return "diff-subject"
}

/** One absence card with click-to-assign period chips + candidate panel. */
function AbsenceCard({ absence }: { absence: Absence }) {
  const absentTeacher = TEACHERS.find(t => t.id === absence.teacherId)!
  const isFullDay = absence.periods.length === TEACHING_PERIODS.length

  // Local assignment state (seeded from mock data), keyed by periodId.
  const seeded = useMemo(() => {
    const map: Record<string, { teacherId: string; teacherName: string; status: ProxyStatus; match: SubjectMatch }> = {}
    MOCK_PROXIES.filter(p => p.absenceId === absence.id).forEach(p => {
      const t = TEACHERS.find(x => x.id === p.proxyTeacherId)
      map[p.periodId] = {
        teacherId: p.proxyTeacherId, teacherName: p.proxyTeacherName, status: p.status,
        match: matchKindFor(t, TEACHERS.find(x => x.id === absence.teacherId)!),
      }
    })
    return map
  }, [absence.id, absence.teacherId])

  const [assignments, setAssignments] = useState(seeded)
  const [activePeriod, setActivePeriod] = useState<string | null>(null)
  const [flash, setFlash] = useState<{ tone: "success" | "warning" | "info" | "muted"; text: string } | null>(null)

  const assignmentsList = useMemo<ProxyAssignment[]>(
    () => Object.entries(assignments).map(([periodId, a]) => ({
      id: `${absence.id}-${periodId}`, absenceId: absence.id,
      absentTeacherId: absence.teacherId, absentTeacherName: absence.teacherName,
      proxyTeacherId: a.teacherId, proxyTeacherName: a.teacherName,
      periodId, class: "", subject: "", status: a.status, date: absence.date,
    })),
    [assignments, absence],
  )

  const coveredPeriods = absence.periods.filter(pid =>
    assignments[pid] && (assignments[pid].status === "accepted" || assignments[pid].status === "assigned"),
  ).length
  const coverPct = Math.round((coveredPeriods / absence.periods.length) * 100)

  // Candidate ranking for the currently-open period.
  const candidates: ProxyCandidate[] = useMemo(() => {
    if (!activePeriod) return []
    return rankProxyCandidates({
      absentTeacher, periodId: activePeriod,
      candidates: TEACHERS.filter(t => t.id !== absence.teacherId),
      currentAssignments: assignmentsList, absentTeacherIds: absentIds,
    })
  }, [activePeriod, absentTeacher, assignmentsList, absence.teacherId])

  function assign(periodId: string, teacher: Teacher) {
    const time = TEACHING_PERIODS.find(p => p.id === periodId)?.time ?? ""
    const match = matchKindFor(teacher, absentTeacher)
    setAssignments(prev => ({
      ...prev,
      [periodId]: { teacherId: teacher.id, teacherName: teacher.name, status: "assigned", match },
    }))
    setFlash({
      tone: match === "same-subject" ? "success" : "warning",
      text: `${teacher.name} (${match === "same-subject" ? "same subject" : "different subject"}) assigned to ${periodId} (${time}). A request was sent — they'll be notified to accept.`,
    })
    setActivePeriod(null)
  }
  function unassign(periodId: string) {
    const removed = assignments[periodId]
    setAssignments(prev => {
      const next = { ...prev }; delete next[periodId]; return next
    })
    setFlash({
      tone: "muted",
      text: `${removed?.teacherName ?? "Substitute"} removed from ${periodId}. The period is open again.`,
    })
  }

  /** Auto-assign the best available candidate to every still-open period. */
  function autoFill() {
    const next = { ...assignments }
    const usedThisRun: ProxyAssignment[] = [...assignmentsList]
    absence.periods.forEach(pid => {
      if (next[pid]) return
      const ranked = rankProxyCandidates({
        absentTeacher, periodId: pid,
        candidates: TEACHERS.filter(t => t.id !== absence.teacherId),
        currentAssignments: usedThisRun, absentTeacherIds: absentIds,
      })
      const best = ranked.find(c => c.matchKind === "same-subject" || c.matchKind === "diff-subject")
      if (best) {
        next[pid] = {
          teacherId: best.teacher.id, teacherName: best.teacher.name, status: "assigned",
          match: best.matchKind === "same-subject" ? "same-subject" : "diff-subject",
        }
        usedThisRun.push({
          id: `${absence.id}-${pid}`, absenceId: absence.id, absentTeacherId: absence.teacherId,
          absentTeacherName: absence.teacherName, proxyTeacherId: best.teacher.id,
          proxyTeacherName: best.teacher.name, periodId: pid, class: "", subject: "",
          status: "assigned", date: absence.date,
        })
      }
    })
    setAssignments(next)
    setActivePeriod(null)
    const filled = Object.keys(next).length - Object.keys(assignments).length
    setFlash(
      filled > 0
        ? { tone: "success", text: `Auto-filled ${filled} period${filled !== 1 ? "s" : ""} with the best-matched available teachers.` }
        : { tone: "info", text: "No open periods could be auto-filled — all available teachers are at their cap." },
    )
  }

  const openCount = absence.periods.filter(p => !assignments[p]).length

  return (
    <Card className="overflow-hidden">
      {/* ── Header ── */}
      <CardHeader className="pb-0 pt-4 px-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="size-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground leading-tight">{absence.teacherName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                <BookOpen className="size-3" />
                {absentTeacher.subjects.join(" · ")} · {absentTeacher.section}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={isFullDay ? "destructive" : "warning"} className="text-xs">
              {isFullDay ? "Full Day" : `${absence.periods.length} Periods`}
            </Badge>
            {coverPct === 100 ? (
              <Badge variant="success" className="text-xs flex items-center gap-1">
                <CheckCircle className="size-3" /> Fully Covered
              </Badge>
            ) : (
              <Badge variant={coverPct > 0 ? "warning" : "destructive"} className="text-xs flex items-center gap-1">
                <AlertCircle className="size-3" /> {coveredPeriods}/{absence.periods.length} covered
              </Badge>
            )}
            {openCount > 0 && (
              <Button size="xs" variant="outline" className="gap-1" onClick={autoFill}>
                <Sparkles className="size-3" /> Auto-fill {openCount}
              </Button>
            )}
          </div>
        </div>

        {/* Hint */}
        <p className="mt-3 text-[11px] text-muted-foreground">
          {activePeriod
            ? <>Choosing a substitute for <span className="font-semibold text-foreground">{activePeriod}</span> — best matches first.</>
            : <>Tap a period to see ranked substitutes. Green = same subject, amber = different subject.</>}
        </p>

        {/* ── Clickable period chips ── */}
        <div className="mt-2 flex gap-2 flex-wrap">
          {TEACHING_PERIODS.map(p => {
            const isAbsent = absence.periods.includes(p.id)
            const a = assignments[p.id]
            const isActive = activePeriod === p.id
            if (!isAbsent) {
              return (
                <div key={p.id} className="flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg bg-muted border border-border min-w-[76px]">
                  <span className="text-[10px] font-semibold text-muted-foreground">{p.id}</span>
                  <span className="text-[9px] text-muted-foreground">{p.time.split(" – ")[0]}</span>
                  <span className="text-[9px] text-muted-foreground italic">no class</span>
                </div>
              )
            }
            const meta = a ? STATUS_META[a.status] : null
            const StatusIcon = meta?.icon
            return (
              <button
                key={p.id}
                onClick={() => { setActivePeriod(isActive ? null : p.id); setFlash(null) }}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-lg border min-w-[76px] transition-all text-left",
                  "hover:shadow-sm hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive && "ring-2 ring-primary border-primary",
                  a ? SUBJECT_PILL[a.match] : "bg-card border-dashed border-border hover:border-primary/50",
                )}
                aria-pressed={isActive}
                aria-label={`${p.id} ${p.time}${a ? `, ${a.status} by ${a.teacherName} (${a.match === "same-subject" ? "same subject" : "different subject"})` : ", unassigned"}`}
              >
                <span className="text-[10px] font-bold">{p.id}</span>
                <span className="text-[9px] opacity-70">{p.time.split(" – ")[0]}</span>
                <span className="text-[9px] font-medium truncate max-w-[68px] text-center leading-tight">
                  {a ? (
                    <span className="inline-flex items-center gap-0.5">
                      {StatusIcon && <StatusIcon className="size-2.5 flex-shrink-0" />}
                      {a.teacherName.split(" ")[0]}
                    </span>
                  ) : <span className="text-primary font-semibold">Tap to assign</span>}
                </span>
              </button>
            )
          })}
        </div>

        <p className="mt-3 mb-3 text-xs text-muted-foreground italic">&ldquo;{absence.reason}&rdquo;</p>
      </CardHeader>

      <Separator />

      <CardContent className="p-5">
        {activePeriod ? (
          <CandidatePanel
            periodId={activePeriod}
            periodTime={TEACHING_PERIODS.find(p => p.id === activePeriod)?.time ?? ""}
            candidates={candidates}
            currentAssignee={assignments[activePeriod]}
            onAssign={(t) => assign(activePeriod, t)}
            onUnassign={() => unassign(activePeriod)}
            onClose={() => setActivePeriod(null)}
          />
        ) : flash ? (
          <div
            className={cn(
              "flex items-start gap-2.5 rounded-lg border p-3.5 text-sm",
              flash.tone === "success" && "bg-ef-green-light border-ef-green text-ef-green-dark",
              flash.tone === "warning" && "bg-ef-amber-light border-ef-amber text-ef-amber-dark",
              flash.tone === "info"    && "bg-info border-info-foreground/30 text-info-foreground",
              flash.tone === "muted"   && "bg-muted border-border text-foreground",
            )}
            role="status"
          >
            {flash.tone === "success"
              ? <CheckCircle className="size-4 mt-0.5 flex-shrink-0" />
              : <AlertCircle className="size-4 mt-0.5 flex-shrink-0" />}
            <p className="flex-1">{flash.text}</p>
            <button onClick={() => setFlash(null)} aria-label="Dismiss" className="opacity-60 hover:opacity-100">
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-primary/60" />
            Select a period chip above to pick a substitute.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Ranked candidate list for one selected period. */
function CandidatePanel({
  periodId, periodTime, candidates, currentAssignee, onAssign, onUnassign, onClose,
}: {
  periodId: string
  periodTime: string
  candidates: ProxyCandidate[]
  currentAssignee?: { teacherId: string; teacherName: string; status: ProxyStatus }
  onAssign: (t: Teacher) => void
  onUnassign: () => void
  onClose: () => void
}) {
  const available = candidates.filter(c => c.matchKind === "same-subject" || c.matchKind === "diff-subject")
  const best = available[0]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Substitutes for {periodId}</p>
          <p className="text-[11px] text-muted-foreground">{periodTime} · {available.length} available</p>
        </div>
        <div className="flex items-center gap-2">
          {currentAssignee && (
            <Button size="xs" variant="ghost" className="text-destructive hover:text-destructive" onClick={onUnassign}>
              <X className="size-3" /> Clear {currentAssignee.teacherName.split(" ")[0]}
            </Button>
          )}
          <Button size="icon-sm" variant="ghost" onClick={onClose} aria-label="Close"><X className="size-4" /></Button>
        </div>
      </div>

      <div className="space-y-2">
        {candidates.map((c, i) => {
          const isAssigned = currentAssignee?.teacherId === c.teacher.id
          const blocked = c.matchKind === "unavailable" || c.matchKind === "capped"
          const isBest = best && c.teacher.id === best.teacher.id
          return (
            <div
              key={c.teacher.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-2.5 transition-colors",
                isAssigned && "border-primary bg-primary/5",
                isBest && !isAssigned && "border-success/40 bg-success/5",
                blocked && "opacity-60",
                !isAssigned && !isBest && !blocked && "hover:bg-muted/40",
              )}
            >
              {/* Rank + avatar */}
              <div className="relative flex-shrink-0">
                <div className="size-9 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-secondary-foreground">
                  {initials(c.teacher.name)}
                </div>
                {isBest && !blocked && (
                  <Crown className="absolute -top-1.5 -right-1.5 size-4 text-amber-500 fill-amber-400" />
                )}
              </div>

              {/* Identity + reasons */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground truncate">{c.teacher.name}</p>
                  {c.matchKind === "same-subject" && <Badge variant="success" className="text-[10px] px-1.5 py-0">Same subject</Badge>}
                  {c.matchKind === "diff-subject" && <Badge variant="warning" className="text-[10px] px-1.5 py-0">Diff. subject</Badge>}
                  {c.matchKind === "capped" && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">At cap</Badge>}
                  {c.matchKind === "unavailable" && <Badge variant="outline" className="text-[10px] px-1.5 py-0">Unavailable</Badge>}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {c.teacher.subjects.join(", ")}
                  {c.reasons.length > 0 && <span className="text-muted-foreground/70"> · {c.reasons[0]}</span>}
                </p>
              </div>

              {/* Score meter */}
              {!blocked && (
                <div className="hidden sm:flex flex-col items-end gap-1 w-24 flex-shrink-0">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Star className="size-3 text-amber-500" />
                    <span className="font-semibold text-foreground">{c.score}</span>/100
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn("h-full rounded-full", c.matchKind === "same-subject" ? "bg-ef-green" : "bg-ef-amber")}
                      style={{ width: `${c.score}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action */}
              <div className="flex-shrink-0">
                {isAssigned ? (
                  <Badge variant="default" className="text-[10px] flex items-center gap-1"><Check className="size-3" /> Assigned</Badge>
                ) : (
                  <Button size="xs" variant={isBest ? "default" : "outline"} disabled={blocked} onClick={() => onAssign(c.teacher)}>
                    {isBest ? "Assign best" : "Assign"}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ProxyBoard({ absences }: { absences: Absence[] }) {
  return (
    <div className="space-y-5">
      {absences.map(a => <AbsenceCard key={a.id} absence={a} />)}
    </div>
  )
}
