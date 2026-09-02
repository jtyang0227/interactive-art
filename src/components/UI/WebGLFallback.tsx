/** Shown instead of the experience when the browser has no WebGL. Keeps
 * the same dark, quiet visual language rather than a raw error page. */
export default function WebGLFallback() {
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
      <div style={{ fontSize: '1rem', letterSpacing: '0.08em' }}>
        This experience needs WebGL, which this browser doesn&apos;t support.
      </div>
      <div style={{ fontSize: '0.85rem', letterSpacing: '0.04em', color: 'rgba(238, 241, 248, 0.45)' }}>
        최신 브라우저에서 다시 시도해주세요.
      </div>
    </div>
  )
}
