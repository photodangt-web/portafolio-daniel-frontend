import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowLeft, ArrowUp, ExternalLink, Eye, Pencil, Plus, StickyNote, Trash2, X } from 'lucide-react'
import { adminApi } from '../api/admin'
import { apiUrl, resolveMediaUrl } from '../api/client'

const idOf = (item) => item?.id || item?._id
const field = 'mt-1.5 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm outline-none transition focus:border-[var(--fg)]'
const label = 'block text-xs font-medium text-[var(--fg-muted)]'
const fieldTypes = ['text', 'textarea', 'email', 'phone', 'select', 'checkbox', 'radio', 'file', 'number', 'date', 'url', 'button']
const errorMessage = (error) => error?.response?.data?.error?.message || error?.response?.data?.message || error?.message || 'No fue posible completar la operación.'
const cleanRecord = (values) => {
  const data = { ...values }
  ;['_id', 'id', '__v', 'order', 'createdAt', 'updatedAt'].forEach((key) => delete data[key])
  return data
}

function Notice({ error, success }) { return error ? <p className="text-sm text-red-500">{error}</p> : success ? <p className="text-sm text-emerald-500">{success}</p> : null }
function Section({ title, children }) { return <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6"><h2 className="text-base font-semibold">{title}</h2><div className="mt-5">{children}</div></section> }
function SaveButton({ pending, children = 'Guardar cambios', ...props }) { return <button disabled={pending} className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-fg)] disabled:opacity-60" {...props}>{pending ? 'Guardando...' : children}</button> }
function leadValueDisplay(value, fieldConfig = {}, labelText = 'Campo') {
  if (fieldConfig.type === 'button') {
    const isObject = value && typeof value === 'object'
    const button = { label: (isObject ? value.label : undefined) || fieldConfig.buttonLabel || labelText, url: (isObject ? value.url : value) || fieldConfig.buttonUrl || '' }
    return { empty: !button.url, node: <a href={button.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-xs font-medium text-[var(--accent-fg)]">{button.label} <ExternalLink size={12} /></a> }
  }
  if (value === undefined || value === '') return { empty: true, node: 'Sin completar' }
  if (fieldConfig.type === 'url') return { empty: false, node: <a href={String(value)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--fg)] underline"><ExternalLink size={13} />{String(value)}</a> }
  return { empty: false, node: typeof value === 'object' ? JSON.stringify(value) : String(value) }
}

export function LeadsList() {
  const [params, setParams] = useState({ page: 1, limit: 20, sort: 'desc' })
  const [editing, setEditing] = useState(null)
  const [columnsOpen, setColumnsOpen] = useState(false)
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try { return JSON.parse(localStorage.getItem('lead-visible-columns') || '[]') } catch { return [] }
  })
  const navigate = useNavigate()
  const leads = useQuery({ queryKey: ['admin', 'leads', params], queryFn: () => adminApi.leads.list(params) })
  const leadFields = useQuery({ queryKey: ['admin', 'lead-fields'], queryFn: adminApi.leadFields.list })
  const client = useQueryClient()
  const remove = useMutation({ mutationFn: adminApi.leads.remove, onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'leads'] }) })
  const items = leads.data?.items || []
  const configuredTableFields = (leadFields.data || []).filter((item) => item.active && item.showInTable !== false)
  const visibleFields = configuredTableFields.filter((item) => !visibleColumns.length || visibleColumns.includes(item.name))

  function toggleColumn(name) {
    setVisibleColumns((prev) => {
      const base = prev.length ? prev : configuredTableFields.map((item) => item.name)
      const next = base.includes(name) ? base.filter((item) => item !== name) : [...base, name]
      localStorage.setItem('lead-visible-columns', JSON.stringify(next))
      return next
    })
  }

  const gridTemplateColumns = `minmax(132px, .9fr) minmax(155px, .8fr) 70px ${visibleFields.map(() => 'minmax(104px, .7fr)').join(' ')} 84px`
  const selectedColumns = visibleColumns.length ? visibleColumns : configuredTableFields.map((item) => item.name)

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Leads</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Contactos recibidos</h1>
          <p className="mt-1 max-w-xl text-sm text-[var(--fg-muted)]">Vista CRM para revisar, editar, comentar y dar seguimiento a cada contacto.</p>
        </div>
        <button onClick={() => setEditing({ values: {}, status: 'new' })} className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)]"><Plus size={16} /> Nuevo lead</button>
      </div>
      <div className="mt-5 grid gap-2 rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-2 md:grid-cols-[1fr_1fr_1fr_1fr_auto]">
        <input className={field} placeholder="Buscar nombre, email o mensaje" onChange={(event) => setParams((prev) => ({ ...prev, page: 1, search: event.target.value }))} />
        <input className={field} placeholder="Filtrar por email" onChange={(event) => setParams((prev) => ({ ...prev, page: 1, email: event.target.value }))} />
        <input className={field} type="date" onChange={(event) => setParams((prev) => ({ ...prev, page: 1, from: event.target.value }))} />
        <select className={field} value={params.sort} onChange={(event) => setParams((prev) => ({ ...prev, sort: event.target.value }))}><option value="desc">Más recientes</option><option value="asc">Más antiguos</option></select>
        <div className="relative flex items-end">
          <button type="button" onClick={() => setColumnsOpen((value) => !value)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">Columnas</button>
          {columnsOpen && <div className="absolute right-0 top-11 z-10 grid w-64 gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-3 shadow-xl">{configuredTableFields.map((fieldConfig) => <label key={fieldConfig.name} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selectedColumns.includes(fieldConfig.name)} onChange={() => toggleColumn(fieldConfig.name)} />{fieldConfig.label}</label>)}</div>}
        </div>
      </div>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] shadow-sm">
        <div className="min-w-fit">
          <div className="grid gap-2 border-b border-[var(--border)] px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--fg-faint)]" style={{ gridTemplateColumns }}>
            <span>Contacto</span><span>Email</span><span>Estado</span>{visibleFields.map((fieldConfig) => <span key={fieldConfig.name}>{fieldConfig.label}</span>)}<span>Acciones</span>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {items.map((lead) => <article key={idOf(lead)} className="grid items-center gap-2 px-3 py-2.5 text-xs transition hover:bg-[var(--bg-soft)]/45" style={{ gridTemplateColumns }}>
              <button onClick={() => navigate(`/admin/leads/${idOf(lead)}`)} className="min-w-0 text-left"><p className="truncate font-semibold text-[var(--fg)] hover:underline">{lead.name || 'Sin nombre'}</p><p className="mt-0.5 truncate text-[11px] text-[var(--fg-faint)]">{new Date(lead.createdAt).toLocaleString()}{lead.source ? ` · ${lead.source}` : ''}</p>{lead.notes && <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-[var(--fg-faint)]"><StickyNote size={11} /> Tiene notas</p>}</button>
              <p className="truncate text-xs text-[var(--fg-muted)]">{lead.email || '-'}</p>
              <span className={`w-fit rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusChipClass(lead.status || 'new')}`}>{lead.status || 'new'}</span>
              {visibleFields.map((fieldConfig) => { const display = leadValueDisplay(lead.values?.[fieldConfig.name], fieldConfig, fieldConfig.label); return <div key={fieldConfig.name} className={`min-w-0 truncate text-xs ${display.empty ? 'text-[var(--fg-faint)] italic' : 'text-[var(--fg-muted)]'}`}>{display.empty ? 'Sin completar' : display.node}</div> })}
              <div className="flex items-center justify-end gap-0.5"><button className="rounded-lg p-1.5 hover:bg-[var(--bg-card)]" onClick={() => navigate(`/admin/leads/${idOf(lead)}`)} aria-label="Ver"><Eye size={15} /></button><button className="rounded-lg p-1.5 hover:bg-[var(--bg-card)]" onClick={() => setEditing(lead)} aria-label="Editar"><Pencil size={15} /></button><button className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10" onClick={() => remove.mutate(idOf(lead))} aria-label="Eliminar"><Trash2 size={15} /></button></div>
            </article>)}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-[var(--border)] px-3 py-3 text-xs">
          <button className="rounded-lg border border-[var(--border)] px-3 py-1.5 disabled:opacity-40" disabled={params.page <= 1} onClick={() => setParams((prev) => ({ ...prev, page: prev.page - 1 }))}>Anterior</button>
          <span className="text-[var(--fg-muted)]">Página {leads.data?.page || 1} de {leads.data?.totalPages || 1}</span>
          <button className="rounded-lg border border-[var(--border)] px-3 py-1.5 disabled:opacity-40" disabled={(leads.data?.page || 1) >= (leads.data?.totalPages || 1)} onClick={() => setParams((prev) => ({ ...prev, page: prev.page + 1 }))}>Siguiente</button>
        </div>
      </div>
      {editing && <LeadEditor lead={editing} onClose={() => setEditing(null)} />}
    </section>
  )
}

