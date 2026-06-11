import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KpiCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: { value: number; label?: string }
  className?: string
  iconClassName?: string
}

export function KpiCard({ title, value, subtitle, icon, trend, className, iconClassName }: KpiCardProps) {
  const trendPositive = trend && trend.value > 0
  const trendNeutral  = trend && trend.value === 0

  return (
    <Card className={cn("", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1 min-w-0 flex-1">
            <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center gap-1 text-xs font-medium",
                trendPositive ? "text-success-foreground" : trendNeutral ? "text-muted-foreground" : "text-destructive"
              )}>
                {trendPositive ? <TrendingUp className="size-3" /> : trendNeutral ? <Minus className="size-3" /> : <TrendingDown className="size-3" />}
                <span>{Math.abs(trend.value)}%{trend.label ? ` ${trend.label}` : ""}</span>
              </div>
            )}
          </div>
          {icon && (
            <div className={cn("rounded-lg p-2 bg-primary/10 text-primary flex-shrink-0", iconClassName)}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
