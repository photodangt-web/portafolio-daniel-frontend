import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '../api/admin'
import { resolveMediaUrl } from '../api/client'
import MediaPicker from './MediaPicker'
import { emptyBlock, emptySlide, slidePreview } from '../projects/slides'

const text = (max, required = false) =>
  required ? z.string().trim().min(1, 'Obligatorio').max(max) : z.string().max(max).optional().or(z.literal(''))
const url = z.string().url('URL no válida').optional().or(z.literal(''))
const schema = z.object({
  title: text(160, true),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa minúsculas, números y guiones').max(180),
  tagline: text(240),
  summary: text(1000, true),
  content: text(10000),
  category: text(80, true),
  technologiesText: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']),
  featured: z.boolean(),
  coverImage: z.string().optional(),
  gallery: z.array(z.string()),
  liveUrl: url,
  repositoryUrl: url,
  seoTitle: text(160),
  seoDescription: text(320),
  seoKeywordsText: z.string().optional(),
})
const emptyForm = {
  status: 'draft',
  featured: false,
  gallery: [],
  tagline: '',
  slides: [],
}
const idOf = (item) => item?.id || item?._id
const errorMessage = (error) => {
  const message = error?.response?.data?.message || error?.response?.data?.error?.message || error?.message
  return Array.isArray(message) ? message.join(' ') : message || 'No fue posible guardar los cambios.'
}
const inputClass = 'mt-1.5 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm outline-none transition focus:border-[var(--fg)]'
const labelClass = 'block text-xs font-medium text-[var(--fg-muted)]'
const nestedBlockTypes = [
  ['heading', 'Encabezado'],
  ['paragraph', 'Párrafo'],
  ['table', 'Tabla'],
  ['image', 'Imagen'],
  ['video', 'Video'],
]
const blockTypes = [
  ...nestedBlockTypes,
  ['gallery', 'Galería apilada'],
  ['hero', 'Imagen + texto'],
  ['markdown', 'Markdown'],
]
const columnPresets = [2, 3, 4]

