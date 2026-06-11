export type TeacherStatus = "active" | "inactive" | "on_leave"
export type AbsenceStatus = "draft" | "pending" | "approved" | "rejected"
export type ProxyStatus   = "assigned" | "accepted" | "declined" | "completed"
export type FeeStatus     = "paid" | "partial" | "overdue" | "pending"
export type SwapStatus    = "pending" | "agreed" | "management_pending" | "approved" | "rejected"

export const teacherStatusConfig: Record<TeacherStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  active:    { label: "Active",    variant: "default" },
  inactive:  { label: "Inactive",  variant: "secondary" },
  on_leave:  { label: "On Leave",  variant: "outline" },
}

export const absenceStatusConfig: Record<AbsenceStatus, { label: string; className: string }> = {
  draft:    { label: "Draft",    className: "bg-muted text-muted-foreground" },
  pending:  { label: "Pending",  className: "bg-warning text-warning-foreground" },
  approved: { label: "Approved", className: "bg-success text-success-foreground" },
  rejected: { label: "Rejected", className: "bg-destructive/10 text-destructive" },
}

export const proxyStatusConfig: Record<ProxyStatus, { label: string; className: string }> = {
  assigned:  { label: "Assigned",  className: "bg-muted text-muted-foreground" },
  accepted:  { label: "Accepted",  className: "bg-success text-success-foreground" },
  declined:  { label: "Declined",  className: "bg-destructive/10 text-destructive" },
  completed: { label: "Completed", className: "bg-primary/10 text-primary" },
}

// Proxy board dot colors — always pair with text label (WCAG 1.4.1)
export const proxyDotClass = {
  sameSubject:     "bg-success",           // 🟢 available, same subject
  diffSubject:     "bg-warning",           // 🟡 available, different subject
  capped:          "bg-muted-foreground",  // ⚫ at proxy cap
  unavailable:     "bg-destructive",       // 🔴 in class or declined
} as const