const leadStages = [
  { value: 'new', label: 'Nuevo', tone: 'from-emerald-400 to-teal-500', description: 'Entrada recibida' },
  { value: 'contacted', label: 'Contactado', tone: 'from-cyan-400 to-blue-500', description: 'Primer contacto' },
  { value: 'qualified', label: 'Calificado', tone: 'from-amber-400 to-orange-500', description: 'Alta intención' },
  { value: 'closed', label: 'Cerrado', tone: 'from-rose-500 to-red-600', description: 'Resultado final' },
]
const leadPageMotion = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } }
const leadRevealMotion = { hidden: { opacity: 0, y: 18, filter: 'blur(8px)' }, show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } } }
const leadStageMotion = { hidden: { opacity: 0, x: -18, scale: 0.96 }, show: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } } }

function stageIndex(status) { return Math.max(0, leadStages.findIndex((stage) => stage.value === status)) }
function statusChipClass(status) {
  const styles = {
    new: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    contacted: 'border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    qualified: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    closed: 'border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300',
  }
  return styles[status] || styles.new
}

export function LeadDetailPage() {
  const { id } = useParams()
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'lead', id], queryFn: () => adminApi.leads.get(id) })
  const fields = useQuery({ queryKey: ['admin', 'lead-fields'], queryFn: adminApi.leadFields.list })
  const [editing, setEditing] = useState(null)
  const [notes, setNotes] = useState('')
  const lead = query.data?.lead
  const displayFields = (fields.data || []).filter((fieldItem) => fieldItem.active)
  const entries = displayFields.length
    ? displayFields.map((fieldItem) => [fieldItem.label, lead?.values?.[fieldItem.name], fieldItem.name, fieldItem])
    : Object.entries(lead?.values || {}).map(([key, value]) => [key, value, key, {}])
  const currentStage = stageIndex(lead?.status || 'new')
  useEffect(() => { if (lead) setNotes(lead.notes || '') }, [lead])
  const updateLead = useMutation({ mutationFn: (data) => adminApi.leads.update(id, data), onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', 'lead', id] }); client.invalidateQueries({ queryKey: ['admin', 'leads'] }) } })
  if (query.isLoading) return <p className="text-sm text-[var(--fg-muted)]">Cargando lead...</p>
  if (!lead) return <section><Link to="/admin/leads" className="text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]">Volver a leads</Link><p className="mt-6 text-sm text-[var(--fg-muted)]">No se encontró este lead.</p></section>
  return <motion.section variants={leadPageMotion} initial="hidden" animate="show" className="space-y-6">
    <motion.div variants={leadRevealMotion} className="overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[linear-gradient(135deg,var(--bg-card),var(--bg-soft))] shadow-sm">
      <div className="relative p-5 sm:p-7">
        <div className="absolute right-8 top-6 hidden h-36 w-36 rounded-full bg-emerald-400/10 blur-3xl sm:block" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link to="/admin/leads" className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-3 py-1.5 text-xs font-medium text-[var(--fg-muted)] shadow-sm hover:bg-[var(--bg-soft)] hover:text-[var(--fg)]"><ArrowLeft size={14} /> Volver</Link>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-[var(--fg-faint)]">Leads / detalle</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{lead.name || 'Lead sin nombre'}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-[var(--fg-muted)]"><span>{lead.email || 'Sin email'}</span><span>·</span><span>{new Date(lead.createdAt).toLocaleString()}</span>{lead.source && <><span>·</span><span>{lead.source}</span></>}</div>
          </div>
          <div className="flex gap-2"><button onClick={() => setEditing(lead)} className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-sm font-medium hover:bg-[var(--bg-soft)]">Editar lead</button></div>
        </div>
        <div className="relative mt-8 overflow-x-auto rounded-[1.4rem] bg-[var(--bg-card)] p-2 shadow-inner ring-1 ring-[var(--border)]">
          <div className="flex min-w-[760px] items-stretch">
          {leadStages.map((stage, index) => {
            const active = index <= currentStage
            const current = index === currentStage
            const shape = index === 0
              ? 'polygon(0 0, calc(100% - 28px) 0, 100% 50%, calc(100% - 28px) 100%, 0 100%)'
              : index === leadStages.length - 1
                ? 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 28px 50%)'
                : 'polygon(0 0, calc(100% - 28px) 0, 100% 50%, calc(100% - 28px) 100%, 0 100%, 28px 50%)'
            return <motion.button key={stage.value} variants={leadStageMotion} whileHover={{ y: -3, scale: 1.015 }} whileTap={{ scale: 0.985 }} type="button" onClick={() => updateLead.mutate({ status: stage.value })} style={{ clipPath: shape }} className={`group relative -ml-5 flex min-h-[74px] flex-1 items-center pl-10 pr-9 text-left transition first:ml-0 first:pl-5 ${active ? 'text-white shadow-lg shadow-black/10' : 'bg-white text-[var(--fg-muted)] hover:bg-[var(--bg-soft)] dark:bg-[var(--bg-card)]'}`}>
              <span className={`absolute inset-0 bg-gradient-to-r ${stage.tone} transition ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-15'}`} />
              {current && <motion.span layoutId="lead-stage-glow" className="absolute inset-0 bg-white/15" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className="relative min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em]">Paso {index + 1}</span>
                <span className="mt-1 block truncate text-base font-semibold">{stage.label}</span>
                <span className={`mt-0.5 block truncate text-xs ${active ? 'text-white/75' : 'text-[var(--fg-faint)]'}`}>{stage.description}</span>
              </span>
              <span className={`relative ml-auto h-2.5 w-2.5 shrink-0 rounded-full ${current ? 'bg-white ring-4 ring-white/25' : active ? 'bg-white/60' : 'bg-[var(--fg-faint)]/30'}`} />
            </motion.button>
          })}
          </div>
        </div>
      </div>
    </motion.div>
    <motion.div variants={leadRevealMotion} className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <Section title="Información recibida"><motion.div variants={leadPageMotion} className="grid gap-3 md:grid-cols-2">{entries.map(([labelText, value, key, fieldConfig]) => { const display = leadValueDisplay(value, fieldConfig, labelText); return <motion.article key={key} variants={leadRevealMotion} whileHover={{ y: -2, borderColor: 'var(--border-strong)' }} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4"><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--fg-faint)]">{labelText}</p><div className={`mt-2 break-words text-sm ${display.empty ? 'italic text-[var(--fg-faint)]' : 'text-[var(--fg)]'}`}>{display.empty ? 'Sin completar' : display.node}</div></motion.article> })}</motion.div></Section>
        <Section title="Archivos adjuntos">{lead.files?.length ? <motion.div variants={leadPageMotion} className="grid gap-2">{lead.files.map((file) => <motion.a key={file.filename} variants={leadRevealMotion} whileHover={{ x: 4 }} href={resolveMediaUrl(file.url)} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--border)] p-3 text-sm hover:bg-[var(--bg-soft)]">{file.originalName} · {(file.size / 1024).toFixed(1)} KB</motion.a>)}</motion.div> : <p className="text-sm text-[var(--fg-muted)]">Sin archivos.</p>}</Section>
      </div>
      <motion.aside variants={leadRevealMotion} className="space-y-6">
        <Section title="Panel rápido"><div className="grid gap-3 text-sm"><div className="rounded-2xl bg-[var(--bg)] p-4"><p className="text-xs uppercase tracking-[0.14em] text-[var(--fg-faint)]">Estado actual</p><p className="mt-2 text-lg font-semibold capitalize">{leadStages[currentStage]?.label || lead.status || 'Nuevo'}</p></div><div className="rounded-2xl bg-[var(--bg)] p-4"><p className="text-xs uppercase tracking-[0.14em] text-[var(--fg-faint)]">User agent</p><p className="mt-2 break-words text-xs text-[var(--fg-muted)]">{lead.userAgent || '-'}</p></div></div></Section>
        <Section title="Notas internas"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="8" className={field} placeholder="Seguimiento, acuerdos, próxima acción..." /><div className="mt-3"><SaveButton type="button" pending={updateLead.isPending} onClick={() => updateLead.mutate({ notes })}>Guardar nota</SaveButton></div><Notice error={updateLead.isError && errorMessage(updateLead.error)} success={updateLead.isSuccess && 'Lead actualizado.'} /></Section>
      </motion.aside>
    </motion.div>
    {editing && <LeadEditor lead={editing} onClose={() => { setEditing(null); client.invalidateQueries({ queryKey: ['admin', 'lead', id] }) }} />}
  </motion.section>
}

function LeadDetail({ id, onClose, onEdit }) {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'lead', id], queryFn: () => adminApi.leads.get(id) })
  const fields = useQuery({ queryKey: ['admin', 'lead-fields'], queryFn: adminApi.leadFields.list })
  const [notes, setNotes] = useState('')
  const lead = query.data?.lead
  const displayFields = (fields.data || []).filter((fieldItem) => fieldItem.active)
  const entries = displayFields.length
    ? displayFields.map((fieldItem) => [fieldItem.label, lead?.values?.[fieldItem.name], fieldItem.name, fieldItem])
    : Object.entries(lead?.values || {}).map(([key, value]) => [key, value, key])
  useEffect(() => { if (lead) setNotes(lead.notes || '') }, [lead])
  const saveNotes = useMutation({ mutationFn: () => adminApi.leads.update(id, { notes }), onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', 'lead', id] }); client.invalidateQueries({ queryKey: ['admin', 'leads'] }) } })
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="max-h-[90vh] w-full max-w-5xl overflow-auto rounded-3xl bg-[var(--bg-card)] p-6 shadow-2xl"><div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Lead</p><h2 className="mt-1 text-2xl font-semibold">{lead?.name || 'Detalle del lead'}</h2><p className="mt-1 text-sm text-[var(--fg-muted)]">{lead?.email || 'Sin email registrado'}</p></div><div className="flex gap-2"><button onClick={() => lead && onEdit(lead)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm">Editar</button><button onClick={onClose} className="rounded-lg p-2 hover:bg-[var(--bg-soft)]" aria-label="Cerrar"><X size={18} /></button></div></div>{!lead ? <p className="mt-6 text-sm text-[var(--fg-muted)]">Cargando...</p> : <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]"><div className="space-y-6"><Section title="Datos enviados"><dl className="grid gap-3 sm:grid-cols-2">{entries.map(([labelText, value, key, fieldConfig]) => { const isButtonObject = value && typeof value === 'object'; const buttonValue = fieldConfig.type === 'button' ? { label: (isButtonObject ? value.label : undefined) || fieldConfig.buttonLabel || labelText, url: (isButtonObject ? value.url : value) || fieldConfig.buttonUrl || '' } : null; const empty = fieldConfig.type === 'button' ? !buttonValue?.url : value === undefined || value === ''; return <div key={key} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3"><dt className="text-xs uppercase tracking-wide text-[var(--fg-faint)]">{labelText}</dt><dd className={`mt-1 break-words text-sm ${empty ? 'text-[var(--fg-faint)] italic' : ''}`}>{empty ? 'Sin completar' : fieldConfig.type === 'button' ? <a href={buttonValue.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-3 py-1.5 text-xs font-medium text-[var(--accent-fg)]">{buttonValue.label} <ExternalLink size={13} /></a> : fieldConfig.type === 'url' ? <a href={String(value)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[var(--fg)] underline"><ExternalLink size={13} />{String(value)}</a> : typeof value === 'object' ? JSON.stringify(value) : String(value)}</dd></div> })}</dl></Section><Section title="Archivos">{lead.files?.length ? <div className="grid gap-2">{lead.files.map((file) => <a key={file.filename} href={resolveMediaUrl(file.url)} target="_blank" rel="noreferrer" className="rounded-xl border border-[var(--border)] p-3 text-sm hover:bg-[var(--bg-soft)]">{file.originalName} · {(file.size / 1024).toFixed(1)} KB</a>)}</div> : <p className="text-sm text-[var(--fg-muted)]">Sin archivos.</p>}</Section></div><aside className="space-y-6"><Section title="Notas internas"><textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows="8" className={field} placeholder="Escribe seguimiento, acuerdos, próxima acción..." /><div className="mt-3"><SaveButton pending={saveNotes.isPending}>Guardar nota</SaveButton></div><Notice error={saveNotes.isError && errorMessage(saveNotes.error)} success={saveNotes.isSuccess && 'Nota guardada.'} /></Section><Section title="Metadatos"><p className="text-sm text-[var(--fg-muted)]">Fecha: {new Date(lead.createdAt).toLocaleString()}</p><p className="mt-2 break-words text-sm text-[var(--fg-muted)]">User agent: {lead.userAgent || '-'}</p><p className="mt-2 text-sm text-[var(--fg-muted)]">Estado: {lead.status || 'new'}</p></Section></aside></div>}</div></div>
}

void LeadDetail

function LeadEditor({ lead, onClose }) {
  const client = useQueryClient()
  const fields = useQuery({ queryKey: ['admin', 'lead-fields'], queryFn: adminApi.leadFields.list })
  const activeFields = (fields.data || []).filter((fieldItem) => fieldItem.active)
  const form = useForm({ defaultValues: { name: lead.name || '', email: lead.email || '', status: lead.status || 'new', values: lead.values || {}, notes: lead.notes || '' } })
  useEffect(() => { form.reset({ name: lead.name || '', email: lead.email || '', status: lead.status || 'new', values: lead.values || {}, notes: lead.notes || '' }) }, [lead, form])
  const save = useMutation({ mutationFn: (values) => { const data = { name: values.name, email: values.email, status: values.status, notes: values.notes, values: values.values || {} }; return idOf(lead) ? adminApi.leads.update(idOf(lead), data) : adminApi.leads.create(data) }, onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', 'leads'] }); onClose() } })
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl bg-[var(--bg-card)] p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">{lead._id ? 'Editar lead' : 'Nuevo lead'}</h2><button onClick={onClose}><X size={18} /></button></div><form onSubmit={form.handleSubmit((values) => save.mutate(values))} className="grid gap-4 sm:grid-cols-2"><Notice error={save.isError && errorMessage(save.error)} /><label className={label}>Nombre<input className={field} {...form.register('name')} /></label><label className={label}>Email<input className={field} type="email" {...form.register('email')} /></label><label className={label}>Estado<select className={field} {...form.register('status')}><option value="new">Nuevo</option><option value="contacted">Contactado</option><option value="qualified">Calificado</option><option value="closed">Cerrado</option></select></label><div className="sm:col-span-2"><p className="mb-2 text-sm font-semibold">Campos del formulario</p><div className="grid gap-3 sm:grid-cols-2">{activeFields.map((fieldItem) => <div key={idOf(fieldItem)} className={fieldItem.type === 'button' ? 'sm:col-span-2' : ''}>{fieldItem.type === 'button' ? <div className="grid gap-3 rounded-xl border border-[var(--border)] p-3 sm:grid-cols-2"><label className={label}>{fieldItem.label} - texto del botón<input className={field} {...form.register(`values.${fieldItem.name}.label`)} /></label><label className={label}>{fieldItem.label} - URL<input className={field} type="url" {...form.register(`values.${fieldItem.name}.url`)} /></label></div> : <label className={label}>{fieldItem.label}{fieldItem.type === 'textarea' ? <textarea className={field} rows="3" {...form.register(`values.${fieldItem.name}`)} /> : <input className={field} type={fieldItem.type === 'email' ? 'email' : fieldItem.type === 'number' ? 'number' : fieldItem.type === 'date' ? 'date' : fieldItem.type === 'url' ? 'url' : 'text'} {...form.register(`values.${fieldItem.name}`)} />}</label>}</div>)}</div></div><label className={`${label} sm:col-span-2`}>Notas<textarea className={field} rows="4" {...form.register('notes')} /></label><div className="flex gap-2 sm:col-span-2"><SaveButton pending={save.isPending} /> <button type="button" onClick={onClose} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm">Cancelar</button></div></form></div></div>
}

export function LeadFieldsSettings() {
  const client = useQueryClient(); const query = useQuery({ queryKey: ['admin', 'lead-fields'], queryFn: adminApi.leadFields.list }); const [editing, setEditing] = useState(null)
  const form = useForm({ defaultValues: { type: 'text', active: true, visible: true, showInTable: true, required: false } })
  const selectedType = form.watch('type')
  useEffect(() => { form.reset(editing ? { ...editing, visible: editing.visible !== false, showInTable: editing.showInTable !== false, optionsText: editing.options?.join('\n') || '' } : { type: 'text', active: true, visible: true, showInTable: true, required: false }) }, [editing, form])
  const save = useMutation({ mutationFn: (values) => { const data = cleanRecord({ ...values, options: values.optionsText?.split('\n').map((x) => x.trim()).filter(Boolean) || [] }); delete data.optionsText; return editing ? adminApi.leadFields.update(idOf(editing), data) : adminApi.leadFields.create(data) }, onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', 'lead-fields'] }); client.invalidateQueries({ queryKey: ['lead-fields'] }); setEditing(null) } })
  const remove = useMutation({ mutationFn: adminApi.leadFields.remove, onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'lead-fields'] }) })
  const reorder = useMutation({ mutationFn: adminApi.leadFields.reorder, onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'lead-fields'] }) })
  const items = query.data || []
  function move(index, offset) { const next = [...items]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; reorder.mutate(next.map(idOf)) }
  return <section><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Leads</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Campos del formulario</h1><div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"><Section title={editing ? 'Editar campo' : 'Nuevo campo'}><form onSubmit={form.handleSubmit((values) => save.mutate(values))} className="grid gap-4 sm:grid-cols-2"><Notice error={save.isError && errorMessage(save.error)} success={save.isSuccess && 'Campo guardado.'} /><label className={label}>Nombre interno<input className={field} {...form.register('name', { required: true })} /></label><label className={label}>Label<input className={field} {...form.register('label', { required: true })} /></label><label className={label}>Tipo<select className={field} {...form.register('type')}>{fieldTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label className={label}>Placeholder<input className={field} {...form.register('placeholder')} /></label>{selectedType === 'button' ? <div className="grid gap-4 rounded-xl border border-[var(--border)] p-4 sm:col-span-2 sm:grid-cols-2"><label className={label}>Texto del botón<input className={field} placeholder="Ir a llamada" {...form.register('buttonLabel')} /></label><label className={label}>URL del botón<input className={field} type="url" placeholder="https://..." {...form.register('buttonUrl')} /></label><p className="text-xs text-[var(--fg-muted)] sm:col-span-2">Estos valores se usarán como botón por defecto en todos los leads que no tengan un valor propio para este campo.</p></div> : <label className={label}>Opciones<textarea className={field} rows="4" {...form.register('optionsText')} /></label>}<div className="grid gap-2 text-sm"><label><input type="checkbox" {...form.register('required')} /> Obligatorio</label><label><input type="checkbox" {...form.register('active')} /> Activo</label><label><input type="checkbox" {...form.register('visible')} /> Visible en formulario público</label><label><input type="checkbox" {...form.register('showInTable')} /> Sugerido en tabla CRM</label></div><div className="flex gap-2 sm:col-span-2"><SaveButton pending={save.isPending} />{editing && <button type="button" onClick={() => setEditing(null)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm">Cancelar</button>}</div></form></Section><Section title={`Campos (${items.length})`}><div className="space-y-2">{items.map((item, index) => <article key={idOf(item)} className="flex items-center gap-2 rounded-xl border border-[var(--border)] p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.label}</p><p className="text-xs text-[var(--fg-muted)]">{item.name} · {item.type}{item.required ? ' · obligatorio' : ''}{item.visible === false ? ' · oculto en formulario' : ''}{item.showInTable === false ? ' · no sugerido en tabla' : ''}</p></div><button disabled={index === 0} onClick={() => move(index, -1)}><ArrowUp size={15} /></button><button disabled={index === items.length - 1} onClick={() => move(index, 1)}><ArrowDown size={15} /></button><button onClick={() => setEditing(item)}><Pencil size={15} /></button><button className="text-red-500" onClick={() => remove.mutate(idOf(item))}><Trash2 size={15} /></button></article>)}</div></Section></div></section>
}

function flattenPayload(value, prefix = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return prefix ? [[prefix, value]] : []
  return Object.entries(value).flatMap(([key, child]) => flattenPayload(child, prefix ? `${prefix}.${key}` : key))
}

function InboundWebhookBuilder() {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'lead-inbound-webhooks'], queryFn: adminApi.leadInboundWebhooks.list })
  const fields = useQuery({ queryKey: ['admin', 'lead-fields'], queryFn: adminApi.leadFields.list })
  const [selected, setSelected] = useState(null)
  const form = useForm({ defaultValues: { name: '', active: true } })
  const create = useMutation({ mutationFn: adminApi.leadInboundWebhooks.create, onSuccess: (webhook) => { client.invalidateQueries({ queryKey: ['admin', 'lead-inbound-webhooks'] }); setSelected(webhook) } })
  const update = useMutation({ mutationFn: ({ id, data }) => adminApi.leadInboundWebhooks.update(id, data), onSuccess: (webhook) => { client.invalidateQueries({ queryKey: ['admin', 'lead-inbound-webhooks'] }); setSelected(webhook) } })
  const remove = useMutation({ mutationFn: adminApi.leadInboundWebhooks.remove, onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', 'lead-inbound-webhooks'] }); setSelected(null) } })
  const items = query.data || []
  const activeFields = (fields.data || []).filter((item) => item.active)
  const webhook = selected ? (items.find((item) => idOf(item) === idOf(selected)) || selected) : items[0]
  const received = flattenPayload(webhook?.lastPayload || {})
  const webhookUrl = webhook ? `${new URL(apiUrl).origin}/api/v1/lead-inbox/${webhook.token}` : ''

  function saveMapping(sourcePath, targetField) {
    const mappings = (webhook.mappings || []).filter((mapping) => mapping.sourcePath !== sourcePath)
    if (targetField) mappings.push({ sourcePath, targetField })
    update.mutate({ id: idOf(webhook), data: { mappings } })
  }

  return <Section title="Webhooks entrantes"><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="space-y-5"><form onSubmit={form.handleSubmit((values) => create.mutate(values))} className="grid gap-3 sm:grid-cols-[1fr_auto]"><label className={label}>Nombre del webhook<input className={field} placeholder="Cal.com agenda de llamadas" {...form.register('name', { required: true })} /></label><div className="flex items-end"><SaveButton pending={create.isPending}>Crear URL</SaveButton></div></form>{webhook && <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4"><p className="text-sm font-semibold">URL para pegar en Cal.com u otra herramienta</p><code className="mt-2 block overflow-x-auto rounded-lg bg-[var(--bg-card)] p-3 text-xs text-[var(--fg-muted)]">{webhookUrl}</code><p className="mt-3 text-xs text-[var(--fg-muted)]">Después de enviar una prueba desde la herramienta externa, recarga o vuelve a esta pantalla y aparecerán los campos recibidos abajo.</p></div>}{webhook && <div className="rounded-2xl border border-[var(--border)] p-4"><div className="flex items-center justify-between gap-3"><div><p className="font-semibold">{webhook.name}</p><p className="text-xs text-[var(--fg-muted)]">{webhook.active ? 'Activo' : 'Inactivo'} · {webhook.lastReceivedAt ? `Última prueba ${new Date(webhook.lastReceivedAt).toLocaleString()}` : 'Sin pruebas recibidas'}</p></div><button className="text-red-500" onClick={() => remove.mutate(idOf(webhook))}><Trash2 size={16} /></button></div></div>}{webhook && <div className="space-y-2"><h3 className="text-sm font-semibold">Campos recibidos y mapeo</h3>{received.length ? received.map(([path, value]) => { const current = (webhook.mappings || []).find((mapping) => mapping.sourcePath === path)?.targetField || ''; return <div key={path} className="grid gap-2 rounded-xl border border-[var(--border)] p-3 sm:grid-cols-[1fr_220px]"><div className="min-w-0"><p className="truncate text-sm font-medium">{path}</p><p className="truncate text-xs text-[var(--fg-muted)]">{String(value)}</p></div><select className={field} value={current} onChange={(event) => saveMapping(path, event.target.value)}><option value="">No vincular</option>{activeFields.map((fieldItem) => <option key={idOf(fieldItem)} value={fieldItem.name}>{fieldItem.label} ({fieldItem.name})</option>)}</select></div> }) : <p className="rounded-xl border border-dashed border-[var(--border)] p-4 text-sm text-[var(--fg-muted)]">Todavía no se ha recibido una prueba para este webhook.</p>}</div>}</div><aside className="space-y-2"><p className="text-sm font-semibold">Webhooks creados</p>{items.map((item) => <button key={idOf(item)} onClick={() => setSelected(item)} className={`block w-full rounded-xl border p-3 text-left text-sm ${idOf(webhook) === idOf(item) ? 'border-[var(--fg)] bg-[var(--bg-soft)]' : 'border-[var(--border)]'}`}><span className="font-medium">{item.name}</span><span className="mt-1 block truncate text-xs text-[var(--fg-muted)]">{item.token}</span></button>)}</aside></div></Section>
}

export function LeadWebhookSettings() {
  const client = useQueryClient(); const query = useQuery({ queryKey: ['admin', 'lead-webhooks'], queryFn: adminApi.leadWebhooks.list }); const [editing, setEditing] = useState(null)
  const form = useForm({ defaultValues: { method: 'POST', active: true } })
  useEffect(() => { form.reset(editing ? { ...editing, headersText: JSON.stringify(editing.headers || {}, null, 2) } : { method: 'POST', active: true }) }, [editing, form])
  const save = useMutation({ mutationFn: (values) => { const data = cleanRecord({ ...values, headers: values.headersText ? JSON.parse(values.headersText) : {} }); delete data.headersText; return editing ? adminApi.leadWebhooks.update(idOf(editing), data) : adminApi.leadWebhooks.create(data) }, onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', 'lead-webhooks'] }); setEditing(null) } })
  const remove = useMutation({ mutationFn: adminApi.leadWebhooks.remove, onSuccess: () => client.invalidateQueries({ queryKey: ['admin', 'lead-webhooks'] }) })
  return <section><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Leads</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1><div className="mt-7 space-y-6"><InboundWebhookBuilder /><div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"><Section title={editing ? 'Editar webhook saliente' : 'Nuevo webhook saliente'}><form onSubmit={form.handleSubmit((values) => save.mutate(values))} className="grid gap-4"><Notice error={save.isError && errorMessage(save.error)} success={save.isSuccess && 'Webhook guardado.'} /><label className={label}>Nombre<input className={field} {...form.register('name', { required: true })} /></label><label className={label}>URL<input className={field} type="url" {...form.register('url', { required: true })} /></label><label className={label}>Headers JSON<textarea className={field} rows="4" {...form.register('headersText')} /></label><label className={label}>Secret/token<input className={field} {...form.register('secret')} /></label><label className="text-sm"><input type="checkbox" {...form.register('active')} /> Activo</label><SaveButton pending={save.isPending} /></form></Section><Section title="Webhooks salientes"><div className="space-y-2">{(query.data || []).map((item) => <article key={idOf(item)} className="flex items-center gap-2 rounded-xl border border-[var(--border)] p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.name}</p><p className="truncate text-xs text-[var(--fg-muted)]">{item.url} · {item.active ? 'activo' : 'inactivo'}</p></div><button onClick={() => setEditing(item)}><Pencil size={15} /></button><button className="text-red-500" onClick={() => remove.mutate(idOf(item))}><Trash2 size={15} /></button></article>)}</div></Section></div></div></section>
}
