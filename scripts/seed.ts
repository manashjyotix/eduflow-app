/**
 * EduFlow — Database Seed Script
 *
 * Creates demo data for local development:
 *   - 1 school (HCEA)
 *   - 5 demo users with bcrypt-hashed passwords
 *   - 10 teachers matching src/data/teachers.ts
 *   - 3 sample absences
 *   - 5 proxy assignments
 *
 * Run with: npm run seed
 * Idempotent — safe to run multiple times (uses upsert).
 */

import mongoose, { Types } from "mongoose"
import bcrypt from "bcryptjs"

// ---------------------------------------------------------------------------
// Resolve path alias @/ → src/ by importing models via relative paths
// ---------------------------------------------------------------------------
import { School }  from "../src/models/School"
import { User }    from "../src/models/User"
import { Teacher } from "../src/models/Teacher"
import { Absence } from "../src/models/Absence"
import { Proxy }   from "../src/models/Proxy"

// ---------------------------------------------------------------------------
// Source data (mirrors src/data/teachers.ts exactly)
// ---------------------------------------------------------------------------
const TEACHERS_DATA = [
  { id: "t1",  name: "Priya Sharma",      email: "priya@hcea.edu",   subjects: ["Mathematics", "Science"],   section: "High",    status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t2",  name: "Rajesh Kalita",     email: "rajesh@hcea.edu",  subjects: ["English", "Social Studies"],section: "High",    status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t3",  name: "Anita Devi",        email: "anita@hcea.edu",   subjects: ["Science", "Biology"],       section: "Middle",  status: "on_leave", dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t4",  name: "Biju Das",          email: "biju@hcea.edu",    subjects: ["Mathematics"],              section: "Middle",  status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t5",  name: "Meena Gogoi",       email: "meena@hcea.edu",   subjects: ["Assamese", "Hindi"],        section: "Primary", status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t6",  name: "Dipak Baruah",      email: "dipak@hcea.edu",   subjects: ["English", "History"],       section: "Primary", status: "on_leave", dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t7",  name: "Sunita Borah",      email: "sunita@hcea.edu",  subjects: ["Mathematics", "Physics"],   section: "High",    status: "active",   dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t8",  name: "Kamal Nath",        email: "kamal@hcea.edu",   subjects: ["Geography", "EVS"],         section: "Middle",  status: "inactive", dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t9",  name: "Rima Das",          email: "rima@hcea.edu",    subjects: ["Hindi", "Sanskrit"],        section: "Middle",  status: "on_leave", dailyProxyCap: 2, weeklyProxyCap: 6, monthlyProxyCap: 20 },
  { id: "t10", name: "Himanta Bezbaruah", email: "himanta@hcea.edu", subjects: ["Physical Education"],       section: "High",    status: "active",   dailyProxyCap: 3, weeklyProxyCap: 8, monthlyProxyCap: 25 },
] as const

