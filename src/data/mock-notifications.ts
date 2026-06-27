export interface Notification {
  id: string
  title: string
  body: string
  type:
    | "proxy" | "absence" | "swap" | "fee" | "announcement" | "system" | "leave" | "birthday"
    // F1/F2/F8 operational types
    | "attendance" | "journal" | "exam_duty" | "transport" | "report_card"
  read: boolean
  createdAt: string
  actionHref?: string
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", title: "New Proxy Request", body: "You have been assigned as proxy for Anita Devi's Period 3 class (VIII-A Science).", type: "proxy", read: false, createdAt: "2026-06-15T09:15:00Z", actionHref: "/teacher/proxy-history" },
  { id: "n2", title: "Leave Approved", body: "Your leave request for June 20 has been approved by Admin.", type: "leave", read: false, createdAt: "2026-06-15T08:45:00Z", actionHref: "/teacher/leave/history" },
  { id: "n3", title: "Swap Request Received", body: "Sunita Borah has requested a period swap with you for June 17, Period 5.", type: "swap", read: false, createdAt: "2026-06-14T15:30:00Z", actionHref: "/admin/swap-requests" },
  { id: "n4", title: "Fee Payment Reminder", body: "Rohit Das has an outstanding balance of ₹7,500 for June 2026.", type: "fee", read: true, createdAt: "2026-06-14T11:00:00Z", actionHref: "/admin/fees/defaulters" },
  { id: "n5", title: "New Announcement", body: "Mid-Term examinations scheduled from July 14–18, 2026. Timetable attached.", type: "announcement", read: true, createdAt: "2026-06-13T10:00:00Z" },
  { id: "n6", title: "Absence Marked", body: "Dipak Baruah has been marked absent for Periods 1–3 today.", type: "absence", read: true, createdAt: "2026-06-15T09:00:00Z", actionHref: "/admin/absences" },
  { id: "n7", title: "System Update", body: "EduFlow will undergo maintenance on June 22 from 11 PM to 1 AM IST.", type: "system", read: true, createdAt: "2026-06-12T12:00:00Z" },
  { id: "n8", title: "Proxy Accepted", body: "Rajesh Kalita has accepted the proxy assignment for Period 1 today.", type: "proxy", read: false, createdAt: "2026-06-15T09:35:00Z" },
  { id: "n9", title: "Leave Request Pending", body: "Priya Sharma has submitted a leave request for June 20. Awaiting your approval.", type: "leave", read: false, createdAt: "2026-06-15T10:00:00Z", actionHref: "/admin/absences" },
  { id: "n10", title: "Fee Collected", body: "₹15,000 received from Arjun Nath for Class X annual fees.", type: "fee", read: true, createdAt: "2026-06-11T14:00:00Z" },
  { id: "n11", title: "🎂 Happy Birthday!", body: "Wishing you a wonderful birthday from everyone at EduFlow & Holy Child English Academy. Have a great day!", type: "birthday", read: false, createdAt: "2026-06-24T06:00:00Z" },
]

export const PARENT_NOTIFICATIONS: Notification[] = [
  { id: "pn1", title: "Attendance Alert", body: "Rohit Das was marked absent for Period 2 today (June 15).", type: "absence", read: false, createdAt: "2026-06-15T10:30:00Z" },
  { id: "pn2", title: "Exam Schedule Published", body: "Mid-Term exam schedule for Class VIII has been published. Check the Exam Schedule page.", type: "announcement", read: false, createdAt: "2026-06-14T09:00:00Z", actionHref: "/parent/exams" },
  { id: "pn3", title: "Fee Due Reminder", body: "Monthly fee of ₹3,500 for July 2026 is due on July 5. Please pay promptly.", type: "fee", read: true, createdAt: "2026-06-13T11:00:00Z", actionHref: "/parent/fees" },
  { id: "pn4", title: "Leave Approved", body: "Rohit Das's leave request for June 17 has been approved.", type: "leave", read: true, createdAt: "2026-06-12T14:30:00Z" },
  { id: "pn5", title: "School Announcement", body: "Parent-Teacher Meeting scheduled for June 28. Please attend at 10 AM.", type: "announcement", read: true, createdAt: "2026-06-10T10:00:00Z" },
  { id: "pn6", title: "🎂 Happy Birthday to Rohit!", body: "Wishing Rohit Das a very happy birthday from everyone at EduFlow & Holy Child English Academy. 🎉", type: "birthday", read: false, createdAt: "2026-06-24T06:00:00Z" },
]
