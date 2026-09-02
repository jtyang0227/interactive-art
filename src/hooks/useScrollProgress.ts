import { useEffect, useRef } from 'react'

/**
 * Normalized (0..1) scroll progress through the page's scrollable range,
 * as a ref — read every frame inside useFrame, so this deliberately never
 * touches React state. The scroll listener itself only writes a float.
 */
export function useScrollProgress() {
  const progress = useRef(0)

  useEffect(() => {
    let lastWidth = window.innerWidth

    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      progress.current = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0
    }

    // A mobile on-screen keyboard opening/closing fires plain resize
    // events that shrink and restore window.innerHeight without the page
    // actually changing shape — recomputing progress off one of those
    // spikes uScrollExpand (the whole field expanding outward) right as a
    // keyword is submitted and the keyboard dismisses, which reads as the
    // new glyph never showing up. A genuine layout change (window resize,
    // device rotation) always changes the width too, so only that
    // recomputes; a height-only resize leaves progress as it was.
    const handleResize = () => {
      if (window.innerWidth === lastWidth) return
      lastWidth = window.innerWidth
      handleScroll()
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return progress
}
