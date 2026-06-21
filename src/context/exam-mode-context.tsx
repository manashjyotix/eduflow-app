"use client"

/**
 * exam-mode-context.tsx
 *
 * Provides a school-wide "Exam Mode" toggle that:
 *   - Persists state to localStorage so it survives page navigation
 *   - When active, the proxy board shows a warning banner and disables
 *     all assignment actions (auto-assign + manual assign)
 *
 * Requirements: 12.10
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"

const STORAGE_KEY = "eduflow:examMode"

interface ExamModeContextValue {
  examMode: boolean
  toggleExamMode: () => void
  setExamMode: (value: boolean) => void
}

const ExamModeContext = createContext<ExamModeContextValue | null>(null)

export function ExamModeProvider({ children }: { children: ReactNode }) {
  const [examMode, setExamModeState] = useState(false)

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === "true") setExamModeState(true)
    } catch {
      // localStorage may not be available in some SSR contexts — safe to ignore
    }
  }, [])

  const setExamMode = useCallback((value: boolean) => {
    setExamModeState(value)
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch {
      // ignore
    }
  }, [])

  const toggleExamMode = useCallback(() => {
    setExamMode(!examMode)
  }, [examMode, setExamMode])

  return (
    <ExamModeContext.Provider value={{ examMode, toggleExamMode, setExamMode }}>
      {children}
    </ExamModeContext.Provider>
  )
}

export function useExamMode(): ExamModeContextValue {
  const ctx = useContext(ExamModeContext)
  if (!ctx) {
    throw new Error("useExamMode must be used inside ExamModeProvider")
  }
  return ctx
}
