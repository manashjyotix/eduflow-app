export interface Teacher {
  id: string
  name: string
  email: string
  subjects: string[]
  section: "Primary" | "Middle" | "High"
  status: "active" | "inactive" | "on_leave"
  dailyProxyCap: number
  weeklyProxyCap: number
  monthlyProxyCap: number
  phone?: string
  qualifications?: string
  /** ISO yyyy-mm-dd — used by the Birthday Wish feature. */
  dob?: string
}

export const TEACHERS: Teacher[] = [
  { id: "t1",  name: "Priya Sharma",      email: "priya@hcea.edu",    subjects: ["Mathematics", "Science"],  section: "High",    status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20, dob: "1990-06-24" },
  { id: "t2",  name: "Rajesh Kalita",     email: "rajesh@hcea.edu",   subjects: ["English", "Social Studies"],section:"High",    status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20, dob: "1988-02-11" },
  { id: "t3",  name: "Anita Devi",        email: "anita@hcea.edu",    subjects: ["Science", "Biology"],      section: "Middle",  status: "on_leave", dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20, dob: "1992-09-03" },
  { id: "t4",  name: "Biju Das",          email: "biju@hcea.edu",     subjects: ["Mathematics"],             section: "Middle",  status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20, dob: "1985-11-19" },
  { id: "t5",  name: "Meena Gogoi",       email: "meena@hcea.edu",    subjects: ["Assamese", "Hindi"],       section: "Primary", status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20, dob: "1991-04-07" },
  { id: "t6",  name: "Dipak Baruah",      email: "dipak@hcea.edu",    subjects: ["English", "History"],      section: "Primary", status: "on_leave", dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20, dob: "1987-12-30" },
  { id: "t7",  name: "Sunita Borah",      email: "sunita@hcea.edu",   subjects: ["Mathematics", "Physics"],  section: "High",    status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20, dob: "1993-07-22" },
  { id: "t8",  name: "Kamal Nath",        email: "kamal@hcea.edu",    subjects: ["Geography", "EVS"],        section: "Middle",  status: "inactive", dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20, dob: "1984-03-15" },
  { id: "t9",  name: "Rima Das",          email: "rima@hcea.edu",     subjects: ["Hindi", "Sanskrit"],       section: "Middle",  status: "on_leave", dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20, dob: "1990-10-05" },
  { id: "t10", name: "Himanta Bezbaruah", email: "himanta@hcea.edu",  subjects: ["Physical Education"],      section: "High",    status: "active",   dailyProxyCap: 3, weeklyProxyCap: 8, monthlyProxyCap: 25, dob: "1989-08-14" },
]

export const TEACHER_NAMES = TEACHERS.map(t => t.name)
