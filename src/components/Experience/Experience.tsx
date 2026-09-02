import { Canvas } from '@react-three/fiber'
import Scene from '../Scene/Scene'
import CameraRig from '../Camera/CameraRig'
import { useMouseInteraction } from '../../hooks/useMouseInteraction'
import { useDragRotation } from '../../hooks/useDragRotation'
import { useTapTrigger } from '../../hooks/useTapTrigger'

export default function Experience() {
  const mouse = useMouseInteraction()
  const drag = useDragRotation()
  const tap = useTapTrigger()

  return (
    <Canvas
      style={{ position: 'fixed', inset: 0, touchAction: 'none' }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [0, 0, 6] }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <CameraRig mouse={mouse} drag={drag} />
      <Scene mouse={mouse} drag={drag} tap={tap} />
    </Canvas>
  )
}
