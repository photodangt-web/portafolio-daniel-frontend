import { useCallback } from 'react'

/** Cursor-follow spotlight on a card (CSS vars --mx / --my). */
export function useSpotlight() {
  const onMove = useCallback((e) => {
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${e.clientX - rect.left}px`)
    el.style.setProperty('--my', `${e.clientY - rect.top}px`)
  }, [])

  return { onMouseMove: onMove }
}
