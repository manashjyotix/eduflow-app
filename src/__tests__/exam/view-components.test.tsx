/**
 * view-components.test.tsx  (Feature: exam-routine-builder · Task 15.5)
 *
 * Component / integration tests for dialogs, duty roster, and read-only view.
 *
 * Covers:
 *   - DuplicateRoutineDialog — duplication report summary (R8.4)
 *   - AIRoutineDialog — uncovered/unplaced reporting (R9.8, R9.10)
 *   - AIRoutineDialog — missing-config error (R9.9)
 *   - DutyRoster — notifyDuties dispatch (R11.1)
 *   - ReadOnlySchedule — no edit controls, schedule is displayed (R10.4)
 *
 * Tests use Vitest + @testing-library/react.
 * The exam-schedule context is mocked so tests are independent of real state.
 *
 * Requirements: 8.4, 9.8, 9.10, 9.9, 11.1, 10.4
 */

import React, { type ReactNode } from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

import { DuplicateRoutineDialog } from "@/components/domain/exam/DuplicateRoutineDialog"
import { AIRoutineDialog } from "@/components/domain/exam/AIRoutineDialog"
import { DutyRoster } from "@/components/domain/exam/DutyRoster"
import { ReadOnlySchedule } from "@/components/domain/exam/ReadOnlySchedule"

// ─────────────────────────────────────────────────────────────────────────────
// Context mock
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Controls mutated per-test to shape the context value returned to components.
 * Hoisted so vi.mock factories can reference them.
 */
const ctx = vi.hoisted(() => {
  // Mutable values read by the mock factory on every hook call.
  const state = {
    canEdit: true as boolean,
    duplicateResult: { ok: true, value: { created: 3, overwritten: 1, omitted: 0, omittedSubjects: [] } } as
      | { ok: true; value: { created: number; overwritten: number; omitted: number; omittedSubjects: string[] } }
      | { ok: false; message: string },
    generateResult: { ok: true, value: { slots: [], uncoveredSlotCount: 0, unplacedSubjectsByClass: {} } } as
      | { ok: true; value: { slots: unknown[]; uncoveredSlotCount: number; unplacedSubjectsByClass: Record<string, number> } }
      | { ok: false; error: string; message: string },
    notifyResult: { sent: 2, skipped: 0 } as { sent: number; skipped: number },
    slots: [
      { id: "es-1", classId: "VIII-A", date: "2026-07-14", sessionId: "ses-morning", subject: "English", room: "Room 201", invigilatorIds: ["t1"] },
    ] as Array<{ id: string; classId: string; date: string; sessionId: string; subject?: string; room?: string; invigilatorIds: string[] }>,
    sessions: [{ id: "ses-morning", name: "Morning", startTime: "09:30", endTime: "12:30" }],
    dates: ["2026-07-14"],
  }
  return state
})

/** Stable mock for notifyDuties so we can assert calls on it. */
const notifyDutiesMock = vi.hoisted(() => vi.fn())

vi.mock("@/context/exam-schedule-context", () => ({
  useExamSchedule: () => ({
    canEdit: ctx.canEdit,
    canManageConfig: ctx.canEdit,
    duplicateRoutine: (_src: string, _targets: string[]) => ctx.duplicateResult,
    generateRoutine: (_mode: string) => ctx.generateResult,
    notifyDuties: notifyDutiesMock,
    slots: ctx.slots,
    sessions: ctx.sessions,
    dates: ctx.dates,
    slotFor: (coord: { classId: string; date: string; sessionId: string }) =>
      ctx.slots.find(
        s => s.classId === coord.classId && s.date === coord.date && s.sessionId === coord.sessionId,
      ),
    catalog: [],
    settings: { notifyLeadMinutes: 15, notifyOnCampusEntry: true },
    conflicts: [],
    loadErrors: [],
  }),
}))

