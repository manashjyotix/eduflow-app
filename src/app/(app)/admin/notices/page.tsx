"use client"
import { useState } from "react"
import { toast } from "sonner"
import { Bell, Plus, Pin, Trash2, Edit2 } from "lucide-react"
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

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>(MOCK_NOTICES)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [tab, setTab] = useState("all")

  // Form state
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [priority, setPriority] = useState<Notice["priority"]>("medium")
  const [targets, setTargets] = useState<TargetRole[]>(["all"])
  const [expiresAt, setExpiresAt] = useState("")
  const [pinned, setPinned] = useState(false)

  const filtered = notices.filter(n => {
    if (tab === "pinned")   return n.pinned
    if (tab === "high")     return n.priority === "high"
    if (tab === "expired")  return new Date(n.expiresAt) < new Date()
    return true
  }).sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0))

  function toggleTarget(role: TargetRole) {
    setTargets(prev => prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role])
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
      author: "Admin",
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
        subtitle="Post and manage school announcements"
        actions={
          <Button onClick={() => setSheetOpen(true)}>
            <Plus className="size-4" /> Post Notice
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All ({notices.length})</TabsTrigger>
          <TabsTrigger value="pinned">Pinned</TabsTrigger>
          <TabsTrigger value="high">High Priority</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {filtered.length === 0 ? (
            <EmptyState icon={<Bell className="size-10" />} title="No notices" description="Post a notice to get started" />
          ) : (
            <div className="flex flex-col gap-4">
              {filtered.map(notice => {
                const priority = PRIORITY_VARIANT[notice.priority]
                return (
                  <Card
                    key={notice.id}
                    className={`relative overflow-hidden ${notice.pinned ? "border-l-4 border-l-warning-foreground" : ""}`}
                  >
                    <CardContent className="p-5">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={priority.badge} className="text-xs">{priority.label} Priority</Badge>
                          {notice.pinned && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning-foreground bg-warning/40 px-2 py-0.5 rounded">
                              <Pin className="size-3" /> Pinned
                            </span>
                          )}
                        </div>
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

      {/* Post Notice Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-[440px] sm:max-w-[440px] overflow-y-auto">
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
              {ROLE_OPTIONS.map(role => (
                <div key={role} className="flex items-center gap-2">
                  <Checkbox
                    id={`role-${role}`}
                    checked={targets.includes(role)}
                    onCheckedChange={() => toggleTarget(role)}
                  />
                  <label htmlFor={`role-${role}`} className="text-sm capitalize cursor-pointer">{role}</label>
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
    </div>
  )
}
