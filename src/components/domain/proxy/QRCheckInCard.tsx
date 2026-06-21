"use client"

/**
 * QRCheckInCard — domain component for proxy check-in via QR code
 *
 * Renders a printable card containing the proxy assignment details and a QR
 * code image that encodes the check-in URL `/api/proxy/checkin?id={assignment.id}`.
 *
 * The card uses `print:block hidden` so it is hidden on-screen until the user
 * triggers `window.print()`. Conversely the wrapping Dialog hides on print
 * via `print:hidden` so only the card is visible when printing.
 *
 * Requirements: 12.6
 */

import { useEffect, useState } from "react"
import QRCode from "qrcode"
import { Printer, QrCode, User, BookOpen, Clock, LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableRow, TableCell } from "@/components/ui/table"
import { type ProxyAssignment } from "@/data/proxy-assignments"

// ── Props ─────────────────────────────────────────────────────────────────────

export interface QRCheckInCardProps {
  /** The proxy assignment this card represents */
  assignment: ProxyAssignment
  /** Full check-in URL — /api/proxy/checkin?id={assignment.id} */
  checkInUrl: string
  /** Called when the user clicks the print button */
  onPrint: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QRCheckInCard({ assignment, checkInUrl, onPrint }: QRCheckInCardProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [qrError, setQrError] = useState<string>("")

  // Generate QR code data URL whenever the check-in URL changes
  useEffect(() => {
    let cancelled = false

    QRCode.toDataURL(checkInUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
      errorCorrectionLevel: "M",
    })
      .then(dataUrl => {
        if (!cancelled) {
          setQrDataUrl(dataUrl)
          setQrError("")
        }
      })
      .catch(() => {
        if (!cancelled) setQrError("Failed to generate QR code")
      })

    return () => { cancelled = true }
  }, [checkInUrl])

  // Status badge variant
  const statusVariant =
    assignment.status === "accepted"
      ? "success"
      : assignment.status === "declined"
      ? "destructive"
      : "secondary"

  return (
    <>
      {/*
       * ── On-screen card (visible inside the Dialog) ──────────────────────
       * Hidden when printing via `print:hidden` on the Dialog wrapper.
       */}
      <div className="flex flex-col items-center gap-5 py-2">
        {/* QR Code image */}
        <div className="rounded-xl border-2 border-border bg-white p-3 shadow-sm">
          {qrError ? (
            <div className="flex size-[200px] items-center justify-center rounded-lg bg-muted text-xs text-muted-foreground text-center px-3">
              {qrError}
            </div>
          ) : qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`QR code for proxy check-in — ${assignment.proxyTeacherName}, ${assignment.periodId}`}
              width={200}
              height={200}
              className="block rounded"
            />
          ) : (
            <div className="flex size-[200px] items-center justify-center">
              <QrCode className="size-12 text-muted-foreground animate-pulse" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Assignment details */}
        <div className="w-full space-y-3 rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-2.5">
            <User className="size-4 text-primary flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Teacher</p>
              <p className="text-sm font-semibold text-foreground">{assignment.proxyTeacherName}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <Clock className="size-3.5 text-muted-foreground mx-auto mb-0.5" aria-hidden="true" />
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Period</p>
              <p className="text-sm font-bold text-foreground">{assignment.periodId}</p>
            </div>
            <div>
              <LayoutGrid className="size-3.5 text-muted-foreground mx-auto mb-0.5" aria-hidden="true" />
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Class</p>
              <p className="text-sm font-bold text-foreground">{assignment.class}</p>
            </div>
            <div>
              <BookOpen className="size-3.5 text-muted-foreground mx-auto mb-0.5" aria-hidden="true" />
              <p className="text-[9px] text-muted-foreground uppercase tracking-wide">Subject</p>
              <p className="text-sm font-bold text-foreground">{assignment.subject}</p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Covering for</span>
            <span className="font-medium text-foreground">{assignment.absentTeacherName}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={statusVariant} className="capitalize text-[10px]">
              {assignment.status}
            </Badge>
          </div>
        </div>

