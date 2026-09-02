import { useCallback, useEffect, useMemo, useRef } from 'react'
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
  keyword?: string
  mouse: MutableRefObject<MouseState>
  scroll: MutableRefObject<number>
  reducedMotion: boolean
}

export default function HangulParticleField({
  keyword = '혼',
  mouse,
  scroll,
  reducedMotion,
}: HangulParticleFieldProps) {
  const { gl } = useThree()
  const pointer = useWorldPointer()
  const count = useMemo(() => PARTICLE_COUNT[getPerformanceTier()], [])
  // Spikes on a keyword change or a fast drag alike; the vertex shader
  // folds it into the same chaos term the auto-cycle's dispersion phase
  // uses, so either one reads as "flung apart, then settles".
  const morphBurst = useRef(0)
  const keywordRef = useRef(keyword)
  const isFirstKeywordChange = useRef(true)

  const geometry = useMemo(() => {
    const base = sampleGlyphPoints(keyword, { count })
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
    // dispersion and scroll expansion, so pad the culling sphere rather
    // than let it clip early.
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 6)
    return geo
    // `keyword` is intentionally left out: this only needs the text at the
    // very first mount. Every later change (a typed keyword, or the
    // webfont finishing its load) updates these same buffers in place via
    // writeGlyph below instead of recreating the geometry — recreating it
    // here would also make the disposal effect below tear down the
    // still-in-use material, since its cleanup fires whenever `geometry`
    // itself changes identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count])

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
          uScrollExpand: { value: 0 },
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

  const writeGlyph = useCallback(
    (text: string) => {
      const sampled = sampleGlyphPoints(text, { count })
      const baseAttr = geometry.getAttribute('aBase') as THREE.BufferAttribute
      const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
      ;(baseAttr.array as Float32Array).set(sampled)
      ;(posAttr.array as Float32Array).set(sampled)
      baseAttr.needsUpdate = true
      posAttr.needsUpdate = true
    },
    [geometry, count],
  )

  useEffect(() => {
    keywordRef.current = keyword
  }, [keyword])

  // The glyph is first sampled from whatever font is synchronously
  // available so there is no blank first frame. Once the requested webfont
  // actually finishes loading, refine whatever text is showing *right
  // now* (via the ref, since a keyword change may have already happened
  // by the time this resolves) — silently, no burst, since this is a
  // quality upgrade rather than something the user asked for.
  useEffect(() => {
    let cancelled = false
    document.fonts
      .load(`900 100px 'Noto Sans KR'`)
      .then(() => document.fonts.ready)
      .then(() => {
        if (!cancelled) writeGlyph(keywordRef.current)
      })
      .catch(() => {
        // Webfont failed to load — the fallback-font sample already in the
        // buffers stays as the final shape.
      })
    return () => {
      cancelled = true
    }
  }, [writeGlyph])

  // A typed keyword replacing the current one: dissolve into it rather
  // than snapping, by writing the new base positions in at the same
  // moment a chaos burst peaks (see useFrame below) — the particles are
  // already flying apart from their old positions when the ones
  // underneath change, so the swap itself is never visible.
  useEffect(() => {
    if (isFirstKeywordChange.current) {
      isFirstKeywordChange.current = false
      return
    }
    writeGlyph(keyword)
    morphBurst.current = 1.4
  }, [keyword, writeGlyph])

  useFrame((state, delta) => {
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

    morphBurst.current *= Math.pow(0.01, delta)
    const energy = material.uniforms.uDragEnergy
    const energyTarget = Math.max(pointer.dragEnergy.current, morphBurst.current)
    energy.value += (energyTarget - energy.value) * 0.1

    material.uniforms.uClickPoint.value.copy(pointer.clickPoint.current)
    material.uniforms.uClickTime.value = pointer.clickTime.current

    material.uniforms.uScrollExpand.value = scroll.current
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
