import { useState } from 'react'
import { resolveMediaUrl } from '../api/client'

export default function SafeImage({ src, alt = '', className = '', imgClassName = '', style, loading = 'lazy', ...props }) {
  const [failed, setFailed] = useState(false)
  const resolved = resolveMediaUrl(src)

  if (!resolved || failed) {
    return (
      <div
        className={`project-media-fallback ${className}`}
        role="img"
        aria-label={alt || 'Imagen no disponible'}
        style={style}
      >
        <span>{alt ? alt.slice(0, 1).toUpperCase() : '·'}</span>
      </div>
    )
  }

  return (
    <img
      src={resolved}
      alt={alt}
      className={`${className} ${imgClassName}`.trim()}
      style={style}
      loading={loading}
      decoding="async"
      {...props}
      onError={() => setFailed(true)}
    />
  )
}
