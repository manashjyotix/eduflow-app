"use client"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Bell, Plus, Pin, Trash2, Edit2, Search, X } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MOCK_NOTICES, type Notice } from "@/data/mock-data"

const PRIORITY_VARIANT = {
  high:   { badge: "destructive" as const, label: "High" },
  medium: { badge: "warning" as const,     label: "Medium" },
  low:    { badge: "secondary" as const,   label: "Low" },
}

const ROLE_OPTIONS = ["all", "admin", "management", "teacher", "parent"] as const
type TargetRole = Notice["targetRoles"][number]

export type NoticeRole =
  | "admin" | "management" | "teacher" | "parent" | "super_admin"

// Roles that can post / pin / delete notices.
const CAN_MANAGE: NoticeRole[] = ["admin", "management", "super_admin"]

// Which notices a role is allowed to see. Managers see everything; teacher /
// parent only see notices targeted at them (or "all").
const VISIBLE_FOR: Record<NoticeRole, TargetRole[] | "*"> = {
  admin: "*",
  management: "*",
  super_admin: "*",
  teacher: ["all", "teacher"],
  parent: ["all", "parent"],
}

const AUTHOR_BY_ROLE: Record<NoticeRole, string> = {
  admin: "Admin",
  management: "Management",
  super_admin: "Platform Admin",
  teacher: "Admin",
  parent: "Admin",
}

interface NoticeBoardViewProps {
  role: NoticeRole
  subtitle?: string
}

export function NoticeBoardView({ role, subtitle }: NoticeBoardViewProps) {
  const canManage = CAN_MANAGE.includes(role)
  const allowed = VISIBLE_FOR[role]

  const seed = useMemo(
    () => MOCK_NOTICES.filter(n => allowed === "*" || n.targetRoles.some(r => allowed.includes(r))),
    [allowed]
  )

  const [notices, setNotices] = useState<Notice[]>(seed)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [tab, setTab] = useState("all")
  const [query, setQuery] = useState("")

  // Form state
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [priority, setPriority] = useState<Notice["priority"]>("medium")
  const [targets, setTargets] = useState<TargetRole[]>(["all"])
  const [expiresAt, setExpiresAt] = useState("")
  const [pinned, setPinned] = useState(false)

  const filtered = notices
    .filter(n => {
      if (tab === "pinned")  return n.pinned
      if (tab === "high")    return n.priority === "high"
      if (tab === "expired") return new Date(n.expiresAt) < new Date()
      return true
    })
    .filter(n => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      return n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.author.toLowerCase().includes(q)
    })
    .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  function toggleTarget(r: TargetRole) {
    setTargets(prev => prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r])
  }

  function resetForm() {
    setTitle(""); setBody(""); setPriority("medium")
    setTargets(["all"]); setExpiresAt(""); setPinned(false)
  }

  function postNotice() {
    if (!title.trim() || !body.trim()) {
      toast.error("Title and content are required.")
      return
    }
    const today = new Date()
    const newNotice: Notice = {
      id: `n${Date.now()}`,
      title: title.trim(),
      body: body.trim(),
      author: AUTHOR_BY_ROLE[role],
      targetRoles: (targets.length ? targets : ["all"]) as TargetRole[],
      priority,
      expiresAt: expiresAt || today.toISOString().split("T")[0],
      createdAt: today.toISOString().split("T")[0],
      pinned,
    }
    setNotices(prev => [newNotice, ...prev])
    resetForm()
    setSheetOpen(false)
    toast.success("Notice posted", { description: `"${newNotice.title}" is now live.` })
  }

  function togglePin(id: string) {
    setNotices(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n))
    const n = notices.find(x => x.id === id)
    toast(n?.pinned ? "Notice unpinned" : "Notice pinned", { description: n?.title })
  }

  function removeNotice(id: string) {
    const n = notices.find(x => x.id === id)
    setNotices(prev => prev.filter(x => x.id !== id))
    toast.error("Notice deleted", { description: n?.title })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Bell size={20} />}
        title="Notice Board"
        subtitle={subtitle ?? (canManage
          ? "Post and manage school announcements"
          : "School notices and circulars")}
        actions={canManage ? (
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="size-4" /> Post Notice
          </Button>
        ) : undefined}
      />

      {/* Search + tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="all" className="flex-1 sm:flex-none">All ({notices.length})</TabsTrigger>
            <TabsTrigger value="pinned" className="flex-1 sm:flex-none">Pinned</TabsTrigger>
            <TabsTrigger value="high" className="flex-1 sm:flex-none">High Priority</TabsTrigger>
            <TabsTrigger value="expired" className="flex-1 sm:flex-none">Expired</TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search old notices…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </div>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Bell className="size-10" />}
              title={query ? "No matching notices" : "No notices"}
              description={query ? "Try a different search term." : (canManage ? "Post a notice to get started" : "There are no notices right now.")}
            />
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map(notice => {
                const p = PRIORITY_VARIANT[notice.priority]
                return (
                  <Card key={notice.id} className="relative overflow-hidden">
                    <CardContent className="p-5">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={p.badge} className="text-xs">{p.label} Priority</Badge>
                          {notice.pinned && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning-foreground bg-warning/40 px-2 py-0.5 rounded">
                              <Pin className="size-3" /> Pinned
                            </span>
                          )}
                        </div>
                        {canManage && (
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <Button variant="ghost" size="xs" className="text-muted-foreground" onClick={() => toast("Edit notice", { description: `"${notice.title}" — edit flow.` })}>
                              <Edit2 className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => togglePin(notice.id)} title={notice.pinned ? "Unpin" : "Pin"}>
                              <Pin className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="xs" className="text-destructive" onClick={() => removeNotice(notice.id)}>
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>

                      <h3 className="font-semibold text-sm mb-1.5 leading-snug">{notice.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-3">{notice.body}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between flex-wrap gap-2 pt-3 border-t border-border">
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>By <span className="font-medium text-foreground">{notice.author}</span></span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>Posted {new Date(notice.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                          <Separator orientation="vertical" className="h-3" />
                          <span>Expires {new Date(notice.expiresAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        </div>
                        <div className="flex gap-1 flex-wrap">
                          {notice.targetRoles.map(r => (
                            <Badge key={r} variant="outline" className="text-[10px] capitalize">{r}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Post Notice Sheet — managers only */}
      {canManage && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-full max-w-[440px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Post New Notice</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-4 mt-6">
              <div className="space-y-1.5">
                <Label>Title</Label>
                <Input placeholder="Notice title…" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Content</Label>
                <Textarea placeholder="Write your announcement…" rows={4} value={body} onChange={e => setBody(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={v => setPriority(v as Notice["priority"])}>
                  <SelectTrigger><SelectValue placeholder="Select priority…" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Audience</Label>
                {ROLE_OPTIONS.map(r => (
                  <div key={r} className="flex items-center gap-2">
                    <Checkbox id={`role-${r}`} checked={targets.includes(r)} onCheckedChange={() => toggleTarget(r)} />
                    <label htmlFor={`role-${r}`} className="text-sm capitalize cursor-pointer">{r}</label>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label>Expiry Date</Label>
                <Input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="pin-notice" checked={pinned} onCheckedChange={v => setPinned(v === true)} />
                <label htmlFor="pin-notice" className="text-sm cursor-pointer">Pin this notice to the top</label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSheetOpen(false)}>Cancel</Button>
                <Button className="flex-1" onClick={postNotice}>Post Notice</Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
