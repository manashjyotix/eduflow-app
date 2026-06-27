"use client"

import { useState } from "react"
import {
  User, Mail, Phone, Building2, CalendarDays, Shield, Bell,
  Lock, Key, Save, CheckCircle, GraduationCap, Receipt,
  Eye, EyeOff, LogOut, Download, ChevronRight, CreditCard,
  Heart, BookOpen, TrendingUp, AlertTriangle, Bus,
  MapPin, Briefcase, IdCard, Users, Globe, Cake, Languages, RotateCcw,
  LocateFixed, Loader2,
} from "lucide-react"
import Link from "next/link"
import { AvatarUpload } from "@/components/shared/avatar-upload"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard }    from "@/components/shared/kpi-card"
import { ClassJournalView } from "@/components/parent/class-journal-view"
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
import { ScrollX } from "@/components/shared/scroll-x"
import { cn }         from "@/lib/utils"
import { useChild, type MockChild } from "@/context/child-context"
import {
  CHILD_PROFILES,
  CHILD_FEE_HISTORY,
  FEE_STATUS_CLASSES,
  type ChildProfile,
  type FeeRecord,
} from "@/data/mock-parent"

// ─── Tab config ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "profile",  label: "Profile",       icon: User          },
  { id: "child",    label: "My Children",   icon: GraduationCap },
  { id: "journal",  label: "Journal",       icon: BookOpen      },
  { id: "fees",     label: "Fees",          icon: Receipt       },
  { id: "notifs",   label: "Notifications", icon: Bell          },
  { id: "security", label: "Security",      icon: Lock          },
] as const
type Tab = typeof TABS[number]["id"]

// ─── Payment methods + sessions (shared across children) ────────────────────────

const PAYMENT_METHODS = [
  { type: "UPI",  detail: "pankaj@upi",           primary: true  },
  { type: "Card", detail: "•••• •••• •••• 4242",  primary: false },
]
const SESSIONS = [
  { device: "Chrome on Android",   location: "Howly, Assam", lastActive: "Active now", current: true  },
  { device: "Safari on iPhone 13", location: "Howly, Assam", lastActive: "1 day ago",  current: false },
]

// ─── Select option lists ────────────────────────────────────────────────────────

const RELATIONS      = ["Father", "Mother", "Guardian", "Grandfather", "Grandmother", "Uncle", "Aunt", "Other"]
const GENDERS        = ["Male", "Female", "Other", "Prefer not to say"]
const LANGUAGES_LIST = [
  "Assamese", "Bengali", "Hindi", "English", "Bodo", "Nepali", "Manipuri (Meitei)",
  "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Gujarati", "Punjabi",
  "Odia", "Urdu", "Sanskrit", "Konkani", "Kashmiri", "Sindhi", "Maithili",
  "Santali", "Dogri", "Other",
]
const NATIONALITIES  = ["Indian", "Bhutanese", "Nepalese", "Bangladeshi", "Other"]
const QUALIFICATIONS = [
  "Below 10th", "10th Pass (SSLC)", "12th Pass (HSSLC)", "ITI", "Diploma",
  "B.A.", "B.Com", "B.Sc", "B.Tech / B.E.", "BBA", "BCA", "B.Ed", "LLB",
  "MBBS", "B.Pharm", "M.A.", "M.Com", "M.Sc", "M.Tech", "MBA", "MCA", "M.Ed",
  "LLM", "MD", "Ph.D", "Other",
]
const OCCUPATIONS    = ["Government Employee", "Private Employee", "Business", "Self-Employed", "Farmer", "Doctor", "Engineer", "Teacher", "Homemaker", "Retired", "Other"]

// State → city cascade
const STATE_CITIES: Record<string, string[]> = {
  "Assam":             ["Barpeta", "Howly", "Guwahati", "Nalbari", "Bongaigaon", "Dibrugarh", "Jorhat", "Silchar", "Tezpur", "Nagaon"],
  "West Bengal":       ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol", "Darjeeling"],
  "Meghalaya":         ["Shillong", "Tura", "Jowai", "Nongstoin"],
  "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat", "Tawang"],
  "Nagaland":          ["Kohima", "Dimapur", "Mokokchung", "Wokha"],
  "Manipur":           ["Imphal", "Thoubal", "Bishnupur"],
  "Tripura":           ["Agartala", "Udaipur", "Dharmanagar"],
  "Bihar":             ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur"],
  "Delhi":             ["New Delhi", "Dwarka", "Rohini", "Saket"],
  "Maharashtra":       ["Mumbai", "Pune", "Nagpur", "Nashik"],
}
const STATES = Object.keys(STATE_CITIES)