        {/* Check-in URL hint */}
        <p className="text-[10px] text-muted-foreground text-center break-all px-2">
          {checkInUrl}
        </p>

        {/* Print button (on-screen only) */}
        <Button
          variant="default"
          size="sm"
          className="w-full"
          onClick={onPrint}
          aria-label="Print QR check-in card"
        >
          <Printer className="size-4" aria-hidden="true" />
          Print QR Card
        </Button>
      </div>

      {/*
       * ── Print-only card ──────────────────────────────────────────────────
       * Uses `print:block hidden` — invisible on-screen, rendered when printing.
       * Styled for a compact A5/A6 printout.
       *
       * Pin to light-mode tokens locally so `text-foreground` / `text-muted-foreground`
       * / `border-border` always render as dark-on-white at print time, even when
       * the user is in dark mode. Keeps the design system intact AND print-safe.
       */}
      <div
        className="hidden print:block fixed inset-0 z-[9999] bg-white p-8"
        style={{
          // Force light-mode token values inside this print subtree
          "--background": "#ffffff",
          "--foreground": "#020617",
          "--muted-foreground": "#64748b",
          "--border": "#e2e8f0",
        } as React.CSSProperties}
        aria-hidden="true"
      >
        <div className="mx-auto max-w-xs border border-border rounded-lg p-6 text-center">
          {/* School / App header */}
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Holy Child English Academy
          </p>
          <p className="text-base font-bold text-foreground mb-4">Proxy Check-In</p>

          {/* QR Code */}
          {qrDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt="QR code for proxy check-in"
              width={180}
              height={180}
              className="mx-auto block mb-4"
            />
          )}

          {/* Details table */}
          <Table className="mb-3">
            <caption className="sr-only">Proxy check-in details</caption>
            <TableBody>
              <TableRow className="border-t hover:bg-transparent">
                <TableCell className="py-1.5 text-muted-foreground text-xs font-medium">Teacher</TableCell>
                <TableCell className="py-1.5 font-semibold text-foreground text-xs">{assignment.proxyTeacherName}</TableCell>
              </TableRow>
              <TableRow className="border-t hover:bg-transparent">
                <TableCell className="py-1.5 text-muted-foreground text-xs font-medium">Period</TableCell>
                <TableCell className="py-1.5 font-semibold text-foreground text-xs">{assignment.periodId}</TableCell>
              </TableRow>
              <TableRow className="border-t hover:bg-transparent">
                <TableCell className="py-1.5 text-muted-foreground text-xs font-medium">Class</TableCell>
                <TableCell className="py-1.5 font-semibold text-foreground text-xs">{assignment.class}</TableCell>
              </TableRow>
              <TableRow className="border-t hover:bg-transparent">
                <TableCell className="py-1.5 text-muted-foreground text-xs font-medium">Subject</TableCell>
                <TableCell className="py-1.5 font-semibold text-foreground text-xs">{assignment.subject}</TableCell>
              </TableRow>
              <TableRow className="border-t hover:bg-transparent">
                <TableCell className="py-1.5 text-muted-foreground text-xs font-medium">Covering for</TableCell>
                <TableCell className="py-1.5 font-semibold text-foreground text-xs">{assignment.absentTeacherName}</TableCell>
              </TableRow>
              <TableRow className="border-t hover:bg-transparent">
                <TableCell className="py-1.5 text-muted-foreground text-xs font-medium">Date</TableCell>
                <TableCell className="py-1.5 font-semibold text-foreground text-xs">{assignment.date}</TableCell>
              </TableRow>
            </TableBody>
          </Table>

          <p className="text-[9px] text-muted-foreground break-all">{checkInUrl}</p>
        </div>
      </div>
    </>
  )
}
