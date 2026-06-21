"use client"

/**
 * CommandPalette — global ⌘K / Ctrl+K quick navigator.
 *
 * Searches the current role's navigation, lets the user switch roles
 * (demo), sign out, and jump to marketing pages. Built on shadcn `command`
 * (cmdk). Mounted once in the (app) layout.
 */

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  LogOut, Moon, Sun, ArrowLeftRight, Home, BookOpen, CreditCard, CalendarDays,
} from "lucide-react"
import { useTheme } from "next-themes"
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem,
  CommandList, CommandSeparator, CommandShortcut,
} from "@/components/ui/command"
import { useRole, ROLE_LABELS } from "@/context/role-context"
import { useAuth } from "@/context/auth-context"
import { NAV_BY_ROLE } from "@/lib/navigation"
import type { Role } from "@/lib/constants"

const ROLE_OPTIONS: Role[] = ["super_admin", "admin", "management", "teacher", "parent"]

/** Dispatch this event (e.g. from the topbar search box) to open the palette. */
export const OPEN_COMMAND_PALETTE = "eduflow:open-command-palette"

export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE))
  }
}

export function CommandPalette() {
  const router = useRouter()
  const { role, setRole } = useRole()
  const { logout } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const [open, setOpen] = useState(false)

  // ── Global ⌘K / Ctrl+K shortcut ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  // ── Open via custom event (topbar search / buttons) ──
  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_COMMAND_PALETTE, onOpen)
    return () => window.removeEventListener(OPEN_COMMAND_PALETTE, onOpen)
  }, [])

  const run = useCallback((fn: () => void) => {
    setOpen(false)
    // Defer so the dialog closes before navigation/redirects occur
    setTimeout(fn, 0)
  }, [])

  const groups = NAV_BY_ROLE[role] ?? []

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={`Search EduFlow — ${ROLE_LABELS[role]}…`} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Navigation for the active role */}
        {groups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => (
              <CommandItem
                key={item.href}
                value={`${item.label} ${group.label}`}
                onSelect={() => run(() => router.push(item.href))}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-1 rounded bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                    {item.badge}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        <CommandSeparator />

        {/* Marketing / public pages */}
        <CommandGroup heading="Public">
          <CommandItem value="landing home" onSelect={() => run(() => router.push("/"))}>
            <Home className="size-4" />
            <span>Landing Page</span>
          </CommandItem>
          <CommandItem value="features" onSelect={() => run(() => router.push("/features"))}>
            <BookOpen className="size-4" />
            <span>Features</span>
          </CommandItem>
          <CommandItem value="pricing" onSelect={() => run(() => router.push("/pricing"))}>
            <CreditCard className="size-4" />
            <span>Pricing</span>
          </CommandItem>
          <CommandItem value="demo book" onSelect={() => run(() => router.push("/demo"))}>
            <CalendarDays className="size-4" />
            <span>Book a Demo</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Switch role (demo) */}
        <CommandGroup heading="Switch Role (Demo)">
          {ROLE_OPTIONS.filter((r) => r !== role).map((r) => (
            <CommandItem
              key={r}
              value={`switch role ${ROLE_LABELS[r]}`}
              onSelect={() => run(() => setRole(r))}
            >
              <ArrowLeftRight className="size-4" />
              <span>Become {ROLE_LABELS[r]}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        {/* Preferences */}
        <CommandGroup heading="Preferences">
          <CommandItem
            value="toggle theme dark light mode"
            onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
          >
            {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            <span>Toggle {resolvedTheme === "dark" ? "Light" : "Dark"} Mode</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Sign out */}
        <CommandGroup>
          <CommandItem
            value="sign out logout"
            onSelect={() => run(() => {
              logout()
              router.push("/login")
            })}
          >
            <LogOut className="size-4" />
            <span>Sign Out</span>
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
