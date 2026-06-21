"use client"

import { Clock } from "lucide-react"
import { TEACHING_PERIODS } from "@/data/periods"
import { cn } from "@/lib/utils"

interface PeriodPickerProps {
  /** Selected period IDs (e.g. ["P1", "P3"]). */
  value: string[]
  /** Called with the new selection whenever a chip is toggled. */
  onChange: (next: string[]) => void
  /** Show a "Full Day" quick-select toggle. Default true. */
  allowFullDay?: boolean
  className?: string
  /** Disable the whole control. */
  disabled?: boolean
}

/**
 * PeriodPicker — accessible multi-select P1–P7 period chip group.
 * Used by the teacher Apply Leave form and the admin Mark Absence dialog.
 * Each chip is a real <button> with aria-pressed for screen readers.
 */
export function PeriodPicker({
  value,
  onChange,
  allowFullDay = true,
  className,
  disabled = false,
}: PeriodPickerProps) {
  const allIds = TEACHING_PERIODS.map(p => p.id)
  const allSelected = allIds.every(id => value.includes(id))

  function toggle(id: string) {
    if (disabled) return
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }

  function toggleFullDay() {
    if (disabled) return
    onChange(allSelected ? [] : allIds)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {allowFullDay && (
        <button
          type="button"
          onClick={toggleFullDay}
          disabled={disabled}
          aria-pressed={allSelected}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold border transition-colors",
            allSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-accent",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Clock className="size-3" />
          {allSelected ? "Full Day ✓" : "Select All"}
        </button>
      )}
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Select periods">
        {TEACHING_PERIODS.map(p => {
          const selected = value.includes(p.id)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              disabled={disabled}
              aria-pressed={selected}
              title={`${p.label} · ${p.startTime}–${p.endTime}`}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors",
                selected
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:bg-accent",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {p.id}
              <span className="text-[9px] font-normal opacity-70">{p.startTime}</span>
            </button>
          )
        })}
      </div>
      {value.length > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {value.length} period{value.length > 1 ? "s" : ""} selected
        </p>
      )}
    </div>
  )
}
