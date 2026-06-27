"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  Settings,
  CalendarRange,
  Archive,
  CheckCircle2,
  ChevronRight,
  Users,
  GraduationCap,
  ClipboardList,
  Loader2,
  AlertTriangle,
  PartyPopper,
  ClipboardCheck,
} from "lucide-react"

import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { useAttendanceMode, type AttendanceMode } from "@/context/attendance-mode-context"

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENT_YEAR = "2024-25"
const NEXT_YEAR    = "2025-26"
const ARCHIVE_PHRASE = `ARCHIVE ${CURRENT_YEAR}`

/** Mock summary data for Step 1 */
const YEAR_SUMMARY = {
  students: 248,
  teachers: 10,
  absences: 187,
  proxyCoverage: "94%",
  feeCollected: "₹18.4L",
  startDate: "2024-04-01",
  endDate:   "2025-03-31",
}

// ─── Zod schema — Step 2 archive confirmation ─────────────────────────────────

const archiveSchema = z.object({
  confirmPhrase: z.string().min(1, "Please type the confirmation phrase"),
}).superRefine((data, ctx) => {
  if (data.confirmPhrase !== ARCHIVE_PHRASE) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Type exactly: ${ARCHIVE_PHRASE}`,
      path: ["confirmPhrase"],
    })
  }
})
type ArchiveForm = z.infer<typeof archiveSchema>

// ─── Zod schema — Step 3 next year defaults ───────────────────────────────────

const nextYearSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate:   z.string().min(1, "End date is required"),
})
type NextYearForm = z.infer<typeof nextYearSchema>

// ─── Step indicator ──────────────────────────────────────────────────────────

interface StepIndicatorProps {
  current: number
  total: number
  labels: string[]
}

function StepIndicator({ current, total, labels }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0 w-full mb-6">
      {Array.from({ length: total }).map((_, i) => {
        const step  = i + 1
        const done  = step < current
        const active = step === current
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div
              className={cn(
                "size-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 transition-colors",
                done  && "bg-[var(--ef-green)] text-white",
                active && "bg-primary text-white",
                !done && !active && "bg-muted text-muted-foreground"
              )}
            >
              {done ? <CheckCircle2 className="size-4" /> : step}
            </div>
            {/* Label (hidden on small screens) */}
            <span
              className={cn(
                "text-[10px] ml-1.5 whitespace-nowrap hidden sm:block",
                active ? "text-foreground font-medium" : "text-muted-foreground"
              )}
            >
              {labels[i]}
            </span>
            {/* Connector */}
            {i < total - 1 && (
              <div
                className={cn(
                  "h-[2px] flex-1 mx-2 rounded-full transition-colors",
                  done ? "bg-[var(--ef-green)]" : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Summary stat item ────────────────────────────────────────────────────────

function SummaryItem({
  icon,
  label,
  value,
  iconClass,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  iconClass?: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
      <div
        className={cn(
          "size-8 rounded-lg flex items-center justify-center flex-shrink-0",
          iconClass ?? "bg-primary/10 text-primary"
        )}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  )
}

// ─── Rollover Wizard Dialog ────────────────────────────────────────────────────

interface RolloverWizardProps {
  open: boolean
  onOpenChange: (v: boolean) => void
}

function RolloverWizard({ open, onOpenChange }: RolloverWizardProps) {
  const [step,    setStep]    = useState<1 | 2 | 3 | 4>(1) // 4 = success
  const [loading, setLoading] = useState(false)

  // Step 2 form
  const archiveForm = useForm<ArchiveForm>({
    resolver: zodResolver(archiveSchema),
    defaultValues: { confirmPhrase: "" },
  })

  // Step 3 form
  const nextYearForm = useForm<NextYearForm>({
    resolver: zodResolver(nextYearSchema),
    defaultValues: { startDate: "2025-04-01", endDate: "2026-03-31" },
  })

  function handleClose() {
    if (loading) return
    onOpenChange(false)
    // Reset after animation settles
    setTimeout(() => {
      setStep(1)
      archiveForm.reset()
      nextYearForm.reset({ startDate: "2025-04-01", endDate: "2026-03-31" })
    }, 300)
  }

  function handleStep2Submit(data: ArchiveForm) {
    void data
    setStep(3)
  }

  function handleStep3Submit(data: NextYearForm) {
    void data
    setLoading(true)
    // Simulate async operation
    setTimeout(() => {
      setLoading(false)
      setStep(4)
    }, 1800)
  }

  const STEP_LABELS = ["Data Summary", "Archive Confirm", "Next Year Setup"]

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-lg"
        aria-describedby="rollover-dialog-desc"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CalendarRange className="size-4 text-primary" />
            </div>
            <DialogTitle>Academic Year Rollover</DialogTitle>
          </div>
          <DialogDescription id="rollover-dialog-desc">
            Archive <strong>{CURRENT_YEAR}</strong> and set up <strong>{NEXT_YEAR}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* ── Step indicator (hidden on success screen) ── */}
        {step !== 4 && (
          <StepIndicator current={step} total={3} labels={STEP_LABELS} />
        )}

        {/* ════════════════════════════════════════════════
            STEP 1 — Current year data summary
        ════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                Academic Year {CURRENT_YEAR} at a glance
              </p>
              <Badge variant="secondary" className="text-xs">
                {YEAR_SUMMARY.startDate} → {YEAR_SUMMARY.endDate}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <SummaryItem
                icon={<GraduationCap className="size-4" />}
                label="Total Students"
                value={YEAR_SUMMARY.students}
                iconClass="bg-primary/10 text-primary"
              />
              <SummaryItem
                icon={<Users className="size-4" />}
                label="Teaching Staff"
                value={YEAR_SUMMARY.teachers}
                iconClass="bg-success/20 text-success-foreground"
              />
              <SummaryItem
                icon={<ClipboardList className="size-4" />}
                label="Absences Logged"
                value={YEAR_SUMMARY.absences}
                iconClass="bg-warning/20 text-warning-foreground"
              />
              <SummaryItem
                icon={<CheckCircle2 className="size-4" />}
                label="Proxy Coverage"
                value={YEAR_SUMMARY.proxyCoverage}
                iconClass="bg-[var(--ef-green-light)] text-[var(--ef-green-dark)]"
              />
            </div>

            <div className="rounded-lg border border-[var(--ef-amber-light)] bg-[var(--ef-amber-light)] p-3 flex gap-2">
              <AlertTriangle className="size-4 text-[var(--ef-amber)] flex-shrink-0 mt-0.5" />
              <p className="text-xs text-[var(--ef-amber-dark)]">
                Archiving will lock all {CURRENT_YEAR} data as read-only. Leave balances will
                be reset and new defaults applied for {NEXT_YEAR}.
              </p>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => setStep(2)}>
                Continue <ChevronRight className="size-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ════════════════════════════════════════════════
            STEP 2 — Archive confirmation with zodResolver
        ════════════════════════════════════════════════ */}
        {step === 2 && (
          <Form {...archiveForm}>
            <form onSubmit={archiveForm.handleSubmit(handleStep2Submit)} className="space-y-4">
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="text-xs text-destructive font-medium mb-1">
                  This action cannot be undone
                </p>
                <p className="text-xs text-muted-foreground">
                  To confirm you want to archive <strong>{CURRENT_YEAR}</strong>, type the
                  phrase below exactly as shown.
                </p>
              </div>

              <div className="rounded-md bg-muted/60 border border-border px-3 py-2 text-center">
                <code className="text-sm font-mono font-semibold text-foreground select-all">
                  {ARCHIVE_PHRASE}
                </code>
              </div>

              <FormField
                control={archiveForm.control}
                name="confirmPhrase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Type the phrase above</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={ARCHIVE_PHRASE}
                        autoComplete="off"
                        spellCheck={false}
                        className="font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter className="sm:justify-between">
                <Button variant="outline" size="sm" type="button" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button size="sm" variant="destructive" type="submit">
                  <Archive className="size-4" /> Archive Year
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {/* ════════════════════════════════════════════════
            STEP 3 — Next year defaults configuration
        ════════════════════════════════════════════════ */}
        {step === 3 && (
          <Form {...nextYearForm}>
            <form onSubmit={nextYearForm.handleSubmit(handleStep3Submit)} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Configure the defaults for academic year <strong>{NEXT_YEAR}</strong>.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={nextYearForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Year Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={nextYearForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">Year End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          className="text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional defaults row — informational */}
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Will also reset
                </p>
                {[
                  "All teacher leave balances → annual quota",
                  "Proxy assignment history archived (read-only)",
                  "Fee structure duplicated from current year",
                  "Holiday calendar cleared (manual entry required)",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="size-3.5 text-[var(--ef-green)] flex-shrink-0 mt-0.5" />
                    {item}
                  </div>
                ))}
              </div>

              <DialogFooter className="sm:justify-between">
                <Button variant="outline" size="sm" type="button" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button size="sm" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Processing…
                    </>
                  ) : (
                    <>Confirm Rollover</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}

        {/* ════════════════════════════════════════════════
            STEP 4 — Success screen
        ════════════════════════════════════════════════ */}
        {step === 4 && (
          <div className="flex flex-col items-center text-center gap-4 py-4">
            <div className="size-16 rounded-full bg-[var(--ef-green-light)] flex items-center justify-center">
              <PartyPopper className="size-8 text-[var(--ef-green-dark)]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold">Rollover Complete!</h3>
              <p className="text-sm text-muted-foreground">
                Academic year {CURRENT_YEAR} has been archived and {NEXT_YEAR} is now active.
              </p>
            </div>
            <div className="w-full rounded-lg border border-[var(--ef-green-light)] bg-[var(--ef-green-light)] p-3 text-left space-y-1.5">
              {[
                `Year ${CURRENT_YEAR} data locked (read-only)`,
                "Teacher leave balances reset",
                `Year ${NEXT_YEAR} defaults configured`,
                "Fee structure carried forward",
              ].map((msg) => (
                <div key={msg} className="flex items-center gap-2 text-xs text-[var(--ef-green-dark)]">
                  <CheckCircle2 className="size-3.5 flex-shrink-0" />
                  {msg}
                </div>
              ))}
            </div>
            <Button className="w-full" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSettingsPage() {
  const [wizardOpen, setWizardOpen] = useState(false)
  const { attendanceMode, setAttendanceMode } = useAttendanceMode()

  const ATTENDANCE_MODES: { value: AttendanceMode; label: string; description: string }[] = [
    {
      value: "per-period",
      label: "Per-Period",
      description: "Teachers mark attendance separately for each class period. A period selector appears on the mark attendance page.",
    },
    {
      value: "single-daily",
      label: "Single Daily",
      description: "One attendance roll call per day per class. The period selector is hidden on the mark attendance page.",
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Settings size={20} />}
        title="Settings"
        subtitle="Manage school-level configuration and administrative tools"
      />

      {/* ── Attendance Mode Section ── */}
      <Card>
        <CardHeader className="pb-3 flex-row items-start gap-4">
          <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <ClipboardCheck className="size-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">Attendance Mode</CardTitle>
            <CardDescription className="text-xs mt-0.5">
              Choose how teachers record daily student attendance
            </CardDescription>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ATTENDANCE_MODES.map((mode) => {
              const active = attendanceMode === mode.value
              return (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setAttendanceMode(mode.value)}
                  className={cn(
                    "flex flex-col gap-1.5 rounded-xl border-2 p-4 text-left transition-all",
                    active
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/30 hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{mode.label}</span>
                    <div
                      className={cn(
                        "size-4 rounded-full border-2 transition-colors flex-shrink-0",
                        active
                          ? "border-primary bg-primary"
                          : "border-muted-foreground bg-transparent"
                      )}
                    >
                      {active && (
                        <div className="size-full rounded-full flex items-center justify-center">
                          <div className="size-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {mode.description}
                  </p>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            Current mode: <strong>{attendanceMode === "per-period" ? "Per-Period" : "Single Daily"}</strong>.
            Changes take effect immediately for all teachers.
          </p>
        </CardContent>
      </Card>

      {/* ── Year Rollover Section ── */}
      <Card>
        <CardHeader className="pb-3 flex-row items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <CalendarRange className="size-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Year Rollover</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Archive {CURRENT_YEAR} data and set up the {NEXT_YEAR} academic year
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs flex-shrink-0">
            Active: {CURRENT_YEAR}
          </Badge>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4 space-y-4">
          {/* Quick stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <SummaryItem
              icon={<GraduationCap className="size-4" />}
              label="Students"
              value={YEAR_SUMMARY.students}
              iconClass="bg-primary/10 text-primary"
            />
            <SummaryItem
              icon={<Users className="size-4" />}
              label="Teachers"
              value={YEAR_SUMMARY.teachers}
              iconClass="bg-success/20 text-success-foreground"
            />
            <SummaryItem
              icon={<ClipboardList className="size-4" />}
              label="Absences"
              value={YEAR_SUMMARY.absences}
              iconClass="bg-warning/20 text-warning-foreground"
            />
            <SummaryItem
              icon={<CheckCircle2 className="size-4" />}
              label="Coverage"
              value={YEAR_SUMMARY.proxyCoverage}
              iconClass="bg-[var(--ef-green-light)] text-[var(--ef-green-dark)]"
            />
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <p className="text-xs text-muted-foreground max-w-prose">
              Roll over to <strong>{NEXT_YEAR}</strong> to archive current year data, reset leave
              balances, and configure the new academic year defaults. This wizard will guide you
              through 3 steps.
            </p>
            <Button
              size="sm"
              onClick={() => setWizardOpen(true)}
              className="flex-shrink-0"
            >
              <CalendarRange className="size-4" />
              Start Rollover Wizard
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Placeholder for additional settings sections (e.g. Exam Mode) ── */}
      <div className="rounded-lg border border-dashed border-border p-6 flex items-center justify-center text-center">
        <div className="max-w-xs space-y-1">
          <p className="text-sm font-medium text-muted-foreground">More settings coming soon</p>
          <p className="text-xs text-muted-foreground">
            Exam Mode, leave quotas, notification preferences, and more will appear here.
          </p>
        </div>
      </div>

      {/* ── Rollover Wizard Dialog ── */}
      <RolloverWizard open={wizardOpen} onOpenChange={setWizardOpen} />
    </div>
  )
}
