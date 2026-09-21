import { useState } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import Section from './Section'

export default function Experience({ experience, header }) {
  const [open, setOpen] = useState(0)

  return (
    <Section
      id="experience"
      eyebrow={header.eyebrow}
      title={header.title}
      description={header.description}
    >
      <LayoutGroup>
        <div className="space-y-3">
          {experience.map((job, index) => {
            const isOpen = open === index
            return (
              <motion.article
                layout
                key={`${job.company}-${job.period}`}
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  layout: { type: 'spring', stiffness: 320, damping: 28 },
                  opacity: { duration: 0.45, delay: index * 0.08 },
                }}
                className={`overflow-hidden rounded-[1.35rem] border transition-colors duration-300 ${
                  isOpen
                    ? 'border-[var(--border-strong)] bg-[var(--bg-card)] shadow-[0_20px_50px_-24px_rgba(0,0,0,0.25)]'
                    : 'border-[var(--border)] bg-[var(--bg-card)]/50 hover:border-[var(--border-strong)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? -1 : index)}
                  className="flex w-full items-center gap-4 px-5 py-5 text-left md:px-7 md:py-6"
                >
                  <motion.span
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-soft)] text-[var(--fg)]"
                  >
                    <ChevronRight size={16} />
                  </motion.span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <h3 className="text-base font-semibold tracking-tight text-[var(--fg)] md:text-lg">
                        {job.role}
                      </h3>
                      <span className="text-sm text-[var(--fg-faint)]">{job.company}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--fg-muted)]">
                      {job.period} · {job.location}
                    </p>
                  </div>

                  <span className="hidden font-mono text-[10px] text-[var(--fg-faint)] sm:block">
                    0{index + 1}
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-[var(--border)] px-5 pb-6 pt-4 md:px-7 md:pb-7">
                        <p className="max-w-2xl text-sm leading-relaxed text-[var(--fg-muted)]">
                          {job.description}
                        </p>
                        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                          {job.highlights.map((h, hi) => (
                            <motion.li
                              key={h}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.05 + hi * 0.06 }}
                              className="flex gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]/60 px-3.5 py-3 text-sm text-[var(--fg)]"
                            >
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--fg)]" />
                              {h}
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            )
          })}
        </div>
      </LayoutGroup>
    </Section>
  )
}
