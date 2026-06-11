"use client"
import { useState } from "react"
import { Bell, Plus, Trash2, PinIcon } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const INITIAL_NOTICES = [
  { id: "n1", title: "PTM on June 20", body: "Parent-Teacher Meeting scheduled for June 20, 2026 at 10:00 AM. All teachers must be present.", date: "2026-06-11", audience: "All", pinned: true },
  { id: "n2", title: "Annual Day Rehearsal", body: "Annual Day rehearsal will be held on June 17. Selected students should report to the auditorium by 9:00 AM.", date: "2026-06-10", audience: "All", pinned: false },
  { id: "n3", title: "Exam Schedule Released", body: "The term-end examination schedule has been finalized. Please download from the portal.", date: "2026-06-09", audience: "Teachers", pinned: false },
  { id: "n4", title: "Fee Reminder", body: "Last date for fee submission for Q2 is June 30. Parents are requested to clear dues.", date: "2026-06-08", audience: "Parents", pinned: false },
]

export default function NoticesPage() {
  const [notices, setNotices] = useState(INITIAL_NOTICES)

  function remove(id: string) {
    setNotices(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<Bell size={22} />}
        title="Notice Board"
        subtitle="Post and manage school announcements"
        actions={
          <Button size="default">
            <Plus className="size-4" />
            New Notice
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active Notices ({notices.length})</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {notices.map(notice => (
              <li key={notice.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    {notice.pinned && <PinIcon className="size-4 text-primary mt-0.5 flex-shrink-0" />}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold">{notice.title}</p>
                        <Badge variant="secondary" className="text-xs">{notice.audience}</Badge>
                        {notice.pinned && <Badge variant="default" className="text-xs">Pinned</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notice.body}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(notice.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                  <Button size="xs" variant="ghost" className="text-destructive hover:text-destructive flex-shrink-0" onClick={() => remove(notice.id)}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
