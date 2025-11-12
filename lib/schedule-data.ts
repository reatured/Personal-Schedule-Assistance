// lib/schedule-data.ts
// 这个文件包含应用的初始数据和常量。
// This file contains initial data and constants for the application.
// Updated with generic presentation data.
import type { Project, TimeSlot } from "@/types/schedule"

export const initialProjectsData: Project[] = []

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
    name: "上午",
    slots: generateTimeSlots("morning", 8, 11), // 8 AM to 12 PM (exclusive of 12)
    bgColor: "bg-blue-50",
  },
  afternoon: {
    name: "下午",
    slots: generateTimeSlots("afternoon", 12, 17), // 12 PM to 6 PM (exclusive of 18)
    bgColor: "bg-amber-50",
  },
  evening: {
    name: "傍晚/晚上",
    slots: generateTimeSlots("evening", 18, 23), // 6 PM to 12 AM (exclusive of 00)
    bgColor: "bg-green-50",
  },
}

export const allTimeSlots: TimeSlot[] = [
  ...timeSections.morning.slots,
  ...timeSections.afternoon.slots,
  ...timeSections.evening.slots,
]
