// components/schedule-builder/schedule-column.tsx
// 这个组件显示包含时间段的日程列。
// This component displays the schedule column with time sections.
"use client"

import type { ScheduleData } from "@/types/schedule"
import { timeSections as sectionsConfig } from "@/lib/schedule-data"
import { TimeSection } from "./time-section"

interface ScheduleColumnProps {
  scheduleData: ScheduleData
  onDeleteTask: (taskId: string, fromSlotId: string) => void
}

export function ScheduleColumn({ scheduleData, onDeleteTask }: ScheduleColumnProps) {
  return (
    <div className="w-full md:flex-1 p-3 bg-white rounded-lg shadow print:flex-1 print:p-1 print:shadow-none print:border print:border-gray-300">
      <h2 className="text-lg font-semibold mb-3 text-gray-700 print:text-base print:mb-1">Schedule</h2>
      {Object.entries(sectionsConfig).map(([key, sectionDetails]) => (
        <TimeSection
          key={key}
          sectionName={sectionDetails.name}
          slots={sectionDetails.slots}
          scheduleData={scheduleData}
          bgColor={sectionDetails.bgColor}
          onDeleteTask={onDeleteTask}
        />
      ))}
    </div>
  )
}
