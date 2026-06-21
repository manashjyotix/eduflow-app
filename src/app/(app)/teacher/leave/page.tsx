"use client"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Calendar, Send } from "lucide-react"
import { PageHeader } from "@/components/shared/page-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { PeriodPicker } from "@/components/shared/period-picker"
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form"
import { applyLeaveSchema, type ApplyLeaveInput } from "@/lib/schemas/leave"

const LEAVE_HISTORY = [
  { id: "l1", date: "2026-05-15", type: "sick_leave",   periods: 7, reason: "High fever",       status: "approved" },
  { id: "l2", date: "2026-04-22", type: "casual_leave", periods: 3, reason: "Personal work",     status: "approved" },
  { id: "l3", date: "2026-04-10", type: "earned_leave", periods: 7, reason: "Family function",   status: "rejected" },
]

// The schema leaveTypeValues are: "full_day" | "partial" | "half_day" | "sick" | "casual" | "emergency" | "official_duty"
// The duration toggle drives leaveType to "partial" when specific periods are chosen.
// "full_day" is set automatically when Full Day duration is selected together with a leave category.
const LEAVE_TYPES = [
  { value: "sick",          label: "Sick Leave",    balance: 5  },
  { value: "casual",        label: "Casual Leave",  balance: 8  },
  { value: "half_day",      label: "Half Day",      balance: "—" },
  { value: "emergency",     label: "Emergency",     balance: "—" },
  { value: "official_duty", label: "Official Duty", balance: "—" },
] as const

type LeaveTypeValue = typeof LEAVE_TYPES[number]["value"]

export default function TeacherLeavePage() {
  // Track UI state not directly owned by RHF
  const [fullDay, setFullDay] = useState(true)
  // leaveType button selection drives the form field separately
  const [leaveTypeUI, setLeaveTypeUI] = useState<LeaveTypeValue>("sick")
  const [history, setHistory] = useState(LEAVE_HISTORY)

  const today = new Date().toISOString().split("T")[0]

  const form = useForm<ApplyLeaveInput>({
    resolver: zodResolver(applyLeaveSchema),
    mode: "onBlur",
    defaultValues: {
      leaveType: "sick",
      reason: "",
      startDate: today,
      periods: [],
    },
  })

  // When the full-day toggle changes, update the leaveType field to "partial" or
  // back to the chosen leave-type-button value.
  function handleDurationToggle(isFullDay: boolean) {
    setFullDay(isFullDay)
    if (!isFullDay) {
      form.setValue("leaveType", "partial", { shouldValidate: true })
    } else {
      form.setValue("leaveType", leaveTypeUI, { shouldValidate: true })
      form.setValue("periods", [], { shouldValidate: false })
    }
  }

  // When a leave-type button is clicked, update both UI state and the form field
  // (only if full-day mode is active; partial always keeps "partial").
  function handleLeaveTypeClick(value: LeaveTypeValue) {
    setLeaveTypeUI(value)
    if (fullDay) {
      form.setValue("leaveType", value, { shouldValidate: true })
    }
  }

  function onSubmit(data: ApplyLeaveInput) {
    const displayType =
      LEAVE_TYPES.find(lt => lt.value === leaveTypeUI)?.label ??
      data.leaveType.replace(/_/g, " ")

    const newEntry = {
      id: `l${Date.now()}`,
      date: data.startDate,
      type: leaveTypeUI,
      periods: fullDay ? 7 : (data.periods?.length ?? 0),
      reason: data.reason,
      status: "pending" as const,
    }
    setHistory(prev => [newEntry, ...prev])

    // Reset form
    form.reset({
      leaveType: "sick",
      reason: "",
      startDate: today,
      periods: [],
    })
    setFullDay(true)
    setLeaveTypeUI("sick")

    toast.success("Leave request submitted", {
      description: `${displayType} · ${fullDay ? "Full day" : `${data.periods?.length ?? 0} period(s)`}.`,
    })
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={<Calendar size={22} />}
        title="Apply for Leave"
        subtitle="Submit an absence request to management"
      />

      {/* Balance cards */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-4">
        {LEAVE_TYPES.slice(0, 3).map(lt => (
          <Card key={lt.value}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold">{lt.balance}</p>
              <p className="text-xs text-muted-foreground mt-1">{lt.label} remaining</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Application form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">New Application</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              {/* Leave type */}
              <FormField
                control={form.control}
                name="leaveType"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Leave Type
                    </FormLabel>
                    <FormControl>
                      {/* Hidden input keeps RHF aware of the value; buttons act as the visual control */}
                      <input type="hidden" {...form.register("leaveType")} />
                    </FormControl>
                    <div className="flex flex-wrap gap-2">
                      {LEAVE_TYPES.map(lt => (
                        <Button
                          key={lt.value}
                          type="button"
                          size="xs"
                          variant={leaveTypeUI === lt.value ? "default" : "outline"}
                          onClick={() => handleLeaveTypeClick(lt.value)}
                        >
                          {lt.label}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="periods"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Duration
                    </FormLabel>
                    <FormControl>
                      <input type="hidden" />
                    </FormControl>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="xs"
                        variant={fullDay ? "default" : "outline"}
                        onClick={() => handleDurationToggle(true)}
                      >
                        Full Day
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant={!fullDay ? "default" : "outline"}
                        onClick={() => handleDurationToggle(false)}
                      >
                        Specific Periods
                      </Button>
                    </div>
                    {!fullDay && (
                      <PeriodPicker
                        value={field.value ?? []}
                        onChange={(next) => field.onChange(next)}
                        allowFullDay={false}
                        className="mt-2"
                      />
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Reason */}
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs font-medium text-muted-foreground">
                      Reason
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Brief reason for absence (min 10 characters)..."
                        className="h-8"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                <Send className="size-4" />
                Submit Request
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Leave History</CardTitle>
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {history.map(l => (
              <li key={l.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div>
                  <p className="text-sm font-medium">{l.reason}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(l.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                    {l.periods === 7 ? "Full day" : `${l.periods} periods`} ·{" "}
                    {l.type.replace(/_/g, " ")}
                  </p>
                </div>
                <Badge
                  variant={l.status === "approved" ? "success" : l.status === "pending" ? "warning" : "destructive"}
                  className="capitalize flex-shrink-0"
                >
                  {l.status}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
