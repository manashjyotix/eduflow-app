"use client"
/**
 * ExportMenu — PDF / CSV export dropdown
 * Tier 2 shared composite (REBUILD_PLAN.md §3)
 */
import { Download, FileText, Table2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ExportMenuProps {
  onExportCSV?: () => void
  onExportPDF?: () => void
  label?: string
}

export function ExportMenu({ onExportCSV, onExportPDF, label = "Export" }: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="size-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuLabel>Export as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onExportCSV && (
          <DropdownMenuItem onClick={onExportCSV}>
            <Table2 className="size-4" />
            CSV / Excel
          </DropdownMenuItem>
        )}
        {onExportPDF && (
          <DropdownMenuItem onClick={onExportPDF}>
            <FileText className="size-4" />
            PDF Report
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
