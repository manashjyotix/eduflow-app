export interface ProxyAssignment {
  id: string
  absenceId: string
  absentTeacherId: string
  absentTeacherName: string
  proxyTeacherId: string
  proxyTeacherName: string
  periodId: string
  class: string
  subject: string
  status: "assigned" | "accepted" | "declined" | "pending"
  date: string
}

export const MOCK_PROXIES: ProxyAssignment[] = [
  { id: "px1", absenceId: "a1", absentTeacherId: "t3", absentTeacherName: "Anita Devi",   proxyTeacherId: "t1", proxyTeacherName: "Priya Sharma",    periodId: "P1", class: "VIII-A", subject: "Science",  status: "accepted",  date: "2026-06-14" },
  { id: "px2", absenceId: "a1", absentTeacherId: "t3", absentTeacherName: "Anita Devi",   proxyTeacherId: "t7", proxyTeacherName: "Sunita Borah",    periodId: "P3", class: "VII-B",  subject: "Biology",  status: "accepted",  date: "2026-06-14" },
  { id: "px3", absenceId: "a1", absentTeacherId: "t3", absentTeacherName: "Anita Devi",   proxyTeacherId: "t4", proxyTeacherName: "Biju Das",        periodId: "P5", class: "VI-A",   subject: "Science",  status: "pending",   date: "2026-06-14" },
  { id: "px4", absenceId: "a2", absentTeacherId: "t6", absentTeacherName: "Dipak Baruah", proxyTeacherId: "t2", proxyTeacherName: "Rajesh Kalita",   periodId: "P1", class: "V-B",    subject: "English",  status: "accepted",  date: "2026-06-14" },
  { id: "px5", absenceId: "a2", absentTeacherId: "t6", absentTeacherName: "Dipak Baruah", proxyTeacherId: "t5", proxyTeacherName: "Meena Gogoi",     periodId: "P2", class: "V-A",    subject: "History",  status: "declined",  date: "2026-06-14" },
  { id: "px6", absenceId: "a2", absentTeacherId: "t6", absentTeacherName: "Dipak Baruah", proxyTeacherId: "t1", proxyTeacherName: "Priya Sharma",    periodId: "P3", class: "IV-C",   subject: "English",  status: "assigned",  date: "2026-06-14" },
]
