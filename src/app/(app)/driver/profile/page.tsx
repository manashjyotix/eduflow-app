"use client"

import { useState } from "react"
import {
  User, Mail, Phone, Building2, CalendarDays, Shield, Bell,
  Lock, Key, Save, CheckCircle, Bus, MapPin, Eye, EyeOff,
  LogOut, ChevronRight, Navigation, Clock, RotateCcw, IdCard,
  Activity, Briefcase,
} from "lucide-react"
import Link from "next/link"
import { AvatarUpload } from "@/components/shared/avatar-upload"
import { ScrollX } from "@/components/shared/scroll-x"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useRole } from "@/context/role-context"
import { getVehicleForDriver, getRoute, DEMO_DRIVER_ID } from "@/data/mock-transport"

const TABS = [
  { id: "profile",  label: "Profile",       icon: User     },
  { id: "vehicle",  label: "Vehicle",       icon: Bus      },
  { id: "notifs",   label: "Notifications", icon: Bell     },
  { id: "security", label: "Security",      icon: Lock     },
  { id: "activity", label: "Activity",      icon: Activity },
] as const
type Tab = typeof TABS[number]["id"]

const SESSIONS = [
  { device: "Chrome on Android", location: "Howly, Assam", lastActive: "Active now",  current: true  },
  { device: "Safari on iPhone",  location: "Howly, Assam", lastActive: "2 hours ago", current: false },
]

const ACTIVITY_LOG = [
  { action: "Trip started: Howly Main → HCEA",       time: "Today, 7:45 AM",    type: "trip"    },
  { action: "Drop confirmed: 12 students",           time: "Today, 8:30 AM",    type: "drop"    },
  { action: "Return trip completed",                 time: "Today, 3:20 PM",    type: "trip"    },
  { action: "SOS resolved: Rohit Das (Route 1)",     time: "Yesterday, 8:10 AM",type: "sos"     },
  { action: "Vehicle inspection logged",             time: "Jun 25, 7:30 AM",   type: "inspect" },
]
const LOG_CLS: Record<string, string> = {
  trip:    "bg-primary/10 text-primary",
  drop:    "bg-ef-green-light text-ef-green-dark",
  sos:     "bg-destructive/10 text-destructive",
  inspect: "bg-ef-amber-light text-ef-amber-dark",
}

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

