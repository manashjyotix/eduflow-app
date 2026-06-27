/**
 * birthdays.ts
 *
 * Single source of truth for the Birthday Wish feature.
 *
 * A birthday wish card (see `components/shared/birthday-card.tsx`) appears on a
 * user's dashboard for the *entire calendar day* of their birthday (a rolling
 * 24-hour, date-matched window). Every role is wished:
 *
 *   • Staff (teacher · admin · management · super_admin)
 *       → In-app card + In-app notification + Push + SMS + WhatsApp card
 *         (branded with the EduFlow app name & logo).
 *   • Family (parent · student)
 *       → In-app card + In-app notification only.
 *
 * Students do not log in directly — their birthday card surfaces inside the
 * Parent portal (the parent sees their child's card).
 *
 * NOTE (prototype): real wiring to SMS/WhatsApp/Push providers lives in the
 * production app. Here delivery is mocked via `dispatchBirthdayWishes()`.
 */

import type { Role } from "@/lib/constants"

// ─── Channels ─────────────────────────────────────────────────────────────────

export type BirthdayChannel = "in_app" | "push" | "sms" | "whatsapp"

export const CHANNEL_LABELS: Record<BirthdayChannel, string> = {
  in_app:   "In-app",
  push:     "Push",
  sms:      "SMS",
  whatsapp: "WhatsApp",
}

/** Two delivery tiers. Staff reach is full multi-channel; family is in-app only. */
export type BirthdayAudience = "staff" | "family"

export const CHANNELS_BY_AUDIENCE: Record<BirthdayAudience, BirthdayChannel[]> = {
  staff:  ["in_app", "push", "sms", "whatsapp"],
  family: ["in_app"],
}

/** Map a role to its delivery audience tier. */
export function audienceForRole(role: Role): BirthdayAudience {
  return role === "parent" ? "family" : "staff"
}

// ─── Birthday person model ──────────────────────────────────────────────────────

export interface BirthdayPerson {
  id: string
  name: string
  /** ISO yyyy-mm-dd — full birth date (used for the wish day + age). */
  dob: string
  audience: BirthdayAudience
  /** Two-letter avatar initials. */
  initials: string
  /** Optional sub-line (class/section, designation, etc.). */
  subtitle?: string
}

// ─── Persona birthdays (one per logged-in role) ──────────────────────────────────

/**
 * Birthdays for the demo personas behind each role (see role-context).
 * The `dob` month-day controls when the card appears for that signed-in user;
 * the year drives the age shown ("Nth Happy Birthday").
 */
export const ROLE_BIRTHDAYS: Record<Role, BirthdayPerson> = {
  admin:       { id: "u-admin",  name: "Arnab Paul",   dob: "1982-06-24", audience: "staff",  initials: "AP", subtitle: "Principal · Admin" },
  management:  { id: "u-mgmt",   name: "Mrinal Ojha",  dob: "1979-09-12", audience: "staff",  initials: "MO", subtitle: "Vice Principal" },
  teacher:     { id: "t1",       name: "Priya Sharma", dob: "1990-06-24", audience: "staff",  initials: "PS", subtitle: "Mathematics · High Section" },
  parent:      { id: "u-parent", name: "Pankaj Das",   dob: "1986-06-24", audience: "family", initials: "PD", subtitle: "Parent of Rohit Das" },
  super_admin: { id: "u-super",  name: "Super Admin",  dob: "1988-01-30", audience: "staff",  initials: "SA", subtitle: "Platform Owner" },
  driver:      { id: "drv-1",    name: "Jiten Das",    dob: "1983-06-24", audience: "staff",  initials: "JD", subtitle: "Driver · Route 1" },
}

/** Demo child (student) birthday, surfaced inside the Parent portal. */
export const CHILD_BIRTHDAY: BirthdayPerson = {
  id: "child-1",
  name: "Rohit Das",
  dob: "2012-06-24",
  audience: "family",
  initials: "RD",
  subtitle: "Class VIII-A · Roll 12",
}

// ─── Demo toggle ─────────────────────────────────────────────────────────────────

/**
 * Prototype convenience: when `true`, the signed-in user's birthday card is
 * force-shown regardless of the real date. Per product decision the card is
 * only shown on the user's actual birthday, so this is `false`. Several demo
 * personas (admin/teacher/parent + child) carry a 24-June birthday so the card
 * is still visible on that date via a genuine date match.
 */
export const BIRTHDAY_DEMO_MODE = false

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Zero-padded "MM-DD" for a given Date (local time). */
export function toMonthDay(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${m}-${d}`
}

/** "MM-DD" extracted from an ISO yyyy-mm-dd string. */
export function monthDayOf(dob: string): string {
  return dob.slice(5, 10)
}

/** True when `dob`'s month-day falls on `now` (local calendar day). */
export function isBirthdayToday(dob: string, now: Date = new Date()): boolean {
  return toMonthDay(now) === monthDayOf(dob)
}

/** Age the person turns on this birthday (year difference). */
export function ageOnBirthday(dob: string, now: Date = new Date()): number {
  return now.getFullYear() - Number(dob.slice(0, 4))
}

/** English ordinal suffix: 1→"1st", 2→"2nd", 10→"10th", 21→"21st". */
export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return `${n}${s[(v - 20) % 10] ?? s[v] ?? s[0]}`
}

/**
 * The active birthday for a signed-in role, or `null` when it is not their day.
 * In demo mode the persona's card is always returned (treated as "today").
 */
export function getActiveRoleBirthday(role: Role, now: Date = new Date()): BirthdayPerson | null {
  const person = ROLE_BIRTHDAYS[role]
  if (!person) return null
  if (BIRTHDAY_DEMO_MODE) return person
  return isBirthdayToday(person.dob, now) ? person : null
}

/** The child's active birthday (for the Parent portal), or `null`. */
export function getActiveChildBirthday(now: Date = new Date()): BirthdayPerson | null {
  if (BIRTHDAY_DEMO_MODE) return CHILD_BIRTHDAY
  return isBirthdayToday(CHILD_BIRTHDAY.dob, now) ? CHILD_BIRTHDAY : null
}

/** Channels used to deliver a wish to a given person. */
export function channelsFor(person: BirthdayPerson): BirthdayChannel[] {
  return CHANNELS_BY_AUDIENCE[person.audience]
}

// ─── Mock multi-channel dispatch ─────────────────────────────────────────────────

export interface BirthdayDispatchResult {
  person: string
  channels: BirthdayChannel[]
  message: string
}

/**
 * Mock dispatcher. In production this fans the branded EduFlow birthday card out
 * to the real Push / SMS / WhatsApp providers. Here it just returns the plan so
 * the UI can show which channels were used.
 */
export function dispatchBirthdayWishes(
  person: BirthdayPerson,
  appName = "EduFlow",
): BirthdayDispatchResult {
  const channels = channelsFor(person)
  return {
    person: person.name,
    channels,
    message: `Happy Birthday, ${person.name}! 🎉 — with warm wishes from ${appName}.`,
  }
}
