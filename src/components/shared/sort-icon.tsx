import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface SortIconProps {
  active?: boolean
  direction?: "asc" | "desc"
  className?: string
}

export function SortIcon({ active, direction, className }: SortIconProps) {
  if (!active) return <ArrowUpDown className={cn("size-3.5 text-muted-foreground", className)} />
  if (direction === "asc")  return <ArrowUp   className={cn("size-3.5 text-foreground", className)} />
  return <ArrowDown className={cn("size-3.5 text-foreground", className)} />
}
