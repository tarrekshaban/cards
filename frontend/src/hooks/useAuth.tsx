import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { authApi, getAccessToken, clearTokens } from '../api/client'

// User type
export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string | null
  user_metadata: Record<string, unknown>
  is_admin: boolean
}

// Auth context type
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, accessCode: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Provider props
interface AuthProviderProps {
  children: ReactNode
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch current user
  const refreshUser = useCallback(async () => {
    const token = getAccessToken()
    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    try {
      const userData = await authApi.getMe()
      setUser(userData)
    } catch {
      // Token invalid or expired
      clearTokens()
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Check auth status on mount
  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  // Login
  const login = useCallback(async (email: string, password: string) => {
    await authApi.login(email, password)
    // Refresh user to get full user data including is_admin
    await refreshUser()
  }, [refreshUser])

  // Signup
  const signup = useCallback(async (email: string, password: string, accessCode: string) => {
    const response = await authApi.signup(email, password, accessCode)
    if (response.access_token && response.user.email_confirmed) {
      // Refresh user to get full user data including is_admin
      await refreshUser()
    } else if (!response.user.email_confirmed) {
      // Email confirmation required
      throw new Error('Please check your email to confirm your account')
    }
  }, [refreshUser])

  // Logout
  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.is_admin ?? false,
    login,
    signup,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
