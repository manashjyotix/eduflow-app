"use client"

/**
 * AvatarUpload — profile photo upload widget
 *
 * Displays a circular avatar with initials (or a real image once uploaded).
 * In edit mode shows an overlay with upload / camera icon and handles
 * file selection via a hidden <input type="file">.
 *
 * Props:
 *  initials     — 1–2 letter fallback (e.g. "AP")
 *  color        — Tailwind bg class for the initials circle (e.g. "bg-[#007AFF]")
 *  editing      — show upload overlay when true
 *  size?        — "sm" | "md" | "lg" (default "lg")
 */

import { useRef, useState } from "react"
import Image from "next/image"
import { Camera, Upload, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AvatarUploadProps {
  initials: string
  color: string
  editing: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

const SIZE_MAP = {
  sm: { outer: "size-14", text: "text-lg",  icon: "size-3",   overlay: "size-5" },
  md: { outer: "size-20", text: "text-2xl", icon: "size-3.5", overlay: "size-6" },
  lg: { outer: "size-28", text: "text-3xl", icon: "size-4",   overlay: "size-8" },
}

export function AvatarUpload({
  initials, color, editing, size = "lg", className,
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const sz = SIZE_MAP[size]

  function handleFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    handleFile(e.target.files?.[0])
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files?.[0])
  }

  return (
    <div className={cn("relative flex-shrink-0", className)}>
      {/* Circle */}
      <div
        className={cn(
          sz.outer,
          "relative rounded-full flex items-center justify-center text-white font-bold overflow-hidden ring-4 ring-background shadow-md",
          color,
          editing && "cursor-pointer group",
        )}
        onClick={() => editing && inputRef.current?.click()}
        onDragOver={e => { if (editing) { e.preventDefault(); setDragging(true) } }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        title={editing ? "Click or drag an image to upload" : undefined}
        role={editing ? "button" : undefined}
        tabIndex={editing ? 0 : undefined}
        aria-label={preview ? `Profile photo: ${initials}` : `Profile avatar: ${initials}`}
        onKeyDown={e => { if (editing && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); inputRef.current?.click() } }}
      >
        {preview ? (
          <Image
            src={preview}
            alt="Profile photo"
            fill
            unoptimized
            className="object-cover"
          />
        ) : (
          <span className={cn(sz.text, "font-bold select-none")} aria-hidden="true">{initials}</span>
        )}

        {/* Hover/drag overlay — only in edit mode */}
        {editing && (
          <div className={cn(
            "absolute inset-0 rounded-full flex flex-col items-center justify-center gap-1",
            "bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity",
            dragging && "opacity-100 bg-primary/60 ring-2 ring-primary",
          )} aria-hidden="true">
            <Camera className={cn(sz.icon, "text-white")} />
            <span className="text-white text-[10px] font-semibold">
              {dragging ? "Drop here" : "Change"}
            </span>
          </div>
        )}
      </div>

      {/* Remove button (only when a custom photo is uploaded) */}
      {editing && preview && (
        <button
          onClick={e => { e.stopPropagation(); setPreview(null) }}
          className="absolute -top-1 -right-1 size-5 rounded-full bg-destructive text-white flex items-center justify-center shadow-sm hover:bg-destructive/90 transition-colors"
          aria-label="Remove photo"
          title="Remove photo"
        >
          <X className="size-3" aria-hidden="true" />
        </button>
      )}

      {/* Upload badge (shown only when editing and no preview) */}
      {editing && !preview && (
        <button
          onClick={() => inputRef.current?.click()}
          className={cn(
            sz.overlay,
            "absolute bottom-0 right-0 rounded-full bg-primary text-white",
            "flex items-center justify-center border-2 border-background shadow-md",
            "hover:bg-primary/90 transition-colors",
          )}
          aria-label="Upload photo"
          title="Upload photo"
        >
          <Upload className={sz.icon} aria-hidden="true" />
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="sr-only"
        onChange={onInputChange}
        aria-label="Upload profile photo"
      />
    </div>
  )
}
