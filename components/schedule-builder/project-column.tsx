// components/schedule-builder/project-column.tsx
// 这个组件显示项目列表，现在包含添加新项目的功能。
// This component displays the list of projects, now with add new project functionality.
"use client"

import type { Project } from "@/types/schedule"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { ProjectCard } from "./project-card"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

interface ProjectColumnProps {
  projects: Project[]
  onSubTaskToggle: (projectId: string, subTaskId: string) => void
  onProjectNameChange: (projectId: string, newName: string) => void
  onSubTaskTextChange: (projectId: string, subTaskId: string, newText: string) => void
  onAddSubTask: (projectId: string) => void
  onRemoveSubTask: (projectId: string, subTaskId: string) => void
  onRemoveProject: (projectId: string) => void
  onAddNewProject: () => void
}

export function ProjectColumn({
  projects,
  onSubTaskToggle,
  onProjectNameChange,
  onSubTaskTextChange,
  onAddSubTask,
  onRemoveSubTask,
  onRemoveProject,
  onAddNewProject,
}: ProjectColumnProps) {
  const projectIds = projects.map((p) => p.id)

  return (
    <div className="w-full md:w-[320px] p-3 bg-gray-100 rounded-lg shadow print:w-[35%] print:p-1 print:shadow-none print:border print:border-gray-300 lg:w-[360]">
      <div className="flex justify-between items-center mb-3 print:mb-1">
        <h2 className="text-lg font-semibold text-gray-700 print:text-base">项目列表</h2>
        <Button onClick={onAddNewProject} size="sm" className="print:hidden">
          <PlusCircle size={16} className="mr-1" /> New Project
        </Button>
      </div>
      <SortableContext items={projectIds} strategy={verticalListSortingStrategy}>
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onSubTaskToggle={onSubTaskToggle}
            onProjectNameChange={onProjectNameChange}
            onSubTaskTextChange={onSubTaskTextChange}
            onAddSubTask={onAddSubTask}
            onRemoveSubTask={onRemoveSubTask}
            onRemoveProject={onRemoveProject}
          />
        ))}
      </SortableContext>
      {projects.length === 0 && <p className="text-sm text-gray-500">没有可用的项目。</p>}
    </div>
  )
}
