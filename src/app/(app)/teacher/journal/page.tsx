"use client"

import { useState, useMemo } from "react"
import {
  NotebookPen, BookMarked, Check, Clock, Repeat, PencilLine, Search, History, X,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { useClassJournal } from "@/context/class-journal-context"
import { PERIODS } from "@/data/periods"
import type { TeachingSlot, ClassJournalEntry } from "@/data/mock-class-journal"

function periodTime(period: string) {
  const p = PERIODS.find(x => x.id === period)
  return p ? `${p.startTime}–${p.endTime}` : period
}

function fmtFullDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  })
}

export default function TeacherJournalPage() {
  const { slots, date, entries, getEntry, saveEntry, pendingCount } = useClassJournal()

  const [editing, setEditing] = useState<TeachingSlot | null>(null)
  const [topic, setTopic] = useState("")
  const [homework, setHomework] = useState("")
  const [notes, setNotes] = useState("")

  // ── History filters ──
  const [query, setQuery] = useState("")
  const [classFilter, setClassFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("")

  function openEditor(slot: TeachingSlot) {
    const existing = getEntry(slot.className, slot.period)
    setTopic(existing?.topic ?? "")
    setHomework(existing?.homework ?? "")
    setNotes(existing?.notes ?? "")
    setEditing(slot)
  }

  function save() {
    if (!editing || !topic.trim()) return
    saveEntry(editing, {
      topic: topic.trim(),
      homework: homework.trim() || undefined,
      notes: notes.trim() || undefined,
    })
    setEditing(null)
  }

  const fmtDate = new Date(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })

  // Completed past journals (everything except today), newest first.
  const history = useMemo(
    () =>
      entries
        .filter(e => e.status === "completed" && e.date < date)
        .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.period.localeCompare(b.period))),
    [entries, date],
  )

  const classOptions = useMemo(
    () => Array.from(new Set(history.map(e => e.className))).sort(),
    [history],
  )

  const filteredHistory = useMemo(() => {
    const q = query.trim().toLowerCase()
    return history.filter(e => {
      if (classFilter !== "all" && e.className !== classFilter) return false
      if (dateFilter && e.date !== dateFilter) return false
      if (q) {
        const hay = `${e.className} ${e.subject} ${e.period} ${e.topic} ${e.homework ?? ""} ${e.notes ?? ""}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [history, query, classFilter, dateFilter])

  // Group filtered history by date for a clean timeline.
  const groupedHistory = useMemo(() => {
    const map = new Map<string, ClassJournalEntry[]>()
    for (const e of filteredHistory) {
      const arr = map.get(e.date) ?? []
      arr.push(e)
      map.set(e.date, arr)
    }
    return Array.from(map.entries())
  }, [filteredHistory])

  const hasActiveFilters = query.trim() !== "" || classFilter !== "all" || dateFilter !== ""

  function clearFilters() {
    setQuery("")
    setClassFilter("all")
    setDateFilter("")
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <Tabs defaultValue="today" className="flex flex-col gap-4">
        <PageHeader
          className="sm:items-center"
          icon={<NotebookPen size={20} />}
          title="Class Journal"
          subtitle={`Write today's journal for each class you taught — ${fmtDate}`}
          actions={
            <TabsList>
              <TabsTrigger value="today" className="gap-1.5">
                <NotebookPen className="size-4" /> Today
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-1.5">
                <History className="size-4" /> Previous journals
              </TabsTrigger>
            </TabsList>
          }
        />

        {/* ── TODAY ── */}
        <TabsContent value="today" className="flex flex-col gap-4">
          {pendingCount > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-[var(--ef-amber)]/30 bg-[var(--ef-amber-light)] px-3 py-2.5 text-sm text-[var(--ef-amber-dark)]">
              <Repeat className="size-4 mt-0.5 flex-shrink-0" />
              <span>
                <strong>{pendingCount} journal{pendingCount > 1 ? "s" : ""} pending.</strong> You&apos;ll keep getting
                reminders until each class you taught today has a journal entry.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3">
            {slots.map(slot => {
              const entry = getEntry(slot.className, slot.period)
              const done = entry?.status === "completed"
              return (
                <Card key={`${slot.className}-${slot.period}`}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex gap-3 min-w-0">
                      <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-3 py-2 text-center min-w-[60px]">
                        <span className="text-sm font-bold">{slot.period}</span>
                        <span className="text-[10px] text-muted-foreground">{periodTime(slot.period).split("–")[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">{slot.className} · {slot.subject}</span>
                          {slot.isProxy && (
                            <Badge variant="warning" className="text-[10px]">Proxy for {slot.proxyForTeacher}</Badge>
                          )}
                          {done ? (
                            <Badge variant="success" className="gap-1 text-[10px]"><Check className="size-3" /> Journaled</Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-[10px] text-[var(--ef-amber-dark)]"><Clock className="size-3" /> Pending</Badge>
                          )}
                        </div>
                        {done && entry && (
                          <div className="mt-1.5 space-y-1">
                            <p className="text-sm text-foreground/80">{entry.topic}</p>
                            {entry.homework && (
                              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <BookMarked className="size-3" /> HW: {entry.homework}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={done ? "outline" : "default"}
                      className="shrink-0"
                      onClick={() => openEditor(slot)}
                    >
                      <PencilLine className="size-4 mr-1" /> {done ? "Edit" : "Write journal"}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}

            {slots.length === 0 && (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No classes assigned to you today.
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── HISTORY ── */}
        <TabsContent value="history" className="flex flex-col gap-4">
          {/* Filter bar */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-3 sm:flex-row sm:items-end sm:gap-3">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search topic, homework, subject…"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:w-44">
                <Label className="text-xs text-muted-foreground">Class</Label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {classOptions.map(c => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5 sm:w-44">
                <Label htmlFor="date-filter" className="text-xs text-muted-foreground">Date</Label>
                <Input
                  id="date-filter"
                  type="date"
                  value={dateFilter}
                  max={date}
                  onChange={e => setDateFilter(e.target.value)}
                />
              </div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
                  <X className="size-4 mr-1" /> Clear
                </Button>
              )}
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground">
            {filteredHistory.length} journal{filteredHistory.length === 1 ? "" : "s"}
            {hasActiveFilters ? " match your filters" : " in history"}
          </p>

          {groupedHistory.map(([day, dayEntries]) => (
            <div key={day} className="flex flex-col gap-2">
              <h3 className="sticky top-0 z-10 bg-background/80 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur">
                {fmtFullDate(day)}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {dayEntries.map(entry => (
                  <Card key={entry.id}>
                    <CardContent className="flex gap-3 p-4">
                      <div className="flex flex-col items-center justify-center rounded-lg bg-muted px-3 py-2 text-center min-w-[60px]">
                        <span className="text-sm font-bold">{entry.period}</span>
                        <span className="text-[10px] text-muted-foreground">{periodTime(entry.period).split("–")[0]}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold">{entry.className} · {entry.subject}</span>
                          {entry.isProxy && (
                            <Badge variant="warning" className="text-[10px]">Proxy for {entry.proxyForTeacher}</Badge>
                          )}
                          <Badge variant="success" className="gap-1 text-[10px]"><Check className="size-3" /> Journaled</Badge>
                        </div>
                        <p className="mt-1.5 text-sm text-foreground/80">{entry.topic}</p>
                        {entry.homework && (
                          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <BookMarked className="size-3" /> HW: {entry.homework}
                          </p>
                        )}
                        {entry.notes && (
                          <p className="mt-1 text-xs italic text-muted-foreground">Note: {entry.notes}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}

          {filteredHistory.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                <History className="size-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">No journals found</p>
                <p className="text-xs text-muted-foreground">
                  {hasActiveFilters
                    ? "Try adjusting your search or filters."
                    : "Past class journals will appear here."}
                </p>
                {hasActiveFilters && (
                  <Button variant="outline" size="sm" onClick={clearFilters} className="mt-1">
                    Clear filters
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Journal entry editor */}
      <Dialog open={!!editing} onOpenChange={open => { if (!open) setEditing(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing?.className} · {editing?.period} · {editing?.subject}
            </DialogTitle>
            <DialogDescription>
              {editing?.isProxy
                ? `Proxy class for ${editing?.proxyForTeacher}. This journal is saved to ${editing?.className}.`
                : "This journal is shared with the class's parents."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="topic">Topic taught *</Label>
              <Textarea id="topic" value={topic} onChange={e => setTopic(e.target.value)} placeholder="What did you cover this period?" rows={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="hw">Homework (optional)</Label>
              <Input id="hw" value={homework} onChange={e => setHomework(e.target.value)} placeholder="e.g. Exercise 4.3, Q1–10" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes">Notes for parents (optional)</Label>
              <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any remarks…" rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={!topic.trim()}>Save journal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
