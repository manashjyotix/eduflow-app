"use client"

import { useState } from "react"
import {
  User, Mail, Phone, Building2, CalendarDays, Shield, Bell,
  Lock, Activity, Key, Save, CheckCircle, School, Clock,
  Eye, EyeOff, LogOut, Download, Trash2, ChevronRight, Award,
  BarChart3, Users, GraduationCap, ClipboardList, IdCard,
  Briefcase, MapPin, Globe, RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { AvatarUpload } from "@/components/shared/avatar-upload"
import { ScrollX }      from "@/components/shared/scroll-x"
import { PageHeader }  from "@/components/shared/page-header"
import { KpiCard }     from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge }       from "@/components/ui/badge"
import { Button }      from "@/components/ui/button"
import { Separator }   from "@/components/ui/separator"
import { Input }       from "@/components/ui/input"
import { Label }       from "@/components/ui/label"
import { Switch }      from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn }          from "@/lib/utils"

// ─── Static data ──────────────────────────────────────────────────────────────

const TABS = [
  { id: "profile",  label: "Profile",       icon: User      },
  { id: "school",   label: "School",        icon: School    },
  { id: "notifs",   label: "Notifications", icon: Bell      },
  { id: "security", label: "Security",      icon: Lock      },
  { id: "activity", label: "Activity",      icon: Activity  },
] as const
type Tab = typeof TABS[number]["id"]

const BOARDS  = ["SEBA", "CBSE", "ICSE", "NIOS", "State Board", "Other"]
const TITLES  = ["Principal", "Vice Principal", "Headmaster", "Administrator", "Office Manager", "Coordinator", "Other"]

const ACTIVITY_LOG = [
  { action: "Approved 3 absences",               time: "Today, 9:15 AM",    type: "approval"  },
  { action: "Added student: Riya Borah (X-A)",   time: "Today, 8:50 AM",    type: "student"   },
  { action: "Collected fee from Rohit Das",       time: "Yesterday, 3:00 PM",type: "finance"   },
  { action: "Posted notice: Sports Day June 22",  time: "Yesterday, 11 AM",  type: "notice"    },
  { action: "Updated timetable for VII-A",        time: "Jun 15, 2:30 PM",   type: "timetable" },
  { action: "Assigned proxy: Priya → VII-B P4",  time: "Jun 15, 9:05 AM",   type: "proxy"     },
]
const LOG_CLS: Record<string, string> = {
  approval: "bg-success/15 text-success-foreground",
  student:  "bg-primary/10 text-primary",
  finance:  "bg-ef-green-light text-ef-green-dark",
  notice:   "bg-ef-purple-light text-ef-purple",
  timetable:"bg-ef-amber-light text-ef-amber-dark",
  proxy:    "bg-warning/15 text-warning-foreground",
}

const SESSIONS = [
  { device: "Chrome on Windows 11", location: "Howly, Assam", lastActive: "Active now",  current: true  },
  { device: "Safari on iPhone 14",  location: "Howly, Assam", lastActive: "2 hours ago", current: false },
  { device: "Firefox on Ubuntu",    location: "Guwahati",     lastActive: "3 days ago",  current: false },
]

// ─── Shared sub-components (parent-profile style) ─────────────────────────────

