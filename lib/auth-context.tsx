// lib/auth-context.tsx
// Authentication context provider for managing user state across the app
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User, Session } from "@supabase/supabase-js"
import { supabase, isSupabaseAvailable } from "./supabase"

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isSupabaseEnabled: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const isSupabaseEnabled = isSupabaseAvailable()

  useEffect(() => {
    if (!isSupabaseEnabled || !supabase) {
      setLoading(false)
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
      } catch (error) {
        console.error("Error getting initial session:", error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [isSupabaseEnabled])

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseEnabled || !supabase) {
      return { error: { message: "Supabase is not configured" } }
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error: any) {
      return { error: { message: error.message || "Sign in failed" } }
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!isSupabaseEnabled || !supabase) {
      return { error: { message: "Supabase is not configured" } }
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { error }
    } catch (error: any) {
      return { error: { message: error.message || "Sign up failed" } }
    }
  }

  const signOut = async () => {
    if (!isSupabaseEnabled || !supabase) {
      return
    }

    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const value = {
    user,
    session,
    loading,
    isSupabaseEnabled,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