function MarkdownField({ value, onChange }) {
  const [view, setView] = useState('split')
  const insert = (snippet) => onChange(`${value || ''}${value ? '\n\n' : ''}${snippet}`)
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1">
        {[['editor', 'Código'], ['split', 'Ambos'], ['preview', 'Preview']].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setView(id)} className={`rounded-full border px-3 py-1 text-xs ${view === id ? 'border-[var(--fg)] bg-[var(--bg-soft)]' : 'border-[var(--border-strong)]'}`}>{label}</button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        {[
          ['Título', '## Título'],
          ['Cita', '> Una idea clave.'],
          ['Código', '```js\nconst ready = true\n```'],
          ['Lista', '- Uno\n- Dos'],
          ['Tabla', '| A | B |\n| --- | --- |\n| 1 | 2 |'],
        ].map(([label, snippet]) => (
          <button key={label} type="button" className="rounded-full border border-[var(--border)] px-2 py-1 text-[11px] text-[var(--fg-muted)]" onClick={() => insert(snippet)}>{label}</button>
        ))}
      </div>
      <div className={`grid gap-3 ${view === 'split' ? 'lg:grid-cols-2' : ''}`}>
        {(view === 'editor' || view === 'split') && (
          <textarea className={`${inputClass} min-h-56 font-mono text-[13px]`} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder="# Título&#10;&#10;Escribe markdown..." />
        )}
        {(view === 'preview' || view === 'split') && (
          <div className="article-content min-h-56 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-4 text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml>{value || '_La vista previa aparecerá aquí._'}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return <label className={labelClass}>{label}{children}</label>
}

function BlockEditor({ block, onChange, onRemove, onMove, index, total, nested = false }) {
  const set = (patch) => onChange({ ...block, ...patch })
  const types = nested ? nestedBlockTypes : blockTypes
  return (
    <article className="admin-block-card space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{types.find(([type]) => type === block.type)?.[1] || (block.type === 'columns' ? `${block.columns || 2} columnas` : block.type)}</p>
        <div className="flex gap-1">
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="rounded-lg p-1.5 disabled:opacity-30" aria-label="Subir bloque"><ArrowUp size={14} /></button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove(1)} className="rounded-lg p-1.5 disabled:opacity-30" aria-label="Bajar bloque"><ArrowDown size={14} /></button>
          <button type="button" onClick={onRemove} className="rounded-lg p-1.5 text-red-600" aria-label="Eliminar bloque"><Trash2 size={14} /></button>
        </div>
      </div>
      {block.type === 'heading' && (
        <div className="grid gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
          <Field label="Nivel">
            <select className={inputClass} value={block.level || 2} onChange={(event) => set({ level: Number(event.target.value) })}>
              <option value={1}>H1</option>
              <option value={2}>H2</option>
              <option value={3}>H3</option>
            </select>
          </Field>
          <Field label="Texto">
            <input className={inputClass} value={block.text || ''} onChange={(event) => set({ text: event.target.value })} />
          </Field>
        </div>
      )}
      {block.type === 'paragraph' && (
        <Field label="Texto corto">
          <textarea className={inputClass} rows="4" value={block.text || ''} onChange={(event) => set({ text: event.target.value })} />
        </Field>
      )}
      {block.type === 'image' && (
        <MediaPicker value={block.src} onChange={(src) => set({ src })} label="Imagen única" />
      )}
      {block.type === 'gallery' && (
        <div>
          <Field label="Estilo">
            <select className={inputClass} value={block.layout || 'stack'} onChange={(event) => set({ layout: event.target.value })}>
              <option value="stack">Cartas apiladas</option>
              <option value="film">Carrusel editorial</option>
              <option value="grid">Mosaico interactivo</option>
              <option value="marquee">Cinta continua</option>
              <option value="thumbs">Slideshow + miniaturas</option>
            </select>
          </Field>
          <p className={`${labelClass} mt-3`}>Imágenes</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(block.images || []).map((image, imageIndex) => (
              <div key={`${image}-${imageIndex}`} className="relative">
                <img src={resolveMediaUrl(image)} alt="" className="h-16 w-20 rounded-lg object-cover" />
                <button type="button" onClick={() => set({ images: block.images.filter((_, i) => i !== imageIndex) })} className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white" aria-label="Quitar imagen"><X size={12} /></button>
              </div>
            ))}
          </div>
          <div className="mt-3">
            <MediaPicker value="" onChange={(src) => src && set({ images: [...(block.images || []), src] })} label="Añadir imagen" />
          </div>
        </div>
      )}
      {block.type === 'video' && (
        <Field label="URL de YouTube o Vimeo">
          <input className={inputClass} value={block.url || ''} onChange={(event) => set({ url: event.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
        </Field>
      )}
      {block.type === 'table' && (
        <div className="space-y-3">
          <Field label="Encabezados (coma)">
            <input
              className={inputClass}
              value={(block.headers || []).join(', ')}
              onChange={(event) => set({ headers: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
            />
          </Field>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <tbody>
                {(block.rows || []).map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {(block.headers || ['Columna']).map((_, cellIndex) => (
                      <td key={cellIndex} className="p-1">
                        <input
                          className={inputClass}
                          value={row[cellIndex] || ''}
                          onChange={(event) => {
                            const rows = (block.rows || []).map((row, currentIndex) => {
                              if (currentIndex !== rowIndex) return row
                              const next = [...row]
                              while (next.length <= cellIndex) next.push('')
                              next[cellIndex] = event.target.value
                              return next
                            })
                            set({ rows })
                          }}
                        />
                      </td>
                    ))}
                    <td className="p-1">
                      <button type="button" className="text-xs text-red-600" onClick={() => set({ rows: block.rows.filter((_, i) => i !== rowIndex) })}>Quitar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            type="button"
            className="text-sm"
            onClick={() => set({ rows: [...(block.rows || []), (block.headers || ['']).map(() => '')] })}
          >
            Añadir fila
          </button>
        </div>
      )}
      {block.type === 'hero' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <MediaPicker value={block.src} onChange={(src) => set({ src })} label="Imagen de fondo" />
          </div>
          <Field label="Título"><input className={inputClass} value={block.title || ''} onChange={(event) => set({ title: event.target.value })} /></Field>
          <Field label="Alineación">
            <select className={inputClass} value={block.align || 'left'} onChange={(event) => set({ align: event.target.value })}>
              <option value="left">Texto a la izquierda</option>
              <option value="right">Texto a la derecha</option>
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Párrafo"><textarea className={inputClass} rows="4" value={block.text || ''} onChange={(event) => set({ text: event.target.value })} /></Field>
          </div>
          <Field label="Texto del botón"><input className={inputClass} value={block.ctaLabel || ''} onChange={(event) => set({ ctaLabel: event.target.value })} /></Field>
          <Field label="URL del botón"><input className={inputClass} value={block.url || ''} onChange={(event) => set({ url: event.target.value })} /></Field>
        </div>
      )}
      {block.type === 'markdown' && (
        <MarkdownField value={block.text} onChange={(text) => set({ text })} />
      )}
      {block.type === 'columns' && (
        <div className={`grid gap-3 ${block.columns === 4 ? 'xl:grid-cols-4' : block.columns === 3 ? 'lg:grid-cols-3' : 'md:grid-cols-2'}`}>
          {(block.items || []).map((column, columnIndex) => (
            <div key={columnIndex} className="rounded-xl border border-[var(--border)] p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--fg-faint)]">Columna {columnIndex + 1}</p>
              <div className="mb-2 flex flex-wrap gap-1">
                {nestedBlockTypes.map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    className="rounded-full border border-[var(--border-strong)] px-2 py-1 text-[11px]"
                    onClick={() => {
                      const items = (block.items || []).map((item, index) => (index === columnIndex ? [...item, emptyBlock(type)] : item))
                      set({ items })
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="space-y-2">
                {(column || []).map((child, childIndex) => (
                  <BlockEditor
                    key={child.id || childIndex}
                    nested
                    block={child}
                    index={childIndex}
                    total={(column || []).length}
                    onChange={(next) => {
                      const items = (block.items || []).map((item, index) => (index === columnIndex ? item.map((current, currentIndex) => (currentIndex === childIndex ? next : current)) : item))
                      set({ items })
                    }}
                    onRemove={() => {
                      const items = (block.items || []).map((item, index) => (index === columnIndex ? item.filter((_, currentIndex) => currentIndex !== childIndex) : item))
                      set({ items })
                    }}
                    onMove={(offset) => {
                      const to = childIndex + offset
                      if (to < 0 || to >= (column || []).length) return
                      const nextColumn = [...column]
                      const [item] = nextColumn.splice(childIndex, 1)
                      nextColumn.splice(to, 0, item)
                      const items = (block.items || []).map((item, index) => (index === columnIndex ? nextColumn : item))
                      set({ items })
                    }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </article>
  )
}

function ProjectEditor({ editing, onClose }) {
  const client = useQueryClient()
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: editing && idOf(editing)
      ? {
          ...emptyForm,
          ...editing,
          technologiesText: editing.technologies?.join(', ') || '',
          seoKeywordsText: editing.seoKeywords?.join(', ') || '',
          gallery: editing.gallery || [],
        }
      : emptyForm,
  })
  const [slides, setSlides] = useState(() => (editing?.slides?.length ? editing.slides : []))
  const [active, setActive] = useState(0)
  const gallery = form.watch('gallery') || []
  const current = slides[active]
  const save = useMutation({
    mutationFn: (values) => {
      const data = {
        ...values,
        technologies: values.technologiesText?.split(',').map((item) => item.trim()).filter(Boolean) || [],
        seoKeywords: values.seoKeywordsText?.split(',').map((item) => item.trim()).filter(Boolean) || [],
        slides,
      }
      delete data.technologiesText
      delete data.seoKeywordsText
      ;['content', 'coverImage', 'liveUrl', 'repositoryUrl', 'seoTitle', 'seoDescription', 'tagline'].forEach((key) => {
        if (typeof data[key] === 'string' && data[key].trim() === '') delete data[key]
      })
      return idOf(editing) ? adminApi.projects.update(idOf(editing), data) : adminApi.projects.create(data)
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin', 'projects'] })
      client.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Proyecto guardado')
      onClose()
    },
    onError: (error) => toast.error(errorMessage(error)),
  })

  function updateSlide(nextSlide) {
    setSlides((currentSlides) => currentSlides.map((slide, index) => (index === active ? nextSlide : slide)))
  }

  function moveSlide(from, to) {
    if (to < 0 || to >= slides.length) return
    const next = [...slides]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    setSlides(next)
    setActive(to)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-[var(--bg)] p-4 sm:p-6">
      <form onSubmit={form.handleSubmit((values) => save.mutate(values))} className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[var(--fg-faint)]">Recorrido del proyecto</p>
            <h2 className="text-2xl font-semibold">{idOf(editing) ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm">Cerrar</button>
            <button disabled={save.isPending} className="rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)]">{save.isPending ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <h3 className="font-semibold">Ficha y portada</h3>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Título"><input className={inputClass} {...form.register('title')} /></Field>
            <Field label="Slug"><input className={inputClass} {...form.register('slug')} /></Field>
            <Field label="Tagline / subtítulo de portada"><input className={inputClass} {...form.register('tagline')} /></Field>
            <Field label="Categoría"><input className={inputClass} {...form.register('category')} /></Field>
            <Field label="Resumen">
              <textarea className={inputClass} rows="3" {...form.register('summary')} />
            </Field>
            <Field label="Tecnologías">
              <input className={inputClass} {...form.register('technologiesText')} />
            </Field>
            <Field label="Estado">
              <select className={inputClass} {...form.register('status')}>
                <option value="draft">Borrador</option>
                <option value="published">Publicado</option>
                <option value="archived">Archivado</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" {...form.register('featured')} /> Destacado</label>
            <MediaPicker value={form.watch('coverImage')} onChange={(value) => form.setValue('coverImage', value, { shouldDirty: true })} label="Media de portada" accept="all" />
            <Field label="URL en vivo"><input className={inputClass} {...form.register('liveUrl')} /></Field>
            <Field label="Repositorio"><input className={inputClass} {...form.register('repositoryUrl')} /></Field>
            <div>
              <p className={labelClass}>Galería de respaldo</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {gallery.map((image, index) => (
                  <div key={`${image}-${index}`} className="relative">
                    <img src={resolveMediaUrl(image)} alt="" className="h-16 w-20 rounded-lg object-cover" />
                    <button type="button" onClick={() => form.setValue('gallery', gallery.filter((_, i) => i !== index), { shouldDirty: true })} className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1 text-white"><X size={12} /></button>
                  </div>
                ))}
              </div>
              <MediaPicker value="" onChange={(url) => form.setValue('gallery', [...gallery, url], { shouldDirty: true })} label="Añadir a galería" />
            </div>
            <Field label="SEO título"><input className={inputClass} {...form.register('seoTitle')} /></Field>
            <Field label="SEO descripción"><textarea className={inputClass} rows="3" {...form.register('seoDescription')} /></Field>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold">Slides</h3>
              <p className="text-sm text-[var(--fg-muted)]">Arma el recorrido bloque a bloque. La portada se genera sola con título, tagline y media.</p>
            </div>
            <button type="button" onClick={() => { setSlides((items) => [...items, emptySlide()]); setActive(slides.length) }} className="inline-flex items-center gap-1 rounded-full border border-[var(--border-strong)] px-3 py-2 text-sm"><Plus size={15} /> Añadir slide</button>
          </div>
          <div className="admin-project-editor">
            <div className="admin-slide-list">
              {slides.length === 0 && <p className="p-4 text-sm text-[var(--fg-muted)]">Todavía no hay slides. Si publicas así, el recorrido usará resumen, galería y stack.</p>}
              {slides.map((slide, index) => {
                const preview = slidePreview(slide)
                return (
                  <div key={slide.id || index} className={`admin-slide-row border-b border-[var(--border)] ${index === active ? 'is-active' : ''}`}>
                    <span className="px-2 text-[var(--fg-faint)]" aria-hidden><GripVertical size={14} /></span>
                    <button type="button" onClick={() => setActive(index)} className={`admin-slide-item ${index === active ? 'is-active' : ''}`}>
                      <span className="font-mono text-[10px] text-[var(--fg-faint)]">{String(index + 1).padStart(2, '0')}</span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{preview.title}</span>
                        <span className="block truncate text-[11px] text-[var(--fg-muted)]">{preview.detail}</span>
                      </span>
                    </button>
                    <div className="admin-slide-actions">
                      <button type="button" onClick={() => moveSlide(index, index - 1)} className="p-1 disabled:opacity-30" disabled={index === 0} aria-label="Subir slide"><ArrowUp size={13} /></button>
                      <button type="button" onClick={() => moveSlide(index, index + 1)} className="p-1 disabled:opacity-30" disabled={index === slides.length - 1} aria-label="Bajar slide"><ArrowDown size={13} /></button>
                      <button type="button" onClick={() => { setSlides(slides.filter((_, i) => i !== index)); setActive(Math.max(0, index - 1)) }} className="p-1 text-red-600" aria-label="Eliminar slide"><Trash2 size={13} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
            {current && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {blockTypes.map(([type, label]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => updateSlide({ ...current, blocks: [...current.blocks, emptyBlock(type)] })}
                      className="rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-xs hover:bg-[var(--bg-soft)]"
                    >
                      {label}
                    </button>
                  ))}
                  {columnPresets.map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => updateSlide({ ...current, blocks: [...current.blocks, emptyBlock('columns', { columns: count })] })}
                      className="rounded-full border border-[var(--border-strong)] px-3 py-1.5 text-xs hover:bg-[var(--bg-soft)]"
                    >
                      {count} columnas
                    </button>
                  ))}
                </div>
                {current.blocks.map((block, index) => (
                  <BlockEditor
                    key={block.id || index}
                    block={block}
                    index={index}
                    total={current.blocks.length}
                    onChange={(next) => updateSlide({ ...current, blocks: current.blocks.map((item, itemIndex) => (itemIndex === index ? next : item)) })}
                    onRemove={() => updateSlide({ ...current, blocks: current.blocks.filter((_, itemIndex) => itemIndex !== index) })}
                    onMove={(offset) => {
                      const to = index + offset
                      if (to < 0 || to >= current.blocks.length) return
                      const blocks = [...current.blocks]
                      const [item] = blocks.splice(index, 1)
                      blocks.splice(to, 0, item)
                      updateSlide({ ...current, blocks })
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </form>
    </div>
  )
}

export default function AdminProjects() {
  const query = useQuery({ queryKey: ['admin', 'projects'], queryFn: adminApi.projects.list })
  const client = useQueryClient()
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const items = query.data || []
  const remove = useMutation({
    mutationFn: (id) => adminApi.projects.remove(id),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin', 'projects'] })
      client.invalidateQueries({ queryKey: ['projects'] })
      setDeleting(null)
      toast.success('Proyecto eliminado')
    },
    onError: (error) => toast.error(errorMessage(error)),
  })
  const published = useMemo(() => items.filter((item) => item.status === 'published').length, [items])

  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Proyectos ({items.length})</h2>
          <p className="text-sm text-[var(--fg-muted)]">{published} publicados. Cada uno abre un recorrido en /proyectos/slug.</p>
        </div>
        <button type="button" onClick={() => setEditing({})} className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)]"><Plus size={16} /> Nuevo proyecto</button>
      </div>
      {query.isLoading ? <p className="mt-5 text-sm text-[var(--fg-muted)]">Cargando...</p> : (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead className="bg-[var(--bg-soft)]/60 text-[11px] uppercase tracking-[0.14em] text-[var(--fg-faint)]">
              <tr>
                <th className="px-4 py-3 text-left">Proyecto</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Slides</th>
                <th className="px-4 py-3 text-left">Tecnologías</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <tr key={idOf(item)} className="hover:bg-[var(--bg-soft)]/45">
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-[var(--fg-muted)]">/proyectos/{item.slug}</p>
                  </td>
                  <td className="px-4 py-3 capitalize text-[var(--fg-muted)]">{item.status}</td>
                  <td className="px-4 py-3 text-[var(--fg-muted)]">{item.slides?.length || 0}</td>
                  <td className="max-w-[240px] truncate px-4 py-3 text-[var(--fg-muted)]">{item.technologies?.join(', ') || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setEditing(item)} className="rounded-lg p-1.5 hover:bg-[var(--bg)]" aria-label="Editar"><Pencil size={15} /></button>
                      <button type="button" onClick={() => setDeleting(item)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-500/10" aria-label="Eliminar"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && <ProjectEditor editing={editing} onClose={() => setEditing(null)} />}
      {deleting && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[var(--bg-card)] p-5">
            <h2 className="font-semibold">¿Eliminar {deleting.title}?</h2>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">Esta acción no se puede deshacer.</p>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleting(null)} className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm">Cancelar</button>
              <button type="button" disabled={remove.isPending} onClick={() => remove.mutate(idOf(deleting))} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white">{remove.isPending ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
