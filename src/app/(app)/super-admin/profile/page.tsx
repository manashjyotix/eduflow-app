"use client"

import { useState } from "react"
import {
  User, Mail, Phone, Globe, CalendarDays, Shield, Bell,
  Lock, Activity, Key, Pencil, Save, X, CheckCircle, Building2,
  Eye, EyeOff, LogOut, Download, ChevronRight, AlertTriangle,
  Database, PlugZap, BarChart3, Settings, Zap, HeartHandshake,
  Users, BookOpen, Clock, RefreshCw, MessageSquare, Palette,
  ToggleLeft, TrendingUp,
} from "lucide-react"
import Link from "next/link"
import { AvatarUpload } from "@/components/shared/avatar-upload"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard }    from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge }      from "@/components/ui/badge"
import { Button }     from "@/components/ui/button"
import { Separator }  from "@/components/ui/separator"
import { Input }      from "@/components/ui/input"
import { Label }      from "@/components/ui/label"
import { Switch }     from "@/components/ui/switch"
import { Progress }   from "@/components/ui/progress"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { cn }         from "@/lib/utils"

const TABS = [
  { id:"profile",   label:"Profile",        icon:User        },
  { id:"platform",  label:"Platform",       icon:Globe       },
  { id:"notifs",    label:"Notifications",  icon:Bell        },
  { id:"security",  label:"Security",       icon:Lock        },
  { id:"activity",  label:"Activity",       icon:Activity    },
] as const
type Tab = typeof TABS[number]["id"]

const FEATURES = [
  { name:"AI Auto-Assign",          desc:"Automatically assign proxy teachers using AI scoring",           enabled:true,  tag:"Core"    },
  { name:"QR Check-in",             desc:"QR-based student check-in for attendance",                       enabled:false, tag:"Phase 4" },
  { name:"Parent Portal",           desc:"Enable parent login and child visibility features",              enabled:true,  tag:"Core"    },
  { name:"Affiliate Program",       desc:"Enable affiliate referral tracking and payouts",                 enabled:true,  tag:"Revenue" },
  { name:"Dark Mode",               desc:"Allow tenant users to switch to dark mode",                      enabled:true,  tag:"UI"      },
  { name:"Excel Import",            desc:"Bulk import teachers and students via .xlsx files",              enabled:false, tag:"Phase 3" },
  { name:"SMS Notifications",       desc:"Send SMS alerts for proxy assignments, absences, fee dues",      enabled:true,  tag:"Core"    },
  { name:"Academic Year Rollover",  desc:"Allow admin to archive past year and reset leave balances",      enabled:false, tag:"Phase 4" },
  { name:"Maintenance Mode",        desc:"Take the platform offline for maintenance",                      enabled:false, tag:"Danger"  },
]
const TEMPLATES = [
  { id:"welcome",       name:"Welcome Email",        trigger:"On signup",                  icon:<Mail className="size-3.5"/>       },
  { id:"fee-due",       name:"Fee Due Reminder",     trigger:"Auto — 3 days before due",   icon:<Bell className="size-3.5"/>       },
  { id:"proxy",         name:"Proxy Assignment",     trigger:"On proxy assignment",         icon:<Users className="size-3.5"/>      },
  { id:"leave",         name:"Leave Approval",       trigger:"On leave status change",      icon:<BookOpen className="size-3.5"/>   },
  { id:"trial-expiry",  name:"Trial Expiry Warning", trigger:"7 days before trial ends",   icon:<Clock className="size-3.5"/>      },
  { id:"renewal",       name:"Renewal Reminder",     trigger:"14 days before subscription",icon:<RefreshCw className="size-3.5"/> },
]
const API_KEYS = [
  { label:"Razorpay Key ID",         value:"rzp_live_**********************", verified:true  },
  { label:"Razorpay Secret",         value:"••••••••••••••••••••••••",        verified:true  },
  { label:"MSG91 API Key",           value:"••••••••••••••••••••••••",        verified:true  },
  { label:"Google Maps API Key",     value:"Not configured",                  verified:false },
  { label:"Sentry DSN (Errors)",     value:"https://sentry.io/****...",       verified:true  },
]
const TAG_CLS: Record<string,string> = {
  Core:"bg-ef-brand-light text-primary", Revenue:"bg-ef-green-light text-ef-green-dark",
  UI:"bg-ef-purple-light text-ef-purple", "Phase 3":"bg-ef-amber-light text-ef-amber-dark",
  "Phase 4":"bg-ef-amber-light text-ef-amber-dark", Danger:"bg-ef-red-light text-ef-red",
}
const ACTIVITY_LOG = [
  { action:"Toggled: AI Auto-Assign → ON",         time:"Today, 10:00 AM",    type:"feature"    },
  { action:"Impersonated HCEA admin for support",  time:"Today, 9:15 AM",     type:"impersonate"},
  { action:"Triggered manual backup — all schools",time:"Yesterday, 11:00 PM",type:"backup"     },
  { action:"Created new school: Guwahati Academy", time:"Jun 15, 3:00 PM",    type:"tenant"     },
  { action:"Approved affiliate payout: ₹3,200",    time:"Jun 14, 2:00 PM",    type:"billing"    },
  { action:"Updated global proxy caps (5→6)",      time:"Jun 12, 11:00 AM",   type:"settings"   },
]
const LOG_CLS: Record<string,string> = {
  feature:"bg-primary/10 text-primary", impersonate:"bg-ef-amber-light text-ef-amber-dark",
  backup:"bg-ef-green-light text-ef-green-dark", tenant:"bg-ef-purple-light text-ef-purple",
  billing:"bg-success/15 text-success-foreground", settings:"bg-muted text-muted-foreground",
}
const SESSIONS = [
  { device:"Chrome on macOS 14",  location:"Bengaluru, KA",lastActive:"Active now", current:true  },
  { device:"Safari on iPhone 15", location:"Bengaluru, KA",lastActive:"1 hour ago", current:false },
  { device:"Firefox on Ubuntu",   location:"Unknown",      lastActive:"5 days ago", current:false },
]

