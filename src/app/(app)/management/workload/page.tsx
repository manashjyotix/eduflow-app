import { Activity } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { TEACHERS } from "@/data/teachers"

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

// Mock workload data: teachers × days = proxy count that day
const WORKLOAD: Record<string, number[]> = {
  t1: [2, 0, 1, 0, 2, 1],
  t2: [0, 1, 2, 1, 0, 0],
  t4: [1, 2, 0, 2, 1, 1],
  t5: [0, 0, 1, 0, 1, 0],
  t7: [3, 1, 2, 0, 2, 1],
  t10:[1, 2, 1, 2, 1, 2],
}

function heatColor(val: number) {
  if (val === 0) return "bg-muted/40 text-muted-foreground/50"
  if (val === 1) return "bg-primary/20 text-primary"
  if (val === 2) return "bg-warning text-warning-foreground"
  return "bg-destructive text-destructive-foreground"
}

export default function WorkloadPage() {
  const activeTeachers = TEACHERS.filter(t => t.status === "active")

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <PageHeader
        icon={<Activity size={22} />}
        title="Workload Heatmap"
        subtitle="Teacher proxy duty distribution this week"
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">This Week</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-4 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr>
                <th className="text-left text-muted-foreground font-medium pb-3 pr-4 min-w-[140px]">Teacher</th>
                {DAYS.map(d => (
                  <th key={d} className="text-center text-muted-foreground font-medium pb-3 px-2 min-w-[52px]">{d}</th>
                ))}
                <th className="text-right text-muted-foreground font-medium pb-3 pl-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {activeTeachers.map(t => {
                const load = WORKLOAD[t.id] ?? [0,0,0,0,0,0]
                const total = load.reduce((a, b) => a + b, 0)
                return (
                  <tr key={t.id} className="border-t border-border/50">
                    <td className="py-2 pr-4">
                      <p className="font-medium text-foreground">{t.name}</p>
                      <p className="text-muted-foreground text-[10px]">{t.subjects[0]}</p>
                    </td>
                    {load.map((val, i) => (
                      <td key={i} className="py-2 px-2 text-center">
                        <span className={`inline-flex items-center justify-center size-7 rounded-md font-semibold text-xs ${heatColor(val)}`}>
                          {val > 0 ? val : "—"}
                        </span>
                      </td>
                    ))}
                    <td className="py-2 pl-4 text-right font-bold text-foreground">{total}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">Load key:</span>
        {[
          { cls: "bg-muted/40", label: "No proxy" },
          { cls: "bg-primary/20", label: "1 proxy" },
          { cls: "bg-warning", label: "2 proxies" },
          { cls: "bg-destructive", label: "3+ (heavy)" },
        ].map(item => (
          <span key={item.label} className="flex items-center gap-1.5">
            <span className={`size-4 rounded ${item.cls} inline-block`} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}
