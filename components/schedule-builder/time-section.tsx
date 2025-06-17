// components/schedule-builder/time-section.tsx
// 这个组件显示日程表的一个部分（上午、下午、傍晚）。
// This component displays a section of the schedule (Morning, Afternoon, Evening).
"use client"

import type { TimeSlot, ScheduleData } from "@/types/schedule"
import { TimeSlotRow } from "./time-slot-row"

interface TimeSectionProps {
  sectionName: string
  slots: TimeSlot[]
  scheduleData: ScheduleData
  bgColor: string
  onDeleteTask: (taskId: string, fromSlotId: string) => void
}

export function TimeSection({ sectionName, slots, scheduleData, bgColor, onDeleteTask }: TimeSectionProps) {
  return (
    <div className={`mb-6 rounded-lg shadow ${bgColor}`}>
      <h3 className="text-lg font-semibold p-3 border-b border-gray-300 text-gray-700">{sectionName}</h3>
      <div>
        {slots.map((slot) => (
          <TimeSlotRow key={slot.id} slot={slot} tasks={scheduleData[slot.id] || []} onDeleteTask={onDeleteTask} />
        ))}
      </div>
    </div>
  )
}
