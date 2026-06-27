"use client"
import { useState } from "react"
import {
  Users, IndianRupee, TrendingUp, Wallet, Plus, Download,
  Copy, ExternalLink, Trophy, Star, Medal, MoreHorizontal,
  Zap, Gift,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"

interface Affiliate {
  id: string; name: string; email: string
  tier: "Gold" | "Silver" | "Bronze"
  referrals: number; commissionsEarned: number; pendingPayout: number
  status: "active" | "inactive" | "pending"
  joinedAt: string; conversionRate: number; lastReferral: string
}

const AFFILIATES: Affiliate[] = [
  { id: "aff-1", name: "Dipankar Saikia", email: "dipankar@edtech.in", tier: "Gold", referrals: 22, commissionsEarned: 18200, pendingPayout: 3400, status: "active", joinedAt: "Jan 2025", conversionRate: 82, lastReferral: "2 Jun 2026" },
  { id: "aff-2", name: "Rina Hazarika", email: "rina@schooltech.in", tier: "Gold", referrals: 17, commissionsEarned: 14300, pendingPayout: 2800, status: "active", joinedAt: "Feb 2025", conversionRate: 76, lastReferral: "1 Jun 2026" },
  { id: "aff-3", name: "Bhupen Kalita", email: "bhupen@consult.in", tier: "Silver", referrals: 11, commissionsEarned: 8700, pendingPayout: 1600, status: "active", joinedAt: "Apr 2025", conversionRate: 64, lastReferral: "30 May 2026" },
  { id: "aff-4", name: "Mridula Goswami", email: "mridula@eduvision.in", tier: "Silver", referrals: 8, commissionsEarned: 5100, pendingPayout: 2100, status: "active", joinedAt: "Jun 2025", conversionRate: 58, lastReferral: "28 May 2026" },
  { id: "aff-5", name: "Rajen Barua", email: "rajen@techsales.in", tier: "Bronze", referrals: 4, commissionsEarned: 1500, pendingPayout: 1200, status: "active", joinedAt: "Sep 2025", conversionRate: 50, lastReferral: "20 May 2026" },
  { id: "aff-6", name: "Pallabi Deka", email: "pallabi@partner.in", tier: "Bronze", referrals: 2, commissionsEarned: 400, pendingPayout: 900, status: "active", joinedAt: "Jan 2026", conversionRate: 40, lastReferral: "15 May 2026" },
  { id: "aff-7", name: "Hemen Bhuyan", email: "hemen@mrktg.in", tier: "Bronze", referrals: 1, commissionsEarned: 0, pendingPayout: 400, status: "pending", joinedAt: "Mar 2026", conversionRate: 33, lastReferral: "10 Jun 2026" },
  { id: "aff-8", name: "Chitralekha Sarma", email: "chitralekha@edu.in", tier: "Bronze", referrals: 0, commissionsEarned: 0, pendingPayout: 0, status: "inactive", joinedAt: "Apr 2026", conversionRate: 0, lastReferral: "—" },
]

const TIER_META: Record<Affiliate["tier"], { className: string; icon: React.ReactNode; label: string }> = {
  Gold: { className: "bg-ef-amber-light text-ef-amber-dark", icon: <Trophy className="size-3.5" />, label: "16+ referrals" },
  Silver: { className: "bg-muted text-muted-foreground", icon: <Star className="size-3.5" />, label: "6–15 referrals" },
  Bronze: { className: "bg-ef-amber-light text-ef-amber-dark", icon: <Medal className="size-3.5" />, label: "1–5 referrals" },
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "secondary"> = {
  active: "success", pending: "warning", inactive: "secondary",
}

export default function AffiliatesPage() {
  const [showAddAffiliate, setShowAddAffiliate] = useState(false)
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [refLinkCopied, setRefLinkCopied] = useState(false)
  const [newAffiliate, setNewAffiliate] = useState({ name: "", email: "" })

  const totalPending = AFFILIATES.reduce((s, a) => s + a.pendingPayout, 0)
  const totalPaid = AFFILIATES.reduce((s, a) => s + a.commissionsEarned, 0)
  const activeCount = AFFILIATES.filter(a => a.status === "active").length

  function copyRefLink() {
    setRefLinkCopied(true)
    setTimeout(() => setRefLinkCopied(false), 2000)
  }

  const { sorted, sortField, sortDir, toggleSort } = useTableSort(AFFILIATES, {
    name: a => a.name,
    referrals: a => a.referrals,
    conversion: a => a.conversionRate,
    earned: a => a.commissionsEarned,
    pending: a => a.pendingPayout,
  }, { field: "referrals", dir: "desc" })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Users size={20} />}
        title="Affiliates Management"
        subtitle="Referral partners · Commission tracking · Payouts"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm"><Download className="size-4" /> Export</Button>
            <Button variant="secondary" size="sm" onClick={() => setShowPayoutModal(true)}><Wallet className="size-4" /> Trigger Payout</Button>
            <Button size="sm" onClick={() => setShowAddAffiliate(true)}><Plus className="size-4" /> Add Affiliate</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard title="Total Affiliates" value={AFFILIATES.length} subtitle={`${activeCount} active`} icon={<Users className="size-5" />} sparkline={{ variant: "bar", data: [4, 5, 6, 7, 7, 8] }} />
        <KpiCard title="Active Partners" value={activeCount} subtitle={`${AFFILIATES.length - activeCount} inactive`} icon={<TrendingUp className="size-5" />} iconClassName="bg-ef-green-light text-ef-green" sparkline={{ variant: "line", data: [3, 4, 5, 5, 6, 6], color: "var(--ef-green)" }} />
        <KpiCard title="Pending Payouts" value={`₹${totalPending.toLocaleString("en-IN")}`} subtitle="6 partners" icon={<Wallet className="size-5" />} iconClassName="bg-ef-amber-light text-ef-amber" sparkline={{ variant: "bar", data: [800, 1200, 900, 1400, 1600, 1200], color: "var(--ef-amber)" }} />
        <KpiCard title="Commissions Paid YTD" value={`₹${totalPaid.toLocaleString("en-IN")}`} subtitle="Since Jan 2026" icon={<IndianRupee className="size-5" />} iconClassName="bg-ef-purple-light text-ef-purple" sparkline={{ variant: "line", data: [4000, 6000, 8000, 10000, 12000, 14300], color: "var(--ef-purple)" }} />
      </div>

      {/* Commission structure + Referral link */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Commission Structure</CardTitle>
            <Badge>● Live</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-ef-brand-light rounded-lg px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">First Payment</div>
                <div className="text-2xl font-extrabold text-primary mt-1">25%</div>
                <div className="text-xs text-muted-foreground mt-0.5">One-time commission</div>
              </div>
              <div className="bg-ef-green-light rounded-lg px-4 py-4">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ef-green-dark">Recurring</div>
                <div className="text-2xl font-extrabold text-ef-green-dark mt-1">5%</div>
                <div className="text-xs text-muted-foreground mt-0.5">Every renewal</div>
              </div>
            </div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2.5">Tier Thresholds</div>
            {(Object.entries(TIER_META) as [Affiliate["tier"], typeof TIER_META[Affiliate["tier"]]][]).map(([tier, meta]) => (
              <div key={tier} className="flex items-center gap-2.5 mb-2.5">
                <div className={`size-7 rounded-md flex items-center justify-center flex-shrink-0 ${meta.className}`}>{meta.icon}</div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{tier}</div>
                  <div className="text-[11px] text-muted-foreground/70">{meta.label}</div>
                </div>
                <Badge variant={tier === "Gold" ? "warning" : "secondary"}>{tier === "Gold" ? "+2% bonus" : tier === "Silver" ? "+1% bonus" : "Base rate"}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between pb-3">
            <CardTitle className="text-base font-semibold">Referral Link Generator</CardTitle>
            <Badge variant="success">Auto-tracked</Badge>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-xs text-muted-foreground mb-1.5">Select Affiliate</div>
              <Select>
                <SelectTrigger><SelectValue placeholder="Choose affiliate…" /></SelectTrigger>
                <SelectContent>
                  {AFFILIATES.filter(a => a.status === "active").map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted rounded-lg px-4 py-2 mb-3">
              <div className="text-[11px] text-muted-foreground/70 mb-1">Generated link</div>
              <div className="font-mono text-xs text-primary break-all">https://app.eduflowscholaris.com/signup?ref=aff_dipankar_sk22</div>
            </div>
            <div className="flex gap-2 mb-5">
              <Button size="sm" className="flex-1" onClick={copyRefLink}>{!refLinkCopied && <Copy className="size-3.5" />}{refLinkCopied ? "✓ Copied!" : "Copy Link"}</Button>
              <Button variant="secondary" size="sm"><ExternalLink className="size-3.5" /> Preview</Button>
            </div>
            <div className="border-t border-border pt-4">
              <div className="text-xs font-semibold text-muted-foreground mb-2.5">Link Performance (Dipankar)</div>
              {[
                { label: "Total Clicks", value: 342 },
                { label: "Signups", value: 27 },
                { label: "Conversions", value: 22 },
              ].map(m => (
                <div key={m.label} className="flex justify-between mb-1.5 text-sm">
                  <span className="text-muted-foreground">{m.label}</span>
                  <span className="font-bold">{m.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Affiliates table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">All Affiliates</CardTitle>
          <div className="flex gap-1.5">
            <Badge variant="success">6 Active</Badge>
            <Badge variant="warning">1 Pending</Badge>
            <Badge variant="secondary">1 Inactive</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table className="text-sm">
            <caption className="sr-only">All affiliates with referrals, conversion, and payout status</caption>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-transparent">
                <SortableHead field="name" label="Affiliate" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <TableHead className="text-xs"><span className="inline-flex items-center gap-1 font-medium">Tier</span></TableHead>
                <SortableHead field="referrals" label="Referrals" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="conversion" label="Conversion" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="earned" label="Earned Total" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <SortableHead field="pending" label="Pending" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-xs" />
                <TableHead className="text-xs"><span className="inline-flex items-center gap-1 font-medium">Status</span></TableHead>
                <TableHead className="text-xs"><span className="inline-flex items-center gap-1 font-medium">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(a => {
                const tm = TIER_META[a.tier]
                return (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="size-8 rounded-full bg-ef-brand-light text-primary flex items-center justify-center text-sm font-bold flex-shrink-0" aria-hidden="true">{a.name.charAt(0)}</div>
                        <div>
                          <div className="text-sm font-semibold">{a.name}</div>
                          <div className="text-[11px] text-muted-foreground/70">{a.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div className={`size-5 rounded flex items-center justify-center ${tm.className}`}>{tm.icon}</div>
                        <span className="text-sm font-semibold">{a.tier}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-bold">{a.referrals}</div>
                      <div className="text-[11px] text-muted-foreground/70">Last: {a.lastReferral}</div>
                    </TableCell>
                    <TableCell className="min-w-[110px]">
                      <div className="text-sm font-semibold mb-1">{a.conversionRate}%</div>
                      <Progress value={a.conversionRate} className={`h-1.5 ${a.conversionRate >= 70 ? "[&>div]:bg-ef-green" : a.conversionRate >= 50 ? "" : "[&>div]:bg-ef-amber"}`} />
                    </TableCell>
                    <TableCell><span className="font-mono text-sm font-semibold">{a.commissionsEarned > 0 ? `₹${a.commissionsEarned.toLocaleString("en-IN")}` : "—"}</span></TableCell>
                    <TableCell><span className={`font-mono text-sm ${a.pendingPayout > 0 ? "font-semibold text-ef-amber-dark" : "text-muted-foreground/70"}`}>{a.pendingPayout > 0 ? `₹${a.pendingPayout.toLocaleString("en-IN")}` : "—"}</span></TableCell>
                    <TableCell><Badge variant={STATUS_VARIANT[a.status]}>● {a.status.charAt(0).toUpperCase() + a.status.slice(1)}</Badge></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="secondary" size="sm"><Zap className="size-3" /> Pay</Button>
                        <Button variant="ghost" size="icon-sm" aria-label={`More actions for ${a.name}`}><MoreHorizontal className="size-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-xs text-muted-foreground">Total pending: <strong className="text-ef-amber-dark">₹{totalPending.toLocaleString("en-IN")}</strong> across 6 affiliates</span>
            <Button size="sm" onClick={() => setShowPayoutModal(true)}><Wallet className="size-4" /> Trigger All Payouts</Button>
          </div>
        </CardContent>
      </Card>

      {/* Add Affiliate Dialog */}
      <Dialog open={showAddAffiliate} onOpenChange={setShowAddAffiliate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Affiliate</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <Alert>
              <Gift className="size-4" />
              <AlertDescription>An invite email with their unique referral link will be sent. Commission structure is automatic.</AlertDescription>
            </Alert>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aff-name">Full Name</Label>
              <Input id="aff-name" value={newAffiliate.name} onChange={e => setNewAffiliate(s => ({ ...s, name: e.target.value }))} placeholder="e.g. Dipankar Saikia" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aff-email">Email Address</Label>
              <Input id="aff-email" value={newAffiliate.email} onChange={e => setNewAffiliate(s => ({ ...s, email: e.target.value }))} placeholder="affiliate@email.com" type="email" />
            </div>
            <div className="bg-muted rounded-lg px-4 py-4">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Commission Preview</div>
              <div className="flex gap-4">
                <div><div className="text-[11px] text-muted-foreground/70">First payment</div><div className="text-base font-bold text-primary">25%</div></div>
                <div><div className="text-[11px] text-muted-foreground/70">Recurring</div><div className="text-base font-bold text-ef-green-dark">5%</div></div>
                <div><div className="text-[11px] text-muted-foreground/70">Starting tier</div><div className="text-base font-bold text-ef-amber-dark">Bronze</div></div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowAddAffiliate(false)}>Cancel</Button>
            <Button><Plus className="size-4" /> Send Invite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payout Dialog */}
      <Dialog open={showPayoutModal} onOpenChange={setShowPayoutModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Trigger Payout</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <Alert variant="warning">
              <Wallet className="size-4" />
              <AlertTitle>Payout Confirmation</AlertTitle>
              <AlertDescription>This will process payments to all 6 active affiliates via Razorpay Payouts API.</AlertDescription>
            </Alert>
            <div className="flex flex-col gap-2">
              {AFFILIATES.filter(a => a.pendingPayout > 0).map(a => (
                <div key={a.id} className="flex justify-between py-2 border-b border-border text-sm">
                  <div className="flex items-center gap-2"><Gift className="size-3 text-muted-foreground/70" /><span className="font-medium">{a.name}</span></div>
                  <span className="font-mono font-bold">₹{a.pendingPayout.toLocaleString("en-IN")}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between py-2 text-sm font-bold border-t-2 border-border">
              <span>Total Payout</span>
              <span className="text-primary">₹{totalPending.toLocaleString("en-IN")}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowPayoutModal(false)}>Cancel</Button>
            <Button className="bg-ef-green hover:bg-ef-green/90 text-white"><Zap className="size-4" /> Confirm & Pay ₹{totalPending.toLocaleString("en-IN")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
