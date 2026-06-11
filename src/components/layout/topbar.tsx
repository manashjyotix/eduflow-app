"use client"
import { Bell, Search, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface TopbarProps {
  onMenuClick?: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={onMenuClick}>
        <PanelLeft className="size-4" />
        <span className="sr-only">Toggle menu</span>
      </Button>

      <div className="relative flex-1 max-w-sm hidden md:block">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
        <Input placeholder="Search..." className="pl-8 h-8 bg-muted border-0 text-sm" />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" className="relative">
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-destructive" />
          <span className="sr-only">Notifications</span>
        </Button>

        <button className="flex items-center gap-2 rounded-full">
          <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
            AP
          </div>
        </button>
      </div>
    </header>
  )
}
