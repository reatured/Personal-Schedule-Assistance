// lib/supabase.ts
// This file configures the Supabase client, used for authentication and database operations.
// Supabase is an open-source Firebase alternative, providing backend services like database, authentication, storage, etc.
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are missing. Database features will be disabled.")
}

// Create client only if we have the required environment variables
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// Server-side Supabase client (for server actions and API routes)
export const createServerClient = () => {
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase environment variables for server client")
  }

  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => {
  return supabase !== null
}
