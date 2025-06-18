// lib/schedule-db.ts
// 这个文件包含用于与 Supabase 进行单一、自动同步的用户数据包的数据库操作。
// 它处理用户数据的读取 (getUserData) 和写入/更新 (upsertUserData)。
// This file contains database operations for a single, auto-syncing user data bundle with Supabase.
// It handles reading (getUserData) and writing/updating (upsertUserData) user data.
import { supabase, isSupabaseAvailable } from "./supabase"
import type { UserScheduleBundle, DatabaseUserDataPayload, UserDataRow } from "@/types/schedule"

const APP_VERSION_FOR_DATA = "1.0.5" // 如果 UserScheduleBundle 内的数据结构发生变化，则增加此版本号
// Increment if data structure within UserScheduleBundle changes

// 辅助函数，检查用户是否已认证
// Helper function to check if user is authenticated
const checkAuth = async () => {
  if (!isSupabaseAvailable() || !supabase) {
    return {
      user: null,
      error:
        "Supabase 未配置。请检查您的环境变量。(Supabase is not configured. Please check your environment variables.)",
    }
  }
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) return { user: null, error: error.message }
    if (!user) return { user: null, error: "用户未登录 (User not authenticated)" }
    return { user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message || "认证检查失败 (Authentication check failed)" }
  }
}

// 获取用户的单一数据包
// Get the user's single data bundle
export async function getUserData(): Promise<{ success: boolean; error?: string; dataBundle?: UserScheduleBundle }> {
  try {
    const { user, error: authError } = await checkAuth()
    if (authError || !user) {
      return { success: false, error: authError || "认证失败 (Authentication failed)" }
    }

    if (!supabase) return { success: false, error: "Supabase 客户端不可用 (Supabase client not available)" }

    // 从 'user_data' 表中选择 'data' 列，条件是 user_id 匹配当前用户ID。
    // .single() 表示我们期望最多一行数据。
    // Select the 'data' column from the 'user_data' table where user_id matches the current user's ID.
    // .single() means we expect at most one row.
    const { data, error } = await supabase
      .from("user_data")
      .select("data") // 只选择包含我们所有日程数据的 'data' JSONB 列
      // Only select the 'data' JSONB column which contains all our schedule data
      .eq("user_id", user.id)
      .single<UserDataRow>() // 期望一个 UserDataRow 对象或 null
    // Expect a UserDataRow object or null

    if (error && error.code !== "PGRST116") {
      // PGRST116 表示 "未找到"，这不是一个真正的错误，意味着用户还没有数据。
      // PGRST116 means "Not found", which is not a true error; it means the user has no data yet.
      console.error("获取用户数据时出错 (Error fetching user data):", error)
      return { success: false, error: error.message }
    }

    if (!data) {
      // 未找到该用户的数据
      // No data found for this user yet
      return { success: true, dataBundle: undefined }
    }

    // 确保 data.data (即 UserScheduleBundle) 存在且是对象
    // Ensure data.data (the UserScheduleBundle) exists and is an object
    if (typeof data.data !== "object" || data.data === null) {
      console.error("从数据库获取的数据格式无效 (Invalid data format fetched from database):", data.data)
      return { success: false, error: "数据库中存储的数据格式无效 (Invalid data format stored in database)" }
    }

    const fetchedBundle = data.data as DatabaseUserDataPayload
    // 确保 appVersion 是包的一部分，如果不存在则添加
    // Ensure appVersion is part of the bundle, or add it
    if (!fetchedBundle.appVersion) {
      fetchedBundle.appVersion = APP_VERSION_FOR_DATA
    }
    // 如果 fetchedBundle.appVersion < APP_VERSION_FOR_DATA，可以在此处添加数据迁移逻辑
    // Here you could add data migration logic for fetchedBundle if fetchedBundle.appVersion < APP_VERSION_FOR_DATA

    return { success: true, dataBundle: fetchedBundle }
  } catch (error: any) {
    console.error("获取用户数据时发生意外错误 (Unexpected error fetching user data):", error)
    return { success: false, error: error.message || "获取失败 (Fetch failed)" }
  }
}

