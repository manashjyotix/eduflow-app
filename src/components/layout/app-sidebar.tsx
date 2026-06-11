"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, GraduationCap, Calendar, ClipboardList,
  BarChart3, Settings, ChevronLeft, ChevronRight, RefreshCw,
  DollarSign, BookOpen, Bell, Shield, CreditCard, Grid3x3,
  Activity, UserCog, ChevronDown
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import type { Role } from "@/lib/constants"

const NAV_BY_ROLE: Record<Role, Array<{ label: string; href: string; icon: React.ElementType; badge?: string }>> = {
  admin: [
    { label: "Dashboard",    href: "/admin/dashboard",  icon: LayoutDashboard },
    { label: "Proxy Board",  href: "/admin/proxy-board",icon: Grid3x3 },
    { label: "Teachers",     href: "/admin/teachers",   icon: Users },
    { label: "Students",     href: "/admin/students",   icon: GraduationCap },
    { label: "Absences",     href: "/admin/absences",   icon: ClipboardList, badge: "3" },
    { label: "Attendance",   href: "/admin/attendance", icon: BookOpen },
    { label: "Timetable",    href: "/admin/timetable",  icon: Calendar },
    { label: "Fees",         href: "/admin/fees",       icon: DollarSign },
    { label: "Analytics",    href: "/admin/analytics",  icon: BarChart3 },
    { label: "Notices",      href: "/admin/notices",    icon: Bell },
    { label: "Roles",        href: "/admin/roles",      icon: Shield },
    { label: "Subscription", href: "/admin/subscription",icon: CreditCard },
    { label: "Settings",     href: "/admin/settings",   icon: Settings },
  ],
  management: [
    { label: "Dashboard",    href: "/management/dashboard",  icon: LayoutDashboard },
    { label: "Absence Approval",href: "/management/absences",icon: ClipboardList, badge: "1" },
    { label: "Proxy Board",  href: "/management/proxy",      icon: Grid3x3 },
    { label: "Workload",     href: "/management/workload",   icon: Activity },
    { label: "Exam Schedule",href: "/management/exams",      icon: BookOpen },
    { label: "Notices",      href: "/management/notices",    icon: Bell },
  ],
  teacher: [
    { label: "Dashboard",    href: "/teacher/dashboard",  icon: LayoutDashboard },
    { label: "My Timetable", href: "/teacher/timetable",  icon: Calendar },
    { label: "Apply Leave",  href: "/teacher/leave",      icon: ClipboardList },
    { label: "Notifications",href: "/teacher/notifications",icon: Bell },
  ],
  parent: [
    { label: "Dashboard",    href: "/parent/dashboard",    icon: LayoutDashboard },
    { label: "Attendance",   href: "/parent/attendance",   icon: Calendar },
    { label: "Fees & Dues",  href: "/parent/fees",         icon: DollarSign },
    { label: "Notifications",href: "/parent/notifications",icon: Bell },
  ],
  super_admin: [
    { label: "Platform Overview", href: "/super-admin/overview", icon: BarChart3 },
    { label: "Tenants",           href: "/super-admin/tenants",  icon: Users },
    { label: "Billing Logs",      href: "/super-admin/billing",  icon: CreditCard },
    { label: "Affiliates",        href: "/super-admin/affiliates",icon: UserCog },
    { label: "Settings",          href: "/super-admin/settings",  icon: Settings },
  ],
}

const ROLE_LABELS: Record<Role, string> = {
  admin:       "Admin",
  management:  "Management",
  teacher:     "Teacher",
  parent:      "Parent",
  super_admin: "Super Admin",
}

const ROLE_EMAILS: Record<Role, string> = {
  admin:       "admin@hcea.edu",
  management:  "mgmt@hcea.edu",
  teacher:     "priya@hcea.edu",
  parent:      "parent@hcea.edu",
  super_admin: "superadmin@proxymanager.app",
}

const ROLE_INITIALS: Record<Role, string> = {
  admin: "AP", management: "MO", teacher: "PS", parent: "PU", super_admin: "SA",
}

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [role, setRole] = useState<Role>("admin")
  const [rolePicker, setRolePicker] = useState(false)

  const nav = NAV_BY_ROLE[role] ?? []

  return (
    <aside className={cn(
      "relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-200",
      collapsed ? "w-14" : "w-60"
    )}>
      {/* Header */}
      <div className="flex items-center gap-2 h-14 px-3 border-b border-sidebar-border overflow-hidden">
        <div className="size-7 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <RefreshCw className="size-4 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sidebar-foreground truncate">EduFlow</p>
            <p className="text-xs text-muted-foreground truncate">HCEA, Howly</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 scrollbar-none">
        {!collapsed && (
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
            {ROLE_LABELS[role]}
          </p>
        )}
        <ul className="space-y-0.5">
          {nav.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <item.icon className="size-4 flex-shrink-0" />
                  {!collapsed && (
                    <span className="truncate flex-1">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <Badge variant="destructive" className="text-xs px-1.5 py-0 h-4 min-w-4 justify-center">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator />

      {/* Role Switcher + Collapse */}
      <div className="p-2">
        {!collapsed && (
          <div className="relative">
            <button
              onClick={() => setRolePicker(!rolePicker)}
              className="w-full flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-sidebar-accent/50 transition-colors"
            >
              <div className="size-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold flex-shrink-0">
                {ROLE_INITIALS[role]}
              </div>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-xs font-medium text-foreground truncate">{ROLE_LABELS[role]}</p>
                <p className="text-xs text-muted-foreground truncate">{ROLE_EMAILS[role]}</p>
              </div>
              <ChevronDown className={cn("size-3 text-muted-foreground flex-shrink-0 transition-transform", rolePicker && "rotate-180")} />
            </button>

            {rolePicker && (
              <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-md shadow-md overflow-hidden z-50">
                {(Object.keys(ROLE_LABELS) as Role[]).map(r => (
                  <button
                    key={r}
                    onClick={() => { setRole(r); setRolePicker(false) }}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-accent transition-colors",
                      r === role && "bg-accent font-semibold"
                    )}
                  >
                    <div className="size-5 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold flex-shrink-0">
                      {ROLE_INITIALS[r]}
                    </div>
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end mt-1">
          <Button
            variant="ghost" size="icon-sm"
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
          </Button>
        </div>
      </div>
    </aside>
  )
}
