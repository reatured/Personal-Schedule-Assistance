// lib/test-supabase.ts
// Simple test to verify Supabase connection
import { supabase } from "./supabase"

export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("schedules").select("count").limit(1)

    if (error) {
      console.error("Supabase connection error:", error)
      return false
    }

    console.log("✅ Supabase connection successful!")
    return true
  } catch (error) {
    console.error("❌ Supabase connection failed:", error)
    return false
  }
}
