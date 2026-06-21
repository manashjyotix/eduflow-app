"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Zap, Eye, EyeOff, ArrowRight, CheckCircle,
  LayoutDashboard, Users, DollarSign, BarChart3, Shield,
  Star, Calendar
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const HIGHLIGHTS = [
  { icon: LayoutDashboard, text: "Proxy board with auto-assignment" },
  { icon: Users, text: "Multi-role access for all staff" },
  { icon: Calendar, text: "Drag-and-drop timetable builder" },
  { icon: DollarSign, text: "Fee collection & PDF receipts" },
  { icon: BarChart3, text: "Analytics, heatmaps & audit trail" },
  { icon: Shield, text: "Role-based access control" },
]

const STATES = [
  "Assam", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab",
  "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other"
]

const TEACHER_OPTIONS = ["1–10", "11–25", "26–50", "51–100", "100+"]

const PLANS = [
  { key: "monthly", label: "Monthly", price: "₹999", period: "/month", badge: "" },
  { key: "quarterly", label: "Quarterly", price: "₹2,499", period: "/quarter", badge: "Save 17%" },
  { key: "annual", label: "Annual", price: "₹8,999", period: "/year", badge: "Save 25%" },
]

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("annual")
  const [agreed, setAgreed] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    schoolName: "", name: "", email: "", phone: "",
    password: "", confirmPassword: "", teachers: "", state: ""
  })

  const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.schoolName.trim()) e.schoolName = "Required"
    if (!form.name.trim()) e.name = "Required"
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required"
    if (!form.phone.trim()) e.phone = "Required"
    if (form.password.length < 8) e.password = "Min 8 characters"
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords don't match"
    if (!form.teachers) e.teachers = "Required"
    if (!form.state) e.state = "Required"
    if (!agreed) e.agreed = "You must accept the terms"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setTimeout(() => { setLoading(false); setSubmitted(true) }, 1500)
  }

  if (submitted) {
    return (
      <div className="min-h-[calc(100vh-57px)] flex items-center justify-center px-4 py-12 fade-in">
        <Card className="max-w-md w-full border-2 border-primary shadow-xl">
          <CardContent className="p-10 text-center">
            <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="size-10 text-primary" />
            </div>
            <Badge variant="secondary" className="mb-4">14-day free trial started</Badge>
            <h2 className="text-2xl font-bold mb-2">Welcome to EduFlow! 🎉</h2>
            <p className="text-muted-foreground text-sm mb-6">
              Your school <strong>{form.schoolName}</strong> is being set up. We&apos;ve sent a verification email to <strong>{form.email}</strong>.
            </p>
            <div className="bg-muted rounded-lg p-4 text-sm text-left space-y-1.5 mb-6">
              <p>✓ Free trial: <strong>14 days</strong></p>
              <p>✓ Plan: <strong className="capitalize">{selectedPlan}</strong></p>
              <p>✓ No credit card charged during trial</p>
            </div>
            <Button className="w-full" asChild>
              <Link href="/onboarding">Complete School Setup <ArrowRight className="size-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background fade-in">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          {/* Left: Form */}
          <div>
            {/* Header */}
            <div className="mb-8">
              <Badge variant="secondary" className="mb-3">
                <Zap className="size-3 mr-1" />
                14-day free trial · No credit card
              </Badge>
              <h1 className="text-3xl font-bold text-foreground mb-2">Start your free trial</h1>
              <p className="text-muted-foreground">Set up your school in under 5 minutes.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* School + Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="schoolName">School Name <span className="text-destructive">*</span></Label>
                  <Input id="schoolName" placeholder="Holy Child English Academy" value={form.schoolName} onChange={setField("schoolName")} className={errors.schoolName ? "border-destructive" : ""} />
                  {errors.schoolName && <p className="text-xs text-destructive">{errors.schoolName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="name">Your Name <span className="text-destructive">*</span></Label>
                  <Input id="name" placeholder="Dr. Anupam Das" value={form.name} onChange={setField("name")} className={errors.name ? "border-destructive" : ""} />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                  <Input id="email" type="email" placeholder="admin@school.edu" value={form.email} onChange={setField("email")} className={errors.email ? "border-destructive" : ""} />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone <span className="text-destructive">*</span></Label>
                  <Input id="phone" placeholder="+91 98765 43210" value={form.phone} onChange={setField("phone")} className={errors.phone ? "border-destructive" : ""} />
                  {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                </div>
              </div>

              {/* Password + Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min 8 characters"
                      value={form.password}
                      onChange={setField("password")}
                      className={`pr-10 ${errors.password ? "border-destructive" : ""}`}
                    />
                    <Button variant="ghost" size="icon-sm" className="absolute right-3 -translate-y-1/2 h-auto w-auto hover:bg-transparent" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirm">Confirm Password <span className="text-destructive">*</span></Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? "text" : "password"}
                      placeholder="Repeat password"
                      value={form.confirmPassword}
                      onChange={setField("confirmPassword")}
                      className={`pr-10 ${errors.confirmPassword ? "border-destructive" : ""}`}
                    />
                    <Button variant="ghost" size="icon-sm" className="absolute right-3 -translate-y-1/2 h-auto w-auto hover:bg-transparent" type="button" onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}>
                      {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </Button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Teachers + State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Number of Teachers <span className="text-destructive">*</span></Label>
                  <Select onValueChange={(v) => setForm({ ...form, teachers: v })}>
                    <SelectTrigger className={errors.teachers ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEACHER_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o} teachers</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.teachers && <p className="text-xs text-destructive">{errors.teachers}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>State <span className="text-destructive">*</span></Label>
                  <Select onValueChange={(v) => setForm({ ...form, state: v })}>
                    <SelectTrigger className={errors.state ? "border-destructive" : ""}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                </div>
              </div>

              {/* Plan selection */}
              <div className="space-y-2">
                <Label>Choose Plan</Label>
                <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-2">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => setSelectedPlan(plan.key)}
                      className={`rounded-xl border-2 p-3 text-left transition-all ${selectedPlan === plan.key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                        }`}
                    >
                      <div className="text-xs font-medium text-foreground">{plan.label}</div>
                      <div className="text-base font-bold text-foreground mt-0.5">{plan.price}</div>
                      <div className="text-[10px] text-muted-foreground">{plan.period}</div>
                      {plan.badge && (
                        <Badge variant="secondary" className="text-[10px] mt-1 px-1.5 py-0">{plan.badge}</Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 rounded border-border"
                />
                <Label htmlFor="terms" className="font-normal text-sm cursor-pointer">
                  I agree to EduFlow&apos;s{" "}
                  <Link href="#" className="text-primary hover:underline">Terms of Service</Link>{" "}
                  and{" "}
                  <Link href="#" className="text-primary hover:underline">Privacy Policy</Link>
                </Label>
              </div>
              {errors.agreed && <p className="text-xs text-destructive -mt-3">{errors.agreed}</p>}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  <>Start 14-Day Free Trial <ArrowRight className="size-4" /></>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </form>
          </div>

          {/* Right: Feature highlights — hidden on mobile */}
          <div className="hidden lg:block sticky top-24">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Everything included, from day one</h2>
              <p className="text-sm text-muted-foreground">No feature gating, no hidden costs. All 69 features unlocked during your trial.</p>
            </div>

            <div className="space-y-3 mb-8">
              {HIGHLIGHTS.map((h) => (
                <div key={h.text} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <h.icon className="size-4 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{h.text}</span>
                  <CheckCircle className="size-4 text-primary ml-auto flex-shrink-0" />
                </div>
              ))}
            </div>

            {/* Testimonial */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-5">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="size-3.5 fill-warning text-warning" />)}
                </div>
                <p className="text-sm text-muted-foreground italic mb-4">
                  &ldquo;Signed up on a Friday, had the whole school running on EduFlow by Monday morning. The onboarding wizard was brilliant.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">MS</div>
                  <div>
                    <p className="text-sm font-semibold">Meena Sharma</p>
                    <p className="text-xs text-muted-foreground">Management, DPS Delhi</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="size-3 text-primary" /> SSL Secured</span>
              <span className="flex items-center gap-1"><CheckCircle className="size-3 text-primary" /> GDPR Compliant</span>
              <span className="flex items-center gap-1"><Users className="size-3 text-primary" /> 12+ Schools</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
