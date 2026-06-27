// ── Period Schedule (HCEA default, 7 teaching periods + tiffin) ──
export const PERIODS = [
  { id: "P1", label: "Period 1", time: "9:30 – 10:10", type: "teaching" },
  { id: "P2", label: "Period 2", time: "10:10 – 10:50", type: "teaching" },
  { id: "P3", label: "Period 3", time: "10:50 – 11:30", type: "teaching" },
  { id: "P4", label: "Period 4", time: "11:30 – 12:10", type: "teaching" },
  { id: "TIFFIN", label: "Tiffin Break", time: "12:10 – 12:30", type: "break" },
  { id: "P5", label: "Period 5", time: "12:30 – 1:10", type: "teaching" },
  { id: "P6", label: "Period 6", time: "1:10 – 1:50", type: "teaching" },
  { id: "P7", label: "Period 7", time: "1:50 – 2:30", type: "teaching" },
] as const

export const TEACHING_PERIODS = PERIODS.filter(p => p.type === "teaching")
export const PERIOD_IDS = TEACHING_PERIODS.map(p => p.id)
export const PERIOD_LABELS: Record<string, string> = Object.fromEntries(
  PERIODS.map(p => [p.id, p.label])
)

// ── Plans ──
export const PLANS = {
  starter:    { name: "Starter",    price: 999,  duration: "monthly",    savingsPct: 0  },
  quarterly:  { name: "Quarterly",  price: 2699, duration: "quarterly",  savingsPct: 10 },
  halfYearly: { name: "Half-Yearly",price: 4999, duration: "half-yearly",savingsPct: 17 },
  annual:     { name: "Annual",     price: 8999, duration: "annual",     savingsPct: 25 },
} as const

// ── Roles ──
export const ROLES = ["super_admin", "admin", "management", "teacher", "parent", "driver"] as const
export type Role = typeof ROLES[number]

export const ROLE_DEFAULT_ROUTES: Record<Role, string> = {
  super_admin: "/super-admin/overview",
  admin:       "/admin/dashboard",
  management:  "/management/dashboard",
  teacher:     "/teacher/dashboard",
  parent:      "/parent/dashboard",
  driver:      "/driver/dashboard",
}
