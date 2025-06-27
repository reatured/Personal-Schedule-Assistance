// app/page.tsx
// Main page component with Supabase authentication and auto-syncing single user data bundle.
"use client"

import { useState, useCallback, useEffect, useRef } from "react"
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
import type { Project, ScheduledTask, ScheduleData, SubTask, UserScheduleBundle } from "@/types/schedule" // 确保类型导入正确
import { initialProjectsData as defaultInitialProjects, allTimeSlots } from "@/lib/schedule-data"
import { ProjectColumn } from "@/components/schedule-builder/project-column"
import { ScheduleColumn } from "@/components/schedule-builder/schedule-column"
import { ProjectCard } from "@/components/schedule-builder/project-card"
import { ScheduledItemCard } from "@/components/schedule-builder/scheduled-item-card"
import { Button } from "@/components/ui/button"
import { Printer, User, LogOut, AlertTriangle, Loader2 } from "lucide-react" // 添加 Loader2
import { DebugSection } from "@/components/schedule-builder/debug-section"
import { AuthModal } from "@/components/auth/auth-modal"
import { getUserData, upsertUserData, migrateLocalStorageToDatabase } from "@/lib/schedule-db" // 确保数据库操作函数导入正确
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { isSupabaseAvailable } from "@/lib/supabase"

const APP_DATA_VERSION = "1.0.5" // UserScheduleBundle 结构的版本号
const LOCAL_STORAGE_KEY = "personal-schedule-builder-data" // 用于迁移的旧密钥
const USER_DATA_LOCAL_STORAGE_KEY = "personal-schedule-user-bundle" // 未登录用户的新密钥

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

// 获取初始日程数据结构
// Gets the initial schedule data structure
const getInitialSchedule = (): ScheduleData => {
  const initialSchedule: ScheduleData = {}
  allTimeSlots.forEach((slot) => {
    initialSchedule[slot.id] = []
  })
  return initialSchedule
}

// 获取初始用户数据包
// Gets the initial user data bundle
const getInitialUserBundle = (): UserScheduleBundle => ({
  projects: JSON.parse(JSON.stringify(defaultInitialProjects)) as Project[], // 深拷贝默认项目 (Deep copy default projects)
  schedule: getInitialSchedule(),
  nextColorIndex: (JSON.parse(JSON.stringify(defaultInitialProjects)) as Project[]).length % projectColors.length,
  createdAt: new Date().toISOString(), // 客户端管理的时间戳 (Client-managed timestamp)
  updatedAt: new Date().toISOString(), // 客户端管理的时间戳 (Client-managed timestamp)
  appVersion: APP_DATA_VERSION,
})

// Debounce 函数：限制函数调用频率，用于自动保存等场景
// Debounce function: Limits the frequency of function calls, used for auto-save scenarios
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
  let timeout: NodeJS.Timeout | null = null

  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout)
      timeout = null
    }
    timeout = setTimeout(() => func(...args), waitFor)
  }

  return debounced as (...args: Parameters<F>) => ReturnType<F>
}

