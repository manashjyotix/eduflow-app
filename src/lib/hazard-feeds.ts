/**
 * hazard-feeds.ts
 *
 * Live adapters that fetch real disaster/hazard data from FREE, genuine
 * providers and normalise each into the shared `HazardAlert` shape used across
 * the app. No API keys are required for any of these sources.
 *
 *   • USGS Earthquake API   — global, real-time, GeoJSON, no key
 *   • GDACS                 — global multi-hazard (flood/cyclone/etc.), no key
 *   • Open-Meteo            — severe weather (heavy rain / wind / heat), no key
 *   • Open-Meteo Air Quality— AQI / particulate matter, no key
 *
 * These run client-side in the prototype. In production they would be polled by
 * a server cron and pushed via FCM/SMS. The context decides whether to use
 * these (USE_LIVE_FEEDS = true) or the mock feed.
 *
 * Every adapter is defensive: on any failure it resolves to [] so one bad feed
 * never breaks the others. All alerts are geo-filtered to within
 * ALERT_RADIUS_KM of the school and carry an official `url` for verification.
 */

import {
  type HazardAlert,
  type HazardSeverity,
  ALERT_RADIUS_KM,
  distanceKm,
  sortAlerts,
} from "@/data/mock-hazard-alerts"

interface GeoPoint {
  lat: number
  lon: number
}

// ─── USGS Earthquakes ───────────────────────────────────────────────────────────
// https://earthquake.usgs.gov/fdsnws/event/1/

function quakeSeverity(mag: number, dist: number): HazardSeverity {
  if (mag >= 6 || (mag >= 5 && dist < 150)) return "emergency"
  if (mag >= 5 || (mag >= 4.5 && dist < 200)) return "warning"
  if (mag >= 4) return "watch"
  return "advisory"
}

