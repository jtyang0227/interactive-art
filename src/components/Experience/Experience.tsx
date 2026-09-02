import { Canvas } from '@react-three/fiber'
import Scene from '../Scene/Scene'

export default function Experience() {
  return (
    <Canvas
      style={{ position: 'fixed', inset: 0 }}
      camera={{ fov: 50, near: 0.1, far: 100, position: [0, 0, 6] }}
      dpr={[1, 2]}
    >
      <Scene />
    </Canvas>
  )
}
