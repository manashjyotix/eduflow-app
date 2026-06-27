/**
 * mock-sos.ts
 *
 * Mock data for the Student Transport SOS emergency alert system.
 * Covers: incident types, transport routes, SOS reports, emergency contacts.
 *
 * Single source of truth — import from here, never redeclare inline.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export type IncidentType =
  | "accident"
  | "robbery"
  | "fighting"
  | "harassment"
  | "medical"
  | "other"

export type IncidentSeverity = "critical" | "high" | "medium"
export type IncidentStatus = "active" | "responded" | "resolved"
export type EscalationTarget = "police" | "ambulance" | "hospital"

export interface SOSLocation {
  lat: number
  lng: number
  address: string
}

export interface SOSIncident {
  id: string
  childId: string
  childName: string
  reportedBy: string
  reportedByPhone: string
  type: IncidentType
  description: string
  location: SOSLocation
  routeId: string
  routeName: string
  timestamp: string
  status: IncidentStatus
  severity: IncidentSeverity
  schoolResponse?: string
  escalatedTo?: EscalationTarget[]
  resolvedAt?: string
  resolvedNote?: string
}

export interface TransportRoute {
  id: string
  name: string
  busNumber: string
  driver: string
  driverPhone: string
  stops: string[]
  childrenOnRoute: {
    childId: string
    childName: string
    parentName: string
    parentPhone: string
  }[]
}

export interface EmergencyContact {
  id: string
  label: string
  number: string
  icon: string
  color: string
}

// ─── Incident Type Config ───────────────────────────────────────────────────────

export const INCIDENT_TYPE_LABEL: Record<IncidentType, string> = {
  accident:   "Accident",
  robbery:    "Robbery / Theft",
  fighting:   "Fighting / Violence",
  harassment: "Harassment",
  medical:    "Medical Emergency",
  other:      "Other Emergency",
}

export const INCIDENT_TYPE_ICON: Record<IncidentType, string> = {
  accident:   "🚗",
  robbery:    "🔒",
  fighting:   "⚠️",
  harassment: "🛡️",
  medical:    "🏥",
  other:      "📍",
}

export const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  critical: "Critical",
  high:     "High",
  medium:   "Medium",
}

export const SEVERITY_CLASS: Record<IncidentSeverity, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high:     "bg-[var(--ef-amber)] text-white",
  medium:   "bg-[var(--ef-amber-light)] text-warning-foreground",
}

export const STATUS_LABEL: Record<IncidentStatus, string> = {
  active:    "Active",
  responded: "School Responded",
  resolved:  "Resolved",
}

export const STATUS_CLASS: Record<IncidentStatus, string> = {
  active:    "bg-destructive/15 text-destructive border-destructive/30",
  responded: "bg-[var(--ef-amber-light)] text-warning-foreground border-[var(--ef-amber)]/30",
  resolved:  "bg-[var(--ef-green-light)] text-[var(--ef-green-dark)] border-[var(--ef-green)]/30",
}

// ─── Transport Routes ───────────────────────────────────────────────────────────

export const TRANSPORT_ROUTES: TransportRoute[] = [
  {
    id: "route-1",
    name: "Howly Main — HCEA Route",
    busNumber: "AS-15-C-1234",
    driver: "Ranjit Barman",
    driverPhone: "+91 94350 12345",
    stops: [
      "Howly Chariali",
      "Masjid Road",
      "Bazar Street",
      "Station Road",
      "Temple Point",
      "HCEA School Gate",
    ],
    childrenOnRoute: [
      { childId: "child-1", childName: "Rohit Das",     parentName: "Pankaj Das",   parentPhone: "+91 76543 21098" },
      { childId: "child-2", childName: "Riya Das",      parentName: "Pankaj Das",   parentPhone: "+91 76543 21098" },
      { childId: "child-3", childName: "Aman Bora",     parentName: "Dipul Bora",   parentPhone: "+91 98765 43212" },
      { childId: "child-4", childName: "Priti Kalita",  parentName: "Ramen Kalita", parentPhone: "+91 98765 43211" },
    ],
  },
  {
    id: "route-2",
    name: "Pathsala — HCEA Route",
    busNumber: "AS-15-C-5678",
    driver: "Manash Deka",
    driverPhone: "+91 94350 67890",
    stops: [
      "Pathsala Bus Stand",
      "Kachhari Road",
      "College Point",
      "NH-31 Junction",
      "HCEA School Gate",
    ],
    childrenOnRoute: [
      { childId: "child-5", childName: "Nisha Gogoi",     parentName: "Hemanta Gogoi",  parentPhone: "+91 98765 43213" },
      { childId: "child-6", childName: "Bikash Saikia",   parentName: "Raju Saikia",    parentPhone: "+91 98765 43214" },
    ],
  },
]

// ─── Mock SOS Incidents ─────────────────────────────────────────────────────────

export const SOS_INCIDENTS: SOSIncident[] = [
  {
    id: "sos-1",
    childId: "child-3",
    childName: "Aman Bora",
    reportedBy: "Dipul Bora",
    reportedByPhone: "+91 98765 43212",
    type: "accident",
    description: "School bus had a minor collision near Bazar Street. No serious injuries, but children are shaken. Bus has stopped and cannot move.",
    location: {
      lat: 26.4487,
      lng: 90.8765,
      address: "Near Bazar Street, Howly, Barpeta, Assam",
    },
    routeId: "route-1",
    routeName: "Howly Main — HCEA Route",
    timestamp: "2026-06-23T07:45:00+05:30",
    status: "responded",
    severity: "high",
    schoolResponse: "School van dispatched to pick up students. Driver is safe. Admin Mr. Barman contacted.",
    escalatedTo: ["police"],
    resolvedAt: undefined,
    resolvedNote: undefined,
  },
  {
    id: "sos-2",
    childId: "child-4",
    childName: "Priti Kalita",
    reportedBy: "Ramen Kalita",
    reportedByPhone: "+91 98765 43211",
    type: "harassment",
    description: "Unknown persons near Temple Point were harassing students at the bus stop. Multiple students affected.",
    location: {
      lat: 26.4512,
      lng: 90.8823,
      address: "Temple Point Bus Stop, Howly, Barpeta, Assam",
    },
    routeId: "route-1",
    routeName: "Howly Main — HCEA Route",
    timestamp: "2026-06-20T14:30:00+05:30",
    status: "resolved",
    severity: "critical",
    schoolResponse: "Staff reached the spot within 10 minutes. Police called immediately.",
    escalatedTo: ["police"],
    resolvedAt: "2026-06-20T15:10:00+05:30",
    resolvedNote: "Police patrolled the area. School arranged temporary escort for pickup point. Parents were notified via SMS.",
  },
  {
    id: "sos-3",
    childId: "child-1",
    childName: "Rohit Das",
    reportedBy: "A bystander parent",
    reportedByPhone: "+91 99999 00000",
    type: "medical",
    description: "A student (Rohit) felt dizzy and nearly fainted while walking from the bus stop to school. Needs immediate medical attention.",
    location: {
      lat: 26.4505,
      lng: 90.8801,
      address: "Station Road, near HCEA gate, Howly",
    },
    routeId: "route-1",
    routeName: "Howly Main — HCEA Route",
    timestamp: "2026-06-15T08:10:00+05:30",
    status: "resolved",
    severity: "high",
    schoolResponse: "School nurse attended. Called parent immediately. Student rested in sick room.",
    escalatedTo: [],
    resolvedAt: "2026-06-15T09:00:00+05:30",
    resolvedNote: "Parent picked up the student. Doctor visit advised. Student returned next day.",
  },
]

// ─── Emergency Contacts ─────────────────────────────────────────────────────────

export const EMERGENCY_CONTACTS: EmergencyContact[] = [
  { id: "ec-1", label: "Police",        number: "100",             icon: "🚔", color: "var(--ef-brand)" },
  { id: "ec-2", label: "Ambulance",     number: "108",             icon: "🚑", color: "var(--ef-red)" },
  { id: "ec-3", label: "Fire",          number: "101",             icon: "🚒", color: "var(--ef-amber)" },
  { id: "ec-4", label: "School Office", number: "+91 94350 00001", icon: "🏫", color: "var(--ef-green)" },
  { id: "ec-5", label: "Bus Driver",    number: "+91 94350 12345", icon: "🚌", color: "var(--ef-purple)" },
]
