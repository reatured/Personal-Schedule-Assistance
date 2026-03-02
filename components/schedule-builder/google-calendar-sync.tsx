"use client"

import { useState } from "react"
import { useSession, signIn, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Calendar, Loader2, LogOut } from "lucide-react"
import { getCalendarEvents } from "@/lib/actions"
import type { ScheduledTask, SubTask } from "@/types/schedule"

interface GoogleCalendarSyncProps {
  onSync: (newTasks: ScheduledTask[], googleProjectId: string) => void
}

export function GoogleCalendarSync({ onSync }: GoogleCalendarSyncProps) {
  const { data: session, status } = useSession()
  const [isLoading, setIsLoading] = useState(false)

  const handleSync = async () => {
    setIsLoading(true)
    try {
      // Get start and end of today in local time
      const now = new Date()
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)

      const events = await getCalendarEvents(startOfDay.toISOString(), endOfDay.toISOString())

      const googleProjectId = "google-calendar-project"
      const newTasks: ScheduledTask[] = []

      events.forEach((event: any) => {
        if (!event.start || (!event.start.dateTime && !event.start.date)) return

        // Handle all-day events (date only) vs timed events (dateTime)
        // For now, we focus on timed events as they map to slots better.
        // All-day events default to 8am or we skip them? Let's skip for now or put in first slot.
        // Let's focus on timed events.
        
        let eventDate = new Date(event.start.dateTime || event.start.date)
        
        // If it's an all-day event, event.start.dateTime is undefined.
        // We might want to skip or put in a specific place. 
        // Current logic: map to hour.
        
        const hour = eventDate.getHours()
        
        // Map hour to slot ID
        let section = ""
        if (hour >= 8 && hour <= 11) section = "morning"
        else if (hour >= 12 && hour <= 17) section = "afternoon"
        else if (hour >= 18 && hour <= 23) section = "evening"
        
        if (section) {
          const hourStr = hour.toString().padStart(2, "0")
          const slotId = `slot-${section}-${hourStr}`
          
          newTasks.push({
            id: `gcal-${event.id}`,
            projectId: googleProjectId,
            projectColor: "bg-red-600 text-white",
            originalProjectSubTasks: [],
            // We store the slotId temporarily here or return it alongside
            // Actually ScheduledTask doesn't have slotId, the parent map needs it.
            // We need to return an object that includes targetSlotId
             // @ts-ignore
            targetSlotId: slotId,
            // Use event summary as subtask or separate field?
            // The ScheduledTask structure relies on "projectName" usually being the main label 
            // and "originalProjectSubTasks" for details. 
            // But visually, the card shows Project Name.
            // Let's make "Project Name" = "Google Event" and add a subtask with the Title?
            // Or better: Project Name = Event Summary.
            projectName: event.summary || "Untitled Event",
          })
        }
      })
      
      onSync(newTasks, googleProjectId)
      
    } catch (error) {
      console.error("Sync failed", error)
      alert("Failed to sync Google Calendar. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading") {
    return <Button variant="outline" size="sm" disabled><Loader2 className="h-4 w-4 animate-spin" /></Button>
  }

  if (!session) {
    return (
      <Button variant="outline" size="sm" onClick={() => signIn("google")}>
        <Calendar className="mr-2 h-4 w-4" />
        Connect Calendar
      </Button>
    )
  }

  return (
    <div className="flex gap-2">
      <Button variant="default" size="sm" onClick={handleSync} disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Calendar className="mr-2 h-4 w-4" />}
        Sync Today
      </Button>
      <Button variant="ghost" size="sm" onClick={() => signOut()}>
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
