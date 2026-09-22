import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import SafeImage from './SafeImage'
import { useLightbox } from './ImageLightbox'

function StackCard({ src, alt, index, total, progress }) {
  const y = useTransform(progress, (value) => {
    const active = value * Math.max(total - 1, 1)
    const delta = index - active
    return `${delta < 0 ? delta * 108 : Math.min(delta, 4) * 4}%`
  })
  const scale = useTransform(progress, (value) => {
    const active = value * Math.max(total - 1, 1)
    const delta = index - active
    return delta < 0 ? 0.86 : 1 - Math.min(Math.max(delta, 0), 4) * 0.06
  })
  const rotate = useTransform(progress, (value) => {
    const active = value * Math.max(total - 1, 1)
    const delta = index - active
    const tilt = index % 2 === 0 ? -2.4 : 2.4
    return delta < 0 ? delta * -14 : tilt * Math.min(delta, 3)
  })
  const opacity = useTransform(progress, (value) => {
    const active = value * Math.max(total - 1, 1)
    const delta = index - active
    if (delta < -0.92) return 0
    if (delta > 3.2) return 0.25
    return 1
  })

  return (
    <motion.div
      className="project-stack-card"
      style={{ y, scale, rotate, opacity, zIndex: total - index }}
    >
      <SafeImage src={src} alt={alt} />
    </motion.div>
  )
}

