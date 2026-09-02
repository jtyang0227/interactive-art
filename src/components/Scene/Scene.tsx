import InteractiveObject from '../InteractiveObject/InteractiveObject'

export default function Scene() {
  return (
    <>
      <color attach="background" args={['#05050a']} />
      <fog attach="fog" args={['#05050a', 6, 16]} />

      <ambientLight intensity={0.4} />
      <directionalLight position={[3, 4, 5]} intensity={1.2} />
      <pointLight position={[-4, -2, -3]} intensity={0.5} color="#4060ff" />

      <InteractiveObject />
    </>
  )
}
