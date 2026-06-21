/**
 * EduFlow — API route helpers
 *
 * Provides typed response factories for the standardised error contract
 * defined in design.md:
 *
 *   Success:            { data: T, meta?: { total, page } }
 *   Validation (400):   { error: "VALIDATION_ERROR", issues: ZodIssue[] }
 *   Auth (401):         { error: "UNAUTHORIZED" }
 *   Forbidden (403):    { error: "FORBIDDEN", reason: string }
 *   Not found (404):    { error: "NOT_FOUND", resource: string }
 *   Server error (500): { error: "INTERNAL_ERROR" }
 */

import { NextResponse } from "next/server"
import type { ZodIssue } from "zod"

export function ok<T>(data: T, meta?: { total: number; page: number }) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) }, { status: 200 })
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 })
}

export function validationError(issues: ZodIssue[]) {
  return NextResponse.json({ error: "VALIDATION_ERROR", issues }, { status: 400 })
}

export function unauthorized() {
  return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 })
}

export function forbidden(reason: string) {
  return NextResponse.json({ error: "FORBIDDEN", reason }, { status: 403 })
}

export function notFound(resource: string) {
  return NextResponse.json({ error: "NOT_FOUND", resource }, { status: 404 })
}

export function internalError(err?: unknown) {
  if (err instanceof Error) {
    console.error("[api]", err.message, err.stack)
  }
  return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 })
}
