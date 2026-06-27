"use client"

import { useState } from "react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Building2, CalendarDays, Zap, GraduationCap, Rocket,
  Check, CheckCircle, ChevronLeft, ChevronRight,
  Plus, Trash2, Users, Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  onboardingStep0Schema, type OnboardingStep0Input,
  onboardingStep1Schema, type OnboardingStep1Input,
  onboardingStep2Schema, type OnboardingStep2Input,
  onboardingStep3Schema, type OnboardingStep3Input,
  onboardingStep4Schema, type OnboardingStep4Input,
  boardValues, stateValues, classRangeValues,
  periodsPerDayValues, academicMonthValues, workingDayValues,
  onboardingSubjectValues, onboardingStaffRoleValues,
} from "@/lib/schemas/onboarding"

// ── Static option lists (for display labels — values sourced from schemas) ──
const BOARDS = [...boardValues]
const STATES = [...stateValues]
const CLASS_RANGES = [...classRangeValues]
const SUBJECTS = [...onboardingSubjectValues]
const STAFF_ROLES = [...onboardingStaffRoleValues]
const WORK_DAYS = [...workingDayValues]
const MONTHS = [...academicMonthValues]

// ── Step config (icons + labels) ──
const STEPS = [
  { id: "school", label: "School Details", icon: Building2 },
  { id: "academic", label: "Academic Setup", icon: CalendarDays },
  { id: "timetable", label: "Periods Setup", icon: Zap },
  { id: "staff", label: "Add Teachers", icon: GraduationCap },
  { id: "review", label: "Review & Launch", icon: Rocket },
]

// ── Step-indicator state styles ──
const STEP_STATE_STYLES = {
  done: {
    circle: "bg-ef-green text-white",
    label: "text-ef-green-dark",
    connector: "bg-ef-green",
  },
  active: {
    circle: "bg-primary text-white ring-4 ring-ef-brand-light",
    label: "text-primary",
    connector: "bg-border",
  },
  upcoming: {
    circle: "bg-muted text-muted-foreground",
    label: "text-muted-foreground",
    connector: "bg-border",
  },
} as const

// ── Per-step accent header styles ──
const STEP_ACCENTS = {
  school: "bg-ef-brand-light text-primary",
  academic: "bg-ef-cyan-light text-ef-cyan",
  timetable: "bg-ef-amber-light text-ef-amber",
  staff: "bg-ef-purple-light text-ef-purple",
  review: "bg-ef-green-light text-ef-green",
} as const

