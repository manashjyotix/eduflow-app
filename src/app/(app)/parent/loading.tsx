import { Skeleton } from "@/components/ui/skeleton"

/**
 * Parent loading skeleton — mirrors the parent dashboard:
 * weather greeting banner + child summary card + 4 KPI cards +
 * today's schedule card + notifications card + fee alert card.
 */
export default function ParentLoading() {
  return (
    <div className="page-content">
      {/* Weather greeting banner */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-60" />
            <Skeleton className="h-4 w-44" />
          </div>
          <div className="ml-auto text-right space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      </div>

      {/* Child summary card */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        </div>
      </div>

      {/* KPI cards — attendance, exams, fee, class rank */}
      <div className="kpi-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Main content — today's schedule + right column */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Today's schedule card */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-20" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-8 shrink-0" />
              <Skeleton className="h-11 flex-1 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Right column — exam countdown + fee alert */}
        <div className="space-y-4">
          {/* Exam countdown card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            <div className="flex justify-center gap-2 py-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </div>
            <Skeleton className="h-4 w-40 mx-auto" />
          </div>

          {/* Fee alert card */}
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            ))}
            <Skeleton className="h-9 w-full rounded-md mt-1" />
          </div>
        </div>
      </div>

      {/* Notifications list */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-7 w-7 rounded-full shrink-0 mt-0.5" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-2 w-2 rounded-full mt-2 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
