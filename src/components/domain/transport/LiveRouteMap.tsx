"use client"

/**
 * LiveRouteMap  (Feature F7 — Transport tracking)
 *
 * Real map for a trip. When a Google Maps key is configured
 * (`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`) it renders an interactive Google map and
 * draws the route snapped to real roads via the Directions service, then moves
 * the bus the way Google Maps does:
 *   - the route line follows actual roads (a dense path decoded from every
 *     Directions step, not the simplified overview),
 *   - the vehicle marker glides smoothly and continuously along that road path
 *     (requestAnimationFrame, constant speed, arrow rotated to the heading),
 *   - a "traveled" trail grows behind the bus,
 *   - a live overlay shows speed + ETA + distance remaining,
 *   - numbered stop markers + emergency points (hospital, clinic, police,
 *     school, college) sit on top, and shop/commercial clutter is hidden.
 *
 * If the Directions API is unavailable on the key it falls back to a straight
 * polyline over the map (and logs a clear warning so a missing Directions API
 * permission is obvious); with no key at all it falls back to the lightweight
 * SVG `RouteMap` so the demo and tests keep working.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react"
import {
  Hospital, ShieldAlert, GraduationCap, School, Cross, MapPinned,
  Gauge, Clock, Route as RouteIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { RouteMap } from "./RouteMap"
import {
  loadGoogleMaps, hasGoogleMapsKey, EMERGENCY_MAP_STYLE,
} from "@/lib/google-maps"
import {
  getRoute, getVehicle, EMERGENCY_POIS,
  type Trip, type EmergencyPoiKind,
} from "@/data/mock-transport"

const POI_META: Record<EmergencyPoiKind, { label: string; color: string; Icon: React.ElementType }> = {
  hospital: { label: "Hospital", color: "#FF3B30", Icon: Hospital },
  medical:  { label: "Medical",  color: "#FF2D55", Icon: Cross },
  police:   { label: "Police",   color: "#0A84FF", Icon: ShieldAlert },
  school:   { label: "School",   color: "#34C759", Icon: School },
  college:  { label: "College",  color: "#5856D6", Icon: GraduationCap },
}

const DEFAULT_HEIGHT = "h-[clamp(20rem,55vh,40rem)]"

/** How long (ms) the marker takes to glide to a freshly-received GPS target.
 *  Slightly longer than the sim tick so motion never stalls between updates. */
const GLIDE_MS = 1600

export interface LiveRouteMapProps {
  trip: Trip
  highlightStopSeq?: number
  /** Tailwind height class — defaults to a responsive clamp that fits any screen. */
  heightClass?: string
  /** Show the legend below the map. Default true. */
  showLegend?: boolean
  className?: string
}

interface LiveStats {
  speedKmh: number
  etaText: string
  kmLeft: number
  nextStop?: string
}

