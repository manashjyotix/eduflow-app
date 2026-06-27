export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-"

export interface Student {
  id: string
  name: string
  rollNo: number
  class: string
  section: string
  parentName: string
  parentEmail: string
  parentPhone: string
  /** Secondary emergency contact number (guardian / relative). */
  emergencyPhone?: string
  /** Blood group — surfaced for transport/emergency contexts. */
  bloodGroup?: BloodGroup
  attendancePercent: number
  feeStatus: "paid" | "partial" | "due"
  status: "active" | "inactive"
  /** ISO yyyy-mm-dd — used by the Birthday Wish feature and to derive age. */
  dob?: string
}

export const STUDENTS: Student[] = [
  { id: "s1",  name: "Rohit Das",        rollNo: 12, class: "VIII", section: "A", parentName: "Anil Das",       parentEmail: "anil@gmail.com",    parentPhone: "9876543210", emergencyPhone: "9954000110", bloodGroup: "O+",  attendancePercent: 84.6, feeStatus: "paid",    status: "active", dob: "2012-06-24" },
  { id: "s2",  name: "Priti Kalita",     rollNo: 7,  class: "VIII", section: "A", parentName: "Ramen Kalita",   parentEmail: "ramen@gmail.com",   parentPhone: "9876543211", emergencyPhone: "9954000111", bloodGroup: "B+",  attendancePercent: 91.2, feeStatus: "paid",    status: "active", dob: "2012-01-18" },
  { id: "s3",  name: "Aman Bora",        rollNo: 3,  class: "VII",  section: "B", parentName: "Dipul Bora",     parentEmail: "dipul@gmail.com",   parentPhone: "9876543212", emergencyPhone: "9954000112", bloodGroup: "A+",  attendancePercent: 76.8, feeStatus: "partial", status: "active", dob: "2013-05-09" },
  { id: "s4",  name: "Nisha Gogoi",      rollNo: 15, class: "IX",   section: "A", parentName: "Hemanta Gogoi",  parentEmail: "hemanta@gmail.com", parentPhone: "9876543213", emergencyPhone: "9954000113", bloodGroup: "AB+", attendancePercent: 95.0, feeStatus: "paid",    status: "active", dob: "2011-09-27" },
  { id: "s5",  name: "Bikash Saikia",    rollNo: 21, class: "VI",   section: "B", parentName: "Raju Saikia",    parentEmail: "raju@gmail.com",    parentPhone: "9876543214", emergencyPhone: "9954000114", bloodGroup: "O-",  attendancePercent: 68.4, feeStatus: "due",     status: "active", dob: "2014-03-02" },
  { id: "s6",  name: "Trishna Borah",    rollNo: 9,  class: "X",    section: "A", parentName: "Nirmal Borah",   parentEmail: "nirmal@gmail.com",  parentPhone: "9876543215", emergencyPhone: "9954000115", bloodGroup: "B-",  attendancePercent: 88.9, feeStatus: "paid",    status: "active", dob: "2010-11-11" },
  { id: "s7",  name: "Manash Deka",      rollNo: 18, class: "VIII", section: "B", parentName: "Jayanta Deka",   parentEmail: "jayanta@gmail.com", parentPhone: "9876543216", emergencyPhone: "9954000116", bloodGroup: "A-",  attendancePercent: 72.3, feeStatus: "partial", status: "active", dob: "2012-07-30" },
  { id: "s8",  name: "Puja Mahanta",     rollNo: 4,  class: "VII",  section: "A", parentName: "Prasanta Mahanta",parentEmail:"pm@gmail.com",      parentPhone: "9876543217", emergencyPhone: "9954000117", bloodGroup: "O+",  attendancePercent: 93.1, feeStatus: "paid",    status: "active", dob: "2013-02-14" },
  { id: "s9",  name: "Suraj Nath",       rollNo: 29, class: "VI",   section: "A", parentName: "Bijoy Nath",     parentEmail: "bijoy@gmail.com",   parentPhone: "9876543218", emergencyPhone: "9954000118", bloodGroup: "AB-", attendancePercent: 55.7, feeStatus: "due",     status: "active", dob: "2014-10-21" },
  { id: "s10", name: "Deepika Baruah",   rollNo: 11, class: "IX",   section: "B", parentName: "Sarat Baruah",   parentEmail: "sarat@gmail.com",   parentPhone: "9876543219", emergencyPhone: "9954000119", bloodGroup: "B+",  attendancePercent: 89.4, feeStatus: "paid",    status: "active", dob: "2011-04-25" },
  { id: "s11", name: "Rahul Choudhury",  rollNo: 6,  class: "X",    section: "B", parentName: "Kamal Choudhury",parentEmail:"kc@gmail.com",       parentPhone: "9876543220", emergencyPhone: "9954000120", bloodGroup: "A+",  attendancePercent: 81.2, feeStatus: "partial", status: "active", dob: "2010-08-06" },
  { id: "s12", name: "Ankita Sarma",     rollNo: 2,  class: "VIII", section: "A", parentName: "Dilip Sarma",    parentEmail: "dilip@gmail.com",   parentPhone: "9876543221", emergencyPhone: "9954000121", bloodGroup: "O+",  attendancePercent: 97.3, feeStatus: "paid",    status: "active", dob: "2012-12-01" },
]

export const CLASSES = ["VI-A", "VI-B", "VII-A", "VII-B", "VIII-A", "VIII-B", "IX-A", "IX-B", "X-A", "X-B"]

/** Derive an age in whole years from an ISO `dob`. Returns `undefined` when no dob. */
export function ageFromDob(dob?: string): number | undefined {
  if (!dob) return undefined
  const birth = new Date(dob)
  if (Number.isNaN(birth.getTime())) return undefined
  const now = new Date()
  let age = now.getFullYear() - birth.getFullYear()
  const m = now.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--
  return age
}

export function getStudent(id: string): Student | undefined {
  return STUDENTS.find(s => s.id === id)
}
