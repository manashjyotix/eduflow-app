"use client"

import { Bus } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { FleetView } from "@/components/domain/transport/FleetView"
import {
  EmergencyContacts, type PickupStatus,
} from "@/components/domain/transport/EmergencyContacts"
import { STUDENT_TRANSPORT, getRoute } from "@/data/mock-transport"
import { STUDENTS } from "@/data/students"
import { useTransport } from "@/context/transport-context"

/** Route + drop-stop label per student, for the emergency directory. */
const META = Object.fromEntries(
  STUDENT_TRANSPORT.map((s) => {
    const route = getRoute(s.routeId)
    const stop = route?.stops.find((st) => st.seq === s.stopSeq)
    return [s.studentId, [route?.name, stop?.name].filter(Boolean).join(" · ")]
  }),
)

function fmtTime(iso?: string) {
  return iso
    ? new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
    : ""
}

export default function ManagementTransportPage() {
  const { tripForStudent } = useTransport()

  // Live drop/pickup status: reached the stop → picked up by parent.
  const statusByStudentId: Record<string, PickupStatus> = Object.fromEntries(
    STUDENT_TRANSPORT.map((st) => {
      const trip = tripForStudent(st.studentId)
      const route = getRoute(st.routeId)
      const stopName = route?.stops.find((s) => s.seq === st.stopSeq)?.name
      const handshake = trip?.handshakes.find((h) => h.studentId === st.studentId)
      const reached = trip?.reachedSeqs.includes(st.stopSeq) ?? false

      let status: PickupStatus
      if (handshake) {
        status = {
          tone: "picked-up",
          label: "Picked up",
          detail: `by ${handshake.acceptedBy} at ${fmtTime(handshake.acceptedAt)}`,
        }
      } else if (reached) {
        status = {
          tone: "reached",
          label: "Reached stop",
          detail: stopName ? `${stopName} · awaiting parent` : "Awaiting parent",
        }
      } else if (trip?.status === "running") {
        status = {
          tone: "enroute",
          label: "On the bus",
          detail: stopName ? `Drop at ${stopName}` : undefined,
        }
      } else {
        status = {
          tone: "idle",
          label: "Not started",
          detail: stopName ? `Drop at ${stopName}` : undefined,
        }
      }
      return [st.studentId, status]
    }),
  )

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Bus size={20} />}
        title="Transport Tracking"
        subtitle="Monitor every vehicle and confirm students reach home safely"
      />
      <FleetView />
      <EmergencyContacts
        students={STUDENTS}
        metaByStudentId={META}
        statusByStudentId={statusByStudentId}
        title="Student Emergency Contacts"
        subtitle="All students with parent phone, emergency number, and blood group for quick action. Pickup status updates live as the bus reaches each stop and parents receive their child."
      />
    </div>
  )
}
