import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../auth/useAuth'

function errorMessage(error) {
  return error.response?.data?.message || error.message || 'No fue posible iniciar sesión.'
}

export default function Login() {
  const { isAdmin, isLoading, signIn, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isLoading && isAdmin) return <Navigate to={location.state?.from?.pathname || '/admin'} replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)

    try {
      const user = await signIn({ email, password })
      const roles = [user?.role, ...(Array.isArray(user?.roles) ? user.roles : [])]
      if (!roles.some((role) => String(role).toLowerCase() === 'admin')) {
        await signOut()
        toast.warning('Esta cuenta no tiene permisos de administrador.')
        return
      }
      navigate(location.state?.from?.pathname || '/admin', { replace: true })
    } catch (requestError) {
      toast.error(errorMessage(requestError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="relative grid min-h-screen overflow-hidden bg-[var(--bg)] px-5 py-10 text-[var(--fg)] sm:place-items-center">
      <div className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-[var(--mesh-2)] blur-3xl" />
      <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[var(--mesh-1)] blur-3xl" />
      <section className="relative w-full max-w-md rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-7 shadow-2xl backdrop-blur-xl sm:p-9">
        <Link to="/" className="text-xs font-medium tracking-wide text-[var(--fg-muted)] transition hover:text-[var(--fg)]">
          ← Volver al portfolio
        </Link>
        <div className="mt-10">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent)] text-[var(--accent-fg)]">
            <LockKeyhole size={19} />
          </span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--fg-faint)]">Portfolio CMS</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Área de administración</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--fg-muted)]">Accede para gestionar el contenido de Daniel de León.</p>
        </div>
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium">
            Correo electrónico
            <input
              className="mt-2 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-3.5 py-3 text-sm outline-none transition focus:border-[var(--fg)] focus:ring-4 focus:ring-[var(--ring)]"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Contraseña
            <input
              className="mt-2 w-full rounded-xl border border-[var(--border-strong)] bg-[var(--bg-card)] px-3.5 py-3 text-sm outline-none transition focus:border-[var(--fg)] focus:ring-4 focus:ring-[var(--ring)]"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-3 text-sm font-semibold text-[var(--accent-fg)] transition hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-60"
            type="submit"
            disabled={submitting || isLoading}
          >
            {submitting ? 'Accediendo...' : 'Entrar al panel'} <ArrowRight size={16} />
          </button>
        </form>
      </section>
    </main>
  )
}
