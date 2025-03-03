import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/types'
import { userService } from '@/services/userService'

type AuthContextType = {
  currentUser: User | null
  loading: boolean
  error: string | null
  setCurrentUser: (user: User | null) => void
  login: (username: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  // Check local storage on initial load
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser')

    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)

        // Verify the user still exists in the database
        userService
          .getUserById(parsedUser.id)
          .then((user) => {
            if (user) {
              setCurrentUser(user)
            } else {
              // User no longer exists, clear storage
              localStorage.removeItem('currentUser')
            }
          })
          .catch((err) => {
            console.error('Error verifying user:', err)
            setError('Failed to verify user')
          })
          .finally(() => {
            setLoading(false)
          })
      } catch (err) {
        console.error('Error parsing saved user:', err)
        localStorage.removeItem('currentUser')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (username: string) => {
    try {
      setLoading(true)
      setError(null)

      const user = await userService.getUserByUsername(username)

      if (user) {
        setCurrentUser(user)
        localStorage.setItem('currentUser', JSON.stringify(user))
      } else {
        throw new Error('User not found')
      }
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Failed to login')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setCurrentUser(null)
    localStorage.removeItem('currentUser')
  }

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        error,
        setCurrentUser,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
