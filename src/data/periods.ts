export interface Period {
  id: string
  label: string
  startTime: string
  endTime: string
  isBreak?: boolean
}

export const PERIODS: Period[] = [
  { id: "P1", label: "Period 1", startTime: "09:30", endTime: "10:10" },
  { id: "P2", label: "Period 2", startTime: "10:10", endTime: "10:50" },
  { id: "P3", label: "Period 3", startTime: "10:50", endTime: "11:30" },
  { id: "P4", label: "Period 4", startTime: "11:30", endTime: "12:10" },
  { id: "TF", label: "Tiffin",   startTime: "12:10", endTime: "12:30", isBreak: true },
  { id: "P5", label: "Period 5", startTime: "12:30", endTime: "13:10" },
  { id: "P6", label: "Period 6", startTime: "13:10", endTime: "13:50" },
  { id: "P7", label: "Period 7", startTime: "13:50", endTime: "14:30" },
]

export const TEACHING_PERIODS = PERIODS.filter(p => !p.isBreak)
export const PERIOD_IDS    = TEACHING_PERIODS.map(p => p.id)
export const PERIOD_LABELS = TEACHING_PERIODS.map(p => p.label)
