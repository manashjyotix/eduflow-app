"use client"

import { useState } from "react"
import {
  ShieldCheck, Users, Lock, Settings, ChevronDown, ChevronUp
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

interface Permission {
  id: string
  label: string
  description: string
  category: string
}

interface Role {
  id: string
  name: string
  description: string
  userCount: number
  color: string
  bgColor: string
  permissions: Record<string, boolean>
}

const PERMISSIONS: Permission[] = [
  { id: "dashboard", label: "Dashboard Access", description: "View main dashboard and KPI cards", category: "General" },
  { id: "proxy_view", label: "View Proxy Board", description: "See proxy assignments and coverage", category: "Proxy" },
  { id: "proxy_assign", label: "Assign Proxies", description: "Create and modify proxy assignments", category: "Proxy" },
  { id: "absence_view", label: "View Absences", description: "See teacher absence records", category: "Absence" },
  { id: "absence_mark", label: "Mark Absences", description: "Record teacher absences", category: "Absence" },
  { id: "absence_approve", label: "Approve Absences", description: "Approve or reject absence requests", category: "Absence" },
  { id: "fee_view", label: "View Fee Records", description: "Access fee collection data", category: "Finance" },
  { id: "fee_collect", label: "Collect Fees", description: "Record fee payments", category: "Finance" },
  { id: "fee_manage", label: "Manage Fee Structure", description: "Add/edit fee heads and amounts", category: "Finance" },
  { id: "reports", label: "Generate Reports", description: "Create PDF/Excel reports", category: "Reports" },
  { id: "settings", label: "Settings Access", description: "Modify school/system settings", category: "Settings" },
  { id: "user_manage", label: "User Management", description: "Add, edit, remove users", category: "Settings" },
]

const INITIAL_ROLES: Role[] = [
  {
    id: "super_admin", name: "Super Admin", description: "Platform-level administrator with full access to all tenants",
    userCount: 1, color: "text-[var(--ef-purple)]",    bgColor: "bg-[var(--ef-purple-light)]",
    permissions: { dashboard: true, proxy_view: true, proxy_assign: true, absence_view: true, absence_mark: true, absence_approve: true, fee_view: true, fee_collect: true, fee_manage: true, reports: true, settings: true, user_manage: true },
  },
  {
    id: "admin", name: "Admin", description: "School administrator managing day-to-day operations",
    userCount: 2, color: "text-[var(--ef-brand)]",    bgColor: "bg-[var(--ef-brand-light)]",
    permissions: { dashboard: true, proxy_view: true, proxy_assign: true, absence_view: true, absence_mark: true, absence_approve: true, fee_view: true, fee_collect: true, fee_manage: true, reports: true, settings: true, user_manage: false },
  },
  {
    id: "management", name: "Management", description: "School management oversight of academic operations",
    userCount: 3, color: "text-[var(--ef-green-dark)]",    bgColor: "bg-[var(--ef-green-light)]",
    permissions: { dashboard: true, proxy_view: true, proxy_assign: false, absence_view: true, absence_mark: false, absence_approve: true, fee_view: true, fee_collect: false, fee_manage: false, reports: true, settings: false, user_manage: false },
  },
  {
    id: "teacher", name: "Teacher", description: "Teaching staff with personal schedule and proxy access",
    userCount: 10, color: "text-[var(--ef-amber-dark)]",    bgColor: "bg-[var(--ef-amber-light)]",
    permissions: { dashboard: true, proxy_view: false, proxy_assign: false, absence_view: false, absence_mark: true, absence_approve: false, fee_view: false, fee_collect: false, fee_manage: false, reports: false, settings: false, user_manage: false },
  },
  {
    id: "parent", name: "Parent", description: "Parent/guardian with child-specific view",
    userCount: 180, color: "text-[var(--ef-red-dark)]", bgColor: "bg-[var(--ef-red-light)]",
    permissions: { dashboard: false, proxy_view: false, proxy_assign: false, absence_view: false, absence_mark: false, absence_approve: false, fee_view: true, fee_collect: false, fee_manage: false, reports: false, settings: false, user_manage: false },
  },
]

const PERMISSION_CATEGORIES = ["General", "Proxy", "Absence", "Finance", "Reports", "Settings"]

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES)
  const [expandedRole, setExpandedRole] = useState<string | null>("admin")

  const togglePermission = (roleId: string, permId: string) => {
    setRoles(prev => prev.map(r =>
      r.id === roleId
        ? { ...r, permissions: { ...r.permissions, [permId]: !r.permissions[permId] } }
        : r
    ))
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<ShieldCheck size={20} />}
        title="Roles & Permissions"
        subtitle="Access control management for EduFlow roles"
        actions={
          <Button variant="outline">
            <Settings className="size-4 mr-2" />
            Save Changes
          </Button>
        }
      />

      {/* Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {INITIAL_ROLES.map(role => (
          <div key={role.id} className={`rounded-xl border border-border p-4 ${role.bgColor}`}>
            <p className={`text-sm font-semibold ${role.color}`}>{role.name}</p>
            <p className="text-2xl font-bold mt-1">{role.userCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">user{role.userCount !== 1 ? "s" : ""}</p>
          </div>
        ))}
      </div>

      {/* Role Cards */}
      <div className="flex flex-col gap-4">
        {roles.map(role => {
          const isExpanded = expandedRole === role.id
          const enabledCount = Object.values(role.permissions).filter(Boolean).length
          const totalCount = PERMISSIONS.length

          return (
            <Card key={role.id} className="overflow-hidden">
              {/* Role Header */}
              <CardHeader
                className="cursor-pointer select-none hover:bg-muted/30 transition-colors"
                onClick={() => setExpandedRole(isExpanded ? null : role.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`size-9 rounded-lg ${role.bgColor} flex items-center justify-center`}>
                      <ShieldCheck className={`size-5 ${role.color}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{role.name}</CardTitle>
                        <Badge variant="secondary" className="text-xs">
                          {role.userCount} user{role.userCount !== 1 ? "s" : ""}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold">{enabledCount}/{totalCount}</p>
                      <p className="text-xs text-muted-foreground">permissions</p>
                    </div>
                    {isExpanded ? <ChevronUp className="size-5 text-muted-foreground" /> : <ChevronDown className="size-5 text-muted-foreground" />}
                  </div>
                </div>
              </CardHeader>

              {/* Permissions Grid */}
              {isExpanded && (
                <>
                  <Separator />
                  <CardContent className="p-4">
                    {PERMISSION_CATEGORIES.map(category => {
                      const catPerms = PERMISSIONS.filter(p => p.category === category)
                      return (
                        <div key={category} className="mb-5 last:mb-0">
                          <div className="flex items-center gap-2 mb-3">
                            <Lock className="size-3.5 text-muted-foreground" />
                            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{category}</span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {catPerms.map(perm => (
                              <div
                                key={perm.id}
                                className={`flex items-center justify-between gap-3 p-3 rounded-lg border transition-colors ${
                                  role.permissions[perm.id]
                                    ? "border-primary/30 bg-primary/5"
                                    : "border-border bg-muted/20"
                                }`}
                              >
                                <div className="min-w-0">
                                  <p className="text-sm font-medium">{perm.label}</p>
                                  <p className="text-xs text-muted-foreground truncate">{perm.description}</p>
                                </div>
                                <Switch
                                  checked={role.permissions[perm.id] ?? false}
                                  onCheckedChange={() => togglePermission(role.id, perm.id)}
                                  disabled={role.id === "super_admin"}
                                  className="flex-shrink-0"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    {role.id === "super_admin" && (
                      <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
                        <Lock className="size-3" />
                        Super Admin permissions are locked and cannot be modified.
                      </p>
                    )}
                  </CardContent>
                </>
              )}
            </Card>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground items-center">
        <Users className="size-4" />
        <span>Click any role card to expand/collapse its permissions.</span>
        <span>Changes take effect after saving.</span>
        <span className="flex items-center gap-1"><Lock className="size-3" /> Super Admin permissions cannot be changed.</span>
      </div>
    </div>
  )
}
