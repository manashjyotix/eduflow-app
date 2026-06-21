"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/auth-context"

/**
 * App-shell guard. Redirects to /login when no authenticated session is found.
 *
 * Hydration strategy:
 * - Before hydration: render children optimistically (avoids white flash).
 *   The middleware already enforces auth server-side via the role cookie,
 *   so unauthenticated users never reach this layout in the first place.
 * - After hydration: if somehow no session, redirect to /login.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, hydrated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace("/login")
    }
  }, [hydrated, isAuthenticated, router])

  // Always render children — the middleware is the real auth gate.
  // This prevents the white screen / skeleton flash on every navigation.
  return <>{children}</>
}
