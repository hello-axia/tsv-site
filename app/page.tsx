export default function Home() {
  return (
    <main style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '100vh', background: '#f9f7f4',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '0 2rem' }}>
        <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '0.75rem' }}>
          The Student's Verdict
        </p>
        <h1 style={{ fontSize: '2rem', fontFamily: 'Georgia, serif', color: '#1a1a14', marginBottom: '0.5rem' }}>
          Welcome.
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#8a8a7a', marginBottom: '3rem' }}>
          Sign in to continue.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <a href="/api/auth/login?role=teacher" style={{
            padding: '1rem', border: '1px solid #e8e2d9', borderRadius: '6px',
            background: '#fff', color: '#1a1a14', textDecoration: 'none',
            fontSize: '0.875rem', fontWeight: 500, textAlign: 'center' as const,
          }}>
            I'm a Teacher
          </a>
          <a href="/api/auth/login?role=student" style={{
            padding: '1rem', border: 'none', borderRadius: '6px',
            background: '#1a1a14', color: '#c8a96e', textDecoration: 'none',
            fontSize: '0.875rem', fontWeight: 500, textAlign: 'center' as const,
          }}>
            I'm a Student
          </a>
        </div>
      </div>
    </main>
  )
}