"use client"

import { useState } from "react"
import {
  Users, UserPlus, Search, Filter, Phone, Mail,
  Building2, BadgeCheck, MoreHorizontal, Briefcase
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

const STAFF_MEMBERS = [
  { id: "s1", name: "Sunil Roy", role: "Principal", department: "Administration", phone: "9876543210", email: "principal@hcea.edu", status: "active", joinedYear: 2015 },
  { id: "s2", name: "Pradeep Singh", role: "Accountant", department: "Finance", phone: "9876543211", email: "accounts@hcea.edu", status: "active", joinedYear: 2018 },
  { id: "s3", name: "Kavita Devi", role: "Librarian", department: "Library", phone: "9876543212", email: "library@hcea.edu", status: "active", joinedYear: 2017 },
  { id: "s4", name: "Ramesh Baruah", role: "Peon", department: "Maintenance", phone: "9876543213", email: "peon1@hcea.edu", status: "active", joinedYear: 2020 },
  { id: "s5", name: "Bikash Das", role: "Security Guard", department: "Security", phone: "9876543214", email: "guard@hcea.edu", status: "active", joinedYear: 2019 },
  { id: "s6", name: "Hemanta Nath", role: "Office Clerk", department: "Administration", phone: "9876543215", email: "clerk@hcea.edu", status: "on_leave", joinedYear: 2021 },
  { id: "s7", name: "Ananya Borah", role: "School Nurse", department: "Health", phone: "9876543216", email: "nurse@hcea.edu", status: "active", joinedYear: 2022 },
  { id: "s8", name: "Debajit Kalita", role: "IT Administrator", department: "IT", phone: "9876543217", email: "it@hcea.edu", status: "active", joinedYear: 2023 },
  { id: "s9", name: "Mukesh Das", role: "Gardener", department: "Maintenance", phone: "9876543218", email: "garden@hcea.edu", status: "active", joinedYear: 2016 },
  { id: "s10", name: "Rita Gogoi", role: "Cook", department: "Canteen", phone: "9876543219", email: "canteen@hcea.edu", status: "active", joinedYear: 2020 },
]

const DEPARTMENTS = ["All Departments", "Administration", "Finance", "Library", "Maintenance", "Security", "Health", "IT", "Canteen"]

// 6-week staff headcount trend (total, active, on-leave) — used for sparklines
const STAFF_TOTAL_TREND = [8, 9, 9, 10, 10, 10] as const
const STAFF_ACTIVE_TREND = [7, 8, 8, 9, 9, 9] as const
const STAFF_LEAVE_TREND  = [1, 1, 1, 1, 1, 1] as const
const STAFF_DEPT_TREND   = [6, 6, 7, 7, 8, 8] as const

// Every department maps to an EduFlow brand primitive tint (ef-*-light bg +
// ef-* fg). The *-light tokens already shift to a low-opacity tint in dark
// mode, so these render correctly without separate `dark:` variants.
const DEPT_COLORS: Record<string, string> = {
  Administration: "bg-[var(--ef-brand-light)]  text-[var(--ef-brand)]",
  Finance:        "bg-[var(--ef-green-light)]  text-[var(--ef-green-dark)]",
  Library:        "bg-[var(--ef-amber-light)]  text-[var(--ef-amber-dark)]",
  Maintenance:    "bg-[var(--ef-amber-light)]  text-[var(--ef-amber-dark)]",
  Security:       "bg-[var(--ef-red-light)]    text-[var(--ef-red-dark)]",
  Health:         "bg-[var(--ef-purple-light)] text-[var(--ef-purple)]",
  IT:             "bg-[var(--ef-purple-light)] text-[var(--ef-purple-mid)]",
  Canteen:        "bg-[var(--ef-cyan-light)]   text-[var(--ef-cyan)]",
}

function getInitials(name: string) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
}

// Avatar palette built from saturated ef-* primitives — all carry white text
// legibly in both modes (no raw Tailwind palette colors).
const AVATAR_COLORS = [
  "bg-[var(--ef-brand)]",      "bg-[var(--ef-green)]",     "bg-[var(--ef-purple)]",
  "bg-[var(--ef-amber)]",      "bg-[var(--ef-cyan)]",      "bg-[var(--ef-red)]",
  "bg-[var(--ef-purple-mid)]", "bg-[var(--ef-green-dark)]","bg-[var(--ef-amber-dark)]",
  "bg-[var(--ef-brand-hover)]",
]

