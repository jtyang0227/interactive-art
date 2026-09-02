import { useEffect, useRef } from 'react'

export interface DragRotationState {
  x: number
  y: number
  isDragging: boolean
}

const MAX_PITCH = 0.6 // radians (~34deg) — enough tilt to feel grabbed, never flips over

/**
 * Accumulates a target world rotation from pointer drag deltas. Horizontal
 * drag adds yaw (y), vertical drag adds pitch (x); faster drags cover more
 * pixels per event so they naturally spin the target faster. This only
 * tracks the target — the consumer lerps its own rotation toward it each
 * frame for the smoothing the brief asks for.
 */
export function useDragRotation(sensitivity = 0.006) {
  const rotation = useRef<DragRotationState>({ x: 0, y: 0, isDragging: false })
  const last = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const handleDown = (event: PointerEvent) => {
      rotation.current.isDragging = true
      last.current = { x: event.clientX, y: event.clientY }
    }

    const handleMove = (event: PointerEvent) => {
      if (!rotation.current.isDragging || !last.current) return
      const dx = event.clientX - last.current.x
      const dy = event.clientY - last.current.y
      last.current = { x: event.clientX, y: event.clientY }

      rotation.current.y += dx * sensitivity
      rotation.current.x = Math.max(
        -MAX_PITCH,
        Math.min(MAX_PITCH, rotation.current.x + dy * sensitivity),
      )
    }

    const handleUp = () => {
      rotation.current.isDragging = false
      last.current = null
    }

    window.addEventListener('pointerdown', handleDown)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointerleave', handleUp)

    return () => {
      window.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointerleave', handleUp)
    }
  }, [sensitivity])

  return rotation
}
