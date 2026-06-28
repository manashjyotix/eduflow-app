"use client"

import { GraduationCap } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExamGridBuilder } from "@/components/domain/exam/ExamGridBuilder"
import { AIRoutineDialog } from "@/components/domain/exam/AIRoutineDialog"
import { DuplicateRoutineDialog } from "@/components/domain/exam/DuplicateRoutineDialog"
import { DutyRoster } from "@/components/domain/exam/DutyRoster"
import { useExamSchedule } from "@/context/exam-schedule-context"

export default function ExamSchedulePage() {
  const { loadErrors } = useExamSchedule()

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<GraduationCap size={22} />}
        title="Exam Schedule"
        subtitle="Build and publish the term-end examination routine — HCEA"
      />

      {loadErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc pl-4">
              {loadErrors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Builder — management may build/publish but not manage the catalog,
          sessions, or dates (those config managers self-hide and are not rendered here). */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3 pb-3">
          <CardTitle className="text-base">Routine builder</CardTitle>
          <div className="flex items-center gap-2">
            <AIRoutineDialog />
            <DuplicateRoutineDialog />
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <ExamGridBuilder />
        </CardContent>
      </Card>

      {/* Duty roster */}
      <DutyRoster />
    </div>
  )
}
