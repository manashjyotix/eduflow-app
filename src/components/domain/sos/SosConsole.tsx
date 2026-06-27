"use client"

/**
 * SosConsole.tsx
 *
 * Shared school-side emergency console for STUDENT transport SOS alerts.
 * Used by both /admin/sos and /management/sos.
 *
 * Reads/writes the live `sos-context` store, so an SOS raised by a parent on
 * /parent/sos appears here instantly. Staff can post a school response,
 * escalate to authorities, or resolve the incident — and those updates show
 * back on the parent's SOS page.
 */

import { useState } from "react"
import { toast } from "sonner"
import {
  ShieldAlert, AlertTriangle, CheckCircle2, Siren, Filter,
  Search, Phone, Shield, Cross, Bus,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { SOSIncidentCard } from "@/components/domain/sos/sos-incident-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useSOS } from "@/context/sos-context"
import {
  type SOSIncident,
  type EscalationTarget,
} from "@/data/mock-sos"

const ESCALATION_OPTIONS: { value: EscalationTarget; label: string; icon: React.ReactNode }[] = [
  { value: "police",    label: "Police",    icon: <Shield className="size-3.5" /> },
  { value: "ambulance", label: "Ambulance", icon: <Cross className="size-3.5" /> },
  { value: "hospital",  label: "Hospital",  icon: <Siren className="size-3.5" /> },
]

interface SosConsoleProps {
  subtitle?: string
}

export function SosConsole({ subtitle }: SosConsoleProps) {
  const { incidents, respondToIncident, resolveIncident } = useSOS()

  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // Respond dialog
  const [respondTarget, setRespondTarget] = useState<SOSIncident | null>(null)
  const [responseText, setResponseText] = useState("")
  const [escalations, setEscalations] = useState<EscalationTarget[]>([])

  // Resolve dialog
  const [resolveTarget, setResolveTarget] = useState<SOSIncident | null>(null)
  const [resolveNote, setResolveNote] = useState("")

  const active   = incidents.filter(i => i.status === "active").length
  const responded = incidents.filter(i => i.status === "responded").length
  const resolved = incidents.filter(i => i.status === "resolved").length
  const critical = incidents.filter(i => i.severity === "critical" && i.status !== "resolved").length

  const filtered = incidents.filter(i => {
    const q = query.toLowerCase()
    const matchSearch =
      i.childName.toLowerCase().includes(q) ||
      i.routeName.toLowerCase().includes(q) ||
      i.reportedBy.toLowerCase().includes(q) ||
      i.location.address.toLowerCase().includes(q)
    const matchStatus = statusFilter === "all" || i.status === statusFilter
    return matchSearch && matchStatus
  })

  // active first, then responded, then resolved; newest first within group
  const order: Record<string, number> = { active: 0, responded: 1, resolved: 2 }
  const sorted = [...filtered].sort((a, b) => {
    if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status]
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  function toggleEscalation(t: EscalationTarget) {
    setEscalations(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  function openRespond(i: SOSIncident) {
    setRespondTarget(i)
    setResponseText(i.schoolResponse ?? "")
    setEscalations(i.escalatedTo ?? [])
  }

  function confirmRespond() {
    if (!respondTarget || !responseText.trim()) return
    respondToIncident(respondTarget.id, responseText.trim(), escalations)
    toast.success("Response posted", {
      description: `${respondTarget.childName} — school response recorded. Parent notified.`,
    })
    setRespondTarget(null)
    setResponseText("")
    setEscalations([])
  }

  function confirmResolve() {
    if (!resolveTarget || !resolveNote.trim()) return
    resolveIncident(resolveTarget.id, resolveNote.trim())
    toast.success("Incident resolved", {
      description: `${resolveTarget.childName} — incident closed. Parent notified.`,
    })
    setResolveTarget(null)
    setResolveNote("")
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<ShieldAlert size={22} />}
        title="Transport SOS Console"
        subtitle={subtitle ?? "Monitor and respond to student transport emergency alerts"}
      />

      {critical > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <Siren className="size-4 animate-pulse" />
          <span className="font-semibold">{critical} critical incident{critical > 1 ? "s" : ""} need immediate attention.</span>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard title="Active" value={active} subtitle={active === 0 ? "No live alerts" : "Awaiting response"} icon={<AlertTriangle className="size-5" />} tone="red" />
        <KpiCard title="Responded" value={responded} subtitle="School acted" icon={<ShieldAlert className="size-5" />} tone="amber" />
        <KpiCard title="Resolved" value={resolved} subtitle="Closed incidents" icon={<CheckCircle2 className="size-5" />} tone="green" />
        <KpiCard title="Total" value={incidents.length} subtitle="All transport incidents" icon={<Bus className="size-5" />} tone="brand" />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4 pb-3 flex-wrap">
          <CardTitle className="text-base">Incident Feed</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <SearchInput
                placeholder="Search child, route, location..."
                className="h-8 w-60 pl-8"
                value={query}
                onChange={e => setQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 w-36 text-xs">
                <Filter className="size-3 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="responded">Responded</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          {sorted.length === 0 ? (
            <EmptyState icon={<ShieldAlert className="size-6" />} title="No incidents" description="No transport SOS incidents match your filters." />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {sorted.map(i => (
                <div key={i.id} className="flex flex-col gap-2">
                  <SOSIncidentCard incident={i} />
                  <div className="flex items-center gap-2 flex-wrap px-1">
                    <Button asChild size="sm" variant="outline">
                      <a href={`tel:${i.reportedByPhone}`}>
                        <Phone className="size-3.5" /> Call reporter
                      </a>
                    </Button>
                    {i.status !== "resolved" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => openRespond(i)}>
                          <ShieldAlert className="size-3.5" /> {i.schoolResponse ? "Update response" : "Respond"}
                        </Button>
                        <Button size="sm" onClick={() => { setResolveTarget(i); setResolveNote("") }}>
                          <CheckCircle2 className="size-3.5" /> Resolve
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Respond dialog */}
      <Dialog open={respondTarget !== null} onOpenChange={(o) => { if (!o) { setRespondTarget(null); setResponseText(""); setEscalations([]) } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--ef-amber-dark)]">
              <ShieldAlert className="size-5" /> Post School Response
            </DialogTitle>
            <DialogDescription>
              {respondTarget ? `${respondTarget.childName} · ${respondTarget.routeName}` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Response / action taken</Label>
              <Textarea
                placeholder="e.g. School van dispatched, driver contacted, parent informed…"
                value={responseText}
                onChange={e => setResponseText(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Escalate to authorities</Label>
              <div className="flex gap-2">
                {ESCALATION_OPTIONS.map(opt => {
                  const selected = escalations.includes(opt.value)
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => toggleEscalation(opt.value)}
                      className={cn(
                        "flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border-2 px-3 py-2 text-xs font-semibold transition-colors",
                        selected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      {opt.icon} {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="secondary" onClick={() => { setRespondTarget(null); setResponseText(""); setEscalations([]) }}>Cancel</Button>
            <Button onClick={confirmRespond} disabled={!responseText.trim()}>Post Response</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve dialog */}
      <Dialog open={resolveTarget !== null} onOpenChange={(o) => { if (!o) { setResolveTarget(null); setResolveNote("") } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--ef-green-dark)]">
              <CheckCircle2 className="size-5" /> Resolve Incident
            </DialogTitle>
            <DialogDescription>
              {resolveTarget ? `${resolveTarget.childName} · ${resolveTarget.routeName}` : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Resolution note</Label>
            <Textarea
              placeholder="Describe how the incident was resolved…"
              value={resolveNote}
              onChange={e => setResolveNote(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => { setResolveTarget(null); setResolveNote("") }}>Cancel</Button>
            <Button onClick={confirmResolve} disabled={!resolveNote.trim()}>Mark Resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
