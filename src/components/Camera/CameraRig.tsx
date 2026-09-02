import { useFrame, useThree } from '@react-three/fiber'
import type { MutableRefObject } from 'react'
import type { MouseState } from '../../hooks/useMouseInteraction'
import type { DragRotationState } from '../../hooks/useDragRotation'

interface CameraRigProps {
  mouse: MutableRefObject<MouseState>
  drag: MutableRefObject<DragRotationState>
}

/**
 * Subtle off-axis parallax: the camera drifts a small amount toward the
 * pointer and always keeps the glyph centered. Eased back while the user
 * is actively dragging the world (WorldGroup) so the two motions don't
 * compete for the same read.
 */
export default function CameraRig({ mouse, drag }: CameraRigProps) {
  const { camera } = useThree()

  useFrame((_, delta) => {
    const settle = drag.current.isDragging ? 0.3 : 1
    const targetX = mouse.current.x * 0.6 * settle
    const targetY = mouse.current.y * 0.35 * settle
    const lerpFactor = 1 - Math.pow(0.001, delta)

    camera.position.x += (targetX - camera.position.x) * lerpFactor
    camera.position.y += (targetY - camera.position.y) * lerpFactor
    camera.lookAt(0, 0, 0)
  })

  return null
}
