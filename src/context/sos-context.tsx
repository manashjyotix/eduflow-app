"use client"

/**
 * sos-context.tsx
 *
 * Live, session-scoped store that links the PARENT transport-SOS producer to
 * the ADMIN / MANAGEMENT emergency-console consumers.
 *
 * Mounted in the (app) layout so an SOS raised from /parent/sos appears
 * instantly on /admin/sos and /management/sos, where staff can post a school
 * response, escalate to authorities, or resolve the incident — and the parent
 * sees those updates reflected back on their own SOS page.
 */

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
} from "react"
import {
  SOS_INCIDENTS,
  type SOSIncident,
  type IncidentType,
  type IncidentSeverity,
  type EscalationTarget,
} from "@/data/mock-sos"

export interface ReportIncidentInput {
  childId: string
  childName: string
  reportedBy: string
  reportedByPhone: string
  type: IncidentType
  severity: IncidentSeverity
  description: string
  routeId: string
  routeName: string
  location: SOSIncident["location"]
}

interface SOSContextValue {
  incidents: SOSIncident[]
  activeCount: number
  /** Parent → raise a new active incident. Returns the created record. */
  reportIncident: (input: ReportIncidentInput) => SOSIncident
  /** Staff → post a school response (marks incident as "responded"). */
  respondToIncident: (id: string, response: string, escalateTo?: EscalationTarget[]) => void
  /** Staff → mark an incident resolved with a closing note. */
  resolveIncident: (id: string, resolvedNote: string) => void
}

const SOSContext = createContext<SOSContextValue | null>(null)

export function SOSProvider({ children }: { children: ReactNode }) {
  const [incidents, setIncidents] = useState<SOSIncident[]>(SOS_INCIDENTS)

  const reportIncident = useCallback((input: ReportIncidentInput): SOSIncident => {
    const record: SOSIncident = {
      id: `sos-${Date.now()}`,
      timestamp: new Date().toISOString(),
      status: "active",
      ...input,
    }
    setIncidents(prev => [record, ...prev])
    return record
  }, [])

  const respondToIncident = useCallback(
    (id: string, response: string, escalateTo?: EscalationTarget[]) => {
      setIncidents(prev =>
        prev.map(i =>
          i.id === id
            ? {
                ...i,
                status: i.status === "resolved" ? i.status : ("responded" as const),
                schoolResponse: response,
                escalatedTo: escalateTo && escalateTo.length > 0 ? escalateTo : i.escalatedTo,
              }
            : i
        )
      )
    },
    []
  )

  const resolveIncident = useCallback((id: string, resolvedNote: string) => {
    setIncidents(prev =>
      prev.map(i =>
        i.id === id
          ? {
              ...i,
              status: "resolved" as const,
              resolvedAt: new Date().toISOString(),
              resolvedNote,
            }
          : i
      )
    )
  }, [])

  const value: SOSContextValue = useMemo(
    () => ({
      incidents,
      activeCount: incidents.filter(i => i.status === "active" || i.status === "responded").length,
      reportIncident,
      respondToIncident,
      resolveIncident,
    }),
    [incidents, reportIncident, respondToIncident, resolveIncident]
  )

  return <SOSContext.Provider value={value}>{children}</SOSContext.Provider>
}

export function useSOS(): SOSContextValue {
  const ctx = useContext(SOSContext)
  if (!ctx) throw new Error("useSOS must be used inside <SOSProvider>")
  return ctx
}
