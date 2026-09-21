import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Minus, Plus, X } from 'lucide-react'
import SafeImage from './SafeImage'
import { resolveMediaUrl } from '../api/client'

const LightboxContext = createContext({
  open: () => {},
  close: () => {},
  isOpen: false,
})

export function useLightbox() {
  return useContext(LightboxContext)
}

export function LightboxProvider({ children }) {
  const [state, setState] = useState(null)
  const open = useCallback((images, index = 0) => {
    const items = (images || []).filter(Boolean)
    if (!items.length) return
    setState({ images: items, index: Math.max(0, Math.min(index, items.length - 1)) })
  }, [])
  const close = useCallback(() => setState(null), [])

  return (
    <LightboxContext.Provider value={{ open, close, isOpen: Boolean(state) }}>
      {children}
      <ImageLightbox state={state} onClose={close} onIndex={(index) => setState((current) => current && { ...current, index })} />
    </LightboxContext.Provider>
  )
}

function ImageLightbox({ state, onClose, onIndex }) {
  const reduced = useReducedMotion()
  const stage = useRef(null)
  const dragging = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const images = state?.images || []
  const index = state?.index || 0
  const src = images[index]
  const open = Boolean(src)

  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [src])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight' && index < images.length - 1) onIndex(index + 1)
      if (event.key === 'ArrowLeft' && index > 0) onIndex(index - 1)
      if (event.key === '+' || event.key === '=') changeZoom(zoom + 0.25)
      if (event.key === '-' || event.key === '_') changeZoom(zoom - 0.25)
    }
    const onWheel = (event) => {
      event.preventDefault()
      changeZoom(zoom + (event.deltaY < 0 ? 0.15 : -0.15))
    }
    window.addEventListener('keydown', onKey)
    const node = stage.current
    node?.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKey)
      node?.removeEventListener('wheel', onWheel)
    }
  }, [open, index, images.length, onClose, onIndex, zoom])

  function changeZoom(next) {
    const value = Math.max(1, Math.min(3, Number(next.toFixed(2))))
    setZoom(value)
    if (value === 1) setPan({ x: 0, y: 0 })
  }

  function onPointerDown(event) {
    if (zoom === 1) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragging.current = { x: event.clientX - pan.x, y: event.clientY - pan.y }
  }

  function onPointerMove(event) {
    if (!dragging.current) return
    setPan({ x: event.clientX - dragging.current.x, y: event.clientY - dragging.current.y })
  }

  function onPointerUp() {
    dragging.current = null
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="project-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          onClick={onClose}
        >
          <div className="project-lightbox-chrome" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="project-chrome" onClick={onClose} aria-label="Cerrar visor">
              <X size={16} />
            </button>
            <div className="project-chrome project-lightbox-zoom">
              <button type="button" onClick={(event) => { event.stopPropagation(); changeZoom(zoom - 0.25) }} disabled={zoom <= 1} aria-label="Alejar">
                <Minus size={15} />
              </button>
              <span>{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={(event) => { event.stopPropagation(); changeZoom(zoom + 0.25) }} disabled={zoom >= 3} aria-label="Acercar">
                <Plus size={15} />
              </button>
            </div>
            {images.length > 1 && (
              <p className="project-chrome project-lightbox-count">{index + 1} / {images.length}</p>
            )}
          </div>
          {images.length > 1 && (
            <>
              <button
                type="button"
                className="project-chrome project-lightbox-dir is-prev"
                disabled={index <= 0}
                onClick={(event) => { event.stopPropagation(); onIndex(index - 1) }}
                aria-label="Imagen anterior"
              >
                <ArrowLeft size={18} />
              </button>
              <button
                type="button"
                className="project-chrome project-lightbox-dir is-next"
                disabled={index >= images.length - 1}
                onClick={(event) => { event.stopPropagation(); onIndex(index + 1) }}
                aria-label="Imagen siguiente"
              >
                <ArrowRight size={18} />
              </button>
            </>
          )}
          <motion.div
            ref={stage}
            className="project-lightbox-stage"
            initial={reduced ? false : { opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onDoubleClick={() => changeZoom(zoom === 1 ? 2 : 1)}
            style={{ cursor: zoom > 1 ? 'grab' : 'zoom-in' }}
          >
            <motion.div
              key={src}
              initial={reduced ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: zoom, x: pan.x, y: pan.y }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            >
              <SafeImage src={resolveMediaUrl(src)} alt="" />
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
