import { ArrowUpRight, FilePenLine, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { adminNavigation } from './navigation'

export default function AdminHome() {
  return (
    <section>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Panel de control</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">Todo en orden.</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--fg-muted)]">Gestiona las secciones del portfolio desde un único espacio.</p>
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"><ShieldCheck className="text-[var(--fg)]" size={20} /><p className="mt-7 text-sm font-medium">Sesión protegida</p><p className="mt-1 text-sm text-[var(--fg-muted)]">Acceso limitado a cuentas administradoras.</p></article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"><FilePenLine className="text-[var(--fg)]" size={20} /><p className="mt-7 text-sm font-medium">Contenido editable</p><p className="mt-1 text-sm text-[var(--fg-muted)]">Actualiza el contenido público desde cada módulo.</p></article>
      </div>
      <div className="mt-10"><h2 className="text-sm font-semibold">Explorar contenido</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{adminNavigation.slice(0, 6).map((item) => { const Icon = item.icon; return <Link key={item.path} to={`/admin/${item.path}`} className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-soft)]"><Icon size={18} /><span className="text-sm font-medium">{item.label}</span><ArrowUpRight className="ml-auto text-[var(--fg-faint)] transition group-hover:text-[var(--fg)]" size={16} /></Link> })}</div></div>
    </section>
  )
}