// ---------------------------------------------------------------------------
// Connect
// ---------------------------------------------------------------------------
async function connect() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error("❌  MONGODB_URI is not set. Add it to .env.local before running seed.")
    process.exit(1)
  }
  await mongoose.connect(uri, { bufferCommands: false })
  console.log("✅  Connected to MongoDB")
}

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedSchool() {
  const doc = await School.findOneAndUpdate(
    { email: "admin@hcea.edu" },
    {
      $setOnInsert: {
        name:          "Holy Child English Academy",
        address:       "Howly, Barpeta",
        city:          "Howly",
        state:         "Assam",
        pincode:       "781316",
        email:         "admin@hcea.edu",
        phone:         "+91-98765-43210",
        principalName: "Dr. Kamala Devi",
        board:         "SEBA",
        plan:          "annual",
        trialEndsAt:   new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        subscriptionStatus: "active",
        settings: {
          attendanceMode: "per-period",
          dailyProxyCap:  5,
          weeklyProxyCap: 15,
          monthlyProxyCap: 40,
        },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
  console.log(`🏫  School:  ${doc.name} (${doc._id})`)
  return doc
}

async function seedUsers(schoolId: Types.ObjectId) {
  const SALT_ROUNDS = 10

  const users = [
    {
      email:    "superadmin@proxymanager.app",
      name:     "Super Admin",
      role:     "super_admin" as const,
      schoolId: null,
      password: "super123",
    },
    {
      email:    "admin@hcea.edu",
      name:     "Admin Principal",
      role:     "admin" as const,
      schoolId,
      password: "admin123",
    },
    {
      email:    "mgmt@hcea.edu",
      name:     "Management Officer",
      role:     "management" as const,
      schoolId,
      password: "mgmt123",
    },
    {
      email:    "priya@hcea.edu",
      name:     "Priya Sharma",
      role:     "teacher" as const,
      schoolId,
      password: "teacher123",
    },
    {
      email:    "parent@hcea.edu",
      name:     "Parent User",
      role:     "parent" as const,
      schoolId,
      password: "parent123",
    },
  ]

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS)
    await User.updateOne(
      { email: u.email },
      {
        $set: {
          name:         u.name,
          role:         u.role,
          schoolId:     u.schoolId,
          passwordHash,
          isActive:     true,
        },
      },
      { upsert: true }
    )
    console.log(`👤  User:    ${u.role.padEnd(11)} ${u.email}`)
  }
}

async function seedTeachers(schoolId: Types.ObjectId) {
  // Map of mock id → MongoDB ObjectId (so absences/proxies can reference them)
  const idMap = new Map<string, Types.ObjectId>()

  for (const t of TEACHERS_DATA) {
    const doc = await Teacher.findOneAndUpdate(
      { schoolId, email: t.email },
      {
        $set: {
          name:            t.name,
          subjects:        t.subjects,
          section:         t.section,
          status:          t.status,
          dailyProxyCap:   t.dailyProxyCap,
          weeklyProxyCap:  t.weeklyProxyCap,
          monthlyProxyCap: t.monthlyProxyCap,
        },
        $setOnInsert: {
          schoolId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    idMap.set(t.id, doc!._id as Types.ObjectId)
    console.log(`🍎  Teacher: ${t.name.padEnd(20)} (${doc!._id})`)
  }

  return idMap
}

async function seedAbsences(
  schoolId: Types.ObjectId,
  teacherIdMap: Map<string, Types.ObjectId>
) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const absences = [
    {
      mockId:      "a1",
      teacherMock: "t3",
      teacherName: "Anita Devi",
      periods:     ["P1","P2","P3","P4","P5","P6","P7"],
      reason:      "Sick — fever and cold",
      reasonCategory: "sick_leave" as const,
      status:      "approved" as const,
    },
    {
      mockId:      "a2",
      teacherMock: "t6",
      teacherName: "Dipak Baruah",
      periods:     ["P1","P2","P3"],
      reason:      "Doctor visit",
      reasonCategory: "casual_leave" as const,
      status:      "approved" as const,
    },
    {
      mockId:      "a3",
      teacherMock: "t9",
      teacherName: "Rima Das",
      periods:     ["P1","P2","P3","P4","P5","P6","P7"],
      reason:      "Family emergency",
      reasonCategory: "emergency" as const,
      status:      "pending" as const,
    },
  ]

  const absenceIdMap = new Map<string, Types.ObjectId>()

  for (const a of absences) {
    const teacherId = teacherIdMap.get(a.teacherMock)!
    const doc = await Absence.findOneAndUpdate(
      { schoolId, teacherId, date: today },
      {
        $set: {
          teacherName:    a.teacherName,
          periods:        a.periods,
          reason:         a.reason,
          reasonCategory: a.reasonCategory,
          status:         a.status,
        },
        $setOnInsert: {
          schoolId,
          teacherId,
          date: today,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    absenceIdMap.set(a.mockId, doc!._id as Types.ObjectId)
    console.log(`📋  Absence: ${a.teacherName.padEnd(20)} (${doc!._id})`)
  }

  return absenceIdMap
}

async function seedProxies(
  schoolId: Types.ObjectId,
  teacherIdMap: Map<string, Types.ObjectId>,
  absenceIdMap: Map<string, Types.ObjectId>
) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 5 proxy assignments matching the mock data (MOCK_PROXIES px1–px5)
  const proxies = [
    { absenceMock: "a1", absentMock: "t3", proxyMock: "t1", proxyName: "Priya Sharma",  period: "P1", classId: "VIII-A", subject: "Science",  status: "accepted"  as const },
    { absenceMock: "a1", absentMock: "t3", proxyMock: "t7", proxyName: "Sunita Borah",  period: "P3", classId: "VII-B",  subject: "Biology",  status: "accepted"  as const },
    { absenceMock: "a1", absentMock: "t3", proxyMock: "t4", proxyName: "Biju Das",      period: "P5", classId: "VI-A",   subject: "Science",  status: "assigned"  as const },
    { absenceMock: "a2", absentMock: "t6", proxyMock: "t2", proxyName: "Rajesh Kalita", period: "P1", classId: "V-B",    subject: "English",  status: "accepted"  as const },
    { absenceMock: "a2", absentMock: "t6", proxyMock: "t5", proxyName: "Meena Gogoi",   period: "P2", classId: "V-A",    subject: "History",  status: "declined"  as const },
  ]

  for (const p of proxies) {
    const absenceId       = absenceIdMap.get(p.absenceMock)!
    const absentTeacherId = teacherIdMap.get(p.absentMock)!
    const proxyTeacherId  = teacherIdMap.get(p.proxyMock)!

    const doc = await Proxy.findOneAndUpdate(
      { schoolId, absenceId, proxyTeacherId, period: p.period },
      {
        $set: {
          proxyTeacherName: p.proxyName,
          classId:          p.classId,
          subject:          p.subject,
          status:           p.status,
        },
        $setOnInsert: {
          schoolId,
          absenceId,
          absentTeacherId,
          proxyTeacherId,
          period: p.period,
          date:   today,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    )
    console.log(`🔄  Proxy:   ${p.proxyName.padEnd(20)} → ${p.period} ${p.classId} (${doc!._id})`)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("\n🌱  EduFlow seed starting…\n")
  await connect()

  const school     = await seedSchool()
  const schoolId   = school._id as Types.ObjectId

  await seedUsers(schoolId)

  const teacherIdMap = await seedTeachers(schoolId)
  const absenceIdMap = await seedAbsences(schoolId, teacherIdMap)
  await seedProxies(schoolId, teacherIdMap, absenceIdMap)

  console.log("\n✅  Seed complete.\n")
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error("❌  Seed failed:", err)
  process.exit(1)
})
