/**
 * API client for communicating with the FastAPI backend.
 * Handles authentication tokens and automatic token refresh.
 */

const API_BASE = '/api'

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'

// Types
export interface UserInfo {
  id: string
  email: string
  created_at: string
  email_confirmed: boolean
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: UserInfo
}

export interface ApiError {
  detail: string
}

// Token management
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setTokens(tokens: { access_token: string; refresh_token: string }): void {
  if (tokens.access_token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, tokens.access_token)
  }
  if (tokens.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token)
  }
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// API request helper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE}${endpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers as Record<string, string>,
  }

  // Add auth token if available
  const token = getAccessToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  // Handle 401 - try to refresh token
  if (response.status === 401 && token) {
    const refreshToken = getRefreshToken()
    if (refreshToken) {
      try {
        const refreshed = await refreshAccessToken(refreshToken)
        if (refreshed) {
          // Retry original request with new token
          headers['Authorization'] = `Bearer ${refreshed.access_token}`
          const retryResponse = await fetch(url, {
            ...options,
            headers,
          })
          
          if (!retryResponse.ok) {
            const error = await retryResponse.json()
            throw new Error(error.detail || 'Request failed')
          }
          
          return retryResponse.json()
        }
      } catch {
        // Refresh failed, clear tokens
        clearTokens()
        throw new Error('Session expired. Please login again.')
      }
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Request failed')
  }

  return response.json()
}

// Token refresh
async function refreshAccessToken(refreshToken: string): Promise<AuthTokens | null> {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })

  if (!response.ok) {
    return null
  }

  const tokens: AuthTokens = await response.json()
  setTokens(tokens)
  return tokens
}

// Auth API methods
export const authApi = {
  async login(email: string, password: string): Promise<AuthTokens> {
    const response = await apiRequest<AuthTokens>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setTokens(response)
    return response
  },

  async signup(email: string, password: string): Promise<AuthTokens> {
    const response = await apiRequest<AuthTokens>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    if (response.access_token) {
      setTokens(response)
    }
    return response
  },

  async logout(): Promise<void> {
    try {
      await apiRequest('/auth/logout', {
        method: 'POST',
      })
    } finally {
      clearTokens()
    }
  },

  async getMe(): Promise<{
    id: string
    email: string
    created_at: string
    updated_at: string | null
    user_metadata: Record<string, unknown>
  }> {
    return apiRequest('/auth/me')
  },
}

// Generic API helper for future endpoints
export const api = {
  get<T>(endpoint: string): Promise<T> {
    return apiRequest<T>(endpoint)
  },

  post<T>(endpoint: string, data?: unknown): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  put<T>(endpoint: string, data?: unknown): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  },

  delete<T>(endpoint: string): Promise<T> {
    return apiRequest<T>(endpoint, {
      method: 'DELETE',
    })
  },
}
