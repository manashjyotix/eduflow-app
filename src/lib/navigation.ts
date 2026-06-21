import {
  LayoutDashboard, Users, GraduationCap, Calendar, ClipboardList,
  BarChart3, Settings, ArrowLeftRight,
  Banknote, BookOpen, Bell, ShieldCheck, CreditCard, LayoutGrid,
  TrendingUp, UserCog, ChevronDown, Database, TriangleAlert, User,
  FileText, Megaphone, CheckSquare, Receipt, Wallet, NotebookPen,
  ScrollText, Globe, Building2,
  PlugZap, History, ListChecks, HeartHandshake, BookMarked,
  ClipboardCheck, UserRoundSearch,
} from "lucide-react"
import type { Role } from "@/lib/constants"

// ─── Navigation config ────────────────────────────────────────────────────────
// Shared between AppSidebar and CommandPalette. Single source of truth for
// per-role routes, labels, and icons.

export type NavItem = { label: string; href: string; icon: React.ElementType; badge?: string }
export type NavGroup = { label: string; items: NavItem[] }

export const NAV_BY_ROLE: Record<Role, NavGroup[]> = {
  // ── Admin (22 pages) ────────────────────────────────────────────────────────
  admin: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard",   href: "/admin/dashboard",   icon: LayoutDashboard },
        { label: "Proxy Board", href: "/admin/proxy-board", icon: LayoutGrid },
      ],
    },
    {
      label: "People",
      items: [
        { label: "Teachers", href: "/admin/teachers", icon: Users },
        { label: "Students", href: "/admin/students", icon: GraduationCap },
        { label: "Staff",    href: "/admin/staff",    icon: UserCog },
        { label: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheck },
      ],
    },
    {
      label: "Attendance & Leave",
      items: [
        { label: "Absences",      href: "/admin/absences",      icon: ClipboardList, badge: "3" },
        { label: "Swap Requests", href: "/admin/swap-requests", icon: ArrowLeftRight },
        { label: "Attendance",    href: "/admin/attendance",    icon: CheckSquare },
        { label: "Timetable",     href: "/admin/timetable",     icon: Calendar },
        { label: "Holiday Calendar", href: "/admin/holiday-calendar", icon: BookMarked },
      ],
    },
    {
      label: "Finance",
      items: [
        { label: "Fees",     href: "/admin/fees",     icon: Banknote },
        { label: "Expenses", href: "/admin/expenses", icon: Wallet },
      ],
    },
    {
      label: "Insights",
      items: [
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { label: "Reports",   href: "/admin/reports",   icon: FileText },
      ],
    },
    {
      label: "Communication",
      items: [
        { label: "Notices",        href: "/admin/notices",        icon: ScrollText },
        { label: "Announcements",  href: "/admin/announcements",  icon: Megaphone },
      ],
    },
    {
      label: "Administration",
      items: [
        { label: "Audit Log",     href: "/admin/audit",         icon: History },
        { label: "Subscription",  href: "/admin/subscription",  icon: CreditCard },
        { label: "Settings",      href: "/admin/settings",      icon: Settings },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "My Profile", href: "/admin/profile", icon: User },
      ],
    },
  ],

  // ── Management (12 pages) ────────────────────────────────────────────────────
  management: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/management/dashboard", icon: LayoutDashboard },
        { label: "Daily Log",  href: "/management/daily-log", icon: NotebookPen },
      ],
    },
    {
      label: "Attendance & Leave",
      items: [
        { label: "Absence Approval", href: "/management/absences",   icon: ClipboardList, badge: "1" },
        { label: "Proxy Board",      href: "/management/proxy",      icon: LayoutGrid },
        { label: "Swap Approvals",   href: "/management/swaps",      icon: ArrowLeftRight },
        { label: "Workload",         href: "/management/workload",   icon: TrendingUp },
        { label: "Attendance",       href: "/management/attendance", icon: CheckSquare },
      ],
    },
    {
      label: "Academic",
      items: [
        { label: "Exam Schedule", href: "/management/exams",     icon: GraduationCap },
        { label: "Timetable",     href: "/management/timetable", icon: Calendar },
      ],
    },
    {
      label: "Insights",
      items: [
        { label: "Proxy Reports", href: "/management/reports", icon: BarChart3 },
        { label: "Notices",       href: "/management/notices", icon: ScrollText },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "My Profile", href: "/management/profile", icon: User },
      ],
    },
  ],

  // ── Teacher (9 pages) ─────────────────────────────────────────────────────
  teacher: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard",    href: "/teacher/dashboard",  icon: LayoutDashboard },
        { label: "My Timetable", href: "/teacher/timetable",  icon: Calendar },
      ],
    },
    {
      label: "Leave & Proxy",
      items: [
        { label: "Apply Leave",    href: "/teacher/leave",         icon: ClipboardList },
        { label: "Leave History",  href: "/teacher/leave-history", icon: History },
        { label: "Proxy History",  href: "/teacher/proxy-history", icon: ArrowLeftRight },
      ],
    },
    {
      label: "Records",
      items: [
        { label: "Mark Attendance",    href: "/teacher/attendance/mark",    icon: CheckSquare },
        { label: "Attendance History", href: "/teacher/attendance-history", icon: ListChecks },
      ],
    },
    {
      label: "Communication",
      items: [
        { label: "Notices",       href: "/teacher/notices",       icon: ScrollText },
        { label: "Notifications", href: "/teacher/notifications", icon: Bell },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "My Profile", href: "/teacher/profile", icon: User },
      ],
    },
  ],

  // ── Parent (8 pages) ──────────────────────────────────────────────────────
  parent: [
    {
      label: "Overview",
      items: [
        { label: "Dashboard", href: "/parent/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      label: "My Child",
      items: [
        { label: "Attendance",    href: "/parent/attendance",  icon: CheckSquare },
        { label: "Class Journal", href: "/parent/journal",     icon: BookOpen },
        { label: "Report Card",   href: "/parent/report-card", icon: ScrollText },
        { label: "Exams",         href: "/parent/exams",       icon: ClipboardCheck },
      ],
    },
    {
      label: "Finance & Leave",
      items: [
        { label: "Fees & Dues",  href: "/parent/fees",  icon: Receipt },
        { label: "Apply Leave",  href: "/parent/leave", icon: FileText },
      ],
    },
    {
      label: "Communication",
      items: [
        { label: "Notifications", href: "/parent/notifications", icon: Bell },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "My Profile", href: "/parent/profile", icon: User },
      ],
    },
  ],

  // ── Super Admin (11 pages) ────────────────────────────────────────────────
  super_admin: [
    {
      label: "Platform",
      items: [
        { label: "Platform Overview", href: "/super-admin/overview",  icon: Globe },
        { label: "Analytics",         href: "/super-admin/analytics", icon: BarChart3 },
        { label: "System Health",     href: "/super-admin/health",    icon: PlugZap },
      ],
    },
    {
      label: "Tenants",
      items: [
        { label: "All Schools",      href: "/super-admin/tenants", icon: Building2 },
        { label: "School Drilldown", href: "/super-admin/school",  icon: UserRoundSearch },
      ],
    },
    {
      label: "Billing",
      items: [
        { label: "Billing Logs", href: "/super-admin/billing",    icon: Receipt },
        { label: "Affiliates",   href: "/super-admin/affiliates", icon: HeartHandshake },
      ],
    },
    {
      label: "Operations",
      items: [
        { label: "Backup & Restore",  href: "/super-admin/backup",    icon: Database },
        { label: "Emergency Console", href: "/super-admin/emergency", icon: TriangleAlert },
        { label: "Audit Log",         href: "/super-admin/audit",     icon: History },
        { label: "Settings",          href: "/super-admin/settings",  icon: Settings },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "My Profile", href: "/super-admin/profile", icon: User },
      ],
    },
  ],
}

// Icons also referenced outside the nav config (sidebar footer, palette)
export { ChevronDown }
