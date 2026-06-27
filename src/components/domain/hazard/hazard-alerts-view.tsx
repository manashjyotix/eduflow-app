"use client"

/**
 * HazardAlertsView — the full Disaster & Hazard Alerts page body, shared by
 * every role's /alerts route. Sections:
 *   1. Source / status strip (live vs. demo, school location, refresh)
 *   2. Active alerts (live, severity-sorted) with acknowledge
 *   3. Acknowledged + expired history
 *   4. Disclaimer + feed legend
 */

import {
  ShieldAlert,
  RefreshCw,
  Radio,
  ShieldCheck,
  History,
  MapPin,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useHazardAlerts } from "@/context/hazard-alert-context"
import {
  HazardAlertCard,
  HazardDisclaimer,
} from "@/components/domain/hazard/hazard-alert-card"
import { SCHOOL_LOCATION } from "@/data/mock-hazard-alerts"


export function HazardAlertsView() {
  const { alerts, liveAlerts, activeCount, isLive, loading, acknowledge, refresh } =
    useHazardAlerts()

  const history = alerts.filter(
    (a) => a.status === "acknowledged" || a.status === "expired"
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<ShieldAlert size={22} />}
        title="Disaster & Hazard Alerts"
        subtitle="Live earthquake, flood, storm & air-quality alerts near the school"
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={!isLive || loading}
            className="gap-1.5"
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {/* ═══ Source / status strip ═══ */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-3 text-xs">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Radio
            className={cn(
              "size-3.5",
              isLive ? "text-[var(--ef-green)]" : "text-muted-foreground"
            )}
          />
          {isLive ? "Live feeds" : "Demo data"}
        </span>
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="size-3.5" />
          {SCHOOL_LOCATION.label}
        </span>
      </div>

      {/* ═══ Active alerts ═══ */}
      <div>
        <div className="mb-3 flex items-center gap-2">
          <ShieldAlert className="size-4 text-[var(--ef-red)]" />
          <h2 className="text-sm font-semibold">Active Alerts</h2>
          {activeCount > 0 && (
            <Badge variant="destructive" className="animate-pulse text-[10px]">
              {activeCount} Active
            </Badge>
          )}
        </div>
        {liveAlerts.length > 0 ? (
          <div className="flex flex-col gap-3">
            {liveAlerts.map((alert) => (
              <HazardAlertCard
                key={alert.id}
                alert={alert}
                onAcknowledge={acknowledge}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<ShieldCheck className="size-6" />}
            title="No active alerts"
            description="There are no active hazard alerts near the school right now. We'll surface earthquakes, floods, storms and air-quality alerts here as they're detected."
            className="py-10"
          />
        )}
      </div>

      {/* ═══ History ═══ */}
      {history.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <History className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Acknowledged & Past Alerts</h2>
            <Badge variant="secondary" className="text-[10px]">
              {history.length}
            </Badge>
          </div>
          <div className="flex flex-col gap-3">
            {history.map((alert) => (
              <HazardAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        </div>
      )}

      <HazardDisclaimer />
    </div>
  )
}
