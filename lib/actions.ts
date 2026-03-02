"use server"

import { auth } from "@/lib/auth"

export async function getCalendarEvents(timeMin: string, timeMax: string) {
  const session = await auth()

  if (!session || !session.accessToken) {
    throw new Error("Not authenticated")
  }

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    singleEvents: "true",
    orderBy: "startTime",
  })

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Google API Error:", response.status, errorText)
      throw new Error(`Google API returned ${response.status}`)
    }

    const data = await response.json()
    return data.items || []
  } catch (error) {
    console.error("Error fetching calendar events:", error)
    throw new Error("Failed to fetch calendar events")
  }
}