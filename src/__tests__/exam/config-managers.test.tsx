/**
 * config-managers.test.tsx — Component tests for configuration manager views
 *
 * Feature: exam-routine-builder (Task 13.4)
 *
 * Covers:
 *   - SubjectCatalogManager: empty-palette state (R2.3)
 *   - SubjectCatalogManager: validation messages (required-name, name-too-long, duplicate-name)
 *   - SessionManager: delete-confirmation flow (R3.8, R3.9)
 *   - ExamDateManager: delete-confirmation flow (R5.6, R5.7, R5.8)
 *
 * Requirements: 2.3, 3.8, 3.9, 5.6, 5.7, 5.8
 *
 * Tests use Vitest + @testing-library/react with vi.mock on the
 * exam-schedule-context so components are exercised in isolation.
 */

import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, within } from "@testing-library/react"

import { SubjectCatalogManager } from "@/components/domain/exam/SubjectCatalogManager"
import { SessionManager } from "@/components/domain/exam/SessionManager"
import { ExamDateManager } from "@/components/domain/exam/ExamDateManager"

// ─────────────────────────────────────────────────────────────────────────────
// Mutable context state shared by mocks so tests can configure the context
// ─────────────────────────────────────────────────────────────────────────────

interface MockContextState {
  catalog: import("@/data/mock-exams").CatalogSubject[]
  sessions: import("@/data/mock-exams").ExamSession[]
  dates: string[]
  canManageConfig: boolean
  canEdit: boolean
  addSubject: ReturnType<typeof vi.fn>
  renameSubject: ReturnType<typeof vi.fn>
  deleteSubject: ReturnType<typeof vi.fn>
  linkClass: ReturnType<typeof vi.fn>
  unlinkClass: ReturnType<typeof vi.fn>
  addSession: ReturnType<typeof vi.fn>
  editSession: ReturnType<typeof vi.fn>
  deleteSession: ReturnType<typeof vi.fn>
  sessionHasSlots: ReturnType<typeof vi.fn>
  addExamDate: ReturnType<typeof vi.fn>
  removeExamDate: ReturnType<typeof vi.fn>
  dateHasSlots: ReturnType<typeof vi.fn>
}

