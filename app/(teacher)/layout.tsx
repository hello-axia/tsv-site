import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TeacherNav from './nav'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg2)', fontFamily: 'var(--font-body)' }}>
      <TeacherNav />
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  )
}