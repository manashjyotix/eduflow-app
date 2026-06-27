"use client"

import { Bus, MapPin, ShieldCheck, Clock, Phone } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LiveRouteMap } from "@/components/domain/transport/LiveRouteMap"
import { useTransport } from "@/context/transport-context"
import { STUDENT_TRANSPORT, getRoute, getVehicle } from "@/data/mock-transport"

/** Demo child + parent personas. */
const CHILD_ID = "s1"
const PARENT_NAME = "Pankaj Das"

export default function ParentTransportPage() {
  const { tripForStudent, acceptDrop } = useTransport()

  const st = STUDENT_TRANSPORT.find(s => s.studentId === CHILD_ID)
  const trip = tripForStudent(CHILD_ID)
  const route = st ? getRoute(st.routeId) : undefined

  if (!st || !route || !trip) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
        <PageHeader icon={<Bus size={20} />} title="Bus Tracking" subtitle="Live location of your child's school bus" />
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No transport assigned to your child.</CardContent></Card>
      </div>
    )
  }

  const vehicle = getVehicle(trip.vehicleId)
  const childStop = route.stops.find(s => s.seq === st.stopSeq)
  const reachedChildStop = trip.reachedSeqs.includes(st.stopSeq)
  const handshakeDone = trip.handshakes.some(h => h.studentId === CHILD_ID)

  const statusLabel =
    trip.status === "idle" ? "Not started yet"
      : trip.status === "completed" ? "Route completed"
      : reachedChildStop ? "At your stop" : "On the way"

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Bus size={20} />}
        title="Bus Tracking"
        subtitle={`${st.studentName} · ${route.name}`}
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bus className="size-4 text-primary" /> {vehicle?.label}
            <Badge variant={trip.status === "running" ? "success" : trip.status === "completed" ? "secondary" : "warning"}>
              {statusLabel}
            </Badge>
          </CardTitle>
          {vehicle && (
            <a href={`tel:${vehicle.driverPhone}`} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
              <Phone className="size-4" /> {vehicle.driverName}
            </a>
          )}
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-col gap-4 pt-4">
          <LiveRouteMap trip={trip} highlightStopSeq={st.stopSeq} />

          <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
            <MapPin className="size-4 text-[var(--ef-red)]" />
            <span className="font-medium">Your stop: {childStop?.name}</span>
            <span className="text-muted-foreground">·</span>
            <Clock className="size-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              {reachedChildStop ? "Bus has arrived" : `Planned ${childStop?.plannedTime}`}
            </span>
          </div>

          {/* Safety handshake */}
          {handshakeDone ? (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--ef-green)]/30 bg-[var(--ef-green-light)] px-3 py-2.5 text-sm text-[var(--ef-green-dark)]">
              <ShieldCheck className="size-4" /> You confirmed {st.studentName} was received. School has been notified.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                disabled={!reachedChildStop}
                onClick={() => acceptDrop(CHILD_ID, PARENT_NAME)}
                className="bg-success hover:bg-success/90 text-success-foreground"
              >
                <ShieldCheck className="size-4 mr-1" />
                {reachedChildStop ? "Confirm child received" : "Available when bus reaches your stop"}
              </Button>
              <p className="text-xs text-muted-foreground">
                When the bus reaches your stop, tap to confirm you received your child. This notifies the school that the child is safe.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
