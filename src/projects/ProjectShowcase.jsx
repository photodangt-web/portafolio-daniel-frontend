import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'
import { ArrowLeft, ArrowRight, Code2, ExternalLink } from 'lucide-react'
import { portfolioApi } from '../api/portfolio'
import { resolveMediaUrl } from '../api/client'
import SafeImage from './SafeImage'
import SlideBlocks from './SlideBlocks'
import { Reveal } from './Sweep'

import { LightboxProvider, useLightbox } from './ImageLightbox'
import { isVideoSrc, showcaseSlides } from './slides'
import { findSnapshotProject, readHomeSnapshot } from '../api/homeSnapshot'

function presentationFrames(slides) {
  const frames = []
  slides.forEach((slide, index) => {
    const gallery = (slide.blocks || []).filter((block) => block.type === 'gallery' && (block.layout || 'stack') === 'stack')
    const rest = (slide.blocks || []).filter((block) => !(block.type === 'gallery' && (block.layout || 'stack') === 'stack'))
    if (rest.length) frames.push({ id: `${slide.id || index}-copy`, blocks: rest, stacked: false, imageCount: 0 })
    gallery.forEach((block, galleryIndex) => {
      frames.push({
        id: `${slide.id || index}-gallery-${galleryIndex}`,
        blocks: [block],
        stacked: true,
        imageCount: (block.images || []).filter(Boolean).length,
      })
    })
  })
  return frames
}

function frameOffset(container, element) {
  const containerBox = container.getBoundingClientRect()
  const elementBox = element.getBoundingClientRect()
  return container.scrollTop + elementBox.top - containerBox.top
}

function usePageMeta({ title, description, image }) {
  useEffect(() => {
    const previousTitle = document.title
    const previousDescription = document.querySelector('meta[name="description"]')?.getAttribute('content')
    if (title) document.title = title

    const write = (key, content, property = false) => {
      if (!content) return
      const attr = property ? 'property' : 'name'
      let node = document.querySelector(`meta[${attr}="${key}"]`)
      if (!node) {
        node = document.createElement('meta')
        node.setAttribute(attr, key)
        document.head.appendChild(node)
      }
      node.setAttribute('content', content)
    }

    write('description', description)
    write('og:title', title, true)
    write('og:description', description, true)
    write('og:image', image, true)
    write('og:type', 'article', true)

    return () => {
      document.title = previousTitle
      if (previousDescription) write('description', previousDescription)
    }
  }, [title, description, image])
}

const coverFade = {
  hidden: { opacity: 0, y: 32, filter: 'blur(10px)' },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.75, delay: 0.28 + i * 0.1, ease: [0.16, 1, 0.3, 1] },
  }),
}

function Cover({ project, onScroll, isActive }) {
  const reduced = useReducedMotion()
  const { open } = useLightbox()
  const media = project.coverImage
  const video = isVideoSrc(media)
  const state = reduced ? 'visible' : isActive ? 'visible' : 'hidden'

  return (
    <section className="project-frame project-cover" data-show-frame="cover">
      <div className="project-cover-media">
        {media && !video && (
          <motion.button
            type="button"
            className="project-cover-photo is-zoomable"
            initial={reduced ? false : { scale: 1.12 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => open([media], 0)}
            aria-label="Ampliar imagen de portada"
          >
            <SafeImage src={media} alt="" loading="eager" fetchPriority="high" />
          </motion.button>
        )}
        {video && (
          <video src={resolveMediaUrl(media)} autoPlay muted loop playsInline preload="metadata" />
        )}
      </div>
      <div className="project-cover-shade" />
      <div className="project-cover-copy">
        {project.category && (
          <motion.p className="project-kicker" custom={0} variants={coverFade} initial="hidden" animate={state}>
            {project.category}
          </motion.p>
        )}
        <motion.h1 custom={1} variants={coverFade} initial="hidden" animate={state}>
          {project.title}
        </motion.h1>
        <motion.p custom={2} variants={coverFade} initial="hidden" animate={state}>
          {project.tagline || project.summary}
        </motion.p>
        {project.technologies?.length > 0 && (
          <motion.ul className="project-cover-tags" custom={3} variants={coverFade} initial="hidden" animate={state}>
            {project.technologies.slice(0, 6).map((tag) => (
              <li key={tag}>{tag}</li>
            ))}
          </motion.ul>
        )}
        <motion.div className="project-cover-links" custom={4} variants={coverFade} initial="hidden" animate={state}>
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer">
              Ver en vivo <ExternalLink size={14} />
            </a>
          )}
          {project.repositoryUrl && (
            <a href={project.repositoryUrl} target="_blank" rel="noreferrer">
              <Code2 size={14} /> Código
            </a>
          )}
        </motion.div>
      </div>
      <button type="button" className="project-scroll-hint" onClick={onScroll}>
        <span />
        Continuar
      </button>
    </section>
  )
}

