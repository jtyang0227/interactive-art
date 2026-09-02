import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

/** Tracks the OS-level reduced-motion preference, live. The auto-cycle and
 * ambient drift both read this to scale themselves way down — direct
 * feedback from an actual drag, tap, or hover stays at full strength,
 * since that's the interaction itself rather than incidental motion. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(QUERY).matches,
  )

  useEffect(() => {
    const mediaQuery = window.matchMedia(QUERY)
    const handleChange = (event: MediaQueryListEvent) => setReduced(event.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return reduced
}
