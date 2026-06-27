"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useRole } from "@/context/role-context"
import { cn } from "@/lib/utils"
import { WeatherScene3D } from "@/components/shared/weather-scene"

interface WeatherGreetingProps {
  /** Explicit latitude. When provided (with lon), geocoding is skipped. */
  lat?: number
  /** Explicit longitude. When provided (with lat), geocoding is skipped. */
  lon?: number
  /** Override the displayed location label. */
  locationName?: string
  /** Override the subtitle line (otherwise taken from role context). */
  subtitle?: string
  className?: string
}

type Condition =
  | "clear" | "partly-cloudy" | "cloudy" | "rain" | "snow" | "fog" | "storm"

interface WeatherState {
  temp: number
  feelsLike: number
  humidity: number
  condition: Condition
  windspeed: number
  description: string
}

/**
 * Configured home location. Browser geolocation is intentionally NOT used:
 * on desktop it resolves via IP and is wildly inaccurate. We forward-geocode
 * this place name at runtime so the label and the weather coordinates always
 * come from the same source. The coords below are a fallback for the region
 * (Dangarkuchi, Barpeta, Assam) used if the geocoding lookup fails.
 */
const HOME_LOCATION = {
  query: "Dangarkuchi",
  name: "Dangarkuchi",
  lat: 26.55,
  lon: 91.35,
}

function codeToCondition(code: number): Condition {
  if (code === 0) return "clear"
  if (code <= 2) return "partly-cloudy"
  if (code === 3) return "cloudy"
  if (code >= 45 && code <= 48) return "fog"
  if (code >= 51 && code <= 67) return "rain"
  if (code >= 71 && code <= 77) return "snow"
  if (code >= 80 && code <= 82) return "rain"
  if (code >= 95) return "storm"
  return "cloudy"
}

const CONDITION_DESC: Record<Condition, string> = {
  clear: "Clear sky",
  "partly-cloudy": "Partly cloudy",
  cloudy: "Overcast",
  rain: "Rainy",
  snow: "Snowy",
  fog: "Foggy",
  storm: "Thunderstorm",
}

/** Time-of-day greeting: morning · afternoon · evening · night. */
function getTimeGreeting(date: Date): string {
  const h = date.getHours()
  if (h >= 5 && h < 12) return "Good Morning"
  if (h >= 12 && h < 17) return "Good Afternoon"
  if (h >= 17 && h < 21) return "Good Evening"
  return "Good Night"
}

/**
 * WeatherGreeting — live, real-time weather + time-of-day greeting banner.
 *
 * • Greeting updates in real time (morning/afternoon/evening/night).
 * • Location name and weather are guaranteed consistent: both are derived
 *   from the same coordinates (forward-geocoded from the configured place,
 *   or the explicit lat/lon props when supplied).
 * • Uses the free Open-Meteo APIs (no key required).
 */
export function WeatherGreeting({ lat, lon, locationName, subtitle: subtitleProp, className }: WeatherGreetingProps) {
  const { name, subtitle: roleSubtitle } = useRole()
  const subtitle = subtitleProp ?? roleSubtitle

  const [weather, setWeather] = useState<WeatherState | null>(null)
  const [place, setPlace] = useState<string>(locationName ?? "")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [now, setNow] = useState<Date>(() => new Date())

  // Real-time clock — re-evaluate the greeting every minute.
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  // Resolve coordinates → fetch weather. Label + weather share the same coords.
  useEffect(() => {
    let cancelled = false

    async function loadWeather(latitude: number, longitude: number) {
      try {
        const params = new URLSearchParams({
          latitude: String(latitude),
          longitude: String(longitude),
          current: [
            "temperature_2m",
            "apparent_temperature",
            "relative_humidity_2m",
            "weather_code",
            "wind_speed_10m",
          ].join(","),
          wind_speed_unit: "kmh",
          timezone: "auto",
        })
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`)
        if (!res.ok) throw new Error("weather fetch failed")
        const data = await res.json()
        if (cancelled) return
        const c = data.current
        const condition = codeToCondition(c.weather_code ?? 0)
        setWeather({
          temp: Math.round(c.temperature_2m ?? 0),
          feelsLike: Math.round(c.apparent_temperature ?? c.temperature_2m ?? 0),
          humidity: Math.round(c.relative_humidity_2m ?? 0),
          condition,
          windspeed: Math.round(c.wind_speed_10m ?? 0),
          description: CONDITION_DESC[condition],
        })
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    async function run() {
      // 1) Explicit coordinates take priority.
      if (lat != null && lon != null) {
        if (!locationName) setPlace("Your location")
        await loadWeather(lat, lon)
        return
      }

      // 2) Forward-geocode the configured home location so the name shown and
      //    the coordinates used for weather are always the same place.
      let latitude = HOME_LOCATION.lat
      let longitude = HOME_LOCATION.lon
      let label = HOME_LOCATION.name
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(HOME_LOCATION.query)}&count=10&language=en&format=json`
        )
        if (res.ok) {
          const data = await res.json()
          const results: Array<{
            latitude: number; longitude: number; name: string
            admin1?: string; admin2?: string; country_code?: string
          }> = data?.results ?? []
          // Only accept a match located in India; otherwise keep the fallback.
          const match =
            results.find((r) => r.country_code === "IN" && /assam/i.test(r.admin1 ?? "")) ??
            results.find((r) => r.country_code === "IN")
          if (match) {
            latitude = match.latitude
            longitude = match.longitude
            label = match.name
          }
        }
      } catch {
        /* keep configured fallback coords + name */
      }
      if (cancelled) return
      setPlace(locationName ?? label)
      await loadWeather(latitude, longitude)
    }

    run()
    return () => { cancelled = true }
  }, [lat, lon, locationName])

  const label = place || HOME_LOCATION.name

  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4", className)}>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground" suppressHydrationWarning>{getTimeGreeting(now)},</p>
        <p className="text-lg font-bold text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {loading ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : error || !weather ? (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Weather</p>
            <p className="text-sm font-semibold">{label}</p>
          </div>
        ) : (
          <>
            <div className="text-right">
              <p className="text-2xl font-black leading-none tracking-tight">{weather.temp}°C</p>
              <p className="text-[11px] text-muted-foreground font-medium">{weather.description}</p>
              <p className="text-[10px] text-muted-foreground/70">Feels like {weather.feelsLike}° · {weather.humidity}% humidity</p>
              <p className="text-[10px] text-muted-foreground/60">{label} · {weather.windspeed} km/h</p>
            </div>
            <div className="flex size-12 items-center justify-center rounded-xl bg-background/60 p-1.5 shadow-inner">
              <WeatherScene3D condition={weather.condition} className="size-full" />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
