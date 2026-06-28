"use client"

/**
 * ExamGridBuilder  (Feature: exam-routine-builder)
 *
 * Three-axis exam routine builder. Rows are Class Groups ordered by `order`;
 * columns are (Exam_Date × Session) pairs. The routine is built at the class
 * level — all sections within a class share the same schedule automatically.
 *
 * Class palette: select a class group → section tabs appear showing which
 * sections the schedule applies to. A green tick appears on a class button
 * once every exam date has a subject assigned for that class.
 */

import { useState, useMemo } from "react"
import {
  DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { toast } from "sonner"
import { X, GripVertical, CalendarX2, Inbox, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogFooter,
  AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useExamSchedule } from "@/context/exam-schedule-context"
import { type ExamSlot } from "@/data/mock-exams"
import { TEACHERS } from "@/data/teachers"
import { columnAxis } from "@/lib/exam/exam-dates"
import { slotKey, isSubjectAlreadyScheduled, type SlotCoord } from "@/lib/exam/slots"
import { slotIsConflicted, wouldDoubleBook } from "@/lib/exam/conflict-engine"
import { flagUnlinkedSubject } from "@/lib/exam/availability"
import { ConflictBanner, AvailabilityBadgeView } from "@/components/domain/exam/ConflictBanner"
import type { OpResult } from "@/lib/exam/types"

const ACTIVE_TEACHERS = TEACHERS.filter(t => t.status !== "inactive")

function initials(name: string) {
  return name.split(" ").map(p => p[0]).slice(0, 2).join("")
}

function fmtDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
}

// ─────────────────────────────────────────────────────────────────────────────
// Drag payloads
//
// The full discriminated union. Palette payloads originate in the palette;
// scheduled payloads originate from an occupied cell and carry the source
// SlotCoord so the drop can route to `moveSubject` / `moveInvigilator`.
// ─────────────────────────────────────────────────────────────────────────────

type DragData =
  | { kind: "palette-subject"; subject: string; classId: string }
  | { kind: "scheduled-subject"; from: SlotCoord }
  | { kind: "palette-teacher"; teacherId: string }
  | { kind: "scheduled-teacher"; from: SlotCoord; teacherId: string }

/** Map an OpResult rejection code to a short, friendly user-facing message. */
function friendlyError(res: Extract<OpResult<unknown>, { ok: false }>): string {
  switch (res.error) {
    case "invalid-subject-for-class":
      return "That subject isn't linked to this class, so it can't go here."
    case "subject-already-scheduled":
      return "That subject is already scheduled for this class in another slot. Each subject can only appear once per class."
    case "no-subject-scheduled":
      return "Add a subject to this cell before assigning an invigilator."
    case "already-assigned":
    case "duplicate-invigilator":
      return "That teacher is already an invigilator on this slot."
    case "unauthorized":
      return "You're not allowed to make this change."
    default:
      return res.message
  }
}

/** Surface an OpResult: a friendly error toast on rejection; silent on success. */
function surfaceResult(res: OpResult<unknown>): void {
  if (!res.ok) toast.error(friendlyError(res))
}

const CELL_PREFIX = "cell:"

function cellDroppableId(c: SlotCoord): string {
  return `${CELL_PREFIX}${slotKey(c)}`
}

/** Parse a droppable cell id back into its coordinate. classIds never contain "__". */
function parseCellId(id: string): SlotCoord | null {
  if (!id.startsWith(CELL_PREFIX)) return null
  const parts = id.slice(CELL_PREFIX.length).split("__")
  if (parts.length !== 3) return null
  const [classId, date, sessionId] = parts
  return { classId, date, sessionId }
}

// ─────────────────────────────────────────────────────────────────────────────
// Draggable chip (palette)
// ─────────────────────────────────────────────────────────────────────────────

function DragChip({ id, data, className, children }: {
  id: string; data: DragData; className?: string; children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id, data })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <button
      ref={setNodeRef}
      style={style}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium cursor-grab active:cursor-grabbing touch-none",
        isDragging && "opacity-50 z-50",
        className,
      )}
      {...listeners}
      {...attributes}
    >
      <GripVertical className="size-3 opacity-50" />
      {children}
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Draggable scheduled items (inside an occupied cell)
//
// A scheduled subject and each scheduled invigilator duty are draggable, each
// carrying its source coordinate so the drop routes to `moveSubject` /
// `moveInvigilator`. We attach the drag listeners to the element itself; the
// inline remove button stops pointer propagation so a click removes rather than
// starting a drag.
// ─────────────────────────────────────────────────────────────────────────────

