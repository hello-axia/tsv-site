export default function BroadcastLayout({ children }: { children: React.ReactNode }) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'var(--bg2)',
        fontFamily: 'var(--font-body)',
        color: 'var(--text)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {children}
      </div>
    )
  }