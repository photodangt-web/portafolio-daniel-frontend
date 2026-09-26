import { motion } from 'framer-motion'
import { MapPin, ArrowDownRight } from 'lucide-react'
import Magnetic from './Magnetic'
import HeroPhoto from './HeroPhoto'

const heroButtonStyles = {
  filled: 'bg-[var(--accent)] text-[var(--accent-fg)] shadow-lg',
  outline: 'glass text-[var(--fg)] hover:border-[var(--border-strong)]',
  soft: 'bg-[var(--bg-soft)] text-[var(--fg)] hover:bg-[var(--bg-card)]',
}

const fadeUp = {
  hidden: { opacity: 0, y: 32, filter: 'blur(10px)' },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.75,
      delay: 0.35 + i * 0.1,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
}

const tokenPattern = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|async|await|export|import)\b|\b(?:true|false|null|undefined)\b|\b\d+(?:\.\d+)?\b)/g

function highlightConsole(code) {
  const nodes = []
  let cursor = 0

  for (const match of code.matchAll(tokenPattern)) {
    const token = match[0]
    const index = match.index ?? 0
    if (index > cursor) nodes.push(code.slice(cursor, index))

    const className = /^(const|let|var|function|return|async|await|export|import)$/.test(token)
      ? 'text-violet-600 dark:text-violet-400'
      : /^(true|false|null|undefined)$/.test(token)
        ? 'text-sky-600 dark:text-sky-400'
        : /^\d/.test(token)
          ? 'text-amber-600 dark:text-amber-400'
          : 'text-emerald-600 dark:text-emerald-400'

    nodes.push(<span key={`${index}-${token}`} className={className}>{token}</span>)
    cursor = index + token.length
  }

  if (cursor < code.length) nodes.push(code.slice(cursor))
  return nodes
}

function defaultHeroConsole(name) {
  return `const dev = {
  name: ${JSON.stringify(name)},
  stack: ["React", "Vite", "Node"],
  openToWork: true,
}`
}

function defaultHeroButtons() {
  return [
    { label: 'Ver trabajo', href: '#projects', style: 'filled', openInNewTab: false },
    { label: 'Contactar', href: '#contact', style: 'outline', openInNewTab: false },
  ]
}

export default function Hero({ profile }) {
  const buttons = profile.heroButtons?.length ? profile.heroButtons : defaultHeroButtons()

  return (
    <section
      id="top"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pb-36 pt-20"
    >
      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-12 px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 xl:gap-16">
        {/* ——— Columna izquierda: copy ——— */}
        <div className="min-w-0">
          <motion.div
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-8 inline-flex flex-wrap items-center gap-3"
          >
            <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium text-[var(--fg-muted)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {profile.availability}
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-[var(--fg-faint)]">
              <MapPin size={12} />
              {profile.location}
            </span>
          </motion.div>

          <motion.p
            custom={0}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mb-4 text-xs font-semibold uppercase tracking-[0.28em] text-[var(--fg-faint)]"
          >
            {profile.role}
          </motion.p>

          <motion.p
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="text-4xl font-semibold tracking-tight text-[var(--fg)] sm:text-5xl md:text-6xl lg:text-[3.5rem] xl:text-7xl"
          >
            {profile.name}
          </motion.p>

          <motion.p
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-6 max-w-xl text-base leading-relaxed text-[var(--fg-muted)] md:text-lg"
          >
            {profile.tagline}
          </motion.p>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-10 flex flex-wrap items-center gap-4"
          >
            {buttons.map((button, index) => {
              const href = button.href || button.url || '#'
              const external = button.openInNewTab || /^https?:\/\//i.test(href)
              const style = heroButtonStyles[button.style] || heroButtonStyles.outline
              return (
                <Magnetic key={`${button.label}-${href}-${index}`} strength={index === 0 ? 0.4 : 0.35} radius={index === 0 ? 100 : 90}>
                  <a
                    href={href}
                    target={button.openInNewTab ? '_blank' : undefined}
                    rel={button.openInNewTab ? 'noreferrer' : undefined}
                    data-analytics={external ? 'hero_outbound' : `hero_${href.replace(/^#/, '')}`}
                    className={`group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition ${style}`}
                  >
                    {button.label}
                    {index === 0 && (
                      <ArrowDownRight
                        size={16}
                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:translate-y-0.5"
                      />
                    )}
                  </a>
                </Magnetic>
              )
            })}
          </motion.div>

          <motion.div
            custom={3}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="mt-12 max-w-lg overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/60 font-mono text-[11px] leading-relaxed text-[var(--fg-muted)] backdrop-blur-md"
          >
            <div className="flex items-center gap-1.5 border-b border-[var(--border)] px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
              <span className="ml-2 text-[10px] text-[var(--fg-faint)]">
                daniel.ts
              </span>
            </div>
            <pre className="overflow-x-auto px-4 py-4">
              <code>{highlightConsole(profile.heroConsole?.trim() || defaultHeroConsole(profile.name))}</code>
            </pre>
          </motion.div>
        </div>

        {/* ——— Columna derecha: foto ——— */}
        <div className="relative flex justify-center lg:justify-end lg:pr-2">
          <HeroPhoto profile={profile} />
        </div>
      </div>
    </section>
  )
}
