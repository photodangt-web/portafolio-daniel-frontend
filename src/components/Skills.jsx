import { motion } from 'framer-motion'
import Section from './Section'
import { skills } from '../data/content'

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
}

const chip = {
  hidden: { opacity: 0, scale: 0.6, y: 12 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 380, damping: 18 },
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

export default function Skills() {
  return (
    <Section
      id="skills"
      eyebrow="Skills"
      title="Stack que uso de verdad"
      description="No es una lista genérica: categorías con chips animados al estilo de un OS moderno."
    >
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
        className="grid gap-4 lg:grid-cols-2"
      >
        {skills.categories.map((cat, catIndex) => (
          <motion.div
            key={cat.title}
            variants={panel}
            whileHover={{ y: -4 }}
            className="relative overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--bg-card)] p-6 md:p-7"
          >
            {/* corner index */}
            <span className="absolute right-5 top-5 font-mono text-xs text-[var(--fg-faint)]">
              0{catIndex + 1}
            </span>

            <div className="mb-5 flex items-center gap-3">
              <span className="h-8 w-1 rounded-full bg-[var(--fg)]" />
              <h3 className="text-sm font-semibold tracking-tight text-[var(--fg)]">
                {cat.title}
              </h3>
            </div>

            <motion.ul
              variants={container}
              className="flex flex-wrap gap-2"
            >
              {cat.items.map((skill) => (
                <motion.li
                  key={skill}
                  variants={chip}
                  whileHover={{
                    scale: 1.08,
                    y: -3,
                    transition: { type: 'spring', stiffness: 500, damping: 14 },
                  }}
                  className="cursor-default rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3.5 py-1.5 text-xs font-medium text-[var(--fg)] shadow-sm"
                >
                  {skill}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        ))}
      </motion.div>
    </Section>
  )
}
