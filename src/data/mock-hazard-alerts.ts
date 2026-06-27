/**
 * mock-hazard-alerts.ts
 *
 * Mock data + shared config for the Disaster & Hazard Alert system.
 *
 * This is the AUTOMATIC, environment-triggered counterpart to the human-
 * triggered Transport SOS (see mock-sos.ts). Alerts are sourced from free,
 * genuine government / scientific feeds (USGS earthquakes, GDACS floods,
 * Open-Meteo severe weather + air quality), geo-filtered to the school, then
 * surfaced to the right roles with a dashboard banner + an Alerts page.
 *
 * Single source of truth — import from here, never redeclare inline.
 *
 * NOTE: This file holds the MOCK feed used for the prototype. The live adapters
 * that fetch the same shape from the real providers live in
 * `src/lib/hazard-feeds.ts`. The context (`hazard-alert-context.tsx`) chooses
 * between them with the USE_LIVE_FEEDS flag.
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export type HazardType =
  | "earthquake"
  | "flood"
  | "storm"
  | "heat"
  | "air"
  | "cyclone"
  | "wildfire"

/** Standardised 4-tier severity, aligned with common meteorological practice. */
export type HazardSeverity = "advisory" | "watch" | "warning" | "emergency"

export type HazardSource =
  | "USGS"
  | "GDACS"
  | "Open-Meteo"
  | "NASA-EONET"
  | "Demo"

export type HazardStatus = "active" | "acknowledged" | "expired"

export interface HazardLocation {
  lat: number
  lng: number
  /** Human-readable place label, e.g. "Brahmaputra basin, near Barpeta". */
  label: string
}

export interface HazardAlert {
  id: string
  type: HazardType
  severity: HazardSeverity
  status: HazardStatus
  title: string
  description: string
  source: HazardSource
  /** Distance in km from the configured school location. */
  distanceKm: number
  /** ISO timestamp the alert was issued by the source. */
  issuedAt: string
  /** ISO timestamp the alert is valid until (optional). */
  expiresAt?: string
  /** Deep link to the official source report — always shown for verification. */
  url: string
  location: HazardLocation
  /** Earthquake magnitude (Richter), when type === "earthquake". */
  magnitude?: number
}

// ─── School location (configured, NOT device geolocation) ─────────────────────────
// Demo school: Holy Child English Academy (HCEA), Howly, Barpeta, Assam.
// Browser geolocation is intentionally avoided (unreliable on desktop — see
// weather-greeting.tsx). Alerts key off this configured point.

export const SCHOOL_LOCATION = {
  lat: 26.45,
  lon: 90.87,
  label: "HCEA · Howly, Barpeta, Assam",
} as const

/** Only surface alerts within this radius of the school (km). */
export const ALERT_RADIUS_KM = 500

// ─── Type registry ────────────────────────────────────────────────────────────

export const HAZARD_TYPE_LABEL: Record<HazardType, string> = {
  earthquake: "Earthquake",
  flood:      "Flood",
  storm:      "Severe Storm",
  heat:       "Heat",
  air:        "Air Quality",
  cyclone:    "Cyclone",
  wildfire:   "Wildfire",
}

export const HAZARD_TYPE_EMOJI: Record<HazardType, string> = {
  earthquake: "🌐",
  flood:      "🌊",
  storm:      "⛈️",
  heat:       "🌡️",
  air:        "💨",
  cyclone:    "🌀",
  wildfire:   "🔥",
}

// ─── Severity registry ────────────────────────────────────────────────────────

export const SEVERITY_RANK: Record<HazardSeverity, number> = {
  advisory:  0,
  watch:     1,
  warning:   2,
  emergency: 3,
}

export const HAZARD_SEVERITY_LABEL: Record<HazardSeverity, string> = {
  advisory:  "Advisory",
  watch:     "Watch",
  warning:   "Warning",
  emergency: "Emergency",
}

/** Badge / pill classes per severity (uses EduFlow --ef-* tokens). */
export const HAZARD_SEVERITY_CLASS: Record<HazardSeverity, string> = {
  advisory:  "bg-[var(--ef-blue-light)] text-[var(--ef-blue)] border-[var(--ef-blue)]/30",
  watch:     "bg-[var(--ef-amber-light)] text-warning-foreground border-[var(--ef-amber)]/40",
  warning:   "bg-[var(--ef-amber)] text-white border-[var(--ef-amber)]",
  emergency: "bg-destructive text-destructive-foreground border-destructive animate-pulse",
}

/** Accent color token per severity, for left-border / icon tinting. */
export const HAZARD_SEVERITY_COLOR: Record<HazardSeverity, string> = {
  advisory:  "var(--ef-blue)",
  watch:     "var(--ef-amber)",
  warning:   "var(--ef-amber)",
  emergency: "var(--ef-red)",
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371

/** Haversine great-circle distance in km between two lat/lng points. */
export function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const lat1 = toRad(aLat)
  const lat2 = toRad(bLat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2)
  return Math.round(2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h)))
}

