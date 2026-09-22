import { useEffect, useState } from 'react'
import { useFieldArray, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { adminApi } from '../api/admin'
import { sectionHeaders as defaultSectionHeaders } from '../data/content'
import MediaPicker, { MediaLibrary as SharedMediaLibrary } from './MediaPicker'
import AdminProjects from './AdminProjects'
import SkillIcon from '../components/SkillIcon'

const text = (max, required = false) => required ? z.string().trim().min(1, 'Obligatorio').max(max) : z.string().max(max).optional().or(z.literal(''))
const url = z.string().url('URL no válida').optional().or(z.literal(''))
const date = z.string().min(1, 'Fecha obligatoria')
const idOf = (item) => item.id || item._id
const dateInput = (value) => value ? String(value).slice(0, 10) : ''
const errorMessage = (error) => {
  const message = error?.response?.data?.message || error?.response?.data?.error?.message || error?.message
  return Array.isArray(message) ? message.join(' ') : message || 'No fue posible guardar los cambios.'
}
const inputClass = 'mt-1.5 w-full rounded-lg border border-[var(--border-strong)] bg-[var(--bg)] px-3 py-2 text-sm outline-none transition focus:border-[var(--fg)]'
const labelClass = 'block text-xs font-medium text-[var(--fg-muted)]'
const sectionHeaderLabels = { about: 'Sobre mí', skills: 'Skills', experience: 'Experiencia', projects: 'Proyectos', contact: 'Contacto' }
const defaultHeaderFields = () => Object.entries(defaultSectionHeaders).map(([section, header]) => ({ section, ...header }))
const emptySectionHeader = { eyebrow: '', title: '', description: '' }

function Notice({ error, success }) {
  useEffect(() => {
    if (error) toast.error(error)
    else if (success) toast.success(success)
  }, [error, success])
  return null
}

function Field({ label, error, children }) {
  return <label className={labelClass}>{label}{children}{error && <span className="mt-1 block text-xs text-red-600 dark:text-red-400">{error.message}</span>}</label>
}

const heroButtonSchema = z.object({ label: text(80, true), href: text(300, true), style: z.enum(['outline', 'filled', 'soft']).optional(), openInNewTab: z.boolean().optional() })
const socialLinkSchema = z.object({ platform: text(40, true), url: z.string().url('URL no válida').max(300), icon: text(2048), iconKind: z.enum(['class', 'svg-file', 'svg-paste', 'png']).optional(), iconSvg: z.string().max(20000).optional(), iconPosition: z.enum(['left', 'right']).optional(), iconDisplay: z.enum(['icon', 'text', 'both']).optional(), buttonStyle: z.enum(['outline', 'filled', 'soft']).optional() })
const profileSchema = z.object({ name: text(120, true), headline: text(160, true), role: text(120), tagline: text(300), heroConsole: text(3000), bio: text(3000, true), availability: text(240), location: text(120), email: z.string().email('Email no válido').optional().or(z.literal('')), avatar: z.string().optional(), resumeUrl: url, heroButtons: z.array(heroButtonSchema), socialLinks: z.array(socialLinkSchema), aboutParagraphs: z.array(z.object({ value: text(3000, true) })), highlights: z.array(z.object({ label: text(80, true), value: text(120, true) })) })
function LegacyProfileEditor() {
  const client = useQueryClient(); const query = useQuery({ queryKey: ['admin', 'profile'], queryFn: adminApi.profile.get })
  const form = useForm({ resolver: zodResolver(profileSchema), defaultValues: { socialLinks: [], aboutParagraphs: [], highlights: [], sectionHeaders: defaultHeaderFields() } })
  const social = useFieldArray({ control: form.control, name: 'socialLinks' }); const paragraphs = useFieldArray({ control: form.control, name: 'aboutParagraphs' }); const highlights = useFieldArray({ control: form.control, name: 'highlights' }); const _headers = useFieldArray({ control: form.control, name: 'sectionHeaders' })
  useEffect(() => { if (query.data) { const savedHeaders = Object.fromEntries((query.data.sectionHeaders || []).map((header) => [header.section, header])); form.reset({ ...query.data, socialLinks: query.data.socialLinks || [], aboutParagraphs: (query.data.aboutParagraphs || []).map((value) => ({ value })), highlights: query.data.highlights || [], sectionHeaders: defaultHeaderFields().map((header) => ({ ...header, ...(savedHeaders[header.section] || {}) })) }) } }, [query.data, form])
  const save = useMutation({ mutationFn: (values) => adminApi.profile.update({ ...values, aboutParagraphs: values.aboutParagraphs.map(({ value }) => value), sectionHeaders: values.sectionHeaders.map((header) => ({ ...header, eyebrow: header.eyebrow?.trim() || '', title: header.title?.trim() || '', description: header.description?.trim() || '' })) }), onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', 'profile'] }); client.invalidateQueries({ queryKey: ['profile'] }) } })
  if (query.isLoading) return <p className="text-sm text-[var(--fg-muted)]">Cargando perfil...</p>
  return <form onSubmit={form.handleSubmit((values) => save.mutate(values))} className="space-y-6"><Notice error={save.isError && errorMessage(save.error)} success={save.isSuccess && 'Perfil guardado correctamente.'} /><Section title="Información principal"><div className="grid gap-4 sm:grid-cols-2"><Input form={form} name="name" label="Nombre" /><Input form={form} name="headline" label="Titular" /><Input form={form} name="role" label="Rol" /><Input form={form} name="location" label="Ubicación" /><Input form={form} name="email" label="Email" type="email" /><Input form={form} name="availability" label="Disponibilidad" /><Input form={form} name="tagline" label="Tagline" /><Input form={form} name="resumeUrl" label="URL de CV" type="url" /><Field label="Consola del hero" error={form.formState.errors.heroConsole}><textarea {...form.register('heroConsole')} rows="5" className={inputClass} /></Field><Field label="Biografía" error={form.formState.errors.bio}><textarea {...form.register('bio')} rows="5" className={inputClass} /></Field><MediaPicker value={form.watch('avatar')} onChange={(value) => form.setValue('avatar', value, { shouldDirty: true })} label="Avatar" /></div></Section><ArraySection title="Redes sociales" fields={social} add={() => social.append({ platform: '', url: '' })}>{(field, index) => <div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]"><Input form={form} name={`socialLinks.${index}.platform`} label="Plataforma" /><Input form={form} name={`socialLinks.${index}.url`} label="URL" type="url" /><Remove onClick={() => social.remove(index)} /></div>}</ArraySection><ArraySection title="Párrafos sobre mí" fields={paragraphs} add={() => paragraphs.append({ value: '' })}>{(field, index) => <div className="flex gap-3"><Field label={`Párrafo ${index + 1}`} error={form.formState.errors.aboutParagraphs?.[index]?.value}><textarea {...form.register(`aboutParagraphs.${index}.value`)} rows="3" className={inputClass} /></Field><Remove onClick={() => paragraphs.remove(index)} /></div>}</ArraySection><ArraySection title="Destacados" fields={highlights} add={() => highlights.append({ label: '', value: '' })}>{(field, index) => <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><Input form={form} name={`highlights.${index}.label`} label="Etiqueta" /><Input form={form} name={`highlights.${index}.value`} label="Valor" /><Remove onClick={() => highlights.remove(index)} /></div>}</ArraySection><SaveButton pending={save.isPending} /></form>
}

void LegacyProfileEditor

function ProfileEditor() {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'profile'], queryFn: adminApi.profile.get })
  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { heroButtons: [], socialLinks: [], aboutParagraphs: [], highlights: [] },
  })
  const heroButtons = useFieldArray({ control: form.control, name: 'heroButtons' })
  const social = useFieldArray({ control: form.control, name: 'socialLinks' })
  const paragraphs = useFieldArray({ control: form.control, name: 'aboutParagraphs' })
  const highlights = useFieldArray({ control: form.control, name: 'highlights' })

  useEffect(() => {
    if (!query.data) return
    form.reset({
      ...query.data,
      heroButtons: (query.data.heroButtons?.length ? query.data.heroButtons : [
        { label: 'Ver trabajo', href: '#projects', style: 'filled', openInNewTab: false },
        { label: 'Contactar', href: '#contact', style: 'outline', openInNewTab: false },
      ]).map((button) => ({
        label: button.label || '',
        href: button.href || button.url || '',
        style: button.style || 'outline',
        openInNewTab: Boolean(button.openInNewTab),
      })),
      socialLinks: (query.data.socialLinks || []).map((link) => ({
        platform: link.platform || '',
        url: link.url || '',
        icon: link.icon || '',
        iconKind: link.iconKind || 'class',
        iconSvg: link.iconSvg || '',
        iconPosition: link.iconPosition || 'left',
        iconDisplay: link.iconDisplay || 'both',
        buttonStyle: link.buttonStyle || 'outline',
      })),
      aboutParagraphs: (query.data.aboutParagraphs || []).map((value) => ({ value })),
      highlights: query.data.highlights || [],
    })
  }, [query.data, form])

  const save = useMutation({
    mutationFn: (values) => adminApi.profile.update({
      ...values,
      aboutParagraphs: values.aboutParagraphs.map(({ value }) => value),
    }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin', 'profile'] })
      client.invalidateQueries({ queryKey: ['profile'] })
    },
  })

  if (query.isLoading) return <p className="text-sm text-[var(--fg-muted)]">Cargando perfil...</p>

  return (
    <div className="space-y-6">
      <SectionHeaderEditor sectionKey="about" />
      <SectionHeaderEditor sectionKey="contact" />
      <form onSubmit={form.handleSubmit((values) => save.mutate(values))} className="space-y-6">
        <Notice error={save.isError && errorMessage(save.error)} success={save.isSuccess && 'Perfil guardado correctamente.'} />
        <Section title="Información principal"><div className="grid gap-4 sm:grid-cols-2"><Input form={form} name="name" label="Nombre" /><Input form={form} name="headline" label="Titular" /><Input form={form} name="role" label="Rol" /><Input form={form} name="location" label="Ubicación" /><Input form={form} name="email" label="Email" type="email" /><Input form={form} name="availability" label="Disponibilidad" /><Input form={form} name="tagline" label="Tagline" /><Input form={form} name="resumeUrl" label="URL de CV" type="url" /><Field label="Consola del hero" error={form.formState.errors.heroConsole}><textarea {...form.register('heroConsole')} rows="5" className={inputClass} /></Field><Field label="Biografía" error={form.formState.errors.bio}><textarea {...form.register('bio')} rows="5" className={inputClass} /></Field><MediaPicker value={form.watch('avatar')} onChange={(value) => form.setValue('avatar', value, { shouldDirty: true })} label="Avatar" /></div></Section>
        <ArraySection title="Botones del hero" fields={heroButtons} add={() => heroButtons.append({ label: '', href: '#contact', style: 'outline', openInNewTab: false })}>{(field, index) => <div key={field.id} className="space-y-4 rounded-xl border border-[var(--border)] p-4"><div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]"><Input form={form} name={`heroButtons.${index}.label`} label="Texto" /><Input form={form} name={`heroButtons.${index}.href`} label="Destino (#contact o URL)" /><Remove onClick={() => heroButtons.remove(index)} /></div><div className="grid gap-4 sm:grid-cols-[1fr_auto]"><ButtonStylePicker form={form} name={`heroButtons.${index}.style`} /><label className="mt-6 flex items-center gap-2 text-sm text-[var(--fg-muted)]"><input type="checkbox" {...form.register(`heroButtons.${index}.openInNewTab`)} /> Abrir en nueva ventana</label></div></div>}</ArraySection>
        <ArraySection title="Redes sociales" fields={social} add={() => social.append({ platform: '', url: '', icon: '', iconKind: 'class', iconSvg: '', iconPosition: 'left', iconDisplay: 'both', buttonStyle: 'outline' })}>{(field, index) => <div key={field.id} className="space-y-4 rounded-xl border border-[var(--border)] p-4"><div className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]"><Input form={form} name={`socialLinks.${index}.platform`} label="Plataforma" /><Input form={form} name={`socialLinks.${index}.url`} label="URL" type="url" /><Remove onClick={() => social.remove(index)} /></div><SkillIconFields form={form} prefix={`socialLinks.${index}`} nameKey="platform" chipClass={`contact-chip is-${form.watch(`socialLinks.${index}.buttonStyle`) || 'outline'}`} /><ButtonStylePicker form={form} name={`socialLinks.${index}.buttonStyle`} /></div>}</ArraySection>
        <ArraySection title="Párrafos sobre mí" fields={paragraphs} add={() => paragraphs.append({ value: '' })}>{(field, index) => <div className="flex gap-3"><Field label={`Párrafo ${index + 1}`} error={form.formState.errors.aboutParagraphs?.[index]?.value}><textarea {...form.register(`aboutParagraphs.${index}.value`)} rows="3" className={inputClass} /></Field><Remove onClick={() => paragraphs.remove(index)} /></div>}</ArraySection>
        <ArraySection title="Highlights" fields={highlights} add={() => highlights.append({ label: '', value: '' })}>{(field, index) => <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"><Input form={form} name={`highlights.${index}.label`} label="Etiqueta" /><Input form={form} name={`highlights.${index}.value`} label="Valor" /><Remove onClick={() => highlights.remove(index)} /></div>}</ArraySection>
        <SaveButton pending={save.isPending} />
      </form>
    </div>
  )
}

const sectionHeaderSchema = z.object({ eyebrow: text(80), title: text(180), description: text(320) })
function SectionHeaderEditor({ sectionKey }) {
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['admin', 'section-headers'], queryFn: adminApi.sectionHeaders.list })
  const defaults = defaultSectionHeaders[sectionKey] || emptySectionHeader
  const form = useForm({ resolver: zodResolver(sectionHeaderSchema), defaultValues: defaults })

  useEffect(() => {
    const saved = (query.data || []).find((item) => item.section === sectionKey)
    form.reset({ ...defaults, ...(saved || {}) })
  }, [query.data, defaults, form, sectionKey])

  const save = useMutation({
    mutationFn: (values) => adminApi.sectionHeaders.update(sectionKey, values),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ['admin', 'section-headers'] })
      client.invalidateQueries({ queryKey: ['section-headers'] })
    },
  })

  return <Section title={`Encabezado: ${sectionHeaderLabels[sectionKey] || sectionKey}`}><form onSubmit={form.handleSubmit((values) => save.mutate(values))} className="grid gap-4 sm:grid-cols-2"><Notice error={save.isError && errorMessage(save.error)} success={save.isSuccess && 'Encabezado guardado correctamente.'} /><Input form={form} name="eyebrow" label="Eyebrow" /><Input form={form} name="title" label="Título" /><Field label="Subtítulo" error={form.formState.errors.description}><textarea {...form.register('description')} rows="2" className={inputClass} /></Field><div className="flex items-end"><SaveButton pending={save.isPending} /></div></form></Section>
}

