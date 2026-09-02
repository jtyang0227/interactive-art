import { useMemo } from 'react'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'
import { getPerformanceTier } from '../../hooks/useDevicePerformance'

/**
 * Bloom is doing a lot of the "delicate luminous particles" / "cinematic
 * depth" work the brief asks for — the additive-blended particle shader
 * already pushes some fragments past alpha 1 (the click-ripple flash
 * especially), which is exactly what a luminance-threshold bloom picks up
 * as a genuine light source rather than just brightening everything.
 *
 * Skipped entirely on the low device tier: this is the one part of the
 * pipeline that's expensive in a way particle count isn't (multiple
 * full-screen passes every frame), so it's the first thing to cut per the
 * brief's own "post-processing 단계적 적용" guidance.
 */
export default function PostProcessing() {
  const tier = useMemo(getPerformanceTier, [])
  if (tier === 'low') return null

  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={tier === 'high' ? 0.85 : 0.55}
        luminanceThreshold={0.18}
        luminanceSmoothing={0.4}
        mipmapBlur
        radius={0.6}
      />
      <Vignette eskil={false} offset={0.25} darkness={0.7} />
    </EffectComposer>
  )
}
