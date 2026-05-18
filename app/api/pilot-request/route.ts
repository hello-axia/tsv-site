import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const NOTIFY_TO = 'ello.axia@gmail.com'

export async function POST(request: Request) {
  let body: {
    district_name?: string
    contact_name?: string
    email?: string
    role?: string
    message?: string
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const districtName = (body.district_name ?? '').trim()
  const contactName = (body.contact_name ?? '').trim()
  const email = (body.email ?? '').trim()
  const role = (body.role ?? '').trim()
  const message = (body.message ?? '').trim()

  // Basic validation
  if (!districtName || !contactName || !email) {
    return NextResponse.json(
      { error: 'District, name, and email are required.' },
      { status: 400 }
    )
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Please enter a valid email.' }, { status: 400 })
  }

  // 1. Store in Supabase
  const supabase = await createClient()
  const { error: insertError } = await supabase.from('pilot_requests').insert({
    district_name: districtName,
    contact_name: contactName,
    email,
    role: role || null,
    message: message || null,
  })

  if (insertError) {
    return NextResponse.json({ error: 'Could not save your request.' }, { status: 500 })
  }

  // 2. Send notification email (failure here does NOT fail the request)
  try {
    await resend.emails.send({
      from: 'TSV Pilot Requests <onboarding@resend.dev>',
      to: NOTIFY_TO,
      subject: `New pilot request — ${districtName}`,
      text: [
        `New pilot request from the TSV homepage.`,
        ``,
        `District / School: ${districtName}`,
        `Contact name:      ${contactName}`,
        `Email:             ${email}`,
        `Role:              ${role || '(not given)'}`,
        ``,
        `Message:`,
        message || '(none)',
      ].join('\n'),
      replyTo: email,
    })
  } catch (emailError) {
    console.error('[pilot-request] email failed:', emailError)
    // Intentionally do not fail — the row is already saved.
  }

  return NextResponse.json({ ok: true })
}