"use client"

/**
 * scroll-x.tsx
 *
 * Reusable horizontal scroll container with a *floating, auto-hiding* scrollbar.
 *
 * Mirrors the app shell's vertical AppScrollArea behaviour, but for the X axis:
 * the scrollbar only appears while the user is actively scrolling and fades out
 * after a short pause of inactivity (re-appearing on the next scroll). It floats
 * over the content (zero layout width) so it never shifts the tab bar / row.
 *
 * Use it to wrap horizontally-overflowing UI such as tab bars and chip rows so
 * every breakpoint (mobile / tablet / desktop) gets the same auto-hide scrollbar
 * instead of a persistent native one.
 */

import { OverlayScrollbarsComponent } from "overlayscrollbars-react"
import "overlayscrollbars/overlayscrollbars.css"
import { cn } from "@/lib/utils"

export function ScrollX({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <OverlayScrollbarsComponent
      defer
      className={cn("w-full max-w-full", className)}
      options={{
        scrollbars: {
          // Appear only while scrolling, then fade out after a brief pause.
          autoHide: "scroll",
          autoHideDelay: 900,
          theme: "os-theme-eduflow os-theme-eduflow--thin",
          clickScroll: true,
        },
        overflow: {
          x: "scroll",
          y: "hidden",
        },
      }}
    >
      {children}
    </OverlayScrollbarsComponent>
  )
}
