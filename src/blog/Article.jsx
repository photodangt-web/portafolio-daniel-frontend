import { Link, useParams } from 'react-router-dom'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion, useScroll, useSpring } from 'framer-motion'
import { ArrowLeft, ArrowRight, CalendarDays, Clock3, FileDown, Globe2, Heart, Mail, Send, Share2, Tag } from 'lucide-react'
import { toast } from 'sonner'
import Atmosphere from '../components/Atmosphere'
import Dock from '../components/Dock'
import ArticleContent from './ArticleContent'
import { articlesApi, pageData } from '../api/articles'
import { resolveMediaUrl } from '../api/client'

const label = (value) => typeof value === 'string' ? value : value?.name || value?.title || ''
const formatDate = (value) => value ? new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(new Date(value)) : ''
const plainText = (content) => typeof content === 'string' ? content.replace(/<[^>]*>/g, ' ') : JSON.stringify(content || '')
const readingTime = (content) => Math.max(1, Math.ceil(plainText(content).trim().split(/\s+/).filter(Boolean).length / 220))
const metricsFor = (metrics = {}) => ({ views: metrics.views || 0, likes: metrics.likes || 0, shares: metrics.shares || 0, sharesByNetwork: metrics.sharesByNetwork || {} })
const initials = (name) => name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()

function useMinimumLoading(isLoading, minimumDuration = 500) {
  const [showLoading, setShowLoading] = useState(isLoading)
  const loadingStartedAt = useRef(null)

  useEffect(() => {
    if (isLoading) {
      loadingStartedAt.current ??= Date.now()
      setShowLoading(true)
      return undefined
    }

    const elapsed = loadingStartedAt.current ? Date.now() - loadingStartedAt.current : minimumDuration
    const timeout = window.setTimeout(() => {
      loadingStartedAt.current = null
      setShowLoading(false)
    }, Math.max(0, minimumDuration - elapsed))

    return () => window.clearTimeout(timeout)
  }, [isLoading, minimumDuration])

  return showLoading
}

function ArticleState({ error }) {
  return <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--fg)]"><Atmosphere /><main className="relative z-10 mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6"><span className="blog-eyebrow">{error ? '404 / Sin señal' : 'Cargando'}</span><h1 className="mt-4 text-4xl font-semibold tracking-tight">{error ? 'Este artículo no está disponible.' : 'Abriendo el artículo.'}</h1><p className="mt-4 text-[var(--fg-muted)]">{error ? 'Puede que haya cambiado de dirección o que ya no esté publicado.' : 'Un momento, por favor.'}</p><Link to="/blog" className="blog-state-link">← Volver al blog</Link></main></div>
}

function ArticleSkeleton() {
  return <div className="relative min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--fg)]"><Atmosphere /><main className="relative z-10 mx-auto max-w-3xl px-6 pb-20 pt-12 sm:pt-20" aria-label="Cargando artículo" aria-busy="true">
    <div className="h-4 w-28 animate-pulse rounded bg-[var(--bg-soft)]" /><div className="mt-8 h-12 w-full animate-pulse rounded bg-[var(--bg-soft)] sm:h-16" /><div className="mt-3 h-12 w-3/4 animate-pulse rounded bg-[var(--bg-soft)] sm:h-16" /><div className="mt-8 flex items-center gap-3"><div className="h-10 w-10 animate-pulse rounded-full bg-[var(--bg-soft)]" /><div className="space-y-2"><div className="h-3 w-28 animate-pulse rounded bg-[var(--bg-soft)]" /><div className="h-3 w-20 animate-pulse rounded bg-[var(--bg-soft)]" /></div></div><div className="mt-12 space-y-4">{[0, 1, 2, 3, 4].map((index) => <div key={index} className={`h-4 animate-pulse rounded bg-[var(--bg-soft)] ${index === 4 ? 'w-2/3' : 'w-full'}`} />)}</div>
  </main><Dock /></div>
}

