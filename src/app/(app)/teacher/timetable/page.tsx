import { Calendar } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { TEACHING_PERIODS } from "@/lib/constants"
import {
  TimetableGrid,
  type TimetableAssignment,
  type TimetablePeriod,
} from "@/components/domain/timetable/TimetableGrid"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const MY_TIMETABLE: Record<string, Record<string, { class: string; subject: string }>> = {
  P1: { Monday: { class: "VIII-A", subject: "Mathematics" }, Wednesday: { class: "IX-B", subject: "Mathematics" }, Friday: { class: "X-A", subject: "Mathematics" } },
  P2: { Tuesday: { class: "VII-A", subject: "Mathematics" }, Thursday: { class: "VIII-A", subject: "Mathematics" }, Saturday: { class: "IX-A", subject: "Mathematics" } },
  P3: { Monday: { class: "IX-A", subject: "Mathematics" }, Friday: { class: "VIII-B", subject: "Mathematics" } },
  P4: { Wednesday: { class: "X-B", subject: "Mathematics" }, Thursday: { class: "VI-A", subject: "Science" } },
  P5: { Tuesday: { class: "VII-B", subject: "Mathematics" }, Saturday: { class: "VIII-A", subject: "Science" } },
  P6: { Monday: { class: "X-A", subject: "Mathematics" }, Wednesday: { class: "VII-A", subject: "Mathematics" } },
  P7: { Thursday: { class: "IX-A", subject: "Mathematics" } },
}

/** Convert teacher's personal timetable into TimetableAssignment[] using class as the label */
function buildAssignments(): TimetableAssignment[] {
  const assignments: TimetableAssignment[] = []
  for (const [periodId, dayMap] of Object.entries(MY_TIMETABLE)) {
    for (const [day, cell] of Object.entries(dayMap)) {
      assignments.push({
        periodId,
        day,
        subject: cell.subject,
        teacher: `Class ${cell.class}`,
      })
    }
  }
  return assignments
}

/** Convert TEACHING_PERIODS (from lib/constants) to TimetablePeriod[] */
const PERIODS_CONFIG: TimetablePeriod[] = TEACHING_PERIODS.map(p => ({
  id: p.id,
  label: p.id,
  time: p.time,
}))

export default function TeacherTimetablePage() {
  const totalPeriods = Object.values(MY_TIMETABLE).reduce(
    (sum, days) => sum + Object.keys(days).length,
    0,
  )
  const assignments = buildAssignments()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Calendar size={22} />}
        title="My Timetable"
        subtitle="Priya Sharma — weekly schedule"
        actions={<Badge variant="secondary">{totalPeriods} periods/week</Badge>}
      />

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Weekly Grid</CardTitle>
        </CardHeader>
        <Separator />
        {/* readOnly — teacher can view but not modify */}
        <TimetableGrid
          periods={PERIODS_CONFIG}
          classes={DAYS}
          assignments={assignments}
          readOnly
        />
      </Card>
    </div>
  )
}
