import { useMemo, useRef } from 'react'
import type { MutableRefObject, ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Camera } from 'three'
import { Group, Plane, Raycaster, Vector2, Vector3 } from 'three'
import type { DragRotationState } from '../../hooks/useDragRotation'
import type { MouseState } from '../../hooks/useMouseInteraction'
import type { TapEvent } from '../../hooks/useTapTrigger'
import { TRAIL_COUNT, WorldPointerContext } from './WorldPointerContext'

interface WorldGroupProps {
  drag: MutableRefObject<DragRotationState>
  mouse: MutableRefObject<MouseState>
  tap: MutableRefObject<TapEvent>
  children: ReactNode
}

const FAR_SENTINEL = new Vector3(9999, 9999, 9999)

// How often a new trail sample is recorded while the pointer is active.
const TRAIL_SAMPLE_INTERVAL = 0.05
// Sentinel age for a slot that's never been sampled — large enough that
// the shader's own (much shorter) fade window always treats it as fully
// expired, regardless of what that fade duration is tuned to.
const TRAIL_MAX_AGE = 999

const ROTATION_LERP_RATE = 0.02 // lower = drag-rotation smoothing settles more slowly
const DRAG_ENERGY_EASE_RATE = 4 // how fast dragEnergy chases its target, per second

export default function WorldGroup({ drag, mouse, tap, children }: WorldGroupProps) {
  const groupRef = useRef<Group>(null)

  const raycaster = useMemo(() => new Raycaster(), [])
  const ndc = useMemo(() => new Vector2(), [])
  const localPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])
  const worldPlane = useMemo(() => new Plane(), [])

  const pointerPoint = useRef(FAR_SENTINEL.clone())
  const pointerActive = useRef(false)
  const dragEnergy = useRef(0)
  const prevRotation = useRef({ x: 0, y: 0 })
  const clickPoint = useRef(FAR_SENTINEL.clone())
  const clickTime = useRef(-1000)
  const lastTapId = useRef(0)

  // Ring buffer of recent pointer positions — a short wake trailing the
  // cursor. Ages start at TRAIL_MAX_AGE (effectively "never sampled") so
  // unfilled slots have no effect on the shader's fade math.
  const trailPoints = useRef(new Float32Array(TRAIL_COUNT * 3))
  const trailAges = useRef(new Float32Array(TRAIL_COUNT).fill(TRAIL_MAX_AGE))
  const trailWriteIndex = useRef(0)
  const trailSampleTimer = useRef(0)

  const contextValue = useMemo(
    () => ({
      point: pointerPoint,
      active: pointerActive,
      dragEnergy,
      clickPoint,
      clickTime,
      trailPoints,
      trailAges,
    }),
    [],
  )

  // Raycasts a normalized (-1..1) screen point against the group's own
  // local z=0 plane, returning the hit already converted into the group's
  // local space (so it tracks correctly while the group spins). Shared by
  // the continuous pointer and one-shot tap handling below.
  const raycastLocal = (x: number, y: number, camera: Camera, target: Vector3): boolean => {
    const group = groupRef.current
    if (!group) return false
    ndc.set(x, y)
    raycaster.setFromCamera(ndc, camera)
    worldPlane.copy(localPlane).applyMatrix4(group.matrixWorld)
    const hit = raycaster.ray.intersectPlane(worldPlane, target)
    if (!hit) return false
    group.worldToLocal(target)
    return true
  }

  useFrame(({ camera, clock }, delta) => {
    const group = groupRef.current
    if (!group || delta <= 0) return

    const lerpFactor = 1 - Math.pow(ROTATION_LERP_RATE, delta)
    group.rotation.x += (drag.current.x - group.rotation.x) * lerpFactor
    group.rotation.y += (drag.current.y - group.rotation.y) * lerpFactor
    // R3F recomputes matrixWorld during the render traversal, which runs
    // after every useFrame callback — force it now so the raycasts below
    // use this frame's rotation instead of last frame's.
    group.updateMatrixWorld()

    const angularSpeed =
      (Math.abs(group.rotation.x - prevRotation.current.x) +
        Math.abs(group.rotation.y - prevRotation.current.y)) /
      delta
    prevRotation.current.x = group.rotation.x
    prevRotation.current.y = group.rotation.y

    // Fast drags spike this; it eases back down once the rotation settles,
    // reading as "particles fling outward, then slowly return to orbit".
    const energyTarget = Math.min(angularSpeed * 0.35, 1.4)
    dragEnergy.current += (energyTarget - dragEnergy.current) * Math.min(delta * DRAG_ENERGY_EASE_RATE, 1)

    pointerActive.current =
      mouse.current.active && raycastLocal(mouse.current.x, mouse.current.y, camera, pointerPoint.current)

    if (tap.current.id !== lastTapId.current) {
      lastTapId.current = tap.current.id
      if (raycastLocal(tap.current.x, tap.current.y, camera, clickPoint.current)) {
        clickTime.current = clock.elapsedTime
      }
    }

    for (let i = 0; i < TRAIL_COUNT; i++) {
      trailAges.current[i] += delta
    }
    trailSampleTimer.current += delta
    if (pointerActive.current && trailSampleTimer.current >= TRAIL_SAMPLE_INTERVAL) {
      trailSampleTimer.current = 0
      const idx = trailWriteIndex.current
      trailPoints.current[idx * 3] = pointerPoint.current.x
      trailPoints.current[idx * 3 + 1] = pointerPoint.current.y
      trailPoints.current[idx * 3 + 2] = pointerPoint.current.z
      trailAges.current[idx] = 0
      trailWriteIndex.current = (idx + 1) % TRAIL_COUNT
    }
  })

  return (
    <WorldPointerContext.Provider value={contextValue}>
      <group ref={groupRef}>{children}</group>
    </WorldPointerContext.Provider>
  )
}
