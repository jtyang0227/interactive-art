import { useEffect, useMemo } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import type { MouseState } from '../../hooks/useMouseInteraction'
import { sampleGlyphPoints } from '../../utils/textSampler'
import { getPerformanceTier, type PerformanceTier } from '../../hooks/useDevicePerformance'
import { useWorldPointer } from '../Scene/WorldPointerContext'
import particleVert from '../../shaders/particle/particle.vert.glsl?raw'
import particleFrag from '../../shaders/particle/particle.frag.glsl?raw'

const PARTICLE_COUNT: Record<PerformanceTier, number> = {
  high: 12000,
  medium: 7500,
  low: 3500,
}

// One full precise -> vibration -> deform -> flow -> dispersion -> chaos ->
// attraction -> reconstruction loop, in seconds.
const CYCLE_SECONDS = 22

interface HangulParticleFieldProps {
  char?: string
  mouse: MutableRefObject<MouseState>
  reducedMotion: boolean
}

export default function HangulParticleField({
  char = '혼',
  mouse,
  reducedMotion,
}: HangulParticleFieldProps) {
  const { gl } = useThree()
  const pointer = useWorldPointer()
  const count = useMemo(() => PARTICLE_COUNT[getPerformanceTier()], [])

  const geometry = useMemo(() => {
    const base = sampleGlyphPoints(char, { count })
    const seed = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      seed[i * 3] = Math.random()
      seed[i * 3 + 1] = Math.random()
      seed[i * 3 + 2] = Math.random()
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(base, 3))
    geo.setAttribute('aBase', new THREE.BufferAttribute(base, 3))
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 3))
    // The shader displaces well beyond the glyph's resting bounds during
    // dispersion, so pad the culling sphere rather than let it clip early.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 4.5)
    return geo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [char, count])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: particleVert,
        fragmentShader: particleFrag,
        uniforms: {
          uTime: { value: 0 },
          uProgress: { value: 0 },
          uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
          uBaseSize: { value: 32 },
          uMouse: { value: new THREE.Vector2(0, 0) },
          uPointer: { value: new THREE.Vector3(9999, 9999, 9999) },
          uPointerActive: { value: 0 },
          uDragEnergy: { value: 0 },
          uClickPoint: { value: new THREE.Vector3(9999, 9999, 9999) },
          uClickTime: { value: -1000 },
          uMotionScale: { value: 1 },
          uColor: { value: new THREE.Color('#eef1f8') },
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

  // The glyph is first sampled from whatever font is synchronously
  // available so there is no blank first frame. Once the requested webfont
  // actually finishes loading, re-sample and stream the refined positions
  // into the existing GPU buffers in place.
  useEffect(() => {
    let cancelled = false

    document.fonts
      .load(`900 100px 'Noto Sans KR'`)
      .then(() => document.fonts.ready)
      .then(() => {
        if (cancelled) return
        const refined = sampleGlyphPoints(char, { count })
        const baseAttr = geometry.getAttribute('aBase') as THREE.BufferAttribute
        const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
        ;(baseAttr.array as Float32Array).set(refined)
        ;(posAttr.array as Float32Array).set(refined)
        baseAttr.needsUpdate = true
        posAttr.needsUpdate = true
      })
      .catch(() => {
        // Webfont failed to load — the fallback-font sample already in the
        // buffers stays as the final shape.
      })

    return () => {
      cancelled = true
    }
  }, [geometry, char, count])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    // Reduced motion doesn't freeze the cycle (a fully static "art piece"
    // reads as broken), it just stretches and dampens it: the shape still
    // slowly breathes, but the per-particle jitter and swirl driving it
    // are cut way down by uMotionScale below.
    const cycleSeconds = reducedMotion ? CYCLE_SECONDS * 3 : CYCLE_SECONDS
    material.uniforms.uTime.value = t
    material.uniforms.uProgress.value = (t % cycleSeconds) / cycleSeconds
    material.uniforms.uMotionScale.value = reducedMotion ? 0.22 : 1

    const m = material.uniforms.uMouse.value as THREE.Vector2
    m.x += (mouse.current.x - m.x) * 0.05
    m.y += (mouse.current.y - m.y) * 0.05

    // Pointer position and drag energy both come from WorldGroup, already
    // resolved into this field's local space so repulsion tracks correctly
    // even while the whole scene is spinning.
    material.uniforms.uPointer.value.copy(pointer.point.current)
    material.uniforms.uPointerActive.value = pointer.active.current ? 1 : 0
    const energy = material.uniforms.uDragEnergy
    energy.value += (pointer.dragEnergy.current - energy.value) * 0.1

    material.uniforms.uClickPoint.value.copy(pointer.clickPoint.current)
    material.uniforms.uClickTime.value = pointer.clickTime.current
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
