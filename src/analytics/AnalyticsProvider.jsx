import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { analyticsApi } from '../api/analytics'

const CONSENT_KEY = 'portfolio-analytics-consent'
const VISITOR_KEY = 'portfolio-analytics-visitor'
const SESSION_KEY = 'portfolio-analytics-session'
const AnalyticsContext = createContext({ consent: 'unknown', setConsent: () => {}, track: () => {} })

function uuid() {
  if (crypto?.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16)
    return (char === 'x' ? value : (value & 3) | 8).toString(16)
  })
}

function storedId(storage, key) {
  try {
    const existing = storage.getItem(key)
    if (existing) return existing
    const value = uuid()
    storage.setItem(key, value)
    return value
  } catch {
    return uuid()
  }
}

function pageName(path) {
  if (path === '/') return 'Inicio'
  if (path === '/blog') return 'Blog'
  if (path.startsWith('/blog/')) return 'Artículo'
  if (path.startsWith('/proyectos/') || path.startsWith('/projects/')) return 'Proyecto'
  return path
}

export function AnalyticsProvider({ children }) {
  const location = useLocation()
  const [consent, setConsentState] = useState(() => {
    if (navigator.doNotTrack === '1') return 'denied'
    try { return localStorage.getItem(CONSENT_KEY) || 'unknown' } catch { return 'unknown' }
  })
  const queue = useRef([])
  const timer = useRef(null)
  const ids = useRef(null)
  const publicRoute = !location.pathname.startsWith('/admin') && location.pathname !== '/login'

  const setConsent = (value) => {
    try { localStorage.setItem(CONSENT_KEY, value) } catch { /* Storage is optional. */ }
    setConsentState(value)
  }

  const flush = useCallback(() => {
    timer.current = null
    const events = queue.current.splice(0, 50)
    if (events.length) analyticsApi.track(events).catch(() => {})
    if (queue.current.length) timer.current = window.setTimeout(flush, 1200)
  }, [])

  const track = useCallback((eventType, target, metadata = {}) => {
    if (!publicRoute || consent !== 'granted' || navigator.doNotTrack === '1') return
    ids.current ??= { visitorId: storedId(localStorage, VISITOR_KEY), sessionId: storedId(sessionStorage, SESSION_KEY) }
    queue.current.push({
      eventType,
      eventId: uuid(),
      visitorId: ids.current.visitorId,
      sessionId: ids.current.sessionId,
      page: pageName(location.pathname),
      path: location.pathname,
      ...(target && { target }),
      ...(Object.keys(metadata).length && { metadata }),
    })
    if (!timer.current) timer.current = window.setTimeout(flush, 1200)
  }, [consent, flush, location.pathname, publicRoute])

  useEffect(() => {
    if (!publicRoute || consent !== 'granted') return undefined
    track('page_view', undefined, location.pathname.startsWith('/blog/') ? { article: location.pathname.slice(6) } : {})
    return undefined
  }, [location.pathname, consent, publicRoute, track])

  useEffect(() => {
    if (!publicRoute || consent !== 'granted') return undefined
    const sections = [...document.querySelectorAll('main section[id]')]
    const seenAt = new Map()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = entry.target.id
        if (entry.isIntersecting) seenAt.set(id, Date.now())
        else if (seenAt.has(id)) {
          const durationMs = Date.now() - seenAt.get(id)
          seenAt.delete(id)
          if (durationMs >= 750) track('section_view', id, { durationMs })
        }
      })
    }, { threshold: 0.45 })
    sections.forEach((section) => observer.observe(section))
    return () => { observer.disconnect(); seenAt.forEach((started, id) => track('section_view', id, { durationMs: Date.now() - started })) }
  }, [location.pathname, consent, publicRoute, track])

  useEffect(() => {
    if (!publicRoute || consent !== 'granted') return undefined
    const onClick = (event) => {
      const element = event.target.closest('[data-analytics], a, button')
      if (!element) return
      const href = element.getAttribute('href') || ''
      const target = element.dataset.analytics || (href.includes('github') ? 'github' : href.startsWith('mailto:') ? 'contact_email' : href.startsWith('http') ? 'outbound_link' : '')
      if (!target) return
      const metadata = { ...(href.startsWith('http') && { outbound: true }), ...(element.dataset.project && { project: element.dataset.project }), ...(element.dataset.article && { article: element.dataset.article }), label: element.textContent?.trim().slice(0, 160) || target }
      track('click', target, metadata)
    }
    document.addEventListener('click', onClick)
    const heartbeat = window.setInterval(() => { if (!document.hidden) track('heartbeat') }, 30000)
    const onVisibility = () => { if (document.hidden) flush() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => { document.removeEventListener('click', onClick); document.removeEventListener('visibilitychange', onVisibility); window.clearInterval(heartbeat); flush() }
  }, [location.pathname, consent, flush, publicRoute, track])

  return <AnalyticsContext.Provider value={{ consent, setConsent, track }}>{children}</AnalyticsContext.Provider>
}

export const useAnalytics = () => useContext(AnalyticsContext)