/** True when an alert is currently active (not acknowledged / not expired). */
export function isAlertLive(alert: HazardAlert, now: Date = new Date()): boolean {
  if (alert.status !== "active") return false
  if (alert.expiresAt && new Date(alert.expiresAt).getTime() < now.getTime()) {
    return false
  }
  return true
}

/** Compact "2h ago" / "just now" relative time. */
export function timeAgo(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.round(hrs / 24)
  return `${days}d ago`
}

/** Sort: highest severity first, then nearest, then most recent. */
export function sortAlerts(alerts: HazardAlert[]): HazardAlert[] {
  return [...alerts].sort((a, b) => {
    const sev = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]
    if (sev !== 0) return sev
    if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm
    return new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
  })
}

// ─── Mock alerts (Assam monsoon scenario, June 2026) ──────────────────────────────
// Realistic for the demo region: monsoon flooding on the Brahmaputra, heavy
// rain, a moderate regional earthquake, and a heat + air-quality advisory.

export const MOCK_HAZARD_ALERTS: HazardAlert[] = [
  {
    id: "hz-1",
    type: "flood",
    severity: "emergency",
    status: "active",
    title: "Red flood warning — Brahmaputra above danger level",
    description:
      "GDACS reports the Brahmaputra is flowing above the danger mark near Barpeta. Low-lying areas and approach roads to several bus routes are likely to be inundated within 12–24 hours. Avoid riverside routes.",
    source: "GDACS",
    distanceKm: 18,
    issuedAt: "2026-06-24T06:10:00+05:30",
    expiresAt: "2026-06-26T06:10:00+05:30",
    url: "https://www.gdacs.org/",
    location: { lat: 26.32, lng: 90.98, label: "Brahmaputra basin, near Barpeta" },
  },
  {
    id: "hz-2",
    type: "storm",
    severity: "warning",
    status: "active",
    title: "Heavy rainfall warning — 90mm expected today",
    description:
      "Open-Meteo forecasts intense rainfall (80–110mm) with gusty winds across Howly through the afternoon. Waterlogging and reduced visibility likely. Consider early dispersal for affected routes.",
    source: "Open-Meteo",
    distanceKm: 0,
    issuedAt: "2026-06-24T05:45:00+05:30",
    expiresAt: "2026-06-24T20:00:00+05:30",
    url: "https://open-meteo.com/",
    location: { lat: 26.45, lng: 90.87, label: "Howly, Barpeta" },
  },
  {
    id: "hz-3",
    type: "earthquake",
    severity: "watch",
    status: "active",
    title: "M4.8 earthquake — 132 km NE of school",
    description:
      "USGS recorded a magnitude 4.8 earthquake near the Assam–Arunachal border. No damage expected at this distance, but minor tremors may have been felt. Monitoring for aftershocks.",
    source: "USGS",
    distanceKm: 132,
    issuedAt: "2026-06-24T04:20:00+05:30",
    url: "https://earthquake.usgs.gov/",
    location: { lat: 27.10, lng: 91.85, label: "Assam–Arunachal border region" },
    magnitude: 4.8,
  },
  {
    id: "hz-4",
    type: "heat",
    severity: "advisory",
    status: "active",
    title: "High humidity & heat-index advisory",
    description:
      "Feels-like temperature near 39°C with high humidity. Ensure students stay hydrated; limit outdoor assembly and physical activity during midday periods.",
    source: "Open-Meteo",
    distanceKm: 0,
    issuedAt: "2026-06-24T07:00:00+05:30",
    expiresAt: "2026-06-24T17:00:00+05:30",
    url: "https://open-meteo.com/",
    location: { lat: 26.45, lng: 90.87, label: "Howly, Barpeta" },
  },
  {
    id: "hz-5",
    type: "air",
    severity: "advisory",
    status: "acknowledged",
    title: "Moderate air quality (AQI 118)",
    description:
      "Open-Meteo Air Quality reports a moderate AQI driven by particulate matter. Sensitive students (asthma) should limit prolonged outdoor exertion.",
    source: "Open-Meteo",
    distanceKm: 0,
    issuedAt: "2026-06-23T16:00:00+05:30",
    url: "https://open-meteo.com/",
    location: { lat: 26.45, lng: 90.87, label: "Howly, Barpeta" },
  },
  {
    id: "hz-6",
    type: "earthquake",
    severity: "advisory",
    status: "expired",
    title: "M3.6 earthquake — 88 km N of school",
    description:
      "USGS recorded a minor magnitude 3.6 earthquake. No impact reported. Logged for the record.",
    source: "USGS",
    distanceKm: 88,
    issuedAt: "2026-06-21T22:14:00+05:30",
    expiresAt: "2026-06-22T22:14:00+05:30",
    url: "https://earthquake.usgs.gov/",
    location: { lat: 27.24, lng: 90.92, label: "Bhutan foothills" },
    magnitude: 3.6,
  },
]
