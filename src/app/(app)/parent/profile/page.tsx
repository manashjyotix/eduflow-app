"use client"

import { useState } from "react"
import {
  User, Mail, Phone, Building2, CalendarDays, Shield, Bell,
  Lock, Key, Pencil, Save, X, CheckCircle, GraduationCap, Receipt,
  Eye, EyeOff, LogOut, Download, ChevronRight, CreditCard,
  Heart, BookOpen, TrendingUp, AlertTriangle,
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
import { cn }         from "@/lib/utils"

const TABS = [
  { id:"profile",   label:"Profile",       icon:User         },
  { id:"child",     label:"My Child",      icon:GraduationCap},
  { id:"fees",      label:"Fees",          icon:Receipt      },
  { id:"notifs",    label:"Notifications", icon:Bell         },
  { id:"security",  label:"Security",      icon:Lock         },
] as const
type Tab = typeof TABS[number]["id"]

const CHILD = {
  name:"Rohit Das", class:"VIII-A", roll:12,
  admissionNo:"HCEA/2020/048", attendance:84.6,
  dob:"March 15, 2012", bloodGroup:"O+",
  school:"Holy Child English Academy, Howly",
  classTeacher:"Priya Sharma", section:"High Section",
}
const FEE_HISTORY = [
  { month:"April 2026",  amount:3200, status:"paid"    as const },
  { month:"March 2026",  amount:3200, status:"paid"    as const },
  { month:"May 2026",    amount:2500, status:"overdue" as const },
  { month:"June 2026",   amount:500,  status:"pending" as const },
]
const STATUS_CLS: Record<string,string> = {
  paid:   "bg-[var(--ef-green-light)] text-[var(--ef-green-dark)]",
  overdue:"bg-[var(--ef-red-light)] text-[var(--ef-red-dark)]",
  pending:"bg-[var(--ef-amber-light)] text-warning-foreground",
}
const PAYMENT_METHODS = [
  { type:"UPI",  detail:"pankaj@upi",           primary:true  },
  { type:"Card", detail:"•••• •••• •••• 4242", primary:false },
]
const SESSIONS = [
  { device:"Chrome on Android",  location:"Howly, Assam",lastActive:"Active now",  current:true  },
  { device:"Safari on iPhone 13",location:"Howly, Assam",lastActive:"1 day ago",   current:false },
]

function ToggleRow({label,sub,checked,onChange}:{label:string;sub:string;checked:boolean;onChange:()=>void}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="min-w-0 flex-1 pr-4"><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">{sub}</p></div>
      <Switch checked={checked} onCheckedChange={onChange}/>
    </div>
  )
}

