import { Teacher } from "@/data/teachers"
import { ProxyAssignment } from "@/data/proxy-assignments"

export interface ScoringInput {
  teacher: Teacher
  absentTeacher: Teacher
  currentAssignments: ProxyAssignment[]
  periodId: string
}

export type DotStatus = "available-same" | "available-diff" | "capped" | "unavailable"

/**
 * Returns a score 0–100.
 * 0 means ineligible (not active, or already at daily cap for this period).
 *
 * Scoring breakdown:
 *   Subject match:       if teacher.subjects contains absentTeacher.subjects[0]  → +40
 *   Cap headroom:        (dailyProxyCap - dailyAssignments) × 10, capped at +30  → up to +30
 *   Workload fairness:   +20 × (1 - monthlyProxyCount / monthlyProxyCap)         → up to +20
 *
 * Returns 0 immediately if:
 *   - teacher.status is not "active"
 *   - teacher has already reached their dailyProxyCap today
 *   - teacher is already assigned to this specific periodId
 */
export function scoreTeacher(input: ScoringInput): number {
  const { teacher, absentTeacher, currentAssignments, periodId } = input

  // Unavailability check: only active teachers can serve as proxy
  if (teacher.status !== "active") {
    return 0
  }

  // Count how many proxy assignments this teacher has today (by date of first assignment if date is available)
  // We compare against assignments for the same date as any existing assignment,
  // or fall back to all assignments in the list as "today's" context.
  const todayAssignments = currentAssignments.filter(
    (a) => a.proxyTeacherId === teacher.id
  )

  // Check if teacher is already assigned to the exact period being scored
  const alreadyAssignedThisPeriod = todayAssignments.some(
    (a) => a.periodId === periodId
  )
  if (alreadyAssignedThisPeriod) {
    return 0
  }

  const dailyAssignmentCount = todayAssignments.length

  // If teacher is already at or above their daily cap, they are ineligible
  if (dailyAssignmentCount >= teacher.dailyProxyCap) {
    return 0
  }

  let score = 0

  // 1. Subject match: +40 if teacher covers the absent teacher's primary subject
  const primarySubject = absentTeacher.subjects[0]
  if (primarySubject && teacher.subjects.includes(primarySubject)) {
    score += 40
  }

  // 2. Cap headroom: (dailyProxyCap - current daily assignments) × 10, max +30
  const headroom = teacher.dailyProxyCap - dailyAssignmentCount
  score += Math.min(headroom * 10, 30)

  // 3. Workload fairness: +20 × (1 - monthlyProxyCount / monthlyProxyCap)
  //    monthlyProxyCount is derived from currentAssignments for this teacher
  const monthlyProxyCount = currentAssignments.filter(
    (a) => a.proxyTeacherId === teacher.id
  ).length
  const maxMonthly = teacher.monthlyProxyCap

  if (maxMonthly > 0) {
    const fairnessRatio = Math.max(0, 1 - monthlyProxyCount / maxMonthly)
    score += 20 * fairnessRatio
  }

  // Clamp to [0, 100] to guard against edge cases
  return Math.min(100, Math.max(0, score))
}

/**
 * Maps a numeric score and cap status to a proxy board dot status.
 *
 * Mapping (deterministic, per design.md Property 14):
 *   score > 60  && !isCapped  → "available-same"
 *   30 ≤ score ≤ 60 && !isCapped → "available-diff"
 *   score > 0   &&  isCapped  → "capped"
 *   score === 0                → "unavailable"
 */
export function dotStatusFromScore(score: number, isCapped: boolean): DotStatus {
  if (score === 0) {
    return "unavailable"
  }
  if (isCapped) {
    return "capped"
  }
  if (score > 60) {
    return "available-same"
  }
  // 30 ≤ score ≤ 60 (and score > 0, not capped)
  return "available-diff"
}

/**
 * Calculates the proxy coverage percentage for a given set of periods.
 *
 * Formula (per design.md Property 15):
 *   Math.round((assigned / total) * 1000) / 10
 *
 * Result is always in [0.0, 100.0] for valid inputs (total > 0, 0 ≤ assigned ≤ total).
 *
 * @param assigned - number of periods with a proxy assigned
 * @param total    - total number of periods that need coverage (must be > 0)
 */
export function coveragePercent(assigned: number, total: number): number {
  if (total <= 0) return 0
  return Math.round((assigned / total) * 1000) / 10
}

// ─────────────────────────────────────────────────────────────────────────────
// Click-to-assign candidate ranking (richer scoring for the Proxy Board UI)
// ─────────────────────────────────────────────────────────────────────────────

