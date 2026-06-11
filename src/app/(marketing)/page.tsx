import Link from "next/link"
import { CheckCircle, Users, Calendar, BarChart3, Shield, Zap, ArrowRight, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

const FEATURES = [
  { icon: Zap,       title: "Instant Proxy Assignment",  desc: "Auto-assign substitutes in seconds using our scoring algorithm." },
  { icon: Users,     title: "Multi-Role Access",          desc: "Separate dashboards for admin, management, teacher, and parent." },
  { icon: Calendar,  title: "Smart Timetable",            desc: "Drag-and-drop timetable builder with conflict detection." },
  { icon: BarChart3, title: "Analytics & Reports",        desc: "PDF-ready monthly reports, heatmaps, and audit trails." },
  { icon: Shield,    title: "Secure & Multi-Tenant",      desc: "Each school's data is isolated. Role-based access control." },
  { icon: CheckCircle,title:"Razorpay Billing",           desc: "Plans from ₹999/month. 14-day free trial, no card required." },
]

const TESTIMONIALS = [
  { name: "Dr. Anupam Das",    role: "Principal, HCEA",          quote: "EduFlow eliminated our morning proxy chaos. We went from 20-minute scrambles to instant assignment." },
  { name: "Meena Sharma",      role: "Management, DPS Delhi",    quote: "The proxy board is brilliant. I can see who's available in real time and assign with one tap." },
  { name: "Priya Kalita",      role: "Teacher, KV Guwahati",     quote: "I just accept or decline from my phone. No more frantic WhatsApp messages." },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="size-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">EduFlow</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/features" className="hover:text-foreground transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="/demo" className="hover:text-foreground transition-colors">Demo</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild><Link href="/login">Login</Link></Button>
            <Button size="sm" asChild><Link href="/signup">Start Free Trial</Link></Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-20 pb-16 text-center">
        <Badge variant="secondary" className="mb-4">New: QR Code Proxy Check-In →</Badge>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
          Smart substitute management<br />for modern schools
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          When a teacher is absent, EduFlow auto-assigns the best substitute in seconds.
          No WhatsApp chaos, no manual registers — just clean, audited coverage.
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button size="xl" asChild>
            <Link href="/signup">
              Start 14-day Free Trial
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <Button size="xl" variant="outline" asChild>
            <Link href="/demo">Book a Demo</Link>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">No credit card required. Setup in under 5 minutes.</p>
      </section>

      <Separator />

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-3">Everything your school needs</h2>
        <p className="text-muted-foreground text-center mb-12">One platform for absence tracking, proxy management, fees, timetable, and reports.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(f => (
            <Card key={f.title}>
              <CardContent className="p-6">
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <f.icon className="size-5" />
                </div>
                <h3 className="font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Loved by schools across India</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map(t => (
            <Card key={t.name}>
              <CardContent className="p-6">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="size-4 fill-warning text-warning" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground italic mb-4">&ldquo;{t.quote}&rdquo;</p>
                <div>
                  <p className="text-sm font-semibold">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator />

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to streamline your school?</h2>
        <p className="text-muted-foreground mb-8">Join 12+ schools already using EduFlow. Starter plan from ₹999/month.</p>
        <Button size="xl" asChild>
          <Link href="/signup">
            Get Started Free
            <ArrowRight className="size-5" />
          </Link>
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 EduFlow · Holy Child English Academy · Howly, Assam</span>
          <div className="flex gap-6">
            <Link href="/features" className="hover:text-foreground">Features</Link>
            <Link href="/pricing" className="hover:text-foreground">Pricing</Link>
            <Link href="/demo" className="hover:text-foreground">Demo</Link>
            <Link href="/login" className="hover:text-foreground">Login</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
