"use client"

import { useRef, useState } from "react"
import { Clock, CheckCircle2, XCircle, BookMarked, FileText, Calendar, CalendarOff, PartyPopper, ChevronsUpDown } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { SCHOOL_SESSION, getDayStatus } from "@/data/school-session"

interface PeriodEntry {
  period: string
  time: string
  subject: string
  subjectColor: string
  teacher: string
  topic: string
  homework?: string
  attendance: "present" | "absent" | "late"
}

interface DayJournal {
  date: string
  label: string
  periods: PeriodEntry[]
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics:     "border-[var(--ef-brand)]   bg-[var(--ef-brand-light)]",
  English:         "border-[var(--ef-green)]   bg-[var(--ef-green-light)]",
  Science:         "border-[var(--ef-purple)]  bg-[var(--ef-purple-light)]",
  "Social Studies":"border-[var(--ef-amber)]   bg-[var(--ef-amber-light)]",
  Hindi:           "border-[var(--ef-red)]     bg-[var(--ef-red-light)]",
  Sanskrit:        "border-[var(--ef-amber-dark)] bg-[var(--ef-amber-light)]",
  "Computer Sc.":  "border-[var(--ef-cyan)]    bg-[var(--ef-cyan-light)]",
}

const JOURNAL_DATA: DayJournal[] = [
  {
    date: "2026-06-19",
    label: "Fri, Jun 19",
    periods: [
      { period: "P1", time: "9:30-10:10",  subject: "Mathematics",    subjectColor: SUBJECT_COLORS["Mathematics"],     teacher: "Priya Sharma",     topic: "Quadratic Equations — completing the square method", homework: "Exercise 4.3, Q1-10", attendance: "present" },
      { period: "P2", time: "10:10-10:50", subject: "English",        subjectColor: SUBJECT_COLORS["English"],         teacher: "Rajesh Kalita",    topic: "The Road Not Taken — poem analysis and figures of speech", homework: undefined, attendance: "absent" },
      { period: "P3", time: "10:50-11:30", subject: "Science",        subjectColor: SUBJECT_COLORS["Science"],         teacher: "Priya Sharma",     topic: "Photosynthesis: light-dependent reactions (Proxy for Anita Devi)", homework: "Write a brief note on the Calvin Cycle", attendance: "present" },
      { period: "P4", time: "11:30-12:10", subject: "Social Studies", subjectColor: SUBJECT_COLORS["Social Studies"],  teacher: "Rajesh Kalita",    topic: "French Revolution — causes and timeline", homework: undefined, attendance: "present" },
      { period: "P5", time: "12:30-1:10",  subject: "Hindi",          subjectColor: SUBJECT_COLORS["Hindi"],           teacher: "Meena Gogoi",      topic: "Vasant Chapter 5 — comprehension and grammar exercises", homework: "Translate paragraph 3 into English", attendance: "present" },
      { period: "P6", time: "1:10-1:50",   subject: "Sanskrit",       subjectColor: SUBJECT_COLORS["Sanskrit"],        teacher: "Sunita Borah",     topic: "Dhatu Roop — Lakar and Purush forms", homework: "Write 5 sentences using Lat-Lakar", attendance: "present" },
      { period: "P7", time: "1:50-2:30",   subject: "Computer Sc.",   subjectColor: SUBJECT_COLORS["Computer Sc."],   teacher: "Biju Das",         topic: "Introduction to Python — variables, data types", homework: undefined, attendance: "present" },
    ],
  },
  {
    date: "2026-06-18",
    label: "Thu, Jun 18",
    periods: [
      { period: "P1", time: "9:30-10:10",  subject: "Mathematics",    subjectColor: SUBJECT_COLORS["Mathematics"],     teacher: "Priya Sharma",   topic: "Quadratic Equations — factorisation method", homework: "Exercise 4.2, Q5-12", attendance: "present" },
      { period: "P2", time: "10:10-10:50", subject: "Science",        subjectColor: SUBJECT_COLORS["Science"],         teacher: "Anita Devi",     topic: "Microorganisms — bacteria and their types", homework: undefined, attendance: "present" },
      { period: "P3", time: "10:50-11:30", subject: "English",        subjectColor: SUBJECT_COLORS["English"],         teacher: "Rajesh Kalita",  topic: "Formal letter writing — complaint format", homework: "Write a complaint letter to municipality", attendance: "present" },
      { period: "P4", time: "11:30-12:10", subject: "Hindi",          subjectColor: SUBJECT_COLORS["Hindi"],           teacher: "Meena Gogoi",    topic: "Vyakaran — Sandhi Vichhed", homework: undefined, attendance: "present" },
      { period: "P5", time: "12:30-1:10",  subject: "Social Studies", subjectColor: SUBJECT_COLORS["Social Studies"],  teacher: "Rajesh Kalita",  topic: "Resources — types and classification", homework: "Map work — mark major resource regions", attendance: "present" },
      { period: "P6", time: "1:10-1:50",   subject: "Computer Sc.",   subjectColor: SUBJECT_COLORS["Computer Sc."],   teacher: "Biju Das",       topic: "History of computing and generations", homework: undefined, attendance: "present" },
      { period: "P7", time: "1:50-2:30",   subject: "Sanskrit",       subjectColor: SUBJECT_COLORS["Sanskrit"],        teacher: "Sunita Borah",   topic: "Shloka memorisation — Chapter 2", homework: "Memorise shlokas 5-8", attendance: "late" },
    ],
  },
  {
    date: "2026-06-17",
    label: "Wed, Jun 17",
    periods: [
      { period: "P1", time: "9:30-10:10",  subject: "English",        subjectColor: SUBJECT_COLORS["English"],         teacher: "Rajesh Kalita",  topic: "Essay writing — importance of education", homework: "Draft essay (300 words)", attendance: "present" },
      { period: "P2", time: "10:10-10:50", subject: "Mathematics",    subjectColor: SUBJECT_COLORS["Mathematics"],     teacher: "Priya Sharma",   topic: "Introduction to Quadratic Equations", homework: undefined, attendance: "present" },
      { period: "P3", time: "10:50-11:30", subject: "Social Studies", subjectColor: SUBJECT_COLORS["Social Studies"],  teacher: "Rajesh Kalita",  topic: "Maps — scale, direction, conventional signs", homework: "Draw a map of your locality", attendance: "present" },
      { period: "P4", time: "11:30-12:10", subject: "Science",        subjectColor: SUBJECT_COLORS["Science"],         teacher: "Anita Devi",     topic: "Cell division — mitosis stages", homework: "Draw labelled diagram of mitosis", attendance: "present" },
      { period: "P5", time: "12:30-1:10",  subject: "Hindi",          subjectColor: SUBJECT_COLORS["Hindi"],           teacher: "Meena Gogoi",    topic: "Kavita — Kabir ke Dohe interpretation", homework: undefined, attendance: "present" },
      { period: "P6", time: "1:10-1:50",   subject: "Sanskrit",       subjectColor: SUBJECT_COLORS["Sanskrit"],        teacher: "Sunita Borah",   topic: "Karak and Vibhakti", homework: "Exercise 3 — fill blanks with correct Vibhakti", attendance: "present" },
      { period: "P7", time: "1:50-2:30",   subject: "Computer Sc.",   subjectColor: SUBJECT_COLORS["Computer Sc."],   teacher: "Biju Das",       topic: "MS Word — formatting and styles", homework: undefined, attendance: "present" },
    ],
  },
]

