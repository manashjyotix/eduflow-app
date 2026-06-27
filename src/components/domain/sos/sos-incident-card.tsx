"use client"

/**
 * sos-incident-card.tsx
 *
 * Displays a single SOS incident with visual severity coding, status badges,
 * location info, school response, escalation targets, and resolution notes.
 */

import {
  MapPin,
  Phone,
  Clock,
  CheckCircle2,
  Siren,
  Shield,
  Cross,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  type SOSIncident,
  type EscalationTarget,
  INCIDENT_TYPE_LABEL,
  INCIDENT_TYPE_ICON,
  SEVERITY_LABEL,
  STATUS_LABEL,
  STATUS_CLASS,
} from "@/data/mock-sos"

// ─── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return "Just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

const SEVERITY_BORDER: Record<string, string> = {
  critical: "border-l-[var(--ef-red)]",
  high: "border-l-[var(--ef-amber)]",
  medium: "border-l-[var(--ef-amber-light)]",
}

const SEVERITY_BADGE_CLASS: Record<string, string> = {
  critical:
    "bg-[var(--ef-red)]/15 text-[var(--ef-red-dark)] border-[var(--ef-red)]/30",
  high: "bg-[var(--ef-amber)]/15 text-[var(--ef-amber-dark)] border-[var(--ef-amber)]/30",
  medium:
    "bg-[var(--ef-amber-light)] text-[var(--ef-amber-dark)] border-[var(--ef-amber)]/20",
}

const ESCALATION_CONFIG: Record<
  EscalationTarget,
  { icon: React.ReactNode; label: string; color: string }
> = {
  police: {
    icon: <Shield className="size-3" />,
    label: "Police",
    color: "bg-[var(--ef-brand)]/10 text-[var(--ef-brand)]",
  },
  ambulance: {
    icon: <Cross className="size-3" />,
    label: "Ambulance",
    color: "bg-[var(--ef-red)]/10 text-[var(--ef-red)]",
  },
  hospital: {
    icon: <Siren className="size-3" />,
    label: "Hospital",
    color: "bg-[var(--ef-purple)]/10 text-[var(--ef-purple)]",
  },
}

// ─── Component ──────────────────────────────────────────────────────────────────

interface SOSIncidentCardProps {
  incident: SOSIncident
  className?: string
}

export function SOSIncidentCard({ incident, className }: SOSIncidentCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden border-l-4",
        SEVERITY_BORDER[incident.severity],
        className
      )}
    >
      <CardContent className="p-4 space-y-3">
        {/* ── Header: type + badges ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl leading-none flex-shrink-0">
              {INCIDENT_TYPE_ICON[incident.type]}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">
                {INCIDENT_TYPE_LABEL[incident.type]}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {incident.childName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold",
                SEVERITY_BADGE_CLASS[incident.severity]
              )}
            >
              {SEVERITY_LABEL[incident.severity]}
            </Badge>
            <Badge
              variant="outline"
              className={cn("text-[10px]", STATUS_CLASS[incident.status])}
            >
              {STATUS_LABEL[incident.status]}
            </Badge>
          </div>
        </div>

        {/* ── Description ── */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          {incident.description}
        </p>

        <Separator />

        {/* ── Location + Time (left-aligned) ── */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-start gap-1.5">
            <MapPin className="size-3.5 text-[var(--ef-brand)] flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">
              {incident.location.address}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-muted-foreground">
              Reported {timeAgo(incident.timestamp)}
            </span>
          </div>
        </div>

        {/* ── Reporter ── */}
        <div className="flex items-center gap-2 text-xs bg-muted/50 rounded-md px-2.5 py-1.5">
          <span className="text-muted-foreground">Reported by:</span>
          <span className="font-medium">{incident.reportedBy}</span>
          <a
            href={`tel:${incident.reportedByPhone}`}
            className="ml-auto flex items-center gap-1 text-[var(--ef-brand)] hover:underline"
          >
            <Phone className="size-3" />
            {incident.reportedByPhone}
          </a>
        </div>

        {/* ── School Response ── */}
        {incident.schoolResponse && (
          <div className="rounded-md bg-[var(--ef-brand)]/5 border border-[var(--ef-brand)]/10 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ef-brand)] mb-0.5">
              School Response
            </p>
            <p className="text-xs text-foreground leading-relaxed">
              {incident.schoolResponse}
            </p>
          </div>
        )}

        {/* ── Escalation badges ── */}
        {incident.escalatedTo && incident.escalatedTo.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">
              Escalated:
            </span>
            {incident.escalatedTo.map((target) => {
              const cfg = ESCALATION_CONFIG[target]
              return (
                <span
                  key={target}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    cfg.color
                  )}
                >
                  {cfg.icon}
                  {cfg.label}
                </span>
              )
            })}
          </div>
        )}

        {/* ── Resolution ── */}
        {incident.status === "resolved" && incident.resolvedNote && (
          <div className="rounded-md bg-[var(--ef-green-light)] border border-[var(--ef-green)]/15 px-3 py-2">
            <div className="flex items-center gap-1.5 mb-0.5">
              <CheckCircle2 className="size-3 text-[var(--ef-green)]" />
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--ef-green-dark)]">
                Resolved
                {incident.resolvedAt && (
                  <span className="font-normal ml-1">
                    · {timeAgo(incident.resolvedAt)}
                  </span>
                )}
              </p>
            </div>
            <p className="text-xs text-[var(--ef-green-dark)] leading-relaxed">
              {incident.resolvedNote}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