export default function OnboardingWizardPage() {
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  // ── Step 0 form ──
  const form0 = useForm<OnboardingStep0Input>({
    resolver: zodResolver(onboardingStep0Schema),
    mode: "onTouched",
    defaultValues: {
      schoolName: "Holy Child English Academy",
      about: "",
      address: "Howly, Barpeta",
      city: "Howly",
      state: "Assam",
      board: "State Board (Assam)",
      classes: "VI–X",
      totalTeachers: "15",
      totalStudents: "420",
      principalName: "",
      principalEmail: "",
      principalPhone: "",
    },
  })

  // ── Step 1 form ──
  const form1 = useForm<OnboardingStep1Input>({
    resolver: zodResolver(onboardingStep1Schema),
    mode: "onTouched",
    defaultValues: {
      startTime: "09:30",
      endTime: "14:30",
      periodsPerDay: "7",
      breakTime: "12:10",
      academicMonth: "April",
      workingDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    },
  })

  // ── Step 2 form ──
  const form2 = useForm<OnboardingStep2Input>({
    resolver: zodResolver(onboardingStep2Schema),
    mode: "onTouched",
    defaultValues: {
      periods: [
        { name: "Period 1", start: "09:30", end: "10:10" },
        { name: "Period 2", start: "10:10", end: "10:50" },
        { name: "Period 3", start: "10:50", end: "11:30" },
        { name: "Break",    start: "11:30", end: "11:45" },
        { name: "Period 4", start: "11:45", end: "12:25" },
        { name: "Period 5", start: "12:25", end: "13:05" },
        { name: "Lunch",    start: "13:05", end: "13:45" },
        { name: "Period 6", start: "13:45", end: "14:25" },
        { name: "Period 7", start: "14:25", end: "15:05" },
      ],
    },
  })

  // ── Step 3 form ──
  const form3 = useForm<OnboardingStep3Input>({
    resolver: zodResolver(onboardingStep3Schema),
    mode: "onTouched",
    defaultValues: {
      staff: [
        { name: "Priya Sharma", subject: "Mathematics", role: "Class Teacher",    email: "" },
        { name: "Rajesh Kalita", subject: "Science",     role: "Subject Teacher",  email: "" },
        { name: "",              subject: "English",     role: "Subject Teacher",  email: "" },
      ],
    },
  })

  // ── Step 4 form ──
  const form4 = useForm<OnboardingStep4Input>({
    resolver: zodResolver(onboardingStep4Schema),
    mode: "onTouched",
    defaultValues: { acknowledged: false },
  })

  // Convenience: current form's handleSubmit / isValid
  const forms = [form0, form1, form2, form3, form4] as const

  // Derived display values for the review step and success screen
  const s0 = form0.watch()
  const s1 = form1.watch()
  const s2 = form2.watch()
  const s3 = form3.watch()

  const filledTeachers = (s3.staff ?? []).filter((s) => s.name && s.name.trim().length > 0).length
  const progress = Math.round(((step + 1) / STEPS.length) * 100)

  // ── Advance to next step only if current step validates ──
  function handleContinue() {
    const currentForm = forms[step]
    currentForm.handleSubmit(() => {
      setStep((s) => Math.min(STEPS.length - 1, s + 1))
    })()
  }

  function handleLaunch() {
    form4.handleSubmit(() => {
      setDone(true)
    })()
  }

  // ── Period helpers (operate on form2's field array) ──
  function addPeriod() {
    const current = form2.getValues("periods") ?? []
    const nextNum = current.filter((x) => x.name.startsWith("Period")).length + 1
    form2.setValue("periods", [...current, { name: `Period ${nextNum}`, start: "", end: "" }])
  }
  function updatePeriod(i: number, k: "name" | "start" | "end", v: string) {
    const current = [...(form2.getValues("periods") ?? [])]
    current[i] = { ...current[i], [k]: v }
    form2.setValue("periods", current, { shouldValidate: true })
  }
  function removePeriod(i: number) {
    const current = form2.getValues("periods") ?? []
    form2.setValue("periods", current.filter((_, idx) => idx !== i), { shouldValidate: true })
  }

  // ── Staff helpers (operate on form3's field array) ──
  function addStaff() {
    const current = form3.getValues("staff") ?? []
    form3.setValue("staff", [...current, { name: "", subject: undefined, role: undefined, email: "" }])
  }
  function updateStaff(i: number, k: "name" | "subject" | "role" | "email", v: string) {
    const current = [...(form3.getValues("staff") ?? [])]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    current[i] = { ...current[i], [k]: v as any }
    form3.setValue("staff", current, { shouldValidate: true })
  }
  function removeStaff(i: number) {
    const current = form3.getValues("staff") ?? []
    form3.setValue("staff", current.filter((_, idx) => idx !== i), { shouldValidate: true })
  }

  // ── Success screen ──
  if (done) {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center px-4 py-12 fade-in">
        <Card className="max-w-md w-full border-2 border-ef-green">
          <CardContent className="p-10 text-center">
            <div className="size-20 rounded-full bg-ef-green-light flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="size-10 text-ef-green" />
            </div>
            <Badge variant="success" className="mb-4">14-day free trial active</Badge>
            <h2 className="text-2xl font-bold mb-2">{s0.schoolName || "Your school"} is live! 🎉</h2>
            <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
              Your admin dashboard is ready. You&apos;ve added <strong>{filledTeachers}</strong> teachers
              and configured <strong>{(s2.periods ?? []).length}</strong> daily periods.
            </p>
            <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3 mb-6">
              <div className="p-3 rounded-xl bg-muted text-center">
                <div className="text-2xl font-black text-ef-purple">{filledTeachers}</div>
                <div className="text-xs text-muted-foreground">Teachers</div>
              </div>
              <div className="p-3 rounded-xl bg-muted text-center">
                <div className="text-2xl font-black text-ef-amber">{(s2.periods ?? []).length}</div>
                <div className="text-xs text-muted-foreground">Periods</div>
              </div>
              <div className="p-3 rounded-xl bg-muted text-center">
                <div className="text-2xl font-black text-ef-green">14</div>
                <div className="text-xs text-muted-foreground">Trial days</div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="w-full" size="lg" asChild>
                <Link href="/admin/dashboard">
                  <Zap className="size-4" /> Go to Dashboard <ChevronRight className="size-4" />
                </Link>
              </Button>
              <Button variant="secondary" className="w-full" asChild>
                <Link href="/admin/students">
                  <Users className="size-4" /> Import Students
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background fade-in">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3">
            <Zap className="size-3 mr-1" /> School Setup Wizard
          </Badge>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Let&apos;s set up your school</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Takes about 5 minutes. You can update everything later.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-start justify-between">
            {STEPS.map((s, i) => {
              const Icon = s.icon
              const state = i < step ? "done" : i === step ? "active" : "upcoming"
              const styles = STEP_STATE_STYLES[state]
              return (
                <div key={s.id} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className={`size-9 rounded-full flex items-center justify-center transition-all ${styles.circle}`}>
                    {state === "done" ? <Check className="size-4" /> : <Icon className="size-4" />}
                  </div>
                  <span className={`text-[10px] font-semibold text-center leading-tight ${styles.label}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground text-center">
            Step {step + 1} of {STEPS.length} — {STEPS[step].label}
          </p>
        </div>

        <Card>
          <CardContent className="p-6 flex flex-col gap-4">

            {/* ── Step 0: School Details ── */}
            {step === 0 && (
              <Form {...form0}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`size-9 rounded-xl flex items-center justify-center ${STEP_ACCENTS.school}`}>
                    <Building2 className="size-[18px]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">School Information</p>
                    <p className="text-xs text-muted-foreground">Tell us about your school</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form0.control} name="schoolName" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>School Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Holy Child English Academy" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form0.control} name="about" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>About / Tagline</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="A short description of your school (optional)"
                          rows={2}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form0.control} name="address" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Town, District, State" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form0.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>City / Town <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="Howly" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form0.control} name="state" render={({ field }) => (
                    <FormItem>
                      <FormLabel>State <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>{STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form0.control} name="board" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Board <span className="text-destructive">*</span></FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select board" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>{BOARDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form0.control} name="classes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classes Offered</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>{CLASS_RANGES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form0.control} name="totalTeachers" render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. of Teachers</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="15" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form0.control} name="totalStudents" render={({ field }) => (
                    <FormItem>
                      <FormLabel>No. of Students</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="420" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <div className="md:col-span-2">
                    <p className="text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">
                      Principal / Point of Contact
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <FormField control={form0.control} name="principalName" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Dr. Kavita Bora" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form0.control} name="principalEmail" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="principal@school.edu" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form0.control} name="principalPhone" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <Input type="tel" placeholder="+91 98765 43210" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                    </div>
                  </div>
                </div>
              </Form>
            )}

            {/* ── Step 1: Academic Setup ── */}
            {step === 1 && (
              <Form {...form1}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`size-9 rounded-xl flex items-center justify-center ${STEP_ACCENTS.academic}`}>
                    <Clock className="size-[18px]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Academic Configuration</p>
                    <p className="text-xs text-muted-foreground">Set your school hours and working days</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField control={form1.control} name="startTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>School Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form1.control} name="endTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>School End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form1.control} name="periodsPerDay" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Periods Per Day</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {([...periodsPerDayValues] as string[]).map((n) => (
                            <SelectItem key={n} value={n}>{n} periods</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form1.control} name="breakTime" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Break / Tiffin Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />

                  <FormField control={form1.control} name="academicMonth" render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Academic Year Starts In</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {MONTHS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <FormField control={form1.control} name="workingDays" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Working Days</FormLabel>
                    <div className="flex flex-wrap gap-3 p-3 rounded-xl bg-muted">
                      {WORK_DAYS.map((day) => (
                        <label key={day} className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                          <Checkbox
                            checked={(field.value ?? []).includes(day)}
                            onCheckedChange={(checked) => {
                              const current = field.value ?? []
                              field.onChange(
                                checked
                                  ? [...current, day]
                                  : current.filter((d) => d !== day)
                              )
                            }}
                          />
                          {day}
                        </label>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />
              </Form>
            )}

            {/* ── Step 2: Periods Setup ── */}
            {step === 2 && (
              <Form {...form2}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`size-9 rounded-xl flex items-center justify-center ${STEP_ACCENTS.timetable}`}>
                    <Zap className="size-[18px]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Daily Period Schedule</p>
                    <p className="text-xs text-muted-foreground">Set your school&apos;s daily timetable structure</p>
                  </div>
                </div>

                {/* Top-level periods array error (e.g. "At least one period required") */}
                {form2.formState.errors.periods?.root && (
                  <p className="text-sm text-destructive">{form2.formState.errors.periods.root.message}</p>
                )}
                {typeof form2.formState.errors.periods?.message === "string" && (
                  <p className="text-sm text-destructive">{form2.formState.errors.periods.message}</p>
                )}

                <div className="flex flex-col gap-2">
                  {(s2.periods ?? []).map((p, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-start p-2.5 rounded-xl bg-muted">
                      <FormField control={form2.control} name={`periods.${i}.name`} render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormControl>
                            <Input
                              value={p.name}
                              onChange={(e) => { field.onChange(e); updatePeriod(i, "name", e.target.value) }}
                              onBlur={field.onBlur}
                              placeholder="Period name"
                              className="text-xs"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Input
                        type="time" value={p.start}
                        onChange={(e) => updatePeriod(i, "start", e.target.value)}
                        className="text-xs w-32"
                      />
                      <Input
                        type="time" value={p.end}
                        onChange={(e) => updatePeriod(i, "end", e.target.value)}
                        className="text-xs w-32"
                      />
                      <Button
                        type="button"
                        variant="ghost" size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removePeriod(i)}
                        aria-label="Remove period"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="secondary" size="sm" onClick={addPeriod} className="self-start">
                  <Plus className="size-4" /> Add Period
                </Button>
              </Form>
            )}

            {/* ── Step 3: Add Teachers ── */}
            {step === 3 && (
              <Form {...form3}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`size-9 rounded-xl flex items-center justify-center ${STEP_ACCENTS.staff}`}>
                      <GraduationCap className="size-[18px]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">Add Teaching Staff</p>
                      <p className="text-xs text-muted-foreground">Add at least 3 teachers to get started</p>
                    </div>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={addStaff}>
                    <Plus className="size-4" /> Add Teacher
                  </Button>
                </div>

                {/* Top-level staff array error */}
                {typeof form3.formState.errors.staff?.message === "string" && (
                  <p className="text-sm text-destructive">{form3.formState.errors.staff.message}</p>
                )}
                {form3.formState.errors.staff?.root && (
                  <p className="text-sm text-destructive">{form3.formState.errors.staff.root.message}</p>
                )}

                <div className="flex flex-col gap-3">
                  {(s3.staff ?? []).map((s, i) => (
                    <div key={i} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end p-3 rounded-xl bg-muted">
                      <FormField control={form3.control} name={`staff.${i}.name`} render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px]">Name</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Teacher name"
                              value={s.name ?? ""}
                              onChange={(e) => { field.onChange(e); updateStaff(i, "name", e.target.value) }}
                              onBlur={field.onBlur}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form3.control} name={`staff.${i}.subject`} render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px]">Subject</FormLabel>
                          <Select
                            value={field.value ?? ""}
                            onValueChange={(v) => { field.onChange(v); updateStaff(i, "subject", v) }}
                          >
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Subject" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {SUBJECTS.map((sub) => <SelectItem key={sub} value={sub}>{sub}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <FormField control={form3.control} name={`staff.${i}.role`} render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel className="text-[10px]">Role</FormLabel>
                          <Select
                            value={field.value ?? ""}
                            onValueChange={(v) => { field.onChange(v); updateStaff(i, "role", v) }}
                          >
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )} />

                      <Button
                        type="button"
                        variant="ghost" size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => removeStaff(i)}
                        aria-label="Remove teacher"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">You can also bulk-import teachers via CSV after setup.</p>
                  <Badge variant={filledTeachers >= 3 ? "success" : "warning"}>
                    <span className="mr-1">●</span> {filledTeachers} / 3 added
                  </Badge>
                </div>
              </Form>
            )}

            {/* ── Step 4: Review & Launch ── */}
            {step === 4 && (
              <Form {...form4}>
                <div className="flex items-center gap-3 mb-2">
                  <div className={`size-9 rounded-xl flex items-center justify-center ${STEP_ACCENTS.review}`}>
                    <Rocket className="size-[18px]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Review &amp; Launch</p>
                    <p className="text-xs text-muted-foreground">Confirm your setup before going live</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {([
                    ["School Name", s0.schoolName || "(not set)"],
                    ["City / State", `${s0.city || "—"}, ${s0.state || "—"}`],
                    ["Board", s0.board || "(not set)"],
                    ["Classes Offered", s0.classes || "(not set)"],
                    ["School Hours", `${s1.startTime} – ${s1.endTime}`],
                    ["Periods / Day", s1.periodsPerDay],
                    ["Working Days", (s1.workingDays ?? []).join(", ") || "(none)"],
                    ["Periods Configured", `${(s2.periods ?? []).length}`],
                    ["Teachers Added", `${filledTeachers}`],
                  ] as [string, string][]).map(([k, v]) => (
                    <div key={k} className="flex justify-between items-start border-b border-border pb-2 last:border-0 text-sm">
                      <span className="text-muted-foreground">{k}</span>
                      <span className="font-medium text-right max-w-[60%] text-foreground">{v}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-ef-green-light">
                  <CheckCircle className="size-4 text-ef-green flex-shrink-0" />
                  <p className="text-xs text-ef-green-dark">
                    Your 14-day free trial starts now. No credit card charged during the trial.
                  </p>
                </div>

                {/* Acknowledgement checkbox required before launch */}
                <FormField control={form4.control} name="acknowledged" render={({ field }) => (
                  <FormItem className="flex flex-row items-start gap-3 space-y-0 p-3 rounded-xl border">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        I have reviewed the setup and am ready to launch
                      </FormLabel>
                      <FormMessage />
                    </div>
                  </FormItem>
                )} />
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft className="size-4" /> Back
          </Button>

          <div className="flex items-center gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`size-1.5 rounded-full transition-all ${i === step ? "bg-primary w-4" : "bg-border"}`}
              />
            ))}
          </div>

          {step < STEPS.length - 1 ? (
            <Button onClick={handleContinue}>
              Continue <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button className="bg-ef-green text-white hover:bg-ef-green/90" onClick={handleLaunch}>
              <Rocket className="size-4" /> Launch School
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
