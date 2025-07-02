// components/schedule-builder/debug-section.tsx
// Added comprehensive JSON instructions and "Copy Instructions" button for ChatGPT prompts
"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import type { Project, ScheduleData } from "@/types/schedule"
import { ClipboardCopy, Check, Trash2, Download, Upload, BookOpen } from "lucide-react"

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
  const [instructionsCopied, setInstructionsCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleCopyInstructions = async () => {
    const instructionsText = `Please generate a JSON file for a personal schedule builder application. Here's what you need to know:

## APPLICATION OVERVIEW
This is a personal schedule builder that helps users organize projects and schedule them into specific time slots throughout the day. Users can create projects with sub-tasks and then drag these projects into time slots to create a daily schedule.

## JSON STRUCTURE EXPLANATION

### 1. ROOT OBJECT
The JSON has 4 main properties:
- \`version\`: Always use "1.0.3" (this is the current app version)
- \`projects\`: Array of project objects (the work items to be scheduled)
- \`schedule\`: Object that maps time slots to scheduled tasks
- \`nextColorIndex\`: Number for color cycling (usually 0-11)

### 2. PROJECTS ARRAY
Each project represents a work item or task group. Structure:
\`\`\`json
{
  "id": "unique-project-id",
  "name": "Human-readable project name",
  "color": "bg-[color]-500 text-white",
  "subTasks": [
    {
      "id": "unique-subtask-id",
      "text": "Sub-task description",
      "completed": false
    }
  ]
}
\`\`\`

### 3. SCHEDULE OBJECT
The schedule maps time slot IDs to arrays of scheduled tasks. Time slots are:

**Morning (8 AM - 12 PM):**
- slot-morning-08 (8:00-9:00 AM)
- slot-morning-09 (9:00-10:00 AM)
- slot-morning-10 (10:00-11:00 AM)
- slot-morning-11 (11:00 AM-12:00 PM)

**Afternoon (12 PM - 6 PM):**
- slot-afternoon-12 (12:00-1:00 PM)
- slot-afternoon-13 (1:00-2:00 PM)
- slot-afternoon-14 (2:00-3:00 PM)
- slot-afternoon-15 (3:00-4:00 PM)
- slot-afternoon-16 (4:00-5:00 PM)
- slot-afternoon-17 (5:00-6:00 PM)

**Evening (6 PM - 12 AM):**
- slot-evening-18 (6:00-7:00 PM)
- slot-evening-19 (7:00-8:00 PM)
- slot-evening-20 (8:00-9:00 PM)
- slot-evening-21 (9:00-10:00 PM)
- slot-evening-22 (10:00-11:00 PM)
- slot-evening-23 (11:00 PM-12:00 AM)

### 4. SCHEDULED TASK STRUCTURE
When a project is scheduled into a time slot:
\`\`\`json
{
  "id": "unique-scheduled-task-id",
  "projectId": "reference-to-original-project-id",
  "projectName": "Copy of project name",
  "projectColor": "Copy of project color",
  "originalProjectSubTasks": [/* Copy of project's subTasks array */]
}
\`\`\`

### 5. AVAILABLE COLORS
Use these exact color combinations:
- bg-blue-500 text-white
- bg-pink-500 text-white
- bg-amber-500 text-white
- bg-rose-500 text-white
- bg-sky-500 text-white
- bg-purple-500 text-white
- bg-green-500 text-white
- bg-fuchsia-500 text-white
- bg-teal-500 text-white
- bg-cyan-500 text-white
- bg-lime-500 text-white
- bg-orange-500 text-white

## EXAMPLE COMPLETE JSON
\`\`\`json
{
  "version": "1.0.3",
  "projects": [
    {
      "id": "marketing-campaign-2024",
      "name": "Q4 Marketing Campaign",
      "color": "bg-blue-500 text-white",
      "subTasks": [
        {
          "id": "social-media-content",
          "text": "Create social media posts",
          "completed": false
        },
        {
          "id": "email-templates",
          "text": "Design email templates",
          "completed": false
        },
        {
          "id": "analytics-setup",
          "text": "Set up tracking analytics",
          "completed": true
        }
      ]
    },
    {
      "id": "website-redesign",
      "name": "Company Website Redesign",
      "color": "bg-purple-500 text-white",
      "subTasks": [
        {
          "id": "user-research",
          "text": "Conduct user research",
          "completed": true
        },
        {
          "id": "wireframes",
          "text": "Create wireframes",
          "completed": false
        },
        {
          "id": "prototype",
          "text": "Build interactive prototype",
          "completed": false
        }
      ]
    }
  ],
  "schedule": {
    "slot-morning-09": [
      {
        "id": "scheduled-marketing-morning",
        "projectId": "marketing-campaign-2024",
        "projectName": "Q4 Marketing Campaign",
        "projectColor": "bg-blue-500 text-white",
        "originalProjectSubTasks": [
          {
            "id": "social-media-content",
            "text": "Create social media posts",
            "completed": false
          },
          {
            "id": "email-templates",
            "text": "Design email templates",
            "completed": false
          }
        ]
      }
    ],
    "slot-afternoon-14": [
      {
        "id": "scheduled-website-afternoon",
        "projectId": "website-redesign",
        "projectName": "Company Website Redesign",
        "projectColor": "bg-purple-500 text-white",
        "originalProjectSubTasks": [
          {
            "id": "wireframes",
            "text": "Create wireframes",
            "completed": false
          },
          {
            "id": "prototype",
            "text": "Build interactive prototype",
            "completed": false
          }
        ]
      }
    ]
  },
  "nextColorIndex": 2
}
\`\`\`

## GENERATION GUIDELINES
1. Create realistic, professional project names and sub-tasks
2. Use diverse colors from the available palette
3. Schedule projects logically (e.g., creative work in morning, meetings in afternoon)
4. Include 3-8 projects with 2-5 sub-tasks each
5. Schedule 40-60% of available time slots (don't fill every hour)
6. Make some sub-tasks completed (true) to show progress
7. Use descriptive, actionable sub-task names
8. Ensure all IDs are unique across the entire JSON

Please generate a complete JSON following this structure for a realistic work schedule.`

    try {
      await navigator.clipboard.writeText(instructionsText)
      setInstructionsCopied(true)
      setTimeout(() => setInstructionsCopied(false), 3000)
      setError(null)
    } catch (err) {
      console.error("Failed to copy instructions: ", err)
      setError("Failed to copy instructions to clipboard.")
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
          JSON.parse(content) // Try parsing to catch immediate errors
          setJsonText(content)
          setError(null)
        } catch (err: any) {
          console.error("Error reading or parsing imported file:", err)
          setError(`Error importing file: ${err.message || "Invalid JSON file."}`)
          setJsonText("")
        }
      }
      reader.onerror = () => {
        console.error("Error reading file.")
        setError("Error reading the selected file.")
        setJsonText("")
      }
      reader.readAsText(file)
    }
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
        placeholder={`Example JSON structure:
{
  "version": "1.0.3",
  "projects": [
    {
      "id": "proj-1",
      "name": "Marketing Campaign",
      "color": "bg-blue-500 text-white",
      "subTasks": [
        {
          "id": "task-1",
          "text": "Create ad copy",
          "completed": false
        }
      ]
    }
  ],
  "schedule": {
    "slot-morning-08": [
      {
        "id": "scheduled-1",
        "projectId": "proj-1",
        "projectName": "Marketing Campaign",
        "projectColor": "bg-blue-500 text-white",
        "originalProjectSubTasks": [...]
      }
    ]
  },
  "nextColorIndex": 1
}`}
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
          {copied ? "Copied!" : "Copy JSON"}
        </Button>
        <Button
          onClick={handleCopyInstructions}
          variant="outline"
          className="text-yellow-300 border-yellow-600 hover:bg-yellow-700 bg-transparent"
        >
          {instructionsCopied ? (
            <Check size={16} className="mr-1.5 text-green-400" />
          ) : (
            <BookOpen size={16} className="mr-1.5" />
          )}
          {instructionsCopied ? "Instructions Copied!" : "Copy with Instructions"}
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
      <div className="mt-3 p-3 bg-gray-900 rounded-md text-xs text-gray-300">
        <h4 className="font-semibold text-yellow-300 mb-2">📋 Quick Reference:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <strong className="text-blue-300">Time Slots:</strong>
            <br />• Morning: slot-morning-08 to 11
            <br />• Afternoon: slot-afternoon-12 to 17
            <br />• Evening: slot-evening-18 to 23
          </div>
          <div>
            <strong className="text-green-300">Required Fields:</strong>
            <br />• All objects need unique "id" fields
            <br />• Projects need name, color, subTasks
            <br />• Schedule tasks copy project data
          </div>
        </div>
        <div className="mt-2">
          <strong className="text-purple-300">Colors:</strong> bg-blue-500, bg-pink-500, bg-amber-500, bg-rose-500,
          bg-sky-500, bg-purple-500, bg-green-500, bg-fuchsia-500, bg-teal-500, bg-cyan-500, bg-lime-500, bg-orange-500
          (all with "text-white")
        </div>
        <div className="mt-2 pt-2 border-t border-gray-700">
          <strong className="text-yellow-300">💡 Tip:</strong> Click "Copy ChatGPT Instructions" to get a complete
          prompt you can paste directly into ChatGPT to generate realistic schedule data!
        </div>
      </div>
    </div>
  )
}
