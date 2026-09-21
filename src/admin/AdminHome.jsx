import { ArrowUpRight, FilePenLine, RefreshCw, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { adminNavigation } from './navigation'
import { collectHomeSnapshot, persistHomeSnapshot, readHomeSnapshot } from '../api/homeSnapshot'
import { useMemo } from 'react'

export default function AdminHome() {
  const snapshot = useMemo(() => readHomeSnapshot(), [])
  const sync = useMutation({
    mutationFn: async () => {
      const data = await collectHomeSnapshot()
      try {
        await persistHomeSnapshot(data)
        return { data, disk: true }
      } catch {
        return { data, disk: false }
      }
    },
    onSuccess: ({ data, disk }) => {
      toast.success(disk
        ? `Sincronizado ${new Date(data.syncedAt).toLocaleString()}`
        : 'Guardado en este navegador. En local también corre npm run sync:content para el archivo.')
    },
    onError: () => toast.error('No se pudo leer el backend para sincronizar.'),
  })

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Panel de control</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Todo en orden.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--fg-muted)]">Gestiona las secciones del portfolio desde un único espacio.</p>
        </div>
        <button
          type="button"
          onClick={() => sync.mutate()}
          disabled={sync.isPending}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)] disabled:opacity-60"
        >
          <RefreshCw size={16} className={sync.isPending ? 'animate-spin' : ''} />
          {sync.isPending ? 'Sincronizando...' : 'Sincronizar'}
        </button>
      </div>
      {snapshot.syncedAt && (
        <p className="mt-3 text-xs text-[var(--fg-faint)]">Último snapshot: {new Date(snapshot.syncedAt).toLocaleString()}</p>
      )}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"><ShieldCheck className="text-[var(--fg)]" size={20} /><p className="mt-7 text-sm font-medium">Sesión protegida</p><p className="mt-1 text-sm text-[var(--fg-muted)]">Acceso limitado a cuentas administradoras.</p></article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5"><FilePenLine className="text-[var(--fg)]" size={20} /><p className="mt-7 text-sm font-medium">Contenido editable</p><p className="mt-1 text-sm text-[var(--fg-muted)]">Actualiza el contenido público desde cada módulo.</p></article>
        <article className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5 md:col-span-2"><RefreshCw className="text-[var(--fg)]" size={20} /><p className="mt-7 text-sm font-medium">Copia de seguridad del home</p><p className="mt-1 text-sm text-[var(--fg-muted)]">Sincronizar guarda perfil, skills, experiencia, proyectos y encabezados. Si el backend no responde, el sitio usa ese snapshot.</p></article>
      </div>
      <div className="mt-10"><h2 className="text-sm font-semibold">Explorar contenido</h2><div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{adminNavigation.slice(0, 6).map((item) => { const Icon = item.icon; return <Link key={item.path} to={`/admin/${item.path}`} className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 transition hover:border-[var(--border-strong)] hover:bg-[var(--bg-soft)]"><Icon size={18} /><span className="text-sm font-medium">{item.label}</span><ArrowUpRight className="ml-auto text-[var(--fg-faint)] transition group-hover:text-[var(--fg)]" size={16} /></Link> })}</div></div>
    </section>
  )
}
