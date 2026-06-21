"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TimetablePeriod {
  id: string
  label?: string
  time?: string
  isBreak?: boolean
}

export interface TimetableAssignment {
  /** Period id (e.g. "P1") */
  periodId: string
  /** Day/column key (e.g. "Mon" or "Monday") */
  day: string
  subject: string
  teacher?: string
  /** Optional CSS color classes for the cell */
  colorClass?: string
}

export interface TimetableGridProps {
  /** Ordered list of periods to render as rows */
  periods: TimetablePeriod[]
  /** Column headers (days) */
  classes: string[]
  /** Flat list of cell data; indexed by periodId+day */
  assignments: TimetableAssignment[]
  /** When true, drag handlers and assignment actions are disabled */
  readOnly?: boolean
  /** Called when a cell is clicked in editable mode */
  onAssign?: (periodId: string, classId: string) => void
}

// ─── Default subject colour palette ──────────────────────────────────────────
const DEFAULT_SUBJECT_COLORS: Record<string, string> = {
  Math:          "bg-[var(--ef-brand-light)] text-primary border-primary/20",
  Mathematics:   "bg-[var(--ef-brand-light)] text-primary border-primary/20",
  English:       "bg-[var(--ef-green-light)] text-[var(--ef-green-dark)] border-[var(--ef-green)]/20",
  Science:       "bg-[var(--ef-amber-light)] text-warning-foreground border-[var(--ef-amber)]/20",
  Hindi:         "bg-[var(--ef-purple-light)] text-[var(--ef-purple)] border-[var(--ef-purple)]/20",
  Physics:       "bg-[var(--ef-cyan-light)] text-[var(--ef-cyan)] border-[var(--ef-cyan)]/20",
  PE:            "bg-[var(--ef-red-light)] text-[var(--ef-red-dark)] border-destructive/20",
  "Phys. Ed":    "bg-[var(--ef-red-light)] text-[var(--ef-red-dark)] border-destructive/20",
  SSt:           "bg-[var(--ef-amber-light)] text-warning-foreground border-[var(--ef-amber)]/20",
  "Social Studies": "bg-[var(--ef-purple-light)] text-[var(--ef-purple)] border-[var(--ef-purple)]/20",
  Sanskrit:      "bg-[var(--ef-amber-light)] text-warning-foreground border-[var(--ef-amber)]/20",
  EVS:           "bg-[var(--ef-green-light)] text-[var(--ef-green-dark)] border-[var(--ef-green)]/20",
  Assamese:      "bg-[var(--ef-cyan-light)] text-[var(--ef-cyan)] border-[var(--ef-cyan)]/20",
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TimetableGrid({
  periods,
  classes,
  assignments,
  readOnly = false,
  onAssign,
}: TimetableGridProps) {
  // Build a lookup: periodId → day → assignment
  const lookup = new Map<string, TimetableAssignment>()
  for (const a of assignments) {
    lookup.set(`${a.periodId}::${a.day}`, a)
  }

  const today = new Date().toLocaleDateString("en-IN", { weekday: "short" })
  const todayIdx = classes.findIndex(d =>
    d.toLowerCase().startsWith(today.toLowerCase().slice(0, 3)),
  )

  return (
    <TooltipProvider>
      <CardContent className="p-0 overflow-x-auto">
        <Table className="text-xs">
          <caption className="sr-only">Weekly timetable by period and day</caption>
          <TableHeader>
            <TableRow className="bg-muted/40 border-border hover:bg-transparent">
              <TableHead className="text-left px-4 py-3 font-semibold text-muted-foreground w-24 h-auto">
                Period
              </TableHead>
              {classes.map((col, i) => (
                <TableHead
                  key={col}
                  className={`px-2 py-3 text-center font-semibold text-muted-foreground min-w-[110px] h-auto ${
                    i === todayIdx ? "text-primary" : ""
                  }`}
                >
                  {col}
                  {i === todayIdx && (
                    <span className="ml-1 text-[9px] font-normal">(Today)</span>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {periods.map((period, rowIdx) => {
              if (period.isBreak) {
                return (
                  <TableRow key={period.id} className="border-border bg-muted/40 hover:bg-muted/40">
                    <TableCell className="px-4 py-2">
                      <p className="font-bold text-muted-foreground text-[10px]">
                        {period.label ?? period.id}
                      </p>
                      {period.time && (
                        <p className="text-[9px] text-muted-foreground/70">{period.time}</p>
                      )}
                    </TableCell>
                    {classes.map(col => (
                      <TableCell
                        key={col}
                        className="px-2 py-2 text-center text-xs text-muted-foreground italic"
                      >
                        Break
                      </TableCell>
                    ))}
                  </TableRow>
                )
              }

              return (
                <TableRow
                  key={period.id}
                  className={`border-border hover:bg-transparent ${rowIdx % 2 === 0 ? "" : "bg-muted/10"}`}
                >
                  {/* Period label cell */}
                  <TableCell className="px-4 py-2.5">
                    <p className="font-semibold text-xs">{period.label ?? period.id}</p>
                    {period.time && (
                      <p className="text-[10px] text-muted-foreground">{period.time}</p>
                    )}
                  </TableCell>

                  {/* Data cells */}
                  {classes.map((col, colIdx) => {
                    const cell = lookup.get(`${period.id}::${col}`)
                    const isToday = colIdx === todayIdx
                    const colorCls =
                      cell?.colorClass ??
                      (cell ? DEFAULT_SUBJECT_COLORS[cell.subject] ?? "bg-muted text-foreground border-border" : "")

                    if (!cell) {
                      return (
                        <TableCell
                          key={col}
                          onClick={() =>
                            !readOnly && onAssign ? onAssign(period.id, col) : undefined
                          }
                          className={`px-1.5 py-1.5 ${
                            !readOnly && onAssign ? "cursor-pointer hover:bg-muted/30" : ""
                          } ${isToday ? "bg-primary/5" : ""}`}
                        >
                          <span className="text-muted-foreground/30 text-[10px] flex justify-center">
                            {readOnly ? "—" : "Free"}
                          </span>
                        </TableCell>
                      )
                    }

                    return (
                      <TableCell
                        key={col}
                        className={`px-1.5 py-1.5 ${isToday ? "bg-primary/5" : ""}`}
                        onClick={() =>
                          !readOnly && onAssign ? onAssign(period.id, col) : undefined
                        }
                      >
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={`rounded-md border px-2 py-1.5 text-center ${
                                !readOnly && onAssign ? "cursor-pointer" : "cursor-default"
                              } ${colorCls}`}
                            >
                              <div className="font-semibold text-[11px] leading-tight">
                                {cell.subject}
                              </div>
                              {cell.teacher && (
                                <div className="text-[9px] opacity-70">
                                  {cell.teacher.split(" ")[0]}
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-medium">{cell.subject}</p>
                            {cell.teacher && (
                              <p className="text-xs text-muted-foreground">
                                Teacher: {cell.teacher}
                              </p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )
                  })}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
      <Separator />
      {/* Subject colour legend */}
      <div className="flex flex-wrap gap-2 p-4 text-xs">
        {Object.entries(DEFAULT_SUBJECT_COLORS)
          .filter(([, cls]) => assignments.some(a => DEFAULT_SUBJECT_COLORS[a.subject] === cls))
          .slice(0, 10)
          .map(([subj, cls]) => (
            <span
              key={subj}
              className={`px-2 py-1 rounded border font-medium ${cls}`}
            >
              {subj}
            </span>
          ))}
      </div>
    </TooltipProvider>
  )
}
