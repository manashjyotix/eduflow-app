"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  useRole,
  ROLE_LABELS,
  ROLE_SUBTITLES,
  ROLE_EMAILS,
  ROLE_INITIALS,
  ROLE_AVATAR_COLOR,
} from "@/context/role-context"
import { useAuth } from "@/context/auth-context"
import { NAV_BY_ROLE, ChevronDown } from "@/lib/navigation"
import type { Role } from "@/lib/constants"

// ─── EduFlow logo icon ────────────────────────────────────────────────────────

function EduFlowLogo() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
      <rect width="20" height="20" rx="5" fill="currentColor" fillOpacity="0.15" />
      <path d="M5 7h10M5 10h6M5 13h8" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const router = useRouter()
  const { role, setRole } = useRole()
  const { logout } = useAuth()
  const [rolePicker, setRolePicker] = useState(false)

  const groups = NAV_BY_ROLE[role] ?? []

  function handleSignOut() {
    setRolePicker(false)
    logout()
    router.push("/login")
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ── Header: brand mark ── */}
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild tooltip="EduFlow">
              <div className="flex items-center gap-2 cursor-default select-none">
                <div className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                  <EduFlowLogo />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-sidebar-foreground truncate">
                    EduFlow
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">HCEA · Howly, Assam</p>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* ── Content: grouped navigation ── */}
      <SidebarContent>
        {groups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active =
                    pathname === item.href || pathname.startsWith(item.href + "/")
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.label}
                      >
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                      {item.badge && (
                        <SidebarMenuBadge>
                          <Badge
                            variant="destructive"
                            className="text-[10px] px-1 py-0 h-4 min-w-4 justify-center"
                          >
                            {item.badge}
                          </Badge>
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* ── Footer: role switcher with rich user details ── */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="relative">
              <SidebarMenuButton
                size="lg"
                onClick={() => setRolePicker((p) => !p)}
                tooltip={`${ROLE_LABELS[role]} · ${ROLE_EMAILS[role]}`}
                className="w-full"
              >
                {/* Avatar */}
                <div
                  className={cn(
                    "size-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0",
                    ROLE_AVATAR_COLOR[role]
                  )}
                  aria-hidden="true"
                >
                  {ROLE_INITIALS[role]}
                </div>

                {/* Name + subtitle (hidden when sidebar is collapsed to icon) */}
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-semibold leading-tight text-sidebar-foreground truncate">
                    {ROLE_LABELS[role]}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                    {ROLE_SUBTITLES[role]}
                  </p>
                  <p className="text-[10px] text-muted-foreground/70 truncate leading-tight">
                    {ROLE_EMAILS[role]}
                  </p>
                </div>

                <ChevronDown
                  className={cn(
                    "size-3 text-muted-foreground shrink-0 transition-transform duration-150",
                    rolePicker && "rotate-180"
                  )}
                />
              </SidebarMenuButton>

              {/* Role picker dropdown */}
              {rolePicker && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50">
                  {/* Header label */}
                  <div className="px-3 py-2 border-b border-border">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Switch Role (Demo)
                    </p>
                  </div>

                  {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setRole(r)
                        setRolePicker(false)
                      }}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 text-xs hover:bg-accent transition-colors text-left",
                        r === role && "bg-accent"
                      )}
                    >
                      <div
                        className={cn(
                          "size-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0",
                          ROLE_AVATAR_COLOR[r]
                        )}
                        aria-hidden="true"
                      >
                        {ROLE_INITIALS[r]}
                      </div>
                      <div className="min-w-0">
                        <p className={cn("font-medium text-foreground leading-tight", r === role && "text-primary")}>
                          {ROLE_LABELS[r]}
                        </p>
                        <p className="text-[10px] text-muted-foreground truncate leading-tight">
                          {ROLE_SUBTITLES[r]}
                        </p>
                      </div>
                      {r === role && (
                        <div className="ml-auto size-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </button>
                  ))}

                  {/* Log out row */}
                  <Separator />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="size-3.5 shrink-0" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Rail for resize/toggle on desktop */}
      <SidebarRail />
    </Sidebar>
  )
}
