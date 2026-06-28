"use client"

/**
 * ClassSectionManager
 *
 * Admin and management UI for configuring class groups and their sections.
 * Each class group (e.g. "Class IX") has one or more sections (e.g. A, B, C).
 * The exam routine is built at the class level — all sections share the same
 * schedule automatically.
 *
 * Gated on `canManageConfig` (admin only for add/delete; management can view).
 */

import { useState } from "react"
import {
  GraduationCap, Plus, Trash2, X, Check, Pencil, ChevronDown, ChevronUp,
} from "lucide-react"
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useExamSchedule } from "@/context/exam-schedule-context"
import type { ClassGroup } from "@/data/mock-exams"

// ─────────────────────────────────────────────────────────────────────────────
// Single class group row
// ─────────────────────────────────────────────────────────────────────────────

function ClassGroupRow({
  group,
  canEdit,
  onRename,
  onDelete,
  onAddSection,
  onRemoveSection,
}: {
  group: ClassGroup
  canEdit: boolean
  onRename: (id: string, name: string) => string | null
  onDelete: (id: string) => void
  onAddSection: (id: string, section: string) => string | null
  onRemoveSection: (id: string, section: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(group.name)
  const [nameError, setNameError] = useState<string | null>(null)
  const [sectionDraft, setSectionDraft] = useState("")
  const [sectionError, setSectionError] = useState<string | null>(null)

  function commitRename() {
    const err = onRename(group.id, draftName)
    if (err) { setNameError(err); return }
    setEditing(false)
    setNameError(null)
  }

  function cancelRename() {
    setDraftName(group.name)
    setEditing(false)
    setNameError(null)
  }

  function handleAddSection() {
    const err = onAddSection(group.id, sectionDraft)
    if (err) { setSectionError(err); return }
    setSectionDraft("")
    setSectionError(null)
  }

  return (
    <div className="rounded-lg border bg-card">
      {/* Header row */}
      <div className="flex items-center gap-2 p-3">
        <button
          onClick={() => setExpanded(v => !v)}
          className="flex flex-1 items-center gap-2 text-left"
          aria-expanded={expanded}
        >
          {expanded
            ? <ChevronUp className="size-4 text-muted-foreground" />
            : <ChevronDown className="size-4 text-muted-foreground" />}
          {editing ? null : (
            <span className="text-sm font-semibold">{group.name}</span>
          )}
        </button>

        {editing ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={draftName}
              autoFocus
              maxLength={80}
              onChange={e => setDraftName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") commitRename()
                if (e.key === "Escape") cancelRename()
              }}
              className="h-8"
              aria-label={`Rename ${group.name}`}
            />
            <Button size="icon-sm" variant="ghost" onClick={commitRename} aria-label="Save">
              <Check className="size-4 text-[var(--ef-green-dark,#1A6B30)]" />
            </Button>
            <Button size="icon-sm" variant="ghost" onClick={cancelRename} aria-label="Cancel">
              <X className="size-4 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="text-[11px]">
              {group.sections.length} section{group.sections.length !== 1 ? "s" : ""}
            </Badge>
            {canEdit && (
              <>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  onClick={() => { setEditing(true); setDraftName(group.name) }}
                  aria-label={`Rename ${group.name}`}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Delete ${group.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete "{group.name}"?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This removes the class and all its sections from the routine. Any exam
                        slots already scheduled for this class will also be removed. This cannot
                        be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        onClick={() => onDelete(group.id)}
                      >
                        Delete class
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
          </div>
        )}
      </div>

      {nameError && (
        <p className="px-3 pb-2 text-xs text-destructive">{nameError}</p>
      )}

      {/* Expanded section management */}
      {expanded && (
        <div className="border-t px-3 pb-3 pt-2.5 flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {group.sections.map(sec => (
              <span
                key={sec}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 text-xs font-medium"
              >
                {sec}
                {canEdit && group.sections.length > 1 && (
                  <button
                    onClick={() => onRemoveSection(group.id, sec)}
                    aria-label={`Remove section ${sec}`}
                    className="ml-0.5 text-muted-foreground hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                )}
              </span>
            ))}
          </div>

          {canEdit && (
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <Input
                  value={sectionDraft}
                  maxLength={10}
                  placeholder="New section (e.g. D)"
                  onChange={e => { setSectionDraft(e.target.value); setSectionError(null) }}
                  onKeyDown={e => { if (e.key === "Enter") handleAddSection() }}
                  className="h-7 text-xs"
                  aria-label="New section label"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs"
                  onClick={handleAddSection}
                  disabled={!sectionDraft.trim()}
                >
                  <Plus className="size-3" /> Add section
                </Button>
              </div>
              {sectionError && (
                <p className="text-xs text-destructive">{sectionError}</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export function ClassSectionManager() {
  const {
    classGroups, addClassGroup, renameClassGroup, deleteClassGroup,
    addSection, removeSection, canManageConfig,
  } = useExamSchedule()

  const [newClassName, setNewClassName] = useState("")
  const [newClassError, setNewClassError] = useState<string | null>(null)

  function handleAddClass() {
    const err = addClassGroup(newClassName)
    if (err) { setNewClassError(err); return }
    setNewClassName("")
    setNewClassError(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="size-5 text-primary" />
          Classes &amp; Sections
        </CardTitle>
        <CardDescription>
          {canManageConfig
            ? "Add classes (e.g. Nursery, Class VIII) and define their sections. The exam routine is built once per class — all sections share the same schedule."
            : "Classes and sections configured for this institution."}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {/* Add class form */}
        {canManageConfig && (
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
            <span className="text-xs font-semibold text-muted-foreground">Add a class</span>
            <p className="text-xs text-muted-foreground">
              Examples: Nursery, LKG, UKG, Class I, Class VIII, Grade 10, Form 4
            </p>
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <Input
                  value={newClassName}
                  maxLength={80}
                  placeholder="e.g. Class IX"
                  onChange={e => { setNewClassName(e.target.value); setNewClassError(null) }}
                  onKeyDown={e => { if (e.key === "Enter") handleAddClass() }}
                  aria-label="New class name"
                />
              </div>
              <Button onClick={handleAddClass} className="gap-1.5" disabled={!newClassName.trim()}>
                <Plus className="size-4" /> Add
              </Button>
            </div>
            {newClassError && (
              <p className="text-xs text-destructive">{newClassError}</p>
            )}
          </div>
        )}

        {/* Class list */}
        {classGroups.length === 0 ? (
          <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed py-8 text-center">
            <GraduationCap className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">No classes yet</p>
            <p className="text-xs text-muted-foreground">
              {canManageConfig ? "Add a class above to get started." : "No classes have been configured."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {[...classGroups]
              .sort((a, b) => a.order - b.order)
              .map(group => (
                <ClassGroupRow
                  key={group.id}
                  group={group}
                  canEdit={canManageConfig}
                  onRename={(id, name) => {
                    const err = renameClassGroup(id, name)
                    return err
                  }}
                  onDelete={deleteClassGroup}
                  onAddSection={(id, sec) => {
                    const err = addSection(id, sec)
                    return err
                  }}
                  onRemoveSection={removeSection}
                />
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
