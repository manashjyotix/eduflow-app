import { Skeleton } from "@/components/ui/skeleton"

/** Driver loading skeleton — mirrors the trip console: header + map + stop list. */
export default function DriverLoading() {
  return (
    <div className="page-content">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-5 w-5 rounded-full shrink-0" />
            <Skeleton className="h-9 flex-1 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}
