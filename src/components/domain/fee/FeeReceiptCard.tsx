import { Printer, Download, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// ─── Types ────────────────────────────────────────────────────────────────────
export type PaymentMode = "Online" | "Cash" | "Cheque" | "—"
export type PaymentStatus = "paid" | "pending" | "overdue"

export interface FeeReceipt {
  id: string
  studentName: string
  /** Class string e.g. "VIII-A" */
  class: string
  feeHead: string
  amount: number
  date: string
  receiptNo: string
  status: PaymentStatus
  paymentMode: PaymentMode
}

export interface FeeReceiptCardProps {
  receipt: FeeReceipt
  /** Show print button; defaults to true when status is "paid" */
  showPrint?: boolean
  /** Show download button */
  showDownload?: boolean
  onPrint?: (receipt: FeeReceipt) => void
  onDownload?: (receipt: FeeReceipt) => void
}

// ─── Token-based payment mode colours ────────────────────────────────────────
const PAYMENT_MODE_STYLE: Record<PaymentMode, string> = {
  Online: "bg-primary/10 text-primary",
  Cash:   "bg-success/40 text-success-foreground",
  Cheque: "bg-warning/40 text-warning-foreground",
  "—":    "bg-muted text-muted-foreground",
}

// ─── Component ────────────────────────────────────────────────────────────────
export function FeeReceiptCard({
  receipt,
  showPrint,
  showDownload = false,
  onPrint,
  onDownload,
}: FeeReceiptCardProps) {
  const canPrint = showPrint ?? receipt.status === "paid"

  const initials = receipt.studentName
    .split(" ")
    .map(n => n[0])
    .join("")

  const formattedDate = new Date(receipt.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })

  const formattedAmount = `₹${receipt.amount.toLocaleString("en-IN")}`

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
          {/* Avatar + name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0" aria-hidden="true">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold truncate">{receipt.studentName}</p>
                <Badge variant="outline" className="font-mono text-xs flex-shrink-0">
                  {receipt.class}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{receipt.feeHead}</p>
            </div>
          </div>

          {/* Amount */}
          <div className="text-right flex-shrink-0">
            <p className="text-base font-bold">{formattedAmount}</p>
            <p className="text-xs text-muted-foreground">{formattedDate}</p>
          </div>

          {/* Receipt no + mode + status */}
          <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[140px]">
            <p className="font-mono text-xs text-muted-foreground">{receipt.receiptNo}</p>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${PAYMENT_MODE_STYLE[receipt.paymentMode]}`}
              >
                {receipt.paymentMode}
              </span>
              <Badge
                variant={
                  receipt.status === "paid"
                    ? "success"
                    : receipt.status === "overdue"
                    ? "destructive"
                    : "warning"
                }
                className="capitalize"
              >
                {receipt.status}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          {(canPrint || showDownload) && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {canPrint && onPrint && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  title="Print Receipt"
                  onClick={() => onPrint(receipt)}
                >
                  <Printer className="size-3.5" />
                  <span className="sr-only">Print receipt</span>
                </Button>
              )}
              {showDownload && onDownload && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  title="Download Receipt"
                  onClick={() => onDownload(receipt)}
                >
                  <Download className="size-3.5" />
                  <span className="sr-only">Download receipt</span>
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Paid receipt footer stripe */}
        {receipt.status === "paid" && (
          <div className="bg-success/10 border-t border-success/20 px-4 py-1.5 flex items-center gap-1.5">
            <CreditCard className="size-3 text-success-foreground opacity-70" />
            <p className="text-[10px] text-success-foreground font-medium">
              Payment confirmed · {receipt.receiptNo}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
