// lib/schedule-data.ts
// This file contains initial data and constants for the application.
// Updated with generic presentation data.
import type { Project, TimeSlot } from "@/types/schedule"

export const initialProjectsData: Project[] = [
  {
    id: "proj-1",
    name: "Q3 Marketing Campaign Launch",
    subTasks: [
      { id: "st-1-1", text: "Finalize ad copy", completed: false },
      { id: "st-1-2", text: "Approve visual assets", completed: false },
      { id: "st-1-3", text: "Schedule social media posts", completed: false },
    ],
    color: "bg-sky-500 text-white",
  },
  {
    id: "proj-2",
    name: "Website Redesign Project",
    subTasks: [
      { id: "st-2-1", text: "Complete user research", completed: false },
      { id: "st-2-2", text: "Review wireframes", completed: false },
      { id: "st-2-3", text: "Develop homepage prototype", completed: false },
    ],
    color: "bg-green-500 text-white",
  },
  {
    id: "proj-3",
    name: "Client Onboarding Process",
    subTasks: [
      { id: "st-3-1", text: "Map current workflow", completed: false },
      { id: "st-3-2", text: "Identify pain points", completed: false },
      { id: "st-3-3", text: "Draft new procedures", completed: false },
    ],
    color: "bg-amber-500 text-white",
  },
  {
    id: "proj-4",
    name: "Sales Team Training",
    subTasks: [
      { id: "st-4-1", text: "Create training modules", completed: false },
      { id: "st-4-2", text: "Design assessment tests", completed: false },
      { id: "st-4-3", text: "Schedule training sessions", completed: false },
    ],
    color: "bg-purple-500 text-white",
  },
]

const generateTimeSlots = (
  section: "morning" | "afternoon" | "evening",
  startHour: number,
  endHour: number,
): TimeSlot[] => {
  const slots: TimeSlot[] = []
  for (let hour = startHour; hour <= endHour; hour++) {
    const nextHour = hour + 1
    slots.push({
      id: `slot-${section}-${hour.toString().padStart(2, "0")}`,
      label: `${hour.toString().padStart(2, "0")}:00 - ${nextHour.toString().padStart(2, "0")}:00`,
      section,
    })
  }
  return slots
}

export const timeSections: Record<string, { name: string; slots: TimeSlot[]; bgColor: string }> = {
  morning: {
    name: "Morning",
    slots: generateTimeSlots("morning", 8, 11), // 8 AM to 12 PM (exclusive of 12)
    bgColor: "bg-blue-50",
  },
  afternoon: {
    name: "Afternoon",
    slots: generateTimeSlots("afternoon", 12, 17), // 12 PM to 6 PM (exclusive of 18)
    bgColor: "bg-amber-50",
  },
  evening: {
    name: "Evening",
    slots: generateTimeSlots("evening", 18, 23), // 6 PM to 12 AM (exclusive of 00)
    bgColor: "bg-green-50",
  },
}

export const allTimeSlots: TimeSlot[] = [
  ...timeSections.morning.slots,
  ...timeSections.afternoon.slots,
  ...timeSections.evening.slots,
]
