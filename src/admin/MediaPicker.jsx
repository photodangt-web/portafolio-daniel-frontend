import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, FileAudio, ImagePlus, MoreVertical, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '../api/admin'
import { resolveMediaUrl } from '../api/client'

const kinds = new Set(['all', 'image', 'video', 'audio'])
const idOf = (item) => item.id || item._id
const errorMessage = (error) => error?.response?.data?.message || error?.response?.data?.error?.message || error?.message || 'No fue posible completar la operación.'
export const mediaKind = (item) => {
  const type = item?.mimeType || item?.mimetype || item?.type || ''
  if (type.startsWith('image/') || /\.(avif|gif|jpe?g|png|svg|webp)(\?.*)?$/i.test(item?.url || '')) return 'image'
  if (type.startsWith('video/') || /\.(mp4|mov|ogg|webm)(\?.*)?$/i.test(item?.url || '')) return 'video'
  if (type.startsWith('audio/') || /\.(aac|flac|m4a|mp3|oga|ogg|opus|wav)(\?.*)?$/i.test(item?.url || '')) return 'audio'
  return 'other'
}

function Preview({ item }) {
  const kind = mediaKind(item)
  const src = resolveMediaUrl(item.url)
  if (kind === 'image') return <img src={src} alt={item.alt || item.originalName || ''} className="media-card-preview" />
  if (kind === 'video') return <video src={src} preload="metadata" muted className="media-card-preview" />
  return <div className="media-card-file"><FileAudio size={28} /><span>{kind === 'audio' ? 'Audio' : 'Archivo'}</span></div>
}

function ConfirmDelete({ pending, error, onCancel, onConfirm }) {
  return <div className="fixed inset-0 z-[60] grid place-items-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="delete-media-title"><div className="w-full max-w-sm rounded-2xl bg-[var(--bg-card)] p-5 shadow-xl"><h2 id="delete-media-title" className="font-semibold">¿Eliminar este archivo?</h2><p className="mt-2 text-sm text-[var(--fg-muted)]">Esta acción no se puede deshacer.</p>{error && <p className="mt-3 text-sm text-red-600">{error}</p>}<div className="mt-5 flex justify-end gap-2"><button type="button" onClick={onCancel} className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm">Cancelar</button><button type="button" disabled={pending} onClick={onConfirm} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-60">{pending ? 'Eliminando...' : 'Eliminar'}</button></div></div></div>
}

function MediaCard({ item, onSelect, selectable, onDelete }) {
  const [menu, setMenu] = useState(false)
  const menuRef = useRef(null)
  useEffect(() => { const close = (event) => { if (!menuRef.current?.contains(event.target)) setMenu(false) }; document.addEventListener('pointerdown', close); return () => document.removeEventListener('pointerdown', close) }, [])
  const copy = async () => { try { await navigator.clipboard.writeText(resolveMediaUrl(item.url)); toast.success('URL copiada') } catch { toast.error('No fue posible copiar la URL') } setMenu(false) }
  return <article className="media-card" onContextMenu={(event) => { event.preventDefault(); setMenu(true) }}><button type="button" onClick={() => selectable && onSelect?.(item)} className="media-card-select" aria-label={`Usar ${item.alt || item.originalName || 'medio'}`}><Preview item={item} /><span className="media-card-name">{item.alt || item.originalName || 'Sin nombre'}</span></button><div className="media-card-actions" ref={menuRef}><button type="button" onClick={() => setMenu((open) => !open)} className="media-card-kebab" aria-label="Acciones del medio" aria-expanded={menu}><MoreVertical size={17} /></button>{menu && <div className="media-card-menu" role="menu"><button type="button" role="menuitem" onClick={copy}><Copy size={14} /> Copiar URL</button><button type="button" role="menuitem" onClick={() => { onSelect?.(item); setMenu(false) }}><ImagePlus size={14} /> {selectable ? 'Seleccionar' : 'Usar'}</button><button type="button" role="menuitem" onClick={() => { onDelete(item, 'duplicate'); setMenu(false) }}><Copy size={14} /> Duplicar</button><button type="button" role="menuitem" onClick={() => { onDelete(item, 'delete'); setMenu(false) }} className="is-danger"><Trash2 size={14} /> Eliminar</button></div>}</div></article>
}

