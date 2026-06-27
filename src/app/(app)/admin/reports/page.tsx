"use client"
import { useState } from "react"
import { toast } from "sonner"
import {
  BarChart3, Download, TrendingUp, ArrowLeftRight,
  FileText, FileSpreadsheet, ChevronRight,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleTabs } from "@/components/shared/toggle-tabs"

type ExportFormat = "PDF" | "XLSX" | "CSV"

const EXPORTS: { id: string; label: string; desc: string; format: ExportFormat }[] = [
  { id: "e1", label: "Monthly Attendance Report", desc: "Class-wise attendance for May 2026", format: "PDF" },
  { id: "e2", label: "Proxy Assignment Log", desc: "All proxy assignments this term", format: "XLSX" },
  { id: "e3", label: "Fee Collection Summary", desc: "Student-wise fee status · Term 2", format: "PDF" },
  { id: "e4", label: "Teacher Leave Register", desc: "Leave balances and history · 2025–26", format: "XLSX" },
  { id: "e5", label: "Grade Report — Class X", desc: "Subject-wise marks and grade distribution", format: "CSV" },
]

const MONTHLY_DATA = [
  { month: "Jan", coverage: 88, attendance: 91 },
  { month: "Feb", coverage: 91, attendance: 92 },
  { month: "Mar", coverage: 85, attendance: 89 },
  { month: "Apr", coverage: 93, attendance: 94 },
  { month: "May", coverage: 96, attendance: 95 },
  { month: "Jun", coverage: 89, attendance: 93 },
]

const SUBJECT_PERFORMANCE = [
  { subject: "Mathematics", avg: 74, teacher: "Priya Sharma" },
  { subject: "Science", avg: 81, teacher: "Rajesh Kalita" },
  { subject: "English", avg: 76, teacher: "Anita Devi" },
  { subject: "History", avg: 68, teacher: "Dipak Baruah" },
  { subject: "Art", avg: 88, teacher: "Meena Gogoi" },
]

const ABSENCE_TYPES: { label: string; value: number; total: number; barClass: string }[] = [
  { label: "Sick Leave", value: 18, total: 48, barClass: "bg-ef-red" },
  { label: "Casual Leave", value: 14, total: 48, barClass: "bg-ef-amber" },
  { label: "Earned Leave", value: 10, total: 48, barClass: "bg-primary" },
  { label: "Emergency", value: 6, total: 48, barClass: "bg-ef-purple" },
]

const TREND_FILTERS = [
  { k: "monthly", l: "Month" },
  { k: "yearly", l: "Year" },
  { k: "session", l: "Session" },
] as const

type TrendFilter = (typeof TREND_FILTERS)[number]["k"]

const maxVal = Math.max(...MONTHLY_DATA.flatMap(d => [d.coverage, d.attendance]))

// Derived KPI computations
const totalReports = 48
const prevMonthReports = 42 // previous period
const reportsTrend = Math.round(((totalReports - prevMonthReports) / prevMonthReports) * 100)

const avgCoverage = Math.round(MONTHLY_DATA.reduce((s, d) => s + d.coverage, 0) / MONTHLY_DATA.length)
const prevCoverage = MONTHLY_DATA[MONTHLY_DATA.length - 2]?.coverage ?? 0
const currCoverage = MONTHLY_DATA[MONTHLY_DATA.length - 1]?.coverage ?? 0
const coverageTrend = prevCoverage > 0 ? Math.round(((currCoverage - prevCoverage) / prevCoverage) * 100) : 0

const totalAbsenceTypes = ABSENCE_TYPES.reduce((s, t) => s + t.value, 0)
const proxyFillPct = 97 // mock: 97% fill rate
const prevFillPct  = 95
const fillTrend = Math.round(((proxyFillPct - prevFillPct) / prevFillPct) * 100)

const exportsThisMonth = 12
const prevExports = 9
const exportsTrend = Math.round(((exportsThisMonth - prevExports) / prevExports) * 100)

// Subject score → complete literal fill class (no dynamic class names)
function scoreBarClass(avg: number): string {
  if (avg >= 80) return "bg-ef-green"
  if (avg >= 65) return "bg-primary"
  return "bg-ef-amber"
}

