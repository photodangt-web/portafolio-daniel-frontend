import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function HeroPhoto({ profile }) {
  const photoSrc = profile.avatar || ''
  const [displaySrc, setDisplaySrc] = useState(photoSrc)
  const [loaded, setLoaded] = useState(Boolean(photoSrc))

  useEffect(() => {
    if (!photoSrc || photoSrc === displaySrc) return undefined
    const image = new Image()
    image.onload = () => {
      setDisplaySrc(photoSrc)
      setLoaded(true)
    }
    image.src = photoSrc
    return undefined
  }, [photoSrc, displaySrc])

  return (
    <motion.div
      initial={{ opacity: 0, x: 28, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="relative mx-auto w-full max-w-[380px] lg:mx-0 lg:max-w-none"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[115%] w-[115%] -translate-x-1/2 -translate-y-1/2"
      >
        <div className="absolute inset-0 rounded-full border border-dashed border-[var(--border-strong)] opacity-60" />
        <div className="absolute inset-[8%] rounded-full border border-[var(--border)] opacity-50" />
        <div className="absolute inset-[18%] rounded-full border border-[var(--border)] opacity-40" />
      </div>

      <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[var(--bg)]/40 via-transparent to-transparent"
        />
        {displaySrc && (
          <img
            src={displaySrc}
            alt={profile.name}
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${
              loaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.5 }}
        className="glass absolute -bottom-3 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium text-[var(--fg-muted)] shadow-lg"
      >
        {profile.location} · {profile.role}
      </motion.div>
    </motion.div>
  )
}
