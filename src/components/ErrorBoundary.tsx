import { Component } from 'react'
import type { ReactNode } from 'react'
import SceneFallback from './UI/SceneFallback'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

/** Catches a runtime crash inside the R3F tree (e.g. a lost/corrupted GPU
 * context that throws mid-render) so the visitor sees a quiet message
 * instead of a blank page. Has to be a class component — there is no hooks
 * equivalent for getDerivedStateFromError. */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error('Experience crashed:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <SceneFallback
          title="Something interrupted the space."
          subtitle="새로고침 후 다시 시도해주세요."
        />
      )
    }
    return this.props.children
  }
}
