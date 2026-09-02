import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

interface ContextLossWatcherProps {
  onLost: () => void
}

/**
 * A dropped GPU context (common on mobile under memory pressure) leaves
 * three.js in a state where custom shader materials aren't guaranteed to
 * re-upload correctly — rather than risk a silently broken-looking scene,
 * this treats context loss like a crash and hands off to the same fallback
 * the ErrorBoundary shows, asking for a refresh.
 */
export default function ContextLossWatcher({ onLost }: ContextLossWatcherProps) {
  const { gl } = useThree()

  useEffect(() => {
    const canvas = gl.domElement
    const handleLost = (event: Event) => {
      // Required so the browser considers restoration possible at all —
      // we're choosing not to attempt it, but omitting this can prevent
      // even a full page reload's fresh context from behaving normally.
      event.preventDefault()
      onLost()
    }
    canvas.addEventListener('webglcontextlost', handleLost)
    return () => canvas.removeEventListener('webglcontextlost', handleLost)
  }, [gl, onLost])

  return null
}
