import type { MutableRefObject } from 'react'
import InteractiveObject from '../InteractiveObject/InteractiveObject'
import AtmosphereField from '../ParticleSystem/AtmosphereField'
import WorldGroup from './WorldGroup'
import type { MouseState } from '../../hooks/useMouseInteraction'
import type { DragRotationState } from '../../hooks/useDragRotation'

interface SceneProps {
  mouse: MutableRefObject<MouseState>
  drag: MutableRefObject<DragRotationState>
}

export default function Scene({ mouse, drag }: SceneProps) {
  return (
    <>
      <color attach="background" args={['#020203']} />
      <fog attach="fog" args={['#020203', 5, 15]} />

      <WorldGroup drag={drag}>
        <AtmosphereField />
        <InteractiveObject mouse={mouse} />
      </WorldGroup>
    </>
  )
}
