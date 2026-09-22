import { motion, useReducedMotion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import SafeImage from './SafeImage'
import StackedGallery from './StackedGallery'
import { useLightbox } from './ImageLightbox'
import { embedUrl } from './slides'
import { resolveMediaUrl } from '../api/client'
import { Reveal } from './Sweep'

const fadeSlow = (show, delay = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: show ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
  transition: { duration: show ? 1.05 : 0.3, delay: show ? delay : 0, ease: [0.16, 1, 0.3, 1] },
})

const markdownComponents = {
  img: ({ src, ...props }) => <img {...props} src={resolveMediaUrl(src)} alt={props.alt || ''} />,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>,
  code: ({ inline, className, children, ...props }) => inline
    ? <code className="project-md-inline" {...props}>{children}</code>
    : <pre className="project-md-pre"><code className={className} {...props}>{children}</code></pre>,
}

function Heading({ block, show }) {
  const Tag = block.level === 1 ? 'h1' : block.level === 3 ? 'h3' : 'h2'
  return (
    <Reveal show={show} delay={0.05}>
      <Tag className={`project-block-heading is-h${block.level || 2}`}>{block.text}</Tag>
    </Reveal>
  )
}

function Paragraph({ block, show }) {
  return (
    <Reveal show={show} delay={0.22}>
      <p className="project-block-copy">{block.text}</p>
    </Reveal>
  )
}

function TableBlock({ block, show }) {
  const headers = block.headers?.length ? block.headers : []
  const rows = block.rows || []
  if (!headers.length && !rows.length) return null
  return (
    <Reveal show={show} delay={0.18}>
    <div className="project-table-wrap">
        <table className="project-table">
          {headers.length > 0 && (
            <thead>
              <tr>
                {headers.map((header) => (
                  <th key={header}>{header}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {(headers.length ? headers : row).map((_, cellIndex) => (
                  <td key={cellIndex}>{row[cellIndex] || '—'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Reveal>
  )
}

function ImageBlock({ block, alt }) {
  const { open } = useLightbox()
  return (
    <figure
      className="project-single-image is-zoomable"
      onClick={() => open([block.src], 0)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => event.key === 'Enter' && open([block.src], 0)}
      aria-label={`Ampliar ${block.alt || alt}`}
    >
      <SafeImage src={block.src} alt={block.alt || alt} />
    </figure>
  )
}

function VideoBlock({ block, title }) {
  const src = embedUrl(block.url)
  if (!src) return null
  return (
    <div className="project-video">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

function HeroBlock({ block, show }) {
  const reduced = useReducedMotion()
  return (
    <section className={`project-hero-split is-${block.align === 'right' ? 'right' : 'left'}`}>
      {block.src && (
        <motion.div className="project-hero-split-media" initial={reduced ? false : { scale: 1.08 }} animate={{ scale: show ? 1 : 1.06 }} transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}>
          <SafeImage src={block.src} alt="" />
        </motion.div>
      )}
      <div className="project-hero-split-shade" />
      <div className="project-hero-split-copy">
        {block.title && <motion.h2 {...(reduced ? {} : fadeSlow(show, 0.08))}>{block.title}</motion.h2>}
        {block.text && <motion.p {...(reduced ? {} : fadeSlow(show, 0.24))}>{block.text}</motion.p>}
        {block.ctaLabel && block.url && (
          <motion.a href={block.url} target="_blank" rel="noreferrer" {...(reduced ? {} : fadeSlow(show, 0.38))}>
            {block.ctaLabel} →
          </motion.a>
        )}
      </div>
    </section>
  )
}

function MarkdownBlock({ block, show }) {
  const reduced = useReducedMotion()
  return (
    <motion.div className="project-markdown-shell" {...(reduced ? {} : fadeSlow(show))}>
      <div className="project-markdown-scroll">
        <div className="article-content project-md">
          <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml components={markdownComponents}>
            {block.text || ''}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  )
}

function ColumnItems({ items = [], project, show }) {
  return items.map((block) => <BlockView key={block.id} block={block} project={project} show={show} />)
}

function ColumnsBlock({ block, project, show }) {
  const reduced = useReducedMotion()
  return (
    <div className={`project-columns is-${block.columns || 2}`}>
      {(block.items || []).map((column, index) => (
        <motion.div
          key={index}
          className="project-column"
          {...(reduced ? {} : fadeSlow(show, index * 0.12))}
        >
          <ColumnItems items={column} project={project} show={show} />
        </motion.div>
      ))}
    </div>
  )
}

function BlockView({ block, project, show }) {
  if (block.type === 'heading') return <Heading block={block} show={show} />
  if (block.type === 'paragraph') return <Paragraph block={block} show={show} />
  if (block.type === 'table') return <TableBlock block={block} show={show} />
  if (block.type === 'image') return <Reveal show={show} delay={0.12}><ImageBlock block={block} alt={project.title} /></Reveal>
  if (block.type === 'gallery') return <StackedGallery images={block.images} alt={block.alt || project.title} layout={block.layout || 'stack'} />
  if (block.type === 'video') return <Reveal show={show} delay={0.12}><VideoBlock block={block} title={project.title} /></Reveal>
  if (block.type === 'hero') return <HeroBlock block={block} show={show} />
  if (block.type === 'markdown') return <MarkdownBlock block={block} show={show} />
  if (block.type === 'columns') return <ColumnsBlock block={block} project={project} show={show} />
  return null
}

export default function SlideBlocks({ blocks = [], project, isActive = false }) {
  const copy = []
  const media = []
  const advanced = blocks.some((block) => ['columns', 'hero', 'markdown'].includes(block.type))

  if (advanced) {
    const heroOnly = blocks.length === 1 && blocks[0]?.type === 'hero'
    const markdownOnly = blocks.length === 1 && blocks[0]?.type === 'markdown'
    if (heroOnly) return <HeroBlock block={blocks[0]} show={isActive} />
    if (markdownOnly) return <MarkdownBlock block={blocks[0]} show={isActive} />
    return (
      <div className="project-slide-stack">
        {blocks.map((block) => <BlockView key={block.id} block={block} project={project} show={isActive} />)}
      </div>
    )
  }

  blocks.forEach((block) => {
    if (block.type === 'heading') copy.push(<Heading key={block.id} block={block} show={isActive} />)
    else if (block.type === 'paragraph') copy.push(<Paragraph key={block.id} block={block} show={isActive} />)
    else if (block.type === 'table') copy.push(<TableBlock key={block.id} block={block} show={isActive} />)
    else if (block.type === 'image') media.push(<Reveal key={block.id} show={isActive} delay={0.12}><ImageBlock block={block} alt={project.title} /></Reveal>)
    else if (block.type === 'gallery') media.push(<StackedGallery key={block.id} images={block.images} alt={block.alt || project.title} layout={block.layout || 'stack'} />)
    else if (block.type === 'video') media.push(<Reveal key={block.id} show={isActive} delay={0.12}><VideoBlock block={block} title={project.title} /></Reveal>)
  })

  const galleryOnly = media.length === 1 && blocks.some((block) => block.type === 'gallery') && !copy.length

  if (galleryOnly) return <div className="project-slide-media is-bleed">{media}</div>

  return (
    <div className={`project-slide-grid ${media.length ? 'has-media' : 'is-copy'}`}>
      {copy.length > 0 && <div className="project-slide-copy">{copy}</div>}
      {media.length > 0 && <div className="project-slide-media">{media}</div>}
    </div>
  )
}
