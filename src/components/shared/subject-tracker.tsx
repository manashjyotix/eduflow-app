import { BookOpen, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { SubjectCompletion } from "@/data/subject-completion"

// ─── Per-subject row ─────────────────────────────────────────────────────────

interface SubjectRowProps {
  subject: SubjectCompletion
}

/** Maps a completion percentage to a colour band. */
function band(pct: number) {
  if (pct >= 80) return { variant: "success" as const, label: "On Track",   bar: "[&>div]:bg-success-foreground", chip: "bg-success/40 text-success-foreground" }
  if (pct >= 60) return { variant: "default" as const, label: "Steady",     bar: "[&>div]:bg-primary",            chip: "bg-primary/10 text-primary" }
  if (pct >= 40) return { variant: "warning" as const, label: "Behind",     bar: "[&>div]:bg-warning-foreground",  chip: "bg-warning/40 text-warning-foreground" }
  return            { variant: "destructive" as const, label: "At Risk",    bar: "[&>div]:bg-destructive",        chip: "bg-destructive/10 text-destructive" }
}

function SubjectRow({ subject }: SubjectRowProps) {
  const b = band(subject.percent)
  return (
    <li className="px-4 py-3 border-b border-border last:border-b-0">
      <div className="flex items-center justify-between gap-3 mb-1.5">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">{subject.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {subject.teacher} · Last: {subject.lastTopic}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded", b.chip)}>
            {b.label}
          </span>
          <span className="text-sm font-bold tabular-nums">{subject.percent}%</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Progress value={subject.percent} className={cn("h-1.5 flex-1", b.bar)} />
        <span className="text-[10px] text-muted-foreground tabular-nums whitespace-nowrap">
          {subject.completedUnits}/{subject.totalUnits} units
        </span>
      </div>
    </li>
  )
}

// ─── Public component ────────────────────────────────────────────────────────

interface SubjectTrackerProps {
  subjects: SubjectCompletion[]
  /** Student name for the summary header. */
  studentName?: string
  className?: string
  /** Compact mode hides the summary footer (KPI + behind list). */
  compact?: boolean
}

/**
 * SubjectTracker — per-subject syllabus completion tracker for the parent
 * portal. Shows a progress bar + completion band for each subject, plus a
 * summary footer with the overall average and any behind/at-risk subjects.
 *
 * Colour bands follow EduFlow status tokens (success / primary / warning /
 * destructive) so the tracker reads correctly in light + dark mode.
 */
export function SubjectTracker({
  subjects,
  studentName,
  className,
  compact = false,
}: SubjectTrackerProps) {
  if (subjects.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          No subject completion data available.
        </CardContent>
      </Card>
    )
  }

  const avg = Math.round(subjects.reduce((s, sub) => s + sub.percent, 0) / subjects.length)
  const behind = subjects.filter(s => s.percent < 60).sort((a, b) => a.percent - b.percent)

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          Subject Completion
          {studentName && (
            <span className="text-xs font-normal text-muted-foreground truncate">
              · {studentName}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <ul className="px-0 m-0 list-none">
        {subjects.map(subject => (
          <SubjectRow key={subject.id} subject={subject} />
        ))}
      </ul>

      {!compact && (
        <CardContent className="p-4 bg-muted/30 border-t border-border space-y-3">
          {/* Overall average */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Overall syllabus covered</span>
            <span className="text-sm font-bold text-primary tabular-nums">{avg}%</span>
          </div>
          <Progress value={avg} className="h-2 [&>div]:bg-primary" />

          {/* Behind / at-risk summary */}
          {behind.length > 0 ? (
            <div className="rounded-lg border border-warning/30 bg-warning/10 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <AlertTriangle className="size-3.5 text-warning-foreground" />
                <span className="text-xs font-semibold text-warning-foreground">
                  {behind.length} subject{behind.length > 1 ? "s" : ""} need attention
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {behind.map(s => (
                  <Badge key={s.id} variant="warning" className="text-[10px]">
                    {s.name} · {s.percent}%
                  </Badge>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-success-foreground">
              <CheckCircle2 className="size-3.5" />
              All subjects are on track for the term.
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
            <span className="inline-flex items-center gap-1">
              <TrendingUp className="size-3" />
              Updated weekly by subject teachers
            </span>
            <span className="tabular-nums">{subjects.length} subjects</span>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
