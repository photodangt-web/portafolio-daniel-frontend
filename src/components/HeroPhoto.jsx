import { useState } from 'react'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'

/**
 * Slot de foto del Hero (lado derecho).
 *
 * Cómo poner tu imagen:
 * 1. Guarda tu PNG en:  public/profile.png
 *    (o cambia PHOTO_SRC abajo)
 * 2. Recomendado: ~800×1000 px, fondo transparente o limpio
 */
const PHOTO_SRC = '/profile.png'

export default function HeroPhoto() {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  const showPlaceholder = failed || !loaded

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.94, filter: 'blur(12px)' }}
      animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full max-w-[380px] lg:mx-0 lg:max-w-none"
    >
      {/* anillos decorativos detrás de la foto */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2"
      >
        <div className="absolute inset-0 animate-[spin_40s_linear_infinite] rounded-full border border-dashed border-[var(--border-strong)] opacity-60" />
        <div className="absolute inset-[8%] animate-[spin_28s_linear_infinite_reverse] rounded-full border border-[var(--border)] opacity-50" />
        <div className="absolute inset-[18%] rounded-full border border-[var(--border)] opacity-40" />
      </div>

      {/* marco glass de la foto */}
      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]">
        {/* glow sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[var(--bg)]/40 via-transparent to-transparent"
        />

        {/* imagen real — se muestra cuando public/profile.png existe */}
        {!failed && (
          <img
            src={PHOTO_SRC}
            alt="Daniel de León"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        {/* placeholder mientras no hay PNG */}
        {showPlaceholder && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[var(--bg-soft)] px-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-card)] text-[var(--fg-faint)]">
              <User size={28} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--fg)]">Tu foto aquí</p>
              <p className="mt-1 max-w-[200px] text-[11px] leading-relaxed text-[var(--fg-faint)]">
                Coloca{' '}
                <code className="rounded bg-[var(--bg-card)] px-1 py-0.5 text-[10px]">
                  public/profile.png
                </code>{' '}
                y se verá automáticamente
              </p>
            </div>
          </div>
        )}
      </div>

      {/* etiqueta flotante */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.5 }}
        className="glass absolute -bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium text-[var(--fg-muted)] shadow-lg"
      >
        Guatemala · Web Dev
      </motion.div>
    </motion.div>
  )
}
