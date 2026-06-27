"use client"

import { useState } from "react"
import {
  User, Mail, Phone, Building2, CalendarDays, Shield, Bell,
  Lock, Activity, Key, Save, CheckCircle, BookOpen,
  Eye, EyeOff, LogOut, Download, Trash2, ChevronRight, Award,
  ArrowRight, Clock, Star, TrendingUp, IdCard, GraduationCap,
  Briefcase, MapPin, RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { AvatarUpload } from "@/components/shared/avatar-upload"
import { ScrollX }      from "@/components/shared/scroll-x"
import { PageHeader }    from "@/components/shared/page-header"
import { KpiCard }    from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge }      from "@/components/ui/badge"
import { Button }     from "@/components/ui/button"
import { Separator }  from "@/components/ui/separator"
import { Input }      from "@/components/ui/input"
import { Label }      from "@/components/ui/label"
import { Switch }     from "@/components/ui/switch"
import { Progress }   from "@/components/ui/progress"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn }         from "@/lib/utils"

const TABS = [
  { id: "profile",  label: "Profile",      icon: User     },
  { id: "teaching", label: "Teaching",     icon: BookOpen },
  { id: "notifs",   label: "Notifications",icon: Bell     },
  { id: "prefs",    label: "Preferences",  icon: ArrowRight},
  { id: "security", label: "Security",     icon: Lock     },
  { id: "activity", label: "Activity",     icon: Activity },
] as const
type Tab = typeof TABS[number]["id"]

const DESIGNATIONS = ["PRT", "TGT", "PGT", "TGT Mathematics", "TGT Science", "Vice Principal", "Senior Teacher", "Other"]
const SECTIONS     = ["Pre-Primary", "Primary (I–V)", "Middle (VI–VIII)", "High Section (VII–X)", "Senior Secondary (XI–XII)"]

const SUBJECTS = [
  { subject: "Mathematics", classes: ["VIII-A","IX-B","X-A"], periods: 12, isPrimary: true  },
  { subject: "Science",     classes: ["VII-A"],               periods: 5,  isPrimary: false },
]
const LEAVE_BALANCE = [
  { type: "Sick Leave",   used: 2, total: 7,  color: "[&>div]:bg-primary" },
  { type: "Casual Leave", used: 2, total: 10, color: "[&>div]:bg-[var(--ef-green)]" },
  { type: "Earned Leave", used: 0, total: 12, color: "[&>div]:bg-[var(--ef-purple)]" },
  { type: "Emergency",    used: 0, total: 2,  color: "[&>div]:bg-destructive" },
]
const PROXIES = [
  { month:"Jan",count:2},{month:"Feb",count:4},{month:"Mar",count:3},
  { month:"Apr",count:5},{month:"May",count:3},{month:"Jun",count:2},
]
const ACTIVITY_LOG = [
  { action:"Accepted proxy: P4 Class VII-B",       time:"Today, 8:50 AM",    type:"proxy"      },
  { action:"Submitted leave: Jun 20 (Casual)",     time:"Yesterday, 5:15 PM",type:"leave"      },
  { action:"Marked attendance for VIII-A, P1",     time:"Yesterday, 9:45 AM",type:"attendance" },
  { action:"Proxy completed: IX-C P3 (for Anita)",time:"Jun 14, 11:30 AM",  type:"proxy"      },
  { action:"Marked attendance for X-A, P6",        time:"Jun 14, 1:15 PM",   type:"attendance" },
]
const LOG_CLS: Record<string,string> = {
  proxy:      "bg-warning/15 text-warning-foreground",
  leave:      "bg-primary/10 text-primary",
  attendance: "bg-ef-green-light text-ef-green-dark",
}
const SESSIONS = [
  { device:"Chrome on Windows",  location:"Howly, Assam", lastActive:"Active now",  current:true  },
  { device:"Safari on iPhone 14",location:"Howly, Assam", lastActive:"4 hours ago", current:false },
]