export default function StaffDirectoryPage() {
  const [search, setSearch] = useState("")
  const [deptFilter, setDeptFilter] = useState("All Departments")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = STAFF_MEMBERS.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase())
    const matchesDept = deptFilter === "All Departments" || s.department === deptFilter
    const matchesStatus = statusFilter === "all" || s.status === statusFilter
    return matchesSearch && matchesDept && matchesStatus
  })

  const active = STAFF_MEMBERS.filter(s => s.status === "active").length
  const onLeave = STAFF_MEMBERS.filter(s => s.status === "on_leave").length
  const departments = new Set(STAFF_MEMBERS.map(s => s.department)).size

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Briefcase size={20} />}
        title="Staff Directory"
        subtitle="Non-teaching staff management"
        actions={
          <Button>
            <UserPlus className="size-4 mr-2" />
            Add Staff
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard
          title="Total Staff"
          value={STAFF_MEMBERS.length}
          subtitle={`${active} active, ${onLeave} on leave`}
          icon={<Users size={18} />}
          tone="brand"
          trend={{ value: Math.round(((STAFF_TOTAL_TREND[5] - STAFF_TOTAL_TREND[4]) / Math.max(STAFF_TOTAL_TREND[4], 1)) * 100), label: "vs last week" }}
          sparkline={{ variant: "line", data: [...STAFF_TOTAL_TREND] }}
        />
        <KpiCard
          title="Active"
          value={active}
          subtitle={`${Math.round((active / STAFF_MEMBERS.length) * 100)}% of total staff`}
          icon={<BadgeCheck size={18} />}
          tone="green"
          trend={{ value: Math.round(((STAFF_ACTIVE_TREND[5] - STAFF_ACTIVE_TREND[4]) / Math.max(STAFF_ACTIVE_TREND[4], 1)) * 100), label: "vs last week" }}
          sparkline={{ variant: "bar", data: [...STAFF_ACTIVE_TREND] }}
        />
        <KpiCard
          title="On Leave"
          value={onLeave}
          subtitle={onLeave === 0 ? "All staff present" : `${onLeave} member${onLeave > 1 ? "s" : ""} absent today`}
          icon={<Users size={18} />}
          tone="amber"
          trend={{ value: Math.round(((STAFF_LEAVE_TREND[5] - STAFF_LEAVE_TREND[4]) / Math.max(STAFF_LEAVE_TREND[4], 1)) * 100), label: "vs last week" }}
          sparkline={{ variant: "bar", data: [...STAFF_LEAVE_TREND] }}
        />
        <KpiCard
          title="Departments"
          value={departments}
          subtitle={`${departments} active functional units`}
          icon={<Building2 size={18} />}
          tone="purple"
          trend={{ value: Math.round(((STAFF_DEPT_TREND[5] - STAFF_DEPT_TREND[4]) / Math.max(STAFF_DEPT_TREND[4], 1)) * 100), label: "vs last week" }}
          sparkline={{ variant: "bar", data: [...STAFF_DEPT_TREND] }}
        />
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search staff by name, role, department..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              <Select value={deptFilter} onValueChange={setDeptFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Staff Cards Grid */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="font-medium text-muted-foreground">No staff members found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((staff, idx) => (
            <Card key={staff.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`size-11 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} text-white flex items-center justify-center text-sm font-bold flex-shrink-0`} aria-hidden="true">
                      {getInitials(staff.name)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{staff.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{staff.role}</p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-7 flex-shrink-0" aria-label={`More actions for ${staff.name}`}>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>View Profile</DropdownMenuItem>
                      <DropdownMenuItem>Edit Details</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">Remove Staff</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="size-3 flex-shrink-0" />
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${DEPT_COLORS[staff.department] || "bg-muted text-muted-foreground"}`}>
                      {staff.department}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Phone className="size-3 flex-shrink-0" />
                    <span>{staff.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Mail className="size-3 flex-shrink-0" />
                    <span className="truncate">{staff.email}</span>
                  </div>
                </div>

                <Separator className="mb-3" />
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Since {staff.joinedYear}</span>
                  <Badge
                    variant={staff.status === "active" ? "success" : "warning"}
                    className="capitalize text-xs"
                  >
                    {staff.status === "on_leave" ? "On Leave" : staff.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary by Department */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Department Overview</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {Array.from(new Set(STAFF_MEMBERS.map(s => s.department))).map(dept => {
              const count = STAFF_MEMBERS.filter(s => s.department === dept).length
              return (
                <div key={dept} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/30 border border-border">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${DEPT_COLORS[dept] || "bg-muted text-muted-foreground"}`}>
                    {dept}
                  </span>
                  <span className="text-lg font-bold">{count}</span>
                  <span className="text-xs text-muted-foreground">member{count > 1 ? "s" : ""}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
