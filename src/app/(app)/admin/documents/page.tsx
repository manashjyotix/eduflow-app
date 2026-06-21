"use client"

import { useState } from "react"
import { FolderOpen, Upload, Search } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { DocumentCard, type SchoolDocument, type DocumentCategory } from "@/components/domain/document/DocumentCard"
import { DocumentUploadModal, type UploadPayload } from "@/components/domain/document/DocumentUploadModal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_DOCUMENTS: SchoolDocument[] = [
  {
    id: "doc-1",
    name: "Term 1 Circular — Fee Due Dates 2025-26",
    category: "circular",
    uploadDate: "2026-04-02",
    fileSize: "128 KB",
    fileType: "pdf",
    visibleTo: ["admin", "teacher", "parent"],
  },
  {
    id: "doc-2",
    name: "PTM Notice — June 2026",
    category: "circular",
    uploadDate: "2026-05-28",
    fileSize: "84 KB",
    fileType: "pdf",
    visibleTo: ["admin", "teacher", "parent"],
  },
  {
    id: "doc-3",
    name: "Holiday Calendar Circular — 2025-26",
    category: "circular",
    uploadDate: "2026-04-01",
    fileSize: "96 KB",
    fileType: "pdf",
    visibleTo: ["admin", "management", "teacher", "parent"],
  },
  {
    id: "doc-4",
    name: "Student Handbook 2025-26",
    category: "handbook",
    uploadDate: "2026-03-15",
    fileSize: "1.2 MB",
    fileType: "pdf",
    visibleTo: ["admin", "management", "teacher", "parent"],
  },
  {
    id: "doc-5",
    name: "Teacher Handbook & Code of Conduct",
    category: "handbook",
    uploadDate: "2026-03-15",
    fileSize: "890 KB",
    fileType: "docx",
    visibleTo: ["admin", "management", "teacher"],
  },
  {
    id: "doc-6",
    name: "School Safety & Emergency Policy",
    category: "policy",
    uploadDate: "2026-01-10",
    fileSize: "540 KB",
    fileType: "pdf",
    visibleTo: ["admin", "management", "teacher"],
  },
  {
    id: "doc-7",
    name: "Anti-Ragging Policy 2026",
    category: "policy",
    uploadDate: "2026-02-05",
    fileSize: "210 KB",
    fileType: "pdf",
    visibleTo: ["admin", "management"],
  },
  {
    id: "doc-8",
    name: "Leave & Attendance Policy for Staff",
    category: "policy",
    uploadDate: "2026-01-20",
    fileSize: "320 KB",
    fileType: "docx",
    visibleTo: ["admin", "management", "teacher"],
  },
  {
    id: "doc-9",
    name: "Class X Mid-Term Exam Paper — Mathematics",
    category: "exam_paper",
    uploadDate: "2026-05-10",
    fileSize: "256 KB",
    fileType: "pdf",
    visibleTo: ["admin", "management"],
  },
  {
    id: "doc-10",
    name: "Class VIII Science — Unit Test Paper",
    category: "exam_paper",
    uploadDate: "2026-05-15",
    fileSize: "178 KB",
    fileType: "pdf",
    visibleTo: ["admin", "management"],
  },
  {
    id: "doc-11",
    name: "Annual Exam Schedule 2025-26",
    category: "exam_paper",
    uploadDate: "2026-04-20",
    fileSize: "112 KB",
    fileType: "xlsx",
    visibleTo: ["admin", "management", "teacher", "parent"],
  },
]

// ─── Constants ────────────────────────────────────────────────────────────────

type TabValue = "all" | DocumentCategory

const TABS: { value: TabValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "circular", label: "Circulars" },
  { value: "handbook", label: "Handbooks" },
  { value: "policy", label: "Policies" },
  { value: "exam_paper", label: "Exam Papers" },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<SchoolDocument[]>(MOCK_DOCUMENTS)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<TabValue>("all")
  const [query, setQuery] = useState("")

  function handleDownload(id: string) {
    // In production this would trigger a real file download
    const doc = documents.find(d => d.id === id)
    if (doc) {
      console.log("Downloading:", doc.name)
    }
  }

  function handleDelete(id: string) {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  function handleUpload(payload: UploadPayload) {
    const ext = payload.file.name.split(".").pop() ?? "pdf"
    const newDoc: SchoolDocument = {
      id: `doc-${Date.now()}`,
      name: payload.name,
      category: payload.category,
      uploadDate: new Date().toISOString().slice(0, 10),
      fileSize: `${(payload.file.size / 1024).toFixed(0)} KB`,
      fileType: ext,
      visibleTo: ["admin", "management", "teacher", "parent"],
    }
    setDocuments(prev => [newDoc, ...prev])
  }

  // Filtered list
  const filtered = documents.filter(doc => {
    const matchesTab = activeTab === "all" || doc.category === activeTab
    const matchesQuery = !query || doc.name.toLowerCase().includes(query.toLowerCase())
    return matchesTab && matchesQuery
  })

  // Count per category
  const counts: Record<TabValue, number> = {
    all: documents.length,
    circular: documents.filter(d => d.category === "circular").length,
    handbook: documents.filter(d => d.category === "handbook").length,
    policy: documents.filter(d => d.category === "policy").length,
    exam_paper: documents.filter(d => d.category === "exam_paper").length,
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<FolderOpen size={20} />}
        title="Document Manager"
        subtitle="School circulars, handbooks, policies, and exam papers"
        actions={
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="size-4" /> Upload
          </Button>
        }
      />

      {/* Search bar */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input
          placeholder="Search documents…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="pl-9"
          aria-label="Search documents"
        />
      </div>

      {/* Category tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as TabValue)}>
        <TabsList className="flex-wrap h-auto gap-1">
          {TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5">
              {tab.label}
              <Badge
                variant="secondary"
                className="h-4 min-w-4 px-1 text-[10px] font-semibold rounded-full"
              >
                {counts[tab.value]}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {TABS.map(tab => (
          <TabsContent key={tab.value} value={tab.value} className="mt-4">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FolderOpen className="size-10 text-muted-foreground mb-3" />
                <p className="font-medium text-muted-foreground">No documents found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {query ? `No results for "${query}"` : "Upload your first document to get started"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setUploadOpen(true)}
                >
                  <Upload className="size-4" /> Upload Document
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(doc => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    canDelete
                    onDownload={handleDownload}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Upload modal */}
      <DocumentUploadModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={handleUpload}
      />
    </div>
  )
}
