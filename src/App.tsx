import Experience from './components/Experience/Experience'
import InteractionHint from './components/UI/InteractionHint'
import { useFirstInteraction } from './hooks/useFirstInteraction'

function App() {
  const hasInteracted = useFirstInteraction()

  return (
    <>
      <Experience />
      <InteractionHint visible={!hasInteracted} />
    </>
  )
}

export default App