const ATT_CONFIG = {
  present: { icon: CheckCircle2, color: "text-[var(--ef-green-dark)]", label: "Present" },
  absent:  { icon: XCircle,      color: "text-destructive",             label: "Absent" },
  late:    { icon: Clock,        color: "text-[var(--ef-amber-dark)]", label: "Late" },
}

const MONTHLY_SUMMARY = [
  { subject: "Mathematics",    periodsThisMonth: 20, topicsCovered: 12, avgHomework: 3.4, hwGiven: 14, lastTopic: "Quadratic Equations" },
  { subject: "English",        periodsThisMonth: 19, topicsCovered: 10, avgHomework: 2.1, hwGiven: 8,  lastTopic: "Poem Analysis" },
  { subject: "Science",        periodsThisMonth: 20, topicsCovered: 13, avgHomework: 2.8, hwGiven: 11, lastTopic: "Photosynthesis" },
  { subject: "Social Studies", periodsThisMonth: 18, topicsCovered: 9,  avgHomework: 1.9, hwGiven: 7,  lastTopic: "French Revolution" },
  { subject: "Hindi",          periodsThisMonth: 17, topicsCovered: 8,  avgHomework: 2.3, hwGiven: 9,  lastTopic: "Vasant Ch. 5" },
  { subject: "Sanskrit",       periodsThisMonth: 15, topicsCovered: 7,  avgHomework: 3.0, hwGiven: 10, lastTopic: "Dhatu Roop" },
  { subject: "Computer Sc.",   periodsThisMonth: 14, topicsCovered: 6,  avgHomework: 0.8, hwGiven: 3,  lastTopic: "Intro to Python" },
]

type SummarySortField = "subject" | "periodsThisMonth" | "topicsCovered" | "avgHomework" | "hwGiven" | "lastTopic"

