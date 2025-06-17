// components/schedule-builder/project-card.tsx
// This component displays a draggable project card.
// Ensured stopPropagation for delete button.
"use client"

import type React from "react"

import type { Project } from "@/types/schedule"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash2 } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { EditableField } from "./editable-field"

interface ProjectCardProps {
  project: Project
  isOverlay?: boolean
  onSubTaskToggle: (projectId: string, subTaskId: string) => void
  onProjectNameChange: (projectId: string, newName: string) => void
  onSubTaskTextChange: (projectId: string, subTaskId: string, newText: string) => void
  onAddSubTask: (projectId: string) => void
  onRemoveSubTask: (projectId: string, subTaskId: string) => void
  onRemoveProject: (projectId: string) => void
}

export function ProjectCard({
  project,
  isOverlay = false,
  onSubTaskToggle,
  onProjectNameChange,
  onSubTaskTextChange,
  onAddSubTask,
  onRemoveSubTask,
  onRemoveProject,
}: ProjectCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
    data: { type: "project", project },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.5 : 1,
    zIndex: isDragging || isOverlay ? 100 : "auto",
  }

  const handleAddNewSubTask = () => {
    onAddSubTask(project.id)
  }

  const handleDeleteProjectClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Crucial to prevent drag and allow button click
    onRemoveProject(project.id)
  }

  const handleAddSubTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent drag if CardContent is part of draggable area
    handleAddNewSubTask()
  }

  const handleSubTaskActionClick = (e: React.MouseEvent) => {
    e.stopPropagation() // For checkbox and sub-task delete
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`mb-2 touch-none ${isOverlay ? "shadow-xl" : "shadow-md"} ${project.color}`}
    >
      <CardHeader
        {...attributes}
        {...listeners}
        className={`flex flex-row items-center justify-between p-2 print:p-1 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div className="flex-grow" onClick={(e) => e.stopPropagation()}>
          {" "}
          {/* Stop propagation for the container of EditableField */}
          <EditableField
            initialValue={project.name}
            onSave={(newName) => onProjectNameChange(project.id, newName)}
            className="text-sm font-semibold"
            inputClassName="font-semibold"
          />
        </div>
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteProjectClick} // Use the new handler
            className="p-1 h-auto hover:bg-red-100 hover:text-red-600 print:hidden"
            aria-label="Remove project"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-2 bg-white text-gray-700 rounded-b-md print:p-1 pt-[8]">
        <ul className="space-y-1 mt-1 project-card-subtask-list-print-padding">
          {project.subTasks.map((subTask) => (
            <li key={subTask.id} className="text-xs flex items-center group" onClick={handleSubTaskActionClick}>
              <Checkbox
                id={`${project.id}-${subTask.id}`}
                checked={subTask.completed}
                onCheckedChange={() => onSubTaskToggle(project.id, subTask.id)}
                className="mr-2 print:transform print:scale-75"
              />
              <div className="flex-grow" onClick={(e) => e.stopPropagation()}>
                <EditableField
                  initialValue={subTask.text}
                  onSave={(newText) => onSubTaskTextChange(project.id, subTask.id, newText)}
                  className="flex-grow"
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveSubTask(project.id, subTask.id)}
                className="ml-1 p-0.5 h-auto opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-red-100 hover:text-red-600 print:hidden"
                aria-label="Remove sub-task"
              >
                <Trash2 size={12} />
              </Button>
            </li>
          ))}
        </ul>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddSubTaskClick}
          className="mt-2 w-full text-xs h-auto py-1 print:hidden"
        >
          <PlusCircle size={14} className="mr-1" /> Add Sub-task
        </Button>
      </CardContent>
    </Card>
  )
}
