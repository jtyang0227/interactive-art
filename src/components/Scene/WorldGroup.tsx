import { useRef } from 'react'
import type { MutableRefObject, ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { DragRotationState } from '../../hooks/useDragRotation'

interface WorldGroupProps {
  drag: MutableRefObject<DragRotationState>
  children: ReactNode
}

/**
 * Wraps the scene's content so a drag can rotate the whole space at once.
 * The group never snaps to the drag target directly — it eases toward it
 * every frame, which is what keeps the rotation feeling weighted rather
 * than glued to the pointer.
 */
export default function WorldGroup({ drag, children }: WorldGroupProps) {
  const groupRef = useRef<Group>(null)

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const lerpFactor = 1 - Math.pow(0.02, delta)
    group.rotation.x += (drag.current.x - group.rotation.x) * lerpFactor
    group.rotation.y += (drag.current.y - group.rotation.y) * lerpFactor
  })

  return <group ref={groupRef}>{children}</group>
}
