/**
 * mock-transport.ts  (Feature F7 — Transport tracking)
 *
 * Routes (stops with coordinates), vehicles, and live trips. For the demo the
 * driver's GPS is simulated (a position interpolated along the route); the data
 * shapes match what a real device + Google Maps layer would post, so the map
 * component and context can be swapped to live data later without UI changes.
 *
 * Coordinates are around Howly / Barpeta, Assam (~26.45, 90.87).
 * Import from here — never redeclare inline.
 */

export interface TransportStop {
  seq: number
  name: string
  lat: number
  lng: number
  plannedTime: string // "HH:mm"
}

export interface TransportRoute {
  id: string
  name: string
  stops: TransportStop[]
  assignedStudentIds: string[]
}

export interface Vehicle {
  id: string
  label: string
  regNo: string
  type: "bus" | "van"
  routeId: string
  driverId: string
  driverName: string
  driverPhone: string
  capacity: number
}

export type TripStatus = "idle" | "running" | "completed"

export interface DropHandshake {
  studentId: string
  studentName: string
  acceptedBy: string
  acceptedAt: string
}

export interface Trip {
  id: string
  vehicleId: string
  routeId: string
  date: string
  status: TripStatus
  startedAt?: string
  endedAt?: string
  /** 0..1 along the route polyline (simulated GPS). */
  progress: number
  /** Stop seqs already reached (geofence auto-check). */
  reachedSeqs: number[]
  handshakes: DropHandshake[]
}

/** Which route + drop stop a student belongs to (parent tracking). */
export interface StudentTransport {
  studentId: string
  studentName: string
  routeId: string
  stopSeq: number
}

export const TRANSPORT_ROUTES: TransportRoute[] = [
  {
    id: "route-1",
    name: "Route 1 — Howly Town",
    assignedStudentIds: ["s1", "s2"],
    stops: [
      { seq: 1, name: "School (HCEA)",      lat: 26.4520, lng: 90.8710, plannedTime: "14:40" },
      { seq: 2, name: "Howly Tiniali",      lat: 26.4480, lng: 90.8780, plannedTime: "14:52" },
      { seq: 3, name: "Bhabanipur Chowk",   lat: 26.4435, lng: 90.8855, plannedTime: "15:05" },
      { seq: 4, name: "Simlaguri",          lat: 26.4390, lng: 90.8930, plannedTime: "15:18" },
      { seq: 5, name: "Barbang Point",      lat: 26.4350, lng: 90.9010, plannedTime: "15:30" },
    ],
  },
  {
    id: "route-2",
    name: "Route 2 — Barpeta Road",
    assignedStudentIds: ["s7"],
    stops: [
      { seq: 1, name: "School (HCEA)",      lat: 26.4520, lng: 90.8710, plannedTime: "14:40" },
      { seq: 2, name: "Sorbhog Junction",   lat: 26.4610, lng: 90.8640, plannedTime: "14:55" },
      { seq: 3, name: "Pathsala Gate",      lat: 26.4700, lng: 90.8560, plannedTime: "15:10" },
      { seq: 4, name: "Barpeta Road Stand", lat: 26.4790, lng: 90.8480, plannedTime: "15:25" },
    ],
  },
]

export const VEHICLES: Vehicle[] = [
  { id: "veh-1", label: "Bus 1", regNo: "AS-15-C-1023", type: "bus", routeId: "route-1", driverId: "drv-1", driverName: "Jiten Das",   driverPhone: "9864000001", capacity: 32 },
  { id: "veh-2", label: "Van 2", regNo: "AS-15-D-2044", type: "van", routeId: "route-2", driverId: "drv-2", driverName: "Hari Mech",   driverPhone: "9864000002", capacity: 12 },
]

/** School transport drivers (a driver operates one vehicle). */
export interface Driver {
  id: string
  name: string
  phone: string
  vehicleId: string
}

export const DRIVERS: Driver[] = [
  { id: "drv-1", name: "Jiten Das", phone: "9864000001", vehicleId: "veh-1" },
  { id: "drv-2", name: "Hari Mech", phone: "9864000002", vehicleId: "veh-2" },
]

/** Demo driver persona (matches the role switcher / login). */
export const DEMO_DRIVER_ID = "drv-1"

