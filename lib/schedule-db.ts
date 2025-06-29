// lib/schedule-db.ts
// Database operations for schedule management with Supabase
import { supabase, isSupabaseAvailable } from "./supabase"
import type { Project, ScheduleData } from "@/types/schedule"

// 数据库中存储的日程数据格式 (Schedule data format stored in database)
export interface DatabaseSchedule {
  id: string
  user_id: string
  name: string
  data: {
    version: string
    projects: Project[]
    schedule: ScheduleData
    nextColorIndex: number
  }
  version: string
  created_at: string
  updated_at: string
  is_default: boolean
}

// Helper function to check if user is authenticated
const checkAuth = async () => {
  if (!isSupabaseAvailable() || !supabase) {
    return { user: null, error: "Supabase is not configured. Please check your environment variables." }
  }

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      return { user: null, error: error.message }
    }

    if (!user) {
      return { user: null, error: "用户未登录 (User not authenticated)" }
    }

    return { user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message || "Authentication check failed" }
  }
}

// 保存日程到数据库 (Save schedule to database)
export async function saveSchedule(
  name: string,
  projects: Project[],
  scheduleData: ScheduleData,
  nextColorIndex: number,
  isDefault = false,
): Promise<{ success: boolean; error?: string; schedule?: DatabaseSchedule }> {
  try {
    const { user, error: authError } = await checkAuth()
    if (authError || !user) {
      return { success: false, error: authError || "Authentication failed" }
    }

    const schedulePayload = {
      user_id: user.id,
      name: name || "Untitled Schedule",
      data: {
        version: "1.0.4",
        projects: projects || [],
        schedule: scheduleData || {},
        nextColorIndex: nextColorIndex || 0,
      },
      version: "1.0.4",
      is_default: isDefault,
    }

    console.log("Saving schedule with payload:", schedulePayload)

    // 如果设置为默认，先取消其他默认日程 (If setting as default, unset other defaults first)
    if (isDefault && supabase) {
      const { error: updateError } = await supabase
        .from("schedules")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true)

      if (updateError) {
        console.warn("Warning: Could not unset other default schedules:", updateError)
      }
    }

    if (!supabase) {
      return { success: false, error: "Supabase client not available" }
    }

    const { data, error } = await supabase.from("schedules").insert(schedulePayload).select().single()

    if (error) {
      console.error("Supabase error saving schedule:", error)
      return {
        success: false,
        error: `Database error: ${error.message}${error.details ? ` (${error.details})` : ""}${error.hint ? ` Hint: ${error.hint}` : ""}`,
      }
    }

    console.log("Schedule saved successfully:", data)
    return { success: true, schedule: data }
  } catch (error: any) {
    console.error("Unexpected error saving schedule:", error)
    return { success: false, error: `Unexpected error: ${error.message || "Unknown error"}` }
  }
}

// 更新现有日程 (Update existing schedule)
export async function updateSchedule(
  scheduleId: string,
  name: string,
  projects: Project[],
  scheduleData: ScheduleData,
  nextColorIndex: number,
  isDefault?: boolean,
): Promise<{ success: boolean; error?: string; schedule?: DatabaseSchedule }> {
  try {
    const { user, error: authError } = await checkAuth()
    if (authError || !user) {
      return { success: false, error: authError || "Authentication failed" }
    }

    const updatePayload: any = {
      name: name || "Untitled Schedule",
      data: {
        version: "1.0.4",
        projects: projects || [],
        schedule: scheduleData || {},
        nextColorIndex: nextColorIndex || 0,
      },
      version: "1.0.4",
    }

    if (isDefault !== undefined) {
      updatePayload.is_default = isDefault

      // 如果设置为默认，先取消其他默认日程 (If setting as default, unset other defaults first)
      if (isDefault && supabase) {
        await supabase
          .from("schedules")
          .update({ is_default: false })
          .eq("user_id", user.id)
          .eq("is_default", true)
          .neq("id", scheduleId)
      }
    }

    if (!supabase) {
      return { success: false, error: "Supabase client not available" }
    }

    const { data, error } = await supabase
      .from("schedules")
      .update(updatePayload)
      .eq("id", scheduleId)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating schedule:", error)
      return { success: false, error: error.message }
    }

    return { success: true, schedule: data }
  } catch (error: any) {
    console.error("Error updating schedule:", error)
    return { success: false, error: error.message || "Update failed" }
  }
}