// 更新或插入用户的数据包 (Upsert)
// Upsert: "Update or Insert" 的组合词。如果记录存在，则更新它；如果不存在，则插入新记录。
// Upsert: A combination of "Update or Insert." If a record exists, it's updated; if not, a new record is inserted.
export async function upsertUserData(dataBundle: UserScheduleBundle): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, error: authError } = await checkAuth()
    if (authError || !user) {
      return { success: false, error: authError || "认证失败 (Authentication failed)" }
    }

    if (!supabase) return { success: false, error: "Supabase 客户端不可用 (Supabase client not available)" }

    // 确保要保存的包具有当前应用版本和更新的时间戳
    // Ensure the bundle to save has the current app version and updated timestamp
    const bundleToSave: DatabaseUserDataPayload = {
      ...dataBundle,
      updatedAt: new Date().toISOString(), // 确保每次保存都更新 updatedAt
      // Ensure updatedAt is fresh on every save
      appVersion: APP_VERSION_FOR_DATA,
    }

    // .upsert() 会尝试更新 user_id 匹配的行。如果找不到，则会插入一个新行。
    // 'onConflict: "user_id"' 指定如果 user_id 已存在，则应执行更新操作。
    // .upsert() will try to update the row where user_id matches. If not found, it inserts a new row.
    // 'onConflict: "user_id"' specifies that if user_id already exists, an update should occur.
    const { error } = await supabase
      .from("user_data")
      .upsert({ user_id: user.id, data: bundleToSave }, { onConflict: "user_id" })

    if (error) {
      console.error("Supabase upsert 用户数据时出错 (Supabase error upserting user data):", error)
      return {
        success: false,
        error: `数据库错误 (Database error): ${error.message}${error.details ? ` (${error.details})` : ""}${error.hint ? ` 提示 (Hint): ${error.hint}` : ""}`,
      }
    }
    console.log("用户数据已成功 upsert (User data upserted successfully for user):", user.id)
    return { success: true }
  } catch (error: any) {
    console.error("Upsert 用户数据时发生意外错误 (Unexpected error upserting user data):", error)
    return { success: false, error: `意外错误 (Unexpected error): ${error.message || "未知错误 (Unknown error)"}` }
  }
}

// 从本地存储迁移数据到数据库 (此函数主要用于一次性迁移旧数据)
// Migrate data from localStorage to database (this function is mainly for one-time migration of old data)
export async function migrateLocalStorageToDatabase(
  getInitialBundle: () => UserScheduleBundle,
): Promise<{ success: boolean; error?: string; migratedBundle?: UserScheduleBundle }> {
  try {
    if (!isSupabaseAvailable()) {
      console.log("Supabase 不可用，跳过迁移 (Supabase not available, skipping migration)")
      return { success: true }
    }

    const { user, error: authError } = await checkAuth()
    if (authError || !user) {
      console.log("用户未认证，跳过迁移 (User not authenticated, skipping migration)")
      return { success: true }
    }

    if (typeof window === "undefined") return { success: true } // 仅在客户端运行 (Run only on client)

    const localDataString = localStorage.getItem("personal-schedule-builder-data") // 旧的本地存储键 (Old local storage key)
    if (!localDataString) {
      console.log("没有本地数据需要迁移。(No local data to migrate.)")
      return { success: true }
    }

    let localBundle: Partial<UserScheduleBundle> = {}
    try {
      const parsedLocal = JSON.parse(localDataString)
      // 将旧的本地存储结构调整为 UserScheduleBundle
      // Adapt old local storage structure to UserScheduleBundle
      localBundle = {
        projects: parsedLocal.projects || [],
        schedule: parsedLocal.schedule || {},
        nextColorIndex: parsedLocal.nextColorIndex || 0,
        createdAt: new Date().toISOString(), // 新的时间戳 (New timestamp)
        updatedAt: new Date().toISOString(), // 新的时间戳 (New timestamp)
        appVersion: parsedLocal.version || APP_VERSION_FOR_DATA, // 使用本地版本或当前版本 (Use local version or current)
      }
    } catch (parseError: any) {
      console.error(
        "解析 localStorage 数据以进行迁移时出错 (Error parsing localStorage data for migration):",
        parseError,
      )
      return { success: false, error: "本地数据格式错误 (Invalid local data format)" }
    }

    const initialDefaults = getInitialBundle()
    const completeLocalBundle: UserScheduleBundle = {
      projects:
        localBundle.projects && localBundle.projects.length > 0 ? localBundle.projects : initialDefaults.projects,
      schedule:
        localBundle.schedule && Object.keys(localBundle.schedule).length > 0
          ? localBundle.schedule
          : initialDefaults.schedule,
      nextColorIndex:
        localBundle.nextColorIndex !== undefined ? localBundle.nextColorIndex : initialDefaults.nextColorIndex,
      createdAt: localBundle.createdAt || new Date().toISOString(),
      updatedAt: localBundle.updatedAt || new Date().toISOString(),
      appVersion: localBundle.appVersion || APP_VERSION_FOR_DATA,
    }

    console.log(
      "正在将本地数据迁移到数据库作为 UserScheduleBundle... (Migrating local data to database as UserScheduleBundle...)",
    )
    const result = await upsertUserData(completeLocalBundle)

    if (result.success) {
      localStorage.removeItem("personal-schedule-builder-data") // 成功迁移后删除旧的本地数据 (Remove old local data after successful migration)
      console.log(
        "✅ 已成功将 localStorage 数据迁移到 Supabase 并删除了本地副本。(Successfully migrated localStorage data to Supabase and removed local copy.)",
      )
      return { success: true, migratedBundle: completeLocalBundle }
    } else {
      console.error("❌ 迁移 localStorage 数据失败 (Failed to migrate localStorage data):", result.error)
      return { success: false, error: result.error }
    }
  } catch (error: any) {
    console.error("迁移 localStorage 数据时出错 (Error migrating localStorage data):", error)
    return { success: false, error: error.message || "迁移失败 (Migration failed)" }
  }
}
