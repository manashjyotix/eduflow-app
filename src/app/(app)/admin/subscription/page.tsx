"use client"
import { useState } from "react"
import {
  CreditCard, Check, Download, Shield, Zap, Globe, Headphones, BookOpen,
  TrendingUp, Users, Calendar, Star, Gift, Copy, CheckCheck, AlertTriangle,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"

interface Plan {
  name: string
  price: number
  period: string
  monthly: string
  savings: string
  savingsPct: number
  original: number
  features: string[]
  popular: boolean
}

const PLANS: Plan[] = [
  {
    name: "Quarterly",
    price: 2699,
    period: "3 months",
    monthly: "₹899/mo",
    savings: "Save 10%",
    savingsPct: 10,
    original: 2997,
    features: [
      "1 School",
      "Up to 300 students",
      "Proxy management",
      "Fee collection",
      "Basic reports",
      "Email support",
    ],
    popular: false,
  },
  {
    name: "Half-Yearly",
    price: 4999,
    period: "6 months",
    monthly: "₹833/mo",
    savings: "Save 17%",
    savingsPct: 17,
    original: 5994,
    features: [
      "1 School",
      "Up to 500 students",
      "All features",
      "AI Proxy assignment",
      "Advanced analytics",
      "Priority support",
      "WhatsApp notifications",
    ],
    popular: true,
  },
  {
    name: "Annual",
    price: 8999,
    period: "12 months",
    monthly: "₹749/mo",
    savings: "Save 25%",
    savingsPct: 25,
    original: 11988,
    features: [
      "1 School",
      "Up to 1,000 students",
      "All features",
      "AI Proxy assignment",
      "Custom reports",
      "Dedicated support",
      "WhatsApp + SMS",
      "API access",
    ],
    popular: false,
  },
]

interface Invoice {
  date: string
  plan: string
  amount: number
  status: string
  invoiceId: string
}

const INVOICES: Invoice[] = [
  { date: "Mar 1, 2026", plan: "Starter Monthly", amount: 999, status: "paid", invoiceId: "INV-2026-041" },
  { date: "Apr 1, 2026", plan: "Starter Monthly", amount: 999, status: "paid", invoiceId: "INV-2026-042" },
  { date: "May 1, 2026", plan: "Starter Monthly", amount: 999, status: "paid", invoiceId: "INV-2026-043" },
  { date: "Jun 1, 2026", plan: "Starter Monthly", amount: 999, status: "paid", invoiceId: "INV-2026-044" },
]

const PLAN_FEATURES = [
  { icon: Shield, text: "1 School · Up to 500 students · All features" },
  { icon: Zap, text: "AI-powered proxy assignment" },
  { icon: Globe, text: "Web + Mobile access" },
  { icon: Headphones, text: "Priority support" },
  { icon: BookOpen, text: "Advanced analytics & reports" },
]

const USAGE_STATS = [
  { icon: Users, label: "Students", value: "187 / 500" },
  { icon: Calendar, label: "Days remaining", value: "29" },
  { icon: TrendingUp, label: "Usage", value: "37%" },
]

const REFERRAL_LINK = "https://eduflow.app/r/HCEA2026"

export default function SubscriptionPage() {
  const [copied, setCopied] = useState(false)

  const { sorted: sortedInvoices, sortField, sortDir, toggleSort } = useTableSort<
    (typeof INVOICES)[number],
    "date" | "plan" | "amount" | "status"
  >(INVOICES, {
    date:   inv => new Date(inv.date).getTime(),
    plan:   inv => inv.plan,
    amount: inv => inv.amount,
    status: inv => inv.status,
  }, { field: "date" })

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(REFERRAL_LINK)
    } catch {
      /* clipboard unavailable — non-fatal */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<CreditCard size={20} />}
        title="Subscription & Billing"
        subtitle="Manage your EduFlow plan and payment history"
      />

      {/* Current Plan — gradient banner */}
      <Card className="border-none bg-gradient-to-br from-primary to-ef-brand-hover text-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            {/* Left: plan info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <p className="text-lg font-bold text-white">Starter Plan</p>
                <Badge className="border-none bg-white/20 text-white hover:bg-white/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-ef-green inline-block" />Active
                </Badge>
              </div>
              <p className="text-4xl font-black text-white leading-none">
                ₹{(999).toLocaleString("en-IN")}
                <span className="text-base font-normal opacity-75">/month</span>
              </p>
              <p className="text-sm opacity-80 mt-2">Next renewal: July 1, 2026 · Auto-renews via Razorpay</p>
              <p className="text-sm opacity-70 mt-0.5">Billed monthly · Holy Child English Academy</p>

              {/* Usage mini-stats */}
              <div className="flex flex-wrap gap-4 mt-4">
                {USAGE_STATS.map(u => (
                  <div key={u.label} className="flex items-center gap-2 text-white/90">
                    <u.icon size={13} />
                    <span className="text-xs opacity-80">{u.label}:</span>
                    <span className="text-xs font-bold">{u.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: features + CTA */}
            <div className="flex flex-col gap-2 items-start sm:items-end shrink-0">
              {PLAN_FEATURES.slice(0, 4).map(f => (
                <div key={f.text} className="flex items-center gap-2 text-sm text-white/90">
                  <Check size={14} />
                  <span>{f.text}</span>
                </div>
              ))}
              <div className="flex gap-2 mt-3 flex-wrap">
                <Button size="sm" className="border border-white/35 bg-white/20 text-white hover:bg-white/30">
                  <CreditCard size={13} />Manage Payment
                </Button>
                <Button size="sm" className="bg-white text-primary hover:bg-white/90">
                  <TrendingUp size={13} />Upgrade Plan
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Usage KPIs */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard
          title="Students Enrolled"
          value="187 / 500"
          subtitle="37% of plan capacity"
          icon={<Users className="size-5" />}
          sparkline={{ variant: "arc", value: 37, color: "var(--ef-brand)" }}
        />
        <KpiCard
          title="Days Remaining"
          value={29}
          subtitle="Renews July 1, 2026"
          icon={<Calendar className="size-5" />}
          iconClassName="bg-ef-amber-light text-ef-amber"
          sparkline={{ variant: "bar", data: [31, 30, 30, 29, 29, 29], color: "var(--ef-amber)" }}
        />
        <KpiCard
          title="Spent This Year"
          value={`₹${(3996).toLocaleString("en-IN")}`}
          subtitle="4 invoices paid"
          icon={<CreditCard className="size-5" />}
          iconClassName="bg-ef-green-light text-ef-green"
          sparkline={{ variant: "line", data: [999, 999, 999, 999], color: "var(--ef-green)" }}
        />
        <KpiCard
          title="Referral Earnings"
          value={`₹${(2400).toLocaleString("en-IN")}`}
          subtitle="2 schools referred"
          icon={<Gift className="size-5" />}
          iconClassName="bg-ef-purple-light text-ef-purple"
          sparkline={{ variant: "bar", data: [0, 1200, 1200, 2400, 2400, 2400], color: "var(--ef-purple)" }}
        />
      </div>

      {/* Upgrade Plans — 3-col grid */}
      <div>
        <h2 className="text-base font-bold text-foreground mb-4">Upgrade &amp; Save</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(p => (
            <Card
              key={p.name}
              className={`relative flex flex-col ${p.popular ? "border-primary ring-2 ring-primary/20 bg-ef-brand-light" : ""}`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-0.5 rounded-full shadow-md whitespace-nowrap">
                  <Star size={9} />MOST POPULAR
                </div>
              )}

              <CardContent className="p-5 flex flex-col gap-4 flex-1">
                {/* Plan name + period */}
                <div>
                  <p className="font-bold text-foreground text-base">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.period} · {p.monthly}</p>
                </div>

                {/* Price + savings */}
                <div>
                  <p className={`text-3xl font-black ${p.popular ? "text-primary" : "text-foreground"}`}>
                    ₹{p.price.toLocaleString("en-IN")}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground line-through">₹{p.original.toLocaleString("en-IN")}</p>
                    <Badge variant="success">{p.savings}</Badge>
                  </div>
                </div>

                {/* Savings progress bar */}
                <div>
                  <div className="flex justify-between mb-1 text-[10px] text-muted-foreground">
                    <span>You save</span>
                    <span className="font-bold text-ef-green-dark">{p.savingsPct}% off</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-ef-green" style={{ width: `${p.savingsPct * 4}%` }} />
                  </div>
                </div>

                {/* Feature list */}
                <div className="flex flex-col gap-1.5">
                  {p.features.map(f => (
                    <div key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Check size={11} className="text-ef-green shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>

                {/* CTA pushed to bottom */}
                <Button variant={p.popular ? "default" : "outline"} className="w-full mt-auto">
                  Upgrade Now
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Affiliate Referral */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Gift className="size-4 text-ef-purple" /> Refer &amp; Earn
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Earn <span className="font-semibold text-foreground">10% commission</span> for every school that
            subscribes to EduFlow through your referral link. Share it with fellow educators and track your
            earnings here.
          </p>

          <div className="flex flex-col sm:flex-row gap-2">
            <Input readOnly value={REFERRAL_LINK} className="font-mono text-sm" aria-label="Referral link" />
            <Button
              onClick={handleCopy}
              className={copied ? "bg-ef-green text-white hover:bg-ef-green/90 shrink-0" : "shrink-0"}
            >
              {copied ? <CheckCheck size={14} /> : <Copy size={14} />}
              {copied ? "Copied!" : "Copy Link"}
            </Button>
          </div>

          <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-3">
            {[
              { label: "Schools Referred", value: "2" },
              { label: "Active Subscriptions", value: "2" },
              { label: "Total Earned", value: `₹${(2400).toLocaleString("en-IN")}` },
            ].map(s => (
              <div key={s.label} className="rounded-lg bg-muted p-3 text-center">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="font-bold text-lg text-foreground mt-0.5">{s.value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table className="text-sm">
            <caption className="sr-only">Payment history</caption>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                <SortableHead field="date" label="Date" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="plan" label="Plan" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="amount" label="Amount" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="status" label="Status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <TableHead className="text-xs">Invoice</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedInvoices.map(inv => (
                <TableRow key={inv.invoiceId}>
                  <TableCell className="text-sm">{inv.date}</TableCell>
                  <TableCell className="text-sm">{inv.plan}</TableCell>
                  <TableCell className="font-mono font-semibold">₹{inv.amount.toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge variant="success"><Check size={10} />Paid</Badge>
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="gap-1 text-primary">
                      <Download size={12} />{inv.invoiceId}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Cancel section */}
      <Card className="border-ef-red">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-ef-red-dark">
            <AlertTriangle className="size-4 text-ef-red" /> Cancel Subscription
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            Cancelling your subscription will disable the app at the end of your billing period (June 30, 2026).
            All data is retained for 90 days after cancellation.
          </p>
          <Button variant="outline" size="sm" className="self-start border-ef-red text-ef-red-dark hover:bg-ef-red-light">
            Cancel Subscription
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