function ToggleRow({ label, sub, checked, onChange }: {
  label: string; sub: string; checked: boolean; onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="min-w-0 flex-1 pr-4">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

/** Editable text field with optional leading icon (borderless shadow). */
function Field({
  label, value, onChange, icon, type = "text", placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  icon?: React.ReactNode
  type?: string
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        {icon && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {icon}
          </span>
        )}
        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={cn("h-9 text-sm shadow-none", icon && "pl-8")}
        />
      </div>
    </div>
  )
}

/** Editable select field (icon + value on one row, like inputs). */
function SelectField({
  label, value, onChange, options, icon, placeholder = "Select…",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  icon?: React.ReactNode
  placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        {icon && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 text-muted-foreground pointer-events-none">
            {icon}
          </span>
        )}
        <Select value={value || undefined} onValueChange={onChange}>
          <SelectTrigger className={cn("h-9 text-sm shadow-none", icon && "pl-8")}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProfilePage() {
  const [tab,          setTab]          = useState<Tab>("profile")
  const [showPw,       setShowPw]       = useState(false)
  const [showCurPw,    setShowCurPw]    = useState(false)
  const [showNewPw,    setShowNewPw]    = useState(false)
  const [saved,        setSaved]        = useState(false)

  const INITIAL_PROFILE = {
    name: "Arnab Paul", title: "Principal", department: "Administration",
    email: "admin@hcea.edu", phone: "+91 98765 43210",
    employeeId: "EMP-001", address: "Howly, Barpeta, Assam – 781316",
  }
  const INITIAL_SCHOOL = {
    schoolName: "Holy Child English Academy", board: "SEBA",
    principal: "Dr. Anupam Das", udise: "18040301104",
    address: "Howly, Barpeta, Assam", phone: "+91 3666 254321",
    email: "info@hcea.edu", website: "www.hcea.edu",
    dayStart: "09:30", dayEnd: "14:30",
  }

  const [profile, setProfile] = useState(INITIAL_PROFILE)
  const [pDirty, setPDirty]   = useState(false)
  const [school, setSchool]   = useState(INITIAL_SCHOOL)
  const [sDirty, setSDirty]   = useState(false)

  const [ops, setOps] = useState({
    autoProxy: true, perPeriodAttendance: true,
  })

  const [notifs, setNotifs] = useState({
    emailAbsence: true, emailFee: true, emailProxy: false,
    smsAbsence: true, smsFee: false,
    whatsappMorning: true, whatsappAlert: true, inAppAll: true,
  })

  const [privacy, setPrivacy] = useState({
    profileVisible: true, activityLog: true, twoFactor: false,
  })

  const p = (k: keyof typeof profile) => (v: string) => { setProfile(prev => ({ ...prev, [k]: v })); setPDirty(true) }
  const s = (k: keyof typeof school)  => (v: string) => { setSchool(prev => ({ ...prev, [k]: v })); setSDirty(true) }

  function saveProfile() { setSaved(true); setPDirty(false); setTimeout(() => setSaved(false), 3000) }
  function resetProfile() { setProfile(INITIAL_PROFILE); setPDirty(false) }
  function saveSchool()  { setSaved(true); setSDirty(false); setTimeout(() => setSaved(false), 3000) }
  function resetSchool() { setSchool(INITIAL_SCHOOL); setSDirty(false) }

  // ── KPI constants derived from page data ────────────────────────────────
  const TEACHER_TOTAL   = 10
  const TEACHER_ON_LEAVE = 2
  const STUDENT_TOTAL   = 248
  const STUDENT_CLASSES = 8
  const ABSENCES_JUN    = 14
  const ABSENCES_PEND   = 3
  const FEE_COLLECTED   = 240000
  const FEE_RECEIPTS    = 4
  const TEACHER_SERIES: number[]  = [10, 10, 9, 10, 10, TEACHER_TOTAL]
  const STUDENT_SERIES: number[]  = [230, 235, 240, 244, 246, STUDENT_TOTAL]
  const ABSENCE_SERIES: number[]  = [8, 12, 6, 11, 9, ABSENCES_JUN]
  const FEE_SERIES: number[]      = [180000, 210000, 195000, 225000, 215000, FEE_COLLECTED]
  const teacherTrend  = 0
  const studentTrend  = Math.round(((STUDENT_TOTAL - 246) / 246) * 100)
  const absenceTrend  = Math.round(((ABSENCES_JUN - 9) / 9) * 100)
  const feeTrend      = Math.round(((FEE_COLLECTED - 215000) / 215000) * 100)

  return (
    <div className="flex flex-col">
      {/* ── Top bar ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap px-4 pt-6 sm:px-6 md:px-8 pb-0">
        <PageHeader icon={<User size={22}/>} title="Profile & Settings" subtitle="Admin account · Holy Child English Academy" />
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success-foreground font-medium flex-shrink-0 pb-2">
            <CheckCircle className="size-4"/> Changes saved
          </span>
        )}
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 px-4 sm:px-6 md:px-8 pt-6">
        <KpiCard title="Teachers"       value={TEACHER_TOTAL}
          subtitle={`${TEACHER_ON_LEAVE} on leave today`}
          icon={<Users className="size-5"/>}
          tone="brand"
          trend={{ value: teacherTrend, label: "vs last month" }}
          sparkline={{ variant: "line", data: TEACHER_SERIES }}
        />
        <KpiCard title="Students"       value={STUDENT_TOTAL}
          subtitle={`${STUDENT_CLASSES} classes enrolled`}
          icon={<GraduationCap className="size-5"/>}
          tone="green"
          trend={{ value: studentTrend, label: "vs last month" }}
          sparkline={{ variant: "line", data: STUDENT_SERIES }}
        />
        <KpiCard title="Absences (Jun)" value={ABSENCES_JUN}
          subtitle={`${ABSENCES_PEND} pending review`}
          icon={<ClipboardList className="size-5"/>}
          tone="amber"
          trend={{ value: absenceTrend, label: "vs last month" }}
          sparkline={{ variant: "bar", data: ABSENCE_SERIES }}
        />
        <KpiCard title="Fee Collection" value="₹2.4L"
          subtitle={`This month · ${FEE_RECEIPTS} receipts`}
          icon={<BarChart3 className="size-5"/>}
          tone="purple"
          trend={{ value: feeTrend, label: "vs last month" }}
          sparkline={{ variant: "line", data: FEE_SERIES }}
        />
      </div>

      {/* ── Tab nav ── */}
      <div className="px-4 sm:px-6 md:px-8 mt-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <ScrollX>
            <TabsList className="w-max">
              {TABS.map(t => (
                <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                  <t.icon className="size-3.5"/>{t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollX>
        </Tabs>
      </div>

      {/* ── Tab content ── */}
      <div className="px-4 sm:px-6 md:px-8 py-6">

        {/* ══ PROFILE ══ */}
        {tab === "profile" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* ── Summary card (modern) ── */}
            <Card className="xl:col-span-1 h-fit overflow-hidden pt-0 gap-0">
              <div className="h-24 bg-gradient-to-br from-primary to-[var(--ef-cyan)] relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]" aria-hidden="true" />
              </div>
              <CardContent className="px-6 pb-6 flex flex-col items-center text-center gap-3">
                <div className="-mt-14">
                  <AvatarUpload initials="AP" color="bg-primary" editing />
                </div>
                <p className="text-[11px] text-muted-foreground -mt-1">Tap the camera icon to upload a photo</p>
                <div className="space-y-0.5">
                  <h2 className="font-bold text-lg leading-tight">{profile.name}</h2>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <Badge className="bg-primary hover:bg-primary text-white">Admin</Badge>
                  <Badge variant="outline">{profile.title}</Badge>
                </div>

                {/* Quick stat row */}
                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-base font-bold leading-none">{TEACHER_TOTAL}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Teachers</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-base font-bold leading-none">{STUDENT_TOTAL}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Students</p>
                  </div>
                </div>

                <Separator className="w-full"/>
                <div className="w-full space-y-2.5 text-left text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Phone className="size-3.5 text-primary flex-shrink-0"/><span>{profile.phone}</span></div>
                  <div className="flex items-start gap-2"><MapPin className="size-3.5 text-primary flex-shrink-0 mt-0.5"/><span>{profile.address}</span></div>
                  <div className="flex items-center gap-2"><Building2 className="size-3.5 text-primary flex-shrink-0"/><span>{school.schoolName}</span></div>
                  <div className="flex items-center gap-2"><IdCard className="size-3.5 text-primary flex-shrink-0"/><span>ID: {profile.employeeId} · Full Access</span></div>
                  <div className="flex items-center gap-2"><CalendarDays className="size-3.5 text-primary flex-shrink-0"/><span>Joined August 2022</span></div>
                </div>
                <Separator className="w-full"/>
                <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive" asChild>
                  <Link href="/login"><LogOut className="size-3.5"/> Sign Out</Link>
                </Button>
              </CardContent>
            </Card>

            {/* ── Editable details ── */}
            <Card className="xl:col-span-3">
              <CardHeader className="pb-3 flex-row items-center gap-2">
                <User className="size-4 text-muted-foreground"/>
                <CardTitle className="text-base">Personal Details</CardTitle>
                {pDirty && <Badge variant="secondary" className="ml-auto text-[10px]">Unsaved changes</Badge>}
              </CardHeader>
              <Separator/>
              <CardContent className="pt-5 space-y-6">
                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <IdCard className="size-3.5"/> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field       label="Full Name"   value={profile.name}       onChange={p("name")}       icon={<User className="size-3.5"/>} />
                    <SelectField label="Job Title"   value={profile.title}      onChange={p("title")}      options={TITLES} icon={<Award className="size-3.5"/>} />
                    <Field       label="Department"  value={profile.department} onChange={p("department")} icon={<Briefcase className="size-3.5"/>} />
                    <Field       label="Employee ID" value={profile.employeeId} onChange={p("employeeId")} icon={<IdCard className="size-3.5"/>} />
                  </div>
                </section>

                <Separator/>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Phone className="size-3.5"/> Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field label="Email" value={profile.email} onChange={p("email")} icon={<Mail className="size-3.5"/>} type="email" />
                    <Field label="Phone" value={profile.phone} onChange={p("phone")} icon={<Phone className="size-3.5"/>} type="tel" />
                    <div className="sm:col-span-2 lg:col-span-1">
                      <Field label="Address" value={profile.address} onChange={p("address")} icon={<MapPin className="size-3.5"/>} />
                    </div>
                  </div>
                </section>
              </CardContent>
              <Separator/>
              <div className="flex items-center justify-end gap-2 px-5 py-4">
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-success-foreground font-medium mr-auto">
                    <CheckCircle className="size-4"/> Saved
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={resetProfile} disabled={!pDirty}>
                  <RotateCcw className="size-4"/> Reset
                </Button>
                <Button size="sm" onClick={saveProfile} disabled={!pDirty}>
                  <Save className="size-4"/> Update Profile
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ══ SCHOOL ══ */}
        {tab === "school" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3 flex-row items-center gap-2">
                <School className="size-4 text-muted-foreground"/>
                <CardTitle className="text-base">School Profile</CardTitle>
                {sDirty && <Badge variant="secondary" className="ml-auto text-[10px]">Unsaved changes</Badge>}
              </CardHeader>
              <Separator/>
              <CardContent className="pt-5 space-y-6">
                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Building2 className="size-3.5"/> Institution Details
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field       label="School Name" value={school.schoolName} onChange={s("schoolName")} icon={<School className="size-3.5"/>} />
                    <SelectField label="Board"       value={school.board}      onChange={s("board")}      options={BOARDS} icon={<Award className="size-3.5"/>} />
                    <Field       label="Principal"   value={school.principal}  onChange={s("principal")}  icon={<User className="size-3.5"/>} />
                    <Field       label="UDISE Code"  value={school.udise}      onChange={s("udise")}      icon={<IdCard className="size-3.5"/>} />
                    <Field       label="Phone"       value={school.phone}      onChange={s("phone")}      icon={<Phone className="size-3.5"/>} type="tel" />
                    <Field       label="Email"       value={school.email}      onChange={s("email")}      icon={<Mail className="size-3.5"/>} type="email" />
                    <Field       label="Website"     value={school.website}    onChange={s("website")}    icon={<Globe className="size-3.5"/>} />
                    <div className="sm:col-span-2">
                      <Field label="Address" value={school.address} onChange={s("address")} icon={<MapPin className="size-3.5"/>} />
                    </div>
                  </div>
                </section>

                <Separator/>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Clock className="size-3.5"/> School Day & Operations
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field label="Day Start" value={school.dayStart} onChange={s("dayStart")} icon={<Clock className="size-3.5"/>} type="time" />
                    <Field label="Day End"   value={school.dayEnd}   onChange={s("dayEnd")}   icon={<Clock className="size-3.5"/>} type="time" />
                  </div>
                  <div className="pt-1">
                    <ToggleRow label="Auto-Assign Proxies"   sub="AI suggests best-fit substitute automatically" checked={ops.autoProxy}           onChange={() => setOps(o => ({...o, autoProxy: !o.autoProxy}))}/>
                    <ToggleRow label="Per-Period Attendance" sub="Take roll call per period (vs single daily)"   checked={ops.perPeriodAttendance}  onChange={() => setOps(o => ({...o, perPeriodAttendance: !o.perPeriodAttendance}))}/>
                  </div>
                </section>
              </CardContent>
              <Separator/>
              <div className="flex items-center justify-end gap-2 px-5 py-4">
                <Button variant="outline" size="sm" onClick={resetSchool} disabled={!sDirty}>
                  <RotateCcw className="size-4"/> Reset
                </Button>
                <Button size="sm" onClick={saveSchool} disabled={!sDirty}>
                  <Save className="size-4"/> Save School
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ══ NOTIFICATIONS ══ */}
        {tab === "notifs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Mail className="size-4 text-muted-foreground"/><CardTitle className="text-base">Email Notifications</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="pt-4">
                <ToggleRow label="Absence requests"  sub="New teacher absence submissions"   checked={notifs.emailAbsence} onChange={() => setNotifs(n=>({...n, emailAbsence: !n.emailAbsence}))}/>
                <ToggleRow label="Fee reminders"     sub="Outstanding fee alerts"            checked={notifs.emailFee}     onChange={() => setNotifs(n=>({...n, emailFee: !n.emailFee}))}/>
                <ToggleRow label="Proxy assignments" sub="When a proxy is auto-assigned"     checked={notifs.emailProxy}   onChange={() => setNotifs(n=>({...n, emailProxy: !n.emailProxy}))}/>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Phone className="size-4 text-muted-foreground"/><CardTitle className="text-base">SMS & WhatsApp</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="pt-4">
                <ToggleRow label="Absence SMS"              sub="Via MSG91"              checked={notifs.smsAbsence}      onChange={() => setNotifs(n=>({...n, smsAbsence: !n.smsAbsence}))}/>
                <ToggleRow label="Fee due SMS"              sub="Via MSG91"              checked={notifs.smsFee}          onChange={() => setNotifs(n=>({...n, smsFee: !n.smsFee}))}/>
                <ToggleRow label="Morning WhatsApp"         sub="Daily 8 AM summary"     checked={notifs.whatsappMorning} onChange={() => setNotifs(n=>({...n, whatsappMorning: !n.whatsappMorning}))}/>
                <ToggleRow label="Urgent WhatsApp alerts"   sub="SOS situations only"    checked={notifs.whatsappAlert}   onChange={() => setNotifs(n=>({...n, whatsappAlert: !n.whatsappAlert}))}/>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Bell className="size-4 text-muted-foreground"/><CardTitle className="text-base">In-App</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="pt-4">
                <ToggleRow label="All in-app notifications" sub="Show badge + notification bell" checked={notifs.inAppAll} onChange={() => setNotifs(n=>({...n, inAppAll: !n.inAppAll}))}/>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══ SECURITY ══ */}
        {tab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Shield className="size-4 text-muted-foreground"/><CardTitle className="text-base">Privacy & Access</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="pt-4">
                <ToggleRow label="Two-Factor Authentication" sub="TOTP via Authenticator app"         checked={privacy.twoFactor}       onChange={() => setPrivacy(v=>({...v,twoFactor:!v.twoFactor}))}/>
                <ToggleRow label="Profile visible to staff"  sub="Teachers can see your contact info" checked={privacy.profileVisible}   onChange={() => setPrivacy(v=>({...v,profileVisible:!v.profileVisible}))}/>
                <ToggleRow label="Activity log visibility"   sub="Management can view your actions"   checked={privacy.activityLog}      onChange={() => setPrivacy(v=>({...v,activityLog:!v.activityLog}))}/>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Key className="size-4 text-muted-foreground"/><CardTitle className="text-base">Password</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="pt-4 space-y-3">
                <Button variant="ghost" size="sm" className="justify-start w-full text-xs" onClick={() => setShowPw(v=>!v)}>
                  <Key className="size-3.5"/> Change Password
                  <ChevronRight className={cn("size-3.5 ml-auto transition-transform", showPw && "rotate-90")}/>
                </Button>
                {showPw && (
                  <div className="space-y-3 pl-1">
                    <div className="space-y-1.5"><Label className="text-xs">Current Password</Label>
                      <div className="relative"><Input type={showCurPw?"text":"password"} className="h-8 pr-8 text-xs" placeholder="••••••••"/>
                        <Button variant="ghost" size="icon-sm" className="absolute right-2.5 -translate-y-1/2 h-auto w-auto hover:bg-transparent" onClick={() => setShowCurPw(v=>!v)} aria-label={showCurPw ? "Hide current password" : "Show current password"}>{showCurPw?<EyeOff className="size-3.5"/>:<Eye className="size-3.5"/>}</Button>
                      </div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs">New Password</Label>
                      <div className="relative"><Input type={showNewPw?"text":"password"} className="h-8 pr-8 text-xs" placeholder="Min 8 chars"/>
                        <Button variant="ghost" size="icon-sm" className="absolute right-2.5 -translate-y-1/2 h-auto w-auto hover:bg-transparent" onClick={() => setShowNewPw(v=>!v)} aria-label={showNewPw ? "Hide new password" : "Show new password"}>{showNewPw?<EyeOff className="size-3.5"/>:<Eye className="size-3.5"/>}</Button>
                      </div>
                    </div>
                    <Input type="password" className="h-8 text-xs" placeholder="Confirm new password"/>
                    <Button size="sm"><Save className="size-3.5"/> Update Password</Button>
                  </div>
                )}
                <Separator/>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm"><Download className="size-3.5"/> Export My Data</Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive border-destructive/30"><LogOut className="size-3.5"/> Sign Out All Sessions</Button>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="size-3.5"/> Delete Account</Button>
                </div>
              </CardContent>
            </Card>
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3 flex-row items-center gap-2"><Shield className="size-4 text-muted-foreground"/><CardTitle className="text-base">Active Sessions</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SESSIONS.map((sess, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                    <div className={cn("size-2 rounded-full flex-shrink-0", sess.current ? "bg-[var(--ef-green)]" : "bg-muted-foreground/50")} aria-hidden="true"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{sess.device}</p>
                      <p className="text-[10px] text-muted-foreground">{sess.location} · {sess.lastActive}</p>
                    </div>
                    {sess.current ? <Badge variant="secondary" className="text-[10px] flex-shrink-0">Current</Badge>
                      : <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive hover:text-destructive flex-shrink-0">Revoke</Button>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══ ACTIVITY ══ */}
        {tab === "activity" && (
          <Card>
            <CardHeader className="pb-3 flex-row items-center gap-2"><Activity className="size-4 text-muted-foreground"/><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
            <Separator/>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {ACTIVITY_LOG.map((entry, i) => (
                  <li key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className={cn("size-8 rounded-lg flex items-center justify-center flex-shrink-0", LOG_CLS[entry.type])}><Activity className="size-3.5"/></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">{entry.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="p-4 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href="/admin/audit">Full audit log <ChevronRight className="size-3"/></Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