export function getVehicleForDriver(driverId: string): Vehicle | undefined {
  const d = DRIVERS.find(x => x.id === driverId)
  return d ? VEHICLES.find(v => v.id === d.vehicleId) : undefined
}

/** Demo: students mapped to routes + the stop they get off at. */
export const STUDENT_TRANSPORT: StudentTransport[] = [
  { studentId: "s1",  studentName: "Rohit Das",       routeId: "route-1", stopSeq: 3 },
  { studentId: "s2",  studentName: "Priti Kalita",    routeId: "route-1", stopSeq: 4 },
  { studentId: "s5",  studentName: "Bikash Saikia",   routeId: "route-1", stopSeq: 2 },
  { studentId: "s9",  studentName: "Suraj Nath",      routeId: "route-1", stopSeq: 5 },
  { studentId: "s12", studentName: "Ankita Sarma",    routeId: "route-1", stopSeq: 3 },
  { studentId: "s7",  studentName: "Manash Deka",     routeId: "route-2", stopSeq: 3 },
  { studentId: "s11", studentName: "Rahul Choudhury", routeId: "route-2", stopSeq: 4 },
]

/**
 * Emergency / safety points of interest near the routes. These are the kinds of
 * places a driver may need in an emergency — surfaced as map markers on top of
 * the live route (Google data is also filtered to keep these visible and hide
 * commercial clutter like shops). Coordinates around Howly / Barpeta, Assam.
 */
export type EmergencyPoiKind =
  | "hospital" | "medical" | "police" | "school" | "college"

export interface EmergencyPoi {
  id: string
  name: string
  kind: EmergencyPoiKind
  lat: number
  lng: number
  phone?: string
}

export const EMERGENCY_POIS: EmergencyPoi[] = [
  { id: "poi-1", name: "Howly Civil Hospital",        kind: "hospital",  lat: 26.4505, lng: 90.8735, phone: "108" },
  { id: "poi-2", name: "Bhabanipur PHC",              kind: "medical",   lat: 26.4448, lng: 90.8842, phone: "104" },
  { id: "poi-3", name: "Howly Police Station",        kind: "police",    lat: 26.4498, lng: 90.8762, phone: "100" },
  { id: "poi-5", name: "Holy Child English Academy",  kind: "school",    lat: 26.4520, lng: 90.8710 },
  { id: "poi-6", name: "Howly College",               kind: "college",   lat: 26.4467, lng: 90.8801 },
  { id: "poi-7", name: "Barpeta Road FRU Hospital",   kind: "hospital",  lat: 26.4782, lng: 90.8492, phone: "108" },
  { id: "poi-8", name: "Sorbhog Outpost",             kind: "police",    lat: 26.4615, lng: 90.8631, phone: "100" },
]

export function getRoute(routeId: string): TransportRoute | undefined {
  return TRANSPORT_ROUTES.find(r => r.id === routeId)
}

/** Students riding a given route, joined with the stop they get off at. */
export function getRouteRiders(routeId: string): Array<StudentTransport & { stopName?: string }> {
  const route = getRoute(routeId)
  return STUDENT_TRANSPORT
    .filter(s => s.routeId === routeId)
    .map(s => ({ ...s, stopName: route?.stops.find(st => st.seq === s.stopSeq)?.name }))
}

export function getVehicle(vehicleId: string): Vehicle | undefined {
  return VEHICLES.find(v => v.id === vehicleId)
}

/**
 * Interpolate a lat/lng position along a route's stop polyline for progress
 * in [0,1]. Returns the coordinate and the index of the segment.
 */
export function positionAlongRoute(
  route: TransportRoute, progress: number,
): { lat: number; lng: number } {
  const stops = route.stops
  if (stops.length === 0) return { lat: 0, lng: 0 }
  if (progress <= 0) return { lat: stops[0].lat, lng: stops[0].lng }
  if (progress >= 1) return { lat: stops[stops.length - 1].lat, lng: stops[stops.length - 1].lng }
  const segments = stops.length - 1
  const scaled = progress * segments
  const i = Math.floor(scaled)
  const t = scaled - i
  const a = stops[i]
  const b = stops[i + 1]
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t }
}

/** Progress threshold [0,1] at which a given stop seq is considered reached. */
export function progressForStop(route: TransportRoute, seq: number): number {
  const segments = Math.max(1, route.stops.length - 1)
  return (seq - 1) / segments
}
