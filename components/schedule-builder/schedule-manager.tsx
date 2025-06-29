// components/schedule-builder/schedule-manager.tsx
// Component for managing saved schedules (load, save, delete)
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { getUserSchedules, saveSchedule, deleteSchedule, type DatabaseSchedule } from "@/lib/schedule-db"
import type { Project, ScheduleData } from "@/types/schedule"
import { Save, Trash2, Download, Calendar, Clock, Star } from "lucide-react"

interface ScheduleManagerProps {
  currentProjects: Project[]
  currentScheduleData: ScheduleData
  currentNextColorIndex: number
  onLoadSchedule: (projects: Project[], scheduleData: ScheduleData, nextColorIndex: number) => void
  isOpen: boolean
  onClose: () => void
}

export function ScheduleManager({
  currentProjects,
  currentScheduleData,
  currentNextColorIndex,
  onLoadSchedule,
  isOpen,
  onClose,
}: ScheduleManagerProps) {
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<DatabaseSchedule[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newScheduleName, setNewScheduleName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // 加载用户的所有日程 (Load all user schedules)
  const loadSchedules = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    const result = await getUserSchedules()
    if (result.success && result.schedules) {
      setSchedules(result.schedules)
    } else {
      setError(result.error || "加载日程失败 (Failed to load schedules)")
    }

    setLoading(false)
  }

  useEffect(() => {
    if (isOpen && user) {
      loadSchedules()
    }
  }, [isOpen, user])

  // 保存当前日程 (Save current schedule)
  const handleSaveSchedule = async () => {
    if (!user || !newScheduleName.trim()) return

    setSaving(true)
    setError(null)
    setMessage(null)

    const result = await saveSchedule(
      newScheduleName.trim(),
      currentProjects,
      currentScheduleData,
      currentNextColorIndex,
      schedules.length === 0, // 如果是第一个日程，设为默认 (Set as default if it's the first schedule)
    )

    if (result.success) {
      setMessage("日程保存成功！(Schedule saved successfully!)")
      setNewScheduleName("")
      await loadSchedules() // 重新加载列表 (Reload the list)
    } else {
      setError(result.error || "保存失败 (Save failed)")
    }

    setSaving(false)
  }

  // 加载选中的日程 (Load selected schedule)
  const handleLoadSchedule = async (schedule: DatabaseSchedule) => {
    try {
      onLoadSchedule(schedule.data.projects, schedule.data.schedule, schedule.data.nextColorIndex)
      setMessage(`已加载日程: ${schedule.name} (Loaded schedule: ${schedule.name})`)
      setTimeout(() => {
        onClose()
      }, 1000)
    } catch (error) {
      setError("加载日程失败 (Failed to load schedule)")
    }
  }

  // 删除日程 (Delete schedule)
  const handleDeleteSchedule = async (scheduleId: string, scheduleName: string) => {
    if (!confirm(`确定要删除日程"${scheduleName}"吗？(Are you sure you want to delete "${scheduleName}"?)`)) {
      return
    }

    const result = await deleteSchedule(scheduleId)
    if (result.success) {
      setMessage("日程删除成功 (Schedule deleted successfully)")
      await loadSchedules() // 重新加载列表 (Reload the list)
    } else {
      setError(result.error || "删除失败 (Delete failed)")
    }
  }

  // 格式化日期 (Format date)
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            日程管理 (Schedule Manager)
          </CardTitle>
          <CardDescription>保存、加载和管理您的日程安排 (Save, load, and manage your schedules)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 overflow-y-auto max-h-[60vh]">
          {/* 保存新日程 (Save new schedule) */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">保存当前日程 (Save Current Schedule)</h3>
            <div className="flex gap-2">
              <Input
                placeholder="输入日程名称 (Enter schedule name)"
                value={newScheduleName}
                onChange={(e) => setNewScheduleName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveSchedule()}
              />
              <Button onClick={handleSaveSchedule} disabled={saving || !newScheduleName.trim()}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "保存中... (Saving...)" : "保存 (Save)"}
              </Button>
            </div>
          </div>

          {/* 错误和成功消息 (Error and success messages) */}
          {error && <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>}

          {message && <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">{message}</div>}

          {/* 已保存的日程列表 (Saved schedules list) */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">已保存的日程 (Saved Schedules)</h3>

            {loading ? (
              <div className="text-center py-8 text-gray-500">加载中... (Loading...)</div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无保存的日程 (No saved schedules)</div>
            ) : (
              <div className="grid gap-3">
                {schedules.map((schedule) => (
                  <Card key={schedule.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{schedule.name}</h4>
                          {schedule.is_default && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(schedule.updated_at)}
                            </span>
                            <span>{schedule.data.projects?.length || 0} 个项目 (projects)</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => handleLoadSchedule(schedule)}>
                          <Download className="mr-1 h-3 w-3" />
                          加载 (Load)
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteSchedule(schedule.id, schedule.name)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* 关闭按钮 (Close button) */}
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              关闭 (Close)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
