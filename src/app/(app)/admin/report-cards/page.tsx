"use client"

import { useMemo, useRef, useState } from "react"
import {
  ScrollText, Download, Upload, FileSpreadsheet, Plus, Trash2,
  CheckCircle2, AlertTriangle, PencilLine, Send,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useReportCards } from "@/context/report-card-context"
import {
  REPORT_CARD_TERMS, gradeForPercentage, type ReportCard,
} from "@/data/mock-report-cards"
import {
  downloadDemoTemplate, parseReportCardFile, validateRows, rowsToReportCards,
  exportReportCards, type ValidationResult,
} from "@/lib/report-card-io"
import { TEACHERS } from "@/data/teachers"

const CLASSES = ["VI-A", "VII-A", "VIII-A", "VIII-B", "IX-A", "X-A"]
const ADMIN = "Arnab Paul"

export default function AdminReportCardsPage() {
  const {
    cards, assignments, upsertCards, saveCard, publish, publishScope, addAssignment, removeAssignment,
  } = useReportCards()

  const [cls, setCls] = useState("VIII-A")
  const [term, setTerm] = useState<string>(REPORT_CARD_TERMS[0])

  const scopedCards = useMemo(
    () => cards.filter(c => c.className === cls && c.term === term),
    [cards, cls, term],
  )

  // ── Entry: edit one card's marks ──
  const [editing, setEditing] = useState<ReportCard | null>(null)
  const [draftMarks, setDraftMarks] = useState<number[]>([])

  function openEdit(card: ReportCard) {
    setDraftMarks(card.subjects.map(s => s.marks))
    setEditing(card)
  }
  function saveEdit() {
    if (!editing) return
    const subjects = editing.subjects.map((s, i) => {
      const marks = Math.max(0, Math.min(s.maxMarks, draftMarks[i] ?? s.marks))
      return { ...s, marks, grade: gradeForPercentage((marks / s.maxMarks) * 100) }
    })
    const total = subjects.reduce((a, s) => a + s.marks, 0)
    const maxTotal = subjects.reduce((a, s) => a + s.maxMarks, 0)
    saveCard({
      ...editing, subjects, total, maxTotal,
      percentage: maxTotal ? Math.round((total / maxTotal) * 1000) / 10 : 0,
    })
    setEditing(null)
  }

  // ── Assignments ──
  const [assignUser, setAssignUser] = useState(TEACHERS[0].id)
  const [assignCls, setAssignCls] = useState("VIII-A")
  const [assignTerm, setAssignTerm] = useState<string>(REPORT_CARD_TERMS[0])

  function handleAddAssignment() {
    const t = TEACHERS.find(x => x.id === assignUser)
    if (!t) return
    addAssignment({
      userId: t.id, userName: t.name, role: "teacher",
      className: assignCls, term: assignTerm, assignedBy: ADMIN,
    })
  }

  // ── Import / Export ──
  const fileRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<ValidationResult | null>(null)
  const [importTerm, setImportTerm] = useState<string>(REPORT_CARD_TERMS[0])
  const [committed, setCommitted] = useState<number | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCommitted(null)
    const rows = await parseReportCardFile(file)
    setResult(validateRows(rows))
  }

  function commitImport() {
    if (!result || result.valid.length === 0) return
    const newCards = rowsToReportCards(result.valid, importTerm, ADMIN)
    upsertCards(newCards)
    setCommitted(newCards.length)
    setResult(null)
    if (fileRef.current) fileRef.current.value = ""
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<ScrollText size={20} />}
        title="Report Cards"
        subtitle="Enter marks, delegate entry by class, and import/export with Excel or CSV"
      />

      <Tabs defaultValue="entry">
        <TabsList>
          <TabsTrigger value="entry">Entry</TabsTrigger>
          <TabsTrigger value="assignments">
            Assignments
            <Badge variant="secondary" className="ml-1.5 h-5 px-1.5 text-[10px]">{assignments.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="io">Import / Export</TabsTrigger>
        </TabsList>

        {/* ── Entry ── */}
        <TabsContent value="entry" className="mt-4 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={cls} onValueChange={setCls}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={term} onValueChange={setTerm}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{REPORT_CARD_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
            <Button
              variant="outline"
              className="ml-auto"
              disabled={scopedCards.every(c => c.status === "published") || scopedCards.length === 0}
              onClick={() => publishScope(cls, term)}
            >
              <Send className="size-4 mr-1" /> Publish all in scope
            </Button>
          </div>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-transparent">
                    <TableHead className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Roll</TableHead>
                    <TableHead className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Student</TableHead>
                    <TableHead className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-right">Total</TableHead>
                    <TableHead className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-right">%</TableHead>
                    <TableHead className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Status</TableHead>
                    <TableHead className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scopedCards.map(c => (
                    <TableRow key={c.id} className="hover:bg-muted/20">
                      <TableCell className="px-4 py-3">{c.rollNo}</TableCell>
                      <TableCell className="px-4 py-3 font-medium">{c.studentName}</TableCell>
                      <TableCell className="px-4 py-3 text-right">{c.total}/{c.maxTotal}</TableCell>
                      <TableCell className="px-4 py-3 text-right font-semibold">{c.percentage}%</TableCell>
                      <TableCell className="px-4 py-3">
                        <Badge variant={c.status === "published" ? "success" : "warning"} className="capitalize">{c.status}</Badge>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(c)}>
                            <PencilLine className="size-3.5 mr-1" /> Edit
                          </Button>
                          {c.status === "draft" && (
                            <Button size="sm" onClick={() => publish(c.id)}>
                              <Send className="size-3.5 mr-1" /> Publish
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {scopedCards.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                        No report cards for {cls} · {term}. Import them in the Import / Export tab.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Assignments ── */}
        <TabsContent value="assignments" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Delegate report-card entry</CardTitle></CardHeader>
            <Separator />
            <CardContent className="flex flex-wrap items-end gap-3 pt-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">User</label>
                <Select value={assignUser} onValueChange={setAssignUser}>
                  <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
                  <SelectContent>{TEACHERS.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Class</label>
                <Select value={assignCls} onValueChange={setAssignCls}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Term</label>
                <Select value={assignTerm} onValueChange={setAssignTerm}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{REPORT_CARD_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddAssignment}><Plus className="size-4 mr-1" /> Assign</Button>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <Table className="text-sm">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-transparent">
                    <TableHead className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">User</TableHead>
                    <TableHead className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Scope</TableHead>
                    <TableHead className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Term</TableHead>
                    <TableHead className="px-4 py-2.5 text-xs font-semibold text-muted-foreground">Assigned by</TableHead>
                    <TableHead className="px-4 py-2.5 text-xs font-semibold text-muted-foreground text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map(a => (
                    <TableRow key={a.id} className="hover:bg-muted/20">
                      <TableCell className="px-4 py-3 font-medium">{a.userName}</TableCell>
                      <TableCell className="px-4 py-3"><Badge variant="outline">{a.className}</Badge></TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{a.term}</TableCell>
                      <TableCell className="px-4 py-3 text-muted-foreground">{a.assignedBy}</TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => removeAssignment(a.id)}>
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {assignments.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No assignments yet.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Import / Export ── */}
        <TabsContent value="io" className="mt-4 flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Import from Excel / CSV</CardTitle></CardHeader>
            <Separator />
            <CardContent className="flex flex-col gap-4 pt-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" onClick={() => downloadDemoTemplate()}>
                  <Download className="size-4 mr-1" /> Download demo template
                </Button>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Import as term:</span>
                  <Select value={importTerm} onValueChange={setImportTerm}>
                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                    <SelectContent>{REPORT_CARD_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Button onClick={() => fileRef.current?.click()}>
                  <Upload className="size-4 mr-1" /> Choose file (.xlsx / .csv)
                </Button>
                <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />
              </div>

              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <FileSpreadsheet className="size-3.5" />
                One row per subject per student. The template includes an Instructions sheet.
              </p>

              {committed !== null && (
                <div className="flex items-center gap-2 rounded-lg border border-[var(--ef-green)]/30 bg-[var(--ef-green-light)] px-3 py-2 text-sm text-[var(--ef-green-dark)]">
                  <CheckCircle2 className="size-4" /> Imported {committed} report card{committed > 1 ? "s" : ""} as drafts.
                </div>
              )}

              {result && (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="inline-flex items-center gap-1.5 text-[var(--ef-green-dark)]">
                      <CheckCircle2 className="size-4" /> {result.valid.length} valid row{result.valid.length !== 1 ? "s" : ""}
                    </span>
                    {result.errors.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 text-destructive">
                        <AlertTriangle className="size-4" /> {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} with errors
                      </span>
                    )}
                  </div>

                  {result.errors.length > 0 && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 max-h-48 overflow-y-auto">
                      <ul className="space-y-1 text-xs text-destructive">
                        {result.errors.map(err => (
                          <li key={err.row}><strong>Row {err.row}:</strong> {err.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={commitImport} disabled={result.valid.length === 0}>
                      Commit {result.valid.length} valid row{result.valid.length !== 1 ? "s" : ""}
                    </Button>
                    <Button variant="ghost" onClick={() => setResult(null)}>Discard</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Export</CardTitle></CardHeader>
            <Separator />
            <CardContent className="flex items-center justify-between gap-3 pt-4">
              <p className="text-sm text-muted-foreground">{cards.length} report card{cards.length !== 1 ? "s" : ""} in the system.</p>
              <Button variant="outline" onClick={() => exportReportCards(cards)}>
                <Download className="size-4 mr-1" /> Export all to .xlsx
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Marks edit dialog */}
      <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.studentName} — {editing?.className} · {editing?.term}</DialogTitle>
            <DialogDescription>Edit subject marks. Grades and totals recompute on save.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {editing?.subjects.map((s, i) => (
              <div key={s.subject} className="flex items-center gap-3">
                <span className="flex-1 text-sm">{s.subject}</span>
                <Input
                  type="number"
                  min={0}
                  max={s.maxMarks}
                  value={draftMarks[i] ?? s.marks}
                  onChange={e => setDraftMarks(prev => {
                    const next = [...prev]
                    next[i] = Number(e.target.value)
                    return next
                  })}
                  className="w-20"
                />
                <span className="w-12 text-xs text-muted-foreground">/ {s.maxMarks}</span>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={saveEdit}>Save marks</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
