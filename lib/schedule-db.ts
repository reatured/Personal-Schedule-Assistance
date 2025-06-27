// lib/schedule-db.ts
// This file contains database operations for a single, auto-syncing user data bundle with Supabase.
// It handles reading (getUserData) and writing/updating (upsertUserData) user data.
import { supabase, isSupabaseAvailable } from "./supabase"
import type { UserScheduleBundle, DatabaseUserDataPayload, UserDataRow } from "@/types/schedule"

const APP_VERSION_FOR_DATA = "1.0.5" // Increment if data structure within UserScheduleBundle changes

// Helper function to check if user is authenticated
const checkAuth = async () => {
  if (!isSupabaseAvailable() || !supabase) {
    return {
      user: null,
      error: "Supabase is not configured. Please check your environment variables.",
    }
  }
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error) return { user: null, error: error.message }
    if (!user) return { user: null, error: "User not authenticated" }
    return { user, error: null }
  } catch (error: any) {
    return { user: null, error: error.message || "Authentication check failed" }
  }
}

// Get the user's single data bundle
export async function getUserData(): Promise<{ success: boolean; error?: string; dataBundle?: UserScheduleBundle }> {
  try {
    const { user, error: authError } = await checkAuth()
    if (authError || !user) {
      return { success: false, error: authError || "Authentication failed" }
    }

    if (!supabase) return { success: false, error: "Supabase client not available" }

    // Select the 'data' column from the 'user_data' table where user_id matches the current user's ID.
    // .single() means we expect at most one row.
    const { data, error } = await supabase
      .from("user_data")
      .select("data") // Only select the 'data' JSONB column which contains all our schedule data
      .eq("user_id", user.id)
      .single<UserDataRow>() // Expect a UserDataRow object or null

    if (error && error.code !== "PGRST116") {
      // PGRST116 means "Not found", which is not a true error; it means the user has no data yet.
      console.error("Error fetching user data:", error)
      return { success: false, error: error.message }
    }

    if (!data) {
      // No data found for this user yet
      return { success: true, dataBundle: undefined }
    }

    // Ensure data.data (the UserScheduleBundle) exists and is an object
    if (typeof data.data !== "object" || data.data === null) {
      console.error("Invalid data format fetched from database:", data.data)
      return { success: false, error: "Invalid data format stored in database" }
    }

    const fetchedBundle = data.data as DatabaseUserDataPayload
    // Ensure appVersion is part of the bundle, or add it
    if (!fetchedBundle.appVersion) {
      fetchedBundle.appVersion = APP_VERSION_FOR_DATA
    }
    // Here you could add data migration logic for fetchedBundle if fetchedBundle.appVersion < APP_VERSION_FOR_DATA

    return { success: true, dataBundle: fetchedBundle }
  } catch (error: any) {
    console.error("Unexpected error fetching user data:", error)
    return { success: false, error: error.message || "Fetch failed" }
  }
}

// Upsert: "Update or Insert" 的组合词。如果记录存在，则更新它；如果不存在，则插入新记录。
// Upsert: A combination of "Update or Insert." If a record exists, it's updated; if not, a new record is inserted.
export async function upsertUserData(dataBundle: UserScheduleBundle): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, error: authError } = await checkAuth()
    if (authError || !user) {
      return { success: false, error: authError || "Authentication failed" }
    }

    if (!supabase) return { success: false, error: "Supabase client not available" }

    // Ensure the bundle to save has the current app version and updated timestamp
    const bundleToSave: DatabaseUserDataPayload = {
      ...dataBundle,
      updatedAt: new Date().toISOString(), // Ensure updatedAt is fresh on every save
      appVersion: APP_VERSION_FOR_DATA,
    }

    // .upsert() will try to update the row where user_id matches. If not found, it inserts a new row.
    // 'onConflict: "user_id"' specifies that if user_id already exists, an update should occur.
    const { error } = await supabase
      .from("user_data")
      .upsert({ user_id: user.id, data: bundleToSave }, { onConflict: "user_id" })

    if (error) {
      console.error("Supabase upsert 用户数据时出错 (Supabase error upserting user data):", error)
      return {
        success: false,
        error: `Database error: ${error.message}${error.details ? ` (${error.details})` : ""}${error.hint ? ` Hint: ${error.hint}` : ""}`,
      }
    }
    console.log("User data upserted successfully for user:", user.id)
    return { success: true }
  } catch (error: any) {
    console.error("Unexpected error upserting user data:", error)
    return { success: false, error: `Unexpected error: ${error.message || "Unknown error"}` }
  }
}

// Migrate data from localStorage to database (this function is mainly for one-time migration of old data)
export async function migrateLocalStorageToDatabase(
  getInitialBundle: () => UserScheduleBundle,
): Promise<{ success: boolean; error?: string; migratedBundle?: UserScheduleBundle }> {
  try {
    if (!isSupabaseAvailable()) {
      console.log("Supabase not available, skipping migration")
      return { success: true }
    }

    const { user, error: authError } = await checkAuth()
    if (authError || !user) {
      console.log("User not authenticated, skipping migration")
      return { success: true }
    }

    if (typeof window === "undefined") return { success: true } // Run only on client

    const localDataString = localStorage.getItem("personal-schedule-builder-data") // Old local storage key
    if (!localDataString) {
      console.log("No local data to migrate.")
      return { success: true }
    }

    let localBundle: Partial<UserScheduleBundle> = {}
    try {
      const parsedLocal = JSON.parse(localDataString)
      // Adapt old local storage structure to UserScheduleBundle
      localBundle = {
        projects: parsedLocal.projects || [],
        schedule: parsedLocal.schedule || {},
        nextColorIndex: parsedLocal.nextColorIndex || 0,
        createdAt: new Date().toISOString(), // New timestamp
        updatedAt: new Date().toISOString(), // New timestamp
        appVersion: parsedLocal.version || APP_VERSION_FOR_DATA, // Use local version or current
      }
    } catch (parseError: any) {
      console.error("Error parsing localStorage data for migration:", parseError)
      return { success: false, error: "Invalid local data format" }
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

    console.log("Migrating local data to database as UserScheduleBundle...")
    const result = await upsertUserData(completeLocalBundle)

    if (result.success) {
      localStorage.removeItem("personal-schedule-builder-data") // Remove old local data after successful migration
      console.log("✅ Successfully migrated localStorage data to Supabase and removed local copy.")
      return { success: true, migratedBundle: completeLocalBundle }
    } else {
      console.error("❌ Failed to migrate localStorage data:", result.error)
      return { success: false, error: result.error }
    }
  } catch (error: any) {
    console.error("Error migrating localStorage data:", error)
    return { success: false, error: error.message || "Migration failed" }
  }
}
