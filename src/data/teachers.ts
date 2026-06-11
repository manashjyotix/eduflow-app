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
}

export const TEACHERS: Teacher[] = [
  { id: "t1",  name: "Priya Sharma",      email: "priya@hcea.edu",    subjects: ["Mathematics", "Science"],  section: "High",    status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t2",  name: "Rajesh Kalita",     email: "rajesh@hcea.edu",   subjects: ["English", "Social Studies"],section:"High",    status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t3",  name: "Anita Devi",        email: "anita@hcea.edu",    subjects: ["Science", "Biology"],      section: "Middle",  status: "on_leave", dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t4",  name: "Biju Das",          email: "biju@hcea.edu",     subjects: ["Mathematics"],             section: "Middle",  status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t5",  name: "Meena Gogoi",       email: "meena@hcea.edu",    subjects: ["Assamese", "Hindi"],       section: "Primary", status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t6",  name: "Dipak Baruah",      email: "dipak@hcea.edu",    subjects: ["English", "History"],      section: "Primary", status: "on_leave", dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t7",  name: "Sunita Borah",      email: "sunita@hcea.edu",   subjects: ["Mathematics", "Physics"],  section: "High",    status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t8",  name: "Kamal Nath",        email: "kamal@hcea.edu",    subjects: ["Geography", "EVS"],        section: "Middle",  status: "inactive", dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t9",  name: "Rima Das",          email: "rima@hcea.edu",     subjects: ["Hindi", "Sanskrit"],       section: "Middle",  status: "on_leave", dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t10", name: "Himanta Bezbaruah", email: "himanta@hcea.edu",  subjects: ["Physical Education"],      section: "High",    status: "active",   dailyProxyCap: 3, weeklyProxyCap: 8, monthlyProxyCap: 25 },
]

export const TEACHER_NAMES = TEACHERS.map(t => t.name)
