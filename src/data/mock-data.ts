export interface Notice {
  id: string
  title: string
  body: string
  author: string
  targetRoles: ("admin" | "management" | "teacher" | "parent" | "all")[]
  priority: "high" | "medium" | "low"
  expiresAt: string
  createdAt: string
  pinned?: boolean
}

export const MOCK_NOTICES: Notice[] = [
  {
    id: "n1", title: "Mid-Term Examinations — Schedule Released",
    body: "Mid-term examinations will be held from June 20–27, 2026. Timetable attached. All teachers to submit question papers by June 17.",
    author: "Admin", targetRoles: ["all"], priority: "high", expiresAt: "2026-06-27", createdAt: "2026-06-10", pinned: true
  },
  {
    id: "n2", title: "Parent-Teacher Meeting — June 28",
    body: "Annual parent-teacher meeting scheduled for Saturday, June 28. Slots available from 10:00 AM to 4:00 PM. Please book via portal.",
    author: "Management", targetRoles: ["teacher", "parent"], priority: "medium", expiresAt: "2026-06-28", createdAt: "2026-06-12"
  },
  {
    id: "n3", title: "Staff Meeting — June 15, 4:00 PM",
    body: "Mandatory staff meeting in the conference room. Agenda: Q1 academic review, proxy policy update, new attendance system walkthrough.",
    author: "Admin", targetRoles: ["teacher", "management"], priority: "high", expiresAt: "2026-06-15", createdAt: "2026-06-13"
  },
  {
    id: "n4", title: "Fee Payment Deadline — June 30",
    body: "Last date for Q2 fee payment is June 30, 2026. Parents are requested to clear dues before the deadline to avoid a 2% late fee.",
    author: "Admin", targetRoles: ["parent"], priority: "medium", expiresAt: "2026-06-30", createdAt: "2026-06-09"
  },
  {
    id: "n5", title: "Sports Day Preparations",
    body: "Annual Sports Day on July 5. PE teacher Himanta Sir to coordinate with class teachers. Practice sessions start June 16.",
    author: "Management", targetRoles: ["teacher"], priority: "low", expiresAt: "2026-07-05", createdAt: "2026-06-11"
  },
]


export const ATTENDANCE_MONTHLY = [
  { month: "Jan", percent: 91 }, { month: "Feb", percent: 88 }, { month: "Mar", percent: 94 },
  { month: "Apr", percent: 87 }, { month: "May", percent: 92 }, { month: "Jun", percent: 78 },
]

export const PROXY_MONTHLY = [
  { month: "Jan", count: 12 }, { month: "Feb", count: 8  }, { month: "Mar", count: 15 },
  { month: "Apr", count: 10 }, { month: "May", count: 7  }, { month: "Jun", count: 18 },
]

export const FEE_COLLECTION_MONTHLY = [
  { month: "Jan", collected: 245000, due: 12000 },
  { month: "Feb", collected: 198000, due: 25000 },
  { month: "Mar", collected: 312000, due: 8000  },
  { month: "Apr", collected: 278000, due: 15000 },
  { month: "May", collected: 295000, due: 5000  },
  { month: "Jun", collected: 180000, due: 42000 },
]