// Use vi.hoisted so the mock state is available inside vi.mock factories
const mockCtx = vi.hoisted((): MockContextState => ({
  catalog: [],
  sessions: [],
  dates: [],
  canManageConfig: true,
  canEdit: true,
  addSubject: vi.fn(() => ({ ok: true, value: [] })),
  renameSubject: vi.fn(() => ({ ok: true, value: [] })),
  deleteSubject: vi.fn(() => ({ ok: true, value: [] })),
  linkClass: vi.fn(() => ({ ok: true, value: [] })),
  unlinkClass: vi.fn(() => ({ ok: true, value: [] })),
  addSession: vi.fn(() => ({ ok: true, value: [] })),
  editSession: vi.fn(() => ({ ok: true, value: [] })),
  deleteSession: vi.fn(() => ({ ok: true })),
  sessionHasSlots: vi.fn(() => false),
  addExamDate: vi.fn(() => ({ ok: true, value: [] })),
  removeExamDate: vi.fn(() => ({ ok: true })),
  dateHasSlots: vi.fn(() => false),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Mock the exam-schedule-context
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("@/context/exam-schedule-context", () => ({
  useExamSchedule: () => ({
    // State
    catalog: mockCtx.catalog,
    sessions: mockCtx.sessions,
    dates: mockCtx.dates,
    slots: [],
    settings: { notifyLeadMinutes: 15, notifyOnCampusEntry: true },
    conflicts: [],
    loadErrors: [],
    // Flags
    canManageConfig: mockCtx.canManageConfig,
    canEdit: mockCtx.canEdit,
    // Catalog actions
    addSubject: (...args: unknown[]) => mockCtx.addSubject(...args),
    renameSubject: (...args: unknown[]) => mockCtx.renameSubject(...args),
    deleteSubject: (...args: unknown[]) => mockCtx.deleteSubject(...args),
    linkClass: (...args: unknown[]) => mockCtx.linkClass(...args),
    unlinkClass: (...args: unknown[]) => mockCtx.unlinkClass(...args),
    // Session actions
    addSession: (...args: unknown[]) => mockCtx.addSession(...args),
    editSession: (...args: unknown[]) => mockCtx.editSession(...args),
    deleteSession: (...args: unknown[]) => mockCtx.deleteSession(...args),
    sessionHasSlots: (...args: unknown[]) => mockCtx.sessionHasSlots(...args),
    // Date actions
    addExamDate: (...args: unknown[]) => mockCtx.addExamDate(...args),
    removeExamDate: (...args: unknown[]) => mockCtx.removeExamDate(...args),
    dateHasSlots: (...args: unknown[]) => mockCtx.dateHasSlots(...args),
    // Stubs for unused API surface
    setSubject: vi.fn(),
    clearSlot: vi.fn(),
    setRoom: vi.fn(),
    addInvigilator: vi.fn(),
    removeInvigilator: vi.fn(),
    moveSubject: vi.fn(),
    moveInvigilator: vi.fn(),
    duplicateRoutine: vi.fn(),
    generateRoutine: vi.fn(),
    notifyDuties: vi.fn(() => ({ sent: 0, skipped: 0 })),
    notifyOnEntry: vi.fn(),
    updateSettings: vi.fn(),
    slotFor: vi.fn(),
    paletteForClass: vi.fn(() => []),
  }),
}))

// ─────────────────────────────────────────────────────────────────────────────
// Mock mock-exams for EXAM_CLASSES (used in SubjectRow linked-class chips)
// ─────────────────────────────────────────────────────────────────────────────

vi.mock("@/data/mock-exams", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/data/mock-exams")>()
  return {
    ...real,
    EXAM_CLASSES: ["VIII-A", "IX-A", "X-A"],
  }
})

// ─────────────────────────────────────────────────────────────────────────────
// Reset mocks before each test
// ─────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  // Reset state
  mockCtx.catalog = []
  mockCtx.sessions = []
  mockCtx.dates = []
  mockCtx.canManageConfig = true
  mockCtx.canEdit = true

  // Reset fn mocks
  mockCtx.addSubject.mockReset()
  mockCtx.addSubject.mockReturnValue({ ok: true, value: [] })
  mockCtx.renameSubject.mockReset()
  mockCtx.renameSubject.mockReturnValue({ ok: true, value: [] })
  mockCtx.deleteSubject.mockReset()
  mockCtx.deleteSubject.mockReturnValue({ ok: true, value: [] })
  mockCtx.linkClass.mockReset()
  mockCtx.linkClass.mockReturnValue({ ok: true, value: [] })
  mockCtx.unlinkClass.mockReset()
  mockCtx.unlinkClass.mockReturnValue({ ok: true, value: [] })

  mockCtx.addSession.mockReset()
  mockCtx.addSession.mockReturnValue({ ok: true, value: [] })
  mockCtx.editSession.mockReset()
  mockCtx.editSession.mockReturnValue({ ok: true, value: [] })
  mockCtx.deleteSession.mockReset()
  mockCtx.deleteSession.mockReturnValue({ ok: true })
  mockCtx.sessionHasSlots.mockReset()
  mockCtx.sessionHasSlots.mockReturnValue(false)

  mockCtx.addExamDate.mockReset()
  mockCtx.addExamDate.mockReturnValue({ ok: true, value: [] })
  mockCtx.removeExamDate.mockReset()
  mockCtx.removeExamDate.mockReturnValue({ ok: true })
  mockCtx.dateHasSlots.mockReset()
  mockCtx.dateHasSlots.mockReturnValue(false)
})

// ─────────────────────────────────────────────────────────────────────────────
// SubjectCatalogManager — empty-palette state (R2.3)
// ─────────────────────────────────────────────────────────────────────────────

