"use client"

import { useState } from "react"
import { toast } from "sonner"
import { GraduationCap, Bell, LogIn, Clock } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ExamGridBuilder } from "@/components/domain/exam/ExamGridBuilder"
import { useExamSchedule } from "@/context/exam-schedule-context"
import { TEACHERS } from "@/data/teachers"

const ACTIVE_TEACHERS = TEACHERS.filter(t => t.status !== "inactive")

export default function AdminExamsPage() {
  const { slots, settings, updateSettings, notifyDuties, notifyOnEntry } = useExamSchedule()
  const [entryTeacher, setEntryTeacher] = useState(ACTIVE_TEACHERS[0].id)

  const assignedDuties = slots.filter(s => s.invigilatorIds.length > 0)

  function handleNotify() {
    const n = notifyDuties()
    toast.success("Invigilators notified", {
      description: n > 0 ? `${n} duty notification${n > 1 ? "s" : ""} queued.` : "No invigilators assigned yet.",
    })
  }

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
        subtitle="Build the exam routine and assign invigilation duty by drag & drop"
        actions={
          <Button onClick={handleNotify}>
            <Bell className="size-4 mr-1" /> Notify invigilators
          </Button>
        }
      />

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
              max={120}
              value={settings.notifyLeadMinutes}
              onChange={e => updateSettings({ notifyLeadMinutes: Math.max(0, Number(e.target.value)) })}
              className="w-20"
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
        <CardHeader className="pb-3"><CardTitle className="text-base">Routine builder</CardTitle></CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <ExamGridBuilder />
        </CardContent>
      </Card>

      {/* Duty roster + campus-entry simulation */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Invigilation duty roster</CardTitle></CardHeader>
        <Separator />
        <CardContent className="flex flex-col gap-4 pt-4">
          {assignedDuties.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invigilators assigned yet. Drag a teacher chip onto a scheduled cell.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {assignedDuties.map(s => (
                <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline">{s.classId}</Badge>
                  <span className="font-medium">{s.subject}</span>
                  <span className="text-muted-foreground">{s.date} · {s.startTime}{s.room ? ` · ${s.room}` : ""}</span>
                  <span className="text-muted-foreground">→</span>
                  {s.invigilatorIds.map(tid => (
                    <Badge key={tid} variant="secondary" className="text-[11px]">
                      {TEACHERS.find(t => t.id === tid)?.name ?? tid}
                    </Badge>
                  ))}
                </li>
              ))}
            </ul>
          )}

          <Separator />
          <div className="flex flex-wrap items-end gap-3">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
