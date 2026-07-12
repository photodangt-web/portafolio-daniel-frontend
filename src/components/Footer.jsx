import { motion } from 'framer-motion'
import { profile } from '../data/content'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="relative z-10 border-t border-[var(--border)] pb-28 pt-12">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-6 sm:flex-row sm:items-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <p className="text-sm font-semibold tracking-tight text-[var(--fg)]">
            {profile.name}
          </p>
          <p className="mt-1 text-xs text-[var(--fg-faint)]">
            {profile.role} · {profile.location}
          </p>
        </motion.div>
        <p className="text-xs text-[var(--fg-faint)]">
          © {year} · React · Vite · Framer Motion · Dock glass
        </p>
      </div>
    </footer>
  )
}
