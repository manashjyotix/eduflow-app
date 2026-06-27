"use client"

/**
 * exam-schedule-context.tsx  (Feature F4 — Exam scheduler)
 *
 * Live store for the exam routine the Admin/Management build via drag-and-drop,
 * plus the duty-notification settings. Pushes exam-duty alerts through the
 * notification engine (F8) — respecting the lead-time / campus-entry rule.
 *
 * Mounted in (app)/layout.tsx BELOW <NotificationProvider>.
 */

import {
  createContext, useContext, useState, useMemo, useCallback, type ReactNode,
} from "react"
import {
  MOCK_EXAM_SLOTS, DEFAULT_EXAM_SETTINGS, examCellKey,
  type ExamSlot, type ExamSettings,
} from "@/data/mock-exams"
import { TEACHERS } from "@/data/teachers"
import { useNotifications } from "@/context/notification-context"

interface ExamScheduleContextValue {
  slots: ExamSlot[]
  settings: ExamSettings
  slotFor: (classId: string, date: string) => ExamSlot | undefined
  /** Create or replace the subject in a cell. */
  setSubject: (classId: string, date: string, subject: string) => void
  /** Add an invigilator to an existing slot. */
  addInvigilator: (classId: string, date: string, teacherId: string) => void
  removeInvigilator: (classId: string, date: string, teacherId: string) => void
  clearSlot: (classId: string, date: string) => void
  setRoom: (classId: string, date: string, room: string) => void
  updateSettings: (patch: Partial<ExamSettings>) => void
  /** Notify all assigned invigilators of their duty (demo: immediate). */
  notifyDuties: () => number
  /** Simulate a teacher checking in on campus → fire their duty alert. */
  notifyOnEntry: (teacherId: string) => void
}

const ExamScheduleContext = createContext<ExamScheduleContextValue | null>(null)

export function ExamScheduleProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<ExamSlot[]>(MOCK_EXAM_SLOTS)
  const [settings, setSettings] = useState<ExamSettings>(DEFAULT_EXAM_SETTINGS)
  const { upsert } = useNotifications()

  const slotFor = useCallback(
    (classId: string, date: string) =>
      slots.find(s => examCellKey(s.classId, s.date) === examCellKey(classId, date)),
    [slots],
  )

  const setSubject = useCallback((classId: string, date: string, subject: string) => {
    setSlots(prev => {
      const key = examCellKey(classId, date)
      const idx = prev.findIndex(s => examCellKey(s.classId, s.date) === key)
      if (idx === -1) {
        return [...prev, { id: `es-${Date.now()}`, classId, date, startTime: "09:30", subject, invigilatorIds: [] }]
      }
      const next = [...prev]
      next[idx] = { ...next[idx], subject }
      return next
    })
  }, [])

  const addInvigilator = useCallback((classId: string, date: string, teacherId: string) => {
    setSlots(prev => prev.map(s =>
      examCellKey(s.classId, s.date) === examCellKey(classId, date) && !s.invigilatorIds.includes(teacherId)
        ? { ...s, invigilatorIds: [...s.invigilatorIds, teacherId] }
        : s,
    ))
  }, [])

  const removeInvigilator = useCallback((classId: string, date: string, teacherId: string) => {
    setSlots(prev => prev.map(s =>
      examCellKey(s.classId, s.date) === examCellKey(classId, date)
        ? { ...s, invigilatorIds: s.invigilatorIds.filter(id => id !== teacherId) }
        : s,
    ))
  }, [])

  const clearSlot = useCallback((classId: string, date: string) => {
    setSlots(prev => prev.filter(s => examCellKey(s.classId, s.date) !== examCellKey(classId, date)))
  }, [])

  const setRoom = useCallback((classId: string, date: string, room: string) => {
    setSlots(prev => prev.map(s =>
      examCellKey(s.classId, s.date) === examCellKey(classId, date) ? { ...s, room } : s,
    ))
  }, [])

  const updateSettings = useCallback((patch: Partial<ExamSettings>) => {
    setSettings(prev => ({ ...prev, ...patch }))
  }, [])

  const notifyDuties = useCallback((): number => {
    const assigned = slots.filter(s => s.invigilatorIds.length > 0)
    let count = 0
    for (const s of assigned) {
      for (const tid of s.invigilatorIds) {
        const t = TEACHERS.find(x => x.id === tid)
        if (!t) continue
        count++
        upsert("staff", {
          id: `exam-duty-${s.id}-${tid}`,
          type: "exam_duty",
          title: `Exam invigilation duty — ${s.classId}`,
          body: `${t.name}: ${s.subject} on ${s.date} at ${s.startTime}${s.room ? `, ${s.room}` : ""}. ` +
            `You'll be reminded ${settings.notifyLeadMinutes} min before${settings.notifyOnCampusEntry ? " (and on campus check-in)" : ""}.`,
          actionHref: "/teacher/dashboard",
        })
      }
    }
    return count
  }, [slots, settings, upsert])

  const notifyOnEntry = useCallback((teacherId: string) => {
    const t = TEACHERS.find(x => x.id === teacherId)
    const duties = slots.filter(s => s.invigilatorIds.includes(teacherId))
    if (!t || duties.length === 0) return
    upsert("staff", {
      id: `exam-duty-entry-${teacherId}`,
      type: "exam_duty",
      title: "Campus check-in — your exam duty today",
      body: `${t.name}, you have ${duties.length} invigilation dut${duties.length > 1 ? "ies" : "y"}: ` +
        duties.map(d => `${d.classId} ${d.subject} (${d.room ?? "TBA"})`).join(", ") + ".",
      actionHref: "/teacher/dashboard",
    })
  }, [slots, upsert])

  const value: ExamScheduleContextValue = useMemo(
    () => ({
      slots, settings, slotFor, setSubject, addInvigilator, removeInvigilator,
      clearSlot, setRoom, updateSettings, notifyDuties, notifyOnEntry,
    }),
    [slots, settings, slotFor, setSubject, addInvigilator, removeInvigilator,
     clearSlot, setRoom, updateSettings, notifyDuties, notifyOnEntry],
  )

  return <ExamScheduleContext.Provider value={value}>{children}</ExamScheduleContext.Provider>
}

export function useExamSchedule(): ExamScheduleContextValue {
  const ctx = useContext(ExamScheduleContext)
  if (!ctx) throw new Error("useExamSchedule must be used inside <ExamScheduleProvider>")
  return ctx
}
