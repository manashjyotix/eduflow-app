"use client"
import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard, Users, GraduationCap, Calendar, ClipboardList,
  BarChart3, Settings, ChevronLeft, ChevronRight, RefreshCw,
  DollarSign, BookOpen, Bell, Shield, CreditCard, Grid3x3
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const adminNav = [
  { label: "Dashboard",    href: "/admin/dashboard",  icon: LayoutDashboard },
  { label: "Proxy Board",  href: "/admin/proxy-board",icon: Grid3x3 },
  { label: "Teachers",     href: "/admin/teachers",   icon: Users },
  { label: "Students",     href: "/admin/students",   icon: GraduationCap },
  { label: "Absences",     href: "/admin/absences",   icon: ClipboardList },
  { label: "Attendance",   href: "/admin/attendance", icon: BookOpen },
  { label: "Timetable",    href: "/admin/timetable",  icon: Calendar },
  { label: "Fees",         href: "/admin/fees",       icon: DollarSign },
  { label: "Analytics",    href: "/admin/analytics",  icon: BarChart3 },
  { label: "Notices",      href: "/admin/notices",    icon: Bell },
  { label: "Roles",        href: "/admin/roles",      icon: Shield },
  { label: "Subscription", href: "/admin/subscription",icon: CreditCard },
  { label: "Settings",     href: "/admin/settings",   icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      "relative flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-220",
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
            Admin
          </p>
        )}
        <ul className="space-y-0.5">
          {adminNav.map(item => {
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
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <Separator />

      {/* Footer */}
      <div className="p-2 flex items-center gap-2">
        {!collapsed && (
          <div className="flex items-center gap-2 flex-1 min-w-0 px-1">
            <div className="size-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold flex-shrink-0">
              AP
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">Admin</p>
              <p className="text-xs text-muted-foreground truncate">admin@hcea.edu</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost" size="icon-sm"
          onClick={() => setCollapsed(!collapsed)}
          className="flex-shrink-0 ml-auto"
        >
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </div>
    </aside>
  )
}