export function LiveRouteMap({
  trip, highlightStopSeq, heightClass = DEFAULT_HEIGHT, showLegend = true, className,
}: LiveRouteMapProps) {
  const route = getRoute(trip.routeId)
  const vehicle = getVehicle(trip.vehicleId)

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const vehicleMarkerRef = useRef<any>(null)
  const traveledRef = useRef<any>(null)         // growing trail behind the bus
  const pathRef = useRef<any[]>([])             // dense LatLng[] following the road
  const cumRef = useRef<number[]>([])           // cumulative metres along pathRef
  const totalMetresRef = useRef(0)

  // Animation state (kept in refs so the rAF loop never restarts on re-render).
  const dispFracRef = useRef(0)                 // fraction currently drawn
  const targetFracRef = useRef(0)               // fraction we're gliding toward
  const rateRef = useRef(0)                      // fraction per ms
  const lastTsRef = useRef(0)
  const rafRef = useRef<number | null>(null)

  // Realistic (schedule-based) figures for the overlay.
  const plannedMinRef = useRef(0)
  const tripRef = useRef(trip)
  tripRef.current = trip

  const [status, setStatus] = useState<"idle" | "ready" | "error">("idle")
  const [stats, setStats] = useState<LiveStats | null>(null)

  // ── Initialise the map + road route once per route ────────────────────────
  useEffect(() => {
    if (!hasGoogleMapsKey() || !route || route.stops.length < 2) return
    let cancelled = false

    // Planned duration from the first → last stop times (for realistic ETA/speed).
    plannedMinRef.current = plannedMinutes(route.stops[0].plannedTime, route.stops.at(-1)!.plannedTime)

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !containerRef.current) return
        const maps = google.maps

        const map = new maps.Map(containerRef.current, {
          center: { lat: route.stops[0].lat, lng: route.stops[0].lng },
          zoom: 14,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          gestureHandling: "greedy",
          clickableIcons: false,
          styles: EMERGENCY_MAP_STYLE as any,
        })
        mapRef.current = map

        // Emergency POI markers (on top of the filtered Google data)
        EMERGENCY_POIS.forEach((poi) => {
          const meta = POI_META[poi.kind]
          new maps.Marker({
            position: { lat: poi.lat, lng: poi.lng },
            map,
            title: `${meta.label}: ${poi.name}${poi.phone ? ` · ${poi.phone}` : ""}`,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 6,
              fillColor: meta.color,
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
          })
        })

        // Numbered stop markers (kept on top of the route line)
        route.stops.forEach((stop) => {
          const isHighlight = highlightStopSeq === stop.seq
          new maps.Marker({
            position: { lat: stop.lat, lng: stop.lng },
            map,
            label: { text: String(stop.seq), color: "#fff", fontSize: "11px", fontWeight: "700" },
            title: `${stop.name} · ${stop.plannedTime}`,
            icon: {
              path: maps.SymbolPath.CIRCLE,
              scale: 11,
              fillColor: isHighlight ? "#FF3B30" : "#007AFF",
              fillOpacity: 1,
              strokeColor: "#fff",
              strokeWeight: 2,
            },
            zIndex: 50,
          })
        })

        const fitTo = (pts: any[]) => {
          const bounds = new maps.LatLngBounds()
          pts.forEach((p) => bounds.extend(p))
          EMERGENCY_POIS.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }))
          map.fitBounds(bounds, 48)
        }

        // The "ahead" route line + the growing "traveled" trail behind the bus.
        const setupPath = (pts: any[]) => {
          pathRef.current = pts
          cumRef.current = buildCumulative(maps, pts)
          totalMetresRef.current = cumRef.current.at(-1) ?? 0
          traveledRef.current = new maps.Polyline({
            map,
            path: [pts[0]],
            strokeColor: "#0B57D0",
            strokeOpacity: 1,
            strokeWeight: 7,
            zIndex: 30,
          })
          fitTo(pts)
          setStatus("ready")
        }

        const drawStraight = () => {
          const pts = route.stops.map((s) => new maps.LatLng(s.lat, s.lng))
          new maps.Polyline({
            path: pts, map,
            strokeColor: "#9AA0A6", strokeOpacity: 0.9, strokeWeight: 5,
          })
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.warn(
              "[LiveRouteMap] Directions API returned no road route — drawing a straight " +
              "line. Enable the “Directions API” on NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to get " +
              "roads.",
            )
          }
          setupPath(pts)
        }

        // Real-road route via the Directions service. Stops become
        // origin → waypoints → destination; we build a DENSE path from every
        // step so the bus follows the road's curves smoothly.
        const stops = [...route.stops]
        const origin = stops.shift()!
        const destination = stops.pop()!
        const service = new maps.DirectionsService()
        const renderer = new maps.DirectionsRenderer({
          map,
          suppressMarkers: true,
          preserveViewport: true,
          polylineOptions: {
            strokeColor: "#74A7FF", strokeOpacity: 0.95, strokeWeight: 7, zIndex: 10,
          },
        })

        service.route(
          {
            origin: { lat: origin.lat, lng: origin.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            waypoints: stops.map((s) => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
            travelMode: maps.TravelMode.DRIVING,
            optimizeWaypoints: false,
          },
          (result: any, dirStatus: string) => {
            if (cancelled) return
            if (dirStatus === "OK" && result?.routes?.[0]) {
              renderer.setDirections(result)
              const dense = densePathFromDirections(result.routes[0])
              setupPath(dense.length > 1 ? dense : result.routes[0].overview_path)
            } else {
              // Directions API unavailable (not enabled / quota) — straight line.
              drawStraight()
            }
          },
        )
      })
      .catch(() => { if (!cancelled) setStatus("error") })

    return () => {
      cancelled = true
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip.routeId])

  // ── Receive a new GPS target whenever the trip advances ───────────────────
  useEffect(() => {
    if (status !== "ready") return
    const target = trip.status === "idle" ? 0 : Math.max(0, Math.min(1, trip.progress))

    // On the very first ready frame, snap to the current position; afterwards
    // glide to the new target over GLIDE_MS so motion stays smooth.
    if (rafRef.current == null) {
      dispFracRef.current = target
    }
    targetFracRef.current = target
    const gap = Math.abs(target - dispFracRef.current)
    rateRef.current = gap > 0 ? gap / GLIDE_MS : 0
  }, [trip.progress, trip.status, status])

  // ── The animation loop — glide + rotate the bus, grow the trail ───────────
  useEffect(() => {
    const google = (typeof window !== "undefined" && window.google) || null
    const map = mapRef.current
    if (!google || !map || status !== "ready" || !route) return
    const maps = google.maps

    if (trip.status === "idle") {
      vehicleMarkerRef.current?.setMap(null)
      return
    }

    const renderAt = (frac: number) => {
      const pt = pointAtFraction(maps, pathRef.current, cumRef.current, totalMetresRef.current, frac)
      if (!pt) return

      if (!vehicleMarkerRef.current) {
        vehicleMarkerRef.current = new maps.Marker({
          position: pt.pos, map, zIndex: 100,
          icon: {
            path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
            scale: 6, fillColor: "#1E8E3E", fillOpacity: 1,
            strokeColor: "#fff", strokeWeight: 2, rotation: pt.heading,
          },
          title: vehicle ? `${vehicle.label} (live)` : "Vehicle (live)",
        })
      } else {
        vehicleMarkerRef.current.setMap(map)
        vehicleMarkerRef.current.setPosition(pt.pos)
        vehicleMarkerRef.current.setIcon({
          path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
          scale: 6, fillColor: "#1E8E3E", fillOpacity: 1,
          strokeColor: "#fff", strokeWeight: 2, rotation: pt.heading,
        })
      }

      // Grow the traveled trail up to the current point.
      if (traveledRef.current && pathRef.current.length) {
        traveledRef.current.setPath([...pathRef.current.slice(0, pt.index + 1), pt.pos])
      }
    }

    renderAt(dispFracRef.current)

    const animate = (ts: number) => {
      const last = lastTsRef.current || ts
      const dt = ts - last
      lastTsRef.current = ts

      const target = targetFracRef.current
      let disp = dispFracRef.current
      if (disp !== target) {
        const step = rateRef.current * dt
        disp = disp < target ? Math.min(target, disp + step) : Math.max(target, disp - step)
        dispFracRef.current = disp
        renderAt(disp)
      }
      rafRef.current = requestAnimationFrame(animate)
    }
    lastTsRef.current = 0
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [status, trip.status, route, vehicle])

  // ── Live overlay: speed + ETA + distance left (refreshed twice a second) ──
  useEffect(() => {
    if (status !== "ready" || !route) { setStats(null); return }
    const compute = () => {
      const t = tripRef.current
      const totalKm = totalMetresRef.current / 1000
      const plannedMin = plannedMinRef.current || 1
      const speedKmh = totalKm > 0 ? Math.round(totalKm / (plannedMin / 60)) : 0
      const frac = t.status === "completed" ? 1 : dispFracRef.current
      const kmLeft = Math.max(0, totalKm * (1 - frac))
      const minLeft = plannedMin * (1 - frac)
      const next = route.stops.find((s) => !t.reachedSeqs.includes(s.seq))
      const etaText =
        t.status === "completed" ? "Arrived"
        : t.status === "idle" ? "Not started"
        : clockAfter(minLeft)
      setStats({ speedKmh, etaText, kmLeft, nextStop: next?.name })
    }
    compute()
    const iv = setInterval(compute, 500)
    return () => clearInterval(iv)
  }, [status, route])

  if (!route) return null

  // ── Fallback: no key configured, or Maps failed to load ───────────────────
  if (!hasGoogleMapsKey() || status === "error") {
    return (
      <div className={className}>
        <div className={cn("w-full overflow-hidden rounded-xl", heightClass)}>
          <div className="h-full overflow-auto">
            <RouteMap trip={trip} highlightStopSeq={highlightStopSeq} />
          </div>
        </div>
        {showLegend && <Legend note={!hasGoogleMapsKey()} />}
      </div>
    )
  }

  const running = trip.status === "running"

  return (
    <div className={className}>
      <div className={cn("relative w-full overflow-hidden rounded-xl border bg-muted/30", heightClass)}>
        <div
          ref={containerRef}
          className="absolute inset-0"
          role="application"
          aria-label={`Live route map for ${vehicle?.label ?? "vehicle"} on ${route.name}`}
        />
        {running && stats && (
          <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap items-center gap-2 rounded-xl bg-background/90 px-3 py-2 text-xs shadow-md backdrop-blur">
            <span className="inline-flex items-center gap-1 font-medium">
              <Gauge className="size-3.5 text-primary" /> {stats.speedKmh} km/h
            </span>
            <span className="inline-flex items-center gap-1 font-medium">
              <Clock className="size-3.5 text-primary" /> ETA {stats.etaText}
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <RouteIcon className="size-3.5" /> {stats.kmLeft.toFixed(1)} km left
            </span>
            {stats.nextStop && (
              <span className="w-full text-[11px] text-muted-foreground">
                Next stop · {stats.nextStop}
              </span>
            )}
          </div>
        )}
      </div>
      {showLegend && <Legend />}
    </div>
  )
}

