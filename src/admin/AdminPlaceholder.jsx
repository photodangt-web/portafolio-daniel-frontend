import { Construction } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { adminNavigation } from './navigation'

export default function AdminPlaceholder() {
  const { section } = useParams()
  const item = adminNavigation.find((entry) => entry.path === section)
  const title = item?.label || 'Módulo'
  return <section className="grid min-h-[55vh] place-items-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-card)] p-8 text-center"><div><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--bg-soft)]"><Construction size={20} /></span><p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Fase 6</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">{title} estará disponible pronto</h1><p className="mt-3 max-w-md text-sm leading-6 text-[var(--fg-muted)]">Este espacio queda reservado para las operaciones de contenido. No se han incluido formularios ni acciones CRUD en esta fase.</p></div></section>
}
