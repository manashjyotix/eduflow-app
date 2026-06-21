"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Shield, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// Same school IDs used in super-admin/school/page.tsx
const SCHOOLS: Record<string, string> = {
  "sch-1": "Holy Child English Academy",
  "sch-2": "Delhi Public School, Guwahati",
  "sch-3": "St. Xavier's High School",
  "sch-4": "Don Bosco Academy",
  "sch-5": "Kendriya Vidyalaya No. 1",
  "sch-6": "Bright Minds Academy",
}

export function ImpersonationBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const schoolId = searchParams.get("impersonating")
  if (!schoolId) return null

  const schoolName = SCHOOLS[schoolId] ?? schoolId

  function handleExit() {
    router.push("/super-admin/school")
  }

  return (
    <div
      className="sticky top-0 z-50 flex items-center gap-3 py-2 px-4 bg-[var(--ef-amber)] text-[var(--ef-amber-dark)]"
      role="banner"
      aria-label="Impersonation session active"
    >
      <Shield className="size-4 flex-shrink-0" aria-hidden="true" />
      <span className="text-sm font-semibold flex-1">
        Impersonating: {schoolName}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExit}
        className="h-7 gap-1.5 text-[var(--ef-amber-dark)] hover:bg-[var(--ef-amber-dark)]/10 font-semibold text-sm"
        aria-label="Exit impersonation session"
      >
        <X className="size-3.5" aria-hidden="true" />
        Exit
      </Button>
    </div>
  )
}