export type MatchKind = "same-subject" | "diff-subject" | "capped" | "unavailable"

export interface ProxyCandidate {
  teacher: Teacher
  score: number
  matchKind: MatchKind
  sharedSubjects: string[]
  dailyUsed: number
  dailyRemaining: number
  weeklyUsed: number
  monthlyUsed: number
  reasons: string[]
}

export interface RankInput {
  absentTeacher: Teacher
  periodId: string
  candidates: Teacher[]
  currentAssignments: ProxyAssignment[]
  /** Ids of teachers who are themselves absent today (cannot be proxies). */
  absentTeacherIds: Set<string>
}

/**
 * Ranks every candidate teacher for ONE specific period and returns them sorted
 * best-first. This powers the click-a-period → suggest-substitutes flow.
 *
 * Richer than scoreTeacher():
 *   • Subject overlap   → up to +50 (any shared subject, +8 bonus per extra match)
 *   • Section match     → +12 (knows the age group / syllabus level)
 *   • Daily cap headroom→ up to +20
 *   • Weekly fairness   → up to +10  (less loaded this week ranks higher)
 *   • Monthly fairness  → up to +8
 * Hard blocks (matchKind set, kept at end of list):
 *   • inactive / on_leave / themselves absent → "unavailable"
 *   • already covering this exact period       → "unavailable"
 *   • at daily cap                             → "capped"
 */
export function rankProxyCandidates(input: RankInput): ProxyCandidate[] {
  const { absentTeacher, periodId, candidates, currentAssignments, absentTeacherIds } = input

  const ranked = candidates.map<ProxyCandidate>((teacher) => {
    const reasons: string[] = []
    const mine = currentAssignments.filter((a) => a.proxyTeacherId === teacher.id)
    const dailyUsed = mine.length
    const weeklyUsed = dailyUsed // mock: single-day dataset
    const monthlyUsed = dailyUsed
    const dailyRemaining = Math.max(0, teacher.dailyProxyCap - dailyUsed)
    const sharedSubjects = teacher.subjects.filter((s) => absentTeacher.subjects.includes(s))

    const base: Omit<ProxyCandidate, "score" | "matchKind"> = {
      teacher, sharedSubjects, dailyUsed, dailyRemaining, weeklyUsed, monthlyUsed, reasons,
    }

    // ── Hard blocks ──
    if (teacher.status !== "active" || absentTeacherIds.has(teacher.id)) {
      reasons.push(absentTeacherIds.has(teacher.id) ? "Absent today" : "Not active")
      return { ...base, score: 0, matchKind: "unavailable" }
    }
    if (mine.some((a) => a.periodId === periodId)) {
      reasons.push("Already covering this period")
      return { ...base, score: 0, matchKind: "unavailable" }
    }
    if (dailyUsed >= teacher.dailyProxyCap) {
      reasons.push(`At daily cap (${teacher.dailyProxyCap})`)
      return { ...base, score: 5, matchKind: "capped" }
    }

    // ── Soft scoring ──
    let score = 0
    if (sharedSubjects.length > 0) {
      score += 50 + Math.min((sharedSubjects.length - 1) * 8, 16)
      reasons.push(`Teaches ${sharedSubjects.join(", ")}`)
    } else {
      reasons.push("Different subject")
    }
    if (teacher.section === absentTeacher.section) {
      score += 12
      reasons.push(`Same section (${teacher.section})`)
    }
    score += Math.min(dailyRemaining * 10, 20)
    if (dailyRemaining > 0) reasons.push(`${dailyRemaining} slot${dailyRemaining !== 1 ? "s" : ""} left today`)

    if (teacher.weeklyProxyCap > 0) {
      score += 10 * Math.max(0, 1 - weeklyUsed / teacher.weeklyProxyCap)
    }
    if (teacher.monthlyProxyCap > 0) {
      score += 8 * Math.max(0, 1 - monthlyUsed / teacher.monthlyProxyCap)
    }

    const matchKind: MatchKind = sharedSubjects.length > 0 ? "same-subject" : "diff-subject"
    return { ...base, score: Math.round(Math.min(100, score)), matchKind }
  })

  // Sort: available first (by score desc), then capped, then unavailable.
  const rank: Record<MatchKind, number> = { "same-subject": 0, "diff-subject": 0, capped: 1, unavailable: 2 }
  return ranked.sort((a, b) => {
    if (rank[a.matchKind] !== rank[b.matchKind]) return rank[a.matchKind] - rank[b.matchKind]
    return b.score - a.score
  })
}
