import { useEffect, useRef } from 'react'

export interface MultiTouchState {
  /** Signed instantaneous twist rate from the last two-finger move event —
   * positive/negative for the two rotation directions. Zero the instant
   * fewer than two touches are down. */
  vortexVelocity: number
  /** Accumulated pinch scale, clamped to a sane range. Resets to 1 the
   * instant fewer than two touches are down, so the consumer's own
   * smoothing (easing the uniform toward this target) is what makes the
   * field spring back to its normal scale rather than staying stretched. */
  pinchScale: number
  isPinching: boolean
}

const MIN_PINCH_SCALE = 0.55
const MAX_PINCH_SCALE = 1.7

/**
 * Two-finger twist and pinch, built on Pointer Events (each active touch
 * gets its own pointerId, so "exactly two touch-type pointers down" is a
 * two-finger gesture without needing the separate Touch API). Deliberately
 * independent of useDragRotation — a single-finger drag already rotates
 * the world, so this only ever engages once a second finger joins.
 */
export function useMultiTouch() {
  const state = useRef<MultiTouchState>({ vortexVelocity: 0, pinchScale: 1, isPinching: false })
  const touches = useRef(new Map<number, { x: number; y: number }>())
  const prevAngle = useRef<number | null>(null)
  const prevDist = useRef<number | null>(null)

  useEffect(() => {
    const reset = () => {
      prevAngle.current = null
      prevDist.current = null
      state.current.isPinching = false
      state.current.vortexVelocity = 0
      state.current.pinchScale = 1
    }

    const handleDown = (event: PointerEvent) => {
      if (event.pointerType !== 'touch') return
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (touches.current.size !== 2) {
        prevAngle.current = null
        prevDist.current = null
      }
    }

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== 'touch' || !touches.current.has(event.pointerId)) return
      touches.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
      if (touches.current.size !== 2) return

      const [a, b] = Array.from(touches.current.values())
      const dx = b.x - a.x
      const dy = b.y - a.y
      const angle = Math.atan2(dy, dx)
      const dist = Math.hypot(dx, dy)
      state.current.isPinching = true

      if (prevAngle.current !== null) {
        let deltaAngle = angle - prevAngle.current
        if (deltaAngle > Math.PI) deltaAngle -= Math.PI * 2
        if (deltaAngle < -Math.PI) deltaAngle += Math.PI * 2
        state.current.vortexVelocity = deltaAngle * 30
      }
      if (prevDist.current !== null && prevDist.current > 1) {
        const scaleDelta = dist / prevDist.current
        state.current.pinchScale = Math.min(
          MAX_PINCH_SCALE,
          Math.max(MIN_PINCH_SCALE, state.current.pinchScale * scaleDelta),
        )
      }
      prevAngle.current = angle
      prevDist.current = dist
    }

    const handleUp = (event: PointerEvent) => {
      touches.current.delete(event.pointerId)
      if (touches.current.size < 2) reset()
    }

    window.addEventListener('pointerdown', handleDown)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointercancel', handleUp)
    return () => {
      window.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointercancel', handleUp)
    }
  }, [])

  return state
}
