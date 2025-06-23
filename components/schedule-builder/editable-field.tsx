// components/schedule-builder/editable-field.tsx
// A component for inline text editing.
// Fixes input interruption and text color issues.
"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input" // Assuming Input is from shadcn/ui

interface EditableFieldProps {
  initialValue: string
  onSave: (newValue: string) => void
  className?: string // For the span wrapper
  inputClassName?: string // For the input element itself
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
  // currentValue holds the live text being edited by the user.
  const [currentValue, setCurrentValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  // Effect to sync `initialValue` prop to `currentValue` state,
  // but ONLY when not actively editing. This prevents prop updates
  // from stomping on user input during an edit session.
  useEffect(() => {
    if (!isEditing) {
      setCurrentValue(initialValue)
    }
  }, [initialValue, isEditing])

  // Effect to focus the input when editing starts.
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      // For input type, select the text. For textarea, just focus.
      if (inputRef.current instanceof HTMLInputElement && as === "input") {
        inputRef.current.select()
      } else if (inputRef.current instanceof HTMLTextAreaElement && as === "textarea") {
        // For textarea, we might want to move cursor to end, but focus is usually enough.
        // inputRef.current.selectionStart = inputRef.current.selectionEnd = inputRef.current.value.length;
      }
    }
  }, [isEditing, as])

  const handleSpanClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    e.stopPropagation() // Prevent drag or other parent events
    // Ensure `currentValue` is up-to-date with `initialValue` when starting an edit.
    // This is important if `initialValue` changed while not editing.
    setCurrentValue(initialValue)
    setIsEditing(true)
  }

  const handleSave = () => {
    setIsEditing(false) // Exit editing mode first
    // Compare the trimmed current value with the trimmed initial prop value.
    // This ensures we save only if there's a meaningful change.
    if (currentValue.trim() !== initialValue.trim() && currentValue.trim() !== "") {
      onSave(currentValue.trim())
    }
    // If no change or value is empty, `currentValue` will be reset to `initialValue`
    // by the useEffect due to `isEditing` changing to false.
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !(e.shiftKey && as === "textarea")) {
      e.preventDefault() // Prevent default form submission if inside a form
      handleSave()
    } else if (e.key === "Escape") {
      // On Escape, revert `currentValue` to `initialValue` and stop editing.
      setCurrentValue(initialValue) // Revert displayed text immediately
      setIsEditing(false)
    }
  }

  if (isEditing) {
    const commonInputProps = {
      ref: inputRef,
      value: currentValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCurrentValue(e.target.value),
      onBlur: handleSave, // Save when input loses focus
      onKeyDown: handleKeyDown,
      onClick: (e: React.MouseEvent) => e.stopPropagation(), // Prevent parent clicks
      // Apply specific input styling, ensuring text is visible
      // text-neutral-900 for light mode, text-neutral-100 for dark mode
      className: `text-sm ${inputClassName} text-neutral-900 dark:text-neutral-100 bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-600 focus:ring-sky-500 focus:border-sky-500`,
    }

    return as === "textarea" ? <textarea {...commonInputProps} rows={2} /> : <Input {...commonInputProps} />
  }

  // Display mode: show initialValue (or placeholder)
  // The className prop applies to this span
  return (
    <span
      onClick={handleSpanClick}
      className={`cursor-pointer hover:bg-gray-500/10 p-0.5 rounded-sm ${className}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          handleSpanClick(e as any)
        }
      }}
    >
      {initialValue || <span className="text-gray-400 italic">Click to edit</span>}
    </span>
  )
}
