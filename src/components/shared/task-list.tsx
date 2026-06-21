"use client"

import { useMemo, useState } from "react"
import { CheckCircle2, Circle, ListChecks, RotateCcw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface TaskItem {
  /** Stable id. */
  id: string
  /** Checklist label. */
  label: string
  /** Optional helper line shown under the label. */
  hint?: string
  /** Initial done state. */
  done?: boolean
}

interface TaskListProps {
  /** Checklist title (defaults to "Checklist"). */
  title?: string
  /** Optional icon node rendered before the title. */
  icon?: React.ReactNode
  /** The checklist items. */
  tasks: TaskItem[]
  /** Called with the updated tasks whenever an item is toggled. */
  onToggle?: (tasks: TaskItem[]) => void
  /** Show the "Reset" button in the footer. Default true. */
  allowReset?: boolean
  /** Hide the progress footer (bar + count). Default false. */
  hideProgress?: boolean
  /** Tone for the completion badge when fully done. Default "success". */
  doneVariant?: "success" | "default"
  className?: string
  /** Optional caption under the title. */
  subtitle?: string
}

/**
 * TaskList — reusable interactive checklist with a live progress bar.
 *
 * Used by:
 *  - Daily Log end-of-day operations checklist (management)
 *  - Teacher daily reminders (mark attendance, submit notes, …)
 *  - Onboarding wizard step tracking
 *  - Anywhere a "X / Y done" progress surface is needed.
 *
 * The component owns the checked state internally (so it works on any page
 * without lifting state) and also forwards updates via `onToggle` for pages
 * that want to persist the result. Fully accessible: each row is a real
 * <button> with aria-pressed.
 */
export function TaskList({
  title = "Checklist",
  icon,
  tasks,
  onToggle,
  allowReset = true,
  hideProgress = false,
  doneVariant = "success",
  className,
  subtitle,
}: TaskListProps) {
  const [items, setItems] = useState<TaskItem[]>(tasks)

  const doneCount = useMemo(
    () => items.filter(t => t.done).length,
    [items],
  )
  const pct = items.length === 0 ? 0 : Math.round((doneCount / items.length) * 100)
  const allDone = items.length > 0 && doneCount === items.length

  function toggle(id: string) {
    const next = items.map(t => (t.id === id ? { ...t, done: !t.done } : t))
    setItems(next)
    onToggle?.(next)
  }

  function reset() {
    const next = items.map(t => ({ ...t, done: false }))
    setItems(next)
    onToggle?.(next)
  }

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {icon ?? <ListChecks className="size-4 text-primary" />}
            <span className="truncate">{title}</span>
          </CardTitle>
          {allDone ? (
            <Badge variant={doneVariant} className="shrink-0">Done</Badge>
          ) : (
            <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0">
              {doneCount}/{items.length}
            </span>
          )}
        </div>
      </CardHeader>

      {subtitle && (
        <p className="px-6 -mt-1 mb-2 text-xs text-muted-foreground">{subtitle}</p>
      )}

      {!hideProgress && (
        <div className="px-6 pb-3">
          <Progress
            value={pct}
            className={cn("h-1.5", allDone ? "[&>div]:bg-success-foreground" : "[&>div]:bg-primary")}
          />
        </div>
      )}

      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {items.map(task => {
            const checked = !!task.done
            return (
              <li key={task.id}>
                <button
                  type="button"
                  onClick={() => toggle(task.id)}
                  aria-pressed={checked}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                    "hover:bg-muted/40 focus-visible:outline-none focus-visible:bg-accent",
                    checked && "bg-muted/20",
                  )}
                >
                  {checked ? (
                    <CheckCircle2 className="size-4 mt-0.5 text-success-foreground shrink-0" />
                  ) : (
                    <Circle className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "block text-sm font-medium",
                        checked ? "text-muted-foreground line-through" : "text-foreground",
                      )}
                    >
                      {task.label}
                    </span>
                    {task.hint && (
                      <span className="block text-[11px] text-muted-foreground mt-0.5">
                        {task.hint}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {allowReset && items.some(t => t.done) && (
          <div className="p-3 border-t border-border flex justify-end">
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="size-3.5" /> Reset
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
