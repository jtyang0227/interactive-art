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

// The camera's FOV is vertical, so a portrait viewport (phone, tablet held
// upright) gets a much narrower *horizontal* FOV at the same distance —
// the roughly-square glyph still fits, but leaves a large unused gap of
// empty space below it since vertical room went untouched. Pulling the
// camera in as aspect narrows past PORTRAIT_REFERENCE keeps the glyph
// reading at a consistent, well-framed size on any screen shape instead of
// shrinking into the top of a tall phone/tablet screen. Aspect ratios at
// or above the reference (landscape, desktop, iPad landscape) are
// untouched — this only kicks in for portrait.
const PORTRAIT_REFERENCE = 1
const PORTRAIT_ZOOM_FLOOR = 0.85 // clamp so very narrow phones don't pull the camera uncomfortably close

const CAMERA_SETTLE_RATE = 0.001 // lower = camera drifts to its target position more slowly

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
  const { camera, size } = useThree()

  useFrame((_, delta) => {
    const aspect = size.width / size.height
    const portraitZoom = Math.min(1, Math.max(PORTRAIT_ZOOM_FLOOR, aspect / PORTRAIT_REFERENCE))

    const settle = (drag.current.isDragging ? 0.3 : 1) * (reducedMotion ? 0.25 : 1)
    const targetX = mouse.current.x * 0.6 * settle
    const targetY = mouse.current.y * 0.35 * settle
    const targetZ = BASE_Z * portraitZoom + scroll.current * SCROLL_DOLLY
    const lerpFactor = 1 - Math.pow(CAMERA_SETTLE_RATE, delta)

    camera.position.x += (targetX - camera.position.x) * lerpFactor
    camera.position.y += (targetY - camera.position.y) * lerpFactor
    camera.position.z += (targetZ - camera.position.z) * lerpFactor
    camera.lookAt(0, 0, 0)
  })

  return null
}
