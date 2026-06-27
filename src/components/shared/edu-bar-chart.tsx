"use client"
/**
 * EduBarChart — shared recharts BarChart wrapper
 *
 * Behaviour:
 * - Hover: subtle gray background behind the hovered bar column
 * - Click: highlights selected bar via opacity (no border/outline)
 * - Responsive: proper margins so the first bar is never clipped
 * - Tooltip: card-styled, consistent across all pages
 * - fluid=true: fills parent height (use inside flex-1 containers)
 * - showLabels=true: renders value labels above each bar
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
  LabelList,
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
  /** Fixed pixel height — ignored when fluid=true */
  height?: number
  /** When true the chart fills its parent's height (use inside flex-1 wrapper with min-h-0) */
  fluid?: boolean
  /** Y-axis value formatter, e.g. v => `${v}%` */
  yFormatter?: (v: number) => string
  /** Tooltip value formatter */
  tooltipFormatter?: (value: number, name: string) => string
  /** Show Y axis — defaults to true */
  showYAxis?: boolean
  /** Render value labels above each bar — defaults to false */
  showLabels?: boolean
  /** Y axis domain */
  domain?: [number | "auto" | "dataMin" | "dataMax", number | "auto" | "dataMin" | "dataMax"]
  /**
   * When true the chart becomes horizontally scrollable: each category keeps at
   * least `minCategoryWidth` px so bars are never squished and the first/last
   * bars always keep their padding. Users can slide left↔right to see all bars.
   */
  scrollable?: boolean
  /** Minimum px width reserved per category when scrollable — defaults to 64 */
  minCategoryWidth?: number
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
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-card text-xs min-w-[100px]">
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
  fluid = false,
  yFormatter,
  tooltipFormatter,
  showYAxis = true,
  showLabels = false,
  domain,
  scrollable = false,
  minCategoryWidth = 64,
  className,
}: EduBarChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const handleClick = useCallback((_: unknown, index: number) => {
    setActiveIndex(prev => (prev === index ? null : index))
  }, [])

  // Width reserved by the Y axis (or its hidden placeholder) so the scroll
  // min-width keeps the first bar clear of the axis gutter.
  const yAxisWidth = showYAxis ? (yFormatter ? 44 : 32) : 0
  // When scrollable, force a min content width so bars keep a fixed size and
  // the first bar always retains its left padding instead of clipping.
  const scrollMinWidth = scrollable
    ? data.length * minCategoryWidth + yAxisWidth
    : undefined

  const chart = (
    <BarChart
      data={data}
      margin={{
        top: showLabels ? 20 : 8,
        right: 8,
        // Avoid the aggressive negative gutter when scrollable so the first
        // bar is never pushed under the container edge.
        left: showYAxis ? 0 : scrollable ? 8 : -32,
        bottom: 0,
      }}
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
          {showLabels && (
            <LabelList
              dataKey={s.dataKey}
              position="top"
              style={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 600 }}
            />
          )}
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
  )

  return (
    <div className={cn("w-full min-w-0 outline-none", fluid ? "h-full" : "", className)}>
      <div
        className={cn(
          scrollable && "overflow-x-auto overflow-y-hidden",
          fluid && "h-full"
        )}
      >
        <div style={{ minWidth: scrollMinWidth, height: fluid ? "100%" : height }}>
          <ResponsiveContainer width="100%" height={fluid ? "100%" : height}>
            {chart}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
