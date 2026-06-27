"use client"

import { Bus } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { FleetView } from "@/components/domain/transport/FleetView"
import { EmergencyContacts } from "@/components/domain/transport/EmergencyContacts"
import { STUDENT_TRANSPORT, getRoute } from "@/data/mock-transport"
import { STUDENTS } from "@/data/students"

/** Route + drop-stop label per student, for the emergency directory. */
const META = Object.fromEntries(
  STUDENT_TRANSPORT.map((s) => {
    const route = getRoute(s.routeId)
    const stop = route?.stops.find((st) => st.seq === s.stopSeq)
    return [s.studentId, [route?.name, stop?.name].filter(Boolean).join(" · ")]
  }),
)

export default function ManagementTransportPage() {
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
        title="Student Emergency Contacts"
        subtitle="All students with parent phone, emergency number, and blood group for quick action."
      />
    </div>
  )
}
