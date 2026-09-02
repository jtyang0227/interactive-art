import { Canvas } from '@react-three/fiber'
import Scene from '../Scene/Scene'
import CameraRig from '../Camera/CameraRig'
import ContextLossWatcher from './ContextLossWatcher'
import PostProcessing from '../Effects/PostProcessing'
import { useMouseInteraction } from '../../hooks/useMouseInteraction'
import { useDragRotation } from '../../hooks/useDragRotation'
import { useTapTrigger } from '../../hooks/useTapTrigger'
import { useScrollProgress } from '../../hooks/useScrollProgress'
import { useMultiTouch } from '../../hooks/useMultiTouch'

interface ExperienceProps {
  keyword: string
  reducedMotion: boolean
  onReady: () => void
  onContextLost: () => void
}

export default function Experience({ keyword, reducedMotion, onReady, onContextLost }: ExperienceProps) {
  const mouse = useMouseInteraction()
  const drag = useDragRotation()
  const tap = useTapTrigger()
  const scroll = useScrollProgress()
  const multiTouch = useMultiTouch()

  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, touchAction: 'none' }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [0, 0, 6] }}
      dpr={[1, 2]}
      gl={{ antialias: false }}
      onCreated={onReady}
    >
      <ContextLossWatcher onLost={onContextLost} />
      <CameraRig mouse={mouse} drag={drag} scroll={scroll} reducedMotion={reducedMotion} />
      <Scene
        keyword={keyword}
        mouse={mouse}
        drag={drag}
        tap={tap}
        scroll={scroll}
        multiTouch={multiTouch}
        reducedMotion={reducedMotion}
      />
      <PostProcessing />
    </Canvas>
  )
}
