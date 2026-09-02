import { useEffect, useState } from 'react'

/** True once the user has touched the space at all — used to fade the
 * "drag to explore" hint out after it's done its job. */
export function useFirstInteraction(): boolean {
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    if (hasInteracted) return
    const handle = () => setHasInteracted(true)
    // Capture phase, not bubble: KeywordInput deliberately stops
    // propagation on pointerdown so typing never also drags the world or
    // fires a click ripple on the canvas underneath it. A bubble-phase
    // listener here would never see that event, so tapping the input as
    // your very first touch would leave the hint stuck visible forever.
    // Capture runs before that stopPropagation ever gets a chance to.
    window.addEventListener('pointerdown', handle, { once: true, capture: true })
    return () => window.removeEventListener('pointerdown', handle, { capture: true })
  }, [hasInteracted])

  return hasInteracted
}
