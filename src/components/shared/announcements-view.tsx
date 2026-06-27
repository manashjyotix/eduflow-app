"use client"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import {
  Megaphone, Plus, X, Users, AlertCircle, Calendar, Zap, Clock, Search,
  type LucideIcon,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge, type BadgeProps } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import { announceSchema, type AnnounceInput } from "@/lib/schemas/announcement"

// ─── Types ───────────────────────────────────────────────────────────────────
export type Tone = "urgent" | "event" | "info" | "success" | "warning"
export type Audience = "All" | "Teachers" | "Students" | "Parents" | "Management"

export interface Announcement {
  id: string
  tone: Tone
  audience: Audience
  title: string
  body: string
  date: string
  icon: LucideIcon
}

export type AnnouncementsRole =
  | "admin" | "management" | "teacher" | "parent" | "super_admin"

// ─── Shared announcement dataset ──────────────────────────────────────────────
export const ANNOUNCEMENTS: Announcement[] = [
  {
    id: "a1", tone: "urgent", audience: "All",
    title: "School closed on 5 June — Cyclone Alert",
    body: "Due to the cyclone warning issued by the Assam government, Holy Child English Academy will remain closed on Wednesday, 5 June 2026. All exams scheduled for that day are postponed.",
    date: "3 Jun 2026", icon: Zap,
  },
  {
    id: "a2", tone: "event", audience: "All",
    title: "Annual Sports Day — 20 June 2026",
    body: "The Annual Sports Day will be held on 20 June 2026 at the school grounds. Students are requested to report by 8:00 AM in their house colours. Parents are cordially invited.",
    date: "1 Jun 2026", icon: Calendar,
  },
  {
    id: "a3", tone: "info", audience: "Teachers",
    title: "Staff Meeting — 7 June, 3:00 PM",
    body: "A mandatory staff meeting is scheduled for Saturday, 7 June 2026 at 3:00 PM in the conference room. Agenda: Term 2 timetable review and proxy policy update.",
    date: "31 May 2026", icon: Megaphone,
  },
  {
    id: "a4", tone: "success", audience: "Students",
    title: "Term 1 Results Published",
    body: "Term 1 examination results for Classes VII–X are now available on the student portal. Students can view their grade cards and download PDF copies.",
    date: "28 May 2026", icon: AlertCircle,
  },
  {
    id: "a5", tone: "warning", audience: "Parents",
    title: "Fee Payment Reminder — Due 15 June",
    body: "This is a reminder that the Term 2 fee payment deadline is 15 June 2026. Late payments will attract a penalty of ₹200 per week.",
    date: "25 May 2026", icon: AlertCircle,
  },
]

// ─── Tone config — redesigned ─────────────────────────────────────────────────
// Card BG = 10% transparent global colour. No left accent border — a uniform,
// low-opacity tone border instead. Capsule badge + dismiss button borders are
// tuned to the card background so they read cleanly.
const TONE_CONFIG: Record<Tone, {
  card: string; iconBox: string; badge: string; dismiss: string; label: string
}> = {
  urgent: {
    card: "bg-ef-red/10 border-ef-red/20",
    iconBox: "bg-ef-red text-white",
    badge: "bg-ef-red/15 text-ef-red border-ef-red/25",
    dismiss: "border-ef-red/25 text-ef-red hover:bg-ef-red/15 hover:text-ef-red",
    label: "Urgent",
  },
  event: {
    card: "bg-ef-purple/10 border-ef-purple/20",
    iconBox: "bg-ef-purple text-white",
    badge: "bg-ef-purple/15 text-ef-purple border-ef-purple/25",
    dismiss: "border-ef-purple/25 text-ef-purple hover:bg-ef-purple/15 hover:text-ef-purple",
    label: "Event",
  },
  info: {
    card: "bg-ef-cyan/10 border-ef-cyan/20",
    iconBox: "bg-ef-cyan text-white",
    badge: "bg-ef-cyan/15 text-ef-cyan border-ef-cyan/25",
    dismiss: "border-ef-cyan/25 text-ef-cyan hover:bg-ef-cyan/15 hover:text-ef-cyan",
    label: "Info",
  },
  success: {
    card: "bg-ef-green/10 border-ef-green/20",
    iconBox: "bg-ef-green text-white",
    badge: "bg-ef-green/15 text-ef-green-dark border-ef-green/25",
    dismiss: "border-ef-green/25 text-ef-green-dark hover:bg-ef-green/15 hover:text-ef-green-dark",
    label: "Success",
  },
  warning: {
    card: "bg-ef-amber/10 border-ef-amber/20",
    iconBox: "bg-ef-amber text-white",
    badge: "bg-ef-amber/15 text-ef-amber-dark border-ef-amber/25",
    dismiss: "border-ef-amber/25 text-ef-amber-dark hover:bg-ef-amber/15 hover:text-ef-amber-dark",
    label: "Warning",
  },
}

