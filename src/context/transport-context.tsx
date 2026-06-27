"use client"

/**
 * transport-context.tsx  (Feature F7 — Transport tracking)
 *
 * Live store for school transport. The driver console (management/admin) starts
 * and stops trips; a simulated GPS advances the vehicle along its route, auto-
 * checks stops as they are reached (geofence stand-in), and parents accept a
 * drop handshake to confirm the child was received.
 *
 * GPS is SIMULATED here. The data shapes mirror a real device feed, so a Google
 * Maps + live-location layer can replace the simulation without UI changes.
 * NOTE for production: this needs auth, per-school isolation, parent consent,
 * and a key-restricted maps integration before going live.
 *
 * Mounted in (app)/layout.tsx BELOW <NotificationProvider>.
 */

import {
  createContext, useContext, useState, useMemo, useCallback, useEffect, useRef,
  type ReactNode,
} from "react"
import {
  VEHICLES, STUDENT_TRANSPORT, getRoute, getVehicle, progressForStop,
  type Trip,
} from "@/data/mock-transport"
import { useNotifications } from "@/context/notification-context"

const TODAY = "2026-06-25"
const TICK_MS = 1500
const STEP = 0.05

function nowTime() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
}

const INITIAL_TRIPS: Trip[] = [
  { id: "trip-1", vehicleId: "veh-1", routeId: "route-1", date: TODAY, status: "running", startedAt: new Date().toISOString(), progress: 0.12, reachedSeqs: [1], handshakes: [] },
  { id: "trip-2", vehicleId: "veh-2", routeId: "route-2", date: TODAY, status: "idle", progress: 0, reachedSeqs: [], handshakes: [] },
]

export interface FleetSummary {
  total: number
  running: number
  completed: number
  idle: number
}

interface TransportContextValue {
  trips: Trip[]
  tripForVehicle: (vehicleId: string) => Trip | undefined
  tripForStudent: (studentId: string) => Trip | undefined
  startTrip: (vehicleId: string) => void
  endTrip: (vehicleId: string) => void
  acceptDrop: (studentId: string, acceptedBy: string) => void
  fleet: FleetSummary
}

const TransportContext = createContext<TransportContextValue | null>(null)

export function TransportProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS)
  const { upsert } = useNotifications()

  const tripsRef = useRef(trips)
  tripsRef.current = trips

  // Simulated GPS tick — advances running trips, auto-checks stops, completes.
  useEffect(() => {
    const iv = setInterval(() => {
      const cur = tripsRef.current
      if (!cur.some(t => t.status === "running")) return

      const events: (() => void)[] = []
      const next = cur.map(t => {
        if (t.status !== "running") return t
        const route = getRoute(t.routeId)
        if (!route) return t
        const veh = getVehicle(t.vehicleId)
        const progress = Math.min(1, t.progress + STEP)
        const reached = [...t.reachedSeqs]

        for (const stop of route.stops) {
          const thr = progressForStop(route, stop.seq)
          if (progress >= thr - 1e-9 && !reached.includes(stop.seq)) {
            reached.push(stop.seq)
            if (stop.seq !== 1) {
              events.push(() =>
                upsert("parent", {
                  id: `transport-stop-${t.id}-${stop.seq}`,
                  type: "transport",
                  title: `${veh?.label} reached ${stop.name}`,
                  body: `Your school ${veh?.type ?? "vehicle"} reached ${stop.name} at ${nowTime()}.`,
                  actionHref: "/parent/transport",
                }),
              )
            }
          }
        }

        const completed = progress >= 1
        if (completed) {
          events.push(() =>
            upsert("staff", {
              id: `transport-complete-${t.id}`,
              type: "transport",
              title: `${veh?.label} completed its route`,
              body: `${veh?.label} finished ${route.name} at ${nowTime()}.`,
              actionHref: "/management/transport",
            }),
          )
        }

        return {
          ...t,
          progress,
          reachedSeqs: reached,
          status: completed ? ("completed" as const) : ("running" as const),
          endedAt: completed ? new Date().toISOString() : t.endedAt,
        }
      })

      setTrips(next)
      events.forEach(fn => fn())
    }, TICK_MS)
    return () => clearInterval(iv)
  }, [upsert])

  const tripForVehicle = useCallback(
    (vehicleId: string) => trips.find(t => t.vehicleId === vehicleId),
    [trips],
  )

  const tripForStudent = useCallback(
    (studentId: string) => {
      const st = STUDENT_TRANSPORT.find(s => s.studentId === studentId)
      if (!st) return undefined
      const veh = VEHICLES.find(v => v.routeId === st.routeId)
      return veh ? trips.find(t => t.vehicleId === veh.id) : undefined
    },
    [trips],
  )

  const startTrip = useCallback((vehicleId: string) => {
    const veh = getVehicle(vehicleId)
    const route = veh ? getRoute(veh.routeId) : undefined
    setTrips(prev => prev.map(t =>
      t.vehicleId === vehicleId
        ? { ...t, status: "running", startedAt: new Date().toISOString(), endedAt: undefined, progress: 0, reachedSeqs: [1], handshakes: [] }
        : t,
    ))
    if (veh && route) {
      upsert("parent", {
        id: `transport-start-${vehicleId}`,
        type: "transport",
        title: `${veh.label} has started`,
        body: `${veh.label} (${route.name}) left school at ${nowTime()}. Track it live.`,
        actionHref: "/parent/transport",
      })
    }
  }, [upsert])

  const endTrip = useCallback((vehicleId: string) => {
    setTrips(prev => prev.map(t =>
      t.vehicleId === vehicleId
        ? { ...t, status: "completed", endedAt: new Date().toISOString() }
        : t,
    ))
  }, [])

  const acceptDrop = useCallback((studentId: string, acceptedBy: string) => {
    const st = STUDENT_TRANSPORT.find(s => s.studentId === studentId)
    if (!st) return
    const veh = VEHICLES.find(v => v.routeId === st.routeId)
    if (!veh) return
    setTrips(prev => prev.map(t =>
      t.vehicleId === veh.id && !t.handshakes.some(h => h.studentId === studentId)
        ? { ...t, handshakes: [...t.handshakes, { studentId, studentName: st.studentName, acceptedBy, acceptedAt: new Date().toISOString() }] }
        : t,
    ))
    upsert("staff", {
      id: `transport-handshake-${studentId}`,
      type: "transport",
      title: `${st.studentName} received safely`,
      body: `${st.studentName} was received by ${acceptedBy} at ${nowTime()}. Child is safe with parent.`,
      actionHref: "/management/transport",
    })
  }, [upsert])

  const fleet: FleetSummary = useMemo(() => ({
    total: trips.length,
    running: trips.filter(t => t.status === "running").length,
    completed: trips.filter(t => t.status === "completed").length,
    idle: trips.filter(t => t.status === "idle").length,
  }), [trips])

  const value: TransportContextValue = useMemo(
    () => ({ trips, tripForVehicle, tripForStudent, startTrip, endTrip, acceptDrop, fleet }),
    [trips, tripForVehicle, tripForStudent, startTrip, endTrip, acceptDrop, fleet],
  )

  return <TransportContext.Provider value={value}>{children}</TransportContext.Provider>
}

export function useTransport(): TransportContextValue {
  const ctx = useContext(TransportContext)
  if (!ctx) throw new Error("useTransport must be used inside <TransportProvider>")
  return ctx
}
