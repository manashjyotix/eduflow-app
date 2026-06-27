/**
 * src/middleware.ts — EduFlow route guard
 *
 * Strategy: reads the `user_role` cookie set by AuthContext when the user logs
 * in (client-side). The cookie is written via `document.cookie` so it is
 * accessible to Next.js Edge middleware on subsequent navigations.
 *
 * Note: NextAuth v5 / full JWT session handling is wired in task 8.1. This
 * middleware provides the security layer needed while the app uses the existing
 * client-side AuthContext demo auth.
 *
 * Role → path prefix mapping:
 *   admin        → /admin/*
 *   management   → /management/*
 *   teacher      → /teacher/*
 *   parent       → /parent/*
 *   super_admin  → /super-admin/*   (bypasses all prefix checks — impersonation)
 */

import { NextRequest, NextResponse } from "next/server"

/** Cookie name written by auth-context.tsx */
const ROLE_COOKIE = "user_role"

/** All valid role values */
const VALID_ROLES = ["admin", "management", "teacher", "parent", "super_admin", "driver"] as const
type Role = (typeof VALID_ROLES)[number]

/**
 * Prefix-to-required-role map.
 * Order matters: more-specific prefixes should come first if needed, but all
 * top-level role segments are distinct so order here is cosmetic only.
 */
const ROLE_PREFIX_MAP: Record<string, Role> = {
  "/admin":       "admin",
  "/management":  "management",
  "/teacher":     "teacher",
  "/parent":      "parent",
  "/super-admin": "super_admin",
  "/driver":      "driver",
}

/** Return the role required to access the given pathname, or null if no guard applies. */
function requiredRoleForPath(pathname: string): Role | null {
  for (const [prefix, role] of Object.entries(ROLE_PREFIX_MAP)) {
    // Match exact prefix or prefix followed by "/"
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      return role
    }
  }
  return null
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Determine whether this route requires a role
  const required = requiredRoleForPath(pathname)
  if (!required) {
    // Public route — pass through
    return NextResponse.next()
  }

  // Read the role cookie
  const rawRole = request.cookies.get(ROLE_COOKIE)?.value?.trim() ?? ""
  const role = VALID_ROLES.includes(rawRole as Role) ? (rawRole as Role) : null

  // No valid role cookie → unauthenticated; redirect to login
  if (!role) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = "/login"
    // Preserve the intended destination so login can redirect back after auth
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // super_admin bypasses all prefix checks (impersonation support)
  if (role === "super_admin") {
    return NextResponse.next()
  }

  // Enforce role-prefix matching
  if (role !== required) {
    // Authenticated but wrong role — redirect to their own dashboard
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = `/${role}/dashboard`
    dashboardUrl.search = ""
    return NextResponse.redirect(dashboardUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all (app) routes that require role-based access.
     * Excludes:
     *   - /login, /signup, /onboarding, /features, /pricing, /demo (marketing pages)
     *   - /_next/* (Next.js internals)
     *   - /api/*   (API routes handle their own auth)
     *   - /favicon.ico, /public files
     */
    "/(admin|management|teacher|parent|super-admin|driver)/:path*",
  ],
}
