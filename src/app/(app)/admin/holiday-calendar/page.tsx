"use client"

import { useState } from "react"
import {
  CalendarX, Plus, Download, Upload, RefreshCw,
  ChevronLeft, ChevronRight, Link, Check, Flag, Sparkles, MapPin, School as SchoolIcon,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

// ── Data ─────────────────────────────────────────────────────────────────────
const today = new Date(2026, 5, 4) // June 4 2026

type HolidayType = "National" | "Festival" | "Regional" | "School"

interface Holiday {
  date: string
  name: string
  type: HolidayType
}

const holidays: Holiday[] = [
  { date: "2026-01-26", name: "Republic Day",     type: "National" },
  { date: "2026-03-25", name: "Holi",             type: "Festival" },
  { date: "2026-04-14", name: "Bohag Bihu",       type: "Regional" },
  { date: "2026-06-21", name: "Eid al-Adha",      type: "Festival" },
  { date: "2026-08-15", name: "Independence Day", type: "National" },
  { date: "2026-10-02", name: "Gandhi Jayanti",   type: "National" },
  { date: "2026-10-12", name: "Durga Puja",       type: "Festival" },
  { date: "2026-10-13", name: "Navami",           type: "Festival" },
  { date: "2026-11-05", name: "Diwali",           type: "Festival" },
  { date: "2026-12-25", name: "Christmas",        type: "National" },
]

const upcoming = holidays.filter(h => new Date(h.date) >= today).slice(0, 4)

// Monthly holiday count for sparkline (Jan–Jun 2026)
const HOLIDAY_MONTHLY_TREND: number[] = [2, 1, 2, 1, 1, 1]
// Breakdown per type trend (same months)
const NATIONAL_MONTHLY_TREND: number[] = [1, 0, 0, 0, 1, 0]
const FESTIVAL_MONTHLY_TREND: number[] = [0, 1, 1, 1, 0, 1]
const REGIONAL_MONTHLY_TREND: number[] = [1, 0, 1, 0, 0, 0]

function buildCalendar(year: number, month: number) {
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  return { daysInMonth, firstDay }
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning"

// Full literal Tailwind class strings per holiday type — NEVER built via template literals.
const TYPE_CONFIG: Record<HolidayType, {
  badge: BadgeVariant
  icon: React.ElementType
  cell: string       // light bg + colored text for calendar day cells
  dot: string        // colored dot under a holiday day
  soft: string       // light bg container (upcoming card)
  solidIcon: string  // solid colored bg + white icon (upcoming card)
  softIcon: string   // light bg + colored icon (full list)
  accentText: string // colored accent text
  swatch: string     // light bg + colored border (legend)
}> = {
  National: {
    badge: "default",
    icon: Flag,
    cell: "bg-ef-brand-light text-primary",
    dot: "bg-primary",
    soft: "bg-ef-brand-light",
    solidIcon: "bg-primary text-white",
    softIcon: "bg-ef-brand-light text-primary",
    accentText: "text-primary",
    swatch: "bg-ef-brand-light border-primary",
  },
  Festival: {
    badge: "warning",
    icon: Sparkles,
    cell: "bg-ef-amber-light text-ef-amber-dark",
    dot: "bg-ef-amber-dark",
    soft: "bg-ef-amber-light",
    solidIcon: "bg-ef-amber-dark text-white",
    softIcon: "bg-ef-amber-light text-ef-amber-dark",
    accentText: "text-ef-amber-dark",
    swatch: "bg-ef-amber-light border-ef-amber-dark",
  },
  Regional: {
    badge: "success",
    icon: MapPin,
    cell: "bg-ef-green-light text-ef-green-dark",
    dot: "bg-ef-green-dark",
    soft: "bg-ef-green-light",
    solidIcon: "bg-ef-green-dark text-white",
    softIcon: "bg-ef-green-light text-ef-green-dark",
    accentText: "text-ef-green-dark",
    swatch: "bg-ef-green-light border-ef-green-dark",
  },
  School: {
    badge: "secondary",
    icon: SchoolIcon,
    cell: "bg-ef-purple-light text-ef-purple",
    dot: "bg-ef-purple",
    soft: "bg-ef-purple-light",
    solidIcon: "bg-ef-purple text-white",
    softIcon: "bg-ef-purple-light text-ef-purple",
    accentText: "text-ef-purple",
    swatch: "bg-ef-purple-light border-ef-purple",
  },
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

const SYNC_PROVIDERS = [
  { name: "Google Calendar",   icon: "🗓️" },
  { name: "Apple iCal",        icon: "📅" },
  { name: "Microsoft Outlook", icon: "📧" },
  { name: "Notion",            icon: "📝" },
  { name: "Zoho Calendar",     icon: "📋" },
]

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HolidayCalendarPage() {
  const [open, setOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [syncOpen, setSyncOpen] = useState(false)
  const [viewMonth, setViewMonth] = useState(5) // June
  const [viewYear, setViewYear] = useState(2026)
  const [selectedType, setSelectedType] = useState<HolidayType>("National")
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null)

  const { daysInMonth, firstDay } = buildCalendar(viewYear, viewMonth)
  const holidayDates = new Set(holidays.map(h => h.date))

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }

  const nextUpcoming = upcoming[0]
    ? new Date(upcoming[0].date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })
    : "None"

  type KpiTone = "brand" | "green" | "amber" | "red" | "purple" | "cyan"
  interface HolidayKpi {
    label: string
    value: number
    total: number
    icon: React.ReactNode
    iconClass: string
    tone: KpiTone
    subtitle: string
    trend?: { value: number; label?: string }
    sparklineData: number[]
  }

  const national = holidays.filter(h => h.type === "National").length
  const festivals = holidays.filter(h => h.type === "Festival").length
  const regional  = holidays.filter(h => h.type === "Regional").length

  const kpis: HolidayKpi[] = [
    {
      label: "Total Holidays",
      value: holidays.length,
      total: 20,
      icon: <CalendarX className="size-5" />,
      iconClass: "bg-ef-brand-light text-primary",
      tone: "brand",
      subtitle: `next: ${nextUpcoming}`,
      trend: { value: Math.round(((HOLIDAY_MONTHLY_TREND[5] - HOLIDAY_MONTHLY_TREND[4]) / Math.max(HOLIDAY_MONTHLY_TREND[4], 1)) * 100), label: "vs last month" },
      sparklineData: HOLIDAY_MONTHLY_TREND,
    },
    {
      label: "National",
      value: national,
      total: holidays.length,
      icon: <Flag className="size-5" />,
      iconClass: "bg-ef-brand-light text-primary",
      tone: "brand",
      subtitle: `${Math.round((national / holidays.length) * 100)}% of holidays`,
      sparklineData: NATIONAL_MONTHLY_TREND,
    },
    {
      label: "Festivals",
      value: festivals,
      total: holidays.length,
      icon: <Sparkles className="size-5" />,
      iconClass: "bg-ef-amber-light text-ef-amber-dark",
      tone: "amber",
      subtitle: `${Math.round((festivals / holidays.length) * 100)}% of holidays`,
      sparklineData: FESTIVAL_MONTHLY_TREND,
    },
    {
      label: "Regional",
      value: regional,
      total: holidays.length,
      icon: <MapPin className="size-5" />,
      iconClass: "bg-ef-green-light text-ef-green-dark",
      tone: "green",
      subtitle: `${Math.round((regional / holidays.length) * 100)}% of holidays`,
      sparklineData: REGIONAL_MONTHLY_TREND,
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">

      {/* ── Page Header ── */}
      <PageHeader
        icon={<CalendarX size={22} />}
        title="Holiday Calendar"
        subtitle={`Academic Year 2025–26 — ${holidays.length} holidays declared`}
        actions={
          <>
            <Button variant="secondary" size="default" onClick={() => setSyncOpen(true)}>
              <RefreshCw size={14} /> Sync
            </Button>
            <Button variant="secondary" size="default" onClick={() => setImportOpen(true)}>
              <Upload size={14} /> Import
            </Button>
            <Button variant="secondary" size="default">
              <Download size={14} /> Export (.ics)
            </Button>
            <Button size="default" onClick={() => setOpen(true)}>
              <Plus size={15} /> Add Holiday
            </Button>
          </>
        }
      />

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {kpis.map(s => (
          <KpiCard
            key={s.label}
            icon={s.icon}
            iconClassName={s.iconClass}
            title={s.label}
            value={s.value}
            tone={s.tone}
            subtitle={s.subtitle}
            trend={s.trend}
            sparkline={{ variant: "bar", data: s.sparklineData }}
          />
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Calendar — 2/3 wide */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{MONTH_NAMES[viewMonth]} {viewYear}</CardTitle>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="Previous month">
                  <ChevronLeft size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="Next month">
                  <ChevronRight size={16} />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <div className="overflow-x-auto -mx-1 px-1">
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1 min-w-[280px]">
              {DAY_LABELS.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-muted-foreground uppercase py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1 min-w-[280px]">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
                const h = holidays.find(x => x.date === dateStr)
                const isHoliday = holidayDates.has(dateStr)
                const isToday = viewYear === today.getFullYear() && viewMonth === today.getMonth() && day === today.getDate()
                const isSunday = (firstDay + i) % 7 === 0

                let cellClass = "text-foreground"
                if (isToday) cellClass = "bg-primary text-white"
                else if (isHoliday && h) cellClass = TYPE_CONFIG[h.type].cell
                else if (isSunday) cellClass = "text-ef-red"

                return (
                  <div
                    key={day}
                    className={`relative flex flex-col items-center justify-center rounded-lg text-xs font-medium transition-colors cursor-default h-8 ${cellClass}`}
                    title={h?.name}
                  >
                    {day}
                    {isHoliday && h && (
                      <span
                        className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${TYPE_CONFIG[h.type].dot}`}
                        aria-hidden="true"
                      />
                    )}
                  </div>
                )
              })}
            </div>
            </div>

            {/* Legend */}
            <Separator className="my-3" />
            <div className="flex gap-4 flex-wrap text-xs text-muted-foreground">
              {(Object.keys(TYPE_CONFIG) as HolidayType[]).map(type => (
                <span key={type} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-sm border ${TYPE_CONFIG[type].swatch}`} />
                  {type}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right sidebar */}
        <div className="flex flex-col gap-4">

          {/* Upcoming holidays */}
          <Card>
            <CardHeader><CardTitle>Upcoming Holidays</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-2 p-4">
              {upcoming.map(h => {
                const cfg = TYPE_CONFIG[h.type]
                const Icon = cfg.icon
                return (
                  <div key={h.date} className={`flex items-center gap-3 p-3 rounded-xl ${cfg.soft}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.solidIcon}`}>
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{h.name}</p>
                      <p className={`text-xs mt-0.5 ${cfg.accentText}`}>
                        {new Date(h.date).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </p>
                    </div>
                    <Badge variant={cfg.badge} className="shrink-0 text-[9px]">{h.type}</Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Full list */}
          <Card>
            <CardHeader><CardTitle className="text-sm">All Holidays</CardTitle></CardHeader>
            <CardContent className="p-0">
              {holidays.map((h, i) => {
                const cfg = TYPE_CONFIG[h.type]
                const Icon = cfg.icon
                return (
                  <div key={h.date}>
                    {i > 0 && <Separator />}
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${cfg.softIcon}`}>
                        <Icon size={12} />
                      </div>
                      <span className="text-xs font-mono text-muted-foreground w-20 shrink-0">
                        {new Date(h.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-sm flex-1 text-foreground truncate">{h.name}</span>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Add Holiday Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Holiday</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="h-name">Holiday Name</Label>
              <Input id="h-name" placeholder="e.g., Teacher's Day" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-date">Date</Label>
                <Input id="h-date" type="date" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="h-type">Type</Label>
                <Select value={selectedType} onValueChange={v => setSelectedType(v as HolidayType)}>
                  <SelectTrigger id="h-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="National">🏳️ National</SelectItem>
                    <SelectItem value="Festival">✨ Festival</SelectItem>
                    <SelectItem value="Regional">📍 Regional</SelectItem>
                    <SelectItem value="School">🏫 School</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => setOpen(false)}>
              <Plus size={14} /> Add Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Import Dialog ── */}
      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Import Holiday List</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border p-8 text-center">
              <Upload size={28} className="text-muted-foreground/50" />
              <div>
                <p className="font-semibold text-foreground">Drop CSV or .ics file here</p>
                <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
              </div>
              <Button variant="outline" size="default">Browse File</Button>
            </div>
            <p className="text-xs text-muted-foreground">Supported: CSV (date, name, type), iCal (.ics)</p>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setImportOpen(false)}>Cancel</Button>
            <Button onClick={() => setImportOpen(false)}>
              <Upload size={14} /> Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Sync Dialog ── */}
      <Dialog open={syncOpen} onOpenChange={setSyncOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw size={16} className="text-primary" />
              Sync Holiday Calendar
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Sync your holiday calendar with external apps. A shareable .ics link will be generated.
            </p>

            <div className="flex flex-col gap-2">
              {SYNC_PROVIDERS.map(p => (
                <div
                  key={p.name}
                  className="flex items-center justify-between p-3 rounded-xl border border-border hover:bg-muted/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{p.icon}</span>
                    <span className="font-medium text-sm text-foreground">{p.name}</span>
                  </div>
                  {syncSuccess === p.name ? (
                    <Badge variant="success" className="gap-1">
                      <Check size={10} /> Synced
                    </Badge>
                  ) : (
                    <Button size="xs" variant="secondary" onClick={() => setSyncSuccess(p.name)}>
                      <Link size={11} /> Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Separator />

            {/* Shareable link */}
            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/60 border border-border">
              <Link size={14} className="text-primary shrink-0" />
              <span className="text-xs text-muted-foreground flex-1 truncate">
                https://app.eduflow.in/api/calendar/hcea/holidays.ics
              </span>
              <Button size="xs" variant="ghost">Copy</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setSyncOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
