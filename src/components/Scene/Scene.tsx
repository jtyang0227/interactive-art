import type { MutableRefObject } from 'react'
import InteractiveObject from '../InteractiveObject/InteractiveObject'
import AtmosphereField from '../ParticleSystem/AtmosphereField'
import type { MouseState } from '../../hooks/useMouseInteraction'

interface SceneProps {
  mouse: MutableRefObject<MouseState>
}

export default function Scene({ mouse }: SceneProps) {
  return (
    <>
      <color attach="background" args={['#020203']} />
      <fog attach="fog" args={['#020203', 5, 15]} />

      <AtmosphereField />
      <InteractiveObject mouse={mouse} />
    </>
  )
}
