import { useMemo, useState } from 'react'
import Experience from './components/Experience/Experience'
import { ErrorBoundary } from './components/ErrorBoundary'
import InteractionHint from './components/UI/InteractionHint'
import SceneFallback from './components/UI/SceneFallback'
import { useFirstInteraction } from './hooks/useFirstInteraction'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'
import { isWebGLAvailable } from './utils/webgl'

function App() {
  const hasInteracted = useFirstInteraction()
  const reducedMotion = usePrefersReducedMotion()
  const webglSupported = useMemo(isWebGLAvailable, [])
  const [ready, setReady] = useState(false)
  const [contextLost, setContextLost] = useState(false)

  if (!webglSupported) {
    return (
      <SceneFallback
        title="This experience needs WebGL, which this browser doesn't support."
        subtitle="최신 브라우저에서 다시 시도해주세요."
      />
    )
  }

  if (contextLost) {
    return (
      <SceneFallback
        title="The graphics connection was lost."
        subtitle="새로고침 후 다시 시도해주세요."
      />
    )
  }

  return (
    <>
      <div style={{ opacity: ready ? 1 : 0, transition: 'opacity 1.1s ease' }}>
        <ErrorBoundary>
          <Experience
            reducedMotion={reducedMotion}
            onReady={() => setReady(true)}
            onContextLost={() => setContextLost(true)}
          />
        </ErrorBoundary>
      </div>
      <InteractionHint visible={!hasInteracted} />
    </>
  )
}

export default App