function FilmGallery({ items, alt, open }) {
  const [active, setActive] = useState(0)
  const reduced = useReducedMotion()
  const prev = (active - 1 + items.length) % items.length
  const next = (active + 1) % items.length
  const slots = items.length === 1 ? [active] : items.length === 2 ? [active, next] : [prev, active, next]

  return (
    <div className="project-film">
      <div className="project-film-stage">
        {slots.map((index, slot) => {
          const role = slots.length === 3 ? ['is-prev', 'is-active', 'is-next'][slot] : slot === 0 ? 'is-active' : 'is-next'
          return (
            <motion.button
              type="button"
              key={`${items[index]}-${role}`}
              className={`project-film-card is-zoomable ${role}`}
              onClick={() => (role === 'is-active' ? open(items, index) : setActive(index))}
              aria-label={role === 'is-active' ? `Ampliar ${alt} ${index + 1}` : `Ver ${alt} ${index + 1}`}
              initial={reduced ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <SafeImage src={items[index]} alt={`${alt} ${index + 1}`} />
            </motion.button>
          )
        })}
      </div>
      {items.length > 1 && (
        <div className="project-film-dots">
          {items.map((_, index) => (
            <button key={index} type="button" className={index === active ? 'is-active' : ''} aria-label={`Imagen ${index + 1}`} onClick={() => setActive(index)} />
          ))}
        </div>
      )}
    </div>
  )
}

function MarqueeGallery({ items, alt, open }) {
  const reduced = useReducedMotion()
  const duration = Math.max(items.length * 9, 24)

  function cards(copy) {
    return items.map((src, index) => (
      <button
        type="button"
        key={`${copy}-${src}-${index}`}
        className="project-marquee-card is-zoomable"
        onClick={() => open(items, index)}
        aria-label={`Ampliar ${alt} ${index + 1}`}
      >
        <SafeImage src={src} alt={`${alt} ${index + 1}`} />
      </button>
    ))
  }

  if (items.length === 1 || reduced) {
    return (
      <div className="project-marquee is-static">
        <div className="project-marquee-track">
          <div className="project-marquee-set">{cards('a')}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="project-marquee">
      <div className="project-marquee-track" style={{ animationDuration: `${duration}s` }}>
        <div className="project-marquee-set">{cards('a')}</div>
        <div className="project-marquee-set" aria-hidden="true">{cards('b')}</div>
      </div>
    </div>
  )
}

function ThumbsGallery({ items, alt, open }) {
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [overflow, setOverflow] = useState(false)
  const row = useRef(null)

  useEffect(() => {
    if (reduced || paused || items.length < 2) return undefined
    const timer = window.setInterval(() => setActive((value) => (value + 1) % items.length), 6800)
    return () => window.clearInterval(timer)
  }, [items.length, paused, reduced])

  useEffect(() => {
    const node = row.current
    if (!node) return undefined
    const check = () => setOverflow(node.scrollWidth > node.clientWidth + 8)
    check()
    const timer = window.setTimeout(check, 120)
    window.addEventListener('resize', check)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('resize', check)
    }
  }, [items.length])

  useEffect(() => {
    const scroller = row.current
    const thumb = scroller?.querySelector('.is-active')
    if (!scroller || !thumb) return
    const left = thumb.offsetLeft - (scroller.clientWidth - thumb.offsetWidth) / 2
    scroller.scrollTo({ left: Math.max(0, left), behavior: 'smooth' })
  }, [active])

  function go(direction) {
    setActive((value) => (value + direction + items.length) % items.length)
  }

  return (
    <div className="project-thumbs" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="project-thumbs-stage">
        {items.length > 1 && (
          <button type="button" className="project-thumbs-arrow" onClick={() => go(-1)} aria-label="Imagen anterior">
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="project-thumbs-core">
          <div className="project-thumbs-frame">
            <AnimatePresence mode="wait">
              <motion.button
                key={items[active]}
                type="button"
                className="project-thumbs-main is-zoomable"
                onClick={() => open(items, active)}
                aria-label={`Ampliar ${alt} ${active + 1}`}
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <SafeImage src={items[active]} alt={`${alt} ${active + 1}`} />
              </motion.button>
            </AnimatePresence>
          </div>
          {items.length > 1 && (
            <div className={`project-thumbs-fade ${overflow ? 'is-overflow' : ''}`}>
              <div className="project-thumbs-row" ref={row}>
                {items.map((src, index) => (
                  <button
                    type="button"
                    key={`${src}-${index}`}
                    className={index === active ? 'is-active' : ''}
                    onClick={() => setActive(index)}
                    aria-label={`Ver ${alt} ${index + 1}`}
                  >
                    <SafeImage src={src} alt="" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        {items.length > 1 && (
          <button type="button" className="project-thumbs-arrow" onClick={() => go(1)} aria-label="Imagen siguiente">
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

function GridGallery({ items, alt, open }) {
  const reduced = useReducedMotion()
  return (
    <div className="project-mosaic">
      {items.map((src, index) => (
        <motion.button
          type="button"
          key={`${src}-${index}`}
          className={`project-mosaic-card is-zoomable is-${(index % 5) + 1}`}
          onClick={() => open(items, index)}
          aria-label={`Ampliar ${alt} ${index + 1}`}
          initial={reduced ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.05, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
        >
          <SafeImage src={src} alt={`${alt} ${index + 1}`} />
        </motion.button>
      ))}
    </div>
  )
}

export default function StackedGallery({ images = [], alt = 'Captura del proyecto', layout = 'stack' }) {
  const ref = useRef(null)
  const reducedMotion = useReducedMotion()
  const { open } = useLightbox()
  const items = images.filter(Boolean)
  const progress = useMotionValue(0)
  const [current, setCurrent] = useState(1)

  useMotionValueEvent(progress, 'change', (value) => {
    setCurrent(Math.round(value * Math.max(items.length - 1, 1)) + 1)
  })

  useEffect(() => {
    const target = ref.current
    const container = target?.closest('.project-show')
    if (!target || !container || items.length < 2) return undefined

    const update = () => {
      const containerBox = container.getBoundingClientRect()
      const targetBox = target.getBoundingClientRect()
      const start = container.scrollTop + targetBox.top - containerBox.top
      const range = target.offsetHeight - container.clientHeight
      if (range <= 1) {
        progress.set(0)
        return
      }
      const raw = (container.scrollTop - start) / range
      progress.set(Math.max(0, Math.min(1, raw)))
    }

    update()
    container.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      container.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [items.length, progress])

  if (!items.length) return null
  if (layout === 'film') return <FilmGallery items={items} alt={alt} open={open} />
  if (layout === 'grid') return <GridGallery items={items} alt={alt} open={open} />
  if (layout === 'marquee') return <MarqueeGallery items={items} alt={alt} open={open} />
  if (layout === 'thumbs') return <ThumbsGallery items={items} alt={alt} open={open} />

  if (items.length === 1 || reducedMotion) {
    return (
      <div className="project-stack project-stack--static">
        {items.map((src, index) => (
          <button
            type="button"
            key={`${src}-${index}`}
            className="project-stack-card is-zoomable"
            onClick={() => open(items, index)}
            aria-label={`Ampliar ${alt} ${index + 1}`}
          >
            <SafeImage src={src} alt={`${alt} ${index + 1}`} />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div
      ref={ref}
      className="project-stack"
      style={{ height: `${items.length * 100}svh` }}
    >
      <div className="project-stack-pin">
        <button
          type="button"
          className="project-stack-stage is-zoomable"
          onClick={() => open(items, current - 1)}
          aria-label={`Ampliar ${alt} ${current}`}
        >
          {items.map((src, index) => (
            <StackCard
              key={`${src}-${index}`}
              src={src}
              alt={`${alt} ${index + 1}`}
              index={index}
              total={items.length}
              progress={progress}
            />
          ))}
        </button>
        <p className="project-stack-count">{String(current).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</p>
      </div>
    </div>
  )
}
