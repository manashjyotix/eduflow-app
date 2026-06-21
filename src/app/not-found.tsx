import Link from "next/link"

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 text-center">
      {/* Large 404 heading */}
      <h1 className="text-[8rem] font-bold leading-none tracking-tight text-primary">
        404
      </h1>

      {/* Subtitle */}
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Page not found
        </h2>
        <p className="max-w-sm text-base text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
      </div>

      {/* Back to Dashboard link */}
      <Link
        href="/admin/dashboard"
        className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Back to Dashboard
      </Link>
    </main>
  )
}
