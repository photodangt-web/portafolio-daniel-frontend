import { motion } from 'framer-motion'
import { useAnalytics } from '../analytics/AnalyticsProvider'

export default function Footer({ profile }) {
  const year = new Date().getFullYear()
  const { consent, setConsent } = useAnalytics()

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
        <div className="flex items-center gap-3 text-xs text-[var(--fg-faint)]"><p>© {year} · React · Vite · Framer Motion · Dock glass</p>{consent !== 'unknown' && navigator.doNotTrack !== '1' && <button type="button" onClick={() => setConsent(consent === 'granted' ? 'denied' : 'granted')} className="underline underline-offset-4 hover:text-[var(--fg)]">{consent === 'granted' ? 'Desactivar analítica' : 'Activar analítica'}</button>}</div>
      </div>
    </footer>
  )
}
