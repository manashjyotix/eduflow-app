"use client"

/**
 * child-tabs.tsx
 *
 * Reusable global child tab component for the parent portal.
 * Shows each child as a pill-style tab — syncs with the ChildProvider context.
 *
 * Usage:
 *   <ChildTabs>
 *     <div>Page content here — uses useChild() to get selectedChildId</div>
 *   </ChildTabs>
 *
 * When there is only 1 child, no tab bar is rendered — children are shown directly.
 * When there are 2+ children, a pill tab bar (bg-muted, content-hugging) is shown at the top.
 */

import { type ReactNode } from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChild } from "@/context/child-context"
import { cn } from "@/lib/utils"

interface ChildTabsProps {
  children: ReactNode
  className?: string
}

export function ChildTabs({ children, className }: ChildTabsProps) {
  const { children: mockChildren, selectedChildId, setSelectedChildId } = useChild()

  // Single child — no tabs needed
  if (mockChildren.length <= 1) {
    return <>{children}</>
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <Tabs
        value={selectedChildId}
        onValueChange={setSelectedChildId}
      >
        <TabsList className="w-full sm:w-auto">
          {mockChildren.map((child) => (
            <TabsTrigger
              key={child.id}
              value={child.id}
              className="flex-1 sm:flex-none gap-1.5 text-xs sm:text-sm"
            >
              <span>{child.name}</span>
              <span className="text-muted-foreground text-[10px] sm:text-xs">· {child.className}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Page content — controlled by useChild() context, not by Tabs */}
      {children}
    </div>
  )
}
