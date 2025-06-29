// lib/api-client.ts
// API client for communicating with the FastAPI backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token')
    }
  }

  setToken(token: string | null) {
    this.token = token
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token)
    } else if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    }

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: errorData.detail || `HTTP error! status: ${response.status}`,
        }
      }

      const data = await response.json()
      return { success: true, data }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      }
    }
  }

  // Authentication endpoints
  async register(email: string, password: string): Promise<ApiResponse<any>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
  }

  async login(email: string, password: string): Promise<ApiResponse<{ access_token: string; token_type: string }>> {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: errorData.detail || `Login failed: ${response.status}`,
      }
    }

    const data = await response.json()
    return { success: true, data }
  }

  async getCurrentUser(): Promise<ApiResponse<any>> {
    return this.request('/auth/me')
  }

  // Schedule endpoints
  async getSchedules(): Promise<ApiResponse<any[]>> {
    return this.request('/schedules/')
  }

  async getDefaultSchedule(): Promise<ApiResponse<any>> {
    return this.request('/schedules/default')
  }

  async createSchedule(scheduleData: any): Promise<ApiResponse<any>> {
    return this.request('/schedules/', {
      method: 'POST',
      body: JSON.stringify(scheduleData),
    })
  }

  async updateSchedule(scheduleId: number, scheduleData: any): Promise<ApiResponse<any>> {
    return this.request(`/schedules/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(scheduleData),
    })
  }

  async deleteSchedule(scheduleId: number): Promise<ApiResponse<any>> {
    return this.request(`/schedules/${scheduleId}`, {
      method: 'DELETE',
    })
  }
}

export const apiClient = new ApiClient(API_BASE_URL) 