import { Megaphone, Plus, AlertTriangle, Info } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

type Urgency = "Normal" | "Urgent" | "Critical"
type NoticeTarget = "All Staff" | "Teachers" | "Management" | "Admin"

interface Notice {
  id: string
  title: string
  content: string
  postedBy: string
  date: string
  target: NoticeTarget
  urgency: Urgency
}

const NOTICES: Notice[] = [
  {
    id: "n1",
    title: "Mid-Term Examination Schedule — July 2026",
    content:
      "Mid-Term examinations are scheduled from July 14–18, 2026. All teachers must submit question papers by July 7. Seating arrangement will be shared by July 10.",
    postedBy: "Principal",
    date: "2026-06-15",
    target: "All Staff",
    urgency: "Urgent",
  },
  {
    id: "n2",
    title: "Staff Meeting — June 18, 2026",
    content:
      "A mandatory staff meeting is scheduled for June 18 at 8:00 AM in the Conference Hall. Agenda: Annual results review, upcoming events, and policy updates. Attendance is compulsory.",
    postedBy: "Management Officer",
    date: "2026-06-14",
    target: "All Staff",
    urgency: "Urgent",
  },
  {
    id: "n3",
    title: "Water Supply Maintenance — June 17",
    content:
      "Water supply will be unavailable on June 17 from 8 AM to 12 PM due to pipeline maintenance. Please make necessary arrangements. Water tanker will be available on campus.",
    postedBy: "Admin",
    date: "2026-06-14",
    target: "All Staff",
    urgency: "Normal",
  },
  {
    id: "n4",
    title: "June Fee Collection Deadline",
    content:
      "Monthly fee collection deadline for June 2026 is June 20. All class teachers must remind students with outstanding dues. Defaulters list will be sent on June 21.",
    postedBy: "Accounts",
    date: "2026-06-13",
    target: "Teachers",
    urgency: "Urgent",
  },
  {
    id: "n5",
    title: "Sports Day Preparation — July 5",
    content:
      "Annual Sports Day is scheduled for July 5, 2026. Physical Education department to coordinate with class teachers for participant selection by June 25. Events list attached.",
    postedBy: "Management Officer",
    date: "2026-06-12",
    target: "Teachers",
    urgency: "Normal",
  },
  {
    id: "n6",
    title: "CRITICAL: Fire Safety Drill",
    content:
      "A mandatory fire safety and evacuation drill will be conducted on June 20 at 10:30 AM. All staff must ensure students are informed. No classes during the 20-minute drill.",
    postedBy: "Principal",
    date: "2026-06-12",
    target: "All Staff",
    urgency: "Critical",
  },
  {
    id: "n7",
    title: "Library Book Return Drive",
    content:
      "All overdue library books must be returned by June 22. Class teachers are requested to remind students. Students with unreturned books will not receive their Term I report cards.",
    postedBy: "Librarian",
    date: "2026-06-10",
    target: "Teachers",
    urgency: "Normal",
  },
  {
    id: "n8",
    title: "New Attendance Policy Update",
    content:
      "Effective July 1, 2026, attendance marking must be completed within the first 10 minutes of each period. Unmarked periods will default to 'Present'. Management review on June 30.",
    postedBy: "Admin",
    date: "2026-06-09",
    target: "Management",
    urgency: "Normal",
  },
]

const URGENCY_STYLES: Record<Urgency, { badge: string; border: string }> = {
  Normal: {
    badge: "bg-muted text-muted-foreground",
    border: "border-l-4 border-l-border",
  },
  Urgent: {
    badge: "bg-warning/15 text-warning-foreground border border-warning/30",
    border: "border-l-4 border-l-warning",
  },
  Critical: {
    badge: "bg-destructive/15 text-destructive border border-destructive/30",
    border: "border-l-4 border-l-destructive",
  },
}

const TARGET_VARIANT: Record<NoticeTarget, "outline" | "secondary" | "default"> = {
  "All Staff": "default",
  Teachers: "secondary",
  Management: "outline",
  Admin: "outline",
}

export default function MgmtNoticePage() {
  const urgent = NOTICES.filter((n) => n.urgency === "Urgent" || n.urgency === "Critical")
  const normal = NOTICES.filter((n) => n.urgency === "Normal")

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Megaphone size={20} />}
        title="Notice Board"
        subtitle="School notices and circulars"
        actions={
          <Button size="sm">
            <Plus size={14} className="mr-1.5" /> Post Notice
          </Button>
        }
      />

      {/* Urgent Notices */}
      {urgent.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-warning-foreground" />
            Urgent & Critical ({urgent.length})
          </h2>
          <div className="flex flex-col gap-3">
            {urgent.map((n) => (
              <NoticeCard key={n.id} notice={n} />
            ))}
          </div>
        </div>
      )}

      <Separator />

      {/* Normal Notices */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
          <Info size={14} className="text-primary" />
          General Notices ({normal.length})
        </h2>
        <div className="flex flex-col gap-3">
          {normal.map((n) => (
            <NoticeCard key={n.id} notice={n} />
          ))}
        </div>
      </div>
    </div>
  )
}

function NoticeCard({ notice }: { notice: Notice }) {
  const styles = URGENCY_STYLES[notice.urgency]
  return (
    <Card className={styles.border}>
      <CardHeader className="pb-2 flex-row items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-sm font-semibold leading-snug">{notice.title}</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Posted by <span className="font-medium text-foreground">{notice.postedBy}</span>
            {" · "}
            {new Date(notice.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant={TARGET_VARIANT[notice.target]} className="text-xs">
            {notice.target}
          </Badge>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${styles.badge}`}>
            {notice.urgency}
          </span>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-3">
        <p className="text-sm text-muted-foreground leading-relaxed">{notice.content}</p>
      </CardContent>
    </Card>
  )
}