describe("SubjectCatalogManager — empty-palette state (R2.3)", () => {
  it("shows empty-catalog message when catalog is empty", () => {
    mockCtx.catalog = []
    render(<SubjectCatalogManager />)

    // The component renders an empty state when catalog.length === 0
    expect(screen.getByText("No subjects yet")).toBeInTheDocument()
  })

  it("empty state displays an admin prompt to add subjects when canManageConfig is true", () => {
    mockCtx.catalog = []
    mockCtx.canManageConfig = true
    render(<SubjectCatalogManager />)

    expect(screen.getByText("Add your first exam subject above.")).toBeInTheDocument()
  })

  it("empty state displays a neutral message when canManageConfig is false", () => {
    mockCtx.catalog = []
    mockCtx.canManageConfig = false
    render(<SubjectCatalogManager />)

    expect(screen.getByText("The catalog is empty.")).toBeInTheDocument()
  })

  it("empty-palette empty state is visible (has a container rendered in the DOM)", () => {
    mockCtx.catalog = []
    render(<SubjectCatalogManager />)

    // The empty state container with "No subjects yet" heading must be visible
    const heading = screen.getByText("No subjects yet")
    expect(heading).toBeVisible()
  })

  it("does NOT show empty-catalog state when subjects are present", () => {
    mockCtx.catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: ["VIII-A"] },
    ]
    render(<SubjectCatalogManager />)

    expect(screen.queryByText("No subjects yet")).not.toBeInTheDocument()
    expect(screen.getByText("Mathematics")).toBeInTheDocument()
  })

  it("subject with no linked classes shows 'No classes linked yet.' in its row", () => {
    mockCtx.catalog = [
      { id: "subj-art", name: "Art", linkedClassIds: [] },
    ]
    render(<SubjectCatalogManager />)

    expect(screen.getByText("No classes linked yet.")).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SubjectCatalogManager — validation messages
// ─────────────────────────────────────────────────────────────────────────────

describe("SubjectCatalogManager — validation messages", () => {
  it("shows error when adding an empty name (required-name)", () => {
    mockCtx.addSubject.mockReturnValue({
      ok: false,
      error: "required-name",
      message: "Subject name is required.",
    })
    render(<SubjectCatalogManager />)

    fireEvent.click(screen.getByRole("button", { name: /^Add$/i }))

    expect(screen.getByText("Subject name is required.")).toBeInTheDocument()
  })

  it("shows error when adding a name that exceeds 100 characters (name-too-long)", () => {
    const longName = "A".repeat(101)
    mockCtx.addSubject.mockReturnValue({
      ok: false,
      error: "name-too-long",
      message: "Subject name must not exceed 100 characters.",
    })
    render(<SubjectCatalogManager />)

    const input = screen.getByLabelText("New subject name")
    fireEvent.change(input, { target: { value: longName } })
    fireEvent.click(screen.getByRole("button", { name: /^Add$/i }))

    expect(screen.getByText("Subject name must not exceed 100 characters.")).toBeInTheDocument()
  })

  it("shows error when adding a duplicate name (duplicate-name)", () => {
    mockCtx.catalog = [
      { id: "subj-math", name: "Mathematics", linkedClassIds: [] },
    ]
    mockCtx.addSubject.mockReturnValue({
      ok: false,
      error: "duplicate-name",
      message: "A subject with this name already exists.",
    })
    render(<SubjectCatalogManager />)

    const input = screen.getByLabelText("New subject name")
    fireEvent.change(input, { target: { value: "Mathematics" } })
    fireEvent.click(screen.getByRole("button", { name: /^Add$/i }))

    expect(screen.getByText("A subject with this name already exists.")).toBeInTheDocument()
  })

  it("validation error message is rendered with [role=status]", () => {
    mockCtx.addSubject.mockReturnValue({
      ok: false,
      error: "required-name",
      message: "Subject name is required.",
    })
    render(<SubjectCatalogManager />)

    fireEvent.click(screen.getByRole("button", { name: /^Add$/i }))

    // MessageLine uses role="status" for both error and success
    const statusEl = screen.getByRole("status")
    expect(statusEl).toBeInTheDocument()
    expect(statusEl).toHaveTextContent("Subject name is required.")
  })

  it("input is cleared and success message shown after a successful add", () => {
    mockCtx.addSubject.mockReturnValue({ ok: true, value: [] })
    render(<SubjectCatalogManager />)

    const input = screen.getByLabelText("New subject name") as HTMLInputElement
    fireEvent.change(input, { target: { value: "Science" } })
    fireEvent.click(screen.getByRole("button", { name: /^Add$/i }))

    // Input should be cleared
    expect(input.value).toBe("")
    // A success status shows
    expect(screen.getByRole("status")).toHaveTextContent("Subject added.")
  })

  it("pressing Enter in the input triggers the add action", () => {
    mockCtx.addSubject.mockReturnValue({ ok: true, value: [] })
    render(<SubjectCatalogManager />)

    const input = screen.getByLabelText("New subject name")
    fireEvent.change(input, { target: { value: "History" } })
    fireEvent.keyDown(input, { key: "Enter" })

    expect(mockCtx.addSubject).toHaveBeenCalledWith("History")
  })

  it("add form is hidden when canManageConfig is false", () => {
    mockCtx.canManageConfig = false
    render(<SubjectCatalogManager />)

    expect(screen.queryByLabelText("New subject name")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^Add$/i })).not.toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// SessionManager — delete-confirmation flow (R3.8, R3.9)
// ─────────────────────────────────────────────────────────────────────────────

describe("SessionManager — delete-confirmation flow (R3.8, R3.9)", () => {
  const morningSession = {
    id: "ses-morning",
    name: "Morning",
    startTime: "09:30",
    endTime: "12:30",
  }

  it("deletes a session directly (no confirmation) when it has no slots (R3.7)", () => {
    mockCtx.sessions = [morningSession]
    // No slots — deleteSession returns ok immediately
    mockCtx.deleteSession.mockReturnValue({ ok: true })
    render(<SessionManager />)

    fireEvent.click(screen.getByRole("button", { name: "Delete Morning" }))

    // deleteSession called without confirm flag
    expect(mockCtx.deleteSession).toHaveBeenCalledWith("ses-morning")
    // No confirmation dialog should open
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("shows confirmation dialog when sessionHasSlots returns true (R3.8)", () => {
    mockCtx.sessions = [morningSession]
    // Session has slots — needs-confirmation
    mockCtx.deleteSession.mockReturnValue({
      ok: false,
      reason: "needs-confirmation",
      message: "Session has scheduled slots.",
    })
    render(<SessionManager />)

    fireEvent.click(screen.getByRole("button", { name: "Delete Morning" }))

    // AlertDialog should be open
    const dialog = screen.getByRole("alertdialog")
    expect(dialog).toBeInTheDocument()
    // The heading is split across React nodes: Delete " | Morning | " session?
    // Match by role=heading which combines the text content
    const heading = within(dialog).getByRole("heading")
    expect(heading).toBeInTheDocument()
    expect(heading.textContent).toMatch(/Morning/i)
    expect(heading.textContent).toMatch(/session/i)
  })

  it("confirmation dialog contains a warning about slot deletion", () => {
    mockCtx.sessions = [morningSession]
    mockCtx.deleteSession.mockReturnValue({
      ok: false,
      reason: "needs-confirmation",
      message: "Session has scheduled slots.",
    })
    render(<SessionManager />)

    fireEvent.click(screen.getByRole("button", { name: "Delete Morning" }))

    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByText(/scheduled exam slots/i)).toBeInTheDocument()
  })

  it("confirming deletion calls deleteSession with confirm=true (R3.8)", () => {
    mockCtx.sessions = [morningSession]
    mockCtx.deleteSession.mockReturnValue({
      ok: false,
      reason: "needs-confirmation",
      message: "Session has scheduled slots.",
    })
    render(<SessionManager />)

    // Click delete to open dialog
    fireEvent.click(screen.getByRole("button", { name: "Delete Morning" }))

    // Click the destructive confirm button
    const dialog = screen.getByRole("alertdialog")
    const confirmBtn = within(dialog).getByRole("button", { name: /Delete session and slots/i })
    fireEvent.click(confirmBtn)

    // deleteSession should be called with confirm=true
    expect(mockCtx.deleteSession).toHaveBeenCalledWith("ses-morning", true)
  })

  it("canceling the confirmation closes the dialog without calling deleteSession again (R3.9)", () => {
    mockCtx.sessions = [morningSession]
    mockCtx.deleteSession.mockReturnValue({
      ok: false,
      reason: "needs-confirmation",
      message: "Session has scheduled slots.",
    })
    render(<SessionManager />)

    // Click delete to open dialog
    fireEvent.click(screen.getByRole("button", { name: "Delete Morning" }))
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()

    // Click Cancel
    const dialog = screen.getByRole("alertdialog")
    const cancelBtn = within(dialog).getByRole("button", { name: /Cancel/i })
    fireEvent.click(cancelBtn)

    // Dialog should close
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    // deleteSession was only called once (the initial attempt, no confirm=true call)
    expect(mockCtx.deleteSession).toHaveBeenCalledTimes(1)
    expect(mockCtx.deleteSession).not.toHaveBeenCalledWith("ses-morning", true)
  })

  it("session is still listed after canceling deletion (R3.9)", () => {
    mockCtx.sessions = [morningSession]
    mockCtx.deleteSession.mockReturnValue({
      ok: false,
      reason: "needs-confirmation",
      message: "Session has scheduled slots.",
    })
    render(<SessionManager />)

    // Initiate delete
    fireEvent.click(screen.getByRole("button", { name: "Delete Morning" }))
    // Cancel
    const dialog = screen.getByRole("alertdialog")
    fireEvent.click(within(dialog).getByRole("button", { name: /Cancel/i }))

    // Session name still rendered
    expect(screen.getByText("Morning")).toBeInTheDocument()
  })

  it("SessionManager returns null (nothing rendered) when canManageConfig is false", () => {
    mockCtx.canManageConfig = false
    mockCtx.sessions = [morningSession]
    const { container } = render(<SessionManager />)

    // The component returns null for non-admin roles
    expect(container.firstChild).toBeNull()
  })

  it("shows empty sessions state when no sessions are defined", () => {
    mockCtx.sessions = []
    render(<SessionManager />)

    expect(screen.getByText(/No sessions defined yet/i)).toBeInTheDocument()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// ExamDateManager — delete-confirmation flow (R5.6, R5.7, R5.8)
// ─────────────────────────────────────────────────────────────────────────────

describe("ExamDateManager — delete-confirmation flow (R5.6, R5.7, R5.8)", () => {
  const testDate = "2026-07-14"

  it("removes a date directly (no confirmation) when it has no slots (R5.5)", () => {
    mockCtx.dates = [testDate]
    mockCtx.dateHasSlots.mockReturnValue(false)
    // Direct removal succeeds
    mockCtx.removeExamDate.mockReturnValue({ ok: true })
    render(<ExamDateManager />)

    fireEvent.click(screen.getByRole("button", { name: `Remove exam date ${testDate}` }))

    expect(mockCtx.removeExamDate).toHaveBeenCalledWith(testDate)
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
  })

  it("shows confirmation dialog when removeExamDate returns needs-confirmation (R5.6)", () => {
    mockCtx.dates = [testDate]
    mockCtx.dateHasSlots.mockReturnValue(true)
    mockCtx.removeExamDate.mockReturnValue({
      ok: false,
      reason: "needs-confirmation",
      message: "Date has scheduled slots.",
    })
    render(<ExamDateManager />)

    fireEvent.click(screen.getByRole("button", { name: `Remove exam date ${testDate}` }))

    const dialog = screen.getByRole("alertdialog")
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText(/Remove this exam date/i)).toBeInTheDocument()
  })

  it("confirmation dialog warns about associated slot deletion", () => {
    mockCtx.dates = [testDate]
    mockCtx.removeExamDate.mockReturnValue({
      ok: false,
      reason: "needs-confirmation",
      message: "Date has scheduled slots.",
    })
    render(<ExamDateManager />)

    fireEvent.click(screen.getByRole("button", { name: `Remove exam date ${testDate}` }))

    const dialog = screen.getByRole("alertdialog")
    expect(within(dialog).getByText(/scheduled exam slots/i)).toBeInTheDocument()
    expect(within(dialog).getByText(/cannot be undone/i)).toBeInTheDocument()
  })

  it("confirming calls removeExamDate with confirm=true and removes the date (R5.7)", () => {
    mockCtx.dates = [testDate]
    mockCtx.removeExamDate
      .mockReturnValueOnce({
        ok: false,
        reason: "needs-confirmation",
        message: "Date has scheduled slots.",
      })
      .mockReturnValueOnce({ ok: true })
    render(<ExamDateManager />)

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: `Remove exam date ${testDate}` }))

    // Confirm removal
    const dialog = screen.getByRole("alertdialog")
    const confirmBtn = within(dialog).getByRole("button", { name: /Remove date & slots/i })
    fireEvent.click(confirmBtn)

    // removeExamDate called with confirm=true on the second call
    expect(mockCtx.removeExamDate).toHaveBeenCalledTimes(2)
    expect(mockCtx.removeExamDate).toHaveBeenLastCalledWith(testDate, true)
  })

  it("canceling the confirmation keeps the dialog closed and does not confirm removal (R5.8)", () => {
    mockCtx.dates = [testDate]
    mockCtx.removeExamDate.mockReturnValue({
      ok: false,
      reason: "needs-confirmation",
      message: "Date has scheduled slots.",
    })
    render(<ExamDateManager />)

    // Open dialog
    fireEvent.click(screen.getByRole("button", { name: `Remove exam date ${testDate}` }))
    expect(screen.getByRole("alertdialog")).toBeInTheDocument()

    // Click Keep date (cancel)
    const dialog = screen.getByRole("alertdialog")
    const cancelBtn = within(dialog).getByRole("button", { name: /Keep date/i })
    fireEvent.click(cancelBtn)

    // Dialog should close
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument()
    // removeExamDate never called with confirm=true
    expect(mockCtx.removeExamDate).not.toHaveBeenCalledWith(testDate, true)
  })

  it("date is still listed after canceling removal (R5.8)", () => {
    mockCtx.dates = [testDate]
    mockCtx.removeExamDate.mockReturnValue({
      ok: false,
      reason: "needs-confirmation",
      message: "Date has scheduled slots.",
    })
    render(<ExamDateManager />)

    // Initiate remove
    fireEvent.click(screen.getByRole("button", { name: `Remove exam date ${testDate}` }))
    // Cancel
    const dialog = screen.getByRole("alertdialog")
    fireEvent.click(within(dialog).getByRole("button", { name: /Keep date/i }))

    // The date ISO value should still appear in the list
    expect(screen.getByText(testDate)).toBeInTheDocument()
  })

  it("shows empty-dates state when no dates are configured", () => {
    mockCtx.dates = []
    render(<ExamDateManager />)

    expect(screen.getByText("No exam dates yet")).toBeInTheDocument()
  })

  it("empty-dates state shows admin prompt when canManageConfig is true", () => {
    mockCtx.dates = []
    mockCtx.canManageConfig = true
    render(<ExamDateManager />)

    expect(screen.getByText(/Add a date above to start building the routine/i)).toBeInTheDocument()
  })

  it("empty-dates state shows neutral message when canManageConfig is false", () => {
    mockCtx.dates = []
    mockCtx.canManageConfig = false
    render(<ExamDateManager />)

    expect(screen.getByText(/No dates have been configured/i)).toBeInTheDocument()
  })

  it("add-date input and button are hidden when canManageConfig is false", () => {
    mockCtx.canManageConfig = false
    render(<ExamDateManager />)

    expect(screen.queryByLabelText("Add a date")).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Add date/i })).not.toBeInTheDocument()
  })

  it("remove buttons are hidden per-date when canManageConfig is false", () => {
    mockCtx.canManageConfig = false
    mockCtx.dates = [testDate]
    render(<ExamDateManager />)

    expect(
      screen.queryByRole("button", { name: `Remove exam date ${testDate}` }),
    ).not.toBeInTheDocument()
  })

  it("shows an error message when removeExamDate fails for a non-confirmation reason", () => {
    mockCtx.dates = [testDate]
    mockCtx.removeExamDate.mockReturnValue({
      ok: false,
      reason: "unauthorized",
      message: "You are not authorized to remove exam dates.",
    })
    render(<ExamDateManager />)

    fireEvent.click(screen.getByRole("button", { name: `Remove exam date ${testDate}` }))

    expect(screen.getByRole("alert")).toHaveTextContent("You are not authorized to remove exam dates.")
  })
})
