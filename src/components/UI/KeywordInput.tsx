import { useState } from 'react'
import type { FormEvent } from 'react'

interface KeywordInputProps {
  onSubmit: (value: string) => void
}

const MAX_LENGTH = 6

/**
 * The one way to change what the particle field spells out. Isolated from
 * the scene's window-level pointer listeners (stopPropagation) so clicking
 * or typing here never also fires a world-rotate drag or a click ripple on
 * the canvas underneath.
 */
export default function KeywordInput({ onSubmit }: KeywordInputProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setValue('')
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onPointerDown={(event) => event.stopPropagation()}
      style={{ position: 'fixed', top: '6%', left: '50%', transform: 'translateX(-50%)' }}
    >
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="TYPE A WORD"
        maxLength={MAX_LENGTH}
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom: '1px solid rgba(238, 241, 248, 0.25)',
          color: 'rgba(238, 241, 248, 0.85)',
          fontSize: '0.7rem',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: '0.4em 0.2em',
          outline: 'none',
          width: '14rem',
          maxWidth: '60vw',
        }}
      />
    </form>
  )
}