// 获取用户的所有日程 (Get all user schedules)
export async function getUserSchedules(): Promise<{
  success: boolean
  error?: string
  schedules?: DatabaseSchedule[]
}> {
  try {
    const { user, error: authError } = await checkAuth()
    if (authError || !user) {
      return { success: false, error: authError || "Authentication failed" }
    }

    if (!supabase) {
      return { success: false, error: "Supabase client not available" }
    }

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Error fetching schedules:", error)
      return { success: false, error: error.message }
    }

    return { success: true, schedules: data || [] }
  } catch (error: any) {
    console.error("Error fetching schedules:", error)
    return { success: false, error: error.message || "Fetch failed" }
  }
}

// 获取默认日程 (Get default schedule)
export async function getDefaultSchedule(): Promise<{ success: boolean; error?: string; schedule?: DatabaseSchedule }> {
  try {
    const { user, error: authError } = await checkAuth()
    if (authError || !user) {
      return { success: false, error: authError || "Authentication failed" }
    }

    if (!supabase) {
      return { success: false, error: "Supabase client not available" }
    }

    const { data, error } = await supabase
      .from("schedules")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_default", true)
      .single()

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "not found"
      console.error("Error fetching default schedule:", error)
      return { success: false, error: error.message }
    }

    return { success: true, schedule: data || undefined }
  } catch (error: any) {
    console.error("Error fetching default schedule:", error)
    return { success: false, error: error.message || "Fetch failed" }
  }
}

// 删除日程 (Delete schedule)
export async function deleteSchedule(scheduleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, error: authError } = await checkAuth()
    if (authError || !user) {
      return { success: false, error: authError || "Authentication failed" }
    }

    if (!supabase) {
      return { success: false, error: "Supabase client not available" }
    }

    const { error } = await supabase.from("schedules").delete().eq("id", scheduleId).eq("user_id", user.id)

    if (error) {
      console.error("Error deleting schedule:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("Error deleting schedule:", error)
    return { success: false, error: error.message || "Delete failed" }
  }
}

// 从本地存储迁移数据到数据库 (Migrate data from localStorage to database)
export async function migrateLocalStorageToDatabase(): Promise<{ success: boolean; error?: string }> {
  try {
    // 首先检查 Supabase 是否可用 (First check if Supabase is available)
    if (!isSupabaseAvailable()) {
      console.log("Supabase not available, skipping migration")
      return { success: true } // 不是错误，只是跳过迁移 (Not an error, just skip migration)
    }

    const { user, error: authError } = await checkAuth()
    if (authError || !user) {
      console.log("User not authenticated, skipping migration")
      return { success: true } // 用户未登录时跳过迁移 (Skip migration when user not logged in)
    }

    // 检查本地存储中是否有数据 (Check if there's data in localStorage)
    if (typeof window === "undefined") {
      return { success: true } // 服务器端渲染时跳过 (Skip during server-side rendering)
    }

    const localData = localStorage.getItem("personal-schedule-builder-data")
    if (!localData) {
      console.log("No local data to migrate")
      return { success: true } // 没有数据需要迁移 (No data to migrate)
    }

    try {
      const parsed = JSON.parse(localData)

      // 验证数据结构 (Validate data structure)
      if (!parsed.projects || !Array.isArray(parsed.projects)) {
        console.warn("Invalid local data structure, skipping migration")
        return { success: true }
      }

      console.log("Migrating local data to database...")

      // 保存为"从本地迁移"的日程 (Save as "Migrated from Local" schedule)
      const result = await saveSchedule(
        "从本地迁移 (Migrated from Local)",
        parsed.projects || [],
        parsed.schedule || {},
        parsed.nextColorIndex || 0,
        true, // 设为默认 (Set as default)
      )

      if (result.success) {
        // 迁移成功后清除本地存储 (Clear localStorage after successful migration)
        localStorage.removeItem("personal-schedule-builder-data")
        console.log("✅ Successfully migrated localStorage data to Supabase")
      } else {
        console.error("❌ Failed to migrate localStorage data:", result.error)
      }

      return result
    } catch (parseError: any) {
      console.error("Error parsing localStorage data:", parseError)
      return { success: false, error: "本地数据格式错误 (Invalid local data format)" }
    }
  } catch (error: any) {
    console.error("Error migrating localStorage data:", error)
    return { success: false, error: error.message || "Migration failed" }
  }
}
