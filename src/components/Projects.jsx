import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ArrowUpRight, Code2 } from 'lucide-react'
import Section from './Section'
import { projects } from '../data/content'

function TiltCard({ project, index }) {
  const ref = useRef(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), {
    stiffness: 200,
    damping: 20,
  })
  const rY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), {
    stiffness: 200,
    damping: 20,
  })

  const onMove = (e) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
    el.style.setProperty('--mx', `${e.clientX - r.left}px`)
    el.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  return (
    <motion.article
      ref={ref}
      initial={{ opacity: 0, y: 48, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.65,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        rotateX: rX,
        rotateY: rY,
        transformStyle: 'preserve-3d',
        transformPerspective: 900,
      }}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`spotlight-card group flex flex-col p-6 md:p-7 ${
        project.featured ? 'md:col-span-2 lg:col-span-1' : ''
      }`}
    >
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          {project.featured && (
            <span className="mb-2 inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
              Featured
            </span>
          )}
          <h3
            className="text-xl font-semibold tracking-tight text-[var(--fg)]"
            style={{ transform: 'translateZ(24px)' }}
          >
            {project.title}
          </h3>
        </div>
        <span className="font-mono text-xs tabular-nums text-[var(--fg-faint)]">
          {project.year}
        </span>
      </div>

      {/* abstract preview block — unique visual, not stock image */}
      <div
        className="relative mb-5 h-36 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-soft)]"
        style={{ transform: 'translateZ(16px)' }}
      >
        <div className="absolute inset-0 opacity-80"
          style={{
            background: `
              radial-gradient(circle at 20% 30%, var(--fg) 0%, transparent 28%),
              radial-gradient(circle at 80% 70%, var(--fg-faint) 0%, transparent 32%),
              linear-gradient(135deg, transparent 40%, var(--border) 40%, var(--border) 41%, transparent 41%),
              linear-gradient(45deg, transparent 60%, var(--border) 60%, var(--border) 61%, transparent 61%)
            `,
            opacity: 0.15,
          }}
        />
        <div className="absolute bottom-3 left-3 right-3 flex gap-1.5">
          <span className="h-1.5 flex-1 rounded-full bg-[var(--fg)]/20" />
          <span className="h-1.5 w-1/3 rounded-full bg-[var(--fg)]/10" />
        </div>
        <div className="absolute right-3 top-3 h-8 w-8 rounded-lg border border-[var(--border)] bg-[var(--bg-card)]/80 backdrop-blur" />
      </div>

      <p className="flex-1 text-sm leading-relaxed text-[var(--fg-muted)]">
        {project.description}
      </p>

      <ul className="mt-5 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <li
            key={tag}
            className="rounded-md border border-[var(--border)] bg-[var(--bg-soft)]/80 px-2 py-1 text-[11px] font-medium text-[var(--fg-muted)]"
          >
            {tag}
          </li>
        ))}
      </ul>

      <div
        className="mt-6 flex items-center gap-5 border-t border-[var(--border)] pt-4"
        style={{ transform: 'translateZ(20px)' }}
      >
        <a
          href={project.link}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--fg)] transition-all group-hover:gap-2.5"
        >
          Demo <ArrowUpRight size={14} />
        </a>
        <a
          href={project.github}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--fg-muted)] transition hover:text-[var(--fg)]"
        >
          <Code2 size={14} /> Código
        </a>
      </div>
    </motion.article>
  )
}

export default function Projects() {
  return (
    <Section
      id="projects"
      eyebrow="Portafolio"
      title="Proyectos en 3D sutil"
      description="Cards con tilt al cursor y spotlight — reemplaza demos y repos por los tuyos."
    >
      <div className="grid gap-4 md:grid-cols-2" style={{ perspective: 1200 }}>
        {projects.map((project, i) => (
          <TiltCard key={project.title} project={project} index={i} />
        ))}
      </div>
    </Section>
  )
}
