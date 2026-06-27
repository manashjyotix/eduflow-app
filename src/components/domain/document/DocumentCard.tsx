"use client"

import {
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// ─── Types ────────────────────────────────────────────────────────────────────

export type DocumentCategory = "circular" | "handbook" | "policy" | "exam_paper"
export type Role = "admin" | "management" | "teacher" | "parent" | "super_admin"

export interface SchoolDocument {
  id: string
  name: string
  category: DocumentCategory
  uploadDate: string
  fileSize: string
  fileType: string
  visibleTo: Role[]
}

export interface DocumentCardProps {
  document: SchoolDocument
  canDelete?: boolean
  onDownload: (id: string) => void
  onDelete?: (id: string) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileIcon(fileType: string) {
  const lower = fileType.toLowerCase()
  if (lower === "pdf" || lower === "docx" || lower === "doc") {
    return <FileText className="size-8 text-primary" />
  }
  if (lower === "xlsx" || lower === "xls" || lower === "csv") {
    return <FileSpreadsheet className="size-8 text-success-foreground" />
  }
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(lower)) {
    return <ImageIcon className="size-8 text-[var(--ef-purple)]" />
  }
  return <File className="size-8 text-muted-foreground" />
}

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  circular: "Circular",
  handbook: "Handbook",
  policy: "Policy",
  exam_paper: "Exam Paper",
}

const CATEGORY_VARIANT: Record<
  DocumentCategory,
  "default" | "secondary" | "outline" | "destructive" | "success" | "warning"
> = {
  circular: "default",
  handbook: "success",
  policy: "warning",
  exam_paper: "destructive",
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DocumentCard({
  document: doc,
  canDelete = false,
  onDownload,
  onDelete,
}: DocumentCardProps) {
  const formattedDate = new Date(doc.uploadDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3">
          {/* File icon + category badge row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-shrink-0 p-2 rounded-lg bg-muted/60">
              {getFileIcon(doc.fileType)}
            </div>
            <Badge variant={CATEGORY_VARIANT[doc.category]} className="capitalize text-xs flex-shrink-0">
              {CATEGORY_LABEL[doc.category]}
            </Badge>
          </div>

          {/* Name */}
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug line-clamp-2">{doc.name}</p>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span className="uppercase font-mono">{doc.fileType}</span>
              <span>·</span>
              <span>{doc.fileSize}</span>
            </div>
          </div>

          {/* Date + actions */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
            <span className="text-[11px] text-muted-foreground">{formattedDate}</span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                title="Download"
                onClick={() => onDownload(doc.id)}
              >
                <Download className="size-3.5" />
                <span className="sr-only">Download {doc.name}</span>
              </Button>
              {canDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Delete"
                  onClick={() => onDelete(doc.id)}
                >
                  <Trash2 className="size-3.5" />
                  <span className="sr-only">Delete {doc.name}</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
