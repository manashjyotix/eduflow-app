/**
 * subject-catalog.ts  (Feature: exam-routine-builder)
 *
 * Pure-logic layer for the admin-managed Subject_Catalog. Every function here
 * is side-effect-free: it takes the current catalog (plus inputs) and returns
 * either a new catalog array (immutably) or a typed {@link OpResult}. No React,
 * no I/O, fully deterministic — this is the property-test surface.
 *
 * Name rules (shared by add + rename):
 *   - Names are compared on their trimmed value.
 *   - A name is valid when its trimmed length is in [1, 100].
 *   - Uniqueness is case-insensitive on the trimmed value.
 *
 * _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 2.1, 2.2, 2.3_
 */

import type { CatalogSubject } from "@/data/mock-exams"
import type { OpResult } from "@/lib/exam/types"

/** Trimmed-length bounds for a subject name. */
const MIN_NAME_LENGTH = 1
const MAX_NAME_LENGTH = 100

/** Trim surrounding whitespace from a candidate name (R1.1, R1.9). */
export function normalizeName(raw: string): string {
  return raw.trim()
}

/** Case-insensitive equality on already-trimmed names. */
function namesMatch(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

/**
 * Validate a candidate subject name against the catalog.
 *
 * Succeeds (returning the trimmed name) iff the trimmed name has length 1–100
 * and does not case-insensitively match another subject's trimmed name.
 * `ignoreId` excludes a subject from the duplicate check (used by rename so a
 * subject does not collide with itself).
 *
 * _Requirements: 1.1, 1.2, 1.3, 1.4, 1.9_
 */
export function validateSubjectName(
  raw: string,
  existing: CatalogSubject[],
  ignoreId?: string,
): OpResult<string> {
  const name = normalizeName(raw)

  if (name.length < MIN_NAME_LENGTH) {
    return { ok: false, error: "required-name", message: "Subject name is required." }
  }
  if (name.length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      error: "name-too-long",
      message: `Subject name must be at most ${MAX_NAME_LENGTH} characters.`,
    }
  }

  const collides = existing.some(s => s.id !== ignoreId && namesMatch(s.name, name))
  if (collides) {
    return { ok: false, error: "duplicate-name", message: `A subject named "${name}" already exists.` }
  }

  return { ok: true, value: name }
}

/** Build a stable, unique id for a new subject derived from its name. */
function makeSubjectId(name: string, existing: CatalogSubject[]): string {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
  const base = `subj-${slug || "subject"}`
  if (!existing.some(s => s.id === base)) return base
  let n = 2
  while (existing.some(s => s.id === `${base}-${n}`)) n++
  return `${base}-${n}`
}

/**
 * Add a subject to the catalog. On success returns a new catalog containing a
 * Catalog_Subject with the trimmed name and an empty linked-classes list; on
 * failure returns the validation error and leaves the catalog unchanged.
 *
 * _Requirements: 1.1, 1.2, 1.3, 1.4_
 */
export function addSubject(catalog: CatalogSubject[], raw: string): OpResult<CatalogSubject[]> {
  const validation = validateSubjectName(raw, catalog)
  if (!validation.ok) return validation

  const name = validation.value
  const subject: CatalogSubject = {
    id: makeSubjectId(name, catalog),
    name,
    linkedClassIds: [],
  }
  return { ok: true, value: [...catalog, subject] }
}

/**
 * Rename a subject. On success returns a new catalog where the matching
 * subject's name is the trimmed input while its linked-classes list is
 * retained; on failure returns the validation error and leaves the catalog
 * unchanged.
 *
 * _Requirements: 1.2, 1.3, 1.4, 1.9_
 */
export function renameSubject(
  catalog: CatalogSubject[],
  id: string,
  raw: string,
): OpResult<CatalogSubject[]> {
  const validation = validateSubjectName(raw, catalog, id)
  if (!validation.ok) return validation

  const name = validation.value
  return {
    ok: true,
    value: catalog.map(s => (s.id === id ? { ...s, name } : s)),
  }
}

/**
 * Delete a subject. Returns a new catalog without the matching subject (and its
 * linked-classes list). A no-op when no subject matches.
 *
 * _Requirements: 1.10_
 */
export function deleteSubject(catalog: CatalogSubject[], id: string): CatalogSubject[] {
  return catalog.filter(s => s.id !== id)
}

/**
 * Link a class to a subject. Adds the class identifier to the subject's
 * linked-classes list; if the class is already linked, leaves the list
 * unchanged and returns `already-linked`.
 *
 * _Requirements: 1.5, 1.6_
 */
export function linkClass(
  catalog: CatalogSubject[],
  id: string,
  classId: string,
): OpResult<CatalogSubject[]> {
  const subject = catalog.find(s => s.id === id)
  if (subject && subject.linkedClassIds.includes(classId)) {
    return { ok: false, error: "already-linked", message: "Class is already linked to this subject." }
  }
  return {
    ok: true,
    value: catalog.map(s =>
      s.id === id ? { ...s, linkedClassIds: [...s.linkedClassIds, classId] } : s,
    ),
  }
}

/**
 * Unlink a class from a subject. Removes the class identifier from the
 * subject's linked-classes list; if the class is not linked, leaves the list
 * unchanged and returns `class-not-linked`.
 *
 * _Requirements: 1.7, 1.8_
 */
export function unlinkClass(
  catalog: CatalogSubject[],
  id: string,
  classId: string,
): OpResult<CatalogSubject[]> {
  const subject = catalog.find(s => s.id === id)
  if (subject && !subject.linkedClassIds.includes(classId)) {
    return { ok: false, error: "class-not-linked", message: "Class is not linked to this subject." }
  }
  return {
    ok: true,
    value: catalog.map(s =>
      s.id === id
        ? { ...s, linkedClassIds: s.linkedClassIds.filter(c => c !== classId) }
        : s,
    ),
  }
}

/**
 * The subject palette for a class: exactly the Catalog_Subjects whose
 * linked-classes list contains that class identifier (empty when none).
 *
 * _Requirements: 2.1, 2.3_
 */
export function paletteForClass(catalog: CatalogSubject[], classId: string): CatalogSubject[] {
  return catalog.filter(s => s.linkedClassIds.includes(classId))
}

/**
 * Whether a subject (by name, as stored on a slot) is linked to a class.
 * Name comparison is case-insensitive on the trimmed value, matching the
 * catalog's uniqueness rule.
 *
 * _Requirements: 2.2, 7.3_
 */
export function isSubjectLinkedToClass(
  catalog: CatalogSubject[],
  subject: string,
  classId: string,
): boolean {
  const name = normalizeName(subject)
  const match = catalog.find(s => namesMatch(s.name, name))
  return match ? match.linkedClassIds.includes(classId) : false
}