// ─── Small input helpers ─────────────────────────────────────────────────────────

const onlyDigits = (v: string) => v.replace(/\D/g, "")
const phoneSanitize = (v: string) => v.replace(/[^\d+\s-]/g, "")

function formatDate(iso: string): string {
  if (!iso) return "—"
  const d = new Date(iso)
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
}

/** Try free, key-less reverse-geocoders. Returns a readable address or null. */
async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  // Provider 1 — OpenStreetMap Nominatim (detailed, street-level address)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&addressdetails=1&lat=${lat}&lon=${lon}`,
      { headers: { "Accept": "application/json" } },
    )
    if (res.ok) {
      const d = await res.json()
      const a = d.address ?? {}
      const parts = [
        a.house_number,
        a.road ?? a.neighbourhood ?? a.suburb,
        a.village ?? a.town ?? a.city_district ?? a.city,
        a.county ?? a.state_district,
        a.state,
        a.postcode,
      ].filter(Boolean)
      if (parts.length) return parts.join(", ")
      if (d.display_name) return d.display_name as string
    }
  } catch { /* fall through */ }
  // Provider 2 — BigDataCloud (client endpoint, no key)
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`,
    )
    if (res.ok) {
      const d = await res.json()
      const parts = [d.locality, d.city, d.principalSubdivision, d.postcode].filter(Boolean)
      if (parts.length) return parts.join(", ")
    }
  } catch { /* fall through */ }
  return null
}

// ─── Helper component ───────────────────────────────────────────────────────────

function ToggleRow({ label, sub, checked, onChange }: { label: string; sub: string; checked: boolean; onChange: () => void }) {
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

// ─── Editable text field with optional leading icon (borderless shadow) ──────────

function Field({
  label, value, onChange, icon, type = "text", inputMode, maxLength, sanitize, placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  icon?: React.ReactNode
  type?: string
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"]
  maxLength?: number
  sanitize?: (v: string) => string
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
          inputMode={inputMode}
          maxLength={maxLength}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(sanitize ? sanitize(e.target.value) : e.target.value)}
          className={cn("h-9 text-sm shadow-none", icon && "pl-8")}
        />
      </div>
    </div>
  )
}

// ─── Aadhaar / ID field — stores 12 digits, displays only the last 4 ─────────────

function AadhaarField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [reveal, setReveal] = useState(false)
  const digits = onlyDigits(value).slice(0, 12)
  const grouped = digits.replace(/(.{4})(?=.)/g, "$1 ").trim()     // "1234 5678 9012"
  const masked = digits.length > 4 ? `•••• •••• ${digits.slice(-4)}` : "•".repeat(digits.length)

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Aadhaar / ID</Label>
      <div className="relative">
        <IdCard className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
        <Input
          inputMode="numeric"
          maxLength={reveal ? 14 : undefined}
          placeholder="12-digit Aadhaar number"
          readOnly={!reveal}
          value={reveal ? grouped : masked}
          onChange={e => onChange(onlyDigits(e.target.value).slice(0, 12))}
          className={cn("h-9 text-sm pl-8 pr-9 shadow-none", !reveal && "cursor-pointer")}
          onClick={() => { if (!reveal) setReveal(true) }}
        />
        <button
          type="button"
          onClick={() => setReveal(v => !v)}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={reveal ? "Hide Aadhaar number" : "Reveal & edit Aadhaar number"}
          title={reveal ? "Hide" : "Reveal & edit"}
        >
          {reveal ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
        </button>
      </div>
      {reveal && digits.length > 0 && digits.length < 12 && (
        <p className="text-[11px] text-warning-foreground">Enter all 12 digits ({digits.length}/12)</p>
      )}
    </div>
  )
}

// ─── Editable select field (icon + value on one row, like inputs) ────────────────

const OTHER_VALUE = "__other__"

function SelectField({
  label, value, onChange, options, icon, placeholder = "Select…", disabled, allowOther,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  icon?: React.ReactNode
  placeholder?: string
  disabled?: boolean
  allowOther?: boolean
}) {
  const isCustom = allowOther && !!value && !options.includes(value)
  const [otherMode, setOtherMode] = useState(isCustom)
  const showOtherInput = allowOther && (otherMode || isCustom)

  function handleSelect(v: string) {
    if (v === OTHER_VALUE) { setOtherMode(true); onChange("") }
    else { setOtherMode(false); onChange(v) }
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="relative">
        {icon && (
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 text-muted-foreground pointer-events-none">
            {icon}
          </span>
        )}
        <Select
          value={showOtherInput ? OTHER_VALUE : (value || undefined)}
          onValueChange={handleSelect}
          disabled={disabled}
        >
          <SelectTrigger className={cn("h-9 text-sm shadow-none", icon && "pl-8")}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map(o => (
              <SelectItem key={o} value={o}>{o}</SelectItem>
            ))}
            {allowOther && <SelectItem value={OTHER_VALUE}>Type Manually</SelectItem>}
          </SelectContent>
        </Select>
      </div>
      {showOtherInput && (
        <Input
          autoFocus
          placeholder={`Enter ${label.toLowerCase()}`}
          value={value}
          onChange={e => onChange(e.target.value)}
          className="h-9 text-sm shadow-none mt-2"
        />
      )}
    </div>
  )
}

// ─── Home address field with geolocation fetch ──────────────────────────────────

function AddressField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  function fetchLocation() {
    setErr(null)
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setErr("Geolocation isn't supported on this device.")
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude } = pos.coords
        const address = await reverseGeocode(latitude, longitude)
        // Always succeed once we have coordinates — fall back to lat/lon.
        onChange(address ?? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`)
        if (!address) setErr("Used GPS coordinates (address lookup unavailable). You can edit manually.")
        setLoading(false)
      },
      e => {
        setErr(
          e.code === e.PERMISSION_DENIED
            ? "Location permission denied. Enter address manually."
            : "Couldn't get your location. Enter address manually.",
        )
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 },
    )
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">Home Address</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={value}
            onChange={e => onChange(e.target.value)}
            className="h-9 text-sm pl-8 shadow-none"
            placeholder="Enter address manually or fetch from device"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 shrink-0 shadow-none"
          onClick={fetchLocation}
          disabled={loading}
          title="Use my current location"
        >
          {loading
            ? <Loader2 className="size-4 animate-spin" />
            : <LocateFixed className="size-4" />}
          <span className="hidden sm:inline">{loading ? "Locating…" : "Use my location"}</span>
        </Button>
      </div>
      {err && <p className="text-[11px] text-muted-foreground">{err}</p>}
    </div>
  )
}

