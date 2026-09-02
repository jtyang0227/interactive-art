import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Mesh } from 'three'

export default function InteractiveObject() {
  const meshRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.rotation.x += delta * 0.15
    mesh.rotation.y += delta * 0.2
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.4, 1]} />
      <meshStandardMaterial
        color="#8a7cff"
        wireframe
        emissive="#3a2fbf"
        emissiveIntensity={0.4}
      />
    </mesh>
  )
}
