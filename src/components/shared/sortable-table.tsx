"use client"

import * as React from "react"
import { useState } from "react"
import { ChevronsUpDown } from "lucide-react"
import { TableHead } from "@/components/ui/table"
import { cn } from "@/lib/utils"

export type SortDir = "asc" | "desc"

/**
 * Shared, accessible click-to-sort hook for data tables.
 *
 * Provide an `accessors` map describing how to read the comparable value for
 * each sortable column key. String values are compared with `localeCompare`,
 * numbers numerically. Returns the sorted rows plus the current sort state and
 * a `toggleSort` handler (asc → desc → asc).
 *
 * @example
 * const { sorted, sortField, sortDir, toggleSort } = useTableSort(rows, {
 *   name:   r => r.name,
 *   amount: r => r.amount,
 * }, { field: "name" })
 */
export function useTableSort<T, K extends string>(
  rows: T[],
  accessors: Record<K, (row: T) => string | number | null | undefined>,
  initial?: { field: NoInfer<K>; dir?: SortDir },
) {
  const [sortField, setSortField] = useState<K | null>(initial?.field ?? null)
  const [sortDir, setSortDir] = useState<SortDir>(initial?.dir ?? "asc")

  function toggleSort(field: K) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
  }

  const sorted = React.useMemo(() => {
    if (!sortField) return rows
    const accessor = accessors[sortField]
    if (!accessor) return rows
    return [...rows].sort((a, b) => {
      const av = accessor(a)
      const bv = accessor(b)
      let cmp = 0
      if (typeof av === "number" && typeof bv === "number") {
        cmp = av - bv
      } else {
        cmp = String(av ?? "").localeCompare(String(bv ?? ""))
      }
      return sortDir === "asc" ? cmp : -cmp
    })
    // accessors is treated as stable (defined inline per render); intentionally omitted
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, sortField, sortDir])

  return { sorted, sortField, sortDir, toggleSort, setSortField, setSortDir }
}

interface SortableHeadProps<K extends string>
  extends Omit<React.ThHTMLAttributes<HTMLTableCellElement>, "onClick"> {
  /** Column key — must match a key used with {@link useTableSort}. */
  field: K
  /** Header label content. */
  label: React.ReactNode
  /** Currently active sort field (from `useTableSort`). */
  sortField: K | null
  /** Current sort direction (from `useTableSort`). */
  sortDir: SortDir
  /** Toggle handler (from `useTableSort`). */
  onSort: (field: K) => void
  /** Text alignment — mirrors the column body alignment. */
  align?: "left" | "right" | "center"
}

/**
 * Sortable table header cell with the standard EduFlow sort affordance:
 * a `ChevronsUpDown` icon that turns primary-colored when its column is the
 * active sort, dimmed otherwise. Keyboard accessible and sets `aria-sort`.
 */
export function SortableHead<K extends string>({
  field,
  label,
  sortField,
  sortDir,
  onSort,
  align = "left",
  className,
  ...props
}: SortableHeadProps<K>) {
  const active = sortField === field
  return (
    <TableHead
      className={cn("h-auto", className)}
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
      {...props}
    >
      <button
        type="button"
        onClick={() => onSort(field)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault()
            onSort(field)
          }
        }}
        className={cn(
          "inline-flex items-center gap-1 font-semibold cursor-pointer select-none hover:text-foreground",
          align === "right" && "flex-row-reverse",
          align === "center" && "justify-center",
        )}
      >
        {label}
        <ChevronsUpDown className={cn("size-3 shrink-0", active ? "text-primary" : "opacity-40")} />
      </button>
    </TableHead>
  )
}
