import { Calendar, Download } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TEACHING_PERIODS } from "@/lib/constants"
import { cn } from "@/lib/utils"

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// Sample timetable data for Class VIII-A
const TIMETABLE: Record<string, Record<string, { subject: string; teacher: string }>> = {
  Monday:    { P1: { subject: "Mathematics",  teacher: "Priya Sharma"  }, P2: { subject: "English",     teacher: "Rajesh Kalita" }, P3: { subject: "Science",    teacher: "Anita Devi"     }, P4: { subject: "Hindi",         teacher: "Rima Das"       }, P5: { subject: "Social",       teacher: "Biju Das"       }, P6: { subject: "EVS",         teacher: "Kamal Nath"    }, P7: { subject: "PE",           teacher: "Himanta Bezbaruah" } },
  Tuesday:   { P1: { subject: "English",      teacher: "Rajesh Kalita" }, P2: { subject: "Mathematics",  teacher: "Priya Sharma"  }, P3: { subject: "Hindi",      teacher: "Rima Das"       }, P4: { subject: "Science",       teacher: "Anita Devi"     }, P5: { subject: "Assamese",     teacher: "Meena Gogoi"    }, P6: { subject: "Mathematics", teacher: "Priya Sharma"  }, P7: { subject: "Computer",     teacher: "Dipak Baruah"   } },
  Wednesday: { P1: { subject: "Science",      teacher: "Anita Devi"    }, P2: { subject: "Hindi",        teacher: "Rima Das"      }, P3: { subject: "Mathematics",teacher: "Priya Sharma"   }, P4: { subject: "English",       teacher: "Rajesh Kalita"  }, P5: { subject: "PE",           teacher: "Himanta Bezbaruah" }, P6: { subject: "Art",       teacher: "Sunita Borah"  }, P7: { subject: "Assamese",     teacher: "Meena Gogoi"    } },
  Thursday:  { P1: { subject: "Hindi",        teacher: "Rima Das"      }, P2: { subject: "Science",      teacher: "Anita Devi"    }, P3: { subject: "English",    teacher: "Rajesh Kalita"  }, P4: { subject: "Mathematics",   teacher: "Priya Sharma"   }, P5: { subject: "Computer",     teacher: "Dipak Baruah"   }, P6: { subject: "Social",      teacher: "Biju Das"      }, P7: { subject: "Hindi",        teacher: "Rima Das"       } },
  Friday:    { P1: { subject: "Assamese",     teacher: "Meena Gogoi"   }, P2: { subject: "EVS",          teacher: "Kamal Nath"    }, P3: { subject: "PE",         teacher: "Himanta Bezbaruah" }, P4: { subject: "Science",    teacher: "Anita Devi"     }, P5: { subject: "English",      teacher: "Rajesh Kalita"  }, P6: { subject: "Mathematics", teacher: "Priya Sharma"  }, P7: { subject: "Social",       teacher: "Biju Das"       } },
  Saturday:  { P1: { subject: "Mathematics",  teacher: "Priya Sharma"  }, P2: { subject: "English",     teacher: "Rajesh Kalita" }, P3: { subject: "Assamese",   teacher: "Meena Gogoi"    }, P4: { subject: "Science",       teacher: "Anita Devi"     }, P5: { subject: "Hindi",        teacher: "Rima Das"       }, P6: { subject: "Social",       teacher: "Biju Das"      }, P7: { subject: "PE",           teacher: "Himanta Bezbaruah" } },
}

const SUBJECT_COLORS: Record<string, string> = {
  Mathematics: "bg-primary/10 text-primary",
  English:     "bg-cyan-100 text-cyan-800",
  Science:     "bg-green-100 text-green-800",
  Hindi:       "bg-orange-100 text-orange-800",
  Assamese:    "bg-purple-100 text-purple-800",
  Social:      "bg-yellow-100 text-yellow-800",
  PE:          "bg-rose-100 text-rose-800",
  Computer:    "bg-indigo-100 text-indigo-800",
  EVS:         "bg-teal-100 text-teal-800",
  Art:         "bg-pink-100 text-pink-800",
}

export default function TimetablePage() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<Calendar size={22} />}
        title="Timetable"
        subtitle="Class VIII-A weekly schedule"
        actions={
          <>
            <Button variant="outline" size="default">
              <Download className="size-4" />
              Export PDF
            </Button>
            <Button size="default">Edit Timetable</Button>
          </>
        }
      />

      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Weekly Grid — Class VIII-A</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left text-muted-foreground font-medium py-3 px-4 w-28 border-r border-border">Period</th>
                {DAYS.map(day => (
                  <th key={day} className="text-center text-muted-foreground font-medium py-3 px-3 min-w-[110px]">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TEACHING_PERIODS.map((period, i) => (
                <tr key={period.id} className={cn("border-t border-border", i % 2 === 0 ? "" : "bg-muted/20")}>
                  <td className="py-3 px-4 border-r border-border">
                    <p className="font-semibold text-foreground">{period.id}</p>
                    <p className="text-muted-foreground text-[10px]">{period.time}</p>
                  </td>
                  {DAYS.map(day => {
                    const cell = TIMETABLE[day]?.[period.id]
                    return (
                      <td key={day} className="py-2 px-2 text-center">
                        {cell ? (
                          <div className={cn("rounded-md px-2 py-1.5", SUBJECT_COLORS[cell.subject] ?? "bg-muted text-muted-foreground")}>
                            <p className="font-semibold text-[11px]">{cell.subject}</p>
                            <p className="text-[10px] opacity-75">{cell.teacher.split(" ")[0]}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground font-medium">Subjects:</span>
        {Object.entries(SUBJECT_COLORS).map(([subject, cls]) => (
          <Badge key={subject} className={cn("text-xs border-0", cls)}>{subject}</Badge>
        ))}
      </div>
    </div>
  )
}