function Input({ form, name, label, type = 'text' }) { return <Field label={label} error={name.split('.').reduce((obj, key) => obj?.[key], form.formState.errors)}><input type={type} {...form.register(name)} className={inputClass} /></Field> }
function Section({ title, children }) { return <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 sm:p-6"><div className="text-base font-semibold">{title}</div><div className="mt-5">{children}</div></section> }
function ArraySection({ title, fields, add, children }) { return <Section title={title}><div className="space-y-4">{fields.fields.map(children)}</div><button type="button" onClick={add} className="mt-4 inline-flex items-center gap-1 rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm hover:bg-[var(--bg-soft)]"><Plus size={16} /> Añadir</button></Section> }
function Remove({ onClick }) { return <button type="button" onClick={onClick} className="mt-6 h-9 rounded-lg p-2 text-red-600 hover:bg-red-500/10" aria-label="Eliminar"><Trash2 size={16} /></button> }
function SaveButton({ pending }) { return <button disabled={pending} className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-[var(--accent-fg)] disabled:opacity-60">{pending ? 'Guardando...' : 'Guardar cambios'}</button> }

const configs = {
  skills: { title: 'Skills', singular: 'skill', schema: z.object({ name: text(80, true), category: text(80), level: z.coerce.number().int().min(0).max(100).optional(), icon: text(2048), iconKind: z.enum(['class', 'svg-file', 'svg-paste', 'png']).optional(), iconSvg: z.string().max(20000).optional(), iconPosition: z.enum(['left', 'right']).optional(), iconDisplay: z.enum(['icon', 'text', 'both']).optional() }), fields: [['name', 'Nombre'], ['category', 'Categoría'], ['level', 'Nivel (0-100)', 'number']] },
  experience: { title: 'Experiencia', singular: 'experiencia', schema: z.object({ role: text(120, true), company: text(120, true), location: text(120), startDate: date, endDate: z.string().optional(), current: z.boolean(), description: text(3000), highlightsText: z.string().optional(), technologiesText: z.string().optional() }), fields: [['role', 'Cargo'], ['company', 'Empresa'], ['location', 'Ubicación'], ['startDate', 'Inicio', 'date'], ['endDate', 'Fin', 'date'], ['description', 'Descripción', 'textarea'], ['highlightsText', 'Logros (separados por línea)', 'textarea'], ['technologiesText', 'Tecnologías (separadas por coma)']] },
  education: { title: 'Educación', singular: 'formación', schema: z.object({ institution: text(160, true), degree: text(160, true), field: text(120), startDate: date, endDate: z.string().optional(), description: text(1500), achievementsText: z.string().optional() }), fields: [['institution', 'Institución'], ['degree', 'Título'], ['field', 'Área'], ['startDate', 'Inicio', 'date'], ['endDate', 'Fin', 'date'], ['description', 'Descripción', 'textarea'], ['achievementsText', 'Logros (separados por línea)', 'textarea']] },
}
function normalize(resource, values) { const result = { ...values }; if (resource === 'experience') { result.highlights = values.highlightsText?.split('\n').map((x) => x.trim()).filter(Boolean) || []; result.technologies = values.technologiesText?.split(',').map((x) => x.trim()).filter(Boolean) || []; delete result.highlightsText; delete result.technologiesText; if (values.current) result.endDate = undefined } if (resource === 'education') { result.achievements = values.achievementsText?.split('\n').map((x) => x.trim()).filter(Boolean) || []; delete result.achievementsText } return result }
function defaults(resource, item) {
  if (!item) {
    if (resource === 'experience') return { current: false }
    if (resource === 'skills') return { iconKind: 'class', iconPosition: 'left', iconDisplay: 'both' }
    return {}
  }
  return { ...item, startDate: dateInput(item.startDate), endDate: dateInput(item.endDate), highlightsText: item.highlights?.join('\n') || '', technologiesText: item.technologies?.join(', ') || '', achievementsText: item.achievements?.join('\n') || '', iconKind: item.iconKind || 'class', iconPosition: item.iconPosition || 'left', iconDisplay: item.iconDisplay || 'both' }
}

function SkillIconFields({ form, prefix = '', nameKey = 'name', chipClass = 'skill-chip' }) {
  const field = (name) => (prefix ? `${prefix}.${name}` : name)
  const kind = form.watch(field('iconKind')) || 'class'
  const preview = {
    name: form.watch(field(nameKey)) || 'Skill',
    icon: form.watch(field('icon')),
    iconKind: kind,
    iconSvg: form.watch(field('iconSvg')),
    iconPosition: form.watch(field('iconPosition')) || 'left',
    iconDisplay: form.watch(field('iconDisplay')) || 'both',
  }
  return (
    <div className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
      <label className={labelClass}>Tipo de icono
        <select className={inputClass} {...form.register(field('iconKind'))}>
          <option value="class">Class (Iconify)</option>
          <option value="svg-file">Cargar SVG</option>
          <option value="svg-paste">Pegar SVG</option>
          <option value="png">Cargar PNG</option>
        </select>
      </label>
      {kind === 'class' && (
        <label className={labelClass}>Class de Iconify
          <input className={inputClass} placeholder="mdi:react" {...form.register(field('icon'))} />
          <a className="mt-1 inline-block text-[11px] text-[var(--fg-muted)] underline" href="https://icon-sets.iconify.design/" target="_blank" rel="noreferrer">Buscar iconos en Iconify</a>
        </label>
      )}
      {kind === 'svg-paste' && (
        <label className={`${labelClass} sm:col-span-2`}>Pegar SVG
          <textarea className={`${inputClass} font-mono text-xs`} rows="5" {...form.register(field('iconSvg'))} placeholder="<svg ...></svg>" />
        </label>
      )}
      {(kind === 'svg-file' || kind === 'png') && (
        <div className="sm:col-span-2">
          <MediaPicker value={form.watch(field('icon'))} onChange={(value) => form.setValue(field('icon'), value, { shouldDirty: true })} label={kind === 'png' ? 'PNG' : 'SVG'} />
        </div>
      )}
      <label className={labelClass}>Ubicación del icono
        <select className={inputClass} {...form.register(field('iconPosition'))}>
          <option value="left">Izquierda</option>
          <option value="right">Derecha</option>
        </select>
      </label>
      <label className={labelClass}>Mostrar
        <select className={inputClass} {...form.register(field('iconDisplay'))}>
          <option value="both">Icono + texto</option>
          <option value="icon">Solo icono</option>
          <option value="text">Solo texto</option>
        </select>
      </label>
      <div className="sm:col-span-2">
        <p className={labelClass}>Vista previa</p>
        <div className="mt-2">
          <span className={`${chipClass} ${preview.iconPosition === 'right' ? 'is-right' : 'is-left'} ${preview.iconDisplay === 'icon' ? 'is-icon-only' : ''}`}>
            {preview.iconDisplay !== 'text' && <SkillIcon skill={preview} className="skill-chip-icon" />}
            {preview.iconDisplay !== 'icon' && <span>{preview.name}</span>}
          </span>
        </div>
      </div>
    </div>
  )
}

function ButtonStylePicker({ form, name }) {
  const value = form.watch(name) || 'outline'
  const options = [
    { id: 'outline', label: 'Borde' },
    { id: 'filled', label: 'Relleno' },
    { id: 'soft', label: 'Suave' },
  ]
  return (
    <div>
      <p className={labelClass}>Estilo del botón</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => form.setValue(name, option.id, { shouldDirty: true })}
            className={`rounded-xl border p-3 text-left transition ${value === option.id ? 'border-[var(--fg)] bg-[var(--bg-soft)]' : 'border-[var(--border)] hover:border-[var(--border-strong)]'}`}
          >
            <span className={`contact-chip is-${option.id}`}>Aa</span>
            <span className="mt-2 block text-[11px] text-[var(--fg-muted)]">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
function ResourceEditor({ resource }) {
  const cfg = configs[resource]; const client = useQueryClient(); const query = useQuery({ queryKey: ['admin', resource], queryFn: adminApi[resource].list }); const [editing, setEditing] = useState(null); const [deleting, setDeleting] = useState(null)
  const form = useForm({ resolver: zodResolver(cfg.schema), defaultValues: defaults(resource) }); const save = useMutation({ mutationFn: (values) => editing ? adminApi[resource].update(idOf(editing), normalize(resource, values)) : adminApi[resource].create(normalize(resource, values)), onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', resource] }); client.invalidateQueries({ queryKey: [resource] }); setEditing(null); form.reset(defaults(resource)) } }); const reorder = useMutation({ mutationFn: (ids) => adminApi[resource].reorder(ids), onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', resource] }); client.invalidateQueries({ queryKey: [resource] }) } }); const remove = useMutation({ mutationFn: (id) => adminApi[resource].remove(id), onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', resource] }); client.invalidateQueries({ queryKey: [resource] }); setDeleting(null) } })
  const items = query.data || []; function move(index, offset) { const next = [...items]; [next[index], next[index + offset]] = [next[index + offset], next[index]]; reorder.mutate(next.map(idOf)) }
  return <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"><Section title={editing ? `Editar ${cfg.singular}` : `Nuevo ${cfg.singular}`}><form onSubmit={form.handleSubmit((values) => save.mutate(values))} className="grid gap-4 sm:grid-cols-2"><Notice error={save.isError && errorMessage(save.error)} success={save.isSuccess && 'Guardado correctamente.'} />{cfg.fields.map(([name, label, type]) => type === 'textarea' ? <Field key={name} label={label} error={form.formState.errors[name]}><textarea {...form.register(name)} rows="4" className={inputClass} /></Field> : <Input key={name} form={form} name={name} label={label} type={type} />)}{resource === 'experience' && <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" {...form.register('current')} /> Trabajo actual</label>}<div className="flex gap-2 sm:col-span-2"><SaveButton pending={save.isPending} />{editing && <button type="button" onClick={() => { setEditing(null); form.reset(defaults(resource)) }} className="rounded-lg border border-[var(--border-strong)] px-4 py-2 text-sm">Cancelar</button>}</div></form></Section><Section title={`Orden y listado (${items.length})`}>{query.isLoading ? <p className="text-sm text-[var(--fg-muted)]">Cargando...</p> : <div className="space-y-2">{items.map((item, index) => <article key={idOf(item)} className="flex items-center gap-2 rounded-xl border border-[var(--border)] p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.name || item.role || item.degree}</p><p className="truncate text-xs text-[var(--fg-muted)]">{item.category || item.company || item.institution}</p></div><button disabled={index === 0 || reorder.isPending} onClick={() => move(index, -1)} className="p-1.5 disabled:opacity-30" aria-label="Subir"><ArrowUp size={15} /></button><button disabled={index === items.length - 1 || reorder.isPending} onClick={() => move(index, 1)} className="p-1.5 disabled:opacity-30" aria-label="Bajar"><ArrowDown size={15} /></button><button onClick={() => { setEditing(item); form.reset(defaults(resource, item)) }} className="p-1.5" aria-label="Editar"><Pencil size={15} /></button><button onClick={() => setDeleting(item)} className="p-1.5 text-red-600" aria-label="Eliminar"><Trash2 size={15} /></button></article>)}</div>}<Notice error={reorder.isError && errorMessage(reorder.error)} /></Section>{deleting && <Confirm title={`¿Eliminar esta ${cfg.singular}?`} busy={remove.isPending} error={remove.isError && errorMessage(remove.error)} onCancel={() => setDeleting(null)} onConfirm={() => remove.mutate(idOf(deleting))} />}</div>
}

void ResourceEditor
function resourceTitle(item) { return item.name || item.role || item.degree || item.title || 'Sin título' }
function resourceSubtitle(item) { return item.category || item.company || item.institution || item.field || item.location || '-' }
function formatResourceValue(value) { if (value === undefined || value === null || value === '') return '-'; if (typeof value === 'boolean') return value ? 'Sí' : 'No'; if (Array.isArray(value)) return value.join(', '); return String(value) }
function ResourceTableEditor({ resource }) {
  const cfg = configs[resource]
  const client = useQueryClient()
  const query = useQuery({ queryKey: ['admin', resource], queryFn: adminApi[resource].list })
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const form = useForm({ resolver: zodResolver(cfg.schema), defaultValues: defaults(resource) })
  const items = query.data || []
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const pageItems = items.slice((page - 1) * pageSize, page * pageSize)
  const tableFields = cfg.fields.filter(([, , type]) => type !== 'textarea').slice(0, 4)
  const save = useMutation({ mutationFn: (values) => idOf(editing) ? adminApi[resource].update(idOf(editing), normalize(resource, values)) : adminApi[resource].create(normalize(resource, values)), onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', resource] }); client.invalidateQueries({ queryKey: [resource] }); setEditing(null); form.reset(defaults(resource)) } })
  const reorder = useMutation({ mutationFn: (ids) => adminApi[resource].reorder(ids), onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', resource] }); client.invalidateQueries({ queryKey: [resource] }) } })
  const remove = useMutation({ mutationFn: (id) => adminApi[resource].remove(id), onSuccess: () => { client.invalidateQueries({ queryKey: ['admin', resource] }); client.invalidateQueries({ queryKey: [resource] }); setDeleting(null) } })
  function openCreate() { form.reset(defaults(resource)); setEditing({}) }
  function openEdit(item) { form.reset(defaults(resource, item)); setEditing(item) }
  function closeModal() { setEditing(null); form.reset(defaults(resource)) }
  function move(index, offset) { const absoluteIndex = (page - 1) * pageSize + index; const next = [...items]; [next[absoluteIndex], next[absoluteIndex + offset]] = [next[absoluteIndex + offset], next[absoluteIndex]]; reorder.mutate(next.map(idOf)) }
  return <Section title={<div className="flex flex-wrap items-center justify-between gap-3"><span>{cfg.title} ({items.length})</span><button type="button" onClick={openCreate} className="inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent-fg)]"><Plus size={16} /> Nuevo {cfg.singular}</button></div>}>
    {query.isLoading ? <p className="text-sm text-[var(--fg-muted)]">Cargando...</p> : <div className="overflow-x-auto rounded-2xl border border-[var(--border)]"><table className="w-full min-w-[820px] border-collapse text-sm"><thead className="bg-[var(--bg-soft)]/60 text-[11px] uppercase tracking-[0.14em] text-[var(--fg-faint)]"><tr><th className="px-4 py-3 text-left">Principal</th>{tableFields.map(([name, title]) => <th key={name} className="px-4 py-3 text-left">{title}</th>)}<th className="px-4 py-3 text-left">Orden</th><th className="px-4 py-3 text-right">Acciones</th></tr></thead><tbody className="divide-y divide-[var(--border)]">{pageItems.map((item, index) => { const absoluteIndex = (page - 1) * pageSize + index; return <tr key={idOf(item)} className="hover:bg-[var(--bg-soft)]/45"><td className="px-4 py-3"><p className="font-medium">{resourceTitle(item)}</p><p className="text-xs text-[var(--fg-muted)]">{resourceSubtitle(item)}</p></td>{tableFields.map(([name]) => <td key={name} className="max-w-[220px] truncate px-4 py-3 text-[var(--fg-muted)]">{formatResourceValue(item[name])}</td>)}<td className="px-4 py-3"><div className="flex gap-1"><button disabled={absoluteIndex === 0 || reorder.isPending} onClick={() => move(index, -1)} className="rounded-lg p-1.5 hover:bg-[var(--bg)] disabled:opacity-30" aria-label="Subir"><ArrowUp size={15} /></button><button disabled={absoluteIndex === items.length - 1 || reorder.isPending} onClick={() => move(index, 1)} className="rounded-lg p-1.5 hover:bg-[var(--bg)] disabled:opacity-30" aria-label="Bajar"><ArrowDown size={15} /></button></div></td><td className="px-4 py-3"><div className="flex justify-end gap-1"><button onClick={() => openEdit(item)} className="rounded-lg p-1.5 hover:bg-[var(--bg)]" aria-label="Editar"><Pencil size={15} /></button><button onClick={() => setDeleting(item)} className="rounded-lg p-1.5 text-red-600 hover:bg-red-500/10" aria-label="Eliminar"><Trash2 size={15} /></button></div></td></tr> })}</tbody></table></div>}
    <div className="mt-4 flex items-center justify-between text-sm"><button className="rounded-lg border border-[var(--border)] px-3 py-1.5 disabled:opacity-40" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Anterior</button><span className="text-[var(--fg-muted)]">Página {page} de {totalPages}</span><button className="rounded-lg border border-[var(--border)] px-3 py-1.5 disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))}>Siguiente</button></div>
    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-3xl bg-[var(--bg-card)] p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-semibold">{idOf(editing) ? `Editar ${cfg.singular}` : `Nuevo ${cfg.singular}`}</h2><button type="button" onClick={closeModal} className="rounded-lg p-2 hover:bg-[var(--bg-soft)]" aria-label="Cerrar"><X size={18} /></button></div><form onSubmit={form.handleSubmit((values) => save.mutate(values))} className="grid gap-4 sm:grid-cols-2"><Notice error={save.isError && errorMessage(save.error)} success={save.isSuccess && 'Guardado correctamente.'} />{cfg.fields.map(([name, title, type]) => type === 'textarea' ? <Field key={name} label={title} error={form.formState.errors[name]}><textarea {...form.register(name)} rows="4" className={inputClass} /></Field> : <Input key={name} form={form} name={name} label={title} type={type} />)}{resource === 'skills' && <SkillIconFields form={form} />}{resource === 'experience' && <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" {...form.register('current')} /> Trabajo actual</label>}<div className="flex justify-end gap-2 sm:col-span-2"><button type="button" onClick={closeModal} className="rounded-lg border border-[var(--border-strong)] px-4 py-2.5 text-sm">Cancelar</button><SaveButton pending={save.isPending} /></div></form></div></div>}
    {deleting && <Confirm title={`Eliminar ${resourceTitle(deleting)}`} onCancel={() => setDeleting(null)} onConfirm={() => remove.mutate(idOf(deleting))} busy={remove.isPending} error={remove.isError && errorMessage(remove.error)} />}
  </Section>
}

function Confirm({ title, onCancel, onConfirm, busy, error }) { return <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-4"><div className="w-full max-w-sm rounded-2xl bg-[var(--bg-card)] p-5 shadow-xl"><h2 className="font-semibold">{title}</h2><p className="mt-2 text-sm text-[var(--fg-muted)]">Esta acción no se puede deshacer.</p><Notice error={error} /><div className="mt-5 flex justify-end gap-2"><button onClick={onCancel} className="rounded-lg border border-[var(--border-strong)] px-3 py-2 text-sm">Cancelar</button><button disabled={busy} onClick={onConfirm} className="rounded-lg bg-red-600 px-3 py-2 text-sm text-white">{busy ? 'Eliminando...' : 'Eliminar'}</button></div></div></div> }
function MediaLibrary() { return <Section title="Medios"><SharedMediaLibrary standalone /></Section> }
export default function AdminContent({ section }) { const content = { perfil: <ProfileEditor />, skills: <><SectionHeaderEditor sectionKey="skills" /><ResourceTableEditor resource="skills" /></>, experiencia: <><SectionHeaderEditor sectionKey="experience" /><ResourceTableEditor resource="experience" /></>, educacion: <ResourceTableEditor resource="education" />, proyectos: <><SectionHeaderEditor sectionKey="projects" /><AdminProjects /></>, medios: <MediaLibrary /> }[section]; return <section><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)]">Gestión de contenido</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{({ perfil: 'Perfil', skills: 'Skills', experiencia: 'Experiencia', educacion: 'Educación', proyectos: 'Proyectos', medios: 'Medios' })[section]}</h1><div className="mt-7 space-y-6">{content}</div></section> }
