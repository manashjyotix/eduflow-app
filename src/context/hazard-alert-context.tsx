"use client"

/**
 * hazard-alert-context.tsx
 *
 * Session-scoped store for the Disaster & Hazard Alert system — the automatic,
 * environment-triggered companion to the human-triggered Transport SOS.
 *
 * Mounted in the (app) layout so every role sees the same live alert state:
 * a dashboard banner for active warning/emergency alerts, an Alerts page, and
 * a nav badge count.
 *
 * Data source toggle:
 *   USE_LIVE_FEEDS = false → MOCK_HAZARD_ALERTS (default, for the prototype)
 *   USE_LIVE_FEEDS = true  → fetchAllHazardAlerts() against the real free APIs
 *                            (USGS / GDACS / Open-Meteo) on a polling interval.
 *
 * Flip the flag (or set NEXT_PUBLIC_HAZARD_LIVE=true) to go live — no other
 * code changes needed; both paths return the same HazardAlert[] shape.
 */

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
} from "react"
import {
  MOCK_HAZARD_ALERTS,
  SCHOOL_LOCATION,
  isAlertLive,
  sortAlerts,
  SEVERITY_RANK,
  type HazardAlert,
} from "@/data/mock-hazard-alerts"
import { fetchAllHazardAlerts } from "@/lib/hazard-feeds"

/** Master switch — mock now, real feeds later (no other code change needed). */
export const USE_LIVE_FEEDS =
  process.env.NEXT_PUBLIC_HAZARD_LIVE === "true"

/** Poll interval for live feeds (ms). 5 min stays well within free rate limits. */
const POLL_INTERVAL_MS = 5 * 60 * 1000

interface HazardAlertContextValue {
  alerts: HazardAlert[]
  /** Live alerts (active, not acknowledged, not expired), severity-sorted. */
  liveAlerts: HazardAlert[]
  /** Count of live alerts — drives the nav badge. */
  activeCount: number
  /** Highest-severity live alert for the global banner (null when none). */
  bannerAlert: HazardAlert | null
  /** Whether live feeds are in use (vs. mock data). */
  isLive: boolean
  /** Whether a live fetch is currently in flight. */
  loading: boolean
  /** Mark an alert acknowledged (removes it from live set, keeps in history). */
  acknowledge: (id: string) => void
  /** Manually re-fetch the live feeds (no-op in mock mode). */
  refresh: () => void
}

const HazardAlertContext = createContext<HazardAlertContextValue | null>(null)

export function HazardAlertProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<HazardAlert[]>(
    USE_LIVE_FEEDS ? [] : sortAlerts(MOCK_HAZARD_ALERTS)
  )
  const [loading, setLoading] = useState(USE_LIVE_FEEDS)

  const refresh = useCallback(() => {
    if (!USE_LIVE_FEEDS) return
    setLoading(true)
    fetchAllHazardAlerts({ lat: SCHOOL_LOCATION.lat, lon: SCHOOL_LOCATION.lon })
      .then((live) => {
        // Preserve locally acknowledged ids across refreshes.
        setAlerts((prev) => {
          const acknowledged = new Set(
            prev.filter((a) => a.status === "acknowledged").map((a) => a.id)
          )
          return sortAlerts(
            live.map((a) =>
              acknowledged.has(a.id) ? { ...a, status: "acknowledged" } : a
            )
          )
        })
      })
      .catch(() => {/* keep last good state */})
      .finally(() => setLoading(false))
  }, [])

  // Poll the live feeds on mount + interval when live.
  useEffect(() => {
    if (!USE_LIVE_FEEDS) return
    refresh()
    const id = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(id)
  }, [refresh])

  const acknowledge = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "acknowledged" } : a))
    )
  }, [])

  const value: HazardAlertContextValue = useMemo(() => {
    const liveAlerts = sortAlerts(alerts.filter((a) => isAlertLive(a)))
    const bannerAlert =
      liveAlerts.find((a) => SEVERITY_RANK[a.severity] >= SEVERITY_RANK.warning) ?? null
    return {
      alerts,
      liveAlerts,
      activeCount: liveAlerts.length,
      bannerAlert,
      isLive: USE_LIVE_FEEDS,
      loading,
      acknowledge,
      refresh,
    }
  }, [alerts, loading, acknowledge, refresh])

  return (
    <HazardAlertContext.Provider value={value}>
      {children}
    </HazardAlertContext.Provider>
  )
}

export function useHazardAlerts(): HazardAlertContextValue {
  const ctx = useContext(HazardAlertContext)
  if (!ctx) throw new Error("useHazardAlerts must be used inside <HazardAlertProvider>")
  return ctx
}
