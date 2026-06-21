"use client"

import { useRef, useState } from "react"
import { Upload, FileText, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { DocumentCategory } from "./DocumentCard"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UploadPayload {
  name: string
  category: DocumentCategory
  file: File
}

interface DocumentUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpload: (payload: UploadPayload) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentUploadModal({
  open,
  onOpenChange,
  onUpload,
}: DocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docName, setDocName] = useState("")
  const [category, setCategory] = useState<DocumentCategory | "">("")
  const [dragOver, setDragOver] = useState(false)

  function resetForm() {
    setSelectedFile(null)
    setDocName("")
    setCategory("")
    setDragOver(false)
  }

  function handleFileSelect(file: File) {
    setSelectedFile(file)
    // Pre-fill name from filename (without extension)
    if (!docName) {
      const name = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ")
      setDocName(name)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleSubmit() {
    if (!selectedFile || !docName.trim() || !category) return
    onUpload({ name: docName.trim(), category: category as DocumentCategory, file: selectedFile })
    resetForm()
    onOpenChange(false)
  }

  const isValid = !!selectedFile && docName.trim().length > 0 && !!category

  return (
    <Dialog
      open={open}
      onOpenChange={open => {
        if (!open) resetForm()
        onOpenChange(open)
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="size-4 text-primary" />
            Upload Document
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Drop zone */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Click or drag a file here to upload"
            className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors
              ${dragOver
                ? "border-primary bg-accent"
                : "border-border bg-muted/30 hover:border-primary/60 hover:bg-accent/50"
              }`}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={e => e.key === "Enter" && fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <>
                <FileText className="size-8 text-primary" />
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium max-w-[200px] truncate">{selectedFile.name}</span>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Remove selected file"
                    onClick={e => {
                      e.stopPropagation()
                      setSelectedFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ""
                    }}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</span>
              </>
            ) : (
              <>
                <Upload className="size-8 text-muted-foreground" />
                <p className="text-sm font-medium">Drop file here or click to browse</p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, XLSX, JPG, PNG supported</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png,.gif,.webp"
              onChange={handleInputChange}
              aria-hidden="true"
            />
          </div>

          {/* Document name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-name">Document Name</Label>
            <Input
              id="doc-name"
              placeholder="e.g. Term 1 Circular — June 2026"
              value={docName}
              onChange={e => setDocName(e.target.value)}
            />
          </div>

          {/* Category selector */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="doc-category">Category</Label>
            <Select
              value={category}
              onValueChange={val => setCategory(val as DocumentCategory)}
            >
              <SelectTrigger id="doc-category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="circular">Circular</SelectItem>
                <SelectItem value="handbook">Handbook</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="exam_paper">Exam Paper</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={resetForm}>Cancel</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={!isValid}>
            <Upload className="size-4" /> Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
