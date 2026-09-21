import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, CheckCircle2, Mail } from 'lucide-react'
import Section from './Section'
import Magnetic from './Magnetic'
import SkillIcon from './SkillIcon'
import { portfolioApi } from '../api/portfolio'
import { notifyTelegramLead } from '../api/telegram'
import { useLeadFieldsQuery } from '../api/hooks'

function normalizeSocials(socials) {
  if (Array.isArray(socials)) return socials.filter((item) => item?.url)
  if (socials && typeof socials === 'object') {
    return Object.entries(socials).map(([platform, url]) => ({
      platform,
      url,
      iconDisplay: 'text',
      iconPosition: 'left',
      buttonStyle: 'outline',
    }))
  }
  return []
}

function ContactChip({ item, index }) {
  const [wide, setWide] = useState(false)
  const display = item.iconDisplay || 'both'
  const showIcon = display !== 'text'
  const showText = display !== 'icon'
  const iconOnly = display === 'icon'
  const style = ['outline', 'filled', 'soft'].includes(item.buttonStyle) ? item.buttonStyle : 'outline'
  const position = item.iconPosition === 'right' ? 'right' : 'left'
  const skill = {
    name: item.platform,
    icon: item.icon,
    iconKind: item.iconKind || 'class',
    iconSvg: item.iconSvg,
    iconPosition: position,
    iconDisplay: display,
  }

  return (
    <motion.a
      href={item.url}
      data-analytics={`social_${String(item.platform || '').toLowerCase()}`}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1 + index * 0.06 }}
      whileHover={{ y: -4, scale: 1.04 }}
      className={`contact-chip is-${style} ${position === 'right' ? 'is-right' : 'is-left'} ${iconOnly ? 'is-icon-only' : ''} ${wide && iconOnly ? 'is-wide' : ''}`}
    >
      {showIcon && (
        <SkillIcon
          skill={skill}
          className="skill-chip-icon"
          onRatio={(ratio) => setWide(ratio > 1.35)}
        />
      )}
      {showText && <span>{item.platform}</span>}
    </motion.a>
  )
}

const defaultFields = [
  { name: 'name', label: 'Nombre', type: 'text', placeholder: 'Tu nombre', required: true },
  { name: 'email', label: 'Email', type: 'email', placeholder: 'tu@email.com', required: true },
  { name: 'subject', label: 'Asunto', type: 'text', placeholder: 'Proyecto, colaboración...', required: false },
  { name: 'message', label: 'Mensaje', type: 'textarea', placeholder: 'Cuéntame sobre la idea...', required: true },
]

