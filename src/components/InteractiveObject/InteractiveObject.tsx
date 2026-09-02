import type { MutableRefObject } from 'react'
import HangulParticleField from '../ParticleSystem/HangulParticleField'
import type { MouseState } from '../../hooks/useMouseInteraction'

interface InteractiveObjectProps {
  mouse: MutableRefObject<MouseState>
  reducedMotion: boolean
}

export default function InteractiveObject({ mouse, reducedMotion }: InteractiveObjectProps) {
  return <HangulParticleField char="혼" mouse={mouse} reducedMotion={reducedMotion} />
}
