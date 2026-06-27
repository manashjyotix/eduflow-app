"use client"

/**
 * HazardAlertCard — a single disaster/hazard alert.
 *
 * Always shows: type + severity, distance from school, issued time, the full
 * description, the official source link (for verification — alerts are
 * advisory, never authoritative), and an acknowledge action for live alerts.
 */

import { MapPin, Clock, Check, Info } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  type HazardAlert,
  HAZARD_TYPE_LABEL,
  HAZARD_TYPE_EMOJI,
  HAZARD_SEVERITY_LABEL,
  HAZARD_SEVERITY_CLASS,
  HAZARD_SEVERITY_COLOR,
  isAlertLive,
  timeAgo,
} from "@/data/mock-hazard-alerts"

interface HazardAlertCardProps {
  alert: HazardAlert
  onAcknowledge?: (id: string) => void
  className?: string
}

export function HazardAlertCard({ alert, onAcknowledge, className }: HazardAlertCardProps) {
  const live = isAlertLive(alert)
  const accent = HAZARD_SEVERITY_COLOR[alert.severity]

  return (
    <Card
      className={cn(
        "overflow-hidden border-l-4 transition-shadow hover:shadow-card",
        !live && "opacity-75",
        className
      )}
      style={{ borderLeftColor: accent }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)` }}
            aria-hidden
          >
            {HAZARD_TYPE_EMOJI[alert.type]}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={cn("text-[10px] font-semibold", HAZARD_SEVERITY_CLASS[alert.severity])}
              >
                {HAZARD_SEVERITY_LABEL[alert.severity]}
              </Badge>
              <Badge variant="secondary" className="text-[10px]">
                {HAZARD_TYPE_LABEL[alert.type]}
              </Badge>
              {alert.status === "acknowledged" && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Acknowledged
                </Badge>
              )}
              {alert.status === "expired" && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground">
                  Expired
                </Badge>
              )}
            </div>

            <h3 className="mt-1.5 text-sm font-semibold leading-snug text-foreground">
              {alert.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {alert.description}
            </p>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3" />
                {alert.location.label}
                {alert.distanceKm > 0 && ` · ${alert.distanceKm} km away`}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-3" />
                {timeAgo(alert.issuedAt)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {live && onAcknowledge && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-[11px]"
                  onClick={() => onAcknowledge(alert.id)}
                >
                  <Check className="size-3" />
                  Acknowledge
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

/** Compact disclaimer shown once at the top of the alerts surfaces. */
export function HazardDisclaimer({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 rounded-lg bg-muted/50 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground",
        className
      )}
    >
      <Info className="mt-0.5 size-3.5 shrink-0" />
      <span>
        Alert information is aggregated from public monitoring services for
        awareness only and may be delayed or incomplete. Always follow official
        government advisories and local authorities for safety decisions.
      </span>
    </p>
  )
}
