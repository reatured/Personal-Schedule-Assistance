// components/schedule-builder/time-slot-row.tsx
// 这个组件代表日程表中的一个可放置的小时行。
// This component represents a droppable hourly row in the schedule.
// Added print-specific styles for compactness.
"use client"

import type { TimeSlot, ScheduledTask } from "@/types/schedule"
import { useDroppable } from "@dnd-kit/core"
import { ScheduledItemCard } from "./scheduled-item-card"

interface TimeSlotRowProps {
  slot: TimeSlot
  tasks: ScheduledTask[]
  onDeleteTask: (taskId: string, fromSlotId: string) => void
}

export function TimeSlotRow({ slot, tasks, onDeleteTask }: TimeSlotRowProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: slot.id, // dnd-kit ID for droppable areas
    data: {
      type: "time-slot", // 自定义数据类型 (Custom data type)
      accepts: ["project", "scheduled-task"], // 定义此区域接受哪些类型的可拖动项 (Defines what types of draggables this area accepts)
    },
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex border-b border-gray-200 min-h-[60px] print:min-h-0 print:h-auto ${
        isOver ? "bg-gray-200 outline outline-2 outline-sky-500" : ""
      }`}
    >
      <div className="w-1/4 p-2 border-r border-gray-200 text-xs text-gray-600 flex items-center justify-center print:p-0.5 print:text-[6.5pt] print:leading-tight">
        {slot.label}
      </div>
      <div className="w-3/4 p-2 space-y-1 print:p-0.5 print:space-y-px">
        {tasks.map((task) => (
          <ScheduledItemCard key={task.id} task={task} parentSlotId={slot.id} onDelete={onDeleteTask} />
        ))}
        {tasks.length === 0 && isOver && (
          <div className="text-xs text-gray-400 p-2 border-2 border-dashed border-gray-300 rounded-md text-center print:p-0.5 print:text-[6.5pt] print:leading-tight print:border-dashed print:border print:border-gray-400">
            将项目拖到此处 (Drop project here)
          </div>
        )}
        {tasks.length === 0 && !isOver && (
          <div className="text-xs text-gray-400 p-2 h-full flex items-center justify-center print:p-0.5 print:h-auto print:text-[6.5pt] print:leading-tight">
            空闲 (Free)
          </div>
        )}
      </div>
    </div>
  )
}
