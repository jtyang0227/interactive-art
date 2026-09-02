import { Canvas } from '@react-three/fiber'
import Scene from '../Scene/Scene'
import CameraRig from '../Camera/CameraRig'
import { useMouseInteraction } from '../../hooks/useMouseInteraction'

export default function Experience() {
  const mouse = useMouseInteraction()

  return (
    <Canvas
      style={{ position: 'fixed', inset: 0 }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [0, 0, 6] }}
      dpr={[1, 2]}
      gl={{ antialias: true }}
    >
      <CameraRig mouse={mouse} />
      <Scene mouse={mouse} />
    </Canvas>
  )
}
