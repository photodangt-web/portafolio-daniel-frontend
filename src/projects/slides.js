export function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function isVideoSrc(src = '') {
  return /\.(mp4|webm|ogg)(\?.*)?$/i.test(src)
}

export function embedUrl(url = '') {
  const value = url.trim()
  if (!value) return ''
  try {
    const parsed = new URL(value)
    if (parsed.hostname.includes('youtu.be')) {
      return `https://www.youtube.com/embed/${parsed.pathname.replace('/', '')}`
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v') || parsed.pathname.split('/').pop()
      return id ? `https://www.youtube.com/embed/${id}` : value
    }
    if (parsed.hostname.includes('vimeo.com') && !parsed.hostname.includes('player.vimeo.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop()
      return id ? `https://player.vimeo.com/video/${id}` : value
    }
  } catch {
    return value
  }
  return value
}

function block(type, extra = {}) {
  return { id: createId(), type, ...extra }
}

export function fallbackSlides(project) {
  const slides = []
  if (project.content) {
    slides.push({
      id: createId(),
      blocks: [
        block('heading', { level: 2, text: 'Qué se construyó' }),
        block('paragraph', { text: project.content }),
      ],
    })
  }
  if (project.gallery?.length) {
    slides.push({
      id: createId(),
      blocks: [
        block('heading', { level: 2, text: 'Recorrido visual' }),
        block('paragraph', { text: 'Las piezas que dan forma al proyecto, una sobre otra.' }),
        block('gallery', { images: project.gallery }),
      ],
    })
  } else if (project.coverImage) {
    slides.push({
      id: createId(),
      blocks: [block('image', { src: project.coverImage, alt: project.title })],
    })
  }
  if (project.technologies?.length) {
    slides.push({
      id: createId(),
      blocks: [
        block('heading', { level: 2, text: 'Stack' }),
        block('table', {
          headers: ['Tecnología'],
          rows: project.technologies.map((item) => [item]),
        }),
      ],
    })
  }
  return slides
}

export function showcaseSlides(project) {
  if (project?.slides?.length) return project.slides
  return project ? fallbackSlides(project) : []
}

export function emptyBlock(type, extra = {}) {
  if (type === 'heading') return block('heading', { level: 2, text: '' })
  if (type === 'paragraph') return block('paragraph', { text: '' })
  if (type === 'image') return block('image', { src: '', alt: '' })
  if (type === 'gallery') return block('gallery', { images: [], layout: extra.layout || 'stack' })
  if (type === 'video') return block('video', { url: '' })
  if (type === 'hero') return block('hero', { src: '', title: '', text: '', align: 'left', ctaLabel: '', url: '' })
  if (type === 'markdown') return block('markdown', { text: '' })
  if (type === 'columns') {
    const columns = extra.columns === 3 || extra.columns === 4 ? extra.columns : 2
    return block('columns', { columns, items: Array.from({ length: columns }, () => []) })
  }
  return block('table', { headers: ['Columna 1', 'Columna 2'], rows: [['', '']] })
}

export function emptySlide() {
  return {
    id: createId(),
    blocks: [emptyBlock('heading'), emptyBlock('paragraph')],
  }
}

export function slidePreview(slide) {
  const heading = slide.blocks?.find((item) => item.type === 'heading' || item.type === 'hero')
  const copy = slide.blocks?.find((item) => item.type === 'paragraph' || item.type === 'markdown')
  const kinds = (slide.blocks || []).map((item) => item.type)
  return {
    title: heading?.title || heading?.text || (kinds.includes('columns') ? 'Columnas' : 'Slide sin título'),
    detail: copy?.text || kinds.filter((type) => type !== 'heading' && type !== 'paragraph').join(' · ') || 'Vacío',
  }
}
