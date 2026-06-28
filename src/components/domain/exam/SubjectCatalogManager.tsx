"use client"

/**
 * SubjectCatalogManager  (Feature: exam-routine-builder, Task 13.1)
 *
 * Admin-only view for the Subject_Catalog. Lets an Admin add / rename / delete
 * exam subjects and link / unlink the classes that take each subject. Every
 * mutating action routes through the exam-schedule context, which calls the
 * pure reducers in `src/lib/exam/subject-catalog.ts` and returns an
 * {@link OpResult}; this component surfaces the standard validation messages
 * (required-name / name-too-long / duplicate-name / already-linked /
 * class-not-linked) inline, always pairing status colour with a text label.
 *
 * Gated on `canManageConfig` (Requirement 10.1, 10.6): when the current role
 * may not manage configuration the management controls are hidden and the
 * catalog renders read-only.
 *
 * _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 10.1, 10.6_
 */

import { useState } from "react"
import {
  BookOpen, Plus, Pencil, Trash2, Check, X, Link2, Lock,
} from "lucide-react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useExamSchedule } from "@/context/exam-schedule-context"
import type { CatalogSubject } from "@/data/mock-exams"

/** A transient inline message attached to a subject row (or the add form). */
type RowMessage = { tone: "error" | "success"; text: string } | null

function MessageLine({ message }: { message: RowMessage }) {
  if (!message) return null
  const isError = message.tone === "error"
  return (
    <p
      role="status"
      className={cn(
        "flex items-center gap-1.5 text-xs font-medium",
        isError ? "text-destructive" : "text-[var(--ef-green-dark)]",
      )}
    >
      {isError ? <X className="size-3.5 shrink-0" /> : <Check className="size-3.5 shrink-0" />}
      {message.text}
    </p>
  )
}

/** One subject row: name (view / inline-rename), linked-class chips, actions. */
function SubjectRow({ subject }: { subject: CatalogSubject }) {
  const { renameSubject, deleteSubject, linkClass, unlinkClass, classGroups } = useExamSchedule()

  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(subject.name)
  const [message, setMessage] = useState<RowMessage>(null)

  function commitRename() {
    const res = renameSubject(subject.id, draftName)
    if (res.ok) {
      setEditing(false)
      setMessage(null)
    } else {
      setMessage({ tone: "error", text: res.message })
    }
  }

  function cancelRename() {
    setDraftName(subject.name)
    setEditing(false)
    setMessage(null)
  }

  function toggleClass(classId: string) {
    const linked = subject.linkedClassIds.includes(classId)
    const res = linked
      ? unlinkClass(subject.id, classId)
      : linkClass(subject.id, classId)
    if (res.ok) setMessage(null)
    else setMessage({ tone: "error", text: res.message })
  }

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={draftName}
              autoFocus
              maxLength={120}
              onChange={e => setDraftName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") commitRename()
                if (e.key === "Escape") cancelRename()
              }}
              aria-label={`Rename ${subject.name}`}
              className="h-8"
            />
            <Button size="icon-sm" variant="ghost" onClick={commitRename} aria-label="Save name">
              <Check className="size-4 text-[var(--ef-green-dark)]" />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={cancelRename} aria-label="Cancel rename">
              <X className="size-4 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <>
            <span className="flex items-center gap-2 text-sm font-semibold">
              <BookOpen className="size-4 text-primary" />
              {subject.name}
            </span>
            <div className="flex items-center gap-0.5">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => { setEditing(true); setDraftName(subject.name); setMessage(null) }}
                aria-label={`Rename ${subject.name}`}
              >
                <Pencil className="size-3.5" />
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    aria-label={`Delete ${subject.name}`}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete “{subject.name}”?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the subject and all of its class links from the catalog.
                      This cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      onClick={() => deleteSubject(subject.id)}
                    >
                      Delete subject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </div>

      {/* Linked classes — toggle chips */}
      <div className="flex flex-col gap-1.5">
        <span className="flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <Link2 className="size-3" /> Linked classes
        </span>
        <div className="flex flex-wrap gap-1.5">
          {classGroups.map(group => {
            const linked = subject.linkedClassIds.includes(group.id)
            return (
              <button
                key={group.id}
                type="button"
                onClick={() => toggleClass(group.id)}
                aria-pressed={linked}
                className={cn(
                  "rounded-md border px-2 py-1 text-xs font-medium transition-colors",
                  linked
                    ? "border-primary/40 bg-[var(--ef-brand-light)] text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:bg-muted",
                )}
              >
                {linked ? <Check className="mr-1 inline size-3" /> : <Plus className="mr-1 inline size-3" />}
                {group.name}
              </button>
            )
          })}
          {subject.linkedClassIds.length === 0 && (
            <span className="text-xs text-muted-foreground">No classes linked yet.</span>
          )}
        </div>
      </div>

      <MessageLine message={message} />
    </div>
  )
}

/** Read-only rendering of a subject (when the role may not manage config). */
function ReadOnlySubjectRow({ subject }: { subject: CatalogSubject }) {
  const { classGroups } = useExamSchedule()
  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-3">
      <span className="flex items-center gap-2 text-sm font-semibold">
        <BookOpen className="size-4 text-primary" />
        {subject.name}
      </span>
      <div className="flex flex-wrap gap-1.5">
        {subject.linkedClassIds.length === 0 ? (
          <span className="text-xs text-muted-foreground">No classes linked.</span>
        ) : (
          subject.linkedClassIds.map(id => {
            const group = classGroups.find(g => g.id === id)
            return (
              <Badge key={id} variant="secondary" className="text-[11px]">
                {group?.name ?? id}
              </Badge>
            )
          })
        )}
      </div>
    </div>
  )
}

export function SubjectCatalogManager() {
  const { catalog, addSubject, canManageConfig } = useExamSchedule()

  const [newName, setNewName] = useState("")
  const [addMessage, setAddMessage] = useState<RowMessage>(null)

  function handleAdd() {
    const res = addSubject(newName)
    if (res.ok) {
      setNewName("")
      setAddMessage({ tone: "success", text: "Subject added." })
    } else {
      setAddMessage({ tone: "error", text: res.message })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="size-5 text-primary" />
          Subject Catalog
        </CardTitle>
        <CardDescription>
          {canManageConfig
            ? "Add exam subjects and link each one to the classes that take it. The routine builder only offers a class the subjects it is linked to."
            : "Exam subjects and the classes linked to each. Only an administrator can change the catalog."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Add-subject form (admin only) */}
        {canManageConfig && (
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
            <span className="text-xs font-semibold text-muted-foreground">Add a subject</span>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Input
                  value={newName}
                  maxLength={120}
                  placeholder="e.g. Mathematics"
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleAdd() }}
                  aria-label="New subject name"
                />
              </div>
              <Button onClick={handleAdd} className="gap-1.5">
                <Plus className="size-4" /> Add
              </Button>
            </div>
            <MessageLine message={addMessage} />
          </div>
        )}

        {/* Read-only banner for non-admins */}
        {!canManageConfig && (
          <Alert>
            <Lock className="size-4" />
            <AlertDescription>
              You have read-only access to the subject catalog.
            </AlertDescription>
          </Alert>
        )}

        {/* Subject list */}
        {catalog.length === 0 ? (
          <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed py-8 text-center">
            <BookOpen className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No subjects yet</p>
            <p className="text-xs text-muted-foreground">
              {canManageConfig ? "Add your first exam subject above." : "The catalog is empty."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {catalog.map(subject =>
              canManageConfig
                ? <SubjectRow key={subject.id} subject={subject} />
                : <ReadOnlySubjectRow key={subject.id} subject={subject} />,
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
