"use client"

/**
 * sos-trigger.tsx
 *
 * Premium SOS emergency trigger button with a pulsing red design.
 * Opens a shadcn Dialog for incident reporting with:
 *   - Incident type selector (6 types, radio-card style)
 *   - Auto-detected location display
 *   - Description textarea
 *   - Child selector (from useChild context)
 *   - Severity selector (colored badges)
 *   - 3-second hold-to-send countdown
 *   - Success animation after submission
 */

import { useState, useRef, useCallback, useEffect } from "react"
import {
  ShieldAlert,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  User,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useChild } from "@/context/child-context"
import { useRole } from "@/context/role-context"
import { useSOS } from "@/context/sos-context"
import {
  type IncidentType,
  type IncidentSeverity,
  INCIDENT_TYPE_LABEL,
  INCIDENT_TYPE_ICON,
  TRANSPORT_ROUTES,
} from "@/data/mock-sos"

// ─── Constants ──────────────────────────────────────────────────────────────────

const INCIDENT_TYPES = Object.keys(INCIDENT_TYPE_LABEL) as IncidentType[]

const SEVERITY_OPTIONS: {
  value: IncidentSeverity
  label: string
  color: string
  bg: string
  ring: string
}[] = [
  {
    value: "critical",
    label: "Critical",
    color: "text-white",
    bg: "bg-[var(--ef-red)]",
    ring: "ring-[var(--ef-red)]",
  },
  {
    value: "high",
    label: "High",
    color: "text-white",
    bg: "bg-[var(--ef-amber)]",
    ring: "ring-[var(--ef-amber)]",
  },
  {
    value: "medium",
    label: "Medium",
    color: "text-foreground",
    bg: "bg-[var(--ef-amber-light)]",
    ring: "ring-[var(--ef-amber)]",
  },
]

const HOLD_SECONDS = 3

// ─── Component ──────────────────────────────────────────────────────────────────