// Sonner toast is a side-effect; mock it so no DOM errors in jsdom.
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
  }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Reset helpers
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Restore defaults before each test.
  ctx.canEdit = true
  ctx.duplicateResult = { ok: true, value: { created: 3, overwritten: 1, omitted: 0, omittedSubjects: [] } }
  ctx.generateResult = { ok: true, value: { slots: [], uncoveredSlotCount: 0, unplacedSubjectsByClass: {} } }
  ctx.notifyResult = { sent: 2, skipped: 0 }
  ctx.slots = [
    { id: "es-1", classId: "VIII-A", date: "2026-07-14", sessionId: "ses-morning", subject: "English", room: "Room 201", invigilatorIds: ["t1"] },
  ]
  ctx.sessions = [{ id: "ses-morning", name: "Morning", startTime: "09:30", endTime: "12:30" }]
  ctx.dates = ["2026-07-14"]

  notifyDutiesMock.mockReset()
  notifyDutiesMock.mockReturnValue(ctx.notifyResult)
})

// ─────────────────────────────────────────────────────────────────────────────
// 1. DuplicateRoutineDialog — duplication report summary (R8.4)
// ─────────────────────────────────────────────────────────────────────────────

describe("DuplicateRoutineDialog — duplication report summary (R8.4)", () => {
  /** Open the dialog and click Confirm with at least one target selected. */
  async function openAndConfirm(_container: HTMLElement) {
    const trigger = screen.getByRole("button", { name: /Duplicate to/i })
    fireEvent.click(trigger)

    // EXAM_CLASSES = ["VIII-A", "IX-A", "X-A"].
    // Default source = "VIII-A", so "IX-A" is always available as a target.
    // Radix Checkbox renders as role="checkbox".
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })
    const checkboxes = screen.getAllByRole("checkbox")
    if (checkboxes.length > 0) {
      fireEvent.click(checkboxes[0])
    }
    // Click the footer Duplicate button (not the trigger).
    const allDupBtns = screen.getAllByRole("button", { name: /^Duplicate/i })
    // The confirm button inside the dialog footer is the last "Duplicate" button.
    const confirmBtn = allDupBtns[allDupBtns.length - 1]
    fireEvent.click(confirmBtn)
  }

  it("renders the trigger button for authorized users", () => {
    render(<DuplicateRoutineDialog />)
    expect(screen.getByRole("button", { name: /Duplicate to/i })).toBeInTheDocument()
  })

  it("does NOT render when canEdit is false (R10.4)", () => {
    ctx.canEdit = false
    render(<DuplicateRoutineDialog />)
    expect(screen.queryByRole("button", { name: /Duplicate to/i })).not.toBeInTheDocument()
  })

  it("opens the dialog when trigger is clicked", () => {
    render(<DuplicateRoutineDialog />)
    fireEvent.click(screen.getByRole("button", { name: /Duplicate to/i }))
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("shows 'created' count after a successful duplication (R8.4)", async () => {
    ctx.duplicateResult = { ok: true, value: { created: 5, overwritten: 2, omitted: 1, omittedSubjects: ["Science"] } }
    render(<DuplicateRoutineDialog />)
    await openAndConfirm(document.body)
    await waitFor(() => {
      expect(screen.getByText(/5 created/i)).toBeInTheDocument()
    })
  })

  it("shows 'overwritten' count after a successful duplication (R8.4)", async () => {
    ctx.duplicateResult = { ok: true, value: { created: 5, overwritten: 2, omitted: 1, omittedSubjects: ["Science"] } }
    render(<DuplicateRoutineDialog />)
    await openAndConfirm(document.body)
    await waitFor(() => {
      expect(screen.getByText(/2 overwritten/i)).toBeInTheDocument()
    })
  })

  it("shows 'omitted' count after a successful duplication (R8.4)", async () => {
    ctx.duplicateResult = { ok: true, value: { created: 5, overwritten: 2, omitted: 1, omittedSubjects: ["Science"] } }
    render(<DuplicateRoutineDialog />)
    await openAndConfirm(document.body)
    await waitFor(() => {
      expect(screen.getByText(/1 omitted/i)).toBeInTheDocument()
    })
  })

  it("shows omitted subject names when subjects are omitted (R8.4)", async () => {
    ctx.duplicateResult = { ok: true, value: { created: 3, overwritten: 0, omitted: 2, omittedSubjects: ["Science", "Hindi"] } }
    render(<DuplicateRoutineDialog />)
    await openAndConfirm(document.body)
    await waitFor(() => {
      expect(screen.getByText("Science")).toBeInTheDocument()
      expect(screen.getByText("Hindi")).toBeInTheDocument()
    })
  })

  it("shows 0 omitted badge when nothing is omitted (R8.4)", async () => {
    ctx.duplicateResult = { ok: true, value: { created: 3, overwritten: 1, omitted: 0, omittedSubjects: [] } }
    render(<DuplicateRoutineDialog />)
    await openAndConfirm(document.body)
    await waitFor(() => {
      // The badge text renders as "0 omitted" in a single element
      expect(screen.getByText((text) => text.includes("0") && text.toLowerCase().includes("omitted"))).toBeInTheDocument()
    })
    // No "Subjects skipped" section when nothing omitted
    await waitFor(() => {
      expect(screen.queryByText(/Subjects skipped/i)).not.toBeInTheDocument()
    })
  })

  it("shows an error message on failed duplication", async () => {
    ctx.duplicateResult = { ok: false, message: "Target set is empty." }
    render(<DuplicateRoutineDialog />)
    await openAndConfirm(document.body)
    await waitFor(() => {
      // The error paragraph has role="alert" in the component
      expect(screen.getByText(/Target set is empty/i)).toBeInTheDocument()
    })
  })

  it("shows 'Duplication complete' success message on success", async () => {
    ctx.duplicateResult = { ok: true, value: { created: 3, overwritten: 1, omitted: 0, omittedSubjects: [] } }
    render(<DuplicateRoutineDialog />)
    await openAndConfirm(document.body)
    await waitFor(() => {
      expect(screen.getByText(/Duplication complete/i)).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 2. AIRoutineDialog — uncovered/unplaced reporting (R9.8, R9.10)
// ─────────────────────────────────────────────────────────────────────────────

describe("AIRoutineDialog — uncovered/unplaced reporting (R9.8, R9.10)", () => {
  /** Opens the dialog. */
  function openDialog() {
    fireEvent.click(screen.getByRole("button", { name: /AI Routine Builder/i }))
  }

  /** Clicks "Generate full draft". */
  function clickFullDraft() {
    fireEvent.click(screen.getByRole("button", { name: /Generate full draft/i }))
  }

  /** Clicks "Suggest invigilators". */
  function clickSuggest() {
    fireEvent.click(screen.getByRole("button", { name: /Suggest invigilators/i }))
  }

  it("renders the trigger button for authorized users", () => {
    render(<AIRoutineDialog />)
    expect(screen.getByRole("button", { name: /AI Routine Builder/i })).toBeInTheDocument()
  })

  it("does NOT render when canEdit is false", () => {
    ctx.canEdit = false
    render(<AIRoutineDialog />)
    expect(screen.queryByRole("button", { name: /AI Routine Builder/i })).not.toBeInTheDocument()
  })

  it("shows uncoveredSlotCount when teachers are insufficient (R9.8)", async () => {
    ctx.generateResult = {
      ok: true,
      value: { slots: [], uncoveredSlotCount: 4, unplacedSubjectsByClass: {} },
    }
    render(<AIRoutineDialog />)
    openDialog()
    clickFullDraft()
    await waitFor(() => {
      expect(screen.getByText(/4 slots? left without an invigilator/i)).toBeInTheDocument()
    })
  })

  it("shows '0 slots left without an invigilator' when all slots are covered (R9.8)", async () => {
    ctx.generateResult = {
      ok: true,
      value: { slots: [], uncoveredSlotCount: 0, unplacedSubjectsByClass: {} },
    }
    render(<AIRoutineDialog />)
    openDialog()
    clickFullDraft()
    await waitFor(() => {
      expect(screen.getByText(/0 slots? left without an invigilator/i)).toBeInTheDocument()
    })
  })

  it("shows per-class unplaced subjects when capacity is insufficient (R9.10)", async () => {
    ctx.generateResult = {
      ok: true,
      value: {
        slots: [],
        uncoveredSlotCount: 0,
        unplacedSubjectsByClass: { "VIII-A": 2, "IX-A": 1 },
      },
    }
    render(<AIRoutineDialog />)
    openDialog()
    clickFullDraft()
    await waitFor(() => {
      expect(screen.getByText(/VIII-A/i)).toBeInTheDocument()
      expect(screen.getByText(/2 unplaced subject/i)).toBeInTheDocument()
      expect(screen.getByText(/IX-A/i)).toBeInTheDocument()
      expect(screen.getByText(/1 unplaced subject/i)).toBeInTheDocument()
    })
  })

  it("shows 'All subjects placed' when no subjects are unplaced (R9.10)", async () => {
    ctx.generateResult = {
      ok: true,
      value: { slots: [], uncoveredSlotCount: 0, unplacedSubjectsByClass: {} },
    }
    render(<AIRoutineDialog />)
    openDialog()
    clickFullDraft()
    await waitFor(() => {
      expect(screen.getByText(/All subjects placed/i)).toBeInTheDocument()
    })
  })

  it("shows report after suggest-invigilators mode too (R9.8)", async () => {
    ctx.generateResult = {
      ok: true,
      value: { slots: [], uncoveredSlotCount: 2, unplacedSubjectsByClass: {} },
    }
    render(<AIRoutineDialog />)
    openDialog()
    clickSuggest()
    await waitFor(() => {
      expect(screen.getByText(/2 slots? left without an invigilator/i)).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 3. AIRoutineDialog — missing-config error (R9.9)
// ─────────────────────────────────────────────────────────────────────────────

describe("AIRoutineDialog — missing-config error (R9.9)", () => {
  function openDialog() {
    fireEvent.click(screen.getByRole("button", { name: /AI Routine Builder/i }))
  }

  it("shows an error alert when no dates are configured (R9.9)", async () => {
    ctx.generateResult = {
      ok: false,
      error: "missing-dates",
      message: "No exam dates have been configured.",
    }
    render(<AIRoutineDialog />)
    openDialog()
    fireEvent.click(screen.getByRole("button", { name: /Generate full draft/i }))
    await waitFor(() => {
      expect(screen.getByText(/No exam dates have been configured/i)).toBeInTheDocument()
    })
  })

  it("shows an error alert when no sessions are configured (R9.9)", async () => {
    ctx.generateResult = {
      ok: false,
      error: "missing-sessions",
      message: "No sessions have been configured.",
    }
    render(<AIRoutineDialog />)
    openDialog()
    fireEvent.click(screen.getByRole("button", { name: /Generate full draft/i }))
    await waitFor(() => {
      expect(screen.getByText(/No sessions have been configured/i)).toBeInTheDocument()
    })
  })

  it("shows 'Couldn\u2019t generate a routine' heading on missing-config error (R9.9)", async () => {
    ctx.generateResult = {
      ok: false,
      error: "missing-dates",
      message: "No exam dates have been configured.",
    }
    render(<AIRoutineDialog />)
    openDialog()
    fireEvent.click(screen.getByRole("button", { name: /Generate full draft/i }))
    await waitFor(() => {
      expect(screen.getByText(/Couldn.t generate a routine/i)).toBeInTheDocument()
    })
  })

  it("does NOT show report sections when generation is rejected (R9.9)", async () => {
    ctx.generateResult = {
      ok: false,
      error: "missing-dates",
      message: "No exam dates have been configured.",
    }
    render(<AIRoutineDialog />)
    openDialog()
    fireEvent.click(screen.getByRole("button", { name: /Generate full draft/i }))
    await waitFor(() => {
      // No "slots left without an invigilator" text since generation didn't run
      expect(screen.queryByText(/slots? left without an invigilator/i)).not.toBeInTheDocument()
    })
  })

  it("clears previous error when a new successful run is made", async () => {
    ctx.generateResult = { ok: false, error: "missing-dates", message: "No exam dates configured." }
    render(<AIRoutineDialog />)
    openDialog()
    fireEvent.click(screen.getByRole("button", { name: /Generate full draft/i }))
    await waitFor(() => {
      expect(screen.getByText(/No exam dates configured/i)).toBeInTheDocument()
    })

    // Now make next call succeed
    ctx.generateResult = { ok: true, value: { slots: [], uncoveredSlotCount: 0, unplacedSubjectsByClass: {} } }
    fireEvent.click(screen.getByRole("button", { name: /Generate full draft/i }))
    await waitFor(() => {
      expect(screen.queryByText(/No exam dates configured/i)).not.toBeInTheDocument()
      expect(screen.getByText(/slots? left without an invigilator/i)).toBeInTheDocument()
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 4. DutyRoster — notifyDuties dispatch (R11.1)
// ─────────────────────────────────────────────────────────────────────────────

describe("DutyRoster — notifyDuties dispatch (R11.1)", () => {
  it("renders the 'Notify duties' button for authorized users (canEdit=true)", () => {
    ctx.canEdit = true
    render(<DutyRoster />)
    expect(screen.getByRole("button", { name: /Notify duties/i })).toBeInTheDocument()
  })

  it("does NOT render the 'Notify duties' button when canEdit is false", () => {
    ctx.canEdit = false
    render(<DutyRoster />)
    expect(screen.queryByRole("button", { name: /Notify duties/i })).not.toBeInTheDocument()
  })

  it("calls notifyDuties when the 'Notify duties' button is clicked (R11.1)", () => {
    notifyDutiesMock.mockReturnValue({ sent: 2, skipped: 0 })
    render(<DutyRoster />)
    fireEvent.click(screen.getByRole("button", { name: /Notify duties/i }))
    expect(notifyDutiesMock).toHaveBeenCalledTimes(1)
  })

  it("shows the sent count in the inline summary after notifyDuties (R11.1)", async () => {
    notifyDutiesMock.mockReturnValue({ sent: 3, skipped: 0 })
    render(<DutyRoster />)
    fireEvent.click(screen.getByRole("button", { name: /Notify duties/i }))
    await waitFor(() => {
      expect(screen.getByText(/Sent 3 notification/i)).toBeInTheDocument()
    })
  })

  it("shows the skipped count in the inline summary when skipped > 0 (R11.1)", async () => {
    notifyDutiesMock.mockReturnValue({ sent: 2, skipped: 1 })
    render(<DutyRoster />)
    fireEvent.click(screen.getByRole("button", { name: /Notify duties/i }))
    await waitFor(() => {
      expect(screen.getByText(/skipped 1 assignment/i)).toBeInTheDocument()
    })
  })

  it("shows 'Sent no notifications' when sent=0 (R11.1)", async () => {
    notifyDutiesMock.mockReturnValue({ sent: 0, skipped: 0 })
    ctx.slots = []
    render(<DutyRoster />)
    // Button is disabled when no duties; simulate a state where there are duties but send=0
    // Re-enable by providing a slot but mock returns 0
    ctx.slots = [
      { id: "es-1", classId: "VIII-A", date: "2026-07-14", sessionId: "ses-morning", subject: "English", room: "Room 201", invigilatorIds: ["t1"] },
    ]
    const { unmount } = render(<DutyRoster />)
    fireEvent.click(screen.getAllByRole("button", { name: /Notify duties/i })[1])
    await waitFor(() => {
      expect(screen.getByText(/Sent no notifications/i)).toBeInTheDocument()
    })
    unmount()
  })

  it("shows duty assignments in the roster (R11.1)", () => {
    // Slot has a subject and invigilator → appears in the roster
    ctx.slots = [
      { id: "es-1", classId: "VIII-A", date: "2026-07-14", sessionId: "ses-morning", subject: "English", room: "Room 201", invigilatorIds: ["t1"] },
    ]
    render(<DutyRoster />)
    expect(screen.getByText("English")).toBeInTheDocument()
    expect(screen.getByText("VIII-A")).toBeInTheDocument()
  })

  it("shows the 'Notify duties' button disabled when there are no assignments", () => {
    ctx.slots = []
    render(<DutyRoster />)
    const btn = screen.getByRole("button", { name: /Notify duties/i })
    expect(btn).toBeDisabled()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// 5. ReadOnlySchedule — no edit controls, schedule is displayed (R10.4)
// ─────────────────────────────────────────────────────────────────────────────

describe("ReadOnlySchedule — read-only view has no edit controls (R10.4)", () => {
  it("renders the exam schedule card", () => {
    render(<ReadOnlySchedule />)
    expect(screen.getByText(/Exam Schedule/i)).toBeInTheDocument()
  })

  it("contains NO create/add button (R10.4)", () => {
    render(<ReadOnlySchedule />)
    expect(screen.queryByRole("button", { name: /create|add|new/i })).not.toBeInTheDocument()
  })

  it("contains NO edit button (R10.4)", () => {
    render(<ReadOnlySchedule />)
    expect(screen.queryByRole("button", { name: /edit|rename/i })).not.toBeInTheDocument()
  })

  it("contains NO delete/remove button (R10.4)", () => {
    render(<ReadOnlySchedule />)
    expect(screen.queryByRole("button", { name: /delete|remove/i })).not.toBeInTheDocument()
  })

  it("contains NO publish button (R10.4)", () => {
    render(<ReadOnlySchedule />)
    expect(screen.queryByRole("button", { name: /publish/i })).not.toBeInTheDocument()
  })

  it("contains NO form inputs (no interactive edit controls) (R10.4)", () => {
    render(<ReadOnlySchedule />)
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument()
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument()
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument()
  })

  it("displays the schedule data — subject name appears in the grid (R10.4)", () => {
    ctx.slots = [
      { id: "es-1", classId: "VIII-A", date: "2026-07-14", sessionId: "ses-morning", subject: "English", room: "Room 201", invigilatorIds: [] },
    ]
    ctx.dates = ["2026-07-14"]
    ctx.sessions = [{ id: "ses-morning", name: "Morning", startTime: "09:30", endTime: "12:30" }]
    render(<ReadOnlySchedule />)
    expect(screen.getByText("English")).toBeInTheDocument()
  })

  it("displays the class row for each class (R10.4)", () => {
    ctx.slots = [
      { id: "es-1", classId: "VIII-A", date: "2026-07-14", sessionId: "ses-morning", subject: "English", room: "Room 201", invigilatorIds: [] },
    ]
    ctx.dates = ["2026-07-14"]
    render(<ReadOnlySchedule />)
    // EXAM_CLASSES = ["VIII-A", "IX-A", "X-A"] — all rows should appear
    expect(screen.getByText("VIII-A")).toBeInTheDocument()
    expect(screen.getByText("IX-A")).toBeInTheDocument()
    expect(screen.getByText("X-A")).toBeInTheDocument()
  })

  it("displays the column header with session name (R10.4)", () => {
    ctx.dates = ["2026-07-14"]
    ctx.sessions = [{ id: "ses-morning", name: "Morning", startTime: "09:30", endTime: "12:30" }]
    ctx.slots = [
      { id: "es-1", classId: "VIII-A", date: "2026-07-14", sessionId: "ses-morning", subject: "English", invigilatorIds: [] },
    ]
    render(<ReadOnlySchedule />)
    expect(screen.getByText(/Morning/i)).toBeInTheDocument()
  })

  it("shows an empty-state message when there are no dates or slots", () => {
    ctx.dates = []
    ctx.slots = []
    render(<ReadOnlySchedule />)
    expect(screen.getByText(/No exam schedule yet/i)).toBeInTheDocument()
  })

  it("view is read-only — no drag affordance buttons are present (R10.4)", () => {
    render(<ReadOnlySchedule />)
    // DnD drag handles are not present in the read-only view
    expect(document.querySelector("[draggable=true]")).not.toBeInTheDocument()
  })
})
