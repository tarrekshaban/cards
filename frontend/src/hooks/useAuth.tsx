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
}

// Auth context type
interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
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
    const response = await authApi.login(email, password)
    setUser({
      id: response.user.id,
      email: response.user.email,
      created_at: response.user.created_at,
      updated_at: null,
      user_metadata: {},
    })
  }, [])

  // Signup
  const signup = useCallback(async (email: string, password: string) => {
    const response = await authApi.signup(email, password)
    if (response.access_token && response.user.email_confirmed) {
      setUser({
        id: response.user.id,
        email: response.user.email,
        created_at: response.user.created_at,
        updated_at: null,
        user_metadata: {},
      })
    } else if (!response.user.email_confirmed) {
      // Email confirmation required
      throw new Error('Please check your email to confirm your account')
    }
  }, [])

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
