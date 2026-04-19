import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import StudentNav from './nav'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // Get profile id first
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  // Get class name via enrollment
  let className = 'AP Gov'
  if (profile) {
    const { data: enrollment } = await supabase
      .from('class_enrollments')
      .select('classes(name)')
      .eq('student_id', profile.id)
      .single()
    className = (enrollment?.classes as any)?.name ?? 'AP Gov'
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg2)', fontFamily: 'var(--font-body)' }}>
      <StudentNav className={className} />
      <div style={{ flex: 1 }}>
        {children}
      </div>
    </div>
  )
}