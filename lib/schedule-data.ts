// lib/schedule-data.ts
// 这个文件包含应用的初始数据和常量。
// This file contains initial data and constants for the application.
// Updated with generic presentation data.
import type { Project, TimeSlot } from "@/types/schedule"

export const initialProjectsData: Project[] = [
  {
    id: "pres-proj-1",
    name: "Q3 Marketing Campaign Launch",
    subTasks: [
      { id: "st-pres1-1", text: "Finalize ad copy", completed: false },
      { id: "st-pres1-2", text: "Approve visual assets", completed: false },
      { id: "st-pres1-3", text: "Schedule social media posts", completed: false },
    ],
    color: "bg-sky-500 text-white", // Colors will be assigned dynamically by page.tsx, but good to have a default
  },
  {
    id: "pres-proj-2",
    name: "New Website Design & Development",
    subTasks: [
      { id: "st-pres2-1", text: "User research summary", completed: false },
      { id: "st-pres2-2", text: "Wireframe review session", completed: false },
      { id: "st-pres2-3", text: "Develop homepage prototype", completed: false },
    ],
    color: "bg-green-500 text-white",
  },
  {
    id: "pres-proj-3",
    name: "Client Onboarding Process Improvement",
    subTasks: [
      { id: "st-pres3-1", text: "Map current process", completed: false },
      { id: "st-pres3-2", text: "Identify pain points", completed: false },
      { id: "st-pres3-3", text: "Draft new SOP", completed: false },
    ],
    color: "bg-amber-500 text-white",
  },
  {
    id: "pres-proj-4",
    name: "Sales Team Training Program",
    subTasks: [
      { id: "st-pres4-1", text: "Develop training modules", completed: false },
      { id: "st-pres4-2", text: "Create assessment quizzes", completed: false },
      { id: "st-pres4-3", text: "Schedule training sessions", completed: false },
    ],
    color: "bg-purple-500 text-white",
  },
  {
    id: "pres-proj-5",
    name: "Product Feature Update (Mobile App)",
    subTasks: [
      { id: "st-pres5-1", text: "Gather user feedback", completed: false },
      { id: "st-pres5-2", text: "Design UI/UX mockups", completed: false },
      { id: "st-pres5-3", text: "Coordinate with dev team", completed: false },
    ],
    color: "bg-pink-500 text-white",
  },
  {
    id: "pres-proj-6",
    name: "Annual Company Retreat Planning",
    subTasks: [
      { id: "st-pres6-1", text: "Venue research & booking", completed: false },
      { id: "st-pres6-2", text: "Agenda finalization", completed: false },
      { id: "st-pres6-3", text: "Arrange catering", completed: false },
    ],
    color: "bg-rose-500 text-white",
  },
  {
    id: "pres-proj-7",
    name: "Competitor Analysis Report",
    subTasks: [
      { id: "st-pres7-1", text: "Identify key competitors", completed: false },
      { id: "st-pres7-2", text: "Analyze pricing strategies", completed: false },
      { id: "st-pres7-3", text: "Summarize findings", completed: false },
    ],
    color: "bg-teal-500 text-white",
  },
  {
    id: "pres-proj-8",
    name: "Internal Software Upgrade",
    subTasks: [
      { id: "st-pres8-1", text: "Test new software version", completed: false },
      { id: "st-pres8-2", text: "Prepare migration plan", completed: false },
      { id: "st-pres8-3", text: "Communicate rollout schedule", completed: false },
    ],
    color: "bg-fuchsia-500 text-white",
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
