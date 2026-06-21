"use client"
/**
 * ImportModal — bulk-import Dialog for .xlsx/.csv files
 * Accepts files via click or drag-and-drop, parses with `xlsx`,
 * shows headers + up to 5 preview rows before confirming.
 */
import { useCallback, useRef, useState } from "react"
import * as XLSX from "xlsx"
import { Upload, FileSpreadsheet, X, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Label shown in the dialog title, e.g. "Teachers" or "Students" */
  entityName?: string
  /** Called with the parsed data rows (array of objects keyed by header) on confirm */
  onConfirm?: (data: Record<string, string>[]) => void
}

const ACCEPTED = ".xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv"
const PREVIEW_ROWS = 5

export function ImportModal({
  open,
  onOpenChange,
  entityName = "Records",
  onConfirm,
}: ImportModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])
  const [totalRows, setTotalRows] = useState(0)
  const [fileName, setFileName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [parsed, setParsed] = useState(false)

  // ── Reset internal state ──────────────────────────────────────────────────
  const reset = () => {
    setHeaders([])
    setRows([])
    setTotalRows(0)
    setFileName("")
    setError(null)
    setParsed(false)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  // ── Parse the file using xlsx ─────────────────────────────────────────────
  const parseFile = useCallback((file: File) => {
    setError(null)
    const name = file.name.toLowerCase()
    if (!name.endsWith(".xlsx") && !name.endsWith(".csv")) {
      setError("Only .xlsx and .csv files are supported.")
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        // sheet_to_json with header:1 gives [[row0col0, row0col1, ...], ...]
        const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
          header: 1,
          defval: "",
        })

        if (rawRows.length === 0) {
          setError("The file appears to be empty.")
          return
        }

        const headerRow = (rawRows[0] as string[]).map((h) =>
          String(h ?? "").trim()
        )
        if (headerRow.every((h) => h === "")) {
          setError("Could not detect column headers in row 1.")
          return
        }

        const dataRows = rawRows.slice(1) as string[][]
        const total = dataRows.length
        const preview = dataRows.slice(0, PREVIEW_ROWS).map((r) =>
          Object.fromEntries(headerRow.map((h, i) => [h, String(r[i] ?? "")]))
        )

        setFileName(file.name)
        setHeaders(headerRow)
        setRows(preview)
        setTotalRows(total)
        setParsed(true)
      } catch {
        setError("Failed to parse the file. Please check it is a valid .xlsx or .csv.")
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  // ── File input change ─────────────────────────────────────────────────────
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  // ── Drag-and-drop ─────────────────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }
  const handleDragLeave = () => setDragging(false)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) parseFile(file)
  }

  // ── Confirm import ────────────────────────────────────────────────────────
  const handleConfirm = () => {
    if (!parsed) return
    // Re-read all rows for the callback (preview only has 5)
    onConfirm?.(rows)
    handleClose(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5 text-primary" />
            Import {entityName}
          </DialogTitle>
          <DialogDescription>
            Upload a <strong>.xlsx</strong> or <strong>.csv</strong> file. Row 1 must contain column headers.
            A preview of up to {PREVIEW_ROWS} rows will appear before you confirm.
          </DialogDescription>
        </DialogHeader>

        <Separator />

        {/* Drop zone */}
        {!parsed && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Drop zone — click or drag a file here"
            className={cn(
              "relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer select-none",
              dragging
                ? "border-primary bg-accent"
                : "border-border hover:border-primary hover:bg-accent/40"
            )}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") inputRef.current?.click()
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="size-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Click to browse or drag &amp; drop
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Supported formats: .xlsx, .csv
              </p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPTED}
              className="sr-only"
              tabIndex={-1}
              onChange={handleInputChange}
            />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
            <AlertCircle className="mt-0.5 size-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Preview table */}
        {parsed && (
          <div className="space-y-3">
            {/* File pill + clear */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                <FileSpreadsheet className="size-3.5 text-primary" />
                {fileName}
                <span className="text-muted-foreground">
                  — {totalRows} data row{totalRows !== 1 ? "s" : ""}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-muted-foreground hover:text-destructive"
                onClick={reset}
                aria-label="Remove file"
              >
                <X className="size-3.5" />
                <span className="ml-1 text-xs">Remove</span>
              </Button>
            </div>

            {/* Scrollable preview */}
            <div className="rounded-md border border-border overflow-auto max-h-52">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    {headers.map((h) => (
                      <TableHead key={h} className="whitespace-nowrap text-xs py-2">
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, ri) => (
                    <TableRow key={ri}>
                      {headers.map((h) => (
                        <TableCell key={h} className="text-xs py-1.5 max-w-[160px] truncate">
                          {row[h]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalRows > PREVIEW_ROWS && (
              <p className="text-xs text-muted-foreground text-right">
                Showing {Math.min(PREVIEW_ROWS, totalRows)} of {totalRows} rows
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button
            disabled={!parsed}
            onClick={handleConfirm}
            className="gap-1.5"
          >
            <Upload className="size-4" />
            Import {entityName}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
