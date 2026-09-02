import { useEffect, useRef } from 'react'

export interface DragRotationState {
  x: number
  y: number
  isDragging: boolean
}

const MAX_PITCH = 0.6 // radians (~34deg) — enough tilt to feel grabbed, never flips over
const VELOCITY_DECAY_PER_SECOND = 0.05 // fraction of velocity remaining after 1s of coasting
const MIN_COAST_SPEED = 0.00002 // rad/ms — below this the inertia loop just stops itself

function clampPitch(value: number) {
  return Math.max(-MAX_PITCH, Math.min(MAX_PITCH, value))
}

/**
 * Accumulates a target world rotation from pointer drag deltas. Horizontal
 * drag adds yaw (y), vertical drag adds pitch (x); faster drags cover more
 * pixels per event so they naturally spin the target faster. This only
 * tracks the target — the consumer lerps its own rotation toward it each
 * frame for the smoothing the brief asks for.
 *
 * Releasing mid-flick doesn't stop the target dead: the last couple of
 * drag events' velocity keeps carrying it, decaying on its own rAF loop,
 * which is what the brief calls out specifically for touch release.
 */
export function useDragRotation(sensitivity = 0.006) {
  const rotation = useRef<DragRotationState>({ x: 0, y: 0, isDragging: false })
  const last = useRef<{ x: number; y: number; time: number } | null>(null)
  const velocity = useRef({ x: 0, y: 0 }) // rad/ms, smoothed
  const inertiaFrame = useRef<number | null>(null)
  // The specific pointer this drag is tracking. A second finger touching
  // down mid-drag hands the gesture to useMultiTouch instead of letting
  // its events get mixed into this one's delta math (which otherwise reads
  // the *distance between the two fingers* as drag movement — wild,
  // incorrect spins).
  const activePointerId = useRef<number | null>(null)

  useEffect(() => {
    const stopInertia = () => {
      if (inertiaFrame.current !== null) {
        cancelAnimationFrame(inertiaFrame.current)
        inertiaFrame.current = null
      }
    }

    const runInertia = () => {
      let lastTime = performance.now()

      const step = () => {
        const now = performance.now()
        const dt = now - lastTime
        lastTime = now

        const damping = Math.pow(VELOCITY_DECAY_PER_SECOND, dt / 1000)
        velocity.current.x *= damping
        velocity.current.y *= damping

        rotation.current.y += velocity.current.y * dt
        rotation.current.x = clampPitch(rotation.current.x + velocity.current.x * dt)

        const speed = Math.abs(velocity.current.x) + Math.abs(velocity.current.y)
        if (speed > MIN_COAST_SPEED && !rotation.current.isDragging) {
          inertiaFrame.current = requestAnimationFrame(step)
        } else {
          inertiaFrame.current = null
        }
      }

      inertiaFrame.current = requestAnimationFrame(step)
    }

    const handleDown = (event: PointerEvent) => {
      if (activePointerId.current !== null && activePointerId.current !== event.pointerId) {
        // A second pointer joined — stop tracking rotation from either
        // until we're back down to zero active pointers.
        rotation.current.isDragging = false
        last.current = null
        activePointerId.current = null
        return
      }
      stopInertia()
      rotation.current.isDragging = true
      activePointerId.current = event.pointerId
      last.current = { x: event.clientX, y: event.clientY, time: performance.now() }
      velocity.current = { x: 0, y: 0 }
    }

    const handleMove = (event: PointerEvent) => {
      if (!rotation.current.isDragging || !last.current) return
      if (event.pointerId !== activePointerId.current) return
      const now = performance.now()
      const dt = Math.max(now - last.current.time, 1)
      const dx = event.clientX - last.current.x
      const dy = event.clientY - last.current.y
      last.current = { x: event.clientX, y: event.clientY, time: now }

      const instantVelX = (dy * sensitivity) / dt
      const instantVelY = (dx * sensitivity) / dt
      velocity.current.x += (instantVelX - velocity.current.x) * 0.5
      velocity.current.y += (instantVelY - velocity.current.y) * 0.5

      rotation.current.y += dx * sensitivity
      rotation.current.x = clampPitch(rotation.current.x + dy * sensitivity)
    }

    const handleUp = (event: PointerEvent) => {
      if (event.pointerId !== activePointerId.current) return
      if (!rotation.current.isDragging) return
      rotation.current.isDragging = false
      activePointerId.current = null
      last.current = null
      runInertia()
    }

    window.addEventListener('pointerdown', handleDown)
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    window.addEventListener('pointerleave', handleUp)

    return () => {
      stopInertia()
      window.removeEventListener('pointerdown', handleDown)
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
      window.removeEventListener('pointerleave', handleUp)
    }
  }, [sensitivity])

  return rotation
}
