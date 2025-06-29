// app/page.tsx
// Main page component with local storage persistence and data migration.
"use client"

import { useState, useCallback, useEffect } from "react"
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  closestCorners,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable"
import type { Project, ScheduledTask, ScheduleData, SubTask } from "@/types/schedule"
import { initialProjectsData as defaultInitialProjects, allTimeSlots } from "@/lib/schedule-data"
import { ProjectColumn } from "@/components/schedule-builder/project-column"
import { ScheduleColumn } from "@/components/schedule-builder/schedule-column"
import { ProjectCard } from "@/components/schedule-builder/project-card"
import { ScheduledItemCard } from "@/components/schedule-builder/scheduled-item-card"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import { DebugSection } from "@/components/schedule-builder/debug-section"

const APP_VERSION = "1.0.3" // Incremented version for data migration feature
const MAX_TASKS_PER_SLOT = 3
const LOCAL_STORAGE_KEY = "personal-schedule-builder-data"
const generateId = () => crypto.randomUUID()

const projectColors = [
  "bg-blue-500 text-white",
  "bg-pink-500 text-white",
  "bg-amber-500 text-white",
  "bg-rose-500 text-white",
  "bg-sky-500 text-white",
  "bg-purple-500 text-white",
  "bg-green-500 text-white",
  "bg-fuchsia-500 text-white",
  "bg-teal-500 text-white",
  "bg-cyan-500 text-white",
  "bg-lime-500 text-white",
  "bg-orange-500 text-white",
]

// 本地存储数据格式 (Local storage data format)
interface LocalStorageData {
  version: string
  projects: Project[]
  schedule: ScheduleData
  nextColorIndex: number
}

// 数据迁移函数 (Data migration function)
const migrateData = (data: any): LocalStorageData => {
  // 如果没有版本信息，假设是最早版本 (If no version info, assume earliest version)
  const version = data.version || "1.0.0"

  const migratedData = { ...data }

  console.log(`Migrating data from version ${version} to ${APP_VERSION}`)

  // 版本 1.0.0 到 1.0.1 的迁移 (Migration from 1.0.0 to 1.0.1)
  if (version === "1.0.0") {
    // 在早期版本中，可能没有 nextColorIndex (Early versions might not have nextColorIndex)
    if (typeof migratedData.nextColorIndex !== "number") {
      migratedData.nextColorIndex = (migratedData.projects?.length || 0) % projectColors.length
    }

    // 确保所有项目都有颜色 (Ensure all projects have colors)
    if (Array.isArray(migratedData.projects)) {
      migratedData.projects = migratedData.projects.map((project: any, index: number) => ({
        ...project,
        color: project.color || projectColors[index % projectColors.length],
      }))
    }
  }

  // 版本 1.0.1 到 1.0.2 的迁移 (Migration from 1.0.1 to 1.0.2)
  if (version === "1.0.1") {
    // 在这个版本中添加了本地存储功能，但数据结构没有变化
    // (Local storage was added in this version, but data structure didn't change)
    console.log("No migration needed from 1.0.1 to 1.0.2")
  }

  // 版本 1.0.2 到 1.0.3 的迁移 (Migration from 1.0.2 to 1.0.3)
  if (version === "1.0.2") {
    // 在这个版本中添加了数据迁移功能，但数据结构没有变化
    // (Data migration was added in this version, but data structure didn't change)
    console.log("No migration needed from 1.0.2 to 1.0.3")
  }

  // 通用数据验证和修复 (General data validation and repair)

  // 确保 projects 是数组 (Ensure projects is an array)
  if (!Array.isArray(migratedData.projects)) {
    console.warn("Invalid projects data, resetting to defaults")
    migratedData.projects = getInitialProjects()
  }

  // 确保每个项目都有必需的字段 (Ensure each project has required fields)
  migratedData.projects = migratedData.projects.map((project: any, index: number) => ({
    id: project.id || generateId(),
    name: project.name || `Project ${index + 1}`,
    subTasks: Array.isArray(project.subTasks)
      ? project.subTasks.map((subTask: any) => ({
          id: subTask.id || generateId(),
          text: subTask.text || "Untitled Task",
          completed: Boolean(subTask.completed),
        }))
      : [],
    color: project.color || projectColors[index % projectColors.length],
  }))

  // 确保 schedule 是对象 (Ensure schedule is an object)
  if (typeof migratedData.schedule !== "object" || migratedData.schedule === null) {
    console.warn("Invalid schedule data, resetting to defaults")
    migratedData.schedule = getInitialSchedule()
  } else {
    // 验证和修复 schedule 数据 (Validate and repair schedule data)
    const validatedSchedule: ScheduleData = {}
    allTimeSlots.forEach((slot) => {
      const slotTasks = migratedData.schedule[slot.id]
      if (Array.isArray(slotTasks)) {
        validatedSchedule[slot.id] = slotTasks.map((task: any) => ({
          id: task.id || generateId(),
          projectId: task.projectId || generateId(),
          projectName: task.projectName || "Unknown Project",
          projectColor: task.projectColor || "bg-gray-500 text-white",
          originalProjectSubTasks: Array.isArray(task.originalProjectSubTasks)
            ? task.originalProjectSubTasks.map((subTask: any) => ({
                id: subTask.id || generateId(),
                text: subTask.text || "Untitled Task",
                completed: Boolean(subTask.completed),
              }))
            : [],
        }))
      } else {
        validatedSchedule[slot.id] = []
      }
    })
    migratedData.schedule = validatedSchedule
  }

  // 确保 nextColorIndex 是数字 (Ensure nextColorIndex is a number)
  if (typeof migratedData.nextColorIndex !== "number") {
    migratedData.nextColorIndex = (migratedData.projects?.length || 0) % projectColors.length
  }

  // 更新版本号 (Update version number)
  migratedData.version = APP_VERSION

  console.log("Data migration completed successfully")
  return migratedData as LocalStorageData
}