function ArticleActions({ item, metrics, onMetricsChange }) {
  const [liked, setLiked] = useState(false)
  const [pending, setPending] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const url = window.location.href
  const text = item.title

  useEffect(() => {
    try { setLiked(localStorage.getItem(`article-liked:${item.slug}`) === 'true') } catch { setLiked(false) }
  }, [item.slug])

  const toggleLike = async () => {
    if (pending) return
    setPending(true)
    try {
      const result = await articlesApi.like(item.slug)
      setLiked(Boolean(result.liked))
      try { localStorage.setItem(`article-liked:${item.slug}`, String(Boolean(result.liked))) } catch { /* Storage is optional. */ }
      onMetricsChange(metricsFor(result))
    } catch {
      toast.error('No fue posible actualizar el like.')
    } finally {
      setPending(false)
    }
  }

  const networks = [
    { id: 'facebook', label: 'Facebook', icon: Globe2, href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { id: 'linkedin', label: 'LinkedIn', icon: Globe2, href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}` },
    { id: 'twitter', label: 'Twitter / X', icon: Globe2, href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { id: 'whatsapp', label: 'WhatsApp', icon: Send, href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { id: 'telegram', label: 'Telegram', icon: Send, href: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}` },
    { id: 'email', label: 'Email', icon: Mail, href: `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${url}`)}` },
  ]

  const share = (network) => {
    setShareOpen(false)
    if (network.id === 'email') window.location.href = network.href
    else window.open(network.href, '_blank', 'noopener,noreferrer')
    articlesApi.share(item.slug, network.id).then((result) => onMetricsChange(metricsFor(result))).catch(() => {})
  }
  const nativeShare = async () => {
    try { await navigator.share({ title: text, text: item.excerpt || text, url }) } catch (error) { if (error?.name !== 'AbortError') toast.error('No fue posible abrir las opciones de compartir.') }
  }

  return <div className="article-actions" aria-label="Acciones del artículo">
    <motion.button whileTap={{ scale: 0.94 }} type="button" onClick={toggleLike} disabled={pending} data-analytics="article_like" data-article={item.slug} className={`article-action-circle ${liked ? 'is-active' : ''}`} aria-label={liked ? 'Quitar like' : 'Dar like'} aria-pressed={liked}><Heart size={17} fill={liked ? 'currentColor' : 'none'} /><span>{metrics.likes}</span></motion.button>
    <div className="article-share-wrap"><motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => setShareOpen((open) => !open)} data-analytics="article_share" data-article={item.slug} className="article-share-button" aria-expanded={shareOpen}><Share2 size={16} /> Share</motion.button>
      {shareOpen && <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }} className="article-share-menu">{networks.map((network) => { const Icon = network.icon; return <button type="button" key={network.id} onClick={() => share(network)}><Icon size={16} />{network.label}</button> })}{navigator.share && <button type="button" onClick={nativeShare} className="article-share-native"><Share2 size={16} />Más opciones</button>}</motion.div>}
    </div>
    <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => window.print()} className="article-pdf-button" aria-label="Guardar artículo como PDF" title="Guardar como PDF: abre el diálogo de impresión"><FileDown size={16} /> PDF</motion.button>
  </div>
}

export default function Article() {
  const { slug } = useParams()
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll()
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 28, restDelta: 0.001 })
  const article = useQuery({ queryKey: ['article', slug], queryFn: () => articlesApi.get(slug) })
  const showSkeleton = useMinimumLoading(article.isLoading)
  const item = article.data
  const [metrics, setMetrics] = useState(() => metricsFor())
  const category = label(item?.category)
  const related = useQuery({ queryKey: ['articles', 'related', category], queryFn: () => articlesApi.list({ page: 1, limit: 4, category: category || undefined }), enabled: Boolean(category) })

  useEffect(() => { if (item?.title) document.title = `${item.seoTitle || item.title} | Daniel de León` }, [item])
  useEffect(() => { if (item) setMetrics(metricsFor(item.metrics)) }, [item])
  useEffect(() => {
    if (!item?.slug) return
    const key = `article-view:${item.slug}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, 'true')
    } catch { return }
    articlesApi.view(item.slug).then((result) => setMetrics(metricsFor(result))).catch(() => {})
  }, [item?.slug])
  if (showSkeleton) return <ArticleSkeleton />
  if (article.isError || !item) return <ArticleState error />

  const relatedItems = pageData(related.data).items.filter((entry) => entry.slug !== item.slug).slice(0, 3)
  const author = item.author || {}
  const authorName = author.name || 'Daniel de León'
  const authorAvatar = resolveMediaUrl(author.avatar)

  return <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]"><motion.div className="blog-progress" style={{ scaleX: progress }} /><Atmosphere /><main className="relative z-10 mx-auto max-w-5xl px-5 pb-20 pt-8 sm:px-8 sm:pb-28 sm:pt-12">
    <Link to="/blog" className="blog-back"><ArrowLeft size={15} /> <span>Todos los artículos</span></Link>
    <header className="article-hero">
      <motion.p initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="blog-eyebrow">{category || 'Notas'}</motion.p>
      <motion.h1 initial={reducedMotion ? false : { opacity: 0, y: 24, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.75, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}>{item.title}</motion.h1>
      {item.excerpt && <motion.p initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.17 }} className="article-dek">{item.excerpt}</motion.p>}
      <div className="article-meta"><span><CalendarDays size={15} /> <time dateTime={item.publishedAt}>{formatDate(item.publishedAt)}</time></span><i /><span><Clock3 size={15} /> {readingTime(item.content)} min de lectura</span></div>
      <div className="article-byline"><div className="article-author-avatar">{authorAvatar ? <img src={authorAvatar} alt="" /> : initials(authorName)}</div><div><span>Escrito por</span><strong>{authorName}</strong></div><ArticleActions item={item} metrics={metrics} onMetricsChange={setMetrics} /></div>
    </header>
    <div className="article-layout"><article><ArticleContent content={item.content} className="article-content--reading" /></article><aside className="article-rail"><span>En este artículo</span><div /><p>{category || 'Notas'}<br />{metrics.views} lecturas<br />{metrics.shares} compartidos</p></aside></div>
    {(item.tags || []).length > 0 && <div className="article-tags">{item.tags.map((tag) => <span key={label(tag)}><Tag size={12} />{label(tag)}</span>)}</div>}
    <nav className="article-return glass"><div><span className="blog-eyebrow">Sigue explorando</span><p>Más notas sobre construir con intención.</p></div><Link to="/blog">Ver todos <ArrowRight size={16} /></Link></nav>
    {relatedItems.length > 0 && <section className="article-related"><p className="blog-eyebrow">También puede interesarte</p><div>{relatedItems.map((entry) => <Link key={entry.slug} to={`/blog/${entry.slug}`}><span>{label(entry.category) || 'Notas'}</span><h2>{entry.title}</h2><ArrowRight size={16} /></Link>)}</div></section>}
  </main><Dock /></div>
}
