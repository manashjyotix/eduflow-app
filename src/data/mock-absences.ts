export interface Absence {
  id: string
  teacherId: string
  teacherName: string
  date: string
  periods: string[]
  reason: string
  category: "sick_leave" | "casual_leave" | "earned_leave" | "emergency" | "official_duty"
  status: "pending" | "approved" | "rejected" | "draft"
  appliedAt: string
}

export const MOCK_ABSENCES: Absence[] = [
  {
    id: "a1",
    teacherId: "t3",
    teacherName: "Anita Devi",
    date: new Date().toISOString().split("T")[0],
    periods: ["P1","P2","P3","P4","P5","P6","P7"],
    reason: "Sick — fever and cold",
    category: "sick_leave",
    status: "approved",
    appliedAt: new Date().toISOString(),
  },
  {
    id: "a2",
    teacherId: "t6",
    teacherName: "Dipak Baruah",
    date: new Date().toISOString().split("T")[0],
    periods: ["P1","P2","P3"],
    reason: "Doctor visit",
    category: "casual_leave",
    status: "approved",
    appliedAt: new Date().toISOString(),
  },
  {
    id: "a3",
    teacherId: "t9",
    teacherName: "Rima Das",
    date: new Date().toISOString().split("T")[0],
    periods: ["P1","P2","P3","P4","P5","P6","P7"],
    reason: "Family emergency",
    category: "emergency",
    status: "pending",
    appliedAt: new Date().toISOString(),
  },
]
