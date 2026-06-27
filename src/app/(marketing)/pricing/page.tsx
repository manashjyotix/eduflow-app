import Link from "next/link"
import { CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PLANS } from "@/lib/constants"

const PLAN_FEATURES = [
  "Unlimited teachers & students",
  "Proxy board with auto-assign",
  "Absence tracking & approvals",
  "Timetable builder",
  "Fee collection & receipts",
  "Student attendance (per-period)",
  "Analytics & PDF reports",
  "SMS, WhatsApp & email alerts",
  "Multi-role access",
  "14-day free trial",
]

type PlanKey = keyof typeof PLANS

const planEntries = Object.entries(PLANS) as [PlanKey, typeof PLANS[PlanKey]][]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-foreground">EduFlow</Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild><Link href="/login">Login</Link></Button>
            <Button size="sm" asChild><Link href="/signup">Start Free</Link></Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 md:px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4 leading-tight">Simple, transparent pricing</h1>
          <p className="text-muted-foreground">One plan, all features. Pay by duration and save more.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {planEntries.map(([key, plan], i) => {
            const isPopular = key === "annual"
            return (
              <Card key={key} className={isPopular ? "border-primary relative" : ""}>
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default" className="text-xs">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className="pb-3 text-center">
                  <CardTitle className="text-base capitalize">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-2xl sm:text-3xl font-bold">₹{plan.price.toLocaleString("en-IN")}</span>
                    <span className="text-xs text-muted-foreground"> / {plan.duration}</span>
                  </div>
                  {plan.savingsPct > 0 && (
                    <Badge variant="success" className="text-xs mx-auto w-fit">Save {plan.savingsPct}%</Badge>
                  )}
                </CardHeader>
                <CardContent>
                  <Button className="w-full mb-4" variant={isPopular ? "default" : "outline"} asChild>
                    <Link href="/signup">
                      Start Free Trial
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                  {i === 0 && (
                    <ul className="space-y-2">
                      {PLAN_FEATURES.map(f => (
                        <li key={f} className="flex items-start gap-2 text-xs text-muted-foreground">
                          <CheckCircle className="size-3.5 text-success-foreground flex-shrink-0 mt-0.5" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        <div className="text-center text-sm text-muted-foreground">
          <p>All plans include all features. 14-day free trial, no credit card required.</p>
          <p className="mt-1">
            <Link href="/demo" className="text-primary underline">Book a demo</Link> to see EduFlow in action before committing.
          </p>
        </div>
      </div>
    </div>
  )
}
