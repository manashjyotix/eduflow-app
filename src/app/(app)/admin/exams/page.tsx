"use client"

import { useState } from "react"
import { toast } from "sonner"
import { GraduationCap, LogIn, Clock, Settings2 } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SubjectCatalogManager } from "@/components/domain/exam/SubjectCatalogManager"
import { SessionManager } from "@/components/domain/exam/SessionManager"
import { ExamDateManager } from "@/components/domain/exam/ExamDateManager"
import { ClassSectionManager } from "@/components/domain/exam/ClassSectionManager"
import { ExamGridBuilder } from "@/components/domain/exam/ExamGridBuilder"
import { AIRoutineDialog } from "@/components/domain/exam/AIRoutineDialog"
import { DuplicateRoutineDialog } from "@/components/domain/exam/DuplicateRoutineDialog"
import { DutyRoster } from "@/components/domain/exam/DutyRoster"
import { useExamSchedule } from "@/context/exam-schedule-context"
import { TEACHERS } from "@/data/teachers"

const ACTIVE_TEACHERS = TEACHERS.filter(t => t.status !== "inactive")

export default function AdminExamsPage() {
  const { settings, updateSettings, notifyOnEntry, loadErrors } = useExamSchedule()
  const [entryTeacher, setEntryTeacher] = useState(ACTIVE_TEACHERS[0].id)

  function handleSimulateEntry() {
    notifyOnEntry(entryTeacher)
    const t = TEACHERS.find(x => x.id === entryTeacher)
    toast(`Campus check-in: ${t?.name}`, { description: "Duty alert fired (if they have exam duty today)." })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<GraduationCap size={20} />}
        title="Exam Scheduler"
        subtitle="Manage the subject catalog, sessions and dates, then build the routine and assign invigilation duty"
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

      {/* Configuration — subject catalog, sessions, exam dates, classes (admin only) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SubjectCatalogManager />
        <div className="flex flex-col gap-6">
          <ClassSectionManager />
          <SessionManager />
          <ExamDateManager />
        </div>
      </div>

      {/* Duty notification rule */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Duty notification rule</CardTitle></CardHeader>
        <Separator />
        <CardContent className="flex flex-col gap-4 pt-4 sm:flex-row sm:items-center sm:gap-8">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <Label htmlFor="lead" className="text-sm">Notify</Label>
            <Input
              id="lead"
              type="number"
              min={0}
              max={10080}
              value={settings.notifyLeadMinutes}
              onChange={e => updateSettings({ notifyLeadMinutes: Math.max(0, Math.min(10080, Number(e.target.value))) })}
              className="w-24"
            />
            <span className="text-sm text-muted-foreground">min before exam start</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="entry"
              checked={settings.notifyOnCampusEntry}
              onCheckedChange={v => updateSettings({ notifyOnCampusEntry: v })}
            />
            <Label htmlFor="entry" className="text-sm">Also notify on campus check-in</Label>
          </div>
        </CardContent>
      </Card>

      {/* Builder */}
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

      {/* Campus-entry simulation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Settings2 className="size-4 text-muted-foreground" />
            Campus check-in simulation
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="flex flex-wrap items-end gap-3 pt-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs text-muted-foreground">Simulate campus check-in</Label>
            <Select value={entryTeacher} onValueChange={setEntryTeacher}>
              <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ACTIVE_TEACHERS.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" onClick={handleSimulateEntry}>
            <LogIn className="size-4 mr-1" /> Check in &amp; fire duty alert
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
