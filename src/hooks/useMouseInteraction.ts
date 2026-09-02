import { useEffect, useRef } from 'react'

export interface MouseState {
  x: number
  y: number
}

/**
 * Ref-based normalized pointer position (-1..1). Deliberately avoids React
 * state — this is read every frame inside useFrame, and state updates at
 * 60fps would defeat the point.
 */
export function useMouseInteraction() {
  const mouse = useRef<MouseState>({ x: 0, y: 0 })

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }
    window.addEventListener('pointermove', handleMove)
    return () => window.removeEventListener('pointermove', handleMove)
  }, [])

  return mouse
}
