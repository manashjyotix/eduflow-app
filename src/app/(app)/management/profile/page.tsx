"use client"

import { useState } from "react"
import {
  UserCog, Mail, Phone, Building2, CalendarDays, Shield, Bell,
  Lock, Activity, Key, Save, CheckCircle, Settings,
  Eye, EyeOff, LogOut, Download, Trash2, ChevronRight,
  ArrowLeftRight, TrendingUp, ClipboardList, ScrollText,
  IdCard, Briefcase, MapPin, GraduationCap, RotateCcw,
} from "lucide-react"
import Link from "next/link"
import { AvatarUpload } from "@/components/shared/avatar-upload"
import { ScrollX }      from "@/components/shared/scroll-x"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard }    from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge }      from "@/components/ui/badge"
import { Button }     from "@/components/ui/button"
import { Separator }  from "@/components/ui/separator"
import { Input }      from "@/components/ui/input"
import { Label }      from "@/components/ui/label"
import { Switch }     from "@/components/ui/switch"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn }         from "@/lib/utils"

const TABS = [
  { id:"profile",  label:"Profile",       icon:UserCog        },
  { id:"prefs",    label:"Preferences",   icon:Settings       },
  { id:"notifs",   label:"Notifications", icon:Bell           },
  { id:"security", label:"Security",      icon:Lock           },
  { id:"activity", label:"Activity",      icon:Activity       },
] as const
type Tab = typeof TABS[number]["id"]

const TITLES = ["Vice Principal", "Headmaster", "Coordinator", "Senior Coordinator", "Management Officer", "Other"]

const PERMISSIONS = [
  { label:"Approve/reject absences",  granted:true  },
  { label:"Approve swap requests",    granted:true  },
  { label:"Assign proxy teachers",    granted:true  },
  { label:"Post notices",             granted:true  },
  { label:"View exam schedule",       granted:true  },
  { label:"View timetable",           granted:true  },
  { label:"Modify fee structure",     granted:false },
  { label:"Add / remove students",    granted:false },
  { label:"Change school settings",   granted:false },
  { label:"Access financial reports", granted:false },
]

const ACTIVITY_LOG = [
  { action:"Approved absence for Anita Devi",    time:"Today, 9:15 AM",    type:"approval" },
  { action:"Approved swap: Priya ↔ Rajesh",      time:"Today, 9:02 AM",    type:"swap"     },
  { action:"Posted notice: Sports Day update",   time:"Yesterday, 4:30 PM",type:"notice"   },
  { action:"Coordinated 5 proxies for June 14",  time:"Yesterday, 9:00 AM",type:"proxy"    },
  { action:"Approved absence for Dipak Baruah", time:"Jun 13, 8:55 AM",   type:"approval" },
  { action:"Reviewed workload report — June",    time:"Jun 12, 5:00 PM",   type:"report"   },
]
const LOG_CLS: Record<string,string> = {
  approval:"bg-success/15 text-success-foreground",
  swap:    "bg-primary/10 text-primary",
  notice:  "bg-ef-purple-light text-ef-purple",
  proxy:   "bg-warning/15 text-warning-foreground",
  report:  "bg-ef-amber-light text-ef-amber-dark",
}

