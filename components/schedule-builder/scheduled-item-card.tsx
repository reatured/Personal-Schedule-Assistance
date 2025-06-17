// components/schedule-builder/scheduled-item-card.tsx
// This component displays a task card that has been scheduled.
// The entire card is now draggable.
"use client"

import type { ScheduledTask } from "@/types/schedule"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Trash2 } from "lucide-react" // GripVertical removed
import { Button } from "@/components/ui/button"

interface ScheduledItemCardProps {
  task: ScheduledTask
  parentSlotId: string
  isOverlay?: boolean
  onDelete?: (taskId: string, fromSlotId: string) => void
}

export function ScheduledItemCard({ task, parentSlotId, isOverlay = false, onDelete }: ScheduledItemCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: {
      type: "scheduled-task",
      task,
      fromSlotId: parentSlotId,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging && !isOverlay ? 0.5 : 1,
    zIndex: isDragging || isOverlay ? 100 : "auto",
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes} // Spread attributes for dnd-kit
      {...listeners} // Spread listeners for dnd-kit
      className={`p-1.5 mb-1.5 touch-none ${task.projectColor} ${
        isOverlay ? "shadow-xl" : "shadow-sm"
      } ${isDragging ? "cursor-grabbing" : "cursor-grab"} print:p-1 print:mb-1`}
    >
      <CardHeader className="flex flex-row items-center justify-between p-0">
        <CardTitle className="text-xs font-medium flex-grow mr-1">{task.projectName}</CardTitle>
        <div className="flex items-center">
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation() // Prevent drag from starting when clicking delete
                onDelete(task.id, parentSlotId)
              }}
              className="p-1 h-auto hover:text-red-100 hover:bg-opacity-20 print:hidden"
              aria-label="Delete task"
            >
              <Trash2 size={14} />
            </Button>
          )}
          {/* GripVertical button removed, entire card is draggable */}
        </div>
      </CardHeader>
    </Card>
  )
}
