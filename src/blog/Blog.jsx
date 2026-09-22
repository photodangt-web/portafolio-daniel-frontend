import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight, RefreshCw, Tag } from 'lucide-react'
import Atmosphere from '../components/Atmosphere'
import Dock from '../components/Dock'
import { articlesApi, pageData } from '../api/articles'
import { resolveMediaUrl } from '../api/client'

const formatDate = (value) => value ? new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(new Date(value)) : ''
const label = (value) => typeof value === 'string' ? value : value?.name || value?.title || ''
const itemKey = (item) => item.id || item._id || item.slug || item.title

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

function ArticleCard({ article, index, featured = false, reducedMotion }) {
  const category = label(article.category)

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 28, filter: 'blur(7px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.6, delay: Math.min(index, 5) * 0.07, ease: [0.16, 1, 0.3, 1] }}
      className={featured ? 'blog-featured' : ''}
    >
      <Link to={`/blog/${article.slug}`} className="blog-card spotlight-card group">
        <div className={`blog-card-media ${article.coverImage ? '' : 'blog-card-media--placeholder'}`}>
          {article.coverImage ? <img src={resolveMediaUrl(article.coverImage)} alt="" /> : <span className="blog-card-orbit" />}
          {featured && <span className="blog-kicker">Artículo destacado</span>}
        </div>
        <div className="blog-card-body">
          <div className="blog-card-meta">
            <span>{category || 'Notas'}</span>
            {article.publishedAt && <><i /> <CalendarDays size={13} /> <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time></>}
          </div>
          <h2>{article.title}</h2>
          {article.excerpt && <p>{article.excerpt}</p>}
          <div className="blog-card-footer">
            <div className="blog-tags">{(article.tags || []).slice(0, 3).map((tag) => <span key={label(tag)}><Tag size={11} />{label(tag)}</span>)}</div>
            <span className="blog-read-link">Leer <ArrowRight size={15} /></span>
          </div>
        </div>
      </Link>
    </motion.article>
  )
}

function BlogNotice({ type, onRetry }) {
  const messages = {
    loading: ['Preparando las notas', 'Cargando los artículos publicados.'],
    error: ['No pudimos abrir el cuaderno', 'Comprueba tu conexión e inténtalo otra vez.'],
    empty: ['Todavía no hay coincidencias', 'Prueba con otra categoría o elimina los filtros activos.'],
  }
  const [title, description] = messages[type]
  return <div className="blog-notice glass"><span className="blog-notice-mark">{type === 'loading' ? <span className="blog-loader" /> : '—'}</span><div><h2>{title}</h2><p>{description}</p>{type === 'error' && <button type="button" onClick={onRetry}><RefreshCw size={14} /> Reintentar</button>}</div></div>
}

function BlogSkeleton() {
  return <section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3" aria-label="Cargando artículos" aria-busy="true">
    {[0, 1, 2, 3, 4, 5].map((index) => <div key={index} className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-card)]/60">
      <div className="space-y-3 p-5"><div className="h-3 w-24 animate-pulse rounded bg-[var(--bg-soft)]" /><div className="h-6 w-4/5 animate-pulse rounded bg-[var(--bg-soft)]" /><div className="h-4 w-full animate-pulse rounded bg-[var(--bg-soft)]" /><div className="h-4 w-2/3 animate-pulse rounded bg-[var(--bg-soft)]" /></div>
    </div>)}
  </section>
}

export default function Blog() {
  const [params, setParams] = useSearchParams()
  const reducedMotion = useReducedMotion()
  const page = Math.max(1, Number(params.get('page') || 1))
  const category = params.get('category') || ''
  const tag = params.get('tag') || ''
  const articles = useQuery({ queryKey: ['articles', { page, category, tag }], queryFn: () => articlesApi.list({ page, limit: 9, category: category || undefined, tag: tag || undefined }) })
  const categories = useQuery({ queryKey: ['article-categories'], queryFn: articlesApi.categories })
  const tags = useQuery({ queryKey: ['article-tags'], queryFn: articlesApi.tags })
  const showSkeleton = useMinimumLoading(articles.isLoading)
  const result = pageData(articles.data)
  const isFiltered = Boolean(category || tag)
  const setFilter = (key, value) => setParams(Object.fromEntries(Object.entries({ category, tag, [key]: value, page: 1 }).filter(([, item]) => item)))
  const featured = !isFiltered && page === 1 ? result.items[0] : null
  const cards = featured ? result.items.slice(1) : result.items

  return <div className="relative min-h-screen overflow-x-hidden bg-[var(--bg)] text-[var(--fg)]"><Atmosphere /><main className="relative z-10 mx-auto max-w-6xl px-5 pb-20 pt-8 sm:px-8 sm:pb-28 sm:pt-12">
    <motion.div initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="flex items-center justify-between gap-4">
      <Link to="/" className="blog-back">← <span>Volver al portfolio</span></Link>
      <span className="blog-index">01 / BLOG</span>
    </motion.div>

    <header className="blog-masthead">
      <motion.p initial={reducedMotion ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.08 }} className="blog-eyebrow">Cuaderno de trabajo</motion.p>
      <motion.h1 initial={reducedMotion ? false : { opacity: 0, y: 26, filter: 'blur(8px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} transition={{ duration: 0.75, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}>Ideas que<br /><em>merecen quedarse.</em></motion.h1>
      <motion.p initial={reducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.26 }} className="blog-intro">Notas sobre interfaces, producto y el oficio de construir experiencias web que se sienten bien.</motion.p>
    </header>

    <section aria-label="Filtrar artículos" className="blog-filters glass">
      <div className="blog-filter-row"><span className="blog-filter-label">Explorar</span><div className="blog-filter-scroll"><button type="button" onClick={() => setParams({})} className={!isFiltered ? 'is-active' : ''}>Todo</button>{(categories.data || []).map((item) => { const value = label(item); return <button type="button" key={value} onClick={() => setFilter('category', value)} className={category === value ? 'is-active' : ''}>{value}</button> })}</div></div>
      {tags.data?.length > 0 && <div className="blog-tag-row">{tags.data.slice(0, 12).map((item) => { const value = label(item); return <button type="button" key={value} onClick={() => setFilter('tag', value)} className={tag === value ? 'is-active' : ''}>#{value}</button> })}</div>}
    </section>

    {showSkeleton ? <BlogSkeleton /> : articles.isError ? <BlogNotice type="error" onRetry={() => articles.refetch()} /> : <>
      {featured && <div className="mt-10"><ArticleCard article={featured} index={0} featured reducedMotion={reducedMotion} /></div>}
      {cards.length > 0 && <section className="blog-grid" aria-label="Artículos publicados">{cards.map((article, index) => <ArticleCard key={itemKey(article)} article={article} index={index + (featured ? 1 : 0)} reducedMotion={reducedMotion} />)}</section>}
      {!result.items.length && <BlogNotice type="empty" />}
      {result.items.length > 0 && <footer className="blog-pagination"><span>{result.total} {result.total === 1 ? 'artículo' : 'artículos'} {isFiltered && 'en esta selección'}</span><div><button type="button" aria-label="Página anterior" disabled={page <= 1} onClick={() => setParams({ category, tag, page: page - 1 })}><ChevronLeft size={17} /></button><span className="blog-page">{page} <i /> {result.totalPages}</span><button type="button" aria-label="Página siguiente" disabled={page >= result.totalPages} onClick={() => setParams({ category, tag, page: page + 1 })}><ChevronRight size={17} /></button></div></footer>}
    </>}
  </main><Dock variant="floating" placement="responsive-top" /></div>
}
