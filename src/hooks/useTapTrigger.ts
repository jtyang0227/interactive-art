import { useEffect, useRef } from 'react'

export interface TapEvent {
  x: number
  y: number
  /** Increments on every real tap so consumers can detect a new one with a
   * simple !== check instead of diffing x/y (which could coincidentally
   * repeat). */
  id: number
}

const MOVE_THRESHOLD_PX = 10
const DURATION_THRESHOLD_MS = 300

/**
 * A "tap" is a pointerdown/pointerup pair that didn't turn into a drag —
 * small movement, short duration. Works for mouse clicks and touch taps
 * alike since it's built on Pointer Events.
 */
export function useTapTrigger() {
  const tap = useRef<TapEvent>({ x: 0, y: 0, id: 0 })
  const down = useRef<{ x: number; y: number; time: number } | null>(null)

  useEffect(() => {
    const handleDown = (event: PointerEvent) => {
      down.current = { x: event.clientX, y: event.clientY, time: performance.now() }
    }

    const handleUp = (event: PointerEvent) => {
      const start = down.current
      down.current = null
      if (!start) return

      const dist = Math.hypot(event.clientX - start.x, event.clientY - start.y)
      const duration = performance.now() - start.time
      if (dist > MOVE_THRESHOLD_PX || duration > DURATION_THRESHOLD_MS) return

      tap.current = {
        x: (event.clientX / window.innerWidth) * 2 - 1,
        y: -(event.clientY / window.innerHeight) * 2 + 1,
        id: tap.current.id + 1,
      }
    }

    window.addEventListener('pointerdown', handleDown)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [])

  return tap
}
