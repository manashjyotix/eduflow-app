"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Role } from "@/lib/constants"
import { ROLE_DEFAULT_ROUTES } from "@/lib/constants"

// ─── Demo credentials (email → { role, password }) ─────────────────────────────
// Demo-mode auth: any of the 5 demo emails logs in as that role.
// Mirrors VISION.md / AGENTS.md auth table.

export const DEMO_CREDENTIALS: Record<string, { role: Role; password: string }> = {
  "superadmin@proxymanager.app": { role: "super_admin", password: "super123" },
  "admin@hcea.edu":              { role: "admin",       password: "admin123" },
  "mgmt@hcea.edu":               { role: "management",  password: "mgmt123" },
  "priya@hcea.edu":              { role: "teacher",     password: "teacher123" },
  "parent@hcea.edu":             { role: "parent",      password: "parent123" },
}

const STORAGE_ROLE   = "eduflow-role"
const STORAGE_AUTHED = "eduflow-authed"
const COOKIE_ROLE    = "user_role"
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

/** Set or clear the role cookie so Next.js middleware can read it. */
function setRoleCookie(role: Role | null) {
  try {
    const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : ""
    if (role) {
      document.cookie = `${COOKIE_ROLE}=${role}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax${secure}`
    } else {
      document.cookie = `${COOKIE_ROLE}=; path=/; max-age=0; SameSite=Lax${secure}`
    }
  } catch {
    /* cookie API may be unavailable in some environments — ignore */
  }
}

export type LoginResult =
  | { ok: true; role: Role; redirectTo: string }
  | { ok: false; error: string }

interface AuthContextValue {
  /** Currently authenticated role (null while logged out / loading) */
  role: Role | null
  /** True once we've read localStorage on mount */
  hydrated: boolean
  /** True if a user is logged in */
  isAuthenticated: boolean
  /** Demo-mode login. Validates email/password against DEMO_CREDENTIALS. */
  login: (email: string, password: string) => LoginResult
  /** Force-set the role without credentials (used by demo role switcher). */
  assumeRole: (role: Role) => void
  /** Log out and clear persisted session. */
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null)
  const [hydrated, setHydrated] = useState(false)

  // Restore persisted session on mount
  useEffect(() => {
    try {
      const authed = localStorage.getItem(STORAGE_AUTHED) === "true"
      const savedRole = localStorage.getItem(STORAGE_ROLE) as Role | null
      if (authed && savedRole) {
        setRole(savedRole)
        // Re-sync the role cookie in case it was cleared (e.g. browser restart)
        setRoleCookie(savedRole)
      }
    } catch {
      /* localStorage may be unavailable (SSR / privacy mode) — ignore */
    }
    setHydrated(true)
  }, [])

  const persist = useCallback((next: Role | null) => {
    setRole(next)
    try {
      if (next) {
        localStorage.setItem(STORAGE_ROLE, next)
        localStorage.setItem(STORAGE_AUTHED, "true")
      } else {
        localStorage.removeItem(STORAGE_AUTHED)
      }
    } catch {
      /* ignore persistence errors */
    }
    // Also set a role cookie so the server-side middleware can read the session
    setRoleCookie(next)
  }, [])

  const login = useCallback((email: string, password: string): LoginResult => {
    const key = email.trim().toLowerCase()
    const creds = DEMO_CREDENTIALS[key]
    if (!creds) {
      return { ok: false, error: "No account found for that email. Try a demo role below." }
    }
    if (password !== creds.password) {
      return { ok: false, error: "Incorrect password. Check the demo credentials and try again." }
    }
    persist(creds.role)
    return { ok: true, role: creds.role, redirectTo: ROLE_DEFAULT_ROUTES[creds.role] }
  }, [persist])

  const assumeRole = useCallback((next: Role) => {
    persist(next)
  }, [persist])

  const logout = useCallback(() => {
    persist(null)
  }, [persist])

  const value: AuthContextValue = {
    role,
    hydrated,
    isAuthenticated: role !== null,
    login,
    assumeRole,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>")
  return ctx
}