const SESSIONS = [
  { device:"Chrome on Windows",   location:"Howly, Assam",lastActive:"Active now", current:true  },
  { device:"Firefox on Android",  location:"Howly, Assam",lastActive:"3 hours ago",current:false },
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
  label, value, onChange, icon, type = "text",
}: {
  label: string
  value: string
  onChange: (v: string) => void
  icon?: React.ReactNode
  type?: string
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

export default function ManagementProfilePage() {
  const [tab,       setTab]      = useState<Tab>("profile")
  const [showPw,    setShowPw]   = useState(false)
  const [showCurPw, setShowCurPw]= useState(false)
  const [showNewPw, setShowNewPw]= useState(false)
  const [saved,     setSaved]    = useState(false)

  const INITIAL_PROFILE = {
    name:"Mrinal Ojha", title:"Vice Principal", department:"Management Office",
    email:"mgmt@hcea.edu", phone:"+91 98765 43210",
    employeeId:"MGT-002", qualification:"M.A. Education",
    address:"Howly, Barpeta, Assam – 781316",
  }
  const [profile, setProfile] = useState(INITIAL_PROFILE)
  const [dirty, setDirty] = useState(false)

  const [notifs, setNotifs] = useState({
    absenceRequests:true, swapRequests:true, proxyAlerts:true, workloadWarning:true,
    emailDigest:false, smsUrgent:true, whatsappMorning:true, inAppAll:true,
  })
  const [prefs, setPrefs] = useState({
    morningBriefing:true, autoProxySuggest:true, showWorkloadHeat:true,
  })
  const [twoFactor, setTwoFactor] = useState(false)

  const p = (k:keyof typeof profile)=>(v:string)=>{ setProfile(prev=>({...prev,[k]:v})); setDirty(true) }
  function save() { setSaved(true); setDirty(false); setTimeout(()=>setSaved(false),3000) }
  function reset() { setProfile(INITIAL_PROFILE); setDirty(false) }

  const grantedCount = PERMISSIONS.filter(p => p.granted).length

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-4 flex-wrap px-4 pt-6 sm:px-6 md:px-8">
        <PageHeader icon={<UserCog size={22}/>} title="Profile & Settings" subtitle="Management Officer account · HCEA"/>
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success-foreground font-medium flex-shrink-0 pb-2">
            <CheckCircle className="size-4"/> Changes saved
          </span>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 px-4 sm:px-6 md:px-8 pt-6">
        <KpiCard title="Absences Approved" value="23" subtitle="This month" icon={<ClipboardList className="size-5"/>} iconClassName="bg-success/15 text-success-foreground"/>
        <KpiCard title="Swaps Approved"    value="15" subtitle="This month" icon={<ArrowLeftRight className="size-5"/>} iconClassName="bg-primary/10 text-primary"/>
        <KpiCard title="Proxies Assigned"  value="47" subtitle="This month" icon={<TrendingUp className="size-5"/>}    iconClassName="bg-warning/15 text-warning-foreground"/>
        <KpiCard title="Notices Posted"    value="8"  subtitle="This month" icon={<ScrollText className="size-5"/>}   iconClassName="bg-ef-purple-light text-ef-purple"/>
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

      <div className="px-4 sm:px-6 md:px-8 py-6">

        {/* PROFILE */}
        {tab==="profile" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* ── Summary card (modern) ── */}
            <Card className="xl:col-span-1 h-fit overflow-hidden pt-0 gap-0">
              <div className="h-24 bg-gradient-to-br from-[var(--ef-green)] to-primary relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]" aria-hidden="true" />
              </div>
              <CardContent className="px-6 pb-6 flex flex-col items-center text-center gap-3">
                <div className="-mt-14">
                  <AvatarUpload initials="MO" color="bg-[var(--ef-green)]" editing />
                </div>
                <p className="text-[11px] text-muted-foreground -mt-1">Tap the camera icon to upload a photo</p>
                <div className="space-y-0.5">
                  <h2 className="font-bold text-lg leading-tight">{profile.name}</h2>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <Badge className="bg-[var(--ef-green)] hover:bg-[var(--ef-green)] text-white">Management</Badge>
                  <Badge variant="outline">{profile.title}</Badge>
                </div>

                {/* Quick stat row */}
                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-base font-bold leading-none">47</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Proxies</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-base font-bold leading-none">{grantedCount}/{PERMISSIONS.length}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Permissions</p>
                  </div>
                </div>

                <Separator className="w-full"/>
                <div className="w-full space-y-2.5 text-left text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Phone className="size-3.5 text-primary flex-shrink-0"/><span>{profile.phone}</span></div>
                  <div className="flex items-start gap-2"><MapPin className="size-3.5 text-primary flex-shrink-0 mt-0.5"/><span>{profile.address}</span></div>
                  <div className="flex items-center gap-2"><Briefcase className="size-3.5 text-primary flex-shrink-0"/><span>{profile.department}</span></div>
                  <div className="flex items-center gap-2"><Building2 className="size-3.5 text-primary flex-shrink-0"/><span>HCEA, Howly</span></div>
                  <div className="flex items-center gap-2"><IdCard className="size-3.5 text-primary flex-shrink-0"/><span>ID: {profile.employeeId}</span></div>
                  <div className="flex items-center gap-2"><CalendarDays className="size-3.5 text-primary flex-shrink-0"/><span>Joined April 2024</span></div>
                </div>
                <Separator className="w-full"/>
                <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive" asChild>
                  <Link href="/login"><LogOut className="size-3.5"/> Sign Out</Link>
                </Button>
              </CardContent>
            </Card>

            {/* ── Editable details + permissions ── */}
            <div className="xl:col-span-3 flex flex-col gap-6">
              <Card>
                <CardHeader className="pb-3 flex-row items-center gap-2">
                  <UserCog className="size-4 text-muted-foreground"/>
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
                      <Field       label="Full Name"     value={profile.name}          onChange={p("name")}          icon={<UserCog className="size-3.5"/>} />
                      <SelectField label="Job Title"     value={profile.title}         onChange={p("title")}         options={TITLES} icon={<Briefcase className="size-3.5"/>} />
                      <Field       label="Department"    value={profile.department}    onChange={p("department")}    icon={<Building2 className="size-3.5"/>} />
                      <Field       label="Employee ID"   value={profile.employeeId}    onChange={p("employeeId")}    icon={<IdCard className="size-3.5"/>} />
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

              <Card>
                <CardHeader className="pb-3 flex-row items-center gap-2"><Shield className="size-4 text-muted-foreground"/><CardTitle className="text-base">Role Permissions</CardTitle></CardHeader>
                <Separator/>
                <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {PERMISSIONS.map(perm=>(
                    <div key={perm.label} className="flex items-center gap-2">
                      <div className={cn("size-4 rounded-full flex items-center justify-center flex-shrink-0 text-[9px]",
                        perm.granted?"bg-success/20 text-success-foreground":"bg-muted text-muted-foreground/50")}>
                        {perm.granted?"✓":"✕"}
                      </div>
                      <span className={cn("text-xs",perm.granted?"":"text-muted-foreground line-through")}>{perm.label}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-muted-foreground col-span-full pt-2">Contact Admin to change permissions</p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* PREFS */}
        {tab==="prefs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Settings className="size-4 text-muted-foreground"/><CardTitle className="text-base">Dashboard Preferences</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4">
                <ToggleRow label="Morning briefing card"   sub="Daily overview at top of dashboard"          checked={prefs.morningBriefing}   onChange={()=>setPrefs(p=>({...p,morningBriefing:!p.morningBriefing}))}/>
                <ToggleRow label="Auto-suggest proxies"    sub="AI-ranked suggestions per uncovered period"  checked={prefs.autoProxySuggest}  onChange={()=>setPrefs(p=>({...p,autoProxySuggest:!p.autoProxySuggest}))}/>
                <ToggleRow label="Workload heatmap"        sub="Per-teacher proxy load at a glance"          checked={prefs.showWorkloadHeat}  onChange={()=>setPrefs(p=>({...p,showWorkloadHeat:!p.showWorkloadHeat}))}/>
              </CardContent>
            </Card>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab==="notifs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Bell className="size-4 text-muted-foreground"/><CardTitle className="text-base">Management Alerts</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4">
                <ToggleRow label="Absence requests"   sub="New teacher absence submissions"        checked={notifs.absenceRequests}  onChange={()=>setNotifs(n=>({...n,absenceRequests:!n.absenceRequests}))}/>
                <ToggleRow label="Swap requests"      sub="When peers agree on a swap"             checked={notifs.swapRequests}     onChange={()=>setNotifs(n=>({...n,swapRequests:!n.swapRequests}))}/>
                <ToggleRow label="Proxy alerts"       sub="Uncovered periods requiring action"     checked={notifs.proxyAlerts}      onChange={()=>setNotifs(n=>({...n,proxyAlerts:!n.proxyAlerts}))}/>
                <ToggleRow label="Workload warnings"  sub="When a teacher hits 80% proxy cap"      checked={notifs.workloadWarning}  onChange={()=>setNotifs(n=>({...n,workloadWarning:!n.workloadWarning}))}/>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Mail className="size-4 text-muted-foreground"/><CardTitle className="text-base">Channels</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4">
                <ToggleRow label="Email digest"          sub="Daily morning email summary"      checked={notifs.emailDigest}      onChange={()=>setNotifs(n=>({...n,emailDigest:!n.emailDigest}))}/>
                <ToggleRow label="SMS urgent alerts"     sub="Critical absences only"           checked={notifs.smsUrgent}        onChange={()=>setNotifs(n=>({...n,smsUrgent:!n.smsUrgent}))}/>
                <ToggleRow label="WhatsApp morning"      sub="8 AM schedule summary"            checked={notifs.whatsappMorning}  onChange={()=>setNotifs(n=>({...n,whatsappMorning:!n.whatsappMorning}))}/>
                <ToggleRow label="All in-app"            sub="Badge + notification panel"       checked={notifs.inAppAll}         onChange={()=>setNotifs(n=>({...n,inAppAll:!n.inAppAll}))}/>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SECURITY */}
        {tab==="security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Lock className="size-4 text-muted-foreground"/><CardTitle className="text-base">Password & 2FA</CardTitle></CardHeader>
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
                <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive border-destructive/30"><LogOut className="size-3.5"/> Sign Out All Sessions</Button>
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
                    <div className={cn("size-8 rounded-lg flex items-center justify-center flex-shrink-0",LOG_CLS[entry.type]??"")}><Activity className="size-3.5"/></div>
                    <div className="flex-1 min-w-0"><p className="text-sm">{entry.action}</p><p className="text-xs text-muted-foreground">{entry.time}</p></div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