const SUMMARY_COLUMNS: { key: string; label: string; field: SummarySortField }[] = [
  { key: "subject",  label: "Subject",        field: "subject" },
  { key: "periods",  label: "Periods",        field: "periodsThisMonth" },
  { key: "topics",   label: "Topics Covered", field: "topicsCovered" },
  { key: "avghw",    label: "Avg HW/Week",    field: "avgHomework" },
  { key: "hwgiven",  label: "HW Given",       field: "hwGiven" },
  { key: "lasttopic",label: "Last Topic",     field: "lastTopic" },
  { key: "coverage", label: "Coverage",       field: "periodsThisMonth" },
]

function PeriodCard({ entry }: { entry: PeriodEntry }) {
  const AttIcon = ATT_CONFIG[entry.attendance].icon
  return (
    <div className={`flex gap-0 rounded-xl overflow-hidden ${entry.subjectColor}`}>
      <div className="flex flex-col items-center justify-center px-4 py-4 min-w-[72px] text-center flex-shrink-0">
        <span className="text-base font-bold text-foreground">{entry.period}</span>
        <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{entry.time.split("-")[0]}</span>
        <span className="text-[10px] text-muted-foreground leading-tight">-{entry.time.split("-")[1]}</span>
      </div>
      <Separator orientation="vertical" className="h-auto my-3" />
      <div className="flex-1 px-4 py-3 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{entry.subject}</p>
            <p className="text-xs text-muted-foreground">{entry.teacher}</p>
          </div>
          <span className={`flex items-center gap-1 text-xs font-medium ${ATT_CONFIG[entry.attendance].color} flex-shrink-0`}>
            <AttIcon className="size-3.5" />
            {ATT_CONFIG[entry.attendance].label}
          </span>
        </div>
        <p className="text-sm mt-2 text-foreground/80 leading-snug">{entry.topic}</p>
        {entry.homework && (
          <div className="flex items-start gap-1.5 mt-2 p-2 rounded-md bg-background/30 border border-border/60">
            <BookMarked className="size-3.5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-foreground"><span className="font-semibold">HW:</span> {entry.homework}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function DayJournalView({ day }: { day: DayJournal }) {
  const totalHW = day.periods.filter(p => p.homework).length
  const presentCount = day.periods.filter(p => p.attendance === "present").length
  const absentCount = day.periods.filter(p => p.attendance === "absent").length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted text-sm">
          <Calendar className="size-3.5 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">
            {new Date(day.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
          </span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success text-xs font-medium text-success-foreground">
          <CheckCircle2 className="size-3.5" /> {presentCount} Present
        </div>
        {absentCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
            <XCircle className="size-3.5" /> {absentCount} Absent
          </div>
        )}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-xs font-medium text-primary">
          <BookMarked className="size-3.5" /> {totalHW} HW assigned
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {day.periods.map(entry => (
          <PeriodCard key={entry.period} entry={entry} />
        ))}
      </div>
    </div>
  )
}

/** Shown when the selected date has no journal — explains why (holiday, weekly off, etc.). */
function NoJournalCard({ dateStr }: { dateStr: string }) {
  const status = dateStr ? getDayStatus(dateStr) : { kind: "school-day" as const }
  const label = dateStr
    ? new Date(dateStr.split("-").map(Number).join("/")).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "this date"

  const VIEW: Record<string, { icon: React.ReactNode; title: string; desc: string }> = {
    "out-of-session": {
      icon: <CalendarOff className="size-8 text-muted-foreground" />,
      title: "Outside the academic session",
      desc: `Class journals are only available during the ${SCHOOL_SESSION.label} session (${new Date(SCHOOL_SESSION.startDate.split("-").map(Number).join("/")).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} – ${new Date(SCHOOL_SESSION.endDate.split("-").map(Number).join("/")).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}).`,
    },
    "holiday": {
      icon: <PartyPopper className="size-8 text-[var(--ef-amber-dark)]" />,
      title: "No Class Journal — Holiday",
      desc: `${label} is ${status.kind === "holiday" && status.holiday ? `${status.holiday.name} (${status.holiday.type} holiday)` : "a holiday"}. School is closed.`,
    },
    "weekly-off": {
      icon: <CalendarOff className="size-8 text-[var(--ef-red)]" />,
      title: "No Class Journal — Weekly Off",
      desc: `${label} is a weekly off (Sunday). No classes are held.`,
    },
    "school-day": {
      icon: <FileText className="size-8 text-muted-foreground" />,
      title: "No journal recorded",
      desc: `No class journal entries were recorded for ${label}.`,
    },
  }

  const v = VIEW[status.kind]

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
        {v.icon}
        <p className="text-sm font-semibold text-foreground">{v.title}</p>
        <p className="text-xs text-muted-foreground max-w-sm">{v.desc}</p>
      </CardContent>
    </Card>
  )
}

/** Reusable Class Journal body — day tabs, period cards, and monthly summary table. */
export function ClassJournalView() {
  const [activeDay, setActiveDay] = useState("0")
  const [customDate, setCustomDate] = useState("")
  const dateInputRef = useRef<HTMLInputElement>(null)

  const [sortKey, setSortKey] = useState("subject")
  const [sortField, setSortField] = useState<SummarySortField>("subject")
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("asc")

  function toggleSort(key: string, field: SummarySortField) {
    if (sortKey === key) setSortDir(d => (d === "asc" ? "desc" : "asc"))
    else { setSortKey(key); setSortField(field); setSortDir("asc") }
  }

  const sortedSummary = [...MONTHLY_SUMMARY].sort((a, b) => {
    let cmp = 0
    if (sortField === "subject")        cmp = a.subject.localeCompare(b.subject)
    else if (sortField === "lastTopic") cmp = a.lastTopic.localeCompare(b.lastTopic)
    else                                cmp = (a[sortField] as number) - (b[sortField] as number)
    return sortDir === "asc" ? cmp : -cmp
  })

  const isCustom = activeDay === "custom"
  const selectedDay = isCustom ? null : JOURNAL_DATA[parseInt(activeDay)]
  const shownDate = customDate || selectedDay?.date || ""

  function handleDateChange(value: string) {
    if (!value) return
    setCustomDate(value)
    const idx = JOURNAL_DATA.findIndex(d => d.date === value)
    setActiveDay(idx >= 0 ? String(idx) : "custom")
  }

  function handleTabChange(value: string) {
    setActiveDay(value)
    setCustomDate(JOURNAL_DATA[parseInt(value)]?.date ?? "")
  }

  // Open the native date calendar when the whole container is clicked.
  function openPicker() {
    const el = dateInputRef.current
    if (!el) return
    try {
      el.showPicker?.()
    } catch {
      el.focus()
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={isCustom ? "" : activeDay} onValueChange={handleTabChange}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-auto">
            {JOURNAL_DATA.map((d, i) => (
              <TabsTrigger key={i} value={String(i)} className="flex-1 sm:flex-none">
                {d.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div
            role="button"
            tabIndex={0}
            onClick={openPicker}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openPicker() } }}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-sm shrink-0 cursor-pointer hover:bg-muted/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Calendar className="size-4 text-muted-foreground shrink-0" />
            <span className="text-muted-foreground hidden sm:inline">View date:</span>
            <input
              ref={dateInputRef}
              type="date"
              value={shownDate}
              min={SCHOOL_SESSION.startDate}
              max={SCHOOL_SESSION.endDate}
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => handleDateChange(e.target.value)}
              className="bg-transparent outline-none text-foreground cursor-pointer"
              aria-label="Select a date to view its class journal"
            />
          </div>
        </div>
      </Tabs>

      {selectedDay ? <DayJournalView day={selectedDay} /> : <NoJournalCard dateStr={customDate} />}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileText className="size-4 text-primary" />
            June 2026 — Monthly Summary
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 overflow-x-auto">
          <Table className="text-sm">
            <caption className="sr-only">Subject coverage summary for the month</caption>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                {SUMMARY_COLUMNS.map(col => (
                  <TableHead
                    key={col.key}
                    className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground h-auto whitespace-nowrap"
                    aria-sort={sortKey === col.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                  >
                    <button
                      type="button"
                      onClick={() => toggleSort(col.key, col.field)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleSort(col.key, col.field) } }}
                      className="inline-flex items-center gap-1 font-semibold cursor-pointer select-none hover:text-foreground"
                    >
                      {col.label}
                      <ChevronsUpDown className={`size-3 ${sortKey === col.key ? "text-primary" : "opacity-40"}`} />
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSummary.map((s, i) => (
                <TableRow key={s.subject} className={`hover:bg-muted/20 ${i % 2 ? "bg-muted/10" : ""}`}>
                  <TableCell className="px-4 py-3 font-medium whitespace-nowrap">{s.subject}</TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.periodsThisMonth} periods</TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.topicsCovered} topics</TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{s.avgHomework} assignments</Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.hwGiven} tasks</TableCell>
                  <TableCell className="px-4 py-3 text-muted-foreground whitespace-nowrap">{s.lastTopic}</TableCell>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 bg-muted rounded-full overflow-hidden" role="img" aria-label={`${Math.round((s.periodsThisMonth / 22) * 100)} percent coverage`}>
                        <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (s.periodsThisMonth / 22) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{Math.round((s.periodsThisMonth / 22) * 100)}%</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
