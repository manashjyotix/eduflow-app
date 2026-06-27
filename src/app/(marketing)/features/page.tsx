import Link from "next/link"
import {
  LayoutDashboard, UserCheck, Calendar, DollarSign, BarChart3,
  Clock, Activity, ArrowLeftRight, BookOpen, FileText, Users,
  CheckSquare, Baby, ClipboardList, CreditCard, ArrowRight,
  Zap, Shield, Bell, Star
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"

const ROLE_FEATURES = {
  admin: {
    label: "Admin",
    color: "text-[var(--ef-brand)]",
    bgColor: "bg-[var(--ef-brand-light)]",
    borderColor: "border-[var(--ef-brand-mid)]",
    features: [
      {
        icon: LayoutDashboard,
        title: "Proxy Board",
        desc: "Visual colour-coded board showing every period and available substitutes in real time. Green = same subject, amber = cross-subject, red = unavailable.",
        benefit: "Zero missed periods",
      },
      {
        icon: UserCheck,
        title: "Absence Tracker",
        desc: "Mark teachers absent for the full day or specific periods. The system auto-triggers proxy assignment and notifies relevant staff instantly.",
        benefit: "Instant notifications",
      },
      {
        icon: Calendar,
        title: "Timetable Builder",
        desc: "Drag-and-drop interface to build the school timetable. Conflict detection ensures no teacher is double-booked across classes.",
        benefit: "Conflict-free scheduling",
      },
      {
        icon: DollarSign,
        title: "Fee Management",
        desc: "Define fee structures per class, collect payments, generate PDF receipts, and track defaulters — all in one module.",
        benefit: "Automated receipts",
      },
      {
        icon: BarChart3,
        title: "Analytics & Reports",
        desc: "Monthly proxy coverage heatmaps, attendance trends, fee collection summaries, and full audit trails exportable as PDF or Excel.",
        benefit: "PDF-ready reports",
      },
      {
        icon: Shield,
        title: "Roles & Permissions",
        desc: "Granular role-based access: super admin, admin, management, teacher, and parent — each with their own dashboard and permissions.",
        benefit: "Secure multi-role access",
      },
    ],
  },
  management: {
    label: "Management",
    color: "text-[var(--ef-purple)]",
    bgColor: "bg-[var(--ef-purple-light)]",
    borderColor: "border-[var(--ef-purple-mid)]",
    features: [
      {
        icon: Clock,
        title: "Morning Briefing Dashboard",
        desc: "At-a-glance view of the day's absences, uncovered periods, proxy coverage percentage, and a quick-assign shortcut — ready before the bell rings.",
        benefit: "Day starts in control",
      },
      {
        icon: Activity,
        title: "Workload Monitor",
        desc: "Heatmap showing each teacher's proxy load over the week and month. Spot overloaded staff and ensure fair distribution automatically.",
        benefit: "Fair load distribution",
      },
      {
        icon: ArrowLeftRight,
        title: "Swap Request Approvals",
        desc: "Teachers can negotiate peer swaps; management reviews, approves, or rejects with a single click. Full audit trail maintained.",
        benefit: "One-click approval",
      },
      {
        icon: Calendar,
        title: "Timetable Viewer",
        desc: "Read-only view of the full school timetable across all classes and teachers. Filter by class, subject, or teacher.",
        benefit: "Full visibility",
      },
      {
        icon: Bell,
        title: "Absence Approvals",
        desc: "Review and approve teacher absence requests with supporting reason categories. Rejected requests auto-notify the teacher.",
        benefit: "Streamlined approvals",
      },
      {
        icon: BarChart3,
        title: "Proxy Coverage Reports",
        desc: "Detailed monthly reports on proxy coverage rates, most-frequently-absent teachers, and uncovered period analysis.",
        benefit: "Data-driven decisions",
      },
    ],
  },
  teacher: {
    label: "Teacher",
    color: "text-[var(--ef-green-dark)]",
    bgColor: "bg-[var(--ef-green-light)]",
    borderColor: "border-[var(--ef-green)]",
    features: [
      {
        icon: LayoutDashboard,
        title: "Daily Schedule Dashboard",
        desc: "See your full day at a glance: your own classes, any proxy duties assigned to you, leave balance, and pending notifications.",
        benefit: "No morning confusion",
      },
      {
        icon: FileText,
        title: "Leave Application",
        desc: "Apply for absence for a full day or specific periods. Choose reason category (Sick, Casual, Emergency) and attach supporting notes.",
        benefit: "Apply in 30 seconds",
      },
      {
        icon: CheckSquare,
        title: "Attendance Marking",
        desc: "Take digital roll call for your assigned class. Per-period or single-daily mode. Students marked absent get an automatic parent notification.",
        benefit: "Paperless attendance",
      },
      {
        icon: ArrowLeftRight,
        title: "Swap Requests",
        desc: "Negotiate period swaps with peers directly in the app. Both teachers accept, then management approves. No more WhatsApp chains.",
        benefit: "Structured swap flow",
      },
      {
        icon: BookOpen,
        title: "My Timetable",
        desc: "Personal weekly timetable view showing all assigned classes, subjects, and any upcoming proxy duties.",
        benefit: "Always up to date",
      },
      {
        icon: Bell,
        title: "Notifications Centre",
        desc: "Real-time in-app alerts for proxy assignments, swap requests, absence approvals, and admin announcements.",
        benefit: "Never miss an update",
      },
    ],
  },
  parent: {
    label: "Parent",
    color: "text-[var(--ef-amber-dark)]",
    bgColor: "bg-[var(--ef-amber-light)]",
    borderColor: "border-[var(--ef-amber)]",
    features: [
      {
        icon: Baby,
        title: "Child Dashboard",
        desc: "See your child's attendance percentage, today's class journal (subject, teacher, homework per period), exam countdowns, and fee alerts.",
        benefit: "Full child visibility",
      },
      {
        icon: ClipboardList,
        title: "Report Card",
        desc: "Digital term report cards with subject-wise grades, teacher remarks, and overall performance percentile — accessible anytime.",
        benefit: "Anytime access",
      },
      {
        icon: CreditCard,
        title: "Fee Portal",
        desc: "View outstanding fees, payment history, and download receipts. Pay online with Razorpay integration directly from the portal.",
        benefit: "Online payments",
      },
      {
        icon: Calendar,
        title: "Exam Schedule",
        desc: "Upcoming exam schedule with subject, date, time, and countdown timer. Add to Google Calendar with one click.",
        benefit: "Never miss an exam",
      },
      {
        icon: Users,
        title: "Attendance History",
        desc: "Full attendance calendar showing day-by-day present/absent records. Filter by month and see subject-wise attendance percentages.",
        benefit: "Complete history",
      },
      {
        icon: Bell,
        title: "School Notifications",
        desc: "Receive holiday announcements, circular notices, fee reminders, and exam alerts directly in the parent portal.",
        benefit: "Always informed",
      },
    ],
  },
}

const STATS = [
  { value: "12+", label: "Schools using EduFlow" },
  { value: "69", label: "Features built across 6 roles" },
  { value: "< 30s", label: "Average proxy assignment time" },
  { value: "99.9%", label: "Platform uptime guarantee" },
]

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background fade-in">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-16 pb-12 text-center">
        <Badge variant="secondary" className="mb-4">
          <Zap className="size-3 mr-1" />
          69 features across 6 roles
        </Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
          Every feature your<br />
          <span className="text-primary">school needs</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          From proxy board to parent portal, EduFlow covers every operational workflow your school runs daily.
          Purpose-built for Indian schools, CBSE / ICSE / State boards.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button size="lg" asChild>
            <Link href="/signup">
              Start Free Trial
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/demo">Book a Demo</Link>
          </Button>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-border bg-muted/40">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="text-2xl sm:text-3xl font-bold text-primary">{s.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Role-based feature tabs */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">Built for every role</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Every user sees a tailored experience. Admins get control, teachers get clarity, parents get peace of mind.
          </p>
        </div>

        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-10 h-auto">
            {Object.entries(ROLE_FEATURES).map(([key, role]) => (
              <TabsTrigger key={key} value={key} className="py-2.5 text-sm font-medium">
                {role.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(ROLE_FEATURES).map(([key, role]) => (
            <TabsContent key={key} value={key}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {role.features.map((feature) => (
                  <Card key={feature.title} className={`border ${role.borderColor}`}>
                    <CardContent className="p-6">
                      <div className={`size-11 rounded-xl ${role.bgColor} flex items-center justify-center mb-4`}>
                        <feature.icon className={`size-5 ${role.color}`} />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{feature.desc}</p>
                      <Badge variant="secondary" className="text-xs">
                        ✓ {feature.benefit}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </section>

      <Separator />

      {/* Feature comparison table */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 leading-tight">Why schools choose EduFlow</h2>
          <p className="text-muted-foreground">A complete platform vs. fragmented tools</p>
        </div>
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <caption className="sr-only">Feature comparison: EduFlow vs WhatsApp Groups vs Spreadsheets</caption>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-left py-3 px-4 text-foreground font-semibold">Feature</TableHead>
                <TableHead className="text-center py-3 px-4 text-primary font-semibold">EduFlow</TableHead>
                <TableHead className="text-center py-3 px-4 text-muted-foreground font-semibold">WhatsApp Groups</TableHead>
                <TableHead className="text-center py-3 px-4 text-muted-foreground font-semibold">Spreadsheets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ["Proxy auto-assignment", true, false, false],
                ["Real-time availability tracking", true, false, false],
                ["Parent portal & notifications", true, false, false],
                ["Fee collection & receipts", true, false, false],
                ["Audit trail & compliance", true, false, true],
                ["Multi-role access control", true, false, false],
                ["PDF reports", true, false, true],
                ["Mobile-friendly", true, true, false],
              ].map(([feature, ef, wa, ss]) => (
                <TableRow key={String(feature)}>
                  <TableCell className="py-3 px-4 text-foreground">{String(feature)}</TableCell>
                  <TableCell className="py-3 px-4 text-center">{ef ? <span className="text-success-foreground font-bold">✓</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="py-3 px-4 text-center">{wa ? <span className="text-success-foreground font-bold">✓</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                  <TableCell className="py-3 px-4 text-center">{ss ? <span className="text-success-foreground font-bold">✓</span> : <span className="text-muted-foreground">—</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <Separator />

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 leading-tight">Loved by educators across India</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: "Dr. Anupam Das", role: "Principal, HCEA Howly", quote: "We went from 20-minute morning scrambles to instant proxy assignment. The board is brilliant." },
            { name: "Meena Sharma", role: "Management, DPS Delhi", quote: "The workload monitor alone is worth the subscription. Fair distribution, zero complaints from teachers." },
            { name: "Priya Kalita", role: "Class Teacher, KV Guwahati", quote: "I just open my phone, accept the proxy request, done. No more WhatsApp chaos at 7am." },
          ].map((t) => (
            <Card key={t.name} className="bg-muted/30">
              <CardContent className="p-6">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="size-4 fill-warning text-warning" />)}
                </div>
                <p className="text-sm text-muted-foreground italic mb-4 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Bottom CTA */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-20 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to transform your school operations?</h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
          Join 12+ schools already running on EduFlow. Start your 14-day free trial — no credit card required.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button size="lg" asChild>
            <Link href="/signup">
              Start Free Trial
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/demo">See it Live</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">14-day free trial · No credit card · Setup in 5 minutes</p>
      </section>
    </div>
  )
}
