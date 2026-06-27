"use client"

/**
 * RouteMap  (Feature F7)
 *
 * Self-contained SVG map: draws a route's stop polyline and a moving vehicle
 * marker at the trip's simulated position. No external maps dependency — the
 * lat/lng → viewBox projection mirrors what a Google Maps overlay would show,
 * so this can be swapped for a real map later behind the same props.
 */

import { Bus, MapPin, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  getRoute, getVehicle, positionAlongRoute, type Trip,
} from "@/data/mock-transport"

const W = 320
const H = 200
const PAD = 24

function project(
  lat: number, lng: number,
  bounds: { minLat: number; maxLat: number; minLng: number; maxLng: number },
) {
  const spanLat = bounds.maxLat - bounds.minLat || 1
  const spanLng = bounds.maxLng - bounds.minLng || 1
  // lng → x, lat → y (north up: higher lat = smaller y)
  const x = PAD + ((lng - bounds.minLng) / spanLng) * (W - 2 * PAD)
  const y = PAD + ((bounds.maxLat - lat) / spanLat) * (H - 2 * PAD)
  return { x, y }
}

export function RouteMap({ trip, highlightStopSeq }: { trip: Trip; highlightStopSeq?: number }) {
  const route = getRoute(trip.routeId)
  const veh = getVehicle(trip.vehicleId)
  if (!route) return null

  const lats = route.stops.map(s => s.lat)
  const lngs = route.stops.map(s => s.lng)
  const bounds = {
    minLat: Math.min(...lats), maxLat: Math.max(...lats),
    minLng: Math.min(...lngs), maxLng: Math.max(...lngs),
  }

  const points = route.stops.map(s => project(s.lat, s.lng, bounds))
  const polyline = points.map(p => `${p.x},${p.y}`).join(" ")

  const pos = positionAlongRoute(route, trip.status === "idle" ? 0 : trip.progress)
  const vehPt = project(pos.lat, pos.lng, bounds)

  return (
    <div className="rounded-xl border bg-[var(--ef-blue-light)] dark:bg-muted/30 p-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Live position of ${veh?.label} on ${route.name}`}>
        {/* route line */}
        <polyline points={polyline} fill="none" stroke="var(--ef-brand)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" opacity={0.4} />
        {/* traversed portion */}
        <polyline
          points={[...points.filter((_, i) => trip.reachedSeqs.includes(route.stops[i].seq)).map(p => `${p.x},${p.y}`), `${vehPt.x},${vehPt.y}`].join(" ")}
          fill="none" stroke="var(--ef-brand)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"
        />
        {/* stops */}
        {points.map((p, i) => {
          const stop = route.stops[i]
          const reached = trip.reachedSeqs.includes(stop.seq)
          const isHighlight = highlightStopSeq === stop.seq
          return (
            <g key={stop.seq}>
              <circle
                cx={p.x} cy={p.y} r={isHighlight ? 7 : 5}
                fill={reached ? "var(--ef-green)" : "var(--card-bg, #fff)"}
                stroke={isHighlight ? "var(--ef-red)" : "var(--ef-brand)"}
                strokeWidth={2}
              />
              <text x={p.x} y={p.y - 9} textAnchor="middle" className="fill-foreground" style={{ fontSize: 7 }}>
                {stop.name}
              </text>
            </g>
          )
        })}
        {/* vehicle marker */}
        {trip.status !== "idle" && (
          <g transform={`translate(${vehPt.x - 8}, ${vehPt.y - 8})`}>
            <circle cx={8} cy={8} r={10} fill="var(--ef-brand)" opacity={0.18} />
            <circle cx={8} cy={8} r={7} fill="var(--ef-brand)" />
          </g>
        )}
      </svg>

      {/* legend */}
      <div className="flex flex-wrap items-center gap-3 px-1 pt-1 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Bus className="size-3 text-primary" /> {veh?.label}</span>
        <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3 text-[var(--ef-green-dark)]" /> reached</span>
        <span className="inline-flex items-center gap-1"><MapPin className="size-3 text-primary" /> stop</span>
        <span className={cn("ml-auto font-medium",
          trip.status === "running" && "text-[var(--ef-green-dark)]",
          trip.status === "completed" && "text-muted-foreground",
        )}>
          {trip.status === "running" ? `En route · ${Math.round(trip.progress * 100)}%` : trip.status === "completed" ? "Completed" : "Not started"}
        </span>
      </div>
    </div>
  )
}
