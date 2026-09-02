import { useEffect, useRef } from 'react'

export interface MouseState {
  x: number
  y: number
  /** Whether this position should currently drive hover effects. A mouse
   * stays "active" once it has moved once — it always rests somewhere. A
   * touch has no resting position: it's only active while a finger is
   * actually down, so this goes false the instant one lifts. */
  active: boolean
}

/**
 * Ref-based normalized pointer position (-1..1). Deliberately avoids React
 * state — this is read every frame inside useFrame, and state updates at
 * 60fps would defeat the point.
 */
export function useMouseInteraction() {
  const mouse = useRef<MouseState>({ x: 0, y: 0, active: false })

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1
      mouse.current.active = true
    }
    // Without this, lifting a finger leaves the pointer-driven effects
    // (repulsion, lens, trail) permanently stuck at the last spot it
    // touched — there's no "mouse resting in place" to fall back to like
    // there is for a real mouse, so releasing has to explicitly clear it.
    const handleRelease = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') mouse.current.active = false
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleRelease)
    window.addEventListener('pointercancel', handleRelease)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleRelease)
      window.removeEventListener('pointercancel', handleRelease)
    }
  }, [])

  return mouse
}
