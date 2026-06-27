"use client"

/**
 * FleetView  (Feature F7)
 *
 * Fleet tracking for Admin / Management: per-vehicle live map, trip controls
 * (start/stop — driver console stand-in for the demo), reached-stop checks, and
 * drop-handshake confirmations. Shared by /admin/transport and /management/transport.
 */

import { Bus, Play, CheckCircle2, ShieldCheck, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { KpiCard } from "@/components/shared/kpi-card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LiveRouteMap } from "@/components/domain/transport/LiveRouteMap"
import { useTransport } from "@/context/transport-context"
import { VEHICLES, getRoute } from "@/data/mock-transport"

function fmt(iso?: string) {
  return iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"
}

export function FleetView() {
  const { tripForVehicle, fleet } = useTransport()

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard title="Vehicles" value={fleet.total} subtitle="in fleet" icon={<Bus size={18} />} />
        <KpiCard title="En route" value={fleet.running} subtitle="currently moving" icon={<Play size={18} />} iconClassName="bg-success/10 text-success-foreground" />
        <KpiCard title="Completed" value={fleet.completed} subtitle="finished today" icon={<CheckCircle2 size={18} />} iconClassName="bg-primary/10 text-primary" />
        <KpiCard title="Idle" value={fleet.idle} subtitle="not started" icon={<Clock size={18} />} iconClassName="bg-warning/10 text-warning-foreground" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {VEHICLES.map(veh => {
          const trip = tripForVehicle(veh.id)
          const route = getRoute(veh.routeId)
          if (!trip || !route) return null
          const reachedCount = trip.reachedSeqs.length
          return (
            <Card key={veh.id}>
              <CardHeader className="flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bus className="size-4 text-primary" /> {veh.label}
                    <Badge
                      variant={trip.status === "running" ? "success" : trip.status === "completed" ? "secondary" : "warning"}
                      className="capitalize"
                    >
                      {trip.status === "running" ? "En route" : trip.status}
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">{route.name} · {veh.regNo} · {veh.driverName}</p>
                </div>
                <Badge variant="outline" className="gap-1 text-[11px]">
                  <Play className="size-3" /> Driver-controlled
                </Badge>
              </CardHeader>
              <Separator />
              <CardContent className="flex flex-col gap-3 pt-4">
                <LiveRouteMap trip={trip} heightClass="h-[clamp(16rem,38vh,28rem)]" />

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-muted-foreground">
                    Started {fmt(trip.startedAt)} · {reachedCount}/{route.stops.length} stops reached
                  </span>
                </div>

                {trip.handshakes.length > 0 && (
                  <div className="rounded-lg border border-[var(--ef-green)]/30 bg-[var(--ef-green-light)] p-2.5">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--ef-green-dark)]">
                      <ShieldCheck className="size-3.5" /> Children received safely
                    </p>
                    <ul className="mt-1 space-y-0.5">
                      {trip.handshakes.map(h => (
                        <li key={h.studentId} className="text-xs text-[var(--ef-green-dark)]">
                          {h.studentName} — by {h.acceptedBy} at {fmt(h.acceptedAt)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {VEHICLES.length === 0 && (
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No vehicles configured.</CardContent></Card>
      )}
    </div>
  )
}
