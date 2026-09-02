import { createContext, useContext } from 'react'
import type { MutableRefObject } from 'react'
import { Vector3 } from 'three'

/** Must match TRAIL_COUNT declared in particle.vert.glsl. */
export const TRAIL_COUNT = 16

export interface WorldPointerValue {
  /** Mouse ray intersected with the world's local z=0 plane, already
   * transformed into WorldGroup's local space so it stays correct under
   * drag rotation. Sentinel-far when the ray doesn't hit (or on touch
   * devices with no hover). */
  point: MutableRefObject<Vector3>
  active: MutableRefObject<boolean>
  /** Smoothed magnitude of the world's current rotation velocity — spikes
   * on a fast drag, decays once it settles. */
  dragEnergy: MutableRefObject<number>
  /** Local-space position of the most recent tap/click, resolved the same
   * way as `point`. */
  clickPoint: MutableRefObject<Vector3>
  /** state.clock.elapsedTime at the moment of the most recent tap/click;
   * far in the past before the first one so envelope math naturally reads
   * as "no ripple yet". */
  clickTime: MutableRefObject<number>
  /** Ring buffer of the last TRAIL_COUNT pointer positions (xyz per
   * entry, flat), sampled at a fixed interval while the pointer is
   * active — a short wake trailing the cursor. */
  trailPoints: MutableRefObject<Float32Array>
  /** Seconds since each trailPoints entry was sampled, same indexing.
   * Starts far beyond the shader's fade window so an unsampled slot has
   * no effect. */
  trailAges: MutableRefObject<Float32Array>
}

export const WorldPointerContext = createContext<WorldPointerValue | null>(null)

export function useWorldPointer(): WorldPointerValue {
  const ctx = useContext(WorldPointerContext)
  if (!ctx) {
    throw new Error('useWorldPointer must be used within a WorldGroup')
  }
  return ctx
}
