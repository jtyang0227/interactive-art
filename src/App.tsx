import { useMemo, useState } from 'react'
import Experience from './components/Experience/Experience'
import { ErrorBoundary } from './components/ErrorBoundary'
import InteractionHint from './components/UI/InteractionHint'
import KeywordInput from './components/UI/KeywordInput'
import SceneFallback from './components/UI/SceneFallback'
import { useFirstInteraction } from './hooks/useFirstInteraction'
import { usePrefersReducedMotion } from './hooks/usePrefersReducedMotion'
import { isWebGLAvailable } from './utils/webgl'

const DEFAULT_KEYWORD = '혼'

function App() {
  const hasInteracted = useFirstInteraction()
  const reducedMotion = usePrefersReducedMotion()
  const webglSupported = useMemo(isWebGLAvailable, [])
  const [ready, setReady] = useState(false)
  const [contextLost, setContextLost] = useState(false)
  const [keyword, setKeyword] = useState(DEFAULT_KEYWORD)

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
            keyword={keyword}
            reducedMotion={reducedMotion}
            onReady={() => setReady(true)}
            onContextLost={() => setContextLost(true)}
          />
        </ErrorBoundary>
      </div>
      <KeywordInput onSubmit={setKeyword} />
      <InteractionHint visible={!hasInteracted} />
      {/* The scene itself is pinned full-viewport (position: fixed) and
          reacts to scroll purely as a read of window.scrollY — this
          spacer exists only to give the document somewhere to scroll to.
          There is no second section to scroll into yet; the effect settles
          once fully expanded near the bottom. */}
      <div aria-hidden style={{ height: '220vh' }} />
    </>
  )
}

export default App
