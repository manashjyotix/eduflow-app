import { Skeleton } from "@/components/ui/skeleton"

/**
 * Management loading skeleton — mirrors the management dashboard:
 * morning briefing header + coverage KPIs + period countdown card + absence approval list.
 */
export default function ManagementLoading() {
  return (
    <div className="page-content">
      {/* Morning briefing header */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-4 w-36" />
          </div>
        </div>
      </div>

      {/* KPI cards — coverage metrics */}
      <div className="kpi-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-14" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Period countdown + quick-assign row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Countdown timer card */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3 flex flex-col items-center">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-40 rounded-xl" />
          <Skeleton className="h-3 w-24" />
        </div>
        {/* Quick-assign panel */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* Absence approval list */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-44" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-1">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-8 w-16 rounded-md" />
            <Skeleton className="h-8 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  )
}
