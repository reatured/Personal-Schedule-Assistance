// lib/auth-context.tsx
// Authentication context provider for managing user state across the app
"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { apiClient } from "./api-client"

interface User {
  id: number
  email: string
  created_at: string
  updated_at?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is authenticated on app load
    const checkAuth = async () => {
      try {
        const result = await apiClient.getCurrentUser()
        if (result.success && result.data) {
          setUser(result.data)
        }
      } catch (error) {
        console.error("Error checking authentication:", error)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const result = await apiClient.login(email, password)
      if (result.success && result.data) {
        apiClient.setToken(result.data.access_token)
        
        // Get user info
        const userResult = await apiClient.getCurrentUser()
        if (userResult.success && userResult.data) {
          setUser(userResult.data)
        }
        
        return { error: null }
      } else {
        return { error: { message: result.error || "Login failed" } }
      }
    } catch (error: any) {
      return { error: { message: error.message || "Sign in failed" } }
    }
  }

  const signUp = async (email: string, password: string) => {
    try {
      const result = await apiClient.register(email, password)
      if (result.success) {
        // After successful registration, automatically log in
        return await signIn(email, password)
      } else {
        return { error: { message: result.error || "Registration failed" } }
      }
    } catch (error: any) {
      return { error: { message: error.message || "Sign up failed" } }
    }
  }

  const signOut = async () => {
    try {
      apiClient.setToken(null)
      setUser(null)
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const value = {
    user,
    loading,
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
