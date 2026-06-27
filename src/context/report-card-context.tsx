"use client"

/**
 * report-card-context.tsx  (Feature F3 — Report Cards)
 *
 * Live store for report cards + delegated-entry assignments. Admin assigns a
 * user/role to a class+section+term; that user may then enter/edit marks for
 * that scope. Import (Excel/CSV) commits a batch of draft cards; publish makes
 * them visible to parents.
 *
 * Mounted in (app)/layout.tsx.
 */

import {
  createContext, useContext, useState, useMemo, useCallback, type ReactNode,
} from "react"
import {
  MOCK_REPORT_CARDS, MOCK_REPORT_CARD_ASSIGNMENTS,
  type ReportCard, type ReportCardAssignment,
} from "@/data/mock-report-cards"

export interface AssignInput {
  userId: string
  userName: string
  role: ReportCardAssignment["role"]
  className: string
  term: string
  assignedBy: string
}

interface ReportCardContextValue {
  cards: ReportCard[]
  assignments: ReportCardAssignment[]
  /** Merge a batch of imported/entered cards (replace by id). */
  upsertCards: (incoming: ReportCard[]) => void
  /** Save one card (entry grid). */
  saveCard: (card: ReportCard) => void
  publish: (id: string) => void
  publishScope: (className: string, term: string) => void
  addAssignment: (input: AssignInput) => void
  removeAssignment: (id: string) => void
}

const ReportCardContext = createContext<ReportCardContextValue | null>(null)

export function ReportCardProvider({ children }: { children: ReactNode }) {
  const [cards, setCards] = useState<ReportCard[]>(MOCK_REPORT_CARDS)
  const [assignments, setAssignments] = useState<ReportCardAssignment[]>(MOCK_REPORT_CARD_ASSIGNMENTS)

  const upsertCards = useCallback((incoming: ReportCard[]) => {
    setCards(prev => {
      const map = new Map(prev.map(c => [c.id, c]))
      for (const c of incoming) map.set(c.id, c)
      return Array.from(map.values())
    })
  }, [])

  const saveCard = useCallback((card: ReportCard) => {
    setCards(prev => {
      const idx = prev.findIndex(c => c.id === card.id)
      if (idx === -1) return [card, ...prev]
      const next = [...prev]
      next[idx] = card
      return next
    })
  }, [])

  const publish = useCallback((id: string) => {
    setCards(prev => prev.map(c =>
      c.id === id ? { ...c, status: "published" as const, publishedAt: new Date().toISOString() } : c,
    ))
  }, [])

  const publishScope = useCallback((className: string, term: string) => {
    setCards(prev => prev.map(c =>
      c.className === className && c.term === term
        ? { ...c, status: "published" as const, publishedAt: new Date().toISOString() }
        : c,
    ))
  }, [])

  const addAssignment = useCallback((input: AssignInput) => {
    setAssignments(prev => [
      { id: `rca-${Date.now()}`, assignedAt: new Date().toISOString(), ...input },
      ...prev,
    ])
  }, [])

  const removeAssignment = useCallback((id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id))
  }, [])

  const value: ReportCardContextValue = useMemo(
    () => ({
      cards, assignments, upsertCards, saveCard, publish, publishScope, addAssignment, removeAssignment,
    }),
    [cards, assignments, upsertCards, saveCard, publish, publishScope, addAssignment, removeAssignment],
  )

  return <ReportCardContext.Provider value={value}>{children}</ReportCardContext.Provider>
}

export function useReportCards(): ReportCardContextValue {
  const ctx = useContext(ReportCardContext)
  if (!ctx) throw new Error("useReportCards must be used inside <ReportCardProvider>")
  return ctx
}
