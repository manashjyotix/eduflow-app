export interface Student {
  id: string
  name: string
  rollNo: number
  class: string
  section: string
  parentName: string
  parentEmail: string
  parentPhone: string
  attendancePercent: number
  feeStatus: "paid" | "partial" | "due"
  status: "active" | "inactive"
}

export const STUDENTS: Student[] = [
  { id: "s1",  name: "Rohit Das",        rollNo: 12, class: "VIII", section: "A", parentName: "Anil Das",       parentEmail: "anil@gmail.com",    parentPhone: "9876543210", attendancePercent: 84.6, feeStatus: "paid",    status: "active" },
  { id: "s2",  name: "Priti Kalita",     rollNo: 7,  class: "VIII", section: "A", parentName: "Ramen Kalita",   parentEmail: "ramen@gmail.com",   parentPhone: "9876543211", attendancePercent: 91.2, feeStatus: "paid",    status: "active" },
  { id: "s3",  name: "Aman Bora",        rollNo: 3,  class: "VII",  section: "B", parentName: "Dipul Bora",     parentEmail: "dipul@gmail.com",   parentPhone: "9876543212", attendancePercent: 76.8, feeStatus: "partial", status: "active" },
  { id: "s4",  name: "Nisha Gogoi",      rollNo: 15, class: "IX",   section: "A", parentName: "Hemanta Gogoi",  parentEmail: "hemanta@gmail.com", parentPhone: "9876543213", attendancePercent: 95.0, feeStatus: "paid",    status: "active" },
  { id: "s5",  name: "Bikash Saikia",    rollNo: 21, class: "VI",   section: "B", parentName: "Raju Saikia",    parentEmail: "raju@gmail.com",    parentPhone: "9876543214", attendancePercent: 68.4, feeStatus: "due",     status: "active" },
  { id: "s6",  name: "Trishna Borah",    rollNo: 9,  class: "X",    section: "A", parentName: "Nirmal Borah",   parentEmail: "nirmal@gmail.com",  parentPhone: "9876543215", attendancePercent: 88.9, feeStatus: "paid",    status: "active" },
  { id: "s7",  name: "Manash Deka",      rollNo: 18, class: "VIII", section: "B", parentName: "Jayanta Deka",   parentEmail: "jayanta@gmail.com", parentPhone: "9876543216", attendancePercent: 72.3, feeStatus: "partial", status: "active" },
  { id: "s8",  name: "Puja Mahanta",     rollNo: 4,  class: "VII",  section: "A", parentName: "Prasanta Mahanta",parentEmail:"pm@gmail.com",      parentPhone: "9876543217", attendancePercent: 93.1, feeStatus: "paid",    status: "active" },
  { id: "s9",  name: "Suraj Nath",       rollNo: 29, class: "VI",   section: "A", parentName: "Bijoy Nath",     parentEmail: "bijoy@gmail.com",   parentPhone: "9876543218", attendancePercent: 55.7, feeStatus: "due",     status: "active" },
  { id: "s10", name: "Deepika Baruah",   rollNo: 11, class: "IX",   section: "B", parentName: "Sarat Baruah",   parentEmail: "sarat@gmail.com",   parentPhone: "9876543219", attendancePercent: 89.4, feeStatus: "paid",    status: "active" },
  { id: "s11", name: "Rahul Choudhury",  rollNo: 6,  class: "X",    section: "B", parentName: "Kamal Choudhury",parentEmail:"kc@gmail.com",       parentPhone: "9876543220", attendancePercent: 81.2, feeStatus: "partial", status: "active" },
  { id: "s12", name: "Ankita Sarma",     rollNo: 2,  class: "VIII", section: "A", parentName: "Dilip Sarma",    parentEmail: "dilip@gmail.com",   parentPhone: "9876543221", attendancePercent: 97.3, feeStatus: "paid",    status: "active" },
]

export const CLASSES = ["VI-A", "VI-B", "VII-A", "VII-B", "VIII-A", "VIII-B", "IX-A", "IX-B", "X-A", "X-B"]
