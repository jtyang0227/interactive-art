export type PerformanceTier = 'high' | 'medium' | 'low'

/**
 * Coarse one-shot device tier used to size particle counts. Cheap and
 * synchronous by design — this is read once at mount, not polled.
 */
export function getPerformanceTier(): PerformanceTier {
  if (typeof navigator === 'undefined') return 'medium'

  const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  const cores = navigator.hardwareConcurrency ?? 4

  if (isMobile) return cores >= 6 ? 'medium' : 'low'
  return cores >= 8 ? 'high' : 'medium'
}