const getInitialProjects = () => JSON.parse(JSON.stringify(defaultInitialProjects)) as Project[]

const getInitialSchedule = (): ScheduleData => {
  const initialSchedule: ScheduleData = {}
  allTimeSlots.forEach((slot) => {
    initialSchedule[slot.id] = []
  })
  return initialSchedule
}

// 从本地存储加载数据 (Load data from local storage)
const loadFromLocalStorage = (): LocalStorageData | null => {
  if (typeof window === "undefined") return null

  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored)

    // 应用数据迁移 (Apply data migration)
    const migrated = migrateData(parsed)

    // 如果数据被迁移了，保存新版本 (If data was migrated, save the new version)
    if (migrated.version !== parsed.version) {
      console.log(`Data migrated from ${parsed.version || "unknown"} to ${migrated.version}`)
      saveToLocalStorage(migrated)
    }

    return migrated
  } catch (error) {
    console.error("Error loading from localStorage:", error)
    return null
  }
}

// 保存数据到本地存储 (Save data to local storage)
const saveToLocalStorage = (data: LocalStorageData) => {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error("Error saving to localStorage:", error)
  }
}

export default function SchedulePage() {
  // 初始化状态，优先使用本地存储的数据 (Initialize state, prioritizing local storage data)
  const [projects, setProjects] = useState<Project[]>(() => {
    const stored = loadFromLocalStorage()
    return stored?.projects || getInitialProjects()
  })

  const [scheduleData, setScheduleData] = useState<ScheduleData>(() => {
    const stored = loadFromLocalStorage()
    return stored?.schedule || getInitialSchedule()
  })

  const [nextColorIndex, setNextColorIndex] = useState<number>(() => {
    const stored = loadFromLocalStorage()
    return stored?.nextColorIndex ?? getInitialProjects().length % projectColors.length
  })

  const [activeDraggedItem, setActiveDraggedItem] = useState<Project | ScheduledTask | null>(null)
  const [activeDraggedItemType, setActiveDraggedItemType] = useState<string | null>(null)
  const [activeParentSlotId, setActiveParentSlotId] = useState<string | null>(null)

  // 自动保存到本地存储 (Auto-save to local storage)
  useEffect(() => {
    const dataToSave: LocalStorageData = {
      version: APP_VERSION,
      projects,
      schedule: scheduleData,
      nextColorIndex,
    }
    saveToLocalStorage(dataToSave)
  }, [projects, scheduleData, nextColorIndex])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // --- Project & Sub-task Management Callbacks ---
  const handleProjectNameChange = useCallback((projectId: string, newName: string) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, name: newName } : p)))
    setScheduleData((prev) => {
      const newSchedule = { ...prev }
      for (const slotId in newSchedule) {
        newSchedule[slotId] = newSchedule[slotId].map((task) =>
          task.projectId === projectId ? { ...task, projectName: newName } : task,
        )
      }
      return newSchedule
    })
  }, [])

  const handleSubTaskTextChange = useCallback((projectId: string, subTaskId: string, newText: string) => {
    const updateSubTasks = (subTasks: SubTask[]) =>
      subTasks.map((st) => (st.id === subTaskId ? { ...st, text: newText } : st))
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, subTasks: updateSubTasks(p.subTasks) } : p)))
    setScheduleData((prev) => {
      const newSchedule = { ...prev }
      for (const slotId in newSchedule) {
        newSchedule[slotId] = newSchedule[slotId].map((task) =>
          task.projectId === projectId
            ? { ...task, originalProjectSubTasks: updateSubTasks(task.originalProjectSubTasks) }
            : task,
        )
      }
      return newSchedule
    })
  }, [])

  const handleSubTaskToggle = useCallback((projectId: string, subTaskId: string) => {
    const toggleCompletion = (subTasks: SubTask[]) =>
      subTasks.map((st) => (st.id === subTaskId ? { ...st, completed: !st.completed } : st))
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, subTasks: toggleCompletion(p.subTasks) } : p)))
    setScheduleData((prev) => {
      const newSchedule = { ...prev }
      for (const slotId in newSchedule) {
        newSchedule[slotId] = newSchedule[slotId].map((task) =>
          task.projectId === projectId
            ? { ...task, originalProjectSubTasks: toggleCompletion(task.originalProjectSubTasks) }
            : task,
        )
      }
      return newSchedule
    })
  }, [])

  const handleAddSubTask = useCallback((projectId: string) => {
    const newSubTask: SubTask = { id: generateId(), text: "New Sub-task", completed: false }
    const updateAndReturnSubTasks = (subTasks: SubTask[]) => [...subTasks, newSubTask]
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, subTasks: updateAndReturnSubTasks(p.subTasks) } : p)),
    )
  }, [])

  const handleRemoveSubTask = useCallback((projectId: string, subTaskId: string) => {
    const filterSubTasks = (subTasks: SubTask[]) => subTasks.filter((st) => st.id !== subTaskId)
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, subTasks: filterSubTasks(p.subTasks) } : p)))
  }, [])

  const handleAddNewProject = useCallback(() => {
    const newProject: Project = {
      id: generateId(),
      name: "New Project",
      subTasks: [],
      color: projectColors[nextColorIndex % projectColors.length],
    }
    setProjects((prev) => [...prev, newProject])
    setNextColorIndex((prevIndex) => prevIndex + 1)
  }, [nextColorIndex])

  const handleRemoveProject = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId))
    setScheduleData((prev) => {
      const newSchedule = { ...prev }
      for (const slotId in newSchedule) {
        newSchedule[slotId] = newSchedule[slotId].filter((task) => task.projectId !== projectId)
      }
      return newSchedule
    })
  }, [])

  const handleDeleteTaskFromSchedule = useCallback((taskId: string, fromSlotId: string) => {
    setScheduleData((prev) => {
      const newSchedule = { ...prev }
      newSchedule[fromSlotId] = newSchedule[fromSlotId].filter((t) => t.id !== taskId)
      return newSchedule
    })
  }, [])

  // --- DND Logic ---
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const type = active.data.current?.type
    setActiveDraggedItemType(type)

    if (type === "project" && active.data.current?.project) {
      setActiveDraggedItem(active.data.current.project as Project)
    } else if (type === "scheduled-task" && active.data.current?.task) {
      setActiveDraggedItem(active.data.current.task as ScheduledTask)
      setActiveParentSlotId(active.data.current.fromSlotId as string)
    } else {
      setActiveDraggedItem(null)
      setActiveParentSlotId(null)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDraggedItem(null)
    setActiveDraggedItemType(null)
    setActiveParentSlotId(null)
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string
    const activeType = active.data.current?.type
    const overData = over.data.current

    if (activeType === "project" && overData?.type === "project" && activeId !== overId) {
      setProjects((items) =>
        arrayMove(
          items,
          items.findIndex((i) => i.id === activeId),
          items.findIndex((i) => i.id === overId),
        ),
      )
    } else if (activeType === "project" && overData?.type === "time-slot") {
      const project = active.data.current?.project as Project
      if (!project) return

      if ((scheduleData[overId] || []).length >= MAX_TASKS_PER_SLOT) {
        alert(`Time slot is full. Cannot add more than ${MAX_TASKS_PER_SLOT} tasks.`)
        return
      }

      const newTask: ScheduledTask = {
        id: generateId(),
        projectId: project.id,
        projectName: project.name,
        projectColor: project.color,
        originalProjectSubTasks: project.subTasks.map((st) => ({ ...st })),
      }
      setScheduleData((prev) => ({ ...prev, [overId]: [...(prev[overId] || []), newTask] }))
    } else if (activeType === "scheduled-task" && overData?.type === "time-slot") {
      const task = active.data.current?.task as ScheduledTask
      const fromSlotId = active.data.current?.fromSlotId as string
      if (!task || !fromSlotId) return
      if (fromSlotId === overId) return

      if ((scheduleData[overId] || []).length >= MAX_TASKS_PER_SLOT) {
        alert(`Target time slot is full. Cannot move task here.`)
        return
      }

      setScheduleData((prevSchedule) => {
        const newSchedule = { ...prevSchedule }
        newSchedule[fromSlotId] = (newSchedule[fromSlotId] || []).filter((t) => t.id !== task.id)
        newSchedule[overId] = [...(newSchedule[overId] || []), task]
        return newSchedule
      })
    }
  }

  const handlePrint = () => window.print()

  const handleDebugStateApply = useCallback(
    (newData: { version: string; projects: Project[]; schedule: ScheduleData; nextColorIndex?: number }) => {
      // 应用数据迁移到导入的数据 (Apply data migration to imported data)
      const migratedData = migrateData(newData)

      if (migratedData.version !== newData.version) {
        console.log(`Imported data migrated from ${newData.version || "unknown"} to ${migratedData.version}`)
        // 可以在这里显示一个通知给用户 (Could show a notification to the user here)
      }

      setProjects(migratedData.projects || [])
      setScheduleData(migratedData.schedule || getInitialSchedule())
      setNextColorIndex(migratedData.nextColorIndex !== undefined ? migratedData.nextColorIndex : 0)
    },
    [],
  )

  const handleClearAllData = useCallback(() => {
    setProjects(getInitialProjects())
    setScheduleData(getInitialSchedule())
    setNextColorIndex(getInitialProjects().length % projectColors.length)
    // 清除本地存储 (Clear local storage)
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY)
      } catch (error) {
        console.error("Error clearing localStorage:", error)
      }
    }
  }, [])

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-200 p-2 print:p-0 print:bg-white">
        <header className="mb-4 flex justify-between items-center print:hidden">
          <h1 className="text-xl font-bold text-gray-800">个人日程构建器</h1>
          <Button onClick={handlePrint} variant="outline" size="sm">
            <Printer className="mr-1.5 h-4 w-4" /> Print
          </Button>
        </header>
        {/* Wrapper for print layout control */}
        <div className="print:max-w-[20cm] print:mx-auto">
          <main className="flex flex-col md:flex-row gap-3 print:flex-row print:gap-2">
            <ProjectColumn
              projects={projects}
              onSubTaskToggle={handleSubTaskToggle}
              onProjectNameChange={handleProjectNameChange}
              onSubTaskTextChange={handleSubTaskTextChange}
              onAddSubTask={handleAddSubTask}
              onRemoveSubTask={handleRemoveSubTask}
              onRemoveProject={handleRemoveProject}
              onAddNewProject={handleAddNewProject}
            />
            <ScheduleColumn scheduleData={scheduleData} onDeleteTask={handleDeleteTaskFromSchedule} />
          </main>
        </div>

        <div className="print:hidden">
          <DebugSection
            projects={projects}
            scheduleData={scheduleData}
            nextColorIndex={nextColorIndex}
            onStateApply={handleDebugStateApply}
            onClearAllData={handleClearAllData}
            appVersion={APP_VERSION}
          />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeDraggedItem && activeDraggedItemType === "project" && (
          <ProjectCard
            project={activeDraggedItem as Project}
            isOverlay
            onSubTaskToggle={() => {}}
            onProjectNameChange={() => {}}
            onSubTaskTextChange={() => {}}
            onAddSubTask={() => {}}
            onRemoveSubTask={() => {}}
            onRemoveProject={() => {}}
          />
        )}
        {activeDraggedItem && activeDraggedItemType === "scheduled-task" && activeParentSlotId && (
          <ScheduledItemCard task={activeDraggedItem as ScheduledTask} parentSlotId={activeParentSlotId} isOverlay />
        )}
      </DragOverlay>
    </DndContext>
  )
}
