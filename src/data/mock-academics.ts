export interface ExamEntry {
  id: string
  subject: string
  class: string
  date: string
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string
  maxMarks: number
  teacher: string
}

export const EXAM_SCHEDULE: ExamEntry[] = [
  { id: "ex1", subject: "English",      class: "VIII-A", date: "2026-07-14", dayOfWeek: "Monday",    startTime: "9:30",  endTime: "11:30", room: "Room 201", maxMarks: 80, teacher: "Priya Sharma" },
  { id: "ex2", subject: "Mathematics",  class: "VIII-A", date: "2026-07-15", dayOfWeek: "Tuesday",   startTime: "9:30",  endTime: "12:30", room: "Room 202", maxMarks: 80, teacher: "Anita Devi" },
  { id: "ex3", subject: "Science",      class: "VIII-A", date: "2026-07-16", dayOfWeek: "Wednesday", startTime: "9:30",  endTime: "12:00", room: "Room 203", maxMarks: 80, teacher: "Dipak Baruah" },
  { id: "ex4", subject: "Social Studies",class: "VIII-A",date: "2026-07-17", dayOfWeek: "Thursday",  startTime: "9:30",  endTime: "11:30", room: "Room 204", maxMarks: 80, teacher: "Rajesh Kalita" },
  { id: "ex5", subject: "Hindi",        class: "VIII-A", date: "2026-07-18", dayOfWeek: "Friday",    startTime: "9:30",  endTime: "11:00", room: "Room 205", maxMarks: 80, teacher: "Meena Gogoi" },
  { id: "ex6", subject: "Sanskrit",     class: "VIII-A", date: "2026-07-21", dayOfWeek: "Monday",    startTime: "9:30",  endTime: "11:00", room: "Room 201", maxMarks: 50, teacher: "Sunita Borah" },
  { id: "ex7", subject: "Computer Science",class:"VIII-A",date:"2026-07-22", dayOfWeek: "Tuesday",   startTime: "9:30",  endTime: "11:00", room: "Computer Lab", maxMarks: 50, teacher: "Biju Das" },
]

export interface SubjectGrade {
  subject: string
  marks: number
  maxMarks: number
  grade: string
  remarks: string
}

export const REPORT_CARD_DATA = {
  student: { name: "Rohit Das", rollNo: 12, class: "VIII-A", year: "2025–2026", term: "Term 1" },
  attendance: { present: 82, total: 97, percentage: 84.5 },
  grades: [
    { subject: "English",      marks: 68, maxMarks: 80, grade: "B+", remarks: "Good performance" },
    { subject: "Mathematics",  marks: 74, maxMarks: 80, grade: "A",  remarks: "Excellent" },
    { subject: "Science",      marks: 70, maxMarks: 80, grade: "A-", remarks: "Very Good" },
    { subject: "Social Studies",marks: 62, maxMarks: 80, grade: "B",  remarks: "Satisfactory" },
    { subject: "Hindi",        marks: 55, maxMarks: 80, grade: "B-", remarks: "Needs improvement" },
    { subject: "Sanskrit",     marks: 38, maxMarks: 50, grade: "B+", remarks: "Good" },
    { subject: "Computer Science",marks: 44,maxMarks: 50, grade: "A",  remarks: "Excellent" },
  ] as SubjectGrade[],
  total: { marks: 411, maxMarks: 500, percentage: 82.2, rank: 5, totalStudents: 38 },
  conduct: "Excellent",
  teacherRemark: "Rohit has shown consistent improvement throughout the term. Keep it up!",
  principalRemark: "Good academic performance. Continue to excel.",
}

export const ANNOUNCEMENTS_DATA = [
  { id: "ann1", title: "Mid-Term Examination Schedule Published", body: "The Mid-Term examination schedule for all classes from VI to X has been published. Exams will be held from July 14 to July 22, 2026. Students are advised to start preparation immediately.", author: "Admin", target: "all", expiresAt: "2026-07-22", createdAt: "2026-06-13T10:00:00Z", pinned: true },
  { id: "ann2", title: "Annual Sports Day – June 28", body: "The Annual Sports Day will be held on June 28, 2026 at the school ground. All students must wear sports attire. Events will begin at 9:00 AM sharp.", author: "Admin", target: "all", expiresAt: "2026-06-28", createdAt: "2026-06-10T09:00:00Z", pinned: true },
  { id: "ann3", title: "Parent-Teacher Meeting", body: "Parent-Teacher Meetings for Classes VI to X are scheduled for June 28, 2026 from 2:00 PM to 5:00 PM. All parents are requested to attend.", author: "Management", target: "parent", expiresAt: "2026-06-28", createdAt: "2026-06-08T11:00:00Z", pinned: false },
  { id: "ann4", title: "Library Books Return Deadline", body: "All library books must be returned by June 20, 2026. Students with pending returns will be fined ₹5 per day.", author: "Admin", target: "student", expiresAt: "2026-06-20", createdAt: "2026-06-05T10:00:00Z", pinned: false },
  { id: "ann5", title: "New Uniform Policy", body: "From the new academic year (2026–27), the school uniform will be updated. Details will be shared with parents before July 2026.", author: "Principal", target: "all", expiresAt: "2026-07-01", createdAt: "2026-06-01T09:00:00Z", pinned: false },
]
