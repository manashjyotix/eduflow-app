"use client"

import { Bus, MapPin, Users, Clock } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  getVehicleForDriver, getRoute, STUDENT_TRANSPORT, DEMO_DRIVER_ID,
} from "@/data/mock-transport"

export default function DriverRoutePage() {
  const vehicle = getVehicleForDriver(DEMO_DRIVER_ID)
  const route = vehicle ? getRoute(vehicle.routeId) : undefined

  if (!vehicle || !route) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
        <PageHeader icon={<Bus size={20} />} title="My Route" subtitle="No route assigned" />
      </div>
    )
  }

  const riders = STUDENT_TRANSPORT.filter(s => s.routeId === route.id)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Bus size={20} />}
        title="My Route"
        subtitle={`${vehicle.label} · ${vehicle.regNo} · ${route.name}`}
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><MapPin className="size-4 text-primary" /> Stops</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {route.stops.map(stop => {
              const dropHere = riders.filter(r => r.stopSeq === stop.seq)
              return (
                <li key={stop.seq} className="flex items-center gap-3 px-4 py-3">
                  <div className="size-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold shrink-0">{stop.seq}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{stop.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="size-3" /> {stop.plannedTime}</p>
                  </div>
                  {dropHere.length > 0 && (
                    <Badge variant="outline" className="text-[10px]">{dropHere.length} drop{dropHere.length > 1 ? "s" : ""}</Badge>
                  )}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Users className="size-4 text-primary" /> Students on this route ({riders.length})</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {riders.map(r => {
              const stop = route.stops.find(s => s.seq === r.stopSeq)
              return (
                <li key={r.studentId} className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm font-medium">{r.studentName}</span>
                  <span className="text-xs text-muted-foreground">{stop?.name}</span>
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
