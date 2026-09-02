import type { MutableRefObject } from 'react'
import HangulParticleField from '../ParticleSystem/HangulParticleField'
import type { MouseState } from '../../hooks/useMouseInteraction'
import type { MultiTouchState } from '../../hooks/useMultiTouch'

interface InteractiveObjectProps {
  keyword: string
  mouse: MutableRefObject<MouseState>
  scroll: MutableRefObject<number>
  multiTouch: MutableRefObject<MultiTouchState>
  reducedMotion: boolean
}

export default function InteractiveObject({
  keyword,
  mouse,
  scroll,
  multiTouch,
  reducedMotion,
}: InteractiveObjectProps) {
  return (
    <HangulParticleField
      keyword={keyword}
      mouse={mouse}
      scroll={scroll}
      multiTouch={multiTouch}
      reducedMotion={reducedMotion}
    />
  )
}
