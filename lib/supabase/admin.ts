// lib/supabase/admin.ts
// Server-only Supabase client using the secret key.
// BYPASSES RLS — use ONLY in server components and API routes that have
// explicit safety checks on what data is being read/returned.
// NEVER import this from a client component.

import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY

  if (!url) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
  if (!secret) throw new Error('Missing SUPABASE_SECRET_KEY')

  return createClient(url, secret, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}