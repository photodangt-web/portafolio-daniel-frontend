import { useState } from 'react'
import { motion } from 'framer-motion'
import Section from './Section'
import SkillIcon from './SkillIcon'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const chip = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
}

const panel = {
  hidden: { opacity: 0, y: 36, rotate: -1 },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
}

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

function SkillChip({ skill }) {
  const [wide, setWide] = useState(false)
  const display = skill.iconDisplay || 'both'
  const showIcon = display !== 'text'
  const showText = display !== 'icon'
  const iconOnly = display === 'icon'

  return (
    <motion.li
      variants={chip}
      whileHover={{ y: -2, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } }}
      className={`skill-chip ${skill.iconPosition === 'right' ? 'is-right' : 'is-left'} ${iconOnly ? 'is-icon-only' : ''} ${wide && iconOnly ? 'is-wide' : ''}`}
    >
      {showIcon && (
        <SkillIcon
          skill={skill}
          className="skill-chip-icon"
          onRatio={(ratio) => setWide(ratio > 1.35)}
        />
      )}
      {showText && <span>{skill.name}</span>}
    </motion.li>
  )
}

export default function Skills({ skills, header }) {
  const categories = Array.isArray(skills?.categories)
    ? skills.categories
        .map((cat) => ({
          title: String(cat?.title || 'Otros').trim() || 'Otros',
          items: Array.isArray(cat?.items) ? cat.items.map(normalizeItem).filter((item) => item.name) : [],
        }))
        .filter((cat) => cat.items.length > 0)
    : []

  return (
    <Section
      id="skills"
      eyebrow={header.eyebrow}
      title={header.title}
      description={header.description}
    >
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="grid gap-4 lg:grid-cols-2"
      >
        {categories.map((cat, catIndex) => (
          <motion.div
            key={`${cat.title}-${catIndex}`}
            variants={panel}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-card)] p-6 md:p-7"
          >
            <span className="absolute right-5 top-5 font-mono text-xs text-[var(--fg-faint)]">
              0{catIndex + 1}
            </span>
            <div className="mb-5 flex items-center gap-3">
              <span className="h-8 w-1 rounded-full bg-[var(--fg)]" />
              <h3 className="text-sm font-semibold tracking-tight text-[var(--fg)]">
                {cat.title}
              </h3>
            </div>
            <motion.ul variants={container} className="flex flex-wrap gap-2">
              {cat.items.map((skill) => (
                <SkillChip key={`${cat.title}-${skill.name}`} skill={skill} />
              ))}
            </motion.ul>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  )
}
