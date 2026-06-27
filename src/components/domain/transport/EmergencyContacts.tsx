"use client"

/**
 * EmergencyContacts  (Feature F7 — Transport tracking)
 *
 * Shared emergency-contact directory used by the Driver, Admin, and Management
 * roles. Surfaces the details a driver/operator needs in an emergency: student
 * name, age, class/section, blood group, parent phone, and a secondary
 * emergency number — each phone is a tap-to-call link.
 *
 * Pass any list of students; an optional `metaByStudentId` adds a per-row line
 * (e.g. the route stop a child gets off at).
 */

import { useMemo, useState } from "react"
import {
  Phone, Droplet, GraduationCap, Cake, ShieldAlert, Users,
  CheckCircle2, MapPin, Bus, CircleDashed,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { ScrollX } from "@/components/shared/scroll-x"
import { ageFromDob, type Student } from "@/data/students"

function CallButton({ phone, label }: { phone?: string; label: string }) {
  if (!phone) return <span className="text-xs text-muted-foreground">—</span>
  return (
    <Button
      asChild
      size="sm"
      variant="outline"
      className="h-8 gap-1.5 px-2.5 text-xs"
    >
      <a href={`tel:${phone}`} aria-label={`Call ${label} on ${phone}`}>
        <Phone className="size-3.5" /> {phone}
      </a>
    </Button>
  )
}

/** Live drop / pickup state for a student on a transport route. */
export type PickupTone = "picked-up" | "reached" | "enroute" | "idle"

export interface PickupStatus {
  tone: PickupTone
  label: string
  /** Optional second line, e.g. "by Mother at 15:05" or the stop name. */
  detail?: string
}

const PICKUP_META: Record<
  PickupTone,
  { Icon: React.ElementType; className: string }
> = {
  "picked-up": {
    Icon: CheckCircle2,
    className: "border-[var(--ef-green)]/40 bg-[var(--ef-green-light)] text-[var(--ef-green-dark)]",
  },
  reached: {
    Icon: MapPin,
    className: "border-[var(--ef-amber)]/40 bg-[var(--ef-amber-light)] text-[var(--ef-amber-dark)]",
  },
  enroute: {
    Icon: Bus,
    className: "border-primary/40 bg-[var(--info)] text-[var(--info-foreground)]",
  },
  idle: {
    Icon: CircleDashed,
    className: "text-muted-foreground",
  },
}

function PickupBadge({ status }: { status?: PickupStatus }) {
  if (!status) return <span className="text-xs text-muted-foreground">—</span>
  const { Icon, className } = PICKUP_META[status.tone]
  return (
    <div className="flex flex-col gap-0.5">
      <Badge variant="outline" className={`w-fit gap-1 text-[11px] ${className}`}>
        <Icon className="size-3" /> {status.label}
      </Badge>
      {status.detail && (
        <span className="text-[11px] text-muted-foreground">{status.detail}</span>
      )}
    </div>
  )
}

export interface EmergencyContactsProps {
  students: Student[]
  title?: string
  subtitle?: string
  /** Optional per-row context line, e.g. the bus stop the child gets off at. */
  metaByStudentId?: Record<string, string>
  /**
   * Optional live drop/pickup status per student. When provided, a "Pickup"
   * column is shown reflecting whether the child reached their stop and was
   * received by a parent.
   */
  statusByStudentId?: Record<string, PickupStatus>
}

export function EmergencyContacts({
  students, title = "Emergency Contacts", subtitle, metaByStudentId, statusByStudentId,
}: EmergencyContactsProps) {
  const [q, setQ] = useState("")
  const showStatus = !!statusByStudentId

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return students
    return students.filter((s) =>
      [s.name, s.parentName, s.class, s.section, s.bloodGroup, s.parentPhone, s.emergencyPhone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(term)),
    )
  }, [students, q])

  return (
    <Card>
      <CardHeader className="gap-3 pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldAlert className="size-4 text-[var(--ef-red)]" /> {title}
            <Badge variant="secondary" className="text-[10px]">{students.length}</Badge>
          </CardTitle>
          <SearchInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, parent, class, blood group…"
            containerClassName="w-full sm:w-72"
          />
        </div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        {filtered.length === 0 ? (
          <EmptyState icon={<Users className="size-5" />} title="No students found" description="Try a different search term." />
        ) : (
          <ScrollX>
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2.5 font-medium">Student</th>
                  <th className="px-3 py-2.5 font-medium">Age</th>
                  <th className="px-3 py-2.5 font-medium">Class</th>
                  <th className="px-3 py-2.5 font-medium">Blood</th>
                  <th className="px-3 py-2.5 font-medium">Parent</th>
                  <th className="px-3 py-2.5 font-medium">Phone</th>
                  <th className="px-3 py-2.5 font-medium">Emergency</th>
                  {showStatus && <th className="px-3 py-2.5 font-medium">Pickup</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => {
                  const age = ageFromDob(s.dob)
                  const meta = metaByStudentId?.[s.id]
                  return (
                    <tr key={s.id} className="border-b last:border-0 align-middle">
                      <td className="px-4 py-3">
                        <p className="font-medium leading-tight">{s.name}</p>
                        {meta && <p className="text-xs text-muted-foreground">{meta}</p>}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Cake className="size-3.5" /> {age ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <GraduationCap className="size-3.5" /> {s.class}-{s.section}
                        </span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        {s.bloodGroup ? (
                          <Badge variant="outline" className="gap-1 text-[11px] border-[var(--ef-red)]/40 text-[var(--ef-red)]">
                            <Droplet className="size-3" /> {s.bloodGroup}
                          </Badge>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap text-muted-foreground">{s.parentName}</td>
                      <td className="px-3 py-3"><CallButton phone={s.parentPhone} label={`${s.parentName} (parent)`} /></td>
                      <td className="px-3 py-3"><CallButton phone={s.emergencyPhone} label={`${s.name} emergency contact`} /></td>
                      {showStatus && (
                        <td className="px-3 py-3"><PickupBadge status={statusByStudentId?.[s.id]} /></td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </ScrollX>
        )}
      </CardContent>
    </Card>
  )
}
