import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, CheckCircle2, Mail } from 'lucide-react'
import Section from './Section'
import Magnetic from './Magnetic'

export default function Contact({ profile }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(null)

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (status !== 'idle') {
      setStatus('idle')
      setError('')
    }
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setStatus('error')
      setError('Completa nombre, email y mensaje.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setStatus('error')
      setError('Ingresa un email válido.')
      return
    }

    setStatus('loading')
    // TODO: Formspree / API — ver comentario en versión anterior
    await new Promise((r) => setTimeout(r, 1000))
    setStatus('success')
    setForm({ name: '', email: '', subject: '', message: '' })
  }

  const field =
    'w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)]/50 px-4 py-3.5 text-sm text-[var(--fg)] outline-none transition-all placeholder:text-[var(--fg-faint)] focus:border-[var(--border-strong)] focus:bg-[var(--bg-card)] focus:ring-4 focus:ring-[var(--ring)]'

  return (
    <Section
      id="contact"
      eyebrow="Contacto"
      title="Empecemos algo nuevo"
      description="Formulario listo para cablear. Mientras tanto, simula el envío en el cliente."
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
            {Object.entries(profile.socials).map(([key, url], i) => (
              <motion.a
                key={key}
                href={url}
                data-analytics={`social_${key}`}
                target="_blank"
                rel="noreferrer"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 + i * 0.06 }}
                whileHover={{ y: -4, scale: 1.04 }}
                className="rounded-full border border-[var(--border)] bg-[var(--bg-card)] px-4 py-2 text-xs font-medium capitalize text-[var(--fg-muted)] transition hover:text-[var(--fg)]"
              >
                {key}
              </motion.a>
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
                  {['name', 'email'].map((name) => (
                    <div key={name} className="relative">
                      <label
                        htmlFor={name}
                        className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]"
                      >
                        {name === 'name' ? 'Nombre' : 'Email'}
                      </label>
                      <input
                        id={name}
                        name={name}
                        type={name === 'email' ? 'email' : 'text'}
                        placeholder={name === 'name' ? 'Tu nombre' : 'tu@email.com'}
                        value={form[name]}
                        onChange={onChange}
                        onFocus={() => setFocused(name)}
                        onBlur={() => setFocused(null)}
                        className={field}
                      />
                      <AnimatePresence>
                        {focused === name && (
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

                <div>
                  <label
                    htmlFor="subject"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]"
                  >
                    Asunto
                  </label>
                  <input
                    id="subject"
                    name="subject"
                    type="text"
                    placeholder="Proyecto, colaboración…"
                    value={form.subject}
                    onChange={onChange}
                    className={field}
                  />
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]"
                  >
                    Mensaje
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={5}
                    placeholder="Cuéntame sobre la idea…"
                    value={form.message}
                    onChange={onChange}
                    className={`${field} min-h-[130px] resize-y`}
                  />
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
