"use client"

import { User, Mail, Phone, Building2, CalendarDays, Bus } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { useRole } from "@/context/role-context"
import { getVehicleForDriver, getRoute, DEMO_DRIVER_ID } from "@/data/mock-transport"

export default function DriverProfilePage() {
  const { name, email, phone, department, joined, initials, avatarColor } = useRole()
  const vehicle = getVehicleForDriver(DEMO_DRIVER_ID)
  const route = vehicle ? getRoute(vehicle.routeId) : undefined

  const rows = [
    { icon: Mail, label: "Email", value: email },
    { icon: Phone, label: "Phone", value: phone },
    { icon: Building2, label: "Department", value: department },
    { icon: CalendarDays, label: "Joined", value: joined },
    { icon: Bus, label: "Vehicle", value: vehicle ? `${vehicle.label} · ${vehicle.regNo}` : "—" },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader icon={<User size={20} />} title="My Profile" subtitle="Driver account details" />

      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className={cn("size-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0", avatarColor)}>
            {initials}
          </div>
          <div>
            <p className="text-lg font-semibold">{name}</p>
            <p className="text-sm text-muted-foreground">Driver · {route?.name ?? "Unassigned route"}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {rows.map(r => (
              <li key={r.label} className="flex items-center gap-3 px-4 py-3">
                <r.icon className="size-4 text-muted-foreground shrink-0" />
                <span className="text-sm text-muted-foreground w-28">{r.label}</span>
                <span className="text-sm font-medium">{r.value}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