function ScheduledSubject({ coord, subject }: { coord: SlotCoord; subject: string }) {
  const data: DragData = { kind: "scheduled-subject", from: coord }
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `sub:${slotKey(coord)}`, data,
  })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <span
      ref={setNodeRef}
      style={style}
      className={cn(
        "text-sm font-semibold leading-tight cursor-grab active:cursor-grabbing touch-none",
        isDragging && "opacity-50",
      )}
      {...listeners}
      {...attributes}
    >
      {subject}
    </span>
  )
}

function ScheduledDuty({
  coord, teacherId, label, onRemove,
}: {
  coord: SlotCoord; teacherId: string; label: string; onRemove: () => void
}) {
  const data: DragData = { kind: "scheduled-teacher", from: coord, teacherId }
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `dut:${slotKey(coord)}:${teacherId}`, data,
  })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined
  return (
    <span
      ref={setNodeRef}
      style={style}
      className={cn("cursor-grab active:cursor-grabbing touch-none", isDragging && "opacity-50")}
      {...listeners}
      {...attributes}
    >
      <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px]">
        {label}
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={onRemove}
          aria-label="Remove invigilator"
        >
          <X className="size-2.5" />
        </button>
      </Badge>
    </span>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Cell — one Exam_Slot at (classId, date, sessionId)
// ─────────────────────────────────────────────────────────────────────────────