const AUDIENCE_VARIANT: Record<string, BadgeProps["variant"]> = {
  All: "default", Teachers: "success", Students: "default",
  Parents: "warning", Management: "secondary",
}

const AUDIENCE_ROLE_MAP: Record<string, AnnounceInput["targetRoles"]> = {
  "All":        ["admin", "teacher", "parent", "student"],
  "Teachers":   ["teacher"],
  "Students":   ["student"],
  "Parents":    ["parent"],
  "Management": ["management"],
}

const AUDIENCES = ["All", "Teachers", "Students", "Parents"] as const

// Which announcement audiences a given role is allowed to see.
const VISIBLE_AUDIENCES: Record<AnnouncementsRole, Audience[] | "*"> = {
  admin: "*",
  management: "*",
  super_admin: "*",
  teacher: ["All", "Teachers"],
  parent: ["All", "Parents", "Students"],
}

const CAN_MANAGE: AnnouncementsRole[] = ["admin", "management", "super_admin"]

function defaultExpiry() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split("T")[0]
}

const DEFAULT_VALUES: AnnounceInput = {
  title: "", body: "",
  targetRoles: ["admin", "teacher", "parent", "student"],
  expiresAt: defaultExpiry(), isPinned: false, attachmentUrl: "",
}

interface AnnouncementsViewProps {
  role: AnnouncementsRole
  /** Optional override for the page subtitle. */
  subtitle?: string
}

