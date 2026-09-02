import { useMemo, useRef } from 'react'
import type { MutableRefObject, ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Camera } from 'three'
import { Group, Plane, Raycaster, Vector2, Vector3 } from 'three'
import type { DragRotationState } from '../../hooks/useDragRotation'
import type { MouseState } from '../../hooks/useMouseInteraction'
import type { TapEvent } from '../../hooks/useTapTrigger'
import { WorldPointerContext } from './WorldPointerContext'

interface WorldGroupProps {
  drag: MutableRefObject<DragRotationState>
  mouse: MutableRefObject<MouseState>
  tap: MutableRefObject<TapEvent>
  children: ReactNode
}

const FAR_SENTINEL = new Vector3(9999, 9999, 9999)

/**
 * Wraps the scene's content so a drag can rotate the whole space at once.
 * The group never snaps to the drag target directly — it eases toward it
 * every frame, which is what keeps the rotation feeling weighted rather
 * than glued to the pointer.
 *
 * It also does double duty as the interaction hub for its children: it
 * raycasts the pointer (and any new tap) against its own local z=0 plane
 * — so hit points stay correct as the group spins — and tracks how fast
 * it's currently rotating, publishing all of it through context.
 */
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

  const contextValue = useMemo(
    () => ({ point: pointerPoint, active: pointerActive, dragEnergy, clickPoint, clickTime }),
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

    const lerpFactor = 1 - Math.pow(0.02, delta)
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
    dragEnergy.current += (energyTarget - dragEnergy.current) * Math.min(delta * 4, 1)

    pointerActive.current = raycastLocal(mouse.current.x, mouse.current.y, camera, pointerPoint.current)

    if (tap.current.id !== lastTapId.current) {
      lastTapId.current = tap.current.id
      if (raycastLocal(tap.current.x, tap.current.y, camera, clickPoint.current)) {
        clickTime.current = clock.elapsedTime
      }
    }
  })

  return (
    <WorldPointerContext.Provider value={contextValue}>
      <group ref={groupRef}>{children}</group>
    </WorldPointerContext.Provider>
  )
}
