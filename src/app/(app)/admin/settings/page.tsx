"use client"
import { useState } from "react"
import { Settings, School, Clock, Bell, Lock } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${checked ? "bg-primary" : "bg-muted-foreground/30"}`}
    >
      <span className={`inline-block size-3.5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-4" : "translate-x-0.5"}`} />
    </button>
  )
}

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    schoolName: "Holy Child English Academy",
    board: "SEBA",
    principal: "Dr. Anupam Das",
    udise: "18040301104",
    smsEnabled: true,
    whatsappEnabled: false,
    emailEnabled: true,
    autoProxy: true,
    darkMode: false,
    perPeriodAttendance: true,
  })

  function toggle(key: keyof typeof settings) {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<Settings size={22} />}
        title="Settings"
        subtitle="School configuration and preferences"
        actions={<Button size="default">Save Changes</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* School Profile */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center gap-2">
            <School className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">School Profile</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-4">
            {[
              { label: "School Name", key: "schoolName" },
              { label: "Board",       key: "board" },
              { label: "Principal",   key: "principal" },
              { label: "UDISE Code",  key: "udise" },
            ].map(field => (
              <div key={field.key} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
                <Input
                  value={settings[field.key as keyof typeof settings] as string}
                  onChange={e => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                  className="h-8"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center gap-2">
            <Bell className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-4">
            {[
              { label: "SMS Notifications",       key: "smsEnabled",       sub: "Via MSG91" },
              { label: "WhatsApp Notifications",  key: "whatsappEnabled",  sub: "Via WATI Business API" },
              { label: "Email Notifications",     key: "emailEnabled",     sub: "Via SendGrid" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <Toggle
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onChange={() => toggle(item.key as keyof typeof settings)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Operations */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Operations</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-4">
            {[
              { label: "Auto-Assign Proxies",        key: "autoProxy",            sub: "Automatically suggest best-fit substitute" },
              { label: "Per-Period Attendance",       key: "perPeriodAttendance",  sub: "Take roll call per period (vs single daily)" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.sub}</p>
                </div>
                <Toggle
                  checked={settings[item.key as keyof typeof settings] as boolean}
                  onChange={() => toggle(item.key as keyof typeof settings)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center gap-2">
            <Lock className="size-4 text-muted-foreground" />
            <CardTitle className="text-base">Security</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-4 space-y-3">
            <Button variant="outline" size="sm" className="w-full justify-start">Change Password</Button>
            <Button variant="outline" size="sm" className="w-full justify-start">Manage Sessions</Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-destructive hover:text-destructive">Export & Delete Account Data</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
