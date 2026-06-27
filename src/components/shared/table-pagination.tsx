"use client"
/**
 * TablePagination — Figma-matched pagination bar
 *
 * Combines:
 *  - Search input with debounced onChange
 *  - Date quick-filter: All / Today / Yesterday / This Week
 *  - Page number controls with ellipsis
 *  - Rows-per-page select (10 / 25 / 50)
 *  - "Showing X–Y of Z records" result summary
 *
 * Design tokens: bg-primary text-primary-foreground for active page,
 * hover:bg-muted for inactive, opacity-40 for disabled.
 */
import { useEffect, useState, useCallback } from "react"
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, X, Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// ── Types ─────────────────────────────────────────────────────────────────────

export type DateFilterValue = "all" | "today" | "yesterday" | "week"

export interface TablePaginationProps {
  /** Total filtered record count */
  total: number
  /** Current page — 1-indexed */
  page: number
  /** Records per page */
  pageSize: number
  onPageChange: (p: number) => void
  onPageSizeChange: (size: number) => void
  /** Optional controlled search */
  search?: string
  onSearchChange?: (q: string) => void
  /** Optional date quick-filter */
  dateFilter?: DateFilterValue
  onDateFilterChange?: (f: DateFilterValue) => void
  /** Additional className for the root wrapper */
  className?: string
}

const PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

const DATE_FILTER_LABELS: { value: DateFilterValue; label: string }[] = [
  { value: "all",       label: "All" },
  { value: "today",     label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week",      label: "This Week" },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Generate page number array with ellipsis (null = gap) */
function pageRange(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | null)[] = []
  if (current <= 4) {
    pages.push(1, 2, 3, 4, 5, null, total)
  } else if (current >= total - 3) {
    pages.push(1, null, total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, null, current - 1, current, current + 1, null, total)
  }
  return pages
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TablePagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  search = "",
  onSearchChange,
  dateFilter = "all",
  onDateFilterChange,
  className,
}: TablePaginationProps) {
  // Debounced search
  const [localSearch, setLocalSearch] = useState(search)
  useEffect(() => { setLocalSearch(search) }, [search])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleSearchChange = useCallback(
    debounce((val: string) => onSearchChange?.(val), 300),
    [onSearchChange]
  )

  function onInputChange(val: string) {
    setLocalSearch(val)
    handleSearchChange(val)
    if (page !== 1) onPageChange(1)
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to   = Math.min(page * pageSize, total)
  const pages = pageRange(page, totalPages)

  function goTo(p: number) {
    if (p >= 1 && p <= totalPages) onPageChange(p)
  }

  return (
    <div className={cn(
      "flex flex-col gap-3 px-4 py-3 border-t border-border bg-card",
      className
    )}>
      {/* ── Top row: Search + Date filter ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        {onSearchChange && (
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search records…"
              value={localSearch}
              onChange={e => onInputChange(e.target.value)}
              className={cn(
                "w-full h-8 pl-8 pr-8 text-xs rounded-md border border-input bg-background",
                "text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-colors"
              )}
            />
            {localSearch && (
              <button
                type="button"
                onClick={() => onInputChange("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        )}

        {/* Date quick-filter */}
        {onDateFilterChange && (
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5" role="group" aria-label="Date filter">
            {DATE_FILTER_LABELS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  onDateFilterChange(value)
                  if (page !== 1) onPageChange(1)
                }}
                className={cn(
                  "flex items-center gap-1 px-2.5 h-7 rounded-md text-xs font-medium transition-all",
                  dateFilter === value
                    ? "bg-card text-primary font-semibold shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {value !== "all" && <Calendar className="size-3 shrink-0" />}
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Rows per page */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">Rows</span>
          <Select
            value={String(pageSize)}
            onValueChange={v => { onPageSizeChange(Number(v)); onPageChange(1) }}
          >
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map(s => (
                <SelectItem key={s} value={String(s)} className="text-xs">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Bottom row: result count + page controls ── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Result summary */}
        <p className="text-xs text-muted-foreground">
          {total === 0
            ? "No records found"
            : <>Showing <span className="font-semibold text-foreground">{from}–{to}</span> of <span className="font-semibold text-foreground">{total}</span> records</>
          }
        </p>

        {/* Page controls */}
        <nav aria-label="Pagination" className="flex items-center gap-0.5">
          {/* First */}
          <PageBtn onClick={() => goTo(1)} disabled={page === 1} aria-label="First page">
            <ChevronsLeft className="size-3.5" />
          </PageBtn>
          {/* Prev */}
          <PageBtn onClick={() => goTo(page - 1)} disabled={page === 1} aria-label="Previous page">
            <ChevronLeft className="size-3.5" />
          </PageBtn>

          {/* Page numbers */}
          {pages.map((p, idx) =>
            p === null ? (
              <span key={`gap-${idx}`} className="size-8 flex items-center justify-center text-xs text-muted-foreground">
                …
              </span>
            ) : (
              <PageBtn
                key={p}
                onClick={() => goTo(p)}
                active={p === page}
                aria-label={`Page ${p}`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </PageBtn>
            )
          )}

          {/* Next */}
          <PageBtn onClick={() => goTo(page + 1)} disabled={page === totalPages} aria-label="Next page">
            <ChevronRight className="size-3.5" />
          </PageBtn>
          {/* Last */}
          <PageBtn onClick={() => goTo(totalPages)} disabled={page === totalPages} aria-label="Last page">
            <ChevronsRight className="size-3.5" />
          </PageBtn>
        </nav>
      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

interface PageBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

function PageBtn({ active, className, disabled, children, ...props }: PageBtnProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={cn(
        "size-8 flex items-center justify-center rounded-md text-xs font-medium transition-all select-none",
        active
          ? "bg-primary text-primary-foreground font-semibold shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        disabled && "opacity-40 cursor-not-allowed pointer-events-none",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

// ── Debounce utility ──────────────────────────────────────────────────────────

function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number,
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
