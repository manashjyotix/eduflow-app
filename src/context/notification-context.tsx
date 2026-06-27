"use client"

/**
 * notification-context.tsx  (Feature F8 — Notification engine)
 *
 * Single in-session store for app notifications, shared by every feature that
 * needs to alert a user (attendance submit, journal-pending reminders, exam
 * duty, transport events, …).
 *
 * Two audiences are kept separate: "staff" (admin / management / teacher /
 * super_admin) and "parent". Helpers take an audience so producers stay
 * explicit. `upsert` is idempotent by id, so repeating reminders (e.g. the
 * journal-pending nudge) update a single notification instead of spamming.
 *
 * Mounted high in (app)/layout.tsx so producers like the class-journal context
 * can push into it.
 */

import {
  createContext, useContext, useState, useMemo, useCallback, type ReactNode,
} from "react"
import {
  MOCK_NOTIFICATIONS, PARENT_NOTIFICATIONS, type Notification,
} from "@/data/mock-notifications"

export type NotificationAudience = "staff" | "parent"

/** Fields a producer supplies; id/read/createdAt are filled in if omitted. */
export type NotificationInput =
  Omit<Notification, "read" | "createdAt"> & { read?: boolean; createdAt?: string }

interface NotificationContextValue {
  staff: Notification[]
  parent: Notification[]
  unreadCount: (audience: NotificationAudience) => number
  /** Add a notification, or replace an existing one with the same id. */
  upsert: (audience: NotificationAudience, n: NotificationInput) => void
  /** Remove a notification by id (used to clear a resolved reminder). */
  dismiss: (audience: NotificationAudience, id: string) => void
  markRead: (audience: NotificationAudience, id: string) => void
  markAllRead: (audience: NotificationAudience) => void
}

const NotificationContext = createContext<NotificationContextValue | null>(null)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [staff, setStaff] = useState<Notification[]>(MOCK_NOTIFICATIONS)
  const [parent, setParent] = useState<Notification[]>(PARENT_NOTIFICATIONS)

  const setterFor = useCallback(
    (audience: NotificationAudience) => (audience === "staff" ? setStaff : setParent),
    [],
  )

  const upsert = useCallback((audience: NotificationAudience, n: NotificationInput) => {
    const record: Notification = {
      read: false,
      createdAt: new Date().toISOString(),
      ...n,
    }
    setterFor(audience)(prev => {
      const idx = prev.findIndex(x => x.id === record.id)
      if (idx === -1) return [record, ...prev]
      const next = [...prev]
      // Preserve read state on update unless the producer explicitly set it.
      next[idx] = { ...record, read: n.read ?? prev[idx].read }
      return next
    })
  }, [setterFor])

  const dismiss = useCallback((audience: NotificationAudience, id: string) => {
    setterFor(audience)(prev => prev.filter(n => n.id !== id))
  }, [setterFor])

  const markRead = useCallback((audience: NotificationAudience, id: string) => {
    setterFor(audience)(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
  }, [setterFor])

  const markAllRead = useCallback((audience: NotificationAudience) => {
    setterFor(audience)(prev => prev.map(n => ({ ...n, read: true })))
  }, [setterFor])

  const unreadCount = useCallback(
    (audience: NotificationAudience) =>
      (audience === "staff" ? staff : parent).filter(n => !n.read).length,
    [staff, parent],
  )

  const value: NotificationContextValue = useMemo(
    () => ({ staff, parent, unreadCount, upsert, dismiss, markRead, markAllRead }),
    [staff, parent, unreadCount, upsert, dismiss, markRead, markAllRead],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext)
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>")
  return ctx
}