export default function ParentProfilePage() {
  const [tab,       setTab]      = useState<Tab>("profile")
  const [editing,   setEditing]  = useState(false)
  const [showPw,    setShowPw]   = useState(false)
  const [showCurPw, setShowCurPw]= useState(false)
  const [showNewPw, setShowNewPw]= useState(false)
  const [saved,     setSaved]    = useState(false)

  const [profile, setProfile] = useState({
    name:"Pankaj Das", email:"parent@hcea.edu", phone:"+91 76543 21098",
    altPhone:"+91 65432 10987", occupation:"Government Employee",
    relation:"Father", address:"Howly, Barpeta, Assam – 781316",
  })
  const [notifs, setNotifs] = useState({
    feeReminders:true, attendanceAlert:true, examSchedule:true,
    reportCard:true, ptmNotice:true, generalNotices:false,
    smsAlerts:true, whatsappAlerts:true, emailDigest:false,
  })
  const [privacy, setPrivacy] = useState({ shareContact:true, twoFactor:false })

  const p = (k:keyof typeof profile)=>(v:string)=>setProfile(prev=>({...prev,[k]:v}))
  function save() { setSaved(true); setEditing(false); setTimeout(()=>setSaved(false),3000) }
  const totalDue = FEE_HISTORY.filter(f=>f.status!=="paid").reduce((s,f)=>s+f.amount,0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between gap-4 flex-wrap px-4 pt-6 sm:px-6 md:px-8">
        <PageHeader icon={<User size={22}/>} title="Profile & Settings" subtitle="Parent account · Rohit Das, Class VIII-A"/>
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
        <KpiCard title="Attendance"    value={`${CHILD.attendance}%`} icon={<TrendingUp className="size-5"/>} iconClassName={CHILD.attendance>=85?"bg-success/15 text-success-foreground":"bg-warning/15 text-warning-foreground"} sparkline={{variant:"arc",value:CHILD.attendance,color:"var(--ef-green)"}}/>
        <KpiCard title="Fee Due"       value={totalDue>0?`₹${totalDue.toLocaleString("en-IN")}`:"Nil"} icon={<Receipt className="size-5"/>} iconClassName={totalDue>0?"bg-destructive/10 text-destructive":"bg-success/15 text-success-foreground"} subtitle={totalDue>0?"Due June 30":"All paid"}/>
        <KpiCard title="Exam In"       value="3d" subtitle="Mid-term: Jun 20" icon={<BookOpen className="size-5"/>} iconClassName="bg-primary/10 text-primary" sparkline={{variant:"arc",value:70,color:"var(--ef-purple)"}}/>
        <KpiCard title="Notifications" value="2"  subtitle="2 unread"         icon={<Bell className="size-5"/>}    iconClassName="bg-warning/15 text-warning-foreground"/>
      </div>

      {totalDue>0 && (
        <div className="px-4 sm:px-6 md:px-8 mt-4">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-5 text-destructive flex-shrink-0"/>
                <div><p className="text-sm font-semibold">Outstanding fee: ₹{totalDue.toLocaleString("en-IN")}</p>
                  <p className="text-xs text-muted-foreground">Deadline June 30 · 2% late fee applies after due date</p></div>
              </div>
              <Button size="sm" variant="destructive" asChild><Link href="/parent/fees">Pay Now</Link></Button>
            </CardContent>
          </Card>
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
                <AvatarUpload initials="PD" color="bg-[var(--ef-purple)]" editing={editing} />
                {editing && (
                  <p className="text-[11px] text-muted-foreground -mt-1">Click or drag to upload a photo</p>
                )}
                {editing ? <Input value={profile.name} onChange={e=>p("name")(e.target.value)} className="text-center font-semibold max-w-[180px]"/>
                  : <h2 className="font-bold text-lg">{profile.name}</h2>}
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <Badge className="bg-[var(--ef-purple)] hover:bg-[var(--ef-purple)] text-white">Parent</Badge>
                  <Badge variant="outline">{profile.relation} of {CHILD.name}</Badge>
                </div>
                <Separator className="w-full"/>
                <div className="w-full space-y-2 text-left text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Mail className="size-3.5 text-primary flex-shrink-0"/><span className="truncate">{profile.email}</span></div>
                  <div className="flex items-center gap-2"><Phone className="size-3.5 text-primary flex-shrink-0"/><span>{profile.phone}</span></div>
                  <div className="flex items-center gap-2"><Building2 className="size-3.5 text-primary flex-shrink-0"/><span className="text-xs">{profile.address}</span></div>
                  <div className="flex items-center gap-2"><CalendarDays className="size-3.5 text-primary flex-shrink-0"/><span>Joined March 2025</span></div>
                  <div className="flex items-center gap-2"><Heart className="size-3.5 text-primary flex-shrink-0"/><span>{profile.occupation}</span></div>
                </div>
                <Separator className="w-full"/>
                <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive"><LogOut className="size-3.5"/> Sign Out</Button>
              </CardContent>
            </Card>
            <Card className="xl:col-span-3">
              <CardHeader className="pb-3 flex-row items-center gap-2"><User className="size-4 text-muted-foreground"/><CardTitle className="text-base">Personal Details</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {([["Full Name","name"],["Relation","relation"],["Email","email"],["Phone","phone"],["Alt Phone","altPhone"],["Occupation","occupation"]] as [string,keyof typeof profile][]).map(([label,key])=>(
                  <div key={key} className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{label}</Label>
                    {editing ? <Input value={profile[key]} onChange={e=>p(key)(e.target.value)} className="h-8 text-sm"/>
                      : <p className="text-sm font-medium">{profile[key]}</p>}
                  </div>
                ))}
                <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Home Address</Label>
                  {editing ? <Input value={profile.address} onChange={e=>p("address")(e.target.value)} className="h-8 text-sm"/>
                    : <p className="text-sm font-medium">{profile.address}</p>}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* CHILD */}
        {tab==="child" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><GraduationCap className="size-4 text-muted-foreground"/><CardTitle className="text-base">Child Information</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base flex-shrink-0" aria-hidden="true">RD</div>
                  <div><p className="font-semibold">{CHILD.name}</p><p className="text-xs text-muted-foreground">Class {CHILD.class} · Roll No. {CHILD.roll}</p></div>
                </div>
                <Separator/>
                {[
                  ["Admission No.",CHILD.admissionNo],["Date of Birth",CHILD.dob],
                  ["Blood Group",CHILD.bloodGroup],["Class Teacher",CHILD.classTeacher],
                  ["Section",CHILD.section],["School",CHILD.school],
                ].map(([label,value])=>(
                  <div key={label} className="flex justify-between text-sm">
                    <span className="text-muted-foreground text-xs">{label}</span>
                    <span className="font-medium text-xs">{value}</span>
                  </div>
                ))}
                <Separator/>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" asChild><Link href="/parent/attendance"><TrendingUp className="size-3.5"/> Attendance</Link></Button>
                  <Button variant="outline" size="sm" asChild><Link href="/parent/report-card"><BookOpen className="size-3.5"/> Report Card</Link></Button>
                  <Button variant="outline" size="sm" asChild><Link href="/parent/exams"><CalendarDays className="size-3.5"/> Exams</Link></Button>
                  <Button variant="outline" size="sm" asChild><Link href="/parent/journal"><BookOpen className="size-3.5"/> Journal</Link></Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* FEES */}
        {tab==="fees" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base"><Receipt className="size-4 text-muted-foreground"/> Fee History</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs" asChild><Link href="/parent/fees">View all <ChevronRight className="size-3"/></Link></Button>
              </CardHeader>
              <Separator/>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {FEE_HISTORY.map((f,i)=>(
                    <li key={i} className="flex items-center justify-between px-5 py-3">
                      <div><p className="text-sm font-medium">{f.month}</p><p className="text-xs text-muted-foreground">Tuition + Exam Fee</p></div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold">₹{f.amount.toLocaleString("en-IN")}</span>
                        <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize",STATUS_CLS[f.status])}>{f.status}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><CreditCard className="size-4 text-muted-foreground"/><CardTitle className="text-base">Payment Methods</CardTitle></CardHeader>
              <Separator/>
              <CardContent className="pt-4 space-y-3">
                {PAYMENT_METHODS.map((pm,i)=>(
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{pm.type}</div>
                      <div><p className="text-sm font-medium">{pm.detail}</p>{pm.primary&&<p className="text-[10px] text-muted-foreground">Primary</p>}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pm.primary&&<Badge variant="secondary" className="text-[10px]">Primary</Badge>}
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive hover:text-destructive">Remove</Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm"><CreditCard className="size-3.5"/> Add Payment Method</Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab==="notifs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Bell className="size-4 text-muted-foreground"/><CardTitle className="text-base">School Alerts</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4">
                <ToggleRow label="Fee reminders"     sub="Due date & overdue alerts"        checked={notifs.feeReminders}    onChange={()=>setNotifs(n=>({...n,feeReminders:!n.feeReminders}))}/>
                <ToggleRow label="Attendance alerts" sub="When Rohit is absent"             checked={notifs.attendanceAlert} onChange={()=>setNotifs(n=>({...n,attendanceAlert:!n.attendanceAlert}))}/>
                <ToggleRow label="Exam schedule"     sub="Exam dates & timetable updates"   checked={notifs.examSchedule}   onChange={()=>setNotifs(n=>({...n,examSchedule:!n.examSchedule}))}/>
                <ToggleRow label="Report card"       sub="When results are published"       checked={notifs.reportCard}     onChange={()=>setNotifs(n=>({...n,reportCard:!n.reportCard}))}/>
                <ToggleRow label="PTM notices"       sub="Parent-Teacher Meeting schedules" checked={notifs.ptmNotice}      onChange={()=>setNotifs(n=>({...n,ptmNotice:!n.ptmNotice}))}/>
                <ToggleRow label="General notices"   sub="All other school notices"         checked={notifs.generalNotices} onChange={()=>setNotifs(n=>({...n,generalNotices:!n.generalNotices}))}/>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Mail className="size-4 text-muted-foreground"/><CardTitle className="text-base">Channels</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4">
                <ToggleRow label="SMS alerts"      sub="Instant SMS via MSG91"            checked={notifs.smsAlerts}      onChange={()=>setNotifs(n=>({...n,smsAlerts:!n.smsAlerts}))}/>
                <ToggleRow label="WhatsApp alerts" sub="Important updates on WhatsApp"    checked={notifs.whatsappAlerts} onChange={()=>setNotifs(n=>({...n,whatsappAlerts:!n.whatsappAlerts}))}/>
                <ToggleRow label="Email digest"    sub="Weekly summary email"             checked={notifs.emailDigest}    onChange={()=>setNotifs(n=>({...n,emailDigest:!n.emailDigest}))}/>
              </CardContent>
            </Card>
          </div>
        )}

        {/* SECURITY */}
        {tab==="security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Lock className="size-4 text-muted-foreground"/><CardTitle className="text-base">Privacy & Password</CardTitle></CardHeader>
              <Separator/><CardContent className="pt-4 space-y-3">
                <ToggleRow label="Share contact with teachers" sub="Class teacher can see your phone number"  checked={privacy.shareContact} onChange={()=>setPrivacy(v=>({...v,shareContact:!v.shareContact}))}/>
                <ToggleRow label="Two-factor authentication"   sub="Extra security via OTP on login"         checked={privacy.twoFactor}    onChange={()=>setPrivacy(v=>({...v,twoFactor:!v.twoFactor}))}/>
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
                <div className="flex gap-2 pt-1"><Button variant="outline" size="sm"><Download className="size-3.5"/> Download Data</Button></div>
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

      </div>
    </div>
  )
}
