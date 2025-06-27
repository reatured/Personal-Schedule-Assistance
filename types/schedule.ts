// types/schedule.ts
// This file defines the data types used in our application.
// UserScheduleBundle is the primary structure for a user's entire dataset.

export interface SubTask {
  id: string
  text: string
  completed: boolean
}

export interface Project {
  id: string // Unique identifier for the project
  name: string // Project name
  subTasks: SubTask[] // List of sub-tasks included in the project
  color: string // Color used for displaying the project
}

export interface ScheduledTask {
  id: string // Unique identifier for the scheduled task
  projectId: string // Associated project ID
  projectName: string // Project name
  projectColor: string // Project color
  originalProjectSubTasks: SubTask[] // Original sub-tasks of the project
}

export interface TimeSlot {
  id: string // Unique identifier for the time slot, e.g., "morning-0800"
  label: string // Display time label, e.g., "08:00 - 09:00"
  section: "morning" | "afternoon" | "evening" // Section it belongs to: morning, afternoon, or evening
}

export type ScheduleData = Record<string, ScheduledTask[]> // Schedule data structure, keys are time slot IDs, values are arrays of tasks for that slot
// Schedule data structure, keys are time slot IDs, values are arrays of tasks for that slot

// Bundle for all of a user's schedule data, including client-managed timestamps
export interface UserScheduleBundle {
  projects: Project[]
  schedule: ScheduleData
  nextColorIndex: number
  createdAt: string | null // ISO date string, managed by client
  updatedAt: string | null // ISO date string, managed by client
  appVersion?: string // Optional: for client-side data structure versioning if needed in the future
}

// Expected structure for the 'data' field in the user_data table in the database
export interface DatabaseUserDataPayload extends UserScheduleBundle {}

// Row structure for the user_data table in the database
export interface UserDataRow {
  user_id: string
  data: DatabaseUserDataPayload // The entire UserScheduleBundle is stored here
}