export function MediaLibrary({ open = true, onClose, onSelect, accept = 'all', standalone = false }) {
  const [filter, setFilter] = useState(kinds.has(accept) && accept !== 'all' ? accept : 'all')
  const [alt, setAlt] = useState('')
  const [progress, setProgress] = useState(0)
  const [confirming, setConfirming] = useState(null)
  const client = useQueryClient()
  const media = useQuery({ queryKey: ['admin', 'media'], queryFn: adminApi.media.list, enabled: open })
  const refresh = () => client.invalidateQueries({ queryKey: ['admin', 'media'] })
  const upload = useMutation({ mutationFn: (file) => adminApi.media.upload(file, alt, (event) => setProgress(event.total ? Math.round((event.loaded / event.total) * 100) : 0)), onSuccess: (item) => { refresh(); toast.success('Archivo subido'); onSelect?.(item); onClose?.(); setAlt(''); setProgress(0) }, onError: (e) => { setProgress(0); toast.error(errorMessage(e)) } })
  const duplicate = useMutation({ mutationFn: adminApi.media.duplicate, onSuccess: () => { refresh(); toast.success('Medio duplicado') }, onError: (e) => toast.error(errorMessage(e)) })
  const remove = useMutation({ mutationFn: adminApi.media.remove, onSuccess: () => { refresh(); setConfirming(null); toast.success('Medio eliminado') } })
  if (!open) return null
  const items = (media.data || []).filter((item) => filter === 'all' || mediaKind(item) === filter)
  const action = (item, type) => type === 'duplicate' ? duplicate.mutate(idOf(item)) : setConfirming(item)
  const body = <><div className="media-library-head"><div><h2 className="font-semibold">Biblioteca de medios</h2><p className="mt-1 text-xs text-[var(--fg-muted)]">Sube, organiza y reutiliza imágenes, vídeos y audio.</p></div>{onClose && <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-[var(--bg-soft)]" aria-label="Cerrar biblioteca"><X size={18} /></button>}</div><div className="media-library-upload"><input type="file" accept="image/*,video/*,audio/*" disabled={upload.isPending} onChange={(event) => { const file = event.target.files?.[0]; if (file) upload.mutate(file); event.target.value = '' }} /><input value={alt} onChange={(event) => setAlt(event.target.value)} maxLength="160" placeholder="Texto alternativo o descripción" /></div>{upload.isPending && <div className="media-upload-progress" role="status">Subiendo {progress}%<span style={{ width: `${progress}%` }} /></div>}<div className="media-library-tabs" role="tablist" aria-label="Filtrar medios">{[['all', 'Todo'], ['image', 'Imágenes'], ['video', 'Vídeos'], ['audio', 'Audio']].map(([value, name]) => <button type="button" key={value} role="tab" aria-selected={filter === value} onClick={() => setFilter(value)}>{name}</button>)}</div>{media.isLoading ? <p className="mt-6 text-sm text-[var(--fg-muted)]">Cargando medios...</p> : <div className="media-library-grid">{items.map((item) => <MediaCard key={idOf(item)} item={item} selectable={Boolean(onSelect)} onSelect={onSelect} onDelete={action} />)}</div>}{!media.isLoading && !items.length && <p className="mt-6 text-sm text-[var(--fg-muted)]">No hay medios en este filtro.</p>}{confirming && <ConfirmDelete pending={remove.isPending} error={remove.isError && errorMessage(remove.error)} onCancel={() => setConfirming(null)} onConfirm={() => remove.mutate(idOf(confirming))} />}</>
  if (standalone) return <div className="media-library-panel">{body}</div>
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Biblioteca de medios"><div className="media-library-dialog">{body}</div></div>
}

export default function MediaPicker({ value, onChange, label = 'Imagen', accept = 'image' }) {
  const [open, setOpen] = useState(false)
  const kind = accept === 'all' ? 'all' : kinds.has(accept) ? accept : 'image'
  const previewKind = mediaKind({ url: value })
  return <div><span className="block text-xs font-medium text-[var(--fg-muted)]">{label}</span><div className="mt-1.5 flex items-center gap-3">{value && previewKind === 'video' ? <video src={resolveMediaUrl(value)} muted className="h-12 w-16 rounded-lg border border-[var(--border)] object-cover" /> : value ? <img src={resolveMediaUrl(value)} alt="" className="h-12 w-16 rounded-lg border border-[var(--border)] object-cover" /> : null}<button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm hover:bg-[var(--bg-soft)]"><ImagePlus size={16} /> {value ? 'Cambiar' : 'Seleccionar medio'}</button>{value && <button type="button" onClick={() => onChange('')} className="rounded-lg p-2 text-[var(--fg-muted)] hover:bg-[var(--bg-soft)]" aria-label="Quitar medio"><X size={16} /></button>}</div><MediaLibrary open={open} onClose={() => setOpen(false)} accept={kind} onSelect={(item) => { onChange(item.url); setOpen(false) }} /></div>
}
