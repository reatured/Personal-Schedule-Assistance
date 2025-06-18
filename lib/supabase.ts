// lib/supabase.ts
// 这个文件配置 Supabase 客户端，用于认证和数据库操作。
// Supabase 是一个开源的 Firebase 替代品，提供数据库、认证、存储等后端服务。
// This file configures the Supabase client, used for authentication and database operations.
// Supabase is an open-source Firebase alternative, providing backend services like database, authentication, storage, etc.
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 检查环境变量是否可用
// Check if environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase 环境变量缺失。数据库功能将被禁用。(Supabase environment variables are missing. Database features will be disabled.)",
  )
}

// 仅当我们拥有所需的环境变量时才创建客户端
// Create client only if we have the required environment variables
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// 服务器端 Supabase 客户端（用于服务器操作和 API 路由）
// Server-side Supabase client (for server actions and API routes)
export const createServerClient = () => {
  if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("服务器客户端缺少 Supabase 环境变量 (Missing Supabase environment variables for server client)")
  }

  return createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// 辅助函数，检查 Supabase 是否可用
// Helper function to check if Supabase is available
export const isSupabaseAvailable = () => {
  return supabase !== null
}
