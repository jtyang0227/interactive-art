import { useEffect, useState } from 'react'

/** True once the user has touched the space at all — used to fade the
 * "drag to explore" hint out after it's done its job. */
export function useFirstInteraction(): boolean {
  const [hasInteracted, setHasInteracted] = useState(false)

  useEffect(() => {
    if (hasInteracted) return
    const handle = () => setHasInteracted(true)
    window.addEventListener('pointerdown', handle, { once: true })
    return () => window.removeEventListener('pointerdown', handle)
  }, [hasInteracted])

  return hasInteracted
}
