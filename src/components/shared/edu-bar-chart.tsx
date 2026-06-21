"use client"
/**
 * EduBarChart — shared recharts BarChart wrapper
 *
 * Behaviour:
 * - Hover: subtle gray background behind the hovered bar column
 * - Click: highlights selected bar via opacity (no border/outline)
 * - Responsive: proper margins so the first bar is never clipped
 * - Tooltip: card-styled, consistent across all pages
 */
import { useState, useCallback } from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EduBarSeries {
  dataKey: string
  name?: string
  /** CSS colour string — defaults to var(--primary) */
  color?: string
}

export interface EduBarChartProps {
  data: Record<string, string | number>[]
  series: EduBarSeries[]
  /** Key used for the X axis labels */
  xKey: string
  height?: number
  /** Y-axis value formatter, e.g. v => `${v}%` */
  yFormatter?: (v: number) => string
  /** Tooltip value formatter */
  tooltipFormatter?: (value: number, name: string) => string
  /** Show Y axis — defaults to true */
  showYAxis?: boolean
  /** Y axis domain */
  domain?: [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"]
  className?: string
}

// ── Tooltip ───────────────────────────────────────────────────────────────────

function BarTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: Array<{ value: number; name?: string; color?: string }>
  label?: string
  formatter?: (value: number, name: string) => string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md text-xs min-w-[100px]">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span
            className="size-2 rounded-sm flex-shrink-0"
            style={{ background: p.color ?? "var(--primary)" }}
          />
          <span className="text-muted-foreground flex-1">{p.name ?? "Value"}:</span>
          <span className="font-bold text-foreground">
            {formatter ? formatter(p.value, p.name ?? "") : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

// ── Cursor (hover bg) ─────────────────────────────────────────────────────────

function HoverCursor(props: {
  x?: number; y?: number; width?: number; height?: number
}) {
  const { x = 0, y = 0, width = 0, height = 0 } = props
  return (
    <rect
      x={x - 4}
      y={0}
      width={width + 8}
      height={height + y}
      rx={4}
      fill="currentColor"
      className="text-muted/60 dark:text-muted/40"
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function EduBarChart({
  data,
  series,
  xKey,
  height = 160,
  yFormatter,
  tooltipFormatter,
  showYAxis = true,
  domain,
  className,
}: EduBarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const handleClick = useCallback((_: unknown, index: number) => {
    setActiveIndex(prev => (prev === index ? null : index))
  }, [])

  return (
    <div className={cn("w-full min-w-0 outline-none", className)}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 8, left: showYAxis ? 0 : -32, bottom: 0 }}
          barCategoryGap="28%"
          barGap={4}
          style={{ outline: "none" }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border)"
            vertical={false}
          />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            // padding ensures the first/last bar aren't pressed against the edge
            padding={{ left: 8, right: 8 }}
          />
          {showYAxis ? (
            <YAxis
              domain={domain}
              tickFormatter={yFormatter}
              tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              axisLine={false}
              tickLine={false}
              width={yFormatter ? 44 : 32}
            />
          ) : (
            <YAxis hide />
          )}
          <Tooltip
            cursor={<HoverCursor />}
            content={
              <BarTooltip formatter={tooltipFormatter} />
            }
          />

          {series.map(s => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name ?? s.dataKey}
              fill={s.color ?? "var(--primary)"}
              radius={[4, 4, 0, 0]}
              onClick={handleClick}
              style={{ cursor: "pointer", outline: "none" }}
              isAnimationActive={false}
            >
              {data.map((_, i) => {
                const isSelected = activeIndex === i
                const baseColor = s.color ?? "var(--primary)"
                return (
                  <Cell
                    key={i}
                    fill={baseColor}
                    fillOpacity={isSelected ? 1 : 0.75}
                    stroke="transparent"
                    strokeWidth={0}
                  />
                )
              })}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
