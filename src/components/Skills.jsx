import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Section from './Section'
import SkillIcon from './SkillIcon'

const grid = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035, delayChildren: 0.1 } },
}

const tile = {
  hidden: { opacity: 0, y: 18, scale: 0.85 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 24 } },
}

function onSpotlight(e) {
  const el = e.currentTarget
  const rect = el.getBoundingClientRect()
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
  el.style.setProperty('--my', `${e.clientY - rect.top}px`)
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

function StackTile({ skill, category }) {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)

  const onImage = useCallback((el) => {
    isDarkLogo(el.currentSrc || el.src).then(setDark)
  }, [])

  return (
    <motion.li
      variants={tile}
      whileHover={{ y: -5 }}
      whileFocus={{ y: -5 }}
      whileTap={{ scale: 0.94 }}
      tabIndex={0}
      aria-label={skill.name}
      onMouseMove={onSpotlight}
      onHoverStart={() => setOpen(true)}
      onHoverEnd={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      className={`stack-tile ${dark ? 'is-dark-logo' : ''}`}
    >
      {hasIcon(skill) ? (
        <>
          <SkillIcon skill={skill} className="stack-tile-halo" />
          <SkillIcon skill={skill} className="stack-tile-img" onImage={onImage} />
        </>
      ) : (
        <span className="stack-tile-mono">{initials(skill.name)}</span>
      )}

      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            className="stack-tooltip"
            initial={{ opacity: 0, y: 6, x: '-50%', scale: 0.85 }}
            animate={{ opacity: 1, y: 0, x: '-50%', scale: 1 }}
            exit={{ opacity: 0, y: 4, x: '-50%', scale: 0.9, transition: { duration: 0.12 } }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            {skill.name}
            {category && <small>{category}</small>}
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
      <motion.ul
        variants={grid}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-60px' }}
        className="stack-grid"
      >
        {categories.flatMap((cat) => cat.items.map((skill) => (
          <StackTile key={`${cat.title}-${skill.name}`} skill={skill} category={cat.title} />
        )))}
      </motion.ul>
    </Section>
  )
}
