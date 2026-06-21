"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import type { Role } from "@/lib/constants"
import { useAuth } from "@/context/auth-context"

// ─── Role metadata ─────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<Role, string> = {
  admin:       "Arnab Paul",
  management:  "Mrinal Ojha",
  teacher:     "Priya Sharma",
  parent:      "Pankaj Das",
  super_admin: "Super Admin",
}

export const ROLE_SUBTITLES: Record<Role, string> = {
  admin:       "Principal · Admin",
  management:  "Vice Principal",
  teacher:     "Mathematics · High Section",
  parent:      "Parent of Rohit Das",
  super_admin: "Platform Owner",
}

export const ROLE_EMAILS: Record<Role, string> = {
  admin:       "admin@hcea.edu",
  management:  "mgmt@hcea.edu",
  teacher:     "priya@hcea.edu",
  parent:      "parent@hcea.edu",
  super_admin: "superadmin@proxymanager.app",
}

export const ROLE_INITIALS: Record<Role, string> = {
  admin:       "AP",
  management:  "MO",
  teacher:     "PS",
  parent:      "PD",
  super_admin: "SA",
}

export const ROLE_PHONE: Record<Role, string> = {
  admin:       "+91 98765 43210",
  management:  "+91 98765 43210",
  teacher:     "+91 87654 32109",
  parent:      "+91 76543 21098",
  super_admin: "+91 99999 00000",
}

export const ROLE_DEPARTMENT: Record<Role, string> = {
  admin:       "Administration",
  management:  "Management Office",
  teacher:     "Mathematics & Science",
  parent:      "Parent / Guardian",
  super_admin: "Platform Operations",
}

export const ROLE_JOINED: Record<Role, string> = {
  admin:       "August 2022",
  management:  "April 2024",
  teacher:     "June 2023",
  parent:      "March 2025",
  super_admin: "January 2024",
}

/** Tailwind bg class for avatar pill */
export const ROLE_AVATAR_COLOR: Record<Role, string> = {
  admin:       "bg-primary",
  management:  "bg-success",
  teacher:     "bg-warning",
  parent:      "bg-[var(--ef-purple)]",
  super_admin: "bg-destructive",
}

// ─── Context ───────────────────────────────────────────────────────────────────

interface RoleContextValue {
  role: Role
  setRole: (role: Role) => void
  // Convenience getters for current role
  name: string
  subtitle: string
  email: string
  initials: string
  phone: string
  department: string
  joined: string
  avatarColor: string
}

const RoleContext = createContext<RoleContextValue | null>(null)

export function RoleProvider({ children }: { children: ReactNode }) {
  // Role is driven by the auth session. Falls back to "admin" only when
  // consumed outside an authenticated shell (e.g. SSR / marketing pages).
  const { role: authedRole, assumeRole } = useAuth()
  const role: Role = authedRole ?? "admin"

  const value: RoleContextValue = useMemo(() => ({
    role,
    setRole: assumeRole,
    name:        ROLE_LABELS[role],
    subtitle:    ROLE_SUBTITLES[role],
    email:       ROLE_EMAILS[role],
    initials:    ROLE_INITIALS[role],
    phone:       ROLE_PHONE[role],
    department:  ROLE_DEPARTMENT[role],
    joined:      ROLE_JOINED[role],
    avatarColor: ROLE_AVATAR_COLOR[role],
  }), [role, assumeRole])

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>
}

export function useRole(): RoleContextValue {
  const ctx = useContext(RoleContext)
  if (!ctx) throw new Error("useRole must be used inside <RoleProvider>")
  return ctx
}
