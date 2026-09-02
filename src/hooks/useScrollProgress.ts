import { useEffect, useRef } from 'react'

/**
 * Normalized (0..1) scroll progress through the page's scrollable range,
 * as a ref — read every frame inside useFrame, so this deliberately never
 * touches React state. The scroll listener itself only writes a float.
 */
export function useScrollProgress() {
  const progress = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      progress.current = maxScroll > 0 ? Math.min(Math.max(window.scrollY / maxScroll, 0), 1) : 0
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  return progress
}