function Ending({ recommendations, isActive }) {
  const hasMore = recommendations.length > 0
  return (
    <section className="project-frame project-ending" data-show-frame="end">
      <div className="project-ending-inner">
        <Reveal show={isActive}><p className="project-kicker">Fin del recorrido</p></Reveal>
        <Reveal show={isActive} delay={0.12}><h2>{hasMore ? 'Sigue el viaje' : 'Por ahora no hay más proyectos por recomendar'}</h2></Reveal>
        <Reveal show={isActive} delay={0.26}>
        <p className="project-ending-copy">
          {hasMore
            ? 'Otros trabajos publicados, listos para verse como presentación.'
            : 'Vuelve al inicio cuando quieras ver el resto del portafolio.'}
        </p>
        </Reveal>
        <Reveal show={isActive} delay={0.34}>
        {hasMore && (
          <div className="project-recs">
            {recommendations.map((item) => (
              <Link key={item.slug} to={`/proyectos/${item.slug}`} className="project-rec-card">
                <SafeImage src={item.coverImage} alt="" />
                <div>
                  <p>{item.title}</p>
                  <span>{item.tagline || item.summary}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        <Link to="/#projects" className="project-home-link">
          Volver al inicio <ArrowRight size={16} />
        </Link>
        </Reveal>
      </div>
    </section>
  )
}

function Progress({ frames, active, onSelect }) {
  return (
    <nav className="project-progress project-chrome" aria-label="Progreso del recorrido">
      {frames.map((frame, index) => (
        <button
          key={frame.id}
          type="button"
          className={index === active ? 'is-active' : ''}
          aria-label={frame.label}
          aria-current={index === active ? 'true' : undefined}
          onClick={() => onSelect(index)}
        />
      ))}
    </nav>
  )
}

function SlideNav({ index, total, onPrev, onNext }) {
  const last = index >= total - 1
  return (
    <div className="project-slide-nav">
      <button type="button" className="project-nav-prev" onClick={onPrev} disabled={index <= 0} aria-label="Slide anterior">
        <ArrowLeft size={18} /> Anterior
      </button>
      {last ? (
        <Link to="/#projects" className="project-nav-next" aria-label="Finalizar y volver a proyectos">
          Finalizar <ArrowRight size={18} />
        </Link>
      ) : (
        <button type="button" className={`project-nav-next ${index === 0 ? 'is-hint' : ''}`} onClick={onNext} aria-label="Slide siguiente">
          Siguiente <ArrowRight size={18} />
        </button>
      )}
    </div>
  )
}

export function LegacyProjectRedirect() {
  const { slug } = useParams()
  return <Navigate to={`/proyectos/${slug}`} replace />
}

export default function ProjectShowcase() {
  return (
    <LightboxProvider>
      <ShowcaseBody />
    </LightboxProvider>
  )
}

function ShowcaseBody() {
  const { slug } = useParams()
  const scroller = useRef(null)
  const activeRef = useRef(0)
  const programmatic = useRef(false)
  const scrollTimer = useRef(0)
  const [active, setActive] = useState(0)

  const reduced = useReducedMotion()
  const { isOpen } = useLightbox()
  const snapshotProject = useMemo(() => findSnapshotProject(slug), [slug])
  const projectQuery = useQuery({
    queryKey: ['project', slug],
    queryFn: () => portfolioApi.getProject(slug),
    retry: 1,
  })
  const listQuery = useQuery({
    queryKey: ['projects'],
    queryFn: portfolioApi.getProjects,
    retry: 1,
  })
  const project = projectQuery.data || snapshotProject
  useEffect(() => {
    if (projectQuery.isLoading) return
    console.log(projectQuery.data ? 'content: server' : 'content: static_front')
  }, [projectQuery.isLoading, projectQuery.data])
  const slides = useMemo(() => presentationFrames(showcaseSlides(project)), [project])
  const snapshotList = readHomeSnapshot().projects || []
  const recommendations = (listQuery.data?.length ? listQuery.data : snapshotList).filter((item) => item.slug !== slug)
  const { scrollYProgress } = useScroll({ container: scroller })
  const bar = useTransform(scrollYProgress, [0, 1], [0, 1])

  const frames = useMemo(() => {
    const items = [{ id: 'cover', label: 'Portada', stacked: false, imageCount: 0 }]
    slides.forEach((slide, index) => {
      items.push({
        id: `slide-${slide.id || index}`,
        label: `Slide ${index + 1}`,
        stacked: Boolean(slide.stacked),
        imageCount: slide.imageCount || 0,
      })
    })
    items.push({ id: 'end', label: 'Cierre', stacked: false, imageCount: 0 })
    return items
  }, [slides])

  function galleryBounds(index = activeRef.current) {
    const root = scroller.current
    const frame = frames[index]
    if (!root || !frame?.stacked || frame.imageCount < 2) return null
    const element = document.getElementById(frame.id)
    if (!element) return null
    const start = frameOffset(root, element)
    const end = start + Math.max(element.offsetHeight - root.clientHeight, 0)
    return { start, end }
  }

  function scrollToFrame(index, cardIndex = 0) {
    const root = scroller.current
    const frame = frames[index]
    if (!root || !frame) return
    const element = document.getElementById(frame.id)
    if (!element) return
    const start = frameOffset(root, element)
    programmatic.current = true
    window.clearTimeout(scrollTimer.current)
    scrollTimer.current = window.setTimeout(() => { programmatic.current = false }, 700)
    if (frame.stacked && frame.imageCount > 1) {
      const range = Math.max(element.offsetHeight - root.clientHeight, 0)
      const progress = cardIndex / Math.max(frame.imageCount - 1, 1)
      root.scrollTo({ top: start + range * progress, behavior: 'smooth' })
      return
    }
    root.scrollTo({ top: start, behavior: 'smooth' })
  }

  function currentGalleryCard() {
    const root = scroller.current
    const frame = frames[active]
    if (!root || !frame?.stacked || frame.imageCount < 2) return 0
    const element = document.getElementById(frame.id)
    if (!element) return 0
    const start = frameOffset(root, element)
    const range = element.offsetHeight - root.clientHeight
    if (range <= 0) return 0
    const progress = Math.max(0, Math.min(1, (root.scrollTop - start) / range))
    return Math.round(progress * (frame.imageCount - 1))
  }

  function go(delta) {
    const frame = frames[active]
    if (frame?.stacked && frame.imageCount > 1) {
      const card = currentGalleryCard() + delta
      if (card >= 0 && card <= frame.imageCount - 1) {
        scrollToFrame(active, card)
        return
      }
    }
    const next = Math.max(0, Math.min(frames.length - 1, active + delta))
    scrollToFrame(next, delta < 0 && frames[next]?.stacked ? Math.max((frames[next].imageCount || 1) - 1, 0) : 0)
  }

  usePageMeta({
    title: project ? `${project.seoTitle || project.title} — Daniel de León` : 'Proyecto',
    description: project?.seoDescription || project?.summary,
    image: project?.coverImage ? resolveMediaUrl(project.coverImage) : '',
  })

  useEffect(() => {
    const previous = document.body.style.overflow
    const restoration = window.history.scrollRestoration
    document.body.style.overflow = 'hidden'
    window.history.scrollRestoration = 'manual'
    return () => {
      document.body.style.overflow = previous
      window.history.scrollRestoration = restoration
    }
  }, [])

  useEffect(() => {
    const root = scroller.current
    if (!root || !project) return undefined
    programmatic.current = true
    root.scrollTop = 0
    activeRef.current = 0
    setActive(0)
    const timer = window.setTimeout(() => {
      if (scroller.current) scroller.current.scrollTop = 0
      programmatic.current = false
    }, 50)
    return () => window.clearTimeout(timer)
  }, [slug, project])

  useEffect(() => {
    const root = scroller.current
    if (!root) return undefined
    const onWheel = (event) => {
      const markdown = event.target.closest?.('.project-markdown-scroll')
      if (markdown) {
        event.preventDefault()
        markdown.scrollTop += event.deltaY
        return
      }
      const bounds = galleryBounds()
      if (!bounds) {
        event.preventDefault()
        return
      }
      const next = root.scrollTop + event.deltaY
      if (next < bounds.start || next > bounds.end) {
        event.preventDefault()
        root.scrollTop = Math.max(bounds.start, Math.min(bounds.end, next))
      }
    }
    const onTouchMove = (event) => {
      if (event.target.closest?.('.project-markdown-scroll')) return
      if (!galleryBounds()) event.preventDefault()
    }
    root.addEventListener('wheel', onWheel, { passive: false })
    root.addEventListener('touchmove', onTouchMove, { passive: false })
    return () => {
      root.removeEventListener('wheel', onWheel)
      root.removeEventListener('touchmove', onTouchMove)
    }
  }, [frames, project])

  useEffect(() => {
    const root = scroller.current
    if (!root) return undefined
    const update = () => {
      const nodes = [...root.querySelectorAll('[data-show-frame]')]
      const top = root.getBoundingClientRect().top
      let current = 0
      nodes.forEach((node, index) => {
        if (node.getBoundingClientRect().top - top <= root.clientHeight * 0.4) current = index
      })
      if (current !== activeRef.current) {
        activeRef.current = current
        setActive(current)
      }
      const bounds = galleryBounds()
      if (!programmatic.current && bounds) {
        if (root.scrollTop < bounds.start) root.scrollTop = bounds.start
        if (root.scrollTop > bounds.end) root.scrollTop = bounds.end
      }
    }
    update()
    root.addEventListener('scroll', update, { passive: true })
    return () => root.removeEventListener('scroll', update)
  }, [slides, project])

  useEffect(() => {
    const onKey = (event) => {
      if (isOpen) return
      if (!['ArrowDown', 'ArrowRight', 'PageDown', 'ArrowUp', 'ArrowLeft', 'PageUp', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      if (event.key === 'Home') return scrollToFrame(0)
      if (event.key === 'End') return scrollToFrame(frames.length - 1)
      go(['ArrowDown', 'ArrowRight', 'PageDown'].includes(event.key) ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, frames, isOpen])

  if (projectQuery.isLoading && !project) {
    return (
      <main className="project-show project-show--state">
        <p>Abriendo el recorrido...</p>
      </main>
    )
  }

  if (!project) {
    return (
      <main className="project-show project-show--state">
        <p>Este proyecto no está publicado.</p>
        <Link to="/#projects">Volver al inicio</Link>
      </main>
    )
  }

  return (
    <main className={`project-show ${active === 0 ? 'is-cover' : ''}`} ref={scroller}>
      {!reduced && <motion.div className="project-progress-bar" style={{ scaleX: bar }} />}
      <Link to="/#projects" className="project-back project-chrome">
        <ArrowLeft size={16} /> Proyectos
      </Link>
      <Progress frames={frames} active={active} onSelect={(index) => scrollToFrame(index)} />
      <SlideNav index={active} total={frames.length} onPrev={() => go(-1)} onNext={() => go(1)} />
      <div id="cover">
        <Cover project={project} onScroll={() => go(1)} isActive={active === 0} />
      </div>
      {slides.map((slide, index) => (
        <section
          key={slide.id || index}
          id={`slide-${slide.id || index}`}
          data-show-frame={String(index)}
          className={`project-frame ${slide.stacked ? 'is-stack' : ''}`}
        >
          <SlideBlocks
            blocks={slide.blocks}
            project={project}
            isActive={active === index + 1}
          />
        </section>
      ))}
      <div id="end">
        <Ending recommendations={recommendations} isActive={active === frames.length - 1} />
      </div>
    </main>
  )
}
