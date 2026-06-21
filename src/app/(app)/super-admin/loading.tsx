import { Skeleton } from "@/components/ui/skeleton"

/**
 * Super Admin loading skeleton — mirrors the SaaS overview dashboard:
 * page header + 4 platform KPI cards + MRR trend chart card +
 * tenant list card + platform health service list.
 */
export default function SuperAdminLoading() {
  return (
    <div className="page-content">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-44" />
          <Skeleton className="h-4 w-68" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Platform KPI cards — MRR, tenants, churn, health */}
      <div className="kpi-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Charts row — MRR trend + plan distribution */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* MRR trend chart */}
        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>

        {/* Plan distribution donut */}
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <Skeleton className="h-5 w-32" />
          <div className="flex justify-center py-2">
            <Skeleton className="h-36 w-36 rounded-full" />
          </div>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full shrink-0" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>

      {/* Tenant list card */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-32 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
          </div>
        </div>
        {/* Table header */}
        <div className="flex items-center gap-4 pb-1 border-b border-border">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-20 ml-auto" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
        {/* Tenant rows */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="space-y-1 min-w-0">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full shrink-0" />
            <Skeleton className="h-4 w-20 shrink-0" />
            <Skeleton className="h-2 w-24 rounded-full shrink-0" />
            <Skeleton className="h-7 w-20 rounded-md shrink-0" />
          </div>
        ))}
      </div>

      {/* Platform health services */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <Skeleton className="h-5 w-36" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Skeleton className="h-7 w-7 rounded-full shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-5 w-14 rounded-full shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
