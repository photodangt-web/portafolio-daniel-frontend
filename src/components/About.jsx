import { motion } from 'framer-motion'
import Section from './Section'
import { useSpotlight } from '../hooks/useSpotlight'

export default function About({ about, profile, header }) {
  const spotlight = useSpotlight()

  return (
    <Section
      id="about"
      eyebrow={header.eyebrow}
      title={header.title}
      description={header.description}
    >
      {/* Bento: bio + 2×2 stats */}
      <div className="grid gap-4 lg:grid-cols-12">
        <motion.div
          {...spotlight}
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="spotlight-card p-7 md:p-9 lg:col-span-7"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--fg)] text-sm font-bold text-[var(--accent-fg)]">
              {profile.name
                .split(' ')
                .map((w) => w[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--fg)]">{profile.name}</p>
              <p className="text-xs text-[var(--fg-faint)]">
                {profile.role} · {profile.location}
              </p>
            </div>
          </div>
          <div className="space-y-4 text-[15px] leading-relaxed text-[var(--fg-muted)]">
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-5">
          {about.highlights.map((h, i) => (
            <motion.div
              key={h.label}
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{
                duration: 0.55,
                delay: 0.1 + i * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="spotlight-card flex min-h-[140px] flex-col justify-between p-5 md:p-6"
              onMouseMove={(e) => {
                const el = e.currentTarget
                const r = el.getBoundingClientRect()
                el.style.setProperty('--mx', `${e.clientX - r.left}px`)
                el.style.setProperty('--my', `${e.clientY - r.top}px`)
              }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-faint)] md:text-[11px]">
                {h.label}
              </p>
              <p className="text-3xl font-semibold tracking-tight text-[var(--fg)] md:text-4xl">
                {h.value}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}
