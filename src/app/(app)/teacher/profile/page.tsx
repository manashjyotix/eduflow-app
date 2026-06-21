"use client"

import { useState } from "react"
import {
  User, Mail, Phone, Building2, CalendarDays, Shield, Bell,
  Lock, Activity, Key, Pencil, Save, X, CheckCircle, BookOpen,
  Eye, EyeOff, LogOut, Download, Trash2, ChevronRight, Award,
  ArrowRight, Clock, Star, TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { AvatarUpload } from "@/components/shared/avatar-upload"
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

export default function TeacherProfilePage() {
  const [tab,       setTab]      = useState<Tab>("profile")
  const [editing,   setEditing]  = useState(false)
  const [showPw,    setShowPw]   = useState(false)
  const [showCurPw, setShowCurPw]= useState(false)
  const [showNewPw, setShowNewPw]= useState(false)
  const [saved,     setSaved]    = useState(false)

  const [profile, setProfile] = useState({
    name:"Priya Sharma", email:"priya@hcea.edu", phone:"+91 87654 32109",
    employeeId:"TCH-003", qualification:"M.Sc. Mathematics",
    designation:"TGT Mathematics", section:"High Section (VII–X)",
    address:"Howly, Barpeta, Assam",
    bio:"Mathematics & Science teacher with 7 years of experience. Specialises in remedial teaching for secondary grades.",
  })

  const [notifs, setNotifs] = useState({
    proxyRequest:true, leaveStatus:true, emailAll:false,
    smsUrgent:true, whatsappMorning:true, inAppAll:true,
  })
  const [prefs, setPrefs] = useState({
    autoAcceptProxy:false, declineIfMaxed:true, notifyOnSwap:true, showLeaveBalance:true,
  })
  const [twoFactor, setTwoFactor] = useState(false)

  function save() { setSaved(true); setEditing(false); setTimeout(()=>setSaved(false),3000) }
  const p = (k: keyof typeof profile) => (v: string) => setProfile(prev=>({...prev,[k]:v}))
  const totalProxies = PROXIES.reduce((s,m)=>s+m.count,0)

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap px-4 pt-6 sm:px-6 md:px-8">
        <PageHeader icon={<User size={22}/>} title="Profile & Settings" subtitle="Teacher account · Mathematics & Science"/>
        <div className="flex items-center gap-2 flex-shrink-0 pb-2">
          {saved && <span className="flex items-center gap-1.5 text-sm text-success-foreground font-medium"><CheckCircle className="size-4"/> Saved</span>}
          {tab==="profile" && (editing
            ? <><Button variant="outline" size="sm" onClick={()=>setEditing(false)}><X className="size-4"/> Cancel</Button>
                <Button size="sm" onClick={save}><Save className="size-4"/> Save</Button></>
            : <Button variant="outline" size="sm" onClick={()=>setEditing(true)}><Pencil className="size-4"/> Edit</Button>)}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 sm:px-6 md:px-8 pt-6">
        <KpiCard title="Leave Balance"   value="27 days"      icon={<Award className="size-5"/>}     iconClassName="bg-success/15 text-success-foreground" sparkline={{variant:"arc",value:90,color:"var(--ef-green)"}}/>
        <KpiCard title="Proxy (Jun)"     value={PROXIES[5].count} icon={<ArrowRight className="size-5"/>} iconClassName="bg-warning/15 text-warning-foreground" trend={{value:-1,label:"vs last month"}}/>
        <KpiCard title="Periods / Week"  value="17"           icon={<Clock className="size-5"/>}     iconClassName="bg-primary/10 text-primary" subtitle="3 classes"/>
        <KpiCard title="YTD Proxies"     value={totalProxies} icon={<TrendingUp className="size-5"/>}iconClassName="bg-ef-purple-light text-ef-purple" sparkline={{variant:"bar",data:PROXIES.map(m=>m.count)}}/>
      </div>

      {/* Tab nav */}
      <div className="px-4 sm:px-6 md:px-8 mt-6 border-b border-border overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              className={cn("flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                tab===t.id?"border-primary text-primary":"border-transparent text-muted-foreground hover:text-foreground hover:border-border")}>
              <t.icon className="size-3.5"/>{t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 sm:px-6 md:px-8 py-6 overflow-y-auto">

        {/* PROFILE */}
        {tab==="profile" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <Card className={cn("xl:col-span-1", editing && "ring-2 ring-primary/30 shadow-md")}>
              <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                <AvatarUpload initials="PS" color="bg-[var(--ef-amber)]" editing={editing} />
                {editing && (
                  <p className="text-[11px] text-muted-foreground -mt-1">Click or drag to upload a photo</p>
                )}
                {editing ? <Input value={profile.name} onChange={e=>p("name")(e.target.value)} className="text-center font-semibold max-w-[180px]"/>
                  : <h2 className="font-bold text-lg">{profile.name}</h2>}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <Badge className="bg-[var(--ef-amber)] hover:bg-[var(--ef-amber)] text-white">Teacher</Badge>
                  <Badge variant="outline">{profile.designation}</Badge>
                </div>
                {editing
                  ? <textarea value={profile.bio} onChange={e=>p("bio")(e.target.value)} rows={3} className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 resize-none bg-background text-foreground"/>
                  : <p className="text-xs text-muted-foreground text-left">{profile.bio}</p>}
                <Separator className="w-full"/>
                <div className="w-full space-y-2 text-left text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Mail className="size-3.5 text-primary flex-shrink-0"/><span className="truncate">{profile.email}</span></div>
                  <div className="flex items-center gap-2"><Phone className="size-3.5 text-primary flex-shrink-0"/><span>{profile.phone}</span></div>
                  <div className="flex items-center gap-2"><Building2 className="size-3.5 text-primary flex-shrink-0"/><span>HCEA, Howly</span></div>
                  <div className="flex items-center gap-2"><BookOpen className="size-3.5 text-primary flex-shrink-0"/><span>{profile.qualification}</span></div>
                  <div className="flex items-center gap-2"><Shield className="size-3.5 text-primary flex-shrink-0"/><span>ID: {profile.employeeId}</span></div>
                  <div className="flex items-center gap-2"><CalendarDays className="size-3.5 text-primary flex-shrink-0"/><span>Joined June 2023</span></div>
                </div>
                <Separator className="w-full"/>
                <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive"><LogOut className="size-3.5"/> Sign Out</Button>
              </CardContent>
            </Card>
            <Card className="xl:col-span-3">
              <CardHeader className="pb-3 flex-row items-center gap-2"><User className="size-4 text-muted-foreground"/><CardTitle className="text-base">Personal Details</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {([
                  ["Full Name","name"],["Employee ID","employeeId"],["Designation","designation"],
                  ["Section","section"],["Qualification","qualification"],["Phone","phone"],
                  ["Email","email"],
                ] as [string, keyof typeof profile][]).map(([label,key]) => (
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    {editing ? <Input value={profile[key]} onChange={e=>p(key)(e.target.value)} className="h-8 text-sm"/>
                      : <p className="text-sm font-medium">{profile[key]}</p>}
                  </div>
                ))}
                <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  {editing ? <Input value={profile.address} onChange={e=>p("address")(e.target.value)} className="h-8 text-sm"/>
                    : <p className="text-sm font-medium">{profile.address}</p>}
                </div>
              </CardContent>
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
