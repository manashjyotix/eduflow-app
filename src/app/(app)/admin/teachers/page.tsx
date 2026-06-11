import { Users, UserCheck, UserX, GraduationCap } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { KpiCard } from "@/components/shared/kpi-card"
import { SearchInput } from "@/components/shared/search-input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TEACHERS } from "@/data/teachers"

const active   = TEACHERS.filter(t => t.status === "active").length
const onLeave  = TEACHERS.filter(t => t.status === "on_leave").length
const inactive = TEACHERS.filter(t => t.status === "inactive").length

export default function TeachersPage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<Users size={22} />}
        title="Teachers"
        subtitle="Manage HCEA teaching staff"
        actions={
          <Button size="default">
            <Users className="size-4" />
            Add Teacher
          </Button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Total"    value={TEACHERS.length} icon={<Users className="size-5" />} />
        <KpiCard title="Active"   value={active}   icon={<UserCheck className="size-5" />} iconClassName="bg-success/20 text-success-foreground" />
        <KpiCard title="On Leave" value={onLeave}  icon={<GraduationCap className="size-5" />} iconClassName="bg-warning/20 text-warning-foreground" />
        <KpiCard title="Inactive" value={inactive} icon={<UserX className="size-5" />} iconClassName="bg-muted text-muted-foreground" />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">All Teachers</CardTitle>
          <SearchInput placeholder="Search teachers..." className="h-8 w-56" />
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left text-xs font-medium text-muted-foreground px-6 py-3">Name</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Subjects</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Section</th>
                  <th className="text-left text-xs font-medium text-muted-foreground px-4 py-3">Status</th>
                  <th className="text-right text-xs font-medium text-muted-foreground px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {TEACHERS.map(teacher => (
                  <tr key={teacher.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold flex-shrink-0">
                          {teacher.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium">{teacher.name}</p>
                          <p className="text-xs text-muted-foreground">{teacher.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {teacher.subjects.map(s => (
                          <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{teacher.section}</td>
                    <td className="px-4 py-3">
                      <Badge variant={teacher.status === "active" ? "success" : teacher.status === "on_leave" ? "warning" : "secondary"} className="capitalize">
                        {teacher.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Button size="xs" variant="ghost">Edit</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
