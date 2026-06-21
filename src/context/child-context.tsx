"use client"

/**
 * child-context.tsx
 *
 * Provides the selected child context for the Parent role.
 *
 * Mock children: Rohit Das (VIII-A) and Riya Das (VI-B).
 * The switcher in the topbar only renders when the parent has > 1 child.
 *
 * Requirements: 12.7
 */

import {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from "react"

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface MockChild {
  id: string
  name: string
  className: string // e.g. "VIII-A"
}

interface ChildContextValue {
  children: MockChild[]
  selectedChildId: string
  setSelectedChildId: (id: string) => void
  selectedChild: MockChild | undefined
}

// ─── Mock data ──────────────────────────────────────────────────────────────────

export const MOCK_CHILDREN: MockChild[] = [
  { id: "child-1", name: "Rohit Das",  className: "VIII-A" },
  { id: "child-2", name: "Riya Das",   className: "VI-B"   },
]

// ─── Context ───────────────────────────────────────────────────────────────────

const ChildContext = createContext<ChildContextValue | null>(null)

export function ChildProvider({ children: reactChildren }: { children: ReactNode }) {
  const [selectedChildId, setSelectedChildId] = useState<string>(MOCK_CHILDREN[0].id)

  const value: ChildContextValue = useMemo(
    () => ({
      children: MOCK_CHILDREN,
      selectedChildId,
      setSelectedChildId,
      selectedChild: MOCK_CHILDREN.find((c) => c.id === selectedChildId),
    }),
    [selectedChildId]
  )

  return <ChildContext.Provider value={value}>{reactChildren}</ChildContext.Provider>
}

export function useChild(): ChildContextValue {
  const ctx = useContext(ChildContext)
  if (!ctx) throw new Error("useChild must be used inside <ChildProvider>")
  return ctx
}