// 主应用组件
// Main app component
function ScheduleApp() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [currentUserData, setCurrentUserData] = useState<UserScheduleBundle | null>(null)
  const [dataLoaded, setDataLoaded] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [activeDraggedItem, setActiveDraggedItem] = useState<Project | ScheduledTask | null>(null)
  const [activeDraggedItemType, setActiveDraggedItemType] = useState<string | null>(null)
  const [activeParentSlotId, setActiveParentSlotId] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false) // 新增：用于显示保存状态的 state

  const MAX_TASKS_PER_SLOT = 3

  // Debounced 版本的 upsertUserData
  // Debounced version of upsertUserData
  const debouncedUpsertUserData = useRef(
    debounce(async (bundle: UserScheduleBundle) => {
      if (!user || !isSupabaseAvailable()) return
      setIsSaving(true) // 开始保存
      setSyncError(null) // 清除之前的错误
      console.log("Auto-saving data to Supabase for user:", user.id, bundle)
      const result = await upsertUserData(bundle)
      if (!result.success) {
        console.error("自动保存数据失败 (Failed to auto-save data):", result.error)
        setSyncError(`Auto-save failed: ${result.error}. Your changes might not be saved to the cloud.`)
      } else {
        console.log("数据已成功自动保存。(Data auto-saved successfully.)")
      }
      setIsSaving(false) // 完成保存
    }, 2000), // 2 秒防抖 (2 seconds debounce)
  ).current

  // 加载数据的逻辑
  // Data loading logic
  useEffect(() => {
    const loadData = async () => {
      setDataLoaded(false) // 开始加载时设置为 false
      if (authLoading) return

      let loadedBundle: UserScheduleBundle | undefined | null = null

      if (user && isSupabaseAvailable()) {
        console.log(
          "用户已登录，尝试从 Supabase 加载数据 (User logged in, attempting to load data from Supabase for user):",
          user.id,
        )
        // 1. 尝试迁移旧的 localStorage 数据（如果用户已登录）
        // 1. Try to migrate old localStorage data if user is logged in
        const migrationResult = await migrateLocalStorageToDatabase(getInitialUserBundle)
        if (!migrationResult.success && migrationResult.error) {
          console.error("迁移失败 (Migration failed):", migrationResult.error)
          setSyncError(`Data migration failed: ${migrationResult.error}`)
        }
        if (migrationResult.migratedBundle) {
          loadedBundle = migrationResult.migratedBundle
          console.log("数据已从 localStorage 迁移 (Data migrated from localStorage):", loadedBundle)
        } else {
          // 2. 如果没有迁移，则从 Supabase 获取
          // 2. If no migration, fetch from Supabase
          const dbResult = await getUserData()
          if (dbResult.success) {
            loadedBundle = dbResult.dataBundle
            console.log("从 Supabase 加载的数据 (Data loaded from Supabase):", loadedBundle)
            if (!loadedBundle) {
              console.log(
                "Supabase 中没有找到用户数据，将使用初始数据。(No user data found in Supabase, will use initial data.)",
              )
            }
          } else {
            console.error("从数据库加载用户数据时出错 (Error loading user data from DB):", dbResult.error)
            setSyncError(`Failed to load data from cloud: ${dbResult.error}`)
          }
        }
      } else if (typeof window !== "undefined") {
        // 3. 用户未登录或 Supabase 不可用，尝试新的本地存储密钥
        // 3. User not logged in or Supabase unavailable, try new local storage key
        console.log(
          "用户未登录或 Supabase 不可用，尝试从 localStorage 加载数据。(User not logged in or Supabase unavailable, attempting to load from localStorage.)",
        )
        const localDataString = localStorage.getItem(USER_DATA_LOCAL_STORAGE_KEY)
        if (localDataString) {
          try {
            loadedBundle = JSON.parse(localDataString) as UserScheduleBundle
            // 基本验证
            // Basic validation
            if (
              !loadedBundle.projects ||
              !loadedBundle.schedule ||
              typeof loadedBundle.nextColorIndex === "undefined"
            ) {
              console.warn(
                "本地存储的数据结构无效，将重置。(Invalid structure in local storage, will reset.)",
                loadedBundle,
              )
              loadedBundle = null // 结构无效
            } else {
              console.log("从 localStorage 加载的数据 (Data loaded from localStorage):", loadedBundle)
            }
          } catch (e) {
            console.error("解析本地用户数据包时出错 (Error parsing local user bundle):", e)
            loadedBundle = null
          }
        } else {
          console.log("localStorage 中没有找到用户数据。(No user data found in localStorage.)")
        }
      }

      // 4. 如果仍然没有数据，则使用默认值初始化
      // 4. If still no data, initialize with defaults
      if (!loadedBundle) {
        console.log("没有加载到数据，使用初始默认数据。(No data loaded, using initial default data.)")
        loadedBundle = getInitialUserBundle()
        if (!user && typeof window !== "undefined") {
          // 如果未登录，则将初始数据保存到本地
          // Save initial to local if not logged in
          localStorage.setItem(USER_DATA_LOCAL_STORAGE_KEY, JSON.stringify(loadedBundle))
          console.log("初始数据已保存到 localStorage。(Initial data saved to localStorage.)")
        }
      }

      // 确保时间戳存在
      // Ensure timestamps exist
      if (!loadedBundle.createdAt) loadedBundle.createdAt = new Date().toISOString()
      if (!loadedBundle.updatedAt) loadedBundle.updatedAt = new Date().toISOString()
      if (!loadedBundle.appVersion) loadedBundle.appVersion = APP_DATA_VERSION

      setCurrentUserData(loadedBundle)
      setDataLoaded(true)
      console.log("数据加载完成，当前数据 (Data loading complete, current data):", loadedBundle)
    }
    loadData()
  }, [user, authLoading]) // 依赖项：当 user 或 authLoading 状态改变时，重新加载数据
  // Dependencies: re-load data when user or authLoading state changes

  // 自动保存到 Supabase (针对已登录用户)
  // Auto-save to Supabase (for logged-in users)
  useEffect(() => {
    if (dataLoaded && user && currentUserData && isSupabaseAvailable()) {
      // 确保 currentUserData 不是初始加载时的 null
      // Ensure currentUserData is not null from initial load
      console.log("触发自动保存到 Supabase (Triggering auto-save to Supabase for user):", user.id)
      debouncedUpsertUserData(currentUserData)
    }
  }, [currentUserData, dataLoaded, user, debouncedUpsertUserData]) // 依赖项：当这些值改变时，尝试自动保存
  // Dependencies: attempt auto-save when these values change

  // 自动保存到本地存储 (针对未登录用户)
  // Auto-save to localStorage (for non-logged-in users)
  useEffect(() => {
    if (dataLoaded && !user && currentUserData && typeof window !== "undefined") {
      console.log("触发自动保存到 localStorage (Triggering auto-save to localStorage)")
      localStorage.setItem(USER_DATA_LOCAL_STORAGE_KEY, JSON.stringify(currentUserData))
    }
  }, [currentUserData, dataLoaded, user]) // 依赖项：当这些值改变时，尝试自动保存到本地
  // Dependencies: attempt auto-save to local when these values change

  // 更新当前用户数据的回调函数
  // Callback function to update current user data
  const updateCurrentUserData = useCallback((updater: (prev: UserScheduleBundle) => UserScheduleBundle) => {
    setCurrentUserData((prev) => {
      if (!prev) {
        console.warn(
          "尝试更新数据，但当前数据为 null。可能数据尚未加载。(Attempting to update data, but current data is null. Data might not be loaded yet.)",
        )
        return null // 如果 prev 是 null (数据未加载)，则不应发生 (Should not happen if dataLoaded)
      }
      const newState = updater(prev)
      console.log("数据已更新，新状态 (Data updated, new state):", newState)
      // 返回更新后的状态，并设置新的 updatedAt 时间戳
      // Return updated state with a new updatedAt timestamp
      return { ...newState, updatedAt: new Date().toISOString() }
    })
  }, []) // 空依赖数组，因为此函数本身不依赖外部变量来定义其行为
  // Empty dependency array as this function itself doesn't depend on external variables for its definition

  // --- 项目和子任务管理回调 ---
  // --- Project & Sub-task Management Callbacks ---
  const handleProjectNameChange = useCallback(
    (projectId: string, newName: string) => {
      updateCurrentUserData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === projectId ? { ...p, name: newName } : p)),
        schedule: Object.entries(prev.schedule).reduce((acc, [slotId, tasks]) => {
          acc[slotId] = tasks.map((task) => (task.projectId === projectId ? { ...task, projectName: newName } : task))
          return acc
        }, {} as ScheduleData),
      }))
    },
    [updateCurrentUserData],
  )

  const handleSubTaskTextChange = useCallback(
    (projectId: string, subTaskId: string, newText: string) => {
      const updateSubTasksList = (subTasks: SubTask[]) =>
        subTasks.map((st) => (st.id === subTaskId ? { ...st, text: newText } : st))
      updateCurrentUserData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, subTasks: updateSubTasksList(p.subTasks) } : p,
        ),
        schedule: Object.entries(prev.schedule).reduce((acc, [slotId, tasks]) => {
          acc[slotId] = tasks.map((task) =>
            task.projectId === projectId
              ? { ...task, originalProjectSubTasks: updateSubTasksList(task.originalProjectSubTasks) }
              : task,
          )
          return acc
        }, {} as ScheduleData),
      }))
    },
    [updateCurrentUserData],
  )

  const handleSubTaskToggle = useCallback(
    (projectId: string, subTaskId: string) => {
      const toggleSubTaskCompletion = (subTasks: SubTask[]) =>
        subTasks.map((st) => (st.id === subTaskId ? { ...st, completed: !st.completed } : st))
      updateCurrentUserData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, subTasks: toggleSubTaskCompletion(p.subTasks) } : p,
        ),
        schedule: Object.entries(prev.schedule).reduce((acc, [slotId, tasks]) => {
          acc[slotId] = tasks.map((task) =>
            task.projectId === projectId
              ? { ...task, originalProjectSubTasks: toggleSubTaskCompletion(task.originalProjectSubTasks) }
              : task,
          )
          return acc
        }, {} as ScheduleData),
      }))
    },
    [updateCurrentUserData],
  )

  const handleAddSubTask = useCallback(
    (projectId: string) => {
      const newSubTask: SubTask = { id: generateId(), text: "New Sub-task", completed: false }
      updateCurrentUserData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === projectId ? { ...p, subTasks: [...p.subTasks, newSubTask] } : p)),
      }))
    },
    [updateCurrentUserData],
  )

  const handleRemoveSubTask = useCallback(
    (projectId: string, subTaskId: string) => {
      updateCurrentUserData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) =>
          p.id === projectId ? { ...p, subTasks: p.subTasks.filter((st) => st.id !== subTaskId) } : p,
        ),
      }))
    },
    [updateCurrentUserData],
  )

  const handleAddNewProject = useCallback(() => {
    updateCurrentUserData((prev) => {
      const newProject: Project = {
        id: generateId(),
        name: "New Project",
        subTasks: [],
        color: projectColors[prev.nextColorIndex % projectColors.length],
      }
      return {
        ...prev,
        projects: [...prev.projects, newProject],
        nextColorIndex: prev.nextColorIndex + 1,
      }
    })
  }, [updateCurrentUserData])

  const handleRemoveProject = useCallback(
    (projectId: string) => {
      updateCurrentUserData((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== projectId),
        schedule: Object.entries(prev.schedule).reduce((acc, [slotId, tasks]) => {
          acc[slotId] = tasks.filter((task) => task.projectId !== projectId)
          return acc
        }, {} as ScheduleData),
      }))
    },
    [updateCurrentUserData],
  )

  const handleDeleteTaskFromSchedule = useCallback(
    (taskId: string, fromSlotId: string) => {
      updateCurrentUserData((prev) => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          [fromSlotId]: prev.schedule[fromSlotId].filter((t) => t.id !== taskId),
        },
      }))
    },
    [updateCurrentUserData],
  )

  // --- 拖放逻辑 ---
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

    if (!over || !currentUserData) return // 如果没有放置目标或数据未加载，则不执行任何操作

    const activeId = active.id as string
    const overId = over.id as string
    const activeType = active.data.current?.type
    const overData = over.data.current

    // 处理项目在项目列表内的重新排序
    // Handle reordering projects within the project list
    if (activeType === "project" && overData?.type === "project" && activeId !== overId) {
      updateCurrentUserData((prev) => ({
        ...prev,
        projects: arrayMove(
          prev.projects,
          prev.projects.findIndex((i) => i.id === activeId),
          prev.projects.findIndex((i) => i.id === overId),
        ),
      }))
    }
    // 处理将项目拖动到时间槽
    // Handle dragging a project to a time slot
    else if (activeType === "project" && overData?.type === "time-slot") {
      const project = active.data.current?.project as Project
      if (!project) return
      if ((currentUserData.schedule[overId] || []).length >= MAX_TASKS_PER_SLOT) {
        alert(
          `时间槽已满。无法添加超过 ${MAX_TASKS_PER_SLOT} 个任务。(Time slot is full. Cannot add more than ${MAX_TASKS_PER_SLOT} tasks.)`,
        )
        return
      }
      const newTask: ScheduledTask = {
        id: generateId(),
        projectId: project.id,
        projectName: project.name,
        projectColor: project.color,
        originalProjectSubTasks: project.subTasks.map((st) => ({ ...st })), // 复制子任务
      }
      updateCurrentUserData((prev) => ({
        ...prev,
        schedule: { ...prev.schedule, [overId]: [...(prev.schedule[overId] || []), newTask] },
      }))
    }
    // 处理在日程表内移动已安排的任务
    // Handle moving a scheduled task within the schedule
    else if (activeType === "scheduled-task" && overData?.type === "time-slot") {
      const task = active.data.current?.task as ScheduledTask
      const fromSlotId = active.data.current?.fromSlotId as string
      if (!task || !fromSlotId || fromSlotId === overId) return // 如果任务无效，或源槽与目标槽相同，则不执行任何操作
      if ((currentUserData.schedule[overId] || []).length >= MAX_TASKS_PER_SLOT) {
        alert(`目标时间槽已满。无法移动任务到此处。(Target time slot is full. Cannot move task here.)`)
        return
      }
      updateCurrentUserData((prev) => {
        const newSchedule = { ...prev.schedule }
        newSchedule[fromSlotId] = (newSchedule[fromSlotId] || []).filter((t) => t.id !== task.id) // 从源槽移除
        newSchedule[overId] = [...(newSchedule[overId] || []), task] // 添加到目标槽
        return { ...prev, schedule: newSchedule }
      })
    }
  }

  const handlePrint = () => window.print()

  // 处理调试状态应用（如果仍用于完整数据包导入，可能需要调整此函数）
  // Handle debug state apply (this function might need adaptation if debug section is still used for full bundle import)
  const handleDebugStateApply = useCallback((newData: Partial<UserScheduleBundle>) => {
    setCurrentUserData((prev) => {
      const base = prev || getInitialUserBundle() // Use previous state or initial if null
      return {
        projects: newData.projects || base.projects,
        schedule: newData.schedule || base.schedule,
        nextColorIndex: newData.nextColorIndex !== undefined ? newData.nextColorIndex : base.nextColorIndex,
        createdAt: newData.createdAt || base.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(), // Always set a fresh updatedAt
        appVersion: newData.appVersion || base.appVersion || APP_DATA_VERSION,
      }
    })
  }, [])

  // 处理清除所有数据
  // Handle clearing all data
  const handleClearAllData = useCallback(() => {
    if (
      window.confirm(
        "您确定要清除所有应用程序数据吗？此操作无法撤销。(Are you sure you want to clear all application data? This cannot be undone.)",
      )
    ) {
      const initialBundle = getInitialUserBundle()
      setCurrentUserData(initialBundle)
      if (!user && typeof window !== "undefined") {
        // 如果未登录，也清除本地存储
        // Also clear local storage if not logged in
        localStorage.removeItem(USER_DATA_LOCAL_STORAGE_KEY)
        console.log("所有数据已清除，本地存储也已清除。(All data cleared, local storage also cleared.)")
      } else if (user && isSupabaseAvailable()) {
        // 如果已登录，则将空数据保存到数据库
        // If logged in, save empty data to database
        console.log("清除所有数据并同步到 Supabase。(Clearing all data and syncing to Supabase.)")
        upsertUserData(initialBundle).then((result) => {
          if (!result.success) {
            setSyncError(`清除云端数据失败 (Failed to clear cloud data): ${result.error}`)
          } else {
            console.log("云端数据已成功清除。(Cloud data cleared successfully.)")
          }
        })
      }
    }
  }, [user]) // 依赖 user 状态

  // 处理登出
  // Handle sign out
  const handleSignOut = async () => {
    await signOut()
    setCurrentUserData(getInitialUserBundle()) // 登出后重置为默认值
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_DATA_LOCAL_STORAGE_KEY) // 登出后清除本地存储
      console.log(
        "用户已登出，数据已重置为默认值，本地存储已清除。(User signed out, data reset to defaults, local storage cleared.)",
      )
    }
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // 加载状态显示
  // Loading state display
  if (authLoading || !dataLoaded || !currentUserData) {
    return (
      <div className="min-h-screen bg-gray-200 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-900 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // 主界面渲染
  // Main interface rendering
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gray-200 p-2 print:p-0 print:bg-white">
        <header className="mb-4 flex justify-between items-center print:hidden">
          <h1 className="text-xl font-bold text-gray-800">Personal Schedule Builder (Auto-Sync)</h1>
          <div className="flex items-center gap-2">
            {isSaving && ( // 显示保存中状态
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Saving...</span>
              </div>
            )}
            {syncError && (
              <div title={syncError} className="text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">Save Error</span>
              </div>
            )}
            {user ? (
              <>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  <LogOut className="mr-1.5 h-4 w-4" /> Sign Out
                </Button>
                <span className="text-sm text-gray-600 hidden md:inline">{user.email}</span>
              </>
            ) : (
              <Button onClick={() => setShowAuthModal(true)} variant="outline" size="sm">
                <User className="mr-1.5 h-4 w-4" /> Login/Register
              </Button>
            )}
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="mr-1.5 h-4 w-4" /> Print
            </Button>
          </div>
        </header>

        <div className="print:max-w-[20cm] print:mx-auto">
          <main className="flex flex-col md:flex-row gap-3 print:flex-row print:gap-2">
            <ProjectColumn
              projects={currentUserData.projects}
              onSubTaskToggle={handleSubTaskToggle}
              onProjectNameChange={handleProjectNameChange}
              onSubTaskTextChange={handleSubTaskTextChange}
              onAddSubTask={handleAddSubTask}
              onRemoveSubTask={handleRemoveSubTask}
              onRemoveProject={handleRemoveProject}
              onAddNewProject={handleAddNewProject}
            />
            <ScheduleColumn scheduleData={currentUserData.schedule} onDeleteTask={handleDeleteTaskFromSchedule} />
          </main>
        </div>

        <div className="print:hidden mt-6">
          <DebugSection
            projects={currentUserData.projects}
            scheduleData={currentUserData.schedule}
            nextColorIndex={currentUserData.nextColorIndex}
            onStateApply={handleDebugStateApply} // 使用更新后的 handleDebugStateApply
            onClearAllData={handleClearAllData}
            appVersion={currentUserData.appVersion || APP_DATA_VERSION}
          />
          <div className="text-xs text-gray-500 mt-2 text-center">
            Created: {currentUserData.createdAt ? new Date(currentUserData.createdAt).toLocaleString() : "N/A"} | Last
            Updated: {currentUserData.updatedAt ? new Date(currentUserData.updatedAt).toLocaleString() : "N/A"} | Data
            Version: {currentUserData.appVersion || "Unknown"}
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />

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

// 包装组件，提供认证上下文
// Wrapper component providing auth context
export default function SchedulePage() {
  return (
    <AuthProvider>
      <ScheduleApp />
    </AuthProvider>
  )
}
