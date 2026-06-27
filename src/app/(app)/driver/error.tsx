"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function DriverError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      <div className="flex flex-col items-center gap-1">
        <span className="text-2xl font-bold tracking-tight text-primary">EduFlow</span>
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">School Management</span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-destructive leading-tight">Something went wrong</h1>
        <p className="max-w-sm text-base text-muted-foreground">
          An unexpected error occurred. You can try again or return to your trip console.
        </p>
        {error.digest && <p className="text-xs text-muted-foreground">Error ID: {error.digest}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" onClick={reset}>Try again</Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/driver/dashboard">Back to My Trip</Link>
        </Button>
      </div>
    </main>
  )
}