function Cell({ coord }: { coord: SlotCoord }) {
  const { slotFor, removeInvigilator, clearSlot, conflicts, catalog, canEdit } = useExamSchedule()
  const { setNodeRef, isOver } = useDroppable({ id: cellDroppableId(coord), disabled: !canEdit })
  const slot = slotFor(coord)

  const conflicted = slotIsConflicted(conflicts, coord)
  const invalidSubject = slot ? flagUnlinkedSubject(slot, catalog) : null
  const flagged = conflicted || invalidSubject !== null

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[88px] rounded-lg border-2 border-dashed p-2 transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border",
        slot && "border-solid bg-card",
        flagged && "border-solid border-[var(--ef-red)] bg-[var(--ef-red-light)]",
      )}
    >
      {slot ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-1">
            {slot.subject ? (
              canEdit ? (
                <ScheduledSubject coord={coord} subject={slot.subject} />
              ) : (
                <span className="text-sm font-semibold leading-tight">{slot.subject}</span>
              )
            ) : (
              <span className="text-sm font-semibold leading-tight">—</span>
            )}
            {canEdit && (
              <button
                onClick={() => clearSlot(coord)}
                aria-label="Clear slot"
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {slot.room && (
            <span className="text-[10px] text-muted-foreground">{slot.room}</span>
          )}

          {/* Invalid-subject flag (R2.4) — red status + text label. */}
          {invalidSubject && (
            <AvailabilityBadgeView badge={invalidSubject} className="text-[10px]" />
          )}

          {/* Conflict flag (R6.2) — red status + text label. */}
          {conflicted && (
            <AvailabilityBadgeView
              badge={{ status: "unavailable", label: "Double-booked invigilator" }}
              className="text-[10px]"
            />
          )}

          <div className="flex flex-wrap gap-1">
            {slot.invigilatorIds.length === 0 ? (
              <span className="text-[10px] text-[var(--ef-amber-dark)]">
                {canEdit ? "Drop a teacher →" : "No invigilator"}
              </span>
            ) : (
              slot.invigilatorIds.map(tid => {
                const t = TEACHERS.find(x => x.id === tid)
                const label = t ? initials(t.name) : tid
                return canEdit ? (
                  <ScheduledDuty
                    key={tid}
                    coord={coord}
                    teacherId={tid}
                    label={label}
                    onRemove={() => removeInvigilator(coord, tid)}
                  />
                ) : (
                  <Badge key={tid} variant="secondary" className="h-5 gap-1 px-1.5 text-[10px]">
                    {label}
                  </Badge>
                )
              })
            )}
          </div>
        </div>
      ) : (
        <span className="text-[10px] text-muted-foreground">
          {canEdit ? "Drop a subject" : "—"}
        </span>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Builder
// ─────────────────────────────────────────────────────────────────────────────

export function ExamGridBuilder() {
  const {
    dates, sessions, slots, conflicts, classGroups, paletteForClass, canEdit,
    setSubject, addInvigilator, moveSubject, moveInvigilator,
  } = useExamSchedule()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  // Class groups sorted by order
  const orderedGroups = useMemo(
    () => [...classGroups].sort((a, b) => a.order - b.order),
    [classGroups],
  )

  // Selected class group for the palette
  const [selectedGroupId, setSelectedGroupId] = useState<string>(() => orderedGroups[0]?.id ?? "")
  const selectedGroup = orderedGroups.find(g => g.id === selectedGroupId) ?? orderedGroups[0]
  const palette = selectedGroup ? paletteForClass(selectedGroup.id) : []

  // Columns: (date × session) ordered by date asc then session start asc
  const columns = columnAxis(dates, sessions)

  /** A class is "complete" when every date column has a subject assigned. */
  function isClassComplete(groupId: string): boolean {
    if (columns.length === 0) return false
    return columns.every(({ date, session }) =>
      slots.some(s => s.classId === groupId && s.date === date && s.sessionId === session.id && s.subject),
    )
  }

  const [pending, setPending] = useState<
    | { kind: "palette-teacher"; to: SlotCoord; teacherId: string }
    | { kind: "scheduled-teacher"; from: SlotCoord; to: SlotCoord; teacherId: string }
    | null
  >(null)

  function teacherWouldConflict(to: SlotCoord, teacherId: string, from?: SlotCoord): boolean {
    if (from) {
      const simulated: ExamSlot[] = slots.map(s =>
        s.classId === from.classId && s.date === from.date && s.sessionId === from.sessionId
          ? { ...s, invigilatorIds: s.invigilatorIds.filter(id => id !== teacherId) }
          : s,
      )
      return wouldDoubleBook(simulated, to, teacherId)
    }
    return wouldDoubleBook(slots, to, teacherId)
  }

  function commitInvigilator(p: NonNullable<typeof pending>): void {
    const res = p.kind === "palette-teacher"
      ? addInvigilator(p.to, p.teacherId)
      : moveInvigilator(p.from, p.to, p.teacherId)
    surfaceResult(res)
  }

  function handleDragEnd(e: DragEndEvent) {
    if (!canEdit) return
    const { active, over } = e
    if (!over) return
    const to = parseCellId(String(over.id))
    if (!to) return
    const data = active.data.current as DragData | undefined
    if (!data) return

    switch (data.kind) {
      case "palette-subject":
        surfaceResult(setSubject(to, data.subject))
        return
      case "scheduled-subject":
        surfaceResult(moveSubject(data.from, to))
        return
      case "palette-teacher": {
        if (teacherWouldConflict(to, data.teacherId)) {
          setPending({ kind: "palette-teacher", to, teacherId: data.teacherId })
          return
        }
        surfaceResult(addInvigilator(to, data.teacherId))
        return
      }
      case "scheduled-teacher": {
        if (teacherWouldConflict(to, data.teacherId, data.from)) {
          setPending({ kind: "scheduled-teacher", from: data.from, to, teacherId: data.teacherId })
          return
        }
        surfaceResult(moveInvigilator(data.from, to, data.teacherId))
        return
      }
    }
  }

  const pendingTeacherName = pending
    ? TEACHERS.find(t => t.id === pending.teacherId)?.name ?? pending.teacherId
    : ""
  const pendingSessionName = pending
    ? sessions.find(s => s.id === pending.to.sessionId)?.name ?? pending.to.sessionId
    : ""

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">
        <ConflictBanner conflicts={conflicts} sessions={sessions} />

        {canEdit && (
          <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-3">

            {/* Class selector with completion ticks */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">Class palette</span>
              {orderedGroups.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No classes configured. Add classes in Settings → Classes &amp; Sections.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {orderedGroups.map(group => {
                    const complete = isClassComplete(group.id)
                    const active = group.id === selectedGroup?.id
                    return (
                      <button
                        key={group.id}
                        onClick={() => setSelectedGroupId(group.id)}
                        aria-pressed={active}
                        title={complete ? `${group.name} — all dates scheduled` : group.name}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : complete
                              ? "border-[var(--ef-green,#34C759)] bg-[var(--ef-green-light,#E5F9EC)] text-[var(--ef-green-dark,#1A6B30)]"
                              : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        {complete && !active && (
                          <CheckCircle2 className="size-3.5" aria-hidden="true" />
                        )}
                        {group.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Section tabs — shows all sections that share this schedule */}
            {selectedGroup && selectedGroup.sections.length > 0 && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  This schedule applies to all sections of {selectedGroup.name}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedGroup.sections.map(sec => (
                    <span
                      key={sec}
                      className="inline-flex items-center rounded-md border border-border bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {selectedGroup.name} — {sec}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Subject palette (class-filtered) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Subjects for {selectedGroup?.name ?? "…"} — drag into a cell
              </span>
              {!selectedGroup ? null : palette.length === 0 ? (
                <div className="flex items-center gap-2 rounded-md border border-dashed bg-card px-3 py-2 text-xs text-muted-foreground">
                  <Inbox className="size-4 flex-shrink-0" aria-hidden="true" />
                  <span>
                    No subjects are linked to {selectedGroup.name}. Link subjects in the Subject
                    Catalog to build this class&apos;s routine.
                  </span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {palette.map(s => {
                    const used = selectedGroup
                      ? isSubjectAlreadyScheduled(slots, s.name, selectedGroup.id)
                      : false
                    return used ? (
                      <span
                        key={s.id}
                        title={`${s.name} is already scheduled for ${selectedGroup?.name}`}
                        aria-label={`${s.name} — already scheduled`}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs font-medium text-muted-foreground opacity-50 cursor-not-allowed select-none"
                      >
                        <GripVertical className="size-3 opacity-30" aria-hidden="true" />
                        {s.name}
                        <span className="ml-0.5 text-[9px] font-normal">(used)</span>
                      </span>
                    ) : (
                      <DragChip
                        key={s.id}
                        id={`palette-subject:${selectedGroup?.id}:${s.name}`}
                        data={{ kind: "palette-subject", subject: s.name, classId: selectedGroup?.id ?? "" }}
                        className="border-primary/40 bg-[var(--ef-brand-light)] text-primary"
                      >
                        {s.name}
                      </DragChip>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Invigilator palette */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted-foreground">
                Invigilators — drag onto a scheduled cell
              </span>
              <div className="flex flex-wrap gap-1.5">
                {ACTIVE_TEACHERS.map(t => (
                  <DragChip
                    key={t.id}
                    id={`palette-teacher:${t.id}`}
                    data={{ kind: "palette-teacher", teacherId: t.id }}
                    className="border-[var(--ef-purple)]/40 bg-[var(--ef-purple-light)] text-[var(--ef-purple)]"
                  >
                    {t.name}
                  </DragChip>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        {columns.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed bg-card p-4 text-sm text-muted-foreground">
            <CalendarX2 className="size-5 flex-shrink-0" aria-hidden="true" />
            <span>No exam dates or sessions are configured yet. Add exam dates and sessions to build the routine grid.</span>
          </div>
        ) : orderedGroups.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg border border-dashed bg-card p-4 text-sm text-muted-foreground">
            <span>No classes configured. Add classes in Settings → Classes &amp; Sections.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div
              className="grid gap-2"
              style={{
                gridTemplateColumns: `160px repeat(${columns.length}, minmax(160px, 1fr))`,
                minWidth: `${160 + columns.length * 160}px`,
              }}
            >
              <div />
              {columns.map(({ date, session }) => (
                <div
                  key={`${date}__${session.id}`}
                  className="flex flex-col items-center gap-0.5 px-2 pb-1 text-center"
                >
                  <span className="text-xs font-semibold">{fmtDate(date)}</span>
                  <span className="text-[10px] font-medium text-muted-foreground">
                    {session.name} · {session.startTime}–{session.endTime}
                  </span>
                </div>
              ))}
              {orderedGroups.map(group => (
                <GridRow key={group.id} classId={group.id} label={group.name} columns={columns} />
              ))}
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={pending !== null} onOpenChange={open => { if (!open) setPending(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Double-booking warning</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingTeacherName} is already invigilating another exam on{" "}
              {fmtDate(pending?.to.date ?? "")} during the {pendingSessionName} session.
              Assigning this duty will double-book them. You can override and keep the
              assignment — it will stay flagged as a conflict.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPending(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pending) commitInvigilator(pending)
                setPending(null)
              }}
            >
              Override and assign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DndContext>
  )
}

function GridRow({
  classId, label, columns,
}: {
  classId: string
  label: string
  columns: { date: string; session: { id: string } }[]
}) {
  return (
    <>
      <div className="flex items-center px-2 text-sm font-semibold">{label}</div>
      {columns.map(({ date, session }) => (
        <Cell key={`${classId}__${date}__${session.id}`} coord={{ classId, date, sessionId: session.id }} />
      ))}
    </>
  )
}
