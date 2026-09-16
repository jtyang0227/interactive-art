import { useState } from 'react'

interface KeywordChipsProps {
  keyword: string
  onSubmit: (value: string) => void
}

// A curated set of short, evocative words that read cleanly as a single
// glyph and share the piece's tone — soul, light, dream, breath, star.
// This is a quick-start row, not a dictionary, so it stays short.
const SUGGESTIONS = ['혼', '빛', '꿈', '숨', '별']

/**
 * Apple-style tappable suggestion chips beneath KeywordInput — same
 * destination (onSubmit) as typing, just a zero-keystroke shortcut.
 * Isolated from the scene's window-level pointer listeners the same way
 * KeywordInput is (stopPropagation), for the same reason: tapping a chip
 * must never also drag the world or fire a click ripple on the canvas
 * underneath it.
 */
export default function KeywordChips({ keyword, onSubmit }: KeywordChipsProps) {
  // Which chip is currently pressed, for instant on-pointer-down feedback —
  // Apple's "respond the moment it's pressed, not on release" (see the
  // apple-design skill). The actual submit still commits on click (native
  // pointerup-in-bounds), which also gives cancel-by-dragging-away for free.
  const [pressed, setPressed] = useState<string | null>(null)

  return (
    <div
      role="group"
      aria-label="Suggested keywords"
      onPointerDown={(event) => event.stopPropagation()}
      style={{
        position: 'fixed',
        top: 'max(calc(6% + 54px), calc(env(safe-area-inset-top) + 66px))',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        gap: '0.5rem',
      }}
    >
      {SUGGESTIONS.map((word) => {
        const isSelected = word === keyword
        const isPressed = word === pressed
        return (
          <button
            key={word}
            type="button"
            aria-pressed={isSelected}
            onPointerDown={() => setPressed(word)}
            onPointerUp={() => setPressed(null)}
            onPointerLeave={() => setPressed(null)}
            onPointerCancel={() => setPressed(null)}
            onClick={() => onSubmit(word)}
            style={{
              appearance: 'none',
              cursor: 'pointer',
              background: isSelected ? 'rgba(238, 241, 248, 0.14)' : 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              // A thin brighter top edge than the rest of the border reads
              // as light catching the material's rim rather than a flat
              // outline — see the apple-design skill's materials section.
              borderTop: isSelected
                ? '1px solid rgba(238, 241, 248, 0.55)'
                : '1px solid rgba(238, 241, 248, 0.22)',
              borderRight: isSelected
                ? '1px solid rgba(238, 241, 248, 0.4)'
                : '1px solid rgba(238, 241, 248, 0.12)',
              borderBottom: isSelected
                ? '1px solid rgba(238, 241, 248, 0.4)'
                : '1px solid rgba(238, 241, 248, 0.12)',
              borderLeft: isSelected
                ? '1px solid rgba(238, 241, 248, 0.4)'
                : '1px solid rgba(238, 241, 248, 0.12)',
              borderRadius: '999px',
              color: isSelected ? 'rgba(238, 241, 248, 0.95)' : 'rgba(238, 241, 248, 0.6)',
              fontSize: '0.7rem',
              letterSpacing: '0.15em',
              padding: '0.5em 0.9em',
              // Critically damped, no overshoot — this is a discrete tap
              // commit, not a momentum gesture, so the apple-design skill's
              // guidance is: damping 1.0, no bounce. 100ms transform matches
              // its own tap-feedback example verbatim.
              transform: isPressed ? 'scale(0.93)' : 'scale(1)',
              transition:
                'transform 100ms ease-out, background-color 160ms cubic-bezier(0.23, 1, 0.32, 1), border-color 160ms cubic-bezier(0.23, 1, 0.32, 1), color 160ms cubic-bezier(0.23, 1, 0.32, 1)',
            }}
          >
            {word}
          </button>
        )
      })}
    </div>
  )
}
