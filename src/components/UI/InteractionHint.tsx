interface InteractionHintProps {
  visible: boolean
}

/** The only UI in the whole experience: a quiet label that fades away the
 * moment the user actually touches the space, per the brief's "minimize
 * UI" direction. */
export default function InteractionHint({ visible }: InteractionHintProps) {
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 'max(11%, calc(env(safe-area-inset-bottom) + 16px))',
        transform: 'translateX(-50%)',
        color: 'rgba(238, 241, 248, 0.5)',
        fontSize: '0.7rem',
        // Scales down on narrow phones so the phrase stays on one line —
        // at a fixed 0.4em it's wide enough to wrap mid-phrase on an
        // iPhone SE-class screen, which reads as a layout bug in the one
        // other piece of UI this experience has.
        letterSpacing: 'clamp(0.12em, 2.2vw, 0.4em)',
        textTransform: 'uppercase',
        fontWeight: 300,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.2s ease',
        userSelect: 'none',
      }}
    >
      Drag to Explore
    </div>
  )
}
