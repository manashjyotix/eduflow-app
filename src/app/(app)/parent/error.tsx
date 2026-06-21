"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ParentError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      {/* EduFlow branding */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-bold tracking-tight text-primary">
          EduFlow
        </span>
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          School Management
        </span>
      </div>

      {/* Error heading */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-destructive">
          Something went wrong
        </h1>
        <p className="max-w-sm text-base text-muted-foreground">
          An unexpected error occurred. You can try again or return to your
          dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-muted-foreground">
            Error ID: {error.digest}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/parent/dashboard">Back to Dashboard</Link>
        </Button>
      </div>
    </main>
  )
}
