// Authentication Context for ChronoConnect
// This context manages user authentication state and provides auth-related functions

import React, { createContext, useContext, useEffect, useState } from 'react'
import { apiClient, User } from '@/lib/api'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (phoneNumber: string, password: string) => Promise<User>
  register: (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone_number: string
    role: 'customer' | 'merchant' | 'farmer' | 'delivery_agent'
  }) => Promise<User>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isAuthenticated = !!user

  const login = async (phoneNumber: string, password: string) => {
    try {
      const response = await apiClient.login(phoneNumber, password)
      setUser(response.user)
      return response.user
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    }
  }

  const register = async (userData: {
    email: string
    password: string
    first_name: string
    last_name: string
    phone_number: string
    role: 'customer' | 'merchant' | 'farmer' | 'delivery_agent'
  }) => {
    try {
      const response = await apiClient.register(userData)
      setUser(response.user)
      return response.user
    } catch (error) {
      console.error('Registration failed:', error)
      throw error
    }
  }

  const logout = () => {
    apiClient.logout()
    setUser(null)
    // Force redirect to home page after logout
    window.location.href = '/'
  }

  const refreshUser = async () => {
    try {
      const userData = await apiClient.getCurrentUser()
      setUser(userData)
    } catch (error) {
      console.error('Failed to refresh user:', error)
      setUser(null)
    }
  }

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token')
      if (token) {
        try {
          await refreshUser()
        } catch (error) {
          console.error('Failed to initialize auth:', error)
          apiClient.logout()
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to check if user has specific role
export const useUserRole = (requiredRole: User['user_type'] | User['user_type'][]) => {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated || !user) {
    return false;
  }

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(user.user_type);
  }

  return user.user_type === requiredRole;
};

// Hook to check if user is admin
export const useIsAdmin = () => {
  return useUserRole('admin');
};

// Hook to check if user is merchant
export const useIsMerchant = () => {
  return useUserRole('merchant');
};

// Hook to check if user is farmer
export const useIsFarmer = () => {
  return useUserRole('farmer');
};

// Hook to check if user is delivery agent
export const useIsDeliveryAgent = () => {
  return useUserRole('delivery_agent');
};

// Hook to check if user is customer
export const useIsCustomer = () => {
  return useUserRole('customer');
}; 