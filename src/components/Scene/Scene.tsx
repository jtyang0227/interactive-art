import type { MutableRefObject } from 'react'
import InteractiveObject from '../InteractiveObject/InteractiveObject'
import AtmosphereField from '../ParticleSystem/AtmosphereField'
import WorldGroup from './WorldGroup'
import type { MouseState } from '../../hooks/useMouseInteraction'
import type { DragRotationState } from '../../hooks/useDragRotation'
import type { TapEvent } from '../../hooks/useTapTrigger'

interface SceneProps {
  mouse: MutableRefObject<MouseState>
  drag: MutableRefObject<DragRotationState>
  tap: MutableRefObject<TapEvent>
  reducedMotion: boolean
}

export default function Scene({ mouse, drag, tap, reducedMotion }: SceneProps) {
  return (
    <>
      <color attach="background" args={['#020203']} />
      <fog attach="fog" args={['#020203', 5, 15]} />

      <WorldGroup drag={drag} mouse={mouse} tap={tap}>
        <AtmosphereField reducedMotion={reducedMotion} />
        <InteractiveObject mouse={mouse} reducedMotion={reducedMotion} />
      </WorldGroup>
    </>
  )
}
