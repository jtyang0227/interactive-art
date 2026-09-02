import { useEffect, useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { getPerformanceTier, type PerformanceTier } from '../../hooks/useDevicePerformance'
import type { MultiTouchState } from '../../hooks/useMultiTouch'
import atmosphereVert from '../../shaders/atmosphere/atmosphere.vert.glsl?raw'
import atmosphereFrag from '../../shaders/atmosphere/atmosphere.frag.glsl?raw'

const ATMOSPHERE_COUNT: Record<PerformanceTier, number> = {
  high: 1800,
  medium: 1100,
  low: 500,
}

/**
 * Sparse, dim background particles scattered through a large volume — some
 * nearer the camera than the glyph, most receding into the dark. Gives the
 * scene spatial depth without competing with the glyph for attention.
 */
interface AtmosphereFieldProps {
  reducedMotion: boolean
  scroll: MutableRefObject<number>
  multiTouch: MutableRefObject<MultiTouchState>
}

export default function AtmosphereField({ reducedMotion, scroll, multiTouch }: AtmosphereFieldProps) {
  const { gl } = useThree()
  const count = useMemo(() => ATMOSPHERE_COUNT[getPerformanceTier()], [])
  const pinchScale = useRef(1)

  const geometry = useMemo(() => {
    const position = new Float32Array(count * 3)
    const seed = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      position[i * 3] = (Math.random() - 0.5) * 13
      position[i * 3 + 1] = (Math.random() - 0.5) * 9
      position[i * 3 + 2] = Math.random() * -12 + 4.5

      seed[i * 3] = Math.random()
      seed[i * 3 + 1] = Math.random()
      seed[i * 3 + 2] = Math.random()
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(position, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3))
    return geo
  }, [count])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVert,
        fragmentShader: atmosphereFrag,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
          uBaseSize: { value: 14 },
          uMotionScale: { value: 1 },
          uScrollExpand: { value: 0 },
          uPinchScale: { value: 1 },
          uColor: { value: new THREE.Color('#aab0c4') },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [gl],
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useFrame((state, delta) => {
    material.uniforms.uTime.value = state.clock.elapsedTime
    material.uniforms.uMotionScale.value = reducedMotion ? 0.2 : 1
    material.uniforms.uScrollExpand.value = scroll.current

    pinchScale.current += (multiTouch.current.pinchScale - pinchScale.current) * Math.min(delta * 4, 1)
    material.uniforms.uPinchScale.value = pinchScale.current
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
