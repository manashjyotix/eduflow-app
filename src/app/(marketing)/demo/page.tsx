"use client"

import { useState } from "react"
import Link from "next/link"
import {
  CheckCircle, Calendar, Users, BarChart3, MessageSquare,
  DollarSign, ArrowRight, Star, Building2, Mail, Phone,
  User, MapPin, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const BENEFITS = [
  { icon: BarChart3, title: "Live Proxy Board Demo", desc: "See how absences auto-trigger proxy assignment in real time." },
  { icon: Calendar, title: "Timetable Setup Walkthrough", desc: "We'll build your school's actual timetable during the demo." },
  { icon: DollarSign, title: "Fee Management Demo", desc: "Collect a sample payment and generate a PDF receipt live." },
  { icon: Users, title: "Multi-Role Access Tour", desc: "Switch between admin, teacher, and parent views on the fly." },
  { icon: MessageSquare, title: "Q&A with Product Expert", desc: "Ask anything — our team knows every corner of the product." },
]

const STATES = [
  "Assam", "Bihar", "Delhi", "Gujarat", "Haryana", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Odisha", "Punjab",
  "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other"
]

const TEACHER_OPTIONS = ["1–10", "11–25", "26–50", "51–100", "100+"]

export default function DemoPage() {
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({
    name: "", school: "", email: "", phone: "",
    state: "", teachers: "", date: ""
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = "Name is required"
    if (!form.school.trim()) e.school = "School name is required"
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Valid email required"
    if (!form.phone.trim()) e.phone = "Phone is required"
    if (!form.state) e.state = "Please select a state"
    if (!form.teachers) e.teachers = "Please select teacher count"
    if (!form.date) e.date = "Please pick a preferred date"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-background fade-in">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-14 pb-10 text-center">
        <Badge variant="secondary" className="mb-4">
          <Clock className="size-3 mr-1" />
          30-minute session · Free · No pressure
        </Badge>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          See EduFlow <span className="text-primary">in Action</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Book a personalised 30-minute demo. We'll show you exactly how EduFlow works for your school.
        </p>
      </section>

      {/* Two-column layout */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Form */}
          <div>
            {submitted ? (
              <Card className="border-2 border-primary">
                <CardContent className="p-10 text-center">
                  <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle className="size-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold mb-3">Demo Booked! 🎉</h2>
                  <p className="text-muted-foreground mb-6">
                    Thanks <strong>{form.name}</strong>! We've received your request for <strong>{form.school}</strong>.
                    Our team will reach out to confirm your slot within 24 hours at <strong>{form.email}</strong>.
                  </p>
                  <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground mb-6">
                    <p>📅 Preferred date: <strong className="text-foreground">{form.date}</strong></p>
                    <p className="mt-1">📱 We'll call you at: <strong className="text-foreground">{form.phone}</strong></p>
                  </div>
                  <Button asChild>
                    <Link href="/">Back to Home</Link>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Book Your Demo</CardTitle>
                  <p className="text-sm text-muted-foreground">Fill in your details and we'll confirm your slot within 24 hours.</p>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="name" className="flex items-center gap-1.5">
                        <User className="size-3.5 text-muted-foreground" /> Your Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="Dr. Anupam Das"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        className={errors.name ? "border-destructive" : ""}
                      />
                      {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                    </div>

                    {/* School */}
                    <div className="space-y-1.5">
                      <Label htmlFor="school" className="flex items-center gap-1.5">
                        <Building2 className="size-3.5 text-muted-foreground" /> School Name
                      </Label>
                      <Input
                        id="school"
                        placeholder="Holy Child English Academy"
                        value={form.school}
                        onChange={(e) => setForm({ ...form, school: e.target.value })}
                        className={errors.school ? "border-destructive" : ""}
                      />
                      {errors.school && <p className="text-xs text-destructive">{errors.school}</p>}
                    </div>

                    {/* Email + Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="flex items-center gap-1.5">
                          <Mail className="size-3.5 text-muted-foreground" /> Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@hcea.edu"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="flex items-center gap-1.5">
                          <Phone className="size-3.5 text-muted-foreground" /> Phone
                        </Label>
                        <Input
                          id="phone"
                          placeholder="+91 98765 43210"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className={errors.phone ? "border-destructive" : ""}
                        />
                        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
                      </div>
                    </div>

                    {/* State + Teachers */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5">
                          <MapPin className="size-3.5 text-muted-foreground" /> State
                        </Label>
                        <Select onValueChange={(v) => setForm({ ...form, state: v })}>
                          <SelectTrigger className={errors.state ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {STATES.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.state && <p className="text-xs text-destructive">{errors.state}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5">
                          <Users className="size-3.5 text-muted-foreground" /> Number of Teachers
                        </Label>
                        <Select onValueChange={(v) => setForm({ ...form, teachers: v })}>
                          <SelectTrigger className={errors.teachers ? "border-destructive" : ""}>
                            <SelectValue placeholder="Select range" />
                          </SelectTrigger>
                          <SelectContent>
                            {TEACHER_OPTIONS.map((o) => (
                              <SelectItem key={o} value={o}>{o} teachers</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.teachers && <p className="text-xs text-destructive">{errors.teachers}</p>}
                      </div>
                    </div>

                    {/* Preferred Date */}
                    <div className="space-y-1.5">
                      <Label htmlFor="date" className="flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-muted-foreground" /> Preferred Demo Date
                      </Label>
                      <Input
                        id="date"
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className={errors.date ? "border-destructive" : ""}
                        min={new Date().toISOString().split("T")[0]}
                      />
                      {errors.date && <p className="text-xs text-destructive">{errors.date}</p>}
                    </div>

                    <Button type="submit" className="w-full" size="lg">
                      Book My Demo
                      <ArrowRight className="size-4" />
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      We'll confirm via email within 24 hours. No commitment required.
                    </p>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Benefits panel */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">What you&apos;ll see</h2>
              <p className="text-muted-foreground text-sm">A live walkthrough of EduFlow tailored to your school size and board.</p>
            </div>

            <div className="space-y-4">
              {BENEFITS.map((b) => (
                <div key={b.title} className="flex gap-4 p-4 rounded-xl bg-muted/40 hover:bg-muted/70 transition-colors">
                  <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <b.icon className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">{b.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Testimonial */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-5">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => <Star key={i} className="size-3.5 fill-warning text-warning" />)}
                </div>
                <p className="text-sm text-muted-foreground italic mb-4">
                  &ldquo;The demo convinced us in 20 minutes. Within a week our entire timetable and proxy system was live. Setup was effortless.&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">AD</div>
                  <div>
                    <p className="text-sm font-semibold">Dr. Anupam Das</p>
                    <p className="text-xs text-muted-foreground">Principal, HCEA Howly, Assam</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Session info */}
            <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3 text-center">
              {[
                { label: "Duration", value: "30 min" },
                { label: "Format", value: "Video call" },
                { label: "Cost", value: "Free" },
              ].map((item) => (
                <div key={item.label} className="bg-muted rounded-lg p-3">
                  <div className="font-bold text-foreground">{item.value}</div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
