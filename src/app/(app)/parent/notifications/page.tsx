"use client"

import { useState } from "react"
import { Bell, CheckCheck, Filter } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { PARENT_NOTIFICATIONS } from "@/data/mock-notifications"
import { NotificationRow } from "@/components/domain/notification/NotificationRow"

type FilterType = "all" | "unread" | "absence" | "fee" | "announcement"

const FILTERS: { id: FilterType; label: string }[] = [
  { id: "all",          label: "All" },
  { id: "unread",       label: "Unread" },
  { id: "absence",      label: "Attendance" },
  { id: "fee",          label: "Fees" },
  { id: "announcement", label: "Academic" },
]

export default function ParentNotificationsPage() {
  const [notifications, setNotifications] = useState(PARENT_NOTIFICATIONS)
  const [filter, setFilter] = useState<FilterType>("all")

  const filtered = notifications.filter(n => {
    if (filter === "unread")       return !n.read
    if (filter === "absence")      return n.type === "absence"
    if (filter === "fee")          return n.type === "fee"
    if (filter === "announcement") return n.type === "announcement" || n.type === "leave"
    return true
  })

  const unreadCount = notifications.filter(n => !n.read).length

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function markRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Bell size={20} />}
        title="Notifications"
        subtitle="School updates for Rohit Das"
        actions={
          unreadCount > 0 ? (
            <Button variant="outline" size="sm" onClick={markAllRead} className="gap-2">
              <CheckCheck className="size-4" />
              Mark all read
            </Button>
          ) : undefined
        }
      />

      {/* Unread badge */}
      {unreadCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="inline-flex items-center justify-center size-5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {unreadCount}
          </span>
          unread notification{unreadCount > 1 ? "s" : ""}
        </div>
      )}

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="size-4 text-muted-foreground flex-shrink-0" />
        {FILTERS.map(f => (
          <Button
            key={f.id}
            variant={filter === f.id ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs rounded-full"
            onClick={() => setFilter(f.id)}
          >
            {f.label}
            {f.id === "unread" && unreadCount > 0 && (
              <span className="ml-1 size-4 rounded-full bg-primary-foreground text-primary text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Notification list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            {filter === "all"
              ? `All Notifications (${notifications.length})`
              : `${FILTERS.find(f => f.id === filter)?.label} (${filtered.length})`}
          </CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No notifications in this category.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map(n => (
                <NotificationRow key={n.id} notification={n} onMarkRead={markRead} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
