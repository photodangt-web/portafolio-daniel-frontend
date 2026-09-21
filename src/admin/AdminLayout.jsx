import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { ChevronRight, ExternalLink, LayoutDashboard, LogOut, Menu, X } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../auth/useAuth'
import { adminNavigation } from './navigation'

export default function AdminLayout() {
  const { user, signOut } = useAuth()
  const { theme, toggle } = useTheme()
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const activeItem = adminNavigation.find((item) => location.pathname.endsWith(item.path))
  const title = activeItem?.label || 'Resumen'
  const groups = ['Contenido', 'Leads', 'Analítica']
  const isLeadsArea = location.pathname.startsWith('/admin/leads')

  async function handleLogout() {
    await signOut()
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      {isOpen && <button className="fixed inset-0 z-30 bg-black/30 lg:hidden" aria-label="Cerrar menú" onClick={() => setIsOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-[var(--border)] bg-[var(--bg-card)] px-4 py-5 transition-transform duration-200 lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2">
          <Link to="/admin" className="text-sm font-semibold tracking-tight">DANIEL<span className="text-[var(--fg-faint)]">/CMS</span></Link>
          <button className="rounded-lg p-2 text-[var(--fg-muted)] hover:bg-[var(--bg-soft)] lg:hidden" aria-label="Cerrar menú" onClick={() => setIsOpen(false)}><X size={18} /></button>
        </div>
        <nav className="mt-9 space-y-6 overflow-y-auto">
          <NavLink end to="/admin" onClick={() => setIsOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-[var(--accent)] font-medium text-[var(--accent-fg)]' : 'text-[var(--fg-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--fg)]'}`}>
            <LayoutDashboard size={17} /> Resumen
          </NavLink>
          {groups.map((group) => (
            <div key={group}>
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">{group}</p>
              <div className="space-y-1">
                {adminNavigation.filter((item) => item.group === group).map((item) => {
                  const Icon = item.icon
                  return <NavLink key={item.path} to={`/admin/${item.path}`} onClick={() => setIsOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? 'bg-[var(--bg-soft)] font-medium text-[var(--fg)]' : 'text-[var(--fg-muted)] hover:bg-[var(--bg-soft)] hover:text-[var(--fg)]'}`}><Icon size={17} />{item.label}</NavLink>
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="mt-auto border-t border-[var(--border)] pt-4">
          <p className="truncate px-3 text-sm font-medium">{user?.name || user?.email || 'Administrador'}</p>
          <p className="truncate px-3 pt-1 text-xs text-[var(--fg-faint)]">Administrador</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link to="/" className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--border)] px-2 py-2 text-xs text-[var(--fg-muted)] hover:bg-[var(--bg-soft)]"><ExternalLink size={14} /> Sitio</Link>
            <button className="inline-flex items-center justify-center gap-1 rounded-lg border border-[var(--border)] px-2 py-2 text-xs text-[var(--fg-muted)] hover:bg-[var(--bg-soft)]" onClick={handleLogout}><LogOut size={14} /> Salir</button>
          </div>
        </div>
      </aside>
      <div className="min-h-screen lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/85 px-4 backdrop-blur-lg sm:px-7">
          <div className="flex items-center gap-3">
            <button className="rounded-lg p-2 text-[var(--fg-muted)] hover:bg-[var(--bg-soft)] lg:hidden" aria-label="Abrir menú" onClick={() => setIsOpen(true)}><Menu size={19} /></button>
            <div className="flex items-center gap-1 text-sm"><span className="hidden text-[var(--fg-faint)] sm:inline">Administración</span><ChevronRight className="hidden text-[var(--fg-faint)] sm:block" size={15} /><span className="font-medium">{title}</span></div>
          </div>
          <div className="flex items-center gap-2"><button className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--fg-muted)] hover:bg-[var(--bg-soft)]" onClick={toggle}>{theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}</button></div>
        </header>
        <main className={`mx-auto w-full p-4 sm:p-6 ${isLeadsArea ? 'max-w-[1600px]' : 'max-w-6xl'}`}><Outlet /></main>
      </div>
    </div>
  )
}
