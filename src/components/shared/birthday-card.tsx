"use client"

import { Cake } from "lucide-react"
import { useRole } from "@/context/role-context"
import { useBirthdayWish } from "@/context/birthday-wish-context"
import { cn } from "@/lib/utils"
import { Gift3D } from "@/components/shared/birthday-scene"
import { getActiveRoleBirthday, type BirthdayPerson } from "@/data/birthdays"

interface BirthdayCardProps {
  /**
   * Explicit person to wish. When omitted the card derives the birthday from
   * the currently signed-in role and self-hides if it is not their day.
   */
  person?: BirthdayPerson | null
  className?: string
}

/** Looping confetti scattered across the banner background. */
const CONFETTI = [
  { left: "6%",  top: "22%", color: "var(--ef-amber)",  size: 6, delay: "0s"   },
  { left: "20%", top: "66%", color: "var(--ef-green)",  size: 5, delay: "0.5s" },
  { left: "34%", top: "16%", color: "var(--ef-cyan)",   size: 6, delay: "1.1s" },
  { left: "50%", top: "72%", color: "var(--ef-purple)", size: 5, delay: "0.3s" },
  { left: "66%", top: "20%", color: "var(--ef-red)",    size: 6, delay: "0.9s" },
  { left: "82%", top: "60%", color: "var(--ef-amber)",  size: 5, delay: "1.4s" },
  { left: "92%", top: "30%", color: "var(--ef-green)",  size: 6, delay: "0.7s" },
]

/**
 * BirthdayCard — a branded birthday wish banner shown on a user's dashboard for
 * the whole calendar day of their birthday (a date-matched 24h window).
 *
 * • 3D animated candle (flame flicker) on the left, 3D animated gift on the right.
 * • The greeting line alternates every ~2s between "Nth Happy Birthday!" and
 *   "Wish you a wonderful day" on a continuous loop.
 * • Renders nothing when it is not the person's birthday.
 */
export function BirthdayCard({ person, className }: BirthdayCardProps) {
  const { role } = useRole()
  const { enabled } = useBirthdayWish()

  // Super Admin can switch the feature off platform-wide.
  if (!enabled) return null

  // Explicit person wins; otherwise derive from the signed-in role.
  const active = person !== undefined ? person : getActiveRoleBirthday(role)
  if (!active) return null

  return (
    <div
      role="status"
      aria-label={`Happy Birthday, ${active.name}`}
      className={cn(
        "relative overflow-hidden rounded-xl border border-[var(--ef-brand)]/30",
        "bg-gradient-to-br from-[var(--ef-brand-light)] via-[var(--ef-brand-light)] to-transparent p-4",
        className,
      )}
    >
      {/* Looping confetti background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {CONFETTI.map((c, i) => (
          <span
            key={i}
            className="ef-anim-confetti absolute rounded-[1px]"
            style={{
              left: c.left,
              top: c.top,
              width: c.size,
              height: c.size,
              background: c.color,
              animationDelay: c.delay,
            }}
          />
        ))}
      </div>

      <div className="relative flex items-center justify-between gap-3">
        {/* Left — birthday cake icon + greeting */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-background/70 text-[var(--ef-brand)] shadow-inner">
            <Cake className="size-6" />
          </div>
          <div className="min-w-0">
            {/* Alternating greeting — one line, swapping every 5s on a smooth
                10s loop. Stacked in a single grid cell so neither line clips. */}
            <div className="grid leading-tight">
              <span className="ef-anim-textcycle col-start-1 row-start-1 whitespace-nowrap text-sm font-bold text-[var(--ef-brand)]">
                Happy Birthday!
              </span>
              <span
                className="ef-anim-textcycle col-start-1 row-start-1 whitespace-nowrap text-sm font-bold text-[var(--ef-brand)]"
                style={{ animationDelay: "-5s" }}
              >
                Wish you a wonderful day.
              </span>
            </div>
            <p className="truncate text-base font-bold text-foreground">{active.name}</p>
            {active.subtitle && (
              <p className="truncate text-xs text-muted-foreground">{active.subtitle}</p>
            )}
          </div>
        </div>

        {/* Right — bigger 3D animated gift */}
        <Gift3D className="size-16 shrink-0" />
      </div>
    </div>
  )
}
