import { useMemo, useState } from 'react'
import Experience from './components/Experience/Experience'
import InteractionHint from './components/UI/InteractionHint'
import WebGLFallback from './components/UI/WebGLFallback'
import { useFirstInteraction } from './hooks/useFirstInteraction'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'
import { isWebGLAvailable } from './utils/webgl'

function App() {
  const hasInteracted = useFirstInteraction()
  const reducedMotion = usePrefersReducedMotion()
  const webglSupported = useMemo(isWebGLAvailable, [])
  const [ready, setReady] = useState(false)

  if (!webglSupported) {
    return <WebGLFallback />
  }

  return (
    <>
      <div style={{ opacity: ready ? 1 : 0, transition: 'opacity 1.1s ease' }}>
        <Experience reducedMotion={reducedMotion} onReady={() => setReady(true)} />
      </div>
      <InteractionHint visible={!hasInteracted} />
    </>
  )
}

export default App
