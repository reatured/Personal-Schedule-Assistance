// types/schedule.ts
// 这个文件定义了我们应用中用到的数据类型。
// UserScheduleBundle 是用户完整数据集的主要结构。
// This file defines the data types used in our application.
// UserScheduleBundle is the primary structure for a user's entire dataset.

export interface SubTask {
  id: string
  text: string
  completed: boolean
}

export interface Project {
  id: string // 项目的唯一标识符 (Unique identifier for the project)
  name: string // 项目名称 (Project name)
  subTasks: SubTask[] // 项目包含的子任务列表 (List of sub-tasks included in the project)
  color: string // 用于显示项目的颜色 (Color used for displaying the project)
}

export interface ScheduledTask {
  id: string // 已安排任务的唯一标识符 (Unique identifier for the scheduled task)
  projectId: string // 关联的项目ID (Associated project ID)
  projectName: string // 项目名称 (Project name)
  projectColor: string // 项目颜色 (Project color)
  originalProjectSubTasks: SubTask[] // 项目的原始子任务 (Original sub-tasks of the project)
}

export interface TimeSlot {
  id: string // 时间段的唯一标识符, e.g., "morning-0800" (Unique identifier for the time slot)
  label: string // 显示的时间标签, e.g., "08:00 - 09:00" (Display time label)
  section: "morning" | "afternoon" | "evening" // 所属部分：上午、下午或傍晚 (Section it belongs to: morning, afternoon, or evening)
}

export type ScheduleData = Record<string, ScheduledTask[]> // 日程数据结构，键是时间段ID，值是该时间段的任务数组
// Schedule data structure, keys are time slot IDs, values are arrays of tasks for that slot

// 用户所有日程数据的集合包，包含客户端管理的时间戳
// Bundle for all of a user's schedule data, including client-managed timestamps
export interface UserScheduleBundle {
  projects: Project[]
  schedule: ScheduleData
  nextColorIndex: number
  createdAt: string | null // ISO 日期字符串，由客户端管理 (ISO date string, managed by client)
  updatedAt: string | null // ISO 日期字符串，由客户端管理 (ISO date string, managed by client)
  appVersion?: string // 可选：未来如果需要，用于客户端数据结构的版本控制 (Optional: for client-side data structure versioning if needed in the future)
}

// 数据库中 user_data 表的 'data' 字段的预期结构
// Expected structure for the 'data' field in the user_data table in the database
export interface DatabaseUserDataPayload extends UserScheduleBundle {}

// 数据库中 user_data 表的行结构
// Row structure for the user_data table in the database
export interface UserDataRow {
  user_id: string
  data: DatabaseUserDataPayload // The entire UserScheduleBundle is stored here
}