export function SOSTriggerButton() {
  const { selectedChild } = useChild()
  const { name: reporterName, phone: reporterPhone } = useRole()
  const { reportIncident } = useSOS()

  // Dialog state
  const [open, setOpen] = useState(false)
  const [selectedType, setSelectedType] = useState<IncidentType | null>(null)
  const [severity, setSeverity] = useState<IncidentSeverity>("high")
  const [description, setDescription] = useState("")

  // Hold-to-send state
  const [holding, setHolding] = useState(false)
  const [countdown, setCountdown] = useState(HOLD_SECONDS)
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Success state
  const [sent, setSent] = useState(false)

  // Reset form when dialog closes
  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setSelectedType(null)
      setSeverity("high")
      setDescription("")
      setHolding(false)
      setCountdown(HOLD_SECONDS)
      setSent(false)
      if (holdTimerRef.current) clearInterval(holdTimerRef.current)
    }
    setOpen(next)
  }

  // Hold-to-send handlers
  const startHold = useCallback(() => {
    if (!selectedType || sent) return
    setHolding(true)
    setCountdown(HOLD_SECONDS)

    let remaining = HOLD_SECONDS
    holdTimerRef.current = setInterval(() => {
      remaining -= 1
      setCountdown(remaining)
      if (remaining <= 0) {
        if (holdTimerRef.current) clearInterval(holdTimerRef.current)
        setHolding(false)
        // Push the incident into the shared SOS store so Admin / Management
        // see it live on their emergency console.
        const route = TRANSPORT_ROUTES.find(
          (r) => r.id === selectedChild?.transportRoute
        )
        reportIncident({
          childId: selectedChild?.id ?? "child-1",
          childName: selectedChild?.name ?? "Unknown",
          reportedBy: reporterName,
          reportedByPhone: reporterPhone,
          type: selectedType,
          severity,
          description: description.trim() || `${INCIDENT_TYPE_LABEL[selectedType]} reported on the transport route.`,
          routeId: route?.id ?? selectedChild?.transportRoute ?? "route-1",
          routeName: route?.name ?? "Transport Route",
          location: {
            lat: 26.4505,
            lng: 90.8801,
            address: "Howly, Barpeta, Assam",
          },
        })
        setSent(true)
      }
    }, 1000)
  }, [selectedType, sent, selectedChild, reporterName, reporterPhone, severity, description, reportIncident])

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) clearInterval(holdTimerRef.current)
    setHolding(false)
    setCountdown(HOLD_SECONDS)
  }, [])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearInterval(holdTimerRef.current)
    }
  }, [])

  const isFormValid = selectedType !== null

  return (
    <>
      {/* ── Pulsing SOS Button ───────────────────────────────────── */}
      <button
        onClick={() => setOpen(true)}
        className="group relative flex flex-col items-center gap-3 focus:outline-none"
        aria-label="Trigger SOS Emergency Alert"
      >
        {/* Outer pulse rings */}
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] size-36 rounded-full bg-[var(--ef-red)]/10 animate-[sos-ping_2s_ease-out_infinite]" />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] size-28 rounded-full bg-[var(--ef-red)]/15 animate-[sos-ping_2s_ease-out_0.5s_infinite]" />

        {/* Main button */}
        <div
          className={cn(
            "relative z-10 flex items-center justify-center size-24 rounded-full",
            "bg-gradient-to-br from-[var(--ef-red)] to-[#CC2F26]",
            "shadow-[0_0_40px_rgba(255,59,48,0.4),0_8px_24px_rgba(255,59,48,0.3)]",
            "transition-all duration-200",
            "group-hover:scale-110 group-hover:shadow-[0_0_60px_rgba(255,59,48,0.5),0_12px_32px_rgba(255,59,48,0.4)]",
            "group-active:scale-95"
          )}
        >
          <ShieldAlert className="size-10 text-white drop-shadow-md" />
        </div>

        <span className="relative z-10 text-sm font-bold text-[var(--ef-red)] tracking-wide uppercase">
          SOS Emergency
        </span>
      </button>

      {/* ── SOS Report Dialog ────────────────────────────────────── */}
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {/* ─ Success state ─ */}
          {sent ? (
            <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
              <div className="size-20 rounded-full bg-[var(--ef-green)]/15 flex items-center justify-center animate-[sos-success-pop_0.4s_ease-out]">
                <CheckCircle2 className="size-10 text-[var(--ef-green)]" />
              </div>
              <h3 className="text-xl font-bold text-foreground">
                SOS Alert Sent!
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Your emergency alert has been sent to the school administration
                and relevant authorities. Help is on the way.
              </p>
              <div className="rounded-lg bg-[var(--ef-green-light)] border border-[var(--ef-green)]/20 px-4 py-3 text-xs text-[var(--ef-green-dark)] w-full">
                <p className="font-semibold">What happens next:</p>
                <ul className="mt-1 space-y-0.5 text-left list-disc list-inside">
                  <li>School admin notified immediately</li>
                  <li>Bus driver alerted via phone</li>
                  <li>You&apos;ll receive status updates</li>
                </ul>
              </div>
              <Button
                onClick={() => handleOpenChange(false)}
                className="mt-2 w-full"
              >
                Close
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="size-5" />
                  Report Emergency
                </DialogTitle>
                <DialogDescription>
                  Report a safety incident on{" "}
                  {selectedChild?.name ?? "your child"}&apos;s transport route.
                  This alert will be sent to the school immediately.
                </DialogDescription>
              </DialogHeader>

              <Separator />

              {/* ─ Child info ─ */}
              <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <User className="size-4 text-muted-foreground" />
                <span className="font-medium">{selectedChild?.name}</span>
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  {selectedChild?.className}
                </Badge>
              </div>

              {/* ─ Location ─ */}
              <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm">
                <MapPin className="size-4 text-[var(--ef-brand)] flex-shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">
                    Auto-detected location
                  </p>
                  <p className="font-medium text-xs">
                    Howly, Barpeta, Assam
                  </p>
                </div>
              </div>

              {/* ─ Incident Type ─ */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  What happened?
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {INCIDENT_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border-2 px-3 py-2.5 text-left transition-all text-sm",
                        selectedType === type
                          ? "border-[var(--ef-red)] bg-[var(--ef-red)]/5 shadow-sm"
                          : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                      )}
                    >
                      <span className="text-lg leading-none">
                        {INCIDENT_TYPE_ICON[type]}
                      </span>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          selectedType === type
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {INCIDENT_TYPE_LABEL[type]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ─ Severity ─ */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Severity Level
                </Label>
                <div className="flex gap-2">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSeverity(opt.value)}
                      className={cn(
                        "flex-1 rounded-lg px-3 py-2 text-xs font-bold transition-all text-center",
                        opt.bg,
                        opt.color,
                        severity === opt.value
                          ? `ring-2 ${opt.ring} ring-offset-2 ring-offset-background scale-105`
                          : "opacity-60 hover:opacity-80"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ─ Description ─ */}
              <div className="space-y-2">
                <Label
                  htmlFor="sos-desc"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  Brief description{" "}
                  <span className="font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="sos-desc"
                  placeholder="Describe the emergency briefly…"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[60px] text-sm resize-none"
                  rows={2}
                />
              </div>

              <Separator />

              {/* ─ Hold-to-Send Button ─ */}
              <div className="space-y-2">
                {!isFormValid && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <AlertTriangle className="size-3" />
                    Select an incident type above to enable SOS
                  </p>
                )}
                <button
                  type="button"
                  disabled={!isFormValid}
                  onMouseDown={startHold}
                  onMouseUp={cancelHold}
                  onMouseLeave={cancelHold}
                  onTouchStart={startHold}
                  onTouchEnd={cancelHold}
                  className={cn(
                    "relative w-full rounded-xl py-4 text-sm font-bold text-white transition-all overflow-hidden",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    isFormValid
                      ? "bg-gradient-to-r from-[var(--ef-red)] to-[#CC2F26] hover:shadow-lg active:scale-[0.98] cursor-pointer"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {/* Progress fill during hold */}
                  {holding && (
                    <span
                      className="absolute inset-0 bg-white/20 transition-all origin-left"
                      style={{
                        transform: `scaleX(${(HOLD_SECONDS - countdown) / HOLD_SECONDS})`,
                      }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <ShieldAlert className="size-5" />
                    {holding
                      ? `Hold to Send SOS (${countdown}…)`
                      : "Hold to Send SOS Alert"}
                  </span>
                </button>
                <p className="text-[10px] text-center text-muted-foreground">
                  Hold the button for {HOLD_SECONDS} seconds to confirm and send
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Keyframe animations (injected once) ──────────────────── */}
      <style jsx global>{`
        @keyframes sos-ping {
          0% {
            transform: translate(-50%, -60%) scale(0.8);
            opacity: 0.6;
          }
          100% {
            transform: translate(-50%, -60%) scale(1.4);
            opacity: 0;
          }
        }
        @keyframes sos-success-pop {
          0% {
            transform: scale(0.5);
            opacity: 0;
          }
          60% {
            transform: scale(1.15);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}
