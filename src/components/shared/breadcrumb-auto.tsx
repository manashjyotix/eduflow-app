"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Fragment } from "react"
import { Home } from "lucide-react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { cn } from "@/lib/utils"

/**
 * Human-friendly labels for URL segments. Route-group segments (wrapped in
 * parentheses, e.g. "(app)") are skipped by Next.js routing and likewise
 * ignored here. Any segment not in this map is title-cased.
 */
const SEGMENT_LABELS: Record<string, string> = {
  // Role roots
  admin: "Admin",
  management: "Management",
  teacher: "Teacher",
  parent: "Parent",
  "super-admin": "Super Admin",

  // Admin pages
  dashboard: "Dashboard",
  "proxy-board": "Proxy Board",
  teachers: "Teachers",
  students: "Students",
  staff: "Staff Directory",
  roles: "Roles & Permissions",
  absences: "Absences",
  attendance: "Attendance",
  "swap-requests": "Swap Requests",
  swaps: "Swap Approvals",
  fees: "Fees",
  structure: "Fee Structure",
  collection: "Fee Collection",
  defaulters: "Defaulters",
  expenses: "Expenses",
  timetable: "Timetable",
  notices: "Notices",
  "holiday-calendar": "Holiday Calendar",
  analytics: "Analytics",
  reports: "Reports",
  announcements: "Announcements",
  audit: "Audit Log",
  settings: "Settings",
  subscription: "Subscription",
  profile: "Profile",

  // Management extras
  proxy: "Proxy Board",
  workload: "Workload",
  exams: "Exam Schedule",
  "daily-log": "Daily Log",

  // Teacher extras
  "proxy-history": "Proxy History",
  leave: "Leave",
  history: "History",
  mark: "Mark Attendance",
  "attendance-history": "Attendance History",
  notifications: "Notifications",

  // Parent extras
  journal: "Class Journal",
  "report-card": "Report Card",

  // Super-admin pages
  overview: "Platform Overview",
  health: "System Health",
  tenants: "All Schools",
  school: "School Drilldown",
  billing: "Billing Logs",
  affiliates: "Affiliates",
  backup: "Backup & Restore",
  emergency: "Emergency Console",

  // Marketing / auth
  login: "Login",
  signup: "Sign Up",
  "school-signup": "School Sign Up",
  features: "Features",
  pricing: "Pricing",
  demo: "Request Demo",
  onboarding: "Onboarding",
  "forgot-password": "Forgot Password",
}

function labelFor(segment: string): string {
  return SEGMENT_LABELS[segment] ?? segment
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
}

interface BreadcrumbAutoProps {
  className?: string
  /** Hide the leading Home crumb. Default false. */
  hideHome?: boolean
}

/**
 * BreadcrumbAuto — auto-generates a breadcrumb trail from the current Next.js
 * pathname. Mounted once in the Topbar; renders nothing on the app root.
 *
 * Route-group segments in parentheses (e.g. `(app)`) are skipped. The final
 * segment renders as a non-link "current page" crumb.
 */
export function BreadcrumbAuto({ className, hideHome = false }: BreadcrumbAutoProps) {
  const pathname = usePathname() ?? ""

  // Drop empty, route-group, and root segments.
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter(s => !s.startsWith("("))

  if (segments.length === 0) return null

  return (
    <Breadcrumb className={cn("min-w-0", className)}>
      <BreadcrumbList className="flex-nowrap">
        {!hideHome && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="flex items-center gap-1">
                  <Home className="size-3.5" />
                  <span className="sr-only">Home</span>
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}

        {segments.map((seg, idx) => {
          const isLast = idx === segments.length - 1
          // Build the cumulative href up to this segment.
          const href = "/" + segments.slice(0, idx + 1).join("/")
          const label = labelFor(decodeURIComponent(seg))

          return (
            <Fragment key={href}>
              <BreadcrumbItem className="min-w-0">
                {isLast ? (
                  <BreadcrumbPage className="truncate max-w-[180px]">{label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href} className="truncate max-w-[140px]">{label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
