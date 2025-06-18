// app/page.tsx
// Main page component with Supabase authentication and database integration
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
import { Printer, User, LogOut, FolderOpen } from "lucide-react"
import { DebugSection } from "@/components/schedule-builder/debug-section"
import { AuthModal } from "@/components/auth/auth-modal"
import { ScheduleManager } from "@/components/schedule-builder/schedule-manager"
import { getDefaultSchedule, migrateLocalStorageToDatabase } from "@/lib/schedule-db"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { isSupabaseAvailable } from "@/lib/supabase"

const APP_VERSION = "1.0.4"
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

const getInitialProjects = () => JSON.parse(JSON.stringify(defaultInitialProjects)) as Project[]

const getInitialSchedule = (): ScheduleData => {
  const initialSchedule: ScheduleData = {}
  allTimeSlots.forEach((slot) => {
    initialSchedule[slot.id] = []
  })
  return initialSchedule
}

// 主应用组件 (Main app component)
function ScheduleApp() {
  const { user, loading: authLoading, signOut, isSupabaseEnabled } = useAuth()

  const [projects, setProjects] = useState<Project[]>(getInitialProjects)
  const [scheduleData, setScheduleData] = useState<ScheduleData>(getInitialSchedule)
  const [nextColorIndex, setNextColorIndex] = useState<number>(getInitialProjects().length % projectColors.length)

  const [activeDraggedItem, setActiveDraggedItem] = useState<Project | ScheduledTask | null>(null)
  const [activeDraggedItemType, setActiveDraggedItemType] = useState<string | null>(null)
  const [activeParentSlotId, setActiveParentSlotId] = useState<string | null>(null)

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showScheduleManager, setShowScheduleManager] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  // 加载数据的逻辑 (Data loading logic)
  useEffect(() => {
    const loadData = async () => {
      if (authLoading) return // 等待认证状态确定 (Wait for auth state to be determined)

      if (user && isSupabaseAvailable()) {
        // 用户已登录且 Supabase 可用，尝试迁移本地数据并加载默认日程
        // (User logged in and Supabase available, try to migrate local data and load default schedule)
        try {
          // 首先尝试迁移本地数据 (First try to migrate local data)
          const migrationResult = await migrateLocalStorageToDatabase()
          if (!migrationResult.success && migrationResult.error) {
            console.error("Migration failed:", migrationResult.error)
          }

          // 然后加载默认日程 (Then load default schedule)
          const result = await getDefaultSchedule()
          if (result.success && result.schedule) {
            setProjects(result.schedule.data.projects)
            setScheduleData(result.schedule.data.schedule)
            setNextColorIndex(result.schedule.data.nextColorIndex)
          }
        } catch (error) {
          console.error("Error loading user data:", error)
          // 如果云端加载失败，回退到本地存储 (If cloud loading fails, fallback to localStorage)
          loadFromLocalStorage()
        }
      } else {
        // 用户未登录或 Supabase 不可用，使用本地存储 (User not logged in or Supabase unavailable, use localStorage)
        loadFromLocalStorage()
      }

      setDataLoaded(true)
    }

    // Add helper function for loading from localStorage
    const loadFromLocalStorage = () => {
      if (typeof window === "undefined") return

      const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setProjects(parsed.projects || getInitialProjects())
          setScheduleData(parsed.schedule || getInitialSchedule())
          setNextColorIndex(parsed.nextColorIndex ?? getInitialProjects().length % projectColors.length)
        } catch (error) {
          console.error("Error loading from localStorage:", error)
          // 如果本地存储也失败，使用默认数据 (If localStorage also fails, use default data)
          setProjects(getInitialProjects())
          setScheduleData(getInitialSchedule())
          setNextColorIndex(getInitialProjects().length % projectColors.length)
        }
      }
    }

    loadData()
  }, [user, authLoading])

  // 自动保存到本地存储（仅在未登录时）(Auto-save to localStorage only when not logged in)
  useEffect(() => {
    if (!dataLoaded || user) return // 不在用户登录时保存到本地存储 (Don't save to localStorage when user is logged in)

    const dataToSave: LocalStorageData = {
      version: APP_VERSION,
      projects,
      schedule: scheduleData,
      nextColorIndex,
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dataToSave))
  }, [projects, scheduleData, nextColorIndex, dataLoaded, user])

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
      setProjects(newData.projects || [])
      setScheduleData(newData.schedule || getInitialSchedule())
      setNextColorIndex(newData.nextColorIndex !== undefined ? newData.nextColorIndex : 0)
    },
    [],
  )

  const handleClearAllData = useCallback(() => {
    setProjects(getInitialProjects())
    setScheduleData(getInitialSchedule())
    setNextColorIndex(getInitialProjects().length % projectColors.length)
    // 清除本地存储 (Clear local storage)
    if (typeof window !== "undefined" && !user) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY)
      } catch (error) {
        console.error("Error clearing localStorage:", error)
      }
    }
  }, [user])

  const handleLoadSchedule = useCallback(
    (newProjects: Project[], newScheduleData: ScheduleData, newNextColorIndex: number) => {
      setProjects(newProjects)
      setScheduleData(newScheduleData)
      setNextColorIndex(newNextColorIndex)
    },
    [],
  )

  const handleSignOut = async () => {
    await signOut()
    // 登出后重置为默认数据 (Reset to default data after sign out)
    setProjects(getInitialProjects())
    setScheduleData(getInitialSchedule())
    setNextColorIndex(getInitialProjects().length % projectColors.length)
  }

  if (authLoading || !dataLoaded) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中... (Loading...)</p>
        </div>
      </div>
    )
  }

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
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <Button onClick={() => setShowScheduleManager(true)} variant="outline" size="sm">
                  <FolderOpen className="mr-1.5 h-4 w-4" /> 管理日程 (Manage)
                </Button>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  <LogOut className="mr-1.5 h-4 w-4" /> 登出 (Sign Out)
                </Button>
                <span className="text-sm text-gray-600">{user.email}</span>
              </>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} variant="outline" size="sm">
                <User className="mr-1.5 h-4 w-4" /> 登录 (Login)
              </Button>
            )}
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
          </div>
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

      {/* Modals */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

      {user && (
        <ScheduleManager
          currentProjects={projects}
          currentScheduleData={scheduleData}
          currentNextColorIndex={nextColorIndex}
          onLoadSchedule={handleLoadSchedule}
          isOpen={showScheduleManager}
          onClose={() => setShowScheduleManager(false)}
        />
      )}

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

// 包装组件，提供认证上下文 (Wrapper component providing auth context)
export default function SchedulePage() {
  return (
    <AuthProvider>
      <ScheduleApp />
    </AuthProvider>
  )
}