function ToggleRow({label,sub,checked,onChange}:{label:string;sub:string;checked:boolean;onChange:()=>void}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="min-w-0 flex-1 pr-4"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{sub}</p></div>
      <Switch checked={checked} onCheckedChange={onChange}/>
    </div>
  )
}

export default function SuperAdminProfilePage() {
  const [tab,          setTab]         = useState<Tab>("profile")
  const [editing,      setEditing]     = useState(false)
  const [showPw,       setShowPw]      = useState(false)
  const [showCurPw,    setShowCurPw]   = useState(false)
  const [showNewPw,    setShowNewPw]   = useState(false)
  const [saved,        setSaved]       = useState(false)
  const [attMode,      setAttMode]     = useState<"per-period"|"single-daily">("per-period")
  const [maintConfirm, setMaintConfirm]= useState(false)

  const [profile, setProfile] = useState({
    name:"Super Admin", title:"Platform Owner", email:"superadmin@proxymanager.app",
    phone:"+91 99999 00000", location:"Bengaluru, Karnataka",
    company:"EduFlow Scholaris", joined:"January 2024",
    timezone:"Asia/Kolkata (IST UTC+5:30)",
  })
  const [featureStates, setFeatureStates] = useState<Record<string,boolean>>(
    Object.fromEntries(FEATURES.map(f=>[f.name,f.enabled]))
  )
  const [proxyCaps, setProxyCaps] = useState({ daily:5, weekly:15, monthly:40 })
  const [notifs, setNotifs] = useState({
    tenantSignup:true, paymentFailed:true, trialExpiry:true, systemAlert:true,
    affiliatePayout:true, backupComplete:false, emailDigest:true, smsUrgent:true,
  })
  const [security, setSecurity] = useState({
    twoFactor:true, ipAllowlist:false, auditAllExports:true, sessionAlerts:true,
  })

  const p = (k:keyof typeof profile)=>(v:string)=>setProfile(prev=>({...prev,[k]:v}))
  function save() { setSaved(true); setEditing(false); setTimeout(()=>setSaved(false),3000) }

  function toggleFeature(name:string) {
    if(name==="Maintenance Mode" && !maintConfirm) { setMaintConfirm(true); return }
    if(name==="Maintenance Mode") setMaintConfirm(false)
    setFeatureStates(s=>({...s,[name]:!s[name]}))
  }

  const flagsOnCount = FEATURES.filter(f=>featureStates[f.name]).length

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-4 flex-wrap px-4 pt-6 sm:px-6 md:px-8">
        <PageHeader icon={<User size={22}/>} title="Profile & Platform Settings"
          subtitle="Super Admin account · Platform owner"
          actions={<Badge variant="destructive" className="text-[10px]">Super Admin Only</Badge>}/>
        <div className="flex items-center gap-2 flex-shrink-0 pb-2">
          {saved && <span className="flex items-center gap-1.5 text-sm text-success-foreground font-medium"><CheckCircle className="size-4"/> Saved</span>}
          {tab==="profile" && (editing
            ? <><Button variant="outline" size="sm" onClick={()=>setEditing(false)}><X className="size-4"/> Cancel</Button>
                <Button size="sm" onClick={save}><Save className="size-4"/> Save</Button></>
            : <Button variant="outline" size="sm" onClick={()=>setEditing(true)}><Pencil className="size-4"/> Edit</Button>)}
          {tab==="platform" && <Button size="sm"><Save className="size-4"/> Save All</Button>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 sm:px-6 md:px-8 pt-6">
        <KpiCard title="Active Tenants"   value="12"    subtitle="All schools live"     icon={<Building2 className="size-5"/>}/>
        <KpiCard title="Monthly Revenue"  value="₹1.32L" subtitle="MRR June 2026"      icon={<TrendingUp className="size-5"/>} iconClassName="bg-success/15 text-success-foreground"/>
        <KpiCard title="Feature Flags On" value={`${flagsOnCount}/${FEATURES.length}`}  subtitle="Platform features" icon={<ToggleLeft className="size-5"/>} iconClassName="bg-primary/10 text-primary"/>
        <KpiCard title="Security Alerts"  value="0"     subtitle="No critical issues"   icon={<Shield className="size-5"/>}    iconClassName="bg-ef-green-light text-ef-green"/>
      </div>

      {maintConfirm && (
        <div className="px-4 sm:px-6 md:px-8 mt-4">
          <Alert variant="warning"><AlertTriangle className="size-4"/>
            <AlertTitle>Confirm Maintenance Mode</AlertTitle>
            <AlertDescription>This will make the app inaccessible to all tenant users. Toggle again to confirm.</AlertDescription>
          </Alert>
        </div>
      )}

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

      <div className="flex-1 px-4 sm:px-6 md:px-8 py-6 overflow-y-auto">

        {/* PROFILE */}
        {tab==="profile" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <Card className={cn("xl:col-span-1", editing && "ring-2 ring-primary/30 shadow-md")}>
              <CardContent className="pt-6 flex flex-col items-center text-center gap-3">
                <AvatarUpload initials="SA" color="bg-destructive" editing={editing} />
                {editing && (
                  <p className="text-[11px] text-muted-foreground -mt-1">Click or drag to upload a photo</p>
                )}
                {editing ? <Input value={profile.name} onChange={e=>p("name")(e.target.value)} className="text-center font-semibold max-w-[180px]"/>
                  : <h2 className="font-bold text-lg">{profile.name}</h2>}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <Badge className="bg-destructive hover:bg-destructive text-white">Super Admin</Badge>
                  <Badge variant="outline">{profile.title}</Badge>
                </div>
                <Separator className="w-full"/>
                <div className="w-full space-y-2 text-left text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Mail className="size-3.5 text-primary flex-shrink-0"/><span className="truncate">{profile.email}</span></div>
                  <div className="flex items-center gap-2"><Phone className="size-3.5 text-primary flex-shrink-0"/><span>{profile.phone}</span></div>
                  <div className="flex items-center gap-2"><Globe className="size-3.5 text-primary flex-shrink-0"/><span>{profile.company}</span></div>
                  <div className="flex items-center gap-2"><Building2 className="size-3.5 text-primary flex-shrink-0"/><span>{profile.location}</span></div>
                  <div className="flex items-center gap-2"><CalendarDays className="size-3.5 text-primary flex-shrink-0"/><span>Joined {profile.joined}</span></div>
                </div>
                <Separator className="w-full"/>
                <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive"><LogOut className="size-3.5"/> Sign Out</Button>
              </CardContent>
            </Card>
            <div className="xl:col-span-3 flex flex-col gap-6">
              <Card>
                <CardHeader className="pb-3 flex-row items-center gap-2"><User className="size-4 text-muted-foreground"/><CardTitle className="text-base">Account Details</CardTitle></CardHeader>
                <Separator/>
                <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {([["Display Name","name"],["Job Title","title"],["Email","email"],["Phone","phone"],["Location","location"],["Timezone","timezone"]] as [string,keyof typeof profile][]).map(([label,key])=>(
                    <div key={key} className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">{label}</Label>
                      {editing ? <Input value={profile[key]} onChange={e=>p(key)(e.target.value)} className="h-8 text-sm"/>
                        : <p className="text-sm font-medium">{profile[key]}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
              {/* API status + Storage */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3 flex-row items-center gap-2"><PlugZap className="size-4 text-muted-foreground"/><CardTitle className="text-sm">API Integrations</CardTitle></CardHeader>
                  <CardContent className="space-y-2">
                    {[{name:"Razorpay",ok:true},{name:"MSG91 SMS",ok:true},{name:"AWS SES",ok:true},{name:"Google Maps",ok:false},{name:"Sentry",ok:true}].map(api=>(
                      <div key={api.name} className="flex items-center justify-between text-xs">
                        <span className="font-medium">{api.name}</span>
                        <span className={cn("flex items-center gap-1 font-semibold",api.ok?"text-success-foreground":"text-destructive")}>
                          <span className={cn("size-1.5 rounded-full inline-block",api.ok?"bg-[var(--ef-green)]":"bg-destructive")} aria-hidden="true"/>{api.ok?"Connected":"Not Set"}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3 flex-row items-center gap-2"><Database className="size-4 text-muted-foreground"/><CardTitle className="text-sm">Storage</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {[{label:"Database",used:68,total:"100 GB",color:"bg-primary"},{label:"File Storage",used:34,total:"500 GB",color:"bg-[var(--ef-green)]"},{label:"Backups",used:22,total:"200 GB",color:"bg-[var(--ef-purple)]"}].map(s=>(
                      <div key={s.label} className="space-y-1">
                        <div className="flex justify-between text-xs"><span className="text-muted-foreground">{s.label}</span><span className={cn("font-bold",s.used>80?"text-destructive":"")}>{s.used}% of {s.total}</span></div>
                        <Progress value={s.used} className={cn("h-1.5",s.used>80?"[&>div]:bg-destructive":s.used>60?"[&>div]:bg-[var(--ef-amber)]":`[&>div]:${s.color}`)}/>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
              {/* Quick actions */}
              <Card>
                <CardHeader className="pb-3 flex-row items-center gap-2"><Zap className="size-4 text-muted-foreground"/><CardTitle className="text-sm">Quick Actions</CardTitle></CardHeader>
                <Separator/>
                <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {[{label:"All Schools",icon:Building2,href:"/super-admin/tenants"},{label:"Billing",icon:TrendingUp,href:"/super-admin/billing"},{label:"Health",icon:PlugZap,href:"/super-admin/health"},{label:"Audit Log",icon:Activity,href:"/super-admin/audit"},{label:"Affiliates",icon:HeartHandshake,href:"/super-admin/affiliates"},{label:"Backup",icon:Database,href:"/super-admin/backup"},{label:"Emergency",icon:AlertTriangle,href:"/super-admin/emergency"},{label:"Analytics",icon:BarChart3,href:"/super-admin/analytics"},{label:"Settings",icon:Settings,href:"/super-admin/settings"}].map(item=>(
                    <Button key={item.label} variant="outline" size="sm" className="h-12 flex-col gap-1 text-xs" asChild>
                      <Link href={item.href}><item.icon className="size-3.5"/>{item.label}</Link>
                    </Button>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* PLATFORM */}
        {tab==="platform" && (
          <div className="flex flex-col gap-6">
            {/* Proxy Caps + Attendance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3 flex-row items-center gap-2"><Users className="size-4 text-primary"/><CardTitle className="text-base">Default Proxy Caps</CardTitle></CardHeader>
                <Separator/><CardContent className="pt-4 flex flex-col gap-4">
                  <p className="text-xs text-muted-foreground">Default values for all new tenant schools. Schools can override.</p>
                  <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-4">
                    {(["daily","weekly","monthly"] as const).map(k=>(
                      <div key={k}><Label className="capitalize">{k} Cap</Label>
                        <Input className="mt-1.5" type="number" value={proxyCaps[k]} onChange={e=>setProxyCaps(c=>({...c,[k]:+e.target.value}))}/>
                        <p className="text-xs text-muted-foreground mt-1">Per teacher</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3 flex-row items-center gap-2"><BookOpen className="size-4 text-primary"/><CardTitle className="text-base">Default Attendance Config</CardTitle></CardHeader>
                <Separator/><CardContent className="pt-4 flex flex-col gap-4">
                  <p className="text-xs text-muted-foreground">Platform default for new schools.</p>
                  <div className="grid grid-cols-2 gap-3">
                    {(["per-period","single-daily"] as const).map(mode=>(
                      <button key={mode} onClick={()=>setAttMode(mode)} className={cn("px-3.5 py-3 rounded-lg border-[1.5px] text-left transition-colors",attMode===mode?"border-primary bg-ef-brand-light":"border-border bg-card")}>
                        <div className={cn("text-sm font-bold",attMode===mode?"text-primary":"")}>{mode==="per-period"?"Per Period":"Single Daily"}</div>
                        <div className="text-[11px] text-muted-foreground/70 mt-0.5">{mode==="per-period"?"Mark per each period":"Mark once daily"}</div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* SMS + Email */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-3 flex-row items-center gap-2"><MessageSquare className="size-4 text-ef-green"/><CardTitle className="text-base">SMS Provider (MSG91)</CardTitle></CardHeader>
                <Separator/><CardContent className="pt-4 flex flex-col gap-3">
                  <div><Label>API Key (Global Fallback)</Label><Input className="mt-1.5" type="password" defaultValue="msg91_global_xxxxxxxx"/></div>
                  <div><Label>Sender ID</Label><Input className="mt-1.5" defaultValue="EDUFLW"/></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Max SMS / day</Label><Input className="mt-1.5" type="number" defaultValue={500}/></div>
                    <div><Label>Retry attempts</Label><Input className="mt-1.5" type="number" defaultValue={3}/></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3 flex-row items-center gap-2"><Mail className="size-4 text-primary"/><CardTitle className="text-base">Email Provider (AWS SES)</CardTitle></CardHeader>
                <Separator/><CardContent className="pt-4 flex flex-col gap-3">
                  <div><Label>SES Region</Label><Input className="mt-1.5" defaultValue="ap-south-1"/></div>
                  <div><Label>From Address</Label><Input className="mt-1.5" defaultValue="no-reply@eduflowscholaris.com" type="email"/></div>
                  <div><Label>Reply-To</Label><Input className="mt-1.5" defaultValue="support@eduflowscholaris.com" type="email"/></div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-ef-green-light rounded-lg text-xs text-ef-green-dark"><Shield className="size-3"/> SES verified and active</div>
                </CardContent>
              </Card>
            </div>
            {/* Email Templates */}
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Mail className="size-4 text-primary"/><CardTitle className="text-base">Email Templates</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border">
                {TEMPLATES.map(t=>(
                  <div key={t.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-ef-brand-light text-primary flex items-center justify-center flex-shrink-0">{t.icon}</div>
                      <div><p className="text-sm font-semibold">{t.name}</p><p className="text-xs text-muted-foreground">{t.trigger}</p></div>
                    </div>
                    <Button size="sm" variant="ghost"><ChevronRight className="size-3.5"/></Button>
                  </div>
                ))}
              </CardContent>
            </Card>
            {/* API Keys */}
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Key className="size-4 text-ef-purple"/><CardTitle className="text-base">API Keys & Integrations</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="p-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
                  {API_KEYS.map(k=>(
                    <div key={k.label} className="flex items-center gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold">{k.label}</div>
                        <div className="font-mono text-[11px] text-muted-foreground/70 mt-0.5 truncate">{k.value}</div>
                      </div>
                      <div className="flex gap-2 items-center flex-shrink-0">
                        {k.verified
                          ? <span className="text-[11px] text-ef-green-dark flex items-center gap-1"><Shield className="size-3"/> OK</span>
                          : <span className="text-[11px] text-ef-amber-dark flex items-center gap-1"><AlertTriangle className="size-3"/> Not Set</span>}
                        <Button size="sm" variant="secondary">Update</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            {/* Branding */}
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Palette className="size-4 text-ef-purple"/><CardTitle className="text-base">Platform Branding</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div><Label>Platform Name</Label><Input className="mt-1.5" defaultValue="EduFlow Scholaris"/></div>
                <div><Label>Support Email</Label><Input className="mt-1.5" defaultValue="support@eduflowscholaris.com" type="email"/></div>
                <div><Label>Support Phone</Label><Input className="mt-1.5" defaultValue="+91 9876543210"/></div>
                <div><Label>App URL</Label><Input className="mt-1.5" defaultValue="https://app.eduflowscholaris.com"/></div>
                <div><Label>Marketing Site</Label><Input className="mt-1.5" defaultValue="https://eduflowscholaris.com"/></div>
              </CardContent>
            </Card>
            {/* Feature Flags */}
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><ToggleLeft className="size-4 text-primary"/><CardTitle className="text-base">Feature Flags</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0">
                {FEATURES.map((f,i)=>{
                  const isDanger=f.name==="Maintenance Mode"
                  return (
                    <div key={f.name} className={cn("flex items-center gap-4 py-3.5 px-2",isDanger&&"mt-2 border-t-2 border-ef-red", i%2===1&&"lg:border-l lg:border-border lg:pl-6")}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-sm font-semibold",isDanger&&"text-ef-red-dark")}>{f.name}</p>
                          <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded",TAG_CLS[f.tag]||TAG_CLS.Core)}>{f.tag}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                      </div>
                      <Switch checked={featureStates[f.name]} onCheckedChange={()=>toggleFeature(f.name)} className={isDanger?"data-[state=checked]:bg-destructive":""}/>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab==="notifs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Bell className="size-4 text-muted-foreground"/><CardTitle className="text-base">Platform Events</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4">
                <ToggleRow label="New tenant signup"     sub="When a school registers"           checked={notifs.tenantSignup}    onChange={()=>setNotifs(n=>({...n,tenantSignup:!n.tenantSignup}))}/>
                <ToggleRow label="Payment failures"      sub="Razorpay failed transactions"      checked={notifs.paymentFailed}   onChange={()=>setNotifs(n=>({...n,paymentFailed:!n.paymentFailed}))}/>
                <ToggleRow label="Trial expiry warnings" sub="7 days before trial ends"          checked={notifs.trialExpiry}     onChange={()=>setNotifs(n=>({...n,trialExpiry:!n.trialExpiry}))}/>
                <ToggleRow label="System alerts"         sub="Downtime or service degradation"   checked={notifs.systemAlert}     onChange={()=>setNotifs(n=>({...n,systemAlert:!n.systemAlert}))}/>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Database className="size-4 text-muted-foreground"/><CardTitle className="text-base">Operations</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4">
                <ToggleRow label="Affiliate payout requests" sub="When affiliate requests payout"   checked={notifs.affiliatePayout} onChange={()=>setNotifs(n=>({...n,affiliatePayout:!n.affiliatePayout}))}/>
                <ToggleRow label="Backup completion"        sub="Automated backup success/fail"    checked={notifs.backupComplete}  onChange={()=>setNotifs(n=>({...n,backupComplete:!n.backupComplete}))}/>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Mail className="size-4 text-muted-foreground"/><CardTitle className="text-base">Channels</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4">
                <ToggleRow label="Email digest"      sub="Daily platform summary email"   checked={notifs.emailDigest} onChange={()=>setNotifs(n=>({...n,emailDigest:!n.emailDigest}))}/>
                <ToggleRow label="SMS urgent alerts" sub="Critical incidents only"        checked={notifs.smsUrgent}   onChange={()=>setNotifs(n=>({...n,smsUrgent:!n.smsUrgent}))}/>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SECURITY */}
        {tab==="security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Lock className="size-4 text-muted-foreground"/><CardTitle className="text-base">Security Settings</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4 space-y-3">
                <ToggleRow label="Two-factor authentication" sub="TOTP via Authenticator app — highly recommended" checked={security.twoFactor}       onChange={()=>setSecurity(v=>({...v,twoFactor:!v.twoFactor}))}/>
                <ToggleRow label="IP allowlist"              sub="Restrict login to approved IPs only"             checked={security.ipAllowlist}     onChange={()=>setSecurity(v=>({...v,ipAllowlist:!v.ipAllowlist}))}/>
                <ToggleRow label="Audit all data exports"   sub="Log every CSV / PDF export action"               checked={security.auditAllExports}  onChange={()=>setSecurity(v=>({...v,auditAllExports:!v.auditAllExports}))}/>
                <ToggleRow label="Session change alerts"    sub="Email when new device logs in"                   checked={security.sessionAlerts}    onChange={()=>setSecurity(v=>({...v,sessionAlerts:!v.sessionAlerts}))}/>
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
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive border-destructive/30"><LogOut className="size-3.5"/> Sign Out All Sessions</Button>
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
              <div className="p-4 border-t border-border">
                <Button variant="ghost" size="sm" className="w-full text-xs" asChild>
                  <Link href="/super-admin/audit">Full audit log <ChevronRight className="size-3"/></Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}
