"use client"
import { useState } from "react"
import { GraduationCap, UserPlus, AlertTriangle } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { SearchInput } from "@/components/shared/search-input"
import { EmptyState } from "@/components/shared/empty-state"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

const STUDENTS = [
  { id: "s1",  name: "Rohit Das",         roll: 12, class: "VIII-A", section: "Middle School", attendance: 84.6, status: "active" },
  { id: "s2",  name: "Priti Bora",         roll: 13, class: "VIII-A", section: "Middle School", attendance: 91.2, status: "active" },
  { id: "s3",  name: "Aman Hazarika",      roll: 14, class: "VIII-A", section: "Middle School", attendance: 76.5, status: "active" },
  { id: "s4",  name: "Neha Kalita",        roll: 15, class: "VII-B",  section: "Middle School", attendance: 95.0, status: "active" },
  { id: "s5",  name: "Deepak Choudhury",   roll: 16, class: "VII-B",  section: "Middle School", attendance: 68.3, status: "active" },
  { id: "s6",  name: "Laxmi Devi",         roll:  1, class: "IX-A",  section: "High School",   attendance: 88.9, status: "active" },
  { id: "s7",  name: "Bikash Sarma",        roll:  2, class: "IX-A",  section: "High School",   attendance: 73.1, status: "active" },
  { id: "s8",  name: "Anjali Das",          roll:  3, class: "X-A",   section: "High School",   attendance: 96.5, status: "active" },
  { id: "s9",  name: "Rahul Gogoi",         roll:  4, class: "X-A",   section: "High School",   attendance: 60.2, status: "active" },
  { id: "s10", name: "Trisha Baruah",       roll:  5, class: "VI-A",  section: "Middle School", attendance: 88.0, status: "active" },
]

export default function StudentsPage() {
  const [query, setQuery] = useState("")

  const filtered = STUDENTS.filter(s =>
    s.name.toLowerCase().includes(query.toLowerCase()) ||
    s.class.toLowerCase().includes(query.toLowerCase())
  )

  const avgAttendance = (STUDENTS.reduce((s, t) => s + t.attendance, 0) / STUDENTS.length).toFixed(1)
  const lowAttendance = STUDENTS.filter(s => s.attendance < 75).length

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<GraduationCap size={22} />}
        title="Students"
        subtitle="Student directory — HCEA"
        actions={
          <Button size="default">
            <UserPlus className="size-4" />
            Add Student
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total Students"    value={STUDENTS.length} icon={<GraduationCap className="size-5" />} />
        <KpiCard title="Avg Attendance"    value={`${avgAttendance}%`} icon={<GraduationCap className="size-5" />} iconClassName="bg-success/20 text-success-foreground" />
        <KpiCard title="Low Attendance"    value={lowAttendance}   icon={<AlertTriangle className="size-5" />} iconClassName="bg-warning/20 text-warning-foreground" />
        <KpiCard title="Classes"           value={5} icon={<GraduationCap className="size-5" />} iconClassName="bg-primary/10 text-primary" />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">All Students</CardTitle>
          <SearchInput
            placeholder="Search by name or class..."
            className="h-8 w-64"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="size-6" />}
              title="No students found"
              description="Try a different search term."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Name</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Roll</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Class</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Section</th>
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Attendance</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(student => (
                    <tr key={student.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                            {student.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span className="font-medium">{student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{student.roll}</td>
                      <td className="px-4 py-3 font-medium">{student.class}</td>
                      <td className="px-4 py-3 text-muted-foreground">{student.section}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={
                            student.attendance >= 85 ? "text-success-foreground font-medium"
                            : student.attendance >= 75 ? "text-warning-foreground font-medium"
                            : "text-destructive font-medium"
                          }>{student.attendance}%</span>
                          {student.attendance < 75 && (
                            <Badge variant="destructive" className="text-xs">Low</Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button size="xs" variant="ghost">View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
