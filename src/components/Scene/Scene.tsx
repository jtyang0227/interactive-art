import type { MutableRefObject } from 'react'
import InteractiveObject from '../InteractiveObject/InteractiveObject'
import AtmosphereField from '../ParticleSystem/AtmosphereField'
import WorldGroup from './WorldGroup'
import type { MouseState } from '../../hooks/useMouseInteraction'
import type { DragRotationState } from '../../hooks/useDragRotation'
import type { TapEvent } from '../../hooks/useTapTrigger'
import type { MultiTouchState } from '../../hooks/useMultiTouch'

interface SceneProps {
  keyword: string
  mouse: MutableRefObject<MouseState>
  drag: MutableRefObject<DragRotationState>
  tap: MutableRefObject<TapEvent>
  scroll: MutableRefObject<number>
  multiTouch: MutableRefObject<MultiTouchState>
  reducedMotion: boolean
}

export default function Scene({
  keyword,
  mouse,
  drag,
  tap,
  scroll,
  multiTouch,
  reducedMotion,
}: SceneProps) {
  return (
    <>
      <color attach="background" args={['#020203']} />
      <fog attach="fog" args={['#020203', 5, 15]} />

      <WorldGroup drag={drag} mouse={mouse} tap={tap}>
        <AtmosphereField reducedMotion={reducedMotion} scroll={scroll} multiTouch={multiTouch} />
        <InteractiveObject
          keyword={keyword}
          mouse={mouse}
          reducedMotion={reducedMotion}
          scroll={scroll}
          multiTouch={multiTouch}
        />
      </WorldGroup>
    </>
  )
}
