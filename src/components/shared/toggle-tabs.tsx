"use client"

import { cn } from "@/lib/utils"

interface ToggleTabsProps<T extends string> {
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  className?: string
}

/**
 * A lightweight tab-toggle that matches the global shadcn TabsList / TabsTrigger
 * visual style. Use this wherever you need a simple value-toggle without
 * full Radix Tabs panel semantics.
 */
export function ToggleTabs<T extends string>({
  options,
  value,
  onChange,
  className,
}: ToggleTabsProps<T>) {
  return (
    <div
      role="tablist"
      aria-orientation="horizontal"
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
        className
      )}
    >
      {options.map((option) => {
        const isActive = option === value
        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={isActive}
            data-state={isActive ? "active" : "inactive"}
            onClick={() => onChange(option)}
            className={cn(
              "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
            )}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
