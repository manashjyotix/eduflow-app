export interface SwapRequest {
  id: string
  requesterId: string
  requesterName: string
  targetId: string
  targetName: string
  date: string
  periodId: string
  periodLabel: string
  classId: string
  subject: string
  reason: string
  status: "pending" | "agreed" | "management_pending" | "approved" | "rejected"
  createdAt: string
}

export const MOCK_SWAP_REQUESTS: SwapRequest[] = [
  {
    id: "sw1",
    requesterId: "t1",
    requesterName: "Priya Sharma",
    targetId: "t2",
    targetName: "Rajesh Kalita",
    date: "2026-06-16",
    periodId: "P3",
    periodLabel: "Period 3 (10:50–11:30)",
    classId: "VIII-A",
    subject: "English",
    reason: "Medical appointment in the morning",
    status: "agreed",
    createdAt: "2026-06-15T09:00:00Z",
  },
  {
    id: "sw2",
    requesterId: "t3",
    requesterName: "Anita Devi",
    targetId: "t5",
    targetName: "Meena Gogoi",
    date: "2026-06-17",
    periodId: "P1",
    periodLabel: "Period 1 (9:30–10:10)",
    classId: "VI-B",
    subject: "Mathematics",
    reason: "Personal work",
    status: "pending",
    createdAt: "2026-06-15T10:15:00Z",
  },
  {
    id: "sw3",
    requesterId: "t6",
    requesterName: "Dipak Baruah",
    targetId: "t4",
    targetName: "Biju Das",
    date: "2026-06-18",
    periodId: "P5",
    periodLabel: "Period 5 (12:30–1:10)",
    classId: "IX-A",
    subject: "Science",
    reason: "Department meeting conflict",
    status: "management_pending",
    createdAt: "2026-06-14T14:30:00Z",
  },
  {
    id: "sw4",
    requesterId: "t8",
    requesterName: "Sunita Borah",
    targetId: "t1",
    targetName: "Priya Sharma",
    date: "2026-06-15",
    periodId: "P7",
    periodLabel: "Period 7 (1:50–2:30)",
    classId: "VII-C",
    subject: "Hindi",
    reason: "Parent-teacher meeting",
    status: "approved",
    createdAt: "2026-06-13T11:00:00Z",
  },
  {
    id: "sw5",
    requesterId: "t2",
    requesterName: "Rajesh Kalita",
    targetId: "t9",
    targetName: "Rima Das",
    date: "2026-06-19",
    periodId: "P2",
    periodLabel: "Period 2 (10:10–10:50)",
    classId: "X-A",
    subject: "Social Studies",
    reason: "Training program",
    status: "rejected",
    createdAt: "2026-06-12T09:45:00Z",
  },
  {
    id: "sw6",
    requesterId: "t10",
    requesterName: "Himanta Bezbaruah",
    targetId: "t3",
    targetName: "Anita Devi",
    date: "2026-06-20",
    periodId: "P4",
    periodLabel: "Period 4 (11:30–12:10)",
    classId: "V-A",
    subject: "EVS",
    reason: "Attending seminar",
    status: "pending",
    createdAt: "2026-06-15T11:30:00Z",
  },
]
