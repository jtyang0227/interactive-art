import type { MutableRefObject } from 'react'
import HangulParticleField from '../ParticleSystem/HangulParticleField'
import type { MouseState } from '../../hooks/useMouseInteraction'

interface InteractiveObjectProps {
  keyword: string
  mouse: MutableRefObject<MouseState>
  scroll: MutableRefObject<number>
  reducedMotion: boolean
}

export default function InteractiveObject({
  keyword,
  mouse,
  scroll,
  reducedMotion,
}: InteractiveObjectProps) {
  return (
    <HangulParticleField keyword={keyword} mouse={mouse} scroll={scroll} reducedMotion={reducedMotion} />
  )
}
