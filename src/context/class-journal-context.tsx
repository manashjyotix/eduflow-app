"use client"

/**
 * class-journal-context.tsx  (Feature F2 — Class Journal)
 *
 * Live store for class journal entries. Derives the active teacher's "today's
 * classes" (regular timetable + proxy duties) so an entry written for a proxy
 * class is attached to THAT class, not the teacher's home class.
 *
 * Missed entries (a taught slot with no journal) raise a single, self-updating
 * "journal pending" reminder via the notification engine (F8) — standing in for
 * the production repeating push until end-of-day.
 *
 * Mounted in (app)/layout.tsx BELOW <NotificationProvider>.
 */

import {
  createContext, useContext, useState, useMemo, useCallback, useEffect, type ReactNode,
} from "react"
import {
  MOCK_CLASS_JOURNAL, getTeachingSlotsForTeacher, journalKey,
  type ClassJournalEntry, type TeachingSlot,
} from "@/data/mock-class-journal"
import { useNotifications } from "@/context/notification-context"

/** Demo teacher persona (Priya Sharma) — matches the role switcher. */
const TEACHER_ID = "t1"
const TEACHER_NAME = "Priya Sharma"
const DEMO_TODAY = "2026-06-25"
const JOURNAL_REMINDER_ID = `journal-pending-${TEACHER_ID}-${DEMO_TODAY}`

export interface SaveJournalInput {
  topic: string
  homework?: string
  notes?: string
}

interface ClassJournalContextValue {
  date: string
  /** Today's teaching slots for the active teacher (regular + proxy). */
  slots: TeachingSlot[]
  entries: ClassJournalEntry[]
  getEntry: (className: string, period: string) => ClassJournalEntry | undefined
  saveEntry: (slot: TeachingSlot, input: SaveJournalInput) => void
  /** Slots still missing a completed journal. */
  pendingSlots: TeachingSlot[]
  pendingCount: number
  /** All entries for a class (for the parent view, future wiring). */
  getJournalForClass: (className: string, date?: string) => ClassJournalEntry[]
}

const ClassJournalContext = createContext<ClassJournalContextValue | null>(null)

export function ClassJournalProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ClassJournalEntry[]>(MOCK_CLASS_JOURNAL)
  const { upsert, dismiss } = useNotifications()

  const slots = useMemo(() => getTeachingSlotsForTeacher(TEACHER_ID), [])

  const getEntry = useCallback(
    (className: string, period: string) =>
      entries.find(
        e => journalKey(e.date, e.className, e.period) === journalKey(DEMO_TODAY, className, period),
      ),
    [entries],
  )

  const saveEntry = useCallback((slot: TeachingSlot, input: SaveJournalInput) => {
    const key = journalKey(DEMO_TODAY, slot.className, slot.period)
    setEntries(prev => {
      const idx = prev.findIndex(e => journalKey(e.date, e.className, e.period) === key)
      const record: ClassJournalEntry = {
        id: idx === -1 ? `cj-${Date.now()}` : prev[idx].id,
        date: DEMO_TODAY,
        className: slot.className,
        period: slot.period,
        subject: slot.subject,
        teacherId: TEACHER_ID,
        teacherName: TEACHER_NAME,
        isProxy: slot.isProxy,
        proxyForTeacher: slot.proxyForTeacher,
        topic: input.topic,
        homework: input.homework,
        notes: input.notes,
        status: "completed",
        completedAt: new Date().toISOString(),
      }
      if (idx === -1) return [record, ...prev]
      const next = [...prev]
      next[idx] = record
      return next
    })
  }, [])

  const pendingSlots = useMemo(
    () =>
      slots.filter(s => {
        const e = entries.find(
          x => journalKey(x.date, x.className, x.period) === journalKey(DEMO_TODAY, s.className, s.period),
        )
        return !e || e.status !== "completed"
      }),
    [slots, entries],
  )

  const getJournalForClass = useCallback(
    (className: string, date?: string) =>
      entries.filter(e => e.className === className && (date ? e.date === date : true)),
    [entries],
  )

  // Repeating "journal pending" reminder — one self-updating notification.
  useEffect(() => {
    if (pendingSlots.length === 0) {
      dismiss("staff", JOURNAL_REMINDER_ID)
      return
    }
    const labels = pendingSlots.map(s => `${s.className} ${s.period}`).join(", ")
    upsert("staff", {
      id: JOURNAL_REMINDER_ID,
      type: "journal",
      title: `${pendingSlots.length} class journal${pendingSlots.length > 1 ? "s" : ""} pending`,
      body: `Please write today's journal for: ${labels}. Reminders continue until completed.`,
      actionHref: "/teacher/journal",
      createdAt: new Date().toISOString(),
    })
  }, [pendingSlots, upsert, dismiss])

  const value: ClassJournalContextValue = useMemo(
    () => ({
      date: DEMO_TODAY,
      slots,
      entries,
      getEntry,
      saveEntry,
      pendingSlots,
      pendingCount: pendingSlots.length,
      getJournalForClass,
    }),
    [slots, entries, getEntry, saveEntry, pendingSlots, getJournalForClass],
  )

  return <ClassJournalContext.Provider value={value}>{children}</ClassJournalContext.Provider>
}

export function useClassJournal(): ClassJournalContextValue {
  const ctx = useContext(ClassJournalContext)
  if (!ctx) throw new Error("useClassJournal must be used inside <ClassJournalProvider>")
  return ctx
}
