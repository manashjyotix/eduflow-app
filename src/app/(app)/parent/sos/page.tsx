"use client"

/**
 * SOS Page — /parent/sos
 *
 * Premium emergency feature page for the parent portal.
 * Sections:
 *   1. Route Info Card — bus, driver, stops
 *   2. Emergency Contacts Bar — quick-dial cards
 *   3. SOS Trigger — the pulsing red emergency button
 *   4. Active Alerts — current/responded incidents for this child's route
 *   5. Past Incidents — resolved incidents
 */

import {
  ShieldAlert,
  Bus,
  Phone,
  ChevronRight,
  ShieldCheck,
  History,
  AlertTriangle,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { ChildTabs } from "@/components/shared/child-tabs"
import { EmptyState } from "@/components/shared/empty-state"
import { SOSTriggerButton } from "@/components/domain/sos/sos-trigger"
import { SOSIncidentCard } from "@/components/domain/sos/sos-incident-card"
import { useChild } from "@/context/child-context"
import { useSOS } from "@/context/sos-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  TRANSPORT_ROUTES,
  EMERGENCY_CONTACTS,
} from "@/data/mock-sos"

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function SOSPage() {
  const { selectedChild } = useChild()
  const { incidents } = useSOS()

  // Find the transport route for the selected child
  const route = TRANSPORT_ROUTES.find(
    (r) => r.id === selectedChild?.transportRoute
  )

  // Filter incidents for this child's route (from the live shared store)
  const routeIncidents = incidents.filter(
    (i) => i.routeId === selectedChild?.transportRoute
  )
  const activeAlerts = routeIncidents.filter(
    (i) => i.status === "active" || i.status === "responded"
  )
  const pastIncidents = routeIncidents.filter(
    (i) => i.status === "resolved"
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<ShieldAlert size={22} />}
        title="Transport Safety & SOS"
        subtitle={`Emergency alerts for ${selectedChild?.name ?? "your child"}'s transport route`}
      />

      <ChildTabs>
        <div className="flex flex-col gap-6">
          {/* ═══ Section 1 — Route Info ═══ */}
          <Card className="overflow-hidden border-0 bg-gradient-to-br from-[var(--ef-brand)]/5 via-background to-background">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bus className="size-4 text-[var(--ef-brand)]" />
                Transport Route
                {route && (
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {route.busNumber}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-4 space-y-4">
              {route ? (
                <>
                  {/* Driver info */}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{route.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Driver:{" "}
                        <span className="font-medium text-foreground">
                          {route.driver}
                        </span>
                      </p>
                    </div>
                    <a
                      href={`tel:${route.driverPhone}`}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-colors",
                        "bg-[var(--ef-green)] text-white hover:bg-[var(--ef-green-dark)]"
                      )}
                    >
                      <Phone className="size-3.5" />
                      Call Driver
                    </a>
                  </div>

                  {/* Route stops stepper */}
                  <div className="relative">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Route Stops
                    </p>
                    <div className="flex items-center gap-0 overflow-x-auto pb-2">
                      {route.stops.map((stop, i) => (
                        <div key={stop} className="flex items-center flex-shrink-0">
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className={cn(
                                "size-6 rounded-full flex items-center justify-center text-[9px] font-bold border-2 transition-colors",
                                i === 0
                                  ? "bg-[var(--ef-green)] border-[var(--ef-green)] text-white"
                                  : i === route.stops.length - 1
                                    ? "bg-[var(--ef-brand)] border-[var(--ef-brand)] text-white"
                                    : "bg-background border-muted-foreground/30 text-muted-foreground"
                              )}
                            >
                              {i + 1}
                            </div>
                            <span className="text-[9px] text-muted-foreground text-center max-w-[64px] leading-tight">
                              {stop}
                            </span>
                          </div>
                          {i < route.stops.length - 1 && (
                            <ChevronRight className="size-3 text-muted-foreground/40 mx-0.5 flex-shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No transport route assigned for this child.
                </p>
              )}
            </CardContent>
          </Card>

          {/* ═══ Section 2 — Emergency Contacts ═══ */}
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Phone className="size-3" />
              Emergency Contacts
            </h2>
            <div className="grid grid-cols-2 min-[480px]:grid-cols-3 md:grid-cols-5 gap-2">
              {EMERGENCY_CONTACTS.map((contact) => (
                <a
                  key={contact.id}
                  href={`tel:${contact.number}`}
                  className={cn(
                    "group relative flex flex-col items-center gap-1.5 rounded-xl border-2 border-transparent px-3 py-3 text-center transition-all",
                    "bg-card hover:shadow-card hover:border-[color:var(--ring-color)] hover:scale-[1.02] active:scale-[0.98]"
                  )}
                  style={
                    {
                      "--ring-color": contact.color,
                    } as React.CSSProperties
                  }
                >
                  <span className="text-2xl leading-none">{contact.icon}</span>
                  <span className="text-[11px] font-semibold text-foreground">
                    {contact.label}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {contact.number}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* ═══ Section 3 — SOS Trigger ═══ */}
          <div
            className={cn(
              "relative flex flex-col items-center gap-4 rounded-2xl py-12 px-6 overflow-hidden",
              "bg-gradient-to-b from-[var(--ef-red)]/5 via-[var(--ef-red)]/3 to-transparent"
            )}
          >
            {/* Radial gradient background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,59,48,0.06)_0%,transparent_70%)] pointer-events-none" />

            <SOSTriggerButton />

            <div className="relative z-10 mt-4 max-w-sm text-center space-y-1.5">
              <p className="text-xs font-semibold text-muted-foreground">
                When should you use SOS?
              </p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Use this emergency button if your child&apos;s school bus is
                involved in an accident, if there&apos;s a safety threat, a
                medical emergency, or any situation requiring immediate school
                and authority intervention.
              </p>
            </div>
          </div>

          {/* ═══ Section 4 — Active Alerts ═══ */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="size-4 text-[var(--ef-amber)]" />
              <h2 className="text-sm font-semibold">Active Alerts</h2>
              {activeAlerts.length > 0 && (
                <Badge
                  variant="destructive"
                  className="text-[10px] animate-pulse"
                >
                  {activeAlerts.length} Active
                </Badge>
              )}
            </div>
            {activeAlerts.length > 0 ? (
              <div className="flex flex-col gap-3">
                {activeAlerts.map((incident) => (
                  <SOSIncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ShieldCheck className="size-6" />}
                title="No active alerts"
                description="There are no active safety alerts on this route. Your child's transport is running normally."
                className="py-10"
              />
            )}
          </div>

          {/* ═══ Section 5 — Past Incidents ═══ */}
          {pastIncidents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <History className="size-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold">Past Incidents</h2>
                <Badge variant="secondary" className="text-[10px]">
                  {pastIncidents.length} Resolved
                </Badge>
              </div>
              <div className="flex flex-col gap-3">
                {pastIncidents.map((incident) => (
                  <SOSIncidentCard key={incident.id} incident={incident} />
                ))}
              </div>
            </div>
          )}
        </div>
      </ChildTabs>
    </div>
  )
}
