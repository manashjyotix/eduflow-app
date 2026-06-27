"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Plus, Upload, Users, Search, Filter, UserPlus } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { EmptyState } from "@/components/shared/empty-state"
import { ImportModal } from "@/components/shared/import-modal"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { TEACHERS } from "@/data/teachers"
import {
  createTeacherSchema, type CreateTeacherInput,
  SUBJECT_VALUES, staffRoleValues,
} from "@/lib/schemas/teacher"

const STATUS_COLORS = {
  active:   { badge: "success" as const,     label: "Active" },
  on_leave: { badge: "warning" as const,     label: "On Leave" },
  inactive: { badge: "secondary" as const,   label: "Inactive" },
}

const SUBJECT_COLORS: Record<string, string> = {
  "Mathematics":    "bg-[var(--ef-brand-light)] text-primary",
  "Science":        "bg-[var(--ef-amber-light)] text-warning-foreground",
  "English":        "bg-[var(--ef-green-light)] text-[var(--ef-green-dark)]",
  "Social Studies": "bg-[var(--ef-purple-light)] text-[var(--ef-purple)]",
  "Biology":        "bg-[var(--ef-cyan-light)] text-[var(--ef-cyan)]",
  "Physics":        "bg-[var(--ef-cyan-light)] text-[var(--ef-cyan)]",
  "Hindi":          "bg-[var(--ef-red-light)] text-[var(--ef-red-dark)]",
  "Assamese":       "bg-[var(--ef-amber-light)] text-warning-foreground",
  "History":        "bg-[var(--ef-purple-light)] text-[var(--ef-purple)]",
  "Geography":      "bg-[var(--ef-green-light)] text-[var(--ef-green-dark)]",
  "EVS":            "bg-[var(--ef-green-light)] text-[var(--ef-green-dark)]",
  "Physical Education": "bg-[var(--ef-red-light)] text-[var(--ef-red-dark)]",
  "Sanskrit":       "bg-[var(--ef-amber-light)] text-warning-foreground",
}

const DEFAULT_VALUES: CreateTeacherInput = {
  name: "",
  email: "",
  subjects: [],
  phone: "",
  role: "Subject Teacher",
  dailyProxyCap: 2,
  weeklyProxyCap: 5,
  status: "active",
}

export default function TeachersPage() {
  const [search, setSearch] = useState("")
  const [sectionFilter, setSectionFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [importOpen, setImportOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const form = useForm<CreateTeacherInput>({
    resolver: zodResolver(createTeacherSchema) as never,
    defaultValues: DEFAULT_VALUES,
  })

  const filtered = TEACHERS.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()) ||
      t.subjects.some(s => s.toLowerCase().includes(search.toLowerCase()))
    const matchSection = sectionFilter === "all" || t.section === sectionFilter
    const matchStatus  = statusFilter  === "all" || t.status  === statusFilter
    return matchSearch && matchSection && matchStatus
  })

  const active   = TEACHERS.filter(t => t.status === "active").length
  const onLeave  = TEACHERS.filter(t => t.status === "on_leave").length
  const inactive = TEACHERS.filter(t => t.status === "inactive").length

  function handleAddTeacher(values: CreateTeacherInput) {
    // In production this would call the API; for now just show a toast
    toast.success("Teacher added", {
      description: `${values.name} has been added to the teaching staff.`,
    })
    setAddOpen(false)
    form.reset(DEFAULT_VALUES)
  }

  function openAddDialog() {
    form.reset(DEFAULT_VALUES)
    setAddOpen(true)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <ImportModal
        open={importOpen}
        onOpenChange={setImportOpen}
        entityName="Teachers"
        onConfirm={(data) => {
          console.log("Imported teacher rows:", data)
        }}
      />

      <PageHeader
        icon={<Users size={20} />}
        title="Teachers"
        subtitle="Manage teaching staff at Holy Child English Academy"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <Upload className="size-4" /> Import
            </Button>
            <Button size="sm" onClick={openAddDialog}>
              <Plus className="size-4" /> Add Teacher
            </Button>
          </div>
        }
      />

      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="success" className="text-xs px-3 py-1">{active} Active</Badge>
        <Badge variant="warning" className="text-xs px-3 py-1">{onLeave} On Leave</Badge>
        <Badge variant="secondary" className="text-xs px-3 py-1">{inactive} Inactive</Badge>
        <span className="text-xs text-muted-foreground ml-1">{TEACHERS.length} total staff</span>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name, email, subject…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="w-36">
            <Filter className="size-3.5 mr-1" />
            <SelectValue placeholder="Section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            <SelectItem value="Primary">Primary</SelectItem>
            <SelectItem value="Middle">Middle</SelectItem>
            <SelectItem value="High">High</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Teacher Cards Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-10" />}
          title="No teachers found"
          description="Try adjusting your search or filters"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(teacher => {
            const statusConf = STATUS_COLORS[teacher.status]
            return (
              <Card key={teacher.id}>
                <CardContent className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0" aria-hidden="true">
                        {teacher.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{teacher.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{teacher.email}</p>
                      </div>
                    </div>
                    <Badge variant={statusConf.badge} className="text-[10px] capitalize flex-shrink-0">
                      {statusConf.label}
                    </Badge>
                  </div>

                  {/* Section + Subjects row */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <Badge variant="outline" className="text-[10px]">{teacher.section}</Badge>
                    {teacher.subjects.map(s => (
                      <span key={s} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${SUBJECT_COLORS[s] ?? "bg-muted text-muted-foreground"}`}>
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Proxy caps */}
                  <div className="text-[11px] text-muted-foreground bg-muted/50 rounded-md px-3 py-2 mb-3">
                    <span className="font-medium text-foreground">Proxy Cap: </span>
                    Daily {teacher.dailyProxyCap} · Weekly {teacher.weeklyProxyCap} · Monthly {teacher.monthlyProxyCap}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="xs" className="flex-1 text-xs">View</Button>
                    <Button variant="outline" size="xs" className="flex-1 text-xs">Edit</Button>
                    {teacher.status === "active" && (
                      <Button variant="outline" size="xs" className="flex-1 text-xs text-primary border-primary/30">
                        Assign Proxy
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Add Teacher Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="size-5" /> Add New Teacher
            </DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleAddTeacher)} className="flex flex-col gap-4">

              {/* Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Priya Sharma" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="teacher@hcea.edu" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input type="tel" placeholder="+91 98765 43210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Role */}
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {staffRoleValues.map(r => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Subjects (multi-select using toggleable buttons) */}
              <FormField
                control={form.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjects *</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-2">
                        {SUBJECT_VALUES.map(s => {
                          const selected = field.value.includes(s)
                          return (
                            <button
                              key={s}
                              type="button"
                              onClick={() => {
                                const next = selected
                                  ? field.value.filter((x: string) => x !== s)
                                  : [...field.value, s]
                                field.onChange(next)
                              }}
                              className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                selected
                                  ? "bg-primary text-white border-primary"
                                  : "bg-card border-border text-muted-foreground hover:bg-accent"
                              }`}
                            >
                              {s}
                            </button>
                          )
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Proxy caps */}
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="dailyProxyCap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Proxy Cap</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={10}
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weeklyProxyCap"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weekly Proxy Cap</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={30}
                          {...field}
                          onChange={e => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit">Add Teacher</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
