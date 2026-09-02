import type { MutableRefObject } from 'react'
import HangulParticleField from '../ParticleSystem/HangulParticleField'
import type { MouseState } from '../../hooks/useMouseInteraction'

interface InteractiveObjectProps {
  mouse: MutableRefObject<MouseState>
  scroll: MutableRefObject<number>
  reducedMotion: boolean
}

export default function InteractiveObject({ mouse, scroll, reducedMotion }: InteractiveObjectProps) {
  return <HangulParticleField char="혼" mouse={mouse} scroll={scroll} reducedMotion={reducedMotion} />
}
