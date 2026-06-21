import { Calendar as CalendarIcon, Clock, MapPin, Lightbulb, AlarmClock } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Calendar } from "@/components/ui/calendar"
import { EXAM_SCHEDULE } from "@/data/mock-academics"
import { SCHOOL_SESSION, HOLIDAYS, WEEKLY_OFF_DAYS } from "@/data/school-session"

const SUBJECT_COLORS: Record<string, { border: string; bg: string; dot: string }> = {
  "English":         { border: "border-l-[var(--ef-green)]",   bg: "bg-[var(--ef-green-light)]",   dot: "bg-[var(--ef-green)]"   },
  "Mathematics":     { border: "border-l-[var(--ef-brand)]",   bg: "bg-[var(--ef-brand-light)]",   dot: "bg-[var(--ef-brand)]"   },
  "Science":         { border: "border-l-[var(--ef-purple)]",  bg: "bg-[var(--ef-purple-light)]",  dot: "bg-[var(--ef-purple)]"  },
  "Social Studies":  { border: "border-l-[var(--ef-amber)]",   bg: "bg-[var(--ef-amber-light)]",   dot: "bg-[var(--ef-amber)]"   },
  "Hindi":           { border: "border-l-[var(--ef-red)]",     bg: "bg-[var(--ef-red-light)]",     dot: "bg-[var(--ef-red)]"     },
  "Sanskrit":        { border: "border-l-[var(--ef-amber-dark)]", bg: "bg-[var(--ef-amber-light)]", dot: "bg-[var(--ef-amber-dark)]" },
  "Computer Science":{ border: "border-l-[var(--ef-cyan)]",    bg: "bg-[var(--ef-cyan-light)]",    dot: "bg-[var(--ef-cyan)]"    },
}

const PREP_TIPS = [
  { subject: "Mathematics",    tip: "Practice 10 problems daily; focus on formula application and time management." },
  { subject: "English",        tip: "Read comprehension passages daily and practice letter/essay writing formats." },
  { subject: "Science",        tip: "Draw and label all diagrams; revise chemical equations and formulae." },
  { subject: "Social Studies", tip: "Use mind maps for dates and events; practice map work regularly." },
  { subject: "Hindi",          tip: "Revise grammar (Sandhi, Samas) and practise summary writing." },
  { subject: "Sanskrit",       tip: "Memorise shlokas and Dhatu roop tables daily." },
  { subject: "Computer Science", tip: "Revise Python basics, MS Office tasks, and hardware/software definitions." },
]

const EXAM_START = new Date("2026-07-14")
const TODAY = new Date("2026-06-15")
const DAYS_UNTIL = Math.ceil((EXAM_START.getTime() - TODAY.getTime()) / (1000 * 60 * 60 * 24))

// Dates that have exams (as Date objects for the calendar modifier)
function parseLocal(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  return new Date(y, m - 1, d)
}

const EXAM_DAY_DATES = EXAM_SCHEDULE.map(e => parseLocal(e.date))
const HOLIDAY_DATES = HOLIDAYS.map(h => parseLocal(h.date))
const SESSION_START = parseLocal(SCHOOL_SESSION.startDate)
const SESSION_END = parseLocal(SCHOOL_SESSION.endDate)

// Show the exam month by default (exams fall in July within the session window)
const JULY_2026 = new Date(2026, 6, 1)

export default function ExamSchedulePage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<CalendarIcon size={20} />}
        title="Exam Schedule"
        subtitle="Mid-Term Examinations — Class VIII-A"
      />

      {/* Countdown Banner */}
      <Alert className="border-primary/30 bg-primary/5 p-4">
        <div className="flex items-center gap-4">
          <AlarmClock className="size-5 text-primary shrink-0" />
          <AlertDescription className="text-foreground">
            <span className="font-bold text-primary text-lg">{DAYS_UNTIL} days</span> until exams begin —
            Mid-Term Examinations start on{" "}
            <strong>Monday, July 14, 2026</strong>. Prepare well!
          </AlertDescription>
        </div>
      </Alert>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exam List */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          {EXAM_SCHEDULE.map(exam => {
            const colors = SUBJECT_COLORS[exam.subject] ?? { border: "border-l-muted", bg: "bg-muted/10", dot: "bg-muted" }
            return (
              <div
                key={exam.id}
                className={`rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-4 ${colors.bg}`}
              >
                {/* Date block */}
                <div className="flex-shrink-0 text-center bg-card rounded-lg px-4 py-3 min-w-[80px]">
                  <p className="text-xs text-muted-foreground font-medium">{exam.dayOfWeek.slice(0, 3).toUpperCase()}</p>
                  <p className="text-2xl font-black text-foreground leading-none mt-0.5">
                    {new Date(exam.date).getDate()}
                  </p>
                  <p className="text-xs text-muted-foreground">July</p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <p className="text-base font-bold text-foreground">{exam.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{exam.teacher}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs flex-shrink-0 border-0">{exam.maxMarks} marks</Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-2">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3.5" /> {exam.startTime} – {exam.endTime}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="size-3.5" /> {exam.room}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right column: Mini Calendar + Tips */}
        <div className="flex flex-col gap-4">
          {/* July Calendar */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-start gap-2 py-3 space-y-0">
              <CalendarIcon className="size-4 text-primary shrink-0 self-center" />
              <CardTitle className="text-sm font-semibold leading-none">Exam Calendar</CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-3">
              <Calendar
                mode="single"
                defaultMonth={JULY_2026}
                startMonth={SESSION_START}
                endMonth={SESSION_END}
                disabled={[{ before: SESSION_START }, { after: SESSION_END }]}
                modifiers={{
                  exam: EXAM_DAY_DATES,
                  holiday: HOLIDAY_DATES,
                  weeklyOff: { dayOfWeek: WEEKLY_OFF_DAYS },
                }}
                modifiersClassNames={{
                  exam: "bg-primary text-primary-foreground rounded-md font-semibold",
                  holiday: "text-[var(--ef-red)] font-semibold",
                  weeklyOff: "text-muted-foreground/50",
                }}
                className="w-full p-0"
              />
              <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5 mt-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm bg-primary" />
                  Exam day
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm bg-[var(--ef-red)]" />
                  Holiday
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-sm bg-muted-foreground/40" />
                  Weekly off
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Prep Tips */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-start py-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Lightbulb className="size-4 text-[var(--ef-amber)]" />
                Preparation Tips
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="p-3 space-y-3">
              {PREP_TIPS.map(t => {
                const colors = SUBJECT_COLORS[t.subject]
                return (
                  <div key={t.subject} className="flex gap-2">
                    <span className={`mt-1.5 size-2 rounded-full flex-shrink-0 ${colors?.dot ?? "bg-muted"}`} aria-hidden="true" />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{t.subject}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{t.tip}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Exams</span>
                <span className="font-bold">{EXAM_SCHEDULE.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total Marks</span>
                <span className="font-bold">{EXAM_SCHEDULE.reduce((a, e) => a + e.maxMarks, 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-bold">July 14 – 22</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Days Left</span>
                <span className="font-bold text-primary">{DAYS_UNTIL} days</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
