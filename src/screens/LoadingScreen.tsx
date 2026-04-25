const SPIN_KEYFRAMES = `@keyframes rp-spin { to { transform: rotate(360deg); } }`

const styles = {
  root: {
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a2e',
    gap: 24,
  },
  spinner: {
    width: 48,
    height: 48,
    border: '4px solid rgba(255,255,255,0.15)',
    borderTop: '4px solid #f4c542',
    borderRadius: '50%',
    animation: 'rp-spin 0.8s linear infinite',
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 16,
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: '0.04em',
  },
} satisfies Record<string, React.CSSProperties>

export function LoadingScreen() {
  return (
    <>
      <style>{SPIN_KEYFRAMES}</style>
      <div style={styles.root}>
        <div style={styles.spinner} />
        <span style={styles.label}>Cargando…</span>
      </div>
    </>
  )
}
