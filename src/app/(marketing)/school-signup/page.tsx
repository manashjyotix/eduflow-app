"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Building2, ArrowRight, ArrowLeft, CheckCircle, BookOpen,
  Users, Phone, Mail, MapPin, Globe, Zap, Shield, Star,
  GraduationCap, Clock, ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from "@/components/ui/select"

// ─── Step config ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: "School Info",   icon: Building2 },
  { id: 2, label: "Contact",       icon: Users },
  { id: 3, label: "Academic",      icon: GraduationCap },
  { id: 4, label: "Admin Account", icon: Shield },
  { id: 5, label: "Review",        icon: CheckCircle },
]

const BOARD_OPTIONS = [
  "CBSE", "SEBA (Assam)", "ICSE", "State Board – West Bengal",
  "State Board – Maharashtra", "State Board – Tamil Nadu",
  "State Board – Karnataka", "IGCSE / Cambridge", "Other",
]
const TEACHER_RANGES = ["1–10", "11–25", "26–50", "51–100", "100+"]
const STUDENT_RANGES = ["< 200", "200–500", "500–1000", "1000–2000", "2000+"]
const STATES = [
  "Assam", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab",
  "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other",
]
const PLAN_OPTIONS = [
  { key: "monthly",  label: "Monthly",   price: "₹999",   note: "/month",    badge: "" },
  { key: "annual",   label: "Annual",    price: "₹8,999", note: "/year",     badge: "Save 25%" },
]

type FormData = {
  // Step 1
  schoolName: string; address: string; city: string; state: string; pincode: string; website: string
  // Step 2
  principalName: string; phone: string; email: string; altEmail: string
  // Step 3
  board: string; teachers: string; students: string; classes: string; plan: string
  // Step 4
  adminName: string; adminEmail: string; adminPhone: string; password: string; confirmPassword: string
}

