// components/schedule-builder/editable-field.tsx
// A component for inline text editing.
// Added e.stopPropagation() to the onClick handler.
"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"

interface EditableFieldProps {
  initialValue: string
  onSave: (newValue: string) => void
  className?: string
  inputClassName?: string
  as?: "input" | "textarea"
}

export function EditableField({
  initialValue,
  onSave,
  className = "",
  inputClassName = "",
  as = "input",
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select()
      }
    }
  }, [isEditing])

  const handleSave = () => {
    if (value.trim() !== initialValue.trim() && value.trim() !== "") {
      onSave(value.trim())
    } else {
      setValue(initialValue)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !(e.shiftKey && as === "textarea")) {
      handleSave()
    } else if (e.key === "Escape") {
      setValue(initialValue)
      setIsEditing(false)
    }
  }

  const handleSpanClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation() // Prevent drag when clicking to edit
    setIsEditing(true)
  }

  if (isEditing) {
    const commonProps = {
      ref: inputRef as any,
      value: value,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      onClick: (e: React.MouseEvent) => e.stopPropagation(), // Also stop propagation on the input itself
      className: `text-sm ${inputClassName}`,
    }
    return as === "textarea" ? <textarea {...commonProps} rows={2} /> : <Input {...commonProps} />
  }

  return (
    <span onClick={handleSpanClick} className={`cursor-pointer hover:bg-gray-100 p-1 rounded ${className}`}>
      {value || "Click to edit"}
    </span>
  )
}
