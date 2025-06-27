// components/schedule-builder/debug-section.tsx
// Added "Export JSON" and "Import JSON" buttons.
"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react" // Added useRef
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Project, ScheduleData } from "@/types/schedule"
import { ClipboardCopy, Check, Trash2, Download, Upload } from "lucide-react" // Added Download, Upload

interface DebugDataFormat {
  version: string
  projects: Project[]
  schedule: ScheduleData
  nextColorIndex?: number
}

interface DebugSectionProps {
  projects: Project[]
  scheduleData: ScheduleData
  nextColorIndex: number
  onStateApply: (newData: DebugDataFormat) => void
  onClearAllData: () => void
  appVersion: string
}

export function DebugSection({
  projects,
  scheduleData,
  nextColorIndex,
  onStateApply,
  onClearAllData,
  appVersion,
}: DebugSectionProps) {
  const [jsonText, setJsonText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null) // Ref for file input

  const serializeState = useCallback(() => {
    const currentState: DebugDataFormat = {
      version: appVersion,
      projects,
      schedule: scheduleData,
      nextColorIndex,
    }
    return JSON.stringify(currentState, null, 2)
  }, [projects, scheduleData, nextColorIndex, appVersion])

  useEffect(() => {
    setJsonText(serializeState())
    setError(null)
  }, [serializeState])

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonText(event.target.value)
    setError(null)
  }

  const handleApplyJson = () => {
    try {
      const parsedData = JSON.parse(jsonText) as DebugDataFormat
      if (
        typeof parsedData === "object" &&
        parsedData !== null &&
        Array.isArray(parsedData.projects) &&
        typeof parsedData.schedule === "object" &&
        parsedData.schedule !== null
      ) {
        onStateApply(parsedData)
        setError(null)
      } else {
        throw new Error("Invalid data structure. Expected projects array and schedule object.")
      }
    } catch (e: any) {
      console.error("Error parsing or applying JSON:", e)
      setError(`Error applying JSON: ${e.message || "Invalid JSON format."}`)
    }
  }

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(jsonText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      setError(null)
    } catch (err) {
      console.error("Failed to copy JSON: ", err)
      setError("Failed to copy JSON to clipboard.")
    }
  }

  const handleClearDataConfirm = () => {
    if (window.confirm("Are you sure you want to clear all application data? This cannot be undone.")) {
      onClearAllData()
    }
  }

  const handleExportJson = () => {
    try {
      const blob = new Blob([jsonText], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `personal-schedule-data-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setError(null)
    } catch (err) {
      console.error("Failed to export JSON:", err)
      setError("Failed to export JSON data.")
    }
  }

  const handleImportButtonClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          // Basic validation if it's JSON-like, actual parsing happens on "Apply"
          JSON.parse(content) // Try parsing to catch immediate errors
          setJsonText(content)
          setError(null)
        } catch (err: any) {
          console.error("Error reading or parsing imported file:", err)
          setError(`Error importing file: ${err.message || "Invalid JSON file."}`)
          setJsonText("") // Clear textarea on error
        }
      }
      reader.onerror = () => {
        console.error("Error reading file.")
        setError("Error reading the selected file.")
        setJsonText("")
      }
      reader.readAsText(file)
    }
    // Reset file input to allow importing the same file again if needed
    if (event.target) {
      event.target.value = ""
    }
  }

  return (
    <div className="mt-8 p-4 bg-gray-800 text-gray-200 rounded-lg shadow-lg print:hidden">
      <h3 className="text-lg font-semibold mb-3">Debug State (JSON)</h3>
      <Textarea
        value={jsonText}
        onChange={handleTextChange}
        rows={15}
        className="w-full p-2 bg-gray-900 text-gray-100 border border-gray-700 rounded-md font-mono text-xs focus:ring-sky-500 focus:border-sky-500"
        placeholder="Paste your JSON data here or import a file..."
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button onClick={handleApplyJson} className="bg-sky-600 hover:bg-sky-700 text-white">
          Apply JSON to App
        </Button>
        <Button
          onClick={handleCopyJson}
          variant="outline"
          className="text-gray-300 border-gray-600 hover:bg-gray-700 bg-transparent"
        >
          {copied ? (
            <Check size={16} className="mr-1.5 text-green-400" />
          ) : (
            <ClipboardCopy size={16} className="mr-1.5" />
          )}
          {copied ? "Copied!" : "Copy All"}
        </Button>
        <Button
          onClick={handleExportJson}
          variant="outline"
          className="text-gray-300 border-gray-600 hover:bg-gray-700 bg-transparent"
        >
          <Download size={16} className="mr-1.5" />
          Export JSON
        </Button>
        <Button
          onClick={handleImportButtonClick}
          variant="outline"
          className="text-gray-300 border-gray-600 hover:bg-gray-700 bg-transparent"
        >
          <Upload size={16} className="mr-1.5" />
          Import JSON
        </Button>
        <input type="file" ref={fileInputRef} onChange={handleFileImport} accept=".json" style={{ display: "none" }} />
        <Button
          onClick={handleClearDataConfirm}
          variant="destructive"
          className="bg-red-700 hover:bg-red-800 text-white"
        >
          <Trash2 size={16} className="mr-1.5" />
          Clear All Data
        </Button>
      </div>
      {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
      <p className="mt-2 text-xs text-gray-400">
        Note: Modifying this JSON directly can lead to unexpected behavior if the structure is incorrect. The app state
        will update above when you click "Apply JSON to App". Changes made in the app above will automatically update
        this JSON view. For import, select a file and then click "Apply JSON to App".
      </p>
    </div>
  )
}