// ── Geometry helpers ─────────────────────────────────────────────────────────

/** Concatenate the detailed per-step path so the bus follows every road curve. */
function densePathFromDirections(route: any): any[] {
  const pts: any[] = []
  for (const leg of route.legs ?? []) {
    for (const step of leg.steps ?? []) {
      const seg = step.path ?? step.lat_lngs ?? []
      for (const p of seg) {
        // De-dupe the shared endpoint between consecutive steps.
        if (pts.length === 0 || !pts.at(-1).equals?.(p)) pts.push(p)
      }
    }
  }
  return pts
}

/** Cumulative metres at each vertex of the path. */
function buildCumulative(maps: any, path: any[]): number[] {
  const cum = [0]
  for (let i = 1; i < path.length; i++) {
    cum[i] = cum[i - 1] + maps.geometry.spherical.computeDistanceBetween(path[i - 1], path[i])
  }
  return cum
}

/** Distance-based position (constant speed) at fraction `frac` of the path. */
function pointAtFraction(
  maps: any, path: any[], cum: number[], total: number, frac: number,
): { pos: any; heading: number; index: number } | null {
  if (!path.length) return null
  if (path.length === 1) return { pos: path[0], heading: 0, index: 0 }
  const d = Math.max(0, Math.min(1, frac)) * total
  let i = 0
  while (i < cum.length - 1 && cum[i + 1] < d) i++
  const segLen = cum[i + 1] - cum[i]
  const t = segLen > 0 ? (d - cum[i]) / segLen : 0
  const pos = maps.geometry.spherical.interpolate(path[i], path[i + 1], t)
  const heading = maps.geometry.spherical.computeHeading(path[i], path[i + 1])
  return { pos, heading, index: i }
}

/** Minutes between two "HH:mm" clock strings. */
function plannedMinutes(from: string, to: string): number {
  const [fh, fm] = from.split(":").map(Number)
  const [th, tm] = to.split(":").map(Number)
  return Math.max(1, (th * 60 + tm) - (fh * 60 + fm))
}

/** A wall-clock "HH:MM" string `minutes` from now. */
function clockAfter(minutes: number): string {
  const d = new Date(Date.now() + Math.max(0, minutes) * 60_000)
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

function Legend({ note }: { note?: boolean }) {
  return (
    <div className="mt-2 flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <MapPinned className="size-3 text-primary" /> Stops
        </span>
        {(Object.keys(POI_META) as EmergencyPoiKind[]).map((k) => {
          const { label, color, Icon } = POI_META[k]
          return (
            <span key={k} className="inline-flex items-center gap-1">
              <Icon className="size-3" style={{ color }} /> {label}
            </span>
          )
        })}
      </div>
      {note && (
        <p className="text-[11px] text-muted-foreground">
          Showing the schematic route. Add a Google Maps key
          (<code className="text-[10px]">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>) to see the real map.
        </p>
      )}
    </div>
  )
}