export default function Contact({ profile, header }) {
  const fieldsQuery = useLeadFieldsQuery()
  const fields = (fieldsQuery.data?.length ? fieldsQuery.data : defaultFields)
    .filter((fieldConfig) => fieldConfig.visible !== false && fieldConfig.type !== 'button')
  const [form, setForm] = useState({})
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(null)

  const onChange = (e) => {
    const { name, type, value, checked, files } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? Array.from(files || []) : value,
    }))
    if (status !== 'idle') {
      setStatus('idle')
      setError('')
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    for (const fieldConfig of fields) {
      const value = form[fieldConfig.name]
      const empty = value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
      if (fieldConfig.required && empty) {
        setStatus('error')
        setError(`Completa ${fieldConfig.label}.`)
        return
      }
      if (fieldConfig.type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) {
        setStatus('error')
        setError(`Ingresa un email válido en ${fieldConfig.label}.`)
        return
      }
    }

    setStatus('loading')
    const data = new FormData()
    const values = {}
    fields.forEach((fieldConfig) => {
      const value = form[fieldConfig.name]
      if (fieldConfig.type === 'file') {
        ;(value || []).forEach((file) => data.append(fieldConfig.name, file))
      } else if (value !== undefined && value !== '') {
        values[fieldConfig.name] = value
      }
    })
    data.append('values', JSON.stringify(values))

    let serverOk = false
    try {
      await portfolioApi.submitLead(data)
      serverOk = true
    } catch {
      serverOk = false
    }

    let telegramOk = false
    try {
      telegramOk = await notifyTelegramLead({ values, serverOk })
    } catch {
      telegramOk = false
    }

    if (serverOk || telegramOk) {
      setStatus('success')
      setForm({})
      return
    }
    setStatus('error')
    setError('No fue posible enviar el mensaje.')
  }

  function renderField(fieldConfig) {
    const common = {
      id: fieldConfig.name,
      name: fieldConfig.name,
      required: Boolean(fieldConfig.required),
      onChange,
      onFocus: () => setFocused(fieldConfig.name),
      onBlur: () => setFocused(null),
      className: fieldConfig.type === 'textarea' ? `${field} min-h-[130px] resize-y` : field,
    }
    if (fieldConfig.type === 'textarea') return <textarea {...common} rows={5} placeholder={fieldConfig.placeholder || ''} value={form[fieldConfig.name] || ''} />
    if (fieldConfig.type === 'select') return <select {...common} value={form[fieldConfig.name] || ''}><option value="">Selecciona...</option>{(fieldConfig.options || []).map((option) => <option key={option} value={option}>{option}</option>)}</select>
    if (fieldConfig.type === 'radio') return <div className="flex flex-wrap gap-3">{(fieldConfig.options || []).map((option) => <label key={option} className="inline-flex items-center gap-2 text-sm text-[var(--fg-muted)]"><input type="radio" name={fieldConfig.name} value={option} checked={form[fieldConfig.name] === option} onChange={onChange} />{option}</label>)}</div>
    if (fieldConfig.type === 'checkbox') return <label className="inline-flex items-center gap-2 text-sm text-[var(--fg-muted)]"><input type="checkbox" name={fieldConfig.name} checked={Boolean(form[fieldConfig.name])} onChange={onChange} />{fieldConfig.placeholder || fieldConfig.label}</label>
    if (fieldConfig.type === 'file') return <input {...common} type="file" multiple />
    return <input {...common} type={fieldConfig.type === 'phone' ? 'tel' : fieldConfig.type === 'url' ? 'url' : fieldConfig.type} placeholder={fieldConfig.placeholder || ''} value={form[fieldConfig.name] || ''} />
  }

  const field =
    'w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)]/50 px-4 py-3.5 text-sm text-[var(--fg)] outline-none transition-all placeholder:text-[var(--fg-faint)] focus:border-[var(--border-strong)] focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[var(--ring)]'

  return (
    <Section
      id="contact"
      eyebrow={header.eyebrow}
      title={header.title}
      description={header.description}
    >
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <motion.div
          initial={{ opacity: 0, x: -30, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col gap-4"
        >
          <div className="glass relative overflow-hidden rounded-[1.5rem] p-7">
            <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[var(--fg)] opacity-[0.04]" />
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--fg)] text-[var(--accent-fg)]">
              <Mail size={18} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--fg)]">Email directo</h3>
            <a
              href={`mailto:${profile.email}`}
              data-analytics="contact_email"
              className="mt-2 block text-sm text-[var(--fg-muted)] transition hover:text-[var(--fg)]"
            >
              {profile.email}
            </a>
            <p className="mt-5 text-xs leading-relaxed text-[var(--fg-faint)]">
              {profile.availability}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {normalizeSocials(profile.socials).map((item, index) => (
              <ContactChip key={`${item.platform}-${index}`} item={item} index={index} />
            ))}
          </div>
        </motion.div>

        <motion.form
          onSubmit={onSubmit}
          initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
          whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-card)] p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.2)] md:p-8"
          noValidate
        >
          <AnimatePresence mode="wait">
            {status === 'success' ? (
              <motion.div
                key="ok"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 14 }}
                >
                  <CheckCircle2 size={40} className="text-[var(--fg)]" />
                </motion.div>
                <p className="mt-4 text-lg font-semibold text-[var(--fg)]">Mensaje listo</p>
                <p className="mt-2 max-w-sm text-sm text-[var(--fg-muted)]">
                  Simulación OK. Conecta Formspree o tu API en{' '}
                  <code className="rounded bg-[var(--bg-soft)] px-1 text-[11px]">
                    Contact.jsx
                  </code>
                  .
                </p>
                <button
                  type="button"
                  onClick={() => setStatus('idle')}
                  className="mt-6 text-sm font-medium text-[var(--fg)] underline-offset-4 hover:underline"
                >
                  Enviar otro
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  {fields.map((fieldConfig) => (
                    <div key={fieldConfig.name} className={fieldConfig.type === 'textarea' ? 'relative sm:col-span-2' : 'relative'}>
                      <label
                        htmlFor={fieldConfig.name}
                        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]"
                      >
                        {fieldConfig.label}{fieldConfig.required ? ' *' : ''}
                      </label>
                      {renderField(fieldConfig)}
                      <AnimatePresence>
                        {focused === fieldConfig.name && (
                          <motion.span
                            layoutId="field-glow"
                            className="pointer-events-none absolute inset-x-2 bottom-0 h-px bg-[var(--fg)]/30"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          />
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>

                {status === 'error' && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500"
                    role="alert"
                  >
                    {error}
                  </motion.p>
                )}

                <Magnetic strength={0.25} radius={100}>
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-7 py-3.5 text-sm font-medium text-[var(--accent-fg)] transition disabled:opacity-60 sm:w-auto"
                  >
                    {status === 'loading' ? (
                      <motion.span
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.2 }}
                      >
                        Enviando…
                      </motion.span>
                    ) : (
                      <>
                        Enviar mensaje <Send size={14} />
                      </>
                    )}
                  </button>
                </Magnetic>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.form>
      </div>
    </Section>
  )
}
