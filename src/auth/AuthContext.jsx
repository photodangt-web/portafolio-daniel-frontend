import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { configureAuthRetry } from '../api/client'
import * as authApi from './authApi'
import { AuthContext } from './context'

function hasAdminRole(user) {
  const roles = [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])]
  return roles.some((role) => String(role).toLowerCase() === 'admin')
}

export function AuthProvider({ children }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    authApi.clearAccessToken()
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  useEffect(() => {
    configureAuthRetry({
      getAccessToken: authApi.getAccessToken,
      refreshAccessToken: authApi.refreshAccessToken,
      onSessionExpired: clearSession,
    })

    async function restoreSession() {
      try {
        // First honor a still-valid in-memory session, then use the rotating cookie.
        const currentUser = await authApi.getCurrentUser({ skipAuthRefresh: true })
        setUser(currentUser)
      } catch {
        try {
          await authApi.refreshAccessToken()
          const currentUser = await authApi.getCurrentUser({ skipAuthRefresh: true })
          setUser(currentUser)
        } catch {
          clearSession()
        }
      } finally {
        setIsLoading(false)
      }
    }

    restoreSession()
  }, [clearSession])

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
