import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Section from './Section'
import SkillIcon from './SkillIcon'

const ease = [0.16, 1, 0.3, 1]

const row = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease, staggerChildren: 0.04, delayChildren: 0.15 } },
}

const icon = {
  hidden: { opacity: 0, y: 14, scale: 0.6 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 22 } },
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

function hasIcon(skill) {
  return skill.iconDisplay !== 'text' && Boolean(skill.icon || skill.iconSvg)
}

function initials(name = '') {
  const parts = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/)
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : name.slice(0, 2)).toUpperCase()
}

/** True when a logo is almost entirely dark and colourless (e.g. Next.js, GitHub, Vercel). */
async function isDarkLogo(src) {
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = src
    await img.decode()
    const size = 32
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.drawImage(img, 0, 0, size, size)
    const { data } = ctx.getImageData(0, 0, size, size)
    let lum = 0
    let sat = 0
    let count = 0
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue
      const r = data[i], g = data[i + 1], b = data[i + 2]
      lum += 0.2126 * r + 0.7152 * g + 0.0722 * b
      sat += Math.max(r, g, b) - Math.min(r, g, b)
      count++
    }
    return count > 0 && lum / count < 70 && sat / count < 40
  } catch {
    return false
  }
}

function SkillIconItem({ skill }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)

  const onImage = useCallback((el) => {
    isDarkLogo(el.currentSrc || el.src).then(setDark)
  }, [])

  return (
    <motion.li
      variants={icon}
      whileHover={{ y: -6, scale: 1.18 }}
      whileFocus={{ y: -6, scale: 1.18 }}
      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
      tabIndex={0}
      aria-label={skill.name}
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className={`skill-icon ${dark ? 'is-dark-logo' : ''}`}
    >
      {hasIcon(skill) ? (
        <>
          <SkillIcon skill={skill} className="skill-icon-halo" />
          <SkillIcon skill={skill} className="skill-icon-img" onImage={onImage} />
        </>
      ) : (
        <span className="skill-icon-mono">{initials(skill.name)}</span>
      )}

      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            className="skill-tooltip"
            initial={{ opacity: 0, y: 6, x: '-50%', scale: 0.85 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 4, x: '-50%', scale: 0.9, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {skill.name}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.li>
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

  return (
    <Section
      id="skills"
      eyebrow={header.eyebrow}
      title={header.title}
      description={header.description}
    >
      <div>
        {categories.map((cat, catIndex) => (
          <motion.div
            key={`${cat.title}-${catIndex}`}
            variants={row}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            className="skill-row grid gap-5 py-8 md:grid-cols-[minmax(0,15rem)_1fr] md:gap-10 md:py-10"
          >
            <div className="flex items-baseline gap-3 md:flex-col md:gap-1.5">
              <span className="font-mono text-xs text-[var(--fg-faint)]">
                {String(catIndex + 1).padStart(2, '0')}
              </span>
              <h3 className="text-base font-semibold tracking-tight text-[var(--fg)] md:text-lg">
                {cat.title}
              </h3>
              <p className="text-xs text-[var(--fg-faint)]">
                {cat.items.length} tecnologías
              </p>
            </div>
            <ul className="skill-icons flex flex-wrap gap-x-3 gap-y-4 md:gap-x-5">
              {cat.items.map((skill) => (
                <SkillIconItem key={`${cat.title}-${skill.name}`} skill={skill} />
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}
