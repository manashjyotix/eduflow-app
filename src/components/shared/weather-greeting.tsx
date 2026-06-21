"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useRole } from "@/context/role-context"
import { cn } from "@/lib/utils"
import { WeatherScene3D } from "@/components/shared/weather-scene"

interface WeatherGreetingProps {
  /** Latitude (default: Howly, Assam). */
  lat?: number
  /** Longitude (default: Howly, Assam). */
  lon?: number
  className?: string
}

type Condition =
  | "clear" | "partly-cloudy" | "cloudy" | "rain" | "snow" | "fog" | "storm"

interface WeatherState {
  temp: number
  condition: Condition
  windspeed: number
  description: string
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

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

/**
 * WeatherGreeting — live weather + time-of-day/role greeting banner.
 * Uses the free Open-Meteo API (no key required). Defaults to Howly, Assam.
 */
export function WeatherGreeting({ lat = 26.45, lon = 90.87, className }: WeatherGreetingProps) {
  const { name, subtitle } = useRole()
  const [weather, setWeather] = useState<WeatherState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function fetchWeather() {
      try {
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        )
        if (!res.ok) throw new Error("weather fetch failed")
        const data = await res.json()
        if (cancelled) return
        const cw = data.current_weather
        const condition = codeToCondition(cw.weathercode)
        setWeather({
          temp: Math.round(cw.temperature),
          condition,
          windspeed: Math.round(cw.windspeed),
          description: CONDITION_DESC[condition],
        })
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetchWeather()
    return () => { cancelled = true }
  }, [lat, lon])

  return (
    <div className={cn("flex items-center justify-between gap-4 rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent p-4", className)}>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{greeting()},</p>
        <p className="text-lg font-bold text-foreground truncate">{name}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {loading ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : error || !weather ? (
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Weather</p>
            <p className="text-sm font-semibold">Howly</p>
          </div>
        ) : (
          <>
            <div className="text-right">
              <p className="text-2xl font-black leading-none">{weather.temp}°</p>
              <p className="text-[11px] text-muted-foreground">{weather.description}</p>
              <p className="text-[10px] text-muted-foreground/70">Howly · {weather.windspeed} km/h</p>
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