export default function ReportsPage() {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [trendFilter, setTrendFilter] = useState<TrendFilter>("monthly")
  const [trendYear, setTrendYear] = useState("2026")
  const [viewMode, setViewMode] = useState<"Daily" | "Weekly" | "Monthly">("Monthly")

  function handleExport(id: string, label: string, format: ExportFormat) {
    setLoadingId(id)
    const exportId = toast.loading(`Preparing ${label}…`, { description: `${format} export` })
    setTimeout(() => {
      setLoadingId(null)
      toast.success(`${label} ready`, { id: exportId, description: `${format} downloaded successfully.` })
    }, 1800)
  }

  function exportAll() {
    toast.loading("Generating all reports…", { description: "This may take a moment." })
    setTimeout(() => toast.success("All reports exported", { description: `${EXPORTS.length} files ready.` }), 2500)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      {/* Header */}
      <PageHeader
        icon={<BarChart3 size={22} />}
        title="Reports &amp; Analytics"
        subtitle="Academic Year 2025–26 · HCEA, Howly"
        actions={
          <div className="flex items-center gap-2">
            <ToggleTabs
              options={["Daily", "Weekly", "Monthly"] as const}
              value={viewMode}
              onChange={setViewMode}
            />
            <Button variant="secondary" size="default" className="gap-2" onClick={exportAll}>
              <Download size={14} />Export All
            </Button>
          </div>
        }
      />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Reports Generated"
          value={totalReports}
          subtitle={`+${totalReports - prevMonthReports} vs last month`}
          icon={<BarChart3 className="size-5" />}
          tone="brand"
          trend={{ value: reportsTrend, label: "vs last month" }}
          sparkline={{ variant: "bar", data: [32, 38, 35, 40, 42, totalReports] }}
        />
        <KpiCard
          title="Avg. Coverage"
          value={`${avgCoverage}%`}
          subtitle={`${currCoverage}% this month · ${MONTHLY_DATA.length} months tracked`}
          icon={<TrendingUp className="size-5" />}
          tone="green"
          iconClassName="bg-ef-green-light text-ef-green"
          trend={{ value: coverageTrend, label: "vs last month" }}
          sparkline={{ variant: "line", data: MONTHLY_DATA.map(d => d.coverage) }}
        />
        <KpiCard
          title="Proxy Fill Rate"
          value={`${proxyFillPct}%`}
          subtitle={`${totalAbsenceTypes} absences · ${proxyFillPct - prevFillPct}% up this term`}
          icon={<ArrowLeftRight className="size-5" />}
          tone="purple"
          iconClassName="bg-ef-purple-light text-ef-purple"
          trend={{ value: fillTrend, label: "vs last term" }}
          sparkline={{ variant: "arc", value: proxyFillPct }}
        />
        <KpiCard
          title="Exports This Month"
          value={exportsThisMonth}
          subtitle={`+${exportsThisMonth - prevExports} vs last month · ${EXPORTS.length} types`}
          icon={<Download className="size-5" />}
          tone="amber"
          iconClassName="bg-ef-amber-light text-ef-amber"
          trend={{ value: exportsTrend, label: "vs last month" }}
          sparkline={{ variant: "bar", data: [4, 6, 7, 9, 10, exportsThisMonth] }}
        />
      </div>

      {/* Monthly Trend + Absence Breakdown — 2-col */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-sm">Monthly Trends</CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Select value={trendYear} onValueChange={setTrendYear}>
                  <SelectTrigger className="w-24 h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["2024", "2025", "2026"].map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block bg-primary" />
                    Coverage
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="w-2.5 h-2.5 rounded-sm inline-block bg-ef-green" />
                    Attendance
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {MONTHLY_DATA.map(d => (
                <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex items-end gap-0.5 h-32">
                    <div
                      className="w-full max-w-[20px] rounded-t-sm transition-all bg-primary"
                      style={{ height: `${(d.coverage / maxVal) * 112}px`, minHeight: 4 }}
                    />
                    <div
                      className="w-full max-w-[20px] rounded-t-sm transition-all bg-ef-green"
                      style={{ height: `${(d.attendance / maxVal) * 112}px`, minHeight: 4 }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{d.month}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Absence by type */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Absence by Type</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {ABSENCE_TYPES.map(item => (
              <div key={item.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  <span className="text-xs font-bold text-muted-foreground">{item.value} / {item.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${item.barClass}`}
                    style={{ width: `${(item.value / item.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t border-border text-sm text-muted-foreground">
              Total: <strong className="text-foreground">48</strong> absences this month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Panel — full width */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-ef-brand-light text-primary">
              <Download size={16} />
            </div>
            <div>
              <CardTitle className="text-sm">Export Reports</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Download PDF, Excel, or CSV reports</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {EXPORTS.map((item, i) => {
            const isLoading = loadingId === item.id
            const FormatIcon = item.format === "PDF" ? FileText : item.format === "XLSX" ? FileSpreadsheet : BarChart3
            const badgeVariant = item.format === "PDF" ? "destructive" : item.format === "XLSX" ? "success" : "default"
            return (
              <div
                key={item.id}
                className={`flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50 ${
                  i < EXPORTS.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-muted text-muted-foreground">
                  <FormatIcon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground">{item.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.desc}</div>
                </div>
                <Badge variant={badgeVariant}>{item.format}</Badge>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => handleExport(item.id, item.label, item.format)}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-current border-r-transparent rounded-full animate-spin" />
                      Exporting…
                    </span>
                  ) : (
                    <>Export <ChevronRight size={12} /></>
                  )}
                </Button>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Subject performance — full width */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-sm">Subject-wise Average Score — Class X-A</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {SUBJECT_PERFORMANCE.map(s => (
            <div key={s.subject} className="flex items-center gap-4 w-full">
              <span className="text-sm font-semibold text-foreground w-28 shrink-0">{s.subject}</span>
              <div className="flex-1">
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${scoreBarClass(s.avg)}`}
                    style={{ width: `${s.avg}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-bold text-foreground w-10 text-right shrink-0">{s.avg}%</span>
              <span className="text-xs text-muted-foreground w-28 shrink-0 hidden sm:block">{s.teacher}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
