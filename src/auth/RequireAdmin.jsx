import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function RequireAdmin() {
  const { isLoading, isAdmin } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center bg-[var(--bg)] text-sm text-[var(--fg-muted)]">Verificando sesión...</div>
  }

  if (!isAdmin) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
