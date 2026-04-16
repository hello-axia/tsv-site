'use client'

import { useState, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

function OnboardingForm() {
  const searchParams = useSearchParams()
  const role = (searchParams.get('role') ?? 'student') as 'student' | 'teacher'

  const [step, setStep] = useState<'name' | 'code'>('name')
  const [displayName, setDisplayName] = useState('')
  const [classCode, setClassCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  async function handleNameSubmit() {
    if (!displayName.trim()) return
    if (role === 'teacher') {
      await finishOnboarding()
    } else {
      setStep('code')
    }
  }

  async function finishOnboarding() {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/'); return }

    if (role === 'student') {
      const { data: classData } = await supabase
        .from('classes')
        .select('id, school_id')
        .eq('class_code', classCode.toUpperCase().trim())
        .single()

      if (!classData) {
        setError('Class code not found. Check with your teacher.')
        setLoading(false)
        return
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ user_id: user.id, role: 'student', school_id: classData.school_id, display_name: displayName.trim() })

      if (profileError) { setError(profileError.message); setLoading(false); return }

      await supabase
        .from('class_enrollments')
        .insert({ class_id: classData.id, student_id: user.id })

      router.push('/lesson')
    } else {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ user_id: user.id, role: 'teacher', display_name: displayName.trim() })

      if (profileError) { setError(profileError.message); setLoading(false); return }
      router.push('/dashboard')
    }
  }

  const card = {
    background: '#fff', border: '1px solid #e8e2d9', borderRadius: '8px',
    padding: '2.5rem', width: '100%', maxWidth: '420px',
  }

  const inputStyle = {
    width: '100%', padding: '0.75rem', border: '1px solid #e8e2d9',
    borderRadius: '4px', fontSize: '0.925rem', outline: 'none',
    fontFamily: 'sans-serif', boxSizing: 'border-box' as const,
  }

  const btnPrimary = {
    width: '100%', padding: '0.875rem', background: '#c8a96e', color: '#1a1a14',
    border: 'none', borderRadius: '4px', fontSize: '0.825rem', fontWeight: 600,
    letterSpacing: '0.06em', textTransform: 'uppercase' as const, cursor: 'pointer',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9f7f4', fontFamily: 'sans-serif' }}>
      <div style={card}>
        <p style={{ fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#c8a96e', marginBottom: '0.5rem' }}>
          The Student&apos;s Verdict
        </p>

        {step === 'name' && (
          <>
            <h1 style={{ fontSize: '1.5rem', fontFamily: 'Georgia, serif', color: '#1a1a14', marginBottom: '0.25rem' }}>
              What&apos;s your name?
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#8a8a7a', marginBottom: '2rem' }}>
              This is how you&apos;ll appear to your {role === 'teacher' ? 'students' : 'teacher'}.
            </p>

            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#5a5a4a', display: 'block', marginBottom: '0.5rem' }}>
              Full name
            </label>
            <input
              type="text"
              placeholder="First Last"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNameSubmit()}
              style={{ ...inputStyle, marginBottom: '1.5rem' }}
              autoFocus
            />

            <button
              onClick={handleNameSubmit}
              disabled={!displayName.trim() || loading}
              style={{ ...btnPrimary, opacity: !displayName.trim() || loading ? 0.4 : 1 }}
            >
              {loading ? 'Setting up...' : 'Continue →'}
            </button>
          </>
        )}

        {step === 'code' && (
          <>
            <h1 style={{ fontSize: '1.5rem', fontFamily: 'Georgia, serif', color: '#1a1a14', marginBottom: '0.25rem' }}>
              Enter your class code.
            </h1>
            <p style={{ fontSize: '0.875rem', color: '#8a8a7a', marginBottom: '2rem' }}>
              Your teacher will give you a 6-character code.
            </p>

            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#5a5a4a', display: 'block', marginBottom: '0.5rem' }}>
              Class code
            </label>
            <input
              type="text"
              placeholder="AB12CD"
              value={classCode}
              onChange={e => setClassCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && finishOnboarding()}
              maxLength={6}
              style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '1.1rem', marginBottom: '1.5rem' }}
              autoFocus
            />

            {error && (
              <p style={{ fontSize: '0.8rem', color: '#c0392b', marginBottom: '1rem' }}>{error}</p>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
              <button
                onClick={() => { setStep('name'); setError('') }}
                style={{ padding: '0.875rem', border: '1px solid #e8e2d9', borderRadius: '4px', background: '#fff', color: '#5a5a4a', fontSize: '0.825rem', fontWeight: 600, cursor: 'pointer' }}
              >
                ← Back
              </button>
              <button
                onClick={finishOnboarding}
                disabled={classCode.length !== 6 || loading}
                style={{ ...btnPrimary, opacity: classCode.length !== 6 || loading ? 0.4 : 1 }}
              >
                {loading ? 'Joining...' : 'Join Class →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f9f7f4' }} />}>
      <OnboardingForm />
    </Suspense>
  )
}