function Field({
  label, value, onChange, icon, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void
  icon?: React.ReactNode; type?: string
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

export default function DriverProfilePage() {
  const { name, email, phone, department, joined, initials, avatarColor } = useRole()
  const vehicle = getVehicleForDriver(DEMO_DRIVER_ID)
  const route   = vehicle ? getRoute(vehicle.routeId) : undefined

  const [tab,       setTab]      = useState<Tab>("profile")
  const [showPw,    setShowPw]   = useState(false)
  const [showCurPw, setShowCurPw]= useState(false)
  const [showNewPw, setShowNewPw]= useState(false)
  const [saved,     setSaved]    = useState(false)

  const INITIAL_PROFILE = {
    name,
    email,
    phone,
    address: "Howly, Barpeta, Assam",
    licenseNo: "AS-15-20190001234",
    licenseExpiry: "2027-08-15",
    emergencyContact: "+91 98640 00099",
  }
  const [profile, setProfile] = useState(INITIAL_PROFILE)
  const [dirty, setDirty] = useState(false)

  const [notifs, setNotifs] = useState({
    tripStart: true, sosAlert: true, routeChange: true,
    smsUrgent: true, whatsappAlerts: true, inAppAll: true,
  })
  const [twoFactor, setTwoFactor] = useState(false)

  const p = (k: keyof typeof profile) => (v: string) => {
    setProfile(prev => ({ ...prev, [k]: v }))
    setDirty(true)
  }
  function save()  { setSaved(true); setDirty(false); setTimeout(() => setSaved(false), 3000) }
  function reset() { setProfile(INITIAL_PROFILE); setDirty(false) }

  const studentCount = route?.stops ? route.stops.length > 0 ? 12 : 0 : 0

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap px-4 pt-6 sm:px-6 md:px-8">
        <PageHeader
          icon={<User size={22} />}
          title="Profile & Settings"
          subtitle={`Driver account · ${route?.name ?? "Unassigned route"}`}
        />
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success-foreground font-medium flex-shrink-0 pb-2">
            <CheckCircle className="size-4" /> Changes saved
          </span>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 px-4 sm:px-6 md:px-8 pt-6">
        <KpiCard
          title="Assigned Route"
          value={vehicle?.label ?? "—"}
          subtitle={route?.name ?? "No route"}
          icon={<Navigation className="size-5" />}
          iconClassName="bg-[var(--ef-cyan-light)] text-[var(--ef-cyan)]"
        />
        <KpiCard
          title="Students on Route"
          value={studentCount}
          subtitle="Daily ridership"
          icon={<Bus className="size-5" />}
          iconClassName="bg-primary/10 text-primary"
          sparkline={{ variant: "bar", data: [10, 12, 11, 12, 12, studentCount], color: "var(--ef-brand)" }}
        />
        <KpiCard
          title="Trips Today"
          value="2"
          subtitle="Morning + afternoon"
          icon={<Clock className="size-5" />}
          iconClassName="bg-success/15 text-success-foreground"
        />
        <KpiCard
          title="Vehicle"
          value={vehicle?.regNo ?? "—"}
          subtitle={vehicle ? `${vehicle.type === "bus" ? "Bus" : "Van"} · Cap. ${vehicle.capacity}` : "Unassigned"}
          icon={<Bus className="size-5" />}
          iconClassName="bg-ef-amber-light text-ef-amber-dark"
        />
      </div>

      {/* Tab nav */}
      <div className="px-4 sm:px-6 md:px-8 mt-6">
        <Tabs value={tab} onValueChange={v => setTab(v as Tab)}>
          <ScrollX>
            <TabsList className="w-max">
              {TABS.map(t => (
                <TabsTrigger key={t.id} value={t.id} className="gap-1.5">
                  <t.icon className="size-3.5" />{t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollX>
        </Tabs>
      </div>

      <div className="px-4 sm:px-6 md:px-8 py-6">

        {/* ══ PROFILE ══ */}
        {tab === "profile" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* ── Summary card ── */}
            <Card className="xl:col-span-1 h-fit overflow-hidden pt-0 gap-0">
              <div className="h-24 bg-gradient-to-br from-[var(--ef-cyan)] to-primary relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]" aria-hidden="true" />
              </div>
              <CardContent className="px-6 pb-6 flex flex-col items-center text-center gap-3">
                <div className="-mt-14">
                  <AvatarUpload initials={initials} color={avatarColor} editing />
                </div>
                <p className="text-[11px] text-muted-foreground -mt-1">Tap the camera icon to upload a photo</p>
                <div className="space-y-0.5">
                  <h2 className="font-bold text-lg leading-tight">{profile.name}</h2>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <Badge className="bg-[var(--ef-cyan)] hover:bg-[var(--ef-cyan)] text-white">Driver</Badge>
                  {route && <Badge variant="outline">{route.name}</Badge>}
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-base font-bold leading-none">{studentCount}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Students</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-base font-bold leading-none">{vehicle?.label ?? "—"}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Vehicle</p>
                  </div>
                </div>

                <Separator className="w-full" />
                <div className="w-full space-y-2.5 text-left text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Phone className="size-3.5 text-primary flex-shrink-0" /><span>{profile.phone}</span></div>
                  <div className="flex items-start gap-2"><MapPin className="size-3.5 text-primary flex-shrink-0 mt-0.5" /><span>{profile.address}</span></div>
                  <div className="flex items-center gap-2"><Building2 className="size-3.5 text-primary flex-shrink-0" /><span>{department}</span></div>
                  <div className="flex items-center gap-2"><IdCard className="size-3.5 text-primary flex-shrink-0" /><span>Lic: {profile.licenseNo}</span></div>
                  <div className="flex items-center gap-2"><CalendarDays className="size-3.5 text-primary flex-shrink-0" /><span>Joined {joined}</span></div>
                </div>
                <Separator className="w-full" />
                <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive" asChild>
                  <Link href="/login"><LogOut className="size-3.5" /> Sign Out</Link>
                </Button>
              </CardContent>
            </Card>

            {/* ── Editable details ── */}
            <Card className="xl:col-span-3">
              <CardHeader className="pb-3 flex-row items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Personal Details</CardTitle>
                {dirty && <Badge variant="secondary" className="ml-auto text-[10px]">Unsaved changes</Badge>}
              </CardHeader>
              <Separator />
              <CardContent className="pt-5 space-y-6">
                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <IdCard className="size-3.5" /> Driver Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field label="Full Name"       value={profile.name}          onChange={p("name")}          icon={<User className="size-3.5" />} />
                    <Field label="License Number"  value={profile.licenseNo}     onChange={p("licenseNo")}     icon={<IdCard className="size-3.5" />} />
                    <Field label="License Expiry"  value={profile.licenseExpiry} onChange={p("licenseExpiry")} icon={<CalendarDays className="size-3.5" />} type="date" />
                  </div>
                </section>

                <Separator />

                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Phone className="size-3.5" /> Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field label="Email"             value={profile.email}            onChange={p("email")}            icon={<Mail className="size-3.5" />} type="email" />
                    <Field label="Phone"             value={profile.phone}            onChange={p("phone")}            icon={<Phone className="size-3.5" />} type="tel" />
                    <Field label="Emergency Contact" value={profile.emergencyContact} onChange={p("emergencyContact")} icon={<Phone className="size-3.5" />} type="tel" />
                    <div className="sm:col-span-2 lg:col-span-3">
                      <Field label="Home Address" value={profile.address} onChange={p("address")} icon={<MapPin className="size-3.5" />} />
                    </div>
                  </div>
                </section>
              </CardContent>
              <Separator />
              <div className="flex items-center justify-end gap-2 px-5 py-4">
                {saved && (
                  <span className="flex items-center gap-1.5 text-sm text-success-foreground font-medium mr-auto">
                    <CheckCircle className="size-4" /> Saved
                  </span>
                )}
                <Button variant="outline" size="sm" onClick={reset} disabled={!dirty}>
                  <RotateCcw className="size-4" /> Reset
                </Button>
                <Button size="sm" onClick={save} disabled={!dirty}>
                  <Save className="size-4" /> Update Profile
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* ══ VEHICLE ══ */}
        {tab === "vehicle" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2">
                <Bus className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Assigned Vehicle</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                {vehicle ? (
                  <>
                    {[
                      ["Vehicle Label",    vehicle.label],
                      ["Registration No.", vehicle.regNo],
                      ["Type",             vehicle.type === "bus" ? "School Bus" : "Van"],
                      ["Capacity",         `${vehicle.capacity} students`],
                      ["Route",            route?.name ?? "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-sm font-medium">{value}</span>
                      </div>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No vehicle assigned.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2">
                <Navigation className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Route Stops</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="p-0">
                {route?.stops?.length ? (
                  <ul className="divide-y divide-border">
                    {route.stops.map(stop => (
                      <li key={stop.seq} className="flex items-center gap-3 px-4 py-3">
                        <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                          {stop.seq}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{stop.name}</p>
                        </div>
                        <Briefcase className="size-3.5 text-muted-foreground flex-shrink-0" />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground p-4">No stops configured.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══ NOTIFICATIONS ══ */}
        {tab === "notifs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Bell className="size-4 text-muted-foreground" /><CardTitle className="text-base">Trip Alerts</CardTitle></CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <ToggleRow label="Trip start/end"      sub="Reminder when daily trip begins"       checked={notifs.tripStart}    onChange={() => setNotifs(n => ({ ...n, tripStart:    !n.tripStart }))} />
                <ToggleRow label="SOS alerts"          sub="Immediate alert when a student SOS fires" checked={notifs.sosAlert}  onChange={() => setNotifs(n => ({ ...n, sosAlert:     !n.sosAlert }))} />
                <ToggleRow label="Route change alerts" sub="When route is modified by admin"       checked={notifs.routeChange}  onChange={() => setNotifs(n => ({ ...n, routeChange:  !n.routeChange }))} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Phone className="size-4 text-muted-foreground" /><CardTitle className="text-base">Channels</CardTitle></CardHeader>
              <Separator />
              <CardContent className="pt-4">
                <ToggleRow label="SMS alerts"      sub="Critical updates via MSG91"       checked={notifs.smsUrgent}      onChange={() => setNotifs(n => ({ ...n, smsUrgent:      !n.smsUrgent }))} />
                <ToggleRow label="WhatsApp alerts" sub="Route & SOS updates on WhatsApp"  checked={notifs.whatsappAlerts} onChange={() => setNotifs(n => ({ ...n, whatsappAlerts: !n.whatsappAlerts }))} />
                <ToggleRow label="All in-app"      sub="Badge + notification panel"       checked={notifs.inAppAll}       onChange={() => setNotifs(n => ({ ...n, inAppAll:       !n.inAppAll }))} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══ SECURITY ══ */}
        {tab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Shield className="size-4 text-muted-foreground" /><CardTitle className="text-base">Account Security</CardTitle></CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                <ToggleRow label="Two-Factor Authentication" sub="TOTP via Authenticator app" checked={twoFactor} onChange={() => setTwoFactor(v => !v)} />
                <Separator />
                <Button variant="ghost" size="sm" className="justify-start w-full text-xs" onClick={() => setShowPw(v => !v)}>
                  <Key className="size-3.5" /> Change Password
                  <ChevronRight className={cn("size-3.5 ml-auto transition-transform", showPw && "rotate-90")} />
                </Button>
                {showPw && (
                  <div className="space-y-3 pl-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Current Password</Label>
                      <div className="relative">
                        <Input type={showCurPw ? "text" : "password"} className="h-8 pr-8 text-xs" placeholder="••••••••" />
                        <Button variant="ghost" size="icon-sm" className="absolute right-2.5 -translate-y-1/2 h-auto w-auto hover:bg-transparent" onClick={() => setShowCurPw(v => !v)} aria-label={showCurPw ? "Hide" : "Show"}>
                          {showCurPw ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">New Password</Label>
                      <div className="relative">
                        <Input type={showNewPw ? "text" : "password"} className="h-8 pr-8 text-xs" placeholder="Min 8 chars" />
                        <Button variant="ghost" size="icon-sm" className="absolute right-2.5 -translate-y-1/2 h-auto w-auto hover:bg-transparent" onClick={() => setShowNewPw(v => !v)} aria-label={showNewPw ? "Hide" : "Show"}>
                          {showNewPw ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                        </Button>
                      </div>
                    </div>
                    <Input type="password" className="h-8 text-xs" placeholder="Confirm new password" />
                    <Button size="sm"><Save className="size-3.5" /> Update Password</Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2"><Shield className="size-4 text-muted-foreground" /><CardTitle className="text-base">Active Sessions</CardTitle></CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                {SESSIONS.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                    <div className={cn("size-2 rounded-full flex-shrink-0", s.current ? "bg-[var(--ef-green)]" : "bg-muted-foreground/50")} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{s.device}</p>
                      <p className="text-[10px] text-muted-foreground">{s.location} · {s.lastActive}</p>
                    </div>
                    {s.current
                      ? <Badge variant="secondary" className="text-[10px]">Current</Badge>
                      : <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive hover:text-destructive">Revoke</Button>}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ══ ACTIVITY ══ */}
        {tab === "activity" && (
          <Card>
            <CardHeader className="pb-3 flex-row items-center gap-2"><Activity className="size-4 text-muted-foreground" /><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {ACTIVITY_LOG.map((entry, i) => (
                  <li key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className={cn("size-8 rounded-lg flex items-center justify-center flex-shrink-0", LOG_CLS[entry.type] ?? "bg-muted text-muted-foreground")}>
                      <Activity className="size-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{entry.action}</p>
                      <p className="text-xs text-muted-foreground">{entry.time}</p>
                    </div>
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
