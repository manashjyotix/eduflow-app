/**
 * src/auth.ts — NextAuth v5 configuration
 *
 * Exports:
 *   handlers  → used in src/app/api/auth/[...nextauth]/route.ts
 *   auth      → used in middleware and server components to read the session
 *   signIn    → used in server actions / login form
 *   signOut   → used in server actions / logout button
 *
 * Session JWT claims:
 *   user.id       — MongoDB _id (string)
 *   user.role     — UserRole  ("admin" | "management" | "teacher" | "parent" | "super_admin")
 *   user.schoolId — string | null (null for super_admin)
 *
 * Requirements: 8.2, 8.3
 */

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import type { NextAuthConfig } from "next-auth"
import type { UserRole } from "@/models/User"

// ─── Module augmentation ───────────────────────────────────────────────────
// Extend the built-in Session / JWT types so TypeScript knows about our custom
// claims throughout the app.
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: UserRole
      schoolId: string | null
    }
  }

  interface User {
    role: UserRole
    schoolId: string | null
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: UserRole
    schoolId: string | null
  }
}

// ─── Auth configuration ────────────────────────────────────────────────────
const authConfig: NextAuthConfig = {
  /**
   * Use JWT strategy for sessions — required for CredentialsProvider.
   * Database sessions are not supported with Credentials.
   */
  session: { strategy: "jwt" },

  /**
   * Custom sign-in page. NextAuth will redirect unauthenticated users here
   * instead of the built-in /api/auth/signin page.
   */
  pages: {
    signIn: "/login",
  },

  providers: [
    Credentials({
      /**
       * Describe the fields so NextAuth can render the default sign-in page
       * if ever visited (not used in our custom login page, but required).
       */
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },

      /**
       * Called on every sign-in attempt with Credentials.
       * Returns the User object on success, null on failure.
       *
       * DB failures (missing MONGODB_URI, network error) are caught and
       * treated as authentication failures — the app still builds and runs
       * in mock/dev mode without a live MongoDB.
       */
      async authorize(credentials) {
        const email    = credentials?.email    as string | undefined
        const password = credentials?.password as string | undefined

        if (!email || !password) return null

        try {
          // Lazy-import DB helpers so they are only evaluated server-side
          // and so missing MONGODB_URI doesn't crash at module-load time.
          const { connectDB } = await import("@/lib/mongodb")
          const { User }      = await import("@/models/User")

          await connectDB()

          const user = await User.findOne({ email: email.toLowerCase().trim() })
            .select("+passwordHash")
            .lean<import("@/models/User").IUser & { _id: import("mongoose").Types.ObjectId }>()

          if (!user) return null
          if (!user.isActive) return null

          const passwordMatches = await bcrypt.compare(password, user.passwordHash)
          if (!passwordMatches) return null

          // Update last login timestamp (best-effort, don't block sign-in)
          User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() }).catch(() => {})

          return {
            id:       user._id.toString(),
            name:     user.name,
            email:    user.email,
            role:     user.role,
            schoolId: user.schoolId ? user.schoolId.toString() : null,
          }
        } catch (err) {
          // DB unavailable (MONGODB_URI not set, connection refused, etc.)
          // Return null so the app gracefully fails authentication instead
          // of crashing. Log to console so it's visible in dev.
          console.warn("[auth] DB unavailable — authentication skipped:", (err as Error).message)
          return null
        }
      },
    }),
  ],

  callbacks: {
    /**
     * jwt callback — runs when a JWT is created or updated.
     * On first sign-in (`user` is defined), we copy our custom claims into
     * the token so they survive across requests.
     */
    async jwt({ token, user }) {
      if (user) {
        token.sub      = user.id
        token.role     = user.role
        token.schoolId = user.schoolId
      }
      return token
    },

    /**
     * session callback — runs whenever a session is accessed.
     * We copy our custom JWT claims into the session object so client
     * components can read them via `useSession()`.
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id       = token.sub as string
        session.user.role     = token.role     as UserRole
        session.user.schoolId = token.schoolId as string | null
      }
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
