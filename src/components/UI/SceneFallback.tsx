interface SceneFallbackProps {
  title: string
  subtitle?: string
}

/** Shown instead of the experience when it can't run at all — no WebGL, or
 * a runtime error inside the scene. Keeps the same dark, quiet visual
 * language rather than a raw error page or a blank screen. */
export default function SceneFallback({ title, subtitle }: SceneFallbackProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.75rem',
        background: '#020203',
        color: 'rgba(238, 241, 248, 0.75)',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ fontSize: '1rem', letterSpacing: '0.08em' }}>{title}</div>
      {subtitle && (
        <div style={{ fontSize: '0.85rem', letterSpacing: '0.04em', color: 'rgba(238, 241, 248, 0.45)' }}>
          {subtitle}
        </div>
      )}
    </div>
  )
}
