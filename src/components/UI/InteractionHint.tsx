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
        bottom: '11%',
        transform: 'translateX(-50%)',
        color: 'rgba(238, 241, 248, 0.5)',
        fontSize: '0.7rem',
        letterSpacing: '0.4em',
        textTransform: 'uppercase',
        fontWeight: 300,
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
