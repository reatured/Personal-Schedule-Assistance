// lib/schedule-api.ts
// Schedule API operations using the FastAPI backend
import { apiClient } from "./api-client"
import type { Project, ScheduleData } from "@/types/schedule"

// Database schedule format
export interface DatabaseSchedule {
  id: number
  user_id: number
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

// Save schedule to database
export async function saveSchedule(
  name: string,
  projects: Project[],
  scheduleData: ScheduleData,
  nextColorIndex: number,
  isDefault = false,
): Promise<{ success: boolean; error?: string; schedule?: DatabaseSchedule }> {
  try {
    const schedulePayload = {
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

    const result = await apiClient.createSchedule(schedulePayload)
    
    if (result.success && result.data) {
      console.log("Schedule saved successfully:", result.data)
      return { success: true, schedule: result.data }
    } else {
      console.error("Error saving schedule:", result.error)
      return { success: false, error: result.error || "Failed to save schedule" }
    }
  } catch (error: any) {
    console.error("Unexpected error saving schedule:", error)
    return { success: false, error: `Unexpected error: ${error.message || "Unknown error"}` }
  }
}

// Update existing schedule
export async function updateSchedule(
  scheduleId: number,
  name: string,
  projects: Project[],
  scheduleData: ScheduleData,
  nextColorIndex: number,
  isDefault?: boolean,
): Promise<{ success: boolean; error?: string; schedule?: DatabaseSchedule }> {
  try {
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
    }

    const result = await apiClient.updateSchedule(scheduleId, updatePayload)
    
    if (result.success && result.data) {
      return { success: true, schedule: result.data }
    } else {
      return { success: false, error: result.error || "Failed to update schedule" }
    }
  } catch (error: any) {
    console.error("Error updating schedule:", error)
    return { success: false, error: error.message || "Update failed" }
  }
}

// Get user's all schedules
export async function getUserSchedules(): Promise<{
  success: boolean
  error?: string
  schedules?: DatabaseSchedule[]
}> {
  try {
    const result = await apiClient.getSchedules()
    
    if (result.success && result.data) {
      return { success: true, schedules: result.data }
    } else {
      return { success: false, error: result.error || "Failed to fetch schedules" }
    }
  } catch (error: any) {
    console.error("Error fetching schedules:", error)
    return { success: false, error: error.message || "Failed to fetch schedules" }
  }
}

// Get default schedule
export async function getDefaultSchedule(): Promise<{ success: boolean; error?: string; schedule?: DatabaseSchedule }> {
  try {
    const result = await apiClient.getDefaultSchedule()
    
    if (result.success && result.data) {
      return { success: true, schedule: result.data }
    } else {
      return { success: false, error: result.error || "No default schedule found" }
    }
  } catch (error: any) {
    console.error("Error fetching default schedule:", error)
    return { success: false, error: error.message || "Failed to fetch default schedule" }
  }
}

// Delete schedule
export async function deleteSchedule(scheduleId: number): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await apiClient.deleteSchedule(scheduleId)
    
    if (result.success) {
      return { success: true }
    } else {
      return { success: false, error: result.error || "Failed to delete schedule" }
    }
  } catch (error: any) {
    console.error("Error deleting schedule:", error)
    return { success: false, error: error.message || "Failed to delete schedule" }
  }
}

// Migrate local storage to database (simplified version)
export async function migrateLocalStorageToDatabase(): Promise<{ success: boolean; error?: string }> {
  try {
    if (typeof window === "undefined") {
      return { success: false, error: "Cannot access localStorage on server side" }
    }

    const stored = localStorage.getItem("personal-schedule-builder-data")
    if (!stored) {
      return { success: true } // No local data to migrate
    }

    const parsed = JSON.parse(stored)
    if (!parsed.projects || !parsed.schedule) {
      return { success: true } // Invalid data, skip migration
    }

    // Save as default schedule
    const result = await saveSchedule(
      "Migrated Schedule",
      parsed.projects,
      parsed.schedule,
      parsed.nextColorIndex || 0,
      true
    )

    if (result.success) {
      // Clear local storage after successful migration
      localStorage.removeItem("personal-schedule-builder-data")
      return { success: true }
    } else {
      return { success: false, error: result.error }
    }
  } catch (error: any) {
    console.error("Error migrating local storage:", error)
    return { success: false, error: error.message || "Migration failed" }
  }
} 