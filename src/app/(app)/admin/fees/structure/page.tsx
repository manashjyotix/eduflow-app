"use client"
import { useState } from "react"
import {
  DollarSign, Plus, Settings, Edit, Trash2, CheckCircle2, School, X,
} from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { useTableSort, SortableHead } from "@/components/shared/sortable-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"

interface CustomField { id: string; label: string; value: string }
interface FeeHead {
  id: string
  name: string
  amount: number
  type: "Monthly" | "Quarterly" | "Annual"
  classes: string[]
  status: "active" | "inactive"
  description: string
  custom?: CustomField[]
}

const INITIAL_FEE_HEADS: FeeHead[] = [
  { id: "f1", name: "Tuition Fee",     amount: 2000, type: "Monthly",   classes: ["VI", "VII", "VIII", "IX", "X"], status: "active", description: "Core tuition fee for all subjects" },
  { id: "f2", name: "Development Fee", amount: 500,  type: "Quarterly", classes: ["VI", "VII", "VIII", "IX", "X"], status: "active", description: "Infrastructure and facility development" },
  { id: "f3", name: "Library Fee",     amount: 200,  type: "Quarterly", classes: ["VI", "VII", "VIII", "IX", "X"], status: "active", description: "Library books and resources maintenance" },
  { id: "f4", name: "Lab Fee",         amount: 300,  type: "Quarterly", classes: ["VIII", "IX", "X"],              status: "active", description: "Science laboratory equipment and consumables" },
  { id: "f5", name: "Sports Fee",      amount: 150,  type: "Quarterly", classes: ["VI", "VII", "VIII", "IX", "X"], status: "active", description: "Sports equipment and physical education" },
  { id: "f6", name: "Transport Fee",   amount: 1500, type: "Monthly",   classes: ["VI", "VII", "VIII"],            status: "active", description: "School bus service (optional)" },
]

const ALL_CLASSES = ["VI", "VII", "VIII", "IX", "X"]

const CLASS_FEE_SUMMARY = [
  { className: "Class VI",   monthly: 3500, quarterly: 850,  annual: 42000 + 850 * 4,  feeHeads: ["Tuition Fee", "Development Fee", "Library Fee", "Sports Fee", "Transport Fee"] },
  { className: "Class VII",  monthly: 3500, quarterly: 850,  annual: 42000 + 850 * 4,  feeHeads: ["Tuition Fee", "Development Fee", "Library Fee", "Sports Fee", "Transport Fee"] },
  { className: "Class VIII", monthly: 3500, quarterly: 1150, annual: 42000 + 1150 * 4, feeHeads: ["Tuition Fee", "Development Fee", "Library Fee", "Lab Fee", "Sports Fee", "Transport Fee"] },
  { className: "Class IX",   monthly: 2000, quarterly: 1150, annual: 24000 + 1150 * 4, feeHeads: ["Tuition Fee", "Development Fee", "Library Fee", "Lab Fee", "Sports Fee"] },
  { className: "Class X",    monthly: 2000, quarterly: 1150, annual: 24000 + 1150 * 4, feeHeads: ["Tuition Fee", "Development Fee", "Library Fee", "Lab Fee", "Sports Fee"] },
]

const TYPE_BADGE: Record<string, string> = {
  Monthly: "bg-info text-info-foreground",
  Quarterly: "bg-success text-success-foreground",
  Annual: "bg-[var(--ef-purple-light)] text-[var(--ef-purple)]",
}

let uid = 0
const nextId = () => `c${++uid}`

