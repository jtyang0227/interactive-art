import { useFrame, useThree } from '@react-three/fiber'
import type { MutableRefObject } from 'react'
import type { MouseState } from '../../hooks/useMouseInteraction'

interface CameraRigProps {
  mouse: MutableRefObject<MouseState>
}

/**
 * Subtle off-axis parallax: the camera drifts a small amount toward the
 * pointer and always keeps the glyph centered. Full drag-to-rotate world
 * control is a later phase — this is only the "space breathes with you"
 * read the brief asks for.
 */
export default function CameraRig({ mouse }: CameraRigProps) {
  const { camera } = useThree()

  useFrame((_, delta) => {
    const targetX = mouse.current.x * 0.6
    const targetY = mouse.current.y * 0.35
    const lerpFactor = 1 - Math.pow(0.001, delta)

    camera.position.x += (targetX - camera.position.x) * lerpFactor
    camera.position.y += (targetY - camera.position.y) * lerpFactor
    camera.lookAt(0, 0, 0)
  })

  return null
}
