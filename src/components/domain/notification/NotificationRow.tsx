import type { Notification } from "@/data/mock-notifications"
import { Badge } from "@/components/ui/badge"
import {
  Bell, CheckCheck, Grid3x3, ClipboardList, ArrowLeftRight,
  Megaphone, Settings, DollarSign, BookOpen, Calendar, Info,
} from "lucide-react"

// ─── Type → icon / label / colour config ─────────────────────────────────────
type IconComp = React.ComponentType<{ className?: string }>

export interface NotificationTypeConfig {
  icon: IconComp
  label: string
  color: string
  bg: string
}

const TYPE_CONFIG: Record<string, NotificationTypeConfig> = {
  proxy:        { icon: Grid3x3,      label: "Proxy",        color: "text-primary",                                            bg: "bg-[var(--ef-brand-light)] dark:bg-[var(--ef-brand-muted)]"      },
  leave:        { icon: ClipboardList, label: "Leave",       color: "text-warning-foreground",                                 bg: "bg-[var(--ef-amber-light)] dark:bg-[var(--ef-amber-light)]"      },
  swap:         { icon: ArrowLeftRight,label: "Swap",        color: "text-[var(--ef-purple)]",                                 bg: "bg-[var(--ef-purple-light)] dark:bg-[var(--ef-purple-light)]"    },
  fee:          { icon: DollarSign,   label: "Fee",          color: "text-success-foreground",                                 bg: "bg-[var(--ef-green-light)] dark:bg-[var(--ef-green-light)]"      },
  announcement: { icon: Megaphone,    label: "Announcement", color: "text-[var(--ef-cyan)] dark:text-[var(--ef-cyan-light)]",  bg: "bg-[var(--ef-cyan-light)] dark:bg-[var(--ef-cyan-light)]"        },
  absence:      { icon: Bell,         label: "Absence",      color: "text-destructive",                                        bg: "bg-[var(--ef-red-light)] dark:bg-[var(--ef-red-light)]"          },
  system:       { icon: Settings,     label: "System",       color: "text-muted-foreground",                                   bg: "bg-muted dark:bg-muted/50"                                       },
  // Parent-facing type aliases
  attendance:   { icon: Calendar,     label: "Attendance",   color: "text-destructive",                                        bg: "bg-[var(--ef-red-light)] dark:bg-[var(--ef-red-light)]"          },
  academic:     { icon: BookOpen,     label: "Academic",     color: "text-primary",                                            bg: "bg-[var(--ef-brand-light)] dark:bg-[var(--ef-brand-muted)]"      },
  info:         { icon: Info,         label: "Info",         color: "text-muted-foreground",                                   bg: "bg-muted dark:bg-muted/50"                                       },
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface NotificationRowProps {
  notification: Notification
  onMarkRead?: (id: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export function NotificationRow({ notification: n, onMarkRead }: NotificationRowProps) {
  const cfg: NotificationTypeConfig = TYPE_CONFIG[n.type] ?? TYPE_CONFIG["system"]
  const Icon = cfg.icon

  return (
    <li
      role="button"
      tabIndex={0}
      aria-label={`${n.title}${!n.read ? " (unread)" : ""}`}
      className={`flex gap-4 px-5 py-4 cursor-pointer hover:bg-muted/20 transition-colors ${
        !n.read ? "bg-primary/5" : ""
      }`}
      onClick={() => onMarkRead?.(n.id)}
      onKeyDown={e => {
        if (e.key === "Enter" || e.key === " ") onMarkRead?.(n.id)
      }}
    >
      {/* Icon bubble */}
      <div
        className={`flex-shrink-0 size-9 rounded-full flex items-center justify-center ${cfg.bg}`}
        aria-hidden="true"
      >
        <Icon className={`size-4 ${cfg.color}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm font-medium leading-tight ${
              !n.read ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {n.title}
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            {!n.read && (
              <span
                className="size-2 rounded-full bg-primary"
                aria-label="Unread"
              />
            )}
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {timeAgo(n.createdAt)}
            </span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1 leading-snug">{n.body}</p>
        <Badge variant="outline" className="mt-2 text-[10px] h-4 px-1.5 capitalize">
          {cfg.label}
        </Badge>
      </div>
    </li>
  )
}

// Re-export the type config for consumers that need custom colour lookups
export { TYPE_CONFIG }
