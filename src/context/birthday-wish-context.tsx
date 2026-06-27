"use client"

/**
 * birthday-wish-context.tsx
 *
 * Platform-wide "Birthday Wishes" feature flag, controlled by the Super Admin.
 *   - Persists state to localStorage so it survives navigation / reloads.
 *   - When ON, the branded BirthdayCard renders on every role dashboard
 *     (admin, management, teacher, parent, super-admin) on a user's birthday.
 *   - When OFF, BirthdayCard renders nothing for all roles.
 *
 * Default: ON.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react"

const STORAGE_KEY = "eduflow:birthdayWishes"

interface BirthdayWishContextValue {
  enabled: boolean
  toggle: () => void
  setEnabled: (value: boolean) => void
}

const BirthdayWishContext = createContext<BirthdayWishContextValue | null>(null)

export function BirthdayWishProvider({ children }: { children: ReactNode }) {
  // Default ON — the card itself still self-hides when it is not someone's birthday.
  const [enabled, setEnabledState] = useState(true)

  // Hydrate from localStorage on mount (client only).
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored === "false") setEnabledState(false)
    } catch {
      // localStorage may be unavailable in some SSR contexts — safe to ignore
    }
  }, [])

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value)
    try {
      localStorage.setItem(STORAGE_KEY, String(value))
    } catch {
      // ignore
    }
  }, [])

  const toggle = useCallback(() => {
    setEnabledState((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  return (
    <BirthdayWishContext.Provider value={{ enabled, toggle, setEnabled }}>
      {children}
    </BirthdayWishContext.Provider>
  )
}

export function useBirthdayWish(): BirthdayWishContextValue {
  const ctx = useContext(BirthdayWishContext)
  if (!ctx) {
    throw new Error("useBirthdayWish must be used inside BirthdayWishProvider")
  }
  return ctx
}
