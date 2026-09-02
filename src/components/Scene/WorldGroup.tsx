import { useMemo, useRef } from 'react'
import type { MutableRefObject, ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, Plane, Raycaster, Vector2, Vector3 } from 'three'
import type { DragRotationState } from '../../hooks/useDragRotation'
import type { MouseState } from '../../hooks/useMouseInteraction'
import { WorldPointerContext } from './WorldPointerContext'

interface WorldGroupProps {
  drag: MutableRefObject<DragRotationState>
  mouse: MutableRefObject<MouseState>
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
 * raycasts the pointer against its own local z=0 plane (so the hit point
 * stays correct as the group spins) and tracks how fast it's currently
 * rotating, publishing both through context for the particle field to
 * react to.
 */
export default function WorldGroup({ drag, mouse, children }: WorldGroupProps) {
  const groupRef = useRef<Group>(null)

  const raycaster = useMemo(() => new Raycaster(), [])
  const ndc = useMemo(() => new Vector2(), [])
  const localPlane = useMemo(() => new Plane(new Vector3(0, 0, 1), 0), [])
  const worldPlane = useMemo(() => new Plane(), [])

  const pointerPoint = useRef(FAR_SENTINEL.clone())
  const pointerActive = useRef(false)
  const dragEnergy = useRef(0)
  const prevRotation = useRef({ x: 0, y: 0 })

  const contextValue = useMemo(
    () => ({ point: pointerPoint, active: pointerActive, dragEnergy }),
    [],
  )

  useFrame(({ camera }, delta) => {
    const group = groupRef.current
    if (!group || delta <= 0) return

    const lerpFactor = 1 - Math.pow(0.02, delta)
    group.rotation.x += (drag.current.x - group.rotation.x) * lerpFactor
    group.rotation.y += (drag.current.y - group.rotation.y) * lerpFactor
    // R3F recomputes matrixWorld during the render traversal, which runs
    // after every useFrame callback — force it now so the raycast below
    // uses this frame's rotation instead of last frame's.
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

    ndc.set(mouse.current.x, mouse.current.y)
    raycaster.setFromCamera(ndc, camera)
    worldPlane.copy(localPlane).applyMatrix4(group.matrixWorld)
    const hit = raycaster.ray.intersectPlane(worldPlane, pointerPoint.current)
    if (hit) {
      group.worldToLocal(pointerPoint.current)
      pointerActive.current = true
    } else {
      pointerActive.current = false
    }
  })

  return (
    <WorldPointerContext.Provider value={contextValue}>
      <group ref={groupRef}>{children}</group>
    </WorldPointerContext.Provider>
  )
}
