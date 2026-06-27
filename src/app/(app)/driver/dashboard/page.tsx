"use client"

import { toast } from "sonner"
import {
  Bus, Play, Square, MapPin, CheckCircle2, ShieldCheck, Navigation,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { LiveRouteMap } from "@/components/domain/transport/LiveRouteMap"
import { EmergencyContacts } from "@/components/domain/transport/EmergencyContacts"
import { useTransport } from "@/context/transport-context"
import {
  getVehicleForDriver, getRoute, getRouteRiders, DEMO_DRIVER_ID,
} from "@/data/mock-transport"
import { getStudent, type Student } from "@/data/students"

function fmt(iso?: string) {
  return iso ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"
}

export default function DriverDashboardPage() {
  const { tripForVehicle, startTrip, endTrip } = useTransport()

  const vehicle = getVehicleForDriver(DEMO_DRIVER_ID)
  const route = vehicle ? getRoute(vehicle.routeId) : undefined
  const trip = vehicle ? tripForVehicle(vehicle.id) : undefined

  const riders = route ? getRouteRiders(route.id) : []
  const riderStudents = riders
    .map(r => getStudent(r.studentId))
    .filter((s): s is Student => Boolean(s))
  const riderMeta = Object.fromEntries(
    riders.flatMap(r => (r.stopName ? [[r.studentId, `Drops at ${r.stopName}`]] : [])),
  )

  if (!vehicle || !route || !trip) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
        <PageHeader icon={<Bus size={20} />} title="My Trip" subtitle="No vehicle assigned" />
        <Card><CardContent className="py-10 text-center text-sm text-muted-foreground">No vehicle is assigned to you.</CardContent></Card>
      </div>
    )
  }

  const running = trip.status === "running"

  function handleStart() {
    startTrip(vehicle!.id)
    toast.success("Journey started", { description: "Parents on this route have been notified." })
  }
  function handleEnd() {
    endTrip(vehicle!.id)
    toast("Journey ended", { description: "Trip marked complete." })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Bus size={20} />}
        title="My Trip"
        subtitle={`${vehicle.label} · ${route.name}`}
        actions={
          running ? (
            <Button variant="destructive" onClick={handleEnd}>
              <Square className="size-4 mr-1" /> End journey
            </Button>
          ) : (
            <Button className="bg-success hover:bg-success/90 text-success-foreground" onClick={handleStart}>
              <Play className="size-4 mr-1" /> Start journey
            </Button>
          )
        }
      />

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Navigation className="size-4 text-primary" /> Live route
            <Badge variant={running ? "success" : trip.status === "completed" ? "secondary" : "warning"} className="capitalize">
              {running ? "En route" : trip.status}
            </Badge>
          </CardTitle>
          <span className="text-xs text-muted-foreground">Started {fmt(trip.startedAt)}</span>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <LiveRouteMap trip={trip} />
          <p className="mt-2 text-xs text-muted-foreground">
            Parents are notified automatically when you start and as you reach each stop.
          </p>
        </CardContent>
      </Card>

      {/* Emergency contacts for students on this route */}
      <EmergencyContacts
        students={riderStudents}
        metaByStudentId={riderMeta}
        title="Student Emergency Contacts"
        subtitle="Tap a number to call. Keep this handy for any emergency on the route."
      />

      {/* Stop checklist */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Stops</CardTitle></CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {route.stops.map(stop => {
              const reached = trip.reachedSeqs.includes(stop.seq)
              return (
                <li key={stop.seq} className="flex items-center gap-3 px-4 py-3">
                  {reached
                    ? <CheckCircle2 className="size-5 text-[var(--ef-green-dark)] shrink-0" />
                    : <MapPin className="size-5 text-muted-foreground shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{stop.name}</p>
                    <p className="text-xs text-muted-foreground">Planned {stop.plannedTime}</p>
                  </div>
                  {reached && <Badge variant="success" className="text-[10px]">Reached</Badge>}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      {/* Handshakes */}
      {trip.handshakes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="size-4 text-[var(--ef-green-dark)]" /> Children received by parents
            </CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="p-4">
            <ul className="space-y-1.5">
              {trip.handshakes.map(h => (
                <li key={h.studentId} className="text-sm">
                  <span className="font-medium">{h.studentName}</span>
                  <span className="text-muted-foreground"> — received by {h.acceptedBy} at {fmt(h.acceptedAt)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
