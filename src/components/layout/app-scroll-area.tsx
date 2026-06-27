"use client"

/**
 * app-scroll-area.tsx
 *
 * App-wide scroll container for the shell's <main> region.
 *
 * Uses OverlayScrollbars to render a *floating, auto-hiding* scrollbar that
 * overlays the content instead of reserving layout width. Because the native
 * scrollbar is hidden (zero layout footprint), opening a Radix Dialog (whose
 * scroll-lock compensates for native scrollbar width) no longer resizes the
 * page — eliminating the layout-shift "glitch" on modal open.
 *
 * This wraps the single shell scroll container, so every current and future
 * page automatically inherits the same behaviour.
 */

import { OverlayScrollbarsComponent } from "overlayscrollbars-react"
import "overlayscrollbars/overlayscrollbars.css"
import { cn } from "@/lib/utils"

export function AppScrollArea({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <OverlayScrollbarsComponent
      element="main"
      defer
      className={cn("flex-1 min-h-0 min-w-0 overflow-x-hidden", className)}
      options={{
        scrollbars: {
          // Float over content and fade out shortly after the pointer stops
          // moving / scrolling. Reappears whenever the mouse moves over the
          // scroll area (or on scroll), so it's there the moment you reach
          // for it and out of the way otherwise.
          autoHide: "move",
          autoHideDelay: 1300,
          theme: "os-theme-eduflow",
          clickScroll: true,
        },
        overflow: {
          x: "hidden",
          y: "scroll",
        },
      }}
    >
      {children}
    </OverlayScrollbarsComponent>
  )
}
