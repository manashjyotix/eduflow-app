"use client"

/**
 * HazardAlertBanner — global, dismissible strip shown at the top of every
 * authenticated page when a warning/emergency hazard alert is live.
 *
 * This is the "everyone gets notified" surface: it rides in the (app) layout so
 * staff, teachers, and parents all see the same active alert the moment it
 * fires. Dismissing it acknowledges the alert for this session.
 */

import { useState } from "react"
import Link from "next/link"
import { AlertTriangle, X, ChevronRight } from "lucide-react"
import { useHazardAlerts } from "@/context/hazard-alert-context"
import { useRole } from "@/context/role-context"
import { cn } from "@/lib/utils"
import {
  HAZARD_TYPE_EMOJI,
  HAZARD_SEVERITY_LABEL,
  HAZARD_SEVERITY_COLOR,
} from "@/data/mock-hazard-alerts"

/** Map role → its alerts route. */
const ALERTS_ROUTE: Record<string, string> = {
  admin:       "/admin/alerts",
  management:  "/management/alerts",
  teacher:     "/teacher/alerts",
  parent:      "/parent/alerts",
  super_admin: "/admin/alerts",
}

export function HazardAlertBanner() {
  const { bannerAlert, acknowledge } = useHazardAlerts()
  const { role } = useRole()
  const [hidden, setHidden] = useState(false)

  if (!bannerAlert || hidden) return null

  const accent = HAZARD_SEVERITY_COLOR[bannerAlert.severity]
  const href = ALERTS_ROUTE[role] ?? "/admin/alerts"
  const isEmergency = bannerAlert.severity === "emergency"

  return (
    <div
      role="alert"
      className={cn(
        "flex items-center gap-3 border-b px-4 py-2.5 text-sm",
        isEmergency ? "text-destructive-foreground" : "text-foreground"
      )}
      style={{
        backgroundColor: isEmergency
          ? accent
          : `color-mix(in srgb, ${accent} 14%, transparent)`,
        borderColor: `color-mix(in srgb, ${accent} 35%, transparent)`,
      }}
    >
      <AlertTriangle
        className={cn("size-4 shrink-0", isEmergency && "animate-pulse")}
        style={!isEmergency ? { color: accent } : undefined}
      />
      <span aria-hidden className="text-base leading-none">
        {HAZARD_TYPE_EMOJI[bannerAlert.type]}
      </span>
      <div className="min-w-0 flex-1">
        <span className="font-semibold uppercase tracking-wide text-[11px]">
          {HAZARD_SEVERITY_LABEL[bannerAlert.severity]}
        </span>
        <span className="mx-1.5 opacity-50">·</span>
        <span className="font-medium">{bannerAlert.title}</span>
      </div>

      <Link
        href={href}
        className={cn(
          "inline-flex shrink-0 items-center gap-0.5 rounded-md px-2 py-1 text-xs font-semibold transition-colors",
          isEmergency
            ? "bg-white/20 hover:bg-white/30"
            : "bg-background/60 hover:bg-background"
        )}
      >
        View
        <ChevronRight className="size-3.5" />
      </Link>

      <button
        type="button"
        onClick={() => {
          acknowledge(bannerAlert.id)
          setHidden(true)
        }}
        aria-label="Dismiss alert"
        className={cn(
          "shrink-0 rounded-md p-1 transition-colors",
          isEmergency ? "hover:bg-white/20" : "hover:bg-background/60"
        )}
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
