import { useFrame, useThree } from '@react-three/fiber'
import type { MutableRefObject } from 'react'
import type { MouseState } from '../../hooks/useMouseInteraction'
import type { DragRotationState } from '../../hooks/useDragRotation'

interface CameraRigProps {
  mouse: MutableRefObject<MouseState>
  drag: MutableRefObject<DragRotationState>
  scroll: MutableRefObject<number>
  reducedMotion: boolean
}

const BASE_Z = 6
const SCROLL_DOLLY = 3.5 // how much further back the camera pulls by scroll 100%

/**
 * Subtle off-axis parallax: the camera drifts a small amount toward the
 * pointer and always keeps the glyph centered. Eased back while the user
 * is actively dragging the world (WorldGroup) so the two motions don't
 * compete for the same read, and eased back further under a reduced-motion
 * preference since this particular drift is ambient rather than direct
 * pointer feedback.
 *
 * Scroll dollies the camera straight back, independent of all of that —
 * it's the one motion here that's a deliberate response to a deliberate
 * action, so reduced-motion doesn't dampen it.
 */
export default function CameraRig({ mouse, drag, scroll, reducedMotion }: CameraRigProps) {
  const { camera } = useThree()

  useFrame((_, delta) => {
    const settle = (drag.current.isDragging ? 0.3 : 1) * (reducedMotion ? 0.25 : 1)
    const targetX = mouse.current.x * 0.6 * settle
    const targetY = mouse.current.y * 0.35 * settle
    const targetZ = BASE_Z + scroll.current * SCROLL_DOLLY
    const lerpFactor = 1 - Math.pow(0.001, delta)

    camera.position.x += (targetX - camera.position.x) * lerpFactor
    camera.position.y += (targetY - camera.position.y) * lerpFactor
    camera.position.z += (targetZ - camera.position.z) * lerpFactor
    camera.lookAt(0, 0, 0)
  })

  return null
}
