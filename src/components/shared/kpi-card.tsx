"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { MiniSparkline, type MiniSparklineProps } from "@/components/shared/mini-sparkline"
import { motion } from "motion/react"

/**
 * Icon tone — the SINGLE source of truth for the KPI icon chip color.
 *
 * Global rule (see globals.css `--ef-*` primitives):
 *   • The icon foreground uses the solid tone color.
 *   • The icon chip fill uses the SAME color at 10% transparency.
 * This keeps the icon and its background in the same hue family so they
 * complement each other, and guarantees a consistent, readable tint in both
 * light and dark mode. No other (15% / 20% / 25% / `-light`) fills are used.
 */
export type KpiTone = "brand" | "green" | "amber" | "red" | "purple" | "cyan" | "slate"

/** Base color per tone — used solid for the icon, at 25% for the chip fill. */
const TONE_COLOR: Record<KpiTone, string> = {
  brand:  "var(--ef-brand)",
  green:  "var(--ef-green)",
  amber:  "var(--ef-amber)",
  red:    "var(--ef-red)",
  purple: "var(--ef-purple)",
  cyan:   "var(--ef-cyan)",
  slate:  "var(--muted-foreground)",
}

/**
 * Resolve a tone from a legacy `iconClassName` color string so existing call
 * sites (e.g. `bg-success/10 text-success-foreground`) automatically adopt the
 * unified 25%-transparent style without per-page edits.
 */
function inferTone(cls?: string): KpiTone | undefined {
  if (!cls) return undefined
  if (/green|success|emerald/.test(cls))        return "green"
  if (/red|destructive|rose/.test(cls))         return "red"
  if (/amber|warning|orange|yellow/.test(cls))  return "amber"
  if (/purple|violet|indigo/.test(cls))         return "purple"
  if (/cyan|sky|teal/.test(cls))                return "cyan"
  if (/muted|slate|gray|grey/.test(cls))        return "slate"
  if (/primary|brand|blue/.test(cls))           return "brand"
  return undefined
}

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: { value: number; label?: string }
  sparkline?: MiniSparklineProps
  className?: string
  /** Color tone for the icon chip + default sparkline color. Defaults to "brand". */
  tone?: KpiTone
  /**
   * @deprecated Color is now owned by `tone` (25%-transparent fill). Kept for
   * backwards compatibility — a color tone is inferred from this value when
   * `tone` is not set. The raw classes are no longer applied to the chip.
   */
  iconClassName?: string
  /** Disable the entrance/hover motion (e.g. inside virtualized lists). */
  noMotion?: boolean
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  sparkline,
  className,
  tone,
  iconClassName,
  noMotion,
}: KpiCardProps) {
  const trendPositive = trend && trend.value > 0
  const trendNeutral  = trend && trend.value === 0

  // Explicit `tone` wins; otherwise infer from a legacy iconClassName; else brand.
  const resolvedTone: KpiTone = tone ?? inferTone(iconClassName) ?? "brand"
  const toneColor = TONE_COLOR[resolvedTone]

  // Default the sparkline color to the resolved tone when none is supplied.
  const resolvedSparkline = sparkline
    ? ({ color: toneColor, ...sparkline } as MiniSparklineProps)
    : undefined

  const MotionWrap = noMotion ? "div" : motion.div

  return (
    <MotionWrap
      {...(noMotion
        ? {}
        : {
            initial: { opacity: 0, y: 8 },
            animate: { opacity: 1, y: 0 },
            transition: { duration: 0.25, ease: "easeOut" },
            whileHover: { y: -2 },
          })}
      className="min-w-0 h-full"
    >
      <Card className={cn("min-w-0 h-full overflow-hidden", className)}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-2">
            {/* Left: text content */}
            <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
              <p className="text-[0.65rem] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                {title}
              </p>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight leading-tight truncate">
                {value}
              </p>
              {subtitle && (
                <p className="text-[0.7rem] sm:text-xs text-muted-foreground truncate">{subtitle}</p>
              )}
              {trend && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-xs font-medium",
                    trendPositive
                      ? "text-[var(--ef-green-dark)]"
                      : trendNeutral
                      ? "text-muted-foreground"
                      : "text-destructive",
                  )}
                >
                  {trendPositive ? (
                    <TrendingUp className="size-3 shrink-0" />
                  ) : trendNeutral ? (
                    <Minus className="size-3 shrink-0" />
                  ) : (
                    <TrendingDown className="size-3 shrink-0" />
                  )}
                  <span className="truncate">
                    {Math.abs(trend.value)}%
                    {trend.label ? ` ${trend.label}` : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Right: icon + sparkline */}
            <div className="flex flex-col items-end gap-2 flex-shrink-0 ml-2">
              {icon && (
                <div
                  className="rounded-xl p-2 sm:p-2.5"
                  style={{
                    // Same hue for icon + fill; fill is the tone color at 10%.
                    backgroundColor: `color-mix(in srgb, ${toneColor} 10%, transparent)`,
                    color: toneColor,
                  }}
                >
                  {icon}
                </div>
              )}
              {resolvedSparkline && <MiniSparkline {...resolvedSparkline} />}
            </div>
          </div>
        </CardContent>
      </Card>
    </MotionWrap>
  )
}
