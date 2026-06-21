"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Megaphone, Plus, X, Users, AlertCircle, Calendar, Zap, Clock, type LucideIcon } from "lucide-react"
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
import { announceSchema, type AnnounceInput, roleValues } from "@/lib/schemas/announcement"

type Tone = "urgent" | "event" | "info" | "success" | "warning"

interface Announcement {
  id: string
  tone: Tone
  audience: string
  title: string
  body: string
  date: string
  icon: LucideIcon
}

const ANNOUNCEMENTS: Announcement[] = [
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

// Full literal Tailwind class strings per tone (never build classes dynamically)
const TONE_CONFIG: Record<Tone, { card: string; iconBox: string; badge: string; dismiss: string; label: string }> = {
  urgent:  { card: "bg-ef-red-light border-ef-red",       iconBox: "bg-ef-red text-white",    badge: "border-ef-red text-ef-red",       dismiss: "border-ef-red",    label: "Urgent" },
  event:   { card: "bg-ef-purple-light border-ef-purple", iconBox: "bg-ef-purple text-white", badge: "border-ef-purple text-ef-purple", dismiss: "border-ef-purple", label: "Event" },
  info:    { card: "bg-ef-cyan-light border-ef-cyan",     iconBox: "bg-ef-cyan text-white",   badge: "border-ef-cyan text-ef-cyan",     dismiss: "border-ef-cyan",   label: "Info" },
  success: { card: "bg-ef-green-light border-ef-green",   iconBox: "bg-ef-green text-white",  badge: "border-ef-green text-ef-green",   dismiss: "border-ef-green",  label: "Success" },
  warning: { card: "bg-ef-amber-light border-ef-amber",   iconBox: "bg-ef-amber text-white",  badge: "border-ef-amber text-ef-amber",   dismiss: "border-ef-amber",  label: "Warning" },
}

const AUDIENCE_VARIANT: Record<string, BadgeProps["variant"]> = {
  All: "default", Teachers: "success", Students: "default", Parents: "warning",
}

// Audience → role mapping for schema
const AUDIENCE_ROLE_MAP: Record<string, AnnounceInput["targetRoles"]> = {
  "All":      ["admin", "teacher", "parent", "student"],
  "Teachers": ["teacher"],
  "Students": ["student"],
  "Parents":  ["parent"],
}

const AUDIENCES = ["All", "Teachers", "Students", "Parents"] as const

// Default expiry: 30 days from today
function defaultExpiry() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().split("T")[0]
}

const DEFAULT_VALUES: AnnounceInput = {
  title: "",
  body: "",
  targetRoles: ["admin", "teacher", "parent", "student"],
  expiresAt: defaultExpiry(),
  isPinned: false,
  attachmentUrl: "",
}