export function AnnouncementsView({ role, subtitle }: AnnouncementsViewProps) {
  const canManage = CAN_MANAGE.includes(role)
  const allowed = VISIBLE_AUDIENCES[role]

  const roleAnnouncements = useMemo(
    () => ANNOUNCEMENTS.filter(a => allowed === "*" || allowed.includes(a.audience)),
    [allowed]
  )

  const [dismissed, setDismissed] = useState<string[]>([])
  const [composing, setComposing] = useState(false)
  const [selectedAudience, setSelectedAudience] = useState<string>("All")
  const [query, setQuery] = useState("")
  const [toneFilter, setToneFilter] = useState<Tone | "all">("all")

  const form = useForm<AnnounceInput>({
    resolver: zodResolver(announceSchema) as never,
    defaultValues: DEFAULT_VALUES,
  })

  const visible = roleAnnouncements
    .filter(a => !dismissed.includes(a.id))
    .filter(a => toneFilter === "all" || a.tone === toneFilter)
    .filter(a => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)
    })

  function handlePublish(values: AnnounceInput) {
    toast.success("Announcement published", {
      description: `"${values.title}" sent to ${selectedAudience}.`,
    })
    setComposing(false)
    form.reset(DEFAULT_VALUES)
    setSelectedAudience("All")
  }

  function openCompose() {
    form.reset({ ...DEFAULT_VALUES, expiresAt: defaultExpiry() })
    setSelectedAudience("All")
    setComposing(true)
  }

  function cancelCompose() {
    setComposing(false)
    form.reset(DEFAULT_VALUES)
  }

  // KPI derivations (managers only)
  const total = roleAnnouncements.length
  const urgentCount = roleAnnouncements.filter(a => a.tone === "urgent").length
  const eventCount = roleAnnouncements.filter(a => a.tone === "event").length

  const TONE_FILTERS: { id: Tone | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "urgent", label: "Urgent" },
    { id: "event", label: "Event" },
    { id: "info", label: "Info" },
    { id: "success", label: "Success" },
    { id: "warning", label: "Warning" },
  ]

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Megaphone size={22} />}
        title="Announcements"
        subtitle={subtitle ?? (canManage
          ? "School notice board — manage and publish announcements"
          : "Stay up to date with the latest school announcements")}
        actions={canManage ? (
          <Button onClick={composing ? cancelCompose : openCompose} size="default" className="gap-2">
            {composing
              ? <><X className="size-3.5" /> Cancel</>
              : <><Plus className="size-3.5" /> New Announcement</>}
          </Button>
        ) : undefined}
      />

      {/* Stats — managers only */}
      {canManage && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <KpiCard
            icon={<Megaphone size={18} />} tone="brand" title="Active Notices"
            value={visible.length} subtitle={`${total} total · ${visible.length} visible`}
            sparkline={{ variant: "bar", data: [3, 4, 3, 5, 4, total] }}
          />
          <KpiCard
            icon={<Zap size={18} />} tone="red" title="Urgent"
            value={urgentCount}
            subtitle={urgentCount > 0 ? "Requires immediate attention" : "None active"}
            sparkline={{ variant: "bar", data: [0, 1, 0, 0, 1, urgentCount] }}
          />
          <KpiCard
            icon={<Calendar size={18} />} tone="purple" title="Events This Month"
            value={eventCount} subtitle="scheduled this month"
            sparkline={{ variant: "line", data: [1, 2, 1, 3, 2, eventCount] }}
          />
          <KpiCard
            icon={<Users size={18} />} tone="green" title="Audience Reach"
            value={518} subtitle="students + staff + parents"
            trend={{ value: 3, label: "this week" }}
            sparkline={{ variant: "line", data: [320, 380, 410, 460, 505, 518] }}
          />
        </div>
      )}

      {/* Compose form — managers only */}
      {canManage && composing && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-sm">New Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handlePublish)} className="flex flex-col gap-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title *</FormLabel>
                    <FormControl><Input placeholder="Announcement title…" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="targetRoles" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Audience *</FormLabel>
                    <FormControl>
                      <div className="flex gap-2 flex-wrap">
                        {AUDIENCES.map(a => (
                          <button
                            key={a} type="button"
                            onClick={() => { setSelectedAudience(a); field.onChange(AUDIENCE_ROLE_MAP[a]) }}
                            className={
                              "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors " +
                              (selectedAudience === a
                                ? "bg-primary text-white border-primary"
                                : "bg-card text-muted-foreground border-border hover:bg-accent")
                            }
                          >{a}</button>
                        ))}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="grid grid-cols-2 gap-3">
                  <FormItem>
                    <FormLabel>Publish Date</FormLabel>
                    <FormControl>
                      <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                    </FormControl>
                  </FormItem>
                  <FormField control={form.control} name="expiresAt" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires At *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md flex items-center justify-center shrink-0 bg-ef-brand-light">
                            <Clock className="size-3.5 text-primary" />
                          </div>
                          <Input type="date" className="pl-11" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form.control} name="body" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Write your announcement…" className="min-h-[100px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={cancelCompose}>Cancel</Button>
                  <Button type="submit">Publish</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Search + tone filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {TONE_FILTERS.map(f => (
            <button
              key={f.id} type="button"
              onClick={() => setToneFilter(f.id)}
              className={
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors " +
                (toneFilter === f.id
                  ? "bg-primary text-white border-primary"
                  : "bg-card text-muted-foreground border-border hover:bg-accent")
              }
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Announcements list */}
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Active Announcements
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({visible.length} of {roleAnnouncements.length})
            </span>
          </h2>
          {dismissed.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setDismissed([])}>
              Restore {dismissed.length} dismissed
            </Button>
          )}
        </div>

        {visible.length === 0 ? (
          <Card className="w-full">
            <CardContent className="flex flex-col items-center justify-center gap-3 py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-muted">
                <Megaphone className="size-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">No announcements found</p>
              <p className="text-xs text-muted-foreground">
                {query || toneFilter !== "all"
                  ? "Try adjusting your search or filters."
                  : "There are no active announcements right now."}
              </p>
              {dismissed.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setDismissed([])}>Restore dismissed</Button>
              )}
            </CardContent>
          </Card>
        ) : (
          visible.map(a => {
            const cfg = TONE_CONFIG[a.tone]
            const Icon = a.icon
            return (
              <div
                key={a.id}
                className={
                  "w-full flex items-start gap-4 p-5 rounded-2xl relative border transition-all hover:-translate-y-px hover:shadow-card " +
                  cfg.card
                }
              >
                <div className={"w-12 h-12 rounded-xl flex items-center justify-center shrink-0 " + cfg.iconBox}>
                  <Icon size={22} />
                </div>

                <div className="flex-1 min-w-0 pr-10">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-base font-bold text-foreground">{a.title}</span>
                    <Badge variant={AUDIENCE_VARIANT[a.audience] ?? "default"}>{a.audience}</Badge>
                    <span className={"inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold " + cfg.badge}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{a.body}</p>
                  <span className="text-xs text-muted-foreground mt-2 block">
                    Posted by Admin · {a.date}
                  </span>
                </div>

                <Button
                  variant="ghost" size="icon-sm"
                  aria-label="Dismiss announcement"
                  onClick={() => setDismissed(d => [...d, a.id])}
                  className={"absolute top-4 right-4 h-7 w-7 border bg-transparent " + cfg.dismiss}
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
