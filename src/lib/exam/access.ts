import type { Role } from "@/lib/constants"

/**
 * Actions that can be performed against the exam routine.
 * - `manage-config`: create/edit/delete Subject_Catalog, Sessions, Exam_Dates (admin only)
 * - `build`: build/edit a routine (admin + management)
 * - `publish`: publish a routine (admin + management)
 * - `view`: read the exam schedule (admin, management, teacher, parent, student)
 */
export type ExamAction = "manage-config" | "build" | "publish" | "view"

/**
 * The set of actions each role is permitted to perform.
 *
 * - admin → all actions (R10.1)
 * - management → build / publish / view, but NOT manage-config (R10.2, R10.3)
 * - teacher / parent / student → view only (R10.4)
 * - any other role, null, undefined, or an undeterminable role → nothing (R10.7)
 *
 * `student` is not part of the application's {@link Role} union today, but it is
 * listed here for forward-compatibility and to mirror the requirement language.
 */
const ROLE_ACTIONS: Record<string, ReadonlySet<ExamAction>> = {
  admin: new Set<ExamAction>(["manage-config", "build", "publish", "view"]),
  management: new Set<ExamAction>(["build", "publish", "view"]),
  teacher: new Set<ExamAction>(["view"]),
  parent: new Set<ExamAction>(["view"]),
  student: new Set<ExamAction>(["view"]),
}

/**
 * Pure authorization check for an exam-routine action.
 *
 * Returns `true` only when the given role is explicitly permitted to perform the
 * action. A null, undefined, or unrecognized role is denied every action
 * (R10.7).
 *
 * Uses `Object.prototype.hasOwnProperty` to guard against prototype-polluted
 * keys (e.g. "__proto__", "constructor") that would otherwise resolve to
 * inherited object properties rather than a real `Set<ExamAction>`.
 */
export function authorize(role: Role | null | undefined, action: ExamAction): boolean {
  if (role == null) return false
  if (!Object.prototype.hasOwnProperty.call(ROLE_ACTIONS, role)) return false
  const allowed = ROLE_ACTIONS[role]
  if (!(allowed instanceof Set)) return false
  return allowed.has(action)
}
