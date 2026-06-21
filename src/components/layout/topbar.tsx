"use client"
import Link from "next/link"
import { Bell, Search, Sun, Moon, Users } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { BreadcrumbAuto } from "@/components/shared/breadcrumb-auto"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { useRole } from "@/context/role-context"
import { useChild } from "@/context/child-context"
import { openCommandPalette } from "@/components/shared/command-palette"
import { MOCK_NOTIFICATIONS, PARENT_NOTIFICATIONS } from "@/data/mock-notifications"
import { cn } from "@/lib/utils"

// Profile href per role
const PROFILE_HREF: Record<string, string> = {
  admin:       "/admin/profile",
  management:  "/management/profile",
  teacher:     "/teacher/profile",
  parent:      "/parent/profile",
  super_admin: "/super-admin/profile",
}

const NOTIF_ICON_DOT: Record<string, string> = {
  proxy: "bg-primary",
  absence: "bg-destructive",
  swap: "bg-[var(--ef-purple)]",
  fee: "bg-success-foreground",
  announcement: "bg-warning-foreground",
  system: "bg-muted-foreground",
  leave: "bg-[var(--ef-purple)]",
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.round(diff / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.round(hrs / 24)}d ago`
}

function DarkModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="text-muted-foreground hover:text-foreground"
    >
      <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}

/** Child switcher — only rendered for the parent role when there are 2+ children */
function ChildSwitcher() {
  const { role } = useRole()
  const { children, selectedChildId, setSelectedChildId } = useChild()

  if (role !== "parent" || children.length <= 1) return null

  return (
    <>
      <Separator orientation="vertical" className="h-4" />
      <Select value={selectedChildId} onValueChange={setSelectedChildId}>
        <SelectTrigger
          className="h-8 w-auto gap-1.5 whitespace-nowrap text-xs border-border bg-muted/50 focus:ring-ring"
          aria-label="Switch child"
        >
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Users className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="hidden">
              <SelectValue placeholder="Select child" />
            </span>
          </span>
        </SelectTrigger>
        <SelectContent>
          {children.map((child) => (
            <SelectItem key={child.id} value={child.id} className="text-xs whitespace-nowrap">
              <span className="font-medium">{child.name}</span>
              <span className="ml-1.5 text-muted-foreground">· {child.className}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}

export function Topbar() {
  const { role, initials, name, subtitle, avatarColor } = useRole()
  const profileHref = PROFILE_HREF[role] ?? "/admin/profile"
  const notifications = role === "parent" ? PARENT_NOTIFICATIONS : MOCK_NOTIFICATIONS
  const unread = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur-sm shadow-sm px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />

      {/* Auto breadcrumb (pathname-derived) */}
      <BreadcrumbAuto className="hidden md:flex" />

      {/* Search — opens command palette (visible md+; tappable button on mobile) */}
      <button
        type="button"
        onClick={openCommandPalette}
        className="relative flex-1 max-w-sm hidden md:flex items-center gap-2 h-8 rounded-md bg-muted px-3 text-sm text-muted-foreground hover:bg-muted/80 transition-colors"
        aria-label="Open command palette"
      >
        <Search className="size-4 shrink-0" />
        <span className="flex-1 text-left">Search or jump to…</span>
        <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          ⌘K
        </kbd>
      </button>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={openCommandPalette}
        className="md:hidden text-muted-foreground hover:text-foreground"
        aria-label="Open command palette"
      >
        <Search className="size-4" />
      </Button>

      {/* Child switcher — parent role only, 2+ children */}
      <ChildSwitcher />

      {/* Right side actions */}
      <div className="ml-auto flex items-center gap-1">
        {/* Dark mode toggle */}
        <DarkModeToggle />

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative text-muted-foreground hover:text-foreground"
              aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ""}`}
            >
              <Bell className="size-4" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-0">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unread > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  {unread} unread
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="m-0" />
            <div className="max-h-80 overflow-y-auto">
              {notifications.slice(0, 6).map((n) => {
                const content = (
                  <div className="flex items-start gap-2.5 py-2.5 px-3">
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", NOTIF_ICON_DOT[n.type] ?? "bg-muted-foreground")} />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-xs leading-snug", n.read ? "font-normal text-muted-foreground" : "font-medium text-foreground")}>
                        {n.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
                    </div>
                    {!n.read && <span className="mt-1 size-1.5 shrink-0 rounded-full bg-primary" />}
                  </div>
                )
                return n.actionHref ? (
                  <DropdownMenuItem key={n.id} asChild className="p-0 focus:bg-accent">
                    <Link href={n.actionHref}>{content}</Link>
                  </DropdownMenuItem>
                ) : (
                  <div key={n.id} className="hover:bg-accent/50 transition-colors">{content}</div>
                )
              })}
            </div>
            <DropdownMenuSeparator className="m-0" />
            <DropdownMenuItem asChild>
              <Link
                href={role === "parent" ? "/parent/notifications" : role === "teacher" ? "/teacher/notifications" : "/admin/audit"}
                className="justify-center text-xs text-primary"
              >
                View all
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Separator orientation="vertical" className="h-4 mx-1" />

        {/* Role-aware avatar + name */}
        <Link
          href={profileHref}
          className="flex items-center gap-2 rounded-full pl-1 pr-2 py-0.5 hover:bg-accent transition-colors group"
          aria-label={`View profile — ${name}`}
        >
          <div
            className={cn(
              "size-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0",
              avatarColor
            )}
          >
            {initials}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold leading-tight group-hover:text-primary transition-colors">
              {name}
            </p>
            <p className="text-[10px] text-muted-foreground leading-tight truncate max-w-[120px]">
              {subtitle}
            </p>
          </div>
        </Link>
      </div>
    </header>
  )
}
