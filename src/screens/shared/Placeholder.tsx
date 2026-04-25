import type { ReactNode } from 'react'

type Action = {
  label: string
  onClick: () => void
}

type PlaceholderProps = {
  title: string
  subtitle?: string
  actions?: Action[]
  children?: ReactNode
}

const s = {
  root: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1a1a2e',
    color: '#fff',
    fontFamily: 'system-ui, sans-serif',
    padding: '24px',
    gap: 12,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: '#f4c542',
    textAlign: 'center',
  },
  subtitle: {
    margin: 0,
    fontSize: 15,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  btn: {
    marginTop: 8,
    padding: '10px 24px',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(255,255,255,0.07)',
    color: '#fff',
    fontSize: 15,
    cursor: 'pointer',
  },
} satisfies Record<string, React.CSSProperties>

export function Placeholder({ title, subtitle, actions, children }: PlaceholderProps) {
  return (
    <div style={s.root}>
      <h1 style={s.title}>{title}</h1>
      {subtitle && <p style={s.subtitle}>{subtitle}</p>}
      {children}
      {actions?.map((a) => (
        <button key={a.label} style={s.btn} onClick={a.onClick}>
          {a.label}
        </button>
      ))}
    </div>
  )
}
