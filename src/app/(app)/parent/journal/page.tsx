"use client"

import { BookOpen } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { ClassJournalView } from "@/components/parent/class-journal-view"
import { SCHOOL_SESSION } from "@/data/school-session"

export default function ClassJournalPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<BookOpen size={20} />}
        title="Class Journal"
        subtitle={`Rohit Das — Class VIII-A — Session ${SCHOOL_SESSION.label}`}
      />
      <ClassJournalView />
    </div>
  )
}
