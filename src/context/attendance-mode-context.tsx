"use client"

/**
 * attendance-mode-context.tsx
 *
 * Provides a school-wide attendance mode setting:
 *   - "per-period"  — teacher marks attendance for each period separately
 *                     (Period selector is visible on the Mark Attendance page)
 *   - "single-daily" — one roll call per day
 *                     (Period selector is hidden on the Mark Attendance page)
 *
 * Persists to localStorage so the choice survives navigation.
 * Toggled by the Admin in Settings → Attendance Mode.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"

const STORAGE_KEY = "eduflow:attendanceMode"

export type AttendanceMode = "per-period" | "single-daily"

interface AttendanceModeContextValue {
  attendanceMode: AttendanceMode
  setAttendanceMode: (mode: AttendanceMode) => void
}

const AttendanceModeContext = createContext<AttendanceModeContextValue | null>(null)

export function AttendanceModeProvider({ children }: { children: ReactNode }) {
  const [attendanceMode, setAttendanceModeState] = useState<AttendanceMode>("per-period")

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === "per-period" || stored === "single-daily") {
        setAttendanceModeState(stored)
      }
    } catch {
      // localStorage unavailable in some SSR contexts — safe to ignore
    }
  }, [])

  const setAttendanceMode = useCallback((mode: AttendanceMode) => {
    setAttendanceModeState(mode)
    try {
      localStorage.setItem(STORAGE_KEY, mode)
    } catch {
      // ignore
    }
  }, [])

  return (
    <AttendanceModeContext.Provider value={{ attendanceMode, setAttendanceMode }}>
      {children}
    </AttendanceModeContext.Provider>
  )
}

export function useAttendanceMode(): AttendanceModeContextValue {
  const ctx = useContext(AttendanceModeContext)
  if (!ctx) {
    throw new Error("useAttendanceMode must be used inside AttendanceModeProvider")
  }
  return ctx
}
