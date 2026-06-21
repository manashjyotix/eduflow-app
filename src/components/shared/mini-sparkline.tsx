"use client"
/**
 * MiniSparkline — inline mini charts for KPI cards
 * Variants: line (smooth SVG line), bar (grouped bars), arc (progress donut)
 * Ported from src/scholaris/components/MiniSparkline.tsx concept
 */
import * as React from "react"
import { cn } from "@/lib/utils"

interface SparklineBaseProps {
  color?: string
  width?: number
  height?: number
  className?: string
}

/** Neutral gray used to render an "empty / no data" state across all variants. */
const EMPTY_COLOR = "var(--muted-foreground)"

/** A series is considered empty when there are no points or every value is 0. */
function isEmptySeries(data: number[]) {
  return !data.length || data.every(v => !v)
}

// ─── Line sparkline ───────────────────────────────────────────────────────────

interface LineSparklineProps extends SparklineBaseProps {
  variant: "line"
  data: number[]
}

function LineSparkline({ data, color = "var(--ef-brand)", width = 80, height = 32, className }: LineSparklineProps) {
  // Empty → flat dashed gray baseline through the middle.
  if (isEmptySeries(data)) {
    const midY = height / 2
    return (
      <svg width={width} height={height} className={cn("overflow-visible", className)} role="img" aria-label="No data">
        <line
          x1={2} y1={midY} x2={width - 2} y2={midY}
          stroke={EMPTY_COLOR} strokeWidth={1.5} strokeLinecap="round"
          strokeDasharray="3 3" strokeOpacity={0.4}
        />
      </svg>
    )
  }
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const padX = 2
  const padY = 2
  const w = width - padX * 2
  const h = height - padY * 2
  const pts = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * w
    const y = padY + h - ((v - min) / range) * h
    return `${x},${y}`
  })
  const d = `M ${pts.join(" L ")}`
  return (
    <svg width={width} height={height} className={cn("overflow-visible", className)} aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Bar sparkline ────────────────────────────────────────────────────────────

interface BarSparklineProps extends SparklineBaseProps {
  variant: "bar"
  data: number[]
}

function BarSparkline({ data, color = "var(--ef-brand)", width = 80, height = 32, className }: BarSparklineProps) {
  if (!data.length) return null
  const empty = isEmptySeries(data)
  // Empty → faint gray baseline stubs so the slot still reads as a chart.
  if (empty) {
    const count = data.length || 6
    const barW = (width / count) - 2
    const stubH = 3
    return (
      <svg width={width} height={height} className={cn("overflow-visible", className)} role="img" aria-label="No data">
        {Array.from({ length: count }).map((_, i) => (
          <rect
            key={i}
            x={i * (barW + 2)}
            y={height - stubH}
            width={barW}
            height={stubH}
            rx={2}
            fill={EMPTY_COLOR}
            fillOpacity={0.3}
          />
        ))}
      </svg>
    )
  }
  const max = Math.max(...data) || 1
  const barW = (width / data.length) - 2
  return (
    <svg width={width} height={height} className={cn("overflow-visible", className)} aria-hidden>
      {data.map((v, i) => {
        const barH = (v / max) * height
        return (
          <rect
            key={i}
            x={i * (barW + 2)}
            y={height - barH}
            width={barW}
            height={barH}
            rx={2}
            fill={color}
            fillOpacity={0.85}
          />
        )
      })}
    </svg>
  )
}

// ─── Arc (donut progress) sparkline ──────────────────────────────────────────

interface ArcSparklineProps extends SparklineBaseProps {
  variant: "arc"
  value: number        // 0–100
  trackColor?: string
}

function ArcSparkline({ value, color = "var(--ef-brand)", trackColor = "var(--border)", width = 40, height = 40, className }: ArcSparklineProps) {
  const empty = !value || value <= 0
  const r = (Math.min(width, height) / 2) - 4
  const circ = 2 * Math.PI * r
  const offset = circ - (Math.min(100, Math.max(0, value)) / 100) * circ
  const cx = width / 2
  const cy = height / 2
  return (
    <svg
      width={width} height={height}
      className={cn("-rotate-90 overflow-visible", className)}
      {...(empty ? { role: "img", "aria-label": "No data" } : { "aria-hidden": true })}
    >
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={3} />
      {empty ? (
        // Empty → a faint gray dashed ring instead of a progress arc.
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={EMPTY_COLOR} strokeWidth={3}
          strokeOpacity={0.3} strokeDasharray="3 4"
        />
      ) : (
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      )}
    </svg>
  )
}

// ─── Unified export ───────────────────────────────────────────────────────────

export type MiniSparklineProps =
  | LineSparklineProps
  | BarSparklineProps
  | ArcSparklineProps

export function MiniSparkline(props: MiniSparklineProps) {
  if (props.variant === "line") return <LineSparkline {...props} />
  if (props.variant === "bar")  return <BarSparkline  {...props} />
  if (props.variant === "arc")  return <ArcSparkline  {...props} />
  return null
}
