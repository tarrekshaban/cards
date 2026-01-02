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
    is_admin: boolean
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

// Import card types
import type {
  Card,
  CardWithBenefits,
  Benefit,
  UserCard,
  UserCardWithBenefits,
  AvailableBenefit,
  BenefitRedemption,
  CardSummary,
  AnnualSummary,
  CreateCardRequest,
  UpdateCardRequest,
  CreateBenefitRequest,
  UpdateBenefitRequest,
  AddUserCardRequest,
  BenefitPreference,
  UpdateBenefitPreferenceRequest,
  RedeemBenefitRequest,
} from '../types/cards'

// Card Catalog API
export const cardsApi = {
  // Get all cards in catalog
  async getCards(): Promise<Card[]> {
    return api.get<Card[]>('/cards')
  },

  // Get a single card with benefits
  async getCard(cardId: string): Promise<CardWithBenefits> {
    return api.get<CardWithBenefits>(`/cards/${cardId}`)
  },
}

// User Cards API
export const userCardsApi = {
  // Get user's cards with benefits and redemption status
  async getUserCards(): Promise<UserCardWithBenefits[]> {
    return api.get<UserCardWithBenefits[]>('/user/cards')
  },

  // Add a card to user's profile
  async addUserCard(data: AddUserCardRequest): Promise<UserCard> {
    return api.post<UserCard>('/user/cards', data)
  },

  // Remove a card from user's profile
  async removeUserCard(userCardId: string): Promise<void> {
    return api.delete(`/user/cards/${userCardId}`)
  },

  // Get available (unredeemed) benefits for dashboard
  async getAvailableBenefits(showHidden?: boolean): Promise<AvailableBenefit[]> {
    const params = showHidden ? '?show_hidden=true' : ''
    return api.get<AvailableBenefit[]>(`/user/benefits/available${params}`)
  },

  // Get yearly summary for a card
  async getCardSummary(userCardId: string, year?: number): Promise<CardSummary> {
    const params = year ? `?year=${year}` : ''
    return api.get<CardSummary>(`/user/cards/${userCardId}/summary${params}`)
  },

  // Redeem a benefit (partial or full)
  async redeemBenefit(userCardId: string, benefitId: string, amount?: number): Promise<BenefitRedemption> {
    const data: RedeemBenefitRequest = amount !== undefined ? { amount } : {}
    return api.post<BenefitRedemption>(`/user/cards/${userCardId}/benefits/${benefitId}/redeem`, data)
  },

  // Unredeem a benefit
  async unredeemBenefit(userCardId: string, benefitId: string): Promise<void> {
    return api.delete(`/user/cards/${userCardId}/benefits/${benefitId}/redeem`)
  },

  // Get annual summary (calendar year)
  async getAnnualSummary(year?: number): Promise<AnnualSummary> {
    const params = year ? `?year=${year}` : ''
    return api.get<AnnualSummary>(`/user/summary/annual${params}`)
  },

  // Get benefit preferences
  async getBenefitPreferences(userCardId: string, benefitId: string): Promise<BenefitPreference> {
    return api.get<BenefitPreference>(`/user/cards/${userCardId}/benefits/${benefitId}/preferences`)
  },

  // Update benefit preferences (auto-redeem, hidden)
  async updateBenefitPreferences(
    userCardId: string,
    benefitId: string,
    data: UpdateBenefitPreferenceRequest
  ): Promise<BenefitPreference> {
    return api.put<BenefitPreference>(`/user/cards/${userCardId}/benefits/${benefitId}/preferences`, data)
  },
}

// Admin API
export const adminApi = {
  // Create a new card
  async createCard(data: CreateCardRequest): Promise<Card> {
    return api.post<Card>('/admin/cards', data)
  },

  // Update a card
  async updateCard(cardId: string, data: UpdateCardRequest): Promise<Card> {
    return api.put<Card>(`/admin/cards/${cardId}`, data)
  },

  // Delete a card
  async deleteCard(cardId: string): Promise<void> {
    return api.delete(`/admin/cards/${cardId}`)
  },

  // Get a card with benefits (admin view)
  async getCardWithBenefits(cardId: string): Promise<CardWithBenefits> {
    return api.get<CardWithBenefits>(`/admin/cards/${cardId}`)
  },

  // Create a benefit for a card
  async createBenefit(cardId: string, data: CreateBenefitRequest): Promise<Benefit> {
    return api.post<Benefit>(`/admin/cards/${cardId}/benefits`, data)
  },

  // Bulk create benefits for a card
  async bulkCreateBenefits(cardId: string, benefits: CreateBenefitRequest[]): Promise<Benefit[]> {
    return api.post<Benefit[]>(`/admin/cards/${cardId}/benefits/bulk`, benefits)
  },

  // Update a benefit
  async updateBenefit(benefitId: string, data: UpdateBenefitRequest): Promise<Benefit> {
    return api.put<Benefit>(`/admin/benefits/${benefitId}`, data)
  },

  // Delete a benefit
  async deleteBenefit(benefitId: string): Promise<void> {
    return api.delete(`/admin/benefits/${benefitId}`)
  },
}
