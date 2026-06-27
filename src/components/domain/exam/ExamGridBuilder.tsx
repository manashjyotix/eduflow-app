"use client"

/**
 * ExamGridBuilder  (Feature F4)
 *
 * Drag-and-drop exam routine builder. Rows = classes, columns = exam days.
 * Drag a Subject chip into a cell to schedule it; drag a Teacher chip onto a
 * scheduled cell to add an invigilation duty. Built on @dnd-kit/core.
 */

import {
  DndContext, useDraggable, useDroppable, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { X, GripVertical } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useExamSchedule } from "@/context/exam-schedule-context"
import {
  EXAM_CLASSES, EXAM_DAYS, EXAM_SUBJECTS, examCellKey,
} from "@/data/mock-exams"
import { TEACHERS } from "@/data/teachers"

const ACTIVE_TEACHERS = TEACHERS.filter(t => t.status !== "inactive")

function initials(name: string) {
  return name.split(" ").map(p => p[0]).slice(0, 2).join("")
}

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
}

interface DragData {
  type: "subject" | "teacher"
  subject?: string
  teacherId?: string
}

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

function Cell({ classId, date }: { classId: string; date: string }) {
  const { slotFor, removeInvigilator, clearSlot } = useExamSchedule()
  const id = `cell:${examCellKey(classId, date)}`
  const { setNodeRef, isOver } = useDroppable({ id })
  const slot = slotFor(classId, date)

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "min-h-[84px] rounded-lg border-2 border-dashed p-2 transition-colors",
        isOver ? "border-primary bg-primary/5" : "border-border",
        slot && "border-solid bg-card",
      )}
    >
      {slot ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-1">
            <span className="text-sm font-semibold leading-tight">{slot.subject}</span>
            <button onClick={() => clearSlot(classId, date)} aria-label="Clear slot" className="text-muted-foreground hover:text-destructive">
              <X className="size-3.5" />
            </button>
          </div>
          <span className="text-[10px] text-muted-foreground">{slot.startTime}{slot.room ? ` · ${slot.room}` : ""}</span>
          <div className="flex flex-wrap gap-1">
            {slot.invigilatorIds.length === 0 ? (
              <span className="text-[10px] text-[var(--ef-amber-dark)]">Drop a teacher →</span>
            ) : (
              slot.invigilatorIds.map(tid => {
                const t = TEACHERS.find(x => x.id === tid)
                return (
                  <Badge key={tid} variant="secondary" className="h-5 gap-1 px-1.5 text-[10px]">
                    {t ? initials(t.name) : tid}
                    <button onClick={() => removeInvigilator(classId, date, tid)} aria-label="Remove invigilator">
                      <X className="size-2.5" />
                    </button>
                  </Badge>
                )
              })
            )}
          </div>
        </div>
      ) : (
        <span className="text-[10px] text-muted-foreground">Drop a subject</span>
      )}
    </div>
  )
}

export function ExamGridBuilder() {
  const { setSubject, addInvigilator } = useExamSchedule()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    if (!over) return
    const overId = String(over.id)
    if (!overId.startsWith("cell:")) return
    const [classId, date] = overId.slice(5).split("__")
    const data = active.data.current as DragData | undefined
    if (data?.type === "subject" && data.subject) setSubject(classId, date, data.subject)
    else if (data?.type === "teacher" && data.teacherId) addInvigilator(classId, date, data.teacherId)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex flex-col gap-4">
        {/* Palettes */}
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
          <span className="text-xs font-semibold text-muted-foreground">Subjects — drag into a cell</span>
          <div className="flex flex-wrap gap-1.5">
            {EXAM_SUBJECTS.map(s => (
              <DragChip key={s} id={`subject:${s}`} data={{ type: "subject", subject: s }} className="border-primary/40 bg-[var(--ef-brand-light)] text-primary">
                {s}
              </DragChip>
            ))}
          </div>
          <span className="mt-1 text-xs font-semibold text-muted-foreground">Invigilators — drag onto a scheduled cell</span>
          <div className="flex flex-wrap gap-1.5">
            {ACTIVE_TEACHERS.map(t => (
              <DragChip key={t.id} id={`teacher:${t.id}`} data={{ type: "teacher", teacherId: t.id }} className="border-[var(--ef-purple)]/40 bg-[var(--ef-purple-light)] text-[var(--ef-purple)]">
                {t.name}
              </DragChip>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <div
            className="grid gap-2 min-w-[640px]"
            style={{ gridTemplateColumns: `120px repeat(${EXAM_DAYS.length}, minmax(140px, 1fr))` }}
          >
            <div />
            {EXAM_DAYS.map(d => (
              <div key={d} className="px-2 pb-1 text-center text-xs font-semibold text-muted-foreground">{fmtDay(d)}</div>
            ))}

            {EXAM_CLASSES.map(cls => (
              <FragmentRow key={cls} cls={cls} />
            ))}
          </div>
        </div>
      </div>
    </DndContext>
  )
}

function FragmentRow({ cls }: { cls: string }) {
  return (
    <>
      <div className="flex items-center px-2 text-sm font-semibold">{cls}</div>
      {EXAM_DAYS.map(d => <Cell key={`${cls}-${d}`} classId={cls} date={d} />)}
    </>
  )
}
