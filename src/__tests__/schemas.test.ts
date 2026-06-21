/**
 * Property-based and example-based tests for auth and leave schemas.
 *
 * **Property 10: Email and password validation follow schema rules universally**
 * — for arbitrary strings, `loginSchema` accepts if and only if valid email format;
 *   password rejected if length < 6
 *
 * **Validates: Requirements 11.6**
 */

import { describe, expect } from "vitest"
import { it } from "@fast-check/vitest"
import * as fc from "fast-check"
import { loginSchema } from "@/lib/schemas/auth"
import { applyLeaveSchema } from "@/lib/schemas/leave"

// ---------------------------------------------------------------------------
// Example-based tests — loginSchema
// ---------------------------------------------------------------------------

describe("loginSchema — example-based tests", () => {
  it("valid email + 6-char password passes", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "abc123",
    })
    expect(result.success).toBe(true)
  })

  it("email missing '@' fails", () => {
    const result = loginSchema.safeParse({
      email: "userexample.com",
      password: "abc123",
    })
    expect(result.success).toBe(false)
  })

  it("5-char password fails", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "ab123",
    })
    expect(result.success).toBe(false)
  })

  it("empty email fails", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "abc123",
    })
    expect(result.success).toBe(false)
  })

  it("empty password fails", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Property 10a: Invalid email (no '@') always rejected by loginSchema
// ---------------------------------------------------------------------------

describe("loginSchema — PBT: invalid email rejected", () => {
  /**
   * Property 10a: For any string that does NOT contain '@',
   * loginSchema must reject the email field.
   *
   * **Validates: Requirements 11.6**
   */
  it.prop(
    [
      fc.string().filter((s) => !s.includes("@")),
      fc.string({ minLength: 6 }),
    ],
    { numRuns: 200 }
  )("email without '@' is always rejected", (invalidEmail, password) => {
    const result = loginSchema.safeParse({
      email: invalidEmail,
      password,
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Property 10b: Password shorter than 6 chars always rejected by loginSchema
// ---------------------------------------------------------------------------

describe("loginSchema — PBT: short password rejected", () => {
  /**
   * Property 10b: For any valid email + password with length < 6,
   * loginSchema must reject the password field.
   *
   * **Validates: Requirements 11.6**
   */
  it.prop(
    [
      fc.emailAddress(),
      fc.string({ maxLength: 5 }),
    ],
    { numRuns: 200 }
  )("password with length < 6 is always rejected", (email, shortPassword) => {
    const result = loginSchema.safeParse({
      email,
      password: shortPassword,
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Property 10c: Valid email + password >= 6 chars always accepted by loginSchema
// ---------------------------------------------------------------------------

// Build an email arbitrary that conforms to Zod's stricter email regex:
// local part: [A-Za-z0-9_'+\-.]+  ending with [A-Za-z0-9_+-]
// domain: [A-Za-z0-9][A-Za-z0-9-]* with TLD >= 2 chars
const zodValidLocalPart = fc
  .tuple(
    fc.stringOf(fc.constantFrom(...("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'+-.".split(""))), { minLength: 0, maxLength: 20 }),
    fc.constantFrom(...("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_+-".split(""))),
  )
  .map(([prefix, lastChar]) => prefix + lastChar)
  .filter((s) => !s.startsWith(".") && !s.includes(".."))

const zodValidDomain = fc
  .tuple(
    fc.stringOf(fc.constantFrom(...("abcdefghijklmnopqrstuvwxyz0123456789".split(""))), { minLength: 1, maxLength: 10 }),
    fc.string({ minLength: 2, maxLength: 6 }).filter((s) => /^[a-z]+$/.test(s)),
  )
  .map(([label, tld]) => `${label}.${tld}`)

const zodEmailArbitrary = fc
  .tuple(zodValidLocalPart, zodValidDomain)
  .map(([local, domain]) => `${local}@${domain}`)

describe("loginSchema — PBT: valid email + sufficient password accepted", () => {
  /**
   * Property 10c: For any valid email (matching Zod's email format) + password with
   * length >= 6, loginSchema must accept the input.
   *
   * **Validates: Requirements 11.6**
   */
  it.prop(
    [
      zodEmailArbitrary,
      fc.string({ minLength: 6, maxLength: 72 }),
    ],
    { numRuns: 200 }
  )("valid email + password >= 6 chars is always accepted", (email, password) => {
    const result = loginSchema.safeParse({ email, password })
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Example-based tests — applyLeaveSchema
// ---------------------------------------------------------------------------

describe("applyLeaveSchema — example-based tests", () => {
  it("full_day leave with reason >= 10 chars and startDate passes", () => {
    const result = applyLeaveSchema.safeParse({
      leaveType: "full_day",
      reason: "Feeling unwell today and need rest",
      startDate: "2026-07-01",
    })
    expect(result.success).toBe(true)
  })

  it("partial leave without periods fails", () => {
    const result = applyLeaveSchema.safeParse({
      leaveType: "partial",
      reason: "Doctor appointment during school hours",
      startDate: "2026-07-01",
      periods: [],
    })
    expect(result.success).toBe(false)
  })

  it("partial leave with at least one period passes", () => {
    const result = applyLeaveSchema.safeParse({
      leaveType: "partial",
      reason: "Doctor appointment during school hours",
      startDate: "2026-07-01",
      periods: ["P1"],
    })
    expect(result.success).toBe(true)
  })

  it("reason shorter than 10 chars fails", () => {
    const result = applyLeaveSchema.safeParse({
      leaveType: "full_day",
      reason: "Sick",
      startDate: "2026-07-01",
    })
    expect(result.success).toBe(false)
  })

  it("missing startDate fails", () => {
    const result = applyLeaveSchema.safeParse({
      leaveType: "full_day",
      reason: "Medical appointment required",
    })
    expect(result.success).toBe(false)
  })
})
