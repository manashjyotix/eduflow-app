export interface Expense {
  id: string
  category: "salary" | "maintenance" | "supplies" | "utilities" | "events" | "transport" | "other"
  description: string
  amount: number
  date: string
  paidTo: string
  approvedBy: string
  status: "paid" | "pending" | "cancelled"
  receiptNo: string
}

export const EXPENSE_CATEGORIES = [
  "salary", "maintenance", "supplies", "utilities", "events", "transport", "other"
] as const

export const MOCK_EXPENSES: Expense[] = [
  { id: "exp1", category: "salary", description: "Teaching staff salaries – June 2026", amount: 185000, date: "2026-06-01", paidTo: "Staff Accounts", approvedBy: "Principal Roy", status: "paid", receiptNo: "REC-2026-001" },
  { id: "exp2", category: "maintenance", description: "Annual maintenance contract – Lab equipment", amount: 28000, date: "2026-06-03", paidTo: "TechServ Solutions", approvedBy: "Admin", status: "paid", receiptNo: "REC-2026-002" },
  { id: "exp3", category: "supplies", description: "Stationery and teaching materials", amount: 12500, date: "2026-06-05", paidTo: "Office Depot Howly", approvedBy: "Admin", status: "paid", receiptNo: "REC-2026-003" },
  { id: "exp4", category: "utilities", description: "Electricity bill – May 2026", amount: 8200, date: "2026-06-07", paidTo: "APDCL", approvedBy: "Admin", status: "paid", receiptNo: "REC-2026-004" },
  { id: "exp5", category: "events", description: "Annual sports day arrangements", amount: 35000, date: "2026-06-10", paidTo: "Event Pro", approvedBy: "Principal Roy", status: "pending", receiptNo: "REC-2026-005" },
  { id: "exp6", category: "transport", description: "School bus fuel – May 2026", amount: 18500, date: "2026-06-02", paidTo: "IndianOil Station", approvedBy: "Admin", status: "paid", receiptNo: "REC-2026-006" },
  { id: "exp7", category: "supplies", description: "Chalk, dusters, whiteboard markers", amount: 3200, date: "2026-06-08", paidTo: "Local Supplier", approvedBy: "Admin", status: "paid", receiptNo: "REC-2026-007" },
  { id: "exp8", category: "maintenance", description: "Plumbing repair – Staff washroom", amount: 5500, date: "2026-06-11", paidTo: "Raju Plumbers", approvedBy: "Admin", status: "paid", receiptNo: "REC-2026-008" },
  { id: "exp9", category: "utilities", description: "Internet & broadband – June 2026", amount: 4200, date: "2026-06-06", paidTo: "Airtel Business", approvedBy: "Admin", status: "paid", receiptNo: "REC-2026-009" },
  { id: "exp10", category: "events", description: "Farewell party for Class X", amount: 15000, date: "2026-06-14", paidTo: "Hotel Paradise", approvedBy: "Principal Roy", status: "pending", receiptNo: "REC-2026-010" },
  { id: "exp11", category: "other", description: "Printing – Exam question papers", amount: 7800, date: "2026-06-09", paidTo: "Quick Print", approvedBy: "Admin", status: "paid", receiptNo: "REC-2026-011" },
  { id: "exp12", category: "salary", description: "Non-teaching staff salaries – June 2026", amount: 62000, date: "2026-06-01", paidTo: "Staff Accounts", approvedBy: "Admin", status: "paid", receiptNo: "REC-2026-012" },
]

export const MONTHLY_EXPENSE_TREND = [
  { month: "Jan", amount: 285000 },
  { month: "Feb", amount: 268000 },
  { month: "Mar", amount: 295000 },
  { month: "Apr", amount: 312000 },
  { month: "May", amount: 275000 },
  { month: "Jun", amount: 305000 },
]