export default function FeeStructurePage() {
  const [feeHeads, setFeeHeads] = useState<FeeHead[]>(INITIAL_FEE_HEADS)
  const [open, setOpen] = useState(false)

  // ── New fee head draft (incl. custom fields) ──
  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [type, setType] = useState<FeeHead["type"]>("Monthly")
  const [classes, setClasses] = useState<string[]>([])
  const [description, setDescription] = useState("")
  const [custom, setCustom] = useState<CustomField[]>([])

  function resetDraft() {
    setName(""); setAmount(""); setType("Monthly"); setClasses([]); setDescription(""); setCustom([])
  }

  function toggleClass(cls: string) {
    setClasses((prev) => (prev.includes(cls) ? prev.filter((c) => c !== cls) : [...prev, cls]))
  }

  function addCustomField() {
    setCustom((prev) => [...prev, { id: nextId(), label: "", value: "" }])
  }
  function updateCustomField(id: string, key: "label" | "value", v: string) {
    setCustom((prev) => prev.map((f) => (f.id === id ? { ...f, [key]: v } : f)))
  }
  function removeCustomField(id: string) {
    setCustom((prev) => prev.filter((f) => f.id !== id))
  }

  function save() {
    if (!name.trim() || !amount) return
    setFeeHeads((prev) => [
      ...prev,
      {
        id: `f${prev.length + 1}-${Date.now()}`,
        name: name.trim(),
        amount: Number(amount),
        type,
        classes: classes.length ? classes : ALL_CLASSES,
        status: "active",
        description: description.trim() || "Custom fee head",
        custom: custom.filter((c) => c.label.trim()),
      },
    ])
    resetDraft()
    setOpen(false)
  }

  function removeFeeHead(id: string) {
    setFeeHeads((prev) => prev.filter((f) => f.id !== id))
  }

  const totalActive = feeHeads.filter((f) => f.status === "active").length
  const totalMonthlyHeads = feeHeads.filter((f) => f.type === "Monthly").length
  const totalQuarterlyHeads = feeHeads.filter((f) => f.type === "Quarterly").length

  const { sorted: sortedFeeHeads, sortField, sortDir, toggleSort } = useTableSort<
    FeeHead,
    "name" | "amount" | "type" | "status"
  >(feeHeads, {
    name:   f => f.name,
    amount: f => f.amount,
    type:   f => f.type,
    status: f => f.status,
  }, { field: "name" })

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Settings size={20} />}
        title="Fee Structure"
        subtitle="Configure fee heads per class and billing period"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4 mr-2" />
            Add Fee Head
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <KpiCard title="Total Fee Heads" value={feeHeads.length} subtitle="configured fee categories" icon={<DollarSign size={18} />} tone="brand" />
        <KpiCard title="Active Heads" value={totalActive} subtitle="currently applicable" icon={<CheckCircle2 size={18} />} tone="green" />
        <KpiCard title="Monthly Fees" value={totalMonthlyHeads} subtitle="billed every month" icon={<DollarSign size={18} />} tone="cyan" />
        <KpiCard title="Quarterly Fees" value={totalQuarterlyHeads} subtitle="billed per quarter" icon={<DollarSign size={18} />} tone="purple" />
      </div>

      {/* Fee Heads Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Fee Heads Configuration</CardTitle>
          <Badge variant="secondary">{feeHeads.length} heads</Badge>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="text-sm">
              <caption className="sr-only">Configured fee heads with amount, billing type, applicable classes and custom fields</caption>
              <TableHeader>
                <TableRow className="bg-muted/30 text-xs text-muted-foreground hover:bg-transparent">
                  <SortableHead field="name" label="Fee Head" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-left font-medium px-5 py-3 h-auto" />
                  <SortableHead field="amount" label="Amount" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-left font-medium px-4 py-3 h-auto" />
                  <SortableHead field="type" label="Billing Type" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-left font-medium px-4 py-3 h-auto" />
                  <TableHead className="text-left font-medium px-4 py-3 h-auto">Applicable Classes</TableHead>
                  <SortableHead field="status" label="Status" sortField={sortField} sortDir={sortDir} onSort={toggleSort} className="text-left font-medium px-4 py-3 h-auto" />
                  <TableHead className="text-left font-medium px-4 py-3 h-auto">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedFeeHeads.map((fee) => (
                  <TableRow key={fee.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell className="px-5 py-4">
                      <p className="font-semibold">{fee.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{fee.description}</p>
                      {fee.custom && fee.custom.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {fee.custom.map((c) => (
                            <span key={c.id} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                              <span className="font-medium text-foreground">{c.label}</span>
                              {c.value ? `: ${c.value}` : ""}
                            </span>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-4 whitespace-nowrap">
                      <span className="font-bold text-base">₹{fee.amount.toLocaleString("en-IN")}</span>
                      <span className="text-xs text-muted-foreground ml-1">/{fee.type === "Monthly" ? "mo" : fee.type === "Quarterly" ? "qtr" : "yr"}</span>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${TYPE_BADGE[fee.type]}`}>
                        {fee.type}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {fee.classes.map((cls) => (
                          <Badge key={cls} variant="outline" className="text-xs font-mono px-1.5 py-0">{cls}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <Badge variant={fee.status === "active" ? "success" : "secondary"} className="capitalize">{fee.status}</Badge>
                    </TableCell>
                    <TableCell className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-foreground" aria-label={`Edit ${fee.name}`}>
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" aria-label={`Delete ${fee.name}`} onClick={() => removeFeeHead(fee.id)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Class-wise Fee Summary */}
      <div>
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <School className="size-5 text-muted-foreground" />
          Class-wise Fee Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {CLASS_FEE_SUMMARY.map((cls) => (
            <Card key={cls.className}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <School className="size-4 text-primary" />
                  </div>
                  <span className="font-semibold text-sm">{cls.className}</span>
                </div>
                <Separator className="mb-3" />
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Monthly</span>
                    <span className="font-semibold">₹{cls.monthly.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Quarterly</span>
                    <span className="font-semibold">₹{cls.quarterly.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Annual Total</span>
                    <span className="font-bold text-primary">₹{cls.annual.toLocaleString("en-IN")}</span>
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="flex flex-wrap gap-1">
                  {cls.feeHeads.map((fh) => (
                    <span key={fh} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      {fh.split(" ")[0]}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Add Fee Head dialog (with custom fields) ── */}
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDraft() }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Fee Head</DialogTitle>
            <DialogDescription>Define a fee head and add any custom fields your school needs.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Fee Head Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Annual Day Fee" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Amount (₹)</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Billing Type</label>
                <Select value={type} onValueChange={(v) => setType(v as FeeHead["type"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Applicable Classes</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CLASSES.map((cls) => (
                  <button
                    key={cls}
                    type="button"
                    aria-pressed={classes.includes(cls)}
                    onClick={() => toggleClass(cls)}
                    className={`inline-flex h-9 items-center rounded-md border px-3 text-xs font-medium transition-colors ${
                      classes.includes(cls)
                        ? "border-transparent bg-primary text-primary-foreground"
                        : "border-input bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">Leave empty to apply to all classes.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Description</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional note" />
            </div>

            {/* Custom fields */}
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold">Custom Fields</p>
                <Button type="button" size="xs" variant="outline" onClick={addCustomField}>
                  <Plus className="size-3.5 mr-1" /> Add field
                </Button>
              </div>
              {custom.length === 0 ? (
                <p className="text-[11px] text-muted-foreground">No custom fields. Add fields like &quot;Late Fee&quot;, &quot;Due Day&quot;, or &quot;GST&quot;.</p>
              ) : (
                <div className="space-y-2">
                  {custom.map((f) => (
                    <div key={f.id} className="flex items-center gap-2">
                      <Input className="flex-1" value={f.label} onChange={(e) => updateCustomField(f.id, "label", e.target.value)} placeholder="Field label" />
                      <Input className="flex-1" value={f.value} onChange={(e) => updateCustomField(f.id, "value", e.target.value)} placeholder="Value" />
                      <Button type="button" variant="ghost" size="icon" className="size-9 text-muted-foreground hover:text-destructive" aria-label="Remove field" onClick={() => removeCustomField(f.id)}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetDraft() }}>Cancel</Button>
            <Button onClick={save} disabled={!name.trim() || !amount}>Save Fee Head</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
