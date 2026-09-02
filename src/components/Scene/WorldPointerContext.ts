import { createContext, useContext } from 'react'
import type { MutableRefObject } from 'react'
import { Vector3 } from 'three'

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
}

export const WorldPointerContext = createContext<WorldPointerValue | null>(null)

export function useWorldPointer(): WorldPointerValue {
  const ctx = useContext(WorldPointerContext)
  if (!ctx) {
    throw new Error('useWorldPointer must be used within a WorldGroup')
  }
  return ctx
}