export async function fetchUsgsEarthquakes(school: GeoPoint): Promise<HazardAlert[]> {
  try {
    const params = new URLSearchParams({
      format: "geojson",
      latitude: String(school.lat),
      longitude: String(school.lon),
      maxradiuskm: String(ALERT_RADIUS_KM),
      minmagnitude: "3",
      orderby: "time",
      // Last 24 hours.
      starttime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    })
    const res = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?${params.toString()}`
    )
    if (!res.ok) throw new Error("USGS fetch failed")
    const data = await res.json()
    const features: Array<{
      id: string
      properties: { mag: number; place: string; time: number; url: string; title: string }
      geometry: { coordinates: [number, number, number] }
    }> = data?.features ?? []

    return features.map((f) => {
      const [lng, lat] = f.geometry.coordinates
      const dist = distanceKm(school.lat, school.lon, lat, lng)
      const mag = f.properties.mag ?? 0
      return {
        id: `usgs-${f.id}`,
        type: "earthquake",
        severity: quakeSeverity(mag, dist),
        status: "active",
        title: `M${mag.toFixed(1)} earthquake — ${dist} km away`,
        description: f.properties.title || f.properties.place,
        source: "USGS",
        distanceKm: dist,
        issuedAt: new Date(f.properties.time).toISOString(),
        url: f.properties.url,
        location: { lat, lng, label: f.properties.place },
        magnitude: mag,
      } satisfies HazardAlert
    })
  } catch {
    return []
  }
}

// ─── GDACS multi-hazard (flood, cyclone, etc.) ──────────────────────────────────
// https://www.gdacs.org/gdacsapi/api/events/geteventlist/EVENTS4APP

function gdacsTypeToHazard(eventType: string): HazardAlert["type"] | null {
  switch (eventType?.toUpperCase()) {
    case "FL": return "flood"
    case "TC": return "cyclone"
    case "EQ": return "earthquake"
    case "WF": return "wildfire"
    case "DR": return "heat"
    default:   return null
  }
}

function gdacsAlertLevelToSeverity(level: string): HazardSeverity {
  switch (level?.toLowerCase()) {
    case "red":    return "emergency"
    case "orange": return "warning"
    case "green":  return "watch"
    default:       return "advisory"
  }
}

export async function fetchGdacsAlerts(school: GeoPoint): Promise<HazardAlert[]> {
  try {
    // Fetch via our server-side proxy to avoid CORS (GDACS blocks browser
    // requests). Falls back gracefully to [] on any error.
    const res = await fetch("/api/hazard/gdacs")
    if (!res.ok) throw new Error("GDACS fetch failed")
    const data = await res.json()
    const features: Array<{
      properties: {
        eventid: number
        eventtype: string
        alertlevel: string
        name: string
        htmldescription?: string
        description?: string
        fromdate: string
        todate?: string
        url?: { report?: string }
        country?: string
      }
      geometry: { coordinates: [number, number] }
    }> = data?.features ?? []

    const alerts: HazardAlert[] = []
    for (const f of features) {
      const type = gdacsTypeToHazard(f.properties.eventtype)
      if (!type) continue
      const [lng, lat] = f.geometry.coordinates
      const dist = distanceKm(school.lat, school.lon, lat, lng)
      if (dist > ALERT_RADIUS_KM) continue
      alerts.push({
        id: `gdacs-${f.properties.eventid}`,
        type,
        severity: gdacsAlertLevelToSeverity(f.properties.alertlevel),
        status: "active",
        title: f.properties.name,
        description:
          f.properties.description ||
          f.properties.htmldescription?.replace(/<[^>]+>/g, "") ||
          f.properties.name,
        source: "GDACS",
        distanceKm: dist,
        issuedAt: new Date(f.properties.fromdate).toISOString(),
        expiresAt: f.properties.todate
          ? new Date(f.properties.todate).toISOString()
          : undefined,
        url: f.properties.url?.report || "https://www.gdacs.org/",
        location: {
          lat,
          lng,
          label: f.properties.country || f.properties.name,
        },
      })
    }
    return alerts
  } catch {
    return []
  }
}

// ─── Open-Meteo severe weather (heavy rain / wind / heat) ────────────────────────
// https://open-meteo.com/ — derive simple warnings from the daily forecast.

export async function fetchOpenMeteoWeatherAlerts(school: GeoPoint): Promise<HazardAlert[]> {
  try {
    const params = new URLSearchParams({
      latitude: String(school.lat),
      longitude: String(school.lon),
      daily: "precipitation_sum,wind_speed_10m_max,temperature_2m_max,apparent_temperature_max",
      timezone: "auto",
      forecast_days: "1",
    })
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
    if (!res.ok) throw new Error("Open-Meteo fetch failed")
    const data = await res.json()
    const d = data?.daily
    if (!d) return []

    const rain = d.precipitation_sum?.[0] ?? 0
    const wind = d.wind_speed_10m_max?.[0] ?? 0
    const feels = d.apparent_temperature_max?.[0] ?? 0
    const date: string = d.time?.[0]
    const issuedAt = new Date().toISOString()
    const expiresAt = date ? new Date(`${date}T23:59:59`).toISOString() : undefined
    const loc = { lat: school.lat, lng: school.lon, label: "School location" }
    const out: HazardAlert[] = []

    // Heavy rain thresholds (mm/day).
    if (rain >= 50) {
      const severity: HazardSeverity = rain >= 115 ? "emergency" : rain >= 75 ? "warning" : "watch"
      out.push({
        id: `om-rain-${date}`,
        type: "storm",
        severity,
        status: "active",
        title: `Heavy rainfall expected — ${Math.round(rain)}mm`,
        description: `Forecast rainfall of ${Math.round(rain)}mm with winds up to ${Math.round(wind)} km/h. Waterlogging and reduced visibility likely.`,
        source: "Open-Meteo",
        distanceKm: 0,
        issuedAt,
        expiresAt,
        url: "https://open-meteo.com/",
        location: loc,
      })
    }

    // High wind (km/h).
    if (wind >= 60) {
      out.push({
        id: `om-wind-${date}`,
        type: "storm",
        severity: wind >= 90 ? "warning" : "watch",
        status: "active",
        title: `Strong winds — gusts to ${Math.round(wind)} km/h`,
        description: `Sustained high winds forecast. Secure loose objects and avoid open assembly areas.`,
        source: "Open-Meteo",
        distanceKm: 0,
        issuedAt,
        expiresAt,
        url: "https://open-meteo.com/",
        location: loc,
      })
    }

    // Heat (feels-like °C).
    if (feels >= 38) {
      out.push({
        id: `om-heat-${date}`,
        type: "heat",
        severity: feels >= 45 ? "warning" : "advisory",
        status: "active",
        title: `Heat advisory — feels like ${Math.round(feels)}°C`,
        description: `High heat index. Ensure hydration and limit midday outdoor activity.`,
        source: "Open-Meteo",
        distanceKm: 0,
        issuedAt,
        expiresAt,
        url: "https://open-meteo.com/",
        location: loc,
      })
    }

    return out
  } catch {
    return []
  }
}

// ─── Open-Meteo Air Quality ──────────────────────────────────────────────────────
// https://air-quality-api.open-meteo.com/

export async function fetchOpenMeteoAirQuality(school: GeoPoint): Promise<HazardAlert[]> {
  try {
    const params = new URLSearchParams({
      latitude: String(school.lat),
      longitude: String(school.lon),
      current: "us_aqi",
      timezone: "auto",
    })
    const res = await fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?${params.toString()}`
    )
    if (!res.ok) throw new Error("Air quality fetch failed")
    const data = await res.json()
    const aqi: number | undefined = data?.current?.us_aqi
    if (aqi == null || aqi < 101) return [] // Only surface "moderate" and worse.

    const severity: HazardSeverity =
      aqi >= 201 ? "warning" : aqi >= 151 ? "watch" : "advisory"
    return [
      {
        id: `om-aqi-${new Date().toISOString().slice(0, 10)}`,
        type: "air",
        severity,
        status: "active",
        title: `Air quality alert — AQI ${Math.round(aqi)}`,
        description: `Air Quality Index is ${Math.round(aqi)}. Sensitive students should limit prolonged outdoor exertion.`,
        source: "Open-Meteo",
        distanceKm: 0,
        issuedAt: new Date().toISOString(),
        url: "https://open-meteo.com/en/docs/air-quality-api",
        location: { lat: school.lat, lng: school.lon, label: "School location" },
      },
    ]
  } catch {
    return []
  }
}

// ─── Aggregator ──────────────────────────────────────────────────────────────────

/**
 * Fetch every live feed in parallel, merge, geo-filter, and sort by severity.
 * A single failing provider never blocks the rest (each resolves to []).
 */
export async function fetchAllHazardAlerts(school: GeoPoint): Promise<HazardAlert[]> {
  const results = await Promise.all([
    fetchUsgsEarthquakes(school),
    fetchGdacsAlerts(school),
    fetchOpenMeteoWeatherAlerts(school),
    fetchOpenMeteoAirQuality(school),
  ])
  const merged = results
    .flat()
    .filter((a) => a.distanceKm <= ALERT_RADIUS_KM)
  return sortAlerts(merged)
}
