"use client"

import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { PERIODS } from "@/data/periods"
import { cn } from "@/lib/utils"

interface CountdownTimerProps {
  /** Optional explicit target (ISO or HH:MM) — overrides period calc. */
  target?: string
  /** Label shown next to the timer (e.g. "Next period", "Exam starts in"). */
  label?: string
  className?: string
  /** Compact variant for inline use inside cards. */
  compact?: boolean
}

function parseTimeToToday(timeStr: string): Date {
  const today = new Date()
  const target = new Date(today)
  const isISO = timeStr.includes("T")
  if (isISO) {
    return new Date(timeStr)
  }
  const [h, m] = timeStr.split(":").map(Number)
  target.setHours(h, m, 0, 0)
  return target
}

/**
 * Live HH:MM:SS countdown to the next upcoming period (or a custom target).
 * Used on the management morning-briefing dashboard and parent exam countdown.
 */
export function CountdownTimer({
  target,
  label = "Next period in",
  className,
  compact = false,
}: CountdownTimerProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Determine target moment
  const targetTime = (() => {
    if (target) return parseTimeToToday(target)
    // Find the next period whose start is still ahead of now
    const upcoming = PERIODS.find(p => parseTimeToToday(p.startTime).getTime() > now.getTime())
    // If none today, countdown to end of day / tomorrow P1
    if (!upcoming) {
      const eod = new Date(now)
      eod.setHours(23, 59, 59, 0)
      return eod
    }
    return parseTimeToToday(upcoming.startTime)
  })()

  const diffMs = Math.max(0, targetTime.getTime() - now.getTime())
  const totalSecs = Math.floor(diffMs / 1000)
  const hours = Math.floor(totalSecs / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const secs = totalSecs % 60
  const pad = (n: number) => String(n).padStart(2, "0")

  const upcoming = PERIODS.find(p => parseTimeToToday(p.startTime).getTime() > now.getTime())
  const display = hours > 0
    ? `${pad(hours)}:${pad(mins)}:${pad(secs)}`
    : `${pad(mins)}:${pad(secs)}`

  if (compact) {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs font-mono font-semibold tabular-nums", className)}>
        <Clock className="size-3.5 text-primary" />
        {display}
      </span>
    )
  }

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
        <Clock className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {label}{upcoming ? ` · ${upcoming.id}` : ""}
        </p>
        <p className="text-2xl font-black tabular-nums tracking-tight text-foreground leading-none mt-0.5">
          {display}
        </p>
      </div>
    </div>
  )
}
