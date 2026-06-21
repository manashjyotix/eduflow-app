"use client"

import { useMemo, useState } from "react"
import { toast } from "sonner"
import { MessageSquarePlus, NotebookPen, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { EmptyState } from "@/components/shared/empty-state"
import { cn } from "@/lib/utils"
import {
  PROGRESS_TAG_META, PROGRESS_TAGS, type ProgressNote, type ProgressTag,
} from "@/data/progress-notes"

interface ProgressNotesProps {
  /** Pre-existing notes for the current class/subject. */
  notes: ProgressNote[]
  /** Called when the teacher saves a new note. */
  onSave?: (note: ProgressNote) => void
  /** Class options for the picker (default: VIII-A/B sample). */
  classes?: string[]
  /** Students available to tag. Defaults to a small inline set. */
  students?: { id: string; name: string }[]
  /** Subject being taught (stamped onto new notes). */
  subject?: string
  /** Period being taught (stamped onto new notes). */
  periodId?: string
  /** Teacher name stamped onto new notes. */
  teacher?: string
  className?: string
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

/**
 * ProgressNotes — teacher per-student qualitative note flow.
 *
 * Flow: pick class → pick student → pick tag (Understood/Struggling/…) →
 * write a comment → save. Recent notes are listed underneath with coloured
 * chips driven by the EduFlow status tokens.
 *
 * Used by the teacher Mark Attendance page and class journal.
 */
export function ProgressNotes({
  notes,
  onSave,
  classes = ["VI-A", "VII-A", "VIII-A", "VIII-B", "IX-A", "X-A"],
  students,
  subject = "Mathematics",
  periodId = "P3",
  teacher = "Priya Sharma",
  className,
}: ProgressNotesProps) {
  const [open, setOpen] = useState(false)
  const [cls, setCls] = useState<string | null>(null)
  const [student, setStudent] = useState<{ id: string; name: string } | null>(null)
  const [tag, setTag] = useState<ProgressTag>("understood")
  const [comment, setComment] = useState("")

  // Inline fallback roster when no students passed in.
  const roster = useMemo(
    () => students ?? [
      { id: "s1", name: "Rohit Das" },
      { id: "s2", name: "Priti Kalita" },
      { id: "s3", name: "Aman Bora" },
      { id: "s7", name: "Manash Deka" },
      { id: "s12", name: "Ankita Sarma" },
    ],
    [students],
  )

  function reset() {
    setCls(null); setStudent(null); setTag("understood"); setComment("")
  }

  function close() {
    setOpen(false)
    reset()
  }

  function save() {
    if (!student) {
      toast.error("Pick a student first.")
      return
    }
    const note: ProgressNote = {
      id: `pn${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      class: cls ?? "—",
      periodId,
      subject,
      tag,
      note: comment.trim() || PROGRESS_TAG_META[tag].hint,
      createdAt: new Date().toISOString(),
      teacher,
    }
    onSave?.(note)
    toast.success("Note saved", {
      description: `${student.name} · ${PROGRESS_TAG_META[tag].label}`,
    })
    close()
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <NotebookPen className="size-4 text-primary" />
          Progress Notes
        </CardTitle>
        <Button size="sm" onClick={() => setOpen(true)}>
          <MessageSquarePlus className="size-4" /> Add Note
        </Button>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        {notes.length === 0 ? (
          <EmptyState
            icon={<NotebookPen className="size-6" />}
            title="No notes yet"
            description="Capture how each student is doing during class."
          />
        ) : (
          <ul className="divide-y divide-border">
            {notes.map(n => {
              const meta = PROGRESS_TAG_META[n.tag]
              return (
                <li key={n.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {n.studentName}
                        <span className="text-muted-foreground font-normal"> · {n.class} · {n.subject}</span>
                      </p>
                    </div>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded shrink-0", meta.chip)}>
                      {meta.label}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">&ldquo;{n.note}&rdquo;</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {n.teacher} · {timeAgo(n.createdAt)}
                  </p>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>

      {/* ── Add note sheet (inline modal) ── */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Add progress note"
          onClick={close}
        >
          <div
            className="w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-sm font-semibold">Add Progress Note</h3>
              <Button variant="ghost" size="icon-sm" onClick={close} aria-label="Close">
                <X className="size-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4">
              {/* Step 1: class */}
              <div className="space-y-1.5">
                <Label className="text-xs">1. Class</Label>
                <div className="flex flex-wrap gap-1.5">
                  {classes.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { setCls(c); setStudent(null) }}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
                        cls === c
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: student */}
              <div className="space-y-1.5">
                <Label className="text-xs">2. Student</Label>
                <div className="flex flex-wrap gap-1.5">
                  {roster.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      disabled={!cls}
                      onClick={() => setStudent(s)}
                      className={cn(
                        "rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
                        student?.id === s.id
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:bg-accent",
                        !cls && "opacity-40 cursor-not-allowed",
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: tag */}
              <div className="space-y-1.5">
                <Label className="text-xs">3. How did they do?</Label>
                <div className="flex flex-wrap gap-1.5">
                  {PROGRESS_TAGS.map(t => {
                    const meta = PROGRESS_TAG_META[t]
                    const active = tag === t
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTag(t)}
                        aria-pressed={active}
                        title={meta.hint}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-accent",
                        )}
                      >
                        {meta.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 4: comment */}
              <div className="space-y-1.5">
                <Label htmlFor="pn-comment" className="text-xs">4. Comment (optional)</Label>
                <Textarea
                  id="pn-comment"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder={PROGRESS_TAG_META[tag].hint}
                  rows={3}
                  className="resize-none text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
              <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
              <Button size="sm" onClick={save} disabled={!student}>Save Note</Button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
