"use client"

import Link from "next/link"

export default function AppError({
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
        <h1 className="text-2xl sm:text-3xl font-bold text-destructive leading-tight">
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
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Try again
        </button>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  )
}
