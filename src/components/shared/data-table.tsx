"use client"
/**
 * DataTable — sortable, filterable table wrapper built on shadcn Table
 * Follows REBUILD_PLAN.md Tier 2 (Shared Composites) pattern.
 */
import * as React from "react"
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell, TableFooter,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { SortIcon } from "@/components/shared/sort-icon"

export interface ColumnDef<T> {
  key: string
  header: string
  sortable?: boolean
  className?: string
  headerClassName?: string
  cell: (row: T, index: number) => React.ReactNode
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  keyExtractor: (row: T) => string
  loading?: boolean
  skeletonRows?: number
  emptyState?: React.ReactNode
  footer?: React.ReactNode
  className?: string
  /** Accessible table caption — satisfies WCAG 1.3.1 Info and Relationships */
  caption?: string
  /** Controlled sort — provide both to enable column-click sorting */
  sortKey?: string
  sortDir?: "asc" | "desc"
  onSort?: (key: string) => void
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  skeletonRows = 5,
  emptyState,
  footer,
  className,
  caption,
  sortKey,
  sortDir = "asc",
  onSort,
}: DataTableProps<T>) {
  return (
    <div className={cn("rounded-lg border bg-card overflow-hidden", className)}>
      <Table>
        {caption && <caption className="sr-only">{caption}</caption>}
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map(col => (
              <TableHead
                key={col.key}
                className={cn(
                  col.sortable && onSort && "cursor-pointer select-none",
                  col.headerClassName
                )}
                onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && onSort && (
                    <SortIcon active={sortKey === col.key} direction={sortDir} />
                  )}
                </span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map(col => (
                    <TableCell key={col.key}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            : data.length === 0
            ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center">
                  {emptyState ?? (
                    <span className="text-muted-foreground text-sm">No results found.</span>
                  )}
                </TableCell>
              </TableRow>
            )
            : data.map((row, idx) => (
              <TableRow key={keyExtractor(row)}>
                {columns.map(col => (
                  <TableCell key={col.key} className={col.className}>
                    {col.cell(row, idx)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          }
        </TableBody>
        {footer && (
          <TableFooter>
            <TableRow>
              <TableCell colSpan={columns.length}>{footer}</TableCell>
            </TableRow>
          </TableFooter>
        )}
      </Table>
    </div>
  )
}
