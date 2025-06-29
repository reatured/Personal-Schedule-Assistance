// lib/supabase.ts
// Supabase client configuration for authentication and database operations
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

// Database types (we'll expand this as we create tables)
export type Database = {
  public: {
    Tables: {
      schedules: {
        Row: {
          id: string
          user_id: string
          name: string
          data: any // JSON data
          version: string
          created_at: string
          updated_at: string
          is_default: boolean
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          data: any
          version: string
          created_at?: string
          updated_at?: string
          is_default?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          data?: any
          version?: string
          created_at?: string
          updated_at?: string
          is_default?: boolean
        }
      }
    }
  }
}
