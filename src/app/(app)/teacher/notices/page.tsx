import { BookOpen, Pin, Calendar } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const NOTICES = [
  { id:"n1", title:"Mid-Term Examination Schedule",      body:"Mid-term exams for all classes VI–X will be held from July 14 to 22, 2026. Teachers are requested to complete syllabus coverage by July 10. Exam timetable is attached below.",             category:"Academic",      date:"Jun 13", postedBy:"Admin",      pinned:true,  urgent:false },
  { id:"n2", title:"Staff Meeting – June 20",            body:"A mandatory staff meeting is scheduled for June 20, 2026 at 2:00 PM in the Conference Room. Agenda: Annual plan review, new leave policy, and sports day coordination.",                         category:"Administrative",date:"Jun 12", postedBy:"Principal",   pinned:true,  urgent:true  },
  { id:"n3", title:"Sports Day Arrangements",            body:"Annual Sports Day is on June 22. All class teachers must submit their class participation list by June 18. Practice sessions in the ground are approved before school hours (8–9 AM).",              category:"Event",         date:"Jun 10", postedBy:"Admin",      pinned:false, urgent:false },
  { id:"n4", title:"Leave Approval Policy Update",       body:"Effective July 1, 2026, all leave requests must be submitted at least 3 working days in advance via the EduFlow app. Emergency leave still follows the existing process.",                         category:"Policy",        date:"Jun 08", postedBy:"Admin",      pinned:false, urgent:false },
  { id:"n5", title:"Library Books Return Deadline",      body:"All library books borrowed by staff must be returned by June 20, 2026. New borrowing will be paused from June 21 to July 5 for inventory audit.",                                                  category:"Administrative",date:"Jun 05", postedBy:"Librarian",   pinned:false, urgent:false },
  { id:"n6", title:"Fee Collection Drive",               body:"Parents of defaulting students will be contacted this week. Teachers with homeroom classes are requested to send a gentle reminder note home with students who have outstanding fees for May 2026.", category:"Finance",       date:"Jun 03", postedBy:"Admin",      pinned:false, urgent:false },
]

const CAT_COLOR: Record<string,string> = {
  Academic:"bg-[var(--ef-brand-light)] text-[var(--ef-brand)]",
  Administrative:"bg-[var(--ef-purple-light)] text-[var(--ef-purple)]",
  Event:"bg-success text-success-foreground",
  Policy:"bg-warning text-warning-foreground",
  Finance:"bg-destructive/10 text-destructive",
}

export default function TeacherNoticesPage() {
  const pinned   = NOTICES.filter(n => n.pinned)
  const unpinned = NOTICES.filter(n => !n.pinned)

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader icon={<BookOpen size={20}/>} title="Notice Board" subtitle="School notices and circulars"/>

      {pinned.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
            <Pin className="size-3"/> Pinned
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pinned.map(n => (
              <Card key={n.id} className={`border-l-4 ${n.urgent ? "border-l-destructive" : "border-l-primary"}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start gap-2 justify-between">
                    <div className="flex gap-1.5 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CAT_COLOR[n.category]}`}>{n.category}</span>
                      {n.urgent && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-destructive/10 text-destructive">URGENT</span>}
                    </div>
                    <Pin className="size-3.5 text-[var(--ef-amber)] flex-shrink-0 mt-0.5"/>
                  </div>
                  <CardTitle className="text-base leading-tight">{n.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{n.body}</p>
                  <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                    <span>By {n.postedBy}</span>
                    <span className="flex items-center gap-1"><Calendar className="size-3"/>{n.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">All Notices</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {unpinned.map(n => (
            <Card key={n.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex gap-1.5 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${CAT_COLOR[n.category]}`}>{n.category}</span>
                </div>
                <CardTitle className="text-base leading-tight">{n.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">{n.body}</p>
                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                  <span>By {n.postedBy}</span>
                  <span className="flex items-center gap-1"><Calendar className="size-3"/>{n.date}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
