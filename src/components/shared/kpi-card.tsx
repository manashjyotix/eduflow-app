"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"
import { MiniSparkline, type MiniSparklineProps } from "@/components/shared/mini-sparkline"
import { motion } from "motion/react"

/**
 * Icon tone — controls the icon chip background + foreground so the icon
 * fill is clearly visible in BOTH light and dark mode (issue #4).
 * Each tone maps to an EduFlow primitive whose *-light token becomes a
 * low-opacity tint in dark mode and whose *-dark token stays readable.
 */
export type KpiTone = "brand" | "green" | "amber" | "red" | "purple" | "cyan"

const TONE_STYLES: Record<KpiTone, string> = {
  brand:  "bg-[var(--ef-brand-light)]  text-[var(--ef-brand)]",
  green:  "bg-[var(--ef-green-light)]  text-[var(--ef-green-dark)]",
  amber:  "bg-[var(--ef-amber-light)]  text-[var(--ef-amber-dark)]",
  red:    "bg-[var(--ef-red-light)]    text-[var(--ef-red-dark)]",
  purple: "bg-[var(--ef-purple-light)] text-[var(--ef-purple)]",
  cyan:   "bg-[var(--ef-cyan-light)]   text-[var(--ef-cyan)]",
}

const TONE_SPARK: Record<KpiTone, string> = {
  brand:  "var(--ef-brand)",
  green:  "var(--ef-green)",
  amber:  "var(--ef-amber)",
  red:    "var(--ef-red)",
  purple: "var(--ef-purple)",
  cyan:   "var(--ef-cyan)",
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
  /** Override icon container styling entirely (takes precedence over `tone`). */
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
  tone = "brand",
  iconClassName,
  noMotion,
}: KpiCardProps) {
  const trendPositive = trend && trend.value > 0
  const trendNeutral  = trend && trend.value === 0

  // Default the sparkline color to the card tone when none is supplied.
  const resolvedSparkline = sparkline
    ? ({ color: TONE_SPARK[tone], ...sparkline } as MiniSparklineProps)
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
                  className={cn(
                    "rounded-xl p-2 sm:p-2.5",
                    iconClassName ?? TONE_STYLES[tone],
                  )}
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
