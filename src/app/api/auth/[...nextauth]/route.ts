/**
 * src/app/api/auth/[...nextauth]/route.ts
 *
 * NextAuth v5 catch-all route handler.
 * All auth endpoints (/api/auth/signin, /api/auth/signout,
 * /api/auth/session, /api/auth/csrf, etc.) are handled here.
 *
 * Requirements: 8.2, 8.3
 */

import { handlers } from "@/auth"

export const { GET, POST } = handlers
