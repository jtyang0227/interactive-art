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
  const [focused, setFocused] = useState(false)
  const [pulsing, setPulsing] = useState(false)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const trimmed = value.trim()
    if (!trimmed) return
    onSubmit(trimmed)
    setValue('')
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }
    // Blurring already drops the focus-brighten below a beat before the 3D
    // dissolve reads — this briefly re-brightens it as the one
    // acknowledgment on the 2D layer that the submission registered, then
    // releases back through the same transition so it settles like a fast
    // fade rather than an instant snap.
    setPulsing(true)
    window.setTimeout(() => setPulsing(false), 220)
  }

  return (
    <form
      onSubmit={handleSubmit}
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        position: 'fixed',
        top: 'max(6%, calc(env(safe-area-inset-top) + 12px))',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="TYPE A WORD"
        maxLength={MAX_LENGTH}
        style={{
          background: 'transparent',
          border: 'none',
          borderBottom:
            focused || pulsing
              ? '1px solid rgba(238, 241, 248, 0.7)'
              : '1px solid rgba(238, 241, 248, 0.25)',
          transition: 'border-color 160ms cubic-bezier(0.23, 1, 0.32, 1)',
          color: 'rgba(238, 241, 248, 0.85)',
          // 16px is the line iOS Safari uses to decide whether to zoom the
          // page in on focus — anything smaller and tapping this input
          // leaves the whole page zoomed into a cropped region afterward,
          // which reads as "the new glyph never showed up". This has to
          // stay an absolute px value, not something rem/vw-relative that
          // could still compute under 16px on some device.
          fontSize: '16px',
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          textAlign: 'center',
          padding: '0.5em 0.2em',
          outline: 'none',
          width: '14rem',
          maxWidth: '60vw',
        }}
      />
    </form>
  )
}
