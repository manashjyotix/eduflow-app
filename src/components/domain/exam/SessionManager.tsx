"use client"

/**
 * SessionManager  (Feature: exam-routine-builder · Task 13.2)
 *
 * Admin-only manager for school-defined named Sessions. A Session is a named
 * time block with a start and end time in 24-hour HH:MM form (end strictly
 * later than start). Sessions form the second axis of the routine column space
 * (Exam_Date × Session).
 *
 * Behaviour:
 *   - Lists every Session with its name and start–end time range.
 *   - Add / edit a Session via a name text input and two HH:MM time inputs,
 *     surfacing the standard OpResult validation messages (required-name,
 *     name-too-long, duplicate-name, invalid-time-range). (R3.1–3.6)
 *   - Delete a Session through the context's confirmable `deleteSession` API:
 *     when the Session has scheduled slots a shadcn `AlertDialog` confirmation
 *     is shown before deletion (R3.8); cancelling retains it (R3.9). When the
 *     Session has no slots it is deleted directly (R3.7).
 *   - All management controls are gated on `canManageConfig` (R10.6).
 *
 * All decision logic lives in the pure layer (`src/lib/exam/sessions.ts`) and
 * is reached only through the exam-schedule context.
 *
 * _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 10.6_
 */

import { useState } from "react"
import { Clock, Pencil, Plus, Trash2, X, Check, AlertTriangle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useExamSchedule } from "@/context/exam-schedule-context"
import type { ExamSession } from "@/data/mock-exams"
import type { SessionDraft } from "@/lib/exam/sessions"

const EMPTY_DRAFT: SessionDraft = { name: "", startTime: "", endTime: "" }

/** A draft row used by both the add form and the inline edit form. */
function SessionForm({
  draft, error, submitLabel, onChange, onSubmit, onCancel,
}: {
  draft: SessionDraft
  error: string | null
  submitLabel: string
  onChange: (patch: Partial<SessionDraft>) => void
  onSubmit: () => void
  onCancel?: () => void
}) {
  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="session-name">Session name</Label>
          <Input
            id="session-name"
            value={draft.name}
            maxLength={120}
            placeholder="e.g. Morning"
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="session-start">Start</Label>
          <Input
            id="session-start"
            type="time"
            value={draft.startTime}
            className="w-[7.5rem]"
            onChange={(e) => onChange({ startTime: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="session-end">End</Label>
          <Input
            id="session-end"
            type="time"
            value={draft.endTime}
            className="w-[7.5rem]"
            onChange={(e) => onChange({ endTime: e.target.value })}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-sm text-destructive">
          <AlertTriangle className="size-3.5 shrink-0" />
          {error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm">
          {submitLabel === "Add session" ? <Plus className="size-4" /> : <Check className="size-4" />}
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
            <X className="size-4" />
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

function formatRange(session: ExamSession) {
  return `${session.startTime} – ${session.endTime}`
}

export function SessionManager() {
  const {
    sessions, addSession, editSession, deleteSession, canManageConfig,
  } = useExamSchedule()

  // Add-form state.
  const [addDraft, setAddDraft] = useState<SessionDraft>(EMPTY_DRAFT)
  const [addError, setAddError] = useState<string | null>(null)

  // Inline-edit state.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<SessionDraft>(EMPTY_DRAFT)
  const [editError, setEditError] = useState<string | null>(null)

  // Delete-confirmation state (only used when the session has slots — R3.8).
  const [pendingDelete, setPendingDelete] = useState<ExamSession | null>(null)

  function handleAdd() {
    const res = addSession(addDraft)
    if (res.ok) {
      setAddDraft(EMPTY_DRAFT)
      setAddError(null)
    } else {
      setAddError(res.message)
    }
  }

  function startEdit(session: ExamSession) {
    setEditingId(session.id)
    setEditDraft({ name: session.name, startTime: session.startTime, endTime: session.endTime })
    setEditError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDraft(EMPTY_DRAFT)
    setEditError(null)
  }

  function handleEdit() {
    if (!editingId) return
    const res = editSession(editingId, editDraft)
    if (res.ok) {
      cancelEdit()
    } else {
      setEditError(res.message)
    }
  }

  /**
   * Attempt deletion through the confirmable API. When the session has slots the
   * context returns `needs-confirmation`; we open the AlertDialog and only then
   * call `deleteSession(id, true)`. When it has no slots it deletes directly.
   */
  function handleDelete(session: ExamSession) {
    const res = deleteSession(session.id)
    if (!res.ok && res.reason === "needs-confirmation") {
      setPendingDelete(session)
    }
  }

  function confirmDelete() {
    if (pendingDelete) deleteSession(pendingDelete.id, true)
    setPendingDelete(null)
  }

  if (!canManageConfig) {
    // R10.6: non-admin roles get no management affordances.
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          Exam Sessions
        </CardTitle>
        <CardDescription>
          Define the named time blocks (e.g. Morning, Afternoon) used by the routine grid.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-5">
        {/* Session list */}
        {sessions.length === 0 ? (
          <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
            No sessions defined yet. Add one below to start building the routine.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sessions.map((session) => (
              <li
                key={session.id}
                className={cn(
                  "rounded-lg border p-3",
                  editingId === session.id && "border-primary bg-primary/5",
                )}
              >
                {editingId === session.id ? (
                  <SessionForm
                    draft={editDraft}
                    error={editError}
                    submitLabel="Save changes"
                    onChange={(patch) => setEditDraft((d) => ({ ...d, ...patch }))}
                    onSubmit={handleEdit}
                    onCancel={cancelEdit}
                  />
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{session.name}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        {formatRange(session)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Edit ${session.name}`}
                        onClick={() => startEdit(session)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`Delete ${session.name}`}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(session)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Add form */}
        <div className="border-t pt-4">
          <p className="mb-3 text-sm font-medium">Add a session</p>
          <SessionForm
            draft={addDraft}
            error={addError}
            submitLabel="Add session"
            onChange={(patch) => setAddDraft((d) => ({ ...d, ...patch }))}
            onSubmit={handleAdd}
          />
        </div>
      </CardContent>

      {/* Delete confirmation — shown only when the session has scheduled slots (R3.8/3.9). */}
      <AlertDialog open={pendingDelete !== null} onOpenChange={(open) => { if (!open) setPendingDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{pendingDelete?.name}” session?</AlertDialogTitle>
            <AlertDialogDescription>
              This session has scheduled exam slots. Deleting it will also remove every
              exam slot in this session. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete session and slots
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

export default SessionManager