const EMPTY: FormData = {
  schoolName: "", address: "", city: "", state: "", pincode: "", website: "",
  principalName: "", phone: "", email: "", altEmail: "",
  board: "", teachers: "", students: "", classes: "", plan: "annual",
  adminName: "", adminEmail: "", adminPhone: "", password: "", confirmPassword: "",
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function Field({
  label, id, error, required = false, children,
}: {
  label: string; id?: string; error?: string; required?: boolean; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}{required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function StepHeader({ step, title, subtitle }: { step: number; title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <p className="text-xs font-medium text-primary uppercase tracking-wider mb-1">Step {step} of 5</p>
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SchoolSignupPage() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<FormData>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const set = (key: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [key]: e.target.value }))
  const setSel = (key: keyof FormData) => (val: string) => setForm(f => ({ ...f, [key]: val }))

  function validate(s: number): boolean {
    const e: Partial<Record<keyof FormData, string>> = {}
    if (s === 1) {
      if (!form.schoolName.trim()) e.schoolName = "Required"
      if (!form.city.trim())       e.city       = "Required"
      if (!form.state)             e.state      = "Required"
    }
    if (s === 2) {
      if (!form.principalName.trim()) e.principalName = "Required"
      if (!form.phone.trim())         e.phone         = "Required"
      if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required"
    }
    if (s === 3) {
      if (!form.board)    e.board    = "Required"
      if (!form.teachers) e.teachers = "Required"
      if (!form.students) e.students = "Required"
    }
    if (s === 4) {
      if (!form.adminName.trim())  e.adminName  = "Required"
      if (!form.adminEmail.trim() || !form.adminEmail.includes("@")) e.adminEmail = "Valid email required"
      if (form.password.length < 8) e.password = "Min 8 characters"
      if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match"
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => {
    if (!validate(step)) return
    if (step < 5) setStep(s => s + 1)
  }
  const back = () => { setErrors({}); setStep(s => s - 1) }

  const submit = () => {
    setLoading(true)
    setTimeout(() => { setLoading(false); setDone(true) }, 1800)
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full border-2 border-primary/30 shadow-xl">
          <CardContent className="p-10 text-center">
            <div className="size-20 rounded-full bg-[var(--ef-green-light)] dark:bg-[var(--ef-green-light)] flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="size-10 text-[var(--ef-green-dark)]" />
            </div>
            <Badge variant="secondary" className="mb-4">🎉 Registration complete</Badge>
            <h2 className="text-2xl font-bold mb-2">Welcome, {form.schoolName}!</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Your school is being set up. A verification link has been sent to{" "}
              <strong>{form.adminEmail}</strong>.
            </p>
            <div className="bg-muted rounded-lg p-4 text-sm text-left space-y-1.5 mb-6">
              <p>✓ 14-day free trial started</p>
              <p>✓ Plan: <strong className="capitalize">{form.plan}</strong></p>
              <p>✓ No credit card charged during trial</p>
            </div>
            <Button className="w-full" asChild>
              <Link href="/onboarding">Complete School Setup <ArrowRight className="size-4" /></Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              <Link href="/login" className="hover:underline text-primary">Or sign in now</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  // ── Main layout ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-10">
        {/* Page heading */}
        <div className="text-center mb-8">
          <Badge variant="secondary" className="mb-3">
            <Zap className="size-3 mr-1" /> 14-day free trial · No credit card
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-1">Register your school</h1>
          <p className="text-muted-foreground text-sm">Takes less than 5 minutes. Your first 14 days are free.</p>
        </div>

        {/* Progress stepper */}
        <div className="mb-8">
          <Progress value={(step / 5) * 100} className="h-1.5 mb-4" />
          <div className="flex items-center justify-between relative">
            {STEPS.map((s) => {
              const Icon = s.icon
              const isActive = s.id === step
              const isDone   = s.id < step
              return (
                <div key={s.id} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`size-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    isDone   ? "bg-primary border-primary text-primary-foreground"
                    : isActive ? "border-primary text-primary bg-[var(--ef-brand-light)] dark:bg-[var(--ef-brand-muted)]"
                    : "border-border text-muted-foreground bg-background"
                  }`}>
                    {isDone ? <CheckCircle className="size-4" /> : <Icon className="size-4" />}
                  </div>
                  <span className={`text-[10px] font-medium hidden sm:block ${isActive ? "text-primary" : isDone ? "text-foreground" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* ── Form panel ── */}
          <div className="lg:col-span-2">
            <Card className="shadow-sm">
              <CardContent className="p-6 md:p-8">

                {/* Step 1 — School Info */}
                {step === 1 && (
                  <>
                    <StepHeader step={1} title="School information" subtitle="Tell us about your school or educational institution." />
                    <div className="space-y-4">
                      <Field label="School / Institution Name" id="schoolName" error={errors.schoolName} required>
                        <div className="relative"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input id="schoolName" placeholder="Holy Child English Academy" value={form.schoolName} onChange={set("schoolName")} className="pl-9" autoFocus /></div>
                      </Field>
                      <Field label="Address" id="address">
                        <div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input id="address" placeholder="123 School Road" value={form.address} onChange={set("address")} className="pl-9" /></div>
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="City / Town" id="city" error={errors.city} required>
                          <Input id="city" placeholder="Howly" value={form.city} onChange={set("city")} />
                        </Field>
                        <Field label="PIN Code" id="pincode">
                          <Input id="pincode" placeholder="781316" maxLength={6} value={form.pincode} onChange={set("pincode")} />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="State" error={errors.state} required>
                          <Select onValueChange={setSel("state")} value={form.state}>
                            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                            <SelectContent>{STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </Field>
                        <Field label="Website" id="website">
                          <div className="relative"><Globe className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input id="website" placeholder="https://school.edu" value={form.website} onChange={set("website")} className="pl-9" /></div>
                        </Field>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 2 — Contact */}
                {step === 2 && (
                  <>
                    <StepHeader step={2} title="Contact details" subtitle="We'll use these to verify your institution and send updates." />
                    <div className="space-y-4">
                      <Field label="Principal / Head's Name" id="principalName" error={errors.principalName} required>
                        <div className="relative"><Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                          <Input id="principalName" placeholder="Dr. Anupam Das" value={form.principalName} onChange={set("principalName")} className="pl-9" autoFocus /></div>
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Phone" id="phone" error={errors.phone} required>
                          <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input id="phone" placeholder="+91 98765 43210" value={form.phone} onChange={set("phone")} className="pl-9" /></div>
                        </Field>
                        <Field label="Official Email" id="email" error={errors.email} required>
                          <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input id="email" type="email" placeholder="principal@school.edu" value={form.email} onChange={set("email")} className="pl-9" /></div>
                        </Field>
                      </div>
                      <Field label="Alternate Email" id="altEmail">
                        <Input id="altEmail" type="email" placeholder="accounts@school.edu (optional)" value={form.altEmail} onChange={set("altEmail")} />
                      </Field>
                    </div>
                  </>
                )}

                {/* Step 3 — Academic */}
                {step === 3 && (
                  <>
                    <StepHeader step={3} title="Academic setup" subtitle="Helps us pre-configure your timetable and proxy board." />
                    <div className="space-y-4">
                      <Field label="Board of Education" error={errors.board} required>
                        <Select onValueChange={setSel("board")} value={form.board}>
                          <SelectTrigger><SelectValue placeholder="Select board" /></SelectTrigger>
                          <SelectContent>{BOARD_OPTIONS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                        </Select>
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Number of Teachers" error={errors.teachers} required>
                          <Select onValueChange={setSel("teachers")} value={form.teachers}>
                            <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                            <SelectContent>{TEACHER_RANGES.map(r => <SelectItem key={r} value={r}>{r} teachers</SelectItem>)}</SelectContent>
                          </Select>
                        </Field>
                        <Field label="Number of Students" error={errors.students} required>
                          <Select onValueChange={setSel("students")} value={form.students}>
                            <SelectTrigger><SelectValue placeholder="Select range" /></SelectTrigger>
                            <SelectContent>{STUDENT_RANGES.map(r => <SelectItem key={r} value={r}>{r} students</SelectItem>)}</SelectContent>
                          </Select>
                        </Field>
                      </div>
                      <Field label="Number of Classes / Sections" id="classes">
                        <Input id="classes" placeholder="e.g. 24  (Class I–X, 2–3 sections each)" value={form.classes} onChange={set("classes")} />
                      </Field>
                      {/* Plan picker */}
                      <div className="space-y-2">
                        <Label>Choose Plan</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {PLAN_OPTIONS.map(p => (
                            <button key={p.key} type="button" onClick={() => setForm(f => ({ ...f, plan: p.key }))}
                              className={`rounded-xl border-2 p-4 text-left transition-all ${form.plan === p.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                              <div className="text-sm font-semibold">{p.label}</div>
                              <div className="text-lg font-bold mt-0.5">{p.price}</div>
                              <div className="text-xs text-muted-foreground">{p.note}</div>
                              {p.badge && <Badge variant="secondary" className="text-[10px] mt-1 px-1.5 py-0">{p.badge}</Badge>}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">14-day free trial — no charge during trial period.</p>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 4 — Admin Account */}
                {step === 4 && (
                  <>
                    <StepHeader step={4} title="Create admin account" subtitle="This becomes the primary admin login for your school." />
                    <div className="space-y-4">
                      <Field label="Admin Full Name" id="adminName" error={errors.adminName} required>
                        <Input id="adminName" placeholder="Arnab Paul" value={form.adminName} onChange={set("adminName")} autoFocus />
                      </Field>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Admin Email" id="adminEmail" error={errors.adminEmail} required>
                          <Input id="adminEmail" type="email" placeholder="admin@school.edu" value={form.adminEmail} onChange={set("adminEmail")} />
                        </Field>
                        <Field label="Admin Phone" id="adminPhone">
                          <Input id="adminPhone" placeholder="+91 98765 43210" value={form.adminPhone} onChange={set("adminPhone")} />
                        </Field>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <Field label="Password" id="password" error={errors.password} required>
                          <Input id="password" type="password" placeholder="Min 8 characters" value={form.password} onChange={set("password")} />
                        </Field>
                        <Field label="Confirm Password" id="confirmPassword" error={errors.confirmPassword} required>
                          <Input id="confirmPassword" type="password" placeholder="Repeat password" value={form.confirmPassword} onChange={set("confirmPassword")} />
                        </Field>
                      </div>
                    </div>
                  </>
                )}

                {/* Step 5 — Review */}
                {step === 5 && (
                  <>
                    <StepHeader step={5} title="Review & submit" subtitle="Confirm your details before creating your school account." />
                    <div className="space-y-4 text-sm">
                      {[
                        { label: "School", value: form.schoolName, sub: `${form.city}, ${form.state}` },
                        { label: "Principal", value: form.principalName, sub: form.email },
                        { label: "Board", value: form.board, sub: `${form.teachers} teachers · ${form.students} students` },
                        { label: "Admin Account", value: form.adminName, sub: form.adminEmail },
                        { label: "Plan", value: PLAN_OPTIONS.find(p => p.key === form.plan)?.label ?? form.plan,
                          sub: `${PLAN_OPTIONS.find(p => p.key === form.plan)?.price} · 14-day free trial` },
                      ].map(row => (
                        <div key={row.label} className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
                          <span className="text-muted-foreground w-28 shrink-0">{row.label}</span>
                          <div className="text-right">
                            <p className="font-medium text-foreground">{row.value || <span className="text-muted-foreground italic">—</span>}</p>
                            {row.sub && <p className="text-xs text-muted-foreground mt-0.5">{row.sub}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 p-4 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
                      <p>By registering, you agree to EduFlow&apos;s{" "}
                        <Link href="#" className="text-primary hover:underline">Terms of Service</Link> and{" "}
                        <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>.</p>
                      <p>Your trial starts today. No charge for 14 days.</p>
                    </div>
                  </>
                )}

                {/* Navigation buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                  {step > 1 ? (
                    <Button variant="ghost" onClick={back} className="gap-1">
                      <ArrowLeft className="size-4" /> Back
                    </Button>
                  ) : (
                    <div />
                  )}
                  {step < 5 ? (
                    <Button onClick={next} className="gap-1 min-w-[120px]">
                      Continue <ChevronRight className="size-4" />
                    </Button>
                  ) : (
                    <Button onClick={submit} disabled={loading} className="gap-1 min-w-[160px]">
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                          Creating account…
                        </span>
                      ) : (
                        <>Create School Account <ArrowRight className="size-4" /></>
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Already have an account?{" "}
              <Link href="/login" className="text-primary hover:underline">Sign in</Link>
            </p>
          </div>

          {/* ── Sidebar: benefits ── */}
          <div className="hidden lg:flex flex-col gap-5 sticky top-24">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
                    <Zap className="size-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">EduFlow</p>
                    <p className="text-[10px] text-muted-foreground">Smart School Management</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {[
                    { icon: BookOpen, text: "Proxy board with auto-assign AI" },
                    { icon: Users, text: "All roles — admin, teacher, parent" },
                    { icon: GraduationCap, text: "Drag-and-drop timetable builder" },
                    { icon: Clock, text: "Morning briefing with period countdown" },
                    { icon: Shield, text: "Role-based access control" },
                    { icon: Star, text: "Analytics, reports & audit trail" },
                  ].map(item => (
                    <div key={item.text} className="flex items-center gap-2.5">
                      <div className="size-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                        <item.icon className="size-3.5 text-primary" />
                      </div>
                      <span className="text-xs text-foreground">{item.text}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Separator />

            {/* Testimonial */}
            <Card>
              <CardContent className="p-5">
                <div className="flex mb-2">
                  {[...Array(5)].map((_, i) => <Star key={i} className="size-3 fill-[var(--ef-amber)] text-[var(--ef-amber)]" />)}
                </div>
                <p className="text-xs text-muted-foreground italic leading-relaxed mb-3">
                  &ldquo;Set up on Friday, running on Monday. The onboarding was the easiest software setup our school ever did.&rdquo;
                </p>
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold">MS</div>
                  <div>
                    <p className="text-xs font-semibold">Meena Sharma</p>
                    <p className="text-[10px] text-muted-foreground">Management, DPS Delhi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
