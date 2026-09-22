import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { configureAuthRetry } from '../api/client'
import * as authApi from './authApi'
import { AuthContext } from './context'

function hasAdminRole(user) {
  const roles = [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])]
  return roles.some((role) => String(role).toLowerCase() === 'admin')
}

function needsAuthRestore() {
  const path = window.location.pathname
  return path.startsWith('/admin') || path.startsWith('/login')
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(needsAuthRestore())

  const endSession = useCallback(() => {
    authApi.clearAccessToken()
    setUser(null)
  }, [])

  const clearSession = useCallback(() => {
    endSession()
    queryClient.removeQueries({ queryKey: ['admin'] })
  }, [endSession, queryClient])

  useEffect(() => {
    configureAuthRetry({
      getAccessToken: authApi.getAccessToken,
      refreshAccessToken: authApi.refreshAccessToken,
      onSessionExpired: endSession,
    })

    async function restoreSession() {
      if (!needsAuthRestore()) {
        setIsLoading(false)
        return
      }

      try {
        const currentUser = await authApi.getCurrentUser({ skipAuthRefresh: true })
        setUser(currentUser)
      } catch {
        try {
          await authApi.refreshAccessToken()
          const currentUser = await authApi.getCurrentUser({ skipAuthRefresh: true })
          setUser(currentUser)
        } catch {
          endSession()
        }
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [endSession])

  async function signIn(credentials) {
    await authApi.login(credentials)
    if (!authApi.getAccessToken()) await authApi.refreshAccessToken()
    const currentUser = await authApi.getCurrentUser()
    setUser(currentUser)
    return currentUser
  }

  async function signOut() {
    try {
      await authApi.logout()
    } finally {
      clearSession()
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAdmin: hasAdminRole(user), signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  )
}
