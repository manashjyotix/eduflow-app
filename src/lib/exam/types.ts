/**
 * Shared result types for the Exam Routine Builder pure-logic layer.
 *
 * Every validation rule, conflict computation, duplication operation, and AI
 * generation step in `src/lib/exam/` is a pure, side-effect-free function that
 * returns either a successful value or a typed error. `OpResult<T>` is the
 * common envelope, and `ExamErrorCode` enumerates every rejection reason the
 * pure logic can produce.
 *
 * _Requirements: 1.2, 1.3, 1.4, 10.5_
 */

/** Every rejection reason the pure-logic layer can return. */
export type ExamErrorCode =
  | "required-name" | "name-too-long" | "duplicate-name"
  | "invalid-time-range" | "invalid-date" | "duplicate-date" | "maximum-dates-reached"
  | "already-linked" | "class-not-linked"
  | "invalid-subject-for-class" | "duplicate-invigilator"
  | "no-subject-scheduled" | "already-assigned"
  | "subject-already-scheduled"
  | "empty-target-set" | "duplication-failed"
  | "missing-dates" | "missing-sessions"
  | "unauthorized"

/** Result envelope for every fallible pure-logic operation. */
export type OpResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: ExamErrorCode; message: string }