export default function AnnouncementsPage() {
  const [dismissed, setDismissed] = useState<string[]>([])
  const [composing, setComposing] = useState(false)
  const [selectedAudience, setSelectedAudience] = useState<string>("All")

  const form = useForm<AnnounceInput>({
    resolver: zodResolver(announceSchema) as never,
    defaultValues: DEFAULT_VALUES,
  })

  const visible = ANNOUNCEMENTS.filter(a => !dismissed.includes(a.id))

  function handlePublish(values: AnnounceInput) {
    // In production: POST to /api/announcements
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

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Megaphone size={22} />}
        title="Announcements"
        subtitle="School notice board — manage and publish announcements"
        actions={
          <Button onClick={composing ? cancelCompose : openCompose} size="default" className="gap-2">
            {composing ? <><X className="size-3.5" /> Cancel</> : <><Plus className="size-3.5" /> New Announcement</>}
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          icon={<Megaphone size={18} />}
          iconClassName="bg-ef-brand-light text-ef-brand"
          title="Active Notices"
          value={visible.length}
          subtitle="Published this term"
          sparkline={{ variant: "bar", data: [3, 4, 3, 5, 4, 4, visible.length], color: "var(--ef-brand)" }}
        />
        <KpiCard
          icon={<Zap size={18} />}
          iconClassName="bg-ef-red-light text-ef-red"
          title="Urgent"
          value={1}
          subtitle="Requires attention"
          sparkline={{ variant: "bar", data: [0, 1, 0, 0, 1, 0, 1], color: "var(--ef-red)" }}
        />
        <KpiCard
          icon={<Calendar size={18} />}
          iconClassName="bg-ef-purple-light text-ef-purple"
          title="Events This Month"
          value={3}
          subtitle="+1 vs last month"
          sparkline={{ variant: "line", data: [1, 2, 1, 3, 2, 3, 3], color: "var(--ef-purple)" }}
        />
        <KpiCard
          icon={<Users size={18} />}
          iconClassName="bg-ef-green-light text-ef-green"
          title="Audience Reach"
          value="518"
          subtitle="students + staff + parents"
          trend={{ value: 2.6, label: "this week" }}
          sparkline={{ variant: "line", data: [320, 380, 410, 460, 490, 505, 518], color: "var(--ef-green)" }}
        />
      </div>

      {/* Compose form */}
      {composing && (
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-sm">New Announcement</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handlePublish)} className="flex flex-col gap-4">

                {/* Title */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="Announcement title…" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Audience (maps to targetRoles) */}
                <FormField
                  control={form.control}
                  name="targetRoles"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience *</FormLabel>
                      <FormControl>
                        <div className="flex gap-2 flex-wrap">
                          {AUDIENCES.map(a => (
                            <button
                              key={a}
                              type="button"
                              onClick={() => {
                                setSelectedAudience(a)
                                field.onChange(AUDIENCE_ROLE_MAP[a])
                              }}
                              className={
                                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors " +
                                (selectedAudience === a
                                  ? "bg-primary text-white border-primary"
                                  : "bg-card text-muted-foreground border-border hover:bg-accent")
                              }
                            >
                              {a}
                            </button>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Date + Expiry */}
                <div className="grid grid-cols-2 gap-3">
                  <FormItem>
                    <FormLabel>Publish Date</FormLabel>
                    <FormControl>
                      <Input type="date" defaultValue={new Date().toISOString().split("T")[0]} />
                    </FormControl>
                  </FormItem>

                  <FormField
                    control={form.control}
                    name="expiresAt"
                    render={({ field }) => (
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
                    )}
                  />
                </div>

                {/* Body / Message */}
                <FormField
                  control={form.control}
                  name="body"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Write your announcement…"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="secondary" onClick={cancelCompose}>Cancel</Button>
                  <Button type="submit">Publish</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      {/* Announcements list — full width */}
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Active Announcements
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({visible.length} of {ANNOUNCEMENTS.length})
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
              <p className="text-sm font-semibold text-foreground">No active announcements</p>
              <p className="text-xs text-muted-foreground">All announcements have been dismissed.</p>
              <Button variant="ghost" size="sm" onClick={() => setDismissed([])}>Restore all</Button>
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
                  "w-full flex items-start gap-4 p-5 rounded-2xl relative border border-l-[5px] transition-all hover:-translate-y-px hover:shadow-md " +
                  cfg.card
                }
              >
                {/* Icon */}
                <div className={"w-12 h-12 rounded-xl flex items-center justify-center shrink-0 " + cfg.iconBox}>
                  <Icon size={22} />
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 pr-10">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[15px] font-bold text-foreground">{a.title}</span>
                    <Badge variant={AUDIENCE_VARIANT[a.audience] ?? "default"}>{a.audience}</Badge>
                    <Badge variant="outline" className={"text-[10px] " + cfg.badge}>{cfg.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.body}</p>
                  <span className="text-xs text-muted-foreground mt-2 block">
                    Posted by Admin · {a.date}
                  </span>
                </div>

                {/* Dismiss */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Dismiss announcement"
                  onClick={() => setDismissed(d => [...d, a.id])}
                  className={
                    "absolute top-4 right-4 h-7 w-7 border " + cfg.dismiss
                  }
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