function ToggleRow({label,sub,checked,onChange}:{label:string;sub:string;checked:boolean;onChange:()=>void}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="min-w-0 flex-1 pr-4"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{sub}</p></div>
      <Switch checked={checked} onCheckedChange={onChange}/>
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
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">{icon}</span>
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

/** Editable select field. */
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
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 text-muted-foreground pointer-events-none">{icon}</span>
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

export default function TeacherProfilePage() {
  const [tab,       setTab]      = useState<Tab>("profile")
  const [showPw,    setShowPw]   = useState(false)
  const [showCurPw, setShowCurPw]= useState(false)
  const [showNewPw, setShowNewPw]= useState(false)
  const [saved,     setSaved]    = useState(false)

  const INITIAL_PROFILE = {
    name:"Priya Sharma", email:"priya@hcea.edu", phone:"+91 87654 32109",
    employeeId:"TCH-003", qualification:"M.Sc. Mathematics",
    designation:"TGT Mathematics", section:"High Section (VII–X)",
    address:"Howly, Barpeta, Assam",
    bio:"Mathematics & Science teacher with 7 years of experience. Specialises in remedial teaching for secondary grades.",
  }
  const [profile, setProfile] = useState(INITIAL_PROFILE)
  const [dirty, setDirty] = useState(false)

  const [notifs, setNotifs] = useState({
    proxyRequest:true, leaveStatus:true, emailAll:false,
    smsUrgent:true, whatsappMorning:true, inAppAll:true,
  })
  const [prefs, setPrefs] = useState({
    autoAcceptProxy:false, declineIfMaxed:true, notifyOnSwap:true, showLeaveBalance:true,
  })
  const [twoFactor, setTwoFactor] = useState(false)

  const p = (k: keyof typeof profile) => (v: string) => { setProfile(prev=>({...prev,[k]:v})); setDirty(true) }
  function save() { setSaved(true); setDirty(false); setTimeout(()=>setSaved(false),3000) }
  function reset() { setProfile(INITIAL_PROFILE); setDirty(false) }

  const totalProxies = PROXIES.reduce((s,m)=>s+m.count,0)

  const totalRemaining = LEAVE_BALANCE.reduce((s, lb) => s + (lb.total - lb.used), 0)
  const totalLeave     = LEAVE_BALANCE.reduce((s, lb) => s + lb.total, 0)
  const leaveArcPct   = Math.round((totalRemaining / totalLeave) * 100)

  const periodsPerWeek   = SUBJECTS.reduce((s, sub) => s + sub.periods, 0)
  const uniqueClasses    = new Set(SUBJECTS.flatMap(s => s.classes)).size

  const proxyTrend = Math.round(
    ((PROXIES[5].count - PROXIES[4].count) / Math.max(PROXIES[4].count, 1)) * 100
  )

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap px-4 pt-6 sm:px-6 md:px-8">
        <PageHeader icon={<User size={22}/>} title="Profile & Settings" subtitle="Teacher account · Mathematics & Science"/>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success-foreground font-medium flex-shrink-0 pb-2">
            <CheckCircle className="size-4"/> Changes saved
          </span>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 px-4 sm:px-6 md:px-8 pt-6">
        <KpiCard
          title="Leave Balance"
          value={`${totalRemaining} days`}
          subtitle={`${totalRemaining} days remaining`}
          icon={<Award className="size-5"/>}
          iconClassName="bg-success/15 text-success-foreground"
          tone="green"
          sparkline={{variant:"arc",value:leaveArcPct,color:"var(--ef-green)"}}
        />
        <KpiCard
          title="Proxy (Jun)"
          value={PROXIES[5].count}
          subtitle={`${totalProxies} YTD · ${PROXIES[5].count} this month`}
          icon={<ArrowRight className="size-5"/>}
          iconClassName="bg-warning/15 text-warning-foreground"
          tone="amber"
          trend={{value:proxyTrend,label:"vs last month"}}
          sparkline={{variant:"bar",data:PROXIES.map(m=>m.count),color:"var(--ef-amber)"}}
        />
        <KpiCard
          title="Periods / Week"
          value={periodsPerWeek}
          subtitle={`${SUBJECTS.length} subjects · ${uniqueClasses} classes`}
          icon={<Clock className="size-5"/>}
          iconClassName="bg-primary/10 text-primary"
          tone="brand"
        />
        <KpiCard
          title="YTD Proxies"
          value={totalProxies}
          subtitle={`Avg ${Math.round(totalProxies / 6)}/month`}
          icon={<TrendingUp className="size-5"/>}
          iconClassName="bg-ef-purple-light text-ef-purple"
          tone="purple"
          sparkline={{variant:"bar",data:PROXIES.map(m=>m.count)}}
        />
      </div>

      {/* Tab nav */}
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

      {/* Content */}
      <div className="px-4 sm:px-6 md:px-8 py-6">

        {/* PROFILE */}
        {tab==="profile" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* ── Summary card (modern) ── */}
            <Card className="xl:col-span-1 h-fit overflow-hidden pt-0 gap-0">
              <div className="h-24 bg-gradient-to-br from-[var(--ef-amber)] to-primary relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]" aria-hidden="true" />
              </div>
              <CardContent className="px-6 pb-6 flex flex-col items-center text-center gap-3">
                <div className="-mt-14">
                  <AvatarUpload initials="PS" color="bg-[var(--ef-amber)]" editing />
                </div>
                <p className="text-[11px] text-muted-foreground -mt-1">Tap the camera icon to upload a photo</p>
                <div className="space-y-0.5">
                  <h2 className="font-bold text-lg leading-tight">{profile.name}</h2>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <Badge className="bg-[var(--ef-amber)] hover:bg-[var(--ef-amber)] text-white">Teacher</Badge>
                  <Badge variant="outline">{profile.designation}</Badge>
                </div>

                {/* Quick stat row */}
                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-base font-bold leading-none">{totalRemaining}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Leave days</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-base font-bold leading-none">{periodsPerWeek}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Periods/wk</p>
                  </div>
                </div>

                <Separator className="w-full"/>
                <div className="w-full space-y-2.5 text-left text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Phone className="size-3.5 text-primary flex-shrink-0"/><span>{profile.phone}</span></div>
                  <div className="flex items-start gap-2"><MapPin className="size-3.5 text-primary flex-shrink-0 mt-0.5"/><span>{profile.address}</span></div>
                  <div className="flex items-center gap-2"><GraduationCap className="size-3.5 text-primary flex-shrink-0"/><span>{profile.qualification}</span></div>
                  <div className="flex items-center gap-2"><Building2 className="size-3.5 text-primary flex-shrink-0"/><span>HCEA, Howly</span></div>
                  <div className="flex items-center gap-2"><IdCard className="size-3.5 text-primary flex-shrink-0"/><span>ID: {profile.employeeId}</span></div>
                  <div className="flex items-center gap-2"><CalendarDays className="size-3.5 text-primary flex-shrink-0"/><span>Joined June 2023</span></div>
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
                {dirty && <Badge variant="secondary" className="ml-auto text-[10px]">Unsaved changes</Badge>}
              </CardHeader>
              <Separator/>
              <CardContent className="pt-5 space-y-6">
                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <IdCard className="size-3.5"/> Employment Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field       label="Full Name"     value={profile.name}          onChange={p("name")}          icon={<User className="size-3.5"/>} />
                    <Field       label="Employee ID"   value={profile.employeeId}    onChange={p("employeeId")}    icon={<IdCard className="size-3.5"/>} />
                    <SelectField label="Designation"   value={profile.designation}   onChange={p("designation")}   options={DESIGNATIONS} icon={<Briefcase className="size-3.5"/>} />
                    <SelectField label="Section"       value={profile.section}       onChange={p("section")}       options={SECTIONS} icon={<BookOpen className="size-3.5"/>} />
                    <Field       label="Qualification" value={profile.qualification} onChange={p("qualification")} icon={<GraduationCap className="size-3.5"/>} />
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

                <Separator/>

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Star className="size-3.5"/> About
                  </h3>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Bio</Label>
                    <textarea
                      value={profile.bio}
                      onChange={e => p("bio")(e.target.value)}
                      rows={3}
                      className="w-full text-sm border border-input rounded-md px-3 py-2 resize-none bg-transparent text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    />
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
                <Button variant="outline" size="sm" onClick={reset} disabled={!dirty}>
                  <RotateCcw className="size-4"/> Reset
                </Button>
                <Button size="sm" onClick={save} disabled={!dirty}>
                  <Save className="size-4"/> Update Profile
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* TEACHING */}
        {tab==="teaching" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Star className="size-4 text-muted-foreground"/><CardTitle className="text-base">Subjects Taught</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="pt-4 flex flex-col gap-4">
                {SUBJECTS.map(s=>(
                  <div key={s.subject} className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold">{s.subject}</span>
                        {s.isPrimary && <Badge variant="secondary" className="text-[9px] px-1.5">Primary</Badge>}
                      </div>
                      <span className="text-xs text-muted-foreground">{s.periods} periods/wk</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {s.classes.map(c=><span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">{c}</span>)}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Award className="size-4 text-muted-foreground"/><CardTitle className="text-base">Leave Balance</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="pt-4 flex flex-col gap-4">
                {LEAVE_BALANCE.map(lb=>{
                  const rem = lb.total - lb.used
                  return (
                    <div key={lb.type} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium">{lb.type}</span>
                        <span className={cn("font-bold", rem<=1?"text-destructive":"text-success-foreground")}>{rem}/{lb.total} remaining</span>
                      </div>
                      <Progress value={Math.round((rem/lb.total)*100)} className={cn("h-2",lb.color)}/>
                    </div>
                  )
                })}
                <Button variant="outline" size="sm" className="mt-2" asChild>
                  <Link href="/teacher/leave"><CalendarDays className="size-3.5"/> Apply Leave</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab==="notifs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Bell className="size-4 text-muted-foreground"/><CardTitle className="text-base">Alerts</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4">
                <ToggleRow label="Proxy assignment alerts" sub="Instant when assigned a proxy"      checked={notifs.proxyRequest}    onChange={()=>setNotifs(n=>({...n,proxyRequest:!n.proxyRequest}))}/>
                <ToggleRow label="Leave status updates"    sub="When leave is approved/rejected"    checked={notifs.leaveStatus}     onChange={()=>setNotifs(n=>({...n,leaveStatus:!n.leaveStatus}))}/>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Mail className="size-4 text-muted-foreground"/><CardTitle className="text-base">Channels</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4">
                <ToggleRow label="Email digest"            sub="Daily summary email"               checked={notifs.emailAll}         onChange={()=>setNotifs(n=>({...n,emailAll:!n.emailAll}))}/>
                <ToggleRow label="SMS urgent alerts"       sub="SMS via MSG91"                     checked={notifs.smsUrgent}        onChange={()=>setNotifs(n=>({...n,smsUrgent:!n.smsUrgent}))}/>
                <ToggleRow label="WhatsApp morning"        sub="Schedule summary at 8 AM"          checked={notifs.whatsappMorning}  onChange={()=>setNotifs(n=>({...n,whatsappMorning:!n.whatsappMorning}))}/>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Bell className="size-4 text-muted-foreground"/><CardTitle className="text-base">In-App</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4">
                <ToggleRow label="All in-app notifications" sub="Badge + notification panel"       checked={notifs.inAppAll}         onChange={()=>setNotifs(n=>({...n,inAppAll:!n.inAppAll}))}/>
              </CardContent>
            </Card>
          </div>
        )}

        {/* PREFERENCES */}
        {tab==="prefs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><ArrowRight className="size-4 text-muted-foreground"/><CardTitle className="text-base">Proxy Preferences</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4">
                <ToggleRow label="Auto-accept proxy requests" sub="Accept automatically if free during that period" checked={prefs.autoAcceptProxy} onChange={()=>setPrefs(p=>({...p,autoAcceptProxy:!p.autoAcceptProxy}))}/>
                <ToggleRow label="Auto-decline when capped"  sub="Decline when daily proxy cap is reached"         checked={prefs.declineIfMaxed}  onChange={()=>setPrefs(p=>({...p,declineIfMaxed:!p.declineIfMaxed}))}/>
                <ToggleRow label="Notify me of swap requests" sub="Alert when a peer sends me a swap request"      checked={prefs.notifyOnSwap}    onChange={()=>setPrefs(p=>({...p,notifyOnSwap:!p.notifyOnSwap}))}/>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Award className="size-4 text-muted-foreground"/><CardTitle className="text-base">Dashboard Preferences</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4">
                <ToggleRow label="Show leave balance prominently" sub="Display remaining leave days on dashboard" checked={prefs.showLeaveBalance} onChange={()=>setPrefs(p=>({...p,showLeaveBalance:!p.showLeaveBalance}))}/>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SECURITY */}
        {tab==="security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Shield className="size-4 text-muted-foreground"/><CardTitle className="text-base">Account Security</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4 space-y-3">
                <ToggleRow label="Two-Factor Authentication" sub="TOTP via Authenticator app" checked={twoFactor} onChange={()=>setTwoFactor(v=>!v)}/>
                <Separator/>
                <Button variant="ghost" size="sm" className="justify-start w-full text-xs" onClick={()=>setShowPw(v=>!v)}>
                  <Key className="size-3.5"/> Change Password <ChevronRight className={cn("size-3.5 ml-auto transition-transform",showPw&&"rotate-90")}/>
                </Button>
                {showPw && (
                  <div className="space-y-3 pl-1">
                    <div className="space-y-1.5"><Label className="text-xs">Current Password</Label>
                      <div className="relative"><Input type={showCurPw?"text":"password"} className="h-8 pr-8 text-xs" placeholder="••••••••"/>
                        <Button variant="ghost" size="icon-sm" className="absolute right-2.5 -translate-y-1/2 h-auto w-auto hover:bg-transparent" onClick={()=>setShowCurPw(v=>!v)} aria-label={showCurPw ? "Hide current password" : "Show current password"}>{showCurPw?<EyeOff className="size-3.5"/>:<Eye className="size-3.5"/>}</Button>
                      </div></div>
                    <div className="space-y-1.5"><Label className="text-xs">New Password</Label>
                      <div className="relative"><Input type={showNewPw?"text":"password"} className="h-8 pr-8 text-xs" placeholder="Min 8 chars"/>
                        <Button variant="ghost" size="icon-sm" className="absolute right-2.5 -translate-y-1/2 h-auto w-auto hover:bg-transparent" onClick={()=>setShowNewPw(v=>!v)} aria-label={showNewPw ? "Hide new password" : "Show new password"}>{showNewPw?<EyeOff className="size-3.5"/>:<Eye className="size-3.5"/>}</Button>
                      </div></div>
                    <Input type="password" className="h-8 text-xs" placeholder="Confirm new password"/>
                    <Button size="sm"><Save className="size-3.5"/> Update Password</Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="outline" size="sm"><Download className="size-3.5"/> Export Data</Button>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive border-destructive/30"><Trash2 className="size-3.5"/> Delete Account</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Shield className="size-4 text-muted-foreground"/><CardTitle className="text-base">Active Sessions</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4 space-y-3">
                {SESSIONS.map((s,i)=>(
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                    <div className={cn("size-2 rounded-full flex-shrink-0",s.current?"bg-[var(--ef-green)]":"bg-muted-foreground/50")} aria-hidden="true"/>
                    <div className="flex-1 min-w-0"><p className="text-xs font-medium truncate">{s.device}</p><p className="text-[10px] text-muted-foreground">{s.location} · {s.lastActive}</p></div>
                    {s.current?<Badge variant="secondary" className="text-[10px]">Current</Badge>:<Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive hover:text-destructive">Revoke</Button>}
                  </div>
                ))}
                <Button variant="outline" size="sm" className="w-full mt-1 text-destructive hover:text-destructive border-destructive/30"><LogOut className="size-3.5"/> Sign Out All Sessions</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ACTIVITY */}
        {tab==="activity" && (
          <Card>
            <CardHeader className="pb-3 flex-row items-center gap-2"><Activity className="size-4 text-muted-foreground"/><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
            <Separator/>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {ACTIVITY_LOG.map((entry,i)=>(
                  <li key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className={cn("size-8 rounded-lg flex items-center justify-center flex-shrink-0",LOG_CLS[entry.type])}><Activity className="size-3.5"/></div>
                    <div className="flex-1 min-w-0"><p className="text-sm">{entry.action}</p><p className="text-xs text-muted-foreground">{entry.time}</p></div>
                  </li>
                ))}
              </ul>
              <div className="p-4 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href="/teacher/proxy-history">Full proxy history <ArrowRight className="size-3"/></Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
