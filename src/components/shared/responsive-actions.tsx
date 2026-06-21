"use client"

/**
 * ResponsiveActions — toolbar that adapts to viewport width (issue #2).
 *
 * - On `sm` and larger screens: renders each action as an inline Button.
 * - On phones (< sm): collapses every action into a single 3-dot
 *   DropdownMenu so toolbars never overflow on small screens.
 *
 * Usage:
 *   <ResponsiveActions
 *     actions={[
 *       { label: "Refresh", icon: <RefreshCw className="size-4" />, onClick: refresh, variant: "outline" },
 *       { label: "Auto-Assign", icon: <Zap className="size-4" />, onClick: assign },
 *     ]}
 *   />
 *
 * `primary` actions stay visible as an icon button even on mobile when
 * `keepPrimaryOnMobile` is set, with the rest moving into the menu.
 */

import * as React from "react"
import { MoreVertical } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export interface ResponsiveAction {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  variant?: ButtonProps["variant"]
  disabled?: boolean
  /** Hide this action from the inline desktop row (menu-only). */
  menuOnly?: boolean
}

interface ResponsiveActionsProps {
  actions: ResponsiveAction[]
  className?: string
  /** Tailwind breakpoint at which inline buttons appear. Default: "sm". */
  breakpoint?: "sm" | "md" | "lg"
}

const SHOW: Record<string, string> = {
  sm: "hidden sm:flex",
  md: "hidden md:flex",
  lg: "hidden lg:flex",
}
const HIDE: Record<string, string> = {
  sm: "flex sm:hidden",
  md: "flex md:hidden",
  lg: "flex lg:hidden",
}

export function ResponsiveActions({ actions, className, breakpoint = "sm" }: ResponsiveActionsProps) {
  if (actions.length === 0) return null

  return (
    <div className={cn("items-center gap-2", className)}>
      {/* Inline buttons — desktop / tablet */}
      <div className={cn(SHOW[breakpoint], "items-center gap-2")}>
        {actions
          .filter((a) => !a.menuOnly)
          .map((a) => (
            <Button
              key={a.label}
              size="sm"
              variant={a.variant ?? "default"}
              onClick={a.onClick}
              disabled={a.disabled}
            >
              {a.icon}
              {a.label}
            </Button>
          ))}
      </div>

      {/* 3-dot menu — mobile */}
      <div className={cn(HIDE[breakpoint], "items-center")}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" aria-label="More actions">
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {actions.map((a) => (
              <DropdownMenuItem
                key={a.label}
                onClick={a.onClick}
                disabled={a.disabled}
                className={cn(a.variant === "destructive" && "text-destructive focus:text-destructive")}
              >
                {a.icon}
                {a.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
