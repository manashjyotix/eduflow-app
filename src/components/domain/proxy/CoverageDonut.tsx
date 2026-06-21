"use client"

/**
 * CoverageDonut — domain component for proxy coverage visualization.
 * Renders an SVG donut/ring chart showing the percentage of absence
 * periods that have been assigned a proxy teacher.
 *
 * Replaces the plain <Progress> bar on the proxy board with a richer
 * donut that supports the same data while keeping EduFlow semantic tokens.
 *
 * Requirements: 5.1, 5.2, 5.3
 */

import { cn } from "@/lib/utils"

export interface CoverageDonutProps {
  /** Number of periods with an accepted/assigned proxy */
  assigned: number
  /** Total absence periods to cover */
  total: number
  /** Optional extra className on the wrapper */
  className?: string
  /** Size of the donut in px (default 64) */
  size?: number
  /** Stroke width of the ring (default 8) */
  strokeWidth?: number
}

export function CoverageDonut({
  assigned,
  total,
  className,
  size = 64,
  strokeWidth = 8,
}: CoverageDonutProps) {
  const pct = total > 0 ? Math.round((assigned / total) * 100) : 100
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const filled = (pct / 100) * circumference
  const gap = circumference - filled

  // Color thresholds mirror the ProxyBoard progress bar logic
  const strokeColor =
    pct >= 80
      ? "var(--ef-green, #34C759)"
      : pct >= 50
      ? "var(--ef-amber, #FF9500)"
      : "var(--ef-red, #FF3B30)"

  const label = total === 0 ? "—" : `${pct}%`

  return (
    <div
      className={cn("flex items-center gap-3", className)}
      role="img"
      aria-label={`Coverage ${label} — ${assigned} of ${total} periods assigned`}
    >
      {/* SVG donut */}
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="-rotate-90"
          aria-hidden="true"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-muted/50"
          />
          {/* Fill */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${filled} ${gap}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.4s ease" }}
          />
        </svg>
        {/* Centre label */}
        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground"
          style={{ fontSize: size < 56 ? "10px" : "12px" }}
          aria-hidden="true"
        >
          {label}
        </span>
      </div>

      {/* Textual summary */}
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground leading-tight">
          {assigned} / {total}
          <span className="sr-only"> periods covered</span>
        </p>
        <p className="text-xs text-muted-foreground">periods covered</p>
      </div>
    </div>
  )
}
