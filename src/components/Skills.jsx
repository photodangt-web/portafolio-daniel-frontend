import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Section from './Section'
import SkillIcon from './SkillIcon'

const ease = [0.16, 1, 0.3, 1]
const ALL = '__all__'

function normalizeItem(item) {
  if (typeof item === 'string') return { name: item, iconDisplay: 'text', iconPosition: 'left' }
  return {
    name: item.name,
    icon: item.icon,
    iconKind: item.iconKind || 'class',
    iconSvg: item.iconSvg,
    iconPosition: item.iconPosition === 'right' ? 'right' : 'left',
    iconDisplay: item.iconDisplay || 'both',
  }
}

function hasIcon(skill) {
  return skill.iconDisplay !== 'text' && Boolean(skill.icon || skill.iconSvg)
}

function initials(name = '') {
  const parts = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

function onSpotlight(e) {
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--my', `${e.clientY - rect.top}px`)
}

function SkillTile({ skill, category, index }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.92, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.18 } }}
      transition={{ duration: 0.45, ease }}
      onMouseMove={onSpotlight}
      className="skill-tile group"
    >
      <div className="skill-tile-icon">
        {hasIcon(skill) ? (
          <>
            <SkillIcon skill={skill} className="skill-tile-halo" />
            <SkillIcon skill={skill} className="skill-tile-img" />
          </>
        ) : (
          <span className="skill-tile-mono">{initials(skill.name)}</span>
        )}
      </div>
      {index && (
        <span className="absolute right-2.5 top-2 font-mono text-[10px] text-[var(--fg-faint)]" title={category}>
          {index}
        </span>
      )}
      <p className="w-full truncate text-center text-[13px] font-medium tracking-tight text-[var(--fg)]">{skill.name}</p>
    </motion.li>
  )
}

function Marquee({ items }) {
  const withIcons = items.filter(hasIcon)
  if (withIcons.length < 6) return null
  const loop = [...withIcons, ...withIcons]

  return (
    <div className="skill-marquee mt-6" aria-hidden>
      <div className="skill-marquee-track">
        {loop.map((skill, i) => (
          <span key={`${skill.name}-${i}`} className="skill-marquee-item">
            <SkillIcon skill={skill} className="skill-marquee-icon" />
            <span>{skill.name}</span>
          </span>
        ))}
      </div>
    </div>
  )
}

export default function Skills({ skills, header }) {
  const categories = useMemo(() => (
    Array.isArray(skills?.categories)
      ? skills.categories
          .map((cat) => ({
            title: String(cat?.title || 'Otros').trim() || 'Otros',
            items: Array.isArray(cat?.items) ? cat.items.map(normalizeItem).filter((item) => item.name) : [],
          }))
          .filter((cat) => cat.items.length > 0)
      : []
  ), [skills])

  const [active, setActive] = useState(ALL)
  const total = categories.reduce((sum, cat) => sum + cat.items.length, 0)

  const visible = useMemo(() => {
    const source = active === ALL ? categories : categories.filter((cat) => cat.title === active)
    return source.flatMap((cat) => {
      const index = String(categories.indexOf(cat) + 1).padStart(2, '0')
      return cat.items.map((skill) => ({ skill, category: cat.title, index }))
    })
  }, [active, categories])

  const allItems = useMemo(() => categories.flatMap((cat) => cat.items), [categories])
  const tabs = [{ title: ALL, label: 'Todos', count: total }, ...categories.map((cat) => ({ title: cat.title, label: cat.title, count: cat.items.length }))]

  return (
    <Section
      id="skills"
      eyebrow={header.eyebrow}
      title={header.title}
      description={header.description}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease }}
        className="skill-board"
      >
        <div className="flex flex-col gap-4 border-b border-[var(--border)] p-3 md:flex-row md:items-center md:justify-between md:p-4">
          <div className="skill-tabs" role="tablist" aria-label="Categorías de habilidades">
            {tabs.map((tab) => {
              const selected = active === tab.title
              return (
                <button
                  key={tab.title}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setActive(tab.title)}
                  className={`skill-tab ${selected ? 'is-active' : ''}`}
                >
                  {selected && (
                    <motion.span
                      layoutId="skill-tab-pill"
                      className="skill-tab-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                  <span className="skill-tab-count relative z-10">{tab.count}</span>
                </button>
              )
            })}
          </div>
          <p className="hidden shrink-0 px-2 font-mono text-[11px] text-[var(--fg-faint)] md:block">
            {String(visible.length).padStart(2, '0')} / {String(total).padStart(2, '0')} tecnologías
          </p>
        </div>

        <motion.ul layout className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 md:grid-cols-4 md:p-4 lg:grid-cols-6">
          <AnimatePresence mode="popLayout" initial={false}>
            {visible.map(({ skill, category, index }) => (
              <SkillTile
                key={`${category}-${skill.name}`}
                skill={skill}
                category={category}
                index={active === ALL ? index : null}
              />
            ))}
          </AnimatePresence>
        </motion.ul>
      </motion.div>

      <Marquee items={allItems} />
    </Section>
  )
}
