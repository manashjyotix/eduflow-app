"use client"

import { useState } from "react"
import {
  User, Mail, Phone, Building2, CalendarDays, Shield, Bell,
  Lock, Activity, Key, Pencil, Save, X, CheckCircle, School, Clock,
  Eye, EyeOff, LogOut, Download, Trash2, ChevronRight, Award,
  BarChart3, Users, GraduationCap, ClipboardList, BookOpen,
} from "lucide-react"
import Link from "next/link"
import { AvatarUpload } from "@/components/shared/avatar-upload"
import { PageHeader }  from "@/components/shared/page-header"
import { KpiCard }     from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge }       from "@/components/ui/badge"
import { Button }      from "@/components/ui/button"
import { Separator }   from "@/components/ui/separator"
import { Input }       from "@/components/ui/input"
import { Label }       from "@/components/ui/label"
import { Switch }      from "@/components/ui/switch"
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

// ─── Shared sub-components ────────────────────────────────────────────────────

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

function FieldRow({ label, value, editing, onChange }: {
  label: string; value: string; editing: boolean; onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {editing
        ? <Input value={value} onChange={e => onChange(e.target.value)} className="h-8 text-sm" />
        : <p className="text-sm font-medium">{value}</p>}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminProfilePage() {
  const [tab,          setTab]          = useState<Tab>("profile")
  const [editing,      setEditing]      = useState(false)
  const [showPw,       setShowPw]       = useState(false)
  const [showCurPw,    setShowCurPw]    = useState(false)
  const [showNewPw,    setShowNewPw]    = useState(false)
  const [saved,        setSaved]        = useState(false)

  const [profile, setProfile] = useState({
    name: "Arnab Paul", title: "Principal", department: "Administration",
    email: "admin@hcea.edu", phone: "+91 98765 43210",
    employeeId: "EMP-001", address: "Howly, Barpeta, Assam – 781316",
  })

  const [school, setSchool] = useState({
    schoolName: "Holy Child English Academy", board: "SEBA",
    principal: "Dr. Anupam Das", udise: "18040301104",
    address: "Howly, Barpeta, Assam", phone: "+91 3666 254321",
    email: "info@hcea.edu", website: "www.hcea.edu",
    dayStart: "09:30", dayEnd: "14:30",
  })

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

  const p = (k: keyof typeof profile) => (v: string) => setProfile(prev => ({ ...prev, [k]: v }))
  const s = (k: keyof typeof school)  => (v: string) => setSchool(prev => ({ ...prev, [k]: v }))

  function save() { setSaved(true); setEditing(false); setTimeout(() => setSaved(false), 3000) }

  const isEditable = tab === "profile" || tab === "school"

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap px-4 pt-6 sm:px-6 md:px-8 pb-0">
        <PageHeader icon={<User size={22}/>} title="Profile & Settings" subtitle="Admin account · Holy Child English Academy" />
        <div className="flex items-center gap-2 flex-shrink-0 pb-2">
          {saved && <span className="flex items-center gap-1.5 text-sm text-success-foreground font-medium"><CheckCircle className="size-4"/> Saved</span>}
          {isEditable && editing ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(false)}><X className="size-4"/> Cancel</Button>
              <Button size="sm" onClick={save}><Save className="size-4"/> Save</Button>
            </>
          ) : isEditable ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil className="size-4"/> Edit</Button>
          ) : null}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 sm:px-6 md:px-8 pt-6">
        <KpiCard title="Teachers"       value="10"   subtitle="2 on leave today"    icon={<Users className="size-5"/>} />
        <KpiCard title="Students"       value="248"  subtitle="8 classes"           icon={<GraduationCap className="size-5"/>} iconClassName="bg-ef-green-light text-ef-green-dark"/>
        <KpiCard title="Absences (Jun)" value="14"   subtitle="3 pending review"    icon={<ClipboardList className="size-5"/>} iconClassName="bg-warning/15 text-warning-foreground"/>
        <KpiCard title="Fee Collection" value="₹2.4L" subtitle="This month"         icon={<BarChart3 className="size-5"/>} iconClassName="bg-ef-purple-light text-ef-purple"/>
      </div>

      {/* ── Tab nav ── */}
      <div className="px-4 sm:px-6 md:px-8 mt-6 border-b border-border overflow-x-auto">
        <nav className="flex gap-1 min-w-max" aria-label="Profile sections">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn("flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                tab === t.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
              )}>
              <t.icon className="size-3.5"/>{t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab content ── */}
      <div className="flex-1 px-4 sm:px-6 md:px-8 py-6 overflow-y-auto">

        {/* ══ PROFILE ══ */}
        {tab === "profile" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* Avatar card */}
            <div className="xl:col-span-1 flex flex-col gap-4">
              <Card className={editing ? "ring-2 ring-primary/30 shadow-md" : ""}>
                <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                <AvatarUpload initials="AP" color="bg-primary" editing={editing} />
                  {editing && (
                    <p className="text-[11px] text-muted-foreground -mt-1">Click or drag to upload a photo</p>
                  )}
                  {editing
                    ? <Input value={profile.name} onChange={e => p("name")(e.target.value)} className="text-center font-semibold max-w-[180px]"/>
                    : <h2 className="font-bold text-lg">{profile.name}</h2>}
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    <Badge className="bg-primary hover:bg-primary text-white">Admin</Badge>
                    <Badge variant="outline">{profile.title}</Badge>
                  </div>
                  <Separator className="w-full"/>
                  <div className="w-full space-y-2 text-left text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><Mail className="size-3.5 text-primary flex-shrink-0"/><span className="truncate">{profile.email}</span></div>
                    <div className="flex items-center gap-2"><Phone className="size-3.5 text-primary flex-shrink-0"/><span>{profile.phone}</span></div>
                    <div className="flex items-center gap-2"><Building2 className="size-3.5 text-primary flex-shrink-0"/><span>{school.schoolName}</span></div>
                    <div className="flex items-center gap-2"><CalendarDays className="size-3.5 text-primary flex-shrink-0"/><span>Joined August 2022</span></div>
                    <div className="flex items-center gap-2"><Award className="size-3.5 text-primary flex-shrink-0"/><span>ID: {profile.employeeId}</span></div>
                    <div className="flex items-center gap-2"><Shield className="size-3.5 text-primary flex-shrink-0"/><span>Role: Admin · Full Access</span></div>
                  </div>
                  <Separator className="w-full"/>
                  <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive"><LogOut className="size-3.5"/> Sign Out</Button>
                </CardContent>
              </Card>
            </div>
            {/* Fields */}
            <div className="xl:col-span-3">
              <Card className={editing ? "ring-2 ring-primary/30 shadow-md" : ""}>
                <CardHeader className="pb-3 flex-row items-center gap-2"><User className="size-4 text-muted-foreground"/><CardTitle className="text-base">Personal Details</CardTitle></CardHeader>
                <Separator/>
                <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <FieldRow label="Full Name"   value={profile.name}       editing={editing} onChange={p("name")}/>
                  <FieldRow label="Job Title"   value={profile.title}      editing={editing} onChange={p("title")}/>
                  <FieldRow label="Department"  value={profile.department}  editing={editing} onChange={p("department")}/>
                  <FieldRow label="Employee ID" value={profile.employeeId} editing={editing} onChange={p("employeeId")}/>
                  <FieldRow label="Email"       value={profile.email}      editing={editing} onChange={p("email")}/>
                  <FieldRow label="Phone"       value={profile.phone}      editing={editing} onChange={p("phone")}/>
                  <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Address</Label>
                    {editing ? <Input value={profile.address} onChange={e => p("address")(e.target.value)} className="h-8 text-sm"/> : <p className="text-sm font-medium">{profile.address}</p>}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ══ SCHOOL ══ */}
        {tab === "school" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><School className="size-4 text-muted-foreground"/><CardTitle className="text-base">School Profile</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldRow label="School Name" value={school.schoolName} editing={editing} onChange={s("schoolName")}/>
                <FieldRow label="Board"       value={school.board}      editing={editing} onChange={s("board")}/>
                <FieldRow label="Principal"   value={school.principal}  editing={editing} onChange={s("principal")}/>
                <FieldRow label="UDISE Code"  value={school.udise}      editing={editing} onChange={s("udise")}/>
                <FieldRow label="Phone"       value={school.phone}      editing={editing} onChange={s("phone")}/>
                <FieldRow label="Email"       value={school.email}      editing={editing} onChange={s("email")}/>
                <FieldRow label="Website"     value={school.website}    editing={editing} onChange={s("website")}/>
                <div className="sm:col-span-2 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  {editing ? <Input value={school.address} onChange={e => s("address")(e.target.value)} className="h-8 text-sm"/> : <p className="text-sm font-medium">{school.address}</p>}
                </div>
              </CardContent>
            </Card>
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader className="pb-3 flex-row items-center gap-2"><Clock className="size-4 text-muted-foreground"/><CardTitle className="text-base">School Day & Operations</CardTitle></CardHeader>
                <Separator/>
                <CardContent className="pt-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Day Start</Label>
                      {editing ? <Input type="time" value={school.dayStart} onChange={e => s("dayStart")(e.target.value)} className="h-8"/> : <p className="text-sm font-medium">{school.dayStart}</p>}
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Day End</Label>
                      {editing ? <Input type="time" value={school.dayEnd} onChange={e => s("dayEnd")(e.target.value)} className="h-8"/> : <p className="text-sm font-medium">{school.dayEnd}</p>}
                    </div>
                  </div>
                  <ToggleRow label="Auto-Assign Proxies"   sub="AI suggests best-fit substitute automatically" checked={ops.autoProxy}           onChange={() => setOps(o => ({...o, autoProxy: !o.autoProxy}))}/>
                  <ToggleRow label="Per-Period Attendance" sub="Take roll call per period (vs single daily)"   checked={ops.perPeriodAttendance}  onChange={() => setOps(o => ({...o, perPeriodAttendance: !o.perPeriodAttendance}))}/>
                </CardContent>
              </Card>
            </div>
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
                {SESSIONS.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                    <div className={cn("size-2 rounded-full flex-shrink-0", s.current ? "bg-[var(--ef-green)]" : "bg-muted-foreground/50")} aria-hidden="true"/>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{s.device}</p>
                      <p className="text-[10px] text-muted-foreground">{s.location} · {s.lastActive}</p>
                    </div>
                    {s.current ? <Badge variant="secondary" className="text-[10px] flex-shrink-0">Current</Badge>
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