// ─── Child info card ────────────────────────────────────────────────────────────

function ChildInfoCard({ child, profile }: { child: MockChild; profile: ChildProfile }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 flex-row items-center gap-2">
        <GraduationCap className="size-4 text-muted-foreground" />
        <CardTitle className="text-base">{profile.name}</CardTitle>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          Class {profile.class}
        </Badge>
      </CardHeader>
      <Separator />
      <CardContent className="pt-4 space-y-3">
        {/* Avatar + basic info */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-base flex-shrink-0"
            aria-hidden="true"
          >
            {profile.initials}
          </div>
          <div>
            <p className="font-semibold">{profile.name}</p>
            <p className="text-xs text-muted-foreground">
              Class {profile.class} · Roll No. {profile.roll}
            </p>
          </div>
        </div>
        <Separator />
        {/* Details grid */}
        {[
          ["Admission No.", profile.admissionNo],
          ["Date of Birth", profile.dob],
          ["Blood Group", profile.bloodGroup],
          ["Class Teacher", profile.classTeacher],
          ["Section", profile.section],
          ["School", profile.school],
          ["Attendance", `${profile.attendance}%`],
        ].map(([label, value]) => (
          <div key={label} className="flex justify-between text-sm">
            <span className="text-muted-foreground text-xs">{label}</span>
            <span className="font-medium text-xs">{value}</span>
          </div>
        ))}
        <Separator />
        {/* Transport route badge */}
        {child.transportRoute && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border">
            <Bus className="size-3.5 text-primary flex-shrink-0" />
            <span className="text-xs text-muted-foreground">Transport Route:</span>
            <Badge variant="outline" className="text-[10px]">
              {child.transportRoute === "route-1" ? "Howly Main — HCEA" : child.transportRoute}
            </Badge>
          </div>
        )}
        {/* Quick links */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/parent/attendance">
              <TrendingUp className="size-3.5" /> Attendance
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/parent/report-card">
              <BookOpen className="size-3.5" /> Report Card
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/parent/exams">
              <CalendarDays className="size-3.5" /> Exams
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/parent/journal">
              <BookOpen className="size-3.5" /> Journal
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Fee history for a single child ─────────────────────────────────────────────

function ChildFeeSection({ childId, profile, fees }: { childId: string; profile: ChildProfile; fees: FeeRecord[] }) {
  const totalDue = fees.filter(f => f.status !== "paid").reduce((s, f) => s + f.amount, 0)

  return (
    <Card>
      <CardHeader className="pb-3 flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Receipt className="size-4 text-muted-foreground" />
          {profile.name}&apos;s Fee History
        </CardTitle>
        <div className="flex items-center gap-2">
          {totalDue > 0 && (
            <Badge variant="destructive" className="text-[10px]">
              ₹{totalDue.toLocaleString("en-IN")} due
            </Badge>
          )}
          <Button variant="ghost" size="sm" className="text-xs" asChild>
            <Link href="/parent/fees">
              View all <ChevronRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {fees.map((f, i) => (
            <li key={`${childId}-${i}`} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium">{f.month}</p>
                <p className="text-xs text-muted-foreground">{f.description || "Tuition + Exam Fee"}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold">₹{f.amount.toLocaleString("en-IN")}</span>
                <span className={cn("text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize", FEE_STATUS_CLASSES[f.status])}>
                  {f.status}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

// ═════════════════════════════════════════════════════════════════════════════════
// Main Page
// ═════════════════════════════════════════════════════════════════════════════════

export default function ParentProfilePage() {
  const { children: mockChildren, selectedChild } = useChild()
  const [tab, setTab] = useState<Tab>("profile")
  const [showPw, setShowPw] = useState(false)
  const [showCurPw, setShowCurPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [saved, setSaved] = useState(false)

  const INITIAL_PROFILE = {
    name: "Pankaj Das",
    relation: "Father",
    email: "parent@hcea.edu",
    phone: "+91 76543 21098",
    altPhone: "+91 65432 10987",
    occupation: "Government Employee",
    dob: "1984-08-12",
    gender: "Male",
    nationality: "Indian",
    language: "Assamese",
    qualification: "B.Com",
    workplace: "District Office, Barpeta",
    aadhaar: "123456784821",
    emergencyName: "Rumi Das",
    emergencyRelation: "Mother",
    emergencyPhone: "+91 98765 43210",
    address: "Howly, Barpeta, Assam",
    city: "Barpeta",
    state: "Assam",
    pincode: "781316",
  }
  const [profile, setProfile] = useState(INITIAL_PROFILE)
  const [dirty, setDirty] = useState(false)
  const [notifs, setNotifs] = useState({
    feeReminders: true, attendanceAlert: true, examSchedule: true,
    reportCard: true, ptmNotice: true, generalNotices: false,
    smsAlerts: true, whatsappAlerts: true, emailDigest: false,
  })
  const [privacy, setPrivacy] = useState({ shareContact: true, twoFactor: false })

  const p = (k: keyof typeof profile) => (v: string) => { setProfile(prev => ({ ...prev, [k]: v })); setDirty(true) }
  // State change cascades to city: keep current city only if valid for the new state
  function setStateField(v: string) {
    setProfile(prev => {
      const cities = STATE_CITIES[v] ?? []
      const city = cities.includes(prev.city) ? prev.city : (cities[0] ?? "")
      return { ...prev, state: v, city }
    })
    setDirty(true)
  }
  const cityOptions = STATE_CITIES[profile.state] ?? []
  function save() { setSaved(true); setDirty(false); setTimeout(() => setSaved(false), 3000) }
  function reset() { setProfile(INITIAL_PROFILE); setDirty(false) }

  // Aggregate fees across ALL children for the top-level KPI
  const allFees = Object.entries(CHILD_FEE_HISTORY)
  const totalDue = allFees.reduce((sum, [, fees]) =>
    sum + fees.filter(f => f.status !== "paid").reduce((s, f) => s + f.amount, 0), 0
  )

  // Sparkline series ───────────────────────────────────────────────────────────
  // Fee Due: outstanding (unpaid) amount per child — bar chart.
  const feeDueSeries = allFees.map(([, fees]) =>
    fees.filter(f => f.status !== "paid").reduce((s, f) => s + f.amount, 0)
  )
  // Children: each child's attendance % — bar chart.
  const childrenSeries = mockChildren.map(c =>
    (CHILD_PROFILES[c.id] ?? CHILD_PROFILES["child-1"]).attendance
  )
  // Notifications: recent weekly notification counts — bar chart.
  const notifSeries = [1, 3, 2, 4, 1, 2]

  // Selected child's profile for KPI
  const activeProfile = selectedChild
    ? CHILD_PROFILES[selectedChild.id] ?? CHILD_PROFILES["child-1"]
    : CHILD_PROFILES["child-1"]

  // Subtitle reflects all children names
  const childrenNames = mockChildren.map(c => `${c.name}, ${c.className}`).join(" · ")

  return (
    <div className="flex flex-col">
      <div className="flex items-start justify-between gap-4 flex-wrap px-4 pt-6 sm:px-6 md:px-8">
        <PageHeader
          icon={<User size={22} />}
          title="Profile & Settings"
          subtitle={`Parent account · ${childrenNames}`}
        />
        {saved && (
          <span className="flex items-center gap-1.5 text-sm text-success-foreground font-medium flex-shrink-0 pb-2">
            <CheckCircle className="size-4" /> Changes saved
          </span>
        )}
      </div>

      {/* KPIs — 1 col (mobile) · 2 cols (tablet) · 4 cols (desktop) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 px-4 sm:px-6 md:px-8 pt-6">
        <KpiCard
          title="Attendance"
          value={`${activeProfile.attendance}%`}
          icon={<TrendingUp className="size-5" />}
          iconClassName={activeProfile.attendance >= 85
            ? "bg-success/15 text-success-foreground"
            : "bg-warning/15 text-warning-foreground"
          }
          sparkline={{ variant: "arc", value: activeProfile.attendance, color: "var(--ef-green)" }}
        />
        <KpiCard
          title="Fee Due"
          value={totalDue > 0 ? `₹${totalDue.toLocaleString("en-IN")}` : "Nil"}
          icon={<Receipt className="size-5" />}
          iconClassName={totalDue > 0
            ? "bg-destructive/10 text-destructive"
            : "bg-success/15 text-success-foreground"
          }
          subtitle={totalDue > 0 ? "Due June 30" : "All paid"}
          sparkline={{ variant: "bar", data: feeDueSeries, color: "var(--ef-red)" }}
        />
        <KpiCard
          title="Children"
          value={mockChildren.length}
          subtitle={mockChildren.map(c => c.name.split(" ")[0]).join(", ")}
          icon={<GraduationCap className="size-5" />}
          iconClassName="bg-primary/10 text-primary"
          sparkline={{ variant: "bar", data: childrenSeries, color: "var(--ef-brand)" }}
        />
        <KpiCard
          title="Notifications"
          value="2"
          subtitle="2 unread"
          icon={<Bell className="size-5" />}
          iconClassName="bg-warning/15 text-warning-foreground"
          sparkline={{ variant: "bar", data: notifSeries, color: "var(--ef-amber)" }}
        />
      </div>

      {totalDue > 0 && (
        <div className="px-4 sm:px-6 md:px-8 mt-4">
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-5 text-destructive flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold">
                    Outstanding fee: ₹{totalDue.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Deadline June 30 · 2% late fee applies after due date
                  </p>
                </div>
              </div>
              <Button size="sm" variant="destructive" asChild>
                <Link href="/parent/fees">Pay Now</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab nav */}
      <div className="px-4 sm:px-6 md:px-8 mt-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
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

        {/* ═══════ PROFILE TAB ═══════ */}
        {tab === "profile" && (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            {/* ── Summary card (modern) ── */}
            <Card className="xl:col-span-1 h-fit overflow-hidden pt-0 gap-0">
              {/* Gradient banner */}
              <div className="h-24 bg-gradient-to-br from-[var(--ef-purple)] to-primary relative">
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_30%,white,transparent_60%)]" aria-hidden="true" />
              </div>
              <CardContent className="px-6 pb-6 flex flex-col items-center text-center gap-3">
                {/* Avatar overlapping banner */}
                <div className="-mt-14">
                  <AvatarUpload initials="PD" color="bg-[var(--ef-purple)]" editing />
                </div>
                <p className="text-[11px] text-muted-foreground -mt-1">Tap the camera icon to upload a photo</p>
                <div className="space-y-0.5">
                  <h2 className="font-bold text-lg leading-tight">{profile.name}</h2>
                  <p className="text-xs text-muted-foreground">{profile.email}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  <Badge className="bg-[var(--ef-purple)] hover:bg-[var(--ef-purple)] text-white">Parent</Badge>
                  <Badge variant="outline">
                    {profile.relation} of {mockChildren.map(c => c.name.split(" ")[0]).join(" & ")}
                  </Badge>
                </div>

                {/* Quick stat row */}
                <div className="grid grid-cols-2 gap-2 w-full pt-1">
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-base font-bold leading-none">{mockChildren.length}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{mockChildren.length === 1 ? "Child" : "Children"}</p>
                  </div>
                  <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
                    <p className="text-base font-bold leading-none">{activeProfile.attendance}%</p>
                    <p className="text-[10px] text-muted-foreground mt-1">Attendance</p>
                  </div>
                </div>

                <Separator className="w-full" />
                <div className="w-full space-y-2.5 text-left text-xs text-muted-foreground">
                  <div className="flex items-center gap-2"><Phone className="size-3.5 text-primary flex-shrink-0" /><span>{profile.phone}</span></div>
                  <div className="flex items-start gap-2"><MapPin className="size-3.5 text-primary flex-shrink-0 mt-0.5" /><span>{[profile.address, profile.city, profile.state].filter(Boolean).join(", ")} – {profile.pincode}</span></div>
                  <div className="flex items-center gap-2"><Briefcase className="size-3.5 text-primary flex-shrink-0" /><span>{profile.occupation}</span></div>
                  <div className="flex items-center gap-2"><Cake className="size-3.5 text-primary flex-shrink-0" /><span>{formatDate(profile.dob)}</span></div>
                  <div className="flex items-center gap-2"><CalendarDays className="size-3.5 text-primary flex-shrink-0" /><span>Joined March 2025</span></div>
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
                {dirty && (
                  <Badge variant="secondary" className="ml-auto text-[10px]">Unsaved changes</Badge>
                )}
              </CardHeader>
              <Separator />
              <CardContent className="pt-5 space-y-6">

                {/* Personal information */}
                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <IdCard className="size-3.5" /> Personal Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field       label="Full Name"     value={profile.name}        onChange={p("name")} icon={<User className="size-3.5" />} />
                    <SelectField label="Relation"      value={profile.relation}    onChange={p("relation")}      options={RELATIONS}      icon={<Heart className="size-3.5" />} />
                    <SelectField label="Gender"        value={profile.gender}      onChange={p("gender")}        options={GENDERS}        icon={<User className="size-3.5" />} />
                    <Field       label="Date of Birth" value={profile.dob}         onChange={p("dob")} type="date" icon={<Cake className="size-3.5" />} />
                    <SelectField label="Nationality"   value={profile.nationality} onChange={p("nationality")}   options={NATIONALITIES}  icon={<Globe className="size-3.5" />} />
                    <SelectField label="Mother Tongue" value={profile.language}    onChange={p("language")}      options={LANGUAGES_LIST} icon={<Languages className="size-3.5" />} allowOther />
                    <SelectField label="Qualification" value={profile.qualification} onChange={p("qualification")} options={QUALIFICATIONS} icon={<GraduationCap className="size-3.5" />} allowOther />
                    <SelectField label="Occupation"    value={profile.occupation}  onChange={p("occupation")}    options={OCCUPATIONS}    icon={<Briefcase className="size-3.5" />} allowOther />
                    <Field       label="Workplace"     value={profile.workplace}   onChange={p("workplace")} icon={<Building2 className="size-3.5" />} />
                    <AadhaarField value={profile.aadhaar} onChange={p("aadhaar")} />
                  </div>
                </section>

                <Separator />

                {/* Contact information */}
                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Phone className="size-3.5" /> Contact Information
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field label="Email"     value={profile.email}    onChange={p("email")}    icon={<Mail className="size-3.5" />} type="email" />
                    <Field label="Phone"     value={profile.phone}    onChange={p("phone")}    icon={<Phone className="size-3.5" />} type="tel" inputMode="numeric" maxLength={15} sanitize={phoneSanitize} />
                    <Field label="Alt Phone" value={profile.altPhone} onChange={p("altPhone")} icon={<Phone className="size-3.5" />} type="tel" inputMode="numeric" maxLength={15} sanitize={phoneSanitize} />
                    <div className="sm:col-span-2 lg:col-span-3">
                      <AddressField value={profile.address} onChange={p("address")} />
                    </div>
                    <SelectField
                      label="State"
                      value={profile.state}
                      onChange={setStateField}
                      options={STATES}
                      icon={<MapPin className="size-3.5" />}
                    />
                    <SelectField
                      label="City"
                      value={profile.city}
                      onChange={p("city")}
                      options={cityOptions}
                      icon={<Building2 className="size-3.5" />}
                      placeholder={profile.state ? "Select city…" : "Select state first"}
                      disabled={!profile.state}
                    />
                    <Field label="Pincode"  value={profile.pincode} onChange={p("pincode")} inputMode="numeric" maxLength={6} sanitize={(v) => onlyDigits(v).slice(0, 6)} icon={<MapPin className="size-3.5" />} />
                  </div>
                </section>

                <Separator />

                {/* Emergency contact */}
                <section className="space-y-3">
                  <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <Users className="size-3.5" /> Emergency Contact
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Field       label="Contact Name"  value={profile.emergencyName}     onChange={p("emergencyName")} icon={<User className="size-3.5" />} />
                    <SelectField label="Relation"      value={profile.emergencyRelation} onChange={p("emergencyRelation")} options={RELATIONS} icon={<Heart className="size-3.5" />} />
                    <Field       label="Contact Phone" value={profile.emergencyPhone}    onChange={p("emergencyPhone")} icon={<Phone className="size-3.5" />} type="tel" inputMode="numeric" maxLength={15} sanitize={phoneSanitize} />
                  </div>
                </section>
              </CardContent>
              <Separator />
              {/* Form footer — Update button on the right */}
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

        {/* ═══════ MY CHILDREN TAB ═══════ */}
        {tab === "child" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {mockChildren.map(child => {
              const childProfile = CHILD_PROFILES[child.id]
              if (!childProfile) return null
              return (
                <ChildInfoCard key={child.id} child={child} profile={childProfile} />
              )
            })}
          </div>
        )}

        {/* ═══════ JOURNAL TAB ═══════ */}
        {tab === "journal" && (
          <ClassJournalView />
        )}

        {/* ═══════ FEES TAB ═══════ */}
        {tab === "fees" && (
          <div className="grid grid-cols-1 gap-6">
            {/* Fee history — per child, stacked one per row */}
            {mockChildren.map(child => {
              const childProfile = CHILD_PROFILES[child.id]
              const childFees = CHILD_FEE_HISTORY[child.id]
              if (!childProfile || !childFees) return null
              return (
                <ChildFeeSection
                  key={child.id}
                  childId={child.id}
                  profile={childProfile}
                  fees={childFees}
                />
              )
            })}

            {/* Payment methods */}
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Payment Methods</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                {PAYMENT_METHODS.map((pm, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                        {pm.type}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pm.detail}</p>
                        {pm.primary && <p className="text-[10px] text-muted-foreground">Primary</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {pm.primary && <Badge variant="secondary" className="text-[10px]">Primary</Badge>}
                      <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive hover:text-destructive">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm">
                  <CreditCard className="size-3.5" /> Add Payment Method
                </Button>
              </CardContent>
            </Card>

            {/* Fee summary across children */}
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2">
                <Receipt className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Summary</CardTitle>
              </CardHeader>
              <Separator />
              <CardContent className="pt-4 space-y-3">
                {mockChildren.map(child => {
                  const fees = CHILD_FEE_HISTORY[child.id] ?? []
                  const paid = fees.filter(f => f.status === "paid").reduce((s, f) => s + f.amount, 0)
                  const due = fees.filter(f => f.status !== "paid").reduce((s, f) => s + f.amount, 0)
                  return (
                    <div key={child.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                          {child.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{child.name}</p>
                          <p className="text-[10px] text-muted-foreground">Class {child.className}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-success-foreground">₹{paid.toLocaleString("en-IN")} paid</p>
                        {due > 0 && (
                          <p className="text-xs text-destructive font-medium">₹{due.toLocaleString("en-IN")} due</p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════ NOTIFICATIONS TAB ═══════ */}
        {tab === "notifs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2">
                <Bell className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">School Alerts</CardTitle>
              </CardHeader>
              <Separator /><CardContent className="pt-4">
                <ToggleRow label="Fee reminders"     sub="Due date & overdue alerts"        checked={notifs.feeReminders}    onChange={() => setNotifs(n => ({ ...n, feeReminders: !n.feeReminders }))} />
                <ToggleRow label="Attendance alerts" sub="When any child is absent"         checked={notifs.attendanceAlert} onChange={() => setNotifs(n => ({ ...n, attendanceAlert: !n.attendanceAlert }))} />
                <ToggleRow label="Exam schedule"     sub="Exam dates & timetable updates"   checked={notifs.examSchedule}   onChange={() => setNotifs(n => ({ ...n, examSchedule: !n.examSchedule }))} />
                <ToggleRow label="Report card"       sub="When results are published"       checked={notifs.reportCard}     onChange={() => setNotifs(n => ({ ...n, reportCard: !n.reportCard }))} />
                <ToggleRow label="PTM notices"       sub="Parent-Teacher Meeting schedules" checked={notifs.ptmNotice}      onChange={() => setNotifs(n => ({ ...n, ptmNotice: !n.ptmNotice }))} />
                <ToggleRow label="General notices"   sub="All other school notices"         checked={notifs.generalNotices} onChange={() => setNotifs(n => ({ ...n, generalNotices: !n.generalNotices }))} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2">
                <Mail className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Channels</CardTitle>
              </CardHeader>
              <Separator /><CardContent className="pt-4">
                <ToggleRow label="SMS alerts"      sub="Instant SMS via MSG91"            checked={notifs.smsAlerts}      onChange={() => setNotifs(n => ({ ...n, smsAlerts: !n.smsAlerts }))} />
                <ToggleRow label="WhatsApp alerts" sub="Important updates on WhatsApp"    checked={notifs.whatsappAlerts} onChange={() => setNotifs(n => ({ ...n, whatsappAlerts: !n.whatsappAlerts }))} />
                <ToggleRow label="Email digest"    sub="Weekly summary email"             checked={notifs.emailDigest}    onChange={() => setNotifs(n => ({ ...n, emailDigest: !n.emailDigest }))} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* ═══════ SECURITY TAB ═══════ */}
        {tab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2">
                <Lock className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Privacy & Password</CardTitle>
              </CardHeader>
              <Separator /><CardContent className="pt-4 space-y-3">
                <ToggleRow label="Share contact with teachers" sub="Class teacher can see your phone number" checked={privacy.shareContact} onChange={() => setPrivacy(v => ({ ...v, shareContact: !v.shareContact }))} />
                <ToggleRow label="Two-factor authentication"   sub="Extra security via OTP on login"        checked={privacy.twoFactor}    onChange={() => setPrivacy(v => ({ ...v, twoFactor: !v.twoFactor }))} />
                <Separator />
                <Button variant="ghost" size="sm" className="justify-start w-full text-xs" onClick={() => setShowPw(v => !v)}>
                  <Key className="size-3.5" /> Change Password <ChevronRight className={cn("size-3.5 ml-auto transition-transform", showPw && "rotate-90")} />
                </Button>
                {showPw && (
                  <div className="space-y-3 pl-1">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Current Password</Label>
                      <div className="relative">
                        <Input type={showCurPw ? "text" : "password"} className="h-8 pr-8 text-xs" placeholder="••••••••" />
                        <Button variant="ghost" size="icon-sm" className="absolute right-2.5 -translate-y-1/2 h-auto w-auto hover:bg-transparent" onClick={() => setShowCurPw(v => !v)} aria-label={showCurPw ? "Hide current password" : "Show current password"}>
                          {showCurPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">New Password</Label>
                      <div className="relative">
                        <Input type={showNewPw ? "text" : "password"} className="h-8 pr-8 text-xs" placeholder="Min 8 chars" />
                        <Button variant="ghost" size="icon-sm" className="absolute right-2.5 -translate-y-1/2 h-auto w-auto hover:bg-transparent" onClick={() => setShowNewPw(v => !v)} aria-label={showNewPw ? "Hide new password" : "Show new password"}>
                          {showNewPw ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </Button>
                      </div>
                    </div>
                    <Input type="password" className="h-8 text-xs" placeholder="Confirm new password" />
                    <Button size="sm"><Save className="size-3.5" /> Update Password</Button>
                  </div>
                )}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm"><Download className="size-3.5" /> Download Data</Button>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3 flex-row items-center gap-2">
                <Shield className="size-4 text-muted-foreground" />
                <CardTitle className="text-base">Active Sessions</CardTitle>
              </CardHeader>
              <Separator /><CardContent className="pt-4 space-y-3">
                {SESSIONS.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
                    <div className={cn("size-2 rounded-full flex-shrink-0", s.current ? "bg-[var(--ef-green)]" : "bg-muted-foreground/50")} aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{s.device}</p>
                      <p className="text-[10px] text-muted-foreground">{s.location} · {s.lastActive}</p>
                    </div>
                    {s.current
                      ? <Badge variant="secondary" className="text-[10px]">Current</Badge>
                      : <Button variant="ghost" size="sm" className="h-6 text-[10px] text-destructive hover:text-destructive">Revoke</Button>
                    }
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